import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NpkgPackageJson() {
  return (
    <LessonLayout
      title="package.json Deep Dive"
      sectionId="npm-packages"
      lessonIndex={1}
      prev={{ path: '/npm-packages/anatomy', label: 'Package Anatomy' }}
      next={{ path: '/npm-packages/modules', label: 'CJS vs ESM' }}
    >
      <h2>Complete package.json Reference</h2>
      <p>
        <code>package.json</code> is the manifest for your package. Every field has a specific purpose.
        This is the definitive reference for building publishable packages.
      </p>

      <CodeBlock language="json" title="Complete package.json for a library">
{`{
  // ── Identity ──────────────────────────────────────
  "name": "@myorg/my-library",   // scoped: @org/name, unscoped: name
  "version": "2.1.3",            // semver MAJOR.MINOR.PATCH
  "description": "A helpful library for doing things",
  "keywords": ["react", "hooks", "utilities"],
  "homepage": "https://my-library.dev",
  "bugs": {
    "url": "https://github.com/myorg/my-library/issues",
    "email": "bugs@myorg.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/myorg/my-library.git",
    "directory": "packages/my-library"  // monorepo subdirectory
  },
  "license": "MIT",
  "author": {
    "name": "Alice Smith",
    "email": "alice@myorg.com",
    "url": "https://alice.dev"
  },

  // ── Entry Points ──────────────────────────────────
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./package.json": "./package.json"
  },

  // ── Files ─────────────────────────────────────────
  "files": ["dist", "README.md"],  // published files whitelist

  // ── Scripts ───────────────────────────────────────
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "test": "vitest run",
    "lint": "eslint src",
    "prepublishOnly": "npm run build && npm test"
  },

  // ── Dependencies ──────────────────────────────────
  "dependencies": {},             // runtime deps (bundled or peer)
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "tsup": "^8.0.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0"           // host must provide
  },
  "peerDependenciesMeta": {
    "react": { "optional": false }
  },
  "optionalDependencies": {},

  // ── Constraints ───────────────────────────────────
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.0.0",

  // ── Module System ─────────────────────────────────
  "type": "module",               // treat .js as ESM (or "commonjs")
  "sideEffects": false,           // safe to tree-shake

  // ── Publishing ────────────────────────────────────
  "private": false,               // allow publishing
  "publishConfig": {
    "access": "public",           // required for scoped public packages
    "registry": "https://registry.npmjs.org"
  },

  // ── Workspace (monorepo) ──────────────────────────
  "workspaces": ["packages/*", "apps/*"]
}`}
      </CodeBlock>

      <h2>The 'type' Field</h2>

      <CodeBlock language="json" title="module vs commonjs type">
{`// "type": "module" → .js files are treated as ESM
// "type": "commonjs" → .js files are treated as CJS (default)

// Regardless of "type":
// .mjs files → always ESM
// .cjs files → always CJS

// Example: type: "module" project
// src/index.ts compiles to dist/index.js (ESM)
// Must use import/export, not require()
// Node.js treats all .js as ESM

// Library publishing tip:
// Don't set "type" in your dist files
// Use explicit .mjs and .cjs extensions instead
// This way consumers don't need a specific "type" setting`}
      </CodeBlock>

      <h2>The 'sideEffects' Field</h2>

      <CodeBlock language="json" title="Tree shaking with sideEffects">
{`// "sideEffects": false
// Tells bundlers: ALL modules in this package are side-effect free
// Bundlers can tree-shake ANY unused export

// "sideEffects": ["*.css", "src/polyfills.js"]
// Some files have side effects (CSS imports, polyfills)
// Bundlers will keep these even if not explicitly imported

// Example: a CSS-in-JS library
{
  "sideEffects": ["**/*.css", "src/global.ts"]
}

// Effect on bundling:
// Without sideEffects: false, bundlers keep ALL imported modules
// With sideEffects: false, unused named exports are eliminated
// This can dramatically reduce bundle size for large libraries`}
      </CodeBlock>

      <h2>version and Versioning Workflow</h2>

      <CodeBlock language="bash" title="npm version command">
{`# Bump version automatically (also creates git tag)
npm version patch    # 1.0.0 → 1.0.1
npm version minor    # 1.0.0 → 1.1.0
npm version major    # 1.0.0 → 2.0.0

# Pre-release versions
npm version prerelease --preid=alpha    # 1.0.0 → 1.0.1-alpha.0
npm version prerelease --preid=beta     # 1.0.0 → 1.0.1-beta.0
npm version 2.0.0-rc.1                  # set specific pre-release

# Version + push workflow
npm version minor && git push --follow-tags

# What npm version does:
# 1. Updates "version" in package.json
# 2. Runs npm version scripts (preversion, version, postversion)
# 3. Creates a git commit: "v1.1.0"
# 4. Creates a git tag: v1.1.0`}
      </CodeBlock>

      <h2>scripts for Libraries</h2>

      <CodeBlock language="json" title="Typical library scripts">
{`{
  "scripts": {
    // Build with tsup (TypeScript → CJS + ESM + .d.ts)
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "build:watch": "tsup src/index.ts --format esm,cjs --dts --watch",

    // Test
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",

    // Type checking
    "typecheck": "tsc --noEmit",

    // Lint
    "lint": "eslint src --ext .ts,.tsx",

    // Publish lifecycle
    "prepublishOnly": "npm run build && npm run test && npm run lint",
    "prepack": "npm run build",

    // Release
    "release": "changeset publish",
    "version": "changeset version && npm install"
  }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="publishConfig.access for Scoped Packages">
        <p>
          Scoped packages (<code>@myorg/my-lib</code>) are private by default on npm.
          To publish them publicly, you must set <code>"publishConfig": {"{"}"access": "public"{"}"}</code>
          in <code>package.json</code>. Without this, <code>npm publish</code> will fail with a
          payment required error.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What does 'sideEffects: false' in package.json tell bundlers?"
        options={[
          "The package has no security vulnerabilities",
          "All modules in the package are safe to remove if their exports are not imported",
          "The package does not modify global scope",
          "The package is compatible with all JavaScript environments"
        ]}
        correctIndex={1}
        explanation="'sideEffects: false' is a hint to bundlers (Webpack, Rollup, esbuild) that every module in the package is side-effect free — importing a module only for its exports won't cause observable behavior. This enables aggressive tree shaking: if you import { add } from 'my-lib' but never use subtract, bundlers can safely exclude the subtract module entirely from the output bundle."
      />

      <InteractiveChallenge
        question="What does the 'prepublishOnly' lifecycle script do?"
        options={[
          "Runs before every npm install in the project",
          "Runs only before npm publish, not before npm pack or npm install",
          "Runs before publishing AND before installation as a dependency",
          "Prevents publishing if the script exits with an error"
        ]}
        correctIndex={1}
        explanation="'prepublishOnly' runs only before 'npm publish', not before 'npm pack' or 'npm install'. This makes it ideal for final checks: run build, tests, and lint. If any step fails (non-zero exit code), npm aborts the publish. Compare with 'prepare' which runs after install too — 'prepublishOnly' is more targeted for build/test gates before publishing."
      />
    </LessonLayout>
  );
}
