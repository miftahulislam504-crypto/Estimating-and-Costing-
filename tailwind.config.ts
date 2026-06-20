import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── CivilOS Unified Design System — Light Clean ──────────────────
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1a56db',   // Primary blue
          600: '#1e429f',   // Primary dark
          700: '#1e3a8a',
          800: '#1e3071',
          900: '#172554',
        },
        surface: {
          50:  '#ffffff',   // Pure white — main bg
          100: '#f9fafb',   // Slight grey — sidebar, card bg
          200: '#f3f4f6',   // Section bg
          300: '#e5e7eb',   // Borders
          400: '#d1d5db',   // Disabled borders
          500: '#9ca3af',   // Placeholder, muted icons
          600: '#6b7280',   // Muted text
          700: '#4b5563',   // Secondary text
          800: '#374151',   // Body text
          900: '#1f2937',   // Strong text
          950: '#111827',   // Near-black text
        },
        success: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          500: '#059669',
          600: '#047857',
          700: '#065f46',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#d97706',
          600: '#b45309',
        },
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          500: '#dc2626',
          600: '#b91c1c',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'xs':      '0 1px 2px rgba(0,0,0,0.05)',
        'sm':      '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card':    '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-lg': '0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        'modal':   '0 20px 60px rgba(0,0,0,0.15)',
        'focus':   '0 0 0 3px rgba(26,86,219,0.15)',
        // Legacy aliases kept so existing components don't break
        'glow':    '0 0 0 3px rgba(26,86,219,0.15)',
        'glow-lg': '0 0 0 4px rgba(26,86,219,0.20)',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(26,86,219,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(26,86,219,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
    },
  },
  plugins: [],
} satisfies Config
