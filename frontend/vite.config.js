import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // SSE needs these for streaming to work through Vite proxy
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Pass auth token from query param to header for SSE
            const url = new URL(req.url, 'http://localhost')
            const token = url.searchParams.get('token')
            if (token) proxyReq.setHeader('Authorization', `Bearer ${token}`)
          })
        }
      }
    }
  }
})
