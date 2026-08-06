import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Tabs, Card, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined, CheckOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  getOpinions,
  updateOpinionStatus,
  getKeywords,
  createKeyword,
  deleteKeyword,
  OpinionSentiment,
  OpinionStatus,
  PublicOpinion,
  OpinionKeyword,
} from '../api/public-opinion'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'

// 页面标题样式
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

// 平台标签映射
const platformLabelMap: Record<string, string> = {
  douyin: '抖音',
  weibo: '微博',
  xiaohongshu: '小红书',
  wechat: '微信',
  baidu: '百度',
  other: '其他',
}

// 情感倾向标签映射
const sentimentTagMap: Record<string, { label: string; cls: string }> = {
  positive: { label: '正面', cls: 'stitch-tag-success' },
  neutral: { label: '中性', cls: 'stitch-tag-info' },
  negative: { label: '负面', cls: 'stitch-tag-error' },
}

// 处理状态标签映射
const statusTagMap: Record<string, { label: string; cls: string }> = {
  pending: { label: '待处理', cls: 'stitch-tag-warning' },
  processed: { label: '已处理', cls: 'stitch-tag-success' },
  ignored: { label: '已忽略', cls: 'stitch-tag-info' },
}

export default function PublicOpinionMonitor() {
  const [activeTab, setActiveTab] = useState('opinions')
  const [list, setList] = useState<PublicOpinion[]>([])
  const [keywords, setKeywords] = useState<OpinionKeyword[]>([])
  const [loading, setLoading] = useState(false)
  const [keywordModalVisible, setKeywordModalVisible] = useState(false)
  const [form] = Form.useForm()
  // 查询条件
  const [searchKeyword, setSearchKeyword] = useState('')
  const [platform, setPlatform] = useState<string | undefined>(undefined)
  const [sentiment, setSentiment] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<string | undefined>(undefined)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 拉取舆情列表
  const fetchOpinions = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {}
      if (user.organization_id) params.org_id = user.organization_id
      if (platform) params.platform = platform
      if (sentiment) params.sentiment = sentiment
      if (status) params.status = status
      if (searchKeyword) params.keyword = searchKeyword
      const res = await getOpinions(params as Parameters<typeof getOpinions>[0]) as PublicOpinion[]
      setList(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  // 拉取关键词列表
  const fetchKeywords = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {}
      if (user.organization_id) params.org_id = user.organization_id
      const res = await getKeywords(params as Parameters<typeof getKeywords>[0]) as OpinionKeyword[]
      setKeywords(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'opinions') {
      fetchOpinions()
    } else {
      fetchKeywords()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // 状态流转：标记为已处理
  const handleProcess = async (record: PublicOpinion) => {
    try {
      await updateOpinionStatus(record.id, {
        status: OpinionStatus.PROCESSED,
        handler_id: user.id,
      })
      message.success('已标记为已处理')
      fetchOpinions()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 状态流转：忽略
  const handleIgnore = async (record: PublicOpinion) => {
    try {
      await updateOpinionStatus(record.id, {
        status: OpinionStatus.IGNORED,
        handler_id: user.id,
      })
      message.success('已忽略')
      fetchOpinions()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 重置查询条件
  const handleReset = () => {
    setSearchKeyword('')
    setPlatform(undefined)
    setSentiment(undefined)
    setStatus(undefined)
    fetchOpinions()
  }

  // 新增关键词
  const handleAddKeyword = () => {
    form.resetFields()
    setKeywordModalVisible(true)
  }

  // 提交关键词
  const handleSubmitKeyword = async (values: Record<string, unknown>) => {
    try {
      await createKeyword({
        keyword: values.keyword as string,
        organization_id: user.organization_id,
      })
      message.success('关键词创建成功')
      setKeywordModalVisible(false)
      fetchKeywords()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 删除关键词
  const handleDeleteKeyword = async (record: OpinionKeyword) => {
    try {
      await deleteKeyword(record.id)
      message.success('删除成功')
      fetchKeywords()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 舆情列表列定义
  const opinionColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (v: string, record: PublicOpinion) => (
        <div>
          <div style={{ fontWeight: 500, color: theme.textBase }}>{v || '-'}</div>
          {record.author && (
            <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 2 }}>作者：{record.author}</div>
          )}
        </div>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (v: string) => platformLabelMap[v] || v,
    },
    {
      title: '情感倾向',
      dataIndex: 'sentiment',
      key: 'sentiment',
      width: 100,
      render: (v: string) => {
        const item = sentimentTagMap[v]
        return item ? <span className={`stitch-tag ${item.cls}`}>{item.label}</span> : v
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const item = statusTagMap[v]
        return item ? <span className={`stitch-tag ${item.cls}`}>{item.label}</span> : v
      },
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: PublicOpinion) => (
        <Space className="stitch-btn-group">
          {record.status === OpinionStatus.PENDING && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleProcess(record)}>
              处理
            </Button>
          )}
          {record.status === OpinionStatus.PENDING && (
            <Button type="link" size="small" icon={<StopOutlined />} onClick={() => handleIgnore(record)}>
              忽略
            </Button>
          )}
          {record.source_url && (
            <Button type="link" size="small" href={record.source_url} target="_blank" rel="noreferrer">
              查看原文
            </Button>
          )}
        </Space>
      ),
    },
  ]

  // 关键词列定义
  const keywordColumns = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (v: string) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.textBase }}>
          {v}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 120,
      render: (v: boolean) => (
        <span className={`stitch-tag ${v ? 'stitch-tag-success' : 'stitch-tag-warning'}`}>
          {v ? '启用' : '停用'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: OpinionKeyword) => (
        <Popconfirm title="确认删除该关键词？" onConfirm={() => handleDeleteKeyword(record)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ),
    },
  ]

  const tabItems = [
    { key: 'opinions', label: '舆情列表' },
    { key: 'keywords', label: '关键词配置' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <h2 style={pageH2Style}>舆情监控</h2>
        {activeTab === 'keywords' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddKeyword}>新增关键词</Button>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems.map(t => ({ key: t.key, label: t.label }))}
      />

      {activeTab === 'opinions' && (
        <>
          {/* 查询条件区 */}
          <div className="stitch-filter-bar">
            <Input
              placeholder="标题/内容关键词"
              prefix={<SearchOutlined />}
              style={{ width: 220 }}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={fetchOpinions}
            />
            <Select
              placeholder="平台"
              allowClear
              style={{ width: 140 }}
              value={platform}
              onChange={(v) => setPlatform(v)}
              options={Object.entries(platformLabelMap).map(([value, label]) => ({ value, label }))}
            />
            <Select
              placeholder="情感倾向"
              allowClear
              style={{ width: 140 }}
              value={sentiment}
              onChange={(v) => setSentiment(v)}
              options={[
                { label: '正面', value: OpinionSentiment.POSITIVE },
                { label: '中性', value: OpinionSentiment.NEUTRAL },
                { label: '负面', value: OpinionSentiment.NEGATIVE },
              ]}
            />
            <Select
              placeholder="处理状态"
              allowClear
              style={{ width: 140 }}
              value={status}
              onChange={(v) => setStatus(v)}
              options={[
                { label: '待处理', value: OpinionStatus.PENDING },
                { label: '已处理', value: OpinionStatus.PROCESSED },
                { label: '已忽略', value: OpinionStatus.IGNORED },
              ]}
            />
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={fetchOpinions}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </div>

          <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
            <Table<PublicOpinion>
              dataSource={list}
              columns={opinionColumns}
              loading={loading}
              rowKey="id"
              size="small"
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </>
      )}

      {activeTab === 'keywords' && (
        <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
          <Table<OpinionKeyword>
            dataSource={keywords}
            columns={keywordColumns}
            loading={loading}
            rowKey="id"
            size="small"
            scroll={{ x: 800 }}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      {/* 关键词弹窗 */}
      <Modal
        title="新增关键词"
        open={keywordModalVisible}
        onCancel={() => setKeywordModalVisible(false)}
        footer={null}
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitKeyword}>
          <Form.Item name="keyword" label="关键词" rules={[{ required: true, message: '请输入关键词' }]}>
            <Input placeholder="请输入监控关键词" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setKeywordModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
