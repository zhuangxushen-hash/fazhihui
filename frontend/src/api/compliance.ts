import axios from './axios'

// ==================== 类型定义 ====================

export enum CheckStage {
  ACQUISITION = 'acquisition',
  NEGOTIATION = 'negotiation',
  SIGNING = 'signing',
  CASE_HANDLING = 'case_handling',
  CLOSING = 'closing',
  FINANCE = 'finance',
}

export enum RuleType {
  KEYWORD = 'keyword',
  REGEX = 'regex',
  MANUAL = 'manual',
}

export enum CheckResultType {
  PASS = 'pass',
  REVIEW = 'review',
  REJECT = 'reject',
}

export enum HandleStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  IGNORED = 'ignored',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface ComplianceRule {
  id: string
  name: string
  check_stage: CheckStage
  rule_type: RuleType
  conditions: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface ComplianceCheckResult {
  id: string
  rule_id: string
  target_type: string
  target_id: string
  check_result: CheckResultType
  violation_content?: string
  handler_id?: string
  handle_status: HandleStatus
  handle_note?: string
  is_inspection: boolean
  created_at: string
  handled_at?: string
}

export interface MarketingContent {
  id: string
  title: string
  content: string
  content_type: string
  platform: string
  status: ContentStatus
  compliance_issues?: string
  compliance_suggestions?: string
  review_time?: string
  reviewer_id?: string
  organization_id: string
  operator_id: string
  created_at: string
  updated_at: string
}

export interface ArchiveData {
  marketing_contents: MarketingContent[]
  check_results: ComplianceCheckResult[]
}

export interface ArchiveExport {
  export_time: string
  filter: any
  summary: {
    total_contents: number
    total_check_results: number
    approved: number
    rejected: number
    pending_review: number
    draft: number
    warning_count: number
  }
  marketing_contents: any[]
  check_results: any[]
}

// ==================== 营销内容预审 ====================

/** 5.1.3 提交营销内容进行发布前强制合规预审 */
export const submitMarketingContent = (id: string, operatorId: string) => {
  return axios.post(`/compliance/marketing-content/${id}/submit`, { operator_id: operatorId })
}

export const getMarketingContents = (params: { org_id: string; status?: string }) => {
  return axios.get('/compliance/marketing-content', { params })
}

export const createMarketingContent = (data: Partial<MarketingContent>) => {
  return axios.post('/compliance/marketing-content', data)
}

export const reviewMarketingContent = (id: string, data: { reviewer_id: string; status: string; issues?: string }) => {
  return axios.put(`/compliance/marketing-content/${id}/review`, data)
}

// ==================== 合规规则管理 ====================

export const createComplianceRule = (data: {
  name: string
  check_stage: CheckStage
  rule_type: RuleType
  conditions: any
  enabled?: boolean
}) => {
  return axios.post('/compliance/compliance-rule', data)
}

export const getComplianceRules = (params?: { check_stage?: CheckStage; enabled_only?: string }) => {
  return axios.get('/compliance/compliance-rule', { params })
}

export const getComplianceRuleById = (id: string) => {
  return axios.get(`/compliance/compliance-rule/${id}`)
}

export const updateComplianceRule = (id: string, data: Partial<{
  name: string
  check_stage: CheckStage
  rule_type: RuleType
  conditions: any
  enabled: boolean
}>) => {
  return axios.put(`/compliance/compliance-rule/${id}`, data)
}

export const deleteComplianceRule = (id: string) => {
  return axios.delete(`/compliance/compliance-rule/${id}`)
}

export const toggleComplianceRule = (id: string, enabled: boolean) => {
  return axios.put(`/compliance/compliance-rule/${id}/toggle`, { enabled })
}

// ==================== 检查结果查询 ====================

export const getCheckResults = (params?: {
  target_type?: string
  target_id?: string
  check_result?: CheckResultType
  handle_status?: HandleStatus
  is_inspection?: string
  start_date?: string
  end_date?: string
}) => {
  return axios.get('/compliance/check-results', { params })
}

export const getCheckResultById = (id: string) => {
  return axios.get(`/compliance/check-results/${id}`)
}

export const handleCheckResult = (id: string, data: {
  handler_id: string
  handle_status: HandleStatus
  handle_note?: string
}) => {
  return axios.put(`/compliance/check-results/${id}/handle`, data)
}

// ==================== 巡检管理 ====================

/** 5.1.4 手动触发公域账号巡检 */
export const triggerInspection = () => {
  return axios.post('/compliance/inspection/trigger')
}

// ==================== 留痕档案管理 ====================

/** 5.1.5 获取留痕档案 */
export const getArchive = (params?: {
  org_id?: string
  platform?: string
  status?: string
  start_date?: string
  end_date?: string
}) => {
  return axios.get<ArchiveData>('/compliance/archive', { params })
}

/** 5.1.5 导出留痕档案（监管核查导出） */
export const exportArchive = (params?: {
  org_id?: string
  platform?: string
  status?: string
  start_date?: string
  end_date?: string
}) => {
  return axios.get<ArchiveExport>('/compliance/archive/export', { params })
}

// ==================== 5.6 财务税务合规校验 ====================

export enum FinanceCheckType {
  RECEIVABLE = 'receivable',
  INVOICE = 'invoice',
  COMMISSION = 'commission',
}

export enum FinanceTargetType {
  RECEIVABLE = 'receivable',
  INVOICE = 'invoice',
  COMMISSION = 'commission',
}

export enum FinanceCheckResult {
  PASS = 'pass',
  WARNING = 'warning',
  VIOLATION = 'violation',
}

export enum FinanceHandleStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  IGNORED = 'ignored',
}

