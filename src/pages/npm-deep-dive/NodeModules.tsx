import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NodeModules() {
  return (
    <LessonLayout
      title="node_modules & Hoisting"
      sectionId="npm-deep-dive"
      lessonIndex={2}
      prev={{ path: '/npm-deep-dive/resolution', label: 'Dependency Resolution' }}
      next={{ path: '/npm-deep-dive/lockfile', label: 'Lockfiles & Reproducibility' }}
    >
      <h2>How Node.js Finds Modules</h2>
      <p>
        When your code calls <code>require('lodash')</code> or <code>import ... from 'lodash'</code>,
        Node.js uses a specific algorithm to locate the module. Understanding this algorithm
        explains WHY node_modules is structured the way it is.
      </p>

      <FlowChart
        title="Node.js Module Resolution Algorithm"
        chart={"graph TD\n  A[require 'lodash'] --> B[Is it a core module?]\n  B -->|Yes| C[Return core module]\n  B -->|No| D[Check ./node_modules/lodash]\n  D -->|Found| E[Return it]\n  D -->|Not found| F[Check ../node_modules/lodash]\n  F -->|Found| E\n  F -->|Not found| G[Check ../../node_modules/lodash]\n  G --> H[Keep going up to filesystem root]\n  H -->|Not found anywhere| I[MODULE_NOT_FOUND error]"}
      />

      <CodeBlock language="javascript" title="Module resolution in practice">
{`// If your file is at: /project/src/utils/helper.js
// and you do: require('lodash')

// Node.js checks (in order):
// 1. /project/src/utils/node_modules/lodash
// 2. /project/src/node_modules/lodash
// 3. /project/node_modules/lodash          ← usually found here
// 4. /node_modules/lodash
// 5. (throws MODULE_NOT_FOUND)

// For relative imports: require('./foo')
// Node checks: ./foo.js, ./foo.json, ./foo/index.js

// For package imports, once the package dir is found:
// 1. Check "exports" field in package.json
// 2. Check "main" field in package.json
// 3. Default to index.js`}
      </CodeBlock>

      <InfoBox variant="info" title="This Is Why Hoisting Works">
        Because Node.js walks UP the directory tree looking for node_modules, a package
        at the top-level node_modules is accessible from any nested file. This is the
        foundation that enables npm's flat hoisting strategy.
      </InfoBox>

      <h2>Flat vs Nested node_modules</h2>
      <p>
        npm has changed its node_modules strategy over time. Understanding both approaches
        explains many of the quirks you encounter:
      </p>

      <h3>npm v2 (Legacy): Deeply Nested</h3>
      <CodeBlock language="bash" title="npm v2 nested structure">
{`# npm v2 installed dependencies INSIDE each package's own node_modules
node_modules/
├── express/
│   └── node_modules/
│       ├── accepts/
│       │   └── node_modules/
│       │       └── mime-types/
│       │           └── node_modules/
│       │               └── mime-db/
│       ├── body-parser/
│       │   └── node_modules/
│       │       ├── bytes/
│       │       └── content-type/
│       └── ...40 more nested packages

# Problems:
# - Windows path length limit (260 chars) easily exceeded
# - Massive duplication (same package installed dozens of times)
# - Extremely slow installs
# - node_modules could be 500MB+ for a simple app`}
      </CodeBlock>

      <h3>npm v3+ (Current): Flat with Hoisting</h3>
      <CodeBlock language="bash" title="npm v3+ flat structure">
{`# npm v3+ hoists everything possible to the top level
node_modules/
├── accepts/            ← hoisted (express needs it)
├── body-parser/        ← hoisted
├── bytes/              ← hoisted
├── content-type/       ← hoisted
├── express/            ← your direct dependency
├── mime-db/            ← hoisted
├── mime-types/         ← hoisted
└── ...

# Result:
# - No path length issues
# - Minimal duplication
# - Faster installs
# - BUT introduces phantom dependencies (see below)`}
      </CodeBlock>

      <h2>Hoisting Explained</h2>
      <p>
        Hoisting is npm's strategy of placing transitive dependencies at the top level of
        node_modules. If express depends on accepts, and nothing else conflicts, accepts
        gets "hoisted" to the root node_modules — right next to express.
      </p>

      <CodeBlock language="bash" title="Hoisting in action">
{`# What you declared:
# package.json: { "dependencies": { "express": "^4.18.0" } }

# What npm installs (simplified):
node_modules/
├── express/           ← your dependency
├── accepts/           ← express's dependency, HOISTED to top
├── body-parser/       ← express's dependency, HOISTED
├── cookie/            ← express's dependency, HOISTED
├── debug/             ← express's dependency, HOISTED
├── ...
└── .package-lock.json

# express has 30+ transitive deps, ALL hoisted flat alongside it`}
      </CodeBlock>

      <h2>The Phantom Dependency Problem</h2>
      <p>
        Here's the dark side of hoisting. Because express's dependencies are hoisted to
        the top level, YOUR code can accidentally import them — even though you never
        declared them in your package.json.
      </p>

      <CodeBlock language="javascript" title="Phantom dependency bug">
{`// Your package.json only has: "express": "^4.18.0"
// But this WORKS because 'debug' is hoisted:
const debug = require('debug');  // No error!

// This is a PHANTOM DEPENDENCY — you depend on it without declaring it.
// Problems:
// 1. If express drops 'debug' in a future version, your code breaks
// 2. If express switches to a different version of 'debug', behavior changes
// 3. Another developer's npm install might hoist differently
// 4. CI/CD might resolve a different tree

// The fix: explicitly add 'debug' to YOUR package.json
// npm install debug`}
      </CodeBlock>

      <InfoBox variant="warning" title="Phantom Deps Are Real Bugs">
        If you import a package you didn't declare, it's a ticking time bomb. It works
        today because of your current dependency tree, but any <code>npm update</code> or
        lockfile change could break it. Always declare what you import. Use tools like
        eslint-plugin-import to catch undeclared dependencies.
      </InfoBox>

      <h2>Why node_modules Is Huge</h2>
      <CodeBlock language="bash" title="Understanding node_modules size">
{`# Check total size
du -sh node_modules
# 250M   node_modules (typical React project)

# Find the biggest packages
du -sh node_modules/* | sort -rh | head -20
# 15M    node_modules/@babel
# 12M    node_modules/typescript
# 8.5M   node_modules/@types
# 6.2M   node_modules/esbuild

# Count total packages
ls node_modules | wc -l
# 847 (typical for a React + testing setup)

# Why so many? Each package has its own deps:
# react-scripts → webpack → 200+ packages
# jest → babel → 150+ packages
# typescript alone is 12MB of compiler code`}
      </CodeBlock>

      <h2>Hidden Files in node_modules</h2>

      <h3>node_modules/.package-lock.json</h3>
      <p>
        This hidden file is a cached copy of the dependency tree information, used to speed
        up subsequent installs. It's different from the root package-lock.json — it represents
        the ACTUAL installed state of node_modules.
      </p>

      <h3>node_modules/.bin/</h3>
      <p>
        This directory contains symlinks to CLI executables provided by installed packages.
        When you run <code>npx jest</code> or use a script like <code>"test": "jest"</code>,
        npm finds the binary here.
      </p>

      <CodeBlock language="bash" title="The .bin directory">
{`# List available binaries
ls node_modules/.bin/
# eslint  jest  prettier  tsc  tsx  vite  ...

# These are symlinks to the actual executables
ls -la node_modules/.bin/jest
# jest -> ../jest-cli/bin/jest.js

# This is how npm scripts find executables:
# npm adds node_modules/.bin to PATH when running scripts
# So "scripts": { "test": "jest" } works without a full path

# You can run any binary directly:
./node_modules/.bin/jest --version
# or equivalently:
npx jest --version`}
      </CodeBlock>

      <h2>pnpm's Alternative Approach</h2>
      <p>
        pnpm solves the phantom dependency problem and disk waste with a completely different
        strategy: a content-addressable store plus symlinks.
      </p>

      <CodeBlock language="bash" title="pnpm node_modules structure">
{`# pnpm's structure:
node_modules/
├── .pnpm/                          ← all packages live here
│   ├── express@4.18.2/
│   │   └── node_modules/
│   │       ├── express/            ← the actual package files
│   │       ├── accepts → symlink   ← only ITS deps are linked
│   │       └── body-parser → symlink
│   └── lodash@4.17.21/
│       └── node_modules/
│           └── lodash/             ← actual files
├── express → .pnpm/express@4.18.2/node_modules/express  ← symlink
└── lodash → .pnpm/lodash@4.17.21/node_modules/lodash    ← symlink

# Benefits:
# - No phantom deps (only YOUR declared deps are at top level)
# - Content-addressable store: shared across ALL projects on disk
# - Much less disk space overall
# - Strict correctness`}
      </CodeBlock>

      <InfoBox variant="tip" title="pnpm's Global Store">
        pnpm stores all package files in a global content-addressable store
        (usually ~/.local/share/pnpm/store). Each file is stored once by its content hash.
        node_modules contains hard links to this store, so 10 projects using lodash@4.17.21
        share the same bytes on disk.
      </InfoBox>

      <h2>Controlling What Gets Published</h2>
      <p>
        When you publish a package, not everything in your project directory goes into the
        tarball. Two mechanisms control this:
      </p>

      <CodeBlock language="bash" title=".npmignore and files field">
{`# Method 1: .npmignore (blacklist — exclude specific files)
# .npmignore:
src/
tests/
__mocks__/
.eslintrc
tsconfig.json
*.test.js

# Method 2: "files" field in package.json (whitelist — PREFERRED)
# Only these files/dirs are published:
{
  "files": [
    "dist/",
    "types/",
    "README.md",
    "LICENSE"
  ]
}

# NOTE: Some files are ALWAYS included regardless:
# - package.json
# - README (any case/extension)
# - LICENSE / LICENCE
# - CHANGELOG

# Some files are ALWAYS excluded:
# - node_modules/
# - .git/
# - .npmrc
# - package-lock.json`}
      </CodeBlock>

      <h2>Practical: Analyzing Your node_modules</h2>

      <CodeBlock language="bash" title="node_modules forensics">
{`# Total size
du -sh node_modules

# Number of packages
find node_modules -maxdepth 1 -type d | wc -l

# Find largest individual packages
du -sh node_modules/* 2>/dev/null | sort -rh | head -10

# Find duplicate packages (different versions installed)
npm ls --all 2>/dev/null | grep -v "deduped" | sort | uniq -d

# See total dependencies (including transitive)
npm ls --all --parseable | wc -l

# Check if you can reduce size
npm dedupe --dry-run

# Alternative: use npx to run analysis tools
npx depcheck           # find unused dependencies
npx cost-of-modules    # show install time per dep`}
      </CodeBlock>

      <InteractiveChallenge
        question="You only installed 'express' in your package.json, but your code successfully imports 'debug' without errors. What's happening?"
        options={[
          "debug is a Node.js built-in module",
          "express re-exports debug for convenience",
          "debug was hoisted to top-level node_modules because express depends on it",
          "npm automatically installs commonly-used packages"
        ]}
        correctIndex={2}
        explanation="This is the phantom dependency problem. Since express depends on debug, and npm hoists transitive dependencies to the top-level node_modules, debug becomes accessible to your code even though you never declared it. This works by accident and can break unexpectedly."
      />

      <InteractiveChallenge
        question="Why does pnpm prevent phantom dependencies while npm does not?"
        options={[
          "pnpm uses a different registry with stricter rules",
          "pnpm only symlinks YOUR declared dependencies to the top-level node_modules",
          "pnpm doesn't install transitive dependencies at all",
          "pnpm modifies Node.js module resolution"
        ]}
        correctIndex={1}
        explanation="pnpm only creates symlinks at the top level of node_modules for packages you explicitly declared in your package.json. Transitive dependencies live in the nested .pnpm directory and are only accessible to the packages that declared them. This enforces correctness — you can only import what you've declared."
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>Node.js resolves modules by walking up the directory tree looking for node_modules folders</li>
        <li>npm v3+ uses flat hoisting to avoid deep nesting and duplication</li>
        <li>Hoisting creates phantom dependencies — you can import things you didn't declare</li>
        <li>node_modules/.bin/ holds CLI executables; npm scripts use it via PATH</li>
        <li>pnpm's symlink approach solves phantom deps and saves disk space</li>
        <li>Use the "files" field (whitelist) to control what your package publishes</li>
      </ul>
    </LessonLayout>
  );
}
