import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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

      // 🔥 PENTING: pastikan JSON ikut PWA
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

  // 🔥 INI KUNCI UTAMA
  assetsInclude: ['**/*.json']
})
