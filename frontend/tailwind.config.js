/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html', 
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'accent': '#008B8B',
        'light-bg': '#FAF6EF',
        'dark-bg': '#050505'
      }
    }
  },
  plugins: []
};