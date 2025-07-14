const fs = require("fs");
const path = require("path");

// Support both Docker (./shared) and local (../shared) paths
const sharedConfigPath = fs.existsSync(
  path.resolve(__dirname, "./shared/styles/tailwind.config.base.js"),
)
  ? "./shared/styles/tailwind.config.base.js"
  : "../shared/styles/tailwind.config.base.js";

const sharedConfig = require(sharedConfigPath);

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
  ],
  plugins: [...sharedConfig.plugins, require("@tailwindcss/typography")],
};
