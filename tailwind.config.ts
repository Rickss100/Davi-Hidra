import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#070A11',
          900: '#0B101B',
          800: '#111827',
          700: '#1E293B',
          600: '#334155'
        },
        gold: {
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#D4AF37',
          600: '#B89225'
        },
        emerald: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      boxShadow: {
        private: '0 12px 32px -8px rgba(0, 0, 0, 0.55)',
        gold: '0 0 24px -4px rgba(212, 175, 55, 0.28)'
      }
    }
  },
  plugins: []
};

export default config;
