import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ClientProfile } from './client-profile.entity';
import { Case } from '../case/case.entity';
import { Lead } from '../lead/lead.entity';
import { FollowUp } from '../lead/follow-up.entity';
import { PaymentRecord } from '../finance/payment-record.entity';
import { User } from '../user/user.entity';
import { UserRole } from '../types';

@Injectable()
export class ClientProfileService {
  private readonly logger = new Logger(ClientProfileService.name);
  constructor(
    @InjectRepository(ClientProfile)
    private clientProfileRepository: Repository<ClientProfile>,
    // 注入案件实体仓库，用于按客户名称关联查询案件
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    // 注入线索实体仓库，用于按电话关联查询线索
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    // 13.8 缺口4: 注入跟进记录仓库，按关联线索手机号汇总客户跟进记录
    @InjectRepository(FollowUp)
    private followUpRepository: Repository<FollowUp>,
    // 13.8 缺口4: 注入付款记录仓库，按关联案件查询客户财务往来
    @InjectRepository(PaymentRecord)
    private paymentRecordRepository: Repository<PaymentRecord>,
    // 注入用户实体仓库：C端登录账号由客户档案自动同步生成（切分管理端账号体系）
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 查询客户列表（支持按名称/电话关键字搜索，支持超过X天未联系智能筛选）
  async findAll(organizationId: string, keyword?: string, daysNoContact?: number): Promise<ClientProfile[]> {
    const qb = this.clientProfileRepository
      .createQueryBuilder('c')
      .where('c.organization_id = :orgId', { orgId: organizationId });

    if (keyword) {
      qb.andWhere('(c.name LIKE :kw OR c.phone LIKE :kw)', { kw: `%${keyword}%` });
    }
    // 智能筛选：超过X天未联系（updated_at 早于阈值）
    if (daysNoContact) {
      const threshold = new Date(Date.now() - daysNoContact * 24 * 60 * 60 * 1000);
      qb.andWhere('c.updated_at < :threshold', { threshold });
    }

    qb.orderBy('c.updated_at', 'DESC');
    return qb.getMany();
  }

  // 查询单个客户
  async findOne(id: string): Promise<ClientProfile> {
    const client = await this.clientProfileRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException('客户不存在');
    }
    return client;
  }

  // 创建客户
  async create(data: Partial<ClientProfile>, organizationId: string): Promise<ClientProfile> {
    const client = this.clientProfileRepository.create({
      ...data,
      organization_id: organizationId,
    });
    const saved = await this.clientProfileRepository.save(client);
    // C端登录账号由客户档案自动同步生成（切分管理端账号体系）
    await this.syncClientAccount(saved);
    return saved;
  }

