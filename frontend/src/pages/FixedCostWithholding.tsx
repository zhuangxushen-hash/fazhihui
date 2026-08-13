import { useState, useCallback, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Select,
  Input,
  Button,
  Space,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
} from 'antd'
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  FileTextOutlined,
  PlusOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'
import {
  getWithholdingRecords,
  getWithholdingStats,
  createWithholding,
  executeWithholding,
  cancelWithholding,
} from '../api/financial-accounting'

// 金额格式化
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 状态映射
const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待代扣', className: 'stitch-tag stitch-tag-warning' },
  processing: { label: '执行中', className: 'stitch-tag stitch-tag-info' },
  completed: { label: '已代扣', className: 'stitch-tag stitch-tag-success' },
  failed: { label: '失败', className: 'stitch-tag stitch-tag-error' },
  cancelled: { label: '已撤销', className: 'stitch-tag' },
  offset: { label: '已冲抵', className: 'stitch-tag stitch-tag-info' },
}

interface WithholdingRecord {
  id: string
  withholding_no: string
  batch_id?: string
  case_id?: string
  user_id?: string
  withholding_type: string
  amount: number
  status: string
  executed_at?: string
  fail_reason?: string
  created_at: string
}

export default function FixedCostWithholding() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<WithholdingRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState({ status: '' })
  const [stats, setStats] = useState({
    pending_count: 0,
    completed_count: 0,
    pending_amount: 0,
    completed_amount: 0,
    failed_count: 0,
    batch_count: 0,
  })

  // 批量选择
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRows, setSelectedRows] = useState<WithholdingRecord[]>([])

  // 新建代扣弹窗
  const [createVisible, setCreateVisible] = useState(false)
  const [createForm] = Form.useForm()

  // 批量执行弹窗
  const [batchVisible, setBatchVisible] = useState(false)
  const [batchExecuting, setBatchExecuting] = useState(false)

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [recordsRes, statsRes] = await Promise.all([
        getWithholdingRecords({
          withholding_type: 'fixed_cost',
          status: filters.status || undefined,
          page,
          page_size: pageSize,
        }),
        getWithholdingStats(),
      ])
      const records = recordsRes.data
      setDataSource(records)
      setTotal(recordsRes.total)
      setStats(statsRes || {})
    } catch (err) {
      message.error('加载代扣记录失败')
    } finally {
      setLoading(false)
    }
  }, [filters.status, page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 筛选数据变化时重置分页
  const handleFilterChange = (val: string) => {
    setFilters({ status: val })
    setPage(1)
  }

  // 重置筛选
  const handleReset = () => {
    setFilters({ status: '' })
    setPage(1)
    setSelectedRowKeys([])
    setSelectedRows([])
  }

  // 选择变更
  const handleRowSelectionChange = (keys: React.Key[], rows: WithholdingRecord[]) => {
    setSelectedRowKeys(keys)
    setSelectedRows(rows)
  }

  // 全选
  const handleSelectAll = () => {
    const pendings = dataSource.filter((r) => r.status === 'pending')
    if (selectedRowKeys.length === pendings.length) {
      setSelectedRowKeys([])
      setSelectedRows([])
    } else {
      setSelectedRowKeys(pendings.map((r) => r.id))
      setSelectedRows(pendings)
    }
  }

  // 打开新建弹窗
  const handleOpenCreate = () => {
    createForm.resetFields()
    setCreateVisible(true)
  }

  // 提交新建代扣
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      await createWithholding({
        case_id: values.case_id,
        amount: values.amount,
        remark: values.remark,
        withholding_type: 'fixed_cost',
      })
      message.success('代扣记录创建成功')
      setCreateVisible(false)
      loadData()
    } catch (err: unknown) {
      // 表单校验失败时不提示接口错误
      const e = err as { errorFields?: unknown }
      if (e?.errorFields) return
      message.error('创建代扣记录失败')
    }
  }

  // 执行单条代扣
  const handleExecute = async (id: string) => {
    try {
      await executeWithholding(id)
      message.success('代扣执行成功')
      loadData()
    } catch (err) {
      message.error('代扣执行失败')
    }
  }

  // 撤销单条代扣
  const handleCancel = async (id: string) => {
    try {
      await cancelWithholding(id, '手动撤销')
      message.success('代扣已撤销')
      loadData()
    } catch (err) {
      message.error('撤销失败')
    }
  }

  // 开始批量代扣
  const handleStartBatch = () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要代扣的记录')
      return
    }
    setBatchVisible(true)
  }

  // 执行批量代扣
  const handleExecuteBatch = async () => {
    setBatchExecuting(true)
    try {
      // 按记录逐个执行
      let success = 0
      let failed = 0
      for (const row of selectedRows) {
        try {
          await executeWithholding(row.id)
          success++
        } catch (err) {
          failed++
        }
      }
      message.success(`批量代扣完成：成功 ${success} 条，失败 ${failed} 条`)
      setBatchVisible(false)
      setSelectedRowKeys([])
      setSelectedRows([])
      loadData()
    } catch (err) {
      message.error('批量代扣执行失败')
    } finally {
      setBatchExecuting(false)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '代扣编号',
      dataIndex: 'withholding_no',
      key: 'withholding_no',
      width: 150,
      render: (v: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '案件ID',
      dataIndex: 'case_id',
      key: 'case_id',
      width: 200,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 600, color: theme.primaryDark }}>{fmtMoney(v)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = statusMap[v] || { label: v, className: 'stitch-tag' }
        return <span className={cfg.className}>{cfg.label}</span>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (v: string) => formatDate(v),
    },
    {
      title: '执行时间',
      dataIndex: 'executed_at',
      key: 'executed_at',
      width: 130,
      render: (v?: string) => (v ? formatDate(v) : '-'),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (v?: string) => v || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: WithholdingRecord) => (
        <Space size={4}>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleExecute(record.id)}
              >
                执行
              </Button>
              <Popconfirm
                title="确认撤销该代扣记录？"
                onConfirm={() => handleCancel(record.id)}
              >
                <Button type="link" size="small" icon={<UndoOutlined />} danger>
                  撤销
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'failed' && (
            <span style={{ color: theme.error, fontSize: 13 }}>{record.fail_reason || '执行失败'}</span>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>固定费用批量代扣</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          对案件固定费用进行批量代扣操作，支持单条执行与批量执行
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat1 }} styles={{ body: { padding: '20px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <FileTextOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>待代扣记录</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {stats.pending_count} 条
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat2 }} styles={{ body: { padding: '20px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <CheckCircleOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>已代扣</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {stats.completed_count} 条
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat3 }} styles={{ body: { padding: '20px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <ThunderboltOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>待代扣金额</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {fmtMoney(stats.pending_amount)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card className="stitch-filter-bar" style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Space wrap size={[12, 12]}>
          <Select
            placeholder="状态"
            style={{ width: 140 }}
            value={filters.status || undefined}
            onChange={(v) => handleFilterChange(v || '')}
            options={[
              { value: '', label: '全部状态' },
              { value: 'pending', label: '待代扣' },
              { value: 'completed', label: '已代扣' },
              { value: 'failed', label: '失败' },
              { value: 'cancelled', label: '已撤销' },
              { value: 'offset', label: '已冲抵' },
            ]}
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
          <div style={{ flex: 1 }} />
          <Button
            icon={selectedRowKeys.length === dataSource.filter((r) => r.status === 'pending').length ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
            onClick={handleSelectAll}
            disabled={dataSource.filter((r) => r.status === 'pending').length === 0}
          >
            {selectedRowKeys.length === dataSource.filter((r) => r.status === 'pending').length && selectedRowKeys.length > 0 ? '取消全选' : '全选'}
          </Button>
          <Button icon={<PlusOutlined />} onClick={handleOpenCreate}>
            新建代扣
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStartBatch}
            disabled={selectedRows.length === 0}
            style={{ background: theme.success }}
          >
            批量代扣 ({selectedRows.length})
          </Button>
        </Space>
      </Card>

      {/* 表格 */}
      <Card className="stitch-table" style={{ borderRadius: 16, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: handleRowSelectionChange,
            getCheckboxProps: (record) => ({
              disabled: record.status !== 'pending',
            }),
          }}
        />
      </Card>

      {/* 新建代扣弹窗 */}
      <Modal
        title="新建固定费用代扣"
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        onOk={handleCreate}
        width={480}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="case_id"
            label="关联案件ID"
            rules={[{ required: true, message: '请输入关联案件ID' }]}
          >
            <Input placeholder="请输入案件ID" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="代扣金额"
            rules={[{ required: true, message: '请输入代扣金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              precision={2}
              placeholder="请输入代扣金额"
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量执行弹窗 */}
      <Modal
        title="批量代扣确认"
        open={batchVisible}
        onCancel={() => setBatchVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setBatchVisible(false)} disabled={batchExecuting}>
            取消
          </Button>,
          <Button
            key="start"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleExecuteBatch}
            loading={batchExecuting}
          >
            确认执行 ({selectedRows.length} 条)
          </Button>,
        ]}
        width={560}
        destroyOnClose
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ fontSize: 15, marginBottom: 12 }}>
            即将执行 <strong style={{ color: theme.primary }}>{selectedRows.length}</strong> 条代扣记录
          </div>
          <div style={{ color: theme.textTertiary, marginBottom: 12 }}>
            选中金额：<span style={{ fontWeight: 600, color: theme.primaryDark }}>{fmtMoney(selectedRows.reduce((sum, r) => sum + Number(r.amount), 0))}</span>
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto', border: `1px solid ${theme.borderSecondary}`, borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: theme.bgSurfaceLow }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>代扣编号</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>金额</th>
                </tr>
              </thead>
              <tbody>
                {selectedRows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${theme.borderSecondary}` }}>
                    <td style={{ padding: '8px 12px', color: theme.primary }}>{r.withholding_no}</td>
                    <td style={{ padding: '8px 12px' }}>{fmtMoney(Number(r.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  )
}
