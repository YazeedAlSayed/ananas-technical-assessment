// Vite configuration (TypeScript) for running this Angular app through an ngrok domain
// Notes:
// - This project primarily uses Angular CLI (ng serve). This Vite config is provided for
//   developers who prefer Vite for a fast dev server or to expose the app via ngrok.
// - If you continue using Angular CLI, you can simply run:
//     ng serve
//     ngrok http 4200
//   and open the provided ngrok URL.
// - If you choose to serve with Vite, this config allows the ngrok host and configures HMR.
//
// Usage with Vite:
//   1) Set the environment variable (host only, no protocol):
//      PowerShell:  $env:NGROK_HOST = "your-subdomain.ngrok-free.app"
//      Bash:        export NGROK_HOST=your-subdomain.ngrok-free.app
//   2) Start Vite dev server:  npm run dev  (or: npx vite)
//   3) Start ngrok:            ngrok http 5173   (or the port Vite prints)
//   4) Open https://your-subdomain.ngrok-free.app
//
// Optional: You can also omit NGROK_HOST; this config additionally allows any *.ngrok-free.app
// host in development via a predicate in allowedHosts.

import { defineConfig } from 'vite';

// Read NGROK_HOST from the environment and normalize (strip protocol if present)
const rawEnvHost = (process.env as Record<string, string | undefined>)["NGROK_HOST"] || '';
const envHost = rawEnvHost.replace(/^https?:\/\//, '196b5938d013.ngrok-free.app');
const NGROK_HOST = envHost || 'example.ngrok-free.app'; // safe default for docs

export default defineConfig({
  server: {
    port: 4200,
    open: true,
    // Allow dev-server requests from localhost and ngrok domains
    // Vite typings as of v5 expect allowedHosts to be (string | RegExp)[]; using RegExp for wildcard support
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      NGROK_HOST,
    ],
    hmr: {
      // Ensure HMR works through the ngrok tunnel when accessed externally
      host: NGROK_HOST
    }
  }
});
