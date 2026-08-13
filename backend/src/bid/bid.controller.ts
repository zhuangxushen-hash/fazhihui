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

    qb.orderBy('r.updated_at', 'DESC')
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
   * 导出业绩记录（批量下载）
   * 返回符合 CSV 结构的行数据，前端负责生成并下载文件
   */
  @Get('bid-performances/export')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.SALES)
  async exportPerformances(
    @Query('project_name') projectName: string,
    @Query('status') status: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
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
    qb.orderBy('r.updated_at', 'DESC');
    const list = await qb.getMany();
    return { data: list, total: list.length };
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
   * 批量导入业绩记录（接收数组，逐条创建）
   */
  @Post('bid-performances/import')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.SALES)
  async importPerformances(@Body() body: { records: Partial<BidRecord>[] }, @Request() req: any) {
    const orgId = req?.user?.organization_id;
    const records = Array.isArray(body?.records) ? body.records : [];
    if (records.length === 0) {
      return { imported: 0, message: '未检测到可导入的数据' };
    }
    const entities = records.map((r) =>
      this.bidRecordRepository.create({
        project_name: r.project_name,
        client: r.client,
        amount: r.amount,
        start_date: r.start_date,
        end_date: r.end_date || null,
        category: r.category,
        description: r.description,
        file_url: r.file_url || null,
        file_name: r.file_name || null,
        organization_id: orgId,
        status: 'pending',
      }),
    );
    const saved = await this.bidRecordRepository.save(entities);
    return { imported: saved.length, message: `成功导入 ${saved.length} 条业绩记录` };
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
   * 兼容两种参数：{ status: 'approved' } 或 { action: 'approve'|'reject', comment }
   */
  @Put('bid-performances/:id/audit')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.SALES)
  async auditPerformance(
    @Param('id') id: string,
    @Body() body: { status?: string; action?: string; audit_comment?: string; comment?: string },
    @Request() req: any,
  ) {
    // action 模式映射为状态：approve -> approved / reject -> rejected
    const actionStatusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
    };
    const status = body.status || actionStatusMap[body.action] || 'pending';
    await this.bidRecordRepository.update(id, {
      status,
      audit_comment: body.audit_comment || body.comment || null,
      audited_by: req?.user?.id,
      audited_at: new Date(),
    });
    return this.bidRecordRepository.findOne({ where: { id } });
  }

  /**
   * 上传业绩附件（记录 file_url/file_name）
   */
  @Post('bid-performances/:id/upload')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.SALES)
  async uploadPerformanceFile(
    @Param('id') id: string,
    @Body() body: { file_url: string; file_name?: string },
  ) {
    await this.bidRecordRepository.update(id, {
      file_url: body.file_url,
      file_name: body.file_name || null,
    });
    return this.bidRecordRepository.findOne({ where: { id } });
  }

  /**
   * 删除业绩记录
   */
  @Delete('bid-performances/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.SALES)
  async removePerformance(@Param('id') id: string) {
    await this.bidRecordRepository.delete(id);
    return { message: '删除成功' };
  }
}
