import { useState, useEffect, useMemo } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Tabs, InputNumber, Popconfirm, Switch } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import {
  getSeals,
  createSeal,
  updateSeal,
  toggleSealStatus,
  deleteSeal,
  getSealApplications,
  createSealApplication,
  approveSealApplication,
  rejectSealApplication,
  useSealApplication,
  batchUseSealApplications,
  batchVoidSealApplications,
  getSealRecords,
} from '../api/seal'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'

// 印章类型中文映射
const sealTypeLabelMap: Record<string, string> = {
  official: '公章',
  financial: '财务章',
  contract: '合同章',
  personal: '法人章',
}

// 印章类型 Tag 颜色映射
const sealTypeColorMap: Record<string, string> = {
  official: 'red',
  financial: 'gold',
  contract: 'blue',
  personal: 'purple',
}

// 印章类型 Stitch 变体映射
const sealTypeStitchMap: Record<string, string> = {
  official: 'stitch-tag stitch-tag-error',
  financial: 'stitch-tag stitch-tag-gold',
  contract: 'stitch-tag stitch-tag-info',
  personal: 'stitch-tag stitch-tag-primary',
}

// 印章状态中文映射
const sealStatusLabelMap: Record<string, string> = {
  active: '启用',
  inactive: '停用',
}

// 用印申请状态中文映射（含voided）
const applicationStatusLabelMap: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  used: '已盖章',
  voided: '已作废',
}

// 用印申请状态 Tag 颜色映射
const applicationStatusColorMap: Record<string, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  used: 'blue',
  voided: 'warning',
}

// 用印申请状态 Stitch 变体映射
const applicationStatusStitchMap: Record<string, string> = {
  pending: 'stitch-tag stitch-tag-warning',
  approved: 'stitch-tag stitch-tag-success',
  rejected: 'stitch-tag stitch-tag-error',
  used: 'stitch-tag stitch-tag-info',
  voided: 'stitch-tag stitch-tag-warning',
}

// 盖章类型中文映射：normal普通 / watermark水印 / paging骑缝
const sealTypeApplyLabelMap: Record<string, string> = {
  normal: '普通',
  watermark: '水印',
  paging: '骑缝',
}

// 用印介质：纸质/电子
const sealMediumLabelMap: Record<string, string> = {
  paper: '纸质',
  electronic: '电子',
}
const sealMediumColorMap: Record<string, string> = {
  paper: 'orange',
  electronic: 'blue',
}

// 用印介质 Stitch 变体映射
const sealMediumStitchMap: Record<string, string> = {
  paper: 'stitch-tag stitch-tag-warning',
  electronic: 'stitch-tag stitch-tag-info',
}

// 文书类别：所函/出庭函/律所证明/律师函/其他
const documentCategoryLabelMap: Record<string, string> = {
  office_letter: '所函',
  appearance_letter: '出庭函',
  firm_cert: '律所证明',
  lawyer_letter: '律师函',
  other: '其他',
}

// 作废状态：not_voided未作废/voided已作废/recovered已收回
const voidStatusLabelMap: Record<string, string> = {
  not_voided: '未作废',
  voided: '已作废',
  recovered: '已收回',
}
const voidStatusColorMap: Record<string, string> = {
  not_voided: 'default',
  voided: 'warning',
  recovered: 'success',
}

// 作废状态 Stitch 变体映射
const voidStatusStitchMap: Record<string, string> = {
  not_voided: 'stitch-tag stitch-tag-primary',
  voided: 'stitch-tag stitch-tag-warning',
  recovered: 'stitch-tag stitch-tag-success',
}

// 颜色映射保留作为参考，实际渲染已使用 Stitch 变体映射
void [sealTypeColorMap, applicationStatusColorMap, sealMediumColorMap, voidStatusColorMap]

