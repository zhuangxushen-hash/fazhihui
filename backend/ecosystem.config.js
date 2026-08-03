// PM2 进程管理配置
// 使用方式: pm2 start ecosystem.config.js
// 重启: pm2 restart fazhihui-prod / pm2 restart fazhihui-test
// 查看状态: pm2 status
// 查看日志: pm2 logs
// 停止全部: pm2 stop all
// 删除全部: pm2 delete all
//
// 部署路径说明（Linux）:
//   项目根目录: /home/ubuntu/fazhihui
//   后端目录: /home/ubuntu/fazhihui/backend
//   部署时将此文件放在 backend/ 目录下执行

module.exports = {
  apps: [
    // 生产后端
    {
      name: 'fazhihui-prod',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/prod-error.log',
      out_file: './logs/prod-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
    // 测试后端
    {
      name: 'fazhihui-test',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      error_file: './logs/test-error.log',
      out_file: './logs/test-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
