import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Button, Modal, Form, Input, Select, Space, message, Rate, Popconfirm, Descriptions, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons'
import {
  getClientProfiles,
  createClientProfile,
  updateClientProfile,
  deleteClientProfile,
  getRelatedCases,
  getRelatedLeads,
  getRelatedFollowUps,
  getFinancialRecords,
} from '../api/client-profile'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

// 客户类型映射：individual个人/enterprise企业
const typeLabelMap: Record<string, string> = {
  individual: '个人',
  enterprise: '企业',
}

// 客户价值等级映射：high高/medium中/low低
const valueLevelLabelMap: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

// 客户价值等级对应 Tag 颜色
const valueLevelColorMap: Record<string, string> = {
  high: 'red',
  medium: 'gold',
  low: 'default',
}

// 客户类型对应 Tag 颜色
const typeColorMap: Record<string, string> = {
  individual: 'blue',
  enterprise: 'purple',
}

const typeOptions = [
  { value: 'individual', label: '个人' },
  { value: 'enterprise', label: '企业' },
]

const valueLevelOptions = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

export default function ClientManagement() {
  const navigate = useNavigate()
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  // 智能筛选：超过X天未联系
  const [daysNoContact, setDaysNoContact] = useState<string | number>('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()

  // 详情弹窗相关状态
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentClient, setCurrentClient] = useState<Record<string, unknown> | null>(null)
  const [relatedCases, setRelatedCases] = useState<Record<string, unknown>[]>([])
  const [relatedLeads, setRelatedLeads] = useState<Record<string, unknown>[]>([])
  // 13.8 缺口4: 客户详情新增 Tab（跟进记录/标签分组/财务往来）
  const [relatedFollowUps, setRelatedFollowUps] = useState<Record<string, unknown>[]>([])
  const [clientTags, setClientTags] = useState<Record<string, unknown>[]>([])
  const [financialRecords, setFinancialRecords] = useState<Record<string, unknown>[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  // 拉取客户列表
  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {}
      if (keyword) params.keyword = keyword
      if (daysNoContact) params.days_no_contact = daysNoContact
      const res = (await getClientProfiles(params)) as Record<string, unknown>[]
      setData(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setKeyword('')
    setDaysNoContact('')
    fetchData()
  }

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({
      type: 'individual',
      value_level: 'medium',
      satisfaction: 3,
    })
    setModalVisible(true)
  }

  // 打开编辑弹窗
  const handleEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as string)
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      contact_name: record.contact_name,
      phone: record.phone,
      id_card_no: record.id_card_no,
      email: record.email,
      address: record.address,
      source: record.source,
      value_level: record.value_level,
      satisfaction: record.satisfaction,
      remarks: record.remarks,
    })
    setModalVisible(true)
  }

  // 提交新增/编辑
  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editingId) {
        await updateClientProfile(editingId, values)
        message.success('客户更新成功')
      } else {
        await createClientProfile(values)
        message.success('客户创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      message.error(editingId ? '客户更新失败' : '客户创建失败')
    }
  }

  // 删除客户
  const handleDelete = async (record: Record<string, unknown>) => {
    try {
      await deleteClientProfile(record.id as string)
      message.success('客户删除成功')
      fetchData()
    } catch (error) {
      message.error('客户删除失败')
    }
  }

  // 查看详情（同时拉取关联案件与线索）
  const handleViewDetail = async (record: Record<string, unknown>) => {
    setCurrentClient(record)
    setRelatedCases([])
    setRelatedLeads([])
    setRelatedFollowUps([])
    setClientTags([])
    setFinancialRecords([])
    setDetailVisible(true)
    setDetailLoading(true)
    try {
      // 13.8 缺口4: 并行拉取案件/线索/跟进记录/标签/财务往来
      const [cases, leads, followUps, tags, finances] = await Promise.all([
        getRelatedCases(record.id as string),
        getRelatedLeads(record.id as string),
        getRelatedFollowUps(record.id as string),
        axios.get(`/scrm/client-tags/relations/client/${record.id}`),
        getFinancialRecords(record.id as string),
      ])
      setRelatedCases((cases as Record<string, unknown>[]) || [])
      setRelatedLeads((leads as Record<string, unknown>[]) || [])
      setRelatedFollowUps((followUps as Record<string, unknown>[]) || [])
      setClientTags(((tags as Record<string, unknown>)?.data || (tags as Record<string, unknown>[]) || []) as Record<string, unknown>[])
      setFinancialRecords((finances as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setDetailLoading(false)
    }
  }

  // 13.8 缺口4: 跟进记录表格列
  const followUpColumns = [
    { title: '线索联系人', dataIndex: 'lead_contact_name', key: 'lead_contact_name', render: (v: string) => v || '-' },
    { title: '线索电话', dataIndex: 'lead_phone', key: 'lead_phone', render: (v: string) => v || '-' },
    { title: '跟进内容', dataIndex: 'content', key: 'content' },
    { title: '下次动作', dataIndex: 'next_action', key: 'next_action', render: (v: string) => v || '-' },
    { title: '跟进时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDateTime(v) },
  ]

  // 13.8 缺口4: 财务往来表格列
  const financeColumns = [
    { title: '案件ID', dataIndex: 'case_id', key: 'case_id', render: (v: string) => (v || '').slice(0, 8) + '…' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
    { title: '支付方式', dataIndex: 'method', key: 'method', render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => ({
      paid: '已支付', pending: '待支付', failed: '失败', refunded: '已退款',
    }[v] || v || '-') },
    { title: '支付时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDateTime(v) },
  ]

  // 关联案件表格列定义
  const caseColumns = [
    { title: '案件编号', dataIndex: 'case_no', key: 'case_no', render: (v: string) => v || '-' },
    { title: '案件名称', dataIndex: 'case_name', key: 'case_name', render: (v: string) => v || '-' },
    { title: '客户名称', dataIndex: 'client_name', key: 'client_name', render: (v: string) => v || '-' },
    { title: '案件状态', dataIndex: 'status', key: 'status' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDateTime(v) },
  ]

  // 关联线索表格列定义
  const leadColumns = [
    { title: '联系人', dataIndex: 'contact_name', key: 'contact_name', render: (v: string) => v || '-' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '案由', dataIndex: 'case_type', key: 'case_type', render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', key: 'status' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDateTime(v) },
  ]

  // 主表格列定义
  const columns = [
    { title: '客户名称', dataIndex: 'name', key: 'name' },
    {
      title: '客户类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag className={typeColorMap[type] || 'stitch-tag'}>{typeLabelMap[type] || type}</Tag>,
    },
    { title: '联系人', dataIndex: 'contact_name', key: 'contact_name', render: (v: string) => v || '-' },
    { title: '电话', dataIndex: 'phone', key: 'phone', render: (v: string) => v || '-' },
    { title: '邮箱', dataIndex: 'email', key: 'email', render: (v: string) => v || '-' },
    { title: '客户来源', dataIndex: 'source', key: 'source', render: (v: string) => v || '-' },
    {
      title: '价值等级',
      dataIndex: 'value_level',
      key: 'value_level',
      render: (level: string) => <Tag color={valueLevelColorMap[level] || 'default'}>{valueLevelLabelMap[level] || level}</Tag>,
    },
    {
      title: '满意度',
      dataIndex: 'satisfaction',
      key: 'satisfaction',
      render: (val: number) => <Rate disabled count={5} value={Number(val) || 0} />,
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDateTime(v) },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space className="stitch-btn-group">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button
            size="small"
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/clients/sign/${record.id}`)}
          >
            发合同
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认删除该客户吗？"
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>客户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增客户</Button>
      </div>

      <div className="search-bar">
        <Input
          placeholder="按名称/电话搜索"
          prefix={<SearchOutlined />}
          style={{ width: 240 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
        />
        <Select
          placeholder="智能筛选"
          style={{ width: 180 }}
          allowClear
          value={daysNoContact ? Number(daysNoContact) : undefined}
          onChange={(value) => setDaysNoContact(value || '')}
        >
          <Select.Option value={7}>超过7天未联系</Select.Option>
          <Select.Option value={30}>超过30天未联系</Select.Option>
          <Select.Option value={90}>超过90天未联系</Select.Option>
        </Select>
        <Button type="primary" onClick={handleSearch}>搜索</Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <div className="stitch-table">
        <Table dataSource={data} columns={columns} loading={loading} rowKey="id" scroll={{ x: 1600 }} />
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingId ? '编辑客户' : '新增客户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item name="type" label="客户类型" rules={[{ required: true }]}>
            <Select>
              {typeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="contact_name" label="联系人">
            <Input placeholder="请输入联系人" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item
            name="id_card_no"
            label="身份证号"
            extra="用于 C 端登录默认密码（身份证号后 8 位），录入手机号+身份证号后自动生成 C 端账号"
          >
            <Input placeholder="请输入身份证号" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="source" label="客户来源">
            <Input placeholder="请输入客户来源" />
          </Form.Item>
          <Form.Item name="value_level" label="价值等级" rules={[{ required: true }]}>
            <Select>
              {valueLevelOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="satisfaction" label="满意度">
            <Rate count={5} />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea placeholder="请输入备注" rows={3} />
          </Form.Item>
          <Form.Item>
            <Space className="stitch-btn-group">
              <Button type="primary" htmlType="submit">{editingId ? '保存' : '创建'}</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="客户详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={820}
      >
        {currentClient && (() => {
          const cli = currentClient as Record<string, unknown>
          return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => {
                  setDetailVisible(false)
                  navigate(`/clients/sign/${cli.id}`)
                }}
              >
                发合同
              </Button>
            </div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="客户名称">{String(cli.name ?? '')}</Descriptions.Item>
              <Descriptions.Item label="客户类型">
                <Tag className={typeColorMap[cli.type as string] || 'stitch-tag'}>
                  {typeLabelMap[cli.type as string] || (cli.type as string)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="联系人">{String(cli.contact_name || '-')}</Descriptions.Item>
              <Descriptions.Item label="电话">{String(cli.phone || '-')}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{String(cli.id_card_no || '-')}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{String(cli.email || '-')}</Descriptions.Item>
              <Descriptions.Item label="地址">{String(cli.address || '-')}</Descriptions.Item>
              <Descriptions.Item label="客户来源">{String(cli.source || '-')}</Descriptions.Item>
              <Descriptions.Item label="价值等级">
                <Tag className={valueLevelColorMap[cli.value_level as string] || 'stitch-tag'}>
                  {valueLevelLabelMap[cli.value_level as string] || (cli.value_level as string)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="满意度">
                <Rate disabled count={5} value={Number(cli.satisfaction) || 0} />
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{String(cli.remarks || '-')}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(cli.created_at as string)}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{formatDateTime(cli.updated_at as string)}</Descriptions.Item>
            </Descriptions>

            <Tabs
              defaultActiveKey="cases"
              style={{ marginTop: 16 }}
              items={[
                {
                  key: 'cases',
                  label: `关联案件 (${relatedCases.length})`,
                  children: (
                    <Table
                      dataSource={relatedCases}
                      columns={caseColumns}
                      loading={detailLoading}
                      rowKey="id"
                      size="small"
                      pagination={{ pageSize: 5 }}
                      scroll={{ x: 800 }}
                    />
                  ),
                },
                {
                  key: 'leads',
                  label: `关联线索 (${relatedLeads.length})`,
                  children: (
                    <div className="stitch-table">
                      <Table
                        dataSource={relatedLeads}
                        columns={leadColumns}
                        loading={detailLoading}
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 5 }}
                        scroll={{ x: 800 }}
                      />
                    </div>
                  ),
                },
                {
                  key: 'follow-ups',
                  label: `跟进记录 (${relatedFollowUps.length})`,
                  children: (
                    <div className="stitch-table">
                      <Table
                        dataSource={relatedFollowUps}
                        columns={followUpColumns}
                        loading={detailLoading}
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 5 }}
                        scroll={{ x: 800 }}
                      />
                    </div>
                  ),
                },
                {
                  key: 'tags',
                  label: `标签分组 (${clientTags.length})`,
                  children: (
                    <div style={{ padding: 8 }}>
                      {clientTags.length ? (
                        clientTags.map((tag) => (
                          <Tag key={tag.id as string} color="blue" style={{ marginBottom: 8 }}>
                            {String(tag.tag_name || '-')}
                          </Tag>
                        ))
                      ) : (
                        <span style={{ color: '#999' }}>暂无标签</span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'finances',
                  label: `财务往来 (${financialRecords.length})`,
                  children: (
                    <div className="stitch-table">
                      <Table
                        dataSource={financialRecords}
                        columns={financeColumns}
                        loading={detailLoading}
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 5 }}
                        scroll={{ x: 800 }}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </div>
          )
        })()}
      </Modal>
    </div>
  )
}
