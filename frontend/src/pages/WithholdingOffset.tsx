import { useState, useCallback, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Select,
  Button,
  Space,
  Modal,
  Input,
  message,
} from 'antd'
import {
  UndoOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'
import { getWithholdingRecords, cancelWithholding, offsetWithholding } from '../api/financial-accounting'

// 金额格式化
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 类型映射
const typeMap: Record<string, { label: string; className: string }> = {
  fixed_cost: { label: '固定费用', className: 'stitch-tag stitch-tag-info' },
  salary: { label: '工资', className: 'stitch-tag stitch-tag-warning' },
  income_tax: { label: '个税', className: 'stitch-tag stitch-tag-success' },
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
  cancel_reason?: string
  fail_reason?: string
  executed_at?: string
  created_at: string
}

export default function WithholdingOffset() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<WithholdingRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState({ withholding_type: '', status: '' })

  // 撤销/冲抵弹窗
  const [actionVisible, setActionVisible] = useState(false)
  const [actionType, setActionType] = useState<'cancel' | 'offset'>('cancel')
  const [currentRecord, setCurrentRecord] = useState<WithholdingRecord | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getWithholdingRecords({
        withholding_type: filters.withholding_type || undefined,
        status: filters.status || undefined,
        page,
        page_size: pageSize,
      })
      setDataSource(res.data || [])
      setTotal(res.total || 0)
    } catch (err) {
      message.error('加载代扣记录失败')
    } finally {
      setLoading(false)
    }
  }, [filters.withholding_type, filters.status, page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 打开撤销弹窗
  const handleOpenCancel = (record: WithholdingRecord) => {
    setActionType('cancel')
    setCurrentRecord(record)
    setReason('')
    setActionVisible(true)
  }

  // 打开冲抵弹窗
  const handleOpenOffset = (record: WithholdingRecord) => {
    setActionType('offset')
    setCurrentRecord(record)
    setReason('')
    setActionVisible(true)
  }

  // 提交操作
  const handleSubmit = async () => {
    if (!currentRecord) return
    setSubmitting(true)
    try {
      if (actionType === 'cancel') {
        await cancelWithholding(currentRecord.id, reason || '手动撤销')
        message.success(`代扣记录 ${currentRecord.withholding_no} 已撤销`)
      } else {
        await offsetWithholding(currentRecord.id, reason || '手动冲抵')
        message.success(`代扣记录 ${currentRecord.withholding_no} 已冲抵，金额已回款入账`)
      }
      setActionVisible(false)
      loadData()
    } catch (err) {
      message.error(actionType === 'cancel' ? '撤销失败' : '冲抵失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 筛选变更
  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value })
    setPage(1)
  }

  // 重置筛选
  const handleReset = () => {
    setFilters({ withholding_type: '', status: '' })
    setPage(1)
  }

  // 统计可操作数量
  const actionCounts = {
    cancellable: dataSource.filter((r) => r.status === 'pending').length,
    offsettable: dataSource.filter((r) => r.status === 'completed').length,
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
      title: '类型',
      dataIndex: 'withholding_type',
      key: 'withholding_type',
      width: 100,
      render: (v: string) => {
        const cfg = typeMap[v] || { label: v, className: 'stitch-tag' }
        return <span className={cfg.className}>{cfg.label}</span>
      },
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
      title: '原因',
      dataIndex: 'cancel_reason',
      key: 'cancel_reason',
      width: 150,
      ellipsis: true,
      render: (v?: string) => v || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (v: string) => formatDate(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: WithholdingRecord) => (
        <Space size={4}>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<UndoOutlined />}
              onClick={() => handleOpenCancel(record)}
            >
              撤销
            </Button>
          )}
          {record.status === 'completed' && (
            <Button
              type="link"
              size="small"
              icon={<SwapOutlined />}
              style={{ color: theme.success }}
              onClick={() => handleOpenOffset(record)}
            >
              冲抵
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>代扣撤销与冲抵</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          对待代扣记录执行撤销，对已代扣记录执行冲抵回款
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat1 }} styles={{ body: { padding: '20px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <UndoOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>可撤销（待代扣）</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {actionCounts.cancellable} 条
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat2 }} styles={{ body: { padding: '20px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <SwapOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>可冲抵（已代扣）</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {actionCounts.offsettable} 条
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat3 }} styles={{ body: { padding: '20px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <FileTextOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>本页记录</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {dataSource.length} 条
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
            placeholder="代扣类型"
            style={{ width: 140 }}
            value={filters.withholding_type || undefined}
            onChange={(v) => handleFilterChange('withholding_type', v || '')}
            options={[
              { value: '', label: '全部类型' },
              { value: 'fixed_cost', label: '固定费用' },
              { value: 'salary', label: '工资' },
              { value: 'income_tax', label: '个税' },
            ]}
          />
          <Select
            placeholder="状态"
            style={{ width: 140 }}
            value={filters.status || undefined}
            onChange={(v) => handleFilterChange('status', v || '')}
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
          <span style={{ color: theme.textTertiary, fontSize: 13 }}>
            <CheckCircleOutlined style={{ color: theme.success, marginRight: 4 }} />
            撤销：仅限待代扣记录
            <CloseCircleOutlined style={{ color: theme.error, margin: '0 4px 0 16px' }} />
            冲抵：仅限已代扣记录
          </span>
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
          scroll={{ x: 1000 }}
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
        />
      </Card>

      {/* 撤销/冲抵弹窗 */}
      <Modal
        title={actionType === 'cancel' ? '撤销代扣' : '冲抵代扣'}
        open={actionVisible}
        onCancel={() => setActionVisible(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={480}
        destroyOnClose
      >
        <div style={{ padding: '12px 0' }}>
          {currentRecord && (
            <>
              <div style={{ marginBottom: 12 }}>
                代扣编号：<strong style={{ color: theme.primary }}>{currentRecord.withholding_no}</strong>
                <span style={{ margin: '0 16px', color: theme.textTertiary }}>金额：{fmtMoney(Number(currentRecord.amount))}</span>
              </div>
              <div style={{ marginBottom: 8, color: theme.textSecondary }}>
                {actionType === 'cancel' ? '撤销后该代扣记录将标记为已撤销，不再执行。' : '冲抵后将金额回款入账，并生成收入型业务款记录。'}
              </div>
              <Input.TextArea
                rows={3}
                placeholder={actionType === 'cancel' ? '请输入撤销原因（可选）' : '请输入冲抵原因（可选）'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