export interface FinanceComplianceCheck {
  id: string
  check_type: FinanceCheckType
  target_type: FinanceTargetType
  target_id: string
  case_id?: string
  check_result: FinanceCheckResult
  warning_content?: string
  suggestion?: string
  handler_id?: string
  handle_status: FinanceHandleStatus
  handle_note?: string
  organization_id?: string
  created_at: string
  handled_at?: string
}

/** 5.6.2 单条收费合规校验 */
export const checkReceivableCompliance = (receivableId: string) => {
  return axios.post<FinanceComplianceCheck>(`/compliance/finance-check/receivable/${receivableId}`)
}

/** 5.6.2 批量收费合规校验 */
export const batchCheckReceivableCompliance = (orgId?: string) => {
  return axios.post<{ total: number; warning_count: number; violation_count: number; records: FinanceComplianceCheck[] }>(
    '/compliance/finance-check/receivable/batch',
    { org_id: orgId },
  )
}

/** 5.6.3 发票与收款对应校验 */
export const checkInvoicePaymentCompliance = (caseId?: string) => {
  return axios.post<{
    invoices_without_payment: any[]
    payments_without_invoice: any[]
    records: FinanceComplianceCheck[]
  }>('/compliance/finance-check/invoice', { case_id: caseId })
}

/** 5.6.4 单案件分润合规校验 */
export const checkCommissionCompliance = (caseId: string) => {
  return axios.post<FinanceComplianceCheck[]>(`/compliance/finance-check/commission/${caseId}`)
}

/** 5.6.4 批量分润合规校验 */
export const batchCheckCommissionCompliance = () => {
  return axios.post<{ total_cases: number; violation_count: number; records: FinanceComplianceCheck[] }>(
    '/compliance/finance-check/commission/batch',
  )
}

/** 5.6 财务合规校验记录列表 */
export const getFinanceComplianceChecks = (params?: {
  org_id?: string
  check_type?: FinanceCheckType
  target_type?: FinanceTargetType
  check_result?: FinanceCheckResult
  handle_status?: FinanceHandleStatus
  case_id?: string
  start_date?: string
  end_date?: string
}) => {
  return axios.get<FinanceComplianceCheck[]>('/compliance/finance-check', { params })
}

