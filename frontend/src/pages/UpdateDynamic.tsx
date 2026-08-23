import { useState, useEffect, useCallback } from 'react'
import { Card, Timeline, Tag, Space, Spin, Empty, Typography, Button, Segmented } from 'antd'
import {
  FolderOpenOutlined,
  FileDoneOutlined,
  MoneyCollectOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  FileTextOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { getUpdateDynamic } from '../api/update-dynamic'
import { theme } from '../constants/theme'

const { Text } = Typography

// 动态类型配置
const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  case: { label: '案件', color: '#1677ff', icon: <FolderOpenOutlined /> },
  contract: { label: '合同', color: '#eb2f96', icon: <FileDoneOutlined /> },
  payment: { label: '收款', color: '#52c41a', icon: <MoneyCollectOutlined /> },
  seal: { label: '用印', color: '#fa8c16', icon: <SafetyCertificateOutlined /> },
  approval: { label: '审批', color: '#722ed1', icon: <AuditOutlined /> },
  worklog: { label: '日志', color: '#13c2c2', icon: <FileTextOutlined /> },
}

export default function UpdateDynamic() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [feed, setFeed] = useState<any[]>([])
  const [type, setType] = useState<string>('all')

  const loadFeed = useCallback(async (t: string) => {
    setLoading(true)
    try {
      const data = await getUpdateDynamic({
        type: t === 'all' ? undefined : t,
      })
      setFeed(Array.isArray(data) ? data : [])
    } catch {
      // 错误由拦截器统一提示
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeed(type)
  }, [type, loadFeed])

  return (
    <div style={{ padding: 8 }}>
      <Card
        style={{ borderRadius: 16, marginBottom: 16 }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Space>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: theme.gradientStat4,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 18,
              }}
            >
              <FileTextOutlined />
            </span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.textBase }}>更新动态</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                全所业务动态时间线，聚合案件、合同、收款、用印、审批、日志的最新变更
              </Text>
            </div>
          </Space>
          <Space wrap>
            <Segmented
              value={type}
              onChange={(v) => setType(v as string)}
              options={[
                { label: '全部', value: 'all' },
                { label: '案件', value: 'case' },
                { label: '合同', value: 'contract' },
                { label: '收款', value: 'payment' },
                { label: '用印', value: 'seal' },
                { label: '审批', value: 'approval' },
                { label: '日志', value: 'worklog' },
              ]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadFeed(type)}
            >
              刷新
            </Button>
          </Space>
        </Space>
      </Card>

      <Card style={{ borderRadius: 16 }}>
        <Spin spinning={loading}>
          {feed.length === 0 ? (
            <Empty description="暂无动态" />
          ) : (
            <Timeline
              items={feed.map((item) => {
                const cfg = typeConfig[item.type] || typeConfig.case
                return {
                  color: cfg.color,
                  dot: (
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: `${cfg.color}1a`,
                        color: cfg.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                      }}
                    >
                      {cfg.icon}
                    </span>
                  ),
                  children: (
                    <div style={{ padding: '4px 0 16px' }}>
                      <Space size={8} wrap>
                        <Tag color={cfg.color}>{cfg.label}</Tag>
                        <Text style={{ fontSize: 14, fontWeight: 500, color: theme.textBase }}>
                          {item.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      </Space>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {item.description}
                        </Text>
                      </div>
                      <Space size={16} style={{ marginTop: 4 }}>
                        {item.user_name && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            操作人：{item.user_name}
                          </Text>
                        )}
                        {item.link && (
                          <Button
                            type="link"
                            size="small"
                            style={{ padding: 0, fontSize: 12 }}
                            onClick={() => navigate(item.link)}
                          >
                            查看详情 <RightOutlined />
                          </Button>
                        )}
                      </Space>
                    </div>
                  ),
                }
              })}
            />
          )}
        </Spin>
      </Card>
    </div>
  )
}