export default function SealManagement() {
  const [activeTab, setActiveTab] = useState('pending')

  // 印章数据
  const [seals, setSeals] = useState<Record<string, unknown>[]>([])
  const [sealLoading, setSealLoading] = useState(false)
  const [sealModalVisible, setSealModalVisible] = useState(false)
  const [editingSeal, setEditingSeal] = useState<Record<string, unknown> | null>(null)
  const [sealForm] = Form.useForm()
  const [sealSearchForm] = Form.useForm()
  const [sealKeyword, setSealKeyword] = useState('')
  const [sealStatusFilter, setSealStatusFilter] = useState<string | undefined>(undefined)

  // 用印申请数据（3个TAB共用，区分筛选条件）
  const [applications, setApplications] = useState<Record<string, unknown>[]>([])
  const [appTotal, setAppTotal] = useState(0)
  const [appLoading, setAppLoading] = useState(false)
  const [appModalVisible, setAppModalVisible] = useState(false)
  const [appForm] = Form.useForm()
  const [appSearchForm] = Form.useForm()
  const [appKeyword, setAppKeyword] = useState('')
  const [appMediumFilter, setAppMediumFilter] = useState<string | undefined>(undefined)
  const [appDocCategoryFilter, setAppDocCategoryFilter] = useState<string | undefined>(undefined)
  const [approveModalVisible, setApproveModalVisible] = useState(false)
  const [approveTarget, setApproveTarget] = useState<Record<string, unknown> | null>(null)
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve')
  const [approveForm] = Form.useForm()
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([])
  const [appPage, setAppPage] = useState(1)

  // 盖章记录数据
  const [records, setRecords] = useState<Record<string, unknown>[]>([])
  const [recordTotal, setRecordTotal] = useState(0)
  const [recordLoading, setRecordLoading] = useState(false)
  const [recordSearchForm] = Form.useForm()
  const [recordKeyword, setRecordKeyword] = useState('')
  const [recordMediumFilter, setRecordMediumFilter] = useState<string | undefined>(undefined)
  const [recordPage, setRecordPage] = useState(1)

  // 作废收回数据
  const [voidList, setVoidList] = useState<Record<string, unknown>[]>([])
  const [voidTotal, setVoidTotal] = useState(0)
  const [voidLoading, setVoidLoading] = useState(false)
  const [voidSearchForm] = Form.useForm()
  const [voidKeyword, setVoidKeyword] = useState('')
  const [voidStatusFilter, setVoidStatusFilter] = useState<string | undefined>(undefined)
  const [voidPage, setVoidPage] = useState(1)

  // 单个作废原因弹窗
  const [singleVoidVisible, setSingleVoidVisible] = useState(false)
  const [singleVoidTarget, setSingleVoidTarget] = useState<Record<string, unknown> | null>(null)
  const [singleVoidForm] = Form.useForm()

  // 印章ID到印章对象的映射，用于用印申请和盖章记录展示印章名称
  const sealMap = useMemo(() => {
    const map: Record<string, Record<string, unknown>> = {}
    seals.forEach((s) => {
      map[s.id as string] = s
    })
    return map
  }, [seals])

  // 获取印章列表
  const fetchSeals = async () => {
    setSealLoading(true)
    try {
      const res = await getSeals()
      setSeals((res as Record<string, unknown>[]) || [])
    } catch (error) {
      message.error('获取印章列表失败')
    } finally {
      setSealLoading(false)
    }
  }

  // 获取用印申请列表（按TAB传递不同status/void_status筛选）
  const fetchApplications = async (page = appPage) => {
    setAppLoading(true)
    try {
      const params: Record<string, unknown> = {
        page,
        limit: 20,
      }
      // 待用印文档：仅展示待审批或已批准（未作废）
      if (activeTab === 'pending') {
        params.status = ['pending', 'approved'].includes(appSearchForm.getFieldsValue().status)
          ? appSearchForm.getFieldsValue().status
          : undefined
        params.void_status = 'not_voided'
      }
      if (appKeyword) params.keyword = appKeyword
      if (appMediumFilter) params.seal_medium = appMediumFilter
      if (appDocCategoryFilter) params.document_category = appDocCategoryFilter
      const s = appSearchForm.getFieldsValue().status
      if (s) params.status = s
      const res = (await getSealApplications(params)) as Record<string, unknown>
      const list = (res?.data || res || []) as Record<string, unknown>[]
      setApplications(list)
      setAppTotal((res?.total as number) ?? list.length)
    } catch (error) {
      message.error('获取用印申请列表失败')
    } finally {
      setAppLoading(false)
    }
  }

  // 获取盖章记录（纸质用印记录，默认只看paper介质）
  const fetchRecords = async (page = recordPage) => {
    setRecordLoading(true)
    try {
      const params: Record<string, unknown> = {
        page,
        limit: 20,
      }
      // 默认按纸质用印筛选
      params.seal_medium = recordMediumFilter || 'paper'
      if (recordKeyword) params.keyword = recordKeyword
      const res = (await getSealRecords(params)) as Record<string, unknown>
      const list = (res?.data || res || []) as Record<string, unknown>[]
      setRecords(list)
      setRecordTotal((res?.total as number) ?? list.length)
    } catch (error) {
      message.error('获取盖章记录列表失败')
    } finally {
      setRecordLoading(false)
    }
  }

  // 获取作废收回记录
  const fetchVoidRecords = async (page = voidPage) => {
    setVoidLoading(true)
    try {
      const params: Record<string, unknown> = {
        page,
        limit: 20,
        void_status: voidStatusFilter || undefined,
      }
      if (voidKeyword) params.keyword = voidKeyword
      // 仅返回有作废痕迹的记录：void_status != not_voided
      params.void_status = voidStatusFilter || 'voided'
      const res = (await getSealApplications(params)) as Record<string, unknown>
      const list = (res?.data || res || []) as Record<string, unknown>[]
      // 如果无过滤器，同时包含 recovered
      if (!voidStatusFilter) {
        params.void_status = 'recovered'
        const res2 = (await getSealApplications(params)) as Record<string, unknown>
        const list2 = (res2?.data || []) as Record<string, unknown>[]
        const merged = [...list, ...list2].filter((x, idx, arr) => arr.findIndex((y) => y.id === x.id) === idx)
        setVoidList(merged)
        setVoidTotal(((res?.total as number) ?? 0) + ((res2?.total as number) ?? 0))
      } else {
        setVoidList(list)
        setVoidTotal((res?.total as number) ?? list.length)
      }
    } catch (error) {
      message.error('获取作废收回记录失败')
    } finally {
      setVoidLoading(false)
    }
  }

  // 切换Tab时加载对应数据
  useEffect(() => {
    if (activeTab === 'seals') {
      fetchSeals()
    } else if (activeTab === 'pending') {
      fetchSeals()
      fetchApplications()
    } else if (activeTab === 'records') {
      fetchSeals()
      fetchRecords()
    } else if (activeTab === 'void') {
      fetchSeals()
      fetchVoidRecords()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // ===================== 印章管理操作 =====================

  const handleAddSeal = () => {
    setEditingSeal(null)
    sealForm.resetFields()
    setSealModalVisible(true)
  }

  const handleEditSeal = (record: Record<string, unknown>) => {
    setEditingSeal(record)
    sealForm.setFieldsValue(record)
    setSealModalVisible(true)
  }

  const handleSealSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editingSeal) {
        await updateSeal(editingSeal.id as string, values)
        message.success('印章更新成功')
      } else {
        await createSeal(values)
        message.success('印章创建成功')
      }
      setSealModalVisible(false)
      fetchSeals()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
    }
  }

  const handleDeleteSeal = async (id: string) => {
    try {
      await deleteSeal(id)
      message.success('删除成功')
      fetchSeals()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleToggleSealStatus = async (id: string) => {
    try {
      await toggleSealStatus(id)
      fetchSeals()
    } catch (error) {
      message.error('操作失败')
    }
  }

  // ===================== 用印申请操作 =====================

  const handleAddApplication = () => {
    appForm.resetFields()
    appForm.setFieldsValue({ usage_count: 1, seal_medium: 'paper', document_category: 'other' })
    setAppModalVisible(true)
  }

  const handleApplicationSubmit = async (values: Record<string, unknown>) => {
    try {
      await createSealApplication(values)
      message.success('用印申请提交成功')
      setAppModalVisible(false)
      fetchApplications()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
    }
  }

  // 打开审批弹窗
  const openApproveModal = (record: Record<string, unknown>, action: 'approve' | 'reject') => {
    setApproveTarget(record)
    setApproveAction(action)
    approveForm.resetFields()
    setApproveModalVisible(true)
  }

  // 确认审批
  const handleApproveSubmit = async (values: Record<string, unknown>) => {
    if (!approveTarget) return
    try {
      if (approveAction === 'approve') {
        await approveSealApplication(approveTarget.id as string, { approve_comment: values.approve_comment })
        message.success('已同意该用印申请')
      } else {
        await rejectSealApplication(approveTarget.id as string, { approve_comment: values.approve_comment })
        message.success('已驳回该用印申请')
      }
      setApproveModalVisible(false)
      fetchApplications()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败')
    }
  }

  // 盖章操作
  const handleUseSeal = async (id: string) => {
    try {
      await useSealApplication(id)
      message.success('盖章成功')
      fetchApplications()
      fetchRecords()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '盖章失败')
    }
  }

  // 批量盖章
  const handleBatchUseSeal = async () => {
    if (selectedAppIds.length === 0) {
      message.warning('请选择需要盖章的申请')
      return
    }
    const approvedIds = applications
      .filter((a) => selectedAppIds.includes(a.id as string) && a.status === 'approved')
      .map((a) => a.id as string)
    if (approvedIds.length === 0) {
      message.warning('所选申请中没有可盖章的记录（仅已通过状态可盖章）')
      return
    }
    try {
      await batchUseSealApplications(approvedIds)
      message.success('批量盖章成功')
      setSelectedAppIds([])
      fetchApplications()
      fetchRecords()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '批量盖章失败')
    }
  }

  // 打开单个作废弹窗
  const openSingleVoidModal = (record: Record<string, unknown>) => {
    setSingleVoidTarget(record)
    singleVoidForm.resetFields()
    setSingleVoidVisible(true)
  }

  // 提交单个作废
  const handleSingleVoidSubmit = async (values: Record<string, unknown>) => {
    if (!singleVoidTarget) return
    try {
      await axios.put(`/seal-applications/${singleVoidTarget.id}/void`, {
        reason: values.reason,
      })
      message.success('已作废该用印申请')
      setSingleVoidVisible(false)
      setSingleVoidTarget(null)
      fetchApplications()
      fetchVoidRecords()
    } catch (e: any) {
      message.error(e?.response?.data?.message || '作废失败')
    }
  }

  // 批量作废
  const handleBatchVoid = async () => {
    if (selectedAppIds.length === 0) {
      message.warning('请选择需要作废的申请')
      return
    }
    try {
      const res: unknown = await batchVoidSealApplications(selectedAppIds)
      const affected = typeof res === 'number' ? res : (res as Record<string, unknown>)?.affected ?? 0
      message.success(`批量作废成功，共作废 ${affected} 条`)
      setSelectedAppIds([])
      fetchApplications()
      fetchVoidRecords()
    } catch (error: unknown) {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '批量作废失败')
    }
  }

  // 收回作废文档
  const handleRecover = async (id: string) => {
    try {
      await axios.put(`/seal-applications/${id}/recover`)
      message.success('已收回作废文档')
      fetchVoidRecords()
    } catch (e: any) {
      message.error(e?.response?.data?.message || '收回失败')
    }
  }

  // ===================== 查询过滤 =====================

  // 印章列表前端过滤
  const filteredSeals = useMemo(() => {
    let result = [...seals]
    if (sealKeyword) {
      const kw = sealKeyword.toLowerCase()
      result = result.filter(
        (s) => (s.name as string)?.toLowerCase().includes(kw) || sealTypeLabelMap[s.type as string]?.includes(sealKeyword),
      )
    }
    if (sealStatusFilter) {
      result = result.filter((s) => s.status === sealStatusFilter)
    }
    return result
  }, [seals, sealKeyword, sealStatusFilter])

  // ===================== 表格列定义 =====================

  // 印章列表列
  const sealColumns = [
    { title: '印章名称', dataIndex: 'name', key: 'name' },
    {
      title: '印章类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag className={sealTypeStitchMap[type] || 'stitch-tag stitch-tag-primary'}>{sealTypeLabelMap[type] || type}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Record<string, unknown>) => (
        <Space>
          <Tag className={status === 'active' ? 'stitch-tag stitch-tag-success' : 'stitch-tag stitch-tag-primary'}>
            {sealStatusLabelMap[status] || status}
          </Tag>
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleSealStatus(record.id as string)}
          >
            {status === 'active' ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
    {
      title: '管理人',
      dataIndex: 'manager_id',
      key: 'manager_id',
      render: (text: string) => text || '-',
    },
    {
      title: '印章特性',
      key: 'features',
      render: (_: unknown, record: Record<string, unknown>) => {
        const tags: { label: string; color: string; stitch: string; show: boolean }[] = [
          { label: '电子', color: 'blue', stitch: 'stitch-tag stitch-tag-info', show: !!record.is_electronic },
          { label: '水印', color: 'cyan', stitch: 'stitch-tag stitch-tag-info', show: !!record.support_watermark },
          { label: '骑缝', color: 'geekblue', stitch: 'stitch-tag stitch-tag-primary', show: !!record.support_paging_seal },
        ]
        const visibleTags = tags.filter((t) => t.show)
        return visibleTags.length > 0 ? (
          <Space size={4} wrap>
            {visibleTags.map((t) => (
              <Tag key={t.label} className={t.stitch}>
                {t.label}
              </Tag>
            ))}
          </Space>
        ) : (
          <span style={{ color: theme.textTertiary }}>-</span>
        )
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => formatDateTime(text),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditSeal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个印章吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDeleteSeal(record.id as string)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 用印申请列表列
  const applicationColumns = [
    {
      title: '文件名称',
      dataIndex: 'document_name',
      key: 'document_name',
      ellipsis: true,
    },
    {
      title: '文书类别',
      dataIndex: 'document_category',
      key: 'document_category',
      width: 110,
      render: (v: string) => v ? (documentCategoryLabelMap[v] || v) : '-',
    },
    {
      title: '用印用途',
      dataIndex: 'purpose',
      key: 'purpose',
      ellipsis: true,
    },
    {
      title: '印章',
      dataIndex: 'seal_id',
      key: 'seal_id',
      render: (sealId: string) => {
        const seal = sealMap[sealId]
        return seal ? (
          <Tag className={sealTypeStitchMap[seal.type as string] || 'stitch-tag stitch-tag-primary'}>
            {seal.name as React.ReactNode}（{sealTypeLabelMap[seal.type as string] || seal.type as string}）
          </Tag>
        ) : (
          '-'
        )
      },
    },
    {
      title: '用印介质',
      dataIndex: 'seal_medium',
      key: 'seal_medium',
      width: 90,
      render: (v: string) => <Tag className={sealMediumStitchMap[v] || 'stitch-tag stitch-tag-primary'}>{sealMediumLabelMap[v] || v || '纸质'}</Tag>,
    },
    {
      title: '用印次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      width: 90,
    },
    {
      title: '涉密',
      dataIndex: 'is_confidential',
      key: 'is_confidential',
      width: 80,
      render: (val: boolean) =>
        val ? <Tag className="stitch-tag stitch-tag-error">是</Tag> : <Tag className="stitch-tag stitch-tag-primary">否</Tag>,
    },
    {
      title: '盖章类型',
      dataIndex: 'seal_type',
      key: 'seal_type',
      width: 100,
      render: (val: string) => sealTypeApplyLabelMap[val] || val || '普通',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag className={applicationStatusStitchMap[status] || 'stitch-tag stitch-tag-primary'}>
          {applicationStatusLabelMap[status] || status}
        </Tag>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'apply_time',
      key: 'apply_time',
      width: 160,
      render: (text: string) => formatDateTime(text),
    },
    {
      title: '审批意见',
      dataIndex: 'approve_comment',
      key: 'approve_comment',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space size="small" wrap>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<CheckOutlined />}
                style={{ color: theme.success }}
                onClick={() => openApproveModal(record, 'approve')}
              >
                同意
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => openApproveModal(record, 'reject')}
              >
                驳回
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <>
              <Button
              type="link"
              icon={<SafetyCertificateOutlined />}
              onClick={() => handleUseSeal(record.id as string)}
            >
              盖章
            </Button>
            </>
          )}
          {/* 单个作废：待审批/已批准可作废
          */}
          {['pending', 'approved'].includes(record.status as string) && (
            <Button type="link" danger onClick={() => openSingleVoidModal(record)}>
              作废
            </Button>
          )}
          {record.status !== 'pending' && record.status !== 'approved' && record.status !== 'used' && record.status !== 'voided' && (
            <span style={{ color: theme.textTertiary }}>无可用操作</span>
          )}
        </Space>
      ),
    },
  ]

  // 作废收回列表列
  const voidColumns = [
    {
      title: '文件名称',
      dataIndex: 'document_name',
      key: 'document_name',
      ellipsis: true,
    },
    {
      title: '文书类别',
      dataIndex: 'document_category',
      key: 'document_category',
      width: 110,
      render: (v: string) => v ? (documentCategoryLabelMap[v] || v) : '-',
    },
    {
      title: '用印介质',
      dataIndex: 'seal_medium',
      key: 'seal_medium',
      width: 90,
      render: (v: string) => <Tag className={sealMediumStitchMap[v] || 'stitch-tag stitch-tag-primary'}>{sealMediumLabelMap[v] || v || '纸质'}</Tag>,
    },
    {
      title: '作废状态',
      dataIndex: 'void_status',
      key: 'void_status',
      width: 100,
      render: (v: string) => <Tag className={voidStatusStitchMap[v] || 'stitch-tag stitch-tag-primary'}>{voidStatusLabelMap[v] || v || '-'}</Tag>,
    },
    {
      title: '作废原因',
      dataIndex: 'void_reason',
      key: 'void_reason',
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '作废时间',
      dataIndex: 'void_time',
      key: 'void_time',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '收回时间',
      dataIndex: 'recover_time',
      key: 'recover_time',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '原申请状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag className={applicationStatusStitchMap[status] || 'stitch-tag stitch-tag-primary'}>
          {applicationStatusLabelMap[status] || status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space size="small">
          {record.void_status === 'voided' && (
          <Button type="link" onClick={() => handleRecover(record.id as string)}>
            收回
          </Button>
        )}
          {record.void_status === 'recovered' && <span style={{color: theme.textTertiary}}>已收回</span>}
        </Space>
      ),
    },
  ]

  // 盖章记录列表列
  const recordColumns = [
    {
      title: '文件名称',
      dataIndex: 'document_name',
      key: 'document_name',
      ellipsis: true,
    },
    {
      title: '印章',
      dataIndex: 'seal_id',
      key: 'seal_id',
      render: (sealId: string) => {
        const seal = sealMap[sealId]
        return seal ? (
          <Tag className={sealTypeStitchMap[seal.type as string] || 'stitch-tag stitch-tag-primary'}>
            {seal.name as React.ReactNode}（{sealTypeLabelMap[seal.type as string] || seal.type as string}）
          </Tag>
        ) : (
          '-'
        )
      },
    },
    {
      title: '用印介质',
      dataIndex: 'seal_medium',
      key: 'seal_medium',
      width: 90,
      render: (_: unknown, record: Record<string, unknown>) => {
        // 通过application_id去applications对应记录里的seal_medium，这里直接显示记录上的字段；若无字段则默认纸质
        return <Tag className={sealMediumStitchMap[record.seal_medium as string] || sealMediumStitchMap.paper}>{sealMediumLabelMap[record.seal_medium as string] || '纸质'}</Tag>
      },
    },
    {
      title: '操作人',
      dataIndex: 'operator_id',
      key: 'operator_id',
    },
    {
      title: '盖章次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
    },
    {
      title: '盖章时间',
      dataIndex: 'seal_time',
      key: 'seal_time',
      render: (text: string) => formatDateTime(text),
    },
  ]

  // ===================== 渲染 =====================

  // 印章管理Tab内容
  const renderSealsTab = () => (
    <div>
      <div className="stitch-filter-bar" style={{ background: theme.white, padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Form form={sealSearchForm} layout="inline" style={{ gap: 8 }}>
          <Form.Item name="keyword" label="关键词">
            <Input
              placeholder="搜索印章名称/类型"
              allowClear
              style={{ width: 220 }}
              onPressEnter={() => {
                const v = sealSearchForm.getFieldsValue()
                setSealKeyword(v.keyword || '')
                setSealStatusFilter(v.status)
              }}
            />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              placeholder="全部"
              allowClear
              style={{ width: 120 }}
              options={[
                { value: 'active', label: '启用' },
                { value: 'inactive', label: '停用' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space className="stitch-btn-group">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  const v = sealSearchForm.getFieldsValue()
                  setSealKeyword(v.keyword || '')
                  setSealStatusFilter(v.status)
                }}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  sealSearchForm.resetFields()
                  setSealKeyword('')
                  setSealStatusFilter(undefined)
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>印章列表</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSeal}>
          新增印章
        </Button>
      </div>

      <div className="stitch-table">
        <Table
          dataSource={filteredSeals}
          columns={sealColumns}
          loading={sealLoading}
          rowKey="id"
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        />
      </div>
    </div>
  )

  // 用印申请Tab内容（待用印文档：待审批/已批准 + 未作废）
  const renderApplicationsTab = () => (
    <div>
      <div className="stitch-filter-bar" style={{ background: theme.white, padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Form form={appSearchForm} layout="inline" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Form.Item name="keyword" label="关键词">
            <Input
              placeholder="搜索文件名/用途/印章"
              allowClear
              style={{ width: 240 }}
              onPressEnter={() => {
                const v = appSearchForm.getFieldsValue()
                setAppKeyword(v.keyword || '')
                setAppMediumFilter(v.seal_medium)
                setAppDocCategoryFilter(v.document_category)
                fetchApplications()
              }}
            />
          </Form.Item>
          <Form.Item name="seal_medium" label="用印介质">
            <Select
              placeholder="全部介质"
              allowClear
              style={{ width: 140 }}
              options={[
                { value: 'paper', label: '纸质' },
                { value: 'electronic', label: '电子' },
              ]}
            />
          </Form.Item>
          <Form.Item name="document_category" label="文书类别">
            <Select
              placeholder="全部类别"
              allowClear
              style={{ width: 150 }}
              options={Object.keys(documentCategoryLabelMap).map(k => ({ value: k, label: documentCategoryLabelMap[k] }))}
            />
          </Form.Item>
          <Form.Item name="status" label="审批状态">
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: 140 }}
              options={[
                { value: 'pending', label: '待审批' },
                { value: 'approved', label: '已通过' },
                { value: 'rejected', label: '已驳回' },
                { value: 'used', label: '已盖章' },
                { value: 'voided', label: '已作废' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space className="stitch-btn-group">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  const v = appSearchForm.getFieldsValue()
                  setAppKeyword(v.keyword || '')
                  setAppMediumFilter(v.seal_medium)
                  setAppDocCategoryFilter(v.document_category)
                  fetchApplications()
                }}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  appSearchForm.resetFields()
                  setAppKeyword('')
                  setAppMediumFilter(undefined)
                  setAppDocCategoryFilter(undefined)
                  fetchApplications()
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>待用印文档</h3>
        <Space className="stitch-btn-group">
          {selectedAppIds.length > 0 && (
            <>
              <Button icon={<SafetyCertificateOutlined />} onClick={handleBatchUseSeal}>
                批量盖章（{selectedAppIds.length}）
              </Button>
              <Popconfirm
                title="批量作废"
                description={`确定要作废所选的 ${selectedAppIds.length} 条申请吗？仅待审批/已通过状态会被作废。`}
                okText="确定"
                cancelText="取消"
                onConfirm={handleBatchVoid}
              >
                <Button danger icon={<CloseOutlined />}>
                  批量作废（{selectedAppIds.length}）
                </Button>
              </Popconfirm>
            </>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddApplication}>
            发起申请
          </Button>
        </Space>
      </div>

      <div className="stitch-table">
        <Table
          dataSource={applications}
          columns={applicationColumns}
          loading={appLoading}
          rowKey="id"
          scroll={{ x: 2000 }}
          rowSelection={{
            selectedRowKeys: selectedAppIds,
            onChange: (keys) => setSelectedAppIds(keys as string[]),
            getCheckboxProps: (record: Record<string, unknown>) => ({
              disabled: record.status !== 'pending' && record.status !== 'approved',
            }),
          }}
          pagination={{
            current: appPage,
            pageSize: 20,
            total: appTotal,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => { setAppPage(p); fetchApplications(p) },
          }}
        />
      </div>
    </div>
  )

  // 盖章记录Tab内容（纸质用印记录）
  const renderRecordsTab = () => (
    <div>
      <div className="stitch-filter-bar" style={{ background: theme.white, padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Form form={recordSearchForm} layout="inline" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Form.Item name="keyword" label="关键词">
            <Input
              placeholder="搜索文件名/印章"
              allowClear
              style={{ width: 240 }}
              onPressEnter={() => {
                const v = recordSearchForm.getFieldsValue()
                setRecordKeyword(v.keyword || '')
                setRecordMediumFilter(v.seal_medium)
                fetchRecords()
              }}
            />
          </Form.Item>
          <Form.Item name="seal_medium" label="用印介质">
            <Select
              placeholder="全部介质"
              allowClear
              style={{ width: 140 }}
              options={[
                { value: 'paper', label: '纸质' },
                { value: 'electronic', label: '电子' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space className="stitch-btn-group">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  const v = recordSearchForm.getFieldsValue()
                  setRecordKeyword(v.keyword || '')
                  setRecordMediumFilter(v.seal_medium)
                  fetchRecords()
                }}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  recordSearchForm.resetFields()
                  setRecordKeyword('')
                  setRecordMediumFilter(undefined)
                  fetchRecords()
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>纸质用印记录</h3>
      </div>

      <div className="stitch-table">
        <Table
          dataSource={records}
          columns={recordColumns}
          loading={recordLoading}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{
            current: recordPage,
            pageSize: 20,
            total: recordTotal,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => { setRecordPage(p); fetchRecords(p) },
          }}
        />
      </div>
    </div>
  )

  // 作废收回记录Tab内容
  const renderVoidTab = () => (
    <div>
      <div className="stitch-filter-bar" style={{ background: theme.white, padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Form form={voidSearchForm} layout="inline" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Form.Item name="keyword" label="关键词">
            <Input
              placeholder="搜索文件名/作废原因"
              allowClear
              style={{ width: 240 }}
              onPressEnter={() => {
                const v = voidSearchForm.getFieldsValue()
                setVoidKeyword(v.keyword || '')
                setVoidStatusFilter(v.void_status)
                fetchVoidRecords()
              }}
            />
          </Form.Item>
          <Form.Item name="void_status" label="作废状态">
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: 140 }}
              options={[
                { value: 'voided', label: '已作废' },
                { value: 'recovered', label: '已收回' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space className="stitch-btn-group">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  const v = voidSearchForm.getFieldsValue()
                  setVoidKeyword(v.keyword || '')
                  setVoidStatusFilter(v.void_status)
                  fetchVoidRecords()
                }}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  voidSearchForm.resetFields()
                  setVoidKeyword('')
                  setVoidStatusFilter(undefined)
                  fetchVoidRecords()
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>作废收回记录</h3>
      </div>

      <div className="stitch-table">
        <Table
          dataSource={voidList}
          columns={voidColumns}
          loading={voidLoading}
          rowKey="id"
          scroll={{ x: 1800 }}
          pagination={{
            current: voidPage,
            pageSize: 20,
            total: voidTotal,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => { setVoidPage(p); fetchVoidRecords(p) },
          }}
        />
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>用印管理</h2>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'pending', label: '待用印文档', children: renderApplicationsTab() },
          { key: 'records', label: '纸质用印记录', children: renderRecordsTab() },
          { key: 'void', label: '作废收回记录', children: renderVoidTab() },
          { key: 'seals', label: '印章管理', children: renderSealsTab() },
        ]}
      />

      {/* 单个作废原因弹窗 */}
      <Modal
        title="作废用印申请"
        open={singleVoidVisible}
        onCancel={() => setSingleVoidVisible(false)}
        onOk={() => singleVoidForm.submit()}
        width={520}
        okText="确认作废"
        cancelText="取消"
      >
        <Form form={singleVoidForm} layout="vertical" onFinish={handleSingleVoidSubmit}>
          <Form.Item name="reason" label="作废原因" rules={[{ required: true, message: '请输入作废原因' }]}>
            <Input.TextArea rows={4} placeholder="请输入作废原因" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 印章新增/编辑弹窗 */}
      <Modal
        title={editingSeal ? '编辑印章' : '新增印章'}
        open={sealModalVisible}
        onCancel={() => setSealModalVisible(false)}
        onOk={() => sealForm.submit()}
        width={560}
      >
        <Form form={sealForm} onFinish={handleSealSubmit} layout="vertical">
          <Form.Item name="name" label="印章名称" rules={[{ required: true, message: '请输入印章名称' }]}>
            <Input placeholder="请输入印章名称，如：公司公章" />
          </Form.Item>
          <Form.Item name="type" label="印章类型" rules={[{ required: true, message: '请选择印章类型' }]}>
            <Select
              placeholder="请选择印章类型"
              options={[
                { value: 'official', label: '公章' },
                { value: 'financial', label: '财务章' },
                { value: 'contract', label: '合同章' },
                { value: 'personal', label: '法人章' },
              ]}
            />
          </Form.Item>
          <Form.Item name="manager_id" label="管理人ID">
            <Input placeholder="请输入管理人ID（可空）" />
          </Form.Item>
          <Form.Item name="is_electronic" label="是否电子印章" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
          <Form.Item name="support_watermark" label="支持水印" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
          <Form.Item name="support_paging_seal" label="支持骑缝章" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select
              options={[
                { value: 'active', label: '启用' },
                { value: 'inactive', label: '停用' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 用印申请弹窗 */}
      <Modal
        title="发起用印申请"
        open={appModalVisible}
        onCancel={() => setAppModalVisible(false)}
        onOk={() => appForm.submit()}
        width={600}
      >
        <Form form={appForm} onFinish={handleApplicationSubmit} layout="vertical">
          <Form.Item name="seal_medium" label="用印介质" initialValue="paper" rules={[{ required: true, message: '请选择用印介质' }]}>
            <Select
              placeholder="请选择用印介质"
              options={[
                { value: 'paper', label: '纸质' },
                { value: 'electronic', label: '电子' },
              ]}
            />
          </Form.Item>
          <Form.Item name="document_category" label="文书类别" initialValue="other" rules={[{ required: true, message: '请选择文书类别' }]}>
            <Select
              placeholder="请选择文书类别"
              options={Object.keys(documentCategoryLabelMap).map(k => ({ value: k, label: documentCategoryLabelMap[k] }))}
            />
          </Form.Item>
          <Form.Item name="seal_id" label="选择印章" rules={[{ required: true, message: '请选择印章' }]}>
            <Select
              placeholder="请选择印章"
              options={seals
                .filter((s) => s.status === 'active')
                .map((s) => ({
                  value: s.id as string,
                  label: `${s.name as string}（${sealTypeLabelMap[s.type as string] || s.type as string}）`,
                }))}
            />
          </Form.Item>
          <Form.Item
            name="document_name"
            label="文件名称"
            rules={[{ required: true, message: '请输入文件名称' }]}
          >
            <Input placeholder="请输入需要盖章的文件名称" />
          </Form.Item>
          <Form.Item name="case_id" label="关联案件ID">
            <Input placeholder="关联案件ID（可空）" />
          </Form.Item>
          <Form.Item name="purpose" label="用印用途" rules={[{ required: true, message: '请输入用印用途' }]}>
            <Input.TextArea rows={3} placeholder="请说明用印用途" />
          </Form.Item>
          <Form.Item name="usage_count" label="用印次数" initialValue={1} rules={[{ required: true, message: '请输入用印次数' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入用印次数" />
          </Form.Item>
          <Form.Item name="is_confidential" label="涉密标记" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren="涉密" unCheckedChildren="普通" />
          </Form.Item>
          <Form.Item name="seal_type" label="盖章类型" initialValue="normal">
            <Select
              placeholder="请选择盖章类型"
              options={[
                { value: 'normal', label: '普通' },
                { value: 'watermark', label: '水印' },
                { value: 'paging', label: '骑缝' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 审批弹窗 */}
      <Modal
        title={approveAction === 'approve' ? '同意用印申请' : '驳回用印申请'}
        open={approveModalVisible}
        onCancel={() => setApproveModalVisible(false)}
        onOk={() => approveForm.submit()}
        width={520}
      >
        <Form form={approveForm} onFinish={handleApproveSubmit} layout="vertical">
          <Form.Item name="approve_comment" label="审批意见">
            <Input.TextArea
              rows={4}
              placeholder={approveAction === 'approve' ? '请输入审批意见（可空）' : '请输入驳回原因（可空）'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
