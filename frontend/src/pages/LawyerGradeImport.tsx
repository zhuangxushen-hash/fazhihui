import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Input,
  Button,
  Space,
  message,
  Table,
  Tag,
  Alert,
} from 'antd'
import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { importBidPerformances } from '../api/bid'
import type { BidPerformanceItem } from '../api/bid'

const { TextArea } = Input

// 导入模板示例
const TEMPLATE = `项目名称,客户,金额,分类(litigation诉讼/non_litigation非诉/consultant顾问),开始日期(YYYY-MM-DD)
XX银行常年法律顾问,XX银行,300000,consultant,2026-01-01
某公司股权纠纷案,某科技有限公司,150000,litigation,2026-03-15`

// 分类映射
const categoryConfig: Record<string, string> = {
  litigation: '诉讼',
  non_litigation: '非诉',
  consultant: '顾问',
}

export default function LawyerGradeImport() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<Partial<BidPerformanceItem>[]>([])
  const [importing, setImporting] = useState(false)

  // 解析粘贴文本为记录数组
  const handleParse = () => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) {
      message.warning('请粘贴包含表头和数据的文本（至少一行数据）')
      return
    }
    // 跳过表头
    const records: Partial<BidPerformanceItem>[] = []
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim())
      if (parts.length < 4) {
        message.warning(`第 ${i + 1} 行数据不完整，已跳过`)
        continue
      }
      records.push({
        project_name: parts[0],
        client: parts[1],
        amount: Number(parts[2]) || 0,
        category: parts[3],
        start_date: parts[4] || undefined,
        description: parts[5] || undefined,
      })
    }
    if (records.length === 0) {
      message.warning('未解析到有效数据')
      return
    }
    setPreview(records)
    message.success(`解析成功，共 ${records.length} 条记录`)
  }

  // 批量导入
  const handleImport = async () => {
    if (preview.length === 0) {
      message.warning('请先解析数据')
      return
    }
    setImporting(true)
    try {
      const res = await importBidPerformances(preview)
      message.success(res.message || `成功导入 ${preview.length} 条`)
      setPreview([])
      setText('')
    } catch (err) {
      message.error('批量导入失败')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>批量导入</h2>
          <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
            粘贴 CSV 文本批量导入业绩记录
          </p>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bid-performances')}>
          返回业绩库
        </Button>
      </div>

      {/* 格式说明 */}
      <Alert
        type="info"
        showIcon
        message="数据格式说明"
        description="每行一条记录，字段用英文逗号分隔：项目名称,客户,金额,分类,开始日期(可选),描述(可选)。分类取值：litigation（诉讼）/ non_litigation（非诉）/ consultant（顾问）。"
      />

      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Space style={{ marginBottom: 12 }}>
          <Button onClick={() => setText(TEMPLATE)}>填充示例</Button>
          <Button type="primary" onClick={handleParse}>
            解析数据
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setText(''); setPreview([]) }}>
            清空
          </Button>
        </Space>
        <TextArea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴 CSV 格式的业绩数据..."
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Card>

      {/* 预览 */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Space style={{ marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>解析预览（{preview.length} 条）</span>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={handleImport}
            loading={importing}
            disabled={preview.length === 0}
          >
            批量导入
          </Button>
        </Space>
        <Table
          dataSource={preview}
          rowKey={(_, i) => String(i)}
          size="small"
          pagination={false}
          locale={{ emptyText: '暂无解析数据' }}
          columns={[
            { title: '项目名称', dataIndex: 'project_name' },
            { title: '客户', dataIndex: 'client' },
            {
              title: '金额',
              dataIndex: 'amount',
              align: 'right' as const,
              render: (v: number) => (v ? `¥${Number(v).toLocaleString()}` : '-'),
            },
            {
              title: '分类',
              dataIndex: 'category',
              width: 100,
              render: (v: string) => <Tag color="blue">{categoryConfig[v] || v || '-'}</Tag>,
            },
            { title: '开始日期', dataIndex: 'start_date', width: 130 },
          ]}
        />
      </Card>
    </div>
  )
}
