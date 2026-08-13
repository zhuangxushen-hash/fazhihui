import { useState, useEffect, useMemo } from 'react'
import { Table, Button, DatePicker, Select, Space, Modal, Card, Row, Col, Input } from 'antd'
import { SearchOutlined, WalletOutlined, BankOutlined, SwapOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { theme } from '../constants/theme'
import { formatDateTime } from '../utils/format'

const { RangePicker } = DatePicker

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

// 账户类型选项
const accountTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'lawyer', label: '律师账户' },
  { value: 'client', label: '当事人账户' },
  { value: 'case', label: '案件账户' },
  { value: 'firm', label: '律所账户' },
]

// Mock 账户数据
const mockAccounts: Record<string, unknown>[] = [
  { id: 'ACC001', account_name: '张律师 - 个人', account_type: 'lawyer', account_type_label: '律师账户', balance: 125000.0, frozen: 0, status: 'active', bank_name: '招商银行', last_transaction: '2026-04-20 14:30:00' },
  { id: 'ACC002', account_name: '北京某科技有限公司', account_type: 'client', account_type_label: '当事人账户', balance: 56800.0, frozen: 0, status: 'active', bank_name: '中国工商银行', last_transaction: '2026-04-18 10:15:00' },
  { id: 'ACC003', account_name: 'CASE2026001 - 合同纠纷案', account_type: 'case', account_type_label: '案件账户', balance: 35000.0, frozen: 5000.0, status: 'partial', bank_name: '建设银行', last_transaction: '2026-04-15 16:00:00' },
  { id: 'ACC004', account_name: '律所 - 基本户', account_type: 'firm', account_type_label: '律所账户', balance: 580000.0, frozen: 0, status: 'active', bank_name: '中国银行', last_transaction: '2026-04-22 09:00:00' },
  { id: 'ACC005', account_name: '李律师 - 个人', account_type: 'lawyer', account_type_label: '律师账户', balance: 68000.0, frozen: 0, status: 'active', bank_name: '招商银行', last_transaction: '2026-04-21 11:30:00' },
  { id: 'ACC006', account_name: 'CASE2026012 - 金融借款案', account_type: 'case', account_type_label: '案件账户', balance: 0, frozen: 120000.0, status: 'frozen', bank_name: '交通银行', last_transaction: '2026-04-10 08:45:00' },
  { id: 'ACC007', account_name: '王女士 - 个人', account_type: 'client', account_type_label: '当事人账户', balance: 45000.0, frozen: 0, status: 'active', bank_name: '中国工商银行', last_transaction: '2026-04-19 15:20:00' },
  { id: 'ACC008', account_name: '律所 - 保证金专户', account_type: 'firm', account_type_label: '律所账户', balance: 200000.0, frozen: 0, status: 'active', bank_name: '农业银行', last_transaction: '2026-04-23 10:00:00' },
]

// Mock 结算明细数据
const mockSettlements: Record<string, unknown>[] = [
  { id: 'STL202601001', account_id: 'ACC001', account_name: '张律师 - 个人', type: '提款', amount: -15000.0, balance_after: 125000.0, operator: '张律师', created_at: '2026-04-20 14:30:00', remark: '案件代理费提款' },
  { id: 'STL202601002', account_id: 'ACC002', account_name: '北京某科技有限公司', type: '存款', amount: 30000.0, balance_after: 56800.0, operator: '系统自动', created_at: '2026-04-18 10:15:00', remark: '合同款到账' },
  { id: 'STL202601003', account_id: 'ACC003', account_name: 'CASE2026001 - 合同纠纷案', type: '冻结', amount: -5000.0, balance_after: 35000.0, operator: '财务审批', created_at: '2026-04-15 16:00:00', remark: '部分款项冻结' },
  { id: 'STL202601004', account_id: 'ACC004', account_name: '律所 - 基本户', type: '转款', amount: -85000.0, balance_after: 580000.0, operator: '财务部门', created_at: '2026-04-22 09:00:00', remark: '支付员工薪酬' },
  { id: 'STL202601005', account_id: 'ACC005', account_name: '李律师 - 个人', type: '提款', amount: -8000.0, balance_after: 68000.0, operator: '李律师', created_at: '2026-04-21 11:30:00', remark: '交通费用提款' },
  { id: 'STL202601006', account_id: 'ACC006', account_name: 'CASE2026012 - 金融借款案', type: '冻结', amount: -120000.0, balance_after: 0, operator: '法院裁定', created_at: '2026-04-10 08:45:00', remark: '全额司法冻结' },
  { id: 'STL202601007', account_id: 'ACC007', account_name: '王女士 - 个人', type: '存款', amount: 20000.0, balance_after: 45000.0, operator: '系统自动', created_at: '2026-04-19 15:20:00', remark: '补充保证金' },
  { id: 'STL202601008', account_id: 'ACC008', account_name: '律所 - 保证金专户', type: '利息', amount: 520.0, balance_after: 200000.0, operator: '银行自动', created_at: '2026-04-23 10:00:00', remark: '季度利息收入' },
]

