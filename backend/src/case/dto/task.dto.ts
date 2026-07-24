import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsBoolean, IsDateString, IsUUID } from 'class-validator';

/**
 * 创建任务 DTO
 */
export class CreateTaskDto {
  @IsUUID()
  case_id: string;

  @IsString()
  task_name: string;

  @IsString()
  @IsOptional()
  stage_id?: string;

  @IsString()
  @IsOptional()
  stage_name?: string;

  @IsNumber()
  @IsOptional()
  stage_order?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  responsible_role?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: string;
}

/**
 * 更新任务 DTO
 */
export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  task_name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @IsString()
  @IsOptional()
  result?: string;
}

/**
 * 更新任务状态 DTO
 */
export class UpdateTaskStatusDto {
  @IsEnum(['pending', 'in_progress', 'completed', 'verified', 'overdue', 'cancelled'])
  status: string;

  @IsString()
  @IsOptional()
  result?: string;
}

/**
 * 指派任务 DTO
 */
export class AssignTaskDto {
  @IsUUID()
  assignee_id: string;
}

/**
 * 更新任务进度 DTO
 */
export class UpdateTaskProgressDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;
}

/**
 * 添加评论 DTO
 */
export class AddCommentDto {
  @IsString()
  content: string;
}

/**
 * 上传成果 DTO
 */
export class UploadResultDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  file_url: string;

  @IsString()
  file_name: string;

  @IsString()
  file_type: string;
}