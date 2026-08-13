import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  viewer_id: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  viewer_nickname?: string;

  @IsString()
  @IsOptional()
  viewer_avatar?: string;
}
