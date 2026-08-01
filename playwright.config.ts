import { defineConfig, devices } from '@playwright/test'

const CI = Boolean(process.env.CI)

/**
 * E2E config. Boots Vite in `e2e` mode and runs the suite against it.
 *
 * The specs share one pre-seeded Supabase account (E2E_EMAIL / E2E_PASSWORD)
 * and clean up after themselves, so they must not run in parallel — and they
 * must never point at production. `--mode e2e` makes `.env.e2e.local` win over
 * `.env.local`, so the target project is explicit rather than whatever the
 * developer happens to have configured locally.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:5177',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Own port, never reused: 5173 is routinely taken by another dev server (the
  // landing site), and reusing it silently runs the whole suite against the
  // wrong app.
  webServer: {
    command: 'npm run dev -- --mode e2e --port 5177 --strictPort',
    url: 'http://localhost:5177',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
