import ApprovalFormTemplate from '../components/ApprovalFormTemplate'

/**
 * 报销申请单
 */
export default function RepayApplyForm() {
  return (
    <ApprovalFormTemplate
      formType="repay_apply"
      defaultName="报销申请单"
      defaultDescription="填写费用报销申请信息并提交审批流程"
    />
  )
}
