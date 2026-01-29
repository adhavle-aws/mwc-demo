/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        // sm: 640px (default)
        // md: 768px (default)
        // lg: 1024px (default)
        // xl: 1280px (default)
        // 2xl: 1536px (default)
      },
      colors: {
        background: '#0a0e1a',
        surface: '#151b2d',
        'surface-hover': '#1e2638',
        border: '#2d3548',
        'text-primary': '#e4e7eb',
        'text-secondary': '#9ca3af',
        'text-muted': '#6b7280',
        'accent-primary': '#3b82f6',
        'accent-secondary': '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#06b6d4',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '350ms',
      },
      scale: {
        '102': '1.02',
      },
    },
  },
  plugins: [],
}
