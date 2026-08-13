import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushRule } from './push-rule.entity';

// 节点类型 → 中文名称映射（创建规则时自动补全 node_label）
const NODE_LABEL_MAP: Record<string, string> = {
  filing: '案件立案',
  court: '案件开庭',
  closed: '案件结案',
  evidence: '证据提交',
  document: '文书生成',
  judgment: '案件判决',
};

// 更新推送规则入参类型
export interface UpdatePushRuleData {
  enabled?: boolean;
  content_template?: string;
  channels?: string[];
}

// 批量更新推送规则单项类型
export interface BatchUpdateRuleItem {
  node_type: string;
  enabled?: boolean;
  content_template?: string;
  channels?: string[];
}

@Injectable()
export class PushRuleService {
  constructor(
    @InjectRepository(PushRule)
    private readonly pushRuleRepository: Repository<PushRule>,
  ) {}

  // 查询组织全部推送规则，channels 反序列化为数组返回
  async findRules(orgId: string): Promise<PushRule[]> {
    const rules = await this.pushRuleRepository.find({
      where: { organization_id: orgId },
    });
    return rules.map((rule) => this.deserializeChannels(rule));
  }

  // 查询单个节点推送规则，未找到返回 null
  async findRule(orgId: string, nodeType: string): Promise<PushRule | null> {
    const rule = await this.pushRuleRepository.findOne({
      where: { organization_id: orgId, node_type: nodeType },
    });
    return rule ? this.deserializeChannels(rule) : null;
  }

  // 更新单个节点推送规则：存在则更新，不存在则自动创建（默认 enabled=false、channels=['app']）
  async updateRule(
    orgId: string,
    nodeType: string,
    data: UpdatePushRuleData,
  ): Promise<PushRule> {
    let rule = await this.pushRuleRepository.findOne({
      where: { organization_id: orgId, node_type: nodeType },
    });
    if (rule) {
      // 存在则更新（channels 数组序列化为 JSON 字符串存储）
      const updateData: any = {};
      if (data.enabled !== undefined) updateData.enabled = data.enabled;
      if (data.content_template !== undefined) {
        updateData.content_template = data.content_template;
      }
      if (data.channels !== undefined) {
        updateData.channels = JSON.stringify(data.channels);
      }
      await this.pushRuleRepository.update(rule.id, updateData);
      rule = await this.pushRuleRepository.findOne({ where: { id: rule.id } });
    } else {
      // 不存在则创建：自动补全 node_type、node_label，默认 enabled=false、channels=['app']
      rule = this.pushRuleRepository.create({
        organization_id: orgId,
        node_type: nodeType,
        node_label: NODE_LABEL_MAP[nodeType] || null,
        enabled: data.enabled !== undefined ? data.enabled : false,
        content_template:
          data.content_template !== undefined ? data.content_template : null,
        channels: JSON.stringify(
          data.channels !== undefined ? data.channels : ['app'],
        ),
      });
      rule = await this.pushRuleRepository.save(rule);
    }
    return this.deserializeChannels(rule);
  }

  // 批量更新推送规则，返回更新条数（每条 node_type 必填，缺失抛 BadRequestException）
  async batchUpdateRules(
    orgId: string,
    rules: BatchUpdateRuleItem[],
  ): Promise<{ updated: number }> {
    for (const item of rules) {
      if (!item || !item.node_type) {
        throw new BadRequestException('批量更新推送规则时 node_type 不能为空');
      }
      await this.updateRule(orgId, item.node_type, {
        enabled: item.enabled,
        content_template: item.content_template,
        channels: item.channels,
      });
    }
    return { updated: rules.length };
  }

  // channels 字段反序列化：JSON 字符串解析为数组，已是数组则原样返回
  private deserializeChannels(rule: PushRule): PushRule {
    if (rule && typeof rule.channels === 'string' && rule.channels) {
      try {
        (rule as any).channels = JSON.parse(rule.channels);
      } catch {
        // 解析失败保持原样
      }
    }
    return rule;
  }
}
