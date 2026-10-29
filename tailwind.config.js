/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          50: '#faf8f6',
          100: '#f3efe9',
          200: '#e5ddd2',
          300: '#d3c4b2',
          400: '#bba48b',
          500: '#a6896d',
          600: '#937359',
          700: '#7a5d49',
          800: '#644d3f',
          900: '#524035',
        }
      }
    },
  },
  plugins: [],
};
