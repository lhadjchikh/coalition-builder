const sharedConfig = require("./styles/tailwind.config.base.js");

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...sharedConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    // Include shared frontend components
    "./frontend/src/**/*.{js,jsx,ts,tsx}",
    // Include shared components
    "./shared/**/*.{js,jsx,ts,tsx}",
    "../shared/**/*.{js,jsx,ts,tsx}",
  ],
  plugins: [...sharedConfig.plugins, require("@tailwindcss/typography")],
};
