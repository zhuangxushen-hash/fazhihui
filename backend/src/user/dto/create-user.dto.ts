import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../types';

export class CreateUserDto {
  @IsString()
  real_name: string;

  @IsString()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsOptional()
  credentials_no?: string;

  @IsString()
  @IsOptional()
  organization_id?: string;
}
