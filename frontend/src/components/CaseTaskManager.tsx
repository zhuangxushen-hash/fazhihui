import { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Progress, Tag, Space, message, Tabs, Timeline, Upload, Slider, DatePicker, Badge, Empty, Spin } from 'antd'
import { PlusOutlined, CommentOutlined, UploadOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

interface Props {
  caseId: string
}

interface Task {
  id: string
  task_name: string
  stage_name: string
  stage_order: number
  status: string
  priority: string
  progress: number
  deadline: string
  assignee_id: string
  description: string
  created_at: string
  completed_at: string
}

interface Comment {
  id: string
  type: string
  content: string
  file_url: string
  file_name: string
  created_at: string
  user?: { real_name: string }
}

export default function CaseTaskManager({ caseId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>({})
  const [detailVisible, setDetailVisible] = useState(false)
  const [addTaskVisible, setAddTaskVisible] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [users, setUsers] = useState<any[]>([])

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchTasks()
    fetchUsers()
  }, [caseId])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const [tasksRes, statsRes] = await Promise.all([
        axios.get(`/case-tasks/case/${caseId}`),
        axios.get(`/case-tasks/case/${caseId}/statistics`)
      ])
      setTasks(tasksRes.data || [])
      setStats(statsRes.data || {})
    } catch (error) {
      console.error('Fetch tasks error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users', { params: { org_id: user.organization_id } })
      setUsers(res.data || [])
    } catch (error) {
      console.error('Fetch users error:', error)
    }
  }

  const handleViewDetail = async (task: Task) => {
    setCurrentTask(task)
    setDetailVisible(true)
    try {
      const res = await axios.get(`/case-tasks/${task.id}/comments`)
      setComments(res.data || [])
    } catch (error) {
      setComments([])
    }
  }

  const handleAddTask = () => {
    setAddTaskVisible(true)
  }

  const handleSubmitTask = async (values: any) => {
    try {
      await axios.post('/case-tasks', {
        ...values,
        case_id: caseId,
      })
      message.success('任务创建成功')
      setAddTaskVisible(false)
      fetchTasks()
    } catch (error) {
      message.error('任务创建失败')
    }
  }

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      await axios.put(`/case-tasks/${taskId}/status`, { status })
      message.success('状态更新成功')
      fetchTasks()
    } catch (error) {
      message.error('状态更新失败')
    }
  }

  const handleAssignTask = async (taskId: string, assigneeId: string) => {
    try {
      await axios.put(`/case-tasks/${taskId}/assign`, { assignee_id: assigneeId })
      message.success('任务指派成功')
      fetchTasks()
    } catch (error) {
      message.error('任务指派失败')
    }
  }

  const handleUpdateProgress = async (taskId: string, progress: number) => {
    try {
      await axios.put(`/case-tasks/${taskId}/progress`, { progress })
      message.success('进度更新成功')
      fetchTasks()
    } catch (error) {
      message.error('进度更新失败')
    }
  }

  const handleAddComment = async (taskId: string, content: string) => {
    try {
      await axios.post(`/case-tasks/${taskId}/comments`, { content })
      const res = await axios.get(`/case-tasks/${taskId}/comments`)
      setComments(res.data || [])
      message.success('评论添加成功')
    } catch (error) {
      message.error('评论添加失败')
    }
  }

  const handleUploadResult = async (taskId: string, file: any) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await axios.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      await axios.post(`/case-tasks/${taskId}/results`, {
        file_url: uploadRes.url,
        file_name: file.name,
        file_type: file.type,
        content: `上传成果: ${file.name}`
      })

      const res = await axios.get(`/case-tasks/${taskId}/comments`)
      setComments(res.data || [])
      message.success('成果上传成功')
    } catch (error) {
      message.error('成果上传失败')
    }
    return false
  }

  const statusColors: Record<string, string> = {
    pending: 'default',
    in_progress: 'processing',
    completed: 'success',
    verified: 'green',
    overdue: 'red',
    cancelled: 'default',
  }

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    verified: '已验收',
    overdue: '已超期',
    cancelled: '已取消',
  }

  const priorityColors: Record<string, string> = {
    low: 'default',
    medium: 'blue',
    high: 'orange',
    urgent: 'red',
  }

  const priorityLabels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      width: 200,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: '所属阶段',
      dataIndex: 'stage_name',
      key: 'stage_name',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => (
        <Tag color={priorityColors[priority]}>{priorityLabels[priority]}</Tag>
      )
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      )
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 110,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Task) => (
        <Space size="small">
          <Button size="small" onClick={() => handleViewDetail(record)}>详情</Button>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <span style={{ marginRight: 16 }}>
            总进度: <Progress percent={stats.progress || 0} size="small" style={{ width: 150 }} />
          </span>
          <span style={{ marginRight: 16 }}>
            总数: <Badge count={stats.total || 0} style={{ backgroundColor: '#1890ff' }} />
          </span>
          <span style={{ marginRight: 16 }}>
            已完成: <Badge count={stats.completed || 0} style={{ backgroundColor: '#52c41a' }} />
          </span>
          <span style={{ marginRight: 16 }}>
            进行中: <Badge count={stats.in_progress || 0} style={{ backgroundColor: '#faad14' }} />
          </span>
          <span>
            超期: <Badge count={stats.overdue || 0} style={{ backgroundColor: '#ff4d4f' }} />
          </span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTask}>新增任务</Button>
      </div>

      <Spin spinning={loading}>
        {tasks.length === 0 ? (
          <Empty description="暂无任务" />
        ) : (
          <Table
            dataSource={tasks}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}
      </Spin>

      {/* 任务详情弹窗 */}
      <Modal
        title={`任务详情 - ${currentTask?.task_name}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {currentTask && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <Card size="small">
                  <div style={{ fontSize: 12, color: '#86868b', marginBottom: 4 }}>状态</div>
                  <Select
                    value={currentTask.status}
                    style={{ width: '100%' }}
                    onChange={(value) => handleUpdateStatus(currentTask.id, value)}
                  >
                    <Select.Option value="pending">待处理</Select.Option>
                    <Select.Option value="in_progress">进行中</Select.Option>
                    <Select.Option value="completed">已完成</Select.Option>
                    <Select.Option value="verified">已验收</Select.Option>
                    <Select.Option value="cancelled">已取消</Select.Option>
                  </Select>
                </Card>
                <Card size="small">
                  <div style={{ fontSize: 12, color: '#86868b', marginBottom: 4 }}>优先级</div>
                  <Tag color={priorityColors[currentTask.priority]}>{priorityLabels[currentTask.priority]}</Tag>
                </Card>
                <Card size="small">
                  <div style={{ fontSize: 12, color: '#86868b', marginBottom: 4 }}>进度</div>
                  <Slider
                    value={currentTask.progress}
                    onChange={(value) => {
                      setCurrentTask({ ...currentTask, progress: value })
                      handleUpdateProgress(currentTask.id, value)
                    }}
                  />
                </Card>
                <Card size="small">
                  <div style={{ fontSize: 12, color: '#86868b', marginBottom: 4 }}>指派人</div>
                  <Select
                    value={currentTask.assignee_id}
                    style={{ width: '100%' }}
                    placeholder="选择指派人"
                    onChange={(value) => handleAssignTask(currentTask.id, value)}
                  >
                    {users.map(u => (
                      <Select.Option key={u.id} value={u.id}>{u.real_name}</Select.Option>
                    ))}
                  </Select>
                </Card>
              </div>

              <Card size="small" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#86868b', marginBottom: 8 }}>描述</div>
                <div>{currentTask.description || '无描述'}</div>
              </Card>
            </div>

            <Tabs
              items={[
                {
                  key: 'comments',
                  label: '评论与成果',
                  icon: <CommentOutlined />,
                  children: (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <Input.TextArea
                          placeholder="添加评论..."
                          rows={2}
                          onPressEnter={(e) => {
                            const content = (e.target as HTMLTextAreaElement).value
                            if (content.trim()) {
                              handleAddComment(currentTask.id, content)
                              ;(e.target as HTMLTextAreaElement).value = ''
                            }
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <Upload
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          showUploadList={false}
                          beforeUpload={(file) => handleUploadResult(currentTask.id, file)}
                        >
                          <Button icon={<UploadOutlined />}>上传成果</Button>
                        </Upload>
                      </div>

                      <Timeline
                        items={comments.map(comment => ({
                          color: comment.type === 'result' ? 'green' : 'blue',
                          children: (
                            <div>
                              <div style={{ fontSize: 12, color: '#86868b', marginBottom: 4 }}>
                                {comment.user?.real_name || '系统'} - {formatDateTime(comment.created_at)}
                              </div>
                              <div>{comment.content}</div>
                              {comment.file_url && (
                                <div style={{ marginTop: 8 }}>
                                  <Button
                                    size="small"
                                    onClick={() => window.open(comment.file_url)}
                                  >
                                    {comment.file_name}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )
                        }))}
                      />
                    </div>
                  )
                }
              ]}
            />
          </div>
        )}
      </Modal>

      {/* 新增任务弹窗 */}
      <Modal
        title="新增任务"
        open={addTaskVisible}
        onCancel={() => setAddTaskVisible(false)}
        footer={null}
      >
        <Form onFinish={handleSubmitTask} layout="vertical">
          <Form.Item name="task_name" label="任务名称" rules={[{ required: true }]}>
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item name="stage_name" label="所属阶段">
            <Input placeholder="请输入所属阶段" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <Input.TextArea placeholder="请输入任务描述" rows={3} />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="medium">
            <Select>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="urgent">紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="deadline" label="截止时间">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="responsible_role" label="责任人角色">
            <Input placeholder="请输入责任人角色" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">创建任务</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}