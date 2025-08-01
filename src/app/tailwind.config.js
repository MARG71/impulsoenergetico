/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          900: '#111827', // Para que `text-gray-900` funcione correctamente
        },
      },
    },
  },
  plugins: [],
  future: {
    // Esto desactiva el uso automático de funciones avanzadas como oklch()
    disableColorOpacityUtilitiesByDefault: true,
  },
};
