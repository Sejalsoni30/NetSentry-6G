/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030509',
          900: '#05070D',
          850: '#080C17',
          800: '#0E1424',
          700: '#162038',
          600: '#233256',
        },
        cyan: {
          glow: '#22E4FF',
          dim: '#0D8299',
          faint: 'rgba(34, 228, 255, 0.08)',
        },
        amber: {
          glow: '#FFB020',
          dim: '#9E6A0F',
          faint: 'rgba(255, 176, 32, 0.08)',
        },
        signal: {
          red: '#FF3B5C',
          dim: '#9E1C32',
          faint: 'rgba(255, 59, 92, 0.08)',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Syne"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 25px rgba(34, 228, 255, 0.35)',
        'cyan-intense': '0 0 50px rgba(34, 228, 255, 0.65)',
        'amber-glow': '0 0 25px rgba(255, 176, 32, 0.35)',
        'red-glow': '0 0 25px rgba(255, 59, 92, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
      }
    },
  },
  plugins: [],
}
