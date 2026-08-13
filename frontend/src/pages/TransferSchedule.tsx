import { useState, useEffect, useMemo } from 'react'
import { Table, Button, Modal, Input, Select, Space, message, Card, Row, Col } from 'antd'
import {
  EyeOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  DollarOutlined,
  SwapOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDateTime } from '../utils/format'

const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const tableCardStyle: React.CSSProperties = { borderRadius: 16, overflow: 'hidden' }
const kpiCardStyle: React.CSSProperties = { borderRadius: 12, overflow: 'hidden' }
const kpiBodyStyle: React.CSSProperties = { padding: '20px 24px' }

const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

type PillKind = 'neutral' | 'blue' | 'green' | 'red' | 'orange'
const pillClassMap: Record<PillKind, string> = {
  neutral: 'stitch-tag',
  blue: 'stitch-tag stitch-tag-info',
  green: 'stitch-tag stitch-tag-success',
  red: 'stitch-tag stitch-tag-error',
  orange: 'stitch-tag stitch-tag-warning',
}
const StatusPill = ({ text, kind }: { text: string; kind: PillKind }) => (
  <span className={pillClassMap[kind]}>{text}</span>
)

const transferStatusKindMap: Record<string, PillKind> = {
  pending: 'orange',
  confirmed: 'green',
  failed: 'red',
}
const transferStatusLabelMap: Record<string, string> = {
  pending: '待处理',
  confirmed: '已确认',
  failed: '转款失败',
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'confirmed', label: '已确认' },
  { value: 'failed', label: '转款失败' },
]

const mockTransfers: Record<string, unknown>[] = [
  { id: 'TR202601001', case_id: 'CASE2026001', case_name: '某科技公司合同纠纷案', amount: 30000.0, payee: '北京某科技有限公司', payee_account: '6222 **** **** 1234', created_at: '2026-01-18 10:00:00', status: 'pending', remark: '案件胜诉款项转付' },
  { id: 'TR202601002', case_id: 'CASE2026005', case_name: '某建筑公司工程款追讨案', amount: 85000.0, payee: '某建筑工程公司', payee_account: '6228 **** **** 5678', created_at: '2026-01-25 14:30:00', status: 'confirmed', remark: '执行款转付' },
  { id: 'TR202601003', case_id: 'CASE2026008', case_name: '个人劳动争议案', amount: 12000.0, payee: '张先生', payee_account: '6225 **** **** 9012', created_at: '2026-02-08 09:15:00', status: 'confirmed', remark: '劳动报酬转付' },
  { id: 'TR202601004', case_id: 'CASE2026012', case_name: '某银行金融借款合同案', amount: 250000.0, payee: '某商业银行', payee_account: '6221 **** **** 3456', created_at: '2026-02-20 16:00:00', status: 'pending', remark: '贷款清偿转付' },
  { id: 'TR202601005', case_id: 'CASE2026018', case_name: '离婚财产分割案', amount: 45000.0, payee: '王女士', payee_account: '6226 **** **** 7890', created_at: '2026-03-05 11:45:00', status: 'failed', remark: '账户异常转款失败' },
  { id: 'TR202601006', case_id: 'CASE2026025', case_name: '房地产开发项目', amount: 180000.0, payee: '某房地产开发公司', payee_account: '6229 **** **** 2345', created_at: '2026-03-18 15:20:00', status: 'confirmed', remark: '房产交易款项' },
  { id: 'TR202601007', case_id: 'CASE2026032', case_name: '校园伤害赔偿案', amount: 8000.0, payee: '李同学（监护人代收）', payee_account: '6227 **** **** 6789', created_at: '2026-04-02 08:30:00', status: 'pending', remark: '赔偿款转付' },
  { id: 'TR202601008', case_id: 'CASE2026040', case_name: '知识产权侵权案', amount: 60000.0, payee: '深圳某科技公司', payee_account: '6224 **** **** 0123', created_at: '2026-04-15 13:10:00', status: 'confirmed', remark: '知识产权赔偿' },
]

