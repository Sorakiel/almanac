import { readFileSync } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Single source of truth for the app version: the Tauri bundle config, which is
// also what the updater compares against. Baked into the SPA at build time so
// both the web and desktop builds show the real, current version.
const appVersion: string = JSON.parse(
  readFileSync(path.resolve(__dirname, 'src-tauri/tauri.conf.json'), 'utf-8'),
).version

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest, not generateSW: the worker already existed for Web Push
      // and hand-writing it keeps those handlers under review rather than
      // regenerating them. `sw.js` at the root is the path push.ts registers.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: null, // push.ts registers it — one registration, not two
      manifest: false, // public/manifest.webmanifest is hand-written (RET-2)
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
      devOptions: { enabled: false },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Respect a PORT from the environment so multiple dev servers can coexist.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
})
