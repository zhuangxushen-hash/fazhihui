import { useState, useEffect } from 'react'
import { Card, Input, Checkbox, Steps, Modal, theme, message } from 'antd'
import { FileTextOutlined, CreditCardOutlined, AlipayCircleOutlined, WechatOutlined, BankOutlined, CheckCircleOutlined, UserOutlined, PhoneOutlined, FileOutlined, AlertOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from '../../api/axios'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'

export default function Payment() {
  const [currentStep, setCurrentStep] = useState(0)
  const [agreedRisk, setAgreedRisk] = useState(false)
  const [signed, setSigned] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('alipay')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [showSignModal, setShowSignModal] = useState(false)
  const [serviceFee, setServiceFee] = useState<number | null>(null)
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null)
  const [loadingFee, setLoadingFee] = useState(false)
  const [activePaymentMethod, setActivePaymentMethod] = useState<string | null>(null)
  const [activeCaseType, setActiveCaseType] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    id_card: '',
    case_type: '',
    case_desc: '',
  })

  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const { token: { borderRadiusLG } } = theme.useToken()

  useEffect(() => {
    if (user.real_name) setFormData(prev => ({ ...prev, name: user.real_name }))
    if (user.phone) setFormData(prev => ({ ...prev, phone: user.phone }))
    fetchServiceFee()
  }, [])

  const fetchServiceFee = async () => {
    setLoadingFee(true)
    try {
      const res = await axios.post('/client/service-fee', { client_id: user.id })
      if (res && res.service_fee) {
        setServiceFee(res.service_fee)
      }
    } catch (error) {
      console.error('Fetch service fee error:', error)
    } finally {
      setLoadingFee(false)
    }
  }

  const steps = [
    { title: '签约信息', description: '填写客户信息和案件信息', icon: <UserOutlined /> },
    { title: '风险告知', description: '阅读并确认风险告知书', icon: <AlertOutlined /> },
    { title: '在线签约', description: '签署电子合同', icon: <FileTextOutlined /> },
    { title: '支付费用', description: '完成案件费用支付', icon: <CreditCardOutlined /> },
  ]

  const caseTypes = [
    { value: 'marriage', label: '婚姻家事' },
    { value: 'traffic', label: '交通事故' },
    { value: 'labor', label: '劳动争议' },
    { value: 'debt', label: '债务追讨' },
    { value: 'other', label: '其他案件' },
  ]

  const riskContent = `尊敬的客户：

在您与本律所签订法律服务合同之前，为保障您的合法权益，请仔细阅读以下风险告知事项：

一、案件结果风险
1. 任何法律案件的结果均受到多种因素影响，包括但不限于证据情况、法律适用、法官裁量等。
2. 律师只能依据事实和法律提供专业服务，不能保证案件结果。

二、费用风险
1. 法律服务费用根据案件复杂程度和工作量确定，具体金额以合同约定为准。
2. 如案件过程中出现额外工作，可能产生追加费用。

三、时效风险
1. 法律案件有严格的诉讼时效规定，请及时行使权利。
2. 逾期可能导致权利丧失，本律所不承担因此产生的责任。

四、保密义务
1. 本律所将严格保密您的个人信息和案件信息。
2. 但在法律要求或为维护您权益的必要情况下，可能需要披露相关信息。

五、合同解除
1. 双方均可根据合同约定解除合同。
2. 解除合同可能涉及费用结算，请仔细阅读合同条款。

请您在充分了解以上风险后，再签署法律服务合同。`

  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.name || !formData.phone || !formData.case_type) {
        message.error('请填写完整的签约信息')
        return
      }
    }
    if (currentStep === 1 && !agreedRisk) {
      message.error('请确认已阅读并同意风险告知书')
      return
    }
    if (currentStep === 2 && !signed) {
      message.error('请完成电子签约')
      return
    }
    setCurrentStep(prev => prev + 1)
  }

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSign = async () => {
    try {
      const caseData = await axios.post('/cases', {
        case_type: formData.case_type,
        client_id: user.id,
        organization_id: user.organization_id,
        client_name: formData.name,
        client_phone: formData.phone,
        fee_amount: serviceFee || 0,
        amount: serviceFee || 0,
        description: formData.case_desc || `客户${formData.name}签约的${formData.case_type}案件`,
      })
      // 保存新创建的 case id 供后续付款使用
      setCreatedCaseId(caseData.id)
      setSigned(true)
      setShowSignModal(false)
      message.success('签约成功')
    } catch (error) {
      console.error('Sign error:', error)
      message.error('签约失败，请重试')
    }
  }

  const handlePayment = async () => {
    if (!serviceFee || serviceFee <= 0) {
      message.error('服务费用未设置，请联系销售')
      return
    }
    if (!createdCaseId) {
      message.error('请先完成签约')
      return
    }
    try {
      await axios.post('/finance/fee', {
        case_id: createdCaseId,
        amount: serviceFee,
        organization_id: user.organization_id,
        payment_method: selectedMethod,
        paid: true,
        paid_at: new Date().toISOString(),
        description: `客户${formData.name}支付${formData.case_type}案件服务费`,
      })
      setPaymentSuccess(true)
      setTimeout(() => {
        setPaymentSuccess(false)
      }, 2000)
    } catch (error) {
      console.error('Payment error:', error)
      message.error('支付失败，请重试')
    }
  }

  const paymentMethods = [
    { value: 'alipay', label: '支付宝', icon: AlipayCircleOutlined, color: '#1677ff' },
    { value: 'wechat', label: '微信支付', icon: WechatOutlined, color: '#07c160' },
    { value: 'bank', label: '银行卡', icon: BankOutlined, color: '#faad14' },
  ]

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card 
            title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserOutlined style={{ fontSize: 14, color: '#fff' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600 }}>签约信息填写</span>
            </div>} 
            style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                  <UserOutlined style={{ marginRight: 6, color: 'var(--primary)', fontSize: 14 }} />姓名 <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入您的姓名"
                  size="large"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                  <PhoneOutlined style={{ marginRight: 6, color: 'var(--primary)', fontSize: 14 }}>手机号码</PhoneOutlined> <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="请输入手机号码"
                  size="large"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                  <FileOutlined style={{ marginRight: 6, color: 'var(--primary)', fontSize: 14 }} />身份证号
                </label>
                <Input
                  value={formData.id_card}
                  onChange={(e) => setFormData(prev => ({ ...prev, id_card: e.target.value }))}
                  placeholder="请输入身份证号（选填）"
                  size="large"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                  案件类型 <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {caseTypes.map(type => (
                    <div
                      key={type.value}
                      style={{
                        height: 44,
                        borderRadius: 8,
                        border: formData.case_type === type.value ? '1px solid var(--primary)' : '1px solid var(--border-default)',
                        background: formData.case_type === type.value ? 'var(--primary-bg)' : 'var(--bg-card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        transform: activeCaseType === type.value ? 'scale(0.96)' : 'scale(1)',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, case_type: type.value }))}
                      onTouchStart={() => setActiveCaseType(type.value)}
                      onTouchEnd={() => setActiveCaseType(null)}
                    >
                      <span style={{ fontSize: 13, color: formData.case_type === type.value ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: formData.case_type === type.value ? 500 : 'normal' }}>
                        {type.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>案件描述</label>
                <Input.TextArea
                  value={formData.case_desc}
                  onChange={(e) => setFormData(prev => ({ ...prev, case_desc: e.target.value }))}
                  placeholder="请简要描述案件情况（选填）"
                  rows={4}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>服务费用</label>
                <div style={{ padding: '14px', background: 'var(--bg-sunken)', borderRadius: 8, border: '1px solid var(--border-default)' }}>
                  {loadingFee ? (
                    <div style={{ fontSize: 14, color: 'var(--text-tertiary)', textAlign: 'center' }}>加载中...</div>
                  ) : serviceFee ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>已设置服务费用</span>
                      <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>¥{serviceFee.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--warning)', textAlign: 'center', padding: 6 }}>
                      暂未设置（请联系销售）
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )
      case 1:
        return (
          <Card 
            title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertOutlined style={{ fontSize: 14, color: '#fff' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600 }}>风险告知书</span>
            </div>}
            style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
          >
            <div style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <AlertOutlined style={{ fontSize: 18, color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: 'var(--primary)' }}>重要提示</div>
                  <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 1 }}>请仔细阅读以下风险告知事项</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 2, whiteSpace: 'pre-wrap', background: 'var(--bg-card)', padding: 14, borderRadius: 6, maxHeight: 200, overflowY: 'auto' }}>
                {riskContent}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'var(--bg-sunken)', borderRadius: 8 }}>
              <Checkbox 
                checked={agreedRisk} 
                onChange={(e) => setAgreedRisk(e.target.checked)}
                style={{ transform: 'scale(1.1)' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>我已仔细阅读并理解上述风险告知内容，自愿承担相关风险</span>
            </div>
          </Card>
        )
      case 2:
        return (
          <Card 
            title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileTextOutlined style={{ fontSize: 14, color: '#fff' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600 }}>在线签约</span>
            </div>}
            style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
          >
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FileTextOutlined style={{ fontSize: 44, color: 'var(--primary)' }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 6 }}>法律服务合同</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                甲方：{formData.name}
                <br />
                乙方：法智汇法律服务平台
              </div>
              <div style={{ background: 'var(--bg-sunken)', padding: 16, borderRadius: 8, marginBottom: 20, textAlign: 'left', border: '1px solid var(--border-default)', maxHeight: 220, overflowY: 'auto' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  <p><strong>第一条 服务内容</strong></p>
                  <p style={{ marginBottom: 6 }}>乙方接受甲方委托，指派律师为甲方提供{caseTypes.find(t => t.value === formData.case_type)?.label}案件的法律服务。</p>
                  <p><strong>第二条 服务费用</strong></p>
                  <p style={{ marginBottom: 6 }}>甲方应向乙方支付服务费用人民币{serviceFee?.toFixed(2) || 0}元（大写：{serviceFee?.toFixed(2) || 0}元整）。</p>
                  <p><strong>第三条 双方权利义务</strong></p>
                  <p style={{ marginBottom: 6 }}>甲方应如实提供案件相关信息，配合乙方工作；乙方应勤勉尽责，维护甲方合法权益。</p>
                  <p><strong>第四条 合同期限</strong></p>
                  <p>本合同自双方签字（盖章）之日起生效，至案件终结之日止。</p>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
                请点击下方按钮完成电子签约
              </div>
              <ClientButton
                btnVariant={signed ? 'ghost' : 'primary'}
                btnSize="large"
                disabled={signed}
                onClick={() => setShowSignModal(true)}
              >
                {signed ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircleOutlined /> 已签约
                  </div>
                ) : (
                  '在线签约'
                )}
              </ClientButton>
            </div>
          </Card>
        )
      case 3:
        return (
          <Card 
            title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCardOutlined style={{ fontSize: 14, color: '#fff' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600 }}>支付费用</span>
            </div>}
            style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
          >
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CreditCardOutlined style={{ fontSize: 32, color: 'var(--primary)' }} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>应付金额</div>
              <div style={{ fontSize: 36, fontWeight: 'bold', color: 'var(--error)', marginBottom: 24 }}>¥{serviceFee?.toFixed(2) || 0}</div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 500 }}>选择支付方式</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {paymentMethods.map(method => (
                    <div
                      key={method.value}
                      style={{ 
                        flex: 1, 
                        height: 52,
                        borderRadius: 8,
                        border: selectedMethod === method.value ? '1px solid var(--primary)' : '1px solid var(--border-default)',
                        background: selectedMethod === method.value ? 'var(--primary-bg)' : 'var(--bg-card)',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transform: activePaymentMethod === method.value ? 'scale(0.98)' : 'scale(1)',
                      }}
                      onClick={() => setSelectedMethod(method.value)}
                      onTouchStart={() => setActivePaymentMethod(method.value)}
                      onTouchEnd={() => setActivePaymentMethod(null)}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <method.icon style={{ fontSize: 22, color: selectedMethod === method.value ? 'var(--primary)' : 'var(--text-secondary)' }} />
                        <span style={{ fontSize: 12, color: selectedMethod === method.value ? 'var(--primary)' : 'var(--text-secondary)' }}>{method.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <ClientButton 
                btnVariant="primary" 
                btnSize="large" 
                onClick={handlePayment}
              >
                确认支付 ¥{serviceFee?.toFixed(2) || 0}
              </ClientButton>
            </div>
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: '#0a0e1a',
          padding: '16px 16px',
          paddingTop: '52px',
          color: '#f1f5f9',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ cursor: 'pointer', padding: 4 }} onClick={() => navigate('/client')}>
            <ArrowLeftOutlined style={{ fontSize: 18, color: '#94a3b8' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>客户签约付款</h2>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginLeft: 32 }}>一站式法律服务签约流程</p>
      </div>

      <div style={{ padding: '12px', flex: 1, paddingBottom: '80px' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: borderRadiusLG, padding: 16, marginBottom: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}>
          <Steps 
            current={currentStep} 
            items={steps}
            style={{ padding: '0 4px' }}
            size="small"
          />
        </div>
        {renderStepContent()}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {currentStep > 0 && (
            <ClientButton btnVariant="ghost" btnSize="large" onClick={handlePrev} style={{ flex: 1 }}>
              <ArrowLeftOutlined style={{ marginRight: 4 }} />上一步
            </ClientButton>
          )}
          {currentStep < 3 ? (
            <ClientButton btnVariant="primary" btnSize="large" onClick={handleNext} style={{ flex: 1 }}>
              下一步
            </ClientButton>
          ) : (
            <ClientButton btnVariant="primary" btnSize="large" onClick={() => navigate('/client')} style={{ flex: 1 }}>
              返回首页
            </ClientButton>
          )}
        </div>
      </div>

      <BottomNav />

      <Modal
        open={showSignModal}
        title="电子签约"
        onCancel={() => setShowSignModal(false)}
        footer={null}
        centered
        style={{ borderRadius: 20 }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <FileTextOutlined style={{ fontSize: 28, color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>请确认以下签约信息：</div>
          <div style={{ background: 'var(--bg-sunken)', padding: 16, borderRadius: 8, marginBottom: 16, textAlign: 'left', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>签约人：</span>
              <span style={{ fontWeight: 500 }}>{formData.name}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>手机号码：</span>
              <span style={{ fontWeight: 500 }}>{formData.phone}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>案件类型：</span>
              <span style={{ fontWeight: 500 }}>{caseTypes.find(t => t.value === formData.case_type)?.label}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>服务费用：</span>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>¥{serviceFee?.toFixed(2) || 0}</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 16 }}>
            点击确认即表示您同意签署上述法律服务合同
          </div>
          <ClientButton btnVariant="primary" btnSize="large" onClick={handleSign} style={{ width: '100%' }}>
            确认签约
          </ClientButton>
        </div>
      </Modal>

      <Modal
        open={paymentSuccess}
        title="签约付款成功"
        footer={null}
        centered
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <CheckCircleOutlined style={{ fontSize: 36, color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--text-primary)' }}>签约付款成功</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>您的法律服务合同已签署，费用已支付</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>我们将尽快安排律师与您联系</div>
        </div>
      </Modal>
    </div>
  )
}