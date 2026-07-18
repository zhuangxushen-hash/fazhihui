import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ClientService } from './client.service';
import { ComplaintType } from '../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('client')
@UseGuards(JwtAuthGuard)
export class ClientController {
  constructor(private clientService: ClientService) {}

  @Post('cases')
  getClientCases(@Body() body: { client_id: string }) {
    return this.clientService.getClientCases(body.client_id);
  }

  @Post('cases/:id')
  getCaseDetail(@Param('id') id: string, @Body() body: { client_id: string }) {
    return this.clientService.getCaseDetail(id, body.client_id);
  }

  @Post('cases/:id/documents')
  uploadDocument(
    @Param('id') id: string,
    @Body() body: { client_id: string; name: string; file_path: string; file_type?: string },
  ) {
    return this.clientService.uploadDocument(id, body.client_id, body);
  }

  @Post('cases/:id/documents')
  getCaseDocuments(@Param('id') id: string, @Body() body: { client_id: string }) {
    return this.clientService.getCaseDocuments(id, body.client_id);
  }

  @Post('ai/consult')
  aiConsult(@Body() body: { question: string }) {
    return this.clientService.aiConsult(body.question);
  }

  @Post('complaint')
  createComplaint(@Body() body: {
    type: ComplaintType;
    content: string;
    client_id: string;
    client_name: string;
    client_phone: string;
    organization_id: string;
    case_id?: string;
    evidence_files?: string;
  }) {
    return this.clientService.createComplaint(body);
  }

  @Post('complaints')
  getClientComplaints(@Body() body: { client_id: string }) {
    return this.clientService.getClientComplaints(body.client_id);
  }
}
