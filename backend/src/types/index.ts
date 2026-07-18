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