export default function TransferSchedule() {
  const [searchParams, setSearchParams] = useState({ keyword: '', status: '' })
  const [dataList, setDataList] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<Record<string, unknown> | null>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      let filtered = [...mockTransfers]
      if (searchParams.keyword) {
        const kw = searchParams.keyword.toLowerCase()
        filtered = filtered.filter(
          (item) =>
            String(item.id ?? '').toLowerCase().includes(kw) ||
            String(item.case_id ?? '').toLowerCase().includes(kw) ||
            String(item.payee ?? '').toLowerCase().includes(kw)
        )
      }
      if (searchParams.status) {
        filtered = filtered.filter((item) => item.status === searchParams.status)
      }
      setDataList(filtered)
    } catch (error) { /* 错误处理 */ }
    finally { setLoading(false) }
  }

  const handleSearch = () => { fetchData() }
  const handleReset = () => {
    setSearchParams({ keyword: '', status: '' })
    setTimeout(() => fetchData(), 0)
  }

  const handleViewDetail = (record: Record<string, unknown>) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  const handleConfirm = async (record: Record<string, unknown>) => {
    Modal.confirm({
      title: '确认转款',
      content: (
        <div>
          <p>确定要执行转款操作吗？</p>
          <p>转款编号：<strong>{String(record.id)}</strong></p>
          <p>金额：<strong style={{ color: theme.primaryDark }}>{fmtMoney(Number(record.amount))}</strong></p>
          <p>收款人：<strong>{String(record.payee)}</strong></p>
        </div>
      ),
      okText: '确认转款',
      cancelText: '取消',
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 300))
          message.success('转款确认成功')
          setDataList((prev) => prev.map((item) => item.id === record.id ? { ...item, status: 'confirmed' } : item))
        } catch (error) {
          message.error('转款失败')
        }
      },
    })
  }

  const stats = useMemo(() => {
    const total = mockTransfers.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const now = new Date()
    const currentMonth = now.getFullYear() * 12 + now.getMonth()
    const thisMonth = mockTransfers.filter((item) => {
      const d = new Date(String(item.created_at))
      return d.getFullYear() * 12 + d.getMonth() === currentMonth
    })
    const pending = mockTransfers.filter((item) => item.status === 'pending').length
    return { total, monthCount: thisMonth.length, pending }
  }, [])

  const columns = [
    {
      title: '转款编号', dataIndex: 'id', key: 'id', width: 140,
      render: (val: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{val}</span>,
    },
    {
      title: '关联案件', dataIndex: 'case_id', key: 'case_id', width: 140,
      render: (_: unknown, record: Record<string, unknown>) => (
        <a style={{ color: theme.link }}>{String(record.case_id ?? '-')}</a>
      ),
    },
    {
      title: '案件名称', dataIndex: 'case_name', key: 'case_name', width: 180, ellipsis: true,
    },
    {
      title: '转款金额', dataIndex: 'amount', key: 'amount', width: 140, align: 'right' as const,
      render: (val: number) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.primaryDark }}>
          {fmtMoney(val)}
        </span>
      ),
    },
    { title: '收款人', dataIndex: 'payee', key: 'payee', width: 180, ellipsis: true },
    {
      title: '转款时间', dataIndex: 'created_at', key: 'created_at', width: 170,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (val: string) => (
        <StatusPill text={transferStatusLabelMap[val] || val} kind={transferStatusKindMap[val] || 'neutral'} />
      ),
    },
    {
      title: '操作', key: 'action', width: 180,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space className="stitch-btn-group">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          {record.status === 'pending' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleConfirm(record)}>
              确认转款
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>转款一览表</h2>
      </div>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat1 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <DollarOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>转款总额</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 28, fontWeight: 600 }}>
                  {fmtMoney(stats.total)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat2 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <SwapOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>本月转款数</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 28, fontWeight: 600 }}>
                  {stats.monthCount} 笔
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat3 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <ClockCircleOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>待处理</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 28, fontWeight: 600 }}>
                  {stats.pending} 笔
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <div className="stitch-filter-bar">
        <Input
          placeholder="搜索转款编号/案件/收款人"
          prefix={<SearchOutlined />}
          style={{ width: 260 }}
          value={searchParams.keyword}
          onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
          onPressEnter={handleSearch}
        />
        <Select
          placeholder="状态筛选"
          style={{ width: 140 }}
          value={searchParams.status || undefined}
          onChange={(val) => setSearchParams({ ...searchParams, status: val || '' })}
          options={statusOptions}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={dataList}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="middle"
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Modal title="转款详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={560}>
        {currentItem && (
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">转款编号</span>
              <span className="detail-value" style={{ color: theme.primary, fontWeight: 500 }}>
                {String(currentItem.id ?? '')}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">关联案件</span>
              <span className="detail-value">{String(currentItem.case_id ?? '-')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">案件名称</span>
              <span className="detail-value">{String(currentItem.case_name ?? '-')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">转款金额</span>
              <span className="detail-value" style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.primaryDark }}>
                {fmtMoney(Number(currentItem.amount))}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">收款人</span>
              <span className="detail-value">{String(currentItem.payee ?? '-')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">收款账号</span>
              <span className="detail-value">{String(currentItem.payee_account ?? '-')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">转款时间</span>
              <span className="detail-value">{formatDateTime(String(currentItem.created_at))}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">状态</span>
              <span className="detail-value">
                <StatusPill
                  text={transferStatusLabelMap[String(currentItem.status)] || String(currentItem.status)}
                  kind={transferStatusKindMap[String(currentItem.status)] || 'neutral'}
                />
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">备注</span>
              <span className="detail-value">{String(currentItem.remark ?? '-')}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}