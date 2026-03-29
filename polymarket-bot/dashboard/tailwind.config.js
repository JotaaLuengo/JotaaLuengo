/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#07090d',
        surface: '#0e1117',
        border:  '#1c2030',
        green:   '#00e87a',
        blue:    '#00b3ff',
        yellow:  '#f0c040',
        red:     '#ff4d6d',
        muted:   '#5a6380',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Bebas Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
