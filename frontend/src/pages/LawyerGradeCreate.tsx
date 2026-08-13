import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Space,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { theme } from '../constants/theme'
import { createBidPerformance } from '../api/bid'

// 分类选项
const categoryOptions = [
  { value: 'litigation', label: '诉讼' },
  { value: 'non_litigation', label: '非诉' },
  { value: 'consultant', label: '顾问' },
]

export default function LawyerGradeCreate() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  // 提交业绩提报
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      // 日期转为字符串
      const payload: Record<string, unknown> = { ...values }
      if (payload.start_date && dayjs.isDayjs(payload.start_date)) {
        payload.start_date = (payload.start_date as dayjs.Dayjs).format('YYYY-MM-DD')
      }
      if (payload.end_date && dayjs.isDayjs(payload.end_date)) {
        payload.end_date = (payload.end_date as dayjs.Dayjs).format('YYYY-MM-DD')
      }
      await createBidPerformance(payload as Parameters<typeof createBidPerformance>[0])
      message.success('业绩提报成功，已进入待审核状态')
      form.resetFields()
    } catch (err) {
      const e = err as { errorFields?: unknown }
      if (e?.errorFields) return
      message.error('提报失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>业绩提报</h2>
          <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
            录入律师投标业绩记录，提交后进入审核流程
          </p>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bid-performances')}>
          返回业绩库
        </Button>
      </div>

      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 24 } }}>
        <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
          <Form.Item name="project_name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item name="client" label="客户" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item name="amount" label="金额（元）" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入合同金额" />
          </Form.Item>
          <Form.Item name="category" label="业绩分类" rules={[{ required: true, message: '请选择业绩分类' }]}>
            <Select placeholder="请选择业绩分类" options={categoryOptions} />
          </Form.Item>
          <Form.Item name="start_date" label="开始日期" rules={[{ required: true, message: '请选择开始日期' }]}>
            <DatePicker style={{ width: '100%' }} placeholder="请选择开始日期" />
          </Form.Item>
          <Form.Item name="end_date" label="结束日期">
            <DatePicker style={{ width: '100%' }} placeholder="请选择结束日期（可选）" />
          </Form.Item>
          <Form.Item name="description" label="业绩描述">
            <Input.TextArea rows={4} placeholder="请输入业绩描述（可选）" />
          </Form.Item>
          <Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={submitting}>
              提交提报
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => form.resetFields()}>
              重置
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  )
}
