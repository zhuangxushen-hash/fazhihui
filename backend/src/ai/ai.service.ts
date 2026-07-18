import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  generateMarketingCopy(prompt: string, caseType?: string, platform?: string): string {
    const templates: Record<string, Record<string, string>> = {
      marriage: {
        douyin: `婚姻家事法律科普\n\n${prompt}\n\n✅ 专业律师在线解答\n✅ 免费法律咨询\n✅ 保护您的合法权益\n\n#婚姻律师 #离婚咨询 #财产分割`,
        baidu: `婚姻家事法律咨询 - 专业律师一对一解答\n\n${prompt}\n\n服务内容：离婚诉讼、财产分割、子女抚养权、遗产继承等\n\n免费咨询热线：400-888-8888\n立即咨询获取专业法律建议`,
        wechat: `【婚姻家事法律咨询】\n\n${prompt}\n\n👨⚖️ 专业律师团队\n📞 一对一咨询服务\n💰 透明收费标准\n\n扫码添加微信，获取免费法律评估`,
      },
      traffic: {
        douyin: `交通事故维权指南\n\n${prompt}\n\n🚗 交通事故处理流程\n💰 赔偿项目详解\n⚖️ 律师全程指导\n\n#交通事故 #理赔律师 #交通维权`,
        baidu: `交通事故法律咨询 - 专业理赔律师\n\n${prompt}\n\n服务内容：事故责任认定、伤残鉴定、赔偿调解、诉讼代理\n\n免费评估您的赔偿金额，专业律师助您维权！`,
        wechat: `【交通事故法律咨询】\n\n${prompt}\n\n🚑 专业交通事故律师\n💼 全程代理理赔\n⚡ 快速立案处理\n\n扫码咨询，获取免费赔偿评估`,
      },
      labor: {
        douyin: `劳动纠纷维权攻略\n\n${prompt}\n\n💼 劳动仲裁流程\n💰 经济补偿金计算\n⚖️ 律师专业指导\n\n#劳动仲裁 #工伤赔偿 #工资拖欠`,
        baidu: `劳动纠纷法律咨询 - 专业劳动律师\n\n${prompt}\n\n服务内容：劳动仲裁、工资拖欠、工伤赔偿、劳动合同纠纷\n\n专业律师为您争取合法权益！`,
        wechat: `【劳动纠纷法律咨询】\n\n${prompt}\n\n📋 专业劳动法律师\n⚖️ 劳动仲裁代理\n💰 争取最大赔偿\n\n扫码咨询，免费评估案情`,
      },
      debt: {
        douyin: `债务催收法律指南\n\n${prompt}\n\n💰 债务追讨技巧\n⚖️ 法律诉讼流程\n📋 证据收集要点\n\n#债务纠纷 #欠款催收 #法律诉讼`,
        baidu: `债务纠纷法律咨询 - 专业债权律师\n\n${prompt}\n\n服务内容：欠款催收、债务诉讼、财产保全、强制执行\n\n专业律师帮您追回欠款！`,
        wechat: `【债务纠纷法律咨询】\n\n${prompt}\n\n🔍 专业债务律师\n⚖️ 诉讼追讨欠款\n💯 成功率高\n\n扫码咨询，免费评估回款可能性`,
      },
    };

    const type = caseType || 'other';
    const plat = platform || 'douyin';
    
    if (templates[type] && templates[type][plat]) {
      return templates[type][plat];
    }
    
    return `法律科普内容\n\n${prompt}\n\n专业律师在线解答，免费法律咨询，保护您的合法权益！\n\n#法律咨询 #律师服务`;
  }

  generateVideoScript(prompt: string, caseType?: string): string {
    const scripts: Record<string, string> = {
      marriage: `【开头】\n大家好，我是XX律师，专注婚姻家事领域。最近很多朋友咨询关于${prompt}的问题，今天给大家详细讲解一下。\n\n【主体】\n1. 问题背景介绍\n2. 法律规定解读\n3. 实际案例分析\n4. 维权建议\n\n【结尾】\n如果你也遇到类似问题，欢迎在评论区留言或私信咨询，我会为你提供专业的法律帮助！\n\n#婚姻律师 #法律咨询`,
      traffic: `【开头】\n大家好，我是XX律师。今天给大家讲解交通事故中关于${prompt}的常见问题。\n\n【主体】\n1. 事故处理流程\n2. 责任认定要点\n3. 赔偿项目明细\n4. 维权注意事项\n\n【结尾】\n遇到交通事故不要慌，专业律师帮您忙！欢迎咨询，免费评估赔偿金额！\n\n#交通事故 #理赔律师`,
      labor: `【开头】\n大家好，我是XX律师。今天跟大家聊聊劳动纠纷中关于${prompt}的那些事。\n\n【主体】\n1. 法律依据解读\n2. 维权流程说明\n3. 证据收集要点\n4. 常见误区提醒\n\n【结尾】\n劳动者的合法权益受法律保护！遇到问题及时咨询专业律师，不要错过维权时机！\n\n#劳动仲裁 #法律维权`,
      debt: `【开头】\n大家好，我是XX律师。今天给大家分享债务追讨中关于${prompt}的实用技巧。\n\n【主体】\n1. 债务类型分析\n2. 追讨方式对比\n3. 诉讼流程介绍\n4. 回款策略建议\n\n【结尾】\n遇到欠款不还的情况，一定要用法律武器保护自己！专业律师帮您高效追讨！\n\n#债务催收 #法律诉讼`,
    };

    return scripts[caseType || 'other'] || `【开头】\n大家好，我是XX律师。今天给大家讲解关于${prompt}的法律知识。\n\n【主体】\n1. 问题分析\n2. 法律规定\n3. 解决建议\n\n【结尾】\n欢迎咨询专业律师，获取一对一法律帮助！\n\n#法律咨询 #律师服务`;
  }

  generateLegalDocument(type: string, data: any): string {
    const documents: Record<string, (d: any) => string> = {
      complaint: (d) => `民事起诉状

原告：${d.plaintiff_name || 'XXX'}，${d.plaintiff_gender || '男/女'}，${d.plaintiff_birth || 'XXXX年XX月XX日'}出生，汉族，住${d.plaintiff_address || 'XXXX'}，身份证号${d.plaintiff_id || 'XXXX'}，联系电话${d.plaintiff_phone || 'XXXX'}。

被告：${d.defendant_name || 'XXX'}，${d.defendant_gender || '男/女'}，${d.defendant_birth || 'XXXX年XX月XX日'}出生，汉族，住${d.defendant_address || 'XXXX'}，身份证号${d.defendant_id || 'XXXX'}，联系电话${d.defendant_phone || 'XXXX'}。

诉讼请求：
${d.claims?.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n') || '1. 判令被告承担相应法律责任；'}

事实与理由：
${d.facts || '原被告双方因XXXX事宜产生纠纷，原告多次与被告协商未果，为维护原告合法权益，特向贵院提起诉讼，望判如所请。'}

此致
${d.court || 'XX人民法院'}

附：本起诉状副本${d.copy_count || '1'}份
证据材料${d.evidence_count || 'X'}份

起诉人（签名）：__________
${new Date().toISOString().split('T')[0]}`,
      appeal: (d) => `民事上诉状

上诉人（原审${d.appellant_role || '原告'}）：${d.appellant_name || 'XXX'}，${d.appellant_gender || '男/女'}，${d.appellant_birth || 'XXXX年XX月XX日'}出生，汉族，住${d.appellant_address || 'XXXX'}，身份证号${d.appellant_id || 'XXXX'}，联系电话${d.appellant_phone || 'XXXX'}。

被上诉人（原审${d.respondent_role || '被告'}）：${d.respondent_name || 'XXX'}，${d.respondent_gender || '男/女'}，${d.respondent_birth || 'XXXX年XX月XX日'}出生，汉族，住${d.respondent_address || 'XXXX'}，身份证号${d.respondent_id || 'XXXX'}，联系电话${d.respondent_phone || 'XXXX'}。

上诉人因${d.case_name || 'XXXX'}一案，不服${d.court || 'XX人民法院'}于${d.judgment_date || 'XXXX年XX月XX日'}作出的（${d.case_no || 'XXXX'}）号民事判决/裁定，现提出上诉。

上诉请求：
${d.appeal_claims?.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n') || '1. 请求撤销原判，依法改判或发回重审；'}

事实与理由：
${d.appeal_facts || '原审判决认定事实不清，适用法律错误，程序违法，恳请贵院依法改判或发回重审。'}

此致
${d.appeal_court || 'XX中级人民法院'}

附：本上诉状副本${d.copy_count || '1'}份
证据材料${d.evidence_count || 'X'}份

上诉人（签名）：__________
${new Date().toISOString().split('T')[0]}`,
      response: (d) => `民事答辩状

答辩人：${d.defendant_name || 'XXX'}，${d.defendant_gender || '男/女'}，${d.defendant_birth || 'XXXX年XX月XX日'}出生，汉族，住${d.defendant_address || 'XXXX'}，身份证号${d.defendant_id || 'XXXX'}，联系电话${d.defendant_phone || 'XXXX'}。

针对原告${d.plaintiff_name || 'XXX'}诉答辩人${d.case_name || 'XXXX'}一案，答辩人就原告诉讼请求及事实理由答辩如下：

一、关于原告诉讼请求第一项：
${d.response1 || '原告该项请求缺乏事实和法律依据，请贵院依法驳回。'}

二、关于原告诉讼请求第二项：
${d.response2 || '原告该项请求不能成立，请贵院依法驳回。'}

三、事实与理由：
${d.defense_facts || '原告所述与事实不符，答辩人不存在原告诉称的行为，请求贵院依法驳回原告诉讼请求。'}

此致
${d.court || 'XX人民法院'}

附：本答辩状副本${d.copy_count || '1'}份
证据材料${d.evidence_count || 'X'}份

答辩人（签名）：__________
${new Date().toISOString().split('T')[0]}`,
      evidence: (d) => `证据清单

案号：${d.case_no || 'XXXX'}

|序号|证据名称|证据来源|证明内容|
|---|---|---|---|
${d.evidences?.map((e: any, i: number) => `${i + 1}|${e.name || '证据X'}|${e.source || '原告提供'}|${e.prove || '证明XXX事实'}`).join('\n') || '1|证据1|原告提供|证明相关事实'}

提交人：__________
提交日期：${new Date().toISOString().split('T')[0]}`,
      retainer: (d) => `委托代理合同

甲方（委托人）：${d.client_name || 'XXX'}，身份证号${d.client_id || 'XXXX'}，联系电话${d.client_phone || 'XXXX'}。

乙方（受托人）：${d.lawyer_name || 'XXX'}律师，执业证号${d.lawyer_id || 'XXXX'}，联系电话${d.lawyer_phone || 'XXXX'}。

甲方因${d.case_name || 'XXXX'}一案，委托乙方作为代理人，双方经协商一致，签订本合同：

一、代理事项：
${d.services || '乙方接受甲方委托，担任甲方在本案中的诉讼/非诉讼代理人。'}

二、代理权限：
${d.authority || '一般代理/特别授权（代为起诉、应诉、承认、放弃、变更诉讼请求，进行和解、调解，提起上诉等）'}

三、律师费用：
${d.fee || '甲方应向乙方支付律师代理费人民币XXXX元。'}

四、双方权利义务：
1. 甲方应如实陈述案件事实，提供相关证据材料；
2. 乙方应勤勉尽责，维护甲方合法权益。

五、合同期限：
自本合同签订之日起至本案终结（包括一审、二审、执行程序）止。

六、争议解决：
因本合同产生的争议，双方协商解决；协商不成的，向XX仲裁委员会申请仲裁或向人民法院提起诉讼。

甲方（签名）：__________
乙方（签名）：__________
${new Date().toISOString().split('T')[0]}`,
    };

    return documents[type] ? documents[type](data) : `法律文书\n\n类型：${type}\n\n内容：根据您提供的信息，生成相应法律文书内容。`;
  }

  analyzeCaseRisk(caseData: any): { risk_level: string; risk_factors: string[]; suggestions: string[]; analysis: string } {
    const riskFactors: string[] = [];
    const suggestions: string[] = [];

    if (!caseData.evidence_count || caseData.evidence_count < 3) {
      riskFactors.push('证据材料不足');
      suggestions.push('建议补充收集相关证据材料');
    }

    if (caseData.amount && caseData.amount > 500000) {
      riskFactors.push('涉案金额较大');
      suggestions.push('建议做好财产保全措施');
    }

    if (caseData.complexity === 'high' || caseData.description?.length > 100) {
      riskFactors.push('案情复杂');
      suggestions.push('建议资深律师承办，制定详细办案策略');
    }

    if (caseData.due_date) {
      const due = new Date(caseData.due_date);
      const now = new Date();
      const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 15) {
        riskFactors.push('临近期限');
        suggestions.push('建议加快办案进度，确保在期限内完成');
      }
    }

    if (caseData.case_type === 'marriage') {
      if (caseData.description?.includes('房产')) {
        riskFactors.push('涉及房产分割');
        suggestions.push('建议提前准备房产证明材料');
      }
      if (caseData.description?.includes('子女')) {
        riskFactors.push('涉及子女抚养权');
        suggestions.push('建议收集有利于抚养权争取的证据');
      }
    }

    let riskLevel = 'low';
    if (riskFactors.length >= 3) {
      riskLevel = 'high';
    } else if (riskFactors.length >= 1) {
      riskLevel = 'medium';
    }

    const analysis = `根据案件信息分析：\n\n案由：${caseData.case_type || '未指定'}\n描述：${caseData.description || '未提供'}\n\n风险等级：${riskLevel}\n风险因素：${riskFactors.length > 0 ? riskFactors.join('、') : '无'}\n建议措施：${suggestions.length > 0 ? suggestions.join('；') : '暂无'}`;

    return { risk_level: riskLevel, risk_factors: riskFactors, suggestions, analysis };
  }
}
