import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#070B12',
        surface: {
          DEFAULT: '#0F172A',
          hover: '#1E293B',
          muted: '#0B1120',
          border: '#1E293B',
        },
        omni: {
          cyan: '#00E5FF',
          blue: '#2563EB',
          purple: '#A855F7',
          pink: '#EC4899',
          amber: '#F59E0B',
          yellow: '#FFD600',
          green: '#00E676',
          emerald: '#10B981',
          orange: '#FF6D00',
          red: '#FF1744',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        photonPulse: {
          '0%': { strokeDashoffset: '100%', stroke: '#00E5FF' },
          '50%': { stroke: '#FFD600' },
          '100%': { strokeDashoffset: '0%', stroke: '#00E676' },
        },
        slowPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.02)' },
        },
      },
      animation: {
        'photon-pulse': 'photonPulse 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'slow-pulse': 'slowPulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
