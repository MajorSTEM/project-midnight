/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'midnight': '#0a0a0f',
        'panel': '#0d1117',
        'panel-light': '#161b22',
        'panel-border': '#21262d',
        'terminal': '#00ff88',
        'terminal-dim': '#00cc6a',
        'blast': '#ff4444',
        'thermal': '#ff8800',
        'text-primary': '#e6edf3',
        'text-muted': '#8b949e',
        'ring-fireball': '#ffffff',
        'ring-heavy': '#ff4444',
        'ring-moderate': '#ff8800',
        'ring-light': '#ffdd00',
        'ring-radiation': '#00ff88',
        'ring-thermal': '#ff6600',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
        'blast-expand': 'blast-expand 0.5s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.95)' },
        },
        'blast-expand': {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0.7' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 5px #00ff88, 0 0 10px #00ff88' },
          '50%': { boxShadow: '0 0 20px #00ff88, 0 0 40px #00ff88' },
        },
      },
    },
  },
  plugins: [],
}
