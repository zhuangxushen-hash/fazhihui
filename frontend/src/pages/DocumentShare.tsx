import { useState, useCallback, useMemo } from 'react'
import {
  Typography,
  Space,
  Button,
  Card,
  Form,
  Input,
  DatePicker,
  Switch,
  Table,
  Tag,
  Tooltip,
  Modal,
  message,
  Radio,
  Checkbox,
  Divider,
  Empty,
  Segmented,
  Row,
  Col,
} from 'antd'
import {
  ShareAltOutlined,
  LinkOutlined,
  CopyOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  LockOutlined,
  ClockCircleOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FilePdfOutlined,
  FileOutlined,
  DeleteOutlined,
  StopOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyOutlined,
  UserOutlined,
  CalendarOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { theme } from '../constants/theme'

const { Title, Text } = Typography

// 分享权限类型
type SharePermission = 'view' | 'download' | 'edit'

// 分享状态
type ShareStatus = 'active' | 'expired' | 'disabled'

// 文档信息
interface DocItem {
  id: string
  name: string
  type: 'word' | 'excel' | 'ppt' | 'pdf' | 'other'
  size: string
  updatedAt: string
}

// 分享记录
interface ShareRecord {
  id: string
  documentId: string
  documentName: string
  documentType: string
  shareLink: string
  permissions: SharePermission[]
  expireAt: string
  password: string | null
  status: ShareStatus
  viewCount: number
  createdAt: string
  createdBy: string
}

// 可选文档列表
const availableDocs: DocItem[] = [
  { id: 'DOC-001', name: '2024年度法律顾问合同范本.docx', type: 'word', size: '2.35 MB', updatedAt: '2024-03-20' },
  { id: 'DOC-002', name: '案件进度汇总表.xlsx', type: 'excel', size: '856 KB', updatedAt: '2024-03-18' },
  { id: 'DOC-003', name: '法律风险管理实务.pptx', type: 'ppt', size: '5.12 MB', updatedAt: '2024-03-15' },
  { id: 'DOC-004', name: '民事起诉状模板.pdf', type: 'pdf', size: '1.28 MB', updatedAt: '2024-03-10' },
  { id: 'DOC-005', name: '律师事务所规章制度.docx', type: 'word', size: '3.45 MB', updatedAt: '2024-02-28' },
  { id: 'DOC-006', name: '财务对账单.xlsx', type: 'excel', size: '420 KB', updatedAt: '2024-02-25' },
]

// 分享记录 mock 数据
const mockShareRecords: ShareRecord[] = [
  {
    id: 'SHARE-001',
    documentId: 'DOC-001',
    documentName: '2024年度法律顾问合同范本.docx',
    documentType: 'word',
    shareLink: 'https://legal.example.com/share/abc123def456',
    permissions: ['view', 'download'],
    expireAt: '2024-12-31 23:59:59',
    password: 'Ls@2024',
    status: 'active',
    viewCount: 48,
    createdAt: '2024-03-20 14:30:00',
    createdBy: '张律师',
  },
  {
    id: 'SHARE-002',
    documentId: 'DOC-002',
    documentName: '案件进度汇总表.xlsx',
    documentType: 'excel',
    shareLink: 'https://legal.example.com/share/xyz789ghi012',
    permissions: ['view'],
    expireAt: '2024-06-30 18:00:00',
    password: null,
    status: 'active',
    viewCount: 12,
    createdAt: '2024-03-18 10:15:00',
    createdBy: '李律师',
  },
  {
    id: 'SHARE-003',
    documentId: 'DOC-004',
    documentName: '民事起诉状模板.pdf',
    documentType: 'pdf',
    shareLink: 'https://legal.example.com/share/mno345pqr678',
    permissions: ['view', 'download', 'edit'],
    expireAt: '2024-03-01 23:59:59',
    password: 'Qwerty123',
    status: 'expired',
    viewCount: 25,
    createdAt: '2024-02-15 09:00:00',
    createdBy: '王律师',
  },
  {
    id: 'SHARE-004',
    documentId: 'DOC-005',
    documentName: '律师事务所规章制度.docx',
    documentType: 'word',
    shareLink: 'https://legal.example.com/share/stu901vwx234',
    permissions: ['view'],
    expireAt: '2025-01-01 00:00:00',
    password: null,
    status: 'disabled',
    viewCount: 8,
    createdAt: '2024-01-20 16:45:00',
    createdBy: '赵主任',
  },
]

// 文档图标映射
const docIconMap: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  word: { icon: <FileWordOutlined />, color: '#2b579a', bg: '#e8f0fe' },
  excel: { icon: <FileExcelOutlined />, color: '#217346', bg: '#e8f5e9' },
  ppt: { icon: <FilePptOutlined />, color: '#d24726', bg: '#fbe9e7' },
  pdf: { icon: <FilePdfOutlined />, color: '#b30b00', bg: '#ffebee' },
  other: { icon: <FileOutlined />, color: theme.grayDark, bg: theme.bgSurfaceLow },
}

