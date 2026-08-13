import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Space, Modal, Select, message, Tag } from 'antd'
import {
  CrownOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { getVipPlans, subscribeVip } from '../api/order'

interface VipPlan {
  plan_type: string
  label: string
  price: number
  months: number
}

// 权益说明
const vipBenefits = [
  { icon: <ThunderboltOutlined />, title: 'AI 合同审查', desc: '无限次智能合同风险审查' },
  { icon: <SafetyCertificateOutlined />, title: '法律研究', desc: '深度法律研究与判例检索' },
  { icon: <CrownOutlined />, title: '专属标识', desc: '个人中心VIP专属标识' },
  { icon: <CheckCircleOutlined />, title: '优先支持', desc: '优先技术支持与功能体验' },
]

export default function VIPSubscription() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<VipPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('year')
  const [payMethod, setPayMethod] = useState('wechat')
  const [payVisible, setPayVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 加载套餐
  useEffect(() => {
    getVipPlans()
      .then((res) => {
        setPlans(res.plans || [])
        if (res.plans?.length > 0) {
          setSelectedPlan(res.plans[0].plan_type)
        }
      })
      .catch(() => {
        message.error('加载VIP套餐失败')
      })
  }, [])

  // 提交订阅
  const handleSubscribe = () => {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    if (!user?.id) {
      message.warning('请先登录')
      return
    }
    setPayVisible(true)
  }

  // 确认支付并开通
  const handleConfirmPay = async () => {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    if (!user?.id) return
    setSubmitting(true)
    try {
      const res = await subscribeVip({
        user_id: user.id,
        plan_type: selectedPlan,
        pay_method: payMethod,
      })
      const sub = res.subscription
      message.success(`VIP开通成功，有效期至 ${sub?.end_date || ''}`)
      setPayVisible(false)
      navigate('/orders/vip')
    } catch (err) {
      message.error('VIP开通失败')
    } finally {
      setSubmitting(false)
    }
  }

  const currentPlan = plans.find((p) => p.plan_type === selectedPlan)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>开通VIP</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          尊享 AI 合同审查、法律研究等高级功能
        </p>
      </div>

      {/* 权益介绍 */}
      <Card style={{ borderRadius: 16, background: 'linear-gradient(135deg, #1a1c2e 0%, #2d2a4a 100%)', border: 'none' }}>
        <Row gutter={16}>
          {vipBenefits.map((b) => (
            <Col xs={12} sm={6} key={b.title} style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 32, color: theme.brandGold, marginBottom: 8 }}>{b.icon}</div>
              <div style={{ color: '#fff', fontWeight: 600 }}>{b.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>{b.desc}</div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 套餐选择 */}
      <Row gutter={16}>
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.plan_type
          const isYear = plan.plan_type === 'year'
          return (
            <Col xs={12} sm={6} key={plan.plan_type}>
              <Card
                hoverable
                onClick={() => setSelectedPlan(plan.plan_type)}
                style={{
                  borderRadius: 16,
                  border: isSelected ? `2px solid ${theme.primary}` : '1px solid #e2e2e4',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isYear && (
                  <Tag color="gold" style={{ position: 'absolute', top: 8, right: 8 }}>
                    超值推荐
                  </Tag>
                )}
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: theme.textBase }}>{plan.label}</div>
                  <div style={{ margin: '12px 0' }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: theme.primary, fontFamily: "'Noto Serif SC', serif" }}>
                      ¥{plan.price}
                    </span>
                    <span style={{ color: theme.textTertiary, fontSize: 13 }}>/{plan.months}个月</span>
                  </div>
                  <div style={{ color: theme.textTertiary, fontSize: 13 }}>约 ¥{(plan.price / plan.months).toFixed(1)}/月</div>
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* 开通操作 */}
      <Card style={{ borderRadius: 16 }}>
        <Space size="large" align="center">
          <div>
            <div style={{ color: theme.textTertiary, fontSize: 13 }}>已选套餐</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: theme.primaryDark }}>
              {currentPlan ? `${currentPlan.label} ¥${currentPlan.price}` : '-'}
            </div>
          </div>
          <Button type="primary" size="large" icon={<CrownOutlined />} onClick={handleSubscribe}>
            立即开通
          </Button>
          <Button size="large" onClick={() => navigate('/orders/vip')}>
            我的VIP订单
          </Button>
        </Space>
      </Card>

      {/* 支付确认弹窗 */}
      <Modal
        title="确认开通VIP"
        open={payVisible}
        onCancel={() => setPayVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPayVisible(false)}>
            取消
          </Button>,
          <Button
            key="pay"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={submitting}
            onClick={handleConfirmPay}
          >
            确认支付 ¥{currentPlan?.price || 0}
          </Button>,
        ]}
        width={420}
        destroyOnClose
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <CrownOutlined style={{ fontSize: 40, color: theme.brandGold }} />
            <div style={{ fontSize: 28, fontWeight: 600, color: theme.primaryDark, marginTop: 8, fontFamily: "'Noto Serif SC', serif" }}>
              ¥{currentPlan?.price || 0}
            </div>
            <div style={{ color: theme.textTertiary, marginTop: 4 }}>
              {currentPlan?.label}（{currentPlan?.months || 0}个月）
            </div>
          </div>
          <Select
            style={{ width: '100%' }}
            value={payMethod}
            onChange={setPayMethod}
            options={[
              { value: 'wechat', label: '微信支付' },
              { value: 'alipay', label: '支付宝' },
              { value: 'bank', label: '对公转账' },
            ]}
          />
          <div style={{ marginTop: 12, color: theme.textTertiary, fontSize: 13 }}>
            开通即视为同意《VIP服务协议》，支付后自动生效
          </div>
        </div>
      </Modal>
    </div>
  )
}
