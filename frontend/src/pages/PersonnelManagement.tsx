// 人事管理页面：展示员工统计卡片、查询条件、员工档案列表与新增员工表单
import { useState, useEffect } from 'react'
import {
  Menu, Card, Form, Input, Select, Button, Table, Space, Row, Col,
  Statistic, DatePicker, Modal, Tabs, Tag, message,
} from 'antd'
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, UserOutlined,
  TeamOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'

// 左侧菜单（3大类8子项）
const menuItems = [
  {
    key: 'archive', label: '员工档案', children: [
      { key: 'employee', label: '员工信息' },
      { key: 'profile', label: '员工个人资料' },
    ],
  },
  {
    key: 'relation', label: '员工关系管理', children: [
      { key: 'onboard', label: '入职管理' },
      { key: 'regular', label: '转正管理' },
      { key: 'resign', label: '离职管理' },
      { key: 'contract', label: '合同管理' },
      { key: 'care', label: '员工关怀' },
    ],
  },
  {
    key: 'report', label: '人事报表', children: [
      { key: 'lawyer-stat', label: '执业律师统计' },
    ],
  },
]

// 性别选项
const genderOptions = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
]

// 部门选项
const deptOptions = [
  { value: 'litigation', label: '诉讼部' },
  { value: 'corporate', label: '公司业务部' },
  { value: 'ip', label: '知识产权部' },
  { value: 'finance', label: '金融业务部' },
  { value: 'admin', label: '行政部' },
]

// 职位选项
const positionOptions = [
  { value: 'partner', label: '合伙人' },
  { value: 'lawyer', label: '执业律师' },
  { value: 'assistant', label: '律师助理' },
  { value: 'paralegal', label: '实习律师' },
  { value: 'admin', label: '行政人员' },
]

// 律师类别选项
const lawyerTypeOptions = [
  { value: 'fulltime', label: '专职律师' },
  { value: 'parttime', label: '兼职律师' },
  { value: 'intern', label: '实习人员' },
  { value: 'assistant', label: '其他辅助人员' },
  { value: 'none', label: '无人员类别' },
]

// 员工状态选项
const employeeStatusOptions = [
  { value: 'active', label: '在职' },
  { value: 'probation', label: '试用' },
  { value: 'resigned', label: '离职' },
]

// 是否有个人资料选项
const hasProfileOptions = [
  { value: 'yes', label: '是' },
  { value: 'no', label: '否' },
]

// 律师类别标签颜色
const lawyerTypeColor: Record<string, string> = {
  fulltime: 'blue',
  parttime: 'cyan',
  intern: 'gold',
  assistant: 'default',
  none: 'default',
}

// 员工状态标签颜色
const employeeStatusColor: Record<string, string> = {
  active: 'success',
  probation: 'processing',
  resigned: 'default',
}

// 本地 mock 数据
const mockData: any[] = [
  {
    id: '1', name: '张三', gender: 'male', dept: 'litigation', position: 'lawyer',
    lawyerType: 'fulltime', practiceYears: 8, onboardDate: '2016-03-15',
    phone: '13800138000', status: 'active', office: '北京总部',
    idCard: '110101199001011234', hometown: '北京', school: '中国政法大学', major: '法学', education: '硕士',
  },
  {
    id: '2', name: '李四', gender: 'female', dept: 'corporate', position: 'partner',
    lawyerType: 'fulltime', practiceYears: 12, onboardDate: '2012-07-01',
    phone: '13900139000', status: 'active', office: '上海分所',
    idCard: '310101198801015678', hometown: '上海', school: '华东政法大学', major: '法学', education: '博士',
  },
  {
    id: '3', name: '王五', gender: 'male', dept: 'ip', position: 'assistant',
    lawyerType: 'intern', practiceYears: 1, onboardDate: '2023-09-01',
    phone: '13700137000', status: 'probation', office: '北京总部',
    idCard: '120101199901019012', hometown: '天津', school: '北京大学', major: '知识产权', education: '本科',
  },
]

// 统计卡片配置
const statConfigs = [
  { key: 'active', title: '在职员工', icon: <UserOutlined />, color: '#1677ff' },
  { key: 'probation', title: '试用中', icon: <TeamOutlined />, color: '#faad14' },
  { key: 'regular', title: '正式员工', icon: <CheckCircleOutlined />, color: '#52c41a' },
  { key: 'fulltime', title: '专职律师', icon: <UserOutlined />, color: '#1677ff' },
  { key: 'parttime', title: '兼职律师', icon: <UserOutlined />, color: '#13c2c2' },
  { key: 'intern', title: '实习人员', icon: <UserOutlined />, color: '#fa8c16' },
  { key: 'assistant', title: '其他辅助人员', icon: <UserOutlined />, color: '#8c8c8c' },
  { key: 'none', title: '无人员类别', icon: <UserOutlined />, color: '#bfbfbf' },
]