/** 5.6 财务合规校验统计概览 */
export const getFinanceComplianceStats = (orgId?: string) => {
  return axios.get<{
    receivable: { pass: number; warning: number; violation: number; pending: number }
    invoice: { pass: number; warning: number; violation: number; pending: number }
    commission: { pass: number; warning: number; violation: number; pending: number }
    total: { pass: number; warning: number; violation: number; pending: number }
  }>('/compliance/finance-check/stats', { params: { org_id: orgId } })
}

/** 5.6 财务合规校验详情 */
export const getFinanceComplianceCheckById = (id: string) => {
  return axios.get<FinanceComplianceCheck>(`/compliance/finance-check/${id}`)
}

/** 5.6 处理财务合规校验预警 */
export const handleFinanceComplianceCheck = (id: string, data: {
  handler_id: string
  handle_status: FinanceHandleStatus
  handle_note?: string
}) => {
  return axios.put<FinanceComplianceCheck>(`/compliance/finance-check/${id}/handle`, data)
}

// ==================== 5.7 客诉与舆情闭环管控 ====================

export enum TicketSourceChannel {
  CLIENT_PORTAL = 'client_portal',
  PHONE = 'phone',
  WECHAT = 'wechat',
  ENTERPRISE_WECHAT = 'enterprise_wechat',
  OTHER = 'other',
}

export enum TicketComplaintType {
  SERVICE_ATTITUDE = 'service_attitude',
  CASE_PROGRESS = 'case_progress',
  FEE_ISSUE = 'fee_issue',
  LAWYER_PROFESSIONAL = 'lawyer_professional',
  OTHER = 'other',
}

export enum TicketSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TicketStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

export interface ComplaintTicket {
  id: string
  ticket_number: string
  source_channel: TicketSourceChannel
  complaint_type: TicketComplaintType
  severity_level: TicketSeverity
  title: string
  content: string
  case_id?: string
  client_id?: string
  client_name?: string
  client_phone?: string
  handler_id?: string
  handler_name?: string
  status: TicketStatus
  process_records?: string
  process_records_parsed?: any[]
  complaint_type_label?: string
  source_channel_label?: string
  resolved_at?: string
  closed_at?: string
  archived: boolean
  archived_at?: string
  escalated: boolean
  escalated_at?: string
  organization_id?: string
  resolution?: string
  satisfaction_score?: number
  created_at: string
  updated_at: string
}

/** 5.7.2 创建客诉工单 */
export const createComplaintTicket = (data: {
  source_channel: TicketSourceChannel
  complaint_type: TicketComplaintType
  severity_level: TicketSeverity
  title: string
  content: string
  case_id?: string
  client_id?: string
  client_name?: string
  client_phone?: string
  organization_id?: string
  creator_id?: string
}) => {
  return axios.post('/compliance/complaint-ticket', data)
}

/** 5.7.7 工单列表查询 */
export const getComplaintTickets = (params?: {
  org_id?: string
  status?: TicketStatus
  severity_level?: TicketSeverity
  complaint_type?: TicketComplaintType
  source_channel?: TicketSourceChannel
  handler_id?: string
  client_id?: string
  archived?: string
  start_date?: string
  end_date?: string
}) => {
  return axios.get<ComplaintTicket[]>('/compliance/complaint-tickets', { params })
}

/** 5.7.4 工单详情 */
export const getComplaintTicketById = (id: string) => {
  return axios.get<ComplaintTicket>(`/compliance/complaint-ticket/${id}`)
}

/** 5.7.5 客户投诉历史 */
export const getClientComplaintTickets = (clientId: string) => {
  return axios.get<ComplaintTicket[]>(`/compliance/complaint-tickets/client/${clientId}`)
}

