"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintStatus = exports.ComplaintType = exports.FeeRole = exports.ComplianceResult = exports.ComplianceType = exports.CaseStatus = exports.CaseType = exports.LeadStatus = exports.LeadSource = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["ORG_ADMIN"] = "org_admin";
    UserRole["MARKETING"] = "marketing";
    UserRole["SALES"] = "sales";
    UserRole["LAWYER"] = "lawyer";
    UserRole["ASSISTANT"] = "assistant";
    UserRole["FINANCE"] = "finance";
    UserRole["CLIENT"] = "client";
})(UserRole || (exports.UserRole = UserRole = {}));
var LeadSource;
(function (LeadSource) {
    LeadSource["DOUYIN"] = "douyin";
    LeadSource["BAIDU"] = "baidu";
    LeadSource["KUAISHOU"] = "kuaishou";
    LeadSource["WECHAT"] = "wechat";
    LeadSource["OTHER"] = "other";
})(LeadSource || (exports.LeadSource = LeadSource = {}));
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["NEW"] = "new";
    LeadStatus["PENDING_FOLLOW"] = "pending_follow";
    LeadStatus["FOLLOWING"] = "following";
    LeadStatus["INVITING"] = "inviting";
    LeadStatus["NEGOTIATING"] = "negotiating";
    LeadStatus["PENDING_SIGN"] = "pending_sign";
    LeadStatus["LOST"] = "lost";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
var CaseType;
(function (CaseType) {
    CaseType["MARRIAGE"] = "marriage";
    CaseType["TRAFFIC"] = "traffic";
    CaseType["LABOR"] = "labor";
    CaseType["DEBT"] = "debt";
    CaseType["OTHER"] = "other";
})(CaseType || (exports.CaseType = CaseType = {}));
var CaseStatus;
(function (CaseStatus) {
    CaseStatus["PENDING_ASSIGN"] = "pending_assign";
    CaseStatus["PROCESSING"] = "processing";
    CaseStatus["FILING"] = "filing";
    CaseStatus["EVIDENCE"] = "evidence";
    CaseStatus["HEARING"] = "hearing";
    CaseStatus["APPEAL"] = "appeal";
    CaseStatus["PENDING_CLOSE"] = "pending_close";
    CaseStatus["CLOSED"] = "closed";
})(CaseStatus || (exports.CaseStatus = CaseStatus = {}));
var ComplianceType;
(function (ComplianceType) {
    ComplianceType["MARKETING"] = "marketing";
    ComplianceType["SALES"] = "sales";
    ComplianceType["CASE"] = "case";
    ComplianceType["FINANCE"] = "finance";
})(ComplianceType || (exports.ComplianceType = ComplianceType = {}));
var ComplianceResult;
(function (ComplianceResult) {
    ComplianceResult["PASS"] = "pass";
    ComplianceResult["WARNING"] = "warning";
    ComplianceResult["REJECT"] = "reject";
})(ComplianceResult || (exports.ComplianceResult = ComplianceResult = {}));
var FeeRole;
(function (FeeRole) {
    FeeRole["ORG"] = "org";
    FeeRole["LAWYER"] = "lawyer";
    FeeRole["SALES"] = "sales";
    FeeRole["MARKETING"] = "marketing";
    FeeRole["ASSISTANT"] = "assistant";
})(FeeRole || (exports.FeeRole = FeeRole = {}));
var ComplaintType;
(function (ComplaintType) {
    ComplaintType["SERVICE_QUALITY"] = "service_quality";
    ComplaintType["FEE_ISSUE"] = "fee_issue";
    ComplaintType["OTHER"] = "other";
})(ComplaintType || (exports.ComplaintType = ComplaintType = {}));
var ComplaintStatus;
(function (ComplaintStatus) {
    ComplaintStatus["NEW"] = "new";
    ComplaintStatus["ACCEPTED"] = "accepted";
    ComplaintStatus["PROCESSING"] = "processing";
    ComplaintStatus["REVIEWING"] = "reviewing";
    ComplaintStatus["CLOSED"] = "closed";
})(ComplaintStatus || (exports.ComplaintStatus = ComplaintStatus = {}));
//# sourceMappingURL=index.js.map