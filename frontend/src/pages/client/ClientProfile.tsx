import { useState } from 'react'
import { Modal, message } from 'antd'
import {
  FolderOutlined,
  BellOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  RightOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'

/** 菜单组1 */
const MENU_GROUP_1 = [
  { label: '我的案件', icon: FolderOutlined, path: '/client/cases' },
  // { label: '我的支付', icon: CreditCardOutlined, path: '/client/payment' }, // 功能暂未上线，暂时隐藏
]

/** 菜单组2 */
const MENU_GROUP_2 = [
  { label: '消息通知', icon: BellOutlined, path: '/client/notifications' },
  { label: '设置', icon: SettingOutlined, path: '' },
  { label: '关于我们', icon: InfoCircleOutlined, path: '' },
]

export default function ClientProfile() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')
  const [logoutModalVisible, setLogoutModalVisible] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('client_token')
    localStorage.removeItem('client_user')
    message.success('已退出登录')
    navigate('/client/login')
  }

  const handleMenuClick = (item: { label: string; path: string }) => {
    if (item.path) {
      navigate(item.path)
    } else {
      message.info(`${item.label} 功能开发中`)
    }
  }

  /** 渲染菜单分组 */
  const renderMenuGroup = (items: typeof MENU_GROUP_1) => (
    <div
      style={{
        borderRadius: 16,
        background: '#FFFFFF',
        padding: '8px 16px',
        marginBottom: 16,
      }}
    >
      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            onClick={() => handleMenuClick(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              height: 52,
              cursor: 'pointer',
              borderTop: index === 0 ? 'none' : '1px solid #F1F5F9',
            }}
          >
            <Icon style={{ fontSize: 20, color: '#1E3A8A' }} />
            <span style={{ flex: 1, fontSize: 15, color: '#0F172A' }}>{item.label}</span>
            <RightOutlined style={{ fontSize: 12, color: '#94A3B8' }} />
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="client-app">
      <main
        className="c-container--with-nav"
        style={{ maxWidth: 480, margin: '0 auto', width: '100%', padding: '16px 16px 88px' }}
      >
        {/* ===== 用户信息卡 ===== */}
        <section
          style={{
            borderRadius: 20,
            padding: 24,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'linear-gradient(135deg, #1B2F63 0%, #1E3A8A 60%, #2547A0 100%)',
            boxShadow: '0 8px 24px rgba(30, 58, 138, 0.25)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 500,
              color: '#1E3A8A',
              flexShrink: 0,
            }}
          >
            {(user.real_name || '客').slice(0, 1)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF' }}>
              {user.real_name || '客户'}
            </div>
            <div style={{ fontSize: 13, color: '#C7D2E8', marginTop: 4 }}>
              {user.phone
                ? `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}`
                : '未绑定手机号'}
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: 6,
                padding: '3px 10px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 500,
                background: '#FEF3C7',
                color: '#B45309',
              }}
            >
              普通会员
            </span>
          </div>
        </section>

        {/* ===== 菜单组1 ===== */}
        {renderMenuGroup(MENU_GROUP_1)}

        {/* ===== 菜单组2 ===== */}
        {renderMenuGroup(MENU_GROUP_2)}

        {/* ===== 联系客服 ===== */}
        <div
          onClick={() => navigate('/client/complaint')}
          style={{
            height: 48,
            borderRadius: 12,
            background: '#1E3A8A',
            color: '#FFFFFF',
            fontSize: 15,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(30, 58, 138, 0.25)',
          }}
        >
          联系客服
        </div>

        {/* ===== 退出登录 ===== */}
        <div
          onClick={() => setLogoutModalVisible(true)}
          style={{
            marginTop: 16,
            textAlign: 'center',
            fontSize: 14,
            color: '#DC2626',
            cursor: 'pointer',
            padding: '12px 0',
          }}
        >
          <LogoutOutlined style={{ marginRight: 6 }} />
          退出登录
        </div>
      </main>

      {/* 退出确认弹窗 */}
      <Modal
        title="确认退出"
        open={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        onOk={handleLogout}
        okText="确认退出"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p style={{ margin: '16px 0', fontSize: 15, color: 'var(--cm-text)' }}>
          确定要退出登录吗？退出后需要重新登录才能使用。
        </p>
      </Modal>

      <BottomNav />
    </div>
  )
}
