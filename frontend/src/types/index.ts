export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  MARKETING = 'marketing',
  SALES = 'sales',
  LAWYER = 'lawyer',
  ASSISTANT = 'assistant',
  FINANCE = 'finance',
  CLIENT = 'client',
}

export enum LeadSource {
  DOUYIN = 'douyin',
  BAIDU = 'baidu',
  KUAISHOU = 'kuaishou',
  WECHAT = 'wechat',
  OTHER = 'other',
}

export enum LeadStatus {
  NEW = 'new',
  PENDING_FOLLOW = 'pending_follow',
  FOLLOWING = 'following',
  INVITING = 'inviting',
  NEGOTIATING = 'negotiating',
  PENDING_SIGN = 'pending_sign',
  LOST = 'lost',
}

export enum CaseType {
  MARRIAGE = 'marriage',
  TRAFFIC = 'traffic',
  LABOR = 'labor',
  DEBT = 'debt',
  OTHER = 'other',
}

export enum CaseStatus {
  PENDING_ASSIGN = 'pending_assign',
  PROCESSING = 'processing',
  FILING = 'filing',
  EVIDENCE = 'evidence',
  HEARING = 'hearing',
  APPEAL = 'appeal',
  PENDING_CLOSE = 'pending_close',
  CLOSED = 'closed',
}

export enum ComplianceType {
  MARKETING = 'marketing',
  SALES = 'sales',
  CASE = 'case',
  FINANCE = 'finance',
}

export enum ComplianceResult {
  PASS = 'pass',
  WARNING = 'warning',
  REJECT = 'reject',
}

export enum ComplaintType {
  SERVICE_QUALITY = 'service_quality',
  FEE_ISSUE = 'fee_issue',
  OTHER = 'other',
}

export enum ComplaintStatus {
  NEW = 'new',
  ACCEPTED = 'accepted',
  PROCESSING = 'processing',
  REVIEWING = 'reviewing',
  CLOSED = 'closed',
}

// ==================== 邀约相关 ====================
export enum InviteMethod {
  PHONE = 'phone',
  WECHAT = 'wechat',
}

export enum InviteTaskStatus {
  PENDING = 'pending',
  INVITED = 'invited',
  ARRIVED = 'arrived',
  NOT_ARRIVED = 'not_arrived',
}

export enum InviteResult {
  SUCCESS = 'success',
  INVALID = 'invalid',
  NO_INTENTION = 'no_intention',
  FOLLOW_UP = 'follow_up',
}

export interface Lead {
  id: string
  source_channel: string
  source_keyword?: string
  case_type?: string
  status: string
  assign_sales_id?: string
  phone: string
  contact_name?: string
  case_description?: string
  created_at: string
  organization_id: string
}

export interface InviteTask {
  id: string
  lead_id: string
  inviter_id: string
  invite_method: InviteMethod
  scheduled_time?: string
  status: InviteTaskStatus
  result?: InviteResult
  result_note?: string
  recording_url?: string
  call_duration?: number
  created_at: string
  updated_at: string
  lead?: Lead
}

// ==================== 商机相关 ====================
export enum OpportunityStage {
  FIRST_CONTACT = 'first_contact',
  REQUIREMENT_CONFIRM = 'requirement_confirm',
  QUOTE_SENT = 'quote_sent',
  FOLLOWING_UP = 'following_up',
  SIGNED = 'signed',
  LOST = 'lost',
}

export enum OpportunityStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export interface OpportunityQuoteItem {
  id: string
  opportunity_id: string
  item_name: string
  item_description?: string
  amount: number
  quantity: number
  remark?: string
  created_at: string
  updated_at: string
}

export interface Opportunity {
  id: string
  lead_id: string
  negotiator_id: string
  stage: OpportunityStage
  quote_amount?: number
  actual_amount?: number
  status: OpportunityStatus
  requirement_note?: string
  plan_note?: string
  quote_items?: OpportunityQuoteItem[]
  stage_logs?: any[]
  created_at: string
  updated_at: string
  lead?: Lead
}

