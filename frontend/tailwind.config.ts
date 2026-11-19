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
        background: '#08090D',
        obsidian: {
          deep: '#08090D',
          surface: '#0E1017',
          elevated: '#161922',
          highlight: '#1F2432',
          active: '#2A3042',
          border: 'rgba(255, 255, 255, 0.08)',
          borderSubtle: 'rgba(255, 255, 255, 0.05)',
        },
        brand: {
          violet: '#8B5CF6',
          violetDark: '#7C3AED',
          amethyst: '#C084FC',
          lilac: '#DDD6FE',
        },
        neon: {
          emerald: '#10B981',
          mint: '#00FF9D',
          amber: '#F59E0B',
          rose: '#EF4444',
          cyan: '#00E5FF',
        },
        surface: {
          DEFAULT: '#0E1017',
          hover: '#161922',
          muted: '#08090D',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
        display: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'glow-violet': '0 0 25px rgba(139, 92, 246, 0.25)',
        'glow-cyan': '0 0 25px rgba(0, 229, 255, 0.25)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.25)',
      },
      keyframes: {
        photonPulse: {
          '0%': { strokeDashoffset: '100%', stroke: '#8B5CF6' },
          '50%': { stroke: '#00E5FF' },
          '100%': { strokeDashoffset: '0%', stroke: '#10B981' },
        },
        gentleGlow: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
      },
      animation: {
        'photon-pulse': 'photonPulse 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'gentle-glow': 'gentleGlow 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
