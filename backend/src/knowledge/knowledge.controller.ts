import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeArticle } from './knowledge-article.entity';
import { LawRegulation } from './law-regulation.entity';
import { CasePrecedent } from './case-precedent.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('knowledge')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.SALES)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  // ============ 律所知识文章 ============

  // 查询文章列表
  @Get('articles')
  findArticles(
    @Query('keyword') keyword: string,
    @Query('category') category: string,
    @Query('author_id') authorId: string,
    @Query('status') status: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.knowledgeService.findArticles(orgId, {
      keyword,
      category,
      author_id: authorId,
      status,
    });
  }

  // 创建文章
  @Post('articles')
  createArticle(@Body() body: Partial<KnowledgeArticle>, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.knowledgeService.createArticle(userId, orgId, body);
  }

  // 更新文章
  @Put('articles/:id')
  updateArticle(@Param('id') id: string, @Body() body: Partial<KnowledgeArticle>) {
    return this.knowledgeService.updateArticle(id, body);
  }

  // 删除文章
  @Delete('articles/:id')
  deleteArticle(@Param('id') id: string) {
    return this.knowledgeService.deleteArticle(id);
  }

  // 浏览量+1
  @Get('articles/:id/view')
  incrementView(@Param('id') id: string) {
    return this.knowledgeService.incrementView(id);
  }

  // ============ 法律法规 ============

  // 查询法规列表
  @Get('law-regulations')
  findLawRegulations(
    @Query('keyword') keyword: string,
    @Query('category') category: string,
  ) {
    return this.knowledgeService.findLawRegulations({ keyword, category });
  }

  // 创建法规
  @Post('law-regulations')
  createLawRegulation(@Body() body: Partial<LawRegulation>) {
    return this.knowledgeService.createLawRegulation(body);
  }

  // 更新法规
  @Put('law-regulations/:id')
  updateLawRegulation(@Param('id') id: string, @Body() body: Partial<LawRegulation>) {
    return this.knowledgeService.updateLawRegulation(id, body);
  }

  // 删除法规
  @Delete('law-regulations/:id')
  deleteLawRegulation(@Param('id') id: string) {
    return this.knowledgeService.deleteLawRegulation(id);
  }

  // ============ 裁判文书 ============

  // 查询判例列表
  @Get('case-precedents')
  findCasePrecedents(
    @Query('keyword') keyword: string,
    @Query('court') court: string,
    @Query('case_type') caseType: string,
    @Query('judgment_type') judgmentType: string,
  ) {
    return this.knowledgeService.findCasePrecedents({
      keyword,
      court,
      case_type: caseType,
      judgment_type: judgmentType,
    });
  }

  // 创建判例
  @Post('case-precedents')
  createCasePrecedent(@Body() body: Partial<CasePrecedent>) {
    return this.knowledgeService.createCasePrecedent(body);
  }

  // 更新判例
  @Put('case-precedents/:id')
  updateCasePrecedent(@Param('id') id: string, @Body() body: Partial<CasePrecedent>) {
    return this.knowledgeService.updateCasePrecedent(id, body);
  }

  // 删除判例
  @Delete('case-precedents/:id')
  deleteCasePrecedent(@Param('id') id: string) {
    return this.knowledgeService.deleteCasePrecedent(id);
  }
}
