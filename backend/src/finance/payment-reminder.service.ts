import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { PaymentReminder, REMINDER_STATUS } from './payment-reminder.entity';
import { NotificationService } from '../user/notification.service';
import { FinanceService } from './finance.service';
import { Receivable } from './receivable.entity';
import { PaymentMethod } from './payment-record.entity';

@Injectable()
export class PaymentReminderService {
  constructor(
    @InjectRepository(PaymentReminder)
    private reminderRepository: Repository<PaymentReminder>,
    private notificationService: NotificationService,
    // 使用 forwardRef 注入 FinanceService，防止潜在的循环依赖
    @Inject(forwardRef(() => FinanceService))
    private financeService: FinanceService,
    @InjectRepository(Receivable)
    private receivableRepository: Repository<Receivable>,
  ) {}

  // 创建催款记录
  async create(data: Partial<PaymentReminder>): Promise<PaymentReminder> {
    // 自动计算欠款金额 = 应收 - 已收
    const receivable = Number(data.receivable_amount) || 0;
    const received = Number(data.received_amount) || 0;
    data.overdue_amount = Math.max(receivable - received, 0);
    const reminder = this.reminderRepository.create(data);
    return this.reminderRepository.save(reminder);
  }

  // 查询催款记录列表，支持 status / keyword 筛选
  async findAll(
    orgId: string,
    status?: string,
    keyword?: string,
  ): Promise<PaymentReminder[]> {
    const where: any = {};
    if (orgId) {
      where.organization_id = orgId;
    }
    if (status) {
      where.status = status;
    }
    if (keyword) {
      where.client_name = Like(`%${keyword}%`);
    }
    return this.reminderRepository.find({
      where,
      order: { updated_at: 'DESC' },
    });
  }

  // 查询单条详情
  async findOne(id: string): Promise<PaymentReminder> {
    return this.reminderRepository.findOne({ where: { id } });
  }

  // 更新催款记录
  async update(id: string, data: Partial<PaymentReminder>): Promise<PaymentReminder> {
    // 如果更新了应收或已收，重新计算欠款
    if (data.receivable_amount !== undefined || data.received_amount !== undefined) {
      const existing = await this.reminderRepository.findOne({ where: { id } });
      const receivable = Number(data.receivable_amount ?? existing.receivable_amount) || 0;
      const received = Number(data.received_amount ?? existing.received_amount) || 0;
      data.overdue_amount = Math.max(receivable - received, 0);
    }
    await this.reminderRepository.update(id, data);
    return this.reminderRepository.findOne({ where: { id } });
  }

  // 删除催款记录
  async remove(id: string): Promise<void> {
    await this.reminderRepository.delete(id);
  }

  // 催款操作：催款次数+1，更新上次催款日期，状态置为催款中
  async remind(id: string, userId?: string): Promise<PaymentReminder> {
    const existing = await this.reminderRepository.findOne({ where: { id } });
    if (!existing) {
      return null;
    }
    const today = new Date();
    // 下次催款日期默认7天后
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + 7);

    await this.reminderRepository.update(id, {
      reminder_count: (existing.reminder_count || 0) + 1,
      last_reminder_date: today,
      next_reminder_date: nextDate,
      status: REMINDER_STATUS.REMINDING,
    });
    const result = await this.reminderRepository.findOne({ where: { id } });
    // PaymentReminder 无明确的接收人字段，暂用空字符串
    await this.notificationService.notify({
      receiver_id: '',
      title: '催款提醒',
      content: `催款记录 ${id} 已执行第 ${existing.reminder_count + 1} 次提醒`,
      type: 'finance',
      level: 'normal',
      related_type: 'PaymentReminder',
      related_id: id,
    });
    return result;
  }

  // 标记已回款
  async markPaid(id: string): Promise<PaymentReminder> {
    const existing = await this.reminderRepository.findOne({ where: { id } });
    if (!existing) {
      return null;
    }
    await this.reminderRepository.update(id, {
      status: REMINDER_STATUS.PAID,
      received_amount: existing.receivable_amount,
      overdue_amount: 0,
    });
    const result = await this.reminderRepository.findOne({ where: { id } });

    // H5: 若关联了 receivable_id，则调用 FinanceService.recordPayment 创建收款记录回写应收
    if (existing.receivable_id) {
      try {
        // 收款金额取催款记录的应收金额
        const amount = Number(existing.receivable_amount) || 0;
        if (amount > 0) {
          // 若未关联 case_id，尝试从应收台账补全
          let caseId = existing.case_id;
          if (!caseId) {
            const receivable = await this.receivableRepository.findOne({
              where: { id: existing.receivable_id },
            });
            caseId = receivable?.case_id;
          }
          await this.financeService.recordPayment(
            existing.receivable_id,
            amount,
            PaymentMethod.BANK,
            undefined,
            `催款记录 ${id} 标记已回款`,
            caseId ? undefined : undefined,
          );
        }
      } catch (err) {
        // 回写应收失败不影响主流程，静默处理
      }
    }

    return result;
  }

  // 放弃催款
  async giveUp(id: string): Promise<PaymentReminder> {
    await this.reminderRepository.update(id, {
      status: REMINDER_STATUS.GIVEN_UP,
    });
    return this.reminderRepository.findOne({ where: { id } });
  }
}
