module.exports = {
  apps: [{
    name: 'gym-system-api',
    script: './dist/server.js',
    cwd: '/var/www/gym-system/Desafio-Relampago-Grupo5',
    
    // Modo de execução
    instances: 1,
    exec_mode: 'fork',
    
    // Variáveis de ambiente
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Logs (usando diretório padrão do PM2)
    error_file: '~/.pm2/logs/gym-system-api-error.log',
    out_file: '~/.pm2/logs/gym-system-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Auto-restart e monitoramento
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    // Controle de restarts
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100,
    
    // Kill timeout
    kill_timeout: 5000,
    
    // Configurações adicionais
    listen_timeout: 5000,
    shutdown_with_message: false,
    
    // Source map support
    source_map_support: true,
    
    // Tratamento de exceções
    ignore_watch: ['node_modules', 'logs', '*.log', 'academia.db'],
    
    // Cron restart (opcional - reinicia todo dia às 3h da manhã)
    // cron_restart: '0 3 * * *',
  }]
};
