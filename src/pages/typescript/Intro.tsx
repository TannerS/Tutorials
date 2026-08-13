import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="Intro &amp; Setup"
      sectionId="typescript"
      lessonIndex={0}
      prev={null}
      next={{ path: '/typescript/types', label: 'Type System Fundamentals' }}
    >
      {/* 1. What is TypeScript and Why Use It */}
      <h2>What is TypeScript and Why Use It</h2>
      <p>
        TypeScript is a statically typed superset of JavaScript developed by Microsoft.
        Every valid JavaScript program is also valid TypeScript, but TypeScript adds a
        type system that catches bugs <strong>before</strong> your code ever runs.
      </p>
      <p>
        As a senior JS/React developer you already know how painful it is to trace a
        runtime <code>TypeError</code> three layers deep. TypeScript eliminates entire
        categories of those errors at compile time.
      </p>
      <h3>Key Benefits</h3>
      <ul>
        <li><strong>Type Safety</strong> &mdash; catch null dereferences, misspelled property names, and wrong argument types before you ship.</li>
        <li><strong>Better DX</strong> &mdash; VS Code autocomplete becomes dramatically more useful when the editor knows every type.</li>
        <li><strong>Refactoring Confidence</strong> &mdash; rename a prop or change a return type and the compiler shows every call site that needs updating.</li>
        <li><strong>Self-Documenting Code</strong> &mdash; typed function signatures serve as living documentation that never drifts out of sync.</li>
        <li><strong>IDE Support</strong> &mdash; inline errors, parameter hints, go-to-definition, and intelligent navigation all powered by the type system.</li>
      </ul>

      <InfoBox variant="tip" title="Already Getting Some Benefits">
        Even without TypeScript, VS Code uses the TypeScript language service under the
        hood to power IntelliSense in <code>.js</code> files. Adopting TS fully just
        unlocks the complete feature set.
      </InfoBox>

      {/* 2. TypeScript vs JavaScript */}
      <h2>TypeScript vs JavaScript</h2>
      <p>
        TypeScript is a superset of JavaScript. All JS is valid TS, but TS adds
        types, interfaces, enums, generics, and more.
      </p>

      <InfoBox variant="note" title="&quot;Superset&quot; Means Syntax, Not Acceptance">
        <p>
          The superset claim is about <em>grammar</em>: TypeScript can parse any JavaScript
          file. It does not promise that TypeScript will <em>accept</em> it. Paste a working
          JS file into a <code>.ts</code> file with <code>strict: true</code> and you will
          usually get errors immediately &mdash; implicit <code>any</code> on every unannotated
          parameter, possibly-null values you were handling by convention.
        </p>
        <p>
          That is not TypeScript being broken. Those errors are the point: the code always had
          those assumptions, they were just invisible. Keep the distinction in mind, because
          &quot;all JS is valid TS&quot; is the sentence that makes people expect a clean
          migration and then feel ambushed.
        </p>
      </InfoBox>

      <FlowChart
        title="TypeScript as a Superset of JavaScript"
        chart={
          'graph TD\n' +
          'TS[TypeScript] --> JS[JavaScript]\n' +
          'TS --> TYPES[Static Types]\n' +
          'TS --> INTF[Interfaces & Generics]\n' +
          'TS --> ENUMS[Enums & Advanced Types]\n' +
          'JS --> RUNTIME[Runs in Browser / Node.js]\n' +
          'TS -->|compiles to| RUNTIME'
        }
      />

      <CodeBlock language="javascript" title="Plain JavaScript">
        {'function greet(name) {\n' +
          '  return `Hello, ${name.toUpperCase()}!`;\n' +
          '}\n\n' +
          '// No error until runtime — crashes if name is undefined\n' +
          'greet(undefined); // TypeError: Cannot read properties of undefined'}
      </CodeBlock>

      <CodeBlock language="typescript" title="TypeScript Equivalent">
        {'function greet(name: string): string {\n' +
          '  return `Hello, ${name.toUpperCase()}!`;\n' +
          '}\n\n' +
          '// Compile-time error:\n' +
          '// error TS2345: Argument of type \'undefined\' is not assignable\n' +
          '//               to parameter of type \'string\'.\n' +
          'greet(undefined);'}
      </CodeBlock>

      <InfoBox variant="warning" title="TypeScript Did Not Stop the Crash">
        <p>
          Run <code>tsc</code> on that file and you get the error &mdash; and, by default, you
          also get the compiled <code>.js</code>, which still calls{' '}
          <code>greet(undefined)</code> and still throws the same{' '}
          <code>TypeError</code> at runtime. TypeScript inserted no check. There is no
          <code> if (typeof name !== &quot;string&quot;) throw</code> in the output; the
          annotation <code>: string</code> is deleted entirely.
        </p>
        <p>
          This is the mental model everything else in this section rests on:{' '}
          <strong>the type checker and your running program are two separate things</strong>.
          The checker is a linter that proves claims about your code before it ships. It
          changes what you are allowed to <em>write</em>, never what the code <em>does</em>.
          Whenever a type is wrong at runtime &mdash; a bad API response, a mis-parsed JSON
          blob &mdash; the compiler is not there to catch it. You will see this again as the
          reason <code>as</code> assertions are dangerous and why validating at the boundary
          matters.
        </p>
      </InfoBox>

      {/* 3. How to Read a TypeScript Error */}
      <h2>How to Read a TypeScript Error</h2>
      <p>
        TypeScript&apos;s errors have a reputation for being unreadable. They are not &mdash; they
        are just verbose and structured, and almost nobody is taught the structure. Learning
        it now pays off on every single lesson that follows, so spend two minutes here.
      </p>
      <p>Every diagnostic has the same four parts:</p>

      <CodeBlock language="text" title="Anatomy of a diagnostic">
        {'src/greet.ts(6,7): error TS2345: Argument of type \'undefined\' is not\n' +
          '                   assignable to parameter of type \'string\'.\n' +
          '│            │ │           │\n' +
          '│            │ │           └─ 4. the message: what the checker tried to prove\n' +
          '│            │ └───────────── 3. the error code — stable, and googleable\n' +
          '│            └─────────────── 2. line 6, column 7 — where it gave up,\n' +
          '│                                NOT necessarily where you made the mistake\n' +
          '└──────────────────────────── 1. the file'}
      </CodeBlock>

      <p>
        The message itself is nearly always a variation on one sentence:{' '}
        <strong>&quot;Type <em>A</em> is not assignable to type <em>B</em>.&quot;</strong>{' '}
        Read it as: <em>B is what this position requires; A is what you supplied; the checker
        could not show that every A is a valid B.</em> The order matters &mdash; swapping A and
        B changes the meaning completely, and misreading the direction is the most common
        source of &quot;this error makes no sense&quot;.
      </p>

      <h3>Nested errors: read the last line first</h3>
      <p>
        When the mismatch is buried inside an object, TypeScript prints a chain: a headline
        followed by increasingly indented lines that drill toward the real culprit.
      </p>

      <CodeBlock language="typescript" title="The code that produces a chain">
        {'interface Config { server: { host: { name: string } } }\n\n' +
          'declare const fromEnv: { server: { host: { name: number } } };\n\n' +
          'const config: Config = fromEnv;'}
      </CodeBlock>

      <CodeBlock language="text" title="The chain tsc actually prints">
        {'error TS2322: Type \'{ server: { host: { name: number; }; }; }\' is not\n' +
          '              assignable to type \'Config\'.\n' +
          '  The types of \'server.host.name\' are incompatible between these types.\n' +
          '    Type \'number\' is not assignable to type \'string\'.'}
      </CodeBlock>

      <p>
        The first line is the least useful: it restates the whole assignment, which is why
        long chains look terrifying. <strong>Start at the bottom.</strong> The last line is
        always the actual conflict &mdash; here, <code>number</code> vs <code>string</code>.
        The middle lines are the <em>path</em> the checker walked to find it:{' '}
        <code>server.host.name</code>. Bottom line tells you <em>what</em> is wrong; middle
        lines tell you <em>where</em>. The headline you can usually ignore.
      </p>

      <InfoBox variant="tip" title="Three Habits That Defuse Most Errors">
        <ul>
          <li>
            <strong>Read bottom-up.</strong> The innermost, most-indented line is the real
            error; everything above it is context.
          </li>
          <li>
            <strong>Trust the code, not the wording.</strong> <code>TS2345</code> is always
            &quot;bad argument&quot;, <code>TS2322</code> is always &quot;bad assignment&quot;,{' '}
            <code>TS2339</code> is always &quot;property does not exist&quot;. You will learn
            a handful of these by sight and they never change.
          </li>
          <li>
            <strong>Suspect the annotation, not just the value.</strong> The reported position
            is where the checker <em>gave up</em>. The mistake is often in the type you
            declared several lines earlier.
          </li>
        </ul>
      </InfoBox>

      {/* 4. Installation & Getting Started */}
      <h2>Installation &amp; Getting Started</h2>

      <CodeBlock language="bash" title="Install TypeScript">
        {'# Install TypeScript as a dev dependency\n' +
          'npm install -D typescript\n\n' +
          '# Generate a tsconfig.json with sensible defaults\n' +
          'npx tsc --init\n\n' +
          '# Compile entire project (uses tsconfig.json)\n' +
          'npx tsc'}
      </CodeBlock>

      <p>
        Running <code>npx tsc --init</code> generates a <code>tsconfig.json</code> in
        your project root &mdash; the single source of truth for how TypeScript compiles your code.
      </p>

      <CodeBlock language="json" title="What tsc --init generates today (TypeScript 5.9+ / 6.x)">
        {'{\n' +
          '  "compilerOptions": {\n' +
          '    // Environment\n' +
          '    "module": "nodenext",\n' +
          '    "target": "esnext",\n' +
          '    "types": [],\n' +
          '\n' +
          '    // Stricter type-checking\n' +
          '    "noUncheckedIndexedAccess": true,\n' +
          '    "exactOptionalPropertyTypes": true,\n' +
          '\n' +
          '    // Recommended\n' +
          '    "strict": true,\n' +
          '    "jsx": "react-jsx",\n' +
          '    "verbatimModuleSyntax": true,\n' +
          '    "isolatedModules": true,\n' +
          '    "noUncheckedSideEffectImports": true,\n' +
          '    "moduleDetection": "force",\n' +
          '    "skipLibCheck": true\n' +
          '  }\n' +
          '}'}
      </CodeBlock>

      <InfoBox variant="warning" title="Old Blog Posts Show a Different tsc --init">
        Up to TypeScript 5.7, <code>tsc --init</code> emitted a ~100-line file with every
        option listed and commented out, defaulting to <code>&quot;target&quot;: &quot;es2016&quot;</code> and{' '}
        <code>&quot;module&quot;: &quot;commonjs&quot;</code>. TypeScript 5.9 replaced it with the short,
        opinionated file above. If a tutorial shows the long commented version, it predates 2025.
      </InfoBox>

      {/* 4. tsconfig.json Deep Dive */}
      <h2>tsconfig.json Deep Dive</h2>
      <p>
        The <code>tsconfig.json</code> controls every aspect of the TypeScript compiler.
        Understanding its options is essential for setting up projects correctly.
      </p>

      <h3>strict</h3>
      <p>
        The <code>strict</code> flag is a master switch that enables a family of strict
        type-checking options all at once:
      </p>
      <CodeBlock language="json" title="What strict Enables">
        {'{\n' +
          '  "compilerOptions": {\n' +
          '    "strict": true\n' +
          '    // Equivalent to enabling ALL of the following:\n' +
          '    // "noImplicitAny": true,\n' +
          '    // "strictNullChecks": true,\n' +
          '    // "strictFunctionTypes": true,\n' +
          '    // "strictBindCallApply": true,\n' +
          '    // "strictPropertyInitialization": true,\n' +
          '    // "strictBuiltinIteratorReturn": true,   // added in TS 5.6\n' +
          '    // "noImplicitThis": true,\n' +
          '    // "useUnknownInCatchVariables": true\n' +
          '  }\n' +
          '}'}
      </CodeBlock>

      <InfoBox variant="note" title="alwaysStrict Is No Longer Part of strict">
        Older references list <code>alwaysStrict</code> as a member of the strict family.
        It is not any more: it now defaults to <code>true</code> on its own and is only
        disabled by setting it to <code>false</code> explicitly. Turning <code>strict</code> off
        does not turn it off. (Run <code>npx tsc --showConfig</code> to see the resolved values
        for your own project.)
      </InfoBox>

      <InfoBox variant="warning" title="Always Enable strict — Even Though It Is Now the Default">
        <p>
          Retroactively enabling <code>strict</code> on a large codebase means fixing hundreds
          of errors at once. Turn it on from day one.
        </p>
        <p>
          On TypeScript 6 (what this course runs) it already <em>is</em> on: a config that
          never mentions <code>strict</code> gets the strict behaviour, and only an explicit{' '}
          <code>&quot;strict&quot;: false</code> turns it off. Write the line anyway &mdash;
          it documents the intent and survives being opened by an older compiler. The
          tsconfig lesson shows the verified before/after.
        </p>
      </InfoBox>

      <h3>target</h3>
      <p>
        Specifies the ECMAScript version the compiler outputs. This determines which
        JS features are downleveled and which are emitted as-is.
      </p>
      <CodeBlock language="json" title="target Options">
        {'{\n' +
          '  "compilerOptions": {\n' +
          '    // Common targets:\n' +
          '    "target": "ES2020"   // Supports optional chaining, nullish coalescing\n' +
          '    // "target": "ES2022" // Supports top-level await, class fields\n' +
          '    // "target": "ESNext" // Latest — use when a bundler handles downleveling\n' +
          '  }\n' +
          '}'}
      </CodeBlock>

      <h3>module</h3>
      <p>Determines the module system used in the emitted JavaScript.</p>
      <CodeBlock language="json" title="module Options">
        {'{\n' +
          '  "compilerOptions": {\n' +
          '    // "module": "commonjs"  // require/module.exports — traditional Node.js\n' +
          '    // "module": "esnext"    // import/export — for bundlers like Vite, webpack\n' +
          '    "module": "nodenext"     // Node.js ESM with package.json type awareness\n' +
          '  }\n' +
          '}'}
      </CodeBlock>

      <h3>jsx</h3>
      <p>
        Controls how JSX is transformed. For modern React (17+), use
        <code> react-jsx</code> which uses the automatic runtime and removes the need
        to import React in every file.
      </p>
      <CodeBlock language="json" title="jsx Options">
        {'{\n' +
          '  "compilerOptions": {\n' +
          '    "jsx": "react-jsx"       // React 17+ automatic runtime\n' +
          '    // "jsx": "react"        // Classic: requires import React\n' +
          '    // "jsx": "react-jsxdev" // Dev mode with extra checks\n' +
          '    // "jsx": "preserve"     // Keep JSX as-is — let bundler handle it\n' +
          '  }\n' +
          '}'}
      </CodeBlock>

      <h3>esModuleInterop</h3>
      <p>
        Enables compatibility between CommonJS and ES module import syntax.
      </p>
      <CodeBlock language="typescript" title="Why esModuleInterop Matters">
        {'// Without esModuleInterop:\n' +
          'import * as express from \'express\'; // awkward namespace import\n\n' +
          '// With esModuleInterop: true\n' +
          'import express from \'express\';       // clean default import'}
      </CodeBlock>

      <h3>paths &amp; baseUrl</h3>
      <p>
        Path aliases let you avoid deeply nested relative imports by mapping module
        names to file paths at compile time.
      </p>
      <CodeBlock language="json" title="Path Aliases Configuration">
        {'{\n' +
          '  "compilerOptions": {\n' +
          '    "baseUrl": ".",\n' +
          '    "paths": {\n' +
          '      "@components/*": ["src/components/*"],\n' +
          '      "@hooks/*": ["src/hooks/*"],\n' +
          '      "@utils/*": ["src/utils/*"]\n' +
          '    }\n' +
          '  }\n' +
          '}'}
      </CodeBlock>

      <CodeBlock language="typescript" title="Using Path Aliases">
        {'// Before — fragile relative imports\n' +
          'import { Button } from \'../../../components/Button\';\n\n' +
          '// After — clean aliased imports\n' +
          'import { Button } from \'@components/Button\';'}
      </CodeBlock>

      <InfoBox variant="info" title="Path Aliases Need Bundler Config Too">
        TypeScript path aliases only resolve at compile time. Your bundler (Vite,
        webpack) also needs matching config. In Vite, use the
        <code> vite-tsconfig-paths</code> plugin to sync them automatically.
      </InfoBox>

      <h3>include &amp; exclude</h3>
      <p>
        Top-level options that control which files TypeScript processes via glob patterns.
      </p>
      <CodeBlock language="json" title="include / exclude">
        {'{\n' +
          '  "include": ["src/**/*.ts", "src/**/*.tsx"],\n' +
          '  "exclude": ["node_modules", "dist", "**/*.test.ts"]\n' +
          '}'}
      </CodeBlock>

      <h3>outDir &amp; rootDir</h3>
      <p>
        <code>outDir</code> sets where compiled JS is written. <code>rootDir</code> defines
        the source root, controlling the directory structure inside <code>outDir</code>.
      </p>
      <CodeBlock language="json" title="outDir / rootDir">
        {'{\n' +
          '  "compilerOptions": {\n' +
          '    "rootDir": "src",\n' +
          '    "outDir": "dist"\n' +
          '  }\n' +
          '}\n' +
          '// src/utils/math.ts  →  dist/utils/math.js\n' +
          '// src/index.ts       →  dist/index.js'}
      </CodeBlock>

      {/* 5. Recommended tsconfig for React */}
      <h2>Recommended tsconfig for React Projects</h2>
      <p>A production-ready config for a React app using Vite or a modern bundler:</p>

      <CodeBlock language="json" title="tsconfig.json — React + Vite">
        {'{\n' +
          '  "compilerOptions": {\n' +
          '    "target": "ESNext",\n' +
          '    "module": "ESNext",\n' +
          '    "moduleResolution": "bundler",\n' +
          '    "jsx": "react-jsx",\n' +
          '    "strict": true,\n' +
          '    "esModuleInterop": true,\n' +
          '    "skipLibCheck": true,\n' +
          '    "forceConsistentCasingInFileNames": true,\n' +
          '    "resolveJsonModule": true,\n' +
          '    "isolatedModules": true,\n' +
          '    "noEmit": true,\n' +
          '    "noUnusedLocals": true,\n' +
          '    "noUnusedParameters": true,\n' +
          '    "noFallthroughCasesInSwitch": true,\n' +
          '    "baseUrl": ".",\n' +
          '    "paths": {\n' +
          '      "@/*": ["src/*"]\n' +
          '    }\n' +
          '  },\n' +
          '  "include": ["src"],\n' +
          '  "exclude": ["node_modules"]\n' +
          '}'}
      </CodeBlock>
      <p>
        Note <code>noEmit: true</code> &mdash; Vite handles transpilation via esbuild
        or SWC. TypeScript is only used for type checking.
      </p>

      {/* 6. Recommended tsconfig for Node.js */}
      <h2>Recommended tsconfig for Node.js Projects</h2>
      <p>A config for a Node.js 18+ backend service using ES modules:</p>

      <CodeBlock language="json" title="tsconfig.json — Node.js 18+ ESM">
        {'{\n' +
          '  "compilerOptions": {\n' +
          '    "target": "ES2022",\n' +
          '    "module": "nodenext",\n' +
          '    "moduleResolution": "nodenext",\n' +
          '    "strict": true,\n' +
          '    "esModuleInterop": true,\n' +
          '    "skipLibCheck": true,\n' +
          '    "forceConsistentCasingInFileNames": true,\n' +
          '    "resolveJsonModule": true,\n' +
          '    "declaration": true,\n' +
          '    "declarationMap": true,\n' +
          '    "sourceMap": true,\n' +
          '    "outDir": "dist",\n' +
          '    "rootDir": "src",\n' +
          '    "noUnusedLocals": true,\n' +
          '    "noUnusedParameters": true\n' +
          '  },\n' +
          '  "include": ["src/**/*.ts"],\n' +
          '  "exclude": ["node_modules", "dist", "**/*.test.ts"]\n' +
          '}'}
      </CodeBlock>

      {/* 7. How TS Compilation Works */}
      <h2>How TypeScript Compilation Works</h2>
      <p>
        TypeScript compilation is a two-phase process: type checking and code emission.
        Types are completely erased in the output &mdash; zero runtime cost.
      </p>

      <FlowChart
        title="TypeScript Compilation Pipeline"
        chart={
          'graph LR\n' +
          'SRC[.ts / .tsx Source] --> PARSE[Parser]\n' +
          'PARSE --> AST[Abstract Syntax Tree]\n' +
          'AST --> CHECK[Type Checker]\n' +
          'CHECK -->|errors| DIAG[Diagnostics]\n' +
          'CHECK -->|passes| EMIT[Emitter]\n' +
          'EMIT --> OUTPUT[.js + .d.ts + .js.map]\n' +
          'OUTPUT --> RUNTIME[Node.js / Browser]'
        }
      />

      <p>
        Even with type errors the compiler can still emit JavaScript (unless you set
        <code> noEmitOnError: true</code>). This lets you incrementally adopt TypeScript
        without blocking builds.
      </p>

      {/* 8. Declaration Files */}
      <h2>Declaration Files (.d.ts)</h2>
      <p>
        Declaration files describe the types of a JavaScript library without containing
        implementation. They have the <code>.d.ts</code> extension and let TypeScript
        type-check code that uses plain JS packages.
      </p>

      <CodeBlock language="bash" title="Installing Type Declarations">
        {'# Many popular libraries ship their own types.\n' +
          '# For those that don\'t, install from DefinitelyTyped:\n' +
          'npm install -D @types/react @types/react-dom\n' +
          'npm install -D @types/node\n' +
          'npm install -D @types/express'}
      </CodeBlock>

      <CodeBlock language="typescript" title="What a .d.ts File Looks Like">
        {'// express.d.ts (simplified)\n' +
          'declare namespace Express {\n' +
          '  interface Request {\n' +
          '    body: any;\n' +
          '    params: Record<string, string>;\n' +
          '    query: Record<string, string | undefined>;\n' +
          '  }\n' +
          '  interface Response {\n' +
          '    json(body: any): Response;\n' +
          '    status(code: number): Response;\n' +
          '  }\n' +
          '}'}
      </CodeBlock>

      <InfoBox variant="info" title="DefinitelyTyped">
        DefinitelyTyped is the largest repository of community-maintained TypeScript
        type definitions. When you run <code>npm install @types/some-lib</code>, you
        are pulling from this repo. It covers thousands of packages.
      </InfoBox>

      {/* 9. TypeScript Playground */}
      <h2>TypeScript Playground</h2>
      <p>
        The official{' '}
        <a href="https://www.typescriptlang.org/play" target="_blank" rel="noopener noreferrer">
          TypeScript Playground
        </a>{' '}
        is invaluable for experimenting without a project setup. You can test type
        expressions, toggle compiler options live, share snippets via URL, and explore
        the AST.
      </p>

      {/* 10. Interactive Challenges */}
      <h2>Knowledge Check</h2>

      <InteractiveChallenge
        question={"Which tsconfig option enables ALL strict type-checking flags at once?"}
        options={[
          '"noImplicitAny": true',
          '"strictNullChecks": true',
          '"strict": true',
          '"checkAll": true',
        ]}
        correctIndex={2}
        explanation={
          '"strict": true is a master switch that enables noImplicitAny, strictNullChecks, ' +
          'strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, ' +
          'strictBuiltinIteratorReturn, noImplicitThis, and useUnknownInCatchVariables all at ' +
          'once. Note that alwaysStrict is NOT one of them any more — it defaults to true ' +
          'independently of strict.'
        }
      />

      <InteractiveChallenge
        question={"tsc prints the chain below. Which line tells you what is actually wrong?"}
        code={`error TS2322: Type '{ user: { profile: { age: string; }; }; }' is not
              assignable to type 'Account'.
  The types of 'user.profile.age' are incompatible between these types.
    Type 'string' is not assignable to type 'number'.`}
        language="text"
        options={[
          "The first line — it names the two types involved",
          "The last, most-indented line — 'string' is not assignable to 'number'",
          "The middle line — it names the property path",
          "None of them; you need the source file to know",
        ]}
        correctIndex={1}
        explanation={
          "Read TypeScript chains bottom-up. The last line is always the real conflict: you " +
          "supplied a string where a number was required. The middle line is the path the " +
          "checker walked to reach it (user.profile.age), so it tells you WHERE to look. The " +
          "headline just restates the whole assignment and is the least useful part — which " +
          "is exactly why long chains feel unreadable if you start at the top."
        }
      />

      <InteractiveChallenge
        question={"For a React 17+ project using Vite, which \"jsx\" option should you use in tsconfig.json?"}
        options={[
          '"jsx": "react"',
          '"jsx": "react-jsx"',
          '"jsx": "preserve"',
          '"jsx": "react-native"',
        ]}
        correctIndex={1}
        explanation={
          '"react-jsx" uses the automatic JSX runtime introduced in React 17, so you ' +
          'no longer need to import React in every file that uses JSX. "preserve" is ' +
          'also valid when the bundler handles JSX, but "react-jsx" gives you both ' +
          'type-checking and the automatic runtime.'
        }
      />
    </LessonLayout>
  );
}
