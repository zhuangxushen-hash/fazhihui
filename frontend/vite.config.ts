import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 根据环境变量决定端口和后端代理目标
// 测试环境(NODE_ENV=development): 前端 5173 -> 后端 3000
// 生产环境(NODE_ENV=production):  前端 5174 -> 后端 3001
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = env.NODE_ENV === 'production'
  const frontendPort = Number(env.FRONTEND_PORT) || (isProd ? 5174 : 5173)
  const backendPort = Number(env.BACKEND_PORT) || (isProd ? 3001 : 3000)

  return {
    plugins: [react({
      jsxRuntime: 'automatic',
    })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // 输出目录可由环境变量 BUILD_OUTDIR 覆盖（用于 test/prod 双构建分离），
    // 默认仍是 dist，手动 npm run build 行为不变。
    build: {
      outDir: process.env.BUILD_OUTDIR || 'dist',
    },
    server: {
      port: frontendPort,
      strictPort: true, // 端口被占用时直接报错，避免端口漂移导致环境混淆
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
          host: '127.0.0.1',
        },
      },
    },
  }
})
