import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Advanced() {
  return (
    <LessonLayout
      title="Monorepo Packages & Best Practices"
      sectionId="npm-packages"
      lessonIndex={4}
      prev={{ path: '/npm-packages/publishing', label: 'Publishing & Versioning' }}
      next={null}
    >
      <h2>npm Workspaces</h2>
      <p>
        npm workspaces (introduced in npm 7) let you manage multiple packages in a single
        repository. Each package has its own package.json but shares a single node_modules
        at the root. This is the foundation of monorepo development.
      </p>

      <CodeBlock language="json" title="Root package.json with workspaces">
{`{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}

// Directory structure:
// my-monorepo/
// ├── package.json          (root — declares workspaces)
// ├── package-lock.json     (single lockfile for ALL packages)
// ├── node_modules/         (shared — all deps hoisted here)
// ├── packages/
// │   ├── utils/
// │   │   └── package.json  (name: "@myorg/utils")
// │   ├── ui/
// │   │   └── package.json  (name: "@myorg/ui")
// │   └── config/
// │       └── package.json  (name: "@myorg/config")
// └── apps/
//     ├── web/
//     │   └── package.json  (name: "@myorg/web")
//     └── api/
//         └── package.json  (name: "@myorg/api")`}
      </CodeBlock>

      <FlowChart
        title="Monorepo Package Structure"
        chart={"graph TD\n  A[Root package.json] --> B[packages/utils]\n  A --> C[packages/ui]\n  A --> D[packages/config]\n  A --> E[apps/web]\n  A --> F[apps/api]\n  E --> B\n  E --> C\n  F --> B\n  F --> D\n  C --> B\n  C --> D"}
      />

      <h2>Workspace Commands</h2>
      <CodeBlock language="bash" title="Running commands across workspaces">
{`# Install all dependencies for all workspaces
npm install
# This creates a single node_modules at root with everything

# Install a dep in a specific workspace
npm install lodash -w packages/utils
# or: npm install lodash --workspace=packages/utils

# Install a dep in multiple workspaces
npm install jest -w packages/utils -w packages/ui

# Run a script in a specific workspace
npm run build -w packages/utils
npm run test -w packages/ui

# Run a script in ALL workspaces
npm run build --workspaces
# or shorthand:
npm run build -ws

# Run a script in all workspaces, ignore errors
npm run build -ws --if-present
# Skips workspaces that don't have a "build" script

# List all workspaces
npm ls --workspaces --depth=0

# Run npm command in workspace context
npm publish -w packages/utils`}
      </CodeBlock>

      <h2>Cross-Workspace Dependencies</h2>
      <CodeBlock language="json" title="Packages depending on each other">
{`// packages/ui/package.json
{
  "name": "@myorg/ui",
  "version": "1.0.0",
  "dependencies": {
    "@myorg/utils": "workspace:*"
  }
}

// packages/utils/package.json
{
  "name": "@myorg/utils",
  "version": "1.0.0"
}

// When you npm install at root:
// - @myorg/ui gets a symlink to packages/utils
// - Changes to utils are immediately visible to ui
// - No need to rebuild or re-install between changes

// "workspace:*" protocol:
// workspace:*      → any version (resolves to current)
// workspace:^1.0.0 → must satisfy range
// workspace:~1.0.0 → must satisfy range

// When publishing, "workspace:*" is replaced with the actual version:
// "workspace:*" → "^1.0.0" (the current version of @myorg/utils)`}
      </CodeBlock>

      <InfoBox variant="info" title="Workspaces Use Symlinks">
        When workspace A depends on workspace B, npm creates a symlink in A's node_modules
        pointing to B's actual directory. This means changes to B are instantly reflected in A
        without reinstalling — hot reload just works across packages.
      </InfoBox>

      <h2>Internal Packages (Never Published)</h2>
      <p>
        Not every package in a monorepo needs to be published. Internal packages are shared
        code used only within your monorepo — config presets, shared types, internal utilities.
      </p>

      <CodeBlock language="json" title="Internal shared package example">
{`// packages/config/package.json
{
  "name": "@myorg/config",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}

// Notice:
// - "private": true prevents accidental publishing
// - "main" points to SOURCE (not dist) — no build step needed!
// - "types" also points to source
// - version is 0.0.0 (doesn't matter, never published)

// packages/config/src/index.ts
export const API_URL = process.env.API_URL || 'http://localhost:3000';
export const DB_CONFIG = { host: 'localhost', port: 5432 };

// apps/web/src/app.ts — consuming the internal package:
import { API_URL } from '@myorg/config';
// This imports directly from source via the symlink
// Your app's bundler (Vite, Next.js) handles the TypeScript`}
      </CodeBlock>

      <CodeBlock language="json" title="Shared ESLint/TS config package">
{`// packages/eslint-config/package.json
{
  "name": "@myorg/eslint-config",
  "private": true,
  "version": "0.0.0",
  "main": "./index.js",
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint-plugin-react": "^7.33.0"
  }
}

// packages/eslint-config/index.js
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  // ...shared config
};

// apps/web/.eslintrc.js — using the shared config:
module.exports = {
  extends: ['@myorg/eslint-config'],
  // app-specific overrides...
};`}
      </CodeBlock>

      <h2>Package Design Best Practices</h2>

      <h3>1. Single Responsibility</h3>
      <CodeBlock language="bash" title="One package = one purpose">
{`# ❌ BAD: kitchen sink package
@myorg/utils  (contains: string helpers, date formatting, API client,
               validation, logging, config, auth tokens)

# ✅ GOOD: focused packages
@myorg/string-utils    (slugify, truncate, capitalize)
@myorg/date-utils      (format, parse, relative time)
@myorg/api-client      (HTTP client with auth)
@myorg/validation      (schema validation)
@myorg/logger          (structured logging)

# Benefits:
# - Consumers only install what they need
# - Smaller bundle sizes (tree-shaking at package level)
# - Clearer ownership and maintenance
# - Independent versioning`}
      </CodeBlock>

      <h3>2. Minimal Dependencies</h3>
      <CodeBlock language="bash" title="Every dependency you add, your consumers inherit">
{`# ❌ BAD: using lodash for one function
import { camelCase } from 'lodash';  // adds 70KB to consumer's bundle

# ✅ GOOD: implement simple utilities yourself
function camelCase(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

# Or use the individual lodash package:
import camelCase from 'lodash.camelcase';  // 2KB

# Before adding a dependency, ask:
# 1. Can I implement this in <20 lines?
# 2. How many transitive deps does it bring?
# 3. Is it actively maintained?
# 4. Will it increase my package size significantly?`}
      </CodeBlock>

      <h3>3. TypeScript First</h3>
      <CodeBlock language="bash" title="Always ship type declarations">
{`# Your package should include .d.ts files
# This gives consumers:
# - IntelliSense/autocomplete in their IDE
# - Compile-time type checking
# - Self-documenting API

# With tsup, it's automatic:
# tsup.config.ts: { dts: true }

# Verify types are correct:
npx attw --pack .  # "are the types wrong?" tool
# Checks that your types match your actual exports for both CJS and ESM`}
      </CodeBlock>

      <h3>4. Tree-Shakeable</h3>
      <CodeBlock language="javascript" title="Use named exports for tree-shaking">
{`// ❌ BAD: default export of an object
export default {
  slugify: (s) => s.toLowerCase(),
  capitalize: (s) => s.charAt(0).toUpperCase() + s.slice(1),
  truncate: (s, n) => s.slice(0, n),
};
// Consumer gets ALL functions even if they import one

// ✅ GOOD: named exports
export function slugify(s) { return s.toLowerCase(); }
export function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
export function truncate(s, n) { return s.slice(0, n); }
// Consumer's bundler can remove unused exports

// Also in package.json:
// "sideEffects": false
// This tells bundlers it's safe to remove unused exports`}
      </CodeBlock>

      <InfoBox variant="tip" title="Named Exports Over Default Exports">
        Named exports are better for libraries because they enable tree-shaking and provide
        better IDE autocomplete (consumers see all available exports when typing the import).
        Default exports are fine for app-level code but avoid them in published packages.
      </InfoBox>

      <h3>5. Good Documentation</h3>
      <CodeBlock language="bash" title="README template for packages">
{`# package-name

Brief description of what this package does.

## Installation
npm install package-name

## Usage
import { slugify } from 'package-name';
slugify('Hello World'); // 'hello-world'

## API

### slugify(text: string): string
Converts a string to a URL-friendly slug.

### capitalize(text: string): string  
Capitalizes the first letter.

## TypeScript
Full TypeScript support included. No @types/ package needed.

## License
MIT`}
      </CodeBlock>

      <h2>Testing Your Package as a Consumer</h2>
      <CodeBlock language="bash" title="Consumer testing workflow">
{`# Create a temporary test project
mkdir /tmp/test-my-pkg && cd /tmp/test-my-pkg
npm init -y

# Install your package from tarball (most realistic)
cd ../my-package
npm pack
cd /tmp/test-my-pkg
npm install ../my-package/my-package-1.0.0.tgz

# Test CJS import
node -e "const pkg = require('my-package'); console.log(pkg);"

# Test ESM import
node --input-type=module -e "import { slugify } from 'my-package'; console.log(slugify('test'));"

# Test TypeScript resolution
npm install typescript -D
echo 'import { slugify } from "my-package"; slugify(123);' > test.ts
npx tsc --noEmit test.ts
# Should show type error: Argument of type 'number' is not assignable`}
      </CodeBlock>

      <h2>Bundle Size Awareness</h2>
      <CodeBlock language="bash" title="Checking and optimizing package size">
{`# Check what you're publishing
npm pack --dry-run
# Look at "unpacked size" — this is what consumers download

# Analyze your built output
npx esbuild-visualizer  # if using esbuild
npx source-map-explorer dist/index.mjs  # if you have source maps

# Online tools:
# bundlephobia.com — check any published package's size
# pkg-size.dev — similar, shows gzip and tree-shaken sizes

# Common size issues:
# - Shipping source maps in the package (remove or put in separate file)
# - Including test files (fix: "files" field)
# - Large dependencies (find lighter alternatives)
# - Not tree-shaking (use named exports + sideEffects: false)

# Size budget: for utilities, aim for <5KB gzipped
# Check before publish:
npx bundlephobia-cli my-package`}
      </CodeBlock>

      <h2>Common Mistakes</h2>

      <CodeBlock language="bash" title="Publishing pitfalls to avoid">
{`# MISTAKE: Shipping node_modules
# Cause: missing .npmignore and node_modules not in .gitignore
# Fix: "files": ["dist/"] in package.json

# MISTAKE: Missing files field → shipping everything
# Your test fixtures, .env.example, docs/ all get published
# Fix: always set "files" to whitelist only dist/

# MISTAKE: Breaking changes in minor versions
# "I just renamed one function, it's minor right?"
# No — renaming is breaking. Any removal or rename = MAJOR.

# MISTAKE: No type declarations
# TypeScript users (60%+ of npm ecosystem) get no IDE help
# Fix: tsup with dts: true, or separate tsc --emitDeclarationOnly

# MISTAKE: Not testing both CJS and ESM
# "It works with import" — but does it work with require()?
# Fix: test both before every publish

# MISTAKE: Forgetting prepublishOnly
# Publishing without building = publishing old dist/
# Fix: "prepublishOnly": "npm run build && npm run test"`}
      </CodeBlock>

      <h2>Real-World Package Patterns</h2>

      <CodeBlock language="json" title="Pattern: Utility library (like lodash)">
{`{
  "name": "@myorg/utils",
  "version": "3.2.1",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./string": {
      "types": "./dist/string.d.ts",
      "import": "./dist/string.mjs",
      "require": "./dist/string.cjs"
    },
    "./array": {
      "types": "./dist/array.d.ts",
      "import": "./dist/array.mjs",
      "require": "./dist/array.cjs"
    }
  },
  "files": ["dist/"],
  "sideEffects": false,
  "engines": { "node": ">=18" }
}`}
      </CodeBlock>

      <CodeBlock language="json" title="Pattern: React component library">
{`{
  "name": "@myorg/ui",
  "version": "2.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs"
    },
    "./styles.css": "./dist/styles.css"
  },
  "files": ["dist/"],
  "sideEffects": ["*.css"],
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  }
}`}
      </CodeBlock>

      <CodeBlock language="json" title="Pattern: CLI tool">
{`{
  "name": "my-cli-tool",
  "version": "1.5.0",
  "type": "module",
  "bin": {
    "my-cli": "./dist/cli.mjs"
  },
  "files": ["dist/"],
  "engines": { "node": ">=18" },
  "dependencies": {
    "commander": "^11.0.0",
    "chalk": "^5.3.0"
  }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Test Before Every Publish">
        The most common issue with published packages is "it works locally but breaks for
        consumers." This happens because local development uses source files while consumers
        use built output. Always test with <code>npm pack</code> → install in a fresh project
        before publishing.
      </InfoBox>

      <InteractiveChallenge
        question={"In an npm workspace, what does 'workspace:*' mean in a dependency declaration?"}
        options={[
          "Install any version from the public registry",
          "Link to the local workspace package, and replace with the real version when publishing",
          "Always use the latest pre-release version",
          "Skip installing this dependency"
        ]}
        correctIndex={1}
        explanation="The 'workspace:*' protocol tells npm to resolve this dependency to the local workspace package (via symlink). When you publish the package, npm automatically replaces 'workspace:*' with the actual current version (like '^1.2.3'), so consumers get a normal version range in the published package.json."
      />

      <InteractiveChallenge
        question="Why should internal shared packages in a monorepo set 'private: true'?"
        options={[
          "It makes the code invisible to other workspaces",
          "It prevents accidental publication to the npm registry",
          "It makes npm install faster",
          "It enables special monorepo features"
        ]}
        correctIndex={1}
        explanation="Setting 'private: true' causes npm publish to refuse to publish that package. For internal packages that are only used within your monorepo and should never be on the public registry, this is a safety net against accidental publication (e.g., running 'npm publish --workspaces' when only some packages should be public)."
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>npm workspaces enable monorepo development with shared node_modules and single lockfile</li>
        <li><code>workspace:*</code> creates symlinks between local packages; replaced with real versions on publish</li>
        <li>Internal packages use <code>private: true</code> and can point <code>main</code> directly at source</li>
        <li>Design packages with single responsibility, minimal deps, and named exports</li>
        <li>Always ship TypeScript declarations and mark <code>sideEffects: false</code> for tree-shaking</li>
        <li>Test as a consumer (npm pack → install) before every publish</li>
        <li>Use subpath exports to let consumers import specific modules for smaller bundles</li>
      </ul>
    </LessonLayout>
  );
}
