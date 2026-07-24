import { useState } from 'react';
import { Tabs, Form, Input, Select, Button, message, Card } from 'antd';
import { CopyOutlined, CheckCircleOutlined, RobotOutlined } from '@ant-design/icons';
import axios from '../api/axios';

export default function AITools() {
  const [activeTab, setActiveTab] = useState('marketing');
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);

  const caseTypes = [
    { value: 'marriage', label: '婚姻家事' },
    { value: 'traffic', label: '交通事故' },
    { value: 'labor', label: '劳动纠纷' },
    { value: 'debt', label: '债务纠纷' },
    ];

  const platforms = [
    { value: 'douyin', label: '抖音' },
    { value: 'baidu', label: '百度' },
    { value: 'wechat', label: '微信' },
    ];

  const documentTypes = [
    { value: 'complaint', label: '民事起诉状' },
    { value: 'appeal', label: '民事上诉状' },
    { value: 'response', label: '民事答辩状' },
    { value: 'evidence', label: '证据清单' },
    { value: 'retainer', label: '委托代理合同' },
    ];

  const handleGenerateCopy = async (values: any) => {
    setLoading(true);
    try {
      const res = await axios.post('/ai/marketing/copy', {
        prompt: values.prompt,
        case_type: values.case_type,
        platform: values.platform,
      });
      setGeneratedContent(res.content);
      message.success('内容生成成功');
    } catch (error) {
      message.error('生成失败');
      console.error('Generate copy error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScript = async (values: any) => {
    setLoading(true);
    try {
      const res = await axios.post('/ai/marketing/script', {
        prompt: values.prompt,
        case_type: values.case_type,
      });
      setGeneratedContent(res.script);
      message.success('脚本生成成功');
    } catch (error) {
      message.error('生成失败');
      console.error('Generate script error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocument = async (values: any) => {
    setLoading(true);
    try {
      const res = await axios.post('/ai/legal/document', {
        type: values.doc_type,
        data: {
          plaintiff_name: values.plaintiff_name,
          plaintiff_gender: values.plaintiff_gender,
          plaintiff_address: values.plaintiff_address,
          plaintiff_phone: values.plaintiff_phone,
          defendant_name: values.defendant_name,
          defendant_gender: values.defendant_gender,
          defendant_address: values.defendant_address,
          defendant_phone: values.defendant_phone,
          claims: values.claims?.split('\n'),
          facts: values.facts,
          court: values.court,
          case_name: values.case_name,
          case_no: values.case_no,
          evidence_count: values.evidence_count,
        },
      });
      setGeneratedContent(res.document);
      message.success('文书生成成功');
    } catch (error) {
      message.error('生成失败');
      console.error('Generate document error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      message.success('已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RobotOutlined style={{ fontSize: 20, color: 'var(--primary)' }} />
          AI智能工具
        </h2>
      </div>
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'marketing',
            label: '营销内容生成',
            children: (
              <Tabs defaultActiveKey="copy" items={[
                {
                  key: 'copy',
                  label: '文案生成',
                  children: (
                    <Card>
                      <Form layout="vertical" onFinish={handleGenerateCopy}>
                        <Form.Item name="prompt" label="生成主题" rules={[{ required: true }]}
                          tooltip="描述您想要的营销文案主题和方向"
                        >
                          <Input.TextArea placeholder="请输入想要生成的文案主题，例如：离婚财产分割注意事项" rows={3} />
                        </Form.Item>
                        <Form.Item name="case_type" label="案由类型">
                          <Select placeholder="请选择案由类型">
                            {caseTypes.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
                          </Select>
                        </Form.Item>
                        <Form.Item name="platform" label="发布平台">
                          <Select placeholder="请选择发布平台">
                            {platforms.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
                          </Select>
                        </Form.Item>
                        <Form.Item>
                          <Button type="primary" htmlType="submit" loading={loading}>生成文案</Button>
                        </Form.Item>
                      </Form>
                    </Card>
                  ),
                },
                {
                  key: 'script',
                  label: '视频脚本',
                  children: (
                    <Card>
                      <Form layout="vertical" onFinish={handleGenerateScript}>
                        <Form.Item name="prompt" label="脚本主题" rules={[{ required: true }]}
                          tooltip="描述您想要的视频脚本主题"
                        >
                          <Input.TextArea placeholder="请输入视频脚本主题，例如：交通事故理赔流程" rows={3} />
                        </Form.Item>
                        <Form.Item name="case_type" label="案由类型">
                          <Select placeholder="请选择案由类型">
                            {caseTypes.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
                          </Select>
                        </Form.Item>
                        <Form.Item>
                          <Button type="primary" htmlType="submit" loading={loading}>生成脚本</Button>
                        </Form.Item>
                      </Form>
                    </Card>
                  ),
                },
              ]} />
            ),
          },
          {
            key: 'legal',
            label: '法律文书生成',
            children: (
          <Card>
            <Form layout="vertical" onFinish={handleGenerateDocument}>
              <Form.Item name="doc_type" label="文书类型" rules={[{ required: true }]}
                tooltip="选择需要生成的法律文书类型"
              >
                <Select placeholder="请选择文书类型">
                  {documentTypes.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
                </Select>
              </Form.Item>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="plaintiff_name" label="原告姓名">
                  <Input placeholder="原告姓名" />
                </Form.Item>
                <Form.Item name="plaintiff_gender" label="原告性别">
                  <Select placeholder="请选择">
                    <Select.Option value="男">男</Select.Option>
                    <Select.Option value="女">女</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="plaintiff_address" label="原告住址">
                  <Input placeholder="原告住址" />
                </Form.Item>
                <Form.Item name="plaintiff_phone" label="原告电话">
                  <Input placeholder="原告电话" />
                </Form.Item>
                <Form.Item name="defendant_name" label="被告姓名">
                  <Input placeholder="被告姓名" />
                </Form.Item>
                <Form.Item name="defendant_gender" label="被告性别">
                  <Select placeholder="请选择">
                    <Select.Option value="男">男</Select.Option>
                    <Select.Option value="女">女</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="defendant_address" label="被告住址">
                  <Input placeholder="被告住址" />
                </Form.Item>
                <Form.Item name="defendant_phone" label="被告电话">
                  <Input placeholder="被告电话" />
                </Form.Item>
                <Form.Item name="case_name" label="案件名称">
                  <Input placeholder="案件名称" />
                </Form.Item>
                <Form.Item name="case_no" label="案号">
                  <Input placeholder="案号" />
                </Form.Item>
                <Form.Item name="court" label="法院名称">
                  <Input placeholder="法院名称" />
                </Form.Item>
                <Form.Item name="evidence_count" label="证据数量">
                  <Input placeholder="证据数量" />
                </Form.Item>
              </div>
              <Form.Item name="claims" label="诉讼请求">
                <Input.TextArea placeholder="请输入诉讼请求，每行一条" rows={3} />
              </Form.Item>
              <Form.Item name="facts" label="事实与理由">
                <Input.TextArea placeholder="请输入事实与理由" rows={4} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>生成文书</Button>
              </Form.Item>
            </Form>
          </Card>
              ),
          },
        ]} />

      {generatedContent && (
        <Card title="生成结果" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Button 
              icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />} 
              onClick={handleCopy}
              type={copied ? 'primary' : 'default'}
            >
              {copied ? '已复制' : '复制内容'}
            </Button>
          </div>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-all', 
            maxHeight: '500px', 
            overflow: 'auto',
            background: 'var(--bg-sunken)',
            border: '1px solid var(--border-light)',
            borderRadius: 6,
            padding: 16,
            fontSize: 13,
            lineHeight: 1.8,
            color: 'var(--text-primary)',
            margin: 0,
          }}>
            {generatedContent}
          </pre>
        </Card>
      )}
    </div>
  );
}