import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Space, message, Tag, Tabs, Card, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getContracts,
  createContract,
  updateContract,
  deleteContract,
  reviewContract,
  signContract,
  terminateContract,
  voidContract,
  correctContract,
  receiveOriginal,
  confirmAllocation,
} from '../api/contract'
import axios from '../api/axios'
import { formatDate, formatDateTime } from '../utils/format'

// 合同类型中文映射
const typeLabelMap: Record<string, string> = {
  entrust: '委托合同',
  consultant: '顾问合同',
  other: '其他',
}

// 合同类型 Tag 颜色
const typeColorMap: Record<string, string> = {
  entrust: 'blue',
  consultant: 'purple',
  other: 'default',
}

// 合同阶段中文映射
const stageLabelMap: Record<string, string> = {
  drafting: '起草中',
  reviewing: '审查中',
  signed: '已签订',
  performing: '履行中',
  completed: '已完成',
  terminated: '已解约',
  voided: '已作废',
}

// 合同阶段 Tag 颜色
const stageColorMap: Record<string, string> = {
  drafting: 'default',
  reviewing: 'processing',
  signed: 'success',
  performing: 'gold',
  completed: 'green',
  terminated: 'error',
  voided: 'warning',
}

// 状态中文映射
const statusLabelMap: Record<string, string> = {
  active: '有效',
  archived: '归档',
}

// 原件回收状态中文映射
const originalStatusLabelMap: Record<string, string> = {
  not_received: '待回收',
  received: '已回收',
  na: '无需',
}

// 原件回收状态 Tag 颜色
const originalStatusColorMap: Record<string, string> = {
  not_received: 'orange',
  received: 'green',
  na: 'default',
}

// 电子章/纸质章状态映射
const sealStatusLabelMap: Record<string, string> = {
  none: '未用',
  pending: '待盖章',
  used: '已盖章',
}

const sealStatusColorMap: Record<string, string> = {
  none: 'default',
  pending: 'processing',
  used: 'success',
}

// 用印状态映射
const sealUsageStatusLabelMap: Record<string, string> = {
  unused: '未用印',
  pending: '审批中',
  approved: '已批准',
  used: '已用印',
  voided: '已作废',
}

const sealUsageStatusColorMap: Record<string, string> = {
  unused: 'default',
  pending: 'processing',
  approved: 'blue',
  used: 'success',
  voided: 'warning',
}

// 合同审批状态映射
const approvalStatusLabelMap: Record<string, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已审批',
  rejected: '已驳回',
  archived: '已归档',
}

const approvalStatusColorMap: Record<string, string> = {
  draft: 'default',
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
  archived: 'default',
}

// 合同交回状态映射
const returnStatusLabelMap: Record<string, string> = {
  not_returned: '待交回',
  returned: '已交回',
  na: '无需',
}

const returnStatusColorMap: Record<string, string> = {
  not_returned: 'orange',
  returned: 'green',
  na: 'default',
}

// 申请用章方式映射
const sealApplyMethodLabelMap: Record<string, string> = {
  paper: '纸质章',
  electronic: '电子章',
  both: '双章',
}

// 主TAB：合同管理 / 合同交回
const mainTabs = [
  { key: 'contract', label: '合同管理' },
  { key: 'return', label: '合同交回' },
]

// 合同交回二级TAB
const returnStageTabs = [
  { key: '', label: '全部' },
  { key: 'not_returned', label: '待交回' },
  { key: 'returned', label: '已交回' },
  { key: 'na', label: '无需交回' },
]

// Tab 阶段分类
const stageTabs = [
  { key: '', label: '全部' },
  { key: 'drafting', label: '起草中' },
  { key: 'reviewing', label: '审查中' },
  { key: 'signed', label: '已签订' },
  { key: 'performing', label: '履行中' },
  { key: 'completed', label: '已完成' },
  { key: 'terminated', label: '已解约' },
  { key: 'voided', label: '已作废' },
]

// 类型下拉选项
const typeOptions = [
  { value: 'entrust', label: '委托合同' },
  { value: 'consultant', label: '顾问合同' },
  { value: 'other', label: '其他' },
]

// 阶段下拉选项
const stageOptions = stageTabs.filter(t => t.key).map(t => ({ value: t.key, label: t.label }))

// 状态下拉选项
const statusOptions = [
  { value: 'active', label: '有效' },
  { value: 'archived', label: '归档' },
]

// 原件回收状态下拉选项
const originalStatusOptions = [
  { value: 'not_received', label: '待回收' },
  { value: 'received', label: '已回收' },
  { value: 'na', label: '无需' },
]

// 电子章/纸质章状态下拉
const sealStatusOptions = [
  { value: 'none', label: '未用' },
  { value: 'pending', label: '待盖章' },
  { value: 'used', label: '已盖章' },
]

