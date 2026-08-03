import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('social')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MARKETING, UserRole.SALES, UserRole.LAWYER, UserRole.ASSISTANT, UserRole.FINANCE)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ==================== 动态相关 ====================

  // 查询动态列表（支持 post_type 筛选和分页）
  @Get('posts')
  findAllPosts(
    @Query('post_type') post_type: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Request() req: any,
  ) {
    const orgId = req?.user?.organization_id;
    return this.socialService.findAllPosts(orgId, post_type, page, limit);
  }

  // 查询单条动态详情
  @Get('posts/:id')
  findOnePost(@Param('id') id: string) {
    return this.socialService.findOnePost(id);
  }

  // 创建动态
  @Post('posts')
  createPost(@Body() body: any, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.socialService.createPost(userId, orgId, body);
  }

  // 删除动态（仅作者可删）
  @Delete('posts/:id')
  deletePost(@Param('id') id: string, @Request() req: any) {
    const userId = req?.user?.id;
    return this.socialService.deletePost(id, userId);
  }

  // ==================== 评论相关 ====================

  // 查询动态的评论列表
  @Get('posts/:postId/comments')
  findComments(@Param('postId') postId: string) {
    return this.socialService.findComments(postId);
  }

  // 添加评论
  @Post('posts/:postId/comments')
  addComment(@Param('postId') postId: string, @Body() body: any, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.socialService.addComment(postId, userId, orgId, body?.content, body?.parent_id);
  }

  // 删除评论
  @Delete('comments/:id')
  deleteComment(@Param('id') id: string, @Request() req: any) {
    const userId = req?.user?.id;
    return this.socialService.deleteComment(id, userId);
  }

  // ==================== 点赞相关 ====================

  // 查询动态的点赞列表
  @Get('posts/:postId/likes')
  findLikes(@Param('postId') postId: string) {
    return this.socialService.findLikes(postId);
  }

  // 点赞
  @Post('posts/:postId/likes')
  likePost(@Param('postId') postId: string, @Request() req: any) {
    const userId = req?.user?.id;
    const orgId = req?.user?.organization_id;
    return this.socialService.likePost(postId, userId, orgId);
  }

  // 取消点赞
  @Delete('posts/:postId/likes')
  unlikePost(@Param('postId') postId: string, @Request() req: any) {
    const userId = req?.user?.id;
    return this.socialService.unlikePost(postId, userId);
  }
}
