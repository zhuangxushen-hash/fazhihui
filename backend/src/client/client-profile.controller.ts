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
import { ClientProfileService } from './client-profile.service';
import { ClientProfile } from './client-profile.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('client-profiles')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.CLIENT)
export class ClientProfileController {
  constructor(private readonly clientProfileService: ClientProfileService) {}

  // 查询客户列表（支持 keyword 按名称/电话搜索，支持 days_no_contact 智能筛选）
  @Get()
  findAll(
    @Query('keyword') keyword: string,
    @Query('days_no_contact') days_no_contact?: number,
    @Request() req?: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.clientProfileService.findAll(orgId, keyword, Number(days_no_contact) || undefined);
  }

  // 查询单个客户
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientProfileService.findOne(id);
  }

  // 创建客户
  @Post()
  create(@Body() body: Partial<ClientProfile>, @Request() req: any) {
    const orgId = req?.user?.organization_id;
    return this.clientProfileService.create(body, orgId);
  }

  // 更新客户
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<ClientProfile>) {
    return this.clientProfileService.update(id, body);
  }

  // 删除客户
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientProfileService.remove(id);
  }

  // 查询客户关联案件（通过 client_name 软关联）
  @Get(':id/related-cases')
  async getRelatedCases(@Param('id') id: string) {
    const client = await this.clientProfileService.findOne(id);
    return this.clientProfileService.getRelatedCases(client.name);
  }

  // 查询客户关联线索（通过 phone 软关联）
  @Get(':id/related-leads')
  async getRelatedLeads(@Param('id') id: string) {
    const client = await this.clientProfileService.findOne(id);
    return this.clientProfileService.getRelatedLeads(client.phone);
  }

  // 13.8 缺口4: 查询客户关联跟进记录（线索跟进汇总）
  @Get(':id/related-follow-ups')
  getRelatedFollowUps(@Param('id') id: string) {
    return this.clientProfileService.getRelatedFollowUps(id);
  }

  // 13.8 缺口4: 查询客户财务往来（关联案件付款记录）
  @Get(':id/financial-records')
  getFinancialRecords(@Param('id') id: string) {
    return this.clientProfileService.getFinancialRecords(id);
  }
}
