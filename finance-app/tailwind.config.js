/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bbva: { DEFAULT: '#004481', light: '#0066cc', dark: '#002d57' },
        revolut: { DEFAULT: '#191c1f', light: '#2d3139', dark: '#111418' },
        myinvestor: { DEFAULT: '#00b386', light: '#00d6a0', dark: '#008f6b' },
        traderepublic: { DEFAULT: '#0dbd8b', light: '#15d49f', dark: '#0a9a72' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
