import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideTsProjectSetup() {
  return (
    <PosterLayout
      accent="blue"
      eyebrow="TypeScript · Field Reference"
      title="Project Setup & tsconfig"
      tagline="Scaffolding a project and the compiler flags that matter — what each one does and why you'd flip it."
      meta={['TS 6', '16 flags']}
      footerLabel="Personal study reference — TypeScript"
      pageLabel="TypeScript Field Guide · Project Setup & tsconfig"
      prev={{ path: '/typescript-field-guide/fundamentals', label: 'TypeScript Fundamentals' }}
      next={{ path: '/typescript-field-guide/best-practices-gotchas', label: 'Best Practices & Gotchas' }}
    >
      <PosterCard
        glyph="Sc"
        title={<>Scaffold <span className="dim">a New Project</span></>}
        language="typescript"
        code={`npm create vite@latest my-app -- --template react-ts
cd my-app && npm install && npm run dev

// Vite = esbuild for dev (instant HMR), Rollup for prod builds.
// CRA is in maintenance mode — use Vite for new SPAs, Next.js for SSR/SSG.`}
        caption="One command scaffolds tsconfig, the Vite plugin, and .tsx files pre-wired — no manual TypeScript setup needed for a fresh app."
      />

      <PosterCard
        glyph="3x"
        title={<>Why Vite Generates <span className="dim">3 tsconfigs</span></>}
        language="typescript"
        code={`tsconfig.json        // root — "files": [], just references the two below
tsconfig.app.json     // your src/ — targets browsers, has DOM lib
tsconfig.node.json    // vite.config.ts — targets Node, no DOM lib

// Root has "references" pointing at both sub-projects.`}
        caption="Your app code runs in the browser; vite.config.ts runs in Node during the build. One shared config can't give accurate type-checking for two different runtime environments, so Vite splits them."
      />

      <PosterCard
        glyph="tg"
        title={<>target<span className="dim"> — output ECMAScript version</span></>}
        language="typescript"
        code={`{
  "compilerOptions": {
    // "target": "ES2020"  — safe baseline: ?., ??, BigInt
    // "target": "ES2022"  — adds top-level await, .at(), error.cause
    "target": "ESNext"     // latest syntax — only if a bundler downlevels
  }
}`}
        caption="target controls what JS syntax is emitted, not type-checking. Pick the oldest runtime you must support — pick ESNext only when a bundler (Vite/esbuild) is responsible for downleveling to real browsers."
      />

      <PosterCard
        glyph="md"
        title={<>module <span className="dim">&amp; moduleResolution</span></>}
        language="typescript"
        code={`{
  "compilerOptions": {
    "module": "ESNext",           // import/export, for bundlers
    // "module": "NodeNext",      // Node.js native ESM/CJS interop

    "moduleResolution": "bundler" // matches Vite/webpack/esbuild rules
    // "moduleResolution": "nodenext" // Node.js resolution, package.json "exports"
  }
}`}
        caption="moduleResolution must match how your code actually runs: 'bundler' allows extensionless imports the way Vite expects; 'nodenext' is stricter and requires the .js extensions Node itself demands. Mismatching the two causes 'cannot find module' errors that only show up at runtime."
      />

      <PosterCard
        glyph="jsx"
        title={<>jsx<span className="dim"> — JSX transform</span></>}
        language="typescript"
        code={`{
  "compilerOptions": {
    "jsx": "react-jsx"      // React 17+ automatic runtime — no React import needed
    // "jsx": "react"       // classic — every file needs "import React"
    // "jsx": "preserve"    // Next.js/other tooling does its own transform
  }
}`}
        caption="react-jsx injects the jsx-runtime import automatically at compile time, so every component file can skip 'import React from react' — less boilerplate, smaller diffs on new files."
      />

      <PosterCard
        glyph="S6"
        title={<>strict defaults to true<span className="dim"> in TS 6</span></>}
        badge="TS6"
        language="typescript"
        code={`// TypeScript 6: a config that never MENTIONS strict is strict.
{ "compilerOptions": { "target": "esnext" } }
//                     ^ no strict key — you still get strictNullChecks,
//                       noImplicitAny, and the rest of the family.

const x: string = null;   // Error: 'null' not assignable to 'string'
function f(a) { return a; } // Error: 'a' implicitly has an 'any' type

// To opt OUT you must now say so explicitly:
{ "compilerOptions": { "strict": false } }`}
        caption="This inverts the old default and it is the single highest-impact upgrade change. Pre-6, omitting strict meant loose; from 6, omitting it means strict. An inherited config that simply never mentioned the flag starts erroring the moment you bump the compiler — the fix is to set strict: false deliberately and migrate, not to be surprised by it."
      />

      <PosterCard
        glyph="ini"
        title={<>tsc --init<span className="dim"> — the modern output</span></>}
        badge="TS6"
        language="typescript"
        code={`// The generated file is now SHORT and opinionated, not a wall
// of commented-out options. What it turns on by default:
{
  "compilerOptions": {
    "module": "nodenext",
    "target": "esnext",
    "strict": true,
    "jsx": "react-jsx",
    "noUncheckedIndexedAccess": true,      // ← on by default now
    "exactOptionalPropertyTypes": true,    // ← on by default now
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true
  }
}`}
        caption="Rewritten in 5.9 and carried into 6. The two flags people used to have to discover and add by hand — noUncheckedIndexedAccess and exactOptionalPropertyTypes — are now scaffolded on. If a tutorial shows tsc --init producing 100+ commented lines with target: es2016, it predates 5.9."
      />

      <PosterCard
        glyph="St"
        title={<>strict<span className="dim"> — what each flag actually catches</span></>}
        language="typescript"
        code={`// strictNullChecks     — null/undefined must be handled explicitly
// noImplicitAny         — untyped params error instead of silently becoming any
// strictFunctionTypes   — rejects unsound function-parameter assignment
// strictPropertyInitialization — class fields must be set in the constructor
// strictBindCallApply   — .call/.bind/.apply args are checked against the signature
// noImplicitThis        — "this" inside a function must have a known type
// useUnknownInCatchVariables — catch (e) types e as unknown, not any
// strictBuiltinIteratorReturn — IteratorResult from built-ins is typed precisely

// NOT in the family: alwaysStrict. It emits "use strict" and now
// defaults to true on its own, independent of strict.`}
        caption="strict: true flips exactly these eight. alwaysStrict is commonly miscounted as the eighth member — it isn't one, and it's on by default regardless. Verify the real list any time with: tsc --showConfig, or check which options carry the strict flag in the compiler's own option table."
      />

      <PosterCard
        glyph="Ix"
        title={<>noUncheckedIndexedAccess</>}
        language="typescript"
        code={`const users: string[] = ['Alice', 'Bob'];

// WITHOUT the flag:
const third = users[2];          // typed "string" — but it's actually undefined!
third.toUpperCase();             // compiles, crashes at runtime

// WITH the flag:
const third = users[2];          // typed "string | undefined" — correct
third?.toUpperCase();            // forced to handle the missing case`}
        caption="Off by default even under strict — array and Record index access is typed as if every index exists. Turning this on makes out-of-bounds reads a compile error instead of a 3am production crash."
      />

      <PosterCard
        glyph="eo"
        title={<>exactOptionalPropertyTypes</>}
        language="typescript"
        code={`interface Options { timeout?: number; }

// WITHOUT: assigning undefined explicitly is allowed
const o: Options = { timeout: undefined };

// WITH: this is now an error — you must OMIT the key, not set it to undefined
const o2: Options = {};             // OK
// const o3: Options = { timeout: undefined }; // Error`}
        caption="Without this flag, 'optional' and 'explicitly set to undefined' are treated as the same thing — which breaks code that uses 'key in obj' to check presence. This flag makes TS enforce the distinction you probably already assumed existed."
      />

      <PosterCard
        glyph="es"
        title={<>esModuleInterop</>}
        language="typescript"
        code={`// WITHOUT esModuleInterop:
import * as express from 'express';   // awkward namespace import required

// WITH esModuleInterop: true
import express from 'express';        // clean default import, works as expected`}
        caption="Many CommonJS packages don't have a real 'default' export the way ES modules expect. This flag adds small interop helpers so default imports work correctly — enable it for any project mixing CJS dependencies with ESM syntax (almost all of them)."
      />

      <PosterCard
        glyph="sk"
        title={<>skipLibCheck</>}
        language="typescript"
        code={`{
  "compilerOptions": {
    "skipLibCheck": true  // don't type-check .d.ts files, including in node_modules
  }
}`}
        caption="Without it, a single broken or conflicting .d.ts inside some dependency's node_modules can break your entire build — a problem you can't fix yourself. skipLibCheck also meaningfully speeds up compilation on large dependency trees. Virtually always on."
      />

      <PosterCard
        glyph="iso"
        title={<>isolatedModules <span className="dim">/ verbatimModuleSyntax</span></>}
        language="typescript"
        code={`// REQUIRED by any single-file transpiler: Vite, esbuild, SWC, Babel.
// They compile one file at a time and can't tell if an export is a type.

export type { User };   // OK — explicitly type-only
export { User };        // Error if User is only a type, under isolatedModules

// verbatimModuleSyntax (modern replacement) forces this at the IMPORT site too:
import type { User } from './types';  // erased at runtime
import { fetchUser } from './api';    // kept at runtime`}
        caption="A whole-program compiler like tsc can tell a type-only export from a value one by reading every file; esbuild/SWC/Babel can't — they need the syntax to say so explicitly. Vite requires one of these two flags for exactly that reason."
      />

      <PosterCard
        glyph="pa"
        title={<>paths <span className="dim">&amp; baseUrl</span></>}
        language="typescript"
        code={`{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
// vite.config.ts ALSO needs:
// resolve: { alias: { '@': path.resolve(__dirname, './src') } }`}
        caption="TypeScript only uses paths for type resolution — it does not rewrite the import at build time. Your bundler needs the matching alias too, or type-checking passes while the actual build fails to find the module."
      />

      <PosterCard
        glyph="i/e"
        title={<>include <span className="dim">&amp; exclude</span></>}
        language="typescript"
        code={`{
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
// A file outside "include" fails with "Cannot find module"
// even though it exists on disk.`}
        caption="These are the #1 cause of 'cannot find module' for a file you can see right there in the editor — the file exists, but tsc was never told to look at it. Run `tsc --listFiles` to see exactly what's included."
      />

      <PosterCard
        glyph="Cq"
        title={<>Code-Quality <span className="dim">Flags</span></>}
        language="typescript"
        code={`{
  "compilerOptions": {
    "noUnusedLocals": true,          // flags dead variables
    "noUnusedParameters": true,      // flags dead params (prefix _ to skip)
    "noFallthroughCasesInSwitch": true, // switch case must break/return
    "noImplicitReturns": true        // every code path must return, or none do
  }
}`}
        caption="None of these are part of strict — they're code-quality checks, not type-safety checks. Cheap to enable, and each one catches a real class of copy-paste bug (forgotten break, dead variable left after a refactor)."
      />

      <PosterQuickRef
        title="Which tsconfig flag do I need?"
        rows={[
          { need: 'Config never mentions strict — am I strict?', answer: 'TS 6: yes. Opt out with strict: false' },
          { need: 'Which flags does strict actually turn on?', answer: 'Eight — and alwaysStrict is NOT one of them' },
          { need: 'Stop out-of-bounds array/object reads from lying', answer: 'noUncheckedIndexedAccess (scaffolded by tsc --init)' },
          { need: 'Enforce optional vs explicitly-undefined', answer: 'exactOptionalPropertyTypes' },
          { need: 'Fix "not a module" default imports from CJS', answer: 'esModuleInterop' },
          { need: "A broken 3rd-party .d.ts breaks your build", answer: 'skipLibCheck' },
          { need: 'Vite/esbuild build fails on type-only exports', answer: 'isolatedModules or verbatimModuleSyntax' },
          { need: 'Import alias works in editor, fails at build', answer: 'Add paths to bundler config too' },
          { need: 'File exists but "cannot find module"', answer: 'Check include/exclude, run tsc --listFiles' },
          { need: 'Match Vite\'s import resolution rules', answer: 'moduleResolution: "bundler"' },
        ]}
      />
    </PosterLayout>
  );
}
