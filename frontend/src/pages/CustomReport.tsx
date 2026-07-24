import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Spin,
  Empty,
  Input,
  Select,
  Radio,
  DatePicker,
  Form,
  Modal,
  message,
  Popconfirm,
  List,
  Avatar,
} from 'antd'
import {
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  BellOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

const { RangePicker } = DatePicker

const cardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'saturate(180%) blur(20px)',
  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  borderRadius: 16,
  border: '1px solid rgba(0, 0, 0, 0.06)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.04)',
}

const sectionCardStyle: React.CSSProperties = {
  ...cardStyle,
  height: '100%',
}

// 维度选项
const DIMENSION_OPTIONS = [
  { label: '渠道', value: 'channel' },
  { label: '平台', value: 'platform' },
  { label: '案由', value: 'case_type' },
  { label: '律师', value: 'lawyer' },
  { label: '团队', value: 'team' },
  { label: '月份', value: 'month' },
]

// 指标选项
const METRIC_OPTIONS = [
  { label: '营收', value: 'revenue' },
  { label: '成本', value: 'cost' },
  { label: '利润', value: 'profit' },
  { label: '线索量', value: 'lead_count' },
  { label: '签约量', value: 'sign_count' },
  { label: '案件数', value: 'case_count' },
]

// 时间范围预设
const TIME_RANGE_PRESETS = [
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '近90天', value: '90d' },
  { label: '自定义', value: 'custom' },
]

