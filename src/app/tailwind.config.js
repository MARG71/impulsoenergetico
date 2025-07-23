/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  future: {
    // Esto desactiva el uso automático de funciones avanzadas como oklch()
    disableColorOpacityUtilitiesByDefault: true,
  },
}
