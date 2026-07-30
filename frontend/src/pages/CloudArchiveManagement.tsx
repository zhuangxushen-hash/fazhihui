import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Modal,
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  CloudOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileWordOutlined,
} from '@ant-design/icons';
import axios from 'axios';

interface ArchiveItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  client_id: string;
  client_name?: string;
  case_id: string;
  case_title?: string;
  description?: string;
  archived_at: string;
  archived_by?: string;
  organization_id: string;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) return <FileTextOutlined />;
  const iconMap: Record<string, React.ReactNode> = {
    pdf: <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
    doc: <FileWordOutlined style={{ color: '#1890ff' }} />,
    docx: <FileWordOutlined style={{ color: '#1890ff' }} />,
    xls: <FileExcelOutlined style={{ color: '#52c41a' }} />,
    xlsx: <FileExcelOutlined style={{ color: '#52c41a' }} />,
    png: <FileImageOutlined style={{ color: '#faad14' }} />,
    jpg: <FileImageOutlined style={{ color: '#faad14' }} />,
    jpeg: <FileImageOutlined style={{ color: '#faad14' }} />,
  };
  return iconMap[ext] || <FileTextOutlined />;
};

const getFileTypeConfig = (type: string) => {
  const configs: Record<string, { label: string; color: string }> = {
    document: { label: '文书', color: 'blue' },
    evidence: { label: '证据', color: 'green' },
    contract: { label: '合同', color: 'orange' },
    invoice: { label: '发票', color: 'purple' },
    correspondence: { label: '函件', color: 'cyan' },
  };
  return configs[type] || { label: type, color: 'default' };
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function CloudArchiveManagement() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ArchiveItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string | undefined>();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/client/admin/archives/list', {
        keyword: searchText,
        file_type: fileTypeFilter,
        page,
        page_size: pageSize,
      });
      const result = res.data || res;
      setData(result.data || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Fetch archives error:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    setSearchText('');
    setFileTypeFilter(undefined);
    setPage(1);
  };

  const handlePreview = (record: ArchiveItem) => {
    if (record.file_url) {
      setPreviewTitle(record.file_name);
      setPreviewUrl(record.file_url);
      setPreviewVisible(true);
    } else {
      message.warning('文件暂无预览地址');
    }
  };

  const handleDownload = (record: ArchiveItem) => {
    if (record.file_url) {
      window.open(record.file_url, '_blank');
    } else {
      message.warning('文件暂无下载地址');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/client/admin/archives/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('Delete archive error:', error);
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      width: 220,
      render: (text: string, _record: ArchiveItem) => (
        <Space>
          {getFileIcon(text)}
          <Tooltip title={text}>
            <span style={{ fontWeight: 500 }}>{text}</span>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '文件类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 100,
      render: (type: string) => {
        const config = getFileTypeConfig(type);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '客户',
      dataIndex: 'client_name',
      key: 'client_name',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '关联案件',
      dataIndex: 'case_title',
      key: 'case_title',
      width: 180,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '归档时间',
      dataIndex: 'archived_at',
      key: 'archived_at',
      width: 160,
      render: (text: string) => formatDateTime(text),
    },
    {
      title: '归档人',
      dataIndex: 'archived_by',
      key: 'archived_by',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: ArchiveItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
          <Popconfirm
            title="确认删除此归档文件?"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          <CloudOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          云归档管理
        </h2>
        <p style={{ color: '#8c8c8c', marginTop: 4 }}>
          管理客户归档的文书、证据、合同、发票等文件
        </p>
      </div>

      <div
        style={{
          background: '#fff',
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <Space wrap>
          <Input
            placeholder="搜索文件名"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            placeholder="文件类型"
            value={fileTypeFilter}
            onChange={(value) => setFileTypeFilter(value)}
            style={{ width: 140 }}
            allowClear
          >
            <Select.Option value="document">文书</Select.Option>
            <Select.Option value="evidence">证据</Select.Option>
            <Select.Option value="contract">合同</Select.Option>
            <Select.Option value="invoice">发票</Select.Option>
            <Select.Option value="correspondence">函件</Select.Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </div>

      <Modal
        title={`预览 - ${previewTitle}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              window.open(previewUrl, '_blank');
            }}
          >
            下载
          </Button>,
        ]}
        width={800}
        destroyOnClose
      >
        {previewUrl ? (
          <div style={{ textAlign: 'center', minHeight: 400 }}>
            <img
              src={previewUrl}
              alt={previewTitle}
              style={{ maxWidth: '100%', maxHeight: 500, borderRadius: 4 }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<p style="padding:100px;color:#999">该文件类型暂不支持在线预览，请点击下载查看</p>';
                }
              }}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
