/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        sagard: {
          yellow: '#C8D400',
          'yellow-dark': '#A5AF00',
          'yellow-light': '#E8F200',
          dark: '#0f172a',
          'dark-2': '#1e293b',
          'dark-3': '#334155',
        },
      },
    },
  },
  plugins: [],
}
