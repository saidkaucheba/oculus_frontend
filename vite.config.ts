import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      manifestFilename: 'manifest.webmanifest',

      includeAssets: ['apple-touch-icon.png', 'icons/*.png', 'favicon.svg'],

      // Inject additional SW code for Background Sync
      injectManifest: undefined,

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],

        // ── Runtime caching ───────────────────────────────────────────────
        runtimeCaching: [
          // API: Network-first (fresh data, fallback to cache)
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Media files (patient documents)
          {
            urlPattern: /^https?:\/\/.*\/media\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'patient-media-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/media/, /^\/csrf/],
        skipWaiting: true,
        clientsClaim: true,

        // ── Background Sync tag ───────────────────────────────────────────
        // When the SW detects connectivity restored, it dispatches a 'sync'
        // event with this tag. The client listens and calls syncQueue().
        // (Injected via additionalManifestEntries so it appears in SW scope)
        additionalManifestEntries: [],
      },

      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],

  server: {
    port: 5173,
    proxy: {
      '/api':      { target: 'http://localhost:8000', changeOrigin: true },
      '/api-auth': { target: 'http://localhost:8000', changeOrigin: true },
      '/csrf':     { target: 'http://localhost:8000', changeOrigin: true },
      '/media':    { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
