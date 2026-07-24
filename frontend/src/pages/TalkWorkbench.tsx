import { useState, useEffect } from 'react'
import { Tabs, Table, Button, Modal, Form, Input, Select, message, Tag, Space, Card, Badge, InputNumber, Divider, Timeline, Popconfirm, Progress, Alert } from 'antd'
import { UserOutlined, DollarOutlined, FileTextOutlined, HistoryOutlined, PlusOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { Lead, InviteTask, Opportunity, OpportunityStage, OpportunityQuoteItem, CaseType, SOPNodeStatus, OpportunitySOPProgress } from '../types'
import {
  getTodayArrivals,
  getPendingOpportunities,
  getSignedOpportunities,
  getLostOpportunities,
  createOpportunity,
  updateOpportunityStage,
  updateOpportunityInfo,
  addQuoteItem,
  deleteQuoteItem,
  convertToCase,
  markAsLost,
} from '../api/opportunity'
import { getOpportunitySOPProgress, completeNode, uncompleteNode } from '../api/talk-sop'

const { TabPane } = Tabs
const { TextArea } = Input

export default function TalkWorkbench() {
  const [activeTab, setActiveTab] = useState('today')
  const [todayArrivals, setTodayArrivals] = useState<InviteTask[]>([])
  const [pendingOpps, setPendingOpps] = useState<Opportunity[]>([])
  const [signedOpps, setSignedOpps] = useState<Opportunity[]>([])
  const [lostOpps, setLostOpps] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(false)

  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [currentOpp, setCurrentOpp] = useState<Opportunity | null>(null)
  const [createOppModalVisible, setCreateOppModalVisible] = useState(false)
  const [currentLead, setCurrentLead] = useState<Lead | null>(null)
  const [convertModalVisible, setConvertModalVisible] = useState(false)

  const [oppForm] = Form.useForm()
  const [convertForm] = Form.useForm()
  const [quoteForm] = Form.useForm()

  // SOP进度相关状态
  const [sopProgress, setSopProgress] = useState<OpportunitySOPProgress | null>(null)
  const [sopLoading, setSopLoading] = useState(false)

  const fetchTodayArrivals = async () => {
    setLoading(true)
    try {
      const data = await getTodayArrivals()
      setTodayArrivals(data)
    } catch (error) {
      message.error('获取今日到所列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingOpportunities = async () => {
    setLoading(true)
    try {
      const data = await getPendingOpportunities()
      setPendingOpps(data)
    } catch (error) {
      message.error('获取待跟进商机失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchSignedOpportunities = async () => {
    setLoading(true)
    try {
      const data = await getSignedOpportunities()
      setSignedOpps(data)
    } catch (error) {
      message.error('获取已签约商机失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchLostOpportunities = async () => {
    setLoading(true)
    try {
      const data = await getLostOpportunities()
      setLostOpps(data)
    } catch (error) {
      message.error('获取已流失商机失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'today') {
      fetchTodayArrivals()
    } else if (activeTab === 'pending') {
      fetchPendingOpportunities()
    } else if (activeTab === 'signed') {
      fetchSignedOpportunities()
    } else if (activeTab === 'lost') {
      fetchLostOpportunities()
    }
  }, [activeTab])

  const loadData = async () => {
    if (activeTab === 'today') {
      fetchTodayArrivals()
    } else if (activeTab === 'pending') {
      fetchPendingOpportunities()
    } else if (activeTab === 'signed') {
      fetchSignedOpportunities()
    } else if (activeTab === 'lost') {
      fetchLostOpportunities()
    }
  }

  // 获取案由显示文本
  const getCaseTypeText = (caseType?: string) => {
    const caseTypeMap: Record<string, string> = {
      marriage: '婚姻家事',
      traffic: '交通事故',
      labor: '劳动纠纷',
      debt: '债权债务',
      other: '其他',
    }
    return caseType ? caseTypeMap[caseType] || caseType : '-'
  }

  // 获取阶段显示文本和颜色
  const getStageTag = (stage: OpportunityStage) => {
    const stageMap: Record<OpportunityStage, { text: string; color: string }> = {
      [OpportunityStage.FIRST_CONTACT]: { text: '初次沟通', color: 'orange' },
      [OpportunityStage.REQUIREMENT_CONFIRM]: { text: '需求确认', color: 'blue' },
      [OpportunityStage.QUOTE_SENT]: { text: '方案报价', color: 'purple' },
      [OpportunityStage.FOLLOWING_UP]: { text: '跟进中', color: 'cyan' },
      [OpportunityStage.SIGNED]: { text: '已签约', color: 'green' },
      [OpportunityStage.LOST]: { text: '已流失', color: 'red' },
    }
    const config = stageMap[stage]
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 打开创建商机弹窗
  const openCreateOppModal = (lead: Lead) => {
    setCurrentLead(lead)
    setCreateOppModalVisible(true)
    oppForm.resetFields()
  }

  // 创建商机
  const handleCreateOpp = async () => {
    try {
      const values = await oppForm.validateFields()
      await createOpportunity({
        lead_id: currentLead!.id,
        requirement_note: values.requirement_note,
        plan_note: values.plan_note,
      })
      message.success('商机创建成功')
      setCreateOppModalVisible(false)
      loadData()
    } catch (error) {
      message.error('创建商机失败')
    }
  }

  // 打开商机详情弹窗
  const openDetailModal = async (opp: Opportunity) => {
    setCurrentOpp(opp)
    setDetailModalVisible(true)
    quoteForm.resetFields()
    
    // 加载SOP进度
    loadSOPProgress(opp.id)
  }

  // 加载SOP进度
  const loadSOPProgress = async (opportunityId: string) => {
    setSopLoading(true)
    try {
      const progress = await getOpportunitySOPProgress(opportunityId)
      setSopProgress(progress)
    } catch (error) {
      console.error('加载SOP进度失败', error)
      setSopProgress(null)
    } finally {
      setSopLoading(false)
    }
  }

  // 完成节点
  const handleCompleteNode = async (nodeId: string) => {
    if (!currentOpp) return
    try {
      const progress = await completeNode(currentOpp.id, nodeId)
      setSopProgress(progress)
      message.success('节点已完成')
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  // 取消完成节点
  const handleUncompleteNode = async (nodeId: string) => {
    if (!currentOpp) return
    try {
      const progress = await uncompleteNode(currentOpp.id, nodeId)
      setSopProgress(progress)
      message.success('已取消完成')
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  // 获取节点类型名称
  const getNodeTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      info_input: '信息录入',
      material_upload: '材料上传',
      compliance_check: '合规确认',
      signature_confirm: '签字确认',
    }
    return typeMap[type] || type
  }

  // 更新商机阶段
  const handleUpdateStage = async (stage: OpportunityStage) => {
    try {
      await updateOpportunityStage(currentOpp!.id, { stage })
      message.success('阶段更新成功')
      setCurrentOpp({ ...currentOpp!, stage })
      loadData()
    } catch (error) {
      message.error('阶段更新失败')
    }
  }

  // 更新商机信息
  const handleUpdateInfo = async (field: string, value: string) => {
    try {
      await updateOpportunityInfo(currentOpp!.id, { [field]: value })
      message.success('信息更新成功')
      setCurrentOpp({ ...currentOpp!, [field]: value })
    } catch (error) {
      message.error('信息更新失败')
    }
  }

  // 添加报价项
  const handleAddQuoteItem = async () => {
    try {
      const values = await quoteForm.validateFields()
      const updatedOpp = await addQuoteItem(currentOpp!.id, {
        item_name: values.item_name,
        amount: values.amount,
        item_description: values.item_description,
        quantity: values.quantity || 1,
        remark: values.remark,
      })
      message.success('报价项添加成功')
      setCurrentOpp(updatedOpp)
      quoteForm.resetFields()
    } catch (error) {
      message.error('添加报价项失败')
    }
  }

  // 删除报价项
  const handleDeleteQuoteItem = async (itemId: string) => {
    try {
      const updatedOpp = await deleteQuoteItem(currentOpp!.id, itemId)
      message.success('报价项删除成功')
      setCurrentOpp(updatedOpp)
    } catch (error) {
      message.error('删除报价项失败')
    }
  }

  // 打开签约转化弹窗
  const openConvertModal = () => {
    setConvertModalVisible(true)
    convertForm.resetFields()
    convertForm.setFieldsValue({
      case_type: currentOpp?.lead?.case_type,
      service_fee: currentOpp?.quote_amount,
    })
  }

  // 签约转化
  const handleConvert = async () => {
    try {
      const values = await convertForm.validateFields()
      await convertToCase(currentOpp!.id, {
        case_type: values.case_type,
        case_description: values.case_description,
        service_fee: values.service_fee,
      })
      message.success('立案申请成功')
      setConvertModalVisible(false)
      setDetailModalVisible(false)
      loadData()
    } catch (error) {
      message.error('立案申请失败')
    }
  }

  // 标记流失
  const handleMarkLost = async () => {
    try {
      await markAsLost(currentOpp!.id)
      message.success('已标记为流失')
      setDetailModalVisible(false)
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 今日到所列表列定义
  const todayColumns = [
    {
      title: '客户姓名',
      dataIndex: ['lead', 'contact_name'],
      key: 'contact_name',
      render: (text: string) => text || '-',
    },
    {
      title: '手机号',
      dataIndex: ['lead', 'phone'],
      key: 'phone',
    },
    {
      title: '案件类型',
      dataIndex: ['lead', 'case_type'],
      key: 'case_type',
      render: (caseType: CaseType) => getCaseTypeText(caseType),
    },
    {
      title: '到所时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: Date) => dayjs(date).format('HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InviteTask) => (
        <Button type="primary" size="small" onClick={() => openCreateOppModal(record.lead!)}>
          创建商机
        </Button>
      ),
    },
  ]

  // 待跟进商机列表列定义
  const pendingColumns = [
    {
      title: '客户姓名',
      dataIndex: ['lead', 'contact_name'],
      key: 'contact_name',
      render: (text: string) => text || '-',
    },
    {
      title: '手机号',
      dataIndex: ['lead', 'phone'],
      key: 'phone',
    },
    {
      title: '案件类型',
      dataIndex: ['lead', 'case_type'],
      key: 'case_type',
      render: (caseType: CaseType) => getCaseTypeText(caseType),
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: OpportunityStage) => getStageTag(stage),
    },
    {
      title: '报价金额',
      dataIndex: 'quote_amount',
      key: 'quote_amount',
      render: (amount: number) => amount ? `¥${amount.toLocaleString()}` : '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: Date) => dayjs(date).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Opportunity) => (
        <Button type="link" size="small" onClick={() => openDetailModal(record)}>
          查看
        </Button>
      ),
    },
  ]

  // 已签约/已流失列表列定义
  const completedColumns = [
    {
      title: '客户姓名',
      dataIndex: ['lead', 'contact_name'],
      key: 'contact_name',
      render: (text: string) => text || '-',
    },
    {
      title: '案件类型',
      dataIndex: ['lead', 'case_type'],
      key: 'case_type',
      render: (caseType: CaseType) => getCaseTypeText(caseType),
    },
    {
      title: '成交金额',
      dataIndex: 'actual_amount',
      key: 'actual_amount',
      render: (amount: number) => amount ? `¥${amount.toLocaleString()}` : '-',
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: OpportunityStage) => getStageTag(stage),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Opportunity) => (
        <Button type="link" size="small" onClick={() => openDetailModal(record)}>
          查看
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <Badge count={todayArrivals.length} offset={[10, 0]}>
                <span>今日到所</span>
              </Badge>
            }
            key="today"
          >
            <Table
              columns={todayColumns}
              dataSource={todayArrivals}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane
            tab={
              <Badge count={pendingOpps.length} offset={[10, 0]}>
                <span>待跟进</span>
              </Badge>
            }
            key="pending"
          >
            <Table
              columns={pendingColumns}
              dataSource={pendingOpps}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane
            tab={<span>已签约</span>}
            key="signed"
          >
            <Table
              columns={completedColumns}
              dataSource={signedOpps}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane
            tab={<span>已流失</span>}
            key="lost"
          >
            <Table
              columns={completedColumns}
              dataSource={lostOpps}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 创建商机弹窗 */}
      <Modal
        title="创建商机"
        open={createOppModalVisible}
        onCancel={() => setCreateOppModalVisible(false)}
        onOk={handleCreateOpp}
        width={600}
      >
        <Form form={oppForm} layout="vertical">
          <Form.Item label="客户信息">
            <div>
              <strong>姓名：</strong>{currentLead?.contact_name || '-'}
            </div>
            <div>
              <strong>手机：</strong>{currentLead?.phone}
            </div>
            <div>
              <strong>案件类型：</strong>{getCaseTypeText(currentLead?.case_type)}
            </div>
          </Form.Item>

          <Form.Item label="需求记录" name="requirement_note">
            <TextArea rows={4} placeholder="请输入客户需求记录" />
          </Form.Item>

          <Form.Item label="方案说明" name="plan_note">
            <TextArea rows={4} placeholder="请输入方案说明" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 商机详情弹窗 */}
      <Modal
        title="商机详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {currentOpp && (
          <div>
            {/* 基本信息 */}
            <Card title={<><UserOutlined /> 客户信息</>} size="small" style={{ marginBottom: 16 }}>
              <Space size="large">
                <div><strong>姓名：</strong>{currentOpp.lead?.contact_name || '-'}</div>
                <div><strong>手机：</strong>{currentOpp.lead?.phone}</div>
                <div><strong>案件类型：</strong>{getCaseTypeText(currentOpp.lead?.case_type)}</div>
                <div><strong>当前阶段：</strong>{getStageTag(currentOpp.stage)}</div>
              </Space>
            </Card>

            {/* 阶段更新 */}
            <Card title="阶段管理" size="small" style={{ marginBottom: 16 }}>
              <Space wrap>
                {Object.values(OpportunityStage).map(stage => (
                  <Button
                    key={stage}
                    type={currentOpp.stage === stage ? 'primary' : 'default'}
                    size="small"
                    onClick={() => handleUpdateStage(stage)}
                    disabled={currentOpp.stage === stage}
                  >
                    {getStageTag(stage)}
                  </Button>
                ))}
              </Space>
            </Card>

            {/* 需求与方案 */}
            <Card title={<><FileTextOutlined /> 需求与方案</>} size="small" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <strong>需求记录：</strong>
                <TextArea
                  value={currentOpp.requirement_note || ''}
                  onChange={(e) => setCurrentOpp({ ...currentOpp, requirement_note: e.target.value })}
                  onBlur={() => handleUpdateInfo('requirement_note', currentOpp.requirement_note || '')}
                  rows={3}
                  placeholder="请输入需求记录"
                />
              </div>
              <div>
                <strong>方案说明：</strong>
                <TextArea
                  value={currentOpp.plan_note || ''}
                  onChange={(e) => setCurrentOpp({ ...currentOpp, plan_note: e.target.value })}
                  onBlur={() => handleUpdateInfo('plan_note', currentOpp.plan_note || '')}
                  rows={3}
                  placeholder="请输入方案说明"
                />
              </div>
            </Card>

            {/* 报价方案 */}
            <Card
              title={<><DollarOutlined /> 报价方案</>}
              size="small"
              style={{ marginBottom: 16 }}
              extra={
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                  总金额：¥{(currentOpp.quote_amount || 0).toLocaleString()}
                </div>
              }
            >
              {/* 添加报价项 */}
              <Form form={quoteForm} layout="inline" style={{ marginBottom: 12 }}>
                <Form.Item name="item_name" rules={[{ required: true, message: '请输入项目名称' }]}>
                  <Input placeholder="项目名称" style={{ width: 150 }} />
                </Form.Item>
                <Form.Item name="amount" rules={[{ required: true, message: '请输入金额' }]}>
                  <InputNumber placeholder="金额" min={0} style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="quantity">
                  <InputNumber placeholder="数量" min={1} defaultValue={1} style={{ width: 80 }} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddQuoteItem}>
                    添加
                  </Button>
                </Form.Item>
              </Form>

              {/* 报价项列表 */}
              <Table
                dataSource={currentOpp.quote_items || []}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: '项目名称', dataIndex: 'item_name', key: 'item_name' },
                  { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${v.toLocaleString()}` },
                  { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                  {
                    title: '小计',
                    key: 'total',
                    render: (_: any, record: OpportunityQuoteItem) => `¥${(record.amount * record.quantity).toLocaleString()}`
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_: any, record: OpportunityQuoteItem) => (
                      <Popconfirm
                        title="确定删除此报价项？"
                        onConfirm={() => handleDeleteQuoteItem(record.id)}
                      >
                        <Button type="link" danger size="small" icon={<DeleteOutlined />} />
                      </Popconfirm>
                    ),
                  },
                ]}
              />
            </Card>

            {/* 阶段变更日志 */}
            {currentOpp.stage_logs && currentOpp.stage_logs.length > 0 && (
              <Card title={<><HistoryOutlined /> 阶段变更记录</>} size="small" style={{ marginBottom: 16 }}>
                <Timeline>
                  {currentOpp.stage_logs.map(log => (
                    <Timeline.Item key={log.id} color="blue">
                      <div>
                        <Tag>{getStageTag(log.from_stage)}</Tag>
                        →
                        <Tag color="green">{getStageTag(log.to_stage)}</Tag>
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {log.operator?.real_name} · {dayjs(log.created_at).format('MM-DD HH:mm')}
                        {log.remark && ` · ${log.remark}`}
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            )}

            {/* SOP进度 */}
            {sopProgress && sopProgress.sop && (
              <Card 
                title={<><CheckCircleOutlined /> SOP进度 - {sopProgress.sop.name}</>} 
                size="small" 
                style={{ marginBottom: 16 }}
                extra={
                  <Progress 
                    percent={sopProgress.completion_percentage} 
                    size="small" 
                    style={{ width: 120 }}
                    status={sopProgress.completion_percentage === 100 ? 'success' : 'active'}
                  />
                }
              >
                {sopProgress.has_incomplete_required_nodes && (
                  <Alert
                    message="存在未完成的强制节点，无法发起立案"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                )}

                {sopLoading ? (
                  <div style={{ textAlign: 'center', padding: 20 }}>加载中...</div>
                ) : (
                  <div>
                    {sopProgress.progress.map((node, index) => (
                      <div 
                        key={node.node_id}
                        style={{
                          padding: '8px 12px',
                          marginBottom: 8,
                          background: node.status === SOPNodeStatus.COMPLETED ? '#f6ffed' : '#fff',
                          border: node.is_required && node.status !== SOPNodeStatus.COMPLETED ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {node.status === SOPNodeStatus.COMPLETED ? (
                              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                            ) : (
                              <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />
                            )}
                            <span style={{ fontWeight: 500 }}>
                              {index + 1}. {node.node_name}
                            </span>
                            <Tag color="blue" style={{ marginLeft: 8 }}>{getNodeTypeName(node.node_type)}</Tag>
                            {node.is_required && (
                              <Tag color="red">强制</Tag>
                            )}
                          </div>
                          {node.description && (
                            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                              {node.description}
                            </div>
                          )}
                          {node.status === SOPNodeStatus.COMPLETED && (
                            <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>
                              完成人：{node.completed_by_name || '-'} · 完成时间：{node.completed_at ? dayjs(node.completed_at).format('MM-DD HH:mm') : '-'}
                            </div>
                          )}
                        </div>
                        <Button
                          type={node.status === SOPNodeStatus.COMPLETED ? 'default' : 'primary'}
                          size="small"
                          onClick={() => {
                            if (node.status === SOPNodeStatus.COMPLETED) {
                              handleUncompleteNode(node.node_id)
                            } else {
                              handleCompleteNode(node.node_id)
                            }
                          }}
                        >
                          {node.status === SOPNodeStatus.COMPLETED ? '取消完成' : '标记完成'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* 操作按钮 */}
            <Divider />
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Popconfirm
                title="确定标记为流失？"
                onConfirm={handleMarkLost}
              >
                <Button danger>标记流失</Button>
              </Popconfirm>
              <Button 
                type="primary" 
                onClick={openConvertModal}
                disabled={sopProgress?.has_incomplete_required_nodes}
              >
                发起立案
              </Button>
              {sopProgress?.has_incomplete_required_nodes && (
                <span style={{ color: '#ff4d4f', fontSize: 12 }}>
                  请先完成所有强制节点
                </span>
              )}
            </Space>
          </div>
        )}
      </Modal>

      {/* 签约转化弹窗 */}
      <Modal
        title="发起立案申请"
        open={convertModalVisible}
        onCancel={() => setConvertModalVisible(false)}
        onOk={handleConvert}
        width={600}
      >
        <Form form={convertForm} layout="vertical">
          <Form.Item label="客户信息">
            <div>
              <strong>姓名：</strong>{currentOpp?.lead?.contact_name || '-'}
            </div>
            <div>
              <strong>手机：</strong>{currentOpp?.lead?.phone}
            </div>
          </Form.Item>

          <Form.Item label="案件类型" name="case_type">
            <Select>
              <Select.Option value={CaseType.MARRIAGE}>婚姻家事</Select.Option>
              <Select.Option value={CaseType.TRAFFIC}>交通事故</Select.Option>
              <Select.Option value={CaseType.LABOR}>劳动纠纷</Select.Option>
              <Select.Option value={CaseType.DEBT}>债权债务</Select.Option>
              <Select.Option value={CaseType.OTHER}>其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="案件描述" name="case_description">
            <TextArea rows={3} placeholder="请输入案件描述" />
          </Form.Item>

          <Form.Item label="合同金额" name="service_fee">
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="请输入合同金额"
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}