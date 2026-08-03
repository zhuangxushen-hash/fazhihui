import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Mail, MailType } from './mail.entity';

@Injectable()
export class MailService {
  constructor(
    @InjectRepository(Mail)
    private readonly mailRepository: Repository<Mail>,
  ) {}

  // 发送邮件（为每个收件人创建一条inbox记录，发件人创建一条sent记录）
  async send(
    senderId: string,
    orgId: string,
    data: {
      recipient_ids: string[];
      cc_ids?: string[];
      subject: string;
      content: string;
      attachments?: any[];
    },
  ): Promise<Mail> {
    const now = new Date();
    const recipientIds = data.recipient_ids || [];
    const ccIds = data.cc_ids || [];
    const attachments = data.attachments || [];

    // 为每个收件人创建一条 inbox 记录（recipient_ids 字段仅存该收件人ID）
    for (const recipientId of recipientIds) {
      const inboxMail = this.mailRepository.create({
        sender_id: senderId,
        recipient_ids: JSON.stringify([recipientId]),
        cc_ids: ccIds.length > 0 ? JSON.stringify(ccIds) : null,
        subject: data.subject,
        content: data.content,
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
        is_read: false,
        is_starred: false,
        mail_type: MailType.INBOX,
        sent_time: now,
        organization_id: orgId,
      });
      await this.mailRepository.save(inboxMail);
    }

    // 为发件人创建一条 sent 记录（保留完整 recipient_ids）
    const sentMail = this.mailRepository.create({
      sender_id: senderId,
      recipient_ids: JSON.stringify(recipientIds),
      cc_ids: ccIds.length > 0 ? JSON.stringify(ccIds) : null,
      subject: data.subject,
      content: data.content,
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
      is_read: true,
      is_starred: false,
      mail_type: MailType.SENT,
      sent_time: now,
      organization_id: orgId,
    });
    return this.mailRepository.save(sentMail);
  }

  // 保存草稿
  async saveDraft(senderId: string, orgId: string, data: Partial<Mail>): Promise<Mail> {
    const draft = this.mailRepository.create({
      sender_id: senderId,
      recipient_ids: data.recipient_ids ? (typeof data.recipient_ids === 'string' ? data.recipient_ids : JSON.stringify(data.recipient_ids)) : '[]',
      cc_ids: data.cc_ids ? (typeof data.cc_ids === 'string' ? data.cc_ids : JSON.stringify(data.cc_ids)) : null,
      subject: data.subject || '',
      content: data.content || '',
      attachments: data.attachments ? (typeof data.attachments === 'string' ? data.attachments : JSON.stringify(data.attachments)) : null,
      is_read: false,
      is_starred: false,
      mail_type: MailType.DRAFT,
      organization_id: orgId,
    });
    return this.mailRepository.save(draft);
  }

  // 收件箱（当前用户的inbox类型邮件）
  async findInbox(
    userId: string,
    orgId: string,
    keyword?: string,
    isRead?: boolean,
    isStarred?: boolean,
  ): Promise<Mail[]> {
    const qb = this.mailRepository
      .createQueryBuilder('m')
      .where('m.organization_id = :orgId', { orgId })
      .andWhere('m.mail_type = :mailType', { mailType: MailType.INBOX })
      .andWhere('m.recipient_ids LIKE :userId', { userId: `%"${userId}"%` });

    if (keyword) {
      qb.andWhere('(m.subject LIKE :kw OR m.content LIKE :kw)', { kw: `%${keyword}%` });
    }
    if (isRead !== undefined && isRead !== null) {
      qb.andWhere('m.is_read = :isRead', { isRead });
    }
    if (isStarred !== undefined && isStarred !== null) {
      qb.andWhere('m.is_starred = :isStarred', { isStarred });
    }

    qb.orderBy('m.sent_time', 'DESC');
    return qb.getMany();
  }

  // 已发送（当前用户的sent类型邮件）
  async findSent(userId: string, orgId: string): Promise<Mail[]> {
    return this.mailRepository.find({
      where: { sender_id: userId, organization_id: orgId, mail_type: MailType.SENT },
      order: { sent_time: 'DESC' },
    });
  }

  // 草稿箱
  async findDrafts(userId: string, orgId: string): Promise<Mail[]> {
    return this.mailRepository.find({
      where: { sender_id: userId, organization_id: orgId, mail_type: MailType.DRAFT },
      order: { created_at: 'DESC' },
    });
  }

  // 已删除（当前用户作为收件人或发件人的trash类型邮件）
  async findTrash(userId: string, orgId: string): Promise<Mail[]> {
    const qb = this.mailRepository
      .createQueryBuilder('m')
      .where('m.organization_id = :orgId', { orgId })
      .andWhere('m.mail_type = :mailType', { mailType: MailType.TRASH })
      .andWhere('(m.sender_id = :userId OR m.recipient_ids LIKE :userIdLike)', {
        userId,
        userIdLike: `%"${userId}"%`,
      })
      .orderBy('m.created_at', 'DESC');
    return qb.getMany();
  }

  // 标记已读
  async markAsRead(id: string): Promise<Mail> {
    const mail = await this.mailRepository.findOne({ where: { id } });
    if (!mail) {
      throw new NotFoundException('邮件不存在');
    }
    await this.mailRepository.update(id, { is_read: true });
    return this.mailRepository.findOne({ where: { id } });
  }

  // 星标切换
  async toggleStar(id: string): Promise<Mail> {
    const mail = await this.mailRepository.findOne({ where: { id } });
    if (!mail) {
      throw new NotFoundException('邮件不存在');
    }
    await this.mailRepository.update(id, { is_starred: !mail.is_starred });
    return this.mailRepository.findOne({ where: { id } });
  }

  // 移到已删除
  async moveToTrash(id: string): Promise<Mail> {
    const mail = await this.mailRepository.findOne({ where: { id } });
    if (!mail) {
      throw new NotFoundException('邮件不存在');
    }
    await this.mailRepository.update(id, { mail_type: MailType.TRASH });
    return this.mailRepository.findOne({ where: { id } });
  }

  // 彻底删除
  async remove(id: string): Promise<void> {
    const mail = await this.mailRepository.findOne({ where: { id } });
    if (!mail) {
      throw new NotFoundException('邮件不存在');
    }
    await this.mailRepository.delete(id);
  }
}
