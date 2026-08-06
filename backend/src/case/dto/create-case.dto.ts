import { IsNotEmpty, IsOptional, IsString, IsDateString, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CaseType } from '../../types';

export class CreateCaseDto {
  @IsOptional()
  @IsString()
  case_no?: string;

  @IsOptional()
  @IsString()
  case_name?: string;

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

  @IsOptional()
  @IsString()
  court?: string;

  @IsOptional()
  @IsString()
  opposing_party?: string;

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

  @IsOptional()
  @IsDateString()
  expected_close_date?: string;

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
}