module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: ["react-app", "react-app/jest", "airbnb-typescript", "prettier"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: [
    "@typescript-eslint/eslint-plugin",
    "json-format",
    "prettier",
    "simple-import-sort",
  ],
  rules: {
    "import/no-extraneous-dependencies": "off",
    "import/extensions": "off",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "prettier/prettier": [
      "error",
      {
        singleQuote: false,
        semi: true,
        tabWidth: 2,
        useTabs: false,
        printWidth: 80,
        arrowParens: "always",
      },
      {
        usePrettierrc: false,
      },
    ],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
        disallowTypeAnnotations: false,
      },
    ],
  },
  ignorePatterns: [
    ".yarn/**/*",
    ".pnp.cjs",
    ".pnp.loader.mjs",
    ".eslintrc.js",
    "**/dist/**/*",
    "**/__generated__/**/*",
  ],
};
