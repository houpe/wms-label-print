// PM2 进程配置 - wms-label 面单打印
// 使用方式：
//   首次部署： pm2 start ecosystem.config.cjs
//   后续更新： pm2 reload ecosystem.config.cjs   (零停机重启)
//   pm2 save                                         (持久化，开机自启)
//   pm2 startup                                      (生成开机自启命令，按提示执行)

module.exports = {
  apps: [
    {
      name: 'wms-label',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 3008,
      },
      // 实例数；保持 1 即可（前面有 Nginx，且用到本地 SQLite 文件）
      instances: 1,
      exec_mode: 'fork',
      // 零停机：reload 用 graceful 模式，先起新进程再关旧进程
      wait_ready: true,
      listen_timeout: 10000,
      shutdown_with_message: false,
      kill_timeout: 5000,
      // 自动重启与日志
      autorestart: true,
      max_restarts: 10,
      error_file: './logs/wms-label-error.log',
      out_file: './logs/wms-label-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
