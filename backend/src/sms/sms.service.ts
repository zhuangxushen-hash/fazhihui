import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';
import { CasePushNotification } from '../client/case-push-notification.entity';
import { ChuanlanSmsClient } from './sms.client';

/**
 * 模板节点配置
 * envKey：创蓝模板ID所在环境变量名（未配置时跳过发送并记录日志）
 * params：模板变量 param1..paramN 的取值顺序（与创蓝模板中 {s} 占位顺序一致）
 * label：节点中文名（用于推送记录内容）
 */
interface SmsNodeConfig {
  envKey: string;
  label: string;
  params: string[];
}

/**
 * 22 类案件 C 端短信节点配置（个债流程：一销|二销）
 * 模板正文文案以【XX律所】开头，变量顺序与 params 数组一一对应
 */
const SMS_NODES: Record<string, SmsNodeConfig> = {
  // 1. 案件委托受理 / 收案立项完成
  filing: {
    envKey: 'CHUANGLAN_TMPL_FILING',
    label: '收案立项',
    params: ['案由', '案件编号', '律师姓名'],
  },
  // 1.2/2. 完成律师函撰写（律师 B 端上传材料）
  lawyer_letter: {
    envKey: 'CHUANGLAN_TMPL_LAWYER_LETTER',
    label: '律师函撰写',
    params: ['案由', '律师姓名'],
  },
  // 1.3/3. 合同代理已结案（B 端点击结案）
  contract_closed: {
    envKey: 'CHUANGLAN_TMPL_CONTRACT_CLOSED',
    label: '合同代理结案',
    params: ['案由', '律师姓名'],
  },
  // 2. 当事人补充材料提醒
  material_supplement: {
    envKey: 'CHUANGLAN_TMPL_MATERIAL_SUPPLEMENT',
    label: '补充材料提醒',
    params: ['案由', '律师姓名'],
  },
  // 3. 律所已接收当事人提交的证据材料
  evidence_received: {
    envKey: 'CHUANGLAN_TMPL_EVIDENCE_RECEIVED',
    label: '接收证据材料',
    params: ['律师姓名'],
  },
  // 4. 立案申请已提交法院
  filing_submit: {
    envKey: 'CHUANGLAN_TMPL_FILING_SUBMIT',
    label: '提交立案申请',
    params: ['案由', '律师姓名'],
  },
  // 5. 法院正式立案，收到受理通知书
  court_accept: {
    envKey: 'CHUANGLAN_TMPL_COURT_ACCEPT',
    label: '法院受理',
    params: ['案由', '案号', '律师姓名'],
  },
  // 6. 缴纳诉讼费提示
  fee_payment: {
    envKey: 'CHUANGLAN_TMPL_FEE_PAYMENT',
    label: '缴费提示',
    params: ['案号', '律师姓名'],
  },
  // 7. 保全申请提交 / 保全裁定下达
  preservation: {
    envKey: 'CHUANGLAN_TMPL_PRESERVATION',
    label: '财产保全',
    params: ['案由', '律师姓名'],
  },
  // 8. 收到开庭传票，开庭排期确定
  hearing: {
    envKey: 'CHUANGLAN_TMPL_HEARING',
    label: '开庭通知',
    params: ['案由', '开庭时间', '开庭地点', '律师姓名'],
  },
  // 9. 开庭时间变更 / 延期开庭
  hearing_change: {
    envKey: 'CHUANGLAN_TMPL_HEARING_CHANGE',
    label: '开庭变更',
    params: ['案号', '新开庭时间', '律师姓名'],
  },
  // 10. 案件已完成开庭审理，等待裁判文书
  hearing_done: {
    envKey: 'CHUANGLAN_TMPL_HEARING_DONE',
    label: '庭审结束',
    params: ['案号', '律师姓名'],
  },
  // 11. 调解成功，达成调解协议
  mediation: {
    envKey: 'CHUANGLAN_TMPL_MEDIATION',
    label: '调解成功',
    params: ['案号', '律师姓名'],
  },
  // 12. 一审判决书 / 裁定书已领取
  judgment_first: {
    envKey: 'CHUANGLAN_TMPL_JUDGMENT_FIRST',
    label: '一审裁判',
    params: ['案号', '律师姓名', '期限日期'],
  },
  // 13. 上诉期到期提醒
  appeal_deadline: {
    envKey: 'CHUANGLAN_TMPL_APPEAL_DEADLINE',
    label: '上诉期到期',
    params: ['案号', '期限日期', '律师姓名'],
  },
  // 14. 启动二审上诉程序
  appeal_start: {
    envKey: 'CHUANGLAN_TMPL_APPEAL_START',
    label: '启动二审',
    params: ['案由', '律师姓名'],
  },
  // 15. 二审裁判文书下达
  judgment_second: {
    envKey: 'CHUANGLAN_TMPL_JUDGMENT_SECOND',
    label: '二审裁判',
    params: ['案号', '律师姓名'],
  },
  // 16. 申请强制执行立案（执行阶段启动）
  enforcement: {
    envKey: 'CHUANGLAN_TMPL_ENFORCEMENT',
    label: '强制执行',
    params: ['律师姓名'],
  },
  // 17. 执行回款到账通知
  enforcement_recovery: {
    envKey: 'CHUANGLAN_TMPL_ENFORCEMENT_RECOVERY',
    label: '执行回款',
    params: ['案号', '律师姓名'],
  },
  // 18. 案件达成和解、对方履行完毕
  settlement: {
    envKey: 'CHUANGLAN_TMPL_SETTLEMENT',
    label: '达成和解',
    params: ['案号'],
  },
  // 19. 案件办结结案通知（全流程结束）
  closed: {
    envKey: 'CHUANGLAN_TMPL_CLOSED',
    label: '案件结案',
    params: ['案由', '律师姓名'],
  },
  // 20. 律师向当事人推送新文件 / 资料通用通知
  document_push: {
    envKey: 'CHUANGLAN_TMPL_DOCUMENT_PUSH',
    label: '推送新资料',
    params: ['律师姓名', '案件编号', '材料名称'],
  },
};

