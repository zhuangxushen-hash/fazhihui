import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Button, Modal, Form, Input, Select, Space, message, InputNumber, Alert, DatePicker, Popconfirm, AutoComplete } from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined, HistoryOutlined, SaveOutlined, SwapOutlined, SafetyCertificateOutlined, WarningOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { checkConflict, ConflictCheckRecord } from '../api/conflictCheck'
import { getClientProfiles, createClientProfile } from '../api/client-profile'
import { formatDateTime } from '../utils/format'
import dayjs from 'dayjs'
import { theme } from '../constants/theme'

// 转化状态中文映射（color 字段存放 stitch-tag 变体类名）
const conversionStatusMap: Record<string, { label: string; color: string }> = {
  not_converted: { label: '未转化', color: 'stitch-tag stitch-tag-primary' },
  converting: { label: '转化中', color: 'stitch-tag stitch-tag-info' },
  converted: { label: '已转化', color: 'stitch-tag stitch-tag-success' },
}

export default function LeadManagement() {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [followUpVisible, setFollowUpVisible] = useState(false)
  const [statusVisible, setStatusVisible] = useState(false)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [followUpForm] = Form.useForm()
  const [statusForm] = Form.useForm()
  const [currentLead, setCurrentLead] = useState<Record<string, unknown> | null>(null)
  const [followUps, setFollowUps] = useState<Record<string, unknown>[]>([])
  const [editingFee, setEditingFee] = useState(false)
  const [feeValue, setFeeValue] = useState(0)
  // 案由自定义选项（支持用户输入新案由）
  const [customCaseTypeOptions, setCustomCaseTypeOptions] = useState<Array<{ value: string; label: string }>>([])
  const [searchParams, setSearchParams] = useState({
    phone: '',
    status: '',
    case_type: '',
    source_channel: '',
    days_no_follow: '' as string | number,
  })
  // 转化为案件的弹窗（公共线索池功能已合并入 LeadPool 专项页，此处仅维护私有线索）
  const [convertVisible, setConvertVisible] = useState(false)
  const [convertForm] = Form.useForm()
  const [converting, setConverting] = useState(false)

  // 利冲初查相关状态
  const [conflictVisible, setConflictVisible] = useState(false)
  const [conflictChecking, setConflictChecking] = useState(false)
  const [conflictResult, setConflictResult] = useState<ConflictCheckRecord | null>(null)
  const [conflictLead, setConflictLead] = useState<Record<string, unknown> | null>(null)
  const [conflictForm] = Form.useForm()
  // 记录检测到冲突的线索ID集合，用于在状态列展示红色标记
  const [conflictLeadIds, setConflictLeadIds] = useState<Set<string>>(new Set())
  // 客户库客户列表（用于创建线索时留存/关联客户信息）
  const [clientProfiles, setClientProfiles] = useState<Record<string, any>[]>([])

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
    fetchClientProfiles()
  }, [])

  // 加载客户库客户列表，供创建线索时下拉选择/匹配客户
  const fetchClientProfiles = async () => {
    try {
      const res: any = await getClientProfiles({ org_id: user.organization_id, page_size: 100 })
      // 响应拦截器已直接返回数据体（客户数组），优先取数组；兼容旧 {data:{list}} 结构
      setClientProfiles((Array.isArray(res) ? res : null) || res?.data?.list || res?.data || [])
    } catch (error) {
      // 客户库加载失败不影响线索录入，静默处理
    }
  }

  // 联系人输入联动：命中客户库客户时带出其存量电话/单位名/地址，供留存客户信息参考
  const handleContactNameInput = (nextName: string) => {
    const cp = clientProfiles.find((c) => String(c.name || '').trim() === String(nextName || '').trim())
    if (cp) {
      form.setFieldsValue({
        contact_name: cp.name,
        phone: cp.phone || form.getFieldValue('phone'),
        unit_name: cp.unit_name || form.getFieldValue('unit_name'),
        contact_address: cp.address || form.getFieldValue('contact_address'),
      })
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // 仅查询私有线索（公共线索池功能已合并入 LeadPool 专项页）
      const params: Record<string, unknown> = { org_id: user.organization_id }
      if (searchParams.phone) params.phone = searchParams.phone
      if (searchParams.status) params.status = searchParams.status
      if (searchParams.case_type) params.case_type = searchParams.case_type
      if (searchParams.source_channel) params.source_channel = searchParams.source_channel
      if (searchParams.days_no_follow) params.days_no_follow = searchParams.days_no_follow

      const res = (await axios.get('/leads', { params })) as Record<string, unknown>
      setData((res?.data || []) as Record<string, unknown>[])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  // 打开转化为案件弹窗
  const handleConvert = (record: Record<string, unknown>) => {
    setCurrentLead(record)
    convertForm.resetFields()
    convertForm.setFieldsValue({ fee_amount: record.service_fee || 0 })
    setConvertVisible(true)
  }

  // 确认转化为案件
  const handleConvertSubmit = async (values: Record<string, unknown>) => {
    if (!currentLead) return
    setConverting(true)
    try {
      const res = (await axios.post(`/leads/${currentLead.id}/convert`, values)) as Record<string, unknown>
      setConvertVisible(false)
      message.success('线索转化案件成功')
      fetchData()
      const caseId = (res?.data as Record<string, unknown>)?.id || (res as Record<string, unknown>)?.id
      if (caseId) {
        Modal.confirm({
          title: '转化成功',
          content: '案件已创建，是否跳转到案件详情？',
          okText: '查看案件',
          cancelText: '留在当前页',
          onOk: () => navigate('/cases'),
        })
      }
    } catch (error) {
      message.error('线索转化案件失败')
    } finally {
      setConverting(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setSearchParams({ phone: '', status: '', case_type: '', source_channel: '', days_no_follow: '' })
    fetchData()
  }

  const handleAddLead = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      // 创建线索时留存客户信息：联系人即客户姓名，将线索中的客户相关字段（姓名/电话/单位/地址/来源等）同步留存到客户库
      const contactName = typeof values.contact_name === 'string' ? values.contact_name.trim() : ''
      if (contactName) {
        const matched = clientProfiles.find((c) => String(c.name || '').trim() === contactName)
        if (!matched) {
          try {
            const address = [values.province, values.city, values.contact_address].filter(Boolean).join('') || undefined
            const unitText = (values.unit_name as string) || ''
            await createClientProfile({
              name: contactName,
              contact_name: contactName,
              type: 'individual',
              unit_name: unitText || undefined,
              phone: (values.phone as string) || undefined,
              address: address as string,
              source: (values.source_channel as string) || undefined,
              organization_id: user.organization_id,
            })
          } catch (error) {
            // 客户留存失败不阻断线索创建，静默处理
          }
        }
      }
      await axios.post('/leads', { ...values, organization_id: user.organization_id })
      setModalVisible(false)
      message.success('线索添加成功')
      fetchData()
    } catch (error) {
      message.error('线索添加失败')
    }
  }

  // 打开编辑线索弹窗，预填线索基本信息
  const handleEditLead = (record: Record<string, unknown>) => {
    setCurrentLead(record)
    editForm.resetFields()
    editForm.setFieldsValue({
      phone: record.phone,
      contact_name: record.contact_name,
      case_type: record.case_type,
      source_channel: record.source_channel,
      source_keyword: record.source_keyword,
      case_description: record.case_description,
      unit_name: record.unit_name,
      business_summary: record.business_summary,
      team: record.team,
      handler: record.handler,
      assignee: record.assignee,
      province: record.province,
      city: record.city,
      amount: record.amount,
      contact_address: record.contact_address,
      intent_level: record.intent_level,
      contact_result: record.contact_result,
      business_source: record.business_source,
      register_date: record.register_date ? dayjs(record.register_date as string) : null,
    })
    setEditVisible(true)
  }

  // 提交线索编辑
  const handleEditSubmit = async (values: Record<string, unknown>) => {
    if (!currentLead) return
    try {
      await axios.put(`/leads/${currentLead.id}`, values)
      setEditVisible(false)
      message.success('线索更新成功')
      fetchData()
    } catch (error) {
      message.error('线索更新失败')
    }
  }

  const handleAssign = async (record: Record<string, unknown>) => {
    try {
      await axios.put(`/leads/${record.id}/assign`, { sales_id: user.id })
      message.success('线索分配成功')
      fetchData()
    } catch (error) {
      message.error('线索分配失败')
    }
  }

  const handleViewDetail = async (record: Record<string, unknown>) => {
    setCurrentLead(record)
    try {
      const res = await axios.get(`/leads/${record.id}/follow-ups`)
      setFollowUps((res as Record<string, unknown>[]) || [])
    } catch (error) {
      setFollowUps([])
    }
    setDetailVisible(true)
  }

  const handleAddFollowUp = () => {
    followUpForm.resetFields()
    setFollowUpVisible(true)
  }

  const handleSubmitFollowUp = async (values: Record<string, unknown>) => {
    if (!currentLead) return
    try {
      await axios.post(`/leads/${currentLead.id}/follow-up`, {
        ...values,
        operator_id: user.id,
      })
      setFollowUpVisible(false)
      message.success('跟进记录添加成功')
      const res = await axios.get(`/leads/${currentLead.id}/follow-ups`)
      setFollowUps((res as Record<string, unknown>[]) || [])
      fetchData()
    } catch (error) {
      message.error('跟进记录添加失败')
    }
  }

  const handleChangeStatus = (record: Record<string, unknown>) => {
    setCurrentLead(record)
    statusForm.setFieldsValue({ status: record.status })
    setStatusVisible(true)
  }

  const handleSubmitStatus = async (values: Record<string, unknown>) => {
    if (!currentLead) return
    try {
      await axios.put(`/leads/${currentLead.id}/status`, values)
      setStatusVisible(false)
      message.success('状态更新成功')
      fetchData()
    } catch (error) {
      message.error('状态更新失败')
    }
  }

  const handleEditFee = (record: Record<string, unknown>) => {
    setCurrentLead(record)
    setFeeValue((record.service_fee as number) || 0)
    setEditingFee(true)
  }

  const handleSaveFee = async () => {
    if (!currentLead) return
    try {
      await axios.put(`/leads/${currentLead.id}/fee`, { service_fee: feeValue })
      setEditingFee(false)
      message.success('服务费用更新成功')
      fetchData()
    } catch (error) {
      message.error('服务费用更新失败')
    }
  }

  // 删除线索
  const handleDelete = async (record: Record<string, unknown>) => {
    try {
      await axios.delete(`/leads/${record.id}`)
      message.success('线索删除成功')
      fetchData()
    } catch (error) {
      message.error('线索删除失败')
    }
  }

  // 打开利冲初查弹窗，预填线索联系人和电话
  const handleConflictCheck = (record: Record<string, unknown>) => {
    setConflictLead(record)
    setConflictResult(null)
    conflictForm.resetFields()
    conflictForm.setFieldsValue({
      party_name: (record.contact_name as string) || '',
      party_phone: (record.phone as string) || '',
    })
    setConflictVisible(true)
  }

  // 执行利冲初查
  const handleConflictSubmit = async (values: Record<string, unknown>) => {
    setConflictChecking(true)
    try {
      const res = (await checkConflict({
        party_name: values.party_name as string,
        opposing_party: values.opposing_party as string,
        party_phone: (values.party_phone as string) || undefined,
      })) as ConflictCheckRecord
      setConflictResult(res)
      // 如果检测到冲突，将该线索ID加入冲突集合，在状态列展示红色标记
      if (res.check_result === 'conflict' && conflictLead) {
        setConflictLeadIds(prev => {
          const next = new Set(prev)
          next.add(String(conflictLead.id))
          return next
        })
      }
    } catch (error) {
      message.error('利冲初查失败')
    } finally {
      setConflictChecking(false)
    }
  }

  const statusOptions = [
    { value: 'new', label: '新线索' },
    { value: 'pending_follow', label: '待跟进' },
    { value: 'following', label: '跟进中' },
    { value: 'inviting', label: '邀约中' },
    { value: 'negotiating', label: '谈判中' },
    { value: 'pending_sign', label: '待签约' },
    { value: 'lost', label: '已流失' },
  ]

  const caseTypeOptions = [
    { value: 'marriage', label: '婚姻家事' },
    { value: 'traffic', label: '交通事故' },
    { value: 'labor', label: '劳动争议' },
    { value: 'debt', label: '债务逾期' },
    { value: 'criminal', label: '刑事案件' },
    { value: 'administrative', label: '行政案件' },
    { value: 'non_litigation', label: '非诉专项' },
    { value: 'consulting', label: '咨询代书' },
    { value: 'ip', label: '知识产权' },
    { value: 'company', label: '公司法' },
    { value: 'real_estate', label: '房产纠纷' },
    { value: 'contract', label: '合同纠纷' },
    { value: 'inheritance', label: '继承纠纷' },
    { value: 'equity', label: '股权纠纷' },
    { value: 'investment', label: '投融资' },
    { value: 'other', label: '其他' },
  ]

  // 合并预设选项和自定义选项
  const allCaseTypeOptions = [...caseTypeOptions, ...customCaseTypeOptions]

  // 处理案由搜索和新增
  const handleCaseTypeSearch = (input: string) => {
    // 如果输入不在现有选项中，添加为自定义选项
    if (input && !allCaseTypeOptions.find(o => o.label === input || o.value === input)) {
      const newOption = { value: input, label: input }
      setCustomCaseTypeOptions(prev => [...prev, newOption])
    }
  }

  const handleCaseTypeChange = (value: string) => {
    // 如果选择了自定义值，确保它在选项列表中
    if (value && !allCaseTypeOptions.find(o => o.value === value)) {
      const newOption = { value, label: value }
      setCustomCaseTypeOptions(prev => [...prev, newOption])
    }
  }

  const channelOptions = [
    { value: 'douyin', label: '抖音' },
    { value: 'baidu', label: '百度' },
    { value: 'kuaishou', label: '快手' },
    { value: 'wechat', label: '微信' },
    { value: 'xiaohongshu', label: '小红书' },
    { value: 'zhihu', label: '知乎' },
    { value: 'laike', label: '来科' },
    { value: 'phone', label: '电话营销' },
    { value: 'referral', label: '转介绍' },
    { value: 'other', label: '其他' },
  ]

  // 新增枚举选项
  const intentLevelOptions = [
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' },
  ]

  const contactResultOptions = [
    { value: 'not_contacted', label: '未接洽' },
    { value: 'contacting', label: '接洽中' },
    { value: 'deal_closed', label: '已成交' },
    { value: 'abandoned', label: '已放弃' },
    { value: 'converted', label: '已转化' },
  ]

  const businessSourceOptions = [
    { value: 'online_consult', label: '网络咨询' },
    { value: 'old_customer_referral', label: '老客户推荐' },
    { value: 'phone_marketing', label: '电话营销' },
    { value: 'offline_promotion', label: '线下推广' },
    { value: 'friend_intro', label: '朋友介绍' },
    { value: 'industry_exhibition', label: '行业展会' },
    { value: 'association_recommend', label: '协会推荐' },
    { value: 'search_engine', label: '搜索引擎' },
    { value: 'social_media', label: '社交媒体' },
    { value: 'direct_visit', label: '直接来访' },
    { value: 'legal_aid', label: '法律援助' },
    { value: 'court_referral', label: '法院转介' },
  ]

  const teamOptions = [
    { value: 'litigation_1', label: '诉讼一部' },
    { value: 'litigation_2', label: '诉讼二部' },
    { value: 'litigation_3', label: '诉讼三部' },
    { value: 'non_litigation', label: '非诉部' },
    { value: 'legal_consulting', label: '法律顾问部' },
    { value: 'criminal_defense', label: '刑事辩护部' },
    { value: 'ip', label: '知识产权部' },
    { value: 'labor', label: '劳动法务部' },
    { value: 'marriage_family', label: '婚姻家事部' },
    { value: 'company_finance', label: '公司金融部' },
  ]

  const columns = [
    { title: '线索ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '联系人', dataIndex: 'contact_name', key: 'contact_name', width: 100 },
    { title: '单位名称', dataIndex: 'unit_name', key: 'unit_name', width: 150, ellipsis: true },
    { title: '案由', dataIndex: 'case_type', key: 'case_type', width: 100, render: (type: string) => ({
      marriage: '婚姻家事',
      traffic: '交通事故',
      labor: '劳动争议',
      debt: '债务逾期',
      criminal: '刑事案件',
      administrative: '行政案件',
      non_litigation: '非诉专项',
      consulting: '咨询代书',
      ip: '知识产权',
      company: '公司法',
      real_estate: '房产纠纷',
      contract: '合同纠纷',
      inheritance: '继承纠纷',
      equity: '股权纠纷',
      investment: '投融资',
      other: '其他',
    }[type] || type) },
    { title: '业务摘要', dataIndex: 'business_summary', key: 'business_summary', width: 180, ellipsis: true },
    { title: '所属团队', dataIndex: 'team', key: 'team', width: 100, render: (team: string) => {
      const teamMap: Record<string, string> = {
        litigation_1: '诉讼一部',
        litigation_2: '诉讼二部',
        litigation_3: '诉讼三部',
        non_litigation: '非诉部',
        legal_consulting: '法律顾问部',
        criminal_defense: '刑事辩护部',
        ip: '知识产权部',
        labor: '劳动法务部',
        marriage_family: '婚姻家事部',
        company_finance: '公司金融部',
      }
      return teamMap[team] || team || '-'
    }},
    { title: '主办人', dataIndex: 'handler', key: 'handler', width: 100 },
    { title: '金额(元)', dataIndex: 'amount', key: 'amount', width: 100, render: (amount: number) => amount ? `¥${amount.toLocaleString()}` : '-' },
    { title: '意向等级', dataIndex: 'intent_level', key: 'intent_level', width: 90, render: (level: string) => {
      const levelMap: Record<string, { label: string; className: string }> = {
        high: { label: '高', className: 'stitch-tag stitch-tag-error' },
        medium: { label: '中', className: 'stitch-tag stitch-tag-gold' },
        low: { label: '低', className: 'stitch-tag stitch-tag-info' },
      }
      const info = levelMap[level]
      return info ? <Tag className={info.className}>{info.label}</Tag> : '-'
    }},
    { title: '接洽结果', dataIndex: 'contact_result', key: 'contact_result', width: 100, render: (result: string) => {
      const resultMap: Record<string, { label: string; className: string }> = {
        not_contacted: { label: '未接洽', className: 'stitch-tag stitch-tag-default' },
        contacting: { label: '接洽中', className: 'stitch-tag stitch-tag-info' },
        deal_closed: { label: '已成交', className: 'stitch-tag stitch-tag-success' },
        abandoned: { label: '已放弃', className: 'stitch-tag stitch-tag-error' },
        converted: { label: '已转化', className: 'stitch-tag stitch-tag-primary' },
      }
      const info = resultMap[result]
      return info ? <Tag className={info.className}>{info.label}</Tag> : '-'
    }},
    { title: '来源渠道', dataIndex: 'source_channel', key: 'source_channel', width: 100, render: (channel: string) => ({
      douyin: '抖音',
      baidu: '百度',
      kuaishou: '快手',
      wechat: '微信',
      xiaohongshu: '小红书',
      zhihu: '知乎',
      laike: '来科',
      phone: '电话营销',
      referral: '转介绍',
      other: '其他',
    }[channel] || channel) },
    { title: '业务来源', dataIndex: 'business_source', key: 'business_source', width: 100, render: (source: string) => {
      const sourceMap: Record<string, string> = {
        online_consult: '网络咨询',
        old_customer_referral: '老客户推荐',
        phone_marketing: '电话营销',
        offline_promotion: '线下推广',
        friend_intro: '朋友介绍',
        industry_exhibition: '行业展会',
        association_recommend: '协会推荐',
        search_engine: '搜索引擎',
        social_media: '社交媒体',
        direct_visit: '直接来访',
        legal_aid: '法律援助',
        court_referral: '法院转介',
      }
      return sourceMap[source] || source || '-'
    }},
    { title: '服务费用', dataIndex: 'service_fee', key: 'service_fee', width: 100, render: (fee: number) => fee ? `¥${fee.toFixed(2)}` : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string, record: Record<string, unknown>) => {
      // colors 映射存放 stitch-tag 变体类名
      const colors: Record<string, string> = {
        new: 'stitch-tag stitch-tag-primary',
        pending_follow: 'stitch-tag stitch-tag-info',
        following: 'stitch-tag stitch-tag-info',
        inviting: 'stitch-tag stitch-tag-info',
        negotiating: 'stitch-tag stitch-tag-info',
        pending_sign: 'stitch-tag stitch-tag-gold',
        lost: 'stitch-tag stitch-tag-error',
      }
      const labels: Record<string, string> = {
        new: '新线索',
        pending_follow: '待跟进',
        following: '跟进中',
        inviting: '邀约中',
        negotiating: '谈判中',
        pending_sign: '待签约',
        lost: '已流失',
      }
      // 若该线索检测到利益冲突，在状态旁展示红色标记图标
      const hasConflict = conflictLeadIds.has(String(record.id))
      return (
        <Space size={4}>
          <Tag className={colors[status]}>{labels[status]}</Tag>
          {hasConflict && (
            <span title="检测到利益冲突" style={{ color: theme.error, fontSize: 14 }}>
              <WarningOutlined />
            </span>
          )}
        </Space>
      )
    }},
    { title: '转化状态', dataIndex: 'conversion_status', key: 'conversion_status', render: (status: string) => {
      const info = conversionStatusMap[status] || conversionStatusMap.not_converted
      return <Tag className={info.color}>{info.label}</Tag>
    }},
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: unknown, record: Record<string, unknown>) => (
      <Space wrap>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEditLead(record)}>编辑</Button>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleChangeStatus(record)}>状态</Button>
        <Button size="small" icon={<SaveOutlined />} onClick={() => handleEditFee(record)}>设置费用</Button>
        <Button size="small" icon={<SafetyCertificateOutlined />} onClick={() => handleConflictCheck(record)}>利冲初查</Button>
        {record.conversion_status !== 'converted' && (
          <Button size="small" icon={<SwapOutlined />} onClick={() => handleConvert(record)}>转化为案件</Button>
        )}
        {record.status === 'new' && (
          <Button size="small" type="primary" onClick={() => handleAssign(record)}>分配</Button>
        )}
        <Popconfirm title="确定删除此线索？" onConfirm={() => handleDelete(record)} okText="确定" cancelText="取消">
          <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ]

  return (
    <div>
      <div className="page-header">
        <h2>线索管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLead}>添加线索</Button>
      </div>

      <div className="search-bar stitch-filter-bar">
        <Input
          placeholder="手机号搜索"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          value={searchParams.phone}
          onChange={(e) => setSearchParams({ ...searchParams, phone: e.target.value })}
        />
        <Select
          placeholder="状态筛选"
          style={{ width: 150 }}
          allowClear
          value={searchParams.status || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, status: value || '' })}
        >
          {statusOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <Select
          placeholder="案由筛选"
          style={{ width: 180 }}
          allowClear
          showSearch
          value={searchParams.case_type || undefined}
          onChange={(value) => { setSearchParams({ ...searchParams, case_type: value || '' }); handleCaseTypeChange(value) }}
          onSearch={handleCaseTypeSearch}
          filterOption={(input, option) =>
            (option?.label as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ||
            (option?.value as unknown as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={allCaseTypeOptions}
        />
        <Select
          placeholder="渠道筛选"
          style={{ width: 150 }}
          allowClear
          value={searchParams.source_channel || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, source_channel: value || '' })}
        >
          {channelOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <Select
          placeholder="智能筛选"
          style={{ width: 180 }}
          allowClear
          value={searchParams.days_no_follow ? Number(searchParams.days_no_follow) : undefined}
          onChange={(value) => setSearchParams({ ...searchParams, days_no_follow: value || '' })}
        >
          <Select.Option value={7}>超过7天未跟进</Select.Option>
          <Select.Option value={15}>超过15天未跟进</Select.Option>
          <Select.Option value={30}>超过30天未跟进</Select.Option>
        </Select>
        <Button type="primary" onClick={handleSearch}>搜索</Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <div className="stitch-table">
        <Table dataSource={data} columns={columns} loading={loading} rowKey="id" scroll={{ x: 'max-content' }} />
      </div>

      <Modal
        title="添加线索"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
            <Input className="stitch-input" placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="contact_name" label="联系人（即客户姓名，可从客户库选择或手动输入）">
            <AutoComplete
              className="stitch-input"
              placeholder="从客户库选择，或直接输入客户姓名"
              allowClear
              onChange={handleContactNameInput}
              filterOption={(input, option) =>
                String(option?.value ?? '').toLowerCase().includes((input || '').toLowerCase())
              }
              options={clientProfiles.map(cp => ({
                value: String(cp.name || ''),
                label: `${String(cp.name || '')}${cp.phone ? ' - ' + cp.phone : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="unit_name" label="单位名称">
            <Input className="stitch-input" placeholder="请输入单位名称" />
          </Form.Item>
          <Form.Item name="case_type" label="案由" rules={[{ required: true }]}>
            <Select
              className="stitch-input"
              showSearch
              placeholder="请选择或输入案由"
              onSearch={handleCaseTypeSearch}
              onChange={(value) => handleCaseTypeChange(value)}
              filterOption={(input, option) =>
                (option?.label as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ||
                (option?.value as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={allCaseTypeOptions}
            />
          </Form.Item>
          <Form.Item name="team" label="所属团队">
            <Select className="stitch-input" placeholder="请选择所属团队" allowClear>
              {teamOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="handler" label="主办人">
            <Input className="stitch-input" placeholder="请输入主办人" />
          </Form.Item>
          <Form.Item name="assignee" label="业务员">
            <Input className="stitch-input" placeholder="请输入业务员" />
          </Form.Item>
          <Form.Item name="source_channel" label="来源渠道" rules={[{ required: true }]}>
            <Select className="stitch-input">
              {channelOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="business_source" label="业务来源">
            <Select className="stitch-input" placeholder="请选择业务来源" allowClear>
              {businessSourceOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="source_keyword" label="来源关键词">
            <Input className="stitch-input" placeholder="请输入来源关键词" />
          </Form.Item>
          <Form.Item name="intent_level" label="意向等级">
            <Select className="stitch-input" placeholder="请选择意向等级" allowClear>
              {intentLevelOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="contact_result" label="接洽结果">
            <Select className="stitch-input" placeholder="请选择接洽结果" allowClear>
              {contactResultOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="province" label="省份">
            <Input className="stitch-input" placeholder="请输入省份" />
          </Form.Item>
          <Form.Item name="city" label="城市">
            <Input className="stitch-input" placeholder="请输入城市" />
          </Form.Item>
          <Form.Item name="contact_address" label="联系地址">
            <Input className="stitch-input" placeholder="请输入联系地址" />
          </Form.Item>
          <Form.Item name="amount" label="金额">
            <InputNumber className="stitch-input" style={{ width: '100%' }} min={0} placeholder="请输入金额" />
          </Form.Item>
          <Form.Item name="register_date" label="登记日期">
            <DatePicker className="stitch-input" style={{ width: '100%' }} placeholder="请选择登记日期" />
          </Form.Item>
          <Form.Item name="business_summary" label="业务摘要">
            <Input.TextArea className="stitch-input" placeholder="请输入业务摘要" rows={3} />
          </Form.Item>
          <Form.Item name="case_description" label="咨询内容">
            <Input.TextArea className="stitch-input" placeholder="请输入咨询内容" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑线索"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
      >
        <Form onFinish={handleEditSubmit} form={editForm} layout="vertical">
          <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
            <Input className="stitch-input" placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="contact_name" label="联系人">
            <Input className="stitch-input" placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item name="unit_name" label="单位名称">
            <Input className="stitch-input" placeholder="请输入单位名称" />
          </Form.Item>
          <Form.Item name="case_type" label="案由" rules={[{ required: true }]}>
            <Select
              className="stitch-input"
              showSearch
              placeholder="请选择或输入案由"
              onSearch={handleCaseTypeSearch}
              onChange={(value) => handleCaseTypeChange(value)}
              filterOption={(input, option) =>
                (option?.label as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ||
                (option?.value as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={allCaseTypeOptions}
            />
          </Form.Item>
          <Form.Item name="team" label="所属团队">
            <Select className="stitch-input" placeholder="请选择所属团队" allowClear>
              {teamOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="handler" label="主办人">
            <Input className="stitch-input" placeholder="请输入主办人" />
          </Form.Item>
          <Form.Item name="assignee" label="业务员">
            <Input className="stitch-input" placeholder="请输入业务员" />
          </Form.Item>
          <Form.Item name="source_channel" label="来源渠道" rules={[{ required: true }]}>
            <Select className="stitch-input">
              {channelOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="business_source" label="业务来源">
            <Select className="stitch-input" placeholder="请选择业务来源" allowClear>
              {businessSourceOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="source_keyword" label="来源关键词">
            <Input className="stitch-input" placeholder="请输入来源关键词" />
          </Form.Item>
          <Form.Item name="intent_level" label="意向等级">
            <Select className="stitch-input" placeholder="请选择意向等级" allowClear>
              {intentLevelOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="contact_result" label="接洽结果">
            <Select className="stitch-input" placeholder="请选择接洽结果" allowClear>
              {contactResultOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="province" label="省份">
            <Input className="stitch-input" placeholder="请输入省份" />
          </Form.Item>
          <Form.Item name="city" label="城市">
            <Input className="stitch-input" placeholder="请输入城市" />
          </Form.Item>
          <Form.Item name="contact_address" label="联系地址">
            <Input className="stitch-input" placeholder="请输入联系地址" />
          </Form.Item>
          <Form.Item name="amount" label="金额">
            <InputNumber className="stitch-input" style={{ width: '100%' }} min={0} placeholder="请输入金额" />
          </Form.Item>
          <Form.Item name="register_date" label="登记日期">
            <DatePicker className="stitch-input" style={{ width: '100%' }} placeholder="请选择登记日期" />
          </Form.Item>
          <Form.Item name="business_summary" label="业务摘要">
            <Input.TextArea className="stitch-input" placeholder="请输入业务摘要" rows={3} />
          </Form.Item>
          <Form.Item name="case_description" label="咨询内容">
            <Input.TextArea className="stitch-input" placeholder="请输入咨询内容" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">保存</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="线索详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentLead && (() => {
          const lead = currentLead as Record<string, unknown>
          return (
          <div>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">线索ID</span><span className="detail-value">{String(lead.id ?? '')}</span></div>
              <div className="detail-item"><span className="detail-label">手机号</span><span className="detail-value">{String(lead.phone ?? '')}</span></div>
              <div className="detail-item"><span className="detail-label">联系人</span><span className="detail-value">{String(lead.contact_name || '-')}</span></div>
              <div className="detail-item"><span className="detail-label">案由</span><span className="detail-value">{({
                  marriage: '婚姻家事',
                  traffic: '交通事故',
                  labor: '劳动争议',
                  debt: '债务逾期',
                  other: '其他',
                }[lead.case_type as string])}</span></div>
              <div className="detail-item"><span className="detail-label">来源渠道</span><span className="detail-value">{({
                  douyin: '抖音',
                  baidu: '百度',
                  kuaishou: '快手',
                  wechat: '微信',
                  other: '其他',
                }[lead.source_channel as string])}</span></div>
              <div className="detail-item"><span className="detail-label">状态</span><span className="detail-value">
                <Tag className={{
                  new: 'stitch-tag stitch-tag-primary',
                  pending_follow: 'stitch-tag stitch-tag-info',
                  following: 'stitch-tag stitch-tag-info',
                  inviting: 'stitch-tag stitch-tag-info',
                  negotiating: 'stitch-tag stitch-tag-info',
                  pending_sign: 'stitch-tag stitch-tag-gold',
                  lost: 'stitch-tag stitch-tag-error',
                }[lead.status as string]}>
                  {{
                    new: '新线索',
                    pending_follow: '待跟进',
                    following: '跟进中',
                    inviting: '邀约中',
                    negotiating: '谈判中',
                    pending_sign: '待签约',
                    lost: '已流失',
                  }[lead.status as string]}
                </Tag>
              </span></div>
              <div className="detail-item"><span className="detail-label">来源关键词</span><span className="detail-value">{String(lead.source_keyword || '-')}</span></div>
              <div className="detail-item"><span className="detail-label">创建时间</span><span className="detail-value">{formatDateTime(lead.created_at as string)}</span></div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>咨询内容</div>
              <div className="info-block">
                {String(lead.case_description || '-')}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold' }}>跟进记录</div>
                <Button icon={<HistoryOutlined />} onClick={handleAddFollowUp}>添加跟进</Button>
              </div>
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                {followUps.length === 0 ? (
                  <div style={{ textAlign: 'center', color: theme.gray, padding: 24 }}>暂无跟进记录</div>
                ) : (
                  followUps.map((item) => {
                    const fu = item as Record<string, unknown>
                    return (
                    <div key={fu.id as React.Key} style={{ borderBottom: `1px solid ${theme.borderSecondary}`, padding: '12px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold' }}>{String(fu.created_at ?? '')}</span>
                      </div>
                      <div style={{ marginTop: 8 }}>{String(fu.content ?? '')}</div>
                      {Boolean(fu.next_action) && (
                        <div style={{ marginTop: 4, color: theme.grayDark, fontSize: 13 }}>
                          下一步：{String(fu.next_action)}
                          {fu.next_action_time ? ` (${String(fu.next_action_time)})` : ''}
                        </div>
                      )}
                    </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
          )
        })()}
      </Modal>

      <Modal
        title="添加跟进记录"
        open={followUpVisible}
        onCancel={() => setFollowUpVisible(false)}
        footer={null}
      >
        <Form onFinish={handleSubmitFollowUp}>
          <Form.Item name="content" label="跟进内容" rules={[{ required: true }]}>
            <Input.TextArea className="stitch-input" placeholder="请输入跟进内容" rows={4} />
          </Form.Item>
          <Form.Item name="next_action" label="下一步行动">
            <Input className="stitch-input" placeholder="请输入下一步行动" />
          </Form.Item>
          <Form.Item name="next_action_time" label="下次跟进时间">
            <Input className="stitch-input" type="datetime-local" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更状态"
        open={statusVisible}
        onCancel={() => setStatusVisible(false)}
        footer={null}
      >
        <Form onFinish={handleSubmitStatus}>
          <Form.Item name="status" label="选择状态" rules={[{ required: true }]}>
            <Select className="stitch-input">
              {statusOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">确认变更</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="设置服务费用"
        open={editingFee}
        onCancel={() => setEditingFee(false)}
        footer={null}
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, color: theme.grayDark, marginBottom: 8 }}>服务费用（元）</label>
            <InputNumber
              value={feeValue}
              onChange={(value) => setFeeValue(value || 0)}
              style={{ width: '100%', fontSize: 18 }}
              prefix="¥"
              min={0}
              step={100}
            />
          </div>
          <Button type="primary" block onClick={handleSaveFee}>保存费用</Button>
        </div>
      </Modal>

      <Modal
        title="转化为案件"
        open={convertVisible}
        onCancel={() => setConvertVisible(false)}
        footer={null}
      >
        <Form onFinish={handleConvertSubmit} form={convertForm}>
          <Form.Item name="assignee_lawyer_id" label="承办律师ID">
            <Input className="stitch-input" placeholder="选填，可后续分配" />
          </Form.Item>
          <Form.Item name="fee_amount" label="案件费用（元）">
            <InputNumber style={{ width: '100%' }} min={0} step={100} prefix="¥" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={converting} icon={<SwapOutlined />}>确认转化</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 利冲初查弹窗：预填线索联系人信息，输入对方当事人后检索 */}
      <Modal
        title="利冲初查"
        open={conflictVisible}
        onCancel={() => setConflictVisible(false)}
        footer={null}
        width={560}
      >
        <Form form={conflictForm} layout="vertical" onFinish={handleConflictSubmit}>
          <Form.Item name="party_name" label="当事人姓名" rules={[{ required: true, message: '请输入当事人姓名' }]}>
            <Input className="stitch-input" placeholder="请输入当事人姓名" />
          </Form.Item>
          <Form.Item name="opposing_party" label="对方当事人姓名" rules={[{ required: true, message: '请输入对方当事人姓名' }]}>
            <Input className="stitch-input" placeholder="请输入对方当事人姓名" />
          </Form.Item>
          <Form.Item name="party_phone" label="当事人电话">
            <Input className="stitch-input" placeholder="可选" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={conflictChecking} icon={<SafetyCertificateOutlined />}>
              开始检索
            </Button>
          </Form.Item>
        </Form>

        {/* 检索结果展示区 */}
        {conflictResult && (() => {
          const isClear = conflictResult.check_result === 'clear'
          const isConflict = conflictResult.check_result === 'conflict'
          const cfg = isClear
            ? { color: theme.success, icon: <CheckCircleOutlined />, bg: 'rgba(46, 125, 50, 0.08)' }
            : isConflict
              ? { color: theme.error, icon: <CloseCircleOutlined />, bg: 'rgba(186, 26, 26, 0.08)' }
              : { color: theme.warning, icon: <WarningOutlined />, bg: 'rgba(237, 108, 2, 0.08)' }
          return (
            <div style={{ marginTop: 16, background: cfg.bg, padding: 16, borderRadius: 8, border: `1px solid ${cfg.color}33` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18, color: cfg.color }}>{cfg.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: cfg.color }}>
                  {isClear ? '未检测到利益冲突' : isConflict ? '检测到利益冲突' : '检测到风险提示'}
                </span>
              </div>
              {isClear ? (
                <Alert type="success" showIcon message="未在现有案件中检索到相关当事人，可放心推进转化" />
              ) : (
                <div>
                  {conflictResult.conflict_case_name && (
                    <div style={{ marginBottom: 8, fontSize: 13, color: theme.textSecondary }}>
                      冲突案件：<span style={{ color: theme.error, fontWeight: 600 }}>{conflictResult.conflict_case_name}</span>
                    </div>
                  )}
                  {conflictResult.conflict_detail && (
                    <div style={{ background: theme.bgContainer, padding: 12, borderRadius: 6, border: `1px solid ${theme.borderSecondary}` }}>
                      <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 6 }}>冲突详情（含案件名称与当事人）</div>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: theme.textSecondary, lineHeight: 1.8 }}>
                        {conflictResult.conflict_detail}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
