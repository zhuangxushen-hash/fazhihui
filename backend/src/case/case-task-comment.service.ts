import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseTaskComment, CommentType } from './case-task-comment.entity';

@Injectable()
export class CaseTaskCommentService {
  constructor(
    @InjectRepository(CaseTaskComment)
    private commentRepository: Repository<CaseTaskComment>,
  ) {}

  /**
   * 添加评论
   */
  async addComment(taskId: string, userId: string, content: string): Promise<CaseTaskComment> {
    const comment = this.commentRepository.create({
      task_id: taskId,
      user_id: userId,
      type: CommentType.COMMENT,
      content,
    });
    return this.commentRepository.save(comment);
  }

  /**
   * 上传成果
   */
  async uploadResult(
    taskId: string,
    userId: string,
    fileUrl: string,
    fileName: string,
    fileType: string,
    content?: string,
  ): Promise<CaseTaskComment> {
    const comment = this.commentRepository.create({
      task_id: taskId,
      user_id: userId,
      type: CommentType.RESULT,
      content: content || `上传成果: ${fileName}`,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
    });
    return this.commentRepository.save(comment);
  }

  /**
   * 记录状态变更
   */
  async recordStatusChange(
    taskId: string,
    userId: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<CaseTaskComment> {
    const comment = this.commentRepository.create({
      task_id: taskId,
      user_id: userId,
      type: CommentType.STATUS_CHANGE,
      content: `状态从 ${oldStatus} 变更为 ${newStatus}`,
      metadata: { oldStatus, newStatus },
    });
    return this.commentRepository.save(comment);
  }

  /**
   * 记录指派变更
   */
  async recordAssignChange(
    taskId: string,
    userId: string,
    oldAssignee: string,
    newAssignee: string,
  ): Promise<CaseTaskComment> {
    const comment = this.commentRepository.create({
      task_id: taskId,
      user_id: userId,
      type: CommentType.ASSIGN_CHANGE,
      content: `指派人从 ${oldAssignee || '未指派'} 变更为 ${newAssignee}`,
      metadata: { oldAssignee, newAssignee },
    });
    return this.commentRepository.save(comment);
  }

  /**
   * 获取任务的评论和成果列表
   */
  async getTaskComments(taskId: string): Promise<CaseTaskComment[]> {
    return this.commentRepository.find({
      where: { task_id: taskId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId: string): Promise<void> {
    await this.commentRepository.delete(commentId);
  }
}