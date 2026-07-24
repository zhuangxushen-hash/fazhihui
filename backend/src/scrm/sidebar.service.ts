import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../lead/lead.entity';
import { FollowUp } from '../lead/follow-up.entity';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { ClientTagService } from './client-tag.service';

@Injectable()
export class SidebarService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(FollowUp)
    private followUpRepository: Repository<FollowUp>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private clientTagService: ClientTagService,
  ) {}

  /**
   * 客户全景档案聚合接口
   * 聚合: 客户基本信息 + 标签 + 跟进记录 + 来源 + 案件
   * 通过 phone 关联 lead, 通过 client_id 关联 case
   */
  async getClientProfile(clientId: string, phone?: string): Promise<any> {
    // 1. 通过手机号找 Lead(来源渠道)
    let lead: Lead | null = null;
    if (phone) {
      lead = await this.leadRepository.findOne({ where: { phone } });
    }
    if (!lead) {
      // 尝试用 client_id 当作 lead_id
      lead = await this.leadRepository.findOne({ where: { id: clientId } as any });
    }

    // 2. 通过 client_id 找案件
    const cases = await this.caseRepository.find({
      where: { client_id: clientId },
      order: { created_at: 'DESC' },
    });

    // 3. 通过 lead_id 找跟进记录
    let followUps: FollowUp[] = [];
    if (lead) {
      followUps = await this.followUpRepository.find({
        where: { lead_id: lead.id },
        order: { created_at: 'DESC' },
        take: 20,
      });
    }

    // 4. 查询标签
    const tags = await this.clientTagService.getClientTags(clientId);

    // 5. 销售人员信息
    let salesUser: User | null = null;
    if (lead?.assign_sales_id) {
      salesUser = await this.userRepository.findOne({ where: { id: lead.assign_sales_id } });
    }

    return {
      client_id: clientId,
      phone: phone || lead?.phone || null,
      contact_name: lead?.contact_name || null,
      source_channel: lead?.source_channel || null,
      source_keyword: lead?.source_keyword || null,
      case_type: lead?.case_type || null,
      lead_status: lead?.status || null,
      case_description: lead?.case_description || null,
      sales_user: salesUser
        ? { id: salesUser.id, real_name: salesUser.real_name, phone: salesUser.phone }
        : null,
      tags,
      follow_ups: followUps,
      cases: cases.map(c => ({
        id: c.id,
        case_no: c.case_no,
        case_type: c.case_type,
        status: c.status,
        amount: c.amount,
        service_fee: c.service_fee,
        court: c.court,
        filing_date: c.filing_date,
        created_at: c.created_at,
      })),
      summary: {
        follow_up_count: followUps.length,
        case_count: cases.length,
        tag_count: tags.length,
      },
    };
  }

  /**
   * 创建跟进任务(写为 FollowUp 记录)
   */
  async createFollowUpTask(data: {
    lead_id: string;
    content: string;
    operator_id: string;
    next_action?: string;
    next_action_time?: Date;
  }): Promise<FollowUp> {
    const followUp = this.followUpRepository.create({
      lead_id: data.lead_id,
      content: data.content,
      operator_id: data.operator_id,
      next_action: data.next_action,
      next_action_time: data.next_action_time,
    });
    return this.followUpRepository.save(followUp);
  }

  /**
   * 企微侧边栏概览数据
   */
  async getOverview(orgId: string): Promise<any> {
    const leadCount = await this.leadRepository.count({ where: { organization_id: orgId } });
    const caseCount = await this.caseRepository.count({ where: { organization_id: orgId } });
    const followUpCount = await this.followUpRepository.createQueryBuilder('followUp')
      .innerJoin(Lead, 'lead', 'lead.id = followUp.lead_id')
      .where('lead.organization_id = :orgId', { orgId })
      .getCount();

    const recentFollowUps = await this.followUpRepository.createQueryBuilder('followUp')
      .innerJoinAndSelect('followUp.lead', 'lead')
      .where('lead.organization_id = :orgId', { orgId })
      .orderBy('followUp.created_at', 'DESC')
      .limit(5)
      .getMany();

    const recentCases = await this.caseRepository.find({
      where: { organization_id: orgId },
      order: { created_at: 'DESC' },
      take: 5,
    });

    return {
      stats: {
        lead_count: leadCount,
        case_count: caseCount,
        follow_up_count: followUpCount,
      },
      recent_follow_ups: recentFollowUps,
      recent_cases: recentCases,
    };
  }
}
