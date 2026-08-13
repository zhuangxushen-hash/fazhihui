import { useState, useCallback, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Radio,
  Button,
  Space,
  message,
  Spin,
  Tag,
} from 'antd'
import {
  FileProtectOutlined,
  SendOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { theme } from '../constants/theme'
import { getFormTemplate } from '../api/form-template'
import type { FormField } from '../api/form-template'
import { getUsers } from '../api/user'

interface ApprovalUser {
  id: string
  real_name: string
  role: string
}

interface ApprovalFormTemplateProps {
  formType: string
  defaultName: string
  defaultDescription: string
}

/**
 * 通用审批单据组件
 * 根据表单模板动态渲染字段，提交审批流程
 */
export default function ApprovalFormTemplate({
  formType,
  defaultName,
  defaultDescription,
}: ApprovalFormTemplateProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [templateName, setTemplateName] = useState(defaultName)
  const [fields, setFields] = useState<FormField[]>([])
  const [approvers, setApprovers] = useState<ApprovalUser[]>([])

  // 加载表单模板与审批人列表
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const [tplRes, usersRes] = await Promise.all([getFormTemplate(formType), getUsers({})])
        const tpl = tplRes || {}
        setTemplateName(tpl.name || defaultName)
        setFields(tpl.fields || [])
        setApprovers(
          (usersRes.data || []).map((u) => ({
            id: u.id,
            real_name: u.real_name || '',
            role: u.role || '',
          })),
        )
      } catch (err) {
        message.error('加载表单模板失败')
      } finally {
        setLoading(false)
      }
    }
    loadTemplate()
  }, [formType])

  // 渲染表单字段
  const renderField = useCallback(
    (field: FormField) => {
      const commonRules = field.required ? [{ required: true, message: `请输入${field.label}` }] : []
      switch (field.type) {
        case 'number':
          return (
            <Form.Item key={field.key} name={field.key} label={field.label} rules={commonRules}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder={`请输入${field.label}`} />
            </Form.Item>
          )
        case 'textarea':
          return (
            <Form.Item key={field.key} name={field.key} label={field.label} rules={commonRules}>
              <Input.TextArea rows={3} placeholder={`请输入${field.label}`} />
            </Form.Item>
          )
        case 'select':
          return (
            <Form.Item key={field.key} name={field.key} label={field.label} rules={commonRules}>
              <Select
                placeholder={`请选择${field.label}`}
                options={(field.options || []).map((o) => ({ value: o, label: o }))}
              />
            </Form.Item>
          )
        case 'radio':
          return (
            <Form.Item key={field.key} name={field.key} label={field.label} rules={commonRules}>
              <Radio.Group options={(field.options || []).map((o) => ({ value: o, label: o }))} />
            </Form.Item>
          )
        case 'date':
          return (
            <Form.Item key={field.key} name={field.key} label={field.label} rules={commonRules}>
              <DatePicker style={{ width: '100%' }} placeholder={`请选择${field.label}`} />
            </Form.Item>
          )
        default:
          return (
            <Form.Item key={field.key} name={field.key} label={field.label} rules={commonRules}>
              <Input placeholder={`请输入${field.label}`} />
            </Form.Item>
          )
      }
    },
    [],
  )

  // 提交审批
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      // 将日期转为字符串
      const formData: Record<string, unknown> = { ...values }
      Object.keys(formData).forEach((key) => {
        if (formData[key] && dayjs.isDayjs(formData[key])) {
          formData[key] = (formData[key] as dayjs.Dayjs).format('YYYY-MM-DD')
        }
      })
      await (await import('../api/approval')).createApproval({
        title: `${templateName} - ${new Date().toLocaleDateString('zh-CN')}`,
        type: formType,
        content: formData,
        approvers: [formData.approver_id as string].filter(Boolean),
      })
      message.success('审批单据已提交')
      form.resetFields()
    } catch (err) {
      const e = err as { errorFields?: unknown }
      if (e?.errorFields) return
      message.error('提交审批失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 重置表单
  const handleReset = () => {
    form.resetFields()
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>
          <FileProtectOutlined style={{ color: theme.primary, marginRight: 8 }} />
          {templateName}
        </h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          {defaultDescription}
        </p>
      </div>

      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 24 } }}>
        <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
          {fields.map(renderField)}
          <Form.Item
            name="approver_id"
            label="审批人"
            rules={[{ required: true, message: '请选择审批人' }]}
          >
            <Select
              placeholder="请选择审批人"
              showSearch
              optionFilterProp="label"
              options={approvers.map((u) => ({
                value: u.id,
                label: `${u.real_name} (${u.role})`,
              }))}
            />
          </Form.Item>
          <Space>
            <Button type="primary" icon={<SendOutlined />} onClick={handleSubmit} loading={submitting}>
              提交审批
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Form>
      </Card>

      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 16 } }}>
        <div style={{ color: theme.textTertiary, fontSize: 13 }}>
          <Tag color="blue">提示</Tag>
          提交后审批单将进入审批流程，审批状态可在「审批中心」查看
        </div>
      </Card>
    </div>
  )
}
