import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NpkgAnatomy() {
  return (
    <LessonLayout
      title="Package Anatomy"
      sectionId="npm-packages"
      lessonIndex={0}
      prev={null}
      next={{ path: '/npm-packages/package-json', label: 'package.json Deep Dive' }}
    >
      <h2>Anatomy of an npm Package</h2>
      <p>
        An npm package is a directory (or tarball) containing JavaScript files and a <code>package.json</code>.
        Understanding the structure helps you build packages that are easy to consume.
      </p>

      <FlowChart
        title="Package Structure"
        chart={"graph TD\n  A[my-package/] --> B[package.json]\n  A --> C[README.md]\n  A --> D[LICENSE]\n  A --> E[src/]\n  A --> F[dist/]\n  A --> G[types/]\n  E --> H[index.ts]\n  F --> I[index.cjs]\n  F --> J[index.mjs]\n  G --> K[index.d.ts]"}
      />

      <h2>Minimal Package</h2>

      <CodeBlock language="bash" title="Creating a package from scratch">
{`mkdir my-utils && cd my-utils
npm init -y

# Resulting structure:
# my-utils/
# ├── package.json
# └── index.js     ← entry point

# index.js
module.exports = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
}

# Test it locally:
node -e "const { add } = require('.'); console.log(add(1, 2))"
# → 3`}
      </CodeBlock>

      <h2>Modern Package Structure</h2>

      <CodeBlock language="bash" title="Modern TypeScript package layout">
{`my-ui-library/
├── src/
│   ├── index.ts          ← source entry (exports everything)
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   └── Input/
│       ├── Input.tsx
│       └── index.ts
├── dist/
│   ├── index.cjs         ← CommonJS build (Node.js)
│   ├── index.mjs         ← ESM build (bundlers)
│   └── index.d.ts        ← TypeScript declarations
├── package.json
├── tsconfig.json
├── tsconfig.build.json   ← tsconfig for building only
├── README.md
└── .npmignore            ← what NOT to publish`}
      </CodeBlock>

      <h2>Entry Points</h2>
      <p>
        Entry points tell bundlers and Node.js where to find your code. Modern packages should
        support both CommonJS (require) and ESM (import) via the <code>exports</code> field.
      </p>

      <CodeBlock language="json" title="package.json entry points">
{`{
  "name": "@myorg/my-ui-library",
  "version": "1.0.0",

  // Legacy entry points (still needed for older tools)
  "main": "./dist/index.cjs",        // require() entry
  "module": "./dist/index.mjs",      // ESM entry (unofficial, Rollup/Webpack)
  "types": "./dist/index.d.ts",      // TypeScript types

  // Modern exports (Node 12+, Vite, Rollup, Webpack 5)
  "exports": {
    ".": {
      "import": "./dist/index.mjs",    // ESM: import X from 'my-lib'
      "require": "./dist/index.cjs",   // CJS: require('my-lib')
      "types": "./dist/index.d.ts"     // TypeScript
    },
    "./button": {
      "import": "./dist/button.mjs",
      "require": "./dist/button.cjs",
      "types": "./dist/button.d.ts"
    }
  }
}`}
      </CodeBlock>

      <h2>.npmignore and files field</h2>
      <p>
        Control what gets published to npm. Only publish what consumers need — source code,
        test files, and dev config should be excluded.
      </p>

      <CodeBlock language="bash" title="Controlling published files">
{`# Option 1: 'files' field in package.json (whitelist — recommended)
{
  "files": [
    "dist",          // only publish dist/
    "types",         // and types/
    "README.md"      // and README
  ]
}
# package.json, README.md, LICENSE are always included

# Option 2: .npmignore (blacklist)
src/
*.test.ts
*.spec.ts
.github/
.vscode/
tsconfig*.json
vitest.config.*
coverage/

# Check what will be published (dry run):
npm pack --dry-run
# Lists all files that would be included

# Actually create the tarball to inspect:
npm pack
tar tf my-package-1.0.0.tgz`}
      </CodeBlock>

      <h2>README Best Practices</h2>

      <CodeBlock language="bash" title="What a good README includes">
{`# my-utils README.md

## my-utils

> One-line description of what the package does.

## Install
\`\`\`
npm install my-utils
\`\`\`

## Usage
\`\`\`js
import { add } from 'my-utils'
add(1, 2) // 3
\`\`\`

## API
| Function | Description | Signature |
|----------|-------------|-----------|
| add      | Adds two numbers | (a: number, b: number) => number |

## License
MIT`}
      </CodeBlock>

      <InfoBox variant="tip" title="Use 'npm pack' to Verify Before Publishing">
        <p>
          Always run <code>npm pack --dry-run</code> before <code>npm publish</code>. It shows you
          exactly which files will be included in the published package. A common mistake is accidentally
          including <code>src/</code> (TypeScript source), test files, or large assets that bloat the package
          size unnecessarily.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the recommended way to control which files are included in a published npm package?"
        options={[
          "Use .npmignore to list files to exclude",
          "Use the 'files' field in package.json to whitelist files to include",
          "Place publishable files in a 'public' directory",
          "Run npm prune before publishing"
        ]}
        correctIndex={1}
        explanation="The 'files' field in package.json is the recommended approach — it's a whitelist of files and directories to include. This is better than .npmignore (blacklist) because: (1) you won't accidentally publish new files you forget to exclude, (2) it's self-documenting, and (3) it co-locates the config with other package metadata. Use 'npm pack --dry-run' to verify what will be published."
      />

      <InteractiveChallenge
        question="What is the 'exports' field in package.json and why is it preferred over 'main'?"
        options={[
          "It replaces README with structured API documentation",
          "It provides conditional exports for ESM/CJS/types and enables subpath imports with proper encapsulation",
          "It lists all the named exports from your package",
          "It specifies which Node.js version can use the package"
        ]}
        correctIndex={1}
        explanation="The 'exports' field (Node.js 12+) enables conditional exports — different entry points for ESM (import) and CJS (require) consumers, plus TypeScript types. It also enables subpath exports (e.g., 'my-lib/button') and encapsulation — files not listed in exports cannot be imported by users. The legacy 'main' field only supports CJS and has no subpath or conditional support."
      />
    </LessonLayout>
  );
}
