import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';
import { LawToolService } from './law-tool.service';

@Controller('law-tools')
@UseGuards(JwtAuthGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ORG_ADMIN,
  UserRole.MARKETING,
  UserRole.SALES,
  UserRole.LAWYER,
  UserRole.ASSISTANT,
  UserRole.FINANCE,
  UserRole.CLIENT,
)
export class LawToolController {
  constructor(private readonly lawToolService: LawToolService) {}

  // 返回法律工具导航列表（11大类，100+工具）
  @Get()
  async findList() {
    return this.lawToolService.findList();
  }
}
