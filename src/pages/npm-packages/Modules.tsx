import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Modules() {
  return (
    <LessonLayout
      title="CJS vs ESM & Dual Publishing"
      sectionId="npm-packages"
      lessonIndex={2}
      prev={{ path: '/npm-packages/package-json', label: 'package.json Deep Dive' }}
      next={{ path: '/npm-packages/publishing', label: 'Publishing & Versioning' }}
    >
      <h2>Two Module Systems, One Ecosystem</h2>
      <p>
        JavaScript has two incompatible module systems that you must understand to publish
        packages correctly. This isn't a matter of preference — your package must work for
        consumers using either system, or you'll get bug reports.
      </p>

      <h3>CommonJS (CJS)</h3>
      <CodeBlock language="javascript" title="CommonJS — Node.js's original module system">
{`// Exporting (CJS)
const slugify = (text) => text.toLowerCase().replace(/\\s+/g, '-');
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

module.exports = { slugify, capitalize };
// or:
exports.slugify = slugify;

// Importing (CJS)
const { slugify, capitalize } = require('./utils');
const lodash = require('lodash');

// Key characteristics:
// - Synchronous: require() blocks until the module is loaded
// - Dynamic: you can require() inside if statements, loops, etc.
// - Runtime evaluation: exports are computed when require() runs
// - module.exports is a single object (default export pattern)
// - Available since Node.js was created (2009)
// - File extensions: .js (with "type": "commonjs") or .cjs`}
      </CodeBlock>

      <h3>ES Modules (ESM)</h3>
      <CodeBlock language="javascript" title="ES Modules — the JavaScript standard">
{`// Exporting (ESM)
export const slugify = (text) => text.toLowerCase().replace(/\\s+/g, '-');
export const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Default export
export default function format(text) { return text.trim(); }

// Importing (ESM)
import { slugify, capitalize } from './utils.js';  // note: extension required in Node
import lodash from 'lodash';
import * as path from 'node:path';

// Key characteristics:
// - Asynchronous: imports are resolved before execution
// - Static: imports must be at top level (enables tree-shaking)
// - Compile-time analysis: bundlers can determine what's used
// - Named exports + optional default export
// - The official JavaScript standard (ES2015/ES6)
// - Supported in browsers natively (<script type="module">)
// - File extensions: .js (with "type": "module") or .mjs`}
      </CodeBlock>

      <FlowChart
        title="CJS vs ESM Decision Tree"
        chart={"graph TD\n  A[Writing a package?] --> B{Who are your consumers?}\n  B -->|Only modern Node.js/bundlers| C[ESM only is fine]\n  B -->|Older Node.js projects too| D[Need CJS support]\n  B -->|Both CJS and ESM consumers| E[Dual publish]\n  C --> F[Set type: module]\n  D --> G[Set main to .cjs file]\n  E --> H[Use exports with import + require conditions]\n  H --> I[Build both .mjs and .cjs outputs]"}
      />

      <h2>Why We're Stuck With Both</h2>
      <p>
        Node.js was created in 2009 and used CommonJS because there was no standard module
        system in JavaScript yet. ES Modules were standardized in 2015, but Node.js couldn't
        just switch — it would break every existing package. So now we have both.
      </p>

      <CodeBlock language="bash" title="The compatibility problem">
{`# CJS can require() CJS: ✅ Always works
const pkg = require('cjs-package');

# ESM can import ESM: ✅ Always works
import pkg from 'esm-package';

# ESM can import CJS: ✅ Works (with limitations)
import pkg from 'cjs-package';
# Note: named exports from CJS may not work in all cases
# import { specific } from 'cjs-package'; // may fail

# CJS can require() ESM: ❌ DOES NOT WORK
const pkg = require('esm-only-package');
# Error: require() of ES Module not supported
# This is the #1 reason for "dual publishing"`}
      </CodeBlock>

      <InfoBox variant="warning" title="CJS Cannot Require ESM">
        This is the fundamental incompatibility. Since <code>require()</code> is synchronous
        and ESM loading is asynchronous, CJS cannot load ESM modules. If your package is
        ESM-only, anyone using CommonJS (older Node.js projects, Jest without transforms,
        many tools) cannot use it. This is why dual publishing exists.
      </InfoBox>

      <h2>"type" Field and File Extensions</h2>

      <CodeBlock language="json" title="How Node.js determines module format">
{`// package.json with "type": "module"
{
  "type": "module"
}
// .js files → treated as ESM
// .mjs files → always ESM (regardless of type)
// .cjs files → always CJS (regardless of type)

// package.json without "type" (or "type": "commonjs")
{
  "type": "commonjs"
}
// .js files → treated as CJS
// .mjs files → always ESM (regardless of type)
// .cjs files → always CJS (regardless of type)

// Rule: .mjs is ALWAYS ESM, .cjs is ALWAYS CJS
// The "type" field only affects .js files`}
      </CodeBlock>

      <h2>The "exports" Field for Dual Publishing</h2>
      <p>
        The <code>exports</code> field in package.json is the modern solution for serving
        different code to different consumers. It uses "conditions" to map import paths
        to the appropriate file:
      </p>

      <CodeBlock language="json" title="Conditional exports for dual CJS/ESM">
{`{
  "name": "my-package",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.mjs"
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts"
}

// How it works:
// import pkg from 'my-package'     → uses "import" → dist/index.mjs
// const pkg = require('my-package') → uses "require" → dist/index.cjs
// import { x } from 'my-package/utils' → dist/utils.mjs

// "main" and "module" are fallbacks for older tools
// "types" at top level is fallback for older TypeScript versions`}
      </CodeBlock>

      <h2>Build Tools for Packages</h2>
      <p>
        You write TypeScript once and build to both CJS and ESM. Here are the popular tools:
      </p>

      <CodeBlock language="bash" title="Package build tool comparison">
{`# tsup — RECOMMENDED for most packages
# - Zero config, fast (uses esbuild internally)
# - Generates .mjs, .cjs, and .d.ts in one command
# - Perfect for libraries

# unbuild — used by the Nuxt/UnJS ecosystem
# - Auto-infers config from package.json
# - Rollup-based, very clean output
# - Great for larger packages

# rollup — maximum control
# - Plugin ecosystem for any transform
# - Best output quality (clean, readable bundles)
# - More config required

# esbuild — fastest build times
# - Doesn't generate .d.ts (need tsc separately)
# - Minimal config
# - Good for simple packages

# tsc only — when you just want declarations
# - Use for packages where source IS the output
# - Pairs with a bundler for the actual build`}
      </CodeBlock>

      <h2>Setting Up tsup for Dual Publishing</h2>

      <CodeBlock language="bash" title="Complete tsup setup">
{`# Install tsup and TypeScript
npm install -D tsup typescript

# Create tsup.config.ts:
cat tsup.config.ts`}
      </CodeBlock>

      <CodeBlock language="typescript" title="tsup.config.ts">
{`import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/utils.ts'],
  format: ['cjs', 'esm'],      // Output both formats
  dts: true,                     // Generate .d.ts files
  clean: true,                   // Clean dist/ before build
  splitting: false,              // Don't code-split (simpler output)
  sourcemap: true,               // Optional: source maps
  minify: false,                 // Don't minify library code
  target: 'es2020',             // Output target
  outDir: 'dist',
});`}
      </CodeBlock>

      <CodeBlock language="bash" title="Build output">
{`# Run the build:
npx tsup

# Output:
# dist/
# ├── index.mjs        (ESM)
# ├── index.cjs        (CJS)
# ├── index.d.ts       (TypeScript declarations)
# ├── index.d.mts      (ESM-specific declarations)
# ├── utils.mjs
# ├── utils.cjs
# ├── utils.d.ts
# └── utils.d.mts`}
      </CodeBlock>

      <h2>Complete Build Pipeline</h2>

      <FlowChart
        title="TypeScript to Published Package Pipeline"
        chart={"graph TD\n  A[src/index.ts] --> B[tsup build]\n  B --> C[dist/index.mjs - ESM]\n  B --> D[dist/index.cjs - CJS]\n  B --> E[dist/index.d.ts - Types]\n  C --> F[exports.import]\n  D --> G[exports.require]\n  E --> H[exports.types]\n  F --> I[npm publish]\n  G --> I\n  H --> I"}
      />

      <CodeBlock language="json" title="Complete package.json for dual publishing">
{`{
  "name": "@myorg/string-utils",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist/"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  }
}`}
      </CodeBlock>

      <h2>Testing Your Package Locally</h2>

      <CodeBlock language="bash" title="Local testing strategies">
{`# Method 1: npm link (symlink-based)
cd my-package
npm link              # creates global symlink
cd ../my-app
npm link my-package   # links into your app's node_modules

# Cleanup:
npm unlink my-package
cd ../my-package
npm unlink

# Method 2: npm pack (more realistic)
cd my-package
npm pack              # creates my-package-1.0.0.tgz
cd ../my-app
npm install ../my-package/my-package-1.0.0.tgz
# This installs exactly what would be published

# Method 3: file: protocol
# In my-app/package.json:
{
  "dependencies": {
    "my-package": "file:../my-package"
  }
}
# Then: npm install

# Method 4: Verify imports work both ways
# test-cjs.js:
const { slugify } = require('my-package');
console.log(slugify('Hello World'));

# test-esm.mjs:
import { slugify } from 'my-package';
console.log(slugify('Hello World'));

# Run both:
node test-cjs.js
node test-esm.mjs`}
      </CodeBlock>

      <InfoBox variant="tip" title="npm pack Is the Gold Standard">
        <code>npm link</code> uses symlinks which can cause subtle issues (duplicate React,
        wrong module resolution). <code>npm pack</code> creates the actual tarball and installs
        it like a real consumer would. Always do a final test with npm pack before publishing.
      </InfoBox>

      <h2>Common Pitfalls</h2>

      <CodeBlock language="javascript" title="Things that break when mixing CJS/ESM">
{`// PITFALL 1: __dirname not available in ESM
// CJS:
const configPath = path.join(__dirname, 'config.json');  // ✅ works
// ESM:
const configPath = path.join(__dirname, 'config.json');  // ❌ ReferenceError!
// Fix:
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PITFALL 2: require() in ESM
// import pkg from './other.js';  // ✅
// const pkg = require('./other.js');  // ❌ require is not defined in ESM
// Fix: use import() for dynamic imports in ESM
const pkg = await import('./other.js');

// PITFALL 3: Named imports from CJS in ESM
// If cjs-pkg does: module.exports = { foo: 1, bar: 2 }
import { foo } from 'cjs-pkg';  // ❌ May not work!
import pkg from 'cjs-pkg';      // ✅ Then use pkg.foo
// Node.js tries to detect named exports from CJS but it's not guaranteed

// PITFALL 4: JSON imports in ESM
// const pkg = require('./package.json');  // ✅ CJS
import pkg from './package.json' assert { type: 'json' };  // ESM (experimental)
// Safer: use fs.readFileSync + JSON.parse

// PITFALL 5: Dual package hazard
// If both CJS and ESM versions of your package are loaded
// in the same process, they're DIFFERENT instances!
// Singletons, caches, and instanceof checks will break.`}
      </CodeBlock>

      <InfoBox variant="danger" title="The Dual Package Hazard">
        If a consumer's app loads your package via both <code>require()</code> and
        <code>import</code> in the same process (can happen in complex dependency trees),
        they get two separate instances. Any internal state, singletons, or class instances
        won't be shared between them. For stateful packages, consider ESM-only or document
        this limitation clearly.
      </InfoBox>

      <InteractiveChallenge
        question="A user reports: 'Error: require() of ES Module not supported'. What happened?"
        options={[
          "They're using an outdated version of Node.js",
          "Their project uses CommonJS and your package only ships ESM",
          "They forgot to install your package",
          "Their package.json is missing the 'type' field"
        ]}
        correctIndex={1}
        explanation="This error occurs when a CommonJS project tries to require() an ES Module package. Since require() is synchronous and ESM is asynchronous, Node.js cannot load ESM via require(). The solution is to either dual-publish your package (ship both .cjs and .mjs) or the consumer needs to switch to ESM (import syntax)."
      />

      <InteractiveChallenge
        question="In the exports field, why should 'types' come before 'import' and 'require'?"
        options={[
          "Alphabetical ordering is required by npm",
          "TypeScript reads conditions top-to-bottom and uses the first applicable match",
          "The types file must be loaded before runtime code",
          "It's just a convention with no technical impact"
        ]}
        correctIndex={1}
        explanation="TypeScript's module resolution reads the exports conditions from top to bottom and uses the first condition that matches. If 'import' comes before 'types', TypeScript may resolve to the .mjs file instead of the .d.ts file, losing type information. Always put 'types' first in each export condition."
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>CJS (require/module.exports) is synchronous and Node.js's original system</li>
        <li>ESM (import/export) is the JavaScript standard, async, enables tree-shaking</li>
        <li>CJS cannot require() ESM — this is why dual publishing exists</li>
        <li>Use <code>exports</code> with <code>import</code> and <code>require</code> conditions for dual format</li>
        <li>tsup is the easiest tool for building both CJS and ESM with TypeScript declarations</li>
        <li>Test with both <code>require()</code> and <code>import</code> before publishing</li>
        <li>Watch out for: __dirname in ESM, named CJS imports, dual package hazard</li>
      </ul>
    </LessonLayout>
  );
}
