import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receivable, ReceivableStatus } from './receivable.entity';
import { OverdueWarning, WarningStatus } from './overdue-warning.entity';

@Injectable()
export class OverdueWarningService {
  private readonly logger = new Logger(OverdueWarningService.name);

  constructor(
    @InjectRepository(Receivable)
    private receivableRepository: Repository<Receivable>,
    @InjectRepository(OverdueWarning)
    private warningRepository: Repository<OverdueWarning>,
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

      for (const receivable of receivables) {
        // 检查整体应收是否逾期
        if (receivable.pending_amount > 0) {
          // 如果没有分期计划，检查整体是否逾期（默认合同签订后30天）
          if (!receivable.installment_plan || receivable.installment_plan.length === 0) {
            const createdDate = new Date(receivable.created_at);
            const dueDate = new Date(createdDate);
            dueDate.setDate(dueDate.getDate() + 30); // 默认30天应收期

            if (now > dueDate) {
              await this.createOrUpdateWarning(receivable, null, receivable.pending_amount, dueDate);
            }
          } else {
            // 检查分期计划中的逾期项
            for (const installment of receivable.installment_plan) {
              if (installment.status === 'pending' || installment.status === 'overdue') {
                const dueDate = new Date(installment.due_date);
                if (now > dueDate) {
                  await this.createOrUpdateWarning(
                    receivable,
                    installment.installment_id,
                    installment.amount,
                    dueDate,
                  );
                }
              }
            }
          }
        }
      }

      this.logger.log('逾期应收检查完成');
    } catch (error) {
      this.logger.error('检查逾期应收失败', error);
    }
  }

  /**
   * 创建或更新逾期预警
   */
  private async createOrUpdateWarning(
    receivable: Receivable,
    installmentId: string | null,
    overdueAmount: number,
    dueDate: Date,
  ) {
    const now = new Date();
    const overdueDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    // 查找是否已存在预警记录
    const existingWarning = await this.warningRepository.findOne({
      where: {
        receivable_id: receivable.id,
        installment_id: installmentId || undefined,
        status: WarningStatus.PENDING,
      },
    });

    if (existingWarning) {
      // 更新逾期天数
      await this.warningRepository.update(existingWarning.id, {
        overdue_days: overdueDays,
        overdue_amount: overdueAmount,
      });
    } else {
      // 创建新的预警记录
      const warning = this.warningRepository.create({
        receivable_id: receivable.id,
        case_id: receivable.case_id,
        installment_id: installmentId || undefined,
        overdue_amount: overdueAmount,
        overdue_days: overdueDays,
        due_date: dueDate,
        organization_id: receivable.organization_id,
        status: WarningStatus.PENDING,
      });
      await this.warningRepository.save(warning);
    }

    // 更新应收台账状态为逾期
    if (receivable.status !== ReceivableStatus.OVERDUE) {
      await this.receivableRepository.update(receivable.id, {
        status: ReceivableStatus.OVERDUE,
      });
    }

    // 更新分期计划状态
    if (installmentId && receivable.installment_plan) {
      const updatedPlan = receivable.installment_plan.map(item => {
        if (item.installment_id === installmentId) {
          return { ...item, status: 'overdue' as const };
        }
        return item;
      });
      await this.receivableRepository.update(receivable.id, {
        installment_plan: updatedPlan,
      });
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
    return this.warningRepository.find({ where: query, order: { created_at: 'DESC' } });
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