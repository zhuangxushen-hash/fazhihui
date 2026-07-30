import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { LegalDocumentService } from './legal-document.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('legal-documents')
@UseGuards(JwtAuthGuard)
export class LegalDocumentController {
  constructor(private legalDocumentService: LegalDocumentService) {}

  @Get()
  findAll(
    @Query('org_id') orgId: string,
    @Query('case_type') caseType?: string,
    @Request() req?: any,
  ) {
    const finalOrgId = orgId || req?.user?.organization_id;
    if (caseType) {
      return this.legalDocumentService.getTemplatesByCaseType(caseType);
    }
    return this.legalDocumentService.findAll(finalOrgId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.legalDocumentService.findById(id);
  }

  @Post()
  create(
    @Body() body: {
      template_name: string;
      document_type?: string;
      case_type?: string;
      content_template?: string;
      variables?: string;
      organization_id?: string;
      created_by?: string;
    },
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    const orgId = body.organization_id || req?.user?.organization_id;
    return this.legalDocumentService.create({
      ...body,
      created_by: body.created_by || userId,
      organization_id: orgId,
    });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.legalDocumentService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.legalDocumentService.delete(id);
  }

  @Post(':id/generate')
  generate(@Param('id') id: string, @Body() body: { variables: Record<string, string> }) {
    return this.legalDocumentService.generateDocument(id, body.variables || {});
  }

  @Post(':id/preview')
  preview(@Param('id') id: string, @Body() body: { variables: Record<string, string> }) {
    return this.legalDocumentService.previewDocument(id, body.variables || {});
  }
}