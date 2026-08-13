import { useState, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Select,
  Button,
  Space,
  Modal,
  Progress,
  Statistic,
  message,
} from 'antd'
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  FileTextOutlined,
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

// Mock待代扣数据
const mockPendingData: Record<string, unknown>[] = [
  {
    key: '1',
    withholding_no: 'WIT20260801',
    case_no: 'CASE2026001',
    case_name: '北京科技有限公司合同纠纷案',
    withholding_type: 'tax',
    withholding_type_label: '代扣税款',
    amount: 7500.0,
    status: 'pending',
    created_at: '2026-08-01',
  },
  {
    key: '2',
    withholding_no: 'WIT20260803',
    case_no: 'CASE2026012',
    case_name: '李某离婚财产分割案',
    withholding_type: 'deposit',
    withholding_type_label: '代扣保证金',
    amount: 50000.0,
    status: 'pending',
    created_at: '2026-08-05',
  },
  {
    key: '3',
    withholding_no: 'WIT20260806',
    case_no: 'CASE2026030',
    case_name: '某科技公司知识产权侵权案',
    withholding_type: 'tax',
    withholding_type_label: '代扣税款',
    amount: 25200.0,
    status: 'pending',
    created_at: '2026-08-12',
  },
  {
    key: '4',
    withholding_no: 'WIT20260807',
    case_no: 'CASE2026035',
    case_name: '某建设工程施工合同案',
    withholding_type: 'fee',
    withholding_type_label: '代扣费用',
    amount: 18500.0,
    status: 'pending',
    created_at: '2026-08-13',
  },
  {
    key: '5',
    withholding_no: 'WIT20260808',
    case_no: 'CASE2026040',
    case_name: '某民间借贷纠纷案',
    withholding_type: 'salary',
    withholding_type_label: '代扣薪酬',
    amount: 12000.0,
    status: 'pending',
    created_at: '2026-08-14',
  },
  {
    key: '6',
    withholding_no: 'WIT20260809',
    case_no: 'CASE2026045',
    case_name: '某保险合同纠纷案',
    withholding_type: 'social_insurance',
    withholding_type_label: '代扣社保',
    amount: 4500.0,
    status: 'pending',
    created_at: '2026-08-15',
  },
  {
    key: '7',
    withholding_no: 'WIT20260810',
    case_no: 'CASE2026050',
    case_name: '某房屋买卖合同案',
    withholding_type: 'deposit',
    withholding_type_label: '代扣保证金',
    amount: 30000.0,
    status: 'pending',
    created_at: '2026-08-16',
  },
  {
    key: '8',
    withholding_no: 'WIT20260811',
    case_no: 'CASE2026055',
    case_name: '某企业破产清算案',
    withholding_type: 'tax',
    withholding_type_label: '代扣税款',
    amount: 88000.0,
    status: 'pending',
    created_at: '2026-08-17',
  },
]

// 状态映射
const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待代扣', className: 'stitch-tag stitch-tag-warning' },
  processing: { label: '执行中', className: 'stitch-tag stitch-tag-info' },
  completed: { label: '已代扣', className: 'stitch-tag stitch-tag-success' },
  failed: { label: '失败', className: 'stitch-tag stitch-tag-error' },
}

// 执行结果接口
interface ExecutionResult {
  success: boolean
  record: Record<string, unknown>
  message: string
}

