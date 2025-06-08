/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        robotomono: ['"Roboto Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
