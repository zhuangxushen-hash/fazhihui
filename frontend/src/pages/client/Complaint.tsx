import { useState, useEffect } from 'react'
import { Form, Input, message, Spin, Select } from 'antd'
import { LeftOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from '../../api/axios'
import { createComplaint, getClientCases } from '../../api/client'
import { Card } from './shared'

/** 投诉类型（设计稿：服务态度 / 办理进度 / 收费问题 / 其他） */
const COMPLAINT_TYPES = [
  { value: 'service_quality', label: '服务态度' },
  { value: 'progress', label: '办理进度' },
  { value: 'fee_issue', label: '收费问题' },
  { value: 'other', label: '其他' },
]

export default function Complaint() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeType, setActiveType] = useState<string>('service_quality')
  const [evidence, setEvidence] = useState<string[]>([])
  const [caseOptions, setCaseOptions] = useState<any[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(undefined)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  /** 加载当前客户的在办案件，供「投诉对象」关联选择 */
  useEffect(() => {
    let mounted = true
    if (user?.id) {
      getClientCases({ client_id: user.id })
        .then((res: any) => {
          if (!mounted) return
          const arr = Array.isArray(res) ? res : []
          setCaseOptions(
            arr.map((c: any) => ({
              value: c.id,
              label: `${c.case_no || c.case_name || '案件'} · ${c.case_name || ''}`.trim(),
            })),
          )
        })
        .catch(() => {})
    }
    return () => {
      mounted = false
    }
  }, [user?.id])

  /** 上传凭证（复用服务大厅的上传接口，返回可访问 URL） */
  const handleUpload = async (file: File) => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res: any = await axios.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res?.url || res?.file_url
      if (url) {
        setEvidence((prev) => [...prev, url])
        message.success('凭证已上传')
      }
    } catch (error) {
      message.error('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    let values: any
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    setLoading(true)
    try {
      await createComplaint({
        type: activeType,
        content: values.content,
        client_id: user.id,
        client_name: user.real_name || user.name || '',
        client_phone: values.phone || user.phone || '',
        organization_id: user.organization_id,
        case_id: selectedCaseId,
        evidence_files: evidence.length ? JSON.stringify(evidence) : undefined,
      })
      message.success('投诉提交成功，我们将在 24 小时内响应')
      form.resetFields()
      setEvidence([])
      setSelectedCaseId(undefined)
      navigate('/client/my-complaints')
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="client-app">
      <div
        style={{
          maxWidth: 375,
          margin: '0 auto',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#F6F7F9',
        }}
      >
        {/* ===== 自定义导航栏 ===== */}
        <div
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 4,
            paddingRight: 10,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: 40,
              height: 40,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <LeftOutlined style={{ fontSize: 18, color: '#0F172A' }} />
          </button>
          <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#0F172A' }}>投诉与建议</span>
          <div
            onClick={() => navigate('/client/my-complaints')}
            style={{
              width: 87,
              flexShrink: 0,
              textAlign: 'right',
              fontSize: 13,
              color: '#1E3A8A',
              cursor: 'pointer',
            }}
          >
            我的投诉
          </div>
        </div>

        {/* ===== 内容区 ===== */}
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column' }}
        >
          <Card
            style={{
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* 投诉类型 */}
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>投诉类型</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {COMPLAINT_TYPES.map((t) => {
                const active = activeType === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setActiveType(t.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 99,
                      border: 'none',
                      background: active ? '#1E3A8A' : '#EEF2FB',
                      color: active ? '#FFFFFF' : '#1E3A8A',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>

            {/* 投诉对象（关联案件，选填） */}
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>投诉对象</div>
            <Select
              value={selectedCaseId}
              onChange={setSelectedCaseId}
              placeholder="请选择关联案件（选填）"
              allowClear
              style={{ height: 44, borderRadius: 12 }}
              options={caseOptions}
              notFoundContent={caseOptions.length ? '无匹配案件' : '暂无可关联案件'}
            />

            {/* 联系电话 */}
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>联系电话</div>
            <Form.Item
              name="phone"
              style={{ marginBottom: 0 }}
              rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
            >
              <Input
                placeholder="请输入手机号"
                className="mp-field-input"
                style={{ height: 44, borderRadius: 12 }}
              />
            </Form.Item>

            {/* 问题描述 */}
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>问题描述</div>
            <Form.Item
              name="content"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: '请描述您遇到的问题' }]}
            >
              <Input.TextArea
                placeholder="请详细描述您遇到的问题，我们将尽快处理..."
                rows={4}
                className="mp-field-textarea"
                style={{ borderRadius: 12, minHeight: 120, resize: 'none' }}
              />
            </Form.Item>

            {/* 上传凭证 */}
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>上传凭证</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {evidence.map((url, i) => (
                <div
                  key={i}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <img src={url} alt="凭证" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
              <label
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  background: '#F6F7F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {uploading ? (
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 20, color: '#94A3B8' }} spin />} />
                ) : (
                  <PlusOutlined style={{ fontSize: 24, color: '#94A3B8' }} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>

            {/* 弹性间隔 */}
            <div style={{ flex: 1, minHeight: 8 }} />

            {/* 提交按钮 */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                height: 48,
                borderRadius: 12,
                border: 'none',
                background: '#1E3A8A',
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {loading ? '提交中...' : '提交投诉'}
            </button>
          </Card>
        </Form>

        {/* 底部安全区 */}
        <div style={{ height: 34 }} />
      </div>
    </div>
  )
}
