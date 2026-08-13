import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Input,
  Button,
  Space,
  Select,
  message,
  Table,
  Tag,
} from 'antd'
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { exportBidPerformances } from '../api/bid'
import type { BidPerformanceItem } from '../api/bid'

// 状态映射
const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'gold' },
  approved: { label: '已通过', color: 'green' },
  rejected: { label: '已驳回', color: 'red' },
}

// CSV 转义
const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export default function LawyerGradeDownload() {
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<BidPerformanceItem[]>([])

  // 查询导出数据
  const handleQuery = async () => {
    setLoading(true)
    try {
      const res = await exportBidPerformances({
        project_name: projectName || undefined,
        status,
      })
      setPreview(res.data || [])
      message.success(`查询到 ${res.total || 0} 条业绩记录`)
    } catch (err) {
      message.error('查询失败')
    } finally {
      setLoading(false)
    }
  }

  // 生成并下载 CSV
  const handleDownload = () => {
    if (preview.length === 0) {
      message.warning('请先查询数据')
      return
    }
    const header = ['项目名称', '客户', '金额', '分类', '开始日期', '结束日期', '状态', '描述']
    const rows = preview.map((r) => [
      r.project_name,
      r.client,
      r.amount,
      r.category,
      (r.start_date || '').slice(0, 10),
      (r.end_date || '').slice(0, 10),
      statusConfig[r.status]?.label || r.status,
      r.description || '',
    ])
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
    // 添加 BOM 以便 Excel 正确识别中文
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `投标业绩库_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    message.success(`已导出 ${preview.length} 条业绩记录`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>批量下载</h2>
          <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
            按条件筛选后导出业绩数据为 CSV 文件
          </p>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bid-performances')}>
          返回业绩库
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Space wrap size={[12, 12]}>
          <Input
            placeholder="项目名称筛选"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="审核状态"
            value={status}
            onChange={setStatus}
            style={{ width: 140 }}
            allowClear
            options={Object.entries(statusConfig).map(([value, cfg]) => ({
              value,
              label: cfg.label,
            }))}
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleQuery} loading={loading}>
            查询
          </Button>
          <Button
            type="primary"
            ghost
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            disabled={preview.length === 0}
          >
            导出 CSV（{preview.length} 条）
          </Button>
        </Space>
      </Card>

      {/* 预览 */}
      <Card className="stitch-table" style={{ borderRadius: 16, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={preview}
          rowKey="id"
          size="middle"
          loading={loading}
          locale={{ emptyText: '点击"查询"查看可导出的业绩记录' }}
          scroll={{ x: 1000 }}
          columns={[
            { title: '项目名称', dataIndex: 'project_name', ellipsis: true },
            { title: '客户', dataIndex: 'client', width: 140 },
            {
              title: '金额',
              dataIndex: 'amount',
              width: 130,
              align: 'right' as const,
              render: (v: number) => (v ? `¥${Number(v).toLocaleString()}` : '-'),
            },
            { title: '分类', dataIndex: 'category', width: 100 },
            { title: '开始日期', dataIndex: 'start_date', width: 120, render: (v: string) => v?.slice(0, 10) || '-' },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (v: string) => {
                const cfg = statusConfig[v] || { label: v || '-', color: 'default' }
                return <Tag color={cfg.color}>{cfg.label}</Tag>
              },
            },
          ]}
        />
      </Card>
    </div>
  )
}
