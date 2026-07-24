import { useState, useEffect } from 'react'
import { Modal, Form, Select, Input, Table, Tabs, message, Tag, Checkbox } from 'antd'
import { UserOutlined, FileTextOutlined, SolutionOutlined } from '@ant-design/icons'
import { getUserAssets, batchTransfer } from '../api/handover'
import { HandoverType } from '../types'
import { formatDateTime } from '../utils/format'

interface HandoverModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
  fromUser: any
  users: any[]
}

export default function HandoverModal({ visible, onCancel, onSuccess, fromUser, users }: HandoverModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [assets, setAssets] = useState<any>({
    leads: [],
    opportunities: [],
    cases: [],
    stats: { leadCount: 0, opportunityCount: 0, caseCount: 0 },
  })
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([])
  const [selectedCases, setSelectedCases] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('leads')

  useEffect(() => {
    if (visible && fromUser) {
      fetchUserAssets()
    }
  }, [visible, fromUser])

  const fetchUserAssets = async () => {
    if (!fromUser?.id) return

    setAssetsLoading(true)
    try {
      const res = await getUserAssets(fromUser.id)
      setAssets(res.data || {
        leads: [],
        opportunities: [],
        cases: [],
        stats: { leadCount: 0, opportunityCount: 0, caseCount: 0 },
      })
      // 默认全选
      const leads = res.data?.leads || []
      const opportunities = res.data?.opportunities || []
      const cases = res.data?.cases || []
      setSelectedLeads(leads.map((l: any) => l.id))
      setSelectedOpportunities(opportunities.map((o: any) => o.id))
      setSelectedCases(cases.map((c: any) => c.id))
    } catch (error) {
      console.error('Fetch user assets error:', error)
      message.error('获取用户资产失败')
    } finally {
      setAssetsLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (selectedLeads.length === 0 && selectedOpportunities.length === 0 && selectedCases.length === 0) {
        message.warning('请至少选择一项要交接的数据')
        return
      }

      setLoading(true)
      await batchTransfer({
        from_user_id: fromUser.id,
        to_user_id: values.to_user_id,
        handover_type: values.handover_type,
        lead_ids: selectedLeads,
        opportunity_ids: selectedOpportunities,
        case_ids: selectedCases,
        handover_note: values.handover_note,
      })

      message.success('交接成功')
      form.resetFields()
      onSuccess()
    } catch (error) {
      console.error('Handover error:', error)
      message.error('交接失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setSelectedLeads([])
    setSelectedOpportunities([])
    setSelectedCases([])
    onCancel()
  }

  const leadColumns = [
    {
      title: '客户姓名',
      dataIndex: 'contact_name',
      key: 'contact_name',
      render: (val: string) => val || '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          new: { color: 'blue', text: '新线索' },
          pending_follow: { color: 'orange', text: '待跟进' },
          following: { color: 'processing', text: '跟进中' },
          negotiating: { color: 'cyan', text: '谈判中' },
        }
        const config = statusMap[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => formatDateTime(val),
    },
  ]

  const opportunityColumns = [
    {
      title: '商机阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => {
        const stageMap: Record<string, string> = {
          first_contact: '初次沟通',
          requirement_confirm: '需求确认',
          quote_sent: '方案报价',
          following_up: '跟进中',
          signed: '已签约',
          lost: '已流失',
        }
        return stageMap[stage] || stage
      },
    },
    {
      title: '报价金额',
      dataIndex: 'quote_amount',
      key: 'quote_amount',
      render: (val: number) => val ? `¥${val.toLocaleString()}` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: '活跃' },
          completed: { color: 'blue', text: '已完成' },
        }
        const config = statusMap[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => formatDateTime(val),
    },
  ]

  const caseColumns = [
    {
      title: '客户姓名',
      dataIndex: 'client_name',
      key: 'client_name',
      render: (val: string) => val || '-',
    },
    {
      title: '案件类型',
      dataIndex: 'case_type',
      key: 'case_type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          marriage: '婚姻家事',
          traffic: '交通事故',
          labor: '劳动纠纷',
          debt: '债权债务',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending_assign: { color: 'orange', text: '待分配' },
          processing: { color: 'blue', text: '办理中' },
          closed: { color: 'green', text: '已结案' },
        }
        const config = statusMap[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => formatDateTime(val),
    },
  ]

  const filteredUsers = users.filter((u: any) => u.id !== fromUser?.id && u.role !== 'client')

  return (
    <Modal
      title="客户资产交接"
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText="确认交接"
      cancelText="取消"
      width={900}
      confirmLoading={loading}
      style={{ borderRadius: 20 }}
    >
      <div style={{ padding: '16px 0' }}>
        <div style={{
          padding: 16,
          background: '#f5f5f7',
          borderRadius: 12,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, color: '#86868b', marginBottom: 8 }}>交接人信息</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>
            {fromUser?.real_name} ({fromUser?.phone})
          </div>
          <div style={{ fontSize: 13, color: '#86868b', marginTop: 8 }}>
            资产统计：
            <span style={{ marginLeft: 8, color: '#0071e3' }}>
              线索 {assets.stats.leadCount} 条
            </span>
            <span style={{ marginLeft: 12, color: '#0071e3' }}>
              商机 {assets.stats.opportunityCount} 个
            </span>
            <span style={{ marginLeft: 12, color: '#0071e3' }}>
              案件 {assets.stats.caseCount} 个
            </span>
          </div>
        </div>

        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="to_user_id"
              label="接收人"
              rules={[{ required: true, message: '请选择接收人' }]}
            >
              <Select
                placeholder="请选择接收人"
                style={{ borderRadius: 10 }}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {filteredUsers.map((user: any) => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.real_name} ({user.phone})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="handover_type"
              label="交接类型"
              rules={[{ required: true, message: '请选择交接类型' }]}
              initialValue={HandoverType.TRANSFER}
            >
              <Select style={{ borderRadius: 10 }}>
                <Select.Option value={HandoverType.RESIGNATION}>离职交接</Select.Option>
                <Select.Option value={HandoverType.TRANSFER}>调岗交接</Select.Option>
                <Select.Option value={HandoverType.BATCH}>批量移交</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="handover_note" label="交接说明">
            <Input.TextArea
              placeholder="请输入交接说明（选填）"
              rows={3}
              style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
            />
          </Form.Item>
        </Form>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 12 }}>
            选择要交接的数据
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'leads',
                label: (
                  <span>
                    <UserOutlined style={{ marginRight: 6 }} />
                    线索 ({selectedLeads.length}/{assets.leads.length})
                  </span>
                ),
                children: (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: 12 }}>
                      <Checkbox
                        checked={selectedLeads.length === assets.leads.length && assets.leads.length > 0}
                        indeterminate={selectedLeads.length > 0 && selectedLeads.length < assets.leads.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads(assets.leads.map((l: any) => l.id))
                          } else {
                            setSelectedLeads([])
                          }
                        }}
                      >
                        全选
                      </Checkbox>
                    </div>
                    <Table
                      dataSource={assets.leads}
                      columns={leadColumns}
                      rowKey="id"
                      loading={assetsLoading}
                      size="small"
                      pagination={false}
                      scroll={{ y: 200 }}
                      rowSelection={{
                        selectedRowKeys: selectedLeads,
                        onChange: (keys) => setSelectedLeads(keys as string[]),
                      }}
                    />
                  </div>
                ),
              },
              {
                key: 'opportunities',
                label: (
                  <span>
                    <FileTextOutlined style={{ marginRight: 6 }} />
                    商机 ({selectedOpportunities.length}/{assets.opportunities.length})
                  </span>
                ),
                children: (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: 12 }}>
                      <Checkbox
                        checked={selectedOpportunities.length === assets.opportunities.length && assets.opportunities.length > 0}
                        indeterminate={selectedOpportunities.length > 0 && selectedOpportunities.length < assets.opportunities.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOpportunities(assets.opportunities.map((o: any) => o.id))
                          } else {
                            setSelectedOpportunities([])
                          }
                        }}
                      >
                        全选
                      </Checkbox>
                    </div>
                    <Table
                      dataSource={assets.opportunities}
                      columns={opportunityColumns}
                      rowKey="id"
                      loading={assetsLoading}
                      size="small"
                      pagination={false}
                      scroll={{ y: 200 }}
                      rowSelection={{
                        selectedRowKeys: selectedOpportunities,
                        onChange: (keys) => setSelectedOpportunities(keys as string[]),
                      }}
                    />
                  </div>
                ),
              },
              {
                key: 'cases',
                label: (
                  <span>
                    <SolutionOutlined style={{ marginRight: 6 }} />
                    案件 ({selectedCases.length}/{assets.cases.length})
                  </span>
                ),
                children: (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: 12 }}>
                      <Checkbox
                        checked={selectedCases.length === assets.cases.length && assets.cases.length > 0}
                        indeterminate={selectedCases.length > 0 && selectedCases.length < assets.cases.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCases(assets.cases.map((c: any) => c.id))
                          } else {
                            setSelectedCases([])
                          }
                        }}
                      >
                        全选
                      </Checkbox>
                    </div>
                    <Table
                      dataSource={assets.cases}
                      columns={caseColumns}
                      rowKey="id"
                      loading={assetsLoading}
                      size="small"
                      pagination={false}
                      scroll={{ y: 200 }}
                      rowSelection={{
                        selectedRowKeys: selectedCases,
                        onChange: (keys) => setSelectedCases(keys as string[]),
                      }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </Modal>
  )
}