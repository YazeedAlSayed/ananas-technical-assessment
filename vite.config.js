// Vite configuration for running this Angular app through an ngrok domain
// Note:
// - This project uses Angular CLI by default (ng serve).
// - This file is provided to "prepare the app to use ngrok" when serving with Vite.
// - If you continue using Angular CLI, you can simply run:
//     ng serve
//     ngrok http 4200
//   and open the provided ngrok URL.
// - If you choose to serve with Vite in the future, this config will allow the ngrok host.

const { defineConfig } = require('vite');

// You can set NGROK_HOST as an environment variable to avoid editing this file each time.
// Example PowerShell (Windows): $env:NGROK_HOST = "your-subdomain.ngrok-free.app"
// Example Bash: export NGROK_HOST=your-subdomain.ngrok-free.app
const ENV_NGROK_HOST = process.env.NGROK_HOST;
const NGROK_HOST = (ENV_NGROK_HOST && ENV_NGROK_HOST.replace(/^https?:\/\//, '')) || "6ebcd4c9250a.ngrok-free.app";

module.exports = defineConfig({
  server: {
    port: 4200,
    open: true,
    // Allow dev-server requests from localhost and any *.ngrok-free.app (plus explicit NGROK_HOST)
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      NGROK_HOST,
      // Predicate form: allow any *.ngrok-free.app host during development
      { match: (host) => /(^|\.)ngrok-free\.app$/i.test(host) }
    ],
    hmr: {
      host: NGROK_HOST
    }
  }
});
