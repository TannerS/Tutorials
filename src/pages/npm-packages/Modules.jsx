import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NpkgModules() {
  return (
    <LessonLayout
      title="CJS vs ESM"
      sectionId="npm-packages"
      lessonIndex={2}
      prev={{ path: '/npm-packages/package-json', label: 'package.json Deep Dive' }}
      next={{ path: '/npm-packages/publishing', label: 'Publishing to npm' }}
    >
      <h2>CommonJS vs ES Modules</h2>
      <p>
        JavaScript has two module systems: CommonJS (Node.js original) and ES Modules (the standard).
        Understanding the difference is critical for publishing packages that work everywhere.
      </p>

      <FlowChart
        title="Module Format Support"
        chart={"graph LR\n  A[Your Source .ts] --> B[Build Tool]\n  B --> C[dist/index.cjs]\n  B --> D[dist/index.mjs]\n  C --> E[Node.js require]\n  C --> F[Webpack/bundlers]\n  D --> G[Native ESM Node.js]\n  D --> H[Vite/Rollup/esbuild]\n  D --> I[Browser native import]"}
      />

      <h2>CommonJS (CJS)</h2>

      <CodeBlock language="javascript" title="CommonJS syntax">
{`// Exporting
module.exports = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
}

// Single default export
module.exports = function add(a, b) { return a + b }

// Named exports (common pattern)
exports.add = (a, b) => a + b
exports.subtract = (a, b) => a - b

// Importing
const { add, subtract } = require('./utils')
const add = require('./utils').add

// Dynamic require (allowed — CJS is dynamic)
const moduleName = condition ? './a' : './b'
const mod = require(moduleName)

// Characteristics:
// - Synchronous loading (blocks until loaded)
// - Dynamic (require() can be conditional)
// - No static analysis → cannot tree-shake
// - File extension: .js (if "type":"commonjs"), .cjs`}
      </CodeBlock>

      <h2>ES Modules (ESM)</h2>

      <CodeBlock language="javascript" title="ES Module syntax">
{`// Named exports
export const add = (a, b) => a + b
export function subtract(a, b) { return a - b }

// Default export
export default function multiply(a, b) { return a * b }

// Re-export
export { add } from './math'
export * from './utils'
export * as utils from './utils'

// Named imports
import { add, subtract } from './utils'

// Default import
import multiply from './math'

// Namespace import
import * as MathUtils from './math'
MathUtils.add(1, 2)

// Dynamic import (async)
const { add } = await import('./utils')

// Characteristics:
// - Asynchronous loading (non-blocking)
// - Static analysis → tree-shakeable
// - Top-level only (cannot be conditional)
// - Live bindings (not copies)
// - File extension: .js (if "type":"module"), .mjs`}
      </CodeBlock>

      <h2>Key Differences</h2>

      <CodeBlock language="javascript" title="Important behavioral differences">
{`// 1. This binding
// CJS: this === module.exports at top level
console.log(this === module.exports)   // true (CJS)
// ESM: this === undefined at top level
console.log(this)                       // undefined (ESM)

// 2. __dirname and __filename
// CJS: available
console.log(__dirname)  // /path/to/module

// ESM: not available — use import.meta
const __dirname = new URL('.', import.meta.url).pathname
const __filename = new URL(import.meta.url).pathname

// 3. require() in ESM
// Cannot use require() in ESM modules
// Use import() or createRequire()
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const legacy = require('./legacy-cjs')

// 4. Live bindings vs copies
// ESM: imported values are live bindings (read-only references)
// Changes to the export ARE visible to importers
// CJS: imported values are copies (snapshot at require() time)`}
      </CodeBlock>

      <h2>Dual Publishing (CJS + ESM)</h2>
      <p>
        Most libraries today ship both CJS and ESM to support all consumers.
        Use a build tool like <code>tsup</code> to generate both formats.
      </p>

      <CodeBlock language="bash" title="tsup — dual package build">
{`npm install --save-dev tsup

# tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],    // build both
  dts: true,                 // generate .d.ts
  splitting: false,
  sourcemap: true,
  clean: true,               // clean dist/ before build
})

# Output:
# dist/index.js   (CJS)
# dist/index.mjs  (ESM)
# dist/index.d.ts (TypeScript declarations)

# package.json exports:
{
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    }
  }
}`}
      </CodeBlock>

      <h2>The Dual Package Hazard</h2>
      <p>
        If a package is loaded as both CJS and ESM in the same application, two instances exist in memory.
        For stateful packages (React, singletons), this causes subtle bugs.
      </p>

      <CodeBlock language="javascript" title="Avoiding the dual package hazard">
{`// Problem: CJS wrapper pattern can cause double-loading
// Solution 1: ESM-only (if you can require Node 18+)
{
  "exports": {
    ".": "./dist/index.mjs"  // only ESM, no CJS
  }
}

// Solution 2: CJS wrapper that re-exports ESM
// dist/index.cjs  (wrapper)
'use strict'
const mod = await import('./index.mjs')  // won't work in sync CJS!

// Better: use tsup's built-in wrapper generation
// tsup.config.ts:
{
  format: ['cjs', 'esm'],
  cjsInterop: true  // generates proper CJS wrapper
}

// Solution 3: Stateless packages — no hazard possible
// Pure utility functions (no global state) are safe to dual-publish`}
      </CodeBlock>

      <InfoBox variant="note" title="ESM is the Future">
        <p>
          The JavaScript ecosystem is converging on ESM. Node.js 22+, all major bundlers (Vite, Rollup,
          esbuild), and modern frameworks natively prefer ESM. New packages should default to ESM with
          a CJS wrapper for backward compatibility. In 2-3 years, CJS-only packages will be increasingly
          problematic.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Why can ES Modules be tree-shaken but CommonJS modules cannot?"
        options={[
          "ES Modules are newer and have better runtime optimization",
          "ES Modules have static imports/exports that bundlers can analyze at build time; CJS require() is dynamic",
          "CommonJS does not support named exports",
          "Tree shaking requires TypeScript, which only works with ES Modules"
        ]}
        correctIndex={1}
        explanation="ES Module import/export statements are static — they must be at the top level and cannot be conditional. Bundlers read the source code and build a complete dependency graph at build time, knowing exactly which exports are used. CommonJS require() can be called anywhere, with any argument — this dynamic nature means a bundler cannot safely determine what is used without executing the code. This is why lodash (CJS) cannot be tree-shaken but lodash-es (ESM) can."
      />

      <InteractiveChallenge
        question="What is the 'dual package hazard' in npm packages?"
        options={[
          "A package that has both a bug-fix and feature release at the same time",
          "When CJS and ESM versions of the same package are both loaded in the same app, creating two instances",
          "A conflict when two packages export the same named function",
          "A version conflict between a package's direct and transitive dependencies"
        ]}
        correctIndex={1}
        explanation="The dual package hazard occurs when a package is both require()'d (CJS) and import()'d (ESM) in the same application. Because CJS and ESM module caches are separate, two different instances of the package exist in memory. For packages with shared state (like React's context system, or singletons), this causes bugs — hooks fail because they see different React instances, or singleton patterns break because each instance has its own state."
      />
    </LessonLayout>
  );
}
