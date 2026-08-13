import { useState, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Select,
  Button,
  Space,
  Modal,
  Progress,
  Statistic,
  Form,
  Input,
  message,
} from 'antd'
import {
  UndoOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  WarningOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'

// 金额格式化
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 代扣类型选项
const withholdingTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'tax', label: '代扣税款' },
  { value: 'social_insurance', label: '代扣社保' },
  { value: 'salary', label: '代扣薪酬' },
  { value: 'fee', label: '代扣费用' },
  { value: 'deposit', label: '代扣保证金' },
]

// Mock已代扣数据
const mockCompletedData: Record<string, unknown>[] = [
  {
    key: '1',
    withholding_no: 'WIT20260802',
    case_no: 'CASE2026005',
    case_name: '张某劳动争议案',
    withholding_type: 'social_insurance',
    withholding_type_label: '代扣社保',
    amount: 3200.0,
    status: 'completed',
    executed_at: '2026-08-04',
    operator: '财务系统',
  },
  {
    key: '2',
    withholding_no: 'WIT20260804',
    case_no: 'CASE2026018',
    case_name: '某银行金融借款合同案',
    withholding_type: 'fee',
    withholding_type_label: '代扣费用',
    amount: 15000.0,
    status: 'completed',
    executed_at: '2026-08-09',
    operator: '李助理',
  },
  {
    key: '3',
    withholding_no: 'WIT20260812',
    case_no: 'CASE2026060',
    case_name: '某技术服务合同纠纷案',
    withholding_type: 'tax',
    withholding_type_label: '代扣税款',
    amount: 9800.0,
    status: 'completed',
    executed_at: '2026-08-10',
    operator: '财务系统',
  },
  {
    key: '4',
    withholding_no: 'WIT20260813',
    case_no: 'CASE2026065',
    case_name: '某物流运输合同案',
    withholding_type: 'deposit',
    withholding_type_label: '代扣保证金',
    amount: 20000.0,
    status: 'completed',
    executed_at: '2026-08-11',
    operator: '张律师',
  },
  {
    key: '5',
    withholding_no: 'WIT20260814',
    case_no: 'CASE2026070',
    case_name: '某商标侵权纠纷案',
    withholding_type: 'tax',
    withholding_type_label: '代扣税款',
    amount: 16800.0,
    status: 'completed',
    executed_at: '2026-08-12',
    operator: '财务系统',
  },
  {
    key: '6',
    withholding_no: 'WIT20260815',
    case_no: 'CASE2026075',
    case_name: '某建设工程设计合同案',
    withholding_type: 'salary',
    withholding_type_label: '代扣薪酬',
    amount: 8500.0,
    status: 'completed',
    executed_at: '2026-08-13',
    operator: '王律师',
  },
  {
    key: '7',
    withholding_no: 'WIT20260816',
    case_no: 'CASE2026080',
    case_name: '某股权转让纠纷案',
    withholding_type: 'social_insurance',
    withholding_type_label: '代扣社保',
    amount: 5200.0,
    status: 'completed',
    executed_at: '2026-08-14',
    operator: '财务系统',
  },
  {
    key: '8',
    withholding_no: 'WIT20260817',
    case_no: 'CASE2026085',
    case_name: '某融资租赁合同纠纷案',
    withholding_type: 'fee',
    withholding_type_label: '代扣费用',
    amount: 22000.0,
    status: 'completed',
    executed_at: '2026-08-15',
    operator: '赵律师',
  },
]

// 状态映射
const statusMap: Record<string, { label: string; className: string }> = {
  completed: { label: '已代扣', className: 'stitch-tag stitch-tag-success' },
  processing: { label: '撤销中', className: 'stitch-tag stitch-tag-info' },
  cancelled: { label: '已撤销', className: 'stitch-tag stitch-tag-error' },
  failed: { label: '撤销失败', className: 'stitch-tag stitch-tag-warning' },
}

// 撤销结果接口
interface UndoResult {
  success: boolean
  record: Record<string, unknown>
  message: string
}

// 撤销原因常用选项
const commonReasons = [
  '代扣金额有误',
  '案件信息变更',
  '客户要求撤销',
  '重复代扣',
  '其他原因',
]

