import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        accent: {
          DEFAULT: '#14532D',
          light: '#166534',
        },
        alert: {
          DEFAULT: '#881337',
          light: '#9F1239',
        },
        parchment: '#EAB308',
        surface: '#F8F9FA',
        card: '#FFFFFF',
        border: '#DBD6CB',
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
