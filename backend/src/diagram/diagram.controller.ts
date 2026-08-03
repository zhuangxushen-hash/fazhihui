import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DiagramService } from './diagram.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('diagrams')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT)
export class DiagramController {
  constructor(private diagramService: DiagramService) {}

  // 创建图表
  @Post()
  create(@Body() body: any, @Request() req: any) {
    const orgId = body.organization_id || req?.user?.organization_id;
    const creatorId = body.creator_id || req?.user?.id;
    return this.diagramService.create({ ...body, organization_id: orgId, creator_id: creatorId });
  }

  // 查询图表列表
  @Get()
  findAll(
    @Query('org_id') orgId: string,
    @Query('type') type?: string,
    @Query('keyword') keyword?: string,
    @Query('case_id') case_id?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.diagramService.findAll(finalOrgId, { type, keyword, case_id, page, limit });
  }

  // 按创建人查询图表（静态路由优先于参数路由）
  @Get('creator/:creatorId')
  findByCreator(@Param('creatorId') creatorId: string, @Request() req?: any) {
    const orgId = req?.user?.organization_id;
    return this.diagramService.findByCreator(creatorId, orgId);
  }

  // 查询图表详情
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.diagramService.findById(id);
  }

  // 更新图表
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.diagramService.update(id, body);
  }

  // 删除图表
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.diagramService.remove(id);
  }
}
