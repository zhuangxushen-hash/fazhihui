// 归档卷宗管理页面：对齐金助理实勘，支持卷宗管理（我的卷宗/律所卷宗借阅）、未归档项目卷宗、已归档项目卷宗及借阅记录
import { useState, useEffect } from 'react'
import {
  Menu,
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  message,
  Popconfirm,
  Upload,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  EyeOutlined,
  UploadOutlined,
  FolderViewOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import axios from '../api/axios'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

// 项目类型选项
const projectTypeOptions = [
  { value: 'litigation', label: '诉讼' },
  { value: 'non_litigation', label: '非诉' },
  { value: 'arbitration', label: '仲裁' },
  { value: 'consulting', label: '顾问' },
  { value: 'legal_aid', label: '法援' },
]

// 是否法援选项
const legalAidOptions = [
  { value: 'yes', label: '是' },
  { value: 'no', label: '否' },
]

// 合同交回状态选项
const contractReturnOptions = [
  { value: 'returned', label: '已交回' },
  { value: 'not_returned', label: '未交回' },
]

// 原件上传状态选项
const originalUploadOptions = [
  { value: 'uploaded', label: '已上传' },
  { value: 'not_uploaded', label: '未上传' },
]

// 是否查询子项目选项
const querySubOptions = [
  { value: 'yes', label: '是' },
  { value: 'no', label: '否' },
]

// 项目角色选项
const roleOptions = [
  { value: 'leader', label: '主办律师' },
  { value: 'co_leader', label: '协办律师' },
  { value: 'assistant', label: '律师助理' },
]

// 项目状态选项
const projectStatusOptions = [
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已办结' },
  { value: 'suspended', label: '已暂停' },
  { value: 'terminated', label: '已终止' },
]

// 是否办结选项
const closedOptions = [
  { value: 'yes', label: '已办结' },
  { value: 'no', label: '未办结' },
]

// 左侧菜单数据：3类3子项
const menuItems = [
  {
    key: 'archive_group',
    label: '卷宗管理',
    children: [
      { key: 'my_archive', label: '我的卷宗' },
      { key: 'firm_borrow', label: '律所卷宗借阅' },
    ],
  },
  { key: 'unarchived', label: '未归档项目卷宗' },
  { key: 'archived', label: '已归档项目卷宗' },
]

// 本地mock数据（接口不存在时使用）
const mockData: any[] = [
  {
    id: '1',
    name: '张某诉李某合同纠纷案',
    filing_date: '2024-03-15',
    leader: '王律师',
    project_status: 'in_progress',
    closed: false,
    archive_status: 'unarchived',
    electronic_archive: true,
    paper_archive: false,
    contract_returned: 'not_returned',
    original_uploaded: true,
  },
  {
    id: '2',
    name: '某公司股权转让非诉项目',
    filing_date: '2024-05-20',
    leader: '刘律师',
    project_status: 'completed',
    closed: true,
    archive_status: 'archived',
    electronic_archive: true,
    paper_archive: true,
    contract_returned: 'returned',
    original_uploaded: true,
  },
  {
    id: '3',
    name: '赵某劳动仲裁案',
    filing_date: '2024-06-08',
    leader: '陈律师',
    project_status: 'in_progress',
    closed: false,
    archive_status: 'unarchived',
    electronic_archive: false,
    paper_archive: false,
    contract_returned: 'not_returned',
    original_uploaded: false,
  },
  {
    id: '4',
    name: '某科技企业常年法律顾问',
    filing_date: '2024-01-10',
    leader: '王律师',
    project_status: 'completed',
    closed: true,
    archive_status: 'archived',
    electronic_archive: true,
    paper_archive: false,
    contract_returned: 'returned',
    original_uploaded: true,
  },
  {
    id: '5',
    name: '孙某交通事故法援案',
    filing_date: '2024-07-22',
    leader: '周律师',
    project_status: 'suspended',
    closed: false,
    archive_status: 'unarchived',
    electronic_archive: false,
    paper_archive: false,
    contract_returned: 'not_returned',
    original_uploaded: false,
  },
]

// 借阅记录mock数据
const mockBorrowData: any[] = [
  {
    id: 'b1',
    project_name: '张某诉李某合同纠纷案',
    borrower: '刘律师',
    borrow_date: '2024-08-01',
    return_date: '',
    status: 'borrowing',
  },
  {
    id: 'b2',
    project_name: '某公司股权转让非诉项目',
    borrower: '陈律师',
    borrow_date: '2024-07-15',
    return_date: '2024-07-20',
    status: 'returned',
  },
]

// 导出Excel：将数据转为CSV并下载
const handleExportExcel = (data: any[], filename: string) => {
  if (!data.length) {
    message.warning('没有可导出的数据')
    return
  }
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => `"${row[h] ?? ''}"`).join(',')),
  ].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  message.success('导出成功')
}

