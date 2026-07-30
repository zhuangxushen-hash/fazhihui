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

  async findAllByUserId(userId: string, isRead?: boolean): Promise<Notification[]> {
    const query = this.notificationRepository.createQueryBuilder('notification')
      .where('notification.receiver_id = :userId', { userId });
    
    if (isRead !== undefined) {
      query.andWhere('notification.is_read = :isRead', { isRead });
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
