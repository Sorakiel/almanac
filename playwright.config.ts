import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config. Boots the Vite dev server and runs the smoke suite against it.
 * Requires a live Supabase project (VITE_SUPABASE_URL / _ANON_KEY in .env.local).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