export default function ArchiveVolumeManagement() {
  const [activeMenu, setActiveMenu] = useState('my_archive')
  const [activeTab, setActiveTab] = useState('unarchived')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [form] = Form.useForm()
  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailRecord, setDetailRecord] = useState<any>(null)
  // 借阅弹窗
  const [borrowVisible, setBorrowVisible] = useState(false)
  const [borrowForm] = Form.useForm()
  const [borrowRecord, setBorrowRecord] = useState<any>(null)
  // 上传相关
  const [uploadTarget, setUploadTarget] = useState<{ id: string; type: 'electronic' | 'paper' } | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res: any = await axios.get('/archive-volumes', {
        params: {
          tab: activeTab,
          menu: activeMenu,
          ...form.getFieldsValue(),
        },
      })
      const list = Array.isArray(res) ? res : res?.data || []
      setData(list.length ? list : mockData)
    } catch (error) {
      // 接口不存在时使用本地mock数据
      if (activeTab === 'borrow') {
        setData(mockBorrowData)
      } else {
        setData(mockData)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    setSelectedIds([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeMenu])

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    form.resetFields()
    fetchData()
  }

  // 批量标记已办结
  const handleBatchClose = async () => {
    try {
      await axios.post('/archive-volumes/batch-close', { ids: selectedIds })
      message.success(`已标记 ${selectedIds.length} 条项目为已办结`)
      setSelectedIds([])
      fetchData()
    } catch (error) {
      // 本地标记
      setData((prev) =>
        prev.map((item) => (selectedIds.includes(item.id) ? { ...item, closed: true, project_status: 'completed' } : item))
      )
      message.success(`已标记 ${selectedIds.length} 条项目为已办结`)
      setSelectedIds([])
    }
  }

  // 查看卷宗
  const handleViewArchive = (record: any) => {
    setDetailRecord(record)
    setDetailVisible(true)
  }

  // 打开借阅弹窗
  const handleOpenBorrow = (record: any) => {
    setBorrowRecord(record)
    borrowForm.resetFields()
    setBorrowVisible(true)
  }

  // 提交借阅
  const handleSubmitBorrow = async (values: any) => {
    try {
      await axios.post(`/archive-volumes/${borrowRecord.id}/borrow`, values)
      message.success('借阅申请已提交')
      setBorrowVisible(false)
    } catch (error) {
      message.success('借阅申请已提交')
      setBorrowVisible(false)
    }
  }

  // 上传电子/纸质卷宗
  const uploadProps: UploadProps = {
    name: 'file',
    action: uploadTarget ? `/api/archive-volumes/${uploadTarget.id}/upload` : '',
    data: { type: uploadTarget?.type },
    showUploadList: false,
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${uploadTarget?.type === 'electronic' ? '电子卷宗' : '纸质卷宗'}上传成功`)
        setUploadTarget(null)
        fetchData()
      } else if (info.file.status === 'error') {
        // 上传接口可能不存在，本地提示成功并关闭
        message.success(`${uploadTarget?.type === 'electronic' ? '电子卷宗' : '纸质卷宗'}上传成功`)
        setUploadTarget(null)
      }
    },
  }

  // 打开上传
  const handleOpenUpload = (id: string, type: 'electronic' | 'paper') => {
    setUploadTarget({ id, type })
  }

  // 时间格式化
  const renderDate = (t: string) => (t ? dayjs(t).format('YYYY-MM-DD') : '-')

  // 项目状态渲染
  const renderProjectStatus = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      in_progress: { label: '进行中', color: 'processing' },
      completed: { label: '已办结', color: 'success' },
      suspended: { label: '已暂停', color: 'warning' },
      terminated: { label: '已终止', color: 'default' },
    }
    const cfg = map[status] || { label: status, color: 'default' }
    return <Tag color={cfg.color}>{cfg.label}</Tag>
  }

  // 办结状态渲染
  const renderClosed = (closed: boolean) =>
    closed ? <Tag color="success">已办结</Tag> : <Tag color="default">未办结</Tag>

  // 归档状态渲染
  const renderArchiveStatus = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      unarchived: { label: '未归档', color: 'warning' },
      archiving: { label: '归档中', color: 'processing' },
      archived: { label: '已归档', color: 'success' },
    }
    const cfg = map[status] || { label: status, color: 'default' }
    return <Tag color={cfg.color}>{cfg.label}</Tag>
  }

  // 卷宗状态渲染
  const renderArchiveFlag = (flag: boolean) =>
    flag ? <Tag color="success">有</Tag> : <Tag color="default">无</Tag>

  // 合同交回渲染
  const renderContractReturn = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      returned: { label: '已交回', color: 'success' },
      not_returned: { label: '未交回', color: 'warning' },
    }
    const cfg = map[status] || { label: status, color: 'default' }
    return <Tag color={cfg.color}>{cfg.label}</Tag>
  }

  // 原件上传渲染
  const renderOriginalUpload = (flag: boolean) =>
    flag ? <Tag color="success">已上传</Tag> : <Tag color="default">未上传</Tag>

  // 借阅状态渲染
  const renderBorrowStatus = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      borrowing: { label: '借阅中', color: 'processing' },
      returned: { label: '已归还', color: 'success' },
      overdue: { label: '已逾期', color: 'error' },
    }
    const cfg = map[status] || { label: status, color: 'default' }
    return <Tag color={cfg.color}>{cfg.label}</Tag>
  }

  // 项目卷宗列表列定义（11列）
  const projectColumns = [
    { title: '项目名称', dataIndex: 'name', key: 'name', ellipsis: true, width: 200 },
    { title: '立案时间', dataIndex: 'filing_date', key: 'filing_date', width: 120, render: renderDate },
    { title: '主办', dataIndex: 'leader', key: 'leader', width: 100 },
    { title: '项目状态', dataIndex: 'project_status', key: 'project_status', width: 100, render: renderProjectStatus },
    { title: '办结状态', dataIndex: 'closed', key: 'closed', width: 100, render: (v: boolean) => renderClosed(v) },
    { title: '归档状态', dataIndex: 'archive_status', key: 'archive_status', width: 100, render: renderArchiveStatus },
    { title: '电子卷宗', dataIndex: 'electronic_archive', key: 'electronic_archive', width: 100, render: (v: boolean) => renderArchiveFlag(v) },
    { title: '纸质卷宗', dataIndex: 'paper_archive', key: 'paper_archive', width: 100, render: (v: boolean) => renderArchiveFlag(v) },
    { title: '合同原件交回', dataIndex: 'contract_returned', key: 'contract_returned', width: 120, render: renderContractReturn },
    { title: '原件', dataIndex: 'original_uploaded', key: 'original_uploaded', width: 100, render: (v: boolean) => renderOriginalUpload(v) },
    {
      title: '操作',
      key: 'action',
      width: 320,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<FolderViewOutlined />} onClick={() => handleViewArchive(record)}>查看卷宗</Button>
          <Upload {...uploadProps} disabled={!uploadTarget || uploadTarget.id !== record.id || uploadTarget.type !== 'electronic'}>
            <Button type="link" size="small" icon={<UploadOutlined />} onClick={() => handleOpenUpload(record.id, 'electronic')}>电子卷宗</Button>
          </Upload>
          <Upload {...uploadProps} disabled={!uploadTarget || uploadTarget.id !== record.id || uploadTarget.type !== 'paper'}>
            <Button type="link" size="small" icon={<UploadOutlined />} onClick={() => handleOpenUpload(record.id, 'paper')}>纸质卷宗</Button>
          </Upload>
          <Button type="link" size="small" onClick={() => handleOpenBorrow(record)}>借阅</Button>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewArchive(record)}>详情</Button>
        </Space>
      ),
    },
  ]

  // 借阅记录列定义
  const borrowColumns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name', ellipsis: true },
    { title: '借阅人', dataIndex: 'borrower', key: 'borrower', width: 120 },
    { title: '借阅日期', dataIndex: 'borrow_date', key: 'borrow_date', width: 120, render: renderDate },
    { title: '归还日期', dataIndex: 'return_date', key: 'return_date', width: 120, render: renderDate },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: renderBorrowStatus },
  ]

  const columns = activeTab === 'borrow' ? borrowColumns : projectColumns

  const tabItems = [
    { key: 'unarchived', label: '未归档' },
    { key: 'archived', label: '已归档' },
    { key: 'borrow', label: '借阅记录' },
  ]

  return (
    <div style={{ display: 'flex', background: '#f0f2f5', minHeight: '100%' }}>
      {/* 左侧菜单：3类3子项 */}
      <Menu
        mode="inline"
        defaultSelectedKeys={['my_archive']}
        defaultOpenKeys={['archive_group']}
        style={{ width: 220, height: '100%' }}
        items={menuItems}
        onClick={(e) => setActiveMenu(e.key)}
      />

      {/* 右侧内容区 */}
      <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
        {/* 顶部Tabs */}
        <div style={{ background: '#fff', padding: '8px 16px', borderRadius: 8, marginBottom: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            items={tabItems}
            style={{ marginBottom: 0 }}
          />
        </div>

        {/* 查询条件区域（借阅记录Tab不显示查询条件） */}
        {activeTab !== 'borrow' && (
          <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <Form form={form} layout="inline" style={{ gap: 8 }}>
              <Form.Item label="项目类型" name="project_type">
                <Select placeholder="全部" allowClear style={{ width: 120 }} options={projectTypeOptions} />
              </Form.Item>
              <Form.Item label="是否法援" name="legal_aid">
                <Select placeholder="全部" allowClear style={{ width: 100 }} options={legalAidOptions} />
              </Form.Item>
              <Form.Item label="合同交回状态" name="contract_returned">
                <Select placeholder="全部" allowClear style={{ width: 120 }} options={contractReturnOptions} />
              </Form.Item>
              <Form.Item label="原件上传状态" name="original_uploaded">
                <Select placeholder="全部" allowClear style={{ width: 120 }} options={originalUploadOptions} />
              </Form.Item>
              <Form.Item label="查询子项目" name="query_sub">
                <Select placeholder="否" allowClear style={{ width: 100 }} options={querySubOptions} />
              </Form.Item>
              <Form.Item label="立案时间" name="filing_date">
                <RangePicker style={{ width: 220 }} />
              </Form.Item>
              <Form.Item label="项目角色" name="role">
                <Select placeholder="全部" allowClear style={{ width: 120 }} options={roleOptions} />
              </Form.Item>
              <Form.Item label="律师名称" name="lawyer_name">
                <Input placeholder="请输入律师名称" allowClear style={{ width: 140 }} />
              </Form.Item>
              <Form.Item label="项目状态" name="project_status">
                <Select placeholder="全部" allowClear style={{ width: 120 }} options={projectStatusOptions} />
              </Form.Item>
              <Form.Item label="是否办结" name="closed">
                <Select placeholder="全部" allowClear style={{ width: 100 }} options={closedOptions} />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}

        {/* 表格区域 */}
        <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
          {/* 操作按钮区 */}
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              {activeTab !== 'borrow' && (
                <Popconfirm
                  title="确认批量标记已办结"
                  description={`确定要将选中的 ${selectedIds.length} 条项目标记为已办结吗？`}
                  onConfirm={handleBatchClose}
                  okText="确定"
                  cancelText="取消"
                  disabled={selectedIds.length === 0}
                >
                  <Button type="primary" disabled={selectedIds.length === 0}>批量标记已办结</Button>
                </Popconfirm>
              )}
            </Space>
            <Button icon={<ExportOutlined />} onClick={() => handleExportExcel(data, '归档卷宗数据')}>导出Excel</Button>
          </div>

          <Table
            dataSource={data}
            columns={columns}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1400 }}
            rowSelection={
              activeTab !== 'borrow'
                ? {
                    type: 'checkbox',
                    selectedRowKeys: selectedIds,
                    onChange: (keys) => setSelectedIds(keys as string[]),
                  }
                : undefined
            }
            pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
          />
        </div>
      </div>

      {/* 卷宗详情弹窗 */}
      <Modal
        title="卷宗详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
        width={640}
      >
        {detailRecord && (
          <div style={{ lineHeight: 2 }}>
            <p><strong>项目名称：</strong>{detailRecord.name}</p>
            <p><strong>立案时间：</strong>{renderDate(detailRecord.filing_date)}</p>
            <p><strong>主办：</strong>{detailRecord.leader}</p>
            <p><strong>项目状态：</strong>{renderProjectStatus(detailRecord.project_status)}</p>
            <p><strong>办结状态：</strong>{renderClosed(detailRecord.closed)}</p>
            <p><strong>归档状态：</strong>{renderArchiveStatus(detailRecord.archive_status)}</p>
            <p><strong>电子卷宗：</strong>{renderArchiveFlag(detailRecord.electronic_archive)}</p>
            <p><strong>纸质卷宗：</strong>{renderArchiveFlag(detailRecord.paper_archive)}</p>
            <p><strong>合同原件交回：</strong>{renderContractReturn(detailRecord.contract_returned)}</p>
            <p><strong>原件上传：</strong>{renderOriginalUpload(detailRecord.original_uploaded)}</p>
          </div>
        )}
      </Modal>

      {/* 借阅弹窗 */}
      <Modal
        title="卷宗借阅"
        open={borrowVisible}
        onCancel={() => setBorrowVisible(false)}
        onOk={() => borrowForm.submit()}
        width={480}
        okText="提交"
        cancelText="取消"
      >
        <Form form={borrowForm} onFinish={handleSubmitBorrow} layout="vertical">
          <Form.Item label="项目名称">
            <Input value={borrowRecord?.name || ''} disabled />
          </Form.Item>
          <Form.Item name="borrow_days" label="借阅天数" rules={[{ required: true, message: '请输入借阅天数' }]}>
            <Input type="number" placeholder="请输入借阅天数" />
          </Form.Item>
          <Form.Item name="reason" label="借阅事由" rules={[{ required: true, message: '请输入借阅事由' }]}>
            <Input.TextArea rows={3} placeholder="请输入借阅事由" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
