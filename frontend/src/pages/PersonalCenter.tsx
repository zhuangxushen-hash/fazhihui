// 个人中心页面：展示用户信息卡片与9个子项（简历/头像/手机/邮箱/密码/银行/订单/等级/仪表盘）
import { useState, useEffect } from 'react'
import {
  Menu, Card, Form, Input, Select, Button, Upload, Avatar, Descriptions,
  Table, Progress, Tag, Space, Modal, Divider, message,
} from 'antd'
import {
  UserOutlined, PlusOutlined, DeleteOutlined, UploadOutlined, PhoneOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'

const { TextArea } = Input

// 左侧菜单子项（9个）
const menuItems = [
  { key: 'resume', label: '个人简历' },
  { key: 'avatar', label: '头像设置' },
  { key: 'phone', label: '绑定手机' },
  { key: 'email', label: '绑定邮箱' },
  { key: 'password', label: '修改密码' },
  { key: 'bank', label: '银行账号设置' },
  { key: 'orders', label: '我的订单' },
  { key: 'level', label: '我的等级' },
  { key: 'dashboard', label: '管理仪表盘' },
]

// 专业类别选项
const majorOptions = [
  { value: 'civil', label: '民事' },
  { value: 'criminal', label: '刑事' },
  { value: 'corporate', label: '公司业务' },
  { value: 'ip', label: '知识产权' },
  { value: 'finance', label: '金融' },
  { value: 'admin', label: '行政' },
]

// 订单状态颜色
const orderStatusConfig: Record<string, { label: string; color: string }> = {
  paid: { label: '已支付', color: 'success' },
  pending: { label: '待支付', color: 'processing' },
  cancelled: { label: '已取消', color: 'default' },
}

// 动态条目类型（案例/荣誉/研究/新闻）
interface DynamicItem {
  id: string
  content: string
  link: string
}

// 生成临时 id
const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export default function PersonalCenter() {
  const [activeKey, setActiveKey] = useState('resume')
  const [profile, setProfile] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [resumeForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [bankForm] = Form.useForm()
  // 绑定手机/邮箱弹窗
  const [phoneModalVisible, setPhoneModalVisible] = useState(false)
  const [emailModalVisible, setEmailModalVisible] = useState(false)
  const [phoneForm] = Form.useForm()
  const [emailForm] = Form.useForm()
  // 动态列表
  const [cases, setCases] = useState<DynamicItem[]>([{ id: genId(), content: '', link: '' }])
  const [honors, setHonors] = useState<DynamicItem[]>([{ id: genId(), content: '', link: '' }])
  const [researches, setResearches] = useState<DynamicItem[]>([{ id: genId(), content: '', link: '' }])
  const [news, setNews] = useState<DynamicItem[]>([{ id: genId(), content: '', link: '' }])

  // 从接口获取用户信息
  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res: any = await axios.get('/users/profile')
      if (res?.data) {
        setProfile(res.data)
        resumeForm.setFieldsValue(res.data)
        bankForm.setFieldsValue(res.data?.bank)
      }
    } catch (error) {
      // 忽略
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 动态列表新增
  const addItem = (
    list: DynamicItem[],
    setter: (v: DynamicItem[]) => void,
  ) => {
    setter([...list, { id: genId(), content: '', link: '' }])
  }

  // 动态列表删除
  const removeItem = (
    list: DynamicItem[],
    setter: (v: DynamicItem[]) => void,
    id: string,
  ) => {
    setter(list.filter((it) => it.id !== id))
  }

  // 渲染动态列表（案例/荣誉/研究/新闻）
  const renderDynamicList = (
    title: string,
    list: DynamicItem[],
    setter: (v: DynamicItem[]) => void,
  ) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 500 }}>{title}</span>
        <Button type="link" icon={<PlusOutlined />} onClick={() => addItem(list, setter)}>新增</Button>
      </div>
      {list.map((it) => (
        <Space key={it.id} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
          <Input
            placeholder={`${title}内容`}
            value={it.content}
            onChange={(e) => {
              setter(list.map((x) => (x.id === it.id ? { ...x, content: e.target.value } : x)))
            }}
            style={{ width: 320 }}
          />
          <Input
            placeholder="链接地址"
            value={it.link}
            onChange={(e) => {
              setter(list.map((x) => (x.id === it.id ? { ...x, link: e.target.value } : x)))
            }}
            style={{ width: 240 }}
          />
          {list.length > 1 && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeItem(list, setter, it.id)}
            />
          )}
        </Space>
      ))}
    </div>
  )

  // 保存简历
  const handleSaveResume = async (values: any) => {
    try {
      await axios.put('/users/profile', {
        ...values,
        cases,
        honors,
        researches,
        news,
      })
      message.success('简历已保存')
    } catch (error: any) {
      message.error(error?.response?.data?.message || '保存失败')
    }
  }

  // 修改密码
  const handleChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的新密码不一致')
      return
    }
    try {
      await axios.put('/users/password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '修改失败')
    }
  }

  // 保存银行账号
  const handleSaveBank = async (values: any) => {
    try {
      await axios.put('/users/bank', values)
      message.success('银行账号已保存')
    } catch (error: any) {
      message.error(error?.response?.data?.message || '保存失败')
    }
  }

  // 提交绑定手机
  const handleBindPhone = async (values: any) => {
    try {
      await axios.put('/users/phone', { phone: values.phone, code: values.code })
      message.success('手机绑定成功')
      setPhoneModalVisible(false)
      phoneForm.resetFields()
      fetchProfile()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '绑定失败')
    }
  }

  // 提交绑定邮箱
  const handleBindEmail = async (values: any) => {
    try {
      await axios.put('/users/email', { email: values.email, code: values.code })
      message.success('邮箱绑定成功')
      setEmailModalVisible(false)
      emailForm.resetFields()
      fetchProfile()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '绑定失败')
    }
  }

  // 订单列表
  const orderColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `￥${(v || 0).toFixed(2)}` },
    { title: '支付时间', dataIndex: 'payTime', key: 'payTime' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const cfg = orderStatusConfig[s] || { label: s, color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
  ]

  const orders = profile?.orders || []

  // 等级权益列表
  const levelBenefits = profile?.benefits || [
    { id: 'b1', name: '专属客服', desc: '7x24小时专属客服支持' },
    { id: 'b2', name: '工具折扣', desc: '法律工具9折优惠' },
    { id: 'b3', name: '优先体验', desc: '新功能优先体验权' },
    { id: 'b4', name: '存储扩容', desc: '云存储空间扩容至 50GB' },
  ]

  // 仪表盘组件列表
  const dashboardWidgets = profile?.widgets || [
    { id: 'w1', name: '待办事项', desc: '展示今日待办任务' },
    { id: 'w2', name: '审批动态', desc: '展示最近审批进度' },
    { id: 'w3', name: '案件概览', desc: '展示负责案件统计' },
    { id: 'w4', name: '日程安排', desc: '展示本周日程' },
    { id: 'w5', name: '团队动态', desc: '展示团队成员动态' },
    { id: 'w6', name: '收入统计', desc: '展示本月收入概况' },
  ]

  // 渲染内容区域
  const renderContent = () => {
    switch (activeKey) {
      case 'resume':
        return (
          <Card title="个人简历" loading={loading}>
            <Form form={resumeForm} layout="vertical" onFinish={handleSaveResume}>
              <Space size="large" style={{ marginBottom: 16 }}>
                <Form.Item label="形象照" name="avatarFile">
                  <Upload listType="picture-card" maxCount={1} beforeUpload={() => false} showUploadList>
                    <div><UploadOutlined /><div style={{ marginTop: 4 }}>上传</div></div>
                  </Upload>
                </Form.Item>
                <Form.Item label="微信二维码" name="wechatQrFile">
                  <Upload listType="picture-card" maxCount={1} beforeUpload={() => false} showUploadList>
                    <div><UploadOutlined /><div style={{ marginTop: 4 }}>上传</div></div>
                  </Upload>
                </Form.Item>
              </Space>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item label="手机号（只读）" name="phone">
                  <Input readOnly />
                </Form.Item>
                <Form.Item label="邮箱（只读）" name="email">
                  <Input readOnly />
                </Form.Item>
                <Form.Item label="职位" name="position"><Input /></Form.Item>
                <Form.Item label="主专业类别" name="majorCategory">
                  <Select options={majorOptions} placeholder="请选择" />
                </Form.Item>
                <Form.Item label="辅专业类别1" name="minorCategory1">
                  <Select options={majorOptions} placeholder="请选择" />
                </Form.Item>
                <Form.Item label="辅专业类别2" name="minorCategory2">
                  <Select options={majorOptions} placeholder="请选择" />
                </Form.Item>
              </div>
              <Form.Item label="简介" name="intro"><TextArea rows={3} placeholder="请输入个人简介" /></Form.Item>
              <Form.Item label="教育背景" name="education"><TextArea rows={3} placeholder="请输入教育背景" /></Form.Item>
              <Form.Item label="工作经历" name="experience"><TextArea rows={3} placeholder="请输入工作经历" /></Form.Item>
              <Form.Item label="社会职务" name="socialDuties"><TextArea rows={2} placeholder="请输入社会职务" /></Form.Item>
              <Divider />
              {renderDynamicList('案例', cases, setCases)}
              {renderDynamicList('荣誉', honors, setHonors)}
              {renderDynamicList('研究', researches, setResearches)}
              {renderDynamicList('新闻', news, setNews)}
              <Button type="primary" htmlType="submit">保存简历</Button>
            </Form>
          </Card>
        )
      case 'avatar':
        return (
          <Card title="头像设置" loading={loading}>
            <div style={{ textAlign: 'center' }}>
              <Avatar size={120} src={profile?.avatar} icon={<UserOutlined />} />
              <div style={{ marginTop: 16 }}>
                <Upload listType="picture-card" maxCount={1} beforeUpload={() => false} showUploadList>
                  <div><UploadOutlined /><div style={{ marginTop: 4 }}>上传头像</div></div>
                </Upload>
              </div>
              <Button type="primary" style={{ marginTop: 16 }}>保存头像</Button>
            </div>
          </Card>
        )
      case 'phone':
        return (
          <Card title="绑定手机" loading={loading}>
            <Descriptions column={1}>
              <Descriptions.Item label="当前绑定手机">
                <Space>
                  <span>{profile?.phone || '未绑定'}</span>
                  <Button type="link" onClick={() => { phoneForm.resetFields(); setPhoneModalVisible(true) }}>修改</Button>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )
      case 'email':
        return (
          <Card title="绑定邮箱" loading={loading}>
            <Descriptions column={1}>
              <Descriptions.Item label="当前绑定邮箱">
                <Space>
                  <span>{profile?.email || '未绑定'}</span>
                  <Button type="link" onClick={() => { emailForm.resetFields(); setEmailModalVisible(true) }}>修改</Button>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )
      case 'password':
        return (
          <Card title="修改密码">
            <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword} style={{ maxWidth: 400 }}>
              <Form.Item label="旧密码" name="oldPassword" rules={[{ required: true, message: '请输入旧密码' }]}>
                <Input.Password placeholder="请输入旧密码" />
              </Form.Item>
              <Form.Item label="新密码" name="newPassword" rules={[{ required: true, message: '请输入新密码' }]}>
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>
              <Form.Item label="确认新密码" name="confirmPassword" rules={[{ required: true, message: '请确认新密码' }]}>
                <Input.Password placeholder="请再次输入新密码" />
              </Form.Item>
              <Button type="primary" htmlType="submit">确认修改</Button>
            </Form>
          </Card>
        )
      case 'bank':
        return (
          <Card title="银行账号设置">
            <Form form={bankForm} layout="vertical" onFinish={handleSaveBank} style={{ maxWidth: 400 }}>
              <Form.Item label="开户行" name="bankName" rules={[{ required: true, message: '请输入开户行' }]}>
                <Input placeholder="请输入开户行" />
              </Form.Item>
              <Form.Item label="账户名" name="accountName" rules={[{ required: true, message: '请输入账户名' }]}>
                <Input placeholder="请输入账户名" />
              </Form.Item>
              <Form.Item label="账号" name="accountNo" rules={[{ required: true, message: '请输入账号' }]}>
                <Input placeholder="请输入账号" />
              </Form.Item>
              <Button type="primary" htmlType="submit">保存</Button>
            </Form>
          </Card>
        )
      case 'orders':
        return (
          <Card title="我的订单">
            <Table
              dataSource={orders}
              columns={orderColumns}
              rowKey="orderNo"
              pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
            />
          </Card>
        )
      case 'level':
        return (
          <Card title="我的等级" loading={loading}>
            <div style={{ marginBottom: 16 }}>
              <Space size="large">
                <span style={{ fontSize: 16 }}>当前等级：</span>
                <Tag color="gold">{profile?.level || 'Lv1'}</Tag>
                <span>经验值：{profile?.exp || 0} / 1000</span>
              </Space>
            </div>
            <Progress percent={Number(profile?.expPercent || 10)} style={{ maxWidth: 400, marginBottom: 24 }} />
            <h4>等级权益</h4>
            {levelBenefits.map((b: any) => (
              <div key={b.id} style={{ marginBottom: 8 }}>
                <Tag color="blue">{b.name}</Tag>
                <span style={{ color: '#666' }}>{b.desc}</span>
              </div>
            ))}
          </Card>
        )
      case 'dashboard':
        return (
          <Card title="管理仪表盘">
            <p style={{ color: '#888' }}>可自定义展示的仪表盘组件：</p>
            {dashboardWidgets.map((w: any) => (
              <Card key={w.id} size="small" style={{ marginBottom: 8 }}>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <strong>{w.name}</strong>
                    <span style={{ marginLeft: 12, color: '#888' }}>{w.desc}</span>
                  </div>
                  <Button type="link">添加到仪表盘</Button>
                </Space>
              </Card>
            ))}
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <div>
      {/* 顶部用户信息卡片 */}
      <Card style={{ marginBottom: 16 }} loading={loading}>
        <Space size="large">
          <Avatar size={72} src={profile?.avatar} icon={<UserOutlined />} />
          <Descriptions column={4}>
            <Descriptions.Item label="姓名">{profile?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="职位">{profile?.position || '-'}</Descriptions.Item>
            <Descriptions.Item label="手机号">{profile?.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{profile?.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="律所名称">{profile?.firmName || '-'}</Descriptions.Item>
            <Descriptions.Item label="等级">
              <Tag color="gold">{profile?.level || 'Lv1'}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>

      {/* 左侧菜单 + 右侧内容 */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 200, background: '#fff', borderRadius: 8, flexShrink: 0 }}>
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            items={menuItems}
            onClick={(e) => setActiveKey(e.key)}
            style={{ borderRight: 0 }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderContent()}
        </div>
      </div>

      {/* 绑定手机弹窗 */}
      <Modal
        title="修改绑定手机"
        open={phoneModalVisible}
        onCancel={() => setPhoneModalVisible(false)}
        onOk={() => phoneForm.submit()}
        okText="确认"
        cancelText="取消"
      >
        <Form form={phoneForm} layout="vertical" onFinish={handleBindPhone}>
          <Form.Item label="新手机号" name="phone" rules={[{ required: true, message: '请输入新手机号' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="请输入新手机号" />
          </Form.Item>
          <Form.Item label="验证码" name="code" rules={[{ required: true, message: '请输入验证码' }]}>
            <Space>
              <Input placeholder="请输入验证码" style={{ width: 200 }} />
              <Button>获取验证码</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 绑定邮箱弹窗 */}
      <Modal
        title="修改绑定邮箱"
        open={emailModalVisible}
        onCancel={() => setEmailModalVisible(false)}
        onOk={() => emailForm.submit()}
        okText="确认"
        cancelText="取消"
      >
        <Form form={emailForm} layout="vertical" onFinish={handleBindEmail}>
          <Form.Item label="新邮箱" name="email" rules={[{ required: true, message: '请输入新邮箱' }]}>
            <Input placeholder="请输入新邮箱" />
          </Form.Item>
          <Form.Item label="验证码" name="code" rules={[{ required: true, message: '请输入验证码' }]}>
            <Space>
              <Input placeholder="请输入验证码" style={{ width: 200 }} />
              <Button>获取验证码</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
