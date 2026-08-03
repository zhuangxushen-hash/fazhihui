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
import { PropertyPreservationService } from './property-preservation.service';
import { PropertyPreservation } from './property-preservation.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('property-preservation')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT)
export class PropertyPreservationController {
  constructor(private service: PropertyPreservationService) {}

  // 创建财产保全
  @Post()
  create(@Body() body: any, @Request() req: any) {
    const orgId = body.organization_id || req?.user?.organization_id;
    return this.service.create({ ...body, organization_id: orgId });
  }

  // 查询保全列表（支持10个查询条件）
  @Get()
  findAll(
    @Query('org_id') orgId: string,
    @Query('status') status?: string,
    @Query('preservation_type') preservation_type?: string,
    @Query('property_type') property_type?: string,
    @Query('guarantee_method') guarantee_method?: string,
    @Query('keyword') keyword?: string,
    @Query('case_id') case_id?: string,
    @Query('contract_id') contract_id?: string,
    @Query('lead_lawyer_id') lead_lawyer_id?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.service.findAll(finalOrgId, {
      status,
      preservation_type,
      property_type,
      guarantee_method,
      keyword,
      case_id,
      contract_id,
      lead_lawyer_id,
      start_date,
      end_date,
      page,
      limit,
    });
  }

  // 查询保全详情
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // 更新保全
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<PropertyPreservation>) {
    return this.service.update(id, body);
  }

  // 删除保全
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // 提交审批
  @Put(':id/submit')
  submit(@Param('id') id: string) {
    return this.service.submit(id);
  }

  // 审批通过
  @Put(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @Request() req: any,
  ) {
    return this.service.approve(id, req.user.id, body?.comment);
  }

  // 审批驳回
  @Put(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @Request() req: any,
  ) {
    return this.service.reject(id, req.user.id, body?.comment);
  }

  // 标记已实施
  @Put(':id/implement')
  markImplemented(
    @Param('id') id: string,
    @Body() body?: {
      actual_amount?: number;
      implement_date?: Date;
      ruling_document?: string;
      ruling_no?: string;
    },
  ) {
    return this.service.markImplemented(id, body);
  }

  // 解除保全
  @Put(':id/release')
  release(
    @Param('id') id: string,
    @Body() body?: { release_date?: Date },
  ) {
    return this.service.release(id, body?.release_date);
  }
}
