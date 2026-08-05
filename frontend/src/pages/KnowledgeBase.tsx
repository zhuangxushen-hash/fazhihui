import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  message,
  Tabs,
  Tag,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  viewArticle,
  getLawRegulations,
  createLawRegulation,
  updateLawRegulation,
  deleteLawRegulation,
  getCasePrecedents,
  createCasePrecedent,
  updateCasePrecedent,
  deleteCasePrecedent,
} from '../api/knowledge'
import { formatDate, formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'

// ============ 中文标签映射 + Tag 颜色 ============

// 文章分类映射
const articleCategoryMap: Record<string, { label: string; color: string }> = {
  experience: { label: '实务经验', color: 'blue' },
  research: { label: '法律研究', color: 'purple' },
  skill: { label: '办案技巧', color: 'cyan' },
  template: { label: '模板范本', color: 'gold' },
}

// 文章分类选项
const articleCategoryOptions = [
  { value: 'experience', label: '实务经验' },
  { value: 'research', label: '法律研究' },
  { value: 'skill', label: '办案技巧' },
  { value: 'template', label: '模板范本' },
]

// 文章状态映射
const articleStatusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  published: { label: '已发布', color: 'green' },
}

// 法规分类映射
const lawCategoryMap: Record<string, { label: string; color: string }> = {
  constitution: { label: '宪法', color: 'red' },
  law: { label: '法律', color: 'blue' },
  regulation: { label: '行政法规', color: 'cyan' },
  interpretation: { label: '司法解释', color: 'purple' },
  department: { label: '部门规章', color: 'orange' },
}

// 法规分类选项
const lawCategoryOptions = [
  { value: 'constitution', label: '宪法' },
  { value: 'law', label: '法律' },
  { value: 'regulation', label: '行政法规' },
  { value: 'interpretation', label: '司法解释' },
  { value: 'department', label: '部门规章' },
]

// 裁判文书类型映射
const judgmentTypeMap: Record<string, { label: string; color: string }> = {
  judgment: { label: '判决', color: 'red' },
  ruling: { label: '裁定', color: 'blue' },
  mediation: { label: '调解', color: 'green' },
}

// 裁判文书类型选项
const judgmentTypeOptions = [
  { value: 'judgment', label: '判决' },
  { value: 'ruling', label: '裁定' },
  { value: 'mediation', label: '调解' },
]

// 文章分类标签
const ArticleCategoryTag = ({ category }: { category: string }) => {
  const cfg = articleCategoryMap[category] || { label: category, color: 'default' }
  return <Tag color={cfg.color}>{cfg.label}</Tag>
}

// 文章状态标签
const ArticleStatusTag = ({ status }: { status: string }) => {
  const cfg = articleStatusMap[status] || { label: status, color: 'default' }
  // 根据状态选择 Stitch 变体：已发布视为完成态
  const stitchClass =
    status === 'published' ? 'stitch-tag stitch-tag-success' : 'stitch-tag stitch-tag-primary'
  return <Tag className={stitchClass}>{cfg.label}</Tag>
}

// 法规分类标签
const LawCategoryTag = ({ category }: { category: string }) => {
  const cfg = lawCategoryMap[category] || { label: category, color: 'default' }
  return <Tag color={cfg.color}>{cfg.label}</Tag>
}

