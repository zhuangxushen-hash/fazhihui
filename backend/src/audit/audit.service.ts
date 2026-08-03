import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  // 记录审计日志
  async logAction(params: {
    user_id?: string;
    user_name?: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    ip?: string;
    detail?: string;
  }): Promise<void> {
    try {
      await this.auditRepository.save({
        user_id: params.user_id || null,
        user_name: params.user_name || null,
        action: params.action,
        resource_type: params.resource_type || null,
        resource_id: params.resource_id || null,
        ip: params.ip || null,
        detail: params.detail || null,
      });
    } catch (e) {
      // 审计日志记录失败不影响主流程
      console.error('审计日志记录失败:', e);
    }
  }

  // 查询审计日志
  async findAll(params: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    page?: number;
    limit?: number;
  }) {
    const qb = this.auditRepository.createQueryBuilder('audit');
    if (params.user_id) {
      qb.andWhere('audit.user_id = :userId', { userId: params.user_id });
    }
    if (params.action) {
      qb.andWhere('audit.action = :action', { action: params.action });
    }
    if (params.resource_type) {
      qb.andWhere('audit.resource_type = :resourceType', { resourceType: params.resource_type });
    }
    qb.orderBy('audit.created_at', 'DESC');
    const page = params.page || 1;
    const limit = params.limit || 20;
    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
