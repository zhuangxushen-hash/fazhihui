import { useState, useEffect } from 'react'
import { Tabs, Table, Button, Modal, Form, Input, Select, DatePicker, Upload, message, Tag, Space, Card, Badge } from 'antd'
import { PhoneOutlined, WechatOutlined, UploadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { Lead, InviteTask, InviteMethod, InviteTaskStatus, InviteResult, CaseType } from '../types'
import { getPendingLeads, getTodayTasks, getInvitedTasks, getHistoryTasks, createInviteTask, updateTaskStatus } from '../api/invite'

const { TabPane } = Tabs
const { TextArea } = Input

export default function InviteWorkbench() {
  const [activeTab, setActiveTab] = useState('pending')
  const [pendingLeads, setPendingLeads] = useState<Lead[]>([])
  const [todayTasks, setTodayTasks] = useState<InviteTask[]>([])
  const [invitedTasks, setInvitedTasks] = useState<InviteTask[]>([])
  const [historyTasks, setHistoryTasks] = useState<InviteTask[]>([])
  const [loading, setLoading] = useState(false)
  const [followModalVisible, setFollowModalVisible] = useState(false)
  const [currentLead, setCurrentLead] = useState<Lead | null>(null)
  const [form] = Form.useForm()

  const fetchPendingLeads = async () => {
    setLoading(true)
    try {
      const data = await getPendingLeads()
      setPendingLeads(data)
    } catch (error) {
      message.error('获取待跟进列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayTasks = async () => {
    setLoading(true)
    try {
      const data = await getTodayTasks()
      setTodayTasks(data)
    } catch (error) {
      message.error('获取今日任务失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitedTasks = async () => {
    setLoading(true)
    try {
      const data = await getInvitedTasks()
      setInvitedTasks(data)
    } catch (error) {
      message.error('获取已邀约列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistoryTasks = async () => {
    setLoading(true)
    try {
      const data = await getHistoryTasks()
      setHistoryTasks(data)
    } catch (error) {
      message.error('获取历史记录失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingLeads()
    } else if (activeTab === 'today') {
      fetchTodayTasks()
    } else if (activeTab === 'invited') {
      fetchInvitedTasks()
    } else if (activeTab === 'history') {
      fetchHistoryTasks()
    }
  }, [activeTab])

  const loadData = async () => {
    if (activeTab === 'pending') {
      fetchPendingLeads()
    } else if (activeTab === 'today') {
      fetchTodayTasks()
    } else if (activeTab === 'invited') {
      fetchInvitedTasks()
    } else if (activeTab === 'history') {
      fetchHistoryTasks()
    }
  }

  // 打开跟进弹窗
  const openFollowModal = (lead: Lead) => {
    setCurrentLead(lead)
    setFollowModalVisible(true)
    form.resetFields()
  }

  // 提交跟进记录
  const handleSubmitFollow = async () => {
    try {
      const values = await form.validateFields()
      await createInviteTask({
        leadId: currentLead!.id,
        inviteMethod: values.inviteMethod,
        scheduledTime: values.scheduledTime ? dayjs(values.scheduledTime).toDate() : undefined,
        result: values.result,
        resultNote: values.resultNote,
        recordingUrl: values.recordingUrl,
      })
      message.success('跟进成功')
      setFollowModalVisible(false)
      loadData()
    } catch (error) {
      message.error('跟进失败')
    }
  }

  // 更新任务状态
  const handleUpdateStatus = async (taskId: string, status: InviteTaskStatus, resultNote?: string) => {
    try {
      await updateTaskStatus(taskId, { status, resultNote })
      message.success('状态更新成功')
      loadData()
    } catch (error) {
      message.error('状态更新失败')
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

  // 获取状态显示文本和颜色
  const getStatusTag = (status: InviteTaskStatus) => {
    const statusMap: Record<InviteTaskStatus, { text: string; color: string }> = {
      [InviteTaskStatus.PENDING]: { text: '待跟进', color: 'orange' },
      [InviteTaskStatus.INVITED]: { text: '已邀约', color: 'blue' },
      [InviteTaskStatus.ARRIVED]: { text: '已到所', color: 'green' },
      [InviteTaskStatus.NOT_ARRIVED]: { text: '未到所', color: 'red' },
    }
    const config = statusMap[status]
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 待跟进列表列定义
  const pendingColumns = [
    {
      title: '客户姓名',
      dataIndex: 'contact_name',
      key: 'contact_name',
      render: (text: string) => text || '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '案件类型',
      dataIndex: 'case_type',
      key: 'case_type',
      render: (caseType: CaseType) => getCaseTypeText(caseType),
    },
    {
      title: '分配时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Lead) => (
        <Button type="primary" size="small" onClick={() => openFollowModal(record)}>
          快速跟进
        </Button>
      ),
    },
  ]

  // 今日任务列表列定义
  const todayColumns = [
    {
      title: '客户姓名',
      dataIndex: ['lead', 'contact_name'],
      key: 'contact_name',
      render: (text: string) => text || '-',
    },
    {
      title: '预约时间',
      dataIndex: 'scheduled_time',
      key: 'scheduled_time',
      render: (date: Date) => dayjs(date).format('HH:mm'),
    },
    {
      title: '联系方式',
      dataIndex: ['lead', 'phone'],
      key: 'phone',
    },
    {
      title: '提醒状态',
      key: 'remind',
      render: () => (
        <Tag color="green">
          <CheckCircleOutlined /> 已提醒
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InviteTask) => (
        <Space>
          <Button size="small" onClick={() => handleUpdateStatus(record.id, InviteTaskStatus.ARRIVED)}>
            已到所
          </Button>
          <Button size="small" danger onClick={() => handleUpdateStatus(record.id, InviteTaskStatus.NOT_ARRIVED)}>
            未到所
          </Button>
        </Space>
      ),
    },
  ]

  // 已邀约列表列定义
  const invitedColumns = [
    {
      title: '客户姓名',
      dataIndex: ['lead', 'contact_name'],
      key: 'contact_name',
      render: (text: string) => text || '-',
    },
    {
      title: '邀约时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '预约到所时间',
      dataIndex: 'scheduled_time',
      key: 'scheduled_time',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: InviteTaskStatus) => getStatusTag(status),
    },
  ]

  // 历史记录列表列定义
  const historyColumns = [
    {
      title: '客户姓名',
      dataIndex: ['lead', 'contact_name'],
      key: 'contact_name',
      render: (text: string) => text || '-',
    },
    {
      title: '邀约方式',
      dataIndex: 'invite_method',
      key: 'invite_method',
      render: (method: InviteMethod) => (
        method === InviteMethod.PHONE ? <PhoneOutlined /> : <WechatOutlined />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: InviteTaskStatus) => getStatusTag(status),
    },
    {
      title: '备注',
      dataIndex: 'result_note',
      key: 'result_note',
      render: (text: string) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ]

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <Badge count={pendingLeads.length} offset={[10, 0]}>
                <span>待跟进</span>
              </Badge>
            }
            key="pending"
          >
            <Table
              columns={pendingColumns}
              dataSource={pendingLeads}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane
            tab={
              <Badge count={todayTasks.length} offset={[10, 0]}>
                <span>今日任务</span>
              </Badge>
            }
            key="today"
          >
            <Table
              columns={todayColumns}
              dataSource={todayTasks}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </TabPane>

          <TabPane
            tab={
              <Badge count={invitedTasks.length} offset={[10, 0]}>
                <span>已邀约</span>
              </Badge>
            }
            key="invited"
          >
            <Table
              columns={invitedColumns}
              dataSource={invitedTasks}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab="历史记录" key="history">
            <Table
              columns={historyColumns}
              dataSource={historyTasks}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 跟进弹窗 */}
      <Modal
        title="跟进记录"
        open={followModalVisible}
        onCancel={() => setFollowModalVisible(false)}
        onOk={handleSubmitFollow}
        width={600}
      >
        <Form form={form} layout="vertical">
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

          <Form.Item
            label="邀约方式"
            name="inviteMethod"
            rules={[{ required: true, message: '请选择邀约方式' }]}
          >
            <Select>
              <Select.Option value={InviteMethod.PHONE}>
                <PhoneOutlined /> 电话
              </Select.Option>
              <Select.Option value={InviteMethod.WECHAT}>
                <WechatOutlined /> 微信
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="预约时间"
            name="scheduledTime"
            rules={[{ required: false }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="跟进结果"
            name="result"
            rules={[{ required: true, message: '请选择跟进结果' }]}
          >
            <Select>
              <Select.Option value={InviteResult.SUCCESS}>成功邀约</Select.Option>
              <Select.Option value={InviteResult.NO_INTENTION}>暂无意向</Select.Option>
              <Select.Option value={InviteResult.INVALID}>无效线索</Select.Option>
              <Select.Option value={InviteResult.FOLLOW_UP}>继续跟进</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="备注说明" name="resultNote">
            <TextArea rows={4} placeholder="请输入跟进备注" />
          </Form.Item>

          <Form.Item label="录音上传" name="recordingUrl">
            <Upload>
              <Button icon={<UploadOutlined />}>上传录音</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}