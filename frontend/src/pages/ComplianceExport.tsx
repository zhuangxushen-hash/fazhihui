import { useState, useEffect } from 'react'
import { Card, Row, Col, Table, Button, Space, message, Tabs, Modal, Form, Select, DatePicker, Progress } from 'antd'
import {
  DownloadOutlined,
  PlusOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  ExportOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'
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

const cardHeadStyle: React.CSSProperties = {
  borderBottom: `1px solid ${theme.border}`,
  padding: '0 20px',
  minHeight: 56,
}

const cardTitleStyle: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 16,
  fontWeight: 600,
  color: theme.textBase,
}

type PillKind = 'neutral' | 'blue' | 'gold' | 'green' | 'red' | 'orange'

const pillColorMap: Record<PillKind, { bg: string; color: string }> = {
  neutral: { bg: 'rgba(113, 119, 133, 0.12)', color: '#5f6672' },
  blue: { bg: 'rgba(0, 113, 227, 0.1)', color: theme.primary },
  gold: { bg: 'rgba(201, 169, 97, 0.15)', color: '#8c702e' },
  green: { bg: 'rgba(46, 125, 50, 0.1)', color: theme.success },
  red: { bg: 'rgba(186, 26, 26, 0.1)', color: theme.error },
  orange: { bg: 'rgba(237, 108, 2, 0.1)', color: theme.warning },
}

const StatusPill = ({ text, kind }: { text: string; kind: PillKind }) => {
  const c = pillColorMap[kind] || pillColorMap.neutral
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  )
}

const templateTypeMap: Record<string, string> = {
  compliance_full: '合规全档',
  compliance_record: '合规记录',
  complaint: '投诉记录',
  marketing: '营销内容',
  sales: '销售合规',
  signing: '签署合规',
  quality_check: '谈案质检',
}

const exportFormatMap: Record<string, string> = {
  excel: 'Excel',
  pdf: 'PDF',
  csv: 'CSV',
}

