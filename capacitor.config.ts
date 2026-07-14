import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.almanac.app',
  appName: 'Almanac',
  webDir: 'dist',
  plugins: {
    CapacitorUpdater: {
      // We drive updates ourselves (self-hosted on GitHub Releases) via
      // src/lib/androidUpdater.ts, so Capgo's cloud auto-update stays off.
      autoUpdate: false,
      resetWhenUpdate: true,
    },
  },
};

export default config;
