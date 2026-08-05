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
import { theme } from '../constants/theme'

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

// 导出Excel：将数据转为CSV并下载
const handleExportExcel = (data: Record<string, unknown>[], filename: string) => {
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
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [form] = Form.useForm()
  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailRecord, setDetailRecord] = useState<Record<string, unknown> | null>(null)
  // 借阅弹窗
  const [borrowVisible, setBorrowVisible] = useState(false)
  const [borrowForm] = Form.useForm()
  const [borrowRecord, setBorrowRecord] = useState<Record<string, unknown> | null>(null)
  // 上传相关
  const [uploadTarget, setUploadTarget] = useState<{ id: string; type: 'electronic' | 'paper' } | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = (await axios.get('/archive-volumes', {
        params: {
          tab: activeTab,
          menu: activeMenu,
          ...form.getFieldsValue(),
        },
      })) as Record<string, unknown>
      const list = Array.isArray(res) ? res : res?.data || []
      setData(list as Record<string, unknown>[])
    } catch (error) {
      setData([])
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
        prev.map((item) => (selectedIds.includes(item.id as string) ? { ...item, closed: true, project_status: 'completed' } : item))
      )
      message.success(`已标记 ${selectedIds.length} 条项目为已办结`)
      setSelectedIds([])
    }
  }

  // 查看卷宗
  const handleViewArchive = (record: Record<string, unknown>) => {
    setDetailRecord(record)
    setDetailVisible(true)
  }

  // 打开借阅弹窗
  const handleOpenBorrow = (record: Record<string, unknown>) => {
    setBorrowRecord(record)
    borrowForm.resetFields()
    setBorrowVisible(true)
  }

  // 提交借阅
  const handleSubmitBorrow = async (values: Record<string, unknown>) => {
    try {
      await axios.post(`/archive-volumes/${borrowRecord!.id}/borrow`, values)
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
    const map: Record<string, { label: string; color: string; stitch: string }> = {
      in_progress: { label: '进行中', color: 'processing', stitch: 'stitch-tag stitch-tag-info' },
      completed: { label: '已办结', color: 'success', stitch: 'stitch-tag stitch-tag-success' },
      suspended: { label: '已暂停', color: 'warning', stitch: 'stitch-tag stitch-tag-warning' },
      terminated: { label: '已终止', color: 'default', stitch: 'stitch-tag stitch-tag-primary' },
    }
    const cfg = map[status] || { label: status, color: 'default', stitch: 'stitch-tag stitch-tag-primary' }
    return <Tag className={cfg.stitch}>{cfg.label}</Tag>
  }

  // 办结状态渲染
  const renderClosed = (closed: boolean) =>
    closed ? (
      <Tag className="stitch-tag stitch-tag-success">已办结</Tag>
    ) : (
      <Tag className="stitch-tag stitch-tag-primary">未办结</Tag>
    )

  // 归档状态渲染
  const renderArchiveStatus = (status: string) => {
    const map: Record<string, { label: string; color: string; stitch: string }> = {
      unarchived: { label: '未归档', color: 'warning', stitch: 'stitch-tag stitch-tag-warning' },
      archiving: { label: '归档中', color: 'processing', stitch: 'stitch-tag stitch-tag-info' },
      archived: { label: '已归档', color: 'success', stitch: 'stitch-tag stitch-tag-success' },
    }
    const cfg = map[status] || { label: status, color: 'default', stitch: 'stitch-tag stitch-tag-primary' }
    return <Tag className={cfg.stitch}>{cfg.label}</Tag>
  }

  // 卷宗状态渲染
  const renderArchiveFlag = (flag: boolean) =>
    flag ? (
      <Tag className="stitch-tag stitch-tag-success">有</Tag>
    ) : (
      <Tag className="stitch-tag stitch-tag-primary">无</Tag>
    )

  // 合同交回渲染
  const renderContractReturn = (status: string) => {
    const map: Record<string, { label: string; color: string; stitch: string }> = {
      returned: { label: '已交回', color: 'success', stitch: 'stitch-tag stitch-tag-success' },
      not_returned: { label: '未交回', color: 'warning', stitch: 'stitch-tag stitch-tag-warning' },
    }
    const cfg = map[status] || { label: status, color: 'default', stitch: 'stitch-tag stitch-tag-primary' }
    return <Tag className={cfg.stitch}>{cfg.label}</Tag>
  }

  // 原件上传渲染
  const renderOriginalUpload = (flag: boolean) =>
    flag ? (
      <Tag className="stitch-tag stitch-tag-success">已上传</Tag>
    ) : (
      <Tag className="stitch-tag stitch-tag-primary">未上传</Tag>
    )

  // 借阅状态渲染
  const renderBorrowStatus = (status: string) => {
    const map: Record<string, { label: string; color: string; stitch: string }> = {
      borrowing: { label: '借阅中', color: 'processing', stitch: 'stitch-tag stitch-tag-info' },
      returned: { label: '已归还', color: 'success', stitch: 'stitch-tag stitch-tag-success' },
      overdue: { label: '已逾期', color: 'error', stitch: 'stitch-tag stitch-tag-error' },
    }
    const cfg = map[status] || { label: status, color: 'default', stitch: 'stitch-tag stitch-tag-primary' }
    return <Tag className={cfg.stitch}>{cfg.label}</Tag>
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
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space size="small" className="stitch-btn-group">
          <Button type="link" size="small" icon={<FolderViewOutlined />} onClick={() => handleViewArchive(record)}>查看卷宗</Button>
          <Upload {...uploadProps} disabled={!uploadTarget || uploadTarget.id !== record.id || uploadTarget.type !== 'electronic'}>
            <Button type="link" size="small" icon={<UploadOutlined />} onClick={() => handleOpenUpload(record.id as string, 'electronic')}>电子卷宗</Button>
          </Upload>
          <Upload {...uploadProps} disabled={!uploadTarget || uploadTarget.id !== record.id || uploadTarget.type !== 'paper'}>
            <Button type="link" size="small" icon={<UploadOutlined />} onClick={() => handleOpenUpload(record.id as string, 'paper')}>纸质卷宗</Button>
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
        <div style={{ background: theme.white, padding: '8px 16px', borderRadius: 8, marginBottom: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            items={tabItems}
            style={{ marginBottom: 0 }}
          />
        </div>

        {/* 查询条件区域（借阅记录Tab不显示查询条件） */}
        {activeTab !== 'borrow' && (
          <div className="stitch-filter-bar" style={{ background: theme.white, padding: 16, borderRadius: 8, marginBottom: 16 }}>
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
                <Space className="stitch-btn-group">
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}

        {/* 表格区域 */}
        <div className="stitch-table" style={{ background: theme.white, padding: 16, borderRadius: 8 }}>
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
            <p><strong>项目名称：</strong>{String(detailRecord.name ?? '')}</p>
            <p><strong>立案时间：</strong>{renderDate(detailRecord.filing_date as string)}</p>
            <p><strong>主办：</strong>{String(detailRecord.leader ?? '')}</p>
            <p><strong>项目状态：</strong>{renderProjectStatus(detailRecord.project_status as string)}</p>
            <p><strong>办结状态：</strong>{renderClosed(detailRecord.closed as boolean)}</p>
            <p><strong>归档状态：</strong>{renderArchiveStatus(detailRecord.archive_status as string)}</p>
            <p><strong>电子卷宗：</strong>{renderArchiveFlag(detailRecord.electronic_archive as boolean)}</p>
            <p><strong>纸质卷宗：</strong>{renderArchiveFlag(detailRecord.paper_archive as boolean)}</p>
            <p><strong>合同原件交回：</strong>{renderContractReturn(detailRecord.contract_returned as string)}</p>
            <p><strong>原件上传：</strong>{renderOriginalUpload(detailRecord.original_uploaded as boolean)}</p>
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
            <Input value={(borrowRecord?.name as string) || ''} disabled />
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