/**
 * 案件 C 端短信提醒服务
 * 在案件关键节点（收案立项、补充材料、立案受理、开庭、裁判、结案等）触发短信通知当事人。
 * 模板 ID 从环境变量（CHUANGLAN_TMPL_*）读取，未配置凭据或模板时跳过发送并记录日志，不影响业务主流程。
 * 每次发送都会在 case_push_notifications 表写入一条 channel='sms' 的推送记录。
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CasePushNotification)
    private pushNotificationRepository: Repository<CasePushNotification>,
    private smsClient: ChuanlanSmsClient,
  ) {}

  /**
   * 按案件触发一次 C 端短信提醒
   * @param opts.caseId 案件ID
   * @param opts.nodeType 节点类型，必须是 SMS_NODES 中的 key
   * @param opts.params 额外模板变量（如 材料名称/开庭时间/开庭地点/期限日期 等，用于覆盖或补充从案件派生的值）
   */
  async sendCaseSms(opts: {
    caseId: string;
    nodeType: string;
    params?: Record<string, string>;
  }): Promise<void> {
    const node = SMS_NODES[opts.nodeType];
    if (!node) {
      this.logger.warn(`未知短信节点类型，跳过发送 nodeType=${opts.nodeType}`);
      return;
    }

    const caseEntity = await this.caseRepository.findOne({ where: { id: opts.caseId } });
    if (!caseEntity) {
      this.logger.warn(`短信节点对应案件不存在，跳过发送 nodeType=${opts.nodeType} caseId=${opts.caseId}`);
      return;
    }

    const phone = caseEntity.client_phone;
    if (!phone) {
      this.logger.warn(`案件无当事人手机号，跳过短信发送 caseId=${opts.caseId} nodeType=${opts.nodeType}`);
      return;
    }

    const templateId = process.env[node.envKey];
    if (!templateId) {
      this.logger.warn(
        `未配置短信模板ID（${node.envKey}），跳过发送 nodeType=${opts.nodeType} caseId=${opts.caseId}`,
      );
      return;
    }

    // 解析主办律师姓名（用于模板变量）
    let lawyerName = '';
    if (caseEntity.assignee_lawyer_id) {
      const lawyer = await this.userRepository.findOne({ where: { id: caseEntity.assignee_lawyer_id } });
      lawyerName = lawyer?.real_name || '';
    }

    // 按模板变量顺序组装参数（保证与创蓝模板 {s} 占位顺序一致）
    const params: Record<string, string> = {};
    const extra = opts.params || {};
    for (const label of node.params) {
      params[label] = this.resolveParam(label, caseEntity, lawyerName, extra);
    }

    // 若未配置短信凭据，客户端内部会跳过并返回 false，这里仍记录一条推送以便追踪
    const record = await this.pushNotificationRepository.save(
      this.pushNotificationRepository.create({
        case_id: caseEntity.id,
        client_id: caseEntity.client_id,
        node_type: opts.nodeType,
        push_content: `[短信-${node.label}] ${node.params.map((k) => `${k}:${params[k] || ''}`).join(' | ')}`,
        push_channel: 'sms',
        push_time: new Date(),
        status: 'pending',
        organization_id: caseEntity.organization_id,
      }),
    );

    const ok = await this.smsClient.send({
      phone,
      templateId,
      params,
      uid: record.id,
    });

    await this.pushNotificationRepository.update(record.id, {
      status: ok ? 'sent' : 'failed',
      sent_at: ok ? new Date() : undefined,
    });
  }

  /**
   * 解析单个模板变量的取值：优先使用调用方传入的额外参数，其次从案件实体派生
   */
  private resolveParam(label: string, caseEntity: Case, lawyerName: string, extra: Record<string, string>): string {
    if (extra[label]) {
      return extra[label];
    }
    switch (label) {
      case '案由':
        return this.caseTypeLabel(caseEntity.case_type);
      case '案件编号':
        return caseEntity.case_no || '';
      case '案号':
        return caseEntity.case_number || caseEntity.case_no || '';
      case '律师姓名':
        return lawyerName;
      case '开庭时间':
      case '新开庭时间':
        return caseEntity.hearing_date ? this.formatDate(caseEntity.hearing_date) : '';
      case '开庭地点':
        return caseEntity.court_room || caseEntity.court || '';
      case '期限日期':
        return caseEntity.appeal_deadline ? this.formatDate(caseEntity.appeal_deadline) : '';
      case '材料名称':
        return extra['材料名称'] || '';
      default:
        return '';
    }
  }

  /**
   * 案件类型（案由）中文标签
   */
  private caseTypeLabel(caseType: string): string {
    const map: Record<string, string> = {
      marriage: '婚姻家事',
      traffic: '交通事故',
      labor: '劳动争议',
      debt: '债务纠纷',
      other: '其他',
    };
    return map[caseType] || caseType || '';
  }

  /**
   * 日期格式化为 YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    if (!date) {
      return '';
    }
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}