// 裁判文书类型标签
const JudgmentTypeTag = ({ type }: { type: string }) => {
  const cfg = judgmentTypeMap[type] || { label: type || '-', color: 'default' }
  return <Tag color={cfg.color}>{cfg.label}</Tag>
}

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState('articles')

  // ===== 文章状态 =====
  const [articles, setArticles] = useState<any[]>([])
  const [articleLoading, setArticleLoading] = useState(false)
  const [articleModalVisible, setArticleModalVisible] = useState(false)
  const [articleEditing, setArticleEditing] = useState<any>(null)
  const [articleDetailVisible, setArticleDetailVisible] = useState(false)
  const [articleDetail, setArticleDetail] = useState<any>(null)
  const [articleForm] = Form.useForm()
  const [articleSearch] = Form.useForm()

  // ===== 法规状态 =====
  const [lawRegulations, setLawRegulations] = useState<any[]>([])
  const [lawLoading, setLawLoading] = useState(false)
  const [lawModalVisible, setLawModalVisible] = useState(false)
  const [lawEditing, setLawEditing] = useState<any>(null)
  const [lawDetailVisible, setLawDetailVisible] = useState(false)
  const [lawDetail, setLawDetail] = useState<any>(null)
  const [lawForm] = Form.useForm()
  const [lawSearch] = Form.useForm()

  // ===== 判例状态 =====
  const [casePrecedents, setCasePrecedents] = useState<any[]>([])
  const [caseLoading, setCaseLoading] = useState(false)
  const [caseModalVisible, setCaseModalVisible] = useState(false)
  const [caseEditing, setCaseEditing] = useState<any>(null)
  const [caseDetailVisible, setCaseDetailVisible] = useState(false)
  const [caseDetail, setCaseDetail] = useState<any>(null)
  const [caseForm] = Form.useForm()
  const [caseSearch] = Form.useForm()

  // ============ 文章相关操作 ============

  // 拉取文章列表
  const fetchArticles = async () => {
    setArticleLoading(true)
    try {
      const values = articleSearch.getFieldsValue()
      const params: any = {}
      if (values.keyword) params.keyword = values.keyword
      if (values.category) params.category = values.category
      const res = await getArticles(params) as Record<string, unknown>[]
      setArticles(res || [])
    } catch (error) {
      message.error('获取文章列表失败')
    } finally {
      setArticleLoading(false)
    }
  }

  // 新增文章
  const handleAddArticle = () => {
    setArticleEditing(null)
    articleForm.resetFields()
    articleForm.setFieldsValue({ category: 'experience', status: 'published', tags: [] })
    setArticleModalVisible(true)
  }

  // 编辑文章
  const handleEditArticle = (record: any) => {
    setArticleEditing(record)
    articleForm.setFieldsValue({
      ...record,
      tags: record.tags || [],
    })
    setArticleModalVisible(true)
  }

  // 提交文章表单
  const handleArticleSubmit = async (values: any) => {
    try {
      const payload = {
        title: values.title,
        category: values.category,
        content: values.content,
        tags: values.tags || [],
        status: values.status,
      }
      if (articleEditing) {
        await updateArticle(articleEditing.id, payload)
        message.success('文章更新成功')
      } else {
        await createArticle(payload)
        message.success('文章创建成功')
      }
      setArticleModalVisible(false)
      fetchArticles()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
    }
  }

  // 查看文章详情（同时浏览量+1）
  const handleViewArticle = async (record: any) => {
    try {
      const updated = await viewArticle(record.id)
      setArticleDetail(updated)
      setArticleDetailVisible(true)
      fetchArticles()
    } catch (error) {
      message.error('查看文章失败')
    }
  }

  // 删除文章
  const handleDeleteArticle = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文章「${record.title}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteArticle(record.id)
          message.success('删除成功')
          fetchArticles()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 文章搜索
  const handleArticleSearch = () => fetchArticles()

  // 文章重置
  const handleArticleReset = () => {
    articleSearch.resetFields()
    fetchArticles()
  }

  // ============ 法规相关操作 ============

  // 拉取法规列表
  const fetchLawRegulations = async () => {
    setLawLoading(true)
    try {
      const values = lawSearch.getFieldsValue()
      const params: any = {}
      if (values.keyword) params.keyword = values.keyword
      if (values.category) params.category = values.category
      const res = await getLawRegulations(params) as Record<string, unknown>[]
      setLawRegulations(res || [])
    } catch (error) {
      message.error('获取法规列表失败')
    } finally {
      setLawLoading(false)
    }
  }

  // 新增法规
  const handleAddLaw = () => {
    setLawEditing(null)
    lawForm.resetFields()
    lawForm.setFieldsValue({ category: 'law' })
    setLawModalVisible(true)
  }

  // 编辑法规
  const handleEditLaw = (record: any) => {
    setLawEditing(record)
    lawForm.setFieldsValue({
      ...record,
      effective_date: record.effective_date ? dayjs(record.effective_date) : null,
    })
    setLawModalVisible(true)
  }

  // 提交法规表单
  const handleLawSubmit = async (values: any) => {
    try {
      const payload = {
        title: values.title,
        category: values.category,
        promulgating_authority: values.promulgating_authority,
        effective_date: values.effective_date ? values.effective_date.format('YYYY-MM-DD') : null,
        content: values.content,
        source: values.source,
      }
      if (lawEditing) {
        await updateLawRegulation(lawEditing.id, payload)
        message.success('法规更新成功')
      } else {
        await createLawRegulation(payload)
        message.success('法规创建成功')
      }
      setLawModalVisible(false)
      fetchLawRegulations()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
    }
  }

  // 查看法规详情
  const handleViewLaw = (record: any) => {
    setLawDetail(record)
    setLawDetailVisible(true)
  }

  // 删除法规
  const handleDeleteLaw = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除法规「${record.title}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteLawRegulation(record.id)
          message.success('删除成功')
          fetchLawRegulations()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 法规搜索/重置
  const handleLawSearch = () => fetchLawRegulations()
  const handleLawReset = () => {
    lawSearch.resetFields()
    fetchLawRegulations()
  }

  // ============ 判例相关操作 ============

  // 拉取判例列表
  const fetchCasePrecedents = async () => {
    setCaseLoading(true)
    try {
      const values = caseSearch.getFieldsValue()
      const params: any = {}
      if (values.keyword) params.keyword = values.keyword
      if (values.court) params.court = values.court
      if (values.case_type) params.case_type = values.case_type
      const res = await getCasePrecedents(params) as Record<string, unknown>[]
      setCasePrecedents(res || [])
    } catch (error) {
      message.error('获取判例列表失败')
    } finally {
      setCaseLoading(false)
    }
  }

  // 新增判例
  const handleAddCase = () => {
    setCaseEditing(null)
    caseForm.resetFields()
    caseForm.setFieldsValue({ judgment_type: 'judgment' })
    setCaseModalVisible(true)
  }

  // 编辑判例
  const handleEditCase = (record: any) => {
    setCaseEditing(record)
    caseForm.setFieldsValue({
      ...record,
      judgment_date: record.judgment_date ? dayjs(record.judgment_date) : null,
    })
    setCaseModalVisible(true)
  }

  // 提交判例表单
  const handleCaseSubmit = async (values: any) => {
    try {
      const payload = {
        case_name: values.case_name,
        case_no: values.case_no,
        court: values.court,
        case_type: values.case_type,
        judgment_date: values.judgment_date ? values.judgment_date.format('YYYY-MM-DD') : null,
        judgment_type: values.judgment_type,
        parties: values.parties,
        summary: values.summary,
        full_text: values.full_text,
        source: values.source,
      }
      if (caseEditing) {
        await updateCasePrecedent(caseEditing.id, payload)
        message.success('判例更新成功')
      } else {
        await createCasePrecedent(payload)
        message.success('判例创建成功')
      }
      setCaseModalVisible(false)
      fetchCasePrecedents()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
    }
  }

  // 查看判例详情
  const handleViewCase = (record: any) => {
    setCaseDetail(record)
    setCaseDetailVisible(true)
  }

  // 删除判例
  const handleDeleteCase = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除判例「${record.case_name}」吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteCasePrecedent(record.id)
          message.success('删除成功')
          fetchCasePrecedents()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 判例搜索/重置
  const handleCaseSearch = () => fetchCasePrecedents()
  const handleCaseReset = () => {
    caseSearch.resetFields()
    fetchCasePrecedents()
  }

  // 切换 Tab 时加载对应数据
  useEffect(() => {
    if (activeTab === 'articles') fetchArticles()
    else if (activeTab === 'law-regulations') fetchLawRegulations()
    else if (activeTab === 'case-precedents') fetchCasePrecedents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // ============ 文章列定义 ============
  const articleColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (v: string) => <ArticleCategoryTag category={v} />,
    },
    {
      title: '作者',
      dataIndex: 'author_id',
      key: 'author_id',
      width: 120,
      render: (v: string) => (v ? v.slice(0, 8) : '-'),
      ellipsis: true,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) =>
        tags && tags.length > 0 ? (
          <Space size={[0, 4]} wrap>
            {tags.map((t, idx) => (
              <Tag key={idx}>{t}</Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '浏览量',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 90,
      render: (v: number) => Number(v || 0),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => <ArticleStatusTag status={v} />,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewArticle(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditArticle(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteArticle(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  // ============ 法规列定义 ============
  const lawColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (v: string) => <LawCategoryTag category={v} />,
    },
    {
      title: '颁布机关',
      dataIndex: 'promulgating_authority',
      key: 'promulgating_authority',
      width: 160,
      render: (v: string) => v || '-',
      ellipsis: true,
    },
    {
      title: '生效日期',
      dataIndex: 'effective_date',
      key: 'effective_date',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewLaw(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditLaw(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteLaw(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  // ============ 判例列定义 ============
  const caseColumns = [
    {
      title: '案件名称',
      dataIndex: 'case_name',
      key: 'case_name',
      ellipsis: true,
    },
    {
      title: '案号',
      dataIndex: 'case_no',
      key: 'case_no',
      width: 180,
      render: (v: string) => v || '-',
      ellipsis: true,
    },
    {
      title: '法院',
      dataIndex: 'court',
      key: 'court',
      width: 160,
      render: (v: string) => v || '-',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'case_type',
      key: 'case_type',
      width: 120,
      render: (v: string) => v || '-',
      ellipsis: true,
    },
    {
      title: '裁判类型',
      dataIndex: 'judgment_type',
      key: 'judgment_type',
      width: 100,
      render: (v: string) => <JudgmentTypeTag type={v} />,
    },
    {
      title: '裁判日期',
      dataIndex: 'judgment_date',
      key: 'judgment_date',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewCase(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditCase(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCase(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  // ============ Tab 配置 ============
  const tabItems = [
    {
      key: 'articles',
      label: '律所知识',
      children: (
        <>
          {/* 搜索栏 */}
          <div className="stitch-filter-bar" style={{ background: theme.white, padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <Form form={articleSearch} layout="inline" style={{ gap: 8 }}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="标题/内容" allowClear style={{ width: 200 }} />
              </Form.Item>
              <Form.Item name="category" label="分类">
                <Select
                  placeholder="全部"
                  allowClear
                  style={{ width: 140 }}
                  options={articleCategoryOptions}
                />
              </Form.Item>
              <Form.Item>
                <Space className="stitch-btn-group">
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleArticleSearch}>
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleArticleReset}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>

          {/* 新增按钮 */}
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddArticle}>
              新增文章
            </Button>
          </div>

          {/* 文章列表 */}
          <div className="stitch-table">
            <Table
              dataSource={articles}
              columns={articleColumns}
              loading={articleLoading}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
            />
          </div>
        </>
      ),
    },
    {
      key: 'law-regulations',
      label: '法律法规',
      children: (
        <>
          {/* 搜索栏 */}
          <div className="stitch-filter-bar" style={{ background: theme.white, padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <Form form={lawSearch} layout="inline" style={{ gap: 8 }}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="标题/内容" allowClear style={{ width: 200 }} />
              </Form.Item>
              <Form.Item name="category" label="分类">
                <Select
                  placeholder="全部"
                  allowClear
                  style={{ width: 140 }}
                  options={lawCategoryOptions}
                />
              </Form.Item>
              <Form.Item>
                <Space className="stitch-btn-group">
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleLawSearch}>
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleLawReset}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>

          {/* 新增按钮 */}
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLaw}>
              新增法规
            </Button>
          </div>

          {/* 法规列表 */}
          <div className="stitch-table">
            <Table
              dataSource={lawRegulations}
              columns={lawColumns}
              loading={lawLoading}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
            />
          </div>
        </>
      ),
    },
    {
      key: 'case-precedents',
      label: '裁判文书',
      children: (
        <>
          {/* 搜索栏 */}
          <div className="stitch-filter-bar" style={{ background: theme.white, padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <Form form={caseSearch} layout="inline" style={{ gap: 8 }}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="案件名称/案号/摘要" allowClear style={{ width: 220 }} />
              </Form.Item>
              <Form.Item name="court" label="法院">
                <Input placeholder="法院名称" allowClear style={{ width: 180 }} />
              </Form.Item>
              <Form.Item name="case_type" label="类型">
                <Input placeholder="案件类型" allowClear style={{ width: 160 }} />
              </Form.Item>
              <Form.Item>
                <Space className="stitch-btn-group">
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleCaseSearch}>
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleCaseReset}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>

          {/* 新增按钮 */}
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCase}>
              新增判例
            </Button>
          </div>

          {/* 判例列表 */}
          <div className="stitch-table">
            <Table
              dataSource={casePrecedents}
              columns={caseColumns}
              loading={caseLoading}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
            />
          </div>
        </>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>知识库</h2>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* ============ 新增/编辑文章弹窗 ============ */}
      <Modal
        title={articleEditing ? '编辑文章' : '新增文章'}
        open={articleModalVisible}
        onCancel={() => setArticleModalVisible(false)}
        onOk={() => articleForm.submit()}
        width={680}
        okText="保存"
        cancelText="取消"
      >
        <Form form={articleForm} onFinish={handleArticleSubmit} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入文章标题" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类" options={articleCategoryOptions} />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <Input.TextArea rows={8} placeholder="请输入文章内容" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select
              mode="tags"
              placeholder="输入后回车添加标签"
              style={{ width: '100%' }}
              tokenSeparators={[',']}
            />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              placeholder="请选择状态"
              options={[
                { value: 'published', label: '已发布' },
                { value: 'draft', label: '草稿' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ============ 文章详情弹窗 ============ */}
      <Modal
        title="文章详情"
        open={articleDetailVisible}
        onCancel={() => setArticleDetailVisible(false)}
        footer={<Button onClick={() => setArticleDetailVisible(false)}>关闭</Button>}
        width={720}
      >
        {articleDetail && (
          <div>
            <h3>{articleDetail.title}</h3>
            <div style={{ marginBottom: 12 }}>
              <Space size={[8, 8]} wrap>
                <ArticleCategoryTag category={articleDetail.category} />
                <ArticleStatusTag status={articleDetail.status} />
                <span style={{ color: '#888' }}>
                  浏览量：{Number(articleDetail.view_count || 0)}
                </span>
                <span style={{ color: '#888' }}>
                  创建时间：{formatDateTime(articleDetail.created_at)}
                </span>
              </Space>
            </div>
            {articleDetail.tags && articleDetail.tags.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Space size={[0, 4]} wrap>
                  {articleDetail.tags.map((t: string, idx: number) => (
                    <Tag key={idx}>{t}</Tag>
                  ))}
                </Space>
              </div>
            )}
            <div
              style={{
                background: '#fafafa',
                padding: 16,
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                maxHeight: 480,
                overflowY: 'auto',
              }}
            >
              {articleDetail.content}
            </div>
          </div>
        )}
      </Modal>

      {/* ============ 新增/编辑法规弹窗 ============ */}
      <Modal
        title={lawEditing ? '编辑法规' : '新增法规'}
        open={lawModalVisible}
        onCancel={() => setLawModalVisible(false)}
        onOk={() => lawForm.submit()}
        width={680}
        okText="保存"
        cancelText="取消"
      >
        <Form form={lawForm} onFinish={handleLawSubmit} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入法规标题" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类" options={lawCategoryOptions} />
          </Form.Item>
          <Form.Item name="promulgating_authority" label="颁布机关">
            <Input placeholder="请输入颁布机关" />
          </Form.Item>
          <Form.Item name="effective_date" label="生效日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <Input.TextArea rows={8} placeholder="请输入法规内容" />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Input placeholder="请输入来源（可空）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ============ 法规详情弹窗 ============ */}
      <Modal
        title="法规详情"
        open={lawDetailVisible}
        onCancel={() => setLawDetailVisible(false)}
        footer={<Button onClick={() => setLawDetailVisible(false)}>关闭</Button>}
        width={720}
      >
        {lawDetail && (
          <div>
            <h3>{lawDetail.title}</h3>
            <div style={{ marginBottom: 12 }}>
              <Space size={[8, 8]} wrap>
                <LawCategoryTag category={lawDetail.category} />
                {lawDetail.promulgating_authority && (
                  <span style={{ color: '#888' }}>
                    颁布机关：{lawDetail.promulgating_authority}
                  </span>
                )}
                <span style={{ color: '#888' }}>
                  生效日期：{formatDate(lawDetail.effective_date)}
                </span>
              </Space>
            </div>
            {lawDetail.source && (
              <div style={{ marginBottom: 12, color: '#888' }}>来源：{lawDetail.source}</div>
            )}
            <div
              style={{
                background: '#fafafa',
                padding: 16,
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                maxHeight: 480,
                overflowY: 'auto',
              }}
            >
              {lawDetail.content}
            </div>
          </div>
        )}
      </Modal>

      {/* ============ 新增/编辑判例弹窗 ============ */}
      <Modal
        title={caseEditing ? '编辑判例' : '新增判例'}
        open={caseModalVisible}
        onCancel={() => setCaseModalVisible(false)}
        onOk={() => caseForm.submit()}
        width={760}
        okText="保存"
        cancelText="取消"
      >
        <Form form={caseForm} onFinish={handleCaseSubmit} layout="vertical">
          <Form.Item
            name="case_name"
            label="案件名称"
            rules={[{ required: true, message: '请输入案件名称' }]}
          >
            <Input placeholder="请输入案件名称" />
          </Form.Item>
          <Form.Item name="case_no" label="案号">
            <Input placeholder="请输入案号" />
          </Form.Item>
          <Form.Item name="court" label="法院">
            <Input placeholder="请输入法院名称" />
          </Form.Item>
          <Form.Item name="case_type" label="案件类型">
            <Input placeholder="请输入案件类型" />
          </Form.Item>
          <Form.Item name="judgment_type" label="裁判文书类型">
            <Select placeholder="请选择类型" options={judgmentTypeOptions} />
          </Form.Item>
          <Form.Item name="judgment_date" label="裁判日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="parties" label="当事人">
            <Input placeholder="请输入当事人" />
          </Form.Item>
          <Form.Item name="summary" label="摘要">
            <Input.TextArea rows={4} placeholder="请输入案件摘要" />
          </Form.Item>
          <Form.Item name="full_text" label="全文">
            <Input.TextArea rows={8} placeholder="请输入裁判文书全文" />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Input placeholder="请输入来源（可空）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ============ 判例详情弹窗 ============ */}
      <Modal
        title="判例详情"
        open={caseDetailVisible}
        onCancel={() => setCaseDetailVisible(false)}
        footer={<Button onClick={() => setCaseDetailVisible(false)}>关闭</Button>}
        width={760}
      >
        {caseDetail && (
          <div>
            <h3>{caseDetail.case_name}</h3>
            <div style={{ marginBottom: 12 }}>
              <Space size={[8, 8]} wrap>
                <JudgmentTypeTag type={caseDetail.judgment_type} />
                {caseDetail.case_no && (
                  <span style={{ color: '#888' }}>案号：{caseDetail.case_no}</span>
                )}
                {caseDetail.court && (
                  <span style={{ color: '#888' }}>法院：{caseDetail.court}</span>
                )}
                {caseDetail.case_type && (
                  <span style={{ color: '#888' }}>类型：{caseDetail.case_type}</span>
                )}
                {caseDetail.judgment_date && (
                  <span style={{ color: '#888' }}>
                    裁判日期：{formatDate(caseDetail.judgment_date)}
                  </span>
                )}
              </Space>
            </div>
            {caseDetail.parties && (
              <div style={{ marginBottom: 12, color: '#888' }}>
                当事人：{caseDetail.parties}
              </div>
            )}
            {caseDetail.source && (
              <div style={{ marginBottom: 12, color: '#888' }}>来源：{caseDetail.source}</div>
            )}
            {caseDetail.summary && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>摘要</div>
                <div
                  style={{
                    background: '#fafafa',
                    padding: 12,
                    borderRadius: 8,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {caseDetail.summary}
                </div>
              </div>
            )}
            {caseDetail.full_text && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>全文</div>
                <div
                  style={{
                    background: '#fafafa',
                    padding: 16,
                    borderRadius: 8,
                    whiteSpace: 'pre-wrap',
                    maxHeight: 360,
                    overflowY: 'auto',
                  }}
                >
                  {caseDetail.full_text}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