export default function AccountSettlement() {
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    accountType: '',
    dateRange: [] as string[],
  })
  const [accounts, setAccounts] = useState<Record<string, unknown>[]>([])
  const [settlements, setSettlements] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentAccount, setCurrentAccount] = useState<Record<string, unknown> | null>(null)
  const [activeTab, setActiveTab] = useState<'accounts' | 'settlements'>('accounts')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      // 筛选账户
      let filtered = [...mockAccounts]
      if (searchParams.keyword) {
        const kw = searchParams.keyword.toLowerCase()
        filtered = filtered.filter(
          (item) =>
            String(item.id ?? '').toLowerCase().includes(kw) ||
            String(item.account_name ?? '').toLowerCase().includes(kw) ||
            String(item.bank_name ?? '').toLowerCase().includes(kw)
        )
      }
      if (searchParams.accountType) {
        filtered = filtered.filter((item) => item.account_type === searchParams.accountType)
      }
      setAccounts(filtered)
      // 筛选结算明细
      let filteredSettlements = [...mockSettlements]
      if (searchParams.keyword) {
        const kw = searchParams.keyword.toLowerCase()
        filteredSettlements = filteredSettlements.filter(
          (item) =>
            String(item.id ?? '').toLowerCase().includes(kw) ||
            String(item.account_name ?? '').toLowerCase().includes(kw) ||
            String(item.type ?? '').toLowerCase().includes(kw)
        )
      }
      if (searchParams.dateRange.length === 2) {
        const [start, end] = searchParams.dateRange
        filteredSettlements = filteredSettlements.filter((item) => {
          const d = String(item.created_at)
          return d >= start && d <= end + ' 23:59:59'
        })
      }
      setSettlements(filteredSettlements)
    } catch (error) { /* 错误处理 */ }
    finally { setLoading(false) }
  }

  const handleSearch = () => { fetchData() }
  const handleReset = () => {
    setSearchParams({ keyword: '', accountType: '', dateRange: [] })
    setTimeout(() => fetchData(), 0)
  }

  const handleViewDetail = (record: Record<string, unknown>) => {
    setCurrentAccount(record)
    setDetailVisible(true)
  }

  // 汇总统计
  const stats = useMemo(() => {
    const totalBalance = mockAccounts.reduce((sum, item) => sum + (Number(item.balance) || 0), 0)
    const totalFrozen = mockAccounts.reduce((sum, item) => sum + (Number(item.frozen) || 0), 0)
    const activeCount = mockAccounts.filter((item) => item.status === 'active').length
    // 本月结算笔数
    const now = new Date()
    const currentMonth = now.getFullYear() * 12 + now.getMonth()
    const monthSettlements = mockSettlements.filter((item) => {
      const d = new Date(String(item.created_at))
      return d.getFullYear() * 12 + d.getMonth() === currentMonth
    })
    const monthAmount = monthSettlements.reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0)
    return { totalBalance, totalFrozen, activeCount, monthCount: monthSettlements.length, monthAmount }
  }, [])

  // 账户列表列定义
  const accountColumns = [
    {
      title: '账户编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (val: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{val}</span>,
    },
    { title: '账户名称', dataIndex: 'account_name', key: 'account_name', width: 200, ellipsis: true },
    {
      title: '账户类型',
      dataIndex: 'account_type_label',
      key: 'account_type_label',
      width: 110,
      render: (val: string) => <span className="stitch-tag">{val}</span>,
    },
    {
      title: '开户行',
      dataIndex: 'bank_name',
      key: 'bank_name',
      width: 140,
      render: (val: string) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <BankOutlined /> {val}
        </span>
      ),
    },
    {
      title: '账户余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 140,
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.primaryDark }}>
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      title: '冻结金额',
      dataIndex: 'frozen',
      key: 'frozen',
      width: 130,
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ color: val > 0 ? theme.error : theme.textTertiary, fontWeight: 500 }}>
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
          active: { label: '正常', className: 'stitch-tag stitch-tag-success' },
          frozen: { label: '已冻结', className: 'stitch-tag stitch-tag-error' },
          partial: { label: '部分冻结', className: 'stitch-tag stitch-tag-warning' },
        }
        const cfg = statusMap[val] || { label: val, className: 'stitch-tag' }
        return <span className={cfg.className}>{cfg.label}</span>
      },
    },
    {
      title: '最后交易',
      dataIndex: 'last_transaction',
      key: 'last_transaction',
      width: 170,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  // 结算明细列定义
  const settlementColumns = [
    {
      title: '结算编号',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (val: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{val}</span>,
    },
    { title: '账户名称', dataIndex: 'account_name', key: 'account_name', width: 200, ellipsis: true },
    {
      title: '交易类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (val: string) => {
        const typeMap: Record<string, { label: string; className: string }> = {
          存款: { label: '存款', className: 'stitch-tag stitch-tag-success' },
          提款: { label: '提款', className: 'stitch-tag stitch-tag-warning' },
          转款: { label: '转款', className: 'stitch-tag stitch-tag-info' },
          冻结: { label: '冻结', className: 'stitch-tag stitch-tag-error' },
          利息: { label: '利息', className: 'stitch-tag stitch-tag-gold' },
        }
        const cfg = typeMap[val] || { label: val, className: 'stitch-tag' }
        return <span className={cfg.className}>{cfg.label}</span>
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right' as const,
      render: (val: number) => (
        <span
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontWeight: 600,
            color: val >= 0 ? theme.success : theme.error,
          }}
        >
          {val >= 0 ? '+' : ''}{fmtMoney(val)}
        </span>
      ),
    },
    {
      title: '变动后余额',
      dataIndex: 'balance_after',
      key: 'balance_after',
      width: 140,
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ fontWeight: 500 }}>{fmtMoney(val)}</span>
      ),
    },
    { title: '经办人', dataIndex: 'operator', key: 'operator', width: 120 },
    {
      title: '交易时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (val: string) => formatDateTime(val),
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 200, ellipsis: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>账户结算明细</h2>
      </div>

      {/* KPI 统计卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat1 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <WalletOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>账户总余额</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {fmtMoney(stats.totalBalance)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat3 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <SwapOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>冻结金额</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {fmtMoney(stats.totalFrozen)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat2 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <FileTextOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>本月结算</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {stats.monthCount} 笔 / {fmtMoney(stats.monthAmount)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat4 }} styles={{ body: kpiBodyStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <WalletOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>活跃账户</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {stats.activeCount} 个
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card className="stitch-filter-bar" style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Space wrap size={[12, 12]}>
          <Input
            placeholder="搜索账户编号/名称/开户行"
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
            value={searchParams.keyword}
            onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="账户类型"
            style={{ width: 140 }}
            value={searchParams.accountType || undefined}
            onChange={(val) => setSearchParams({ ...searchParams, accountType: val || '' })}
            options={accountTypeOptions}
          />
          <RangePicker
            value={searchParams.dateRange.length === 2 ? (searchParams.dateRange as unknown as [Dayjs, Dayjs]) : undefined}
            onChange={(_: any, dateStrings: [string, string]) =>
              setSearchParams({ ...searchParams, dateRange: dateStrings || [] })
            }
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: 16 }}>
        <Card
          size="small"
          style={{
            width: 140,
            borderRadius: 12,
            border: `1px solid ${theme.borderSecondary}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 8,
            height: 'fit-content',
          }}
          styles={{ body: { padding: 8 } }}
        >
          <div
            onClick={() => setActiveTab('accounts')}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              background: activeTab === 'accounts' ? theme.gradientPrimary : 'transparent',
              color: activeTab === 'accounts' ? '#fff' : theme.textSecondary,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <WalletOutlined /> 账户列表
          </div>
          <div
            onClick={() => setActiveTab('settlements')}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              background: activeTab === 'settlements' ? theme.gradientPrimary : 'transparent',
              color: activeTab === 'settlements' ? '#fff' : theme.textSecondary,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FileTextOutlined /> 结算明细
          </div>
        </Card>

        <div style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'accounts' ? (
            <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
              <Table
                dataSource={accounts}
                columns={accountColumns}
                loading={loading}
                rowKey="id"
                size="middle"
                scroll={{ x: 1300 }}
                pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
              />
            </Card>
          ) : (
            <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
              <Table
                dataSource={settlements}
                columns={settlementColumns}
                loading={loading}
                rowKey="id"
                size="middle"
                scroll={{ x: 1200 }}
                pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
              />
            </Card>
          )}
        </div>
      </div>

      {/* 详情弹窗 */}
      <Modal
        title="账户详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={560}
      >
        {currentAccount && (
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">账户编号</span>
              <span className="detail-value" style={{ color: theme.primary, fontWeight: 500 }}>
                {String(currentAccount.id ?? '')}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">账户名称</span>
              <span className="detail-value">{String(currentAccount.account_name ?? '-')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">账户类型</span>
              <span className="detail-value">{String(currentAccount.account_type_label ?? '-')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">开户行</span>
              <span className="detail-value">{String(currentAccount.bank_name ?? '-')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">账户余额</span>
              <span
                className="detail-value"
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontWeight: 600,
                  color: theme.primaryDark,
                }}
              >
                {fmtMoney(Number(currentAccount.balance))}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">冻结金额</span>
              <span className="detail-value" style={{ color: theme.error, fontWeight: 500 }}>
                {fmtMoney(Number(currentAccount.frozen))}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">账户状态</span>
              <span className="detail-value">
                {(() => {
                  const statusMap: Record<string, { label: string; className: string }> = {
                    active: { label: '正常', className: 'stitch-tag stitch-tag-success' },
                    frozen: { label: '已冻结', className: 'stitch-tag stitch-tag-error' },
                    partial: { label: '部分冻结', className: 'stitch-tag stitch-tag-warning' },
                  }
                  const cfg = statusMap[String(currentAccount.status)] || { label: String(currentAccount.status), className: 'stitch-tag' }
                  return <span className={cfg.className}>{cfg.label}</span>
                })()}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">最后交易</span>
              <span className="detail-value">{formatDateTime(String(currentAccount.last_transaction))}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}