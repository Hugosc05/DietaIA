import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0b0f14',
        card: '#141a22',
        edge: '#1f2937',
        accent: '#22d3ee',
        ok: '#34d399',
        warn: '#fbbf24'
      }
    }
  },
  plugins: []
};

export default config;
