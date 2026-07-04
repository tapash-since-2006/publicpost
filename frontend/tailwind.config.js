/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: ['fill-verified-100', 'fill-verified-50'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a4bbfd',
          400: '#7a94fb',
          500: '#5469f7',
          600: '#3d4aec',
          700: '#3038d1',
          800: '#2a2fa8',
          900: '#0a0f2e',
          950: '#060818',
        },
        verified: {
          50:  '#eff8ff',
          100: '#dbeffe',
          200: '#bfe3fd',
          300: '#92d1fc',
          400: '#5db8f9',
          500: '#1a9de8',
          600: '#0c7dc5',
          700: '#0b63a0',
          800: '#0f5485',
          900: '#13476f',
        },
        cream: '#faf8f3',
        parchment: '#f5f1e8',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'display':  ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'headline': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'subhead':  ['1.5rem',  { lineHeight: '1.3' }],
      },
    },
  },
  plugins: [],
}
