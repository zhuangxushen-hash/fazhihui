import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(notificationData: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationRepository.create(notificationData);
    return this.notificationRepository.save(notification);
  }

  /**
   * 便捷通知方法：封装 title/content/receiver_id/related_type/related_id，失败静默不影响主流程
   */
  async notify(params: {
    receiver_id: string;
    title: string;
    content: string;
    type?: string;
    level?: string;
    sender_id?: string;
    related_type?: string;
    related_id?: string;
  }): Promise<void> {
    try {
      await this.notificationRepository.save({
        receiver_id: params.receiver_id,
        title: params.title,
        content: params.content,
        type: params.type || 'system',
        level: params.level || 'normal',
        sender_id: params.sender_id || null,
        related_type: params.related_type || null,
        related_id: params.related_id || null,
      });
    } catch (e) {
      // 通知失败不影响主流程
    }
  }

  async findAllByUserId(userId: string, isRead?: boolean): Promise<Notification[]> {
    const query = this.notificationRepository.createQueryBuilder('notification')
      .where('notification.receiver_id = :userId', { userId });
    
    if (isRead !== undefined) {
      query.andWhere('notification.is_read = :isRead', { isRead });
    }

    return query.orderBy('notification.created_at', 'DESC').getMany();
  }

  // 管理端查询所有通知，支持按类型、级别、已读状态筛选和关键词搜索
  async findAll(params: { type?: string; level?: string; isRead?: boolean; keyword?: string }): Promise<Notification[]> {
    const query = this.notificationRepository.createQueryBuilder('notification');

    if (params.type) {
      query.andWhere('notification.type = :type', { type: params.type });
    }
    if (params.level) {
      query.andWhere('notification.level = :level', { level: params.level });
    }
    if (params.isRead !== undefined) {
      query.andWhere('notification.is_read = :isRead', { isRead: params.isRead });
    }
    if (params.keyword) {
      query.andWhere('(notification.title LIKE :keyword OR notification.content LIKE :keyword)', {
        keyword: `%${params.keyword}%`,
      });
    }

    return query.orderBy('notification.created_at', 'DESC').getMany();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { receiver_id: userId, is_read: false },
    });
  }

  async findById(id: string): Promise<Notification> {
    return this.notificationRepository.findOne({ where: { id } });
  }

  async markAsRead(id: string): Promise<Notification> {
    await this.notificationRepository.update(id, { is_read: true });
    return this.notificationRepository.findOne({ where: { id } });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ is_read: true })
      .where('receiver_id = :userId', { userId })
      .andWhere('is_read = :isRead', { isRead: false })
      .execute();
  }

  async delete(id: string): Promise<void> {
    await this.notificationRepository.delete(id);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('receiver_id = :userId', { userId })
      .execute();
  }
}
