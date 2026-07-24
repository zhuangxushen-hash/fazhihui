import { useState, useEffect } from 'react'
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Select,
  Space,
  message,
  DatePicker,
  Card,
  Statistic,
  Row,
  Col,
  Popconfirm,
} from 'antd'
import { ReloadOutlined, UserSwitchOutlined, TeamOutlined } from '@ant-design/icons'
import {
  getLeadPoolList,
  getLeadPoolStatistics,
  takeLeadFromPool,
  batchTakeLeadsFromPool,
  batchAssignLeadsFromPool,
  getAvailableUsers,
  LeadPool,
} from '../api/lead'
import { formatDateTime } from '../utils/format'
import { RecycleReason, LeadPoolStatus, CaseType } from '../types'

const { RangePicker } = DatePicker

export default function LeadPoolPage() {
  const [data, setData] = useState<LeadPool[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [statistics, setStatistics] = useState({
    total: 0,
    available: 0,
    taken: 0,
    discarded: 0,
  })
  const [filters, setFilters] = useState({
    status: '',
    case_type: '',
    recycle_reason: '',
    start_date: '',
    end_date: '',
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'super_admin' || user.role === 'org_admin'

  useEffect(() => {
    fetchData()
    fetchStatistics()
    if (isAdmin) {
      fetchUsers()
    }
  }, [])

  const fetchData = async (page = 1, limit = 20) => {
    setLoading(true)
    try {
      const params: any = {
        page,
        limit,
        ...filters,
      }
      const res = await getLeadPoolList(params)
      setData(res.data || [])
      setTotal(res.total || 0)
      setPagination({ current: page, pageSize: limit })
    } catch (error) {
      console.error('Fetch lead pool error:', error)
      message.error('获取公海池数据失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const res = await getLeadPoolStatistics()
      setStatistics(res)
    } catch (error) {
      console.error('Fetch statistics error:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await getAvailableUsers()
      setUsers(res.data || [])
    } catch (error) {
      console.error('Fetch users error:', error)
    }
  }

  const handleSearch = () => {
    fetchData(1, pagination.pageSize)
  }

  const handleReset = () => {
    setFilters({
      status: '',
      case_type: '',
      recycle_reason: '',
      start_date: '',
      end_date: '',
    })
    fetchData(1, pagination.pageSize)
  }

  const handleTake = async (record: LeadPool) => {
    try {
      await takeLeadFromPool(record.id)
      message.success('领取成功')
      fetchData(pagination.current, pagination.pageSize)
      fetchStatistics()
    } catch (error: any) {
      message.error(error.response?.data?.message || '领取失败')
    }
  }

  const handleAssign = async (userId: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要分配的线索')
      return
    }

    try {
      const res = await batchAssignLeadsFromPool(selectedRowKeys as string[], userId)
      message.success(`成功分配 ${res.success} 条线索`)
      if (res.failed.length > 0) {
        message.warning(`${res.failed.length} 条线索分配失败`)
      }
      setSelectedRowKeys([])
      setAssignModalVisible(false)
      fetchData(pagination.current, pagination.pageSize)
      fetchStatistics()
    } catch (error: any) {
      message.error(error.response?.data?.message || '分配失败')
    }
  }

  const handleBatchTake = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要领取的线索')
      return
    }

    try {
      const res = await batchTakeLeadsFromPool(selectedRowKeys as string[])
      message.success(`成功领取 ${res.success} 条线索`)
      if (res.failed.length > 0) {
        message.warning(`${res.failed.length} 条线索领取失败`)
      }
      setSelectedRowKeys([])
      fetchData(pagination.current, pagination.pageSize)
      fetchStatistics()
    } catch (error: any) {
      message.error(error.response?.data?.message || '批量领取失败')
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      [LeadPoolStatus.AVAILABLE]: { color: 'green', text: '可领取' },
      [LeadPoolStatus.TAKEN]: { color: 'blue', text: '已领取' },
      [LeadPoolStatus.DISCARDED]: { color: 'red', text: '已废弃' },
    }
    const config = statusMap[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getRecycleReasonTag = (reason: string) => {
    const reasonMap: Record<string, { color: string; text: string }> = {
      [RecycleReason.TIMEOUT]: { color: 'orange', text: '超时未跟进' },
      [RecycleReason.MANUAL]: { color: 'cyan', text: '手动释放' },
      [RecycleReason.INVALID]: { color: 'red', text: '无效回收' },
    }
    const config = reasonMap[reason] || { color: 'default', text: reason }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getCaseTypeText = (caseType?: string) => {
    const caseTypeMap: Record<string, string> = {
      [CaseType.MARRIAGE]: '婚姻家事',
      [CaseType.TRAFFIC]: '交通事故',
      [CaseType.LABOR]: '劳动纠纷',
      [CaseType.DEBT]: '债务纠纷',
      [CaseType.OTHER]: '其他',
    }
    return caseType ? caseTypeMap[caseType] || caseType : '-'
  }

  const columns = [
    {
      title: '线索编号',
      dataIndex: 'lead_no',
      key: 'lead_no',
      width: 120,
      render: (text: string) => text?.substring(0, 8) || '-',
    },
    {
      title: '客户姓名',
      dataIndex: 'contact_name',
      key: 'contact_name',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '案件类型',
      dataIndex: 'case_type',
      key: 'case_type',
      width: 100,
      render: (caseType: string) => getCaseTypeText(caseType),
    },
    {
      title: '原归属人',
      dataIndex: 'original_owner_name',
      key: 'original_owner_name',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '回收原因',
      dataIndex: 'recycle_reason',
      key: 'recycle_reason',
      width: 120,
      render: (reason: string) => getRecycleReasonTag(reason),
    },
    {
      title: '回收时间',
      dataIndex: 'recycle_time',
      key: 'recycle_time',
      width: 150,
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '领取次数',
      dataIndex: 'take_count',
      key: 'take_count',
      width: 100,
      render: (count: number) => `${count} 次`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: LeadPool) => (
        <Space>
          {record.status === LeadPoolStatus.AVAILABLE && (
            <>
              <Popconfirm
                title="确认领取"
                description="确定要领取该线索吗？"
                onConfirm={() => handleTake(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small">
                  领取
                </Button>
              </Popconfirm>
              {isAdmin && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    setSelectedRowKeys([record.id])
                    setAssignModalVisible(true)
                  }}
                >
                  分配
                </Button>
              )}
            </>
          )}
          {record.status === LeadPoolStatus.TAKEN && (
            <span style={{ color: '#999' }}>
              {record.taken_by_name ? `已分配给 ${record.taken_by_name}` : '已领取'}
            </span>
          )}
        </Space>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys)
    },
    getCheckboxProps: (record: LeadPool) => ({
      disabled: record.status !== LeadPoolStatus.AVAILABLE,
    }),
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>线索公海池</h2>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col span={6}>
          <Card>
            <Statistic title="公海池总数" value={statistics.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="可领取" value={statistics.available} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已领取" value={statistics.taken} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已废弃" value={statistics.discarded} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      {/* 筛选区 */}
      <Card style={{ marginBottom: '20px' }}>
        <Space wrap size="middle">
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 150 }}
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
          >
            <Select.Option value={LeadPoolStatus.AVAILABLE}>可领取</Select.Option>
            <Select.Option value={LeadPoolStatus.TAKEN}>已领取</Select.Option>
            <Select.Option value={LeadPoolStatus.DISCARDED}>已废弃</Select.Option>
          </Select>

          <Select
            placeholder="案件类型"
            allowClear
            style={{ width: 150 }}
            value={filters.case_type || undefined}
            onChange={(value) => setFilters({ ...filters, case_type: value || '' })}
          >
            <Select.Option value={CaseType.MARRIAGE}>婚姻家事</Select.Option>
            <Select.Option value={CaseType.TRAFFIC}>交通事故</Select.Option>
            <Select.Option value={CaseType.LABOR}>劳动纠纷</Select.Option>
            <Select.Option value={CaseType.DEBT}>债务纠纷</Select.Option>
            <Select.Option value={CaseType.OTHER}>其他</Select.Option>
          </Select>

          <Select
            placeholder="回收原因"
            allowClear
            style={{ width: 150 }}
            value={filters.recycle_reason || undefined}
            onChange={(value) => setFilters({ ...filters, recycle_reason: value || '' })}
          >
            <Select.Option value={RecycleReason.TIMEOUT}>超时未跟进</Select.Option>
            <Select.Option value={RecycleReason.MANUAL}>手动释放</Select.Option>
            <Select.Option value={RecycleReason.INVALID}>无效回收</Select.Option>
          </Select>

          <RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setFilters({
                  ...filters,
                  start_date: dates[0].format('YYYY-MM-DD'),
                  end_date: dates[1].format('YYYY-MM-DD'),
                })
              } else {
                setFilters({ ...filters, start_date: '', end_date: '' })
              }
            }}
          />

          <Button type="primary" onClick={handleSearch}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchData(pagination.current, pagination.pageSize)}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 批量操作 */}
      <Card style={{ marginBottom: '20px' }}>
        <Space>
          <Button
            type="primary"
            icon={<UserSwitchOutlined />}
            onClick={handleBatchTake}
            disabled={selectedRowKeys.length === 0}
          >
            批量领取 ({selectedRowKeys.length})
          </Button>
          {isAdmin && (
            <Button
              icon={<TeamOutlined />}
              onClick={() => {
                if (selectedRowKeys.length === 0) {
                  message.warning('请选择要分配的线索')
                  return
                }
                setAssignModalVisible(true)
              }}
              disabled={selectedRowKeys.length === 0}
            >
              批量分配 ({selectedRowKeys.length})
            </Button>
          )}
        </Space>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => fetchData(page, pageSize),
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 分配弹窗 */}
      <Modal
        title="分配线索"
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false)
          setSelectedRowKeys([])
        }}
        footer={null}
      >
        <Form layout="vertical" onFinish={({ userId }) => handleAssign(userId)}>
          <Form.Item
            name="userId"
            label="选择用户"
            rules={[{ required: true, message: '请选择用户' }]}
          >
            <Select placeholder="请选择用户" showSearch optionFilterProp="children">
              {users.map((u) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.real_name} ({u.phone})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认分配
              </Button>
              <Button onClick={() => setAssignModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}