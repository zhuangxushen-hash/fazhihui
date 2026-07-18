import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from '../case/case.entity';
import { Document } from '../case/document.entity';
import { Complaint } from '../compliance/complaint.entity';
import { ComplaintType, ComplaintStatus } from '../types';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Complaint)
    private complaintRepository: Repository<Complaint>,
  ) {}

  async getClientCases(clientId: string): Promise<Case[]> {
    return this.caseRepository.find({ where: { client_id: clientId }, order: { created_at: 'DESC' } });
  }

  async getCaseDetail(caseId: string, clientId: string): Promise<Case> {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity || caseEntity.client_id !== clientId) {
      throw new Error('案件不存在或无权访问');
    }
    return caseEntity;
  }

  async uploadDocument(caseId: string, clientId: string, documentData: Partial<Document>): Promise<Document> {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity || caseEntity.client_id !== clientId) {
      throw new Error('案件不存在或无权访问');
    }
    const document = this.documentRepository.create({ ...documentData, case_id: caseId, uploaded_by_id: clientId });
    return this.documentRepository.save(document);
  }

  async getCaseDocuments(caseId: string, clientId: string): Promise<Document[]> {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity || caseEntity.client_id !== clientId) {
      throw new Error('案件不存在或无权访问');
    }
    return this.documentRepository.find({ where: { case_id: caseId }, order: { created_at: 'DESC' } });
  }

  async aiConsult(question: string): Promise<{ answer: string; related_laws: string[] }> {
    return {
      answer: `针对您的问题"${question}"，我们为您提供以下法律建议：\n\n1. 请先明确您遇到的具体法律问题类型\n2. 收集相关证据材料\n3. 建议咨询专业律师获取一对一服务\n\n如需进一步帮助，请联系我们的客服团队。`,
      related_laws: ['中华人民共和国民法典', '中华人民共和国民事诉讼法', '中华人民共和国律师法'],
    };
  }

  async createComplaint(complaintData: {
    type: ComplaintType;
    content: string;
    client_id: string;
    client_name: string;
    client_phone: string;
    case_id?: string;
    evidence_files?: string;
    organization_id: string;
  }): Promise<Complaint> {
    const complaint = this.complaintRepository.create({
      ...complaintData,
      status: ComplaintStatus.NEW,
    });
    return this.complaintRepository.save(complaint);
  }

  async getClientComplaints(clientId: string): Promise<Complaint[]> {
    return this.complaintRepository.find({ where: { client_id: clientId }, order: { created_at: 'DESC' } });
  }
}
