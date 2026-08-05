import { useState, useEffect, useCallback } from 'react'
import { Spin, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { theme } from '../constants/theme'

// pageKey 与 HTML 文件名的映射关系
const pageKeyToFile: Record<string, string> = {
  dashboard: 'dashboard.html',
  crm: 'crm_leads.html',
  cases: 'case_management.html',
  marketing: 'marketing.html',
  compliance: 'compliance.html',
  finance: 'finance.html',
  settings: 'settings.html',
  client: 'client_portal.html',
  login: 'login.html',
}

interface StitchPageProps {
  pageKey: string
}

/**
 * Stitch 设计页面通用嵌入组件
 * 通过 iframe 嵌入 public/stitch/ 目录下的 HTML 设计页面
 */
export default function StitchPage({ pageKey }: StitchPageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const fileName = pageKeyToFile[pageKey]
  const src = fileName ? `/stitch/${fileName}` : ''

  const handleLoad = useCallback(() => {
    setLoading(false)
    setError(false)
  }, [])

  const handleError = useCallback(() => {
    setLoading(false)
    setError(true)
  }, [])

  const handleReload = useCallback(() => {
    setLoading(true)
    setError(false)
    setReloadKey(prev => prev + 1)
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(false)
  }, [pageKey])

  // 缺少映射文件时显示错误提示
  if (!fileName) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh',
        color: theme.textTertiary,
        fontSize: 14,
      }}>
        未找到 pageKey=&quot;{pageKey}&quot; 对应的设计页面
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {loading && !error && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          background: theme.bgLayout,
          zIndex: 1,
        }}>
          <Spin size="large" />
          <div style={{ color: theme.textTertiary, fontSize: 14 }}>加载设计中...</div>
        </div>
      )}
      {error && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
          gap: 16,
        }}>
          <div style={{ color: theme.textTertiary, fontSize: 14 }}>
            设计页面加载失败
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReload}>
              重新加载
            </Button>
          </Space>
        </div>
      )}
      <iframe
        key={reloadKey}
        src={src}
        title={`Stitch 设计预览 - ${pageKey}`}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          minHeight: 'calc(100vh - 160px)',
          border: 'none',
          borderRadius: 8,
          boxShadow: theme.shadowSm,
          background: theme.white,
          display: error ? 'none' : 'block',
        }}
      />
    </div>
  )
}
