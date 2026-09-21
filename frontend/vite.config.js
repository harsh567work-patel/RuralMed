import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Switch to injectManifest so we control the SW source.
      // generateSW mode runs its own Rollup over node_modules which conflicts
      // with @powersync/web's dynamic-import workers (can't use iife format).
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',

      // CRITICAL: Override the default 'iife' SW output format to 'es'.
      // @powersync/web uses dynamic import() in its worker files. Rollup rejects
      // iife format the moment any file in the input set has a dynamic import().
      // 'es' format supports code-splitting and dynamic imports.
      rollupFormat: 'es',

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

      // injectManifest config — controls which assets get precached
      injectManifest: {
        // Exclude PowerSync worker files and WASM from the Workbox precache manifest.
        globIgnores: [
          '**/node_modules/**/*',
          '**/@powersync/**/*',
          '**/worker/**/*',
          '**/*.wasm',
        ],
        // Only precache our own app shell assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Stub @powersync imports during the SW Rollup build via alias.
        // The SW (src/sw.js) doesn't import @powersync directly, but Workbox's
        // module resolution can transitively pull in @powersync worker files.
        // By aliasing to a virtual empty module, we prevent those files from
        // ever entering the Rollup input graph.
        rollupOptions: {
          plugins: [
            {
              name: 'stub-powersync-in-sw',
              resolveId(source) {
                if (source.includes('@powersync') || source.includes('powersync')) {
                  // Return a virtual module ID
                  return '\0virtual:powersync-stub';
                }
                return null;
              },
              load(id) {
                if (id === '\0virtual:powersync-stub') {
                  return 'export default {};';
                }
                // Also intercept the file path directly in case it's loaded by path
                if (id.includes('@powersync') || id.includes('node_modules/@powersync')) {
                  return 'export default {};';
                }
                return null;
              },
            },
          ],
        },
      },

      // Dev options
      devOptions: {
        enabled: false,
        navigateFallback: 'index.html',
        suppressWarnings: true,
      },
    }),
  ],

  // ── Build config ───────────────────────────────────────────────────────────
  build: {
    rollupOptions: {
      // Treat @powersync/web's pre-built worker files as external assets.
      external: [/@powersync\/web\/dist\/worker/],
    },
  },

  // ── Worker build config ────────────────────────────────────────────────────
  // @powersync/web registers Web Workers via new Worker(url, {type: 'module'}).
  // Vite picks these up as worker entries and defaults to 'iife' format.
  // Setting 'es' format supports dynamic imports used by PowerSync workers.
  worker: {
    format: 'es',
  },

  // ── Dependency optimisation ────────────────────────────────────────────────
  optimizeDeps: {
    // Exclude @powersync/web from Vite's pre-bundling.
    exclude: ['@powersync/web'],
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.ngrok-free.dev'],
    // COOP + COEP are required for SharedArrayBuffer, which the PowerSync
    // WASM SQLite worker depends on. Without these, the OPFS backend will
    // fail with a "SharedArrayBuffer is not defined" error.
    headers: {
      'Cross-Origin-Opener-Policy':   'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
