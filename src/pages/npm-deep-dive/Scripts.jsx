import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Scripts() {
  return (
    <LessonLayout
      title="Scripts & Lifecycle Hooks"
      sectionId="npm-deep-dive"
      lessonIndex={4}
      prev={{ path: '/npm-deep-dive/lockfile', label: 'Lockfiles & Reproducibility' }}
      next={{ path: '/npm-deep-dive/security', label: 'Security & Auditing' }}
    >
      <h2>npm Scripts Basics</h2>
      <p>
        The <code>"scripts"</code> field in package.json is npm's built-in task runner. Each
        key is a command name, each value is a shell command that gets executed in a subshell.
        It's deceptively simple but has powerful features most developers never discover.
      </p>

      <CodeBlock language="json" title="Common scripts section">
{`{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist node_modules/.cache",
    "prepare": "husky install"
  }
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Running scripts">
{`# Run any script with "npm run":
npm run dev
npm run build
npm run lint:fix

# Special shorthand scripts (no "run" needed):
npm start      # runs "start" script
npm test       # runs "test" script (alias: npm t)
npm stop       # runs "stop" script
npm restart    # runs "restart" (or stop + start)

# These shortcuts exist because they're so common.
# All other scripts require "npm run <name>"`}
      </CodeBlock>

      <h2>How Scripts Find Binaries</h2>
      <p>
        The magic that makes scripts work: when npm runs a script, it temporarily adds
        <code>node_modules/.bin</code> to the PATH environment variable. This means any
        CLI tool installed as a dependency is available by name — no full paths needed.
      </p>

      <CodeBlock language="bash" title="PATH augmentation in scripts">
{`# In your package.json:
{
  "scripts": {
    "lint": "eslint src/"
  },
  "devDependencies": {
    "eslint": "^8.50.0"
  }
}

# When you run "npm run lint", npm does:
# 1. Add ./node_modules/.bin to front of PATH
# 2. Execute: eslint src/
# 3. Shell finds "eslint" at ./node_modules/.bin/eslint

# Without scripts, you'd need:
./node_modules/.bin/eslint src/
# or:
npx eslint src/

# The script PATH includes parent node_modules too:
# ./node_modules/.bin
# ../node_modules/.bin
# ../../node_modules/.bin (useful in monorepos)`}
      </CodeBlock>

      <InfoBox variant="info" title="Scripts Run in sh, Not bash">
        npm scripts execute in the system's default shell (sh on Unix, cmd.exe on Windows).
        This means bash-specific syntax (arrays, [[ ]]) won't work cross-platform. Stick to
        POSIX-compatible commands or use cross-env/shx for portability.
      </InfoBox>

      <h2>Pre and Post Hooks</h2>
      <p>
        For any script named <code>X</code>, npm automatically runs <code>preX</code> before
        it and <code>postX</code> after it. This is the lifecycle hook system.
      </p>

      <CodeBlock language="json" title="Pre/post hooks in action">
{`{
  "scripts": {
    "prebuild": "rm -rf dist",
    "build": "tsc && vite build",
    "postbuild": "echo Build complete! Size: $(du -sh dist | cut -f1)",

    "pretest": "npm run lint",
    "test": "jest",
    "posttest": "echo All tests passed!",

    "preversion": "npm test",
    "version": "",
    "postversion": "git push && git push --tags"
  }
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Execution order">
{`# Running "npm run build" executes:
# 1. prebuild  → rm -rf dist
# 2. build     → tsc && vite build
# 3. postbuild → echo Build complete!

# Running "npm test" executes:
# 1. pretest   → npm run lint
# 2. test      → jest
# 3. posttest  → echo All tests passed!

# If any step fails (non-zero exit), the chain STOPS
# e.g., if lint fails in pretest, jest never runs`}
      </CodeBlock>

      <h2>Built-in Lifecycle Scripts</h2>
      <p>
        Beyond pre/post hooks, npm has lifecycle scripts that run at specific points during
        npm operations (install, publish, version bump):
      </p>

      <FlowChart
        title="npm Lifecycle Script Order"
        chart={"graph TD\n  A[npm install] --> B[preinstall]\n  B --> C[install]\n  C --> D[postinstall]\n  D --> E[prepublish - DEPRECATED]\n  E --> F[preprepare]\n  F --> G[prepare]\n  G --> H[postprepare]\n  I[npm publish] --> J[prepublishOnly]\n  J --> K[prepack]\n  K --> L[prepare]\n  L --> M[postpack]\n  M --> N[publish]\n  N --> O[postpublish]"}
      />

      <CodeBlock language="json" title="Key lifecycle scripts explained">
{`{
  "scripts": {
    "preinstall": "node check-node-version.js",

    "prepare": "husky install",

    "prepublishOnly": "npm run build && npm test",

    "prepack": "npm run build",

    "postpack": "echo Package created successfully"
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="prepare Is Your Friend">
        The <code>prepare</code> script runs after <code>npm install</code> (in development)
        and before <code>npm publish</code>. It's perfect for build steps and setting up git
        hooks (husky). It does NOT run when your package is installed as a dependency.
      </InfoBox>

      <CodeBlock language="bash" title="When each lifecycle runs">
{`# prepare:
# - After "npm install" in development (not in production/CI with --omit=dev)
# - Before "npm publish"
# - When package is installed from git URL
# Use for: build steps, git hooks setup

# prepublishOnly:
# - ONLY before "npm publish" (not on install)
# Use for: build + test before publishing

# prepack:
# - Before "npm pack" and "npm publish" (tarball creation)
# Use for: building dist/ files

# postinstall:
# - After package is installed
# - Runs for dependencies too (controversial — security risk)
# Use for: native compilation (node-gyp), optional setup`}
      </CodeBlock>

      <h2>Passing Arguments to Scripts</h2>

      <CodeBlock language="bash" title="The -- separator">
{`# Arguments after -- are passed to the underlying command
npm run test -- --watch --coverage
# Executes: jest --watch --coverage

npm run lint -- --fix
# Executes: eslint src/ --fix

npm run dev -- --port 3001
# Executes: vite --port 3001

# Without --, npm tries to parse the args itself:
npm run test --watch      # WRONG: --watch goes to npm, not jest
npm run test -- --watch   # RIGHT: --watch goes to jest

# In npm 9+, you can also use:
npm test -- --watch
# (the -- works with shorthand commands too)`}
      </CodeBlock>

      <h2>Environment Variables in Scripts</h2>
      <p>
        npm injects a rich set of environment variables when running scripts. These let your
        scripts access package metadata without hardcoding values.
      </p>

      <CodeBlock language="bash" title="npm-injected environment variables">
{`# All package.json fields are available as npm_package_* vars:
echo $npm_package_name        # "my-app"
echo $npm_package_version     # "1.0.0"

# The current lifecycle event:
echo $npm_lifecycle_event     # "build", "test", etc.

# npm configuration:
echo $npm_config_registry     # "https://registry.npmjs.org/"

# Node and npm paths:
echo $npm_node_execpath       # /usr/local/bin/node
echo $npm_execpath            # /usr/local/lib/node_modules/npm/bin/npm-cli.js

# Use in scripts:
{
  "scripts": {
    "greet": "echo Building $npm_package_name v$npm_package_version",
    "banner": "echo Running: $npm_lifecycle_event"
  }
}`}
      </CodeBlock>

      <h2>Cross-Platform Scripts</h2>
      <p>
        Shell commands differ between Unix and Windows. If your team uses both (or CI runs
        Linux while devs use Mac/Windows), you need cross-platform solutions:
      </p>

      <CodeBlock language="json" title="Cross-platform tools">
{`{
  "scripts": {
    "clean": "rimraf dist",
    "set-env": "cross-env NODE_ENV=production node server.js",
    "copy": "shx cp -r assets/ dist/assets/",
    "mkdir": "shx mkdir -p dist/reports"
  },
  "devDependencies": {
    "cross-env": "^7.0.3",
    "rimraf": "^5.0.0",
    "shx": "^0.3.4"
  }
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Common cross-platform issues">
{`# FAILS on Windows:
"clean": "rm -rf dist"              # rm doesn't exist
"env": "NODE_ENV=production node ." # env vars set differently

# WORKS everywhere:
"clean": "rimraf dist"              # cross-platform rm -rf
"env": "cross-env NODE_ENV=production node ."  # cross-platform env

# Alternatively, use Node.js scripts for complex operations:
"complex-task": "node scripts/build.js"`}
      </CodeBlock>

      <h2>Script Composition</h2>
      <p>
        Real projects need to run multiple scripts together — either sequentially (one after
        another) or in parallel (simultaneously). Here are the patterns:
      </p>

      <CodeBlock language="json" title="Running scripts together">
{`{
  "scripts": {
    "build:css": "tailwindcss -o dist/styles.css",
    "build:js": "esbuild src/index.ts --bundle --outfile=dist/app.js",
    "build:types": "tsc --emitDeclarationOnly",

    "build:sequential": "npm run build:css && npm run build:js && npm run build:types",

    "build:parallel": "concurrently \"npm:build:css\" \"npm:build:js\" \"npm:build:types\"",

    "dev": "concurrently \"npm:dev:*\"",
    "dev:server": "node server.js",
    "dev:client": "vite",
    "dev:css": "tailwindcss --watch",

    "ci": "npm run lint && npm run typecheck && npm run test && npm run build",

    "validate": "npm-run-all --parallel lint typecheck --sequential test build"
  },
  "devDependencies": {
    "concurrently": "^8.0.0",
    "npm-run-all": "^4.1.5"
  }
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Composition operators">
{`# Sequential (&&) — next command runs only if previous succeeds
npm run lint && npm run test && npm run build

# Sequential (;) — runs all regardless of exit codes (DON'T use in CI)
npm run lint ; npm run test

# Parallel (&) — runs simultaneously (Unix only)
npm run dev:server & npm run dev:client

# Pipe (|) — output of one feeds into next
npm run build 2>&1 | tee build.log

# concurrently — cross-platform parallel execution with colored output
npx concurrently "npm:dev:*"  # runs all scripts matching dev:*

# npm-run-all — flexible sequential/parallel composition
npx npm-run-all --parallel lint typecheck
npx npm-run-all --sequential build deploy`}
      </CodeBlock>

      <InfoBox variant="warning" title="Don't Use & on Windows">
        The <code>&</code> operator for background processes is Unix-only. Use the
        <code>concurrently</code> package for cross-platform parallel script execution.
        It also gives you better output formatting and error handling.
      </InfoBox>

      <h2>Practical: Complete Scripts for a React + TypeScript Project</h2>

      <CodeBlock language="json" title="Production-ready scripts section">
{`{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",

    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",

    "lint": "eslint src/ --max-warnings 0",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write 'src/**/*.{ts,tsx,css}'",
    "format:check": "prettier --check 'src/**/*.{ts,tsx,css}'",

    "typecheck": "tsc --noEmit",

    "clean": "rimraf dist coverage",
    "clean:all": "rimraf dist coverage node_modules",

    "validate": "npm run typecheck && npm run lint && npm run test",
    "ci": "npm run validate && npm run build",

    "prepare": "husky install",
    "pre-commit": "lint-staged"
  }
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"You run 'npm run test --watch'. Why doesn't Jest enter watch mode?"}
        options={[
          "Jest doesn't support --watch",
          "The --watch flag is consumed by npm, not passed to Jest",
          "You need to install jest-watch separately",
          "Watch mode only works with npm test, not npm run test"
        ]}
        correctIndex={1}
        explanation={"Without the -- separator, flags are interpreted by npm itself, not passed to the underlying script. The correct command is 'npm run test -- --watch' (or 'npm test -- --watch'). The double dash tells npm to pass everything after it to the script command."}
      />

      <InteractiveChallenge
        question="What does the 'prepare' lifecycle script do?"
        options={[
          "Runs before every npm command",
          "Runs after npm install in dev and before npm publish",
          "Runs only when you explicitly call npm run prepare",
          "Runs before the package is downloaded from the registry"
        ]}
        correctIndex={1}
        explanation="The 'prepare' script runs automatically after 'npm install' during local development and before 'npm publish'. This makes it perfect for setting up git hooks (husky) or running build steps. It does NOT run when your package is installed as a dependency by someone else (unless they install from git)."
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>npm scripts are shell commands defined in package.json, run with <code>npm run name</code></li>
        <li>npm adds node_modules/.bin to PATH, making installed CLIs available by name</li>
        <li>Pre/post hooks run automatically: preBUILD → build → postBUILD</li>
        <li>Use <code>--</code> to pass arguments through: <code>npm run test -- --watch</code></li>
        <li>The <code>prepare</code> lifecycle is ideal for build steps and git hooks</li>
        <li>Use concurrently or npm-run-all for parallel/sequential script composition</li>
        <li>Use cross-env and rimraf for Windows compatibility</li>
      </ul>
    </LessonLayout>
  );
}