  // 更新客户
  async update(id: string, data: Partial<ClientProfile>): Promise<ClientProfile> {
    const client = await this.clientProfileRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException('客户不存在');
    }
    // 手机号变更时，同步迁移 C 端登录账号的手机号（避免旧账号残留）
    if (data.phone && data.phone !== client.phone) {
      const oldAccount = await this.userRepository.findOne({
        where: { phone: client.phone, role: UserRole.CLIENT },
      });
      if (oldAccount) {
        await this.userRepository.update(oldAccount.id, { phone: data.phone });
      }
    }
    await this.clientProfileRepository.update(id, data);
    const updated = await this.clientProfileRepository.findOne({ where: { id } });
    if (!updated) {
      throw new NotFoundException('客户不存在');
    }
    // C端登录账号由客户档案自动同步生成（切分管理端账号体系）
    await this.syncClientAccount(updated);
    return updated;
  }

  /**
   * C端登录账号与客户档案同步：
   * - 登录账号 = 客户管理中录入的手机号
   * - 默认密码 = 身份证号后 8 位（仅在新建账号或账号无密码时写入，避免覆盖客户已修改的密码）
   * - 手机号已被管理端账号占用时跳过，不覆盖管理端账号
   */
  private async syncClientAccount(client: ClientProfile): Promise<void> {
    // 仅手机号与身份证号均录入的客户可自动生成 C 端登录账号
    if (!client.phone || !client.id_card_no) {
      return;
    }
    const defaultPassword = client.id_card_no.slice(-8);
    const realName = client.name || client.contact_name || '客户';
    const existing = await this.userRepository.findOne({ where: { phone: client.phone } });
    if (existing) {
      // 同手机号已被管理端账号占用：跳过，保证管理端账号不被覆盖
      if (existing.role !== UserRole.CLIENT) {
        this.logger.log(`客户手机号 ${client.phone} 已被管理端账号占用，跳过 C 端账号同步`);
        return;
      }
      const patch: Partial<User> = {
        real_name: realName,
        organization_id: client.organization_id,
      };
      // 默认密码仅在账号无密码时写入
      if (!existing.password) {
        patch.password = await bcrypt.hash(defaultPassword, parseInt(process.env.BCRYPT_ROUNDS || '10'));
      }
      await this.userRepository.update(existing.id, patch);
      return;
    }
    await this.userRepository.save(
      this.userRepository.create({
        // C 端账号 id 与客户档案 id 保持一致（C 端业务以 client_id 关联案件/档案）
        id: client.id,
        real_name: realName,
        phone: client.phone,
        password: await bcrypt.hash(defaultPassword, parseInt(process.env.BCRYPT_ROUNDS || '10')),
        role: UserRole.CLIENT,
        organization_id: client.organization_id,
        status: true,
      }),
    );
    this.logger.log(`客户档案自动生成 C 端登录账号 phone=${client.phone}`);
  }

  // 删除客户
  async remove(id: string): Promise<void> {
    const client = await this.clientProfileRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException('客户不存在');
    }
    await this.clientProfileRepository.softDelete(id);
  }

  // 通过 client_name 关联查询案件列表（cases 表 where client_name LIKE）
  async getRelatedCases(clientName: string): Promise<Case[]> {
    if (!clientName) {
      return [];
    }
    return this.caseRepository
      .createQueryBuilder('c')
      .where('c.client_name LIKE :name', { name: `%${clientName}%` })
      .orderBy('c.updated_at', 'DESC')
      .getMany();
  }

  // 通过 phone 关联查询线索列表（leads 表 where phone LIKE）
  async getRelatedLeads(phone: string): Promise<Lead[]> {
    if (!phone) {
      return [];
    }
    return this.leadRepository
      .createQueryBuilder('l')
      .where('l.phone LIKE :phone', { phone: `%${phone}%` })
      .orderBy('l.updated_at', 'DESC')
      .getMany();
  }

  // 13.8 缺口4: 查询客户关联跟进记录（通过客户电话匹配线索，再取线索的跟进记录）
  async getRelatedFollowUps(id: string): Promise<any[]> {
    const client = await this.findOne(id);
    const leads = await this.getRelatedLeads(client.phone);
    if (!leads.length) {
      return [];
    }
    const leadIds = leads.map((l) => l.id);
    const followUps = await this.followUpRepository.find({
      where: { lead_id: In(leadIds) },
      order: { created_at: 'DESC' },
    });
    const leadMap = new Map(leads.map((l) => [l.id, l]));
    return followUps.map((f) => ({
      ...f,
      lead_contact_name: leadMap.get(f.lead_id)?.contact_name || null,
      lead_phone: leadMap.get(f.lead_id)?.phone || null,
    }));
  }

  // 13.8 缺口4: 查询客户财务往来（关联案件的付款记录）
  async getFinancialRecords(id: string): Promise<PaymentRecord[]> {
    const client = await this.findOne(id);
    const cases = await this.getRelatedCases(client.name);
    const caseIds = cases.map((c) => c.id);
    if (!caseIds.length) {
      return [];
    }
    return this.paymentRecordRepository.find({
      where: { case_id: In(caseIds) },
      order: { created_at: 'DESC' },
    });
  }
}
