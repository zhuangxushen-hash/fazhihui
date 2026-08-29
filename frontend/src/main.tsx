import { createRoot } from 'react-dom/client'
import { message } from 'antd'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import { bootstrapUrlToken } from './utils/tokenBootstrap'

// 全局消息配置：最多同时展示 2 条，避免拦截器和页面层重复提示堆叠
message.config({ maxCount: 2, duration: 3 })

// 小程序壳带 ?token= 进入时，渲染前建立 C 端登录态（必须在 React 渲染前执行，
// 否则路由守卫先跑、读到空 localStorage 就跳登录页了）
bootstrapUrlToken()

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
