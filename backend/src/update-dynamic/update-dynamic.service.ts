import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from '../case/case.entity';
import { Contract } from '../contract/contract.entity';
import { PaymentRecord } from '../finance/payment-record.entity';
import { SealApplication } from '../seal/seal-application.entity';
import { ApprovalRequest } from '../approval/approval-request.entity';
import { Worklog } from '../worklog/worklog.entity';

// 更新动态：聚合各业务模块的最新变更，生成全所业务动态时间线
@Injectable()
export class UpdateDynamicService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(PaymentRecord)
    private paymentRecordRepository: Repository<PaymentRecord>,
    @InjectRepository(SealApplication)
    private sealApplicationRepository: Repository<SealApplication>,
    @InjectRepository(ApprovalRequest)
    private approvalRequestRepository: Repository<ApprovalRequest>,
    @InjectRepository(Worklog)
    private worklogRepository: Repository<Worklog>,
  ) {}

  // 获取业务动态时间线
  async getFeed(orgId: string, params: { limit?: number; type?: string } = {}): Promise<any> {
    const limit = Math.min(Number(params.limit) || 50, 200);
    const feed: any[] = [];

    // 1. 案件动态：新建案件
    if (!params.type || params.type === 'case') {
      const cases = await this.caseRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.assignee_lawyer', 'lawyer')
        .where('c.organization_id = :orgId', { orgId })
        .orderBy('c.created_at', 'DESC')
        .take(limit)
        .getMany();
      for (const c of cases) {
        feed.push({
          id: `case-${c.id}`,
          type: 'case',
          action: '新建案件',
          title: c.case_name || c.client_name || '未命名案件',
          description: `案号：${c.case_no || '-'}，客户：${c.client_name || '-'}`,
          user_name: c.assignee_lawyer?.real_name || c.handler || '',
          created_at: c.created_at,
          link: `/cases/${c.id}`,
        });
      }
    }

    // 2. 合同动态：新建合同
    if (!params.type || params.type === 'contract') {
      const contracts = await this.contractRepository
        .createQueryBuilder('ct')
        .where('ct.organization_id = :orgId', { orgId })
        .orderBy('ct.created_at', 'DESC')
        .take(limit)
        .getMany();
      for (const ct of contracts) {
        feed.push({
          id: `contract-${ct.id}`,
          type: 'contract',
          action: '新增合同',
          title: ct.title,
          description: `合同编号：${ct.contract_no || '-'}，客户：${ct.client_name || '-'}`,
          user_name: '',
          created_at: ct.created_at,
          link: ct.case_id ? `/cases/${ct.case_id}` : '/contracts',
        });
      }
    }

    // 3. 收款动态：登记收款
    if (!params.type || params.type === 'payment') {
      const payments = await this.paymentRecordRepository
        .createQueryBuilder('pr')
        .leftJoin(Case, 'c', 'c.id = pr.case_id')
        .addSelect('c.case_name', 'case_name_value')
        .addSelect('c.case_no', 'case_no_value')
        .addSelect('c.client_name', 'client_name_value')
        .where('c.organization_id = :orgId', { orgId })
        .orderBy('pr.created_at', 'DESC')
        .take(limit)
        .getRawAndEntities();
      for (const raw of payments.raw) {
        feed.push({
          id: `payment-${raw.pr_id || ''}`,
          type: 'payment',
          action: '登记收款',
          title: raw.case_name_value || raw.client_name_value || '案件收款',
          description: `收款金额：¥${Number(raw.pr_amount || 0).toLocaleString()}，案件编号：${raw.case_no_value || '-'}`,
          user_name: '',
          created_at: raw.pr_created_at,
          link: raw.pr_case_id ? `/cases/${raw.pr_case_id}` : '/finance/project-collection',
        });
      }
    }

    // 4. 用印动态：用印申请
    if (!params.type || params.type === 'seal') {
      const seals = await this.sealApplicationRepository.find({
        where: { organization_id: orgId },
        order: { created_at: 'DESC' },
        take: limit,
      });
      for (const s of seals) {
        feed.push({
          id: `seal-${s.id}`,
          type: 'seal',
          action: '用印申请',
          title: s.document_name,
          description: `用途：${s.purpose || '-'}，状态：${this.sealStatusLabel(s.status)}`,
          user_name: '',
          created_at: s.created_at,
          link: s.case_id ? `/cases/${s.case_id}` : '/seals',
        });
      }
    }

    // 5. 审批动态：发起审批
    if (!params.type || params.type === 'approval') {
      const approvals = await this.approvalRequestRepository
        .createQueryBuilder('r')
        .leftJoinAndSelect('r.applicant', 'applicant')
        .where('r.organization_id = :orgId', { orgId })
        .orderBy('r.created_at', 'DESC')
        .take(limit)
        .getMany();
      for (const r of approvals) {
        feed.push({
          id: `approval-${r.id}`,
          type: 'approval',
          action: '发起审批',
          title: r.title,
          description: `类型：${this.approvalTypeLabel(r.type)}`,
          user_name: r.applicant?.real_name || '',
          created_at: r.created_at,
          link: '/approval-center',
        });
      }
    }

    // 6. 工作日志动态：提交/通过
    if (!params.type || params.type === 'worklog') {
      const worklogs = await this.worklogRepository
        .createQueryBuilder('w')
        .leftJoin(Case, 'c', 'c.id = w.case_id')
        .addSelect('c.case_name', 'log_case_name')
        .where('w.organization_id = :orgId', { orgId })
        .andWhere("w.status != 'draft'")
        .orderBy('w.updated_at', 'DESC')
        .take(limit)
        .getRawAndEntities();
      for (const raw of worklogs.raw) {
        feed.push({
          id: `worklog-${raw.w_id || ''}`,
          type: 'worklog',
          action: raw.w_status === 'approved' ? '日志已通过' : '提交工作日志',
          title: `${raw.w_work_date || '-'} 工作日志`,
          description: `工时：${raw.w_work_hours || 0}h，内容：${(raw.w_content || '').slice(0, 50)}`,
          user_name: '',
          created_at: raw.w_updated_at,
          link: '/worklogs',
        });
      }
    }

    // 按时间倒序合并
    feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return feed.slice(0, limit);
  }

  private sealStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: '待审批',
      approved: '已通过',
      rejected: '已驳回',
      used: '已盖章',
      voided: '已作废',
    };
    return map[status] || status;
  }

  private approvalTypeLabel(type: string): string {
    const map: Record<string, string> = {
      seal: '用印审批',
      case: '立案审批',
      contract: '合同审批',
      finance: '财务审批',
      other: '其他审批',
    };
    return map[type] || type;
  }
}
