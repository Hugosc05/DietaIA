import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'es.pulimentosyparquet.dietaia',
  appName: 'DietaIA',
  webDir: 'public',
  server: {
    url: process.env.CAP_SERVER_URL ?? 'https://dietaia.pulimentosyparquet.es',
    cleartext: false
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0b0f14'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#22d3ee'
    }
  }
};

export default config;
