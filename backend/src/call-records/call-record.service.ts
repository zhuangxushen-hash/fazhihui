import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CallRecord } from './call-record.entity';

@Injectable()
export class CallRecordService {
  constructor(
    @InjectRepository(CallRecord)
    private readonly callRecordRepository: Repository<CallRecord>,
  ) {}

  // 创建通话记录
  async create(data: Partial<CallRecord>): Promise<CallRecord> {
    const record = this.callRecordRepository.create(data);
    return this.callRecordRepository.save(record);
  }

  // 查询通话记录详情
  async findById(id: string): Promise<CallRecord> {
    const record = await this.callRecordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('通话记录不存在');
    }
    return record;
  }

  // 按组织查询通话记录列表，支持按线索、号码、时间范围筛选
  async findByOrg(
    orgId: string,
    filters?: {
      leadId?: string;
      phone?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<CallRecord[]> {
    const where: any = { organization_id: orgId };
    if (filters?.leadId) {
      where.lead_id = filters.leadId;
    }
    if (filters?.phone) {
      where.phone = filters.phone;
    }
    if (filters?.startDate && filters?.endDate) {
      where.start_time = Between(new Date(filters.startDate), new Date(filters.endDate));
    } else if (filters?.startDate) {
      where.start_time = Between(new Date(filters.startDate), new Date('2099-12-31'));
    }
    return this.callRecordRepository.find({
      where,
      order: { start_time: 'DESC' },
    });
  }

  // 更新通话记录
  async update(id: string, data: Partial<CallRecord>): Promise<CallRecord> {
    const record = await this.callRecordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('通话记录不存在');
    }
    await this.callRecordRepository.update(id, data);
    return this.callRecordRepository.findOne({ where: { id } });
  }

  // 删除通话记录
  async delete(id: string): Promise<void> {
    const record = await this.callRecordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('通话记录不存在');
    }
    await this.callRecordRepository.delete(id);
  }
}