export default function BatchWithholding() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<Record<string, unknown>[]>(mockPendingData)
  const [filters, setFilters] = useState({
    withholdingType: '',
  })

  // 批量选择
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRows, setSelectedRows] = useState<Record<string, unknown>[]>([])

  // 批量执行状态
  const [batchVisible, setBatchVisible] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchResults, setBatchResults] = useState<ExecutionResult[]>([])
  const [batchDone, setBatchDone] = useState(false)

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

  // 开始批量代扣
  const handleStartBatch = () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要代扣的记录')
      return
    }
    setBatchVisible(true)
    setBatchProgress(0)
    setBatchResults([])
    setBatchDone(false)
  }

  // 执行批量代扣
  const handleExecuteBatch = async () => {
    if (selectedRows.length === 0) return
    setBatchRunning(true)
    const results: ExecutionResult[] = []
    const updatedData = [...dataSource]
    const total = selectedRows.length

    for (let i = 0; i < selectedRows.length; i++) {
      const row = selectedRows[i]
      // 模拟执行代扣（90%成功率）
      const isSuccess = Math.random() > 0.1
      await new Promise((resolve) => setTimeout(resolve, 400))

      const result: ExecutionResult = {
        success: isSuccess,
        record: row,
        message: isSuccess ? '代扣执行成功' : '账户余额不足，代扣失败',
      }
      results.push(result)

      // 更新数据状态
      const idx = updatedData.findIndex((d) => d.key === row.key)
      if (idx !== -1) {
        updatedData[idx] = {
          ...updatedData[idx],
          status: isSuccess ? 'completed' : 'failed',
          executed_at: isSuccess ? formatDate(new Date()) : undefined,
          fail_reason: isSuccess ? undefined : result.message,
        }
      }

      setBatchProgress(Math.round(((i + 1) / total) * 100))
    }

    setDataSource(updatedData)
    setBatchResults(results)
    setBatchRunning(false)
    setBatchDone(true)

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length
    message.success(`批量代扣完成：成功 ${successCount} 条，失败 ${failCount} 条`)

    // 清空选择
    setSelectedRowKeys([])
    setSelectedRows([])
  }

  // 关闭弹窗
  const handleCloseBatch = () => {
    if (batchRunning) {
      Modal.confirm({
        title: '确认关闭？',
        content: '批量代扣正在执行中，关闭将中断操作。',
        okText: '确认关闭',
        cancelText: '继续执行',
        onOk: () => {
          setBatchVisible(false)
        },
      })
      return
    }
    setBatchVisible(false)
  }

  // 重置筛选
  const handleReset = () => {
    setFilters({ withholdingType: '' })
    setSelectedRowKeys([])
    setSelectedRows([])
  }

  // 批量结果统计
  const batchStats = useMemo(() => {
    const success = batchResults.filter((r) => r.success).length
    const failed = batchResults.filter((r) => !r.success).length
    const successAmount = batchResults
      .filter((r) => r.success)
      .reduce((sum, r) => sum + (Number(r.record.amount) || 0), 0)
    const failedAmount = batchResults
      .filter((r) => !r.success)
      .reduce((sum, r) => sum + (Number(r.record.amount) || 0), 0)
    return { success, failed, successAmount, failedAmount }
  }, [batchResults])

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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (v: string) => formatDate(v),
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
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>批量代扣</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          批量选择待代扣记录，一键执行代扣操作
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
                <FileTextOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>待代扣记录</div>
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
                <ThunderboltOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>选中金额</div>
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
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStartBatch}
            disabled={selectedRows.length === 0}
            style={{ background: theme.success }}
          >
            批量代扣 ({selectedRows.length})
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
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          rowSelection={{
            selectedRowKeys,
            onChange: handleRowSelectionChange,
            getCheckboxProps: (record) => ({
              disabled: record.status !== 'pending',
            }),
          }}
        />
      </Card>

      {/* 批量执行弹窗 */}
      <Modal
        title="批量代扣执行"
        open={batchVisible}
        onCancel={handleCloseBatch}
        footer={[
          !batchDone && !batchRunning && (
            <Button key="cancel" onClick={() => setBatchVisible(false)}>
              取消
            </Button>
          ),
          !batchDone && !batchRunning && (
            <Button
              key="start"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleExecuteBatch}
            >
              开始执行 ({selectedRows.length} 条)
            </Button>
          ),
          batchDone && (
            <Button key="close" type="primary" onClick={() => setBatchVisible(false)}>
              完成
            </Button>
          ),
        ].filter(Boolean)}
        width={640}
        destroyOnClose
      >
        {/* 进度显示 */}
        {!batchDone && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>代扣进度</span>
                <span style={{ color: theme.primary, fontWeight: 500 }}>
                  {batchProgress}%
                </span>
              </div>
              <Progress
                percent={batchProgress}
                status={batchRunning ? 'active' : 'normal'}
                strokeColor={theme.primary}
              />
            </div>
            {batchRunning && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: theme.primary }}>
                <LoadingOutlined style={{ fontSize: 32 }} />
                <div style={{ marginTop: 8 }}>正在执行代扣操作...</div>
              </div>
            )}
            {!batchRunning && !batchDone && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 16, marginBottom: 8 }}>
                  即将执行 <strong>{selectedRows.length}</strong> 条代扣记录
                </div>
                <div style={{ color: theme.textTertiary }}>
                  选中金额：{fmtMoney(stats.selectedAmount)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 结果统计 */}
        {batchDone && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card style={{ borderRadius: 8, background: theme.bgSurfaceLow }}>
                  <Statistic
                    title="执行总数"
                    value={batchResults.length}
                    suffix="条"
                    valueStyle={{ color: theme.textBase, fontSize: 24 }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card style={{ borderRadius: 8, background: '#f6ffed' }}>
                  <Statistic
                    title="成功"
                    value={batchStats.success}
                    suffix="条"
                    valueStyle={{ color: theme.success, fontSize: 24 }}
                  />
                  <div style={{ fontSize: 12, color: theme.success, marginTop: 4 }}>
                    {fmtMoney(batchStats.successAmount)}
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card style={{ borderRadius: 8, background: '#fff2f0' }}>
                  <Statistic
                    title="失败"
                    value={batchStats.failed}
                    suffix="条"
                    valueStyle={{ color: theme.error, fontSize: 24 }}
                  />
                  <div style={{ fontSize: 12, color: theme.error, marginTop: 4 }}>
                    {fmtMoney(batchStats.failedAmount)}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 失败明细 */}
            {batchStats.failed > 0 && (
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
                      {batchResults
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
            {batchStats.success > 0 && (
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
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>执行时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchResults
                        .filter((r) => r.success)
                        .map((r, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${theme.borderSecondary}` }}>
                            <td style={{ padding: '8px 12px', color: theme.primary }}>
                              {String(r.record.withholding_no)}
                            </td>
                            <td style={{ padding: '8px 12px' }}>{fmtMoney(Number(r.record.amount))}</td>
                            <td style={{ padding: '8px 12px', color: theme.textTertiary }}>
                              {r.record.executed_at as string}
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