/** 5.7.4 添加处理记录 */
export const addProcessRecord = (id: string, data: { operator_id: string; content: string; action?: string }) => {
  return axios.post(`/compliance/complaint-ticket/${id}/process-record`, data)
}

/** 5.7.4 状态变更 */
export const updateTicketStatus = (id: string, data: { operator_id: string; status: TicketStatus; note?: string }) => {
  return axios.put(`/compliance/complaint-ticket/${id}/status`, data)
}

/** 5.7.4 解决工单 */
export const resolveTicket = (id: string, data: { operator_id: string; resolution: string }) => {
  return axios.put(`/compliance/complaint-ticket/${id}/resolve`, data)
}

/** 5.7.5 关闭工单并归档 */
export const closeTicket = (id: string, data: { operator_id: string; resolution: string; satisfaction_score?: number }) => {
  return axios.put(`/compliance/complaint-ticket/${id}/close`, data)
}

/** 5.7.3 手动升级 */
export const escalateTicket = (id: string, data: { operator_id: string; reason: string }) => {
  return axios.put(`/compliance/complaint-ticket/${id}/escalate`, data)
}

/** 5.7.7 批量处理 */
export const batchUpdateTickets = (data: {
  ids: string[]
  action: 'assign' | 'close' | 'process'
  operator_id: string
  handler_id?: string
  note?: string
  resolution?: string
}) => {
  return axios.post('/compliance/complaint-tickets/batch', data)
}

/** 5.7.7 工单统计概览 */
export const getTicketStats = (params?: { org_id?: string; start_date?: string; end_date?: string }) => {
  return axios.get('/compliance/complaint-tickets/stats', { params })
}

/** 5.7.6 高频投诉点统计报表 */
export const getComplaintReport = (params?: { org_id?: string; start_date?: string; end_date?: string }) => {
  return axios.get('/compliance/complaint-tickets/report', { params })
}

// ==================== 5.4 办案交付合规管控 ====================

export enum CaseCheckType {
  SOP_NODE = 'sop_node',
  OVERDUE_WARNING = 'overdue_warning',
  DOCUMENT_INSPECTION = 'document_inspection',
  EVIDENCE_INSPECTION = 'evidence_inspection',
  PERSONNEL_CHANGE = 'personnel_change',
}

export enum CaseCheckResult {
  PASS = 'pass',
  WARNING = 'warning',
  VIOLATION = 'violation',
}

export enum CaseRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum CaseCheckHandleStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  IGNORED = 'ignored',
}

export enum PersonnelChangeType {
  MAIN_LAWYER = 'main_lawyer',
  ASSISTANT = 'assistant',
  DELEGATION = 'delegation',
}

export enum PersonnelChangeStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface CaseComplianceCheck {
  id: string
  case_id: string
  check_type: CaseCheckType
  check_result: CaseCheckResult
  risk_level: CaseRiskLevel
  violation_detail?: string
  handler_id?: string
  handle_status: CaseCheckHandleStatus
  handle_note?: string
  source_id?: string
  organization_id?: string
  created_at: string
  handled_at?: string
}

export interface CasePersonnelChange {
  id: string
  case_id: string
  change_type: PersonnelChangeType
  original_person_id?: string
  new_person_id: string
  reason: string
  approver_id?: string
  status: PersonnelChangeStatus
  approval_note?: string
  organization_id?: string
  applicant_id?: string
  created_at: string
  approved_at?: string
}

/** 5.4.2 SOP强制节点校验 */
export const checkCaseSOPMandatoryNodes = (caseId: string) => {
  return axios.get<{ passed: boolean; pending_nodes: any[]; violation_detail: string }>(
    `/compliance/case-sop/${caseId}/mandatory-check`,
  )
}

/** 5.4.2 案件状态流转校验 */
export const validateCaseStatusTransition = (caseId: string, targetStatus: string) => {
  return axios.post<{ allowed: boolean; blocked_reason: string }>(
    `/compliance/case/${caseId}/validate-transition`,
    { target_status: targetStatus },
  )
}

