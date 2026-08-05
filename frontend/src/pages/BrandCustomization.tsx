import { useState, useEffect } from 'react'
import { Card, Tabs, Form, Input, Select, Button, ColorPicker, Upload, message, Tag, Divider, Typography } from 'antd'
import { UploadOutlined, PictureOutlined, InfoCircleOutlined, FileTextOutlined, BulbOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import axios from '../api/axios'
import { theme } from '../constants/theme'
const { TabPane } = Tabs
const { Text, Title } = Typography

export default function BrandCustomization() {
  const [activeTab, setActiveTab] = useState('basic')
  const [brandConfig, setBrandConfig] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([])
  const [bannerFileList, setBannerFileList] = useState<UploadFile[]>([])
  const [faviconFileList, setFaviconFileList] = useState<UploadFile[]>([])
  const [primaryColor, setPrimaryColor] = useState<string>(theme.primary)
  const [secondaryColor, setSecondaryColor] = useState<string>(theme.brandGold)
  const [themeType, setThemeType] = useState('light')
  const [form] = Form.useForm()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchBrandConfig()
  }, [])

  const fetchBrandConfig = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/system/brand-configs/active') as Record<string, unknown>
      if (res) {
        setBrandConfig(res)
        setPrimaryColor((res.primary_color as string) || theme.primary)
        setSecondaryColor((res.secondary_color as string) || theme.brandGold)
        setThemeType((res.theme_type as string) || 'light')
        form.setFieldsValue(res)
      }
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBasic = async () => {
    try {
      const values = await form.validateFields()
      if (brandConfig) {
        await axios.put(`/system/brand-configs/${brandConfig.id}`, values)
        message.success('基础信息保存成功')
      } else {
        await axios.post('/system/brand-configs', { ...values, organization_id: user.organization_id })
        message.success('品牌配置创建成功')
      }
      fetchBrandConfig()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleSaveTheme = async () => {
    try {
      const payload = {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        theme_type: themeType,
        organization_id: user.organization_id,
      }
      if (brandConfig) {
        await axios.put(`/system/brand-configs/${brandConfig.id}`, payload)
        message.success('主题配色保存成功')
      } else {
        await axios.post('/system/brand-configs', { ...payload, brand_name: '默认品牌' })
        message.success('主题配色创建成功')
      }
      fetchBrandConfig()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleSaveLogo = async () => {
    try {
      const payload = {
        logo_url: logoFileList.length > 0 ? logoFileList[0].url || '' : brandConfig?.logo_url || '',
        favicon_url: faviconFileList.length > 0 ? faviconFileList[0].url || '' : brandConfig?.favicon_url || '',
        login_banner_url: bannerFileList.length > 0 ? bannerFileList[0].url || '' : brandConfig?.login_banner_url || '',
        organization_id: user.organization_id,
      }
      if (brandConfig) {
        await axios.put(`/system/brand-configs/${brandConfig.id}`, payload)
        message.success('LOGO配置保存成功')
      } else {
        await axios.post('/system/brand-configs', { ...payload, brand_name: '默认品牌' })
        message.success('LOGO配置创建成功')
      }
      fetchBrandConfig()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleSaveICP = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        copyright_text: values.copyright_text,
        icp_number: values.icp_number,
        organization_id: user.organization_id,
      }
      if (brandConfig) {
        await axios.put(`/system/brand-configs/${brandConfig.id}`, payload)
        message.success('备案信息保存成功')
      } else {
        await axios.post('/system/brand-configs', { ...payload, brand_name: '默认品牌' })
        message.success('备案信息创建成功')
      }
      fetchBrandConfig()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>品牌定制</h2>
        {brandConfig && <Tag className="stitch-tag stitch-tag-success">当前品牌：{brandConfig.brand_name}</Tag>}
      </div>

      <Card loading={loading} style={{ borderRadius: 12 }}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab={<span><InfoCircleOutlined /> 基础信息</span>} key="basic">
            <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
              <Form.Item label="品牌名称" name="brand_name" rules={[{ required: true, message: '请输入品牌名称' }]}>
                <Input placeholder="请输入品牌名称" />
              </Form.Item>
              <Form.Item label="状态" name="status">
                <Select>
                  <Select.Option value="active">启用</Select.Option>
                  <Select.Option value="inactive">停用</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={handleSaveBasic}>保存基础信息</Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab={<span><BulbOutlined /> 主题配色</span>} key="theme">
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: 300 }}>
                <Form layout="vertical" style={{ maxWidth: 400 }}>
                  <Form.Item label="主题类型">
                    <Select value={themeType} onChange={(v) => setThemeType(v)}>
                      <Select.Option value="light">浅色主题</Select.Option>
                      <Select.Option value="dark">深色主题</Select.Option>
                      <Select.Option value="custom">自定义主题</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="主色调">
                    <ColorPicker value={primaryColor} onChange={(color) => setPrimaryColor(color.toHexString())} showText />
                  </Form.Item>
                  <Form.Item label="辅助色">
                    <ColorPicker value={secondaryColor} onChange={(color) => setSecondaryColor(color.toHexString())} showText />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" onClick={handleSaveTheme}>保存主题配色</Button>
                  </Form.Item>
                </Form>
              </div>
              <div style={{ flex: '1', minWidth: 300 }}>
                <Card title="预览效果" size="small" style={{ background: themeType === 'dark' ? theme.textBase : theme.white }}>
                  <div style={{ padding: 20, textAlign: 'center' }}>
                    <div style={{
                      width: 80,
                      height: 80,
                      borderRadius: 16,
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      margin: '0 auto 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ color: theme.white, fontSize: 32, fontWeight: 'bold' }}>法</span>
                    </div>
                    <Title level={4} style={{ color: themeType === 'dark' ? theme.white : theme.textBase, marginBottom: 8 }}>
                      {brandConfig?.brand_name || '品牌名称'}
                    </Title>
                    <Text style={{ color: themeType === 'dark' ? 'rgba(255,255,255,0.6)' : theme.textTertiary }}>
                      智慧法律管理平台
                    </Text>
                    <Divider style={{ borderColor: themeType === 'dark' ? theme.textSecondary : theme.borderSecondary }} />
                    <Button type="primary" style={{ background: primaryColor }}>主色调按钮</Button>
                    <Button style={{ borderColor: secondaryColor, color: secondaryColor, marginLeft: 8 }}>辅助色按钮</Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabPane>

          <TabPane tab={<span><PictureOutlined /> LOGO设置</span>} key="logo">
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <Card title="LOGO上传" size="small" style={{ width: 280 }}>
                {brandConfig?.logo_url ? (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <img src={brandConfig.logo_url} alt="LOGO" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8 }} />
                  </div>
                ) : (
                  <div style={{
                    width: 120,
                    height: 120,
                    borderRadius: 12,
                    background: theme.bgSurfaceLow,
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.textQuaternary,
                    fontSize: 40,
                  }}>
                    <PictureOutlined />
                  </div>
                )}
                <Upload
                  listType="picture"
                  fileList={logoFileList}
                  onChange={({ fileList }) => setLogoFileList(fileList)}
                  beforeUpload={() => false}
                  maxCount={1}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />}>上传LOGO</Button>
                </Upload>
              </Card>

              <Card title="登录页横幅" size="small" style={{ width: 280 }}>
                {brandConfig?.login_banner_url ? (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <img src={brandConfig.login_banner_url} alt="Banner" style={{ maxWidth: 240, maxHeight: 120, borderRadius: 8 }} />
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: 120,
                    borderRadius: 12,
                    background: theme.bgSurfaceLow,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.textQuaternary,
                  }}>
                    <PictureOutlined style={{ fontSize: 40 }} />
                  </div>
                )}
                <Upload
                  listType="picture"
                  fileList={bannerFileList}
                  onChange={({ fileList }) => setBannerFileList(fileList)}
                  beforeUpload={() => false}
                  maxCount={1}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />}>上传横幅</Button>
                </Upload>
              </Card>

              <Card title="网站图标(Favicon)" size="small" style={{ width: 280 }}>
                {brandConfig?.favicon_url ? (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <img src={brandConfig.favicon_url} alt="Favicon" style={{ maxWidth: 64, maxHeight: 64, borderRadius: 8 }} />
                  </div>
                ) : (
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    background: theme.bgSurfaceLow,
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.textQuaternary,
                    fontSize: 24,
                  }}>
                    <PictureOutlined />
                  </div>
                )}
                <Upload
                  listType="picture"
                  fileList={faviconFileList}
                  onChange={({ fileList }) => setFaviconFileList(fileList)}
                  beforeUpload={() => false}
                  maxCount={1}
                  accept="image/x-icon,image/png"
                >
                  <Button icon={<UploadOutlined />}>上传图标</Button>
                </Upload>
              </Card>
            </div>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" onClick={handleSaveLogo}>保存LOGO配置</Button>
            </div>
          </TabPane>

          <TabPane tab={<span><FileTextOutlined /> 备案信息</span>} key="icp">
            <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
              <Form.Item label="版权信息" name="copyright_text">
                <Input.TextArea rows={3} placeholder="例如: Copyright 2024 法智汇. All rights reserved." />
              </Form.Item>
              <Form.Item label="ICP备案号" name="icp_number">
                <Input placeholder="例如: 京ICP备12345678号-1" />
              </Form.Item>
              <Form.Item label="公安备案号" name="police_icp">
                <Input placeholder="例如: 京公网安备11010802012345号" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={handleSaveICP}>保存备案信息</Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}
