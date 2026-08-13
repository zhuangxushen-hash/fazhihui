import { useState, useMemo } from 'react'
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Tabs,
  Space,
  Table,
  Popconfirm,
  message,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDateTime } from '../utils/format'

// ===================== 类型定义 =====================

type SealType = 'official' | 'contract' | 'personal' | 'financial'
type SealStatus = 'active' | 'inactive'

interface SealItem {
  id: string
  name: string
  type: SealType
  status: SealStatus
  creator: string
  created_at: string
  usage_count: number
  content: string
}

interface SealRecord {
  id: string
  seal_id: string
  seal_name: string
  document_name: string
  operator: string
  action: string
  created_at: string
}

// ===================== 常量映射 =====================

const sealTypeLabelMap: Record<SealType, string> = {
  official: '公章',
  contract: '合同章',
  personal: '个人印章',
  financial: '财务章',
}

const sealTypeStitchMap: Record<SealType, string> = {
  official: 'stitch-tag stitch-tag-error',
  contract: 'stitch-tag stitch-tag-info',
  personal: 'stitch-tag stitch-tag-primary',
  financial: 'stitch-tag stitch-tag-gold',
}

const sealStatusStitchMap: Record<SealStatus, string> = {
  active: 'stitch-tag stitch-tag-success',
  inactive: 'stitch-tag stitch-tag-primary',
}

// ===================== 模拟数据 =====================

const mockSeals: SealItem[] = [
  {
    id: '1',
    name: '律师事务所公章',
    type: 'official',
    status: 'active',
    creator: '张主任',
    created_at: '2025-03-15 10:30:00',
    usage_count: 128,
    content: 'XX律师事务所',
  },
  {
    id: '2',
    name: '合同专用章',
    type: 'contract',
    status: 'active',
    creator: '李律师',
    created_at: '2025-04-20 14:20:00',
    usage_count: 86,
    content: '合同专用章',
  },
  {
    id: '3',
    name: '法人代表章',
    type: 'personal',
    status: 'active',
    creator: '王法人',
    created_at: '2025-01-10 09:00:00',
    usage_count: 42,
    content: '王大力印',
  },
  {
    id: '4',
    name: '财务专用章',
    type: 'financial',
    status: 'inactive',
    creator: '赵财务',
    created_at: '2025-02-28 16:45:00',
    usage_count: 15,
    content: '财务专用章',
  },
  {
    id: '5',
    name: '分公司公章',
    type: 'official',
    status: 'active',
    creator: '孙经理',
    created_at: '2025-05-05 11:00:00',
    usage_count: 67,
    content: 'XX律师事务所深圳分所',
  },
  {
    id: '6',
    name: '发票专用章',
    type: 'financial',
    status: 'inactive',
    creator: '赵财务',
    created_at: '2025-06-18 15:30:00',
    usage_count: 8,
    content: '发票专用章',
  },
]

const mockRecords: SealRecord[] = [
  {
    id: 'r1',
    seal_id: '1',
    seal_name: '律师事务所公章',
    document_name: '民事起诉状-张某诉李某合同纠纷案',
    operator: '张主任',
    action: '盖章',
    created_at: '2026-08-10 14:30:00',
  },
  {
    id: 'r2',
    seal_id: '2',
    seal_name: '合同专用章',
    document_name: '常年法律顾问服务合同',
    operator: '李律师',
    action: '盖章',
    created_at: '2026-08-09 11:20:00',
  },
  {
    id: 'r3',
    seal_id: '3',
    seal_name: '法人代表章',
    document_name: '授权委托书',
    operator: '王法人',
    action: '盖章',
    created_at: '2026-08-08 16:45:00',
  },
  {
    id: 'r4',
    seal_id: '1',
    seal_name: '律师事务所公章',
    document_name: '律师函-致XX科技有限公司',
    operator: '张主任',
    action: '盖章',
    created_at: '2026-08-07 10:15:00',
  },
  {
    id: 'r5',
    seal_id: '5',
    seal_name: '分公司公章',
    document_name: '劳动仲裁申请书',
    operator: '孙经理',
    action: '盖章',
    created_at: '2026-08-06 09:30:00',
  },
  {
    id: 'r6',
    seal_id: '2',
    seal_name: '合同专用章',
    document_name: '股权转让协议',
    operator: '李律师',
    action: '盖章',
    created_at: '2026-08-05 15:00:00',
  },
  {
    id: 'r7',
    seal_id: '1',
    seal_name: '律师事务所公章',
    document_name: '刑事辩护委托书',
    operator: '张主任',
    action: '盖章',
    created_at: '2026-08-04 13:20:00',
  },
]

