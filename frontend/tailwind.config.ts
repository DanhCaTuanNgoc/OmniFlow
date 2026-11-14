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
        background: '#06040A',
        obsidian: {
          deep: '#06040A',
          surface: '#0B0813',
          elevated: '#110C1E',
          highlight: '#171028',
          active: '#1A102E',
          border: '#1C142E',
          focus: '#2E1F4A',
        },
        brand: {
          violet: '#8B5CF6',
          amethyst: '#C084FC',
          lilac: '#DDD6FE',
        },
        neon: {
          emerald: '#00FF9D',
          amber: '#F59E0B',
          rose: '#EF4444',
          cyan: '#00E5FF',
        },
        surface: {
          DEFAULT: '#0B0813',
          hover: '#171028',
          muted: '#06040A',
          border: '#1C142E',
        },
        omni: {
          cyan: '#00E5FF',
          blue: '#2563EB',
          purple: '#8B5CF6',
          pink: '#EC4899',
          amber: '#F59E0B',
          yellow: '#FFD600',
          green: '#00FF9D',
          emerald: '#00FF9D',
          orange: '#FF6D00',
          red: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        photonPulse: {
          '0%': { strokeDashoffset: '100%', stroke: '#8B5CF6' },
          '50%': { stroke: '#00E5FF' },
          '100%': { strokeDashoffset: '0%', stroke: '#00FF9D' },
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
