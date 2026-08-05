// 补充测试环境数据：bid_records审核数据 + 探查剩余表结构
const Database = require('better-sqlite3');
const db = new Database('./fazhihui.sqlite');

// 探查 leads/opportunities/payment_records 实际列名
console.log('========== 探查剩余表结构 ==========');
for (const t of ['leads', 'opportunities', 'payment_records', 'ad_plan_logs']) {
  const cols = db.prepare(`PRAGMA table_info(${t})`).all();
  console.log(`【${t}】列: ${cols.map(c => c.name).join(', ')}`);
}

// 补充 bid_records 审核数据：将部分 pending 改为 approved/rejected
console.log('\n========== 补充 bid_records 审核数据 ==========');
const orgAdmin = db.prepare("SELECT id FROM users WHERE role = 'org_admin' OR role = 'super_admin' LIMIT 1").get();
console.log('审核人:', JSON.stringify(orgAdmin));

const pendingBids = db.prepare("SELECT id FROM bid_records WHERE status = 'pending'").all();
console.log(`待审核记录: ${pendingBids.length}条`);

// 前8条改为 approved，后4条改为 rejected
const updateApproved = db.prepare(`UPDATE bid_records SET status='approved', audited_by=?, audited_at=datetime('now','-'||?||' days'), audit_comment='审核通过，材料齐全' WHERE id=?`);
const updateRejected = db.prepare(`UPDATE bid_records SET status='rejected', audited_by=?, audited_at=datetime('now','-'||?||' days'), audit_comment='材料不完整，请补充' WHERE id=?`);

let approvedCnt = 0, rejectedCnt = 0;
pendingBids.forEach((b, i) => {
  const daysAgo = (i % 20) + 1;
  if (i < 8) {
    updateApproved.run(orgAdmin.id, daysAgo, b.id);
    approvedCnt++;
  } else if (i < 12) {
    updateRejected.run(orgAdmin.id, daysAgo, b.id);
    rejectedCnt++;
  }
});
console.log(`已审核: approved=${approvedCnt}, rejected=${rejectedCnt}`);

// 验证结果
const result = db.prepare("SELECT status, COUNT(*) as c FROM bid_records GROUP BY status").all();
console.log('审核后分布:', JSON.stringify(result));

db.close();
console.log('\n补充完成');
