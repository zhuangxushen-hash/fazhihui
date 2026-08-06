import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Receivable, ReceivableStatus } from './receivable.entity';
import { OverdueWarning, WarningStatus } from './overdue-warning.entity';
import { NotificationService } from '../user/notification.service';

@Injectable()
export class OverdueWarningService {
  private readonly logger = new Logger(OverdueWarningService.name);

  constructor(
    @InjectRepository(Receivable)
    private receivableRepository: Repository<Receivable>,
    @InjectRepository(OverdueWarning)
    private warningRepository: Repository<OverdueWarning>,
    private notificationService: NotificationService,
  ) {}

  /**
   * 每天凌晨 1 点检查逾期应收
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkOverdueReceivables() {
    this.logger.log('开始检查逾期应收...');
    
    try {
      const now = new Date();
      const receivables = await this.receivableRepository.find({
        where: [
          { status: ReceivableStatus.PENDING },
          { status: ReceivableStatus.PARTIAL },
        ],
      });

      interface WarningTask {
        receivable: Receivable;
        installmentId: string | null;
        overdueAmount: number;
        dueDate: Date;
      }
      const tasks: WarningTask[] = [];
      const receivableStatusUpdates: Map<string, boolean> = new Map();
      const installmentUpdates: Map<string, Map<string, boolean>> = new Map();

      for (const receivable of receivables) {
        if (receivable.pending_amount > 0) {
          if (!receivable.installment_plan || receivable.installment_plan.length === 0) {
            const createdDate = new Date(receivable.created_at);
            const dueDate = new Date(createdDate);
            dueDate.setDate(dueDate.getDate() + 30);

            if (now > dueDate) {
              tasks.push({ receivable, installmentId: null, overdueAmount: receivable.pending_amount, dueDate });
              receivableStatusUpdates.set(receivable.id, true);
            }
          } else {
            let receivableOverdue = false;
            for (const installment of receivable.installment_plan) {
              if (installment.status === 'pending' || installment.status === 'overdue') {
                const dueDate = new Date(installment.due_date);
                if (now > dueDate) {
                  tasks.push({ receivable, installmentId: installment.installment_id, overdueAmount: installment.amount, dueDate });
                  receivableOverdue = true;
                  if (!installmentUpdates.has(receivable.id)) {
                    installmentUpdates.set(receivable.id, new Map());
                  }
                  installmentUpdates.get(receivable.id)!.set(installment.installment_id, true);
                }
              }
            }
            if (receivableOverdue) {
              receivableStatusUpdates.set(receivable.id, true);
            }
          }
        }
      }

      if (tasks.length > 0) {
        await this.batchCreateOrUpdateWarnings(tasks, receivableStatusUpdates, installmentUpdates);
      }

      this.logger.log('逾期应收检查完成');
    } catch (error) {
      this.logger.error('检查逾期应收失败', error);
    }
  }

  private async batchCreateOrUpdateWarnings(
    tasks: Array<{ receivable: Receivable; installmentId: string | null; overdueAmount: number; dueDate: Date }>,
    receivableStatusUpdates: Map<string, boolean>,
    installmentUpdates: Map<string, Map<string, boolean>>,
  ) {
    const now = new Date();

    const warningKeys = tasks.map(t => ({
      receivable_id: t.receivable.id,
      installment_id: t.installmentId || undefined,
    }));

    const receivableIds = [...new Set(tasks.map(t => t.receivable.id))];
    const existingWarnings = receivableIds.length > 0
      ? await this.warningRepository.find({
          where: {
            receivable_id: In(receivableIds),
            status: WarningStatus.PENDING,
          },
        })
      : [];

    const existingMap = new Map<string, OverdueWarning>();
    for (const w of existingWarnings) {
      const key = `${w.receivable_id}::${w.installment_id || 'null'}`;
      existingMap.set(key, w);
    }

    const warningsToUpdate: OverdueWarning[] = [];
    const warningsToCreate: OverdueWarning[] = [];
    const notifyTasks: Array<{ receivable: Receivable }> = [];

    for (const task of tasks) {
      const overdueDays = Math.floor((now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const key = `${task.receivable.id}::${task.installmentId || 'null'}`;
      const existing = existingMap.get(key);

      if (existing) {
        existing.overdue_days = overdueDays;
        existing.overdue_amount = task.overdueAmount;
        warningsToUpdate.push(existing);
      } else {
        const warning = this.warningRepository.create({
          receivable_id: task.receivable.id,
          case_id: task.receivable.case_id,
          installment_id: task.installmentId || undefined,
          overdue_amount: task.overdueAmount,
          overdue_days: overdueDays,
          due_date: task.dueDate,
          organization_id: task.receivable.organization_id,
          status: WarningStatus.PENDING,
        });
        warningsToCreate.push(warning);
        notifyTasks.push({ receivable: task.receivable });
      }
    }

    if (warningsToUpdate.length > 0) {
      await this.warningRepository.save(warningsToUpdate);
    }
    if (warningsToCreate.length > 0) {
      await this.warningRepository.save(warningsToCreate);
    }

    for (const { receivable } of notifyTasks) {
      try {
        await this.notificationService.notify({
          receiver_id: '',
          title: '应收账款逾期',
          content: `案件 ${receivable.case_id} 的应收账款已逾期`,
          type: 'finance',
          level: 'high',
          related_type: 'Receivable',
          related_id: receivable.id,
        });
      } catch (e) {}
    }

    const receivablesToUpdate: Receivable[] = [];
    for (const receivable of tasks.map(t => t.receivable)) {
      if (receivableStatusUpdates.has(receivable.id) && receivable.status !== ReceivableStatus.OVERDUE) {
        receivable.status = ReceivableStatus.OVERDUE as any;
      }
      if (installmentUpdates.has(receivable.id) && receivable.installment_plan) {
        const updateMap = installmentUpdates.get(receivable.id)!;
        receivable.installment_plan = receivable.installment_plan.map(item => {
          if (updateMap.has(item.installment_id)) {
            return { ...item, status: 'overdue' as const };
          }
          return item;
        });
      }
      if (receivableStatusUpdates.has(receivable.id) || installmentUpdates.has(receivable.id)) {
        receivablesToUpdate.push(receivable);
      }
    }

    const uniqueReceivables = new Map<string, Receivable>();
    for (const r of receivablesToUpdate) {
      uniqueReceivables.set(r.id, r);
    }
    if (uniqueReceivables.size > 0) {
      await this.receivableRepository.save([...uniqueReceivables.values()]);
    }
  }

  /**
   * 查询逾期预警列表
   */
  async findWarnings(orgId: string, status?: string): Promise<OverdueWarning[]> {
    const query: any = { organization_id: orgId };
    if (status) {
      query.status = status;
    }
    return this.warningRepository.find({ where: query, order: { updated_at: 'DESC' } });
  }

  /**
   * 标记预警为已通知
   */
  async markAsNotified(id: string): Promise<OverdueWarning> {
    await this.warningRepository.update(id, {
      status: WarningStatus.NOTIFIED,
    });
    return this.warningRepository.findOne({ where: { id } });
  }

  /**
   * 标记预警为已解决
   */
  async markAsResolved(id: string, remarks?: string): Promise<OverdueWarning> {
    await this.warningRepository.update(id, {
      status: WarningStatus.RESOLVED,
      remarks,
    });
    return this.warningRepository.findOne({ where: { id } });
  }

  /**
   * 手动触发检查（用于测试）
   */
  async manualCheck(): Promise<string> {
    await this.checkOverdueReceivables();
    return '手动检查完成';
  }
}