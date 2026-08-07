import { Injectable } from '@nestjs/common';

// 法律工具导航分类数据（11大类，100+工具）
const LAW_TOOL_CATEGORIES: any[] = [
  {
    code: 'law_regulation',
    name: '法律法规检索',
    icon: 'law_regulation',
    sort: 1,
    tools: [
      { code: 'flk_national', name: '国家法律法规数据库', url: 'https://flk.npc.gov.cn/', desc: '全国人大常委会官方法律法规库' },
      { code: 'gov_cn', name: '中国政府网法规', url: 'http://www.gov.cn/zhengce/', desc: '国务院政策文件检索' },
      { code: 'pkulaw', name: '北大法宝', url: 'https://www.pkulaw.com/', desc: '法律法规综合检索平台' },
      { code: 'lawtime', name: '法律快车', url: 'https://www.lawtime.cn/', desc: '法律法规与案例检索' },
      { code: 'lawlib', name: '法律图书馆', url: 'http://www.law-lib.com/', desc: '法律法规检索' },
      { code: 'chinacourt_law', name: '中国法院网法规库', url: 'https://www.chinacourt.org/law.shtml', desc: '人民法院法律法规检索' },
      { code: 'lawinfo', name: '法信', url: 'https://www.faxin.cn/', desc: '人民法院出版社法律法规平台' },
      { code: 'lawyers', name: '律师在线法规', url: 'https://www.64365.com/', desc: '律师常用法律法规' },
      { code: 'legaldaily', name: '法治网法规', url: 'http://www.legaldaily.com.cn/', desc: '法治日报法律法规' },
      { code: 'moj', name: '司法部法规库', url: 'http://www.moj.gov.cn/', desc: '司法部行政法规检索' },
    ],
  },
  {
    code: 'case_search',
    name: '案例检索',
    icon: 'case_search',
    sort: 2,
    tools: [
      { code: 'wenshu_court', name: '中国裁判文书网', url: 'https://wenshu.court.gov.cn/', desc: '最高人民法院裁判文书公开平台' },
      { code: 'chinacourt_case', name: '中国法院网案例', url: 'https://www.chinacourt.org/', desc: '人民法院案例库' },
      { code: 'pkulaw_case', name: '北大法宝案例', url: 'https://www.pkulaw.com/case', desc: '司法案例大数据检索' },
      { code: 'lawtime_case', name: '法律快车案例', url: 'https://www.lawtime.cn/case', desc: '案例库检索' },
      { code: 'faxin_case', name: '法信案例', url: 'https://www.faxin.cn/case', desc: '案例裁判规则检索' },
      { code: 'itslaw', name: '理脉案例', url: 'https://www.itslaw.com/', desc: '司法案例智能检索' },
      { code: 'openlaw', name: 'OpenLaw裁判文书', url: 'http://openlaw.cn/', desc: '裁判文书检索平台' },
      { code: 'lawyee', name: '北大法意', url: 'http://www.lawyee.org/', desc: '司法案例库' },
      { code: 'case Judicial', name: '无讼案例', url: 'https://wusongdata.tianyancha.com/', desc: '无讼案例检索' },
      { code: 'court_review', name: '人民法院案例选', url: 'http://www.courtbook.com.cn/', desc: '人民法院出版社案例选' },
    ],
  },
  {
    code: 'contract_template',
    name: '合同模板',
    icon: 'contract_template',
    sort: 3,
    tools: [
      { code: 'contract888', name: '合同范本库', url: 'https://www.contract888.com/', desc: '合同范本下载' },
      { code: 'lawtime_contract', name: '法律快车合同', url: 'https://www.lawtime.cn/contract', desc: '合同范本大全' },
      { code: 'fabao', name: '法宝合同库', url: 'https://www.pkulaw.com/contract', desc: '北大法宝合同范本' },
      { code: 'law-lib_contract', name: '法律图书馆合同', url: 'http://www.law-lib.com/contract/', desc: '合同模板下载' },
      { code: 'cnki_contract', name: 'CNKI合同库', url: 'https://law.cnki.net/', desc: '知网法律合同模板' },
      { code: 'hexun_contract', name: '和讯合同', url: 'http://lawyer.hexun.com/ht/', desc: '和讯法律合同' },
      { code: '64365_contract', name: '律师在线合同', url: 'https://www.64365.com/contract/', desc: '律师常用合同' },
      { code: 'juscn', name: '法律图书馆范本', url: 'http://www.juscn.com/', desc: '合同范本平台' },
      { code: 'gaolaw', name: '高利法律合同', url: 'http://www.gaolaw.com/', desc: '行业合同模板' },
      { code: 'lawyer_contract', name: '律师365合同', url: 'https://www.64365.com/', desc: '合同模板库' },
    ],
  },
  {
    code: 'calculator',
    name: '法律计算器',
    icon: 'calculator',
    sort: 4,
    tools: [
      { code: 'interest_calc', name: '利息计算器', url: 'https://www.lawtime.cn/tool/', desc: '借贷利息计算' },
      { code: 'traffic_compensation', name: '交通事故赔偿计算', url: 'https://www.lawtime.cn/tool/jiaotong/', desc: '交通事故赔偿金额计算' },
      { code: 'labor_compensation', name: '工伤赔偿计算', url: 'https://www.lawtime.cn/tool/gongshang/', desc: '工伤赔偿计算器' },
      { code: 'personal_injury', name: '人身损害赔偿', url: 'https://www.lawtime.cn/tool/renshen/', desc: '人身损害赔偿计算' },
      { code: 'divorce_property', name: '离婚财产分割', url: 'https://www.lawtime.cn/tool/lihun/', desc: '离婚财产计算' },
      { code: 'work injury_disability', name: '伤残等级计算', url: 'https://www.lawtime.cn/tool/shangcan/', desc: '伤残赔偿计算' },
      { code: 'tax_calc', name: '个税计算器', url: 'https://www.chinatax.gov.cn/', desc: '个人所得税计算' },
      { code: 'court_fee', name: '诉讼费计算器', url: 'https://www.lawtime.cn/tool/susongfei/', desc: '法院诉讼费计算' },
      { code: 'lawyer_fee', name: '律师费计算', url: 'https://www.lawtime.cn/tool/lvshifei/', desc: '律师费参考计算' },
      { code: 'social_insurance', name: '社保计算器', url: 'http://www.12333sb.com/', desc: '社保缴费计算' },
    ],
  },
  {
    code: 'instrument_template',
    name: '文书模板',
    icon: 'instrument_template',
    sort: 5,
    tools: [
      { code: 'court_wenshu', name: '法院文书样式', url: 'https://www.court.gov.cn/', desc: '人民法院诉讼文书样式' },
      { code: 'lawyer_wenshu', name: '律师文书库', url: 'https://www.lawtime.cn/wenshu', desc: '律师常用法律文书' },
      { code: 'faxin_wenshu', name: '法信文书', url: 'https://www.faxin.cn/wenshu', desc: '法律文书模板库' },
      { code: 'pkulaw_wenshu', name: '法宝文书', url: 'https://www.pkulaw.com/wenshu', desc: '北大法宝法律文书' },
      { code: '64365_wenshu', name: '律师在线文书', url: 'https://www.64365.com/wenshu/', desc: '法律文书模板' },
      { code: 'wenshu_template', name: '文书模板网', url: 'http://www.wenshubang.com/', desc: '各类法律文书模板' },
      { code: 'jianshe', name: '建设法律文书', url: 'http://www.jianshe.com/', desc: '建设领域法律文书' },
      { code: 'gov_writ', name: '政府法律文书', url: 'http://www.gov.cn/', desc: '政府公文模板' },
      { code: 'court_template', name: '法院文书模板', url: 'https://www.chinacourt.org/', desc: '诉讼文书模板' },
      { code: 'lawyer_template', name: '律师365文书', url: 'https://www.64365.com/wenshu/', desc: '律师文书模板库' },
    ],
  },
  {
    code: 'law_dictionary',
    name: '法律词典',
    icon: 'law_dictionary',
    sort: 6,
    tools: [
      { code: 'cnki_dict', name: 'CNKI法律词典', url: 'https://law.cnki.net/dict', desc: '知网法律词典' },
      { code: 'lawtime_dict', name: '法律快车词典', url: 'https://www.lawtime.cn/dict', desc: '法律术语解释' },
      { code: 'fabao_dict', name: '法宝词典', url: 'https://www.pkulaw.com/dict', desc: '北大法宝法律词典' },
      { code: 'baike_law', name: '法律百科', url: 'https://baike.baidu.com/', desc: '百度百科法律词条' },
      { code: 'cnlaw_dict', name: '中国法律词典', url: 'http://www.cnlaw.net/', desc: '中文法律词典' },
      { code: 'juscn_dict', name: '法律图书馆词典', url: 'http://www.juscn.com/dict', desc: '法律专业术语' },
      { code: 'lawyer_dict', name: '律师词典', url: 'https://www.64365.com/dict/', desc: '律师法律词典' },
      { code: 'faxin_dict', name: '法信词典', url: 'https://www.faxin.cn/dict', desc: '法信法律术语' },
      { code: 'lawlib_dict', name: '法律图书馆', url: 'http://www.law-lib.com/dict', desc: '法律词典检索' },
      { code: 'legaldaily_dict', name: '法治网词典', url: 'http://www.legaldaily.com.cn/', desc: '法治日报法律词典' },
    ],
  },
  {
    code: 'judicial_expertise',
    name: '司法鉴定',
    icon: 'judicial_expertise',
    sort: 7,
    tools: [
      { code: 'moj_expertise', name: '司法部司法鉴定', url: 'http://www.moj.gov.cn/judicial/', desc: '司法部司法鉴定管理局' },
      { code: 'cnas', name: 'CNAS认证', url: 'https://www.cnas.org.cn/', desc: '中国合格评定国家认可委员会' },
      { code: 'justice_expertise', name: '司法鉴定网', url: 'http://www.justice.gov.cn/', desc: '司法鉴定机构查询' },
      { code: 'sfjd', name: '司法鉴定研究院', url: 'http://www.sfjd.cn/', desc: '司法鉴定科学研究院' },
      { code: 'forensic', name: '法医在线', url: 'http://www.forensic.com.cn/', desc: '法医鉴定平台' },
      { code: 'chinacourt_expertise', name: '法院司法鉴定', url: 'https://www.chinacourt.org/', desc: '人民法院司法鉴定' },
      { code: 'expertise_library', name: '司法鉴定百科', url: 'https://baike.baidu.com/', desc: '司法鉴定知识库' },
      { code: 'lawtime_expertise', name: '法律快车司法鉴定', url: 'https://www.lawtime.cn/expertise', desc: '司法鉴定机构' },
      { code: 'fabao_expertise', name: '法宝司法鉴定', url: 'https://www.pkulaw.com/', desc: '司法鉴定案例' },
      { code: 'expertise_query', name: '司法鉴定查询', url: 'http://www.moj.gov.cn/', desc: '司法鉴定资质查询' },
    ],
  },
  {
    code: 'notary_service',
    name: '公证服务',
    icon: 'notary_service',
    sort: 8,
    tools: [
      { code: 'moj_notary', name: '司法部公证', url: 'http://www.moj.gov.cn/notary/', desc: '司法部公证管理' },
      { code: 'chinanotary', name: '中国公证网', url: 'http://www.chinanotary.org.cn/', desc: '中国公证协会官方' },
      { code: 'notary_online', name: '公证在线', url: 'https://www.notaryonline.com/', desc: '公证在线办理' },
      { code: 'icma', name: '公证协会', url: 'http://www.chinanotary.org.cn/', desc: '中国公证员协会' },
      { code: 'beijing_notary', name: '北京公证网', url: 'http://www.bjgzc.org.cn/', desc: '北京市公证机构' },
      { code: 'shanghai_notary', name: '上海公证网', url: 'http://www.sh-notary.org.cn/', desc: '上海公证协会' },
      { code: 'guangzhou_notary', name: '广州公证网', url: 'http://www.gzgzc.org/', desc: '广州公证处' },
      { code: 'lawtime_notary', name: '法律快车公证', url: 'https://www.lawtime.cn/notary', desc: '公证业务咨询' },
      { code: 'fabao_notary', name: '法宝公证', url: 'https://www.pkulaw.com/', desc: '公证法律法规' },
      { code: 'notary_template', name: '公证文书模板', url: 'http://www.chinanotary.org.cn/', desc: '公证文书样式' },
    ],
  },
  {
    code: 'legal_aid',
    name: '法律援助',
    icon: 'legal_aid',
    sort: 9,
    tools: [
      { code: 'moj_aid', name: '司法部法援', url: 'http://www.moj.gov.cn/legalaid/', desc: '司法部法律援助中心' },
      { code: 'chinalegalaid', name: '中国法律援助网', url: 'http://www.chinalegalaid.org.cn/', desc: '中国法律援助基金会' },
      { code: '12348', name: '12348法网', url: 'http://www.12348.gov.cn/', desc: '中国法网公共法律服务' },
      { code: 'beijing_aid', name: '北京法律援助', url: 'http://www.bjlegalaid.gov.cn/', desc: '北京市法律援助中心' },
      { code: 'shanghai_aid', name: '上海法律援助', url: 'http://www.shlegalaid.org.cn/', desc: '上海法律援助中心' },
      { code: 'guangzhou_aid', name: '广州法律援助', url: 'http://www.gzlegalaid.org/', desc: '广州法律援助处' },
      { code: 'lawtime_aid', name: '法律快车法援', url: 'https://www.lawtime.cn/legalaid', desc: '法律援助咨询' },
      { code: 'legal_aid_query', name: '法援申请查询', url: 'http://www.12348.gov.cn/', desc: '法律援助申请' },
      { code: 'court_aid', name: '法院法援', url: 'https://www.chinacourt.org/', desc: '人民法院法律援助' },
      { code: 'lawyer_aid', name: '律师365法援', url: 'https://www.64365.com/legalaid/', desc: '律师法律援助' },
    ],
  },
  {
    code: 'intellectual_property',
    name: '知识产权',
    icon: 'intellectual_property',
    sort: 10,
    tools: [
      { code: 'cnipa', name: '国家知识产权局', url: 'https://www.cnipa.gov.cn/', desc: '国家知识产权局官网' },
      { code: 'trademark', name: '中国商标网', url: 'https://sbj.cnipa.gov.cn/', desc: '商标注册查询' },
      { code: 'patent', name: '中国专利网', url: 'http://www.cnpatent.com/', desc: '专利检索平台' },
      { code: 'copyright', name: '中国版权保护中心', url: 'https://www.ccopyright.com.cn/', desc: '版权登记查询' },
      { code: 'wipo', name: 'WIPO世界知识产权', url: 'https://www.wipo.int/', desc: '世界知识产权组织' },
      { code: 'sipo_patent', name: '专利检索系统', url: 'http://pss-system.cponline.cnipa.gov.cn/', desc: '国家知识产权局专利检索' },
      { code: 'iphouse', name: '权大师知识产权', url: 'https://www.quandashi.com/', desc: '知识产权服务平台' },
      { code: 'lawtime_ip', name: '法律快车知识产权', url: 'https://www.lawtime.cn/ip', desc: '知识产权法律咨询' },
      { code: 'fabao_ip', name: '法宝知识产权', url: 'https://www.pkulaw.com/ip', desc: '知识产权法律检索' },
      { code: 'ipr', name: '知识产权网', url: 'http://www.ipr.gov.cn/', desc: '中国知识产权网' },
    ],
  },
  {
    code: 'tax_law',
    name: '税务法律',
    icon: 'tax_law',
    sort: 11,
    tools: [
      { code: 'chinatax', name: '国家税务总局', url: 'https://www.chinatax.gov.cn/', desc: '国家税务总局官网' },
      { code: 'tax_law_lib', name: '税法库', url: 'http://www.chinatax.gov.cn/n810341/n810765/', desc: '税收法规库' },
      { code: 'gov_tax', name: '国务院税务', url: 'http://www.gov.cn/zhengce/shuiwu/', desc: '国务院税务政策' },
      { code: 'invoice_query', name: '发票查询', url: 'https://inv-veri.chinatax.gov.cn/', desc: '增值税发票查验平台' },
      { code: 'etax', name: '电子税务局', url: 'https://etax.chinatax.gov.cn/', desc: '国家税务总局电子税务局' },
      { code: 'lawtime_tax', name: '法律快车税务', url: 'https://www.lawtime.cn/tax', desc: '税务法律咨询' },
      { code: 'fabao_tax', name: '法宝税法', url: 'https://www.pkulaw.com/tax', desc: '税收法律法规' },
      { code: 'tax_calc_personal', name: '个税计算', url: 'https://www.chinatax.gov.cn/', desc: '个人所得税计算' },
      { code: 'court_tax', name: '法院税务案例', url: 'https://www.chinacourt.org/', desc: '税务纠纷案例' },
      { code: 'lawyer_tax', name: '律师365税务', url: 'https://www.64365.com/tax/', desc: '税务律师咨询' },
    ],
  },
];

@Injectable()
export class LawToolService {
  // 获取法律工具导航列表
  async findList() {
    const totalTools = LAW_TOOL_CATEGORIES.reduce(
      (sum, cat) => sum + (cat.tools?.length || 0),
      0,
    );
    return {
      categories: LAW_TOOL_CATEGORIES,
      category_count: LAW_TOOL_CATEGORIES.length,
      total_tools: totalTools,
    };
  }

  // 获取分类数量
  async getCategoryCount(): Promise<number> {
    return LAW_TOOL_CATEGORIES.length;
  }

  // 获取工具总数
  async getTotalTools(): Promise<number> {
    return LAW_TOOL_CATEGORIES.reduce(
      (sum, cat) => sum + (cat.tools?.length || 0),
      0,
    );
  }
}
