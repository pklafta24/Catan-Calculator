/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.jsx",
    "./main.jsx",
  ],
  theme: {
    extend: {
      colors: {
        ore: '#7b6f83',
        brick: '#9c4300',
        ocean: '#4fa6eb',
        wood: '#517d19',
        wheat: '#f0ad00',
      },
    },
  },
  plugins: [],
