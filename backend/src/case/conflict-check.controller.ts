import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ConflictCheckService } from './conflict-check.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('conflict-checks')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT)
export class ConflictCheckController {
  constructor(private conflictCheckService: ConflictCheckService) {}

  // 执行利冲检索
  @Post()
  check(
    @Body() body: {
      party_name: string;
      opposing_party: string;
      party_phone?: string;
      case_id?: string;
    },
    @Request() req?: any,
  ) {
    const orgId = req?.user?.organization_id;
    const checkerId = req?.user?.id;
    return this.conflictCheckService.check({
      partyName: body.party_name,
      opposingParty: body.opposing_party,
      partyPhone: body.party_phone,
      orgId,
      checkerId,
      caseId: body.case_id,
    });
  }

  // 查询检索记录
  @Get()
  findAll(
    @Query('org_id') orgId: string,
    @Query('keyword') keyword?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    return this.conflictCheckService.findAll(finalOrgId, keyword);
  }

  // 深度利冲检索
  @Post('deep')
  deepCheck(
    @Body() body: {
      party_name: string;
      opposing_party: string;
      party_role: string;
    },
    @Request() req?: any,
  ) {
    const orgId = req?.user?.organization_id;
    const checkerId = req?.user?.id;
    return this.conflictCheckService.deepCheck({
      partyName: body.party_name,
      opposingParty: body.opposing_party,
      partyRole: body.party_role,
      orgId,
      checkerId,
    });
  }

  // 利冲审批通过
  @Put(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: { supervisor_id: string; comment: string },
  ) {
    return this.conflictCheckService.approve(id, body.supervisor_id, body.comment);
  }

  // 利冲审批驳回
  @Put(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { supervisor_id: string; comment: string },
  ) {
    return this.conflictCheckService.reject(id, body.supervisor_id, body.comment);
  }
}
