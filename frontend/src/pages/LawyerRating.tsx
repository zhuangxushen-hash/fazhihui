import { useState, useEffect, useMemo } from 'react'
import { Card, Row, Col, Table, Tag, Select, Input, Button, Rate, Space, Tooltip, message } from 'antd'
import {
  TrophyOutlined,
  TeamOutlined,
  StarOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { getLawyers, LawyerItem } from '../api/lawyer-center'

// 专业领域选项
const fieldOptions = [
  { value: 'all', label: '全部领域' },
  { value: '合同纠纷', label: '合同纠纷' },
  { value: '婚姻家事', label: '婚姻家事' },
  { value: '刑事辩护', label: '刑事辩护' },
  { value: '知识产权', label: '知识产权' },
  { value: '公司法务', label: '公司法务' },
  { value: '劳动争议', label: '劳动争议' },
  { value: '房产纠纷', label: '房产纠纷' },
  { value: '交通事故', label: '交通事故' },
]

// 评级等级选项
const levelOptions = [
  { value: 'all', label: '全部等级' },
  { value: '特级', label: '特级律师' },
  { value: '一级', label: '一级律师' },
  { value: '二级', label: '二级律师' },
  { value: '三级', label: '三级律师' },
]

// 评级维度说明
const ratingDimensions = [
  { title: '专业能力', desc: '案件处理质量、法律文书水平、法律知识运用', weight: '35%' },
  { title: '服务态度', desc: '沟通响应速度、服务专业性、客户满意度', weight: '25%' },
  { title: '胜诉率', desc: '案件胜诉比例、法律风险把控能力', weight: '25%' },
  { title: '执业年限', desc: '执业年数、办案经验、专业领域深耕度', weight: '15%' },
]

// 评级等级对应的颜色
const levelColorMap: Record<string, string> = {
  '特级': '#c9a961',
  '一级': '#0071e3',
  '二级': '#2e7d32',
  '三级': '#717785',
}

export default function LawyerRating() {
  // 律师数据
  const [lawyers, setLawyers] = useState<LawyerItem[]>([])
  const [loading, setLoading] = useState(false)

  // 筛选条件
  const [searchName, setSearchName] = useState('')
  const [selectedField, setSelectedField] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')

  // 获取律师列表
  const fetchLawyers = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {}
      if (searchName) params.name = searchName
      params.page = 1
      params.page_size = 1000
      const res = (await getLawyers(params as never)) as Record<string, unknown>
      setLawyers((res?.data || []) as LawyerItem[])
    } catch (error) {
      message.error('律师列表加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLawyers()
  }, [])

  // 统计指标
  const stats = useMemo(() => {
    const total = lawyers.length
    const avgRating = total > 0 ? Number((lawyers.reduce((s, l) => s + Number(l.rating), 0) / total).toFixed(1)) : 0
    const excellent = lawyers.filter((l) => l.level === '特级' || Number(l.rating) >= 4.8).length
    const special = lawyers.filter((l) => l.level === '特级').length
    return { total, avgRating, excellent, special }
  }, [lawyers])

  // 统计卡片配置
  const statCardConfigs = [
    {
      title: '律师总数',
      value: stats.total,
      icon: <TeamOutlined />,
      suffix: '人',
      cardClass: 'kpi-card-blue',
      textMode: 'light' as const,
    },
    {
      title: '平均评分',
      value: stats.avgRating.toFixed(1),
      icon: <StarOutlined />,
      suffix: '分',
      cardClass: 'kpi-card-gold',
      textMode: 'dark' as const,
    },
    {
      title: '优秀律师数',
      value: stats.excellent,
      icon: <TrophyOutlined />,
      suffix: '人',
      cardClass: 'kpi-card-navy',
      textMode: 'light' as const,
    },
    {
      title: '特级律师',
      value: stats.special,
      icon: <TrophyOutlined />,
      suffix: '人',
      cardClass: 'kpi-card-green',
      textMode: 'light' as const,
    },
  ]

  // 筛选后的数据
  const filteredLawyers = useMemo(() => {
    return lawyers
      .filter((l) => selectedField === 'all' || l.field === selectedField)
      .filter((l) => selectedLevel === 'all' || l.level === selectedLevel)
      .sort((a, b) => Number(b.rating) - Number(a.rating))
  }, [lawyers, selectedField, selectedLevel])

  // 表格列定义
  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 70,
      render: (_: unknown, __: unknown, index: number) => {
        const rank = index + 1
        if (rank === 1)
          return <span style={{ fontSize: 20, color: '#c9a961' }}>1</span>
        if (rank === 2)
          return <span style={{ fontSize: 20, color: '#a8a8a8' }}>2</span>
        if (rank === 3)
          return <span style={{ fontSize: 20, color: '#cd7f32' }}>3</span>
        return <span style={{ color: theme.textTertiary, fontWeight: 500 }}>#{rank}</span>
      },
    },
    {
      title: '律师',
      key: 'lawyer',
      render: (_: unknown, record: LawyerItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: theme.gradientStat1,
              color: theme.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {record.avatar || String(record.name || '律').slice(0, 1)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: theme.textBase }}>{record.name}</div>
            <div style={{ fontSize: 12, color: theme.textTertiary }}>
              执业 {record.years || 1} 年{record.position && record.position !== '-' ? ` · ${record.position}` : ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '专业领域',
      dataIndex: 'field',
      key: 'field',
      render: (field: string) => (
        <Tag className="stitch-tag stitch-tag-info" style={{ borderRadius: 999 }}>
          {field}
        </Tag>
      ),
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      sorter: (a: LawyerItem, b: LawyerItem) => Number(a.rating) - Number(b.rating),
      render: (rating: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Rate disabled value={rating} allowHalf style={{ fontSize: 14 }} />
          <span style={{ fontWeight: 600, color: theme.primaryDark, fontFamily: "'Noto Serif SC', serif" }}>
            {Number(rating).toFixed(1)}
          </span>
        </div>
      ),
    },
    {
      title: '评级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => (
        <Tag
          style={{ borderRadius: 4, fontWeight: 600, color: '#fff', background: levelColorMap[level] || '#717785' }}
        >
          {level}
        </Tag>
      ),
    },
    {
      title: '评级次数',
      dataIndex: 'rating_count',
      key: 'rating_count',
      sorter: (a: LawyerItem, b: LawyerItem) => Number(a.rating_count) - Number(b.rating_count),
      render: (count: number) => (
        <span style={{ fontWeight: 600, fontFamily: "'Noto Serif SC', serif" }}>{count || 0}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: LawyerItem) => (
        <Tooltip title="查看律师主页">
          <Button
            type="link"
            icon={<EyeOutlined />}
            style={{ color: theme.primary, padding: 0 }}
            onClick={() => window.location.hash = `#/lawyer-home/${record.id}`}
          >
            主页
          </Button>
        </Tooltip>
      ),
    },
  ]

  // 搜索筛选
  const handleSearch = () => {
    fetchLawyers()
  }

  // 重置筛选
  const handleReset = () => {
    setSearchName('')
    setSelectedField('all')
    setSelectedLevel('all')
    fetchLawyers()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 统计卡片区 */}
      <Row gutter={[16, 16]}>
        {statCardConfigs.map((card, index) => {
          const isLight = card.textMode === 'light'
          const titleColor = isLight ? theme.white : theme.brandDark
          const valueColor = isLight ? theme.white : theme.brandDark
          const iconBgColor = isLight ? 'rgba(255, 255, 255, 0.22)' : 'rgba(26, 35, 50, 0.15)'
          const iconColor = isLight ? theme.white : theme.brandDark
          return (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                className={`${card.cardClass} stitch-kpi-card`}
                styles={{ body: { padding: 20, position: 'relative', zIndex: 1, background: 'transparent' } }}
                style={{ height: '100%', position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, color: titleColor, marginBottom: 12, fontWeight: 600 }}>
                      {card.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Noto Serif SC', serif",
                        fontSize: 32,
                        fontWeight: 700,
                        color: valueColor,
                        lineHeight: 1.2,
                      }}
                    >
                      {card.value}
                      <span style={{ fontSize: 16, marginLeft: 4, fontWeight: 500 }}>{card.suffix}</span>
                    </div>
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: iconBgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: iconColor,
                      fontSize: 22,
                    }}
                  >
                    {card.icon}
                  </div>
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* 筛选栏 */}
      <Card styles={{ body: { padding: 16 } }} style={{ borderRadius: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Space style={{ display: 'flex', alignItems: 'center' }}>
            <FilterOutlined style={{ color: theme.textTertiary }} />
            <span style={{ color: theme.textSecondary, fontWeight: 500 }}>筛选：</span>
          </Space>
          <Input
            placeholder="输入律师姓名"
            prefix={<SearchOutlined style={{ color: theme.textTertiary }} />}
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            value={selectedField}
            onChange={setSelectedField}
            options={fieldOptions}
            style={{ width: 160 }}
          />
          <Select
            value={selectedLevel}
            onChange={setSelectedLevel}
            options={levelOptions}
            style={{ width: 140 }}
          />
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={handleReset} style={{ color: theme.textSecondary }}>
            重置
          </Button>
          <div style={{ marginLeft: 'auto', color: theme.textTertiary, fontSize: 13 }}>
            共找到 <span style={{ color: theme.primary, fontWeight: 600 }}>{filteredLawyers.length}</span> 位律师
          </div>
        </div>
      </Card>

      {/* 排名表格 */}
      <Card
        title={<span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600, color: theme.textBase }}>律师排名</span>}
        extra={
          <Space>
            <Tag className="stitch-tag stitch-tag-gold">
              <UserOutlined /> 评级数据实时更新
            </Tag>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={filteredLawyers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          size="middle"
        />
      </Card>

      {/* 评级维度说明 */}
      <Card
        title={<span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600, color: theme.textBase }}>评级维度说明</span>}
      >
        <Row gutter={[16, 16]}>
          {ratingDimensions.map((dim, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <div
                style={{
                  padding: 20,
                  borderRadius: 12,
                  border: `1px solid ${theme.borderSecondary}`,
                  background: theme.bgSurfaceLow,
                  height: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: theme.textBase, fontSize: 15 }}>{dim.title}</span>
                  <Tag className="stitch-tag stitch-tag-gold">{dim.weight}</Tag>
                </div>
                <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6 }}>
                  {dim.desc}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}
