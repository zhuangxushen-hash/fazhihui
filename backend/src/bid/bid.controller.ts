import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BidService } from './bid.service';
import { BidRecord } from './bid-record.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT)
export class BidController {
  constructor(
    private readonly bidService: BidService,
    // 追加注入 BidRecord Repository 用于业绩库查询
    @InjectRepository(BidRecord)
    private readonly bidRecordRepository: Repository<BidRecord>,
  ) {}

  // ========== 投标管理 ==========

  @Post('bids')
  async createBid(@Body() body: any, @Request() req: any) {
    return this.bidService.createBid({
      ...body,
      organization_id: body.organization_id || req?.user?.organization_id,
    });
  }

  @Get('bids')
  async findBids(
    @Query('org_id') orgId: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.bidService.findBids(finalOrgId, { status, keyword });
  }

  @Put('bids/:id')
  async updateBid(@Param('id') id: string, @Body() body: any) {
    return this.bidService.updateBid(id, body);
  }

  @Delete('bids/:id')
  async removeBid(@Param('id') id: string) {
    await this.bidService.removeBid(id);
    return { message: '删除成功' };
  }

  @Put('bids/:id/submit')
  async submitBid(@Param('id') id: string) {
    return this.bidService.submit(id);
  }

  @Put('bids/:id/win')
  async winBid(@Param('id') id: string) {
    return this.bidService.win(id);
  }

  @Put('bids/:id/lose')
  async loseBid(@Param('id') id: string) {
    return this.bidService.lose(id);
  }

  // ========== 业绩库管理 ==========

  @Post('bid-records')
  async createRecord(@Body() body: any, @Request() req: any) {
    return this.bidService.createRecord({
      ...body,
      organization_id: body.organization_id || req?.user?.organization_id,
    });
  }

  @Get('bid-records')
  async findRecords(
    @Query('org_id') orgId: string,
    @Query('keyword') keyword?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.bidService.findRecords(finalOrgId, keyword);
  }

  @Put('bid-records/:id')
  async updateRecord(@Param('id') id: string, @Body() body: any) {
    return this.bidService.updateRecord(id, body);
  }

  @Delete('bid-records/:id')
  async removeRecord(@Param('id') id: string) {
    await this.bidService.removeRecord(id);
    return { message: '删除成功' };
  }

  // ========== 业绩库管理（bid-performances）==========

  /**
   * 查询投标业绩库列表
   * 支持 project_name/status/date_from/date_to 筛选
   */
  @Get('bid-performances')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.SALES)
  async findPerformances(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('project_name') projectName: string,
    @Query('status') status: string,
    @Query('date_from') dateFrom: string,
    @Query('date_to') dateTo: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 10;

    const qb = this.bidRecordRepository.createQueryBuilder('r');
    if (orgId) {
      qb.andWhere('r.organization_id = :orgId', { orgId });
    }
    if (projectName) {
      qb.andWhere('r.project_name LIKE :projectName', { projectName: `%${projectName}%` });
    }
    if (status) {
      qb.andWhere('r.status = :status', { status });
    }
    if (dateFrom) {
      qb.andWhere('r.start_date >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      qb.andWhere('r.start_date <= :dateTo', { dateTo });
    }

    qb.orderBy('r.created_at', 'DESC')
      .skip((pageNum - 1) * pageSizeNum)
      .take(pageSizeNum);

    const [list, total] = await qb.getManyAndCount();
    return {
      list,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
    };
  }

  /**
   * 查询业绩详情
   */
  @Get('bid-performances/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.SALES)
  async findOnePerformance(@Param('id') id: string) {
    return this.bidRecordRepository.findOne({ where: { id } });
  }

  /**
   * 创建业绩记录
   */
  @Post('bid-performances')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.SALES)
  async createPerformance(@Body() body: Partial<BidRecord>, @Request() req: any) {
    const orgId = body.organization_id || req?.user?.organization_id;
    const record = this.bidRecordRepository.create({
      ...body,
      organization_id: orgId,
      status: body.status || 'pending',
    });
    return this.bidRecordRepository.save(record);
  }

  /**
   * 审核业绩记录
   */
  @Put('bid-performances/:id/audit')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.SALES)
  async auditPerformance(
    @Param('id') id: string,
    @Body() body: { status: string; audit_comment?: string },
    @Request() req: any,
  ) {
    await this.bidRecordRepository.update(id, {
      status: body.status,
      audit_comment: body.audit_comment,
      audited_by: req?.user?.id,
      audited_at: new Date(),
    });
    return this.bidRecordRepository.findOne({ where: { id } });
  }
}
