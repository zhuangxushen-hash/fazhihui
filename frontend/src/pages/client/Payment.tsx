import { useState, useEffect } from 'react'
import { Input, Checkbox, Modal, message, Spin } from 'antd'
import {
  LeftOutlined,
  FileTextOutlined,
  WechatOutlined,
  BankOutlined,
  TransactionOutlined,
  CheckCircleFilled,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from '../../api/axios'
import { Card } from './shared'

/** 自助签约付费流程步骤 */
const STEP_TITLES = ['签约信息', '风险告知', '在线签约', '支付费用']

/** 案件类型 */
const CASE_TYPES = [
  { value: 'marriage', label: '婚姻家事' },
  { value: 'traffic', label: '交通事故' },
  { value: 'labor', label: '劳动争议' },
  { value: 'debt', label: '债务追讨' },
  { value: 'other', label: '其他案件' },
]

/** 支付方式（设计稿：微信支付 / 银行卡 / 对公转账） */
const PAY_METHODS = [
  { value: 'wechat', label: '微信支付', desc: '推荐使用，支持零钱与银行卡', icon: WechatOutlined, color: '#07C160' },
  { value: 'bank', label: '银行卡', desc: '支持储蓄卡与信用卡', icon: BankOutlined, color: '#1E3A8A' },
  { value: 'transfer', label: '对公转账', desc: '转账后由财务人工核销', icon: TransactionOutlined, color: '#475569' },
]

const RISK_CONTENT = `尊敬的客户：

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

export default function Payment() {
  const [currentStep, setCurrentStep] = useState(0)
  const [agreedRisk, setAgreedRisk] = useState(false)
  const [signed, setSigned] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('wechat')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [showSignModal, setShowSignModal] = useState(false)
  const [serviceFee, setServiceFee] = useState<number | null>(null)
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null)
  const [loadingFee, setLoadingFee] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    id_card: '',
    case_type: '',
    case_desc: '',
  })

  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  useEffect(() => {
    if (user.real_name) setFormData((prev) => ({ ...prev, name: user.real_name }))
    if (user.phone) setFormData((prev) => ({ ...prev, phone: user.phone }))
    fetchServiceFee()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchServiceFee = async () => {
    setLoadingFee(true)
    try {
      const res: any = await axios.post('/client/service-fee', { client_id: user.id })
      if (res && res.service_fee) setServiceFee(res.service_fee as number)
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoadingFee(false)
    }
  }

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
    setCurrentStep((prev) => prev + 1)
  }

  const handleSign = async () => {
    setSubmitting(true)
    try {
      const caseData: any = await axios.post('/cases', {
        case_type: formData.case_type,
        client_id: user.id,
        organization_id: user.organization_id,
        client_name: formData.name,
        client_phone: formData.phone,
        fee_amount: serviceFee || 0,
        amount: serviceFee || 0,
        description: formData.case_desc || `客户${formData.name}签约的${formData.case_type}案件`,
      })
      setCreatedCaseId(caseData.id)
      setSigned(true)
      setShowSignModal(false)
      message.success('签约成功')
    } catch (error) {
      message.error('签约失败，请重试')
    } finally {
      setSubmitting(false)
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
    setSubmitting(true)
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
        navigate('/client/cases')
      }, 1800)
    } catch (error) {
      message.error('支付失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  /** 顶部步骤指示 */
  const StepBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: '#FFFFFF' }}>
      {STEP_TITLES.map((title, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <div key={title} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: done || active ? '#1E3A8A' : '#E2E8F0',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: active ? '#1E3A8A' : '#94A3B8',
                  fontWeight: active ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </span>
            </div>
            {i < STEP_TITLES.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#1E3A8A' : '#E2E8F0', marginBottom: 16 }} />
            )}
          </div>
        )
      })}
    </div>
  )

  /** 步骤 0：签约信息 */
  const renderStep0 = () => (
    <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>签约信息填写</div>

      <div>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>
          姓名 <span style={{ color: '#DC2626' }}>*</span>
        </div>
        <Input
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          placeholder="请输入您的姓名"
          className="mp-field-input"
          style={{ height: 44 }}
        />
      </div>

      <div>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>
          手机号码 <span style={{ color: '#DC2626' }}>*</span>
        </div>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
          placeholder="请输入手机号码"
          className="mp-field-input"
          style={{ height: 44 }}
        />
      </div>

      <div>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>身份证号</div>
        <Input
          value={formData.id_card}
          onChange={(e) => setFormData((p) => ({ ...p, id_card: e.target.value }))}
          placeholder="请输入身份证号（选填）"
          className="mp-field-input"
          style={{ height: 44 }}
        />
      </div>

      <div>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>
          案件类型 <span style={{ color: '#DC2626' }}>*</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CASE_TYPES.map((t) => {
            const active = formData.case_type === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setFormData((p) => ({ ...p, case_type: t.value }))}
                style={{
                  padding: '6px 12px',
                  borderRadius: 99,
                  border: 'none',
                  background: active ? '#1E3A8A' : '#EEF2FB',
                  color: active ? '#FFFFFF' : '#1E3A8A',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>案件描述</div>
        <Input.TextArea
          value={formData.case_desc}
          onChange={(e) => setFormData((p) => ({ ...p, case_desc: e.target.value }))}
          placeholder="请简要描述您的案件情况"
          rows={4}
          className="mp-field-textarea"
        />
      </div>
    </Card>
  )

  /** 步骤 1：风险告知 */
  const renderStep1 = () => (
    <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileTextOutlined style={{ fontSize: 16, color: '#1E3A8A' }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>风险告知书</span>
      </div>
      <div
        style={{
          padding: 14,
          borderRadius: 12,
          background: '#F6F7F9',
          fontSize: 12,
          color: '#475569',
          lineHeight: 1.9,
          whiteSpace: 'pre-wrap',
          maxHeight: 340,
          overflowY: 'auto',
        }}
      >
        {RISK_CONTENT}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <Checkbox
          checked={agreedRisk}
          onChange={(e) => setAgreedRisk(e.target.checked)}
        />
        <span style={{ fontSize: 13, color: '#475569' }}>我已阅读并同意上述风险告知内容</span>
      </label>
    </Card>
  )

  /** 步骤 2：在线签约 */
  const renderStep2 = () => (
    <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>电子合同签署</div>
      <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.8 }}>
        请确认以下信息无误后签署电子合同，签署完成即可进入支付环节。
      </div>

      <div style={{ padding: 14, borderRadius: 12, background: '#F6F7F9', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: '客户姓名', value: formData.name || '-' },
          { label: '联系电话', value: formData.phone || '-' },
          { label: '案件类型', value: CASE_TYPES.find((t) => t.value === formData.case_type)?.label || '-' },
          { label: '服务费用', value: serviceFee ? `¥${Number(serviceFee).toLocaleString('zh-CN')}` : '待定' },
        ].map((row) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>{row.label}</span>
            <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
      </div>

      {signed ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: 14,
            borderRadius: 12,
            background: '#E7F6EF',
            color: '#059669',
            fontSize: 13,
          }}
        >
          <CheckCircleFilled />
          已完成签署
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSignModal(true)}
          style={{
            height: 48,
            borderRadius: 12,
            border: 'none',
            background: '#1E3A8A',
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          签署电子合同
        </button>
      )}
    </Card>
  )

  /** 步骤 3：支付（严格对齐设计稿 07-支付） */
  const renderStep3 = () => (
    <>
      {/* 订单信息卡 */}
      <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>
          {CASE_TYPES.find((t) => t.value === formData.case_type)?.label || '法律服务费'}
        </div>
        <div style={{ fontSize: 13, color: '#64748B' }}>
          {formData.name ? `${formData.name} · ` : ''}律师服务费
        </div>
      </Card>

      {/* 金额展示区 */}
      <Card
        style={{
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 13, color: '#64748B' }}>支付金额</span>
        {loadingFee ? (
          <Spin />
        ) : (
          <span style={{ fontSize: 36, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
            ¥{Number(serviceFee || 0).toLocaleString('zh-CN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        )}
      </Card>

      {/* 支付方式卡 */}
      <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>选择支付方式</div>
        {PAY_METHODS.map((m) => {
          const Icon = m.icon
          const active = selectedMethod === m.value
          return (
            <div
              key={m.value}
              onClick={() => setSelectedMethod(m.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                cursor: 'pointer',
                borderTop: m.value === PAY_METHODS[0].value ? 'none' : '1px solid #F1F5F9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon style={{ fontSize: 20, color: m.color }} />
                <div>
                  <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 500 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{m.desc}</div>
                </div>
              </div>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  border: active ? 'none' : '1px solid #CBD5E1',
                  background: active ? '#1E3A8A' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {active && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1 4 L3.5 6.5 L9 1"
                      stroke="#FFFFFF"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
          )
        })}
      </Card>
    </>
  )

  return (
    <div className="client-app">
      <div
        style={{
          maxWidth: 375,
          margin: '0 auto',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#F6F7F9',
        }}
      >
        {/* ===== 自定义导航栏 ===== */}
        <div
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 4,
            paddingRight: 10,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => (currentStep === 0 ? navigate(-1) : setCurrentStep((p) => p - 1))}
            style={{
              width: 40,
              height: 40,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <LeftOutlined style={{ fontSize: 18, color: '#0F172A' }} />
          </button>
          <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#0F172A' }}>
            {currentStep === 3 ? '支付' : '签约付费'}
          </span>
          <div style={{ width: 87, flexShrink: 0 }} />
        </div>

        <StepBar />

        {/* ===== 内容区 ===== */}
        <div
          style={{
            flex: 1,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {currentStep === 0 && renderStep0()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div style={{ flex: 1, minHeight: 8 }} />

          {/* 底部主操作 */}
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                height: 48,
                borderRadius: 12,
                border: 'none',
                background: '#1E3A8A',
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              下一步
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handlePayment}
                disabled={submitting}
                style={{
                  height: 48,
                  borderRadius: 12,
                  border: 'none',
                  background: '#07C160',
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {submitting ? '支付中...' : '立即支付'}
              </button>
              <div style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
                已接入微信支付 · 资金安全有保障
              </div>
            </>
          )}
        </div>

        {/* 底部安全区 */}
        <div style={{ height: 34 }} />
      </div>

      {/* 签约弹窗 */}
      <Modal
        title="签署电子合同"
        open={showSignModal}
        onCancel={() => setShowSignModal(false)}
        onOk={handleSign}
        okText="确认签署"
        cancelText="取消"
        confirmLoading={submitting}
      >
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
          签署即表示您已阅读并同意《法律服务合同》与《风险告知书》的全部条款，合同自双方签署之日起生效。
        </div>
      </Modal>

      {/* 支付成功 */}
      <Modal
        open={paymentSuccess}
        footer={null}
        closable={false}
        width={280}
        centered
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <CheckCircleFilled style={{ fontSize: 48, color: '#059669' }} />
          <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600, color: '#0F172A' }}>支付成功</div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94A3B8' }}>正在前往案件列表…</div>
        </div>
      </Modal>
    </div>
  )
}
