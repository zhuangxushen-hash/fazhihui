import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatArchive } from './chat-archive.entity';
import { ComplianceService } from '../compliance/compliance.service';
import { ComplianceType } from '../types';

@Injectable()
export class ChatArchiveService {
  constructor(
    @InjectRepository(ChatArchive)
    private chatArchiveRepository: Repository<ChatArchive>,
    private complianceService: ComplianceService,
  ) {}

  /**
   * 存档聊天消息(全类型)
   */
  async create(data: Partial<ChatArchive>): Promise<ChatArchive> {
    const entity = this.chatArchiveRepository.create(data);
    return this.chatArchiveRepository.save(entity);
  }

  async findAll(orgId?: string, filters?: {
    client_id?: string;
    employee_id?: string;
    message_type?: string;
  }): Promise<ChatArchive[]> {
    const where: any = {};
    if (orgId) where.organization_id = orgId;
    if (filters?.client_id) where.client_id = filters.client_id;
    if (filters?.employee_id) where.employee_id = filters.employee_id;
    if (filters?.message_type) where.message_type = filters.message_type;
    return this.chatArchiveRepository.find({ where, order: { sent_at: 'DESC' } });
  }

  async findById(id: string): Promise<ChatArchive> {
    const archive = await this.chatArchiveRepository.findOne({ where: { id } });
    if (!archive) {
      throw new NotFoundException('聊天记录不存在');
    }
    return archive;
  }

  async update(id: string, data: Partial<ChatArchive>): Promise<ChatArchive> {
    await this.chatArchiveRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.chatArchiveRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('聊天记录不存在');
    }
  }

  /**
   * 检索聊天记录
   * 支持按 客户/员工/时间区间/关键词 过滤
   */
  async search(params: {
    org_id?: string;
    client_id?: string;
    employee_id?: string;
    message_type?: string;
    keyword?: string;
    start_time?: string;
    end_time?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ChatArchive[]; total: number }> {
    const qb = this.chatArchiveRepository.createQueryBuilder('chat');

    if (params.org_id) {
      qb.andWhere('chat.organization_id = :orgId', { orgId: params.org_id });
    }
    if (params.client_id) {
      qb.andWhere('chat.client_id = :clientId', { clientId: params.client_id });
    }
    if (params.employee_id) {
      qb.andWhere('chat.employee_id = :employeeId', { employeeId: params.employee_id });
    }
    if (params.message_type) {
      qb.andWhere('chat.message_type = :type', { type: params.message_type });
    }
    if (params.keyword) {
      qb.andWhere('chat.content LIKE :keyword', { keyword: `%${params.keyword}%` });
    }
    if (params.start_time) {
      qb.andWhere('chat.sent_at >= :startTime', { startTime: new Date(params.start_time) });
    }
    if (params.end_time) {
      qb.andWhere('chat.sent_at <= :endTime', { endTime: new Date(params.end_time) });
    }

    qb.orderBy('chat.sent_at', 'DESC');

    const total = await qb.getCount();
    const page = params.page || 1;
    const limit = params.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const data = await qb.getMany();
    return { data, total };
  }

  /**
   * 同步至合规质检模块
   * 仅对文本类型消息进行合规检测
   */
  async syncToCompliance(id: string, operatorId: string): Promise<ChatArchive> {
    const archive = await this.findById(id);
    if (archive.compliance_synced) {
      return archive;
    }

    // 仅文本消息有内容可检测; 其他类型跳过(标记为已同步)
    if (archive.message_type !== 'text' || !archive.content) {
      archive.compliance_synced = true;
      archive.compliance_result = 'pass';
      return this.chatArchiveRepository.save(archive);
    }

    const record = await this.complianceService.checkCompliance(
      archive.content,
      ComplianceType.SALES,
      archive.organization_id,
      operatorId,
      archive.id,
    );

    archive.compliance_synced = true;
    archive.compliance_result = record.result;
    return this.chatArchiveRepository.save(archive);
  }

  /**
   * 批量同步合规质检
   */
  async batchSyncToCompliance(orgId: string, operatorId: string, limit = 100): Promise<{
    total: number;
    synced: number;
    violations: number;
  }> {
    const archives = await this.chatArchiveRepository.find({
      where: { organization_id: orgId, compliance_synced: false, message_type: 'text' },
      take: limit,
    });

    let violations = 0;
    for (const archive of archives) {
      if (!archive.content) continue;
      try {
        const record = await this.complianceService.checkCompliance(
          archive.content,
          ComplianceType.SALES,
          orgId,
          operatorId,
          archive.id,
        );
        archive.compliance_synced = true;
        archive.compliance_result = record.result;
        if (record.result !== 'pass') {
          violations += 1;
        }
        await this.chatArchiveRepository.save(archive);
      } catch {
        // 忽略单条错误, 继续处理后续
      }
    }

    return {
      total: archives.length,
      synced: archives.length,
      violations,
    };
  }
}