export default function ComplianceExport() {
  const [activeTab, setActiveTab] = useState('templates')
  const [templates, setTemplates] = useState<any[]>([])
  const [exportHistory, setExportHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [exporting, setExporting] = useState(false)
  const [exportResult, setExportResult] = useState<any>(null)
  const [exportResultVisible, setExportResultVisible] = useState(false)

  const [createForm] = Form.useForm()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'templates') {
        const res = await axios.get('/compliance/export-templates', {
          params: { org_id: user.organization_id },
        }) as Record<string, unknown>[]
        setTemplates(res || [])
      } else if (activeTab === 'history') {
        const res = await axios.get('/compliance/export-history', {
          params: { org_id: user.organization_id },
        }) as Record<string, unknown>[]
        setExportHistory(res || [])
      }
    } catch (error) {
      message.error('获取导出数据失败')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setActiveTab('create')
    createForm.resetFields()
  }

  const handleCreateExport = async () => {
    try {
      const values = await createForm.validateFields()
      setExporting(true)

      await axios.post('/compliance/export', {
        template_id: values.template_id,
        organization_id: user.organization_id,
        exporter_id: user.id,
        export_format: values.export_format,
        filters: {
          type: values.compliance_type,
          start_date: values.date_range?.[0]?.format('YYYY-MM-DD'),
          end_date: values.date_range?.[1]?.format('YYYY-MM-DD'),
        },
      })

      const archiveRes = await axios.post('/compliance/export-archive', {
        organization_id: user.organization_id,
        filters: {
          type: values.compliance_type,
          start_date: values.date_range?.[0]?.format('YYYY-MM-DD'),
          end_date: values.date_range?.[1]?.format('YYYY-MM-DD'),
        },
      })

      setExportResult(archiveRes)
      createForm.resetFields()
      setExportResultVisible(true)
      message.success('导出任务创建成功')
      fetchData()
    } catch (error) {
      message.error('创建导出任务失败')
    } finally {
      setExporting(false)
    }
  }

  const templateColumns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: true,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '模板描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '维度',
      dataIndex: 'dimensions',
      key: 'dimensions',
      width: 160,
      render: (dimensions: string) => {
        try {
          const dims = JSON.parse(dimensions)
          return <span>{dims.length} 项</span>
        } catch {
          return <span>-</span>
        }
      },
    },
    {
      title: '指标',
      dataIndex: 'metrics',
      key: 'metrics',
      width: 160,
      render: (metrics: string) => {
        try {
          const mets = JSON.parse(metrics)
          return <span>{mets.length} 项</span>
        } catch {
          return <span>-</span>
        }
      },
    },
    {
      title: '时间范围',
      dataIndex: 'time_range',
      key: 'time_range',
      width: 100,
      render: (text: string) => templateTypeMap[text] || text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<ExportOutlined />}
          onClick={() => {
            setActiveTab('create')
            createForm.setFieldsValue({ template_id: record.id })
          }}
        >
          使用模板
        </Button>
      ),
    },
  ]

  const historyColumns = [
    {
      title: '导出时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '模板',
      dataIndex: 'template_id',
      key: 'template_id',
      width: 180,
      render: (text: string) => text ? (
        <StatusPill text="使用模板" kind="blue" />
      ) : (
        <StatusPill text="即时导出" kind="neutral" />
      ),
    },
    {
      title: '导出格式',
      dataIndex: 'export_format',
      key: 'export_format',
      width: 100,
      render: (text: string) => (
        <StatusPill text={exportFormatMap[text] || text} kind="gold" />
      ),
    },
    {
      title: '操作人',
      dataIndex: 'exporter_id',
      key: 'exporter_id',
      width: 120,
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: (size: number) => size ? `${(size / 1024).toFixed(1)} KB` : '-',
    },
    {
      title: '下载链接',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<DownloadOutlined />}
          onClick={() => {
            message.info(`下载链接: ${record.file_path}`)
          }}
        >
          下载
        </Button>
      ),
    },
  ]

  const summaryCards = exportResult?.summary ? [
    {
      title: '合规记录',
      value: exportResult.summary.total_compliance_records,
      color: theme.primary,
    },
    {
      title: '投诉记录',
      value: exportResult.summary.total_complaints,
      color: theme.warning,
    },
    {
      title: '营销内容',
      value: exportResult.summary.total_marketing_contents,
      color: theme.success,
    },
    {
      title: '销售合规',
      value: exportResult.summary.total_sales_compliance,
      color: theme.error,
    },
    {
      title: '签署合规',
      value: exportResult.summary.total_signing_compliance,
      color: '#8c702e',
    },
    {
      title: '谈案质检',
      value: exportResult.summary.total_quality_checks,
      color: theme.textTertiary,
    },
  ] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={pageH2Style}>合规档案导出</h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            创建导出
          </Button>
        </div>
      </div>

      <Card style={{ borderRadius: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'templates',
              label: (
                <span>
                  <AppstoreOutlined style={{ marginRight: 6 }} />
                  导出模板
                </span>
              ),
              children: (
                <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
                  <Table
                    dataSource={templates}
                    columns={templateColumns}
                    loading={loading}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              ),
            },
            {
              key: 'create',
              label: (
                <span>
                  <ExportOutlined style={{ marginRight: 6 }} />
                  创建导出
                </span>
              ),
              children: (
                <div style={{ padding: '24px 0' }}>
                  <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                      <Card
                        title={<span style={cardTitleStyle}>导出配置</span>}
                        headStyle={cardHeadStyle}
                        style={{ borderRadius: 12 }}
                      >
                        <Form form={createForm} layout="vertical">
                          <Form.Item
                            label="选择导出模板"
                            name="template_id"
                          >
                            <Select
                              allowClear
                              placeholder="请选择模板（可选）"
                              optionFilterProp="children"
                            >
                              {templates.map(t => (
                                <Select.Option key={t.id} value={t.id}>
                                  {t.name}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item
                            label="合规类型"
                            name="compliance_type"
                          >
                            <Select allowClear placeholder="全部类型">
                              <Select.Option value="marketing">营销合规</Select.Option>
                              <Select.Option value="sales">销售合规</Select.Option>
                              <Select.Option value="case">案件合规</Select.Option>
                              <Select.Option value="finance">财务合规</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            label="时间范围"
                            name="date_range"
                          >
                            <DatePicker.RangePicker style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item
                            label="导出格式"
                            name="export_format"
                            initialValue="excel"
                          >
                            <Select>
                              <Select.Option value="excel">Excel (.xlsx)</Select.Option>
                              <Select.Option value="pdf">PDF (.pdf)</Select.Option>
                              <Select.Option value="csv">CSV (.csv)</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item>
                            <Space className="stitch-btn-group">
                              <Button
                                type="primary"
                                icon={<ExportOutlined />}
                                loading={exporting}
                                onClick={handleCreateExport}
                              >
                                一键导出
                              </Button>
                              <Button onClick={() => { createForm.resetFields() }}>
                                重置
                              </Button>
                            </Space>
                          </Form.Item>
                        </Form>
                      </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                      <Card
                        title={<span style={cardTitleStyle}>导出说明</span>}
                        headStyle={cardHeadStyle}
                        style={{ borderRadius: 12 }}
                      >
                        <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 2 }}>
                          <p style={{ margin: '8px 0' }}>1. 选择合适的导出模板可快速配置导出字段</p>
                          <p style={{ margin: '8px 0' }}>2. 筛选条件可按合规类型和时间范围过滤</p>
                          <p style={{ margin: '8px 0' }}>3. 导出内容包含合规记录、投诉、营销内容、销售合规、签署合规、谈案质检等全量数据</p>
                          <p style={{ margin: '8px 0' }}>4. 导出完成后可在"导出历史"中下载</p>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'history',
              label: (
                <span>
                  <HistoryOutlined style={{ marginRight: 6 }} />
                  导出历史
                </span>
              ),
              children: (
                <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
                  <Table
                    dataSource={exportHistory}
                    columns={historyColumns}
                    loading={loading}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              ),
            },
          ]}
        />
      </Card>

      {/* 导出结果预览 */}
      <Modal
        title="导出结果预览"
        open={exportResultVisible}
        onCancel={() => setExportResultVisible(false)}
        footer={[
          <Button key="close" onClick={() => setExportResultVisible(false)}>
            关闭
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              message.success('导出文件已开始下载')
              setExportResultVisible(false)
            }}
          >
            下载文件
          </Button>,
        ]}
        width={720}
      >
        {exportResult && (
          <>
            <div style={{ marginBottom: 16, padding: 16, background: theme.bgLayout, borderRadius: 12 }}>
              <Row gutter={[16, 16]}>
                {summaryCards.map((card: any, index: number) => (
                  <Col xs={12} sm={8} key={index}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 28, fontWeight: 700, color: card.color, lineHeight: 1.2 }}>
                        {card.value}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 4 }}>{card.title}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
            <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 12 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>导出时间：</strong>{formatDateTime(exportResult.export_time)}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>筛选条件：</strong>
                {exportResult.filters?.type ? `类型=${exportResult.filters.type}` : '全部类型'}
                {exportResult.filters?.start_date && `, ${exportResult.filters.start_date} ~ ${exportResult.filters.end_date}`}
              </div>
            </div>
            <Progress
              percent={100}
              strokeColor={{ from: theme.primary, to: theme.brandGold }}
              style={{ marginTop: 8 }}
            />
          </>
        )}
      </Modal>
    </div>
  )
}