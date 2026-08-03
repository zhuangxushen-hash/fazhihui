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
import { BidService } from './bid.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT)
export class BidController {
  constructor(private readonly bidService: BidService) {}

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
}
