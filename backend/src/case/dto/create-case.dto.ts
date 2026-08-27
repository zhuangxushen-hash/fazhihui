import { IsNotEmpty, IsOptional, IsString, IsDateString, IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { CaseType } from '../../types';

export class CreateCaseDto {
  @IsOptional()
  @IsString()
  case_no?: string;

  @IsNotEmpty()
  @IsString()
  client_name: string;

  @IsOptional()
  @IsString()
  client_phone?: string;

  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsString()
  client_type?: string;

  @IsNotEmpty()
  @IsEnum(CaseType, { message: 'case_type必须是合法的枚举值 (marriage/traffic/labor/debt/other)' })
  case_type: string;

  @IsOptional()
  @IsString()
  case_category?: string;

  // 案件名称（区别于案由 case_type）
  @IsOptional()
  @IsString()
  case_name?: string;

  @IsOptional()
  @IsString()
  court?: string;

  @IsOptional()
  @IsString()
  opposing_party?: string;

  @IsOptional()
  @IsString()
  opposing_party_type?: string;

  @IsOptional()
  @IsString()
  opposing_agent?: string;

  @IsOptional()
  @IsString()
  court_room?: string;

  @IsOptional()
  @IsString()
  case_source?: string;

  @IsOptional()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  quality_deposit?: number;

  @IsOptional()
  @IsDateString()
  filing_date?: string;

  // 开庭日期（真实节点，用于开庭预警）
  @IsOptional()
  @IsDateString()
  hearing_date?: string;

  // 举证期限（真实节点，用于举证期限预警）
  @IsOptional()
  @IsDateString()
  evidence_deadline?: string;

  // 上诉期限（真实节点，用于上诉期限预警）
  @IsOptional()
  @IsDateString()
  appeal_deadline?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_confidential?: boolean;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  organization_id?: string;

  // 新增字段
  @IsOptional()
  @IsString()
  lead_id?: string;

  @IsOptional()
  @IsString()
  contact_address?: string;

  @IsOptional()
  @IsString()
  case_number?: string;

  @IsOptional()
  @IsString()
  court_level?: string;

  @IsOptional()
  @IsString()
  appeal_level?: string;

  @IsOptional()
  @IsString()
  retrial_level?: string;

  @IsOptional()
  @IsString()
  enforcement_level?: string;

  @IsOptional()
  @IsString()
  plaintiff?: string;

  @IsOptional()
  @IsString()
  plaintiff_agent?: string;

  @IsOptional()
  @IsString()
  defendant?: string;

  @IsOptional()
  @IsString()
  defendant_agent?: string;

  @IsOptional()
  @IsString()
  fee_type?: string;

  @IsOptional()
  @IsString()
  billing_cycle?: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsString()
  handler?: string;

  @IsOptional()
  @IsString()
  co_handler?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  progress?: number;

  @IsOptional()
  @IsString()
  next_step?: string;

  @IsOptional()
  @IsDateString()
  next_step_deadline?: string;

  // 律师团队（详情页团队模块已有）
  @IsOptional()
  @IsString()
  team_id?: string;

  // 来源明细
  @IsOptional()
  @IsString()
  source_detail?: string;

  // 转介绍人
  @IsOptional()
  @IsString()
  referrer?: string;

  // 委托费（费用）
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fee_amount?: number;

  // 服务费
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  service_fee?: number;
}