import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Unit tests run in a plain node env — the tested modules are pure date/logic
// helpers with no DOM. The `@` alias mirrors vite.config so imports resolve.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
