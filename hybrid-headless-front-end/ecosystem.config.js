module.exports = {
  apps: [{
    name: 'hybrid-headless-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    env: {
      PORT: 3000,
      NODE_ENV: 'production',
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
};