// ===================== SVG 印章组件 =====================

interface SealSvgProps {
  name: string
  type: SealType
  content: string
  size?: number
}

function SealSvg({ name, type, content, size = 120 }: SealSvgProps) {
  const sealColor = '#c62828'
  const r = size / 2 - 4
  const cx = size / 2
  const cy = size / 2

  // 生成五角星路径
  const starPoints: string[] = []
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI / 2) * -1 + (i * 2 * Math.PI) / 5
    starPoints.push(`${cx + r * 0.35 * Math.cos(angle)},${cy + r * 0.35 * Math.sin(angle)}`)
    const innerAngle = angle + Math.PI / 5
    starPoints.push(`${cx + r * 0.15 * Math.cos(innerAngle)},${cy + r * 0.15 * Math.sin(innerAngle)}`)
  }

  // 印章文字弧度路径
  const arcRadius = r * 0.7
  const arcPathId = `arc-${name}-${type}`

  // 判断是否为个人印章（方形/无五角星）
  if (type === 'personal') {
    const w = size * 0.7
    const h = size * 0.7
    const x = (size - w) / 2
    const y = (size - h) / 2
    const charSize = w * 0.18
    const chars = content.split('')
    const gridCols = Math.ceil(Math.sqrt(chars.length))
    const gridRows = Math.ceil(chars.length / gridCols)
    const cellW = w / gridCols
    const cellH = h / gridRows

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={4}
          ry={4}
          fill="none"
          stroke={sealColor}
          strokeWidth={3}
        />
        {chars.map((char, idx) => {
          const col = idx % gridCols
          const row = Math.floor(idx / gridCols)
          const charX = x + cellW * (col + 0.5)
          const charY = y + cellH * (row + 0.5) + charSize * 0.35
          return (
            <text
              key={idx}
              x={charX}
              y={charY}
              textAnchor="middle"
              fontSize={charSize}
              fontWeight="bold"
              fill={sealColor}
              style={{ fontFamily: 'SimSun, serif' }}
            >
              {char}
            </text>
          )
        })}
      </svg>
    )
  }

  // 公章 / 合同章 / 财务章：圆形
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <path
          id={arcPathId}
          d={`M ${cx - arcRadius} ${cy} A ${arcRadius} ${arcRadius} 0 1 1 ${cx + arcRadius} ${cy}`}
          fill="none"
        />
      </defs>
      {/* 外圆 */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={sealColor} strokeWidth={3} />
      {/* 内圆 */}
      <circle cx={cx} cy={cy} r={r * 0.88} fill="none" stroke={sealColor} strokeWidth={1.5} />
      {/* 中心五角星 */}
      <polygon
        points={starPoints.join(' ')}
        fill={sealColor}
      />
      {/* 弧形文字 */}
      <text
        fontSize={r * 0.16}
        fontWeight="bold"
        fill={sealColor}
        style={{ fontFamily: 'SimSun, serif', letterSpacing: '0.1em' }}
      >
        <textPath xlinkHref={`#${arcPathId}`} startOffset="50%" textAnchor="middle">
          {content}
        </textPath>
      </text>
      {/* 底部横排文字 - 印章类型 */}
      <text
        x={cx}
        y={cy + r * 0.55}
        textAnchor="middle"
        fontSize={r * 0.12}
        fontWeight="bold"
        fill={sealColor}
        style={{ fontFamily: 'SimSun, serif' }}
      >
        {sealTypeLabelMap[type]}
      </text>
    </svg>
  )
}

// ===================== 页面组件 =====================

