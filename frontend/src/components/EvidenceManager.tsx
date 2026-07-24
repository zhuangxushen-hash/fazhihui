import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Upload,
  Tag,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Drawer,
  Descriptions,
} from 'antd'
import {
  UploadOutlined,
  EyeOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  InboxOutlined,
  RestOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import {
  getEvidenceList,
  uploadEvidence,
  batchUploadEvidence,
  updateEvidenceCategory,
  getEvidenceDetail,
  archiveEvidence,
  restoreEvidence,
  getEvidenceCatalog,
  batchArchiveEvidence,
  getPreviewUrl,
  getDownloadUrl,
} from '../api/evidence'
import { Evidence, EvidenceType, EvidenceCategory } from '../types'
import { formatFileSize } from '../utils/format'

const { Dragger } = Upload

interface EvidenceManagerProps {
  caseId: string
}

export default function EvidenceManager({ caseId }: EvidenceManagerProps) {
  const [evidences, setEvidences] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [catalogModalVisible, setCatalogModalVisible] = useState(false)
  const [catalog, setCatalog] = useState<any>(null)
  const [currentEvidence, setCurrentEvidence] = useState<Evidence | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [filters, setFilters] = useState<{
    type?: EvidenceType
    category?: EvidenceCategory
    is_archived?: boolean
  }>({})
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [detail, setDetail] = useState<Evidence | null>(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [uploadForm] = Form.useForm()
  const [editForm] = Form.useForm()

  useEffect(() => {
    fetchEvidences()
  }, [caseId, filters])

  const fetchEvidences = async () => {
    setLoading(true)
    try {
      const data = await getEvidenceList(caseId, filters)
      setEvidences(data || [])
    } catch (error) {
      message.error('获取证据列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    try {
      const values = await uploadForm.validateFields()
      const files = fileList.map(f => f.originFileObj as File)

      if (files.length === 0) {
        message.error('请选择要上传的文件')
        return
      }

      setLoading(true)
      if (files.length === 1) {
        await uploadEvidence(caseId, files[0], {
          upload_by_id: user.id,
          name: values.name,
          type: values.type,
          category: values.category,
          description: values.description,
        })
      } else {
        await batchUploadEvidence(caseId, files, {
          upload_by_id: user.id,
          type: values.type,
          category: values.category,
        })
      }

      message.success('上传成功')
      setUploadModalVisible(false)
      setFileList([])
      uploadForm.resetFields()
      fetchEvidences()
    } catch (error) {
      message.error('上传失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    try {
      if (!currentEvidence) return

      const values = await editForm.validateFields()
      await updateEvidenceCategory(currentEvidence.id, values)
      message.success('修改成功')
      setEditModalVisible(false)
      fetchEvidences()
    } catch (error) {
      message.error('修改失败')
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await archiveEvidence(id)
      message.success('归档成功')
      fetchEvidences()
    } catch (error) {
      message.error('归档失败')
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await restoreEvidence(id)
      message.success('恢复成功')
      fetchEvidences()
    } catch (error) {
      message.error('恢复失败')
    }
  }

  const handleBatchArchive = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要归档的证据')
      return
    }

    try {
      await batchArchiveEvidence(selectedRowKeys as string[])
      message.success('批量归档成功')
      setSelectedRowKeys([])
      fetchEvidences()
    } catch (error) {
      message.error('批量归档失败')
    }
  }

  const handleGenerateCatalog = async () => {
    try {
      const data = await getEvidenceCatalog(caseId)
      setCatalog(data)
      setCatalogModalVisible(true)
    } catch (error) {
      message.error('生成证据目录失败')
    }
  }

  const handleViewDetail = async (id: string) => {
    try {
      const data = await getEvidenceDetail(id)
      setDetail(data)
      setDetailDrawerVisible(true)
    } catch (error) {
      message.error('获取证据详情失败')
    }
  }

  const getTypeText = (type: EvidenceType) => {
    const map: Record<EvidenceType, string> = {
      [EvidenceType.CONTRACT]: '合同',
      [EvidenceType.EVIDENCE]: '证据',
      [EvidenceType.DOCUMENT]: '文书',
      [EvidenceType.OTHER]: '其他',
    }
    return map[type] || type
  }

  const getCategoryText = (category: EvidenceCategory) => {
    const map: Record<EvidenceCategory, string> = {
      [EvidenceCategory.PLAINTIFF]: '原告证据',
      [EvidenceCategory.DEFENDANT]: '被告证据',
      [EvidenceCategory.COURT]: '法院材料',
      [EvidenceCategory.OTHER]: '其他',
    }
    return map[category] || category
  }

  const columns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: EvidenceType) => <Tag>{getTypeText(type)}</Tag>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: EvidenceCategory) => <Tag color="blue">{getCategoryText(category)}</Tag>,
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => (size ? formatFileSize(size) : '-'),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version: number) => `V${version}`,
    },
    {
      title: '上传时间',
      dataIndex: 'upload_at',
      key: 'upload_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'is_archived',
      key: 'is_archived',
      render: (isArchived: boolean) => (
        <Tag color={isArchived ? 'default' : 'green'}>{isArchived ? '已归档' : '正常'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_: any, record: Evidence) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
            查看
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => window.open(getDownloadUrl(record.id))}
          >
            下载
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentEvidence(record)
              editForm.setFieldsValue(record)
              setEditModalVisible(true)
            }}
          >
            编辑
          </Button>
          {record.is_archived ? (
            <Button size="small" icon={<RestOutlined />} onClick={() => handleRestore(record.id)}>
              恢复
            </Button>
          ) : (
            <Popconfirm
              title="确认归档?"
              onConfirm={() => handleArchive(record.id)}
              okText="是"
              cancelText="否"
            >
              <Button size="small" danger icon={<InboxOutlined />}>
                归档
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总证据数"
              value={evidences.filter(e => !e.is_archived).length}
              prefix={<FileTextOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已归档"
              value={evidences.filter(e => e.is_archived).length}
              prefix={<InboxOutlined />}
            />
          </Col>
        </Row>
      </Card>

      <Space style={{ marginBottom: 16 }} wrap>
        <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
          上传证据
        </Button>
        <Button icon={<FileTextOutlined />} onClick={handleGenerateCatalog}>
          生成证据目录
        </Button>
        {selectedRowKeys.length > 0 && (
          <Button danger onClick={handleBatchArchive}>
            批量归档 ({selectedRowKeys.length})
          </Button>
        )}
        <Select
          placeholder="筛选类型"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setFilters({ ...filters, type: value })}
          value={filters.type}
        >
          <Select.Option value={EvidenceType.CONTRACT}>合同</Select.Option>
          <Select.Option value={EvidenceType.EVIDENCE}>证据</Select.Option>
          <Select.Option value={EvidenceType.DOCUMENT}>文书</Select.Option>
          <Select.Option value={EvidenceType.OTHER}>其他</Select.Option>
        </Select>
        <Select
          placeholder="筛选分类"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setFilters({ ...filters, category: value })}
          value={filters.category}
        >
          <Select.Option value={EvidenceCategory.PLAINTIFF}>原告证据</Select.Option>
          <Select.Option value={EvidenceCategory.DEFENDANT}>被告证据</Select.Option>
          <Select.Option value={EvidenceCategory.COURT}>法院材料</Select.Option>
          <Select.Option value={EvidenceCategory.OTHER}>其他</Select.Option>
        </Select>
        <Select
          placeholder="筛选状态"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setFilters({ ...filters, is_archived: value })}
          value={filters.is_archived}
        >
          <Select.Option value={false}>正常</Select.Option>
          <Select.Option value={true}>已归档</Select.Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={evidences}
        rowKey="id"
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      {/* 上传模态框 */}
      <Modal
        title="上传证据"
        open={uploadModalVisible}
        onOk={handleUpload}
        onCancel={() => {
          setUploadModalVisible(false)
          setFileList([])
          uploadForm.resetFields()
        }}
        width={600}
        confirmLoading={loading}
      >
        <Form form={uploadForm} layout="vertical">
          <Form.Item label="文件">
            <Dragger
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              multiple
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">支持单个或批量上传，支持 PDF、JPG、PNG、DOC、DOCX 格式</p>
            </Dragger>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="类型">
                <Select placeholder="请选择类型" allowClear>
                  <Select.Option value={EvidenceType.CONTRACT}>合同</Select.Option>
                  <Select.Option value={EvidenceType.EVIDENCE}>证据</Select.Option>
                  <Select.Option value={EvidenceType.DOCUMENT}>文书</Select.Option>
                  <Select.Option value={EvidenceType.OTHER}>其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Select placeholder="请选择分类" allowClear>
                  <Select.Option value={EvidenceCategory.PLAINTIFF}>原告证据</Select.Option>
                  <Select.Option value={EvidenceCategory.DEFENDANT}>被告证据</Select.Option>
                  <Select.Option value={EvidenceCategory.COURT}>法院材料</Select.Option>
                  <Select.Option value={EvidenceCategory.OTHER}>其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {fileList.length === 1 && (
            <Form.Item name="name" label="文件名称">
              <Input placeholder="请输入文件名称" />
            </Form.Item>
          )}
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={3} placeholder="请输入说明" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑模态框 */}
      <Modal
        title="编辑证据"
        open={editModalVisible}
        onOk={handleEdit}
        onCancel={() => setEditModalVisible(false)}
        width={500}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="文件名称">
            <Input placeholder="请输入文件名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="类型">
                <Select placeholder="请选择类型">
                  <Select.Option value={EvidenceType.CONTRACT}>合同</Select.Option>
                  <Select.Option value={EvidenceType.EVIDENCE}>证据</Select.Option>
                  <Select.Option value={EvidenceType.DOCUMENT}>文书</Select.Option>
                  <Select.Option value={EvidenceType.OTHER}>其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Select placeholder="请选择分类">
                  <Select.Option value={EvidenceCategory.PLAINTIFF}>原告证据</Select.Option>
                  <Select.Option value={EvidenceCategory.DEFENDANT}>被告证据</Select.Option>
                  <Select.Option value={EvidenceCategory.COURT}>法院材料</Select.Option>
                  <Select.Option value={EvidenceCategory.OTHER}>其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={3} placeholder="请输入说明" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 证据目录模态框 */}
      <Modal
        title="证据目录"
        open={catalogModalVisible}
        onCancel={() => setCatalogModalVisible(false)}
        footer={null}
        width={800}
      >
        {catalog && (
          <div>
            <p>
              <strong>生成时间：</strong>
              {new Date(catalog.generated_at).toLocaleString()}
            </p>
            <p>
              <strong>证据总数：</strong>
              {catalog.total_count}
            </p>
            {catalog.categories.map((cat: any) => (
              <Card key={cat.category} title={cat.category_name} style={{ marginBottom: 16 }}>
                {cat.items.map((item: any) => (
                  <div key={item.type}>
                    <h4>
                      {item.type_name} ({item.count})
                    </h4>
                    <Table
                      size="small"
                      dataSource={item.evidences}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        { title: '文件名', dataIndex: 'name', key: 'name' },
                        { title: '版本', dataIndex: 'version', key: 'version', render: (v) => `V${v}` },
                        {
                          title: '上传时间',
                          dataIndex: 'upload_at',
                          key: 'upload_at',
                          render: (date) => new Date(date).toLocaleDateString(),
                        },
                      ]}
                    />
                  </div>
                ))}
              </Card>
            ))}
          </div>
        )}
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="证据详情"
        placement="right"
        width={600}
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
      >
        {detail && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="文件名">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="类型">{getTypeText(detail.type)}</Descriptions.Item>
              <Descriptions.Item label="分类">{getCategoryText(detail.category)}</Descriptions.Item>
              <Descriptions.Item label="文件大小">
                {detail.file_size ? formatFileSize(detail.file_size) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="MIME类型">{detail.mime_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前版本">V{detail.version}</Descriptions.Item>
              <Descriptions.Item label="上传时间">
                {new Date(detail.upload_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={detail.is_archived ? 'default' : 'green'}>
                  {detail.is_archived ? '已归档' : '正常'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="说明">{detail.description || '-'}</Descriptions.Item>
            </Descriptions>

            {detail.mime_type?.startsWith('image/') && (
              <div style={{ marginTop: 16 }}>
                <h4>预览</h4>
                <img
                  src={getPreviewUrl(detail.id)}
                  alt={detail.name}
                  style={{ maxWidth: '100%', border: '1px solid #d9d9d9', borderRadius: 4 }}
                />
              </div>
            )}

            {detail.mime_type === 'application/pdf' && (
              <div style={{ marginTop: 16 }}>
                <Button onClick={() => window.open(getPreviewUrl(detail.id))}>在新窗口打开PDF</Button>
              </div>
            )}

            {detail.versions && detail.versions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>历史版本</h4>
                <Table
                  size="small"
                  dataSource={detail.versions}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '版本', dataIndex: 'version', key: 'version', render: (v) => `V${v}` },
                    {
                      title: '上传时间',
                      dataIndex: 'upload_at',
                      key: 'upload_at',
                      render: (date) => new Date(date).toLocaleString(),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_: any, record: Evidence) => (
                        <Button size="small" onClick={() => window.open(getDownloadUrl(record.id))}>
                          下载
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}