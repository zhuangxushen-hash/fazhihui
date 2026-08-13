import ApprovalFormTemplate from '../components/ApprovalFormTemplate'

/**
 * 成本票-报销审批单
 */
export default function InvoiceRepayApproveForm() {
  return (
    <ApprovalFormTemplate
      formType="invoice_repay"
      defaultName="成本票-报销审批单"
      defaultDescription="填写成本发票报销审批信息并提交审批流程"
    />
  )
}
