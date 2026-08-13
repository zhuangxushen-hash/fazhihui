import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FormTemplateService } from './form-template.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('approvals/forms')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE, UserRole.SALES, UserRole.MARKETING)
export class FormTemplateController {
  constructor(private formTemplateService: FormTemplateService) {}

  // 查询表单模板列表
  @Get()
  getTemplates(@Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    return this.formTemplateService.getTemplates(organizationId);
  }

  // 查询单个表单模板
  @Get(':formType')
  getTemplateByType(@Param('formType') formType: string, @Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    return this.formTemplateService.getTemplateByType(organizationId, formType);
  }

  // 校验表单数据并返回模板（供提交前校验）
  @Post(':formType/validate')
  validate(
    @Param('formType') formType: string,
    @Body() body: { form_data: Record<string, unknown> },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.formTemplateService.createFormApproval(organizationId, req?.user?.id, {
      form_type: formType,
      form_data: body.form_data,
    });
  }
}
