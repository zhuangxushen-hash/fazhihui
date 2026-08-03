import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Bid, BID_STATUS } from './bid.entity';
import { BidRecord } from './bid-record.entity';

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Bid)
    private bidRepository: Repository<Bid>,
    @InjectRepository(BidRecord)
    private bidRecordRepository: Repository<BidRecord>,
  ) {}

  // ========== 投标管理 ==========

  // 创建投标
  async createBid(data: Partial<Bid>): Promise<Bid> {
    const bid = this.bidRepository.create(data);
    return this.bidRepository.save(bid);
  }

  // 查询投标列表，支持 status/keyword 筛选
  async findBids(
    orgId: string,
    params?: { status?: string; keyword?: string },
  ): Promise<Bid[]> {
    const where: any = {};
    if (orgId) {
      where.organization_id = orgId;
    }
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.keyword) {
      where.project_name = Like(`%${params.keyword}%`);
    }
    return this.bidRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  // 查询单条投标
  async findOneBid(id: string): Promise<Bid> {
    return this.bidRepository.findOne({ where: { id } });
  }

  // 更新投标
  async updateBid(id: string, data: Partial<Bid>): Promise<Bid> {
    await this.bidRepository.update(id, data);
    return this.bidRepository.findOne({ where: { id } });
  }

  // 删除投标
  async removeBid(id: string): Promise<void> {
    await this.bidRepository.delete(id);
  }

  // 投标操作：状态置为已投标，记录投标日期
  async submit(id: string): Promise<Bid> {
    await this.bidRepository.update(id, {
      status: BID_STATUS.SUBMITTED,
      bid_date: new Date(),
    });
    return this.bidRepository.findOne({ where: { id } });
  }

  // 中标操作
  async win(id: string): Promise<Bid> {
    await this.bidRepository.update(id, {
      status: BID_STATUS.WON,
      result_date: new Date(),
    });
    return this.bidRepository.findOne({ where: { id } });
  }

  // 未中标操作
  async lose(id: string): Promise<Bid> {
    await this.bidRepository.update(id, {
      status: BID_STATUS.LOST,
      result_date: new Date(),
    });
    return this.bidRepository.findOne({ where: { id } });
  }

  // ========== 业绩库管理 ==========

  // 创建业绩记录
  async createRecord(data: Partial<BidRecord>): Promise<BidRecord> {
    const record = this.bidRecordRepository.create(data);
    return this.bidRecordRepository.save(record);
  }

  // 查询业绩记录列表，支持 keyword 筛选
  async findRecords(
    orgId: string,
    keyword?: string,
  ): Promise<BidRecord[]> {
    const where: any = {};
    if (orgId) {
      where.organization_id = orgId;
    }
    if (keyword) {
      where.project_name = Like(`%${keyword}%`);
    }
    return this.bidRecordRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  // 更新业绩记录
  async updateRecord(id: string, data: Partial<BidRecord>): Promise<BidRecord> {
    await this.bidRecordRepository.update(id, data);
    return this.bidRecordRepository.findOne({ where: { id } });
  }

  // 删除业绩记录
  async removeRecord(id: string): Promise<void> {
    await this.bidRecordRepository.delete(id);
  }
}
