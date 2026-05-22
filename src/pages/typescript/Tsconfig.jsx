import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Tsconfig() {
  return (
    <LessonLayout
      title="tsconfig Mastery"
      sectionId="typescript"
      lessonIndex={9}
      prev={{ path: '/typescript/newproject', label: 'New Project from Scratch' }}
      next={null}
    >
      <p>
        The <code>tsconfig.json</code> file controls everything about how TypeScript
        compiles your code. Misconfigure it and you get cryptic errors, broken imports,
        or worse &mdash; silent runtime bugs. This is the definitive reference.
      </p>

      {/* ── Section 1: How tsconfig.json Works ───────────────────── */}
      <h2>1. How tsconfig.json Works</h2>

      <p>
        When you run <code>tsc</code> or your editor opens a <code>.ts</code> file,
        TypeScript walks up the directory tree from the file until it finds a
        <code> tsconfig.json</code>. That config determines all compiler behavior.
      </p>

      <CodeBlock language="bash" title="Generate a tsconfig with all options commented">
{`# Creates tsconfig.json with every option listed and explained
tsc --init

# See the RESOLVED config (after extends, references)
tsc --showConfig

# See which files TypeScript will compile
tsc --listFiles`}
      </CodeBlock>

      <FlowChart
        title="How TypeScript Resolves Configuration"
        chart={"graph TD\n  A[Open .ts file] --> B[Walk up directories]\n  B --> C{Found tsconfig.json?}\n  C -->|No| D[Use default settings]\n  C -->|Yes| E{Has extends?}\n  E -->|Yes| F[Load base config]\n  F --> G[Merge: child overrides parent]\n  E -->|No| G\n  G --> H{Has references?}\n  H -->|Yes| I[Load referenced projects]\n  H -->|No| J[Apply compilerOptions]\n  I --> J\n  J --> K[Compile with resolved settings]"}
      />

      <h3>Project References: Why Vite Generates 3 Configs</h3>
      <p>
        Vite scaffolds <code>tsconfig.json</code>, <code>tsconfig.app.json</code>,
        and <code>tsconfig.node.json</code>. This separates your browser code from
        your Node.js tooling code &mdash; they have different targets and different
        available APIs.
      </p>

      <CodeBlock language="json" title="tsconfig.json &mdash; Root orchestrator">
{`{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
// "files": [] means this config compiles NOTHING itself
// It only points to sub-projects that do the real work`}
      </CodeBlock>

      <InfoBox variant="info" title="Why separate configs?">
        Your app code targets browsers (ES2020, DOM APIs). Your <code>vite.config.ts</code>
        runs in Node.js (ES2022, no DOM). Mixing them in one config means TypeScript
        cannot give accurate type-checking for either environment.
      </InfoBox>

      {/* ── Section 2: Compiler Options Reference ────────────────── */}
      <h2>2. Compiler Options &mdash; Complete Reference</h2>

      <h3>Target &amp; Module</h3>

      <CodeBlock language="json" title="Target & Module options">
{`{
  "compilerOptions": {
    // target: What JS version to emit. Does NOT affect type-checking.
    // ES2020 = good baseline (supports ?., ??, BigInt)
    // ES2022 = adds top-level await, .at(), error.cause
    // ESNext = latest. Only use if you control the runtime.
    "target": "ES2020",

    // module: What module system to use in output
    // "ESNext" = import/export (for bundlers like Vite, Webpack)
    // "CommonJS" = require/module.exports (for Node.js < 20)
    // "NodeNext" = Node.js native ESM + CJS interop (Node 16+)
    "module": "ESNext",

    // moduleResolution: How to find imported modules
    // "bundler" = modern bundler rules (Vite, Webpack, esbuild)
    // "node" = classic Node.js resolution (legacy)
    // "node16"/"nodenext" = Node.js ESM resolution (package.json "exports")
    "moduleResolution": "bundler",

    // lib: Which built-in type definitions to include
    // DOM = browser APIs (window, document, fetch)
    // ES2020 = Promise.allSettled, globalThis, BigInt
    "lib": ["ES2020", "DOM", "DOM.Iterable"],

    // jsx: How to transform JSX
    // "react-jsx" = automatic runtime (React 17+, Vite)
    // "react" = classic React.createElement (CRA, legacy)
    // "preserve" = don't transform (Next.js does its own)
    "jsx": "react-jsx"
  }
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Which moduleResolution should you use with Vite?"}
        options={[
          "node",
          "classic",
          "bundler",
          "nodenext"
        ]}
        correctIndex={2}
        explanation={"The 'bundler' moduleResolution matches how modern bundlers (Vite, Webpack, esbuild) resolve imports. It allows extensionless imports, package.json exports field, and doesn't require .js extensions like nodenext does."}
      />

      <h3>The Strict Family</h3>
      <p>
        <code>strict: true</code> is a shorthand that enables ALL strict flags at once.
        Here is what each one catches:
      </p>

      <CodeBlock language="typescript" title="What each strict flag prevents">
{`// ─── strictNullChecks ────────────────────────────────────
// WITHOUT: string could secretly be null/undefined
function getLength(s: string) { return s.length; } // no error even if s is null!
// WITH: you must handle null explicitly
function getLength(s: string | null) {
  if (s === null) return 0;
  return s.length; // safe
}

// ─── noImplicitAny ──────────────────────────────────────
// WITHOUT: untyped params default to "any" silently
function process(data) { return data.foo; } // no error, data is any
// WITH: error! Parameter 'data' implicitly has an 'any' type
function process(data: unknown) { /* must narrow first */ }

// ─── strictFunctionTypes ────────────────────────────────
// Prevents unsound function assignment (contravariance check)
type Handler = (e: MouseEvent) => void;
const handler: Handler = (e: Event) => {}; // Error! Event is too broad

// ─── strictPropertyInitialization ───────────────────────
class User {
  name: string;  // Error! Not assigned in constructor
  constructor() {} // must assign this.name here
}

// ─── useUnknownInCatchVariables ─────────────────────────
try { throw 'oops'; }
catch (e) {
  // WITHOUT: e is "any", you can do e.message without checking
  // WITH: e is "unknown", you must narrow: if (e instanceof Error)
}

// ─── strictBindCallApply ────────────────────────────────
function add(a: number, b: number) { return a + b; }
add.call(undefined, 'wrong', 'types'); // Error! Must match params`}
      </CodeBlock>

      <InfoBox variant="warning" title="Never turn off strict for a new project">
        Every option in the strict family exists because real bugs slipped into
        production without it. Start strict, stay strict. If migrating legacy code,
        enable flags incrementally &mdash; but the goal is always full strict.
      </InfoBox>

      <h3>Code Quality Options</h3>

      <CodeBlock language="json" title="Code quality flags">
{`{
  "compilerOptions": {
    // Error on unused variables (catches dead code)
    "noUnusedLocals": true,

    // Error on unused function parameters
    // Prefix with _ to intentionally skip: (_event, index) => ...
    "noUnusedParameters": true,

    // Error when a function path doesn't explicitly return
    "noImplicitReturns": true,

    // Error on switch fallthrough without break/return
    "noFallthroughCasesInSwitch": true,

    // HIGHLY RECOMMENDED: makes optional and missing different
    // { name?: string } means name can be "string | undefined"
    // but you can't assign { name: undefined } — you must omit it
    "exactOptionalPropertyTypes": true,

    // CRITICAL: array/object index access returns T | undefined
    // Without this: const arr: string[] = []; arr[99] is typed as string!
    // With this: arr[99] is typed as string | undefined (CORRECT)
    "noUncheckedIndexedAccess": true
  }
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="noUncheckedIndexedAccess in action">
{`const users: string[] = ['Alice', 'Bob'];

// WITHOUT noUncheckedIndexedAccess:
const third = users[2]; // typed as "string" — but it's undefined!
console.log(third.toUpperCase()); // RUNTIME CRASH

// WITH noUncheckedIndexedAccess:
const third = users[2]; // typed as "string | undefined"
console.log(third.toUpperCase()); // Compile error! Object possibly undefined
console.log(third?.toUpperCase()); // OK — safely handled

// Same for objects:
const map: Record<string, number> = { a: 1 };
const val = map['missing']; // string | undefined (not just number)`}
      </CodeBlock>

      <h3>Path &amp; Resolution</h3>

      <CodeBlock language="json" title="Path and resolution options">
{`{
  "compilerOptions": {
    // baseUrl: Root for non-relative imports. Usually "."
    "baseUrl": ".",

    // paths: Import aliases (must ALSO configure bundler!)
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"]
    },

    // rootDir: Root of source files (TS uses to mirror in outDir)
    "rootDir": "./src",

    // outDir: Where compiled JS goes (irrelevant with noEmit)
    "outDir": "./dist",

    // typeRoots: Where to look for .d.ts declarations
    // Default: ["node_modules/@types"]
    "typeRoots": ["./node_modules/@types", "./src/types"],

    // types: ONLY include specific @types packages
    // If omitted, ALL @types/* in node_modules are included
    "types": ["vite/client", "vitest/globals"],

    // resolveJsonModule: Allow importing .json files
    "resolveJsonModule": true,

    // allowImportingTsExtensions: Allow .ts/.tsx in imports
    // Requires noEmit (Vite handles the actual compilation)
    "allowImportingTsExtensions": true
  },

  // include: Which files to compile (glob patterns)
  "include": ["src/**/*.ts", "src/**/*.tsx"],

  // exclude: Skip these (defaults include node_modules)
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}`}
      </CodeBlock>

      <h3>Interop Options</h3>

      <CodeBlock language="typescript" title="Module interop explained">
{`// ─── esModuleInterop ─────────────────────────────────────
// Problem: CommonJS modules export like module.exports = { default: fn }
// Without esModuleInterop:
import * as express from 'express';     // ugly, wrong semantics
// With esModuleInterop:
import express from 'express';          // works as expected

// Always enable. It adds small helper functions to make
// CJS/ESM interop work correctly.

// ─── allowSyntheticDefaultImports ────────────────────────
// Type-checking only version of esModuleInterop
// Lets you write "import React from 'react'" even though
// React's CJS export doesn't have a .default property
// Enabled automatically when esModuleInterop is true.

// ─── isolatedModules ─────────────────────────────────────
// REQUIRED by Vite, esbuild, SWC, Babel — any single-file transpiler
// Prevents patterns that require whole-program analysis:
export type { User };       // OK — type-only export
export { User };            // Error if User is only a type!
// Use: "export type { User }" for types, "export { User }" for values

// ─── verbatimModuleSyntax ────────────────────────────────
// The MODERN replacement for isolatedModules + esModuleInterop
// Forces you to write explicit "import type" for type-only imports
// Vite 5+ supports this. Use it in new projects:
import type { User } from './types';     // erased at runtime
import { fetchUser } from './api';       // kept at runtime`}
      </CodeBlock>

      <h3>Declaration Options (Library Authors)</h3>

      <CodeBlock language="json" title="Options for publishing npm packages">
{`{
  "compilerOptions": {
    // declaration: Generate .d.ts files alongside .js
    "declaration": true,

    // declarationMap: .d.ts.map files for "Go to Definition" in source
    "declarationMap": true,

    // declarationDir: Put .d.ts files in a specific directory
    "declarationDir": "./dist/types",

    // emitDeclarationOnly: Only output .d.ts, no .js
    // Use when your bundler (tsup, Vite lib mode) handles JS output
    "emitDeclarationOnly": true,

    // sourceMap: Generate .js.map for debugging
    "sourceMap": true,

    // composite: Required for project references
    // Enables incremental compilation & declaration emit
    "composite": true
  }
}`}
      </CodeBlock>

      {/* ── Section 3: Recommended Configs ───────────────────────── */}
      <h2>3. Recommended Configs (Copy-Paste Ready)</h2>

      <CodeBlock language="json" title="React + Vite App (what you use day 1)">
{`{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Strict type-checking */
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    /* Code quality */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}`}
      </CodeBlock>

      <CodeBlock language="json" title="Node.js Backend (Express/Fastify)">
{`{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "lib": ["ES2023"],

    /* Output */
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
    "declaration": true,

    /* Strict */
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    /* Interop */
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}`}
      </CodeBlock>

      <CodeBlock language="json" title="npm Library (publishing a package)">
{`{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020"],

    /* Emit declarations only (bundler handles JS) */
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "./dist",

    /* Strict (consumers trust your types) */
    "strict": true,
    "noUncheckedIndexedAccess": true,

    /* Required for project references */
    "composite": true,
    "declarationDir": "./dist/types",

    /* Interop */
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}`}
      </CodeBlock>

      <CodeBlock language="json" title="Monorepo Root tsconfig.json">
{`{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "files": [],
  "references": [
    { "path": "./packages/ui" },
    { "path": "./packages/utils" },
    { "path": "./apps/web" },
    { "path": "./apps/api" }
  ]
}

// Each package has its own tsconfig.json that extends a shared base:
// packages/ui/tsconfig.json
// { "extends": "../../tsconfig.base.json", "compilerOptions": { ... } }`}
      </CodeBlock>

      {/* ── Section 4: The extends Chain ─────────────────────────── */}
      <h2>4. The extends Chain</h2>

      <p>
        Instead of writing 30+ options from scratch, extend a base config and
        override only what differs. The TypeScript team publishes official bases:
      </p>

      <CodeBlock language="bash" title="Install official base configs">
{`# Official bases from the TypeScript team
npm install -D @tsconfig/recommended        # Conservative defaults
npm install -D @tsconfig/node20             # Node.js 20 optimized
npm install -D @tsconfig/vite-react         # Vite + React optimized
npm install -D @tsconfig/strictest          # Maximum strictness`}
      </CodeBlock>

      <CodeBlock language="json" title="Using extends in your tsconfig">
{`{
  "extends": "@tsconfig/vite-react/tsconfig.json",
  "compilerOptions": {
    // Override or add to the base:
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}

// How extends works:
// 1. Load the base config entirely
// 2. Your config is merged ON TOP
// 3. compilerOptions are shallow-merged (your keys override base keys)
// 4. include/exclude/files REPLACE the base (not merged)`}
      </CodeBlock>

      <CodeBlock language="json" title="Multi-level extends chain (real monorepo)">
{`// tsconfig.base.json — shared across all packages
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}

// packages/ui/tsconfig.json — extends base, adds React
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "declaration": true,
    "composite": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}

// apps/web/tsconfig.json — extends base, references ui
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "noEmit": true
  },
  "include": ["src"],
  "references": [
    { "path": "../../packages/ui" }
  ]
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="include/exclude DON'T merge">
        Unlike <code>compilerOptions</code>, the <code>include</code> and <code>exclude</code>
        arrays completely REPLACE the parent&apos;s values. If your base has
        <code> include: [&quot;src&quot;]</code> and you set <code>include: [&quot;lib&quot;]</code>,
        only <code>lib/</code> is compiled &mdash; not <code>src/</code>.
      </InfoBox>

      {/* ── Section 5: Project References ────────────────────────── */}
      <h2>5. Project References</h2>

      <p>
        Project references split a codebase into sub-projects that TypeScript can
        compile independently. This gives you faster builds (only rebuild what
        changed) and proper boundary enforcement.
      </p>

      <FlowChart
        title="Vite Project Reference Structure"
        chart={"graph TD\n  A[tsconfig.json - Root] --> B[tsconfig.app.json]\n  A --> C[tsconfig.node.json]\n  B --> D[src/ - Browser code]\n  B --> E[Target: ES2020]\n  B --> F[Lib: DOM + ES2020]\n  C --> G[vite.config.ts - Node code]\n  C --> H[Target: ES2022]\n  C --> I[Lib: ES2023 only]"}
      />

      <CodeBlock language="json" title="Setting up project references">
{`// Step 1: Root tsconfig.json — orchestrates sub-projects
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

// Step 2: Each sub-project needs composite: true
// tsconfig.app.json
{
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo"
    // ... other options
  },
  "include": ["src"]
}

// Step 3: Build with --build flag
// tsc --build (or tsc -b)
// This compiles projects in dependency order`}
      </CodeBlock>

      <CodeBlock language="json" title="Monorepo with inter-package references">
{`// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}

// packages/api/tsconfig.json — depends on shared
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [
    { "path": "../shared" }
  ]
}

// Build the whole graph:
// tsc --build packages/api
// This auto-builds shared first, then api`}
      </CodeBlock>

      <InteractiveChallenge
        question={"What does composite: true enable in a tsconfig?"}
        options={[
          "Combines multiple tsconfig files into one",
          "Enables incremental compilation and declaration output for project references",
          "Compresses the output JavaScript files",
          "Merges all source files into a single output bundle"
        ]}
        correctIndex={1}
        explanation={"composite: true tells TypeScript this project can be referenced by other projects. It forces declaration: true (so dependents can use the types) and enables incremental builds via .tsbuildinfo files."}
      />

      {/* ── Section 6: Debugging Config Issues ───────────────────── */}
      <h2>6. Debugging Config Issues</h2>

      <CodeBlock language="bash" title="Essential diagnostic commands">
{`# See the fully resolved config (after extends + defaults)
npx tsc --showConfig

# List every file TypeScript will compile
npx tsc --listFiles

# Trace module resolution for a specific import
npx tsc --traceResolution | grep "my-module"

# Dry-run compilation (no emit, just type-check)
npx tsc --noEmit

# Check only one specific file with its config
npx tsc --noEmit src/components/Button.tsx`}
      </CodeBlock>

      <h3>Common Config Problems &amp; Fixes</h3>

      <CodeBlock language="typescript" title="Problem: Files not being included">
{`// SYMPTOM: "Cannot find module './MyComponent'"
// CAUSE: File is outside the "include" pattern

// tsconfig.app.json says: "include": ["src"]
// But your file is at: scripts/generate.ts  <-- NOT in src!

// FIX: Add to include, or create a separate tsconfig for scripts
// "include": ["src", "scripts"]`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Problem: Path aliases not working">
{`// SYMPTOM: Import works in VS Code but fails at build time
// CAUSE: Configured in tsconfig but NOT in bundler

// You have in tsconfig.app.json:
// "paths": { "@/*": ["./src/*"] }
// But vite.config.ts has NO resolve.alias!

// FIX: Add BOTH:
// tsconfig.app.json -> paths (for type-checking)
// vite.config.ts -> resolve.alias (for bundling)

// For Vitest: also add in vitest.config.ts or vite.config.ts:
// resolve: { alias: { '@': path.resolve(__dirname, './src') } }`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Problem: Wrong module resolution">
{`// SYMPTOM: "Cannot find module 'lodash'" even though it's installed
// CAUSE: moduleResolution doesn't match your environment

// If using Vite/Webpack: use "bundler"
// If using Node.js with ESM (type: "module"): use "nodenext"
// If using Node.js with CJS: use "node"

// NEVER use "classic" — it's ancient and broken for modern packages

// SYMPTOM: "The current file is a CommonJS module"
// CAUSE: module is "CommonJS" but you're writing import/export
// FIX: Change module to "ESNext" or "NodeNext"`}
      </CodeBlock>

      <InfoBox variant="danger" title="The #1 tsconfig mistake">
        Forgetting that path aliases must be configured in BOTH <code>tsconfig.json</code>
        (for TypeScript) AND your bundler config (for Vite/Webpack). TypeScript does NOT
        rewrite import paths &mdash; it only uses them for type resolution. Your bundler
        does the actual path rewriting at build time.
      </InfoBox>

      <CodeBlock language="json" title="Complete debugging checklist">
{`// When imports break, check this order:
// 1. Is the file in "include"?          -> tsc --listFiles
// 2. Is moduleResolution correct?       -> "bundler" for Vite
// 3. Are paths configured in BOTH?      -> tsconfig + vite.config.ts
// 4. Is the package installed?           -> node_modules/<pkg>
// 5. Does the package have types?        -> @types/<pkg> or built-in
// 6. Is skipLibCheck hiding an error?    -> temporarily set to false
// 7. Is there a conflicting tsconfig?    -> tsc --showConfig`}
      </CodeBlock>

      <h2>Quick Reference Table</h2>

      <CodeBlock language="bash" title="What to set for each project type">
{`┌─────────────────────┬────────────────────┬──────────────────────┐
│ Setting             │ React + Vite       │ Node.js Backend      │
├─────────────────────┼────────────────────┼──────────────────────┤
│ target              │ ES2020             │ ES2022               │
│ module              │ ESNext             │ NodeNext             │
│ moduleResolution    │ bundler            │ nodenext             │
│ lib                 │ ES2020, DOM        │ ES2023               │
│ jsx                 │ react-jsx          │ (not needed)         │
│ noEmit              │ true               │ false                │
│ outDir              │ (not needed)       │ ./dist               │
│ declaration         │ false              │ true                 │
│ isolatedModules     │ true               │ true                 │
│ esModuleInterop     │ (not needed*)      │ true                 │
│ strict              │ true               │ true                 │
└─────────────────────┴────────────────────┴──────────────────────┘
* bundler moduleResolution handles interop automatically`}
      </CodeBlock>

      <InfoBox variant="success" title="You now have complete tsconfig mastery">
        You understand every compiler option, know which config to use for any
        project type, can debug resolution issues, and can set up project
        references for monorepos. Copy the configs above, adapt the paths,
        and start building.
      </InfoBox>
    </LessonLayout>
  );
}