/** 5.4.3 案件超期风险台账 */
export const getOverdueCaseRiskLedger = (params?: {
  org_id?: string
  risk_level?: CaseRiskLevel
  handle_status?: CaseCheckHandleStatus
  case_id?: string
}) => {
  return axios.get<any[]>('/compliance/overdue-risk-ledger', { params })
}

/** 5.4.3 超期风险统计概览 */
export const getOverdueRiskStats = (orgId?: string) => {
  return axios.get<{
    total: number
    high: number
    medium: number
    low: number
    pending: number
  }>('/compliance/overdue-risk-stats', { params: { org_id: orgId } })
}

/** 5.4.4 手动触发案件材料巡检 */
export const triggerCaseInspection = () => {
  return axios.post<{ warning_count: number; message: string }>('/compliance/case-inspection/trigger')
}

/** 5.4.4 案件合规检查记录列表 */
export const getCaseComplianceChecks = (params?: {
  org_id?: string
  case_id?: string
  check_type?: CaseCheckType
  check_result?: CaseCheckResult
  risk_level?: CaseRiskLevel
  handle_status?: CaseCheckHandleStatus
}) => {
  return axios.get<CaseComplianceCheck[]>('/compliance/case-compliance-checks', { params })
}

/** 5.4.4 案件合规检查详情 */
export const getCaseComplianceCheckById = (id: string) => {
  return axios.get<CaseComplianceCheck>(`/compliance/case-compliance-checks/${id}`)
}

/** 5.4.4 处理案件合规检查预警 */
export const handleCaseComplianceCheck = (id: string, data: {
  handler_id: string
  handle_status: CaseCheckHandleStatus
  handle_note?: string
}) => {
  return axios.put<CaseComplianceCheck>(`/compliance/case-compliance-checks/${id}/handle`, data)
}

/** 5.4.5 创建人员变更申请 */
export const createPersonnelChangeRequest = (data: {
  case_id: string
  change_type: PersonnelChangeType
  original_person_id?: string
  new_person_id: string
  reason: string
  organization_id?: string
  applicant_id?: string
}) => {
  return axios.post<CasePersonnelChange>('/compliance/personnel-change', data)
}

/** 5.4.5 审批人员变更申请 */
export const approvePersonnelChange = (id: string, data: {
  approver_id: string
  decision: PersonnelChangeStatus.APPROVED | PersonnelChangeStatus.REJECTED
  approval_note?: string
}) => {
  return axios.put<CasePersonnelChange>(`/compliance/personnel-change/${id}/approve`, data)
}

/** 5.4.5 人员变更申请列表 */
export const getPersonnelChanges = (params?: {
  org_id?: string
  case_id?: string
  change_type?: PersonnelChangeType
  status?: PersonnelChangeStatus
  applicant_id?: string
}) => {
  return axios.get<CasePersonnelChange[]>('/compliance/personnel-change', { params })
}

/** 5.4.5 人员变更申请详情 */
export const getPersonnelChangeById = (id: string) => {
  return axios.get<CasePersonnelChange>(`/compliance/personnel-change/${id}`)
}

/** 5.4.5 检查案件是否存在未审批的人员变更 */
export const checkPendingPersonnelChanges = (caseId: string) => {
  return axios.get<{ has_pending: boolean; pending_changes: CasePersonnelChange[] }>(
    `/compliance/personnel-change/${caseId}/pending-check`,
  )
}

// ==================== 5.5 结案归档合规管控 ====================

export enum ArchiveStatus {
  PENDING = 'pending',
  ARCHIVING = 'archiving',
  ARCHIVED = 'archived',
  REJECTED = 'rejected',
}

export interface MaterialChecklistItem {
  name: string
  uploaded: boolean
  file_path?: string
  file_id?: string
  source?: 'document' | 'evidence' | 'manual'
  required: boolean
  description?: string
}

