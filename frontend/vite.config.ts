import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        timeout: 180000,
        proxyTimeout: 180000,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error('[Vite Proxy Error]', err.message);
            const httpRes = res as any;
            if (httpRes && !httpRes.headersSent && typeof httpRes.writeHead === 'function') {
              httpRes.writeHead(502, { 'Content-Type': 'application/json' });
              httpRes.end(JSON.stringify({
                error: 'Proxy error',
                detail: `Vite proxy to backend failed: ${err.message}`,
              }));
            }
          });
        },
      }
    }
  }
})
