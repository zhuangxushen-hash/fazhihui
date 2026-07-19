import { useState, useEffect } from 'react'
import { Card, Button, Input, Select, Checkbox, Steps, Modal, theme, message } from 'antd'
import { FileTextOutlined, MessageOutlined, CreditCardOutlined, BellOutlined, AlipayCircleOutlined, WechatOutlined, BankOutlined, CheckCircleOutlined, UserOutlined, PhoneOutlined, FileOutlined, AlertOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from '../../api/axios'

export default function Payment() {
  const [currentStep, setCurrentStep] = useState(0)
  const [agreedRisk, setAgreedRisk] = useState(false)
  const [signed, setSigned] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('alipay')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [showSignModal, setShowSignModal] = useState(false)
  const [serviceFee, setServiceFee] = useState<number | null>(null)
  const [loadingFee, setLoadingFee] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    id_card: '',
    case_type: '',
    case_desc: '',
  })

  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const { token: { colorBgContainer } } = theme.useToken()

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
    { title: '签约信息', description: '填写客户信息和案件信息' },
    { title: '风险告知', description: '阅读并确认风险告知书' },
    { title: '在线签约', description: '签署电子合同' },
    { title: '支付费用', description: '完成案件费用支付' },
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

  const menuItems = [
    { key: '/client', label: '案件', icon: FileTextOutlined },
    { key: '/client/ai-consult', label: '咨询', icon: MessageOutlined },
    { key: '/client/complaint', label: '投诉', icon: BellOutlined },
  ]

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card title="签约信息填写" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#666', marginBottom: 8 }}>
                  <UserOutlined style={{ marginRight: 4 }} />姓名 <span style={{ color: '#f5222d' }}>*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入您的姓名"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#666', marginBottom: 8 }}>
                  <PhoneOutlined style={{ marginRight: 4 }}>手机号码</PhoneOutlined> <span style={{ color: '#f5222d' }}>*</span>
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="请输入手机号码"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#666', marginBottom: 8 }}>
                  <FileOutlined style={{ marginRight: 4 }} />身份证号
                </label>
                <Input
                  value={formData.id_card}
                  onChange={(e) => setFormData(prev => ({ ...prev, id_card: e.target.value }))}
                  placeholder="请输入身份证号（选填）"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#666', marginBottom: 8 }}>
                  案件类型 <span style={{ color: '#f5222d' }}>*</span>
                </label>
                <Select
                  value={formData.case_type}
                  onChange={(value) => setFormData(prev => ({ ...prev, case_type: value }))}
                  placeholder="请选择案件类型"
                  options={caseTypes}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#666', marginBottom: 8 }}>案件描述</label>
                <Input.TextArea
                  value={formData.case_desc}
                  onChange={(e) => setFormData(prev => ({ ...prev, case_desc: e.target.value }))}
                  placeholder="请简要描述案件情况（选填）"
                  rows={4}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#666', marginBottom: 8 }}>服务费用</label>
                <div style={{ padding: '12px 16px', background: '#f5f5f5', borderRadius: 8, fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                  {loadingFee ? '加载中...' : serviceFee ? `¥${serviceFee.toFixed(2)}` : '暂未设置（请联系销售）'}
                </div>
              </div>
            </div>
          </Card>
        )
      case 1:
        return (
          <Card title="风险告知书" style={{ marginBottom: 16 }}>
            <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                <AlertOutlined style={{ fontSize: 20, color: '#faad14', marginRight: 8 }} />
                <span style={{ fontSize: 14, fontWeight: 'bold', color: '#faad14' }}>重要提示</span>
              </div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {riskContent}
              </div>
            </div>
            <Checkbox checked={agreedRisk} onChange={(e) => setAgreedRisk(e.target.checked)}>
              我已仔细阅读并理解上述风险告知内容，自愿承担相关风险
            </Checkbox>
          </Card>
        )
      case 2:
        return (
          <Card title="在线签约" style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <FileTextOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>法律服务合同</div>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                甲方：{formData.name}
                <br />
                乙方：法智汇法律服务平台
              </div>
              <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 20, textAlign: 'left' }}>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                  <p><strong>第一条 服务内容</strong></p>
                  <p>乙方接受甲方委托，指派律师为甲方提供{caseTypes.find(t => t.value === formData.case_type)?.label}案件的法律服务。</p>
                  <p><strong>第二条 服务费用</strong></p>
                  <p>甲方应向乙方支付服务费用人民币{serviceFee?.toFixed(2) || 0}元（大写：{serviceFee?.toFixed(2) || 0}元整）。</p>
                  <p><strong>第三条 双方权利义务</strong></p>
                  <p>甲方应如实提供案件相关信息，配合乙方工作；乙方应勤勉尽责，维护甲方合法权益。</p>
                  <p><strong>第四条 合同期限</strong></p>
                  <p>本合同自双方签字（盖章）之日起生效，至案件终结之日止。</p>
                </div>
              </div>
              <div style={{ fontSize: 14, color: '#999', marginBottom: 20 }}>
                请点击下方按钮完成电子签约
              </div>
              <Button
                type={signed ? 'default' : 'primary'}
                size="large"
                disabled={signed}
                onClick={() => setShowSignModal(true)}
              >
                {signed ? '已签约' : '在线签约'}
              </Button>
            </div>
          </Card>
        )
      case 3:
        return (
          <Card title="支付费用" style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CreditCardOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>应付金额</div>
              <div style={{ fontSize: 36, fontWeight: 'bold', color: '#f5222d', marginBottom: 24 }}>¥{serviceFee?.toFixed(2) || 0}</div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>选择支付方式</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Button
                    type={selectedMethod === 'alipay' ? 'primary' : 'default'}
                    icon={<AlipayCircleOutlined />}
                    onClick={() => setSelectedMethod('alipay')}
                    style={{ flex: 1 }}
                  >
                    支付宝
                  </Button>
                  <Button
                    type={selectedMethod === 'wechat' ? 'primary' : 'default'}
                    icon={<WechatOutlined />}
                    onClick={() => setSelectedMethod('wechat')}
                    style={{ flex: 1 }}
                  >
                    微信支付
                  </Button>
                  <Button
                    type={selectedMethod === 'bank' ? 'primary' : 'default'}
                    icon={<BankOutlined />}
                    onClick={() => setSelectedMethod('bank')}
                    style={{ flex: 1 }}
                  >
                    银行卡
                  </Button>
                </div>
              </div>
              <Button type="primary" size="large" block onClick={handlePayment}>
                确认支付 ¥{serviceFee?.toFixed(2) || 0}
              </Button>
            </div>
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px 16px',
          paddingTop: '40px',
          color: '#fff',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>客户签约付款</h2>
        <p style={{ fontSize: 12, opacity: 0.9 }}>一站式法律服务签约流程</p>
      </div>

      <div style={{ padding: '16px', flex: 1, paddingBottom: '80px' }}>
        <Steps current={currentStep} items={steps} style={{ marginBottom: 20 }} />
        {renderStepContent()}
        <div style={{ display: 'flex', gap: 12 }}>
          {currentStep > 0 && (
            <Button style={{ flex: 1 }} onClick={handlePrev}>上一步</Button>
          )}
          {currentStep < 3 ? (
            <Button type="primary" style={{ flex: 1 }} onClick={handleNext}>下一步</Button>
          ) : (
            <Button type="primary" style={{ flex: 1 }} onClick={() => navigate('/client')}>返回首页</Button>
          )}
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: colorBgContainer,
          borderTop: '1px solid #f0f0f0',
          padding: '12px 0',
          display: 'flex',
          justifyContent: 'space-around',
          zIndex: 100,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        }}
      >
        {menuItems.map((item) => {
          const isActive = window.location.pathname === item.key
          return (
            <div
              key={item.key}
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => navigate(item.key)}
            >
              <item.icon style={{ fontSize: 24, color: isActive ? '#1890ff' : '#999' }} />
              <div style={{ fontSize: 10, color: isActive ? '#1890ff' : '#999', marginTop: 4 }}>{item.label}</div>
            </div>
          )
        })}
        <div style={{ textAlign: 'center', cursor: 'pointer' }}>
          <CreditCardOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <div style={{ fontSize: 10, color: '#1890ff', marginTop: 4 }}>签约付款</div>
        </div>
      </div>

      <Modal
        open={showSignModal}
        title="电子签约"
        onCancel={() => setShowSignModal(false)}
        footer={null}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>请确认以下签约信息：</div>
          <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: '#333', marginBottom: 8 }}>
              <span style={{ color: '#666' }}>签约人：</span>{formData.name}
            </div>
            <div style={{ fontSize: 13, color: '#333', marginBottom: 8 }}>
              <span style={{ color: '#666' }}>手机号码：</span>{formData.phone}
            </div>
            <div style={{ fontSize: 13, color: '#333', marginBottom: 8 }}>
              <span style={{ color: '#666' }}>案件类型：</span>{caseTypes.find(t => t.value === formData.case_type)?.label}
            </div>
            <div style={{ fontSize: 13, color: '#333' }}>
              <span style={{ color: '#666' }}>服务费用：</span>¥{serviceFee?.toFixed(2) || 0}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>
            点击确认即表示您同意签署上述法律服务合同
          </div>
          <Button type="primary" size="large" onClick={handleSign}>确认签约</Button>
        </div>
      </Modal>

      <Modal
        open={paymentSuccess}
        title="签约付款成功"
        footer={null}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 12 }} />
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>签约付款成功</div>
          <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>您的法律服务合同已签署，费用已支付</div>
          <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>我们将尽快安排律师与您联系</div>
        </div>
      </Modal>
    </div>
  )
}