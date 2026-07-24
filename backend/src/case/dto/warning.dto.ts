import { IsString, IsEnum, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { WarningType, WarningLevel, WarningStatus } from '../../types';

export class CreateWarningDto {
  @IsUUID()
  case_id: string;

  @IsEnum(WarningType)
  warning_type: WarningType;

  @IsEnum(WarningLevel)
  warning_level: WarningLevel;

  @IsDateString()
  target_date: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  advance_days?: number;
}

export class UpdateWarningDto {
  @IsOptional()
  @IsEnum(WarningStatus)
  status?: WarningStatus;

  @IsOptional()
  @IsString()
  handle_note?: string;

  @IsOptional()
  @IsUUID()
  handler_id?: string;
}

export class WarningFilterDto {
  @IsOptional()
  @IsEnum(WarningStatus)
  status?: WarningStatus;

  @IsOptional()
  @IsEnum(WarningLevel)
  warning_level?: WarningLevel;

  @IsOptional()
  @IsEnum(WarningType)
  warning_type?: WarningType;

  @IsOptional()
  @IsUUID()
  case_id?: string;
}