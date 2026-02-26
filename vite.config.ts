import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api and /csrf requests to the Django backend during development.
      // This avoids CORS issues entirely — the browser only ever talks to localhost:5173.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api-auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/csrf': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
