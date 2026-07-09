export default {
    apps: [{
        name: 'arise-backend',
        script: '/var/www/arise/backend/server.js',
        cwd: '/var/www/arise/backend',
        instances: 1,
        exec_mode: 'fork',
        env: {
            NODE_ENV: 'production',
            PORT: 3005
        },
        error_file: '/var/log/pm2/arise-error.log',
        out_file: '/var/log/pm2/arise-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        autorestart: true,
        max_restarts: 10,
        min_uptime: '10s',
        max_memory_restart: '500M',
        watch: false
    }]
};