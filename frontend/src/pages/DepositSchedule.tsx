import { useState, useEffect, useMemo } from 'react'
import { Table, Button, Modal, Input, Select, Space, message, Card, Row, Col } from 'antd'
import {
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined,
  DollarOutlined,
  WalletOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDateTime } from '../utils/format'

// 页面标题样式
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

// KPI 卡片样式
const kpiCardStyle: React.CSSProperties = {
  borderRadius: 12,
  overflow: 'hidden',
}

const kpiBodyStyle: React.CSSProperties = {
  padding: '20px 24px',
}

// 金额格式化（千分位）
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 状态标签类型
type PillKind = 'neutral' | 'blue' | 'green' | 'red' | 'orange'

// 状态标签样式映射
const pillClassMap: Record<PillKind, string> = {
  neutral: 'stitch-tag',
  blue: 'stitch-tag stitch-tag-info',
  green: 'stitch-tag stitch-tag-success',
  red: 'stitch-tag stitch-tag-error',
  orange: 'stitch-tag stitch-tag-warning',
}

// 状态标签组件
const StatusPill = ({ text, kind }: { text: string; kind: PillKind }) => {
  return <span className={pillClassMap[kind]}>{text}</span>
}

// 存款状态映射
const depositStatusKindMap: Record<string, PillKind> = {
  active: 'green',
  frozen: 'red',
  partial: 'orange',
}

const depositStatusLabelMap: Record<string, string> = {
  active: '正常',
  frozen: '已冻结',
  partial: '部分冻结',
}

// 状态筛选选项
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '正常' },
  { value: 'frozen', label: '已冻结' },
  { value: 'partial', label: '部分冻结' },
]

// Mock 存款数据
const mockDeposits: Record<string, unknown>[] = [
  {
    id: 'DP202601001',
    depositor: '北京某科技有限公司',
    amount: 100000.0,
    case_id: 'CASE2026001',
    case_name: '技术服务合同纠纷案',
    created_at: '2026-01-10 09:00:00',
    status: 'active',
    available_amount: 100000.0,
    frozen_amount: 0,
    remark: '案件保证金',
  },
  {
    id: 'DP202601002',
    depositor: '上海某贸易公司',
    amount: 50000.0,
    case_id: 'CASE2026003',
    case_name: '国际贸易合同纠纷',
    created_at: '2026-01-22 14:30:00',
    status: 'frozen',
    available_amount: 0,
    frozen_amount: 50000.0,
    remark: '被司法冻结',
  },
  {
    id: 'DP202601003',
    depositor: '张先生',
    amount: 20000.0,
    case_id: 'CASE2026008',
    case_name: '劳动争议案',
    created_at: '2026-02-05 11:15:00',
    status: 'active',
    available_amount: 20000.0,
    frozen_amount: 0,
    remark: '代理费押金',
  },
  {
    id: 'DP202601004',
    depositor: '广州某建筑工程公司',
    amount: 80000.0,
    case_id: 'CASE2026012',
    case_name: '建设工程施工合同案',
    created_at: '2026-02-18 16:00:00',
    status: 'partial',
    available_amount: 50000.0,
    frozen_amount: 30000.0,
    remark: '部分冻结',
  },
  {
    id: 'DP202601005',
    depositor: '王女士',
    amount: 15000.0,
    case_id: 'CASE2026018',
    case_name: '离婚财产分割案',
    created_at: '2026-03-01 10:45:00',
    status: 'active',
    available_amount: 15000.0,
    frozen_amount: 0,
    remark: '保证金',
  },
  {
    id: 'DP202601006',
    depositor: '深圳某金融公司',
    amount: 250000.0,
    case_id: 'CASE2026025',
    case_name: '金融借款合同纠纷',
    created_at: '2026-03-15 09:30:00',
    status: 'active',
    available_amount: 250000.0,
    frozen_amount: 0,
    remark: '大额保证金',
  },
  {
    id: 'DP202601007',
    depositor: '李同学',
    amount: 5000.0,
    case_id: 'CASE2026032',
    case_name: '校园伤害赔偿案',
    created_at: '2026-04-05 15:20:00',
    status: 'frozen',
    available_amount: 0,
    frozen_amount: 5000.0,
    remark: '冻结中',
  },
  {
    id: 'DP202601008',
    depositor: '杭州某互联网公司',
    amount: 120000.0,
    case_id: 'CASE2026040',
    case_name: '知识产权侵权案',
    created_at: '2026-04-20 13:00:00',
    status: 'partial',
    available_amount: 70000.0,
    frozen_amount: 50000.0,
    remark: '部分冻结',
  },
]