// 用印状态下拉
const sealUsageStatusOptions = [
  { value: 'unused', label: '未用印' },
  { value: 'pending', label: '审批中' },
  { value: 'approved', label: '已批准' },
  { value: 'used', label: '已用印' },
  { value: 'voided', label: '已作废' },
]

// 审批状态下拉
const approvalStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已审批' },
  { value: 'rejected', label: '已驳回' },
  { value: 'archived', label: '已归档' },
]

// 合同交回状态下拉
const returnStatusOptions = [
  { value: 'not_returned', label: '待交回' },
  { value: 'returned', label: '已交回' },
  { value: 'na', label: '无需' },
]

// 申请用章方式下拉
const sealApplyMethodOptions = [
  { value: 'paper', label: '纸质章' },
  { value: 'electronic', label: '电子章' },
  { value: 'both', label: '双章' },
]

export default function ContractManagement() {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingContract, setEditingContract] = useState<any>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentContract, setCurrentContract] = useState<any>(null)
  const [activeStage, setActiveStage] = useState('')
  const [activeMainTab, setActiveMainTab] = useState('contract')
  const [activeReturnTab, setActiveReturnTab] = useState('')
  const [searchForm] = Form.useForm()
  const [form] = Form.useForm()
  // 更正弹窗
  const [correctVisible, setCorrectVisible] = useState(false)
  const [correctContractId, setCorrectContractId] = useState<string | null>(null)
  const [correctForm] = Form.useForm()
  // 分配确认弹窗
  const [allocationVisible, setAllocationVisible] = useState(false)
  const [allocationContractId, setAllocationContractId] = useState<string | null>(null)
  const [allocationForm] = Form.useForm()
  // 合同交回弹窗
  const [returnVisible, setReturnVisible] = useState(false)
  const [returnContractId, setReturnContractId] = useState<string | null>(null)
  const [returnForm] = Form.useForm()
  // 合同审批弹窗
  const [approvalVisible, setApprovalVisible] = useState(false)
  const [approvalContractId, setApprovalContractId] = useState<string | null>(null)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'submit'>('submit')
  const [approvalForm] = Form.useForm()
  // 用印管理弹窗
  const [sealVisible, setSealVisible] = useState(false)
  const [sealContractId, setSealContractId] = useState<string | null>(null)
  const [sealForm] = Form.useForm()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 拉取合同列表
  const fetchData = async (stage = activeStage) => {
    setLoading(true)
    try {
      const values = searchForm.getFieldsValue()
      const params: any = { org_id: user.organization_id }
      if (values.type) params.type = values.type
      if (values.status) params.status = values.status
      if (values.keyword) params.keyword = values.keyword
      if (values.contract_type) params.contract_type = values.contract_type
      if (values.project_role) params.project_role = values.project_role
      if (values.lawyer_id) params.lawyer_id = values.lawyer_id
      if (values.electronic_seal_status) params.electronic_seal_status = values.electronic_seal_status
      if (values.paper_seal_status) params.paper_seal_status = values.paper_seal_status
      if (values.approval_status) params.approval_status = values.approval_status
      if (values.seal_usage_status) params.seal_usage_status = values.seal_usage_status
      if (values.start_date) params.start_date = values.start_date
      if (values.end_date) params.end_date = values.end_date
      // 主TAB切换：合同交回TAB使用return_status筛选
      if (activeMainTab === 'return') {
        params.return_status = activeReturnTab || (values.return_status ?? undefined)
      } else if (values.return_status) {
        params.return_status = values.return_status
      }
      if (stage) params.stage = stage
      const res: any = await getContracts(params)
      setData(res?.data || [])
      setTotal(res?.total || 0)
    } catch (error) {
      message.error('获取合同列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMainTab, activeReturnTab])

  // Tab 切换
  const handleTabChange = (key: string) => {
    setActiveStage(key)
    // 同步搜索表单中的阶段字段
    searchForm.setFieldValue('stage', key || undefined)
    fetchData(key)
  }

  // 合同交回二级TAB切换
  const handleReturnTabChange = (key: string) => {
    setActiveReturnTab(key)
    fetchData()
  }

  // 主TAB切换
  const handleMainTabChange = (key: string) => {
    setActiveMainTab(key)
    setActiveStage('')
    setActiveReturnTab('')
  }

  // 查询
  const handleSearch = () => {
    fetchData()
  }

  // 重置
  const handleReset = () => {
    searchForm.resetFields()
    setActiveStage('')
    setActiveReturnTab('')
    fetchData('')
  }

  // 打开合同交回弹窗
  const handleOpenReturn = (record: any) => {
    setReturnContractId(record.id)
    returnForm.resetFields()
    returnForm.setFieldsValue({
      return_time: dayjs(),
    })
    setReturnVisible(true)
  }

  // 提交合同交回
  const handleReturnSubmit = async (values: any) => {
    if (!returnContractId) return
    try {
      await axios.put(`/contracts/${returnContractId}/return`, {
        returner_id: user.user_id || user.id,
        return_time: values.return_time ? dayjs(values.return_time).format('YYYY-MM-DD HH:mm:ss') : undefined,
      })
      message.success('合同交回登记成功')
      setReturnVisible(false)
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '合同交回失败')
    }
  }

  // 撤销合同交回
  const handleUnreturn = (record: any) => {
    Modal.confirm({
      title: '撤销交回',
      content: '确认撤销该合同的交回登记？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await axios.put(`/contracts/${record.id}/unreturn`)
          message.success('已撤销合同交回')
          fetchData()
        } catch (e: any) {
          message.error(e?.response?.data?.message || '撤销失败')
        }
      },
    })
  }

  // 打开合同审批弹窗
  const handleOpenApproval = (record: any, action: 'submit' | 'approve' | 'reject') => {
    setApprovalContractId(record.id)
    setApprovalAction(action)
    approvalForm.resetFields()
    setApprovalVisible(true)
  }

  // 提交合同审批
  const handleApprovalSubmit = async (values: any) => {
    if (!approvalContractId) return
    try {
      if (approvalAction === 'submit') {
        await axios.put(`/contracts/${approvalContractId}/submit-approval`)
        message.success('已提交合同审批')
      } else if (approvalAction === 'approve') {
        await axios.put(`/contracts/${approvalContractId}/approve`, {
          approver_id: user.user_id || user.id,
          comment: values.comment,
        })
        message.success('合同审批通过')
      } else if (approvalAction === 'reject') {
        await axios.put(`/contracts/${approvalContractId}/reject`, {
          approver_id: user.user_id || user.id,
          comment: values.comment,
        })
        message.success('合同审批已驳回')
      }
      setApprovalVisible(false)
      fetchData()
    } catch (e: any) {
      message.error(e?.response?.data?.message || '审批操作失败')
    }
  }

  // 打开用印管理弹窗
  const handleOpenSeal = (record: any) => {
    setSealContractId(record.id)
    sealForm.resetFields()
    sealForm.setFieldsValue({
      seal_usage_status: record.seal_usage_status,
      seal_apply_method: record.seal_apply_method,
      electronic_seal_status: record.electronic_seal_status,
      paper_seal_status: record.paper_seal_status,
    })
    setSealVisible(true)
  }

  // 提交用印状态更新
  const handleSealSubmit = async (values: any) => {
    if (!sealContractId) return
    try {
      const tasks: Promise<any>[] = []
      // 更新电子章状态
      if (values.electronic_seal_status) {
        tasks.push(axios.put(`/contracts/${sealContractId}/update-electronic-seal`, {
          status: values.electronic_seal_status,
          operator_id: user.user_id || user.id,
        }))
      }
      // 更新纸质章状态
      if (values.paper_seal_status) {
        tasks.push(axios.put(`/contracts/${sealContractId}/update-paper-seal`, {
          status: values.paper_seal_status,
          operator_id: user.user_id || user.id,
        }))
      }
      // 更新整体用印状态
      if (values.seal_usage_status || values.seal_apply_method) {
        tasks.push(axios.put(`/contracts/${sealContractId}/update-seal-usage`, {
          status: values.seal_usage_status,
          seal_apply_method: values.seal_apply_method,
          operator_id: user.user_id || user.id,
        }))
      }
      await Promise.all(tasks)
      message.success('用印状态更新成功')
      setSealVisible(false)
      fetchData()
    } catch (e: any) {
      message.error(e?.response?.data?.message || '用印状态更新失败')
    }
  }

  // 新增
  const handleAdd = () => {
    setEditingContract(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑
  const handleEdit = (record: any) => {
    setEditingContract(record)
    form.setFieldsValue({
      ...record,
      sign_date: record.sign_date ? dayjs(record.sign_date) : undefined,
      start_date: record.start_date ? dayjs(record.start_date) : undefined,
      end_date: record.end_date ? dayjs(record.end_date) : undefined,
    })
    setModalVisible(true)
  }

  // 提交新增/编辑
  const handleSubmit = async (values: any) => {
    try {
      const payload: any = {
        title: values.title,
        type: values.type,
        case_id: values.case_id,
        client_name: values.client_name,
        client_phone: values.client_phone,
        amount: values.amount,
        sign_date: values.sign_date ? dayjs(values.sign_date).format('YYYY-MM-DD') : undefined,
        start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD') : undefined,
        remarks: values.remarks,
        organization_id: user.organization_id,
        // 新增字段
        opposing_party: values.opposing_party,
        allocation_ratio: values.allocation_ratio,
        quality_deposit: values.quality_deposit,
        original_status: values.original_status,
      }
      if (editingContract) {
        await updateContract(editingContract.id, payload)
        message.success('合同更新成功')
      } else {
        await createContract(payload)
        message.success('合同创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
    }
  }

  // 删除
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个合同吗？删除后无法恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteContract(id)
          message.success('删除成功')
          fetchData()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 查看详情
  const handleViewDetail = async (record: any) => {
    try {
      const detail: any = await axios.get(`/contracts/${record.id}`)
      setCurrentContract(detail)
    } catch (error) {
      setCurrentContract(record)
    }
    setDetailVisible(true)
  }

  // 审查
  const handleReview = (record: any) => {
    Modal.confirm({
      title: '合同审查',
      content: '确认将该合同提交审查？合同阶段将从"起草中"变更为"审查中"。',
      okText: '确认审查',
      cancelText: '取消',
      onOk: async () => {
        try {
          await reviewContract(record.id)
          message.success('已提交审查')
          fetchData()
        } catch (error) {
          message.error('审查操作失败')
        }
      },
    })
  }

  // 签订
  const handleSign = (record: any) => {
    Modal.confirm({
      title: '合同签订',
      content: '确认签订该合同？签订后合同阶段将变更为"已签订"。',
      okText: '确认签订',
      cancelText: '取消',
      onOk: async () => {
        try {
          await signContract(record.id)
          message.success('签订成功')
          fetchData()
        } catch (error) {
          message.error('签订操作失败')
        }
      },
    })
  }

  // 解约
  const handleTerminate = (record: any) => {
    Modal.confirm({
      title: '合同解约',
      content: '确认解除该合同？解约后合同将无法继续履行。',
      okText: '确认解约',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await terminateContract(record.id)
          message.success('已解约')
          fetchData()
        } catch (error) {
          message.error('解约操作失败')
        }
      },
    })
  }

  // 作废
  const handleVoid = (record: any) => {
    Modal.confirm({
      title: '合同作废',
      content: '确认作废该合同？作废后合同将视为无效。',
      okText: '确认作废',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await voidContract(record.id)
          message.success('已作废')
          fetchData()
        } catch (error) {
          message.error('作废操作失败')
        }
      },
    })
  }

  // 打开更正弹窗
  const handleOpenCorrect = (record: any) => {
    setCorrectContractId(record.id)
    correctForm.resetFields()
    setCorrectVisible(true)
  }

  // 提交更正
  const handleCorrectSubmit = async (values: any) => {
    if (!correctContractId) return
    try {
      await correctContract(correctContractId, {
        reason: values.reason,
        content: values.content,
        operator_id: user.user_id || user.id || '',
      })
      message.success('更正成功')
      setCorrectVisible(false)
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '更正失败')
    }
  }

  // 原件回收确认
  const handleReceiveOriginal = async (record: any) => {
    try {
      await receiveOriginal(record.id)
      message.success('原件回收登记成功')
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '原件回收登记失败')
    }
  }

  // 打开分配确认弹窗
  const handleOpenAllocation = (record: any) => {
    setAllocationContractId(record.id)
    allocationForm.resetFields()
    setAllocationVisible(true)
  }

  // 提交分配确认
  const handleAllocationSubmit = async (values: any) => {
    if (!allocationContractId) return
    let ratioArr: any[] = []
    try {
      ratioArr = JSON.parse(values.ratio)
      if (!Array.isArray(ratioArr)) {
        message.error('分配比例必须为JSON数组')
        return
      }
    } catch (e) {
      message.error('分配比例JSON格式错误')
      return
    }
    try {
      await confirmAllocation(allocationContractId, ratioArr)
      message.success('分配比例确认成功')
      setAllocationVisible(false)
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '分配比例确认失败')
    }
  }

  // 根据当前阶段渲染操作按钮
  const renderActions = (_: any, record: any) => {
    const stage = record.stage
    const isTerminal = ['completed', 'terminated', 'voided'].includes(stage)
    return (
      <Space size="small" wrap>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        {stage === 'drafting' && (
          <Button type="link" size="small" onClick={() => handleReview(record)}>审查</Button>
        )}
        {stage === 'reviewing' && (
          <Button type="link" size="small" onClick={() => handleSign(record)}>签订</Button>
        )}
        {(stage === 'signed' || stage === 'performing') && (
          <Button type="link" size="small" danger onClick={() => handleTerminate(record)}>解约</Button>
        )}
        {!isTerminal && (
          <Button type="link" size="small" danger onClick={() => handleVoid(record)}>作废</Button>
        )}
        {/* 更正：任意阶段可显示 */}
        <Button type="link" size="small" onClick={() => handleOpenCorrect(record)}>更正</Button>
        {/* 用印管理 */}
        <Button type="link" size="small" onClick={() => handleOpenSeal(record)}>用印</Button>
        {/* 合同审批 */}
        {(record.approval_status === 'draft' || !record.approval_status) && (
          <Button type="link" size="small" onClick={() => handleOpenApproval(record, 'submit')}>提交审批</Button>
        )}
        {record.approval_status === 'pending' && (
          <>
            <Button type="link" size="small" onClick={() => handleOpenApproval(record, 'approve')}>审批通过</Button>
            <Button type="link" size="small" onClick={() => handleOpenApproval(record, 'reject')}>审批驳回</Button>
          </>
        )}
        {/* 原件回收：original_status 为 not_received 时显示 */}
        {record.original_status === 'not_received' && (
          <Popconfirm
            title="原件回收登记"
            description="确认已收到该合同原件？"
            okText="确认"
            cancelText="取消"
            onConfirm={() => handleReceiveOriginal(record)}
          >
            <Button type="link" size="small">原件回收</Button>
          </Popconfirm>
        )}
        {/* 合同交回：待交回时显示交回，已交回时显示撤销交回 */}
        {record.return_status === 'not_returned' && (
          <Button type="link" size="small" onClick={() => handleOpenReturn(record)}>合同交回</Button>
        )}
        {record.return_status === 'returned' && (
          <Button type="link" size="small" onClick={() => handleUnreturn(record)}>撤销交回</Button>
        )}
        {/* 分配确认：allocation_ratio 为空时显示 */}
        {!record.allocation_ratio && (
          <Button type="link" size="small" onClick={() => handleOpenAllocation(record)}>分配确认</Button>
        )}
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
      </Space>
    )
  }

  const columns = [
    { title: '合同编号', dataIndex: 'contract_no', key: 'contract_no', width: 180 },
    { title: '合同标题', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color={typeColorMap[type] || 'default'}>{typeLabelMap[type] || type}</Tag>,
    },
    { title: '客户名称', dataIndex: 'client_name', key: 'client_name', width: 120 },
    { title: '客户电话', dataIndex: 'client_phone', key: 'client_phone', width: 130, render: (v: string) => v || '-' },
    { title: '对方当事人', dataIndex: 'opposing_party', key: 'opposing_party', width: 120, render: (v: string) => v || '-' },
    {
      title: '审批状态',
      dataIndex: 'approval_status',
      key: 'approval_status',
      width: 100,
      render: (s: string) => <Tag color={approvalStatusColorMap[s] || 'default'}>{approvalStatusLabelMap[s] || s || '草稿'}</Tag>,
    },
    {
      title: '用印方式',
      dataIndex: 'seal_apply_method',
      key: 'seal_apply_method',
      width: 100,
      render: (s: string) => s ? <Tag>{sealApplyMethodLabelMap[s] || s}</Tag> : '-',
    },
    {
      title: '用印状态',
      dataIndex: 'seal_usage_status',
      key: 'seal_usage_status',
      width: 100,
      render: (s: string) => <Tag color={sealUsageStatusColorMap[s] || 'default'}>{sealUsageStatusLabelMap[s] || s || '未用印'}</Tag>,
    },
    {
      title: '电子章',
      dataIndex: 'electronic_seal_status',
      key: 'electronic_seal_status',
      width: 90,
      render: (s: string) => <Tag color={sealStatusColorMap[s] || 'default'}>{sealStatusLabelMap[s] || s || '未用'}</Tag>,
    },
    {
      title: '纸质章',
      dataIndex: 'paper_seal_status',
      key: 'paper_seal_status',
      width: 90,
      render: (s: string) => <Tag color={sealStatusColorMap[s] || 'default'}>{sealStatusLabelMap[s] || s || '未用'}</Tag>,
    },
    {
      title: '原件状态',
      dataIndex: 'original_status',
      key: 'original_status',
      width: 100,
      render: (status: string) => <Tag color={originalStatusColorMap[status] || 'default'}>{originalStatusLabelMap[status] || status || '-'}</Tag>,
    },
    {
      title: '合同交回',
      dataIndex: 'return_status',
      key: 'return_status',
      width: 100,
      render: (status: string) => <Tag color={returnStatusColorMap[status] || 'default'}>{returnStatusLabelMap[status] || status || '-'}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (val: any) => val != null ? `¥${Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-',
    },
    { title: '签订日期', dataIndex: 'sign_date', key: 'sign_date', width: 120, render: (v: string) => formatDate(v) },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 100,
      render: (stage: string) => <Tag color={stageColorMap[stage] || 'default'}>{stageLabelMap[stage] || stage}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => <Tag color={status === 'active' ? 'green' : 'default'}>{statusLabelMap[status] || status}</Tag>,
    },
    { title: '操作', key: 'action', width: 720, render: renderActions },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>合同管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增合同</Button>
      </div>

      {/* 主TAB：合同管理 / 合同交回 */}
      <Card styles={{ body: { padding: 0 } }} style={{ marginBottom: 0 }}>
        <Tabs
          activeKey={activeMainTab}
          onChange={handleMainTabChange}
          items={mainTabs.map(t => ({ key: t.key, label: t.label }))}
          style={{ padding: '0 16px', borderBottom: '1px solid #eef0f3' }}
        />
      </Card>

      <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
        <Form form={searchForm} layout="inline" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Form.Item name="type" label="类型">
            <Select placeholder="全部类型" allowClear style={{ width: 140 }} options={typeOptions} />
          </Form.Item>
          <Form.Item name="stage" label="阶段">
            <Select
              placeholder="全部阶段"
              allowClear
              style={{ width: 140 }}
              options={stageOptions}
              onChange={(value) => {
                setActiveStage(value || '')
                fetchData(value || '')
              }}
            />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" allowClear style={{ width: 120 }} options={statusOptions} />
          </Form.Item>
          <Form.Item name="approval_status" label="审批状态">
            <Select placeholder="全部审批状态" allowClear style={{ width: 140 }} options={approvalStatusOptions} />
          </Form.Item>
          <Form.Item name="return_status" label="交回状态">
            <Select placeholder="全部交回状态" allowClear style={{ width: 140 }} options={returnStatusOptions} />
          </Form.Item>
          <Form.Item name="seal_usage_status" label="用印状态">
            <Select placeholder="全部用印状态" allowClear style={{ width: 140 }} options={sealUsageStatusOptions} />
          </Form.Item>
          <Form.Item name="electronic_seal_status" label="电子章">
            <Select placeholder="全部电子章" allowClear style={{ width: 130 }} options={sealStatusOptions} />
          </Form.Item>
          <Form.Item name="paper_seal_status" label="纸质章">
            <Select placeholder="全部纸质章" allowClear style={{ width: 130 }} options={sealStatusOptions} />
          </Form.Item>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="编号/标题/客户" allowClear style={{ width: 200 }} onPressEnter={handleSearch} />
          </Form.Item>
          <Form.Item name="start_date" label="开始日期">
            <DatePicker placeholder="起始日期" allowClear style={{ width: 160 }} onChange={() => { /* 手动点查询触发 */ }} />
          </Form.Item>
          <Form.Item name="end_date" label="结束日期">
            <DatePicker placeholder="截止日期" allowClear style={{ width: 160 }} onChange={() => {}} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Card styles={{ body: { padding: 0 } }}>
        {/* 合同管理TAB显示阶段TAB；合同交回TAB显示交回状态TAB */}
        <Tabs
          activeKey={activeMainTab === 'return' ? activeReturnTab : activeStage}
          onChange={(key) => {
            if (activeMainTab === 'return') {
              handleReturnTabChange(key)
            } else {
              handleTabChange(key)
            }
          }}
          items={
            (activeMainTab === 'return' ? returnStageTabs : stageTabs).map(t => ({ key: t.key, label: t.label }))
          }
          style={{ padding: '0 16px' }}
        />
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 2600 }}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条`, total }}
        />
      </Card>

      <Modal
        title={editingContract ? '编辑合同' : '新增合同'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={680}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item label="合同编号">
            <Input placeholder="保存后由系统自动生成" disabled />
          </Form.Item>
          <Form.Item name="title" label="合同标题" rules={[{ required: true, message: '请输入合同标题' }]}>
            <Input placeholder="请输入合同标题" />
          </Form.Item>
          <Form.Item name="type" label="合同类型" rules={[{ required: true, message: '请选择合同类型' }]} initialValue="entrust">
            <Select options={typeOptions} placeholder="请选择合同类型" />
          </Form.Item>
          <Form.Item name="case_id" label="关联案件">
            <Input placeholder="请输入关联案件ID（可空）" />
          </Form.Item>
          <Form.Item name="client_name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item name="client_phone" label="客户电话">
            <Input placeholder="请输入客户电话（可空）" />
          </Form.Item>
          <Form.Item name="amount" label="合同金额">
            <InputNumber placeholder="请输入合同金额" style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          <Form.Item name="sign_date" label="签订日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="start_date" label="开始日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_date" label="结束日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          {/* 对方当事人 */}
          <Form.Item name="opposing_party" label="对方当事人">
            <Input placeholder="请输入对方当事人（可空）" />
          </Form.Item>
          {/* 分配比例 */}
          <Form.Item name="allocation_ratio" label="分配比例" tooltip="JSON格式，如 [{&quot;role&quot;:&quot;律师&quot;,&quot;ratio&quot;:0.7}]">
            <Input.TextArea rows={3} placeholder='请输入JSON格式，如 [{"role":"律师","ratio":0.7}]' />
          </Form.Item>
          {/* 质保金 */}
          <Form.Item name="quality_deposit" label="质保金（元）">
            <InputNumber placeholder="请输入质保金" style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          {/* 原件状态 */}
          <Form.Item name="original_status" label="原件状态" initialValue="not_received">
            <Select options={originalStatusOptions} placeholder="请选择原件状态" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注（可空）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="合同详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={780}
      >
        {currentContract && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 13 }}>
              <div><span style={{ color: '#717785' }}>合同编号：</span>{currentContract.contract_no}</div>
              <div><span style={{ color: '#717785' }}>合同标题：</span>{currentContract.title}</div>
              <div><span style={{ color: '#717785' }}>类型：</span><Tag color={typeColorMap[currentContract.type]}>{typeLabelMap[currentContract.type]}</Tag></div>
              <div><span style={{ color: '#717785' }}>阶段：</span><Tag color={stageColorMap[currentContract.stage]}>{stageLabelMap[currentContract.stage]}</Tag></div>
              <div><span style={{ color: '#717785' }}>客户名称：</span>{currentContract.client_name}</div>
              <div><span style={{ color: '#717785' }}>客户电话：</span>{currentContract.client_phone || '-'}</div>
              <div><span style={{ color: '#717785' }}>合同金额：</span>¥{Number(currentContract.amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div><span style={{ color: '#717785' }}>关联案件：</span>{currentContract.case_id || '-'}</div>
              <div><span style={{ color: '#717785' }}>签订日期：</span>{formatDate(currentContract.sign_date)}</div>
              <div><span style={{ color: '#717785' }}>开始日期：</span>{formatDate(currentContract.start_date)}</div>
              <div><span style={{ color: '#717785' }}>结束日期：</span>{formatDate(currentContract.end_date)}</div>
              <div><span style={{ color: '#717785' }}>状态：</span><Tag color={currentContract.status === 'active' ? 'green' : 'default'}>{statusLabelMap[currentContract.status]}</Tag></div>
              <div><span style={{ color: '#717785' }}>审批状态：</span><Tag color={approvalStatusColorMap[currentContract.approval_status] || 'default'}>{approvalStatusLabelMap[currentContract.approval_status] || '草稿'}</Tag></div>
              <div><span style={{ color: '#717785' }}>用印方式：</span>{currentContract.seal_apply_method ? (sealApplyMethodLabelMap[currentContract.seal_apply_method] || currentContract.seal_apply_method) : '-'}</div>
              <div><span style={{ color: '#717785' }}>用印状态：</span><Tag color={sealUsageStatusColorMap[currentContract.seal_usage_status] || 'default'}>{sealUsageStatusLabelMap[currentContract.seal_usage_status] || '未用印'}</Tag></div>
              <div><span style={{ color: '#717785' }}>电子章状态：</span><Tag color={sealStatusColorMap[currentContract.electronic_seal_status] || 'default'}>{sealStatusLabelMap[currentContract.electronic_seal_status] || '未用'}</Tag></div>
              <div><span style={{ color: '#717785' }}>纸质章状态：</span><Tag color={sealStatusColorMap[currentContract.paper_seal_status] || 'default'}>{sealStatusLabelMap[currentContract.paper_seal_status] || '未用'}</Tag></div>
              <div><span style={{ color: '#717785' }}>原件状态：</span><Tag color={originalStatusColorMap[currentContract.original_status] || 'default'}>{originalStatusLabelMap[currentContract.original_status] || '-'}</Tag></div>
              <div><span style={{ color: '#717785' }}>合同交回：</span><Tag color={returnStatusColorMap[currentContract.return_status] || 'default'}>{returnStatusLabelMap[currentContract.return_status] || '-'}</Tag></div>
              <div><span style={{ color: '#717785' }}>对方当事人：</span>{currentContract.opposing_party || '-'}</div>
              <div><span style={{ color: '#717785' }}>质保金：</span>{currentContract.quality_deposit != null ? `¥${Number(currentContract.quality_deposit).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</div>
              <div><span style={{ color: '#717785' }}>创建时间：</span>{formatDateTime(currentContract.created_at)}</div>
              <div><span style={{ color: '#717785' }}>更新时间：</span>{formatDateTime(currentContract.updated_at)}</div>
              {currentContract.returner_id && <div><span style={{ color: '#717785' }}>交回人ID：</span>{currentContract.returner_id}</div>}
              {currentContract.return_time && <div><span style={{ color: '#717785' }}>交回时间：</span>{formatDateTime(currentContract.return_time)}</div>}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>备注</div>
              <div style={{ background: '#f3f3f5', padding: 12, borderRadius: 8, color: '#414753', lineHeight: 1.7 }}>
                {currentContract.remarks || '-'}
              </div>
            </div>
            {currentContract.stages && currentContract.stages.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>阶段历史</div>
                <div style={{ background: '#f3f3f5', padding: 12, borderRadius: 8 }}>
                  {currentContract.stages.map((s: any) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e2e4', fontSize: 13 }}>
                      <span><Tag color={stageColorMap[s.stage_name] || 'default'}>{stageLabelMap[s.stage_name] || s.stage_name}</Tag>{s.remarks || ''}</span>
                      <span style={{ color: '#717785' }}>{formatDateTime(s.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 合同交回弹窗 */}
      <Modal
        title="合同交回登记"
        open={returnVisible}
        onCancel={() => setReturnVisible(false)}
        onOk={() => returnForm.submit()}
        width={520}
        okText="确认交回"
        cancelText="取消"
      >
        <Form form={returnForm} layout="vertical" onFinish={handleReturnSubmit}>
          <Form.Item name="return_time" label="交回时间" rules={[{ required: true, message: '请选择交回时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} placeholder="请选择交回时间" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 合同审批弹窗 */}
      <Modal
        title={approvalAction === 'submit' ? '提交合同审批' : approvalAction === 'approve' ? '合同审批通过' : '合同审批驳回'}
        open={approvalVisible}
        onCancel={() => setApprovalVisible(false)}
        onOk={() => approvalForm.submit()}
        width={520}
        okText="确认"
        cancelText="取消"
      >
        <Form form={approvalForm} layout="vertical" onFinish={handleApprovalSubmit}>
          {approvalAction !== 'submit' && (
            <Form.Item name="comment" label="审批意见">
              <Input.TextArea rows={4} placeholder={approvalAction === 'approve' ? '请输入通过意见（可空）' : '请输入驳回理由'} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 用印管理弹窗 */}
      <Modal
        title="合同用印管理"
        open={sealVisible}
        onCancel={() => setSealVisible(false)}
        onOk={() => sealForm.submit()}
        width={560}
        okText="保存"
        cancelText="取消"
      >
        <Form form={sealForm} layout="vertical" onFinish={handleSealSubmit}>
          <Form.Item name="seal_apply_method" label="申请用章方式" initialValue="paper">
            <Select options={sealApplyMethodOptions} placeholder="请选择用章方式" />
          </Form.Item>
          <Form.Item name="seal_usage_status" label="用印状态" initialValue="unused">
            <Select options={sealUsageStatusOptions} placeholder="请选择用印状态" />
          </Form.Item>
          <Form.Item name="electronic_seal_status" label="电子章状态" initialValue="none">
            <Select options={sealStatusOptions} placeholder="请选择电子章状态" />
          </Form.Item>
          <Form.Item name="paper_seal_status" label="纸质章状态" initialValue="none">
            <Select options={sealStatusOptions} placeholder="请选择纸质章状态" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 合同更正弹窗 */}
      <Modal
        title="合同更正"
        open={correctVisible}
        onCancel={() => setCorrectVisible(false)}
        onOk={() => correctForm.submit()}
        width={560}
        okText="确认更正"
        cancelText="取消"
      >
        <Form form={correctForm} onFinish={handleCorrectSubmit} layout="vertical">
          <Form.Item name="reason" label="更正原因" rules={[{ required: true, message: '请输入更正原因' }]}>
            <Input placeholder="请输入更正原因" />
          </Form.Item>
          <Form.Item name="content" label="更正内容" rules={[{ required: true, message: '请输入更正内容' }]}>
            <Input.TextArea rows={4} placeholder="请输入更正内容" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 分配比例确认弹窗 */}
      <Modal
        title="分配比例确认"
        open={allocationVisible}
        onCancel={() => setAllocationVisible(false)}
        onOk={() => allocationForm.submit()}
        width={560}
        okText="确认"
        cancelText="取消"
      >
        <Form form={allocationForm} onFinish={handleAllocationSubmit} layout="vertical">
          <Form.Item
            name="ratio"
            label="分配比例"
            rules={[{ required: true, message: '请输入分配比例' }]}
            tooltip="JSON格式数组，如 [{&quot;role&quot;:&quot;律师&quot;,&quot;ratio&quot;:0.7}]"
          >
            <Input.TextArea rows={4} placeholder='请输入JSON格式，如 [{"role":"律师","ratio":0.7}]' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
