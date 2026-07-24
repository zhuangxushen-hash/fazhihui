import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CaseWarning } from './case-warning.entity';
import { Case } from './case.entity';
import { User } from '../user/user.entity';
import { WarningType, WarningLevel, WarningStatus, CaseStatus, UserRole } from '../types';
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
    this.logger.log('开始扫描案件关键节点，生成预警...');

    try {
      // 获取所有在办案件
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

      let generatedCount = 0;

      for (const caseEntity of cases) {
        // 检查案件的各个关键时间节点
        generatedCount += await this.checkCaseDeadlines(caseEntity);
      }

      this.logger.log(`预警生成完成，共生成 ${generatedCount} 条预警`);
    } catch (error) {
      this.logger.error('生成预警时发生错误:', error);
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
    this.logger.log('开始检查超期预警...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 查找所有已超期但未标记的预警
      const overdueWarnings = await this.warningRepository
        .createQueryBuilder('warning')
        .leftJoinAndSelect('warning.case', 'case')
        .where('warning.target_date < :today', { today })
        .andWhere('warning.status = :status', { status: WarningStatus.PENDING })
        .getMany();

      this.logger.log(`找到 ${overdueWarnings.length} 条超期预警`);

      for (const warning of overdueWarnings) {
        // 更新为超期状态
        warning.status = WarningStatus.OVERDUE;
        warning.warning_level = WarningLevel.URGENT;

        await this.warningRepository.save(warning);

        // 如果案件有指派律师，发送通知
        if (warning.case && warning.case.assignee_lawyer_id) {
          await this.notifyOverdue(warning);
        }
      }

      this.logger.log('超期预警检查完成');
    } catch (error) {
      this.logger.error('检查超期预警时发生错误:', error);
    }
  }

  // 通知超期预警（可扩展为推送通知）
  private async notifyOverdue(warning: CaseWarning) {
    // 这里可以扩展为发送邮件、短信、站内信等通知
    this.logger.warn(
      `预警超期通知: 案件 ${warning.case?.case_no} 的 ${warning.warning_type} 已超期`,
    );
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