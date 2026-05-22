import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Packages() {
  return (
    <LessonLayout
      title="Package Managers"
      sectionId="frontend-tooling"
      lessonIndex={2}
      prev={{ path: '/frontend-tooling/linting', label: 'ESLint & Prettier' }}
      next={{ path: '/frontend-tooling/monorepos', label: 'Monorepo Strategies' }}
    >
      <h2>npm vs yarn vs pnpm</h2>
      <p>
        All three install packages from the npm registry. The differences are in speed,
        disk usage, and how they handle the <code>node_modules</code> directory. Most
        enterprise teams have standardized on one — learn whichever your team uses, but
        understand the tradeoffs.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Feature</th>
            <th style={{ padding: '0.75rem' }}>npm</th>
            <th style={{ padding: '0.75rem' }}>Yarn (Berry)</th>
            <th style={{ padding: '0.75rem' }}>pnpm</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '0.75rem' }}>Speed</td>
            <td style={{ padding: '0.75rem' }}>Slowest</td>
            <td style={{ padding: '0.75rem' }}>Fast</td>
            <td style={{ padding: '0.75rem' }}>Fastest</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '0.75rem' }}>Disk Usage</td>
            <td style={{ padding: '0.75rem' }}>Duplicates per project</td>
            <td style={{ padding: '0.75rem' }}>PnP or node_modules</td>
            <td style={{ padding: '0.75rem' }}>Content-addressable store</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '0.75rem' }}>Lockfile</td>
            <td style={{ padding: '0.75rem' }}>package-lock.json</td>
            <td style={{ padding: '0.75rem' }}>yarn.lock</td>
            <td style={{ padding: '0.75rem' }}>pnpm-lock.yaml</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '0.75rem' }}>Workspaces</td>
            <td style={{ padding: '0.75rem' }}>Built-in (v7+)</td>
            <td style={{ padding: '0.75rem' }}>Built-in</td>
            <td style={{ padding: '0.75rem' }}>Built-in</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '0.75rem' }}>Strictness</td>
            <td style={{ padding: '0.75rem' }}>Flat hoisting</td>
            <td style={{ padding: '0.75rem' }}>Strict (PnP)</td>
            <td style={{ padding: '0.75rem' }}>Strict (symlinks)</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem' }}>Monorepo Support</td>
            <td style={{ padding: '0.75rem' }}>Basic</td>
            <td style={{ padding: '0.75rem' }}>Good</td>
            <td style={{ padding: '0.75rem' }}>Excellent</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="tip" title="pnpm Is Winning">
        pnpm uses a global content-addressable store and hard links packages into
        each project. If 10 projects use React 18.2.0, it's stored once on disk.
        This saves gigabytes and makes installs nearly instant. Most modern monorepo
        tools (NX, Turborepo) recommend pnpm.
      </InfoBox>

      <h2>package.json Deep Dive</h2>

      <CodeBlock language="json" title="Annotated package.json">
{`{
  "name": "@myorg/web-app",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --max-warnings 0",
    "test": "vitest",
    "test:ci": "vitest run --coverage"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}`}
      </CodeBlock>

      <h3>dependencies vs devDependencies vs peerDependencies</h3>

      <FlowChart
        title="Dependency Types"
        chart={"graph TD\n  A[dependencies] --> B[Shipped to production]\n  A --> C[react, axios, zustand]\n  D[devDependencies] --> E[Build/test tools only]\n  D --> F[vite, eslint, vitest]\n  G[peerDependencies] --> H[Consumer must provide]\n  G --> I[Used by libraries/plugins]"}
      />

      <p>
        <strong>dependencies</strong> — Required at runtime. Included in your production
        bundle. Keep this lean.
      </p>
      <p>
        <strong>devDependencies</strong> — Build tools, linters, test frameworks, type
        definitions. Not included in production. When in doubt, put it here.
      </p>
      <p>
        <strong>peerDependencies</strong> — Used by libraries to say "I need React, but
        the consuming app should provide it." This prevents duplicate React instances.
      </p>

      <h2>Semantic Versioning</h2>

      <CodeBlock language="json" title="Version Range Syntax">
{`{
  "dependencies": {
    "exact":    "18.3.1",
    "patch":    "~18.3.1",
    "minor":    "^18.3.1",
    "any":      "*",
    "range":    ">=18.0.0 <19.0.0"
  }
}`}
      </CodeBlock>

      <p>
        <strong>^</strong> (caret) — Allows minor and patch updates. <code>^18.3.1</code>{' '}
        matches <code>18.3.1</code> through <code>18.x.x</code>. This is the npm
        default and is right for most packages.
      </p>
      <p>
        <strong>~</strong> (tilde) — Allows patch updates only. <code>~18.3.1</code>{' '}
        matches <code>18.3.1</code> through <code>18.3.x</code>. Use for packages that
        break things in minor releases.
      </p>
      <p>
        <strong>exact</strong> — Pins to a specific version. Use for critical dependencies
        where any change could break your app.
      </p>

      <InfoBox variant="warning" title="Always Commit Your Lockfile">
        The lockfile (<code>package-lock.json</code>, <code>pnpm-lock.yaml</code>,
        or <code>yarn.lock</code>) pins exact versions for every transitive dependency.
        Without it, <code>npm install</code> on a different machine might resolve
        different versions, causing "works on my machine" bugs. Never gitignore it.
      </InfoBox>

      <h2>npm Audit and Security</h2>

      <CodeBlock language="bash" title="Security Commands">
{`# Check for known vulnerabilities
npm audit

# Auto-fix what's safe to update
npm audit fix

# Force fix (may introduce breaking changes)
npm audit fix --force

# Generate a detailed report
npm audit --json > audit-report.json

# Only check production dependencies
npm audit --omit=dev`}
      </CodeBlock>

      <h2>.npmrc Configuration</h2>

      <CodeBlock language="bash" title=".npmrc">
{`# Use exact versions by default (no ^ or ~)
save-exact=true

# Enforce the engines field in package.json
engine-strict=true

# Private registry for @myorg scoped packages
@myorg:registry=https://npm.pkg.github.com

# Auto-install peer dependencies (npm v7+)
auto-install-peers=true

# Hoist patterns for pnpm
# public-hoist-pattern[]=*eslint*
# public-hoist-pattern[]=*prettier*`}
      </CodeBlock>

      <h2>patch-package: Fix Broken Dependencies</h2>
      <p>
        Sometimes a dependency has a bug and the maintainer is slow to merge your PR.
        <code>patch-package</code> lets you make changes in <code>node_modules</code>
        and save them as a patch file that's automatically applied on install.
      </p>

      <CodeBlock language="bash" title="Using patch-package">
{`npm install patch-package

# 1. Fix the bug directly in node_modules/broken-lib/index.js
# 2. Generate a patch file
npx patch-package broken-lib

# Creates patches/broken-lib+1.2.3.patch
# 3. Add postinstall script to package.json
# "postinstall": "patch-package"

# The patch is applied automatically on every npm install`}
      </CodeBlock>

      <h2>Checking Bundle Size</h2>

      <CodeBlock language="bash" title="Size Analysis Tools">
{`# Check package size before installing
# Visit: https://bundlephobia.com/package/lodash

# Or use the CLI
npx bundle-phobia lodash

# Compare import costs
# lodash       — 71.5 kB minified (imports everything)
# lodash-es    — tree-shakeable (import only what you use)
# lodash/get   — 1.4 kB (individual function import)

# For your own bundle, use vite-bundle-visualizer
npm install -D rollup-plugin-visualizer
# Add to vite.config.ts plugins array:
# import { visualizer } from 'rollup-plugin-visualizer';
# plugins: [react(), visualizer({ open: true })]`}
      </CodeBlock>

      <InfoBox variant="info" title="Import Cost VS Code Extension">
        Install the "Import Cost" extension in VS Code. It shows the gzipped size of
        every import inline in your editor. This constant visibility makes you think
        twice before adding a 200kB dependency for one utility function.
      </InfoBox>

      <h2>Dependency Update Strategies</h2>

      <CodeBlock language="bash" title="Manual Update Commands">
{`# See what's outdated
npm outdated

# Update within semver ranges
npm update

# Update a specific package to latest
npm install react@latest

# Interactive update with pnpm
pnpm update --interactive --latest`}
      </CodeBlock>

      <h3>Automated Updates: Renovate vs Dependabot</h3>
      <p>
        Both create PRs to update dependencies. Renovate is more configurable (grouping,
        scheduling, auto-merge rules). Dependabot is built into GitHub and easier to start.
      </p>

      <CodeBlock language="json" title="renovate.json">
{`{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "packageRules": [
    {
      "matchPackagePatterns": ["eslint", "prettier"],
      "groupName": "linting tools",
      "automerge": true
    },
    {
      "matchPackagePatterns": ["@types/*"],
      "groupName": "type definitions",
      "automerge": true
    }
  ],
  "schedule": ["before 7am on Monday"]
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"What does the caret (^) in \"^18.3.1\" allow?"}
        options={[
          "Only exact version 18.3.1",
          "Patch updates only (18.3.x)",
          "Minor and patch updates (18.x.x)",
          "Any version including major updates"
        ]}
        correctIndex={2}
        explanation={"The caret (^) is the most common semver range. ^18.3.1 means >=18.3.1 and <19.0.0 — it allows any minor or patch update within the same major version. This is npm's default behavior when you run npm install."}
      />

      <h2>The exports Field</h2>
      <p>
        Modern packages use the <code>exports</code> field to define their public API
        and support both ESM and CJS consumers:
      </p>

      <CodeBlock language="json" title="Package exports (for library authors)">
{`{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils.mjs",
      "types": "./dist/utils.d.ts"
    }
  },
  "types": "./dist/index.d.ts",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs"
}`}
      </CodeBlock>

      <InfoBox variant="note" title="scripts Field Powers">
        The <code>scripts</code> field supports lifecycle hooks like <code>preinstall</code>,
        <code>postinstall</code>, <code>pretest</code>, and <code>postbuild</code>.
        Use <code>postinstall</code> to run patch-package, and <code>prebuild</code> to
        clean the dist folder. Run any script with <code>npm run &lt;name&gt;</code>.
      </InfoBox>
    </LessonLayout>
  );
}
