import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CaseWarningService } from './case-warning.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWarningDto, UpdateWarningDto, WarningFilterDto } from './dto/warning.dto';

@Controller('case-warnings')
@UseGuards(JwtAuthGuard)
export class CaseWarningController {
  constructor(private readonly warningService: CaseWarningService) {}

  // 获取预警列表
  @Get()
  async findAll(@Query() filter: WarningFilterDto, @Request() req) {
    const warnings = await this.warningService.findAll(filter);
    return {
      code: 0,
      data: warnings,
      message: '获取成功',
    };
  }

  // 获取预警统计
  @Get('statistics')
  async getStatistics(@Request() req) {
    const organizationId = req.user.organization_id;
    const stats = await this.warningService.getStatistics(organizationId);
    return {
      code: 0,
      data: stats,
      message: '获取成功',
    };
  }

  // 获取预警详情
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const warning = await this.warningService.findOne(id);
    return {
      code: 0,
      data: warning,
      message: '获取成功',
    };
  }

  // 创建预警（手动创建）
  @Post()
  async create(@Body() createWarningDto: CreateWarningDto) {
    const warning = await this.warningService.create(createWarningDto);
    return {
      code: 0,
      data: warning,
      message: '创建成功',
    };
  }

  // 处理预警
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWarningDto: UpdateWarningDto,
    @Request() req,
  ) {
    const warning = await this.warningService.update(id, {
      ...updateWarningDto,
      handler_id: req.user.id,
    });
    return {
      code: 0,
      data: warning,
      message: '处理成功',
    };
  }

  // 手动触发预警生成
  @Post('trigger')
  async triggerGeneration() {
    const result = await this.warningService.triggerWarningGeneration();
    return {
      code: 0,
      data: result,
      message: '预警生成任务已触发',
    };
  }
}