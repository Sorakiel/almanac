import { readFileSync } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Single source of truth for the app version: the Tauri bundle config, which is
// also what the updater compares against. Baked into the SPA at build time so
// both the web and desktop builds show the real, current version.
const appVersion: string = JSON.parse(
  readFileSync(path.resolve(__dirname, 'src-tauri/tauri.conf.json'), 'utf-8'),
).version

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