export interface NodeCompletionCheckItem {
  node_id: string
  node_name: string
  is_required: boolean
  completed: boolean
  completed_at?: string
  description?: string
}

export interface ArchiveComplianceCheckResult {
  passed: boolean
  missing_items: string[]
  material_checklist: MaterialChecklistItem[]
  node_completion_check: NodeCompletionCheckItem[]
  evidence_check: {
    total: number
    unclassified: number
    passed: boolean
    detail: string
  }
  case_info?: {
    id: string
    case_no: string
    client_name: string
    case_type: string
    status: string
  }
}

export interface StandardArchivePreview {
  case_id: string
  case_info: {
    id: string
    case_no: string
    client_name: string
    case_type: string
    status: string
    description?: string
    filing_date?: string
    expected_close_date?: string
  }
  generated_at: string
  archive_structure: {
    category: string
    category_name: string
    items: {
      type: string
      type_name: string
      files: {
        id: string
        name: string
        file_path: string
        file_size?: number
        mime_type?: string
        description?: string
        source: 'document' | 'evidence'
        uploaded_at?: string
      }[]
      count: number
    }[]
    total_count: number
  }[]
  total_files: number
}

export interface CaseArchiveExport {
  case_id: string
  case_info: any
  export_time: string
  archive_structure: any[]
  total_files: number
  file_list: {
    id: string
    name: string
    file_path: string
    file_size?: number
    mime_type?: string
    category: string
    category_name: string
    type: string
    type_name: string
    source: 'document' | 'evidence'
    uploaded_at?: string
  }[]
  summary: {
    total_documents: number
    total_evidences: number
    total_files: number
    by_category: { category: string; category_name: string; count: number }[]
  }
}

export interface CaseArchiveRecord {
  id: string
  case_id: string
  archive_status: ArchiveStatus
  archive_path?: string
  archived_by?: string
  archived_at?: string
  reject_reason?: string
  created_at: string
  updated_at: string
  material_checklist: MaterialChecklistItem[]
  node_completion_check: NodeCompletionCheckItem[]
  case_info?: {
    id: string
    case_no: string
    client_name: string
    case_type: string
    status: string
    description?: string
    filing_date?: string
    expected_close_date?: string
  }
}

/** 5.5.2 结案前合规校验 */
export const checkCaseArchiveCompliance = (caseId: string) => {
  return axios.post<ArchiveComplianceCheckResult>(`/compliance/case-archive/${caseId}/check`)
}

/** 5.5.3 生成标准化电子卷宗目录（预览） */
export const previewStandardArchive = (caseId: string) => {
  return axios.get<StandardArchivePreview>(`/compliance/case-archive/${caseId}/preview`)
}

/** 5.5.3 执行归档操作 */
export const archiveCase = (caseId: string, operatorId: string) => {
  return axios.post(`/compliance/case-archive/${caseId}/archive`, { operator_id: operatorId })
}

/** 5.5.3 一键导出电子卷宗 */
export const exportCaseArchive = (caseId: string) => {
  return axios.get<CaseArchiveExport>(`/compliance/case-archive/${caseId}/export`)
}

/** 5.5.4 结案档案检索 */
export const searchCaseArchives = (params?: {
  org_id?: string
  keyword?: string
  archive_status?: ArchiveStatus
  start_date?: string
  end_date?: string
}) => {
  return axios.get<CaseArchiveRecord[]>('/compliance/case-archive', { params })
}

/** 5.5.4 按 case_id 获取归档记录 */
export const getCaseArchiveByCaseId = (caseId: string) => {
  return axios.get<CaseArchiveRecord | null>(`/compliance/case-archive/case/${caseId}`)
}

/** 5.5.4 归档详情 */
export const getCaseArchiveById = (id: string) => {
  return axios.get<CaseArchiveRecord>(`/compliance/case-archive/detail/${id}`)
}
