import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors aligned with FirmaChain
        brand: {
          primary: '#1050dd',
          secondary: '#316bff',
          accent: '#4a7fff',
          light: '#6b8fff',
          dark: '#0a3aa7',
        },
        // Dark theme backgrounds
        dark: {
          bg: {
            primary: '#121417',
            secondary: '#1a1b20',
            tertiary: '#242530',
            card: '#2a2b38',
            hover: '#32334a',
          },
        },
        // Text colors
        text: {
          primary: '#ffffff',
          secondary: '#a0a3bd',
          tertiary: '#6b7280',
          muted: '#4b5563',
        },
      },
      fontFamily: {
        metropolis: ['Metropolis', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        lato: ['Lato', 'Inter', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      fontSize: {
        '9xl': ['8rem', { lineHeight: '1' }],
        '10xl': ['9rem', { lineHeight: '1' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 15s ease infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientShift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '33%': { transform: 'translate(-5%, -5%) rotate(120deg)' },
          '66%': { transform: 'translate(5%, -5%) rotate(240deg)' },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(16, 80, 221, 0.3)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(16, 80, 221, 0.5)',
            transform: 'scale(1.02)',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': `
          radial-gradient(circle at 20% 80%, rgba(16, 80, 221, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(49, 107, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(74, 127, 255, 0.08) 0%, transparent 50%)
        `,
        'network-pattern': `
          linear-gradient(rgba(16, 80, 221, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16, 80, 221, 0.03) 1px, transparent 1px)
        `,
      },
      boxShadow: {
        'glow': '0 0 20px rgba(16, 80, 221, 0.3)',
        'glow-lg': '0 0 40px rgba(16, 80, 221, 0.4)',
        'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;