import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function FTLinting() {
  return (
    <LessonLayout
      title="ESLint & Prettier"
      sectionId="frontend-tooling"
      lessonIndex={1}
      prev={{ path: '/frontend-tooling/vite', label: 'Vite' }}
      next={{ path: '/frontend-tooling/packages', label: 'Package Managers' }}
    >
      <h2>ESLint — Static Code Analysis</h2>
      <p>
        ESLint analyzes your JavaScript/TypeScript code for bugs, anti-patterns, and style issues without running it.
        ESLint 9 introduced the flat config system (<code>eslint.config.js</code>), replacing <code>.eslintrc</code>.
      </p>

      <CodeBlock language="bash" title="Installation">
{`# ESLint 9+ with flat config
npm install --save-dev eslint @eslint/js

# TypeScript support
npm install --save-dev typescript-eslint

# React support
npm install --save-dev eslint-plugin-react eslint-plugin-react-hooks
npm install --save-dev eslint-plugin-react-refresh

# Accessibility
npm install --save-dev eslint-plugin-jsx-a11y`}
      </CodeBlock>

      <CodeBlock language="javascript" title="eslint.config.js (flat config)">
{`import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactRefreshPlugin from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default tseslint.config(
  // Global ignores
  { ignores: ['dist', 'node_modules', '*.config.js'] },

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // React config
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React
      'react/prop-types': 'off',              // not needed with TS
      'react/react-in-jsx-scope': 'off',      // not needed with new JSX transform
      'react/self-closing-comp': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // A11y
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  }
)`}
      </CodeBlock>

      <h2>Prettier — Code Formatter</h2>
      <p>
        Prettier enforces consistent formatting by reprinting code from scratch. It is opinionated —
        minimal configuration reduces bikeshedding.
      </p>

      <CodeBlock language="bash" title="Prettier installation">
{`npm install --save-dev prettier

# Disable ESLint rules that conflict with Prettier
npm install --save-dev eslint-config-prettier`}
      </CodeBlock>

      <CodeBlock language="json" title=".prettierrc">
{`{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "jsxSingleQuote": false,
  "overrides": [
    {
      "files": "*.json",
      "options": { "printWidth": 200 }
    }
  ]
}`}
      </CodeBlock>

      <CodeBlock language="json" title=".prettierignore">
{`dist
node_modules
*.min.js
coverage
public`}
      </CodeBlock>

      <h2>Integrating ESLint + Prettier</h2>

      <CodeBlock language="javascript" title="eslint.config.js with prettier">
{`import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  // ... your other configs ...

  // MUST be last — disables conflicting ESLint formatting rules
  prettierConfig,
)`}
      </CodeBlock>

      <h2>Husky — Git Hooks</h2>
      <p>
        Husky runs scripts on git events (pre-commit, pre-push). Use it with lint-staged to only lint
        changed files, keeping the pre-commit hook fast.
      </p>

      <CodeBlock language="bash" title="Husky + lint-staged setup">
{`npm install --save-dev husky lint-staged

# Initialize husky
npx husky init

# The above creates .husky/pre-commit
# Edit .husky/pre-commit:
echo "npx lint-staged" > .husky/pre-commit

# Add prepare script to package.json
npm pkg set scripts.prepare="husky"`}
      </CodeBlock>

      <CodeBlock language="json" title="package.json — lint-staged config">
{`{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}`}
      </CodeBlock>

      <h2>VS Code Integration</h2>

      <CodeBlock language="json" title=".vscode/settings.json">
{`{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["javascript", "typescript", "javascriptreact", "typescriptreact"],
  "typescript.tsdk": "node_modules/typescript/lib"
}`}
      </CodeBlock>

      <CodeBlock language="json" title=".vscode/extensions.json">
{`{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss"
  ]
}`}
      </CodeBlock>

      <h2>package.json Scripts</h2>

      <CodeBlock language="json" title="Lint and format scripts">
{`{
  "scripts": {
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write src",
    "format:check": "prettier --check src",
    "typecheck": "tsc --noEmit"
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="ESLint vs Prettier — Division of Responsibility">
        <p>
          ESLint handles code quality (unused vars, hooks rules, accessibility). Prettier handles formatting (spacing, quotes, semicolons).
          Never configure formatting rules in ESLint — Prettier wins formatting decisions. Use <code>eslint-config-prettier</code>
          to disable any ESLint rules that conflict.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What does lint-staged do in the pre-commit workflow?"
        options={[
          "It runs ESLint on all files in the repository",
          "It runs linters only on the files staged for the current commit",
          "It prevents committing if any lint errors exist in the project",
          "It formats all files regardless of git status"
        ]}
        correctIndex={1}
        explanation="lint-staged only runs configured tools on the files that are staged (git add'd) for the commit, not the entire codebase. This keeps pre-commit hooks fast — linting 5 changed files takes milliseconds, while linting 500 files would be too slow and frustrating for developers."
      />

      <InteractiveChallenge
        question="Why is eslint-config-prettier placed last in the ESLint config?"
        options={[
          "It needs to see all other rules before it can optimize them",
          "It disables conflicting rules, so it must override all previously defined rules",
          "It only applies to files that Prettier formats",
          "Placement does not matter — it applies globally"
        ]}
        correctIndex={1}
        explanation="eslint-config-prettier disables any ESLint rules that might conflict with Prettier's formatting decisions (indentation, quotes, semicolons, etc.). Since ESLint configs are merged in order with later entries overriding earlier ones, eslint-config-prettier must come last to ensure it overrides any formatting rules from plugins like @typescript-eslint or eslint-plugin-react."
      />
    </LessonLayout>
  );
}