export default function PersonnelManagement() {
  const [activeMenu, setActiveMenu] = useState('employee')
  const [activeTab, setActiveTab] = useState('active')
  const [data, setData] = useState<any[]>(mockData)
  const [loading, setLoading] = useState(false)
  const [searchForm] = Form.useForm()
  const [addForm] = Form.useForm()
  const [addModalVisible, setAddModalVisible] = useState(false)
  // 统计数据
  const [stats, setStats] = useState<Record<string, number>>({})

  // 从接口获取人事数据，如接口不存在使用本地 mock 数据
  const fetchData = async (tab: string = activeTab) => {
    setLoading(true)
    try {
      const res: any = await axios.get('/hr/personnel', { params: { status: tab } })
      const list = res?.data
      if (Array.isArray(list) && list.length > 0) {
        setData(list)
      } else {
        // 接口无数据时使用本地 mock 数据按 Tab 过滤
        const filtered = tab === 'resigned'
          ? mockData.filter((d) => d.status === 'resigned')
          : mockData.filter((d) => d.status !== 'resigned')
        setData(filtered)
      }
    } catch (error) {
      const filtered = tab === 'resigned'
        ? mockData.filter((d) => d.status === 'resigned')
        : mockData.filter((d) => d.status !== 'resigned')
      setData(filtered)
    } finally {
      setLoading(false)
    }
  }

  // 计算统计数据
  const calcStats = () => {
    const result: Record<string, number> = {}
    mockData.forEach((item) => {
      if (item.status === 'active') result.active = (result.active || 0) + 1
      if (item.status === 'probation') result.probation = (result.probation || 0) + 1
      if (item.status === 'active' || item.status === 'probation') result.regular = (result.regular || 0) + 1
      if (item.lawyerType === 'fulltime') result.fulltime = (result.fulltime || 0) + 1
      if (item.lawyerType === 'parttime') result.parttime = (result.parttime || 0) + 1
      if (item.lawyerType === 'intern') result.intern = (result.intern || 0) + 1
      if (item.lawyerType === 'assistant') result.assistant = (result.assistant || 0) + 1
      if (item.lawyerType === 'none') result.none = (result.none || 0) + 1
    })
    setStats(result)
  }

  useEffect(() => {
    fetchData()
    calcStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // 搜索
  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    setLoading(true)
    try {
      const filtered = mockData.filter((item) => {
        let match = true
        if (values.name && !item.name.includes(values.name)) match = false
        if (values.dept && item.dept !== values.dept) match = false
        if (values.phone && !item.phone.includes(values.phone)) match = false
        if (values.gender && item.gender !== values.gender) match = false
        if (values.position && item.position !== values.position) match = false
        if (values.lawyerType && item.lawyerType !== values.lawyerType) match = false
        if (values.practiceYears && String(item.practiceYears) !== String(values.practiceYears)) match = false
        if (values.status && item.status !== values.status) match = false
        return match
      })
      setData(filtered)
    } finally {
      setLoading(false)
    }
  }

  // 重置查询
  const handleReset = () => {
    searchForm.resetFields()
    fetchData()
  }

  // 打开新增员工档案弹窗
  const handleOpenAdd = () => {
    addForm.resetFields()
    setAddModalVisible(true)
  }

  // 提交新增员工
  const handleAdd = async (values: any) => {
    try {
      await axios.post('/hr/personnel', values)
      message.success('员工档案新增成功')
      setAddModalVisible(false)
      fetchData()
      calcStats()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '新增失败')
    }
  }

  // 列定义（10列）
  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '性别', dataIndex: 'gender', key: 'gender',
      render: (g: string) => (g === 'male' ? '男' : g === 'female' ? '女' : '-'),
    },
    {
      title: '部门', dataIndex: 'dept', key: 'dept',
      render: (d: string) => deptOptions.find((o) => o.value === d)?.label || d,
    },
    {
      title: '职位', dataIndex: 'position', key: 'position',
      render: (p: string) => positionOptions.find((o) => o.value === p)?.label || p,
    },
    {
      title: '律师类别', dataIndex: 'lawyerType', key: 'lawyerType',
      render: (t: string) => (
        <Tag color={lawyerTypeColor[t] || 'default'}>
          {lawyerTypeOptions.find((o) => o.value === t)?.label || t}
        </Tag>
      ),
    },
    { title: '执业年限', dataIndex: 'practiceYears', key: 'practiceYears', render: (y: number) => `${y}年` },
    { title: '入职时间', dataIndex: 'onboardDate', key: 'onboardDate' },
    { title: '工作手机', dataIndex: 'phone', key: 'phone' },
    {
      title: '员工状态', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag color={employeeStatusColor[s] || 'default'}>
          {employeeStatusOptions.find((o) => o.value === s)?.label || s}
        </Tag>
      ),
    },
    { title: '办公地点', dataIndex: 'office', key: 'office' },
  ]

  return (
    <div>
      {/* 顶部8个统计卡片 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {statConfigs.map((cfg) => (
          <Col key={cfg.key} xs={12} sm={8} md={6} lg={3}>
            <Card size="small">
              <Statistic
                title={cfg.title}
                value={stats[cfg.key] || 0}
                prefix={<span style={{ color: cfg.color }}>{cfg.icon}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 左侧菜单 + 右侧内容 */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 220, background: '#fff', borderRadius: 8, flexShrink: 0 }}>
          <Menu
            mode="inline"
            selectedKeys={[activeMenu]}
            defaultOpenKeys={['archive', 'relation', 'report']}
            items={menuItems}
            onClick={(e) => setActiveMenu(e.key)}
            style={{ borderRight: 0 }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 查询条件区域 */}
          <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <Form form={searchForm} layout="inline" style={{ gap: 8 }}>
              <Form.Item label="律师姓名" name="name">
                <Input placeholder="请输入" allowClear style={{ width: 120 }} />
              </Form.Item>
              <Form.Item label="所在部门" name="dept">
                <Select placeholder="请选择" allowClear style={{ width: 130 }} options={deptOptions} />
              </Form.Item>
              <Form.Item label="工作手机" name="phone">
                <Input placeholder="请输入" allowClear style={{ width: 130 }} />
              </Form.Item>
              <Form.Item label="性别" name="gender">
                <Select placeholder="请选择" allowClear style={{ width: 100 }} options={genderOptions} />
              </Form.Item>
              <Form.Item label="职位" name="position">
                <Select placeholder="请选择" allowClear style={{ width: 130 }} options={positionOptions} />
              </Form.Item>
              <Form.Item label="律师类别" name="lawyerType">
                <Select placeholder="请选择" allowClear style={{ width: 150 }} options={lawyerTypeOptions} />
              </Form.Item>
              <Form.Item label="执业年限" name="practiceYears">
                <Input placeholder="请输入" allowClear style={{ width: 100 }} />
              </Form.Item>
              <Form.Item label="开始日期" name="startDate">
                <DatePicker style={{ width: 150 }} />
              </Form.Item>
              <Form.Item label="结束日期" name="endDate">
                <DatePicker style={{ width: 150 }} />
              </Form.Item>
              <Form.Item label="员工状态" name="status">
                <Select placeholder="请选择" allowClear style={{ width: 110 }} options={employeeStatusOptions} />
              </Form.Item>
              <Form.Item label="是否有个人资料" name="hasProfile">
                <Select placeholder="请选择" allowClear style={{ width: 110 }} options={hasProfileOptions} />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>

          {/* 列表区域 */}
          <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key)}
                items={[
                  { key: 'active', label: '在职员工' },
                  { key: 'resigned', label: '已离职员工' },
                ]}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>新增员工档案</Button>
            </div>
            <Table
              dataSource={data}
              columns={columns}
              loading={loading}
              rowKey="id"
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
            />
          </div>
        </div>
      </div>

      {/* 新增员工档案弹窗 */}
      <Modal
        title="新增员工档案"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onOk={() => addForm.submit()}
        width={720}
        okText="提交"
        cancelText="取消"
      >
        <Form form={addForm} layout="vertical" onFinish={handleAdd}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="性别" name="gender" rules={[{ required: true, message: '请选择性别' }]}>
                <Select placeholder="请选择" options={genderOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="部门" name="dept" rules={[{ required: true, message: '请选择部门' }]}>
                <Select placeholder="请选择" options={deptOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="职位" name="position" rules={[{ required: true, message: '请选择职位' }]}>
                <Select placeholder="请选择" options={positionOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="律师类别" name="lawyerType" rules={[{ required: true, message: '请选择律师类别' }]}>
                <Select placeholder="请选择" options={lawyerTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="执业年限" name="practiceYears">
                <Input placeholder="请输入执业年限" type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="入职时间" name="onboardDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="工作手机" name="phone" rules={[{ required: true, message: '请输入工作手机' }]}>
                <Input placeholder="请输入工作手机" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="员工状态" name="status" rules={[{ required: true, message: '请选择员工状态' }]}>
                <Select placeholder="请选择" options={employeeStatusOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="办公地点" name="office">
                <Input placeholder="请输入办公地点" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="身份证号" name="idCard">
                <Input placeholder="请输入身份证号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="籍贯" name="hometown">
                <Input placeholder="请输入籍贯" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="毕业院校" name="school">
                <Input placeholder="请输入毕业院校" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="专业" name="major">
                <Input placeholder="请输入专业" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="学历" name="education">
                <Select placeholder="请选择" options={[
                  { value: 'doctor', label: '博士' },
                  { value: 'master', label: '硕士' },
                  { value: 'bachelor', label: '本科' },
                  { value: 'college', label: '大专' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
