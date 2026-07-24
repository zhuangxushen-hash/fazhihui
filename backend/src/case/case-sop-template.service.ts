import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CaseSOPTemplate, CaseSOPStage, CaseTaskTemplate } from './case-sop-template.entity';
import { CaseType } from '../types';

@Injectable()
export class CaseSopTemplateService {
  constructor(
    @InjectRepository(CaseSOPTemplate)
    private sopTemplateRepository: Repository<CaseSOPTemplate>,
    private dataSource: DataSource,
  ) {}

  /**
   * 创建SOP模板
   */
  async create(templateData: Partial<CaseSOPTemplate>): Promise<CaseSOPTemplate> {
    // 如果设置为首默认模板，先取消同类型的其他默认模板
    if (templateData.is_default) {
      await this.unsetDefaultTemplate(templateData.case_type, templateData.organization_id);
    }

    const template = this.sopTemplateRepository.create(templateData);
    return this.sopTemplateRepository.save(template);
  }

  /**
   * 更新SOP模板
   */
  async update(id: string, updateData: Partial<CaseSOPTemplate>): Promise<CaseSOPTemplate> {
    const template = await this.sopTemplateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('SOP模板不存在');
    }

    // 如果设置为默认模板，先取消同类型的其他默认模板
    if (updateData.is_default && !template.is_default) {
      await this.unsetDefaultTemplate(template.case_type, template.organization_id);
    }

