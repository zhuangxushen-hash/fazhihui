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
  Progress,
} from 'antd'
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  WalletOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'
import {
  getWithholdingRecords,
  getWithholdingStats,
  createWithholdingBatch,
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

export default function SalaryFeesWithholding() {
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

  // 批量执行弹窗
  const [batchVisible, setBatchVisible] = useState(false)
  const [batchExecuting, setBatchExecuting] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)

  // 新建批次弹窗
  const [createVisible, setCreateVisible] = useState(false)
  const [createForm] = Form.useForm()
  const [batchRows, setBatchRows] = useState<Array<{ key: number; user_id?: string; case_id?: string; amount?: number }>>([])

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [recordsRes, statsRes] = await Promise.all([
        getWithholdingRecords({
          withholding_type: 'salary',
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

  // 打开新建批次弹窗
  const handleOpenCreate = () => {
    createForm.resetFields()
    setBatchRows([{ key: Date.now() }])
    setCreateVisible(true)
  }

  // 添加工资代扣行
  const handleAddRow = () => {
    setBatchRows([...batchRows, { key: Date.now() }])
  }

  // 删除代扣行
  const handleRemoveRow = (key: number) => {
    setBatchRows(batchRows.filter((r) => r.key !== key))
  }

  // 更新代扣行
  const handleUpdateRow = (key: number, field: string, value: string | number | null | undefined) => {
    setBatchRows(batchRows.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
  }

  // 提交新建批次
  const handleCreateBatch = async () => {
    const validRows = batchRows.filter((r) => r.amount && Number(r.amount) > 0)
    if (validRows.length === 0) {
      message.warning('请至少填写一条有效的代扣记录')
      return
    }
    try {
      await createWithholdingBatch({
        withholding_type: 'salary',
        records: validRows.map((r) => ({
          case_id: r.case_id,
          user_id: r.user_id,
          amount: Number(r.amount),
        })),
      })
      message.success(`工资代扣批次创建成功，共 ${validRows.length} 条记录`)
      setCreateVisible(false)
      loadData()
    } catch (err) {
      message.error('创建代扣批次失败')
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
    setBatchProgress(0)
    setBatchVisible(true)
  }

  // 执行批量代扣
  const handleExecuteBatch = async () => {
    setBatchExecuting(true)
    try {
      let success = 0
      let failed = 0
      const totalCount = selectedRows.length
      for (let i = 0; i < selectedRows.length; i++) {
        const row = selectedRows[i]
        try {
          await executeWithholding(row.id)
          success++
        } catch (err) {
          failed++
        }
        setBatchProgress(Math.round(((i + 1) / totalCount) * 100))
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
      title: '员工ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 150,
      ellipsis: true,
      render: (v?: string) => v || '-',
    },
    {
      title: '案件ID',
      dataIndex: 'case_id',
      key: 'case_id',
      width: 200,
      ellipsis: true,
      render: (v?: string) => v || '-',
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
                <Button type="link" size="small" icon={<CloseCircleOutlined />} danger>
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
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>工资批量代扣</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          对员工工资进行批量代扣，支持批量创建、单条执行与批次执行
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat1 }} styles={{ body: { padding: '20px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <WalletOutlined />
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
            onChange={(v) => {
              setFilters({ status: v || '' })
              setPage(1)
            }}
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
          <Button
            onClick={() => {
              setFilters({ status: '' })
              setPage(1)
            }}
          >
            重置
          </Button>
          <div style={{ flex: 1 }} />
          <Button icon={<PlusOutlined />} onClick={handleOpenCreate}>
            批量创建
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
            onChange: (keys, rows) => {
              setSelectedRowKeys(keys)
              setSelectedRows(rows)
            },
            getCheckboxProps: (record) => ({
              disabled: record.status !== 'pending',
            }),
          }}
        />
      </Card>

      {/* 批量创建弹窗 */}
      <Modal
        title="批量创建工资代扣"
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        onOk={handleCreateBatch}
        width={680}
        destroyOnClose
      >
        <div style={{ marginBottom: 12, color: theme.textTertiary, fontSize: 13 }}>
          填写员工工资代扣明细，同一批次将一起执行
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: theme.bgSurfaceLow }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>员工ID</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>关联案件ID</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>代扣金额</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {batchRows.map((row) => (
              <tr key={row.key} style={{ borderBottom: `1px solid ${theme.borderSecondary}` }}>
                <td style={{ padding: '6px 12px' }}>
                  <Input
                    placeholder="员工ID"
                    value={row.user_id}
                    onChange={(e) => handleUpdateRow(row.key, 'user_id', e.target.value)}
                  />
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <Input
                    placeholder="案件ID（可空）"
                    value={row.case_id}
                    onChange={(e) => handleUpdateRow(row.key, 'case_id', e.target.value)}
                  />
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0.01}
                    precision={2}
                    placeholder="代扣金额"
                    value={row.amount}
                    onChange={(v) => handleUpdateRow(row.key, 'amount', v)}
                  />
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <Button type="link" size="small" danger onClick={() => handleRemoveRow(row.key)}>
                    删除
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button type="dashed" block style={{ marginTop: 12 }} icon={<PlusOutlined />} onClick={handleAddRow}>
          添加代扣记录
        </Button>
      </Modal>

      {/* 批量执行弹窗 */}
      <Modal
        title="批量代扣执行"
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
          {batchExecuting ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>代扣进度</span>
                <span style={{ color: theme.primary, fontWeight: 500 }}>{batchProgress}%</span>
              </div>
              <Progress percent={batchProgress} status="active" strokeColor={theme.primary} />
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 15, marginBottom: 12 }}>
                即将执行 <strong style={{ color: theme.primary }}>{selectedRows.length}</strong> 条代扣记录
              </div>
              <div style={{ color: theme.textTertiary }}>
                选中金额：<span style={{ fontWeight: 600, color: theme.primaryDark }}>{fmtMoney(selectedRows.reduce((sum, r) => sum + Number(r.amount), 0))}</span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
