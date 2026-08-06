import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Space, message, Tabs, Card, InputNumber, Popconfirm, Descriptions, Steps } from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'
import {
  getRefunds,
  createRefund,
  approveRefund,
  rejectRefund,
  RefundStatus,
  Refund,
} from '../api/refund'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'

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

// 审批状态标签映射
const statusTagMap: Record<string, { label: string; cls: string }> = {
  pending: { label: '待审批', cls: 'stitch-tag-warning' },
  approved: { label: '已通过', cls: 'stitch-tag-info' },
  rejected: { label: '已驳回', cls: 'stitch-tag-error' },
  completed: { label: '已完成', cls: 'stitch-tag-success' },
}

// 审批流转步骤
const getStepIndex = (status: string): number => {
  switch (status) {
    case RefundStatus.PENDING:
      return 0
    case RefundStatus.APPROVED:
      return 1
    case RefundStatus.COMPLETED:
      return 2
    case RefundStatus.REJECTED:
      return 1
    default:
      return 0
  }
}

export default function RefundManagement() {
  const [activeTab, setActiveTab] = useState('all')
  const [list, setList] = useState<Refund[]>([])
  const [loading, setLoading] = useState(false)
  const [applyModalVisible, setApplyModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [currentRefund, setCurrentRefund] = useState<Refund | null>(null)
  const [approvalNote, setApprovalNote] = useState('')
  const [form] = Form.useForm()
  // 查询条件
  const [searchKeyword, setSearchKeyword] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 拉取退费列表
  const fetchList = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {}
      if (user.organization_id) params.org_id = user.organization_id
      if (activeTab !== 'all') params.status = activeTab
      if (searchKeyword) params.keyword = searchKeyword
      const res = await getRefunds(params as Parameters<typeof getRefunds>[0]) as Refund[]
      setList(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // 打开发起退费弹窗
  const handleApply = () => {
    form.resetFields()
    setApplyModalVisible(true)
  }

  // 提交退费申请
  const handleSubmitApply = async (values: Record<string, unknown>) => {
    try {
      await createRefund({
        case_id: values.case_id as string,
        client_name: values.client_name as string,
        client_phone: values.client_phone as string,
        refund_amount: Number(values.refund_amount),
        reason: values.reason as string,
        organization_id: user.organization_id,
        applicant_id: user.id,
      })
      message.success('退费申请提交成功')
      setApplyModalVisible(false)
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 查看详情
  const handleViewDetail = (record: Refund) => {
    setCurrentRefund(record)
    setApprovalNote('')
    setDetailModalVisible(true)
  }

  // 审批通过
  const handleApprove = async () => {
    if (!currentRefund) return
    try {
      await approveRefund(currentRefund.id, {
        approver_id: user.id,
        approval_note: approvalNote,
      })
      message.success('审批通过')
      setDetailModalVisible(false)
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 驳回
  const handleReject = async () => {
    if (!currentRefund) return
    try {
      await rejectRefund(currentRefund.id, {
        approver_id: user.id,
        approval_note: approvalNote,
      })
      message.success('已驳回')
      setDetailModalVisible(false)
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 重置查询
  const handleReset = () => {
    setSearchKeyword('')
    fetchList()
  }

  const columns = [
    {
      title: '退费单号',
      dataIndex: 'refund_no',
      key: 'refund_no',
      render: (v: string) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.textBase }}>
          {v || '-'}
        </span>
      ),
    },
    { title: '客户姓名', dataIndex: 'client_name', key: 'client_name' },
    { title: '联系电话', dataIndex: 'client_phone', key: 'client_phone', render: (v: string) => v || '-' },
    { title: '关联案件', dataIndex: 'case_title', key: 'case_title', render: (v: string) => v || '-' },
    {
      title: '退费金额',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      render: (v: number) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.error }}>
          ¥{Number(v || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const item = statusTagMap[v]
        return item ? <span className={`stitch-tag ${item.cls}`}>{item.label}</span> : v
      },
    },
    {
      title: '申请人',
      dataIndex: 'applicant_name',
      key: 'applicant_name',
      render: (v: string) => v || '-',
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: Refund) => (
        <Space className="stitch-btn-group">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
        </Space>
      ),
    },
  ]

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: RefundStatus.PENDING, label: '待审批' },
    { key: RefundStatus.APPROVED, label: '已通过' },
    { key: RefundStatus.REJECTED, label: '已驳回' },
    { key: RefundStatus.COMPLETED, label: '已完成' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <h2 style={pageH2Style}>退费管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleApply}>发起退费</Button>
      </div>

      {/* 查询条件区 */}
      <div className="stitch-filter-bar">
        <Input
          placeholder="退费单号/客户名搜索"
          prefix={<SearchOutlined />}
          style={{ width: 240 }}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onPressEnter={fetchList}
        />
        <Space>
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchList}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems.map(t => ({ key: t.key, label: t.label }))}
      />

      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table<Refund>
          dataSource={list}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 发起退费弹窗 */}
      <Modal
        title="发起退费申请"
        open={applyModalVisible}
        onCancel={() => setApplyModalVisible(false)}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitApply}>
          <Form.Item name="client_name" label="客户姓名" rules={[{ required: true, message: '请输入客户姓名' }]}>
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
          <Form.Item name="client_phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="case_id" label="关联案件ID">
            <Input placeholder="请输入关联案件ID（可空）" />
          </Form.Item>
          <Form.Item name="refund_amount" label="退费金额" rules={[{ required: true, message: '请输入退费金额' }]}>
            <InputNumber
              placeholder="请输入退费金额"
              min={0}
              precision={2}
              style={{ width: '100%' }}
              addonBefore="¥"
            />
          </Form.Item>
          <Form.Item name="reason" label="退费原因" rules={[{ required: true, message: '请输入退费原因' }]}>
            <Input.TextArea placeholder="请输入退费原因" rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交申请</Button>
              <Button onClick={() => setApplyModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 退费详情弹窗 */}
      <Modal
        title="退费详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={640}
        footer={
          currentRefund?.status === RefundStatus.PENDING ? (
            <Space>
              <Input.TextArea
                placeholder="审批意见（可选）"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                style={{ width: 320, verticalAlign: 'middle' }}
                rows={1}
              />
              <Popconfirm title="确认审批通过该退费申请？" onConfirm={handleApprove}>
                <Button type="primary" icon={<CheckOutlined />}>通过</Button>
              </Popconfirm>
              <Popconfirm title="确认驳回该退费申请？" onConfirm={handleReject}>
                <Button danger icon={<CloseOutlined />}>驳回</Button>
              </Popconfirm>
            </Space>
          ) : null
        }
      >
        {currentRefund && (
          <>
            {/* 审批状态流转展示 */}
            <div style={{ marginBottom: 24 }}>
              <Steps
                size="small"
                current={getStepIndex(currentRefund.status)}
                status={currentRefund.status === RefundStatus.REJECTED ? 'error' : 'process'}
                items={[
                  { title: '提交申请' },
                  { title: currentRefund.status === RefundStatus.REJECTED ? '已驳回' : '审批通过' },
                  { title: '退费完成' },
                ]}
              />
            </div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="退费单号">{currentRefund.refund_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const item = statusTagMap[currentRefund.status]
                  return item ? <span className={`stitch-tag ${item.cls}`}>{item.label}</span> : currentRefund.status
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="客户姓名">{currentRefund.client_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentRefund.client_phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="关联案件">{currentRefund.case_title || '-'}</Descriptions.Item>
              <Descriptions.Item label="退费金额">
                <span style={{ color: theme.error, fontWeight: 600 }}>
                  ¥{Number(currentRefund.refund_amount || 0).toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="申请人">{currentRefund.applicant_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="申请时间">{formatDateTime(currentRefund.created_at)}</Descriptions.Item>
              <Descriptions.Item label="审批人">{currentRefund.approver_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="审批时间">{formatDateTime(currentRefund.approved_at || '')}</Descriptions.Item>
              <Descriptions.Item label="退费原因" span={2}>{currentRefund.reason}</Descriptions.Item>
              {currentRefund.approval_note && (
                <Descriptions.Item label="审批意见" span={2}>{currentRefund.approval_note}</Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  )
}