    Object.assign(template, updateData);
    return this.sopTemplateRepository.save(template);
  }

  /**
   * 删除SOP模板
   */
  async delete(id: string): Promise<void> {
    const template = await this.sopTemplateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('SOP模板不存在');
    }

    await this.sopTemplateRepository.delete(id);
  }

  /**
   * 查询SOP模板列表
   */
  async findAll(orgId?: string, caseType?: CaseType): Promise<CaseSOPTemplate[]> {
    const query = this.sopTemplateRepository.createQueryBuilder('template')
      .orderBy('template.created_at', 'DESC');

    if (orgId) {
      query.where('template.organization_id = :orgId OR template.organization_id IS NULL', { orgId });
    }

    if (caseType) {
      query.andWhere('template.case_type = :caseType', { caseType });
    }

    return query.getMany();
  }

  /**
   * 根据ID查询SOP模板
   */
  async findById(id: string): Promise<CaseSOPTemplate> {
    const template = await this.sopTemplateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('SOP模板不存在');
    }
    return template;
  }

  /**
   * 设置默认SOP模板
   */
  async setDefault(id: string): Promise<CaseSOPTemplate> {
    const template = await this.sopTemplateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('SOP模板不存在');
    }

    // 取消同类型的其他默认模板
    await this.unsetDefaultTemplate(template.case_type, template.organization_id);

    // 设置当前模板为默认
    template.is_default = true;
    return this.sopTemplateRepository.save(template);
  }

  /**
   * 启用/禁用SOP模板
   */
  async toggleEnabled(id: string): Promise<CaseSOPTemplate> {
    const template = await this.sopTemplateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('SOP模板不存在');
    }

    template.enabled = !template.enabled;
    return this.sopTemplateRepository.save(template);
  }

  /**
   * 获取指定案件类型的默认SOP模板
   */
  async getDefaultTemplate(caseType: CaseType, orgId?: string): Promise<CaseSOPTemplate | null> {
    const query = this.sopTemplateRepository.createQueryBuilder('template')
      .where('template.case_type = :caseType', { caseType })
      .andWhere('template.is_default = :isDefault', { isDefault: true })
      .andWhere('template.enabled = :enabled', { enabled: true });

    if (orgId) {
      query.andWhere('template.organization_id = :orgId OR template.organization_id IS NULL', { orgId });
    }

    return query.getOne();
  }

  /**
   * 取消同类型的默认模板
   */
  private async unsetDefaultTemplate(caseType: CaseType, orgId?: string): Promise<void> {
    const query = this.sopTemplateRepository.createQueryBuilder()
      .update(CaseSOPTemplate)
      .set({ is_default: false })
      .where('case_type = :caseType', { caseType })
      .andWhere('is_default = :isDefault', { isDefault: true });

    if (orgId) {
      query.andWhere('organization_id = :orgId', { orgId });
    } else {
      query.andWhere('organization_id IS NULL');
    }

    await query.execute();
  }

  /**
   * 初始化系统预置模板
   */
  async initializeSystemTemplates(): Promise<void> {
    const existingSystemTemplates = await this.sopTemplateRepository.find({
      where: { organization_id: null as any }
    });

    if (existingSystemTemplates.length > 0) {
      return; // 已存在系统模板，不重复初始化
    }

    const systemTemplates: Partial<CaseSOPTemplate>[] = [
      {
        name: '民事诉讼标准流程',
        case_type: CaseType.MARRIAGE,
        description: '民事案件标准办案流程',
        is_default: true,
        enabled: true,
        organization_id: null,
        stages: this.getCivilCaseStages(),
      },
      {
        name: '交通事故案件标准流程',
        case_type: CaseType.TRAFFIC,
        description: '交通事故案件标准办案流程',
        is_default: true,
        enabled: true,
        organization_id: null,
        stages: this.getTrafficCaseStages(),
      },
      {
        name: '劳动争议案件标准流程',
        case_type: CaseType.LABOR,
        description: '劳动争议案件标准办案流程',
        is_default: true,
        enabled: true,
        organization_id: null,
        stages: this.getLaborCaseStages(),
      },
      {
        name: '债务纠纷案件标准流程',
        case_type: CaseType.DEBT,
        description: '债务纠纷案件标准办案流程',
        is_default: true,
        enabled: true,
        organization_id: null,
        stages: this.getDebtCaseStages(),
      },
    ];

    for (const templateData of systemTemplates) {
      await this.sopTemplateRepository.save(this.sopTemplateRepository.create(templateData));
    }
  }

  /**
   * 民事案件阶段模板
   */
  private getCivilCaseStages(): CaseSOPStage[] {
    return [
      {
        stage_id: '1',
        stage_name: '立案阶段',
        order: 1,
        tasks: [
          {
            task_id: '1-1',
            task_name: '利益冲突检索',
            responsible_role: 'lawyer',
            deadline_days: 1,
            is_required: true,
            description: '检查是否存在利益冲突',
          },
          {
            task_id: '1-2',
            task_name: '签订委托合同',
            responsible_role: 'lawyer',
            deadline_days: 2,
            is_required: true,
            description: '与客户签订委托代理合同',
          },
          {
            task_id: '1-3',
            task_name: '收集证据材料',
            responsible_role: 'assistant',
            deadline_days: 5,
            is_required: true,
            description: '收集案件相关证据材料',
          },
        ],
      },
      {
        stage_id: '2',
        stage_name: '准备阶段',
        order: 2,
        tasks: [
          {
            task_id: '2-1',
            task_name: '起草起诉状',
            responsible_role: 'lawyer',
            deadline_days: 3,
            is_required: true,
            description: '根据证据材料起草起诉状',
          },
          {
            task_id: '2-2',
            task_name: '整理证据目录',
            responsible_role: 'assistant',
            deadline_days: 3,
            is_required: true,
            description: '整理并编号证据材料',
          },
          {
            task_id: '2-3',
            task_name: '提交立案申请',
            responsible_role: 'assistant',
            deadline_days: 7,
            is_required: true,
            description: '向法院提交立案材料',
          },
        ],
      },
      {
        stage_id: '3',
        stage_name: '审理阶段',
        order: 3,
        tasks: [
          {
            task_id: '3-1',
            task_name: '庭前准备',
            responsible_role: 'lawyer',
            deadline_days: 3,
            is_required: true,
            description: '准备庭审材料、证据原件',
          },
          {
            task_id: '3-2',
            task_name: '参加庭审',
            responsible_role: 'lawyer',
            deadline_days: 0,
            is_required: true,
            description: '按时参加庭审活动',
          },
          {
            task_id: '3-3',
            task_name: '提交代理词',
            responsible_role: 'lawyer',
            deadline_days: 5,
            is_required: true,
            description: '庭审后提交代理意见',
          },
        ],
      },
      {
        stage_id: '4',
        stage_name: '结案阶段',
        order: 4,
        tasks: [
          {
            task_id: '4-1',
            task_name: '领取裁判文书',
            responsible_role: 'assistant',
            deadline_days: 3,
            is_required: true,
            description: '领取并送达裁判文书',
          },
          {
            task_id: '4-2',
            task_name: '案件归档',
            responsible_role: 'assistant',
            deadline_days: 7,
            is_required: true,
            description: '整理卷宗并归档',
          },
        ],
      },
    ];
  }

  /**
   * 交通事故案件阶段模板
   */
  private getTrafficCaseStages(): CaseSOPStage[] {
    return [
      {
        stage_id: '1',
        stage_name: '立案阶段',
        order: 1,
        tasks: [
          {
            task_id: '1-1',
            task_name: '收集事故材料',
            responsible_role: 'assistant',
            deadline_days: 3,
            is_required: true,
            description: '收集事故认定书、医疗记录等',
          },
          {
            task_id: '1-2',
            task_name: '伤残鉴定',
            responsible_role: 'lawyer',
            deadline_days: 15,
            is_required: false,
            description: '协助申请伤残等级鉴定',
          },
        ],
      },
      {
        stage_id: '2',
        stage_name: '协商调解阶段',
        order: 2,
        tasks: [
          {
            task_id: '2-1',
            task_name: '计算赔偿金额',
            responsible_role: 'lawyer',
            deadline_days: 5,
            is_required: true,
            description: '根据法律规定计算赔偿明细',
          },
          {
            task_id: '2-2',
            task_name: '保险公司协商',
            responsible_role: 'lawyer',
            deadline_days: 10,
            is_required: true,
            description: '与保险公司协商理赔',
          },
        ],
      },
      {
        stage_id: '3',
        stage_name: '诉讼阶段',
        order: 3,
        tasks: [
          {
            task_id: '3-1',
            task_name: '提起诉讼',
            responsible_role: 'lawyer',
            deadline_days: 7,
            is_required: false,
            description: '协商不成时向法院起诉',
          },
          {
            task_id: '3-2',
            task_name: '参加庭审',
            responsible_role: 'lawyer',
            deadline_days: 0,
            is_required: true,
            description: '参加庭审活动',
          },
        ],
      },
    ];
  }

  /**
   * 劳动争议案件阶段模板
   */
  private getLaborCaseStages(): CaseSOPStage[] {
    return [
      {
        stage_id: '1',
        stage_name: '立案阶段',
        order: 1,
        tasks: [
          {
            task_id: '1-1',
            task_name: '收集劳动关系证据',
            responsible_role: 'assistant',
            deadline_days: 5,
            is_required: true,
            description: '收集劳动合同、工资流水等',
          },
          {
            task_id: '1-2',
            task_name: '仲裁前置审查',
            responsible_role: 'lawyer',
            deadline_days: 3,
            is_required: true,
            description: '审查是否需要仲裁前置',
          },
        ],
      },
      {
        stage_id: '2',
        stage_name: '仲裁阶段',
        order: 2,
        tasks: [
          {
            task_id: '2-1',
            task_name: '申请劳动仲裁',
            responsible_role: 'lawyer',
            deadline_days: 5,
            is_required: true,
            description: '向劳动仲裁委提交申请',
          },
          {
            task_id: '2-2',
            task_name: '参加仲裁庭审',
            responsible_role: 'lawyer',
            deadline_days: 0,
            is_required: true,
            description: '参加仲裁庭审活动',
          },
        ],
      },
      {
        stage_id: '3',
        stage_name: '诉讼阶段',
        order: 3,
        tasks: [
          {
            task_id: '3-1',
            task_name: '提起诉讼',
            responsible_role: 'lawyer',
            deadline_days: 15,
            is_required: false,
            description: '对仲裁裁决不服时提起诉讼',
          },
        ],
      },
    ];
  }

  /**
   * 债务纠纷案件阶段模板
   */
  private getDebtCaseStages(): CaseSOPStage[] {
    return [
      {
        stage_id: '1',
        stage_name: '立案阶段',
        order: 1,
        tasks: [
          {
            task_id: '1-1',
            task_name: '债务凭证审查',
            responsible_role: 'lawyer',
            deadline_days: 3,
            is_required: true,
            description: '审查借条、转账记录等证据',
          },
          {
            task_id: '1-2',
            task_name: '债务人财产调查',
            responsible_role: 'assistant',
            deadline_days: 7,
            is_required: false,
            description: '调查债务人财产线索',
          },
        ],
      },
      {
        stage_id: '2',
        stage_name: '诉讼阶段',
        order: 2,
        tasks: [
          {
            task_id: '2-1',
            task_name: '申请财产保全',
            responsible_role: 'lawyer',
            deadline_days: 3,
            is_required: false,
            description: '申请财产保全措施',
          },
          {
            task_id: '2-2',
            task_name: '提起诉讼',
            responsible_role: 'lawyer',
            deadline_days: 7,
            is_required: true,
            description: '向法院提起诉讼',
          },
        ],
      },
      {
        stage_id: '3',
        stage_name: '执行阶段',
        order: 3,
        tasks: [
          {
            task_id: '3-1',
            task_name: '申请强制执行',
            responsible_role: 'lawyer',
            deadline_days: 15,
            is_required: true,
            description: '申请法院强制执行',
          },
          {
            task_id: '3-2',
            task_name: '跟进执行进度',
            responsible_role: 'assistant',
            deadline_days: 30,
            is_required: true,
            description: '持续跟进执行情况',
          },
        ],
      },
    ];
  }
}