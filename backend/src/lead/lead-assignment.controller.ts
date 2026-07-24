import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseBoolPipe,
  Query,
} from '@nestjs/common';
import { LeadAssignmentService } from './lead-assignment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeadAssignment } from './lead-assignment.entity';

@Controller('lead-assignments')
@UseGuards(JwtAuthGuard)
export class LeadAssignmentController {
  constructor(private readonly assignmentService: LeadAssignmentService) {}

  @Post()
  async createRule(@Body() ruleData: Partial<LeadAssignment>, @Request() req) {
    const orgId = req.user.organization_id;
    return this.assignmentService.createRule({
      ...ruleData,
      organization_id: orgId,
    });
  }

  @Get()
  async findAllRules(@Request() req) {
    const orgId = req.user.organization_id;
    return this.assignmentService.findAllRules(orgId);
  }

  @Get(':id')
  async findRuleById(@Param('id') id: string) {
    return this.assignmentService.findRuleById(id);
  }

  @Put(':id')
  async updateRule(
    @Param('id') id: string,
    @Body() ruleData: Partial<LeadAssignment>,
  ) {
    return this.assignmentService.updateRule(id, ruleData);
  }

  @Delete(':id')
  async deleteRule(@Param('id') id: string) {
    await this.assignmentService.deleteRule(id);
    return { success: true };
  }

  @Put(':id/toggle')
  async toggleRule(
    @Param('id') id: string,
    @Query('enabled', ParseBoolPipe) enabled: boolean,
  ) {
    return this.assignmentService.toggleRule(id, enabled);
  }

  @Get('users/available')
  async getAvailableUsers(@Request() req) {
    const orgId = req.user.organization_id;
    return this.assignmentService.getAvailableUsers(orgId);
  }

  @Get('logs/:leadId')
  async getAssignmentLogs(@Param('leadId') leadId: string) {
    return this.assignmentService.getAssignmentLogs(leadId);
  }
}