// ==================== 谈案SOP相关 ====================
export enum TalkSOPNodeType {
  INFO_INPUT = 'info_input',
  MATERIAL_UPLOAD = 'material_upload',
  COMPLIANCE_CHECK = 'compliance_check',
  SIGNATURE_CONFIRM = 'signature_confirm',
}

export enum SOPNodeStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export interface TalkSOPNode {
  node_id: string
  node_name: string
  node_type: TalkSOPNodeType
  is_required: boolean
  order: number
  description?: string
}

export interface TalkSOP {
  id: string
  name: string
  case_type?: string
  nodes: string
  is_default: boolean
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface OpportunitySOPProgress {
  sop: TalkSOP | null
  progress: Array<TalkSOPNode & {
    status: SOPNodeStatus
    completed_at: string | null
    completed_by: string | null
    completed_by_name: string | null
  }>
  completion_percentage: number
  has_incomplete_required_nodes: boolean
}

// ==================== 案件预警相关 ====================
export enum WarningType {
  EVIDENCE_PERIOD = 'evidence_period',
  APPEAL_PERIOD = 'appeal_period',
  HEARING_DATE = 'hearing_date',
  PRESERVATION_EXPIRE = 'preservation_expire',
  STATUTE_EXPIRE = 'statute_expire',
  PAYMENT_DEADLINE = 'payment_deadline',
  OTHER = 'other',
}

export enum WarningLevel {
  REMINDER = 'reminder',
  WARNING = 'warning',
  URGENT = 'urgent',
}

export enum WarningStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  OVERDUE = 'overdue',
}

export interface CaseWarning {
  id: string
  case_id: string
  warning_type: WarningType
  warning_level: WarningLevel
  warning_date: string
  target_date: string
  status: WarningStatus
  handler_id?: string
  handle_note?: string
  description?: string
  advance_days: number
  handled_at?: string
  created_at: string
  updated_at: string
}

// ==================== 证据相关 ====================
export enum EvidenceType {
  CONTRACT = 'contract',
  EVIDENCE = 'evidence',
  DOCUMENT = 'document',
  OTHER = 'other',
}

export enum EvidenceCategory {
  PLAINTIFF = 'plaintiff',
  DEFENDANT = 'defendant',
  COURT = 'court',
  OTHER = 'other',
}

export interface Evidence {
  id: string
  name: string
  type: EvidenceType
  category: EvidenceCategory
  file_path: string
  file_size?: number
  mime_type?: string
  description?: string
  version: number
  is_archived: boolean
  case_id: string
  upload_by_id: string
  parent_evidence_id?: string
  versions?: Evidence[]
  upload_at: string
  updated_at: string
}

// ==================== 交接相关 ====================
export enum HandoverType {
  TRANSFER = 'transfer',
  RESIGNATION = 'resignation',
  BATCH = 'batch',
}

export enum HandoverStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

// ==================== 公海池相关 ====================
export enum RecycleReason {
  TIMEOUT = 'timeout',
  MANUAL = 'manual',
  INVALID = 'invalid',
}

export enum LeadPoolStatus {
  AVAILABLE = 'available',
  TAKEN = 'taken',
  DISCARDED = 'discarded',
}

// ==================== 分配规则 ====================
export enum AssignmentRuleType {
  REGION = 'region',
  CASE_TYPE = 'case_type',
  LOAD_BALANCE = 'load_balance',
}

// ==================== 办案SOP模板 ====================
export interface CaseTaskTemplate {
  task_id: string
  task_name: string
  responsible_role: string
  deadline_days: number
  is_required: boolean
  description?: string
}

export interface CaseSOPStage {
  stage_id: string
  stage_name: string
  order: number
  tasks: CaseTaskTemplate[]
}

export interface CaseSOPTemplate {
  id: string
  name: string
  case_type: CaseType
  stages: CaseSOPStage[]
  is_default: boolean
  enabled: boolean
  description?: string
  organization_id?: string
  created_at: string
  updated_at: string
}