// 频率选项
const FREQUENCY_OPTIONS = [
  { label: '每日', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
]

// 文件类型图标颜色
const FILE_TYPE_COLOR: Record<string, string> = {
  excel: '#34c759',
  pdf: '#ff375f',
}

interface ReportTemplate {
  id: string
  name: string
  dimensions: string[]
  metrics: string[]
  time_range?: string
  start_date?: string
  end_date?: string
  subscribers?: string[]
  frequency?: string
  created_at?: string
  updated_at?: string
}

interface ExportLog {
  id: string
  file_name: string
  file_type: string
  file_path?: string
  status: string
  created_at: string
  operator_name?: string
}

export default function CustomReport() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined)
  const [exportLogs, setExportLogs] = useState<ExportLog[]>([])
  const [exportLogsPagination, setExportLogsPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [reportData, setReportData] = useState<any[]>([])
  const [reportColumns, setReportColumns] = useState<any[]>([])

  // 订阅人员候选列表
  const [subscribersOptions, setSubscribersOptions] = useState<any[]>([])

  // 报表配置表单
  const [form] = Form.useForm()
  const [timeRangePreset, setTimeRangePreset] = useState<string>('30d')
  const [customDateRange, setCustomDateRange] = useState<string[]>([])
  const [subscribers, setSubscribers] = useState<string[]>([])
  const [frequency, setFrequency] = useState<string>('daily')
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveTemplateName, setSaveTemplateName] = useState('')

  useEffect(() => {
    fetchTemplates()
    fetchExportLogs(1)
    fetchSubscribers()
  }, [])

  // 拉取模板列表
  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res: any = await axios.get('/dashboard/report-templates', {
        params: { org_id: user.organization_id },
      })
      const list: ReportTemplate[] = Array.isArray(res) ? res : (res?.data || [])
      setTemplates(list)
    } catch (error) {
      console.error('Fetch templates error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 拉取导出日志
  const fetchExportLogs = async (page: number) => {
    try {
      const res: any = await axios.get('/dashboard/export-logs', {
        params: { org_id: user.organization_id, page, limit: exportLogsPagination.limit },
      })
      const list = Array.isArray(res) ? res : (res?.data || [])
      const total = res?.total || list.length
      setExportLogs(list)
      setExportLogsPagination({ ...exportLogsPagination, page, total })
    } catch (error) {
      console.error('Fetch export logs error:', error)
    }
  }

  // 拉取订阅人员候选
  const fetchSubscribers = async () => {
    try {
      const res: any = await axios.get('/users', {
        params: { org_id: user.organization_id, page: 1, limit: 100 },
      })
      const list = Array.isArray(res) ? res : (res?.data || [])
      setSubscribersOptions(list.map((u: any) => ({
        label: u.name || u.username || u.id,
        value: u.id,
      })))
    } catch (error) {
      console.error('Fetch subscribers error:', error)
    }
  }

  // 选择模板 - 加载配置
  const handleSelectTemplate = (template: ReportTemplate) => {
    setSelectedTemplateId(template.id)
    form.setFieldsValue({
      name: template.name,
      dimensions: template.dimensions,
      metrics: template.metrics,
    })
    if (template.time_range && template.time_range !== 'custom') {
      setTimeRangePreset(template.time_range)
      setCustomDateRange([])
    } else if (template.start_date && template.end_date) {
      setTimeRangePreset('custom')
      setCustomDateRange([template.start_date, template.end_date])
    }
    setSubscribers(template.subscribers || [])
    setFrequency(template.frequency || 'daily')
    message.success(`已加载模板「${template.name}」`)
  }

  // 生成报表
  const handleGenerate = async () => {
    try {
      const values = await form.validateFields()
      const params = {
        org_id: user.organization_id,
        name: values.name,
        dimensions: values.dimensions,
        metrics: values.metrics,
        time_range: timeRangePreset,
        start_date: customDateRange[0],
        end_date: customDateRange[1],
      }
      setLoading(true)
      const res: any = await axios.post('/dashboard/reports/generate', params)
      const data = res?.data || res?.rows || []
      setReportData(data)

      // 动态生成列
      const cols: any[] = []
      if (values.dimensions?.length) {
        values.dimensions.forEach((dim: string) => {
          const opt = DIMENSION_OPTIONS.find((o) => o.value === dim)
          cols.push({
            title: opt?.label || dim,
            dataIndex: dim,
            key: dim,
            render: (v: any) => <span style={{ fontWeight: 500, color: '#1d1d1f' }}>{v ?? '-'}</span>,
          })
        })
      }
      if (values.metrics?.length) {
        values.metrics.forEach((metric: string) => {
          const opt = METRIC_OPTIONS.find((o) => o.value === metric)
          cols.push({
            title: opt?.label || metric,
            dataIndex: metric,
            key: metric,
            align: 'right',
            render: (v: any) => {
              const num = Number(v || 0)
              const isMoney = ['revenue', 'cost', 'profit'].includes(metric)
              return isMoney
                ? <span style={{ fontVariantNumeric: 'tabular-nums', color: '#0071e3', fontWeight: 600 }}>¥{num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                : <span style={{ fontVariantNumeric: 'tabular-nums' }}>{num.toLocaleString()}</span>
            },
          })
        })
      }
      setReportColumns(cols)
      message.success('报表生成成功')
    } catch (error: any) {
      if (error?.errorFields) {
        message.error('请完整填写报表配置')
      } else {
        console.error('Generate report error:', error)
        message.error('报表生成失败')
      }
    } finally {
      setLoading(false)
    }
  }

  // 导出 Excel
  const handleExportExcel = async () => {
    try {
      const values = await form.validateFields()
      const params = {
        org_id: user.organization_id,
        name: values.name,
        dimensions: values.dimensions,
        metrics: values.metrics,
        time_range: timeRangePreset,
        start_date: customDateRange[0],
        end_date: customDateRange[1],
      }
      setLoading(true)
      const res: any = await axios.post('/dashboard/reports/export-excel', params, { responseType: 'blob' } as any)
      // 优先按文件流处理；如返回 file_path 则后端已落盘
      if (res?.file_path) {
        message.success(`导出成功，文件已保存到服务器：${res.file_path}`)
      } else if (res instanceof Blob) {
        const url = window.URL.createObjectURL(res)
        const link = document.createElement('a')
        link.href = url
        link.download = `${values.name || '报表'}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        message.success('Excel 导出成功')
      } else {
        message.success('Excel 导出成功')
      }
      fetchExportLogs(1)
    } catch (error) {
      console.error('Export Excel error:', error)
      message.error('Excel 导出失败')
    } finally {
      setLoading(false)
    }
  }

  // 导出 PDF
  const handleExportPdf = async () => {
    try {
      const values = await form.validateFields()
      const params = {
        org_id: user.organization_id,
        name: values.name,
        dimensions: values.dimensions,
        metrics: values.metrics,
        time_range: timeRangePreset,
        start_date: customDateRange[0],
        end_date: customDateRange[1],
      }
      setLoading(true)
      const res: any = await axios.post('/dashboard/reports/export-pdf', params, { responseType: 'blob' } as any)
      if (res?.file_path) {
        message.success(`导出成功，文件已保存到服务器：${res.file_path}`)
      } else if (res instanceof Blob) {
        const url = window.URL.createObjectURL(res)
        const link = document.createElement('a')
        link.href = url
        link.download = `${values.name || '报表'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        message.success('PDF 导出成功')
      } else {
        message.success('PDF 导出成功')
      }
      fetchExportLogs(1)
    } catch (error) {
      console.error('Export PDF error:', error)
      message.error('PDF 导出失败')
    } finally {
      setLoading(false)
    }
  }

  // 打开保存模板 Modal
  const handleOpenSaveModal = async () => {
    try {
      const values = await form.validateFields()
      setSaveTemplateName(values.name || '')
      setSaveModalOpen(true)
    } catch {
      message.error('请完整填写报表配置')
    }
  }

  // 保存为模板
  const handleSaveTemplate = async () => {
    if (!saveTemplateName.trim()) {
      message.error('请输入模板名称')
      return
    }
    try {
      const values = await form.validateFields()
      const payload = {
        org_id: user.organization_id,
        name: saveTemplateName.trim(),
        dimensions: values.dimensions,
        metrics: values.metrics,
        time_range: timeRangePreset,
        start_date: customDateRange[0],
        end_date: customDateRange[1],
        subscribers,
        frequency,
      }
      setLoading(true)
      if (selectedTemplateId) {
        await axios.put(`/dashboard/report-templates/${selectedTemplateId}`, payload)
        message.success('模板更新成功')
      } else {
        await axios.post('/dashboard/report-templates', payload)
        message.success('模板保存成功')
      }
      setSaveModalOpen(false)
      fetchTemplates()
    } catch (error) {
      console.error('Save template error:', error)
      message.error('模板保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除模板
  const handleDeleteTemplate = async (id: string) => {
    try {
      setLoading(true)
      await axios.delete(`/dashboard/report-templates/${id}`)
      message.success('模板已删除')
      if (selectedTemplateId === id) {
        setSelectedTemplateId(undefined)
        form.resetFields()
      }
      fetchTemplates()
    } catch (error) {
      console.error('Delete template error:', error)
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  // 订阅设置
  const handleSubscribe = async () => {
    if (!selectedTemplateId) {
      message.warning('请先选择或保存模板后再设置订阅')
      return
    }
    if (subscribers.length === 0) {
      message.warning('请选择订阅人员')
      return
    }
    try {
      setLoading(true)
      await axios.post(`/dashboard/report-templates/${selectedTemplateId}/subscribe`, {
        subscribers,
        frequency,
      })
      message.success('订阅设置已保存')
      fetchTemplates()
    } catch (error) {
      console.error('Subscribe error:', error)
      message.error('订阅设置失败')
    } finally {
      setLoading(false)
    }
  }

  // 新建模板（清空表单）
  const handleNewTemplate = () => {
    setSelectedTemplateId(undefined)
    form.resetFields()
    setTimeRangePreset('30d')
    setCustomDateRange([])
    setSubscribers([])
    setFrequency('daily')
    message.info('已清空配置，可创建新模板')
  }

  // 导出日志列
  const logColumns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (v: string, record: ExportLog) => (
        <Space>
          <FileTextOutlined style={{ color: FILE_TYPE_COLOR[record.file_type] || '#0071e3' }} />
          <span style={{ fontWeight: 500, color: '#1d1d1f' }}>{v || '-'}</span>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 80,
      render: (v: string) => (
        <Tag color={v === 'excel' ? 'green' : 'red'} style={{ borderRadius: 8 }}>
          {v === 'excel' ? 'Excel' : 'PDF'}
        </Tag>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 120,
      render: (v: string) => <span style={{ color: '#1d1d1f' }}>{v || '-'}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          success: { color: 'green', text: '成功' },
          failed: { color: 'red', text: '失败' },
          pending: { color: 'orange', text: '处理中' },
        }
        const cfg = map[status] || { color: 'default', text: status }
        return <Tag color={cfg.color} style={{ borderRadius: 8 }}>{cfg.text}</Tag>
      },
    },
    {
      title: '导出时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => <span style={{ color: '#6e6e73', fontVariantNumeric: 'tabular-nums' }}>{formatDateTime(v)}</span>,
    },
  ]

  return (
    <div style={{ animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .template-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 8px;
          border: 1px solid rgba(0,0,0,0.06);
          background: rgba(255,255,255,0.6);
        }
        .template-item:hover {
          background: rgba(255,255,255,0.95);
          border-color: #0071e3;
          transform: translateX(2px);
        }
        .template-item.active {
          background: rgba(0,113,227,0.08);
          border-color: #0071e3;
        }
      `}</style>

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.4 }}>自定义报表导出</div>
          <div style={{ fontSize: 14, color: '#6e6e73', marginTop: 4 }}>自定义维度与指标，一键生成报表并导出 Excel / PDF</div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchTemplates(); fetchExportLogs(1) }} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewTemplate}>
            新建模板
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* 左侧：模板列表 */}
        <Col xs={24} lg={6}>
          <Card
            style={sectionCardStyle}
            title={
              <Space>
                <FileTextOutlined style={{ color: '#0071e3' }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f' }}>报表模板</span>
              </Space>
            }
            styles={{ body: { padding: 12, maxHeight: 720, overflowY: 'auto' } }}
          >
            <Spin spinning={loading}>
              {templates.length === 0 ? (
                <Empty description="暂无模板" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <List
                  dataSource={templates}
                  renderItem={(item) => (
                    <div
                      className={`template-item ${selectedTemplateId === item.id ? 'active' : ''}`}
                      onClick={() => handleSelectTemplate(item)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#6e6e73', marginTop: 4 }}>
                            {item.dimensions?.length || 0} 维度 / {item.metrics?.length || 0} 指标
                          </div>
                        </div>
                        <Space size={4}>
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(e) => { e.stopPropagation(); handleSelectTemplate(item) }}
                          />
                          <Popconfirm
                            title="确定删除该模板？"
                            onConfirm={() => handleDeleteTemplate(item.id)}
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Popconfirm>
                        </Space>
                      </div>
                    </div>
                  )}
                />
              )}
            </Spin>
          </Card>
        </Col>

        {/* 右侧：报表配置区 */}
        <Col xs={24} lg={18}>
          <Card
            style={sectionCardStyle}
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#0071e3' }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f' }}>报表配置</span>
                {selectedTemplateId && (
                  <Tag color="blue" style={{ borderRadius: 8 }}>当前模板已加载</Tag>
                )}
              </Space>
            }
            styles={{ body: { padding: 24 } }}
          >
            <Spin spinning={loading}>
              <Form form={form} layout="vertical">
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="name"
                      label={<span style={{ color: '#1d1d1f', fontWeight: 500 }}>报表名称</span>}
                      rules={[{ required: true, message: '请输入报表名称' }]}
                    >
                      <Input placeholder="请输入报表名称" style={{ borderRadius: 10 }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="dimensions"
                      label={<span style={{ color: '#1d1d1f', fontWeight: 500 }}>维度（可多选）</span>}
                      rules={[{ required: true, message: '请至少选择一个维度' }]}
                    >
                      <Select
                        mode="multiple"
                        placeholder="选择维度"
                        options={DIMENSION_OPTIONS}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="metrics"
                      label={<span style={{ color: '#1d1d1f', fontWeight: 500 }}>指标（可多选）</span>}
                      rules={[{ required: true, message: '请至少选择一个指标' }]}
                    >
                      <Select
                        mode="multiple"
                        placeholder="选择指标"
                        options={METRIC_OPTIONS}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label={<span style={{ color: '#1d1d1f', fontWeight: 500 }}>时间范围</span>}>
                      <Radio.Group
                        value={timeRangePreset}
                        onChange={(e) => setTimeRangePreset(e.target.value)}
                        style={{ marginBottom: timeRangePreset === 'custom' ? 12 : 0 }}
                      >
                        {TIME_RANGE_PRESETS.map((opt) => (
                          <Radio.Button key={opt.value} value={opt.value} style={{ borderRadius: 8 }}>
                            {opt.label}
                          </Radio.Button>
                        ))}
                      </Radio.Group>
                      {timeRangePreset === 'custom' && (
                        <RangePicker
                          style={{ width: '100%' }}
                          value={customDateRange as any}
                          onChange={(_: any, dateStrings: [string, string]) => setCustomDateRange(dateStrings)}
                        />
                      )}
                    </Form.Item>
                  </Col>
                </Row>

                {/* 操作按钮 */}
                <Space wrap size={[8, 8]} style={{ marginTop: 8, marginBottom: 24 }}>
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={handleGenerate}
                    loading={loading}
                    style={{ borderRadius: 10 }}
                  >
                    生成报表
                  </Button>
                  <Button
                    icon={<FileExcelOutlined />}
                    onClick={handleExportExcel}
                    loading={loading}
                    style={{ borderRadius: 10, color: '#34c759', borderColor: '#34c759' }}
                  >
                    导出 Excel
                  </Button>
                  <Button
                    icon={<FilePdfOutlined />}
                    onClick={handleExportPdf}
                    loading={loading}
                    style={{ borderRadius: 10, color: '#ff375f', borderColor: '#ff375f' }}
                  >
                    导出 PDF
                  </Button>
                  <Button
                    icon={<SaveOutlined />}
                    onClick={handleOpenSaveModal}
                    style={{ borderRadius: 10 }}
                  >
                    保存为模板
                  </Button>
                </Space>

                {/* 报表数据 */}
                {reportData.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 12 }}>
                      <FileTextOutlined style={{ color: '#0071e3', marginRight: 6 }} />
                      报表数据（共 {reportData.length} 条）
                    </div>
                    <Table
                      dataSource={reportData}
                      columns={reportColumns}
                      rowKey={(_, idx) => String(idx)}
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                      size="middle"
                      scroll={{ x: 'max-content' }}
                    />
                  </div>
                )}

                {/* 订阅设置 */}
                <div style={{
                  background: 'rgba(0,113,227,0.04)',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid rgba(0,113,227,0.08)',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 12 }}>
                    <BellOutlined style={{ color: '#0071e3', marginRight: 6 }} />
                    订阅设置
                  </div>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <div style={{ fontSize: 12, color: '#6e6e73', marginBottom: 6 }}>订阅人员</div>
                      <Select
                        mode="multiple"
                        placeholder="选择订阅人员"
                        value={subscribers}
                        onChange={setSubscribers}
                        options={subscribersOptions}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col xs={24} md={6}>
                      <div style={{ fontSize: 12, color: '#6e6e73', marginBottom: 6 }}>推送频率</div>
                      <Select
                        placeholder="选择频率"
                        value={frequency}
                        onChange={setFrequency}
                        options={FREQUENCY_OPTIONS}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col xs={24} md={6}>
                      <div style={{ fontSize: 12, color: '#6e6e73', marginBottom: 6 }}>&nbsp;</div>
                      <Button
                        type="primary"
                        icon={<BellOutlined />}
                        onClick={handleSubscribe}
                        loading={loading}
                        style={{ borderRadius: 10, width: '100%' }}
                      >
                        保存订阅
                      </Button>
                    </Col>
                  </Row>
                </div>
              </Form>
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* 底部：导出日志 */}
      <Card
        style={{ ...cardStyle, marginTop: 16 }}
        title={
          <Space>
            <HistoryOutlined style={{ color: '#0071e3' }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f' }}>导出日志</span>
            <ClockCircleOutlined style={{ color: '#6e6e73', fontSize: 12 }} />
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={exportLogs}
          columns={logColumns}
          rowKey={(record, idx) => `${record.id}-${idx}`}
          pagination={{
            current: exportLogsPagination.page,
            pageSize: exportLogsPagination.limit,
            total: exportLogsPagination.total,
            showSizeChanger: true,
            onChange: (page) => fetchExportLogs(page),
          }}
          size="middle"
        />
      </Card>

      {/* 保存模板 Modal */}
      <Modal
        title="保存为模板"
        open={saveModalOpen}
        onOk={handleSaveTemplate}
        onCancel={() => setSaveModalOpen(false)}
        confirmLoading={loading}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 8, color: '#6e6e73', fontSize: 13 }}>
          <Avatar size={28} style={{ background: 'linear-gradient(135deg, #0071e3 0%, #00a8ff 100%)', marginRight: 8, verticalAlign: 'middle' }}>
            <SaveOutlined />
          </Avatar>
          输入模板名称以保存当前配置
        </div>
        <Input
          placeholder="请输入模板名称"
          value={saveTemplateName}
          onChange={(e) => setSaveTemplateName(e.target.value)}
          style={{ borderRadius: 10, marginTop: 4 }}
          onPressEnter={handleSaveTemplate}
        />
      </Modal>
    </div>
  )
}
