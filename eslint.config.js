import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dist-pdf', 'node_modules']),

  // Plain JS/JSX (currently just the build tooling under scripts/).
  {
    files: ['**/*.{js,jsx,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  // The actual app. Previously this config only matched `**/*.{js,jsx}`, which
  // meant not one .ts/.tsx file in src/ was ever linted.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // TS itself already reports genuinely-unused symbols; the ESLint rule is
      // kept but downgraded to a warning and taught the `_`-prefix convention
      // used for deliberately-ignored params in the lesson demo code.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // The lesson pages deliberately show `any` (e.g. the TypeScript lessons
      // demonstrating what `any` does), so flagging it site-wide is pure noise.
      '@typescript-eslint/no-explicit-any': 'off',
      // Same reason: `{}` and `Function` appear as teaching examples.
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      // Every page module exports one component plus, in a few cases, its data
      // constants. Fast-refresh still works fine here; this is a warning only.
      'react-refresh/only-export-components': 'warn',
    },
  },

  // Lesson pages are content, not app code: they contain large literal code
  // samples where escaping/quoting is intentional.
  {
    files: ['src/pages/**/*.tsx'],
    rules: {
      'no-useless-escape': 'off',
    },
  },
])
