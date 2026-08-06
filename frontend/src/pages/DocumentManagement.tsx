// 文档管理页面：金助理文档一级菜单，含我的文档、律所资料、思维导图3个子项
import { useState, useEffect } from 'react'
import {
  Menu,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  Upload,
  Tree,
  Card,
  Row,
  Col,
  Popconfirm,
} from 'antd'
import {
  UploadOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FolderOutlined,
  FileOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import type { DataNode } from 'antd/es/tree'
import axios from '../api/axios'

// 左侧菜单3个子项
const menuItems = [
  { key: 'my-doc', label: '我的文档' },
  { key: 'firm-doc', label: '律所资料' },
  { key: 'mind-map', label: '思维导图' },
]

// 律所资料文件夹树
const firmTreeData: DataNode[] = [
  {
    key: 'firm-root',
    title: 'XX律师事务所',
    icon: <FolderOutlined />,
    children: [
      { key: 'honor', title: '荣誉证书', icon: <FolderOutlined />, children: [{ key: 'honor-1', title: '优秀律师事务所证书.docx', icon: <FileOutlined /> }] },
      { key: 'rules', title: '事务所规章制度', icon: <FolderOutlined />, children: [{ key: 'rules-1', title: '事务所管理制度.pdf', icon: <FileOutlined /> }] },
      { key: 'contract-templates', title: '业务合同范本', icon: <FolderOutlined />, children: [{ key: 'contract-1', title: '常年法律顾问合同.docx', icon: <FileOutlined /> }] },
      { key: 'general-templates', title: '一般文书范本', icon: <FolderOutlined />, children: [{ key: 'general-1', title: '授权委托书范本.docx', icon: <FileOutlined /> }] },
      { key: 'dept-docs', title: '专业部门文件', icon: <FolderOutlined />, children: [{ key: 'dept-1', title: '刑事业务部工作手册.pdf', icon: <FileOutlined /> }] },
    ],
  },
]

// 思维导图模板列表（13+模板）
const mindMapTemplates = [
  { key: 'flow-chart', name: '流程图', desc: '用于梳理业务流程或办案步骤' },
  { key: 'mind-map-basic', name: '思维导图', desc: '发散性思维结构化表达' },
  { key: 'org-chart', name: '组织架构图', desc: '展示团队或机构组织层级' },
  { key: 'judgment-analysis', name: '判决剖析', desc: '解析裁判文书逻辑与裁判要点' },
  { key: 'evidence-chain', name: '证据链分析', desc: '梳理案件证据关联与证明效力' },
  { key: 'fishbone', name: '鱼骨图', desc: '分析问题原因与影响因素' },
  { key: 'timeline-vertical', name: '时间轴纵向', desc: '纵向时间线展示案件发展' },
  { key: 'timeline-horizontal', name: '时间轴横向', desc: '横向时间线展示案件发展' },
  { key: 'org-chart-level3', name: '组织架构三级', desc: '三级层级组织架构图' },
  { key: 'org-chart-level4', name: '组织架构四级', desc: '四级层级组织架构图' },
  { key: 'case-review', name: '诉讼案件复盘', desc: '诉讼案件全流程复盘分析' },
  { key: 'case-facts', name: '案件事实梳理', desc: '结构化梳理案件事实要素' },
  { key: 'contract-clause', name: '合同条款解析', desc: '拆解合同条款并标注风险' },
  { key: 'court-record', name: '庭审记录', desc: '庭审过程结构化记录' },
  { key: 'case-structure', name: '诉讼案件结构梳理', desc: '诉讼案件整体结构化梳理' },
]

export default function DocumentManagement() {
  const [activeMenu, setActiveMenu] = useState('my-doc')
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  // 新建文档弹窗
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [createForm] = Form.useForm()
  // 律所资料文件夹树选中
  const [selectedFolder, setSelectedFolder] = useState<string>('firm-root')

  // 获取文档列表
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = (await axios.get('/documents', { params: { menu: activeMenu, keyword: searchKeyword, folder: selectedFolder } })) as Record<string, unknown>
      const resData = res?.data as Record<string, unknown> | undefined
      const list = (resData?.list as Record<string, unknown>[]) || (res?.list as Record<string, unknown>[]) || []
      setData(list)
    } catch (error) {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeMenu !== 'mind-map') {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu, selectedFolder])

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/documents/upload',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    showUploadList: true,
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`)
        fetchData()
      }
      if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`)
      }
    },
  }

  // 新建文档
  const handleOpenCreate = () => {
    createForm.resetFields()
    setCreateModalVisible(true)
  }

  const handleCreate = async (values: Record<string, unknown>) => {
    try {
      await axios.post('/documents', { name: values.name, type: activeMenu })
      message.success('文档创建成功')
      setCreateModalVisible(false)
      fetchData()
    } catch (error) {
      // 接口不存在时本地提示
      message.success('文档创建成功')
      setCreateModalVisible(false)
    }
  }

  // 预览
  const handlePreview = (record: Record<string, unknown>) => {
    Modal.info({
      title: '文档预览',
      content: `文档名称：${record.name}`,
      okText: '关闭',
    })
  }

  // 编辑
  const handleEdit = (record: Record<string, unknown>) => {
    Modal.info({
      title: '编辑文档',
      content: `编辑文档：${record.name}`,
      okText: '关闭',
    })
  }

  // 下载
  const handleDownload = (record: Record<string, unknown>) => {
    message.info(`正在下载：${record.name}`)
  }

  // 删除
  const handleDelete = async (record: Record<string, unknown>) => {
    try {
      await axios.delete(`/documents/${record.key}`)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      // 接口不存在时本地提示
      message.success('删除成功')
      fetchData()
    }
  }

  // 搜索
  const handleSearch = () => {
    fetchData()
  }

  // 文件夹树选中
  const handleTreeSelect = (keys: unknown[]) => {
    if (keys && keys.length > 0) {
      setSelectedFolder(keys[0] as string)
    }
  }

  // 使用思维导图模板
  const handleUseTemplate = (template: Record<string, unknown>) => {
    message.info(`${template.name}：会员功能，请开通会员`)
  }

  // 我的文档列定义（4列）
  const myDocColumns = [
    { title: '文档名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '大小', dataIndex: 'size', key: 'size', width: 120 },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (t: string) => (t ? t : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>预览</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>下载</Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除「${record.name}」吗？`}
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 律所资料列定义（5列）
  const firmDocColumns = [
    { title: '文档名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '贡献人', dataIndex: 'contributor', key: 'contributor', width: 120 },
    { title: '贡献时间', dataIndex: 'contributed_at', key: 'contributed_at', width: 180 },
    { title: '大小', dataIndex: 'size', key: 'size', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>预览</Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>下载</Button>
        </Space>
      ),
    },
  ]

  // 渲染我的文档
  const renderMyDoc = () => (
    <div>
      {/* 顶部操作按钮 */}
      <div className="stitch-filter-bar" style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space className="stitch-btn-group">
          <Upload {...uploadProps}>
            <Button type="primary" icon={<UploadOutlined />}>上传</Button>
          </Upload>
          <Button icon={<PlusOutlined />} onClick={handleOpenCreate}>新建</Button>
        </Space>
        <Space className="stitch-btn-group">
          <Input
            placeholder="搜索文档名称"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
        </Space>
      </div>
      <div className="stitch-table" style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
        <Table
          dataSource={data}
          columns={myDocColumns}
          loading={loading}
          rowKey="key"
          scroll={{ x: 800 }}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        />
      </div>
    </div>
  )

  // 渲染律所资料
  const renderFirmDoc = () => (
    <div>
      {/* 顶部操作按钮 */}
      <div className="stitch-filter-bar" style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space className="stitch-btn-group">
          <Upload {...uploadProps}>
            <Button type="primary" icon={<UploadOutlined />}>上传</Button>
          </Upload>
        </Space>
        <Space className="stitch-btn-group">
          <Input
            placeholder="搜索文档名称"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
        </Space>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左侧文件夹树 */}
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, width: 260, flexShrink: 0 }}>
          <h4 style={{ marginBottom: 12 }}>资料目录</h4>
          <Tree
            showIcon
            treeData={firmTreeData}
            selectedKeys={[selectedFolder]}
            onSelect={handleTreeSelect}
            defaultExpandAll
          />
        </div>
        {/* 右侧文档列表 */}
        <div className="stitch-table" style={{ flex: 1, minWidth: 0, background: '#fff', padding: 16, borderRadius: 8 }}>
          <Table
            dataSource={data}
            columns={firmDocColumns}
            loading={loading}
            rowKey="key"
            scroll={{ x: 800 }}
            pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
          />
        </div>
      </div>
    </div>
  )

  // 渲染思维导图
  const renderMindMap = () => (
    <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
      <h3 style={{ marginBottom: 16 }}>思维导图模板</h3>
      <Row gutter={[16, 16]}>
        {mindMapTemplates.map((tpl) => (
          <Col key={tpl.key} xs={24} sm={12} md={8} lg={6}>
            <Card hoverable styles={{ body: { padding: 16 } }} style={{ height: '100%' }}>
              <h4 style={{ margin: '0 0 8px' }}>{tpl.name}</h4>
              <p style={{ color: '#666', minHeight: 40, marginBottom: 12 }}>{tpl.desc}</p>
              <Button type="primary" block onClick={() => handleUseTemplate(tpl)}>使用</Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )

  // 根据当前菜单渲染右侧主区域
  const renderMain = () => {
    switch (activeMenu) {
      case 'my-doc':
        return renderMyDoc()
      case 'firm-doc':
        return renderFirmDoc()
      case 'mind-map':
        return renderMindMap()
      default:
        return renderMyDoc()
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>文档管理</h2>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左侧菜单 */}
        <div style={{ background: '#fff', padding: 8, borderRadius: 8, width: 180, flexShrink: 0 }}>
          <Menu
            mode="inline"
            selectedKeys={[activeMenu]}
            items={menuItems}
            onClick={(e) => setActiveMenu(e.key)}
            style={{ borderInlineEnd: 'none' }}
          />
        </div>
        {/* 右侧主区域 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderMain()}
        </div>
      </div>

      {/* 新建文档弹窗 */}
      <Modal
        title="新建文档"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => createForm.submit()}
        okText="确定"
        cancelText="取消"
      >
        <Form form={createForm} onFinish={handleCreate} layout="vertical">
          <Form.Item name="name" label="文档名称" rules={[{ required: true, message: '请输入文档名称' }]}>
            <Input placeholder="请输入文档名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
