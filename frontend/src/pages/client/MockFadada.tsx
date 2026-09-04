import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, message } from 'antd'
import axios from '../../api/axios'
import ClientButton from '../../components/ClientButton'

/**
 * 法大大电子签模拟页（仅 mock 模式使用）
 * mode=verify：模拟法大大个人实名认证页（旧「先实名后签署」两步流程演示，现行流程已无单独实名步骤）
 * mode=sign：模拟法大大电子签签署页（现行流程：互动视频签即实名，仅需此一步）
 */
export default function MockFadada() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const mode = params.get('mode') || 'verify'
  const signingId = params.get('signing_id') || ''
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')
  const [loading, setLoading] = useState(false)

  const handleDone = async () => {
    if (!signingId || !user.id) {
      message.error('缺少签约信息，请从服务大厅重新发起签约')
      return
    }
    setLoading(true)
    try {
      if (mode === 'verify') {
        await axios.post('/client/sign/mock-verify', { signing_id: signingId, client_id: user.id })
        message.success('实名认证完成（模拟）')
      } else {
        await axios.post('/client/sign/mock-finish', { signing_id: signingId, client_id: user.id })
        message.success('签署完成（模拟）')
      }
      setTimeout(() => navigate('/client/service-hall'), 800)
    } catch (error) {
      // 错误已由拦截器统一提示
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Card style={{ width: 420, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0ea5e9', marginBottom: 10 }}>
          {mode === 'verify' ? '法大大 · 个人实名认证' : '法大大 · 电子签'}
        </div>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
          法大大数字合同云平台（模拟环境）
        </div>
        <div style={{ fontSize: 13, color: '#595959', lineHeight: 1.9, margin: '12px 0 20px' }}>
          {mode === 'verify'
            ? '当前为法大大电子签模拟环境。正式环境将在此页完成姓名/身份证号/手机号实名核验与人脸识别。'
            : '当前为法大大电子签模拟环境。正式环境将在此页完成合同阅读确认与电子签名。'}
        </div>
        <ClientButton btnVariant="primary" btnSize="large" loading={loading} onClick={handleDone} style={{ width: '100%' }}>
          {mode === 'verify' ? '完成实名认证' : '完成签署'}
        </ClientButton>
      </Card>
    </div>
  )
}