// 权限选项配置
const permissionOptions: { label: string; value: SharePermission; description: string; icon: React.ReactNode }[] = [
  { label: '仅查看', value: 'view', description: '可在线预览但不可下载', icon: <EyeOutlined /> },
  { label: '可下载', value: 'download', description: '可预览并下载文档', icon: <DownloadOutlined /> },
  { label: '可编辑', value: 'edit', description: '可在线编辑并保存修改', icon: <EditOutlined /> },
]

// 有效期预设
const expirePresets = [
  { label: '1 天', days: 1 },
  { label: '7 天', days: 7 },
  { label: '30 天', days: 30 },
  { label: '永久有效', days: -1 },
]

export default function DocumentShare() {
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null)
  const [shareUrl, setShareUrl] = useState<string>('')
  const [shareRecords, setShareRecords] = useState<ShareRecord[]>(mockShareRecords)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [form] = Form.useForm()
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [currentShare, setCurrentShare] = useState<ShareRecord | null>(null)

  // 过滤后的分享记录
  const filteredRecords = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return shareRecords.filter((r) => r.status === 'active')
      case 'expired':
        return shareRecords.filter((r) => r.status === 'expired')
      case 'disabled':
        return shareRecords.filter((r) => r.status === 'disabled')
      default:
        return shareRecords
    }
  }, [shareRecords, activeTab])

  // 生成随机密码
  const generatePassword = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedPassword(password)
    return password
  }, [])

  // 生成分享链接
  const generateShareLink = useCallback((docId: string) => {
    const timestamp = Date.now().toString(36)
    const rand = Math.random().toString(36).substring(2, 8)
    return `https://legal.example.com/share/${docId.toLowerCase()}-${timestamp}${rand}`
  }, [])

  // 选择文档
  const handleSelectDoc = useCallback((doc: DocItem) => {
    setSelectedDoc(doc)
  }, [])

  // 创建分享
  const handleCreateShare = useCallback(async () => {
    try {
      const values = await form.validateFields()
      if (!selectedDoc) {
        message.warning('请先选择要分享的文档')
        return
      }

      const permissions: SharePermission[] = values.permissions || ['view']
      const password = values.enablePassword ? (values.password || generatePassword()) : null
      const shareLink = generateShareLink(selectedDoc.id)

      let expireAt: string
      if (values.expireType === 'custom' && values.expireDate) {
        expireAt = values.expireDate.format('YYYY-MM-DD HH:mm:ss')
      } else if (values.expireDays === -1) {
        expireAt = '2099-12-31 23:59:59'
      } else {
        expireAt = dayjs().add(values.expireDays, 'day').format('YYYY-MM-DD HH:mm:ss')
      }

      const newRecord: ShareRecord = {
        id: `SHARE-${Date.now()}`,
        documentId: selectedDoc.id,
        documentName: selectedDoc.name,
        documentType: selectedDoc.type,
        shareLink,
        permissions,
        expireAt,
        password,
        status: 'active',
        viewCount: 0,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        createdBy: '当前用户',
      }

      setShareRecords((prev) => [newRecord, ...prev])
      setShareUrl(shareLink)
      form.resetFields()
      setSelectedDoc(null)
      message.success('分享链接创建成功')
    } catch {
      // 验证失败，不做额外处理
    }
  }, [selectedDoc, form, generatePassword, generateShareLink])

  // 复制链接
  const handleCopyLink = useCallback((link: string) => {
    navigator.clipboard
      .writeText(link)
      .then(() => message.success('链接已复制到剪贴板'))
      .catch(() => message.error('复制失败，请手动复制'))
  }, [])

  // 打开分享详情
  const openShareDetail = useCallback((record: ShareRecord) => {
    setCurrentShare(record)
    setShareModalVisible(true)
  }, [])

  // 取消分享（禁用）
  const handleDisableShare = useCallback((id: string) => {
    Modal.confirm({
      title: '确认取消分享',
      content: '取消后，该分享链接将立即失效，无法恢复。',
      okText: '确认取消',
      cancelText: '我再想想',
      okButtonProps: { danger: true },
      onOk: () => {
        setShareRecords((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: 'disabled' as ShareStatus } : r))
        )
        message.success('分享已取消')
      },
    })
  }, [])

  // 删除分享记录
  const handleDeleteShare = useCallback((id: string) => {
    Modal.confirm({
      title: '删除分享记录',
      content: '仅删除分享记录，不会影响已分享的文档。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setShareRecords((prev) => prev.filter((r) => r.id !== id))
        message.success('分享记录已删除')
      },
    })
  }, [])

  // 重新启用分享
  const handleEnableShare = useCallback((id: string) => {
    setShareRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'active' as ShareStatus } : r))
    )
    message.success('分享已重新启用')
  }, [])

  // 复制密码
  const handleCopyPassword = useCallback((pwd: string) => {
    navigator.clipboard
      .writeText(pwd)
      .then(() => message.success('密码已复制'))
      .catch(() => message.error('复制失败'))
  }, [])

  // 表格列定义
  const columns: ColumnsType<ShareRecord> = [
    {
      title: '文档名称',
      dataIndex: 'documentName',
      key: 'documentName',
      width: 260,
      render: (_, record) => {
        const iconConfig = docIconMap[record.documentType] || docIconMap.other
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: iconConfig.bg,
                color: iconConfig.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {iconConfig.icon}
            </div>
            <span style={{ color: theme.textBase, fontWeight: 500 }}>
              {record.documentName}
            </span>
          </div>
        )
      },
    },
    {
      title: '分享链接',
      dataIndex: 'shareLink',
      key: 'shareLink',
      width: 280,
      ellipsis: true,
      render: (link: string) => (
        <Tooltip title={link}>
          <a href={link} target="_blank" rel="noreferrer" style={{ color: theme.link }}>
            {link}
          </a>
        </Tooltip>
      ),
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 180,
      render: (permissions: SharePermission[]) => (
        <Space size={4} wrap>
          {permissions.map((p) => {
            const config = permissionOptions.find((opt) => opt.value === p)
            if (!config) return null
            const colorMap: Record<SharePermission, string> = {
              view: 'blue',
              download: 'green',
              edit: 'orange',
            }
            return (
              <Tag key={p} color={colorMap[p]} style={{ margin: 0 }}>
                {config.label}
              </Tag>
            )
          })}
        </Space>
      ),
    },
    {
      title: '访问密码',
      dataIndex: 'password',
      key: 'password',
      width: 140,
      render: (pwd: string | null) =>
        pwd ? (
          <Tag icon={<LockOutlined />} color="gold">
            {pwd}
          </Tag>
        ) : (
          <Tag>无密码</Tag>
        ),
    },
    {
      title: '有效期至',
      dataIndex: 'expireAt',
      key: 'expireAt',
      width: 170,
      render: (date: string) => (
        <span style={{ color: theme.textSecondary }}>
          {date === '2099-12-31 23:59:59' ? '永久有效' : date}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ShareStatus) => {
        const statusMap: Record<ShareStatus, { text: string; color: string; icon: React.ReactNode }> = {
          active: { text: '生效中', color: 'success', icon: <CheckCircleOutlined /> },
          expired: { text: '已过期', color: 'warning', icon: <ClockCircleOutlined /> },
          disabled: { text: '已取消', color: 'default', icon: <CloseCircleOutlined /> },
        }
        const config = statusMap[status]
        return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>
      },
    },
    {
      title: '查看次数',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
      align: 'right' as const,
      render: (count: number) => (
        <span style={{ color: theme.textSecondary }}>{count} 次</span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) => (
        <span style={{ color: theme.textTertiary }}>{date}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<LinkOutlined />} onClick={() => openShareDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopyLink(record.shareLink)}>
            复制链接
          </Button>
          {record.status === 'active' ? (
            <Button
              type="link"
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleDisableShare(record.id)}
            >
              取消分享
            </Button>
          ) : record.status === 'disabled' ? (
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleEnableShare(record.id)}
            >
              重新启用
            </Button>
          ) : null}
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteShare(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ background: theme.bgLayout, minHeight: '100vh', padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: theme.textBase }}>
          <ShareAltOutlined style={{ marginRight: 8, color: theme.primary }} />
          文档分享管理
        </Title>
        <Text type="secondary">生成文档分享链接，设置访问权限与有效期，管理已分享的文档</Text>
      </div>

      {/* 分享链接生成区 */}
      <Card
        style={{ marginBottom: 24, borderRadius: 12, boxShadow: theme.cardShadow }}
        bodyStyle={{ padding: 24 }}
      >
        <Title level={4} style={{ marginTop: 0 }}>
          <PlusOutlined style={{ marginRight: 8, color: theme.primary }} />
          创建分享链接
        </Title>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            permissions: ['view'],
            expireType: 'preset',
            expireDays: 7,
            enablePassword: false,
          }}
          onFinish={handleCreateShare}
        >
          {/* 步骤一：选择文档 */}
          <Form.Item label="第一步：选择要分享的文档" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {availableDocs.map((doc) => {
                const iconConfig = docIconMap[doc.type] || docIconMap.other
                const isSelected = selectedDoc?.id === doc.id
                return (
                  <Card
                    key={doc.id}
                    hoverable
                    onClick={() => handleSelectDoc(doc)}
                    style={{
                      width: 220,
                      cursor: 'pointer',
                      borderColor: isSelected ? theme.primary : theme.borderSecondary,
                      borderWidth: isSelected ? 2 : 1,
                      borderRadius: 8,
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? theme.cardShadow : 'none',
                    }}
                    bodyStyle={{ padding: 12 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: iconConfig.bg,
                          color: iconConfig.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        {iconConfig.icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: theme.textBase,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {doc.name}
                        </div>
                        <div style={{ fontSize: 12, color: theme.textTertiary }}>
                          {doc.size} · {doc.updatedAt}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Tag color="blue" style={{ marginTop: 4 }}>
                        <CheckCircleOutlined /> 已选择
                      </Tag>
                    )}
                  </Card>
                )
              })}
            </div>
          </Form.Item>

          <Row gutter={24}>
            {/* 步骤二：分享权限 */}
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    <LockOutlined style={{ marginRight: 4 }} />
                    第二步：设置分享权限
                  </span>
                }
                name="permissions"
                rules={[{ required: true, message: '请至少选择一项权限' }]}
              >
                <Checkbox.Group
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {permissionOptions.map((opt) => (
                    <Checkbox
                      key={opt.value}
                      value={opt.value}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${theme.borderSecondary}`,
                        background: theme.bgSurface,
                      }}
                    >
                      <Space align="start">
                        <span style={{ fontSize: 16, color: theme.primary }}>{opt.icon}</span>
                        <div>
                          <div style={{ fontWeight: 500, color: theme.textBase }}>{opt.label}</div>
                          <div style={{ fontSize: 12, color: theme.textTertiary }}>{opt.description}</div>
                        </div>
                      </Space>
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </Form.Item>
            </Col>

            {/* 步骤三：有效期和密码 */}
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    第三步：设置有效期
                  </span>
                }
                name="expireType"
              >
                <Radio.Group>
                  <Radio value="preset">快捷设置</Radio>
                  <Radio value="custom">自定义日期</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item noStyle shouldUpdate={(prev, cur) => prev.expireType !== cur.expireType}>
                {({ getFieldValue }) =>
                  getFieldValue('expireType') === 'preset' ? (
                    <Form.Item name="expireDays">
                      <Radio.Group style={{ display: 'flex', gap: 8 }}>
                        {expirePresets.map((preset) => (
                          <Radio.Button key={preset.days} value={preset.days}>
                            {preset.label}
                          </Radio.Button>
                        ))}
                      </Radio.Group>
                    </Form.Item>
                  ) : (
                    <Form.Item
                      name="expireDate"
                      rules={[{ required: true, message: '请选择到期时间' }]}
                    >
                      <DatePicker
                        showTime
                        placeholder="选择到期时间"
                        style={{ width: '100%' }}
                        format="YYYY-MM-DD HH:mm"
                        disabledDate={(current: Dayjs) => current && current < dayjs()}
                      />
                    </Form.Item>
                  )
                }
              </Form.Item>

              <Divider style={{ margin: '12px 0' }} />

              <Form.Item
                label={
                  <span>
                    <KeyOutlined style={{ marginRight: 4 }} />
                    设置访问密码
                  </span>
                }
              >
                <Form.Item
                  name="enablePassword"
                  valuePropName="checked"
                  style={{ marginBottom: 12 }}
                >
                  <Switch
                    checkedChildren="开启"
                    unCheckedChildren="关闭"
                  />
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) => prev.enablePassword !== cur.enablePassword}
                >
                  {({ getFieldValue }) =>
                    getFieldValue('enablePassword') && (
                      <Form.Item
                        name="password"
                        rules={[{ min: 6, message: '密码至少 6 位' }]}
                        extra="留空将自动生成 8 位随机密码"
                      >
                        <Space.Compact style={{ width: '100%' }}>
                          <Input
                            placeholder="请输入访问密码"
                            value={generatedPassword || undefined}
                            style={{ flex: 1 }}
                          />
                          <Button onClick={generatePassword} icon={<SafetyOutlined />}>
                            自动生成
                          </Button>
                        </Space.Compact>
                      </Form.Item>
                    )
                  }
                </Form.Item>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<ShareAltOutlined />}
                onClick={() => form.submit()}
                disabled={!selectedDoc}
              >
                生成分享链接
              </Button>
              <Button
                size="large"
                onClick={() => {
                  form.resetFields()
                  setSelectedDoc(null)
                  setShareUrl('')
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* 生成结果展示 */}
        {shareUrl && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: theme.bgSurfaceLow,
              borderRadius: 8,
              border: `1px solid ${theme.borderSecondary}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <CheckCircleOutlined style={{ color: theme.success, fontSize: 18 }} />
              <Text strong style={{ color: theme.success }}>
                分享链接已生成
              </Text>
            </div>
            <Input
              value={shareUrl}
              readOnly
              suffix={
                <Button
                  type="link"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyLink(shareUrl)}
                >
                  复制
                </Button>
              }
              style={{ marginBottom: 8 }}
            />
            {generatedPassword && (
              <div style={{ color: theme.textTertiary, fontSize: 13 }}>
                访问密码：
                <Text strong style={{ color: theme.textBase }}>{generatedPassword}</Text>
                <Button
                  type="link"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyPassword(generatedPassword)}
                  style={{ marginLeft: 8 }}
                >
                  复制密码
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 分享记录列表 */}
      <Card
        style={{ borderRadius: 12, boxShadow: theme.cardShadow }}
        bodyStyle={{ padding: 0 }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${theme.borderSecondary}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            <UserOutlined style={{ marginRight: 8, color: theme.primary }} />
            分享记录
          </Title>
          <Space>
            <Segmented
              value={activeTab}
              onChange={(val) => setActiveTab(val as string)}
              options={[
                { label: `全部 (${shareRecords.length})`, value: 'all' },
                {
                  label: `生效中 (${shareRecords.filter((r) => r.status === 'active').length})`,
                  value: 'active',
                },
                {
                  label: `已过期 (${shareRecords.filter((r) => r.status === 'expired').length})`,
                  value: 'expired',
                },
                {
                  label: `已取消 (${shareRecords.filter((r) => r.status === 'disabled').length})`,
                  value: 'disabled',
                },
              ]}
            />
          </Space>
        </div>

        <Table<ShareRecord>
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1400 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: theme.textTertiary }}>暂无分享记录</span>
                }
              />
            ),
          }}
        />
      </Card>

      {/* 分享详情弹窗 */}
      <Modal
        title="分享详情"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setShareModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {currentShare && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 文档信息 */}
            <div
              style={{
                padding: 16,
                background: theme.bgSurfaceLow,
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: (docIconMap[currentShare.documentType] || docIconMap.other).bg,
                    color: (docIconMap[currentShare.documentType] || docIconMap.other).color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  {(docIconMap[currentShare.documentType] || docIconMap.other).icon}
                </div>
                <div>
                  <Text strong style={{ color: theme.textBase, fontSize: 15 }}>
                    {currentShare.documentName}
                  </Text>
                  <div style={{ fontSize: 12, color: theme.textTertiary }}>
                    创建人：{currentShare.createdBy} · {currentShare.createdAt}
                  </div>
                </div>
              </div>
            </div>

            {/* 分享链接 */}
            <div>
              <div style={{ fontSize: 13, color: theme.textTertiary, marginBottom: 6 }}>分享链接</div>
              <Input
                value={currentShare.shareLink}
                readOnly
                suffix={
                  <Button
                    type="link"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyLink(currentShare.shareLink)}
                  >
                    复制
                  </Button>
                }
              />
            </div>

            {/* 权限信息 */}
            <div>
              <div style={{ fontSize: 13, color: theme.textTertiary, marginBottom: 6 }}>分享权限</div>
              <Space size={8} wrap>
                {currentShare.permissions.map((p) => {
                  const config = permissionOptions.find((opt) => opt.value === p)
                  if (!config) return null
                  return <Tag key={p}>{config.label}</Tag>
                })}
              </Space>
            </div>

            {/* 有效期与密码 */}
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ fontSize: 13, color: theme.textTertiary, marginBottom: 6 }}>
                  <CalendarOutlined /> 有效期至
                </div>
                <Text style={{ color: theme.textBase }}>
                  {currentShare.expireAt === '2099-12-31 23:59:59'
                    ? '永久有效'
                    : currentShare.expireAt}
                </Text>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 13, color: theme.textTertiary, marginBottom: 6 }}>
                  <KeyOutlined /> 访问密码
                </div>
                {currentShare.password ? (
                  <Space>
                    <Tag color="gold">{currentShare.password}</Tag>
                    <Button
                      type="link"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyPassword(currentShare.password!)}
                    >
                      复制
                    </Button>
                  </Space>
                ) : (
                  <Text type="secondary">无密码保护</Text>
                )}
              </Col>
            </Row>

            {/* 状态与统计 */}
            <Divider style={{ margin: '4px 0' }} />
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ fontSize: 12, color: theme.textTertiary }}>当前状态</div>
                <Space>
                  {currentShare.status === 'active' && <Tag color="success">生效中</Tag>}
                  {currentShare.status === 'expired' && <Tag color="warning">已过期</Tag>}
                  {currentShare.status === 'disabled' && <Tag>已取消</Tag>}
                </Space>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: theme.textTertiary }}>查看次数</div>
                <Text strong style={{ color: theme.textBase, fontSize: 18 }}>
                  {currentShare.viewCount}
                </Text>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: theme.textTertiary }}>分享 ID</div>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {currentShare.id}
                </Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}