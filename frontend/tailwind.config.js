const sharedConfig = require('../shared/styles/tailwind.config.base.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...sharedConfig,
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