export default function DocumentSeal() {
  // 印章列表数据
  const [seals, setSeals] = useState<SealItem[]>(mockSeals)
  // 使用记录数据
  const [records] = useState<SealRecord[]>(mockRecords)

  // 筛选状态
  const [searchKeyword, setSearchKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<SealType | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<SealStatus | undefined>(undefined)

  // 印章弹窗
  const [sealModalVisible, setSealModalVisible] = useState(false)
  const [editingSeal, setEditingSeal] = useState<SealItem | null>(null)
  const [sealForm] = Form.useForm()

  // 预览弹窗
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewSeal, setPreviewSeal] = useState<SealItem | null>(null)

  // 使用记录筛选
  const [recordKeyword, setRecordKeyword] = useState('')

  // ========== 统计数据 ==========
  const totalSeals = seals.length
  const activeSeals = seals.filter((s) => s.status === 'active').length
  const totalUsage = seals.reduce((sum, s) => sum + s.usage_count, 0)

  // ========== 筛选过滤 ==========
  const filteredSeals = useMemo(() => {
    let result = [...seals]
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(kw) ||
          sealTypeLabelMap[s.type].includes(searchKeyword) ||
          s.creator.toLowerCase().includes(kw),
      )
    }
    if (typeFilter) {
      result = result.filter((s) => s.type === typeFilter)
    }
    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter)
    }
    return result
  }, [seals, searchKeyword, typeFilter, statusFilter])

  const filteredRecords = useMemo(() => {
    if (!recordKeyword) return records
    const kw = recordKeyword.toLowerCase()
    return records.filter(
      (r) =>
        r.seal_name.toLowerCase().includes(kw) ||
        r.document_name.toLowerCase().includes(kw) ||
        r.operator.toLowerCase().includes(kw),
    )
  }, [records, recordKeyword])

  // ========== 操作方法 ==========

  const handleAddSeal = () => {
    setEditingSeal(null)
    sealForm.resetFields()
    sealForm.setFieldsValue({ status: 'active', type: 'official' })
    setSealModalVisible(true)
  }

  const handleEditSeal = (seal: SealItem) => {
    setEditingSeal(seal)
    sealForm.setFieldsValue(seal)
    setSealModalVisible(true)
  }

  const handleSealSubmit = (values: Record<string, unknown>) => {
    if (editingSeal) {
      setSeals((prev) =>
        prev.map((s) =>
          s.id === editingSeal.id
            ? {
                ...s,
                name: values.name as string,
                type: values.type as SealType,
                content: values.content as string,
                status: values.status as SealStatus,
              }
            : s,
        ),
      )
      message.success('印章更新成功')
    } else {
      const newSeal: SealItem = {
        id: String(Date.now()),
        name: values.name as string,
        type: values.type as SealType,
        content: values.content as string,
        status: (values.status as SealStatus) || 'active',
        creator: '当前用户',
        created_at: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        usage_count: 0,
      }
      setSeals((prev) => [newSeal, ...prev])
      message.success('印章创建成功')
    }
    setSealModalVisible(false)
  }

  const handleDeleteSeal = (id: string) => {
    setSeals((prev) => prev.filter((s) => s.id !== id))
    message.success('删除成功')
  }

  const handleToggleStatus = (id: string) => {
    setSeals((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' }
          : s,
      ),
    )
    message.success('状态更新成功')
  }

  const handlePreview = (seal: SealItem) => {
    setPreviewSeal(seal)
    setPreviewVisible(true)
  }

  // ========== 表格列定义 ==========

  const recordColumns = [
    {
      title: '文件名称',
      dataIndex: 'document_name',
      key: 'document_name',
      ellipsis: true,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '使用印章',
      dataIndex: 'seal_name',
      key: 'seal_name',
      render: (text: string) => <Tag className="stitch-tag stitch-tag-primary">{text}</Tag>,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      render: (text: string) => (
        <Tag className="stitch-tag stitch-tag-success">{text}</Tag>
      ),
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => formatDateTime(text),
    },
  ]

  // ========== 渲染 ==========

  // KPI 卡片配置
  const kpiCards = [
    {
      title: '印章总数',
      value: totalSeals,
      icon: <SafetyCertificateOutlined />,
      bgClass: 'kpi-card-blue',
      textMode: 'light' as const,
    },
    {
      title: '启用中',
      value: activeSeals,
      icon: <CheckCircleOutlined />,
      bgClass: 'kpi-card-gold',
      textMode: 'dark' as const,
    },
    {
      title: '累计使用',
      value: totalUsage,
      icon: <HistoryOutlined />,
      bgClass: 'kpi-card-navy',
      textMode: 'light' as const,
    },
  ]

  const isLight = (mode: 'light' | 'dark') => mode === 'light'

  return (
    <div>
      {/* 顶部标题栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>电子印章管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSeal}>
          新建印章
        </Button>
      </div>

      {/* KPI 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {kpiCards.map((card, index) => {
          const light = isLight(card.textMode)
          const titleColor = light ? theme.white : theme.brandDark
          const valueColor = light ? theme.white : theme.brandDark
          const iconBgColor = light ? 'rgba(255, 255, 255, 0.22)' : 'rgba(26, 35, 50, 0.15)'
          const iconColor = light ? theme.white : theme.brandDark
          const haloBg = light
            ? 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(26,35,50,0.10) 0%, transparent 70%)'
          return (
            <Col xs={24} sm={8} key={index}>
              <Card
                className={`${card.bgClass} stitch-kpi-card`}
                styles={{ body: { padding: 20, position: 'relative', zIndex: 1, background: 'transparent' } }}
                style={{ height: '100%', position: 'relative' }}
              >
                <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: haloBg, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: titleColor, marginBottom: 12, fontWeight: 600 }}>{card.title}</div>
                    <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 32, fontWeight: 700, color: valueColor, lineHeight: 1.2, textShadow: light ? '0 2px 10px rgba(0,0,0,0.25)' : 'none' }}>
                      {card.value}
                    </div>
                  </div>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: iconBgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: iconColor }}>
                    {card.icon}
                  </div>
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* Tab 切换：印章列表 + 使用记录 */}
      <Tabs
        items={[
          {
            key: 'seals',
            label: '印章列表',
            children: (
              <div>
                {/* 筛选栏 */}
                <div className="stitch-filter-bar" style={{ background: theme.white, padding: 16, borderRadius: 12, marginBottom: 16 }}>
                  <Space wrap size={12}>
                    <Input
                      placeholder="搜索印章名称/类型/创建人"
                      allowClear
                      style={{ width: 240 }}
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onPressEnter={() => setSearchKeyword(searchKeyword)}
                      prefix={<SearchOutlined style={{ color: theme.textTertiary }} />}
                    />
                    <Select
                      placeholder="印章类型"
                      allowClear
                      style={{ width: 140 }}
                      value={typeFilter}
                      onChange={setTypeFilter}
                      options={[
                        { value: 'official', label: '公章' },
                        { value: 'contract', label: '合同章' },
                        { value: 'personal', label: '个人印章' },
                        { value: 'financial', label: '财务章' },
                      ]}
                    />
                    <Select
                      placeholder="状态"
                      allowClear
                      style={{ width: 120 }}
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={[
                        { value: 'active', label: '启用' },
                        { value: 'inactive', label: '禁用' },
                      ]}
                    />
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={() => setSearchKeyword(searchKeyword)}
                    >
                      查询
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        setSearchKeyword('')
                        setTypeFilter(undefined)
                        setStatusFilter(undefined)
                      }}
                    >
                      重置
                    </Button>
                  </Space>
                </div>

                {/* 印章卡片网格 */}
                {filteredSeals.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: theme.textTertiary }}>
                    <SafetyCertificateOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <div>暂无符合条件的印章</div>
                  </div>
                ) : (
                  <Row gutter={[16, 16]}>
                    {filteredSeals.map((seal) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={seal.id}>
                        <Card
                          hoverable
                          style={{
                            borderRadius: 12,
                            border: '1px solid',
                            borderColor: theme.borderSecondary,
                            boxShadow: theme.cardShadow,
                            overflow: 'hidden',
                          }}
                          bodyStyle={{ padding: 0 }}
                        >
                          {/* 印章图样区域 */}
                          <div
                            style={{
                              background: theme.bgSurface,
                              padding: '24px 16px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderBottom: `1px solid ${theme.borderSecondary}`,
                            }}
                          >
                            <SealSvg
                              name={seal.name}
                              type={seal.type}
                              content={seal.content}
                              size={120}
                            />
                          </div>

                          {/* 印章信息区域 */}
                          <div style={{ padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <span style={{ fontWeight: 600, fontSize: 15, color: theme.textBase, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {seal.name}
                              </span>
                              <Tag className={sealTypeStitchMap[seal.type]} style={{ marginLeft: 8 }}>
                                {sealTypeLabelMap[seal.type]}
                              </Tag>
                            </div>

                            <div style={{ marginBottom: 8 }}>
                              <Tag className={sealStatusStitchMap[seal.status]}>
                                {seal.status === 'active' ? '启用' : '禁用'}
                              </Tag>
                              <span style={{ marginLeft: 8, color: theme.textTertiary, fontSize: 12 }}>
                                使用 {seal.usage_count} 次
                              </span>
                            </div>

                            <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 12 }}>
                              <div>创建人：{seal.creator}</div>
                              <div>创建时间：{formatDateTime(seal.created_at)}</div>
                            </div>

                            {/* 操作按钮 */}
                            <Space size={4} style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
                              <Button
                                type="link"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => handlePreview(seal)}
                              >
                                预览
                              </Button>
                              <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEditSeal(seal)}
                              >
                                编辑
                              </Button>
                              <Button
                                type="link"
                                size="small"
                                icon={seal.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                                onClick={() => handleToggleStatus(seal.id)}
                              >
                                {seal.status === 'active' ? '禁用' : '启用'}
                              </Button>
                              <Popconfirm
                                title="确认删除"
                                description={`确定要删除印章「${seal.name}」吗？`}
                                okText="确定"
                                cancelText="取消"
                                onConfirm={() => handleDeleteSeal(seal.id)}
                              >
                                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                                  删除
                                </Button>
                              </Popconfirm>
                            </Space>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            ),
          },
          {
            key: 'records',
            label: '使用记录',
            children: (
              <div>
                {/* 筛选栏 */}
                <div className="stitch-filter-bar" style={{ background: theme.white, padding: 16, borderRadius: 12, marginBottom: 16 }}>
                  <Space wrap size={12}>
                    <Input
                      placeholder="搜索文件名称/印章/操作人"
                      allowClear
                      style={{ width: 260 }}
                      value={recordKeyword}
                      onChange={(e) => setRecordKeyword(e.target.value)}
                      onPressEnter={() => setRecordKeyword(recordKeyword)}
                      prefix={<SearchOutlined style={{ color: theme.textTertiary }} />}
                    />
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={() => setRecordKeyword(recordKeyword)}
                    >
                      查询
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => setRecordKeyword('')}
                    >
                      重置
                    </Button>
                  </Space>
                </div>

                {/* 使用记录表格 */}
                <div className="stitch-table" style={{ background: theme.white, padding: 16, borderRadius: 12 }}>
                  <Table
                    dataSource={filteredRecords}
                    columns={recordColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
                    locale={{ emptyText: '暂无使用记录' }}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* 新建/编辑印章弹窗 */}
      <Modal
        title={editingSeal ? '编辑印章' : '新建印章'}
        open={sealModalVisible}
        onCancel={() => setSealModalVisible(false)}
        onOk={() => sealForm.submit()}
        width={560}
        okText="确定"
        cancelText="取消"
      >
        <Form form={sealForm} onFinish={handleSealSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="印章名称"
            rules={[{ required: true, message: '请输入印章名称' }]}
          >
            <Input placeholder="如：XX律师事务所公章" />
          </Form.Item>

          <Form.Item
            name="type"
            label="印章类型"
            rules={[{ required: true, message: '请选择印章类型' }]}
          >
            <Select
              placeholder="请选择印章类型"
              options={[
                { value: 'official', label: '公章（圆形）' },
                { value: 'contract', label: '合同章（圆形）' },
                { value: 'personal', label: '个人印章（方形）' },
                { value: 'financial', label: '财务章（圆形）' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="印章中心文字"
            rules={[{ required: true, message: '请输入印章中心文字' }]}
            extra="圆形印章将显示为弧形文字，个人印章将显示为方形排列"
          >
            <Input placeholder="如：XX律师事务所" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue="active"
          >
            <Select
              options={[
                { value: 'active', label: '启用' },
                { value: 'inactive', label: '禁用' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 印章预览弹窗 */}
      <Modal
        title="印章预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
        ]}
        width={400}
        centered
      >
        {previewSeal && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <SealSvg
                name={previewSeal.name}
                type={previewSeal.type}
                content={previewSeal.content}
                size={180}
              />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              {previewSeal.name}
            </div>
            <Space size={[4, 8]} wrap style={{ justifyContent: 'center' }}>
              <Tag className={sealTypeStitchMap[previewSeal.type]}>
                {sealTypeLabelMap[previewSeal.type]}
              </Tag>
              <Tag className={sealStatusStitchMap[previewSeal.status]}>
                {previewSeal.status === 'active' ? '启用' : '禁用'}
              </Tag>
            </Space>
            <div style={{ marginTop: 16, color: theme.textTertiary, fontSize: 13 }}>
              <div>创建人：{previewSeal.creator}</div>
              <div>创建时间：{formatDateTime(previewSeal.created_at)}</div>
              <div>累计使用：{previewSeal.usage_count} 次</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}