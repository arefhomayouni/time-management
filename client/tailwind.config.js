/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        luxury: {
          black: '#0a0a0a',
          gold: '#D4AF37',
          goldLight: '#F9E4B7',
          darkGray: '#1a1a1a',
          accent: '#C0C0C0',
        },
      },
    },
  },
  plugins: [],
}
