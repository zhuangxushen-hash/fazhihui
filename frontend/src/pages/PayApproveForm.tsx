import ApprovalFormTemplate from '../components/ApprovalFormTemplate'

/**
 * 支付审批单
 */
export default function PayApproveForm() {
  return (
    <ApprovalFormTemplate
      formType="pay_approve"
      defaultName="支付审批单"
      defaultDescription="填写支付申请审批确认信息并提交审批流程"
    />
  )
}
