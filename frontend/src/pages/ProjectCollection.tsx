import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Space,
  Tag,
  Drawer,
  Descriptions,
  Empty,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  MoneyCollectOutlined,
  PlusOutlined,
  FileDoneOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getProjectCollection, recordProjectPayment } from '../api/project-collection'
import { theme } from '../constants/theme'

const { RangePicker } = DatePicker

// 收款状态映射
const paymentStatusMap: Record<string, { label: string; color: string }> = {
  not_collected: { label: '未收款', color: 'default' },
  partial: { label: '部分收款', color: 'warning' },
  full: { label: '已全额收款', color: 'success' },
  cancelled: { label: '已取消收款', color: 'error' },
  not_required: { label: '无需收款', color: 'processing' },
}

// 收款方式选项
const methodOptions = [
  { value: 'bank', label: '银行转账' },
  { value: 'alipay', label: '支付宝' },
  { value: 'wechat', label: '微信' },
  { value: 'cash', label: '现金' },
]

export default function ProjectCollection() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>({ items: [], stats: {} })
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)

  // 登记收款弹窗
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payRow, setPayRow] = useState<any>(null)
  const [payForm] = Form.useForm()

  // 明细抽屉
  const [detailRow, setDetailRow] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getProjectCollection({
        keyword: keyword || undefined,
        status: status || undefined,
        startDate: dateRange ? dateRange[0] : undefined,
        endDate: dateRange ? dateRange[1] : undefined,
      })
      setData(res || { items: [], stats: {} })
    } catch {
      // 错误由拦截器统一提示
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stats = data.stats || {}
  const statCards = [
    { title: '合同金额总计', value: stats.total_contract || 0, color: theme.primary, icon: <FileDoneOutlined /> },
    { title: '已收金额总计', value: stats.total_collected || 0, color: theme.success, icon: <MoneyCollectOutlined /> },
    { title: '未收金额总计', value: stats.total_unpaid || 0, color: theme.warning, icon: <MoneyCollectOutlined /> },
    { title: '已开票金额总计', value: stats.total_invoiced || 0, color: theme.brandGold, icon: <FileDoneOutlined /> },
  ]

  const showRecordPayment = (row: any) => {
    setPayRow(row)
    setPayModalOpen(true)
    payForm.resetFields()
    payForm.setFieldsValue({ case_id: row.id, method: 'bank' })
  }

  const handleRecordPayment = async () => {
    const values = await payForm.validateFields()
    await recordProjectPayment(values)
    message.success('登记收款成功')
    setPayModalOpen(false)
    loadData()
  }

  const columns = [
    { title: '案件编号', dataIndex: 'case_no', key: 'case_no', width: 160 },
    { title: '案件名称', dataIndex: 'case_name', key: 'case_name', render: (_: any, r: any) => r.case_name || r.client_name || '未命名案件' },
    { title: '客户名称', dataIndex: 'client_name', key: 'client_name', width: 160 },
    { title: '合同金额', dataIndex: 'contract_amount', key: 'contract_amount', width: 130, align: 'right' as const, render: (v: number) => <strong style={{ color: theme.primary }}>¥{Number(v).toLocaleString()}</strong> },
    { title: '已收金额', dataIndex: 'collected_amount', key: 'collected_amount', width: 130, align: 'right' as const, render: (v: number) => <span style={{ color: theme.success }}>¥{Number(v).toLocaleString()}</span> },
    { title: '未收金额', dataIndex: 'unpaid_amount', key: 'unpaid_amount', width: 130, align: 'right' as const, render: (v: number) => <span style={{ color: theme.warning }}>¥{Number(v).toLocaleString()}</span> },
    { title: '已开票金额', dataIndex: 'invoiced_amount', key: 'invoiced_amount', width: 130, align: 'right' as const, render: (v: number) => <span>¥{Number(v).toLocaleString()}</span> },
    {
      title: '收款状态',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 120,
      render: (v: string) => {
        const cfg = paymentStatusMap[v] || { label: v || '未收款', color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '收款/开票笔数',
      key: 'count',
      width: 140,
      render: (_: any, r: any) => (
        <Space>
          <Tag color="success">{r.payment_records?.length || 0} 收款</Tag>
          <Tag color="processing">{r.invoices?.length || 0} 开票</Tag>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => showRecordPayment(r)}>
            登记收款
          </Button>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setDetailRow(r); setDetailOpen(true) }}>
            明细
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 8 }}>
      {/* 汇总统计卡片 */}
      <Row gutter={[16, 16]}>
        {statCards.map((c) => (
          <Col xs={24} sm={12} lg={6} key={c.title}>
            <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 20 } }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <div style={{ color: theme.textTertiary, fontSize: 13 }}>{c.title}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: c.color, marginTop: 4 }}>
                    ¥{Number(c.value).toLocaleString()}
                  </div>
                </Col>
                <Col>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'rgba(0,113,227,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      color: c.color,
                    }}
                  >
                    {c.icon}
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 筛选栏 */}
      <Card style={{ borderRadius: 16, marginTop: 16 }} styles={{ body: { padding: '16px 20px' } }}>
        <Space wrap size={12}>
          <Input
            placeholder="案件编号/名称/客户"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            style={{ width: 240 }}
            onPressEnter={loadData}
          />
          <Select
            placeholder="收款状态"
            value={status || undefined}
            onChange={setStatus}
            allowClear
            style={{ width: 140 }}
            options={Object.entries(paymentStatusMap).map(([value, cfg]) => ({ value, label: cfg.label }))}
          />
          <RangePicker
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')])
              } else {
                setDateRange(null)
              }
            }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setStatus(''); setDateRange(null); loadData() }}>重置</Button>
        </Space>
      </Card>

      {/* 台账表格 */}
      <Card style={{ borderRadius: 16, marginTop: 16 }} styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data.items || []}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1400 }}
          locale={{ emptyText: <Empty description="暂无收款台账数据" /> }}
        />
      </Card>

      {/* 登记收款弹窗 */}
      <Modal
        title={<Space><MoneyCollectOutlined />登记收款</Space>}
        open={payModalOpen}
        onOk={handleRecordPayment}
        onCancel={() => setPayModalOpen(false)}
        okText="确认收款"
        destroyOnClose
      >
        {payRow && (
          <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="案件编号">{payRow.case_no}</Descriptions.Item>
            <Descriptions.Item label="客户">{payRow.client_name}</Descriptions.Item>
            <Descriptions.Item label="合同金额">¥{Number(payRow.contract_amount || 0).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="已收金额">¥{Number(payRow.collected_amount || 0).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        )}
        <Form form={payForm} layout="vertical">
          <Form.Item name="case_id" hidden><Input /></Form.Item>
          <Form.Item name="amount" label="收款金额" rules={[{ required: true, message: '请输入收款金额' }]}>
            <InputNumber min={0.01} precision={2} style={{ width: '100%' }} placeholder="请输入收款金额" />
          </Form.Item>
          <Form.Item name="method" label="收款方式" rules={[{ required: true, message: '请选择收款方式' }]}>
            <Select options={methodOptions} />
          </Form.Item>
          <Form.Item name="transaction_id" label="流水号">
            <Input placeholder="支付/转账流水号（可选）" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={2} placeholder="备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 收款/开票明细抽屉 */}
      <Drawer
        title={detailRow ? `收款开票明细 - ${detailRow.case_no || detailRow.case_name || ''}` : '明细'}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={560}
      >
        {detailRow && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="案件名称">{detailRow.case_name || '未命名案件'}</Descriptions.Item>
              <Descriptions.Item label="客户">{detailRow.client_name}</Descriptions.Item>
              <Descriptions.Item label="合同金额">¥{Number(detailRow.contract_amount || 0).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="已收金额">¥{Number(detailRow.collected_amount || 0).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="未收金额">¥{Number(detailRow.unpaid_amount || 0).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="已开票金额">¥{Number(detailRow.invoiced_amount || 0).toLocaleString()}</Descriptions.Item>
            </Descriptions>

            <h4>收款记录</h4>
            {(detailRow.payment_records || []).length === 0 ? (
              <Empty description="暂无收款记录" />
            ) : (
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                columns={[
                  { title: '金额', dataIndex: 'amount', render: (v: number) => `¥${Number(v).toLocaleString()}` },
                  { title: '方式', dataIndex: 'method', render: (v: string) => methodOptions.find((o) => o.value === v)?.label || v },
                  { title: '时间', dataIndex: 'created_at', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
                ]}
                dataSource={detailRow.payment_records || []}
              />
            )}

            <h4 style={{ marginTop: 20 }}>开票记录</h4>
            {(detailRow.invoices || []).length === 0 ? (
              <Empty description="暂无开票记录" />
            ) : (
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                columns={[
                  { title: '金额', dataIndex: 'total_amount', render: (v: number) => `¥${Number(v || 0).toLocaleString()}` },
                  { title: '发票号', dataIndex: 'invoice_no', render: (v: string) => v || '-' },
                  { title: '状态', dataIndex: 'status', render: (v: string) => ({ pending: '待开票', issued: '已开票', paid: '已付款', cancelled: '已作废' })[v] || v },
                  { title: '开票日期', dataIndex: 'issue_date', render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-') },
                ]}
                dataSource={detailRow.invoices || []}
              />
            )}
          </>
        )}
      </Drawer>
    </div>
  )
}