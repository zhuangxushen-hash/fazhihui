import { Component, ReactNode } from 'react';
import { theme } from '../constants/theme'
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// 全局错误边界组件，捕获子组件渲染异常，防止白屏
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary 捕获异常:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, color: '#1a1c1d', marginBottom: 8 }}>
            页面加载异常
          </h2>
          <p style={{ color: '#6e6e73', marginBottom: 16 }}>
            {this.state.error?.message || '发生未知错误'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 24px',
              borderRadius: 10,
              border: 'none',
              background: theme.primary,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
