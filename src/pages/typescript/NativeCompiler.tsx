import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NativeCompiler() {
  return (
    <LessonLayout
      title="TypeScript 6 → 7: The Native Compiler"
      sectionId="typescript"
      lessonIndex={13}
      prev={{ path: '/typescript/cheatsheet', label: 'TypeScript Cheat Sheet' }}
      next={null}
    >
      <p>
        TypeScript 7 is a <strong>ground-up rewrite of the compiler in Go</strong>. It is
        the largest change to the TypeScript toolchain since the project started &mdash;
        and one of the rare cases where a rewrite makes your code faster without you
        editing a single line of it.
      </p>
      <p>
        This lesson is deliberately concrete. Every number and every API claim below was
        measured against <em>this</em> repository, which is pinned to TypeScript 6. Where
        something is genuinely unsettled, it says so rather than guessing.
      </p>

      {/* ── Section 1: Why rewrite at all ─────────────────────────── */}
      <h2>1. Why Rewrite At All?</h2>

      <p>
        The honest framing: <code>tsc</code> was TypeScript compiling TypeScript. The
        compiler shipped as JavaScript, ran on Node, and was <em>single-threaded</em>. That
        is a remarkable bootstrapping story and a real performance ceiling at the same time.
      </p>

      <h3>Where the time actually goes</h3>
      <p>
        It is tempting to blame &ldquo;parsing&rdquo;, but parsing is comparatively cheap.
        The expensive phase is <strong>type checking</strong>: building symbol tables,
        resolving imports across the whole program, and then instantiating and comparing
        types &mdash; generics, conditional types and unions can produce an enormous amount
        of structural comparison work.
      </p>

      <CodeBlock language="bash" title="Find your own bottleneck before blaming the compiler">
{`# Where is time actually being spent?
npx tsc --noEmit --diagnostics

# Even more detail (files, memory, phase timings)
npx tsc --noEmit --extendedDiagnostics

# Which types are pathologically expensive?
npx tsc --noEmit --generateTrace ./trace
# then open trace/trace.json in Edge/Chrome at chrome://tracing`}
      </CodeBlock>

      <InfoBox variant="warning" title="A rewrite does not fix a pathological type">
        If one <code>Conditional</code> type in your codebase expands into millions of
        instantiations, the native compiler does that same work &mdash; just faster and on
        more cores. Profile first. A rewrite changes the constant factor, not your
        algorithmic mistakes.
      </InfoBox>

      <h3>Why Go, specifically</h3>
      <p>
        The team wanted a language that permits a fairly literal port of the existing
        compiler &mdash; the checker relies on mutable graphs of nodes and symbols with
        lots of shared references. Go offers native compilation, real threads and a garbage
        collector, so the existing data structures survive the port largely intact. That
        matters: a port that preserves the original algorithms is far likelier to preserve
        the original <em>behaviour</em>.
      </p>

      <FlowChart
        title="Old pipeline vs native pipeline"
        chart={"graph TD\n  subgraph TypeScript 6 - JS on Node\n    A1[Parse] --> B1[Bind]\n    B1 --> C1[Check - single thread]\n    C1 --> D1[Emit]\n  end\n  subgraph TypeScript 7 - native binary\n    A2[Parse - parallel] --> B2[Bind - parallel]\n    B2 --> C2[Check - multi core]\n    C2 --> D2[Emit]\n  end\n  D1 --> E[Same diagnostics and same JS output]\n  D2 --> E"}
      />

      {/* ── Section 2: What actually shipped ──────────────────────── */}
      <h2>2. What Actually Shipped</h2>

      <p>
        The native compiler was developed in the open under the codename
        <strong> tsgo</strong>, distributed as a preview package while it matured. It is no
        longer preview-only: <code>typescript@7</code> is published on npm and is the
        current <code>latest</code> tag.
      </p>

      <CodeBlock language="bash" title="Check reality yourself — never trust a tutorial's version numbers">
{`# What is installed right here?
node -e "console.log(require('typescript').version)"

# What does npm consider current?
npm view typescript dist-tags

# The original preview package (superseded, but still resolvable)
npm view @typescript/native-preview version`}
      </CodeBlock>

      <InfoBox variant="info" title="Versions verified while writing this lesson">
        This repo is pinned to <code>typescript@6.0.3</code>. On npm at the time of
        writing, <code>latest</code> resolved to <code>typescript@7.0.2</code>, with a
        <code> 7.1.0-dev.*</code> stream on the <code>next</code> tag. The
        <code> @typescript/native-preview</code> package still exists but its newest build
        predates the stable 7.0 release &mdash; it has effectively been folded into the
        main package. <strong>Re-run the commands above</strong>; these numbers move.
      </InfoBox>

      <h3>The package looks completely different</h3>
      <p>
        TypeScript 7 does not ship a big <code>typescript.js</code>. It ships a thin
        JavaScript wrapper plus a <strong>platform-specific native executable</strong>,
        selected through optional dependencies &mdash; the same trick esbuild and SWC use.
      </p>

      <CodeBlock language="json" title="typescript@7 package.json — the shape that matters">
{`{
  "name": "typescript",
  "version": "7.0.2",
  "type": "module",
  "bin": { "tsc": "./bin/tsc" },

  "exports": {
    ".": "./lib/version.cjs",          // <-- read that again
    "./unstable/sync":  "./dist/api/sync/api.js",
    "./unstable/async": "./dist/api/async/api.js",
    "./unstable/ast":   "./dist/ast/index.js"
    // ...
  },

  "optionalDependencies": {
    "@typescript/typescript-darwin-arm64": "7.0.2",
    "@typescript/typescript-linux-x64":    "7.0.2",
    "@typescript/typescript-win32-x64":    "7.0.2"
    // ... ~20 platform/arch combinations
  }
}`}
      </CodeBlock>

      <p>
        Two details in there have real consequences. First, <code>bin</code> contains
        <strong> only <code>tsc</code></strong> &mdash; there is no <code>tsserver</code>
        entry any more. Second, the root export <code>&quot;.&quot;</code> points at
        <code> version.cjs</code>, a file whose entire contents are the version number.
        Section&nbsp;6 explains why that matters enormously.
      </p>

      {/* ── Section 3: What changes and what does not ─────────────── */}
      <h2>3. What Changes &mdash; And What Absolutely Does Not</h2>

      <p>
        This is the part to internalise, because it is what makes the migration tractable.
        The rewrite targets the <em>implementation</em>, not the language.
      </p>

      <CodeBlock language="bash" title="The two columns">
{`┌──────────────────────────────────┬──────────────────────────────────────┐
│ CHANGES                          │ DOES NOT CHANGE                      │
├──────────────────────────────────┼──────────────────────────────────────┤
│ Typecheck / build wall time      │ The language itself                  │
│ Memory footprint                 │ The type system + inference rules    │
│ Multi-core utilisation           │ Your tsconfig.json                    │
│ Editor responsiveness on big     │ Your .d.ts files                     │
│   projects                       │ Error codes (TS2322 is still TS2322) │
│ How the compiler is distributed  │ The JavaScript that gets emitted     │
│ The programmatic API (a LOT)     │ CLI flags you use day to day         │
└──────────────────────────────────┴──────────────────────────────────────┘`}
      </CodeBlock>

      <p>
        The goal is that a codebase which typechecks clean under TypeScript 6 also
        typechecks clean under 7, producing the same diagnostics in the same order. That
        is why the port stayed close to the original algorithms instead of redesigning the
        checker.
      </p>

      <InfoBox variant="tip" title="Your tsconfig is portable">
        The native compiler reads the same <code>tsconfig.json</code>: <code>extends</code>
        chains, <code>references</code>, <code>paths</code>, the whole <code>strict</code>
        family. Nothing in this repo&apos;s config needed editing to run under 7.
      </InfoBox>

      {/* ── Section 4: Trying it, and reading the numbers ─────────── */}
      <h2>4. Trying It Today</h2>

      <p>
        You do not have to migrate anything to measure it. Install it side by side and
        point it at the config you already have.
      </p>

      <CodeBlock language="bash" title="Side-by-side, without disturbing your project">
{`# Install into a scratch directory so your app's TS version is untouched
mkdir /tmp/ts7 && cd /tmp/ts7 && npm init -y
npm install typescript@7

# Run the NEW compiler against your EXISTING project
npx tsc --noEmit -p /path/to/your/project/tsconfig.json

# Compare against the compiler your project is pinned to
cd /path/to/your/project
npx tsc --noEmit`}
      </CodeBlock>

      <h3>Measured on this repository</h3>
      <p>
        This site is roughly 269 <code>.ts</code>/<code>.tsx</code> files and about 111k
        lines, under <code>strict: true</code>. Both compilers were run against the same
        <code> tsconfig.json</code>:
      </p>

      <CodeBlock language="bash" title="Real numbers from this repo — one machine, Apple Silicon">
{`TypeScript 6.0.3  (tsc, JS on Node)
  wall time   ~5.5s - 6.3s
  CPU usage   ~113% - 132%     <-- barely more than one core
  exit code   0

TypeScript 7.0.2  (native binary)
  wall time   ~0.29s warm  (~0.89s on the first, cold run)
  CPU usage   ~181%             <-- genuinely using multiple cores
  exit code   0

Same tsconfig. Same file set. Same result: zero errors from both.`}
      </CodeBlock>

      <h3>How to interpret numbers like these</h3>
      <p>
        A ~19x warm figure is real but needs caveats, and you should apply the same
        scepticism to any benchmark someone shows you &mdash; including this one.
      </p>

      <CodeBlock language="bash" title="Benchmarking discipline">
{`# 1. Discard the first run. Cold OS file cache and, on macOS,
#    first-run binary verification both inflate it.
# 2. Run 3+ times and report the range, not your best number.
# 3. Compare like with like: same tsconfig, same file set,
#    --noEmit vs --noEmit (emit is cheap; checking is not).
# 4. Check the exit code AND the diagnostics, not just the clock.
#    A "fast" compiler that skipped half your files is not fast.
# 5. Your ratio will differ. Codebases heavy in complex generics
#    behave differently from codebases heavy in plain interfaces.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Speedups are not a single number">
        Wall-clock gains come from two separate sources: native code being faster than
        JIT-ed JavaScript, and work being spread across cores. How much you get depends on
        your core count, your project shape, and whether you were I/O bound to begin with.
        Treat &ldquo;10x&rdquo; as a headline, and measure your own repo before promising
        anything to your team.
      </InfoBox>

      <InteractiveChallenge
        question={"You run the native compiler on your project and it finishes in 0.3s instead of 6s, but reports 40 errors your current compiler does not. What is the most likely explanation?"}
        options={[
          "The native compiler is stricter by design and you must fix all 40",
          "It resolved a different set of files or a different config than you think",
          "The type system changed in TypeScript 7",
          "Native compilation cannot support strict mode"
        ]}
        correctIndex={1}
        explanation={"TypeScript 7 aims for diagnostic parity — the type system is deliberately unchanged. A sudden pile of new errors almost always means you pointed it at a different tsconfig, a different include set, or different lib/@types resolution. Verify with --showConfig and --listFiles on BOTH compilers before concluding the checker changed."}
      />

      {/* ── Section 5: Editors and LSP ────────────────────────────── */}
      <h2>5. What It Means For Your Editor</h2>

      <p>
        Editor support in TypeScript 6 runs through <code>tsserver</code>, a Node process
        speaking a bespoke JSON protocol that Microsoft designed before the Language Server
        Protocol existed. TypeScript 7 drops that binary and speaks <strong>LSP</strong>
        directly from the native executable.
      </p>

      <CodeBlock language="bash" title="The editor entry point is now a flag, not a separate binary">
{`# TypeScript 6: a separate Node program
node ./node_modules/typescript/bin/tsserver

# TypeScript 7: a mode of the compiler binary itself
tsc --lsp -stdio
# also supports:  -socket <addr>   -pipe <name>`}
      </CodeBlock>

      <p>
        Practically, this is the change most developers will <em>feel</em> first, because
        editor latency is what you experience hundreds of times an hour: how long until
        hover types appear, how long autocomplete takes in a large file, how long a project
        takes to load after you open the folder. Speaking LSP natively also makes life much
        easier for editors that are not VS Code, since they no longer need a shim to
        translate the legacy protocol.
      </p>

      <InfoBox variant="info" title="Adopt the editor and the CI separately">
        These are independent decisions. You can point your editor at the native language
        server for daily ergonomics while CI stays on TypeScript 6 as the source of truth,
        or vice versa. Just make sure you know <em>which</em> one is authoritative when the
        two disagree.
      </InfoBox>

      {/* ── Section 6: The API break ──────────────────────────────── */}
      <h2>6. The Big Caveat: The Programmatic API</h2>

      <p>
        Here is where a rewrite stops being free. If you only ever run <code>tsc</code> from
        a script, migration is close to trivial. If you <code>import</code> the compiler and
        call into it, you are the group most affected &mdash; and this repository is
        squarely in that group, which makes it a useful worked example.
      </p>

      <h3>What this very site does today</h3>

      <CodeBlock language="typescript" title="Three components here import the compiler at runtime">
{`// src/components/JsCompilerPlayground.tsx
// src/components/JsxCompilerPlayground.tsx
const ts = await import('typescript');
const result = ts.transpileModule(source, { compilerOptions: { /* ... */ } });

// src/components/TsTypeChecker.tsx
const [tsMod, vfsMod] = await Promise.all([
  import('typescript'),
  import('@typescript/vfs'),      // builds an in-memory program
]);
// ... then drives the language service to surface live type errors`}
      </CodeBlock>

      <p>
        Every one of those calls depends on the compiler being <strong>a JavaScript library
        you can load into a process you control</strong>. Under TypeScript 7 that
        assumption no longer holds. The root export is the version string and nothing else:
      </p>

      <CodeBlock language="typescript" title="Verified against typescript@7.0.2 — not a hypothetical">
{`const ts = await import('typescript');

Object.keys(ts);
// => ['default', 'module.exports', 'version', 'versionMajorMinor']

ts.version;              // '7.0.2'
typeof ts.transpileModule;  // 'undefined'   <-- gone
typeof ts.createProgram;    // 'undefined'   <-- gone`}
      </CodeBlock>

      <p>
        The functionality is not deleted; it moved, and it changed shape. The real API now
        lives behind <code>unstable/*</code> subpath exports, and it is a
        <strong> client for another process</strong> rather than an in-process library. The
        wrapper even vendors a JSON-RPC implementation to talk to the native binary.
      </p>

      <CodeBlock language="typescript" title="The new API is remote, handle-based, and explicitly unstable">
{`import { API } from 'typescript/unstable/sync';

const api = new API({ /* ... */ });
const snapshot = api.updateSnapshot();
const project  = snapshot.getProject('/path/tsconfig.json');
const program  = project?.getProgram();
// Symbols, Types and Signatures come back as HANDLES into the
// native process — not plain objects you can walk synchronously.
api.close();`}
      </CodeBlock>

      <InfoBox variant="danger" title="Read the word &quot;unstable&quot; literally">
        Those subpaths are named <code>unstable/</code> on purpose. Treat anything you build
        on them as code you have signed up to revisit. And if you depended on compiler
        <em> internals</em> &mdash; undocumented <code>ts.*</code> exports, patched
        <code> ts</code> objects, monkey-patched hosts &mdash; assume it is gone. Internals
        were never part of the contract, and a rewrite is exactly when that bill arrives.
      </InfoBox>

      <h3>The browser problem</h3>
      <p>
        There is a second, sharper issue for a site like this one. The playgrounds here run
        the compiler <strong>in the browser</strong> &mdash; Vite bundles
        <code> typescript</code> and it executes on the user&apos;s machine with no server
        involved. TypeScript 7 is a native executable per platform. A native binary cannot
        be bundled into a web page, and the published package contains no WebAssembly build.
      </p>

      <CodeBlock language="bash" title="What that means concretely for these pages">
{`Playgrounds here need: a compiler that runs INSIDE the browser tab.
TypeScript 7 provides:  a native binary + an RPC client for Node.

=> Bumping this repo to typescript@7 would BREAK the playgrounds.
   Not because of a bug — because of an architectural mismatch.

Reasonable options for browser-based tooling:
  1. Stay on typescript@6 for the in-browser use case specifically.
     It is still a perfectly good JS compiler and will not vanish.
  2. Wait for an official wasm/browser story before moving.
  3. Use a JS-native transpiler for TRANSPILE-only needs
     (esbuild-wasm, swc-wasm, sucrase) and keep TS for CHECKING.

Note option 3 only covers the playgrounds that call transpileModule.
TsTypeChecker needs real type CHECKING, which transpilers cannot do.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Honest unknowns">
        Whether <code>@typescript/vfs</code> gains a TypeScript 7 story, and whether an
        official browser/wasm distribution ships, were <strong>not</strong> things that
        could be verified from the installed packages. Its <code>peerDependencies</code>
        currently say <code>typescript: &quot;*&quot;</code>, which is optimistic rather
        than a guarantee of 7.x support. Check the release notes rather than trusting this
        paragraph.
      </InfoBox>

      <InteractiveChallenge
        question={"Your build script calls ts.transpileModule() from a Node CLI. Your teammate's CI just runs `tsc --noEmit`. Who has more migration work for TypeScript 7?"}
        options={[
          "Your teammate — CLI flags were redesigned",
          "You — the programmatic API changed shape entirely",
          "Neither, the migration is automatic for both",
          "Both equally, since the type system changed"
        ]}
        correctIndex={1}
        explanation={"CLI usage is the smooth path: same tsconfig, same flags, same diagnostics. Programmatic consumers are the disrupted group — the root export no longer includes transpileModule or createProgram, and the replacement API under 'unstable/*' is an RPC client with a different object model rather than an in-process library."}
      />

      {/* ── Section 7: Migration expectations ─────────────────────── */}
      <h2>7. Migration Expectations</h2>

      <FlowChart
        title="Deciding how much work you actually have"
        chart={"graph TD\n  A[Do you import the compiler in code?] -->|No, just run tsc| B[Low effort]\n  A -->|Yes| C[Which APIs?]\n  B --> D[Install 7, run against existing tsconfig, compare diagnostics]\n  C -->|Documented ts.* API| E[Medium - port to unstable subpath API]\n  C -->|Compiler internals| F[High - internals are gone]\n  C -->|Runs in a browser| G[Blocked - no wasm build shipped]\n  D --> H[Adopt in CI once diagnostics match]\n  E --> H\n  F --> I[Re-plan on supported APIs]\n  G --> J[Stay on 6 for that use case]"}
      />

      <CodeBlock language="bash" title="A migration order that will not hurt you">
{`# 1. Measure. Do not migrate what is not slow.
npx tsc --noEmit --extendedDiagnostics

# 2. Run 7 side by side, WITHOUT changing your project's dependency.
#    Compare diagnostics exactly — count, codes, and file set.
npx tsc --noEmit -p ./tsconfig.json          # your pinned 6.x
/tmp/ts7/node_modules/.bin/tsc --noEmit -p ./tsconfig.json

# 3. Confirm you are comparing the same inputs.
npx tsc --showConfig
npx tsc --listFiles | sort > /tmp/files-6.txt

# 4. Adopt in the fastest-feedback place first: your editor.
#    Then a non-blocking CI job. Only then the blocking one.

# 5. Inventory programmatic consumers before flipping anything:
grep -rn "from 'typescript'\\|import('typescript')" src/`}
      </CodeBlock>

      <InfoBox variant="tip" title="You are allowed to run both">
        Nothing forces a single version. A very common landing pattern is: native compiler
        for the fast inner loop (editor, watch mode, pre-commit) and the version you have
        always shipped as the authoritative gate in CI &mdash; until diagnostics have
        matched for long enough that you trust the swap.
      </InfoBox>

      <h3>What to tell your team</h3>
      <CodeBlock language="bash" title="The short version">
{`- The language is unchanged. Nobody has to relearn TypeScript.
- Your tsconfig, your .d.ts files and your error codes carry over.
- Typechecking gets dramatically faster and uses multiple cores.
- tsserver is replaced by an LSP mode of the compiler binary.
- If we import the compiler in our own tooling, THAT is the work.
- Adopt in the editor first; make CI the last thing to change.`}
      </CodeBlock>

      <InfoBox variant="success" title="What you should take away">
        TypeScript 7 makes the compiler fast without asking you to change how you write
        TypeScript &mdash; and this repo is a live example of both sides of that trade:
        <code> npx tsc --noEmit</code> gets ~19x faster for free, while the three
        components that <code>import(&apos;typescript&apos;)</code> to power the in-browser
        playgrounds cannot follow it yet. Knowing which side of that line a given piece of
        tooling sits on is the whole migration story.
      </InfoBox>
    </LessonLayout>
  );
}
