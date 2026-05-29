import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Anatomy() {
  return (
    <LessonLayout
      title="Anatomy of a Package"
      sectionId="npm-packages"
      lessonIndex={0}
      prev={null}
      next={{ path: '/npm-packages/package-json', label: 'package.json Deep Dive' }}
    >
      <h2>What IS an npm Package?</h2>
      <p>
        At its core, an npm package is just a directory with a <code>package.json</code> file.
        That's it. When published to the registry, it becomes a gzipped tarball (.tgz) of that
        directory. Everything else — TypeScript, build steps, tests, CI — is optional layering
        on top of this simple foundation.
      </p>

      <CodeBlock language="bash" title="The absolute minimal package">
{`# Create the simplest possible npm package:
mkdir my-package && cd my-package

# The ONLY required file:
cat package.json
{
  "name": "my-package",
  "version": "1.0.0"
}

# That's a valid npm package. You could publish it right now.
# (It wouldn't DO anything, but it's technically valid)

# Add an entry point:
echo "module.exports = { hello: () => 'world' };" > index.js

# Now it's a USEFUL package:
# require('my-package') returns { hello: [Function] }`}
      </CodeBlock>

      <InfoBox variant="info" title="Package vs Module">
        Technically, a "package" is anything with a package.json. A "module" is anything
        Node.js can load with <code>require()</code> or <code>import</code>. Most packages
        are modules, but not all modules are packages (e.g., a single .js file is a module
        but not a package). In practice, people use the terms interchangeably.
      </InfoBox>

      <h2>Standard Directory Structure</h2>
      <p>
        While no structure is enforced, the community has converged on conventions.
        Here's what a well-structured package looks like:
      </p>

      <FlowChart
        title="Typical Package Structure"
        chart={"graph TD\n  A[my-package/] --> B[package.json]\n  A --> C[README.md]\n  A --> D[LICENSE]\n  A --> E[CHANGELOG.md]\n  A --> F[src/]\n  A --> G[dist/]\n  A --> H[types/]\n  F --> I[index.ts - source code]\n  F --> J[utils.ts]\n  G --> K[index.mjs - ESM build]\n  G --> L[index.cjs - CJS build]\n  H --> M[index.d.ts - type declarations]"}
      />

      <CodeBlock language="bash" title="Full directory layout">
{`my-package/
├── package.json          # Package metadata and config (REQUIRED)
├── README.md             # Documentation shown on npmjs.com
├── LICENSE               # Legal terms (MIT, Apache-2.0, etc.)
├── CHANGELOG.md          # Version history
├── src/                  # Source code (TypeScript/modern JS)
│   ├── index.ts          # Main entry point
│   ├── utils.ts          # Internal utilities
│   └── types.ts          # Type definitions
├── dist/                 # Built output (generated, gitignored)
│   ├── index.mjs         # ESM build
│   ├── index.cjs         # CommonJS build
│   └── index.d.ts        # TypeScript declarations
├── bin/                  # CLI executables (if package has a CLI)
│   └── cli.js            # #!/usr/bin/env node
├── tests/                # Test files (not published)
│   └── index.test.ts
├── .gitignore            # Git ignore rules
├── .npmignore            # npm publish ignore rules (or use "files")
├── tsconfig.json         # TypeScript config (not published)
└── tsup.config.ts        # Build tool config (not published)`}
      </CodeBlock>

      <h2>Entry Points</h2>
      <p>
        Entry points tell Node.js and bundlers WHERE to find your package's code when someone
        imports it. There are multiple fields because the ecosystem has evolved over time:
      </p>

      <CodeBlock language="json" title="Entry point fields in package.json">
{`{
  "name": "my-package",
  "version": "1.0.0",

  "main": "./dist/index.cjs",
  
  "module": "./dist/index.mjs",
  
  "types": "./dist/index.d.ts",
  
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs"
    }
  }
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="What each entry point does">
{`# "main" — The OG entry point (CommonJS)
# Used by: require('my-package')
# Node.js looks here when you require() the package
# Points to: CJS file (.cjs or .js)

# "module" — ESM entry for bundlers (non-standard but widely supported)
# Used by: Webpack, Rollup, Vite (NOT Node.js directly)
# Allows bundlers to get tree-shakeable ESM code
# Points to: ESM file (.mjs or .js with "type": "module")

# "types" / "typings" — TypeScript declarations
# Used by: TypeScript compiler (tsc), IDE IntelliSense
# Points to: .d.ts file

# "exports" — The modern, definitive entry point map
# Used by: Node.js 12.7+, all modern bundlers
# Replaces main/module/types with a single, comprehensive config
# Supports conditional exports (different code for import vs require)
# ALSO controls what subpaths consumers can import

# Priority: exports > main > module (when exports exists, others are fallback)`}
      </CodeBlock>

      <InfoBox variant="tip" title="Always Include Both 'exports' and 'main'">
        While <code>exports</code> is the modern standard, older tools and Node.js versions
        fall back to <code>main</code>. Include both for maximum compatibility. The
        <code>exports</code> field takes priority when supported.
      </InfoBox>

      <h2>What Gets Published</h2>
      <p>
        When you run <code>npm publish</code>, NOT everything in your project goes into the
        tarball. Understanding what's included and excluded prevents common publishing mistakes.
      </p>

      <CodeBlock language="bash" title="Publishing rules">
{`# ALWAYS INCLUDED (cannot be excluded):
# - package.json
# - README (any casing: README.md, readme.txt, etc.)
# - LICENSE / LICENCE (any casing/extension)
# - The file specified in "main"
# - The file specified in "bin"

# ALWAYS EXCLUDED (cannot be included):
# - .git/
# - node_modules/
# - .npmrc (for security — may contain tokens)
# - package-lock.json (consumers use their own)
# - .gitignore'd files (if no .npmignore exists)
# - .DS_Store, .wafpickle-*, *.swp, etc.

# CONFIGURABLE via "files" field or .npmignore:
# - src/ (source code — usually excluded)
# - dist/ (built code — usually included)
# - tests/ (usually excluded)
# - docs/ (usually excluded)
# - config files (tsconfig, eslint, etc. — usually excluded)`}
      </CodeBlock>

      <h2>The "files" Field (Whitelist Approach)</h2>
      <p>
        The preferred way to control what gets published is the <code>"files"</code> array
        in package.json. It's a whitelist — only listed files/directories are included.
      </p>

      <CodeBlock language="json" title="Using the files field">
{`{
  "name": "my-package",
  "version": "1.0.0",
  "files": [
    "dist/",
    "types/",
    "bin/"
  ]
}

// What gets published:
// ✅ package.json (always)
// ✅ README.md (always)
// ✅ LICENSE (always)
// ✅ dist/**/* (listed in files)
// ✅ types/**/* (listed in files)
// ✅ bin/**/* (listed in files)
// ❌ src/ (not listed)
// ❌ tests/ (not listed)
// ❌ tsconfig.json (not listed)
// ❌ .eslintrc (not listed)
// ❌ node_modules/ (always excluded)`}
      </CodeBlock>

      <InfoBox variant="warning" title="files Whitelist vs .npmignore Blacklist">
        Use <code>"files"</code> (whitelist) over <code>.npmignore</code> (blacklist).
        With a whitelist, you explicitly declare what's published — if you forget something,
        it's just missing. With a blacklist, if you forget to exclude something (like a .env
        file with secrets), it gets published to the public registry permanently.
      </InfoBox>

      <h2>npm pack — Preview Your Package</h2>
      <p>
        Before publishing, ALWAYS verify what will be in your package. <code>npm pack</code>
        creates the exact tarball that would be published, so you can inspect it.
      </p>

      <CodeBlock language="bash" title="Using npm pack">
{`# Create the tarball (without publishing)
npm pack
# Creates: my-package-1.0.0.tgz

# List what would be included (without creating the file)
npm pack --dry-run
# Output:
# npm notice 📦  my-package@1.0.0
# npm notice === Tarball Contents ===
# npm notice 1.2kB  package.json
# npm notice 856B   README.md
# npm notice 1.1kB  LICENSE
# npm notice 3.4kB  dist/index.mjs
# npm notice 3.2kB  dist/index.cjs
# npm notice 1.8kB  dist/index.d.ts
# npm notice === Tarball Details ===
# npm notice name:          my-package
# npm notice version:       1.0.0
# npm notice package size:  4.2 kB
# npm notice unpacked size: 11.5 kB
# npm notice total files:   6

# Inspect the tarball contents
tar tzf my-package-1.0.0.tgz
# package/package.json
# package/README.md
# package/LICENSE
# package/dist/index.mjs
# package/dist/index.cjs
# package/dist/index.d.ts

# Install from tarball to test locally
npm install ./my-package-1.0.0.tgz`}
      </CodeBlock>

      <h2>README.md</h2>
      <p>
        Your README is displayed on the npmjs.com package page. It's the first thing potential
        users see. A good README makes the difference between adoption and abandonment.
      </p>

      <CodeBlock language="bash" title="README essentials">
{`# A good package README includes:

# 1. Package name and one-line description
# 2. Badges (build status, npm version, coverage)
# 3. Installation instructions
# 4. Quick start / basic usage example
# 5. API reference (or link to docs)
# 6. Configuration options
# 7. TypeScript support notes
# 8. Contributing guidelines (or link)
# 9. License

# The README from your GIT REPO is what gets published.
# npm takes the README at publish time — updating README
# on GitHub doesn't update npmjs.com until you re-publish.`}
      </CodeBlock>

      <h2>LICENSE</h2>
      <p>
        Without a license, your code is copyrighted by default — nobody can legally use it.
        Always include a LICENSE file. The most common choices:
      </p>

      <CodeBlock language="bash" title="Common open-source licenses">
{`# MIT — most popular for npm packages
# "Do whatever you want, just keep the copyright notice"
# Used by: React, Vue, Express, lodash, axios

# Apache-2.0 — like MIT but with patent protection
# "Same as MIT, plus contributors can't sue you for patent infringement"
# Used by: Angular, TypeScript, Kubernetes

# ISC — simplified MIT (functionally identical)
# "Permission to use, copy, modify, and distribute"
# Used by: npm itself, many small utilities

# GPL-3.0 — copyleft (viral)
# "If you use this in your project, your project must also be GPL"
# Used by: Linux, GCC — rare in npm packages for good reason

# For a library you want widely adopted: MIT or ISC
# For a company package: check with legal, usually MIT or Apache-2.0`}
      </CodeBlock>

      <h2>Practical: Creating a Package from Scratch</h2>

      <CodeBlock language="bash" title="Step-by-step package creation">
{`# 1. Create directory and initialize
mkdir my-utils && cd my-utils
npm init -y

# 2. Edit package.json with proper metadata
# (we'll cover this in detail in the next lesson)

# 3. Create source file
mkdir src
cat > src/index.ts << 'EOF'
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
EOF

# 4. Set up build (tsup for simplicity)
npm install -D tsup typescript

# 5. Add build config
cat > tsup.config.ts << 'EOF'
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
});
EOF

# 6. Build it
npx tsup

# 7. Preview what would publish
npm pack --dry-run

# 8. Test locally in another project
npm pack  # creates my-utils-1.0.0.tgz
cd ../test-project
npm install ../my-utils/my-utils-1.0.0.tgz`}
      </CodeBlock>

      <InteractiveChallenge
        question="You published a package but forgot to include the dist/ directory. What's the most likely cause?"
        options={[
          "dist/ was in .gitignore and no 'files' field was specified",
          "npm always excludes directories named 'dist'",
          "The build didn't run before publishing",
          "TypeScript files can't be published to npm"
        ]}
        correctIndex={0}
        explanation="When no 'files' field exists in package.json and no .npmignore exists, npm falls back to using .gitignore to determine what to exclude. Since dist/ is commonly gitignored (it's generated), it gets excluded from the published package too. The fix: add a 'files' field listing dist/, or add an .npmignore that doesn't exclude dist/."
      />

      <InteractiveChallenge
        question="What is the purpose of the 'exports' field in package.json?"
        options={[
          "It lists all functions the package exports",
          "It defines conditional entry points and controls which subpaths consumers can import",
          "It exports environment variables for scripts",
          "It replaces the need for index.js"
        ]}
        correctIndex={1}
        explanation="The 'exports' field serves two purposes: (1) it defines conditional entry points — different files for import vs require, for Node vs browser, etc. (2) It controls encapsulation — consumers can ONLY import paths listed in exports. If './internal' isn't in exports, 'import x from pkg/internal' fails."
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>An npm package is just a directory with a package.json (name + version minimum)</li>
        <li>Entry points: <code>main</code> (CJS), <code>module</code> (ESM for bundlers), <code>exports</code> (modern, definitive)</li>
        <li>Use the <code>"files"</code> whitelist to control what gets published — never ship src/ or tests/</li>
        <li><code>npm pack --dry-run</code> shows exactly what would be published — use it before every publish</li>
        <li>Always include README.md (your package's landing page) and LICENSE (legal requirement)</li>
        <li>The <code>exports</code> field replaces main/module and adds subpath control</li>
      </ul>
    </LessonLayout>
  );
}
