import { useState, useEffect, useCallback } from 'react'
import { Card, Row, Col, Button, Tag, Table, message, Modal, Space, Statistic, Descriptions, Tooltip } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, LinkOutlined, DisconnectOutlined, ReloadOutlined, ApiOutlined, CloudOutlined } from '@ant-design/icons'
import {
  getPlatformTokens,
  revokePlatformToken,
  refreshPlatformToken,
  syncAccountBalance,
  syncCampaignList,
  getSyncLogs,
  PLATFORM_NAMES,
  type PlatformCode,
  type PlatformToken,
  type SyncLog,
} from '../api/ad-platforms'
import { theme } from '../constants/theme'

/**
 * 广告平台对接管理页面
 * 管理五大广告平台的 OAuth 授权、数据同步、Webhook 配置
 */
export default function AdPlatformIntegration() {
  const [tokens, setTokens] = useState<PlatformToken[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState<string>('')

  const platforms: PlatformCode[] = ['ocean_engine', 'baidu_marketing', 'tencent_ads', 'kuaishou_ads', 'douyin_open']

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [tokenRes, logRes] = await Promise.all([
        getPlatformTokens(),
        getSyncLogs(undefined, 20),
      ])
      setTokens((tokenRes as any) || [])
      setSyncLogs((logRes as any) || [])
    } catch (err) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  /** 发起 OAuth 授权 */
  const handleAuthorize = async (platform: PlatformCode) => {
    try {
      // 后端会返回重定向URL，前端跳转到平台授权页
      window.location.href = `/api/ad-platforms/auth/${platform}`
    } catch (err) {
      message.error('发起授权失败')
    }
  }

  /** 取消授权 */
  const handleRevoke = async (tokenId: string, platform: string) => {
    Modal.confirm({
      title: '取消授权',
      content: `确定取消${PLATFORM_NAMES[platform as PlatformCode] || platform}的授权吗？取消后需重新授权才能同步数据。`,
      okText: '确定取消',
      cancelText: '保留授权',
      onOk: async () => {
        try {
          await revokePlatformToken(tokenId)
          message.success('已取消授权')
          loadData()
        } catch (err) {
          message.error('取消授权失败')
        }
      },
    })
  }

  /** 刷新 Token */
  const handleRefreshToken = async (platform: PlatformCode) => {
    setSyncing(`refresh-${platform}`)
    try {
      await refreshPlatformToken(platform)
      message.success('Token 刷新成功')
      loadData()
    } catch (err) {
      message.error('Token 刷新失败，请检查授权是否已过期')
    } finally {
      setSyncing('')
    }
  }

  /** 同步账户余额 */
  const handleSyncBalance = async (platform: PlatformCode) => {
    setSyncing(`balance-${platform}`)
    try {
      await syncAccountBalance(platform)
      message.success(`${PLATFORM_NAMES[platform]} 余额同步已触发`)
      setTimeout(() => loadData(), 2000)
    } catch (err) {
      message.error('余额同步失败，请检查授权状态')
    } finally {
      setSyncing('')
    }
  }

  /** 同步投放计划 */
  const handleSyncCampaigns = async (platform: PlatformCode) => {
    setSyncing(`campaigns-${platform}`)
    try {
      await syncCampaignList(platform)
      message.success(`${PLATFORM_NAMES[platform]} 计划同步已触发`)
      setTimeout(() => loadData(), 2000)
    } catch (err) {
      message.error('计划同步失败，请检查授权状态')
    } finally {
      setSyncing('')
    }
  }

  /** 获取平台授权状态 */
  const getPlatformToken = (platform: string): PlatformToken | undefined => {
    return tokens.find((t) => t.platform === platform && t.token_status === 'active')
  }

  /** 检查 Token 是否即将过期 */
  const isExpiringSoon = (token: PlatformToken): boolean => {
    if (!token.expires_at) return false
    const expireTime = new Date(token.expires_at).getTime()
    return expireTime - Date.now() < 3600000
  }

  const syncLogColumns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 120,
      render: (v: string) => {
        const name = (PLATFORM_NAMES as any)[v] || v
        return <span className="stitch-tag">{name}</span>
      },
    },
    {
      title: '同步类型',
      dataIndex: 'sync_type',
      key: 'sync_type',
      width: 120,
      render: (v: string) => {
        const labels: Record<string, string> = {
          balance: '余额同步',
          campaign_list: '计划同步',
          report: '报表同步',
          conversion: '转化回传',
        }
        return labels[v] || v
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        if (v === 'success') return <Tag color="success">成功</Tag>
        if (v === 'failed') return <Tag color="error">失败</Tag>
        if (v === 'partial') return <Tag color="warning">部分成功</Tag>
        return <Tag>{v}</Tag>
      },
    },
    {
      title: '记录数',
      dataIndex: 'record_count',
      key: 'record_count',
      width: 80,
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      key: 'error_message',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
  ]

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: theme.brandDark }}>
          广告平台对接
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: theme.textSecondary }}>
          对接巨量引擎、百度营销、腾讯广告、磁力引擎、抖音运营五大平台，OAuth 授权后自动同步账户余额、投放数据和线索留资
        </p>
      </div>

      {/* 平台卡片 */}
      <Row gutter={[16, 16]}>
        {platforms.map((platform) => {
          const token = getPlatformToken(platform)
          const isAuthorized = !!token
          const expiringSoon = token ? isExpiringSoon(token) : false
          const webhookLeadUrl = `/api/ad-platforms/webhook/${platform}/lead`

          return (
            <Col xs={24} sm={12} lg={8} key={platform}>
              <Card
                style={{ height: '100%', borderColor: isAuthorized ? theme.primary : theme.border }}
                styles={{ body: { padding: 20 } }}
              >
                {/* 平台名称和状态 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: theme.brandDark }}>
                      {PLATFORM_NAMES[platform]}
                    </span>
                  </div>
                  {isAuthorized ? (
                    <Tooltip title={expiringSoon ? 'Token 即将过期，请刷新' : '已授权'}>
                      <Tag color={expiringSoon ? 'warning' : 'success'} icon={<CheckCircleOutlined />}>
                        已授权
                      </Tag>
                    </Tooltip>
                  ) : (
                    <Tag color="default" icon={<CloseCircleOutlined />}>未授权</Tag>
                  )}
                </div>

                {/* 授权信息 */}
                {isAuthorized && token && (
                  <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="账户ID">{token.account_id || '-'}</Descriptions.Item>
                    <Descriptions.Item label="授权时间">
                      {new Date(token.created_at).toLocaleString('zh-CN')}
                    </Descriptions.Item>
                    <Descriptions.Item label="过期时间">
                      {token.expires_at ? new Date(token.expires_at).toLocaleString('zh-CN') : '长期有效'}
                    </Descriptions.Item>
                  </Descriptions>
                )}

                {/* 操作按钮 */}
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  {!isAuthorized ? (
                    <Button
                      type="primary"
                      icon={<LinkOutlined />}
                      onClick={() => handleAuthorize(platform)}
                      block
                    >
                      发起 OAuth 授权
                    </Button>
                  ) : (
                    <>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Button
                            size="small"
                            icon={<SyncOutlined />}
                            loading={syncing === `balance-${platform}`}
                            onClick={() => handleSyncBalance(platform)}
                            block
                          >
                            同步余额
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button
                            size="small"
                            icon={<SyncOutlined />}
                            loading={syncing === `campaigns-${platform}`}
                            onClick={() => handleSyncCampaigns(platform)}
                            block
                          >
                            同步计划
                          </Button>
                        </Col>
                      </Row>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Button
                            size="small"
                            icon={<ReloadOutlined />}
                            loading={syncing === `refresh-${platform}`}
                            onClick={() => handleRefreshToken(platform)}
                            block
                          >
                            刷新Token
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button
                            size="small"
                            danger
                            icon={<DisconnectOutlined />}
                            onClick={() => handleRevoke(token.id, platform)}
                            block
                          >
                            取消授权
                          </Button>
                        </Col>
                      </Row>
                    </>
                  )}

                  {/* Webhook 地址 */}
                  <Tooltip title="在平台开放平台配置此回调地址，接收线索留资数据">
                    <div style={{
                      padding: '8px 12px',
                      background: '#f9f9fb',
                      borderRadius: 8,
                      border: '1px solid #e2e2e4',
                      marginTop: 4,
                    }}>
                      <div style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 4 }}>
                        <CloudOutlined /> 线索回调地址
                      </div>
                      <code style={{ fontSize: 11, color: theme.primary, wordBreak: 'break-all' }}>
                        {window.location.origin}{webhookLeadUrl}
                      </code>
                    </div>
                  </Tooltip>
                </Space>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: 20 } }}>
            <Statistic
              title="已授权平台"
              value={tokens.filter((t) => t.token_status === 'active').length}
              suffix={`/ ${platforms.length}`}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: 20 } }}>
            <Statistic
              title="今日同步次数"
              value={syncLogs.filter((l) => {
                const today = new Date().toDateString()
                return new Date(l.created_at).toDateString() === today
              }).length}
              suffix="次"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card styles={{ body: { padding: 20 } }}>
            <Statistic
              title="同步失败次数"
              value={syncLogs.filter((l) => l.status === 'failed').length}
              valueStyle={{ color: syncLogs.filter((l) => l.status === 'failed').length > 0 ? theme.error : undefined }}
              suffix="次"
            />
          </Card>
        </Col>
      </Row>

      {/* 同步日志 */}
      <Card
        title="数据同步日志"
        style={{ marginTop: 24 }}
        extra={<Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>刷新</Button>}
      >
        <Table
          dataSource={syncLogs}
          columns={syncLogColumns}
          rowKey="id"
          size="small"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>
    </div>
  )
}
