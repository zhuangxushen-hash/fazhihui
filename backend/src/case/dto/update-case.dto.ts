import { IsOptional, IsString, IsDateString, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CaseType } from '../../types';

// 案件详情编辑更新 DTO：仅允许更新可编辑字段，案件编号/状态等由系统专用接口控制
export class UpdateCaseDto {
  @IsOptional()
  @IsString()
  client_name?: string;

  @IsOptional()
  @IsString()
  client_phone?: string;

  @IsOptional()
  @IsString()
  client_type?: string;

  @IsOptional()
  @IsEnum(CaseType, { message: 'case_type必须是合法的枚举值 (marriage/traffic/labor/debt/other)' })
  case_type?: string;

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
  court_room?: string;

  @IsOptional()
  @IsString()
  court_level?: string;

  @IsOptional()
  @IsString()
  opposing_party?: string;

  @IsOptional()
  @IsString()
  opposing_party_type?: string;

  @IsOptional()
  @IsString()
  opposing_agent?: string;

  // 多人当事人JSON数组（text）：[{name, phone, type}]
  @IsOptional()
  @IsString()
  participants?: string;

  @IsOptional()
  @IsString()
  case_source?: string;

  @IsOptional()
  @IsString()
  source_detail?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  handler?: string;

  @IsOptional()
  @IsString()
  co_handler?: string;

  // 协助律师ID数组JSON（text）：["userId1","userId2"]，支持多人协办（参考金助理协办多人能力）
  @IsOptional()
  @IsString()
  assistant_lawyer_ids?: string;

  @IsOptional()
  @IsString()
  team_id?: string;

  @IsOptional()
  @IsString()
  next_step?: string;

  @IsOptional()
  @IsDateString()
  next_step_deadline?: string;

  @IsOptional()
  @Type(() => Number)
  progress?: number;

  @IsOptional()
  @IsDateString()
  filing_date?: string;

  @IsOptional()
  @IsDateString()
  hearing_date?: string;

  @IsOptional()
  @IsDateString()
  evidence_deadline?: string;

  @IsOptional()
  @IsDateString()
  appeal_deadline?: string;

  @IsOptional()
  @IsString()
  case_number?: string;

  @IsOptional()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  fee_amount?: number;

  @IsOptional()
  @Type(() => Number)
  service_fee?: number;

  @IsOptional()
  @Type(() => Number)
  quality_deposit?: number;

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
  payment_status?: string;

  @IsOptional()
  @IsString()
  contract_return_status?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_confidential?: boolean;
}