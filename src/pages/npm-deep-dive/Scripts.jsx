import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NpmScripts() {
  return (
    <LessonLayout
      title="npm Scripts"
      sectionId="npm-deep-dive"
      lessonIndex={4}
      prev={{ path: '/npm-deep-dive/lockfile', label: 'Lockfiles' }}
      next={{ path: '/npm-deep-dive/security', label: 'npm Security' }}
    >
      <h2>npm Scripts</h2>
      <p>
        npm scripts are shell commands defined in <code>package.json</code> under the <code>scripts</code> field.
        They provide a standardized way to run project tasks, with access to locally installed binaries.
      </p>

      <CodeBlock language="json" title="package.json scripts">
{`{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write src",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist node_modules",
    "ci": "npm run lint && npm run typecheck && npm run test"
  }
}`}
      </CodeBlock>

      <h2>Running Scripts</h2>

      <CodeBlock language="bash" title="Invoking scripts">
{`# Standard scripts (no 'run' needed)
npm test      # → npm run test
npm start     # → npm run start
npm stop      # → npm run stop
npm restart   # → npm run restart

# Custom scripts require 'run'
npm run dev
npm run build
npm run lint:fix

# Pass arguments with --
npm test -- --reporter verbose
npm run lint -- --max-warnings 0

# Run silently (suppress npm logging)
npm run build --silent

# pnpm and yarn
pnpm run dev
yarn dev`}
      </CodeBlock>

      <h2>Lifecycle Scripts</h2>
      <p>
        npm automatically runs certain scripts at specific points during <code>npm install</code>,
        <code>npm publish</code>, and other lifecycle events.
      </p>

      <CodeBlock language="json" title="Lifecycle hooks">
{`{
  "scripts": {
    // Install lifecycle
    "preinstall": "node check-node-version.js",
    "install": "...",
    "postinstall": "patch-package",   // common for applying patches

    // Test lifecycle
    "pretest": "npm run lint",
    "test": "vitest run",
    "posttest": "...",

    // Publish lifecycle
    "prepublishOnly": "npm run build && npm test",
    "prepack": "npm run build",
    "prepare": "husky",               // runs after install AND before pack/publish

    // Build lifecycle
    "prebuild": "rm -rf dist",
    "build": "tsc && vite build",
    "postbuild": "node scripts/copy-assets.js"
  }
}`}
      </CodeBlock>

      <h2>PATH and Local Binaries</h2>
      <p>
        npm scripts automatically add <code>node_modules/.bin</code> to PATH. This lets you run locally
        installed tools (vite, eslint, vitest) without installing them globally or using npx.
      </p>

      <CodeBlock language="bash" title="Local binaries in scripts">
{`# Without npm scripts, you'd need:
./node_modules/.bin/vite build
# OR:
npx vite build

# In package.json scripts, PATH includes node_modules/.bin
{
  "scripts": {
    "build": "vite build",    // finds ./node_modules/.bin/vite automatically
    "lint": "eslint src"      // finds ./node_modules/.bin/eslint
  }
}

# View available local binaries
ls node_modules/.bin

# Useful binaries to know:
# tsc, vite, vitest, jest, eslint, prettier, rollup, esbuild`}
      </CodeBlock>

      <h2>Cross-Platform Scripts</h2>

      <CodeBlock language="json" title="Cross-platform compatible scripts">
{`// Problem: Unix scripts don't work on Windows
{
  "scripts": {
    "clean": "rm -rf dist"    // fails on Windows!
  }
}

// Solution 1: cross-env for env variables
npm install --save-dev cross-env
{
  "scripts": {
    "build:prod": "cross-env NODE_ENV=production vite build"
  }
}

// Solution 2: rimraf for rm -rf
npm install --save-dev rimraf
{
  "scripts": {
    "clean": "rimraf dist"    // works on all platforms
  }
}

// Solution 3: npm-run-all for parallel/sequential
npm install --save-dev npm-run-all
{
  "scripts": {
    "build": "run-s clean compile",       // sequential
    "dev": "run-p dev:server dev:watch"   // parallel
  }
}`}
      </CodeBlock>

      <h2>npx — Running Packages Without Installing</h2>

      <CodeBlock language="bash" title="npx usage">
{`# Run a package from the registry without installing globally
npx create-vite@latest my-app
npx prettier --write .
npx eslint --init

# npx priority:
# 1. Check node_modules/.bin (local install)
# 2. Check npm cache
# 3. Download from registry, run once, then discard

# Specify version
npx eslint@8 .

# Run an npm script in a child package (monorepos)
npx --workspaces --if-present run build

# pnpm equivalent
pnpm dlx create-vite my-app

# Common one-off tasks
npx npm-check-updates         # show all available upgrades
npx depcheck                  # find unused dependencies
npx bundlesize                # check bundle size budgets
npx serve dist                # serve a static directory`}
      </CodeBlock>

      <h2>Scripting Patterns</h2>

      <CodeBlock language="json" title="Advanced script patterns">
{`{
  "scripts": {
    // Chaining: && (stop on error), ; (continue on error), | (pipe)
    "verify": "npm run lint && npm run typecheck && npm run test",

    // Multiple commands in parallel (Unix)
    "start": "concurrently \"npm run server\" \"npm run client\"",

    // Environment-specific
    "build:dev": "vite build --mode development",
    "build:staging": "vite build --mode staging",
    "build:prod": "vite build --mode production",

    // Git hooks helper
    "prepare": "husky",
    "precommit": "lint-staged",

    // Version bumping
    "release:patch": "npm version patch && git push --follow-tags",
    "release:minor": "npm version minor && git push --follow-tags",
    "release:major": "npm version major && git push --follow-tags"
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Script Naming Convention">
        <p>
          Prefix related scripts with the same namespace: <code>test</code>, <code>test:watch</code>,
          <code>test:coverage</code>. This makes it easy to discover related commands. Use
          <code>npm run</code> without arguments to list all available scripts in the current project.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Why can npm scripts run 'eslint' directly without 'npx eslint' or './node_modules/.bin/eslint'?"
        options={[
          "npm automatically installs eslint globally when detected in package.json",
          "npm scripts add node_modules/.bin to PATH before running the command",
          "npm has built-in support for common tools like eslint and prettier",
          "npm scripts use a special shell that resolves packages differently"
        ]}
        correctIndex={1}
        explanation="When npm runs a script, it temporarily prepends node_modules/.bin to the system PATH. This means any locally installed package with a bin entry (like eslint, vite, vitest) can be called by name directly in scripts. This is why 'vite build' works in package.json scripts but fails in your regular terminal (unless vite is installed globally)."
      />

      <InteractiveChallenge
        question="What is the 'prepare' lifecycle script used for and when does it run?"
        options={[
          "Only runs before npm publish to build the package",
          "Runs after npm install AND before npm pack/publish — commonly used for Husky setup",
          "Runs only when the package is installed as a dependency by others",
          "Runs before every npm run command"
        ]}
        correctIndex={1}
        explanation="The 'prepare' script runs: (1) after npm install in the project root, (2) before npm pack, and (3) before npm publish. It also runs when the package is installed as a git dependency. This makes it ideal for building the package (tsc) and setting up git hooks (husky). Note: 'prepublishOnly' is better than 'prepare' for build steps since prepare also runs on install."
      />
    </LessonLayout>
  );
}
