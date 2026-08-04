#!/bin/bash
# 清理生产数据库中的测试数据
# 使用方式: bash deploy/cleanup-test-data.sh
#
# 原理:
#   1. 测试数据特征: 组织名为'测试律所'，用户手机号13800138000~13800138011
#   2. 保留生产数据: 组织'法智汇律所'，超管15820275356及基础配置
#   3. 按外键依赖顺序删除，先删子表再删父表
#
# 注意: 执行前请先备份数据库!

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========== 清理生产数据库测试数据 ==========${NC}"
echo -e "${RED}警告: 此操作将删除所有测试数据，执行前请确保已备份数据库！${NC}"
echo -e "${YELLOW}确认执行？(输入 yes 继续):${NC}"
read confirm
if [ "$confirm" != "yes" ]; then
  echo "已取消"
  exit 0
fi

# 数据库连接参数（从 .env 读取）
cd "$(dirname "$0")/.."
DB_HOST=$(grep DB_HOST backend/.env | cut -d'=' -f2)
DB_PORT=$(grep DB_PORT backend/.env | cut -d'=' -f2)
DB_USER=$(grep DB_USERNAME backend/.env | cut -d'=' -f2)
DB_PASS=$(grep DB_PASSWORD backend/.env | cut -d'=' -f2)
DB_NAME=$(grep DB_DATABASE backend/.env | cut -d'=' -f2)

export PGPASSWORD="$DB_PASS"

echo -e "${YELLOW}[1/3] 获取测试组织ID...${NC}"
TEST_ORG_ID=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT id FROM organizations WHERE name = '测试律所';" | xargs)

if [ -z "$TEST_ORG_ID" ]; then
  echo -e "${GREEN}未找到测试律所，无需清理${NC}"
  exit 0
fi

echo -e "${GREEN}测试律所ID: $TEST_ORG_ID${NC}"

echo -e "${YELLOW}[2/3] 删除测试业务数据（按依赖顺序）...${NC}"

# 按外键依赖顺序删除，先删子表再删父表
# 使用事务确保原子性
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
BEGIN;

-- 获取测试用户ID集合
CREATE TEMP TABLE _test_users AS
SELECT id FROM users WHERE organization_id = '${TEST_ORG_ID}';
CREATE TEMP TABLE _test_cases AS
SELECT id FROM cases WHERE organization_id = '${TEST_ORG_ID}';
CREATE TEMP TABLE _test_leads AS
SELECT id FROM leads WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 1. 客户端模块 ============
DELETE FROM case_push_notifications WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM client_consultations WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM service_ratings WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM client_archives WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM client_profiles WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 2. SCRM模块 ============
DELETE FROM scrm_client_tag_relations WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM scrm_client_tags WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM scrm_chat_archives WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM scrm_channel_trackings WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM scrm_reach_tasks WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM scrm_live_codes WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM scrm_script_libraries WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 3. 线索/商机模块 ============
DELETE FROM opportunity_quote_items WHERE opportunity_id IN (SELECT id FROM opportunities WHERE organization_id = '${TEST_ORG_ID}');
DELETE FROM opportunity_stage_logs WHERE opportunity_id IN (SELECT id FROM opportunities WHERE organization_id = '${TEST_ORG_ID}');
DELETE FROM opportunity_sop_progress WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM talk_sops WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM opportunities WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM lead_assignment_logs WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM lead_assignments WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM lead_pool WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM invite_tasks WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM handover_logs WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM follow_ups WHERE lead_id IN (SELECT id FROM _test_leads);
DELETE FROM leads WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 4. 案件模块 ============
DELETE FROM case_task_comments WHERE case_task_id IN (SELECT id FROM case_tasks WHERE organization_id = '${TEST_ORG_ID}');
DELETE FROM case_tasks WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM case_warnings WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM case_sop_templates WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM case_sop WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM case_personnel_changes WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM case_compliance_checks WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM case_archives WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM conflict_checks WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM evidences WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM legal_documents WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM documents WHERE case_id IN (SELECT id FROM _test_cases);
DELETE FROM archive_volumes WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM cases WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 5. 合规模块 ============
DELETE FROM compliance_check_results WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM compliance_records WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM compliance_rules WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM finance_compliance_checks WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM talk_quality_checks WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM contract_templates WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM complaint_tickets WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM complaints WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM marketing_contents WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM sales_compliance WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM signing_compliance WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM risk_disclosures WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM lawyer_qualifications WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 6. 营销模块 ============
DELETE FROM ad_account_warnings WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM ad_plan_logs WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM ad_materials WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM ad_plans WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM ad_accounts WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM conversion_events WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM digital_human_lives WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM marketing_materials WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM marketing_social_posts WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM social_accounts WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM content_templates WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 7. 财务模块 ============
DELETE FROM business_funds WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM case_costs WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM commission_records WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM commission_rules WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM overdue_warnings WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM payment_records WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM payment_reminders WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM profit_shares WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM receivables WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM reconciliations WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM refunds WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM invoices WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM fees WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 8. 合同模块 ============
DELETE FROM contract_stages WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM contracts WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 9. 印章模块 ============
DELETE FROM seal_records WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM seal_applications WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM seals WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 10. 审批模块 ============
DELETE FROM approval_steps WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM approval_flows WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM approval_requests WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 11. 人事模块 ============
DELETE FROM hr_activity_registrations WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM hr_activities WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM hr_attendances WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM hr_leaves WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM hr_material_requisitions WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 12. 社交动态模块 ============
DELETE FROM social_comments WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM social_likes WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM social_posts WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 13. 日程模块 ============
DELETE FROM schedule_participants WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM meeting_room_bookings WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM meeting_rooms WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM schedules WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 14. 其他模块 ============
DELETE FROM document_items WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM internal_projects WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM due_diligences WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM bids WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM bid_records WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM diagrams WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM worklogs WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM tasks WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM knowledge_articles WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM case_precedents WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM law_regulations WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM report_export_logs WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM report_templates WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM mails WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM property_preservation WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM audit_logs WHERE organization_id = '${TEST_ORG_ID}';

-- ============ 15. 通知 ============
DELETE FROM notifications WHERE user_id IN (SELECT id FROM _test_users);

-- ============ 16. 最后删除测试用户和组织 ============
DELETE FROM users WHERE organization_id = '${TEST_ORG_ID}';
DELETE FROM organizations WHERE id = '${TEST_ORG_ID}';

COMMIT;
EOF

echo -e "${GREEN}测试数据清理完成${NC}"

echo -e "${YELLOW}[3/3] 验证清理结果...${NC}"
REMAINING=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM organizations WHERE name = '测试律所';" | xargs)
echo -e "测试律所剩余: ${REMAINING}"

REMAINING_USERS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users WHERE phone LIKE '1380013%';" | xargs)
echo -e "测试用户剩余: ${REMAINING_USERS}"

PROD_ORG=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT name FROM organizations WHERE name = '法智汇律所';" | xargs)
echo -e "生产组织状态: ${PROD_ORG}"

PROD_ADMIN=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT phone FROM users WHERE phone = '15820275356';" | xargs)
echo -e "生产超管状态: ${PROD_ADMIN}"

echo -e "${GREEN}========== 清理完成 ==========${NC}"
