module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    commonjs: true,
    es6: true,
    jquery: false,
    jest: true,
    jasmine: true
  },
  extends: ["eslint:recommended", "plugin:react/recommended"],
  parser: "babel-eslint",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 7,
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true,
      experimantalDecorators: true
    }
  },
  rules: {
    indent: [2, "space"],
    quotes: ["warn", "single"],
    semi: ["error", "always"],
    "no-var": ["error"],
    "no-console": ["off"],
    "no-unused-vars": ["warn"]
  }
};
