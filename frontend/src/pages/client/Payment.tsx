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

  const handleSign = () => {
    setSigned(true)
    setShowSignModal(false)
    message.success('签约成功')
  }

  const handlePayment = () => {
    if (!serviceFee || serviceFee <= 0) {
      message.error('服务费用未设置，请联系销售')
      return
    }
    setPaymentSuccess(true)
    setTimeout(() => {
      setPaymentSuccess(false)
    }, 2000)
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
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserOutlined style={{ fontSize: 14, color: '#fff' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600 }}>签约信息填写</span>
            </div>} 
            style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: 'none' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>
                  <UserOutlined style={{ marginRight: 6, color: '#1890ff', fontSize: 14 }} />姓名 <span style={{ color: '#f5222d' }}>*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入您的姓名"
                  size="large"
                  style={{ borderRadius: 10, border: '1px solid #e8e8e8', transition: 'all 0.15s ease', height: 44 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>
                  <PhoneOutlined style={{ marginRight: 6, color: '#1890ff', fontSize: 14 }}>手机号码</PhoneOutlined> <span style={{ color: '#f5222d' }}>*</span>
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="请输入手机号码"
                  size="large"
                  style={{ borderRadius: 10, border: '1px solid #e8e8e8', transition: 'all 0.15s ease', height: 44 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>
                  <FileOutlined style={{ marginRight: 6, color: '#1890ff', fontSize: 14 }} />身份证号
                </label>
                <Input
                  value={formData.id_card}
                  onChange={(e) => setFormData(prev => ({ ...prev, id_card: e.target.value }))}
                  placeholder="请输入身份证号（选填）"
                  size="large"
                  style={{ borderRadius: 10, border: '1px solid #e8e8e8', transition: 'all 0.15s ease', height: 44 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>
                  案件类型 <span style={{ color: '#f5222d' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {caseTypes.map(type => (
                    <div
                      key={type.value}
                      style={{
                        height: 44,
                        borderRadius: 10,
                        border: `2px solid ${formData.case_type === type.value ? '#1890ff' : '#e8e8e8'}`,
                        background: formData.case_type === type.value ? 'rgba(24,144,255,0.08)' : '#fff',
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
                      <span style={{ fontSize: 13, color: formData.case_type === type.value ? '#1890ff' : '#666', fontWeight: formData.case_type === type.value ? 500 : 'normal' }}>
                        {type.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>案件描述</label>
                <Input.TextArea
                  value={formData.case_desc}
                  onChange={(e) => setFormData(prev => ({ ...prev, case_desc: e.target.value }))}
                  placeholder="请简要描述案件情况（选填）"
                  rows={4}
                  style={{ borderRadius: 10, border: '1px solid #e8e8e8', transition: 'all 0.15s ease' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 6, fontWeight: 500 }}>服务费用</label>
                <div style={{ padding: '14px', background: 'linear-gradient(135deg, rgba(24,144,255,0.08) 0%, rgba(24,144,255,0.04) 100%)', borderRadius: 10, border: '1px solid rgba(24,144,255,0.15)' }}>
                  {loadingFee ? (
                    <div style={{ fontSize: 14, color: '#999', textAlign: 'center' }}>加载中...</div>
                  ) : serviceFee ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#666' }}>已设置服务费用</span>
                      <span style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>¥{serviceFee.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#fa8c16', textAlign: 'center', padding: 6 }}>
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
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertOutlined style={{ fontSize: 14, color: '#fff' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600 }}>风险告知书</span>
            </div>}
            style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: 'none' }}
          >
            <div style={{ background: 'linear-gradient(135deg, rgba(24,144,255,0.06) 0%, rgba(24,144,255,0.03) 100%)', border: '1px solid rgba(24,144,255,0.15)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <AlertOutlined style={{ fontSize: 18, color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#1890ff' }}>重要提示</div>
                  <div style={{ fontSize: 11, color: '#40a9ff', marginTop: 1 }}>请仔细阅读以下风险告知事项</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 2, whiteSpace: 'pre-wrap', background: '#fff', padding: 14, borderRadius: 6, maxHeight: 200, overflowY: 'auto' }}>
                {riskContent}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: '#fafafa', borderRadius: 10 }}>
              <Checkbox 
                checked={agreedRisk} 
                onChange={(e) => setAgreedRisk(e.target.checked)}
                style={{ transform: 'scale(1.1)' }}
              />
              <span style={{ fontSize: 12, color: '#666', flex: 1 }}>我已仔细阅读并理解上述风险告知内容，自愿承担相关风险</span>
            </div>
          </Card>
        )
      case 2:
        return (
          <Card 
            title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileTextOutlined style={{ fontSize: 14, color: '#fff' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600 }}>在线签约</span>
            </div>}
            style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: 'none' }}
          >
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(24,144,255,0.1) 0%, rgba(24,144,255,0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FileTextOutlined style={{ fontSize: 44, color: '#1890ff' }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 }}>法律服务合同</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
                甲方：{formData.name}
                <br />
                乙方：法智汇法律服务平台
              </div>
              <div style={{ background: '#fafafa', padding: 16, borderRadius: 10, marginBottom: 20, textAlign: 'left', border: '1px solid #f0f0f0', maxHeight: 220, overflowY: 'auto' }}>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
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
              <div style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>
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
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCardOutlined style={{ fontSize: 14, color: '#fff' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 600 }}>支付费用</span>
            </div>}
            style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: 'none' }}
          >
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(24,144,255,0.1) 0%, rgba(24,144,255,0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CreditCardOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              </div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>应付金额</div>
              <div style={{ fontSize: 36, fontWeight: 'bold', color: '#f5222d', marginBottom: 24 }}>¥{serviceFee?.toFixed(2) || 0}</div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 12, fontWeight: 500 }}>选择支付方式</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {paymentMethods.map(method => (
                    <div
                      key={method.value}
                      style={{ 
                        flex: 1, 
                        height: 52,
                        borderRadius: 10,
                        border: `2px solid ${selectedMethod === method.value ? method.color : '#e8e8e8'}`,
                        background: selectedMethod === method.value ? `${method.color}15` : '#fff',
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
                        <method.icon style={{ fontSize: 22, color: selectedMethod === method.value ? method.color : '#666' }} />
                        <span style={{ fontSize: 12, color: selectedMethod === method.value ? method.color : '#666' }}>{method.label}</span>
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
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '16px 16px',
          paddingTop: '52px',
          color: '#fff',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ cursor: 'pointer', padding: 4 }} onClick={() => navigate('/client')}>
            <ArrowLeftOutlined style={{ fontSize: 18 }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>客户签约付款</h2>
        </div>
        <p style={{ fontSize: 12, opacity: 0.9, marginLeft: 32 }}>一站式法律服务签约流程</p>
      </div>

      <div style={{ padding: '12px', flex: 1, paddingBottom: '80px' }}>
        <div style={{ background: '#fff', borderRadius: borderRadiusLG, padding: 16, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
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
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(24,144,255,0.1) 0%, rgba(24,144,255,0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <FileTextOutlined style={{ fontSize: 28, color: '#1890ff' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 12 }}>请确认以下签约信息：</div>
          <div style={{ background: '#fafafa', padding: 16, borderRadius: 10, marginBottom: 16, textAlign: 'left', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 13, color: '#333', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>签约人：</span>
              <span style={{ fontWeight: 500 }}>{formData.name}</span>
            </div>
            <div style={{ fontSize: 13, color: '#333', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>手机号码：</span>
              <span style={{ fontWeight: 500 }}>{formData.phone}</span>
            </div>
            <div style={{ fontSize: 13, color: '#333', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>案件类型：</span>
              <span style={{ fontWeight: 500 }}>{caseTypes.find(t => t.value === formData.case_type)?.label}</span>
            </div>
            <div style={{ fontSize: 13, color: '#333', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>服务费用：</span>
              <span style={{ fontWeight: 600, color: '#1890ff' }}>¥{serviceFee?.toFixed(2) || 0}</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 16 }}>
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
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(82,196,26,0.15) 0%, rgba(82,196,26,0.08) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <CheckCircleOutlined style={{ fontSize: 36, color: '#52c41a' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>签约付款成功</div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>您的法律服务合同已签署，费用已支付</div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>我们将尽快安排律师与您联系</div>
        </div>
      </Modal>
    </div>
  )
}