export default function BatchWithholdingUndo() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<Record<string, unknown>[]>(mockCompletedData)
  const [filters, setFilters] = useState({
    withholdingType: '',
  })

  // 批量选择
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRows, setSelectedRows] = useState<Record<string, unknown>[]>([])

  // 撤销弹窗
  const [undoVisible, setUndoVisible] = useState(false)
  const [undoForm] = Form.useForm()
  const [undoProgress, setUndoProgress] = useState(0)
  const [undoRunning, setUndoRunning] = useState(false)
  const [undoResults, setUndoResults] = useState<UndoResult[]>([])
  const [undoDone, setUndoDone] = useState(false)

  // 筛选数据
  const filteredData = useMemo(() => {
    return dataSource.filter((item) => {
      if (filters.withholdingType && item.withholding_type !== filters.withholdingType) return false
      return true
    })
  }, [dataSource, filters])

  // 统计数据
  const stats = useMemo(() => {
    const selectedAmount = selectedRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    return {
      totalCount: filteredData.length,
      selectedCount: selectedRows.length,
      selectedAmount,
    }
  }, [filteredData, selectedRows])

  // 选择变更
  const handleRowSelectionChange = (keys: React.Key[], rows: Record<string, unknown>[]) => {
    setSelectedRowKeys(keys)
    setSelectedRows(rows)
  }

  // 全选
  const handleSelectAll = () => {
    if (selectedRowKeys.length === filteredData.length) {
      setSelectedRowKeys([])
      setSelectedRows([])
    } else {
      setSelectedRowKeys(filteredData.map((r) => r.key as React.Key))
      setSelectedRows(filteredData)
    }
  }

  // 打开撤销弹窗
  const handleOpenUndo = () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要撤销的代扣记录')
      return
    }
    setUndoVisible(true)
    setUndoProgress(0)
    setUndoResults([])
    setUndoDone(false)
    undoForm.resetFields()
  }

  // 执行批量撤销
  const handleExecuteUndo = async () => {
    const values = undoForm.getFieldsValue()
    if (!values.reason) {
      message.warning('请填写撤销原因')
      return
    }

    if (selectedRows.length === 0) return
    setUndoRunning(true)
    const results: UndoResult[] = []
    const updatedData = [...dataSource]
    const total = selectedRows.length

    for (let i = 0; i < selectedRows.length; i++) {
      const row = selectedRows[i]
      // 模拟撤销代扣（95%成功率，比代扣成功率高）
      const isSuccess = Math.random() > 0.05
      await new Promise((resolve) => setTimeout(resolve, 400))

      const result: UndoResult = {
        success: isSuccess,
        record: row,
        message: isSuccess ? '代扣撤销成功，资金已退回' : '资金账户异常，撤销失败',
      }
      results.push(result)

      // 更新数据状态
      const idx = updatedData.findIndex((d) => d.key === row.key)
      if (idx !== -1) {
        updatedData[idx] = {
          ...updatedData[idx],
          status: isSuccess ? 'cancelled' : 'failed',
          undo_reason: values.reason,
          undone_at: isSuccess ? formatDate(new Date()) : undefined,
        }
      }

      setUndoProgress(Math.round(((i + 1) / total) * 100))
    }

    setDataSource(updatedData)
    setUndoResults(results)
    setUndoRunning(false)
    setUndoDone(true)

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length
    message.success(`批量撤销完成：成功 ${successCount} 条，失败 ${failCount} 条`)

    // 清空选择
    setSelectedRowKeys([])
    setSelectedRows([])
  }

  // 关闭弹窗
  const handleCloseUndo = () => {
    if (undoRunning) {
      Modal.confirm({
        title: '确认关闭？',
        content: '批量撤销正在执行中，关闭将中断操作。',
        okText: '确认关闭',
        cancelText: '继续执行',
        onOk: () => {
          setUndoVisible(false)
        },
      })
      return
    }
    setUndoVisible(false)
  }

  // 重置筛选
  const handleReset = () => {
    setFilters({ withholdingType: '' })
    setSelectedRowKeys([])
    setSelectedRows([])
  }

  // 撤销结果统计
  const undoStats = useMemo(() => {
    const success = undoResults.filter((r) => r.success).length
    const failed = undoResults.filter((r) => !r.success).length
    const successAmount = undoResults
      .filter((r) => r.success)
      .reduce((sum, r) => sum + (Number(r.record.amount) || 0), 0)
    const failedAmount = undoResults
      .filter((r) => !r.success)
      .reduce((sum, r) => sum + (Number(r.record.amount) || 0), 0)
    return { success, failed, successAmount, failedAmount }
  }, [undoResults])

  // 点击常用原因
  const handleReasonClick = (reason: string) => {
    undoForm.setFieldsValue({ reason })
  }

  // 表格列定义
  const columns = [
    {
      title: '代扣编号',
      dataIndex: 'withholding_no',
      key: 'withholding_no',
      width: 140,
      render: (v: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '关联案件',
      dataIndex: 'case_no',
      key: 'case_no',
      width: 130,
      render: (v: string) => <span style={{ color: theme.primary }}>{v}</span>,
    },
    {
      title: '案件名称',
      dataIndex: 'case_name',
      key: 'case_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '代扣类型',
      dataIndex: 'withholding_type_label',
      key: 'withholding_type_label',
      width: 110,
      render: (v: string) => <span className="stitch-tag">{v}</span>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 600, color: theme.primaryDark }}>{fmtMoney(v)}</span>,
    },
    {
      title: '执行时间',
      dataIndex: 'executed_at',
      key: 'executed_at',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: '执行人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = statusMap[v] || { label: v, className: 'stitch-tag' }
        return <span className={cfg.className}>{cfg.label}</span>
      },
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>批量撤销代扣</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          批量选择已代扣记录，执行撤销操作将资金退回原账户
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card
            style={{ borderRadius: 12, background: theme.gradientStat1 }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 24,
                }}
              >
                <HistoryOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>已代扣记录</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {stats.totalCount} 条
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{ borderRadius: 12, background: theme.gradientStat2 }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 24,
                }}
              >
                <CheckCircleOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>已选择</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {stats.selectedCount} 条
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{ borderRadius: 12, background: theme.gradientStat3 }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 24,
                }}
              >
                <UndoOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>将撤销金额</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {fmtMoney(stats.selectedAmount)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card
        className="stitch-filter-bar"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 16 } }}
      >
        <Space wrap size={[12, 12]}>
          <Select
            placeholder="代扣类型"
            style={{ width: 140 }}
            value={filters.withholdingType || undefined}
            onChange={(v) => setFilters({ ...filters, withholdingType: v || '' })}
            options={withholdingTypeOptions}
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => setLoading(true)}
            loading={loading}
          >
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
          <div style={{ flex: 1 }} />
          <Button
            icon={selectedRowKeys.length === filteredData.length ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
            onClick={handleSelectAll}
            disabled={filteredData.length === 0}
          >
            {selectedRowKeys.length === filteredData.length ? '取消全选' : '全选'}
          </Button>
          <Button
            danger
            icon={<UndoOutlined />}
            onClick={handleOpenUndo}
            disabled={selectedRows.length === 0}
          >
            批量撤销 ({selectedRows.length})
          </Button>
        </Space>
      </Card>

      {/* 表格 */}
      <Card
        className="stitch-table"
        style={{ borderRadius: 16, overflow: 'hidden' }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="key"
          loading={loading}
          size="middle"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          rowSelection={{
            selectedRowKeys,
            onChange: handleRowSelectionChange,
            getCheckboxProps: (record) => ({
              disabled: record.status !== 'completed',
            }),
          }}
        />
      </Card>

      {/* 批量撤销弹窗 */}
      <Modal
        title="批量撤销代扣"
        open={undoVisible}
        onCancel={handleCloseUndo}
        footer={[
          !undoDone && !undoRunning && (
            <Button key="cancel" onClick={() => setUndoVisible(false)}>
              取消
            </Button>
          ),
          !undoDone && !undoRunning && (
            <Button
              key="submit"
              type="primary"
              danger
              icon={<UndoOutlined />}
              onClick={handleExecuteUndo}
            >
              确认撤销 ({selectedRows.length} 条)
            </Button>
          ),
          undoDone && (
            <Button key="close" type="primary" onClick={() => setUndoVisible(false)}>
              完成
            </Button>
          ),
        ].filter(Boolean)}
        width={640}
        destroyOnClose
      >
        {/* 撤销前确认 */}
        {!undoDone && !undoRunning && (
          <div>
            <div
              style={{
                background: '#fff2f0',
                border: `1px solid ${theme.error}`,
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ color: theme.error, fontWeight: 500, marginBottom: 8 }}>
                <WarningOutlined /> 撤销操作提示
              </div>
              <div style={{ color: theme.textSecondary, fontSize: 13 }}>
                本次将撤销 <strong style={{ color: theme.error }}>{selectedRows.length}</strong> 条代扣记录，
                总金额 <strong style={{ color: theme.error }}>{fmtMoney(stats.selectedAmount)}</strong>。
                撤销后资金将退回原付款账户，此操作将被记录。
              </div>
            </div>

            <Form form={undoForm} layout="vertical">
              <Form.Item
                label="撤销原因"
                name="reason"
                rules={[{ required: true, message: '请填写撤销原因' }]}
              >
                <Input.TextArea rows={3} placeholder="请详细说明撤销代扣的原因" />
              </Form.Item>
            </Form>

            <div style={{ marginBottom: 12 }}>
              <span style={{ color: theme.textSecondary, fontSize: 13 }}>常用原因：</span>
              <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                {commonReasons.map((reason) => (
                  <Tag
                    key={reason}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleReasonClick(reason)}
                  >
                    {reason}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
        )}

        {/* 执行进度 */}
        {undoRunning && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>撤销进度</span>
                <span style={{ color: theme.error, fontWeight: 500 }}>{undoProgress}%</span>
              </div>
              <Progress
                percent={undoProgress}
                status="active"
                strokeColor={theme.error}
              />
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0', color: theme.error }}>
              <LoadingOutlined style={{ fontSize: 32 }} />
              <div style={{ marginTop: 8 }}>正在执行撤销操作，资金退回中...</div>
            </div>
          </div>
        )}

        {/* 撤销结果 */}
        {undoDone && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card style={{ borderRadius: 8, background: theme.bgSurfaceLow }}>
                  <Statistic
                    title="执行总数"
                    value={undoResults.length}
                    suffix="条"
                    valueStyle={{ color: theme.textBase, fontSize: 24 }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card style={{ borderRadius: 8, background: '#f6ffed' }}>
                  <Statistic
                    title="成功"
                    value={undoStats.success}
                    suffix="条"
                    valueStyle={{ color: theme.success, fontSize: 24 }}
                  />
                  <div style={{ fontSize: 12, color: theme.success, marginTop: 4 }}>
                    {fmtMoney(undoStats.successAmount)}
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card style={{ borderRadius: 8, background: '#fff2f0' }}>
                  <Statistic
                    title="失败"
                    value={undoStats.failed}
                    suffix="条"
                    valueStyle={{ color: theme.error, fontSize: 24 }}
                  />
                  <div style={{ fontSize: 12, color: theme.error, marginTop: 4 }}>
                    {fmtMoney(undoStats.failedAmount)}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 失败明细 */}
            {undoStats.failed > 0 && (
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>
                  <CloseCircleOutlined style={{ color: theme.error }} /> 失败记录
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: theme.bgSurfaceLow }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>代扣编号</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>金额</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>失败原因</th>
                      </tr>
                    </thead>
                    <tbody>
                      {undoResults
                        .filter((r) => !r.success)
                        .map((r, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${theme.borderSecondary}` }}>
                            <td style={{ padding: '8px 12px', color: theme.primary }}>
                              {String(r.record.withholding_no)}
                            </td>
                            <td style={{ padding: '8px 12px' }}>{fmtMoney(Number(r.record.amount))}</td>
                            <td style={{ padding: '8px 12px', color: theme.error }}>{r.message}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 成功明细 */}
            {undoStats.success > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>
                  <CheckCircleOutlined style={{ color: theme.success }} /> 成功记录
                </div>
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: theme.bgSurfaceLow }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>代扣编号</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>金额</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>撤销时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {undoResults
                        .filter((r) => r.success)
                        .map((r, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${theme.borderSecondary}` }}>
                            <td style={{ padding: '8px 12px', color: theme.primary }}>
                              {String(r.record.withholding_no)}
                            </td>
                            <td style={{ padding: '8px 12px' }}>{fmtMoney(Number(r.record.amount))}</td>
                            <td style={{ padding: '8px 12px', color: theme.textTertiary }}>
                              {String(r.record.undone_at)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}