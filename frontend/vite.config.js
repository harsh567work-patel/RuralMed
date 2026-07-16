import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'RuralMed - Offline-First Healthcare',
        short_name: 'RuralMed',
        description:
          'Healthcare management system with offline-first capabilities',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/img/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/img/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/img/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/img/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: '/img/screenshot-1.png',
            sizes: '540x720',
            type: 'image/png',
            form_factor: 'narrow',
          },
          {
            src: '/img/screenshot-2.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
          },
        ],
      },

      // Workbox configuration for offline caching
      workbox: {
        // Cache strategies
        runtimeCaching: [
          // API calls: network-first with fallback
          {
            urlPattern: /^http:\/\/localhost:5000\/api\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              networkTimeoutSeconds: 10,
            },
          },

          // Images: cache-first
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },

          // Fonts: cache-first
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },

          // Documents (HTML, CSS, JS): stale-while-revalidate
          {
            urlPattern: /\.(?:html|css|js)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-cache',
            },
          },
        ],

        // Clean up old caches
        cleanupOutdatedCaches: true,

        // Disable devtools in production
        disableDevtools: true,
      },

      // Dev options
      devOptions: {
        enabled: false,
        navigateFallback: 'index.html',
        suppressWarnings: true,
      },
    }),
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
