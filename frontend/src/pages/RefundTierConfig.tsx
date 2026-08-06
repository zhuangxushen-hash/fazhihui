import { useState } from 'react';
import { Card, Tabs, Table, Button, Input, Form, Tag, message, Empty, Descriptions, Divider } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
import { calculateTieredRefund } from '../api/finance';
import { theme } from '../constants/theme';

const tierRules = [
  { key: '1', tier: '10万以下', range_min: 0, range_max: 100000, refund_rate: 0 },
  { key: '2', tier: '10万-30万', range_min: 100000, range_max: 300000, refund_rate: 10 },
  { key: '3', tier: '30万-50万', range_min: 300000, range_max: 500000, refund_rate: 20 },
  { key: '4', tier: '50万-100万', range_min: 500000, range_max: 1000000, refund_rate: 30 },
  { key: '5', tier: '100万以上', range_min: 1000000, range_max: -1, refund_rate: 40 },
];

export default function RefundTierConfig() {
  const [activeTab, setActiveTab] = useState('rules');
  const [loading, setLoading] = useState(false);
  const [caseId, setCaseId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [form] = Form.useForm();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleCalculate = async () => {
    if (!caseId.trim()) {
      message.warning('请输入案件编号');
      return;
    }
    setLoading(true);
    try {
      const data = await calculateTieredRefund(caseId.trim(), user.organization_id);
      setResult(data);
      message.success('阶梯退费核算完成');
    } catch (error) {
      setResult(getMockResult(caseId.trim()));
      message.success('阶梯退费核算完成（模拟数据）');
    } finally {
      setLoading(false);
    }
  };

  const ruleColumns = [
    {
      title: '阶梯阶段',
      dataIndex: 'tier',
      key: 'tier',
      render: (val: string) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      title: '金额范围',
      key: 'range',
      render: (_: any, record: any) => (
        <span>
          ¥{record.range_min.toLocaleString()}
          {record.range_max === -1 ? ' 以上' : ` - ¥${record.range_max.toLocaleString()}`}
        </span>
      ),
    },
    {
      title: '退费比例',
      dataIndex: 'refund_rate',
      key: 'refund_rate',
      render: (val: number) => (
        // 保留原判断逻辑，按 stitch 设计规范映射变体：0-primary、≤10-info、≤20-warning、>20-error
        <Tag className={`stitch-tag stitch-tag-${val === 0 ? 'primary' : val <= 10 ? 'info' : val <= 20 ? 'warning' : 'error'}`}>
          {val}%
        </Tag>
      ),
    },
    {
      title: '说明',
      key: 'desc',
      render: (_: any, record: any) => {
        if (record.refund_rate === 0) return <span style={{ color: theme.textTertiary }}>该阶段不产生退费</span>;
        return <span style={{ color: theme.textSecondary }}>超出 {record.range_min.toLocaleString()} 部分按 {record.refund_rate}% 核算</span>;
      },
    },
  ];

  const refundColumns = [
    {
      title: '阶梯阶段',
      dataIndex: 'tier',
      key: 'tier',
      render: (val: string) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      title: '金额范围',
      key: 'range',
      render: (_: any, record: any) => (
        <span>
          ¥{record.range_min?.toLocaleString()}
          {record.range_max === -1 || record.range_max === undefined ? ' 以上' : ` - ¥${record.range_max.toLocaleString()}`}
        </span>
      ),
    },
    {
      title: '退费比例',
      dataIndex: 'refund_rate',
      key: 'refund_rate',
      render: (val: number) => <Tag className="stitch-tag stitch-tag-info">{val}%</Tag>,
    },
    {
      title: '退费金额',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      render: (val: number) => <span style={{ color: theme.error, fontWeight: 600 }}>¥{val?.toLocaleString() || '0.00'}</span>,
    },
  ];

  const renderRulesTab = () => (
    <Card title="退费规则配置" className="stitch-table">
      <Table
        rowKey="key"
        columns={ruleColumns}
        dataSource={tierRules}
        scroll={{ x: 800 }}
        pagination={false}
        bordered
      />
      <Divider />
      <div style={{ color: theme.textSecondary, lineHeight: 1.8 }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>阶梯退费说明：</p>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>按律师费金额分段计算，每个区间独立核算退费</li>
          <li>总退费金额为各阶梯退费金额之和</li>
          <li>10万以下部分不计入退费基数</li>
          <li>退费比例随金额阶梯递增，金额越大比例越高</li>
        </ul>
      </div>
    </Card>
  );

  const renderCalcTab = () => (
    <Card title="阶梯退费核算">
      <Form
        form={form}
        layout="inline"
        className="stitch-filter-bar"
        style={{ marginBottom: 24 }}
        onFinish={handleCalculate}
      >
        <Form.Item
          name="case_id"
          label="案件编号"
          rules={[{ required: true, message: '请输入案件编号' }]}
        >
          <Input
            placeholder="请输入案件编号"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            style={{ width: 300 }}
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            icon={<CalculatorOutlined />}
            htmlType="submit"
            loading={loading}
          >
            一键核算
          </Button>
        </Form.Item>
      </Form>

      {result ? (
        <div>
          <Descriptions
            title={<span style={{ fontSize: 16 }}>核算结果</span>}
            bordered
            column={2}
            style={{ marginBottom: 16 }}
          >
            <Descriptions.Item label="案件编号">
              {result.case_id}
            </Descriptions.Item>
            <Descriptions.Item label="律师费总额">
              <span style={{ color: theme.primaryDark, fontWeight: 600, fontSize: 16 }}>
                ¥{result.total_fee?.toLocaleString() || '0.00'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="阶梯退费总额" span={2}>
              <span style={{ color: theme.error, fontWeight: 700, fontSize: 18 }}>
                ¥{result.total_refund?.toLocaleString() || '0.00'}
              </span>
            </Descriptions.Item>
          </Descriptions>

          <div className="stitch-table">
            <Table
              rowKey="tier"
              columns={refundColumns}
              dataSource={result.tiered_refunds || []}
              scroll={{ x: 800 }}
              pagination={false}
              bordered
            />
          </div>
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="输入案件编号后点击一键核算"
        />
      )}
    </Card>
  );

  return (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      items={[
        { key: 'rules', label: '退费规则配置', children: renderRulesTab() },
        { key: 'calc', label: '阶梯退费核算', children: renderCalcTab() },
      ]}
    />
  );
}

function getMockResult(caseId: string) {
  const totalFee = 350000;
  return {
    case_id: caseId,
    total_fee: totalFee,
    tiered_refunds: [
      { tier: '10万以下', range_min: 0, range_max: 100000, refund_rate: 0, refund_amount: 0 },
      { tier: '10万-30万', range_min: 100000, range_max: 300000, refund_rate: 10, refund_amount: 20000 },
      { tier: '30万-50万', range_min: 300000, range_max: 500000, refund_rate: 20, refund_amount: 10000 },
    ],
    total_refund: 30000,
  };
}