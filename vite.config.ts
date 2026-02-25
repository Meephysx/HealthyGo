import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true,        // 🔥 WAJIB agar bisa diakses dari HP
    port: 5173,        // opsional
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      devOptions: {
        enabled: true
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      },

      includeAssets: ['**/*.json'],

      manifest: {
        name: 'HealthyGo',
        short_name: 'HealthyGo',
        description: 'Healthy lifestyle planner app',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],

  assetsInclude: ['**/*.json']
})