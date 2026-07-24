import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Tabs,
  Statistic,
  Row,
  Col,
  message,
  Badge,
} from 'antd';
import {
  WarningOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  CaseWarning,
  WarningType,
  WarningLevel,
  WarningStatus,
} from '../types';
import {
  getWarnings,
  getWarningStatistics,
  handleWarning,
  triggerWarningGeneration,
  WarningStatistics,
} from '../api/caseWarning';

const { TabPane } = Tabs;

const warningTypeLabels: Record<WarningType, string> = {
  [WarningType.EVIDENCE_PERIOD]: '举证期',
  [WarningType.APPEAL_PERIOD]: '上诉期',
  [WarningType.HEARING_DATE]: '开庭时间',
  [WarningType.PRESERVATION_EXPIRE]: '保全到期',
  [WarningType.STATUTE_EXPIRE]: '时效到期',
  [WarningType.PAYMENT_DEADLINE]: '缴费期限',
  [WarningType.OTHER]: '其他',
};

const warningLevelConfig: Record<WarningLevel, { color: string; text: string }> = {
  [WarningLevel.REMINDER]: { color: 'blue', text: '提醒' },
  [WarningLevel.WARNING]: { color: 'orange', text: '警告' },
  [WarningLevel.URGENT]: { color: 'red', text: '紧急' },
};

const warningStatusConfig: Record<WarningStatus, { color: string; text: string }> = {
  [WarningStatus.PENDING]: { color: 'gold', text: '待处理' },
  [WarningStatus.PROCESSED]: { color: 'green', text: '已处理' },
  [WarningStatus.OVERDUE]: { color: 'red', text: '已超期' },
};

type WarningTabKey = 'all' | 'urgent' | 'warning' | 'reminder';

const CaseWarningCenter: React.FC = () => {
  const [warnings, setWarnings] = useState<CaseWarning[]>([]);
  const [statistics, setStatistics] = useState<WarningStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<WarningTabKey>('all');
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [currentWarning, setCurrentWarning] = useState<CaseWarning | null>(null);
  const [form] = Form.useForm();

  const handleTabChange = (key: string) => {
    setActiveTab(key as WarningTabKey);
  };

  const fetchWarnings = async () => {
    setLoading(true);
    try {
      const filter: any = { status: WarningStatus.PENDING };
      if (activeTab !== 'all') {
        filter.warning_level = activeTab as WarningLevel;
      }
      const data = await getWarnings(filter);
      setWarnings(data);
    } catch (error) {
      message.error('获取预警列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await getWarningStatistics();
      setStatistics(stats);
    } catch (error) {
      message.error('获取预警统计失败');
    }
  };

  useEffect(() => {
    fetchWarnings();
    fetchStatistics();
  }, [activeTab]);

  const handleTriggerGeneration = async () => {
    try {
      const result = await triggerWarningGeneration();
      message.success(result.message);
      fetchWarnings();
      fetchStatistics();
    } catch (error) {
      message.error('触发预警生成失败');
    }
  };

  const openHandleModal = (warning: CaseWarning) => {
    setCurrentWarning(warning);
    setHandleModalVisible(true);
    form.resetFields();
  };

  const handleWarningSubmit = async (values: any) => {
    if (!currentWarning) return;

    try {
      await handleWarning(currentWarning.id, {
        status: WarningStatus.PROCESSED,
        handle_note: values.handle_note,
      });
      message.success('预警处理成功');
      setHandleModalVisible(false);
      fetchWarnings();
      fetchStatistics();
    } catch (error) {
      message.error('预警处理失败');
    }
  };

  const columns: ColumnsType<CaseWarning> = [
    {
      title: '预警类型',
      dataIndex: 'warning_type',
      key: 'warning_type',
      render: (type: WarningType) => (
        <Tag>{warningTypeLabels[type] || type}</Tag>
      ),
    },
    {
      title: '预警级别',
      dataIndex: 'warning_level',
      key: 'warning_level',
      render: (level: WarningLevel) => {
        const config = warningLevelConfig[level];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '案件编号',
      dataIndex: ['case', 'case_no'],
      key: 'case_no',
    },
    {
      title: '客户姓名',
      dataIndex: ['case', 'client_name'],
      key: 'client_name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '剩余天数',
      dataIndex: 'advance_days',
      key: 'advance_days',
      render: (days: number) => (
        <span style={{ color: days <= 1 ? 'red' : days <= 3 ? 'orange' : 'inherit' }}>
          {days > 0 ? `${days}天` : '已超期'}
        </span>
      ),
    },
    {
      title: '目标日期',
      dataIndex: 'target_date',
      key: 'target_date',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: WarningStatus) => {
        const config = warningStatusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === WarningStatus.PENDING && (
            <Button type="link" onClick={() => openHandleModal(record)}>
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="待处理预警"
                value={statistics?.pending || 0}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已超期预警"
                value={statistics?.overdue || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="紧急预警"
                value={statistics?.byLevel.urgent || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="警告预警"
                value={statistics?.byLevel.warning || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
          </Row>
        </div>

        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="全部预警" key="all" />
          <TabPane
            tab={<Badge count={statistics?.byLevel.urgent || 0} offset={[10, 0]}>紧急</Badge>}
            key="urgent"
          />
          <TabPane
            tab={<Badge count={statistics?.byLevel.warning || 0} offset={[10, 0]} style={{ backgroundColor: '#fa8c16' }}>警告</Badge>}
            key="warning"
          />
          <TabPane
            tab={<Badge count={statistics?.byLevel.reminder || 0} offset={[10, 0]} style={{ backgroundColor: '#1890ff' }}>提醒</Badge>}
            key="reminder"
          />
        </Tabs>

        <div style={{ marginBottom: '16px' }}>
          <Button type="primary" onClick={handleTriggerGeneration}>
            手动生成预警
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={warnings}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="处理预警"
        open={handleModalVisible}
        onCancel={() => setHandleModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleWarningSubmit} layout="vertical">
          <Form.Item label="处理备注" name="handle_note">
            <Input.TextArea rows={4} placeholder="请输入处理说明" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认处理
              </Button>
              <Button onClick={() => setHandleModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CaseWarningCenter;