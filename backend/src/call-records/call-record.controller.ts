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
  Req,
} from '@nestjs/common';
import { CallRecordService } from './call-record.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

/**
 * AI 营销工作手机通话记录控制器
 * 权限：管理员(super_admin, org_admin) / 投放岗(marketing) / 销售岗(sales)
 */
@Controller('call-records')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES)
export class CallRecordController {
  constructor(private readonly callRecordService: CallRecordService) {}

  // 通话记录列表查询，支持按线索、号码、时间范围筛选
  @Get()
  async findAll(
    @Query('leadId') leadId: string,
    @Query('phone') phone: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ) {
    const orgId = req.user.organization_id;
    return this.callRecordService.findByOrg(orgId, {
      leadId,
      phone,
      startDate,
      endDate,
    });
  }

  // 查询通话记录详情
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.callRecordService.findById(id);
  }

  // 创建通话记录
  @Post()
  async create(
    @Body() body: {
      lead_id?: string;
      phone: string;
      call_type: string;
      start_time: string;
      duration?: number;
      recording_url?: string;
      call_status?: string;
      summary?: string;
    },
    @Req() req: any,
  ) {
    return this.callRecordService.create({
      ...body,
      start_time: body.start_time ? new Date(body.start_time) : new Date(),
      organization_id: req.user.organization_id,
      caller_id: req.user.id,
    });
  }

  // 更新通话记录
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      lead_id?: string;
      phone?: string;
      call_type?: string;
      start_time?: string;
      duration?: number;
      recording_url?: string;
      call_status?: string;
      summary?: string;
    },
  ) {
    const updateData: any = { ...body };
    if (body.start_time) {
      updateData.start_time = new Date(body.start_time);
    }
    return this.callRecordService.update(id, updateData);
  }

  // 删除通话记录
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.callRecordService.delete(id);
    return { success: true };
  }
}
