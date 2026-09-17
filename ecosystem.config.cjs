module.exports = {
  apps: [
    {
      name: "iced-tea-house",
      script: "node_modules/.bin/next",
      args: "start -p 3111",
      cwd: "/var/www/iced-tea-house",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3111,
      },
    },
  ],
};
