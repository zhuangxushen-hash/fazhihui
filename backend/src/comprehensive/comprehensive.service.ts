import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Case } from '../case/case.entity';
import { Lead } from '../lead/lead.entity';
import { Contract } from '../contract/contract.entity';
import { Invoice } from '../finance/invoice.entity';
import { ApprovalRequest } from '../approval/approval-request.entity';
import { ClientProfile } from '../client/client-profile.entity';
import { DocumentItem } from '../document/document.entity';

@Injectable()
export class ComprehensiveService {
  constructor(
    @InjectRepository(Case)
    private readonly caseRepository: Repository<Case>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(ApprovalRequest)
    private readonly approvalRepository: Repository<ApprovalRequest>,
    @InjectRepository(ClientProfile)
    private readonly clientProfileRepository: Repository<ClientProfile>,
    @InjectRepository(DocumentItem)
    private readonly documentItemRepository: Repository<DocumentItem>,
  ) {}

  // 综合查询入口：按 type 路由到不同的数据源
  async query(params: {
    organization_id: string;
    type: string;
    page?: number;
    pageSize?: number;
    keyword?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{ list: any[]; total: number; page: number; pageSize: number }> {
    const page = Number(params.page) > 0 ? Number(params.page) : 1;
    const pageSize = Number(params.pageSize) > 0 ? Number(params.pageSize) : 10;
    const where: any = {};
    if (params.organization_id) {
      where.organization_id = params.organization_id;
    }
    if (params.keyword) {
      where.name = Like(`%${params.keyword}%`);
    }
    if (params.date_from) {
      where.created_at = MoreThanOrEqual(new Date(params.date_from));
    }
    if (params.date_to) {
      where.created_at = LessThanOrEqual(new Date(params.date_to));
    }
    if (params.date_from && params.date_to) {
      where.created_at = Between(new Date(params.date_from), new Date(params.date_to));
    }

    let repo: Repository<any> | null = null;
    let extraWhere: any = {};

    switch (params.type) {
      case 'biz-established':
        // 查询已立项目：从 cases 表查 stage != 'intake' 的案件
        repo = this.caseRepository;
        extraWhere = { stage: () => "stage != 'intake'" };
        break;
      case 'biz-reported':
        // 查询已报备案源：从 leads 表查 status='pending_sign' 或 conversion_status='converted'
        repo = this.leadRepository;
        // 由于 status 和 conversion_status 是 OR 关系，使用 query builder 处理
        return this.queryLeadsReported(params, page, pageSize);
      case 'biz-signed':
        // 查询已签约单位：从 client_profiles 表查
        repo = this.clientProfileRepository;
        break;
      case 'doc-approved':
        // 查询已批文档：从 documents 表查（使用 document_items 表）
        repo = this.documentItemRepository;
        break;
      case 'contract-expected':
        // 查询合同约定收款：从 contracts 表查
        repo = this.contractRepository;
        break;
      case 'contract-invoiced':
        // 查询已开票未收款：从 invoices 表查 status != 'paid'
        repo = this.invoiceRepository;
        // 通过 query builder 处理 != 条件
        return this.queryInvoicesUnpaid(params, page, pageSize);
      case 'data-approval':
        // 查询审批记录：从 approval_requests 表查
        repo = this.approvalRepository;
        break;
      default:
        // 其他type返回空数组
        return { list: [], total: 0, page, pageSize };
    }

    const finalWhere = { ...where, ...extraWhere };
    // extraWhere 使用对象字面量会有问题，单独处理 stage 字段
    const queryWhere: any = { ...where };
    if (params.type === 'biz-established') {
      // 已立项目：stage 不为 intake
      const [list, total] = await repo
        .createQueryBuilder('entity')
        .where('entity.organization_id = :orgId', { orgId: params.organization_id })
        .andWhere('entity.stage != :stage', { stage: 'intake' })
        .andWhere(params.keyword ? '(entity.case_no LIKE :kw OR entity.client_name LIKE :kw)' : '1=1', { kw: `%${params.keyword}%` })
        .orderBy('entity.updated_at', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();
      return { list, total, page, pageSize };
    }

    const [list, total] = await repo.findAndCount({
      where: queryWhere,
      order: { updated_at: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  // 查询已报备案源：status='pending_sign' 或 conversion_status='converted'
  private async queryLeadsReported(
    params: { organization_id: string; keyword?: string; date_from?: string; date_to?: string },
    page: number,
    pageSize: number,
  ): Promise<{ list: any[]; total: number; page: number; pageSize: number }> {
    const qb = this.leadRepository.createQueryBuilder('lead');
    qb.where('lead.organization_id = :orgId', { orgId: params.organization_id });
    qb.andWhere(
      '(lead.status = :status OR lead.conversion_status = :conversionStatus)',
      { status: 'pending_sign', conversionStatus: 'converted' },
    );
    if (params.keyword) {
      qb.andWhere('lead.contact_name LIKE :kw', { kw: `%${params.keyword}%` });
    }
    if (params.date_from) {
      qb.andWhere('lead.created_at >= :dateFrom', { dateFrom: new Date(params.date_from) });
    }
    if (params.date_to) {
      qb.andWhere('lead.created_at <= :dateTo', { dateTo: new Date(params.date_to) });
    }
    qb.orderBy('lead.updated_at', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  // 查询已开票未收款：status != 'paid'
  private async queryInvoicesUnpaid(
    params: { organization_id: string; keyword?: string; date_from?: string; date_to?: string },
    page: number,
    pageSize: number,
  ): Promise<{ list: any[]; total: number; page: number; pageSize: number }> {
    const qb = this.invoiceRepository.createQueryBuilder('inv');
    qb.where('inv.organization_id = :orgId', { orgId: params.organization_id });
    qb.andWhere('inv.status != :paid', { paid: 'paid' });
    if (params.keyword) {
      qb.andWhere('inv.invoice_no LIKE :kw', { kw: `%${params.keyword}%` });
    }
    if (params.date_from) {
      qb.andWhere('inv.created_at >= :dateFrom', { dateFrom: new Date(params.date_from) });
    }
    if (params.date_to) {
      qb.andWhere('inv.created_at <= :dateTo', { dateTo: new Date(params.date_to) });
    }
    qb.orderBy('inv.updated_at', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }
}