export default function DepositSchedule() {
  // 搜索参数
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: '',
  })
  // 列表数据
  const [dataList, setDataList] = useState<Record<string, unknown>[]>([])
  // 加载状态
  const [loading, setLoading] = useState(false)
  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<Record<string, unknown> | null>(null)

  // 初始化加载数据
  useEffect(() => {
    fetchData()
  }, [])

  // 获取列表数据
  const fetchData = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      let filtered = [...mockDeposits]
      if (searchParams.keyword) {
        const kw = searchParams.keyword.toLowerCase()
        filtered = filtered.filter(
          (item) =>
            String(item.id ?? '').toLowerCase().includes(kw) ||
            String(item.depositor ?? '').toLowerCase().includes(kw) ||
            String(item.case_id ?? '').toLowerCase().includes(kw)
        )
      }
      if (searchParams.status) {
        filtered = filtered.filter((item) => item.status === searchParams.status)
      }
      setDataList(filtered)
    } catch (error) {
      // 错误处理
    } finally {
      setLoading(false)
    }
  }

  // 搜索操作
  const handleSearch = () => {
    fetchData()
  }

  // 重置搜索
  const handleReset = () => {
    setSearchParams({ keyword: '', status: '' })
    setTimeout(() => fetchData(), 0)
  }

  // 查看详情
  const handleViewDetail = (record: Record<string, unknown>) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  // 冻结操作
  const handleFreeze = async (record: Record<string, unknown>) => {
    Modal.confirm({
      title: '确认冻结',
      content: `确定要冻结存款 ${record.id}（${fmtMoney(Number(record.amount))}）吗？`,
      okText: '确认冻结',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 300))
          message.success('冻结成功')
          setDataList((prev) =>
            prev.map((item) =>
              item.id === record.id
                ? {
                    ...item,
                    status: 'frozen',
                    available_amount: 0,
                    frozen_amount: Number(item.amount),
                  }
                : item
            )
          )
        } catch (error) {
          message.error('冻结失败')
        }
      },
    })
  }

  // 解冻操作
  const handleUnfreeze = async (record: Record<string, unknown>) => {
    Modal.confirm({
      title: '确认解冻',
      content: `确定要解冻存款 ${record.id} 吗？`,
      okText: '确认解冻',
      cancelText: '取消',
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 300))
          message.success('解冻成功')
          setDataList((prev) =>
            prev.map((item) =>
              item.id === record.id
                ? {
                    ...item,
                    status: 'active',
                    available_amount: Number(item.amount),
                    frozen_amount: 0,
                  }
                : item
            )
          )
        } catch (error) {
          message.error('解冻失败')
        }
      },
    })
  }

  // 计算统计数据
  const stats = useMemo(() => {
    const total = mockDeposits.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const available = mockDeposits.reduce((sum, item) => sum + (Number(item.available_amount) || 0), 0)
    const frozen = mockDeposits.reduce((sum, item) => sum + (Number(item.frozen_amount) || 0), 0)
    return { total, available, frozen }
  }, [])

  // 表格列定义
  const columns = [
    {
      title: '存款编号',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (val: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{val}</span>,
    },
    {
      title: '存款人',
      dataIndex: 'depositor',
      key: 'depositor',
      width: 160,
      ellipsis: true,
    },
    {
      title: '存款金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right' as const,
      render: (val: number) => (
        <span
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontWeight: 600,
            color: theme.primaryDark,
          }}
        >
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      title: '可用余额',
      dataIndex: 'available_amount',
      key: 'available_amount',
      width: 130,
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ color: theme.success, fontWeight: 500 }}>{fmtMoney(val)}</span>
      ),
    },
    {
      title: '冻结金额',
      dataIndex: 'frozen_amount',
      key: 'frozen_amount',
      width: 130,
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ color: theme.error, fontWeight: 500 }}>{fmtMoney(val)}</span>
      ),
    },
    {
      title: '关联案件',
      dataIndex: 'case_id',
      key: 'case_id',
      width: 140,
      render: (_: unknown, record: Record<string, unknown>) => (
        <a style={{ color: theme.link }}>{String(record.case_id ?? '-')}</a>
      ),
    },
    {
      title: '存款时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => (
        <StatusPill text={depositStatusLabelMap[val] || val} kind={depositStatusKindMap[val] || 'neutral'} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space className="stitch-btn-group">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {(record.status === 'active') && (
            <Button
              size="small"
              danger
              icon={<LockOutlined />}
              onClick={() => handleFreeze(record)}
            >
              冻结
            </Button>
          )}
          {(record.status === 'frozen' || record.status === 'partial') && (
            <Button
              size="small"
              type="primary"
              icon={<UnlockOutlined />}
              onClick={() => handleUnfreeze(record)}
            >
              解冻
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>存款一览表</h2>
      </div>

      {/* KPI 统计卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat1 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 24,
                }}
              >
                <DollarOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>存款总额</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 28,
                    fontWeight: 600,
                  }}
                >
                  {fmtMoney(stats.total)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat4 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 24,
                }}
              >
                <WalletOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>可用余额</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 28,
                    fontWeight: 600,
                  }}
                >
                  {fmtMoney(stats.available)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat3 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 24,
                }}
              >
                <StopOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>冻结金额</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 28,
                    fontWeight: 600,
                  }}
                >
                  {fmtMoney(stats.frozen)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <div className="stitch-filter-bar">
        <Input
          placeholder="搜索存款编号/存款人/案件"
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
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          搜索
        </Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      {/* 表格列表 */}
      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={dataList}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="middle"
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="存款详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={560}
      >
        {currentItem && (
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">存款编号</span>
              <span className="detail-value" style={{ color: theme.primary, fontWeight: 500 }}>
                {String(currentItem.id ?? '')}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">存款人</span>
              <span className="detail-value">{String(currentItem.depositor ?? '-')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">存款金额</span>
              <span
                className="detail-value"
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontWeight: 600,
                  color: theme.primaryDark,
                }}
              >
                {fmtMoney(Number(currentItem.amount))}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">可用余额</span>
              <span className="detail-value" style={{ color: theme.success, fontWeight: 500 }}>
                {fmtMoney(Number(currentItem.available_amount))}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">冻结金额</span>
              <span className="detail-value" style={{ color: theme.error, fontWeight: 500 }}>
                {fmtMoney(Number(currentItem.frozen_amount))}
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
              <span className="detail-label">存款时间</span>
              <span className="detail-value">{formatDateTime(String(currentItem.created_at))}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">状态</span>
              <span className="detail-value">
                <StatusPill
                  text={depositStatusLabelMap[String(currentItem.status)] || String(currentItem.status)}
                  kind={depositStatusKindMap[String(currentItem.status)] || 'neutral'}
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