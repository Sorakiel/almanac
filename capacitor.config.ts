import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.almanac.app',
  appName: 'Almanac',
  webDir: 'dist',
  // Dark WebView background so the edge-to-edge system-bar areas never flash
  // white before the themed UI paints (the app bg fills the viewport after).
  backgroundColor: '#1B1B1D',
  plugins: {
    StatusBar: {
      // We draw behind the bars (edge-to-edge) and drive icon colour from the
      // app theme in src/lib/statusBar.ts; keep them transparent, not white.
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#00000000',
    },
    CapacitorUpdater: {
      // We drive updates ourselves (self-hosted on GitHub Releases) via
      // src/lib/androidUpdater.ts, so Capgo's cloud auto-update stays off.
      autoUpdate: false,
      resetWhenUpdate: true,
    },
  },
}

export default config
