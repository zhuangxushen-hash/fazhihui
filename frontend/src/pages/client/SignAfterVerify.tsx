import { useState, useEffect } from 'react'
import { Spin, message } from 'antd'
import axios from '../../api/axios'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { openFadadaUrl } from '../../utils/openFadada'

/**
 * 实名认证完成后的「中转页」。
 * 法大大个人授权链接的 redirectUrl 指向本页；落地后自动用 SignPrefill 暂存的字段
 * 再提交一次 submit-prefill（此时 verify_status 已为 verified），直接拿到签署链接并打开，
 * 跳过预览表单，实现「实名完成 → 直接进入签署页」。
 */
export default function SignAfterVerify() {
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const signingId = searchParams.get('signing_id') || ''

  useEffect(() => {
    if (!signingId) {
      setStatus('error')
      message.error('缺少签约任务标识')
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const stashRaw = localStorage.getItem(`sign_prefill_stash_${signingId}`)
        if (!stashRaw) {
          if (!cancelled) {
            setStatus('error')
            message.error('未找到签署信息，请返回预览页重新提交')
          }
          return
        }
        const stash = JSON.parse(stashRaw)
        const res: any = await axios.post('/client/sign/submit-prefill', {
          signing_id: stash.signing_id || signingId,
          client_id: stash.client_id,
          values: stash.values || [],
        })
        if (cancelled) return
        // 仍要求实名（极少：回跳早于法大大状态落库）→ 提示回预览页
        if (res?.identify_required) {
          setStatus('error')
          message.error('实名状态未同步，请返回预览页重新进入')
          return
        }
        const url = res?.embed_url || res?.sign_url
        if (url) {
          const ok = await openFadadaUrl(url, { miniAppInfo: res.mini_app_info })
          if (ok) setStatus('done')
          else {
            setStatus('error')
            message.error('打开签署页失败，请返回预览页重试')
          }
        } else {
          setStatus('error')
          message.error('未获取到签署链接，请返回预览页重试')
        }
      } catch (e: any) {
        if (cancelled) return
        setStatus('error')
        message.error(e?.response?.data?.message || e?.message || '进入签署失败，请返回重试')
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signingId])

  return (
    <div className="client-app">
      <div
        style={{
          maxWidth: 375,
          margin: '0 auto',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F6F7F9',
          gap: 16,
          padding: 24,
        }}
      >
        {status === 'loading' && (
          <>
            <Spin size="large" />
            <div style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 1.6 }}>
              实名认证已完成
              <br />
              正在进入电子签署…
            </div>
          </>
        )}
        {status === 'done' && (
          <div style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 1.6 }}>
            已为您打开签署页面
            <br />
            如未自动打开，请检查浏览器是否拦截了弹窗
          </div>
        )}
        {status === 'error' && (
          <button
            type="button"
            onClick={() => navigate(`/client/sign-prefill?signing_id=${signingId}`)}
            style={{
              height: 44,
              borderRadius: 12,
              border: 'none',
              background: '#1E3A8A',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              padding: '0 24px',
            }}
          >
            返回预览页
          </button>
        )}
      </div>
    </div>
  )
}
