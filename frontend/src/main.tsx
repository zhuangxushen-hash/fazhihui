import { createRoot } from 'react-dom/client'
import { message } from 'antd'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'

// 全局消息配置：最多同时展示 2 条，避免拦截器和页面层重复提示堆叠
message.config({ maxCount: 2, duration: 3 })

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
