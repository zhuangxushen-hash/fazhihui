import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { TalkSOP, OpportunitySOPProgress, TalkSOPNode, TalkSOPNodeType, SOPNodeStatus } from './talk-sop.entity';
import { Opportunity } from './opportunity.entity';
import { Lead } from './lead.entity';
import { User } from '../user/user.entity';
import { UserRole } from '../types';

@Injectable()
export class TalkSOPService {
  constructor(
    @InjectRepository(TalkSOP)
    private sopRepository: Repository<TalkSOP>,
    @InjectRepository(OpportunitySOPProgress)
    private progressRepository: Repository<OpportunitySOPProgress>,
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  // ==================== SOP模板管理 ====================

  // 创建SOP模板
  async createSOP(
    userId: string,
    name: string,
    caseType?: string,
    nodes?: Partial<TalkSOPNode>[],
    isDefault?: boolean,
  ) {
    // 权限检查：仅管理员可操作
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ORG_ADMIN)) {
      throw new ForbiddenException('仅管理员可操作SOP模板');
    }

    // 如果设置为默认模板，先清除同类型的其他默认模板
    if (isDefault) {
      await this.sopRepository.update(
        { case_type: caseType || null, is_default: true },
        { is_default: false },
      );
    }

    // 处理节点数据
    const processedNodes: TalkSOPNode[] = (nodes || []).map((node, index) => ({
      node_id: node.node_id || this.generateUUID(),
      node_name: node.node_name || '',
      node_type: node.node_type || TalkSOPNodeType.INFO_INPUT,
      is_required: node.is_required !== undefined ? node.is_required : false,
      order: node.order !== undefined ? node.order : index,
      description: node.description,
    }));

    const sop = this.sopRepository.create({
      name,
      case_type: caseType,
      nodes: JSON.stringify(processedNodes),
      is_default: isDefault || false,
      enabled: true,
    });

