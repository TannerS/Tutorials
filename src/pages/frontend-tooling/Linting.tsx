import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Linting() {
  return (
    <LessonLayout
      title="ESLint & Prettier"
      sectionId="frontend-tooling"
      lessonIndex={2}
      prev={{ path: '/frontend-tooling/webpack', label: 'Webpack: Getting Started' }}
      next={{ path: '/frontend-tooling/packages', label: 'Package Managers' }}
    >
      <h2>Why Linting and Formatting Matter</h2>
      <p>
        On a team of 10+ engineers, code style debates are a waste of review cycles.
        ESLint catches bugs and enforces patterns. Prettier enforces formatting.
        Together they eliminate an entire category of PR comments so reviewers
        can focus on logic and architecture.
      </p>

      <FlowChart
        title="Lint & Format Pipeline"
        chart={"graph LR\n  A[Write Code] --> B[Save File]\n  B --> C[Prettier Formats]\n  C --> D[ESLint Checks]\n  D -->|Errors| E[Fix in Editor]\n  D -->|Clean| F[Commit]\n  F --> G[Husky Pre-commit]\n  G --> H[lint-staged Runs]\n  H --> I[Push]"}
      />

      <h2>ESLint v9: Flat Config</h2>
      <p>
        ESLint v9 replaced the cascading <code>.eslintrc</code> system with a single
        flat config file: <code>eslint.config.js</code>. It's an array of config
        objects — no more "extends" chains or mysterious config merging.
      </p>

      <CodeBlock language="bash" title="Install ESLint + Plugins">
{`npm install -D eslint @eslint/js typescript-eslint \\
  eslint-plugin-react-hooks eslint-plugin-react-refresh \\
  eslint-plugin-jsx-a11y globals`}
      </CodeBlock>

      <CodeBlock language="javascript" title="eslint.config.js (Flat Config)">
{`import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  // Global ignores
  { ignores: ['dist', 'node_modules', '*.config.js'] },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Project-wide settings
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },

  // React Hooks + React Refresh — modern plugins ship ready-made flat
  // presets, so you no longer register the plugin and spread its rules
  // by hand. Prefer these over the manual form you'll see in older docs.
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,   // presets also exist for .browser / .next

  // Accessibility
  {
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
    },
  },

  // Custom project rules
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  }
);`}
      </CodeBlock>

      <InfoBox variant="tip" title="typescript-eslint v8+">
        The <code>typescript-eslint</code> package is the new unified entry point that
        replaces both <code>@typescript-eslint/parser</code> and
        <code>@typescript-eslint/eslint-plugin</code>. Use the combined package for
        flat config — it exports a <code>config()</code> helper that merges everything
        cleanly.
      </InfoBox>

      <h3>defineConfig, globalIgnores, and extends</h3>
      <p>
        ESLint itself now ships helpers from <code>eslint/config</code> that do the same job as
        <code>tseslint.config()</code> for non-TS projects, plus flat config regained an
        <code> extends</code> key — this time as a plain array of config objects rather than the
        old string-based resolution.
      </p>

      <CodeBlock language="javascript" title="eslint.config.js — Current Idiomatic Shape">
{`import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // Applies everywhere, regardless of position in the array
  globalIgnores(['dist', 'coverage']),

  {
    files: ['**/*.{ts,tsx}'],
    // 'extends' composes presets INTO this block, so the files/ignores
    // above scope them — no need to repeat the glob on every preset.
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
]);`}
      </CodeBlock>

      <InfoBox variant="info" title="A Bare Object vs an extends Block">
        This is the distinction that trips people up when reading two different flat configs.
        A config object with <strong>no <code>files</code> key applies to everything</strong> —
        that's why spreading <code>...tseslint.configs.recommended</code> at the top level lints
        your config files and scripts too, often unintentionally. Putting presets inside
        <code> extends</code> on an object that <em>does</em> have <code>files</code> scopes them
        to exactly that glob. Both forms are valid and you'll see both in the wild; reach for
        <code> extends</code> when you want the scoping.
      </InfoBox>

      <h3>Key Plugins Explained</h3>
      <p>
        <strong>eslint-plugin-react-hooks</strong> — Enforces the Rules of Hooks: no
        conditional hooks, correct dependency arrays. This catches the most common React
        bugs.
      </p>
      <p>
        <strong>eslint-plugin-react-refresh</strong> — Ensures components export correctly
        for Vite's Fast Refresh. Catches cases where HMR silently breaks.
      </p>
      <p>
        <strong>eslint-plugin-jsx-a11y</strong> — Static analysis for accessibility:
        missing alt text, improper ARIA roles, non-interactive elements with click handlers.
      </p>

      <h2>Prettier Setup</h2>

      <CodeBlock language="bash" title="Install Prettier">
{`npm install -D prettier eslint-config-prettier`}
      </CodeBlock>

      <CodeBlock language="json" title=".prettierrc">
{`{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "bracketSpacing": true,
  "endOfLine": "lf",
  "jsxSingleQuote": false
}`}
      </CodeBlock>

      <CodeBlock language="bash" title=".prettierignore">
{`dist
node_modules
coverage
*.min.js
pnpm-lock.yaml
package-lock.json`}
      </CodeBlock>

      <h2>ESLint + Prettier Integration</h2>
      <p>
        The key rule: <strong>Prettier handles formatting, ESLint handles logic.</strong>{' '}
        Use <code>eslint-config-prettier</code> to disable all ESLint formatting rules
        that would conflict with Prettier.
      </p>

      <CodeBlock language="javascript" title="Add Prettier to eslint.config.js">
{`import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // ... all your other configs ...

  // MUST be last — disables conflicting formatting rules
  prettierConfig,
);`}
      </CodeBlock>

      <InfoBox variant="warning" title="Don't Use eslint-plugin-prettier">
        Running Prettier inside ESLint via <code>eslint-plugin-prettier</code> is
        slower and produces noisy red-squiggly output. The modern approach is to run
        them separately: Prettier formats, ESLint lints. Use
        <code>eslint-config-prettier</code> to prevent conflicts.
      </InfoBox>

      <h2>Pre-commit Hooks: Husky + lint-staged</h2>
      <p>
        Enforce linting before code reaches the remote. Husky manages Git hooks,
        lint-staged runs linters only on staged files for speed.
      </p>

      <CodeBlock language="bash" title="Setup Husky + lint-staged">
{`npm install -D husky lint-staged

# Initialize husky
npx husky init

# The init command creates .husky/pre-commit
# Edit it to run lint-staged:
echo "npx lint-staged" > .husky/pre-commit`}
      </CodeBlock>

      <CodeBlock language="json" title="lint-staged config in package.json">
{`{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ],
    "*.css": [
      "prettier --write"
    ]
  }
}`}
      </CodeBlock>

      <h2>VS Code Editor Integration</h2>

      <CodeBlock language="json" title=".vscode/settings.json">
{`{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  // "eslint.useFlatConfig": true  — no longer needed; flat config is
  // the default and auto-detected. Only set it (to false) if you are
  // pinned to a legacy .eslintrc project.
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "editor.rulers": [100]
}`}
      </CodeBlock>

      <CodeBlock language="json" title=".vscode/extensions.json">
{`{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "streetsidesoftware.code-spell-checker"
  ]
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Commit Editor Config Too">
        Always commit <code>.vscode/settings.json</code> and
        <code>.vscode/extensions.json</code> to the repo. This ensures every developer
        has the same editor behavior from day one — no manual setup required.
      </InfoBox>

      <h2>Common Rules to Configure</h2>

      <CodeBlock language="javascript" title="Rules Worth Enabling">
{`rules: {
  // Catch bugs
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'no-debugger': 'error',
  'no-alert': 'error',
  'prefer-const': 'error',
  'no-var': 'error',

  // TypeScript strictness
  '@typescript-eslint/no-unused-vars': ['error', {
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
    destructuredArrayIgnorePattern: '^_',
  }],
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/consistent-type-imports': 'error',
  '@typescript-eslint/no-non-null-assertion': 'warn',

  // React
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
}`}
      </CodeBlock>

      <h2>Running Lint Commands</h2>

      <CodeBlock language="json" title="package.json Scripts">
{`{
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css,md}\"",
    "type-check": "tsc --noEmit"
  }
}`}
      </CodeBlock>

      <h2>CI Pipeline Integration</h2>

      <CodeBlock language="yaml" title="GitHub Actions Lint Job">
{`name: Lint
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: 'npm'
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
      - run: npm run type-check`}
      </CodeBlock>

      <InfoBox variant="tip" title="Max Warnings = 0">
        Always run ESLint with <code>--max-warnings 0</code> in CI. This prevents
        warnings from piling up unchecked. If something is worth warning about,
        it's worth failing the build over — or downgrade it to "off."
      </InfoBox>
    </LessonLayout>
  );
}
