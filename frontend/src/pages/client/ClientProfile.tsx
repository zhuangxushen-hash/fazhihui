// C端个人中心页面
// 功能：展示用户信息、功能菜单入口、退出登录操作
import { useState } from 'react'
import { UserOutlined, LogoutOutlined, RightOutlined, FileTextOutlined, MessageOutlined, CreditCardOutlined, BellOutlined, SafetyOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'

export default function ClientProfile() {
  // 路由导航钩子
  const navigate = useNavigate()
  // 退出登录确认弹窗显示状态
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // 从本地存储获取用户信息
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  // 执行退出登录操作
  const handleLogout = () => {
    // 清除本地存储的token和用户信息
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // 使用replace跳转，防止退出后返回上一页
    navigate('/login', { replace: true })
  }

  // 功能菜单分组配置
  // 第一组：业务功能入口
  // 第二组：设置相关入口
  const menuGroups = [
    {
      items: [
        { icon: FileTextOutlined, label: '我的案件', onClick: () => navigate('/client') },
        { icon: MessageOutlined, label: '我的咨询', onClick: () => navigate('/client/ai-consult') },
        { icon: BellOutlined, label: '我的投诉', onClick: () => navigate('/client/complaint') },
        { icon: CreditCardOutlined, label: '签约付款', onClick: () => navigate('/client/payment') },
      ],
    },
    {
      items: [
        { icon: SafetyOutlined, label: '隐私与安全', onClick: () => {} },
      ],
    },
  ]

  return (
    // 页面主容器 - 渐变背景
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f5f5f7 0%, #fafafa 100%)',
        // 底部预留底部导航栏空间
        paddingBottom: 100,
      }}
    >
      {/* 顶部用户信息卡片 - 蓝色渐变背景 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0071e3 0%, #00a8ff 100%)',
          padding: '60px 20px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 装饰性圆形元素 */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
          }}
        />
        {/* 用户头像和信息区域 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          {/* 用户头像 */}
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <UserOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          {/* 用户名称和手机号 */}
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {user?.name || user?.phone || '用户'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)' }}>
              {user?.phone || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* 功能菜单列表区域 */}
      <div style={{ padding: '20px 16px 0' }}>
        {/* 遍历菜单分组 */}
        {menuGroups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderRadius: 16,
              marginBottom: 12,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* 遍历分组内的菜单项 */}
            {group.items.map((item, itemIndex) => (
              <div key={itemIndex}>
                {/* 单个菜单项 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'background 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onClick={item.onClick}
                  // 触摸按下时的视觉反馈
                  onTouchStart={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'
                  }}
                  // 触摸结束时恢复
                  onTouchEnd={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {/* 菜单项图标容器 */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(0, 113, 227, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <item.icon style={{ fontSize: 16, color: '#0071e3' }} />
                  </div>
                  {/* 菜单项文字 */}
                  <span style={{ flex: 1, fontSize: 15, color: '#1d1d1f', fontWeight: 500 }}>
                    {item.label}
                  </span>
                  {/* 右侧箭头 */}
                  <RightOutlined style={{ fontSize: 12, color: '#c7c7cc' }} />
                </div>
                {/* 分割线 - 最后一项不显示 */}
                {itemIndex < group.items.length - 1 && (
                  <div style={{ height: 1, background: 'rgba(0, 0, 0, 0.04)', marginLeft: 60 }} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 退出登录按钮区域 */}
      <div style={{ padding: '12px 16px 0' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* 退出登录按钮 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'background 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              WebkitTapHighlightColor: 'transparent',
            }}
            onClick={() => setShowLogoutConfirm(true)}
            // 触摸按下时的红色背景反馈
            onTouchStart={(e) => {
              e.currentTarget.style.background = 'rgba(255, 59, 48, 0.05)'
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <LogoutOutlined style={{ fontSize: 16, color: '#ff3b30', marginRight: 8 }} />
            <span style={{ fontSize: 15, color: '#ff3b30', fontWeight: 500 }}>退出登录</span>
          </div>
        </div>
      </div>

      {/* 退出登录确认弹窗 */}
      {showLogoutConfirm && (
        // 遮罩层
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out',
          }}
          // 点击遮罩层关闭弹窗
          onClick={() => setShowLogoutConfirm(false)}
        >
          {/* 弹窗内容 */}
          <div
            style={{
              width: '80%',
              maxWidth: 280,
              background: '#fff',
              borderRadius: 20,
              padding: 24,
              animation: 'scaleIn 0.2s ease-out',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            }}
            // 阻止冒泡，避免点击弹窗内容时关闭
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center' }}>
              {/* 警告图标 */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(255, 59, 48, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <LogoutOutlined style={{ fontSize: 24, color: '#ff3b30' }} />
              </div>
              {/* 确认提示文字 */}
              <div style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>确认退出登录？</div>
              <div style={{ fontSize: 13, color: '#86868b', marginBottom: 24 }}>退出后您需要重新登录才能访问账户</div>
              {/* 取消和确认按钮 */}
              <div style={{ display: 'flex', gap: 10 }}>
                {/* 取消按钮 */}
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 12,
                    border: 'none',
                    background: '#f5f5f7',
                    color: '#1d1d1f',
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                  onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  取消
                </button>
                {/* 确认退出按钮 */}
                <button
                  onClick={handleLogout}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 12,
                    border: 'none',
                    background: '#ff3b30',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                  onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  确认退出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* 底部导航栏 */}
      <BottomNav />
    </div>
  )
}
