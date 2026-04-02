import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0b1220',
        panel: '#111827',
        border: '#2f3b55',
        accent: '#45d6ff',
      },
      boxShadow: {
        glow: '0 20px 60px rgba(69, 214, 255, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
