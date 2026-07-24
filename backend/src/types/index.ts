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

export enum FeeRole {
  ORG = 'org',
  LAWYER = 'lawyer',
  SALES = 'sales',
  MARKETING = 'marketing',
  ASSISTANT = 'assistant',
}

export enum ComplaintType {
  SERVICE_QUALITY = 'service_quality',
  FEE_ISSUE = 'fee_issue',
  PROGRESS = 'progress',
  RESULT = 'result',
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
}

// ==================== 商机相关 ====================
export enum OpportunityStage {
  FIRST_CONTACT = 'first_contact',
  SIGNED = 'signed',
  LOST = 'lost',
}

export enum OpportunityStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

// ==================== 案件预警相关 ====================
export enum WarningType {
  EVIDENCE_PERIOD = 'evidence_period',
  APPEAL_PERIOD = 'appeal_period',
  HEARING_DATE = 'hearing_date',
  PRESERVATION_EXPIRE = 'preservation_expire',
  STATUTE_EXPIRE = 'statute_expire',
  PAYMENT_DEADLINE = 'payment_deadline',
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

// ==================== 营销投放相关 ====================
export enum AdPlatform {
  DOUYIN = 'douyin',
  BAIDU = 'baidu',
  TENCENT = 'tencent',
  KUAISHOU = 'kuaishou',
}

export enum AdAccountStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  UNAUTHORIZED = 'unauthorized',
}

export enum AdAccountWarningStatus {
  PENDING = 'pending',
  NOTIFIED = 'notified',
  RESOLVED = 'resolved',
}

export enum AdMaterialType {
  IMAGE = 'image',
  VIDEO = 'video',
  ARTICLE = 'article',
  SCRIPT = 'script',
}

export enum AdMaterialStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export enum MaterialComplianceStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  NEED_MODIFICATION = 'need_modification',
  FORBIDDEN = 'forbidden',
}

export enum ContentCaseType {
  MARRIAGE = 'marriage',
  TRAFFIC = 'traffic',
  LABOR = 'labor',
  DEBT = 'debt',
  OTHER = 'other',
}

export enum ContentTypeEnum {
  VIDEO_SCRIPT = 'video_script',
  COPYWRITING = 'copywriting',
  LIVE_SCRIPT = 'live_script',
  ARTICLE = 'article',
}

export enum AdPlanStatus {
  RUNNING = 'running',
  PAUSED = 'paused',
  ENDED = 'ended',
}

export enum AdPlanOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  START = 'start',
  PAUSE = 'pause',
  END = 'end',
  BUDGET_ADJUST = 'budget_adjust',
  BID_ADJUST = 'bid_adjust',
  COPY = 'copy',
  MIGRATE = 'migrate',
}

export enum AdChannel {
  DOUYIN = 'douyin',
  BAIDU = 'baidu',
  KUAISHOU = 'kuaishou',
  WECHAT = 'wechat',
  OTHER = 'other',
}

export enum ConversionEventType {
  LEAD = 'lead',
  WECHAT_ADD = 'wechat_add',
  INVITE = 'invite',
  SIGN = 'sign',
}

// ==================== 公域账号相关 ====================
export enum SocialPlatform {
  DOUYIN = 'douyin',
  KUAISHOU = 'kuaishou',
  WECHAT_VIDEO = 'wechat_video',
  WECHAT_OFFICIAL = 'wechat_official',
}

export enum SocialAuthStatus {
  AUTHORIZED = 'authorized',
  UNAUTHORIZED = 'unauthorized',
  EXPIRED = 'expired',
}

export enum SocialPostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed',
}
