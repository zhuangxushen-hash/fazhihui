import ApprovalFormTemplate from '../components/ApprovalFormTemplate'

/**
 * 报销审批单
 */
export default function RepayApproveForm() {
  return (
    <ApprovalFormTemplate
      formType="repay_approve"
      defaultName="报销审批单"
      defaultDescription="填写报销申请审批确认信息并提交审批流程"
    />
  )
}
