import ApprovalFormTemplate from '../components/ApprovalFormTemplate'

/**
 * 支付申请单
 */
export default function PayApplyForm() {
  return (
    <ApprovalFormTemplate
      formType="pay_apply"
      defaultName="支付申请单"
      defaultDescription="填写对外支付款项申请信息并提交审批流程"
    />
  )
}
