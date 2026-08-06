import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CaseWarning } from './case-warning.entity';
import { Case } from './case.entity';
import { User } from '../user/user.entity';
import { WarningType, WarningLevel, WarningStatus, CaseStatus, UserRole } from '../types';
import { NotificationService } from '../user/notification.service';
import { CreateWarningDto, UpdateWarningDto, WarningFilterDto } from './dto/warning.dto';

interface WarningRule {
  type: WarningType;
  advanceDays: number[];
  level: WarningLevel;
  description: string;
}

@Injectable()
export class CaseWarningService {
  private readonly logger = new Logger(CaseWarningService.name);
  private runningTasks: Set<string> = new Set();

  // 预警规则配置
  private readonly warningRules: WarningRule[] = [
    {
      type: WarningType.EVIDENCE_PERIOD,
      advanceDays: [7, 3, 1],
      level: WarningLevel.WARNING,
      description: '举证期即将到期',
    },
    {
      type: WarningType.APPEAL_PERIOD,
      advanceDays: [7, 3, 1],
      level: WarningLevel.WARNING,
      description: '上诉期即将到期',
    },
    {
      type: WarningType.HEARING_DATE,
      advanceDays: [7, 3, 1],
      level: WarningLevel.REMINDER,
      description: '开庭时间临近',
    },
    {
      type: WarningType.PRESERVATION_EXPIRE,
      advanceDays: [7, 3, 1],
      level: WarningLevel.WARNING,
      description: '保全即将到期',
    },
    {
      type: WarningType.STATUTE_EXPIRE,
      advanceDays: [30, 14, 7, 3, 1],
      level: WarningLevel.URGENT,
      description: '诉讼时效即将到期',
    },
    {
      type: WarningType.PAYMENT_DEADLINE,
      advanceDays: [7, 3, 1],
      level: WarningLevel.WARNING,
      description: '缴费期限即将到期',
    },
  ];

