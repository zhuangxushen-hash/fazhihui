import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { NumberRule, FlowType } from './number-rule.entity';
import { NumberSequence } from './number-sequence.entity';
import { NumberDepartment } from './number-department.entity';
import { Organization } from '../user/organization.entity';
import { Contract } from '../contract/contract.entity';

@Injectable()
export class NumberRuleService {
  constructor(
    @InjectRepository(NumberRule)
    private readonly ruleRepository: Repository<NumberRule>,
    @InjectRepository(NumberSequence)
    private readonly sequenceRepository: Repository<NumberSequence>,
    @InjectRepository(NumberDepartment)
    private readonly departmentRepository: Repository<NumberDepartment>,
    private readonly dataSource: DataSource,
  ) {}

  // ==================== 编号规则 CRUD ====================

  // 规则列表（可按编号类型筛选）
  async listRules(orgId: string, numberType?: string): Promise<NumberRule[]> {
    const qb = this.ruleRepository
      .createQueryBuilder('r')
      .where('r.organization_id = :orgId', { orgId });
    if (numberType) {
      qb.andWhere('r.number_type = :numberType', { numberType });
    }
    return qb
      .orderBy('r.number_type', 'ASC')
      .addOrderBy('r.biz_type', 'ASC')
      .addOrderBy('r.dept_code', 'ASC')
      .getMany();
  }

  // 新建规则
  async createRule(orgId: string, body: any): Promise<NumberRule> {
    const rule = new NumberRule();
    Object.assign(rule, body, { organization_id: orgId });
    return this.ruleRepository.save(rule);
  }

  // 更新规则
  async updateRule(orgId: string, id: string, body: any): Promise<NumberRule> {
    const rule = await this.ruleRepository.findOne({ where: { id, organization_id: orgId } });
    if (!rule) {
      throw new NotFoundException('编号规则不存在');
    }
    Object.assign(rule, body);
    return this.ruleRepository.save(rule);
  }

  // 删除规则
  async deleteRule(orgId: string, id: string): Promise<void> {
    const rule = await this.ruleRepository.findOne({ where: { id, organization_id: orgId } });
    if (!rule) {
      throw new NotFoundException('编号规则不存在');
    }
    await this.ruleRepository.remove(rule);
  }

  // ==================== 编号部门 CRUD ====================

  // 部门列表
  async listDepartments(orgId: string): Promise<NumberDepartment[]> {
    return this.departmentRepository.find({
      where: { organization_id: orgId },
      order: { dept_code: 'ASC' },
    });
  }

  // 新建部门
  async createDepartment(orgId: string, body: any): Promise<NumberDepartment> {
    const dept = new NumberDepartment();
    Object.assign(dept, body, { organization_id: orgId });
    return this.departmentRepository.save(dept);
  }

  // 更新部门
  async updateDepartment(orgId: string, id: string, body: any): Promise<NumberDepartment> {
    const dept = await this.departmentRepository.findOne({ where: { id, organization_id: orgId } });
    if (!dept) {
      throw new NotFoundException('编号部门不存在');
    }
    Object.assign(dept, body);
    return this.departmentRepository.save(dept);
  }

  // 删除部门
  async deleteDepartment(orgId: string, id: string): Promise<void> {
    const dept = await this.departmentRepository.findOne({ where: { id, organization_id: orgId } });
    if (!dept) {
      throw new NotFoundException('编号部门不存在');
    }
    await this.departmentRepository.remove(dept);
  }

  // 按部门名称解析部门代码
  async resolveDeptCode(orgId: string, deptName: string): Promise<string | null> {
    if (!deptName) return null;
    const dept = await this.departmentRepository.findOne({
      where: { organization_id: orgId, dept_name: deptName, enabled: true },
    });
    return dept ? dept.dept_code : null;
  }

  // ==================== 编号生成引擎 ====================

  // 生成编号；未配置启用规则时返回 null，由调用方回退原逻辑
  // manager 可选：调用方已在事务内时传入，避免 sqlite 嵌套事务
  async generateNumber(
    orgId: string,
    opts: {
      numberType: string;
      bizType: string;
      deptCode?: string | null;
      caseId?: string;
      contractNo?: string;
    },
    manager?: EntityManager,
  ): Promise<string | null> {
    // 1. 查找启用规则（优先部门代码，否则默认规则）
    const rule = await this.findRule(orgId, opts.numberType, opts.bizType, opts.deptCode || null, manager);
    if (!rule) return null;

    // 2. 递增流水号（事务内，传入 manager 时复用外层事务）
    const seq = await this.nextSeq(orgId, rule, opts.deptCode || rule.dept_code || null, manager);

    // 3. 渲染模板
    return this.render(orgId, rule, seq, opts);
  }

  // 业务类型映射：案件分类 -> 合同/归档编号业务类型
  static mapCategoryToBizType(category?: string): string {
    const map: Record<string, string> = {
      民事: '民事诉讼',
      刑事: '刑事诉讼',
      行政: '行政诉讼',
      顾问: '常年顾问',
      非诉: '非诉/专项',
    };
    return (category && map[category]) || category || '';
  }

  // 业务类型映射：合同类型 -> 编号业务类型
  static mapContractTypeToBizType(type?: string): string {
    const map: Record<string, string> = {
      entrust: '民事诉讼',
      consultant: '常年顾问',
      other: '咨询/代书',
    };
    return (type && map[type]) || type || '';
  }

  // 查找启用规则：优先匹配部门代码，否则回退默认（无部门代码）规则
  private async findRule(
    orgId: string,
    numberType: string,
    bizType: string,
    deptCode: string | null,
    manager?: EntityManager,
  ): Promise<NumberRule | null> {
    const repo = manager ? manager.getRepository(NumberRule) : this.ruleRepository;
    const base = repo
      .createQueryBuilder('r')
      .where('r.organization_id = :orgId', { orgId })
      .andWhere('r.number_type = :numberType', { numberType })
      .andWhere('r.biz_type = :bizType', { bizType })
      .andWhere('r.enabled = :enabled', { enabled: true });

    let rule: NumberRule | null = null;
    if (deptCode) {
      rule = await base.clone().andWhere('r.dept_code = :deptCode', { deptCode }).getOne();
    }
    if (!rule) {
      rule = await base
        .clone()
        .andWhere('(r.dept_code IS NULL OR r.dept_code = :empty)', { empty: '' })
        .getOne();
    }
    return rule;
  }

  // 递增流水号（事务内，传入 manager 时复用外层事务）
  private async nextSeq(
    orgId: string,
    rule: NumberRule,
    deptCode: string | null,
    manager?: EntityManager,
  ): Promise<number> {
    const now = new Date();
    const year = rule.reset_yearly ? String(now.getFullYear()) : 'all';
    // 分类流水按部门维度，总流水/单独编号按 组织+类型+业务类型+年份 维度
    const useDept = rule.flow_type === FlowType.CATEGORY;

    const run = async (em: EntityManager): Promise<number> => {
      const seqRepo = em.getRepository(NumberSequence);
      const where: any = {
        organization_id: orgId,
        number_type: rule.number_type,
        biz_type: rule.biz_type,
        year,
      };
      if (useDept) {
        where.dept_code = deptCode || '';
      }

      let seqRec = await seqRepo.findOne({ where });
      if (!seqRec) {
        seqRec = new NumberSequence();
        Object.assign(seqRec, where, { seq: 0 });
      }
      seqRec.seq = (seqRec.seq || 0) + 1;
      await seqRepo.save(seqRec);
      return seqRec.seq;
    };

    if (manager) {
      return run(manager);
    }
    return this.dataSource.transaction(run);
  }

  // 渲染编号模板
  private async render(
    orgId: string,
    rule: NumberRule,
    seq: number,
    opts: { deptCode?: string | null; caseId?: string; contractNo?: string },
  ): Promise<string> {
    // 组织简称
    const org = await this.dataSource
      .getRepository(Organization)
      .findOne({ where: { id: orgId } });
    const shortName = org?.short_name || org?.name || '';

    const now = new Date();
    const y = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    // 案件挂接：取关联案件合同号
    let contractNo = opts.contractNo || '';
    if (rule.link_case && !contractNo && opts.caseId) {
      contractNo = await this.getCaseContractNo(opts.caseId);
    }

    let result = rule.format;
    result = result
      .replace(/\{year\}/g, String(y))
      .replace(/\{shortName\}/g, shortName)
      .replace(/\{deptCode\}/g, opts.deptCode || rule.dept_code || '')
      .replace(/\{bizWord\}/g, rule.biz_word || '')
      .replace(/\{date\}/g, `${y}${mm}${dd}`)
      .replace(/\{contractNo\}/g, contractNo);
    // 流水号：支持 {seq:3} 补零位数语法，以及普通 {seq}
    result = result.replace(/\{seq:(\d+)\}/g, (_m: string, pad: string) =>
      String(seq).padStart(Number(pad), '0'),
    );
    result = result.replace(/\{seq\}/g, String(seq));
    return result;
  }

  // 查询案件首个合同号（用于法律文书案件挂接）
  private async getCaseContractNo(caseId: string): Promise<string> {
    const rows: { contract_no?: string }[] = await this.dataSource
      .getRepository(Contract)
      .createQueryBuilder('c')
      .select('c.contract_no', 'contract_no')
      .where('c.case_id = :caseId', { caseId })
      .andWhere('c.contract_no IS NOT NULL')
      .orderBy('c.created_at', 'ASC')
      .limit(1)
      .getRawMany();
    return rows.length > 0 ? rows[0].contract_no || '' : '';
  }

  // 预览编号（不消耗流水号）
  async preview(orgId: string, body: any): Promise<{ number: string }> {
    const rule = this.ruleRepository.create({ ...body, organization_id: orgId } as NumberRule);
    const now = new Date();
    const year = rule.reset_yearly ? String(now.getFullYear()) : 'all';
    const useDept = rule.flow_type === FlowType.CATEGORY;
    const where: any = {
      organization_id: orgId,
      number_type: rule.number_type,
      biz_type: rule.biz_type,
      year,
    };
    if (useDept) {
      where.dept_code = body.dept_code || '';
    }
    const seqRec = await this.sequenceRepository.findOne({ where });
    const nextSeq = (seqRec?.seq || 0) + 1;
    const number = await this.render(orgId, rule, nextSeq, {
      deptCode: body.dept_code,
      contractNo: body.contract_no,
      caseId: body.case_id,
    });
    return { number };
  }
}