    return this.sopRepository.save(sop);
  }

  // 编辑SOP模板
  async updateSOP(
    sopId: string,
    userId: string,
    name?: string,
    caseType?: string,
    nodes?: Partial<TalkSOPNode>[],
    isDefault?: boolean,
  ) {
    // 权限检查
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ORG_ADMIN)) {
      throw new ForbiddenException('仅管理员可操作SOP模板');
    }

    const sop = await this.sopRepository.findOne({ where: { id: sopId } });
    if (!sop) {
      throw new NotFoundException('SOP模板不存在');
    }

    // 如果设置为默认模板，先清除同类型的其他默认模板
    if (isDefault) {
      await this.sopRepository.update(
        { case_type: caseType || sop.case_type, is_default: true },
        { is_default: false },
      );
    }

    // 更新字段
    if (name !== undefined) sop.name = name;
    if (caseType !== undefined) sop.case_type = caseType;
    if (isDefault !== undefined) sop.is_default = isDefault;

    if (nodes) {
      const processedNodes: TalkSOPNode[] = nodes.map((node, index) => ({
        node_id: node.node_id || this.generateUUID(),
        node_name: node.node_name || '',
        node_type: node.node_type || TalkSOPNodeType.INFO_INPUT,
        is_required: node.is_required !== undefined ? node.is_required : false,
        order: node.order !== undefined ? node.order : index,
        description: node.description,
      }));
      sop.nodes = JSON.stringify(processedNodes);
    }

    return this.sopRepository.save(sop);
  }

  // 删除SOP模板
  async deleteSOP(sopId: string, userId: string) {
    // 权限检查
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ORG_ADMIN)) {
      throw new ForbiddenException('仅管理员可操作SOP模板');
    }

    const sop = await this.sopRepository.findOne({ where: { id: sopId } });
    if (!sop) {
      throw new NotFoundException('SOP模板不存在');
    }

    await this.sopRepository.remove(sop);
    return { message: '删除成功' };
  }

  // 查询SOP模板列表
  async getSOPList(caseType?: string, enabled?: boolean) {
    const queryBuilder = this.sopRepository.createQueryBuilder('sop');

    if (caseType) {
      queryBuilder.where('sop.case_type = :caseType OR sop.case_type IS NULL', { caseType });
    }

    if (enabled !== undefined) {
      queryBuilder.andWhere('sop.enabled = :enabled', { enabled });
    }

    queryBuilder.orderBy('sop.created_at', 'DESC');

    const sops = await queryBuilder.getMany();

    // 解析节点JSON
    return sops.map(sop => ({
      ...sop,
      nodes: JSON.parse(sop.nodes),
    }));
  }

  // 获取SOP详情
  async getSOPDetail(sopId: string) {
    const sop = await this.sopRepository.findOne({ where: { id: sopId } });
    if (!sop) {
      throw new NotFoundException('SOP模板不存在');
    }

    return {
      ...sop,
      nodes: JSON.parse(sop.nodes),
    };
  }

  // 设置默认SOP
  async setDefaultSOP(sopId: string, userId: string) {
    // 权限检查
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ORG_ADMIN)) {
      throw new ForbiddenException('仅管理员可操作SOP模板');
    }

    const sop = await this.sopRepository.findOne({ where: { id: sopId } });
    if (!sop) {
      throw new NotFoundException('SOP模板不存在');
    }

    // 清除同类型的其他默认模板
    await this.sopRepository.update(
      { case_type: sop.case_type, is_default: true },
      { is_default: false },
    );

    // 设置为默认
    sop.is_default = true;
    await this.sopRepository.save(sop);

    return this.getSOPDetail(sopId);
  }

  // 启用/禁用SOP
  async toggleSOPEnabled(sopId: string, userId: string, enabled: boolean) {
    // 权限检查
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ORG_ADMIN)) {
      throw new ForbiddenException('仅管理员可操作SOP模板');
    }

    const sop = await this.sopRepository.findOne({ where: { id: sopId } });
    if (!sop) {
      throw new NotFoundException('SOP模板不存在');
    }

    sop.enabled = enabled;
    await this.sopRepository.save(sop);

    return this.getSOPDetail(sopId);
  }

  // ==================== SOP节点完成状态追踪 ====================

  // 获取商机的SOP进度
  async getOpportunitySOPProgress(opportunityId: string, userId: string) {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    // 获取lead信息
    const lead = await this.leadRepository.findOne({ where: { id: opportunity.lead_id } });

    // 权限检查
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES && opportunity.negotiator_id !== userId) {
      throw new ForbiddenException('无权查看此商机');
    }

    // 获取商机的案件类型
    const caseType = lead?.case_type;

    // 匹配SOP模板（优先匹配案件类型，其次匹配默认模板）
    let sop = await this.sopRepository.findOne({
      where: { case_type: caseType, enabled: true, is_default: false },
    });

    if (!sop) {
      sop = await this.sopRepository.findOne({
        where: { case_type: null, enabled: true, is_default: true },
      });
    }

    if (!sop) {
      sop = await this.sopRepository.findOne({
        where: { enabled: true },
        order: { created_at: 'DESC' },
      });
    }

    if (!sop) {
      return {
        sop: null,
        progress: [],
        completion_percentage: 0,
        has_incomplete_required_nodes: false,
      };
    }

    // 获取节点列表
    const nodes: TalkSOPNode[] = JSON.parse(sop.nodes);

    // 获取已完成的进度
    const progressRecords = await this.progressRepository.find({
      where: { opportunity_id: opportunityId },
    });

    // 获取完成人信息
    const completedByUserIds = progressRecords
      .filter(r => r.completed_by)
      .map(r => r.completed_by);
    
    const users = completedByUserIds.length > 0 
      ? await this.userRepository.find({ where: { id: In(completedByUserIds) } })
      : [];

    // 合并进度信息
    const progress = nodes.map(node => {
      const record = progressRecords.find(r => r.node_id === node.node_id);
      const completedByUser = record?.completed_by ? users.find(u => u.id === record.completed_by) : null;
      return {
        ...node,
        status: record?.status || SOPNodeStatus.PENDING,
        completed_at: record?.completed_at || null,
        completed_by: record?.completed_by || null,
        completed_by_name: completedByUser?.real_name || null,
      };
    });

    // 计算完成百分比
    const completedCount = progress.filter(p => p.status === SOPNodeStatus.COMPLETED).length;
    const completionPercentage = nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0;

    // 检查是否有未完成的强制节点
    const hasIncompleteRequiredNodes = progress.some(
      p => p.is_required && p.status !== SOPNodeStatus.COMPLETED,
    );

    return {
      sop: {
        id: sop.id,
        name: sop.name,
        case_type: sop.case_type,
      },
      progress,
      completion_percentage: completionPercentage,
      has_incomplete_required_nodes: hasIncompleteRequiredNodes,
    };
  }

  // 完成单个节点
  async completeNode(
    opportunityId: string,
    nodeId: string,
    userId: string,
  ) {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    // 权限检查
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES && opportunity.negotiator_id !== userId) {
      throw new ForbiddenException('无权操作此商机');
    }

    // 检查节点是否存在
    const sopProgress = await this.getOpportunitySOPProgress(opportunityId, userId);
    const node = sopProgress.progress.find(p => p.node_id === nodeId);

    if (!node) {
      throw new NotFoundException('节点不存在');
    }

    // 查找或创建进度记录
    let progressRecord = await this.progressRepository.findOne({
      where: { opportunity_id: opportunityId, node_id: nodeId },
    });

    if (!progressRecord) {
      progressRecord = this.progressRepository.create({
        opportunity_id: opportunityId,
        node_id: nodeId,
        status: SOPNodeStatus.COMPLETED,
        completed_at: new Date(),
        completed_by: userId,
      });
    } else {
      progressRecord.status = SOPNodeStatus.COMPLETED;
      progressRecord.completed_at = new Date();
      progressRecord.completed_by = userId;
    }

    await this.progressRepository.save(progressRecord);

    return this.getOpportunitySOPProgress(opportunityId, userId);
  }

  // 取消完成节点
  async uncompleteNode(
    opportunityId: string,
    nodeId: string,
    userId: string,
  ) {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    // 权限检查
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && user.role === UserRole.SALES && opportunity.negotiator_id !== userId) {
      throw new ForbiddenException('无权操作此商机');
    }

    // 删除进度记录
    const progressRecord = await this.progressRepository.findOne({
      where: { opportunity_id: opportunityId, node_id: nodeId },
    });

    if (progressRecord) {
      await this.progressRepository.remove(progressRecord);
    }

    return this.getOpportunitySOPProgress(opportunityId, userId);
  }

  // 获取SOP完成百分比
  async getSOPCompletionPercentage(opportunityId: string, userId: string) {
    const result = await this.getOpportunitySOPProgress(opportunityId, userId);
    return {
      completion_percentage: result.completion_percentage,
      has_incomplete_required_nodes: result.has_incomplete_required_nodes,
    };
  }

  // 检查强制节点是否全部完成
  async checkRequiredNodesCompleted(opportunityId: string) {
    const progress = await this.getOpportunitySOPProgress(opportunityId, 'system');
    return {
      is_valid: !progress.has_incomplete_required_nodes,
      incomplete_nodes: progress.progress.filter(p => p.is_required && p.status !== SOPNodeStatus.COMPLETED),
    };
  }

  // 生成UUID
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}