  constructor(
    @InjectRepository(CaseWarning)
    private warningRepository: Repository<CaseWarning>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  // 创建预警
  async create(createWarningDto: CreateWarningDto): Promise<CaseWarning> {
    const warning = this.warningRepository.create({
      ...createWarningDto,
      warning_date: new Date(),
      target_date: new Date(createWarningDto.target_date),
      status: WarningStatus.PENDING,
    });
    return await this.warningRepository.save(warning);
  }

  // 查询预警列表
  async findAll(filter?: WarningFilterDto): Promise<CaseWarning[]> {
    const query = this.warningRepository.createQueryBuilder('warning')
      .leftJoinAndSelect('warning.case', 'case')
      .leftJoinAndSelect('warning.handler', 'handler');

    if (filter) {
      if (filter.status) {
        query.andWhere('warning.status = :status', { status: filter.status });
      }
      if (filter.warning_level) {
        query.andWhere('warning.warning_level = :level', { level: filter.warning_level });
      }
      if (filter.warning_type) {
        query.andWhere('warning.warning_type = :type', { type: filter.warning_type });
      }
      if (filter.case_id) {
        query.andWhere('warning.case_id = :caseId', { caseId: filter.case_id });
      }
    }

    return await query.orderBy('warning.warning_date', 'DESC').getMany();
  }

  // 查询预警详情
  async findOne(id: string): Promise<CaseWarning> {
    return await this.warningRepository.findOne({
      where: { id },
      relations: { case: true, handler: true },
    });
  }

  // 更新预警状态（处理预警）
  async update(id: string, updateWarningDto: UpdateWarningDto): Promise<CaseWarning> {
    const warning = await this.warningRepository.findOne({ where: { id } });
    if (!warning) {
      throw new Error('预警不存在');
    }

    Object.assign(warning, updateWarningDto);

    if (updateWarningDto.status === WarningStatus.PROCESSED) {
      warning.handled_at = new Date();
    }

    return await this.warningRepository.save(warning);
  }

  // 获取预警统计
  async getStatistics(organizationId?: string): Promise<any> {
    const query = this.warningRepository.createQueryBuilder('warning')
      .leftJoin('warning.case', 'case');

    if (organizationId) {
      query.where('case.organization_id = :orgId', { orgId: organizationId });
    }

    const total = await query.getCount();

    const pendingCount = await query.clone()
      .andWhere('warning.status = :status', { status: WarningStatus.PENDING })
      .getCount();

    const overdueCount = await query.clone()
      .andWhere('warning.status = :status', { status: WarningStatus.OVERDUE })
      .getCount();

    const reminderCount = await query.clone()
      .andWhere('warning.warning_level = :level', { level: WarningLevel.REMINDER })
      .andWhere('warning.status = :status', { status: WarningStatus.PENDING })
      .getCount();

    const warningCount = await query.clone()
      .andWhere('warning.warning_level = :level', { level: WarningLevel.WARNING })
      .andWhere('warning.status = :status', { status: WarningStatus.PENDING })
      .getCount();

    const urgentCount = await query.clone()
      .andWhere('warning.warning_level = :level', { level: WarningLevel.URGENT })
      .andWhere('warning.status = :status', { status: WarningStatus.PENDING })
      .getCount();

    return {
      total,
      pending: pendingCount,
      overdue: overdueCount,
      byLevel: {
        reminder: reminderCount,
        warning: warningCount,
        urgent: urgentCount,
      },
    };
  }

  // 每日凌晨扫描生成预警
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateWarnings() {
    const taskKey = 'generateWarnings';
    if (this.runningTasks.has(taskKey)) return;
    this.runningTasks.add(taskKey);
    try {
      this.logger.log('开始扫描案件关键节点，生成预警...');

      const cases = await this.caseRepository.find({
        where: {
          status: In([
            CaseStatus.PROCESSING,
            CaseStatus.FILING,
            CaseStatus.EVIDENCE,
            CaseStatus.HEARING,
            CaseStatus.APPEAL,
          ]),
        },
        relations: { assignee_lawyer: true },
      });

      this.logger.log(`找到 ${cases.length} 个在办案件需要检查`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      interface WarningCandidate {
        case_id: string;
        warning_type: WarningType;
        target_date: Date;
        advance_days: number;
        level: WarningLevel;
        description: string;
        status: WarningStatus;
      }

      const candidates: WarningCandidate[] = [];

      for (const caseEntity of cases) {
        if (caseEntity.deadline) {
          const target = new Date(caseEntity.deadline);
          target.setHours(0, 0, 0, 0);
          const daysDiff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const rule = this.warningRules.find(r => r.type === WarningType.STATUTE_EXPIRE);
          if (rule && rule.advanceDays.includes(daysDiff)) {
            let level = rule.level;
            if (daysDiff <= 1) level = WarningLevel.URGENT;
            else if (daysDiff <= 3) level = WarningLevel.WARNING;
            candidates.push({
              case_id: caseEntity.id,
              warning_type: WarningType.STATUTE_EXPIRE,
              target_date: target,
              advance_days: daysDiff,
              level,
              description: `${rule.description}（剩余${daysDiff}天）`,
              status: daysDiff < 0 ? WarningStatus.OVERDUE : WarningStatus.PENDING,
            });
          }
        }

        if (caseEntity.expected_close_date) {
          const target = new Date(caseEntity.expected_close_date);
          target.setHours(0, 0, 0, 0);
          const daysDiff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const rule = this.warningRules.find(r => r.type === WarningType.HEARING_DATE);
          if (rule && rule.advanceDays.includes(daysDiff)) {
            let level = rule.level;
            if (daysDiff <= 1) level = WarningLevel.URGENT;
            else if (daysDiff <= 3) level = WarningLevel.WARNING;
            candidates.push({
              case_id: caseEntity.id,
              warning_type: WarningType.HEARING_DATE,
              target_date: target,
              advance_days: daysDiff,
              level,
              description: `${rule.description}（剩余${daysDiff}天）`,
              status: daysDiff < 0 ? WarningStatus.OVERDUE : WarningStatus.PENDING,
            });
          }
        }
      }

      if (candidates.length === 0) {
        this.logger.log('没有需要生成的预警');
        return;
      }

      // 批量查询已存在的预警（防止重复创建）
      const caseIds = [...new Set(candidates.map(c => c.case_id))];
      const existingWarnings = await this.warningRepository.find({
        where: {
          case_id: In(caseIds),
          status: In([WarningStatus.PENDING, WarningStatus.OVERDUE]),
        },
      });

      const existingSet = new Set<string>();
      for (const w of existingWarnings) {
        const key = `${w.case_id}::${w.warning_type}::${w.target_date.getTime?.() ?? w.target_date}::${w.advance_days}`;
        existingSet.add(key);
      }

      // 过滤掉已存在的预警，批量创建新的
      const toCreate: CaseWarning[] = [];
      for (const c of candidates) {
        const key = `${c.case_id}::${c.warning_type}::${c.target_date.getTime?.() ?? c.target_date}::${c.advance_days}`;
        if (!existingSet.has(key)) {
          toCreate.push(this.warningRepository.create({
            case_id: c.case_id,
            warning_type: c.warning_type,
            warning_level: c.level,
            warning_date: today,
            target_date: c.target_date,
            advance_days: c.advance_days,
            description: c.description,
            status: c.status,
          }));
        }
      }

      if (toCreate.length > 0) {
        await this.warningRepository.save(toCreate);
      }

      this.logger.log(`预警生成完成，共生成 ${toCreate.length} 条预警`);
    } catch (error) {
      this.logger.error('生成预警时发生错误:', error);
    } finally {
      this.runningTasks.delete(taskKey);
    }
  }

  // 检查案件的关键时间节点
  private async checkCaseDeadlines(caseEntity: Case): Promise<number> {
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 检查案件截止时间
    if (caseEntity.deadline) {
      count += await this.checkAndGenerateWarning(
        caseEntity,
        WarningType.STATUTE_EXPIRE,
        caseEntity.deadline,
      );
    }

    // 检查预期结案时间
    if (caseEntity.expected_close_date) {
      count += await this.checkAndGenerateWarning(
        caseEntity,
        WarningType.HEARING_DATE,
        caseEntity.expected_close_date,
      );
    }

    return count;
  }

  // 检查并生成预警
  private async checkAndGenerateWarning(
    caseEntity: Case,
    warningType: WarningType,
    targetDate: Date,
  ): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const daysDiff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 获取该类型的预警规则
    const rule = this.warningRules.find(r => r.type === warningType);
    if (!rule) return 0;

    // 检查是否需要生成预警
    if (!rule.advanceDays.includes(daysDiff)) return 0;

    // 检查是否已存在相同的预警
    const existingWarning = await this.warningRepository.findOne({
      where: {
        case_id: caseEntity.id,
        warning_type: warningType,
        target_date: target,
        advance_days: daysDiff,
        status: In([WarningStatus.PENDING, WarningStatus.OVERDUE]),
      },
    });

    if (existingWarning) return 0;

    // 确定预警级别
    let level = rule.level;
    if (daysDiff <= 1) {
      level = WarningLevel.URGENT;
    } else if (daysDiff <= 3) {
      level = WarningLevel.WARNING;
    }

    // 创建预警
    const warning = this.warningRepository.create({
      case_id: caseEntity.id,
      warning_type: warningType,
      warning_level: level,
      warning_date: today,
      target_date: target,
      advance_days: daysDiff,
      description: `${rule.description}（剩余${daysDiff}天）`,
      status: daysDiff < 0 ? WarningStatus.OVERDUE : WarningStatus.PENDING,
    });

    await this.warningRepository.save(warning);
    this.logger.log(`案件 ${caseEntity.case_no} 生成预警: ${rule.description}`);

    return 1;
  }

  // 每小时检查超期预警并升级
  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueWarnings() {
    const taskKey = 'checkOverdueWarnings';
    if (this.runningTasks.has(taskKey)) return;
    this.runningTasks.add(taskKey);
    try {
      this.logger.log('开始检查超期预警...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueWarnings = await this.warningRepository
        .createQueryBuilder('warning')
        .leftJoinAndSelect('warning.case', 'case')
        .where('warning.target_date < :today', { today })
        .andWhere('warning.status = :status', { status: WarningStatus.PENDING })
        .getMany();

      this.logger.log(`找到 ${overdueWarnings.length} 条超期预警`);

      const toUpdate: CaseWarning[] = [];
      for (const warning of overdueWarnings) {
        warning.status = WarningStatus.OVERDUE;
        warning.warning_level = WarningLevel.URGENT;
        toUpdate.push(warning);
      }

      if (toUpdate.length > 0) {
        await this.warningRepository.save(toUpdate);
      }

      for (const warning of overdueWarnings) {
        if (warning.case && warning.case.assignee_lawyer_id) {
          await this.notifyOverdue(warning);
        }
      }

      this.logger.log('超期预警检查完成');
    } catch (error) {
      this.logger.error('检查超期预警时发生错误:', error);
    } finally {
      this.runningTasks.delete(taskKey);
    }
  }

  // 通知超期预警（可扩展为推送通知）
  private async notifyOverdue(warning: CaseWarning) {
    // 这里可以扩展为发送邮件、短信、站内信等通知
    this.logger.warn(
      `预警超期通知: 案件 ${warning.case?.case_no} 的 ${warning.warning_type} 已超期`,
    );
    // CaseWarning 实体使用 handler_id 作为接收人字段
    await this.notificationService.notify({
      receiver_id: warning.handler_id || '',
      title: '案件预警超期',
      content: `案件 ${warning.case?.case_no || warning.case_id} 的预警 ${warning.warning_type} 已超期`,
      type: 'warning',
      level: 'high',
      related_type: 'CaseWarning',
      related_id: warning.id,
    });
  }

  // 手动触发预警生成（用于测试）
  async triggerWarningGeneration(): Promise<{ message: string; count: number }> {
    await this.generateWarnings();
    const stats = await this.getStatistics();
    return {
      message: '预警生成完成',
      count: stats.pending + stats.overdue,
    };
  }
}