import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
