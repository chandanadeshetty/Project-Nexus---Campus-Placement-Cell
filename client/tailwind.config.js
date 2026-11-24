/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nitw: {
          dark: '#0f172a',
          primary: '#1e3a8a',
          secondary: '#1d4ed8',
          accent: '#b91c1c',
          gold: '#d97706',
          surface: '#f8fafc'
        }
      }
    },
  },
  plugins: [],
}
