import { useState, useEffect } from 'react';
import { Card, Table, Button, Input, DatePicker, Row, Col, Statistic, Tag, Space, message, Descriptions, Divider, Select, Tabs } from 'antd';
import { SearchOutlined, BarChartOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { getCaseProfitAnalysis, getProfitStats } from '../api/finance';
import { formatDate } from '../utils/format';
import { theme } from '../constants/theme';
// V3.2 合并：项目收入明细（原独立页 ProjectRevenueOverview）并入单案利润分析
import ProjectRevenueOverview from './ProjectRevenueOverview';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function CaseProfitAnalysis() {
  const [loading, setLoading] = useState(false);
  const [caseId, setCaseId] = useState('');
  const [caseType, setCaseType] = useState<string | undefined>(undefined);
  const [profitAnalysis, setProfitAnalysis] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<any>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getProfitStats(user.organization_id);
      setStats(data || {});
    } catch (error) {
      setStats(getMockStats());
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!caseId.trim()) {
      message.warning('请输入案件编号');
      return;
    }
    setLoading(true);
    try {
      const data = await getCaseProfitAnalysis(caseId.trim());
      setProfitAnalysis(data);
      message.success('利润分析完成');
    } catch (error) {
      setProfitAnalysis(getMockAnalysis(caseId.trim()));
      message.success('利润分析完成（模拟数据）');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchList = () => {
    const mockList = getMockCaseList();
    let filtered = mockList;
    if (caseType) {
      filtered = filtered.filter(item => item.case_type === caseType);
    }
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].format('YYYY-MM-DD');
      const end = dateRange[1].format('YYYY-MM-DD');
      filtered = filtered.filter(item => item.date >= start && item.date <= end);
    }
    setSearchResults(filtered);
  };

  const columns = [
    {
      title: '案件编号',
      dataIndex: 'case_id',
      key: 'case_id',
      render: (val: string) => <a onClick={() => { setCaseId(val); setProfitAnalysis(null); handleSearch(); }}>{val}</a>,
    },
    {
      title: '案由',
      dataIndex: 'case_type',
      key: 'case_type',
      render: (val: string) => <Tag className="stitch-tag stitch-tag-primary">{getCaseTypeLabel(val)}</Tag>,
    },
    {
      title: '律师费',
      dataIndex: 'fee',
      key: 'fee',
      render: (val: number) => <span style={{ color: theme.primaryDark, fontWeight: 500 }}>¥{val.toLocaleString()}</span>,
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      render: (val: number) => <span style={{ color: theme.warning }}>¥{val.toLocaleString()}</span>,
    },
    {
      title: '分润',
      dataIndex: 'profit_share',
      key: 'profit_share',
      render: (val: number) => <span style={{ color: theme.textTertiary }}>¥{val.toLocaleString()}</span>,
    },
    {
      title: '净利润',
      dataIndex: 'net_profit',
      key: 'net_profit',
      render: (val: number) => (
        <span style={{ color: val >= 0 ? theme.success : theme.error, fontWeight: 600 }}>
          {val >= 0 ? <RiseOutlined /> : <FallOutlined />} ¥{Math.abs(val).toLocaleString()}
        </span>
      ),
    },
    {
      title: '利润率',
      dataIndex: 'profit_margin',
      key: 'profit_margin',
      render: (val: number) => (
        <Tag className={val >= 30 ? 'stitch-tag stitch-tag-success' : val >= 10 ? 'stitch-tag stitch-tag-warning' : 'stitch-tag stitch-tag-error'}>
          {val}%
        </Tag>
      ),
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (val: string) => formatDate(val),
    },
  ];

  const feeDetailColumns = [
    { title: '律师费ID', dataIndex: 'id', key: 'id', width: 200 },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${v?.toLocaleString()}` },
    { title: '说明', dataIndex: 'description', key: 'description', render: (v: string) => v || '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDate(v) },
  ];

  const costDetailColumns = [
    { title: '成本ID', dataIndex: 'id', key: 'id', width: 200 },
    { title: '成本类型', dataIndex: 'cost_type', key: 'cost_type', render: (v: string) => getCostTypeLabel(v) },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${v?.toLocaleString()}` },
    { title: '说明', dataIndex: 'description', key: 'description', render: (v: string) => v || '-' },
  ];

  const profitShareColumns = [
    { title: '分润ID', dataIndex: 'id', key: 'id', width: 200 },
    { title: '角色', dataIndex: 'role', key: 'role', render: (v: string) => getRoleLabel(v) },
    { title: '比例', dataIndex: 'percentage', key: 'percentage', render: (v: number) => `${v}%` },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${v?.toLocaleString()}` },
  ];

  return (
    <div>
      {/* V3.2 合并：单案利润分析 + 项目收入明细 */}
      <Tabs
        defaultActiveKey="profit"
        items={[
          {
            key: 'profit',
            label: '单案利润分析',
            children: (
              <>
      {/* 利润概览卡片 */}
      {stats && (
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
              <Statistic
                title={<span style={{ color: theme.textSecondary }}>总收入</span>}
                value={stats.total_revenue}
                precision={2}
                prefix="¥"
                valueStyle={{ color: theme.primaryDark, fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' }}>
              <Statistic
                title={<span style={{ color: theme.textSecondary }}>总成本</span>}
                value={stats.total_cost}
                precision={2}
                prefix="¥"
                valueStyle={{ color: theme.warning, fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' }}>
              <Statistic
                title={<span style={{ color: theme.textSecondary }}>总利润</span>}
                value={stats.total_profit}
                precision={2}
                prefix="¥"
                valueStyle={{ color: theme.success, fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
              <Statistic
                title={<span style={{ color: theme.textSecondary }}>利润率</span>}
                value={stats.average_profit_margin}
                precision={2}
                suffix="%"
                valueStyle={{ color: '#6a1b9a', fontWeight: 600 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索条件 */}
      <Card title="利润分析查询" className="stitch-filter-bar" style={{ marginBottom: 24 }}>
        <Space wrap>
          <Input
            placeholder="案件编号"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="案由"
            allowClear
            style={{ width: 150 }}
            value={caseType}
            onChange={setCaseType}
          >
            <Option value="marriage">婚姻家事</Option>
            <Option value="traffic">交通事故</Option>
            <Option value="labor">劳动争议</Option>
            <Option value="debt">债权债务</Option>
            <Option value="other">其他</Option>
          </Select>
          <RangePicker
            onChange={(dates: any) => setDateRange(dates)}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearchList}
          >
            搜索
          </Button>
        </Space>
      </Card>

      {/* 案件列表表格 */}
      <Card title="案件利润明细" style={{ marginBottom: 24 }}>
        <div className="stitch-table">
          <Table
            rowKey="case_id"
            columns={columns}
            dataSource={searchResults.length > 0 ? searchResults : getMockCaseList()}
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1200 }}
          />
        </div>
      </Card>

      {/* 单案利润分析详情 */}
      {profitAnalysis && (
        <Card
          title={
            <span>
              <BarChartOutlined style={{ marginRight: 8 }} />
              单案利润分析 - {profitAnalysis.case_id}
            </span>
          }
          extra={
            <Button onClick={() => setProfitAnalysis(null)}>关闭</Button>
          }
        >
          <Descriptions bordered column={3} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="案件编号">{profitAnalysis.case_id}</Descriptions.Item>
            <Descriptions.Item label="总收入">
              <span style={{ color: theme.primaryDark, fontWeight: 600 }}>¥{profitAnalysis.total_revenue?.toLocaleString()}</span>
            </Descriptions.Item>
            <Descriptions.Item label="总成本">
              <span style={{ color: theme.warning }}>¥{profitAnalysis.total_cost?.toLocaleString()}</span>
            </Descriptions.Item>
            <Descriptions.Item label="分润总额">
              ¥{profitAnalysis.total_profit_share?.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="净利润">
              <span style={{ color: profitAnalysis.net_profit >= 0 ? theme.success : theme.error, fontWeight: 700, fontSize: 16 }}>
                ¥{profitAnalysis.net_profit?.toLocaleString()}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="利润率">
              <Tag className={profitAnalysis.profit_margin >= 30 ? 'stitch-tag stitch-tag-success' : profitAnalysis.profit_margin >= 10 ? 'stitch-tag stitch-tag-warning' : 'stitch-tag stitch-tag-error'}>
                {profitAnalysis.profit_margin}%
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Divider plain>收入明细</Divider>
          <div className="stitch-table">
            <Table
              rowKey="id"
              columns={feeDetailColumns}
              dataSource={profitAnalysis.fee_details || []}
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
            />
          </div>

          <Divider plain>成本明细</Divider>
          <div className="stitch-table">
            <Table
              rowKey="id"
              columns={costDetailColumns}
              dataSource={profitAnalysis.cost_details || []}
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
            />
          </div>

          <Divider plain>分润明细</Divider>
          <div className="stitch-table">
            <Table
              rowKey="id"
              columns={profitShareColumns}
              dataSource={profitAnalysis.profit_share_details || []}
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
            />
          </div>
        </Card>
      )}
              </>
            ),
          },
          {
            key: 'revenue',
            label: '项目收入明细',
            children: <ProjectRevenueOverview />,
          },
        ]}
      />
    </div>
  );
}

function getCaseTypeLabel(type: string): string {
  const map: Record<string, string> = {
    marriage: '婚姻家事',
    traffic: '交通事故',
    labor: '劳动争议',
    debt: '债权债务',
    other: '其他',
  };
  return map[type] || type;
}

function getCostTypeLabel(type: string): string {
  const map: Record<string, string> = {
    marketing: '投放成本',
    labor: '人力成本',
    case_handling: '办案成本',
    other: '其他',
  };
  return map[type] || type;
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    org: '律所',
    lawyer: '律师',
    sales: '销售',
    marketing: '投放',
    assistant: '助理',
  };
  return map[role] || role;
}

function getMockStats() {
  return {
    total_revenue: 2580000,
    total_cost: 1250000,
    total_profit: 1330000,
    average_profit_margin: 51.55,
    case_count: 85,
    profitable_cases: 72,
    loss_cases: 13,
  };
}

function getMockAnalysis(caseId: string) {
  return {
    case_id: caseId,
    total_revenue: 85000,
    total_cost: 32000,
    total_profit_share: 25000,
    net_profit: 28000,
    profit_margin: 32.94,
    fee_details: [
      { id: 'f1', amount: 50000, description: '一审律师费', created_at: '2025-03-15T10:00:00Z' },
      { id: 'f2', amount: 35000, description: '二审律师费', created_at: '2025-05-20T14:00:00Z' },
    ],
    cost_details: [
      { id: 'c1', cost_type: 'marketing', amount: 15000, description: '抖音投放', created_at: '2025-02-01' },
      { id: 'c2', cost_type: 'case_handling', amount: 8000, description: '诉讼费、鉴定费', created_at: '2025-04-10' },
      { id: 'c3', cost_type: 'labor', amount: 9000, description: '办案人员工资分摊', created_at: '2025-06-01' },
    ],
    profit_share_details: [
      { id: 'ps1', role: 'org', percentage: 30, amount: 25500 },
      { id: 'ps2', role: 'lawyer', percentage: 40, amount: 34000 },
      { id: 'ps3', role: 'sales', percentage: 15, amount: 12750 },
      { id: 'ps4', role: 'marketing', percentage: 10, amount: 8500 },
      { id: 'ps5', role: 'assistant', percentage: 5, amount: 4250 },
    ],
  };
}

function getMockCaseList() {
  return [
    { case_id: 'CASE-2025-001', case_type: 'marriage', fee: 85000, cost: 32000, profit_share: 25000, net_profit: 28000, profit_margin: 32.94, date: '2025-06-01' },
    { case_id: 'CASE-2025-002', case_type: 'traffic', fee: 120000, cost: 45000, profit_share: 36000, net_profit: 39000, profit_margin: 32.50, date: '2025-06-05' },
    { case_id: 'CASE-2025-003', case_type: 'labor', fee: 45000, cost: 22000, profit_share: 13500, net_profit: 9500, profit_margin: 21.11, date: '2025-06-10' },
    { case_id: 'CASE-2025-004', case_type: 'debt', fee: 250000, cost: 80000, profit_share: 75000, net_profit: 95000, profit_margin: 38.00, date: '2025-06-15' },
    { case_id: 'CASE-2025-005', case_type: 'marriage', fee: 60000, cost: 35000, profit_share: 18000, net_profit: 7000, profit_margin: 11.67, date: '2025-06-20' },
    { case_id: 'CASE-2025-006', case_type: 'other', fee: 35000, cost: 28000, profit_share: 10500, net_profit: -3500, profit_margin: -10.00, date: '2025-06-25' },
  ];
}
