import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      // Next 16 enables React Compiler diagnostics by default. Keep this
      // dependency migration behavior-neutral until existing violations are
      // addressed in a focused change.
      "react-hooks/error-boundaries": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["*.config.js", "styles/**/*.config.js"],
    rules: {
      // Jest and Tailwind discover these files as CommonJS configuration.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "**/__tests__/**",
    "__mocks__/**",
    "tests/**",
  ]),
]);

export default eslintConfig;
