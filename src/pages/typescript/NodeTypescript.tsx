import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function NodeTypescript() {
  return (
    <LessonLayout
      title="TypeScript on Node"
      sectionId="typescript"
      lessonIndex={15}
      prev={{ path: '/typescript/runtime-validation', label: 'Runtime Validation & Schemas' }}
      next={null}
    >
      <p>
        Node can now execute a <code>.ts</code> file directly — no build step, no{' '}
        <code>ts-node</code>, no bundler. That is a genuinely useful change, and it comes with one
        constraint that explains every confusing error you will hit: Node <strong>strips</strong>{' '}
        types, it does not <strong>transform</strong> them, and it never checks them.
      </p>

      <h2>Stripping vs Transforming</h2>
      <p>
        These are two different jobs, and the distinction is the whole lesson.
      </p>
      <p>
        <strong>Stripping</strong> means replacing type syntax with whitespace. An annotation like{' '}
        <code>: string</code> is deleted, the surrounding code keeps its exact byte offsets, and no
        understanding of the type system is required. It is a purely local, mechanical edit — which
        is why it can be fast enough to do on every startup.
      </p>
      <p>
        <strong>Transforming</strong> means emitting JavaScript that did not exist in the source. A
        TypeScript <code>enum</code> is not an annotation; it compiles to a real runtime object.
        There is nothing to delete — something must be <em>generated</em>. Same for parameter
        properties, which turn into assignment statements in the constructor body, and namespaces,
        which become IIFEs.
      </p>

      <FlowChart
        title="Why some TypeScript survives stripping and some doesn't"
        chart={"graph TD\n  A[TypeScript source] --> B{Does this construct emit runtime code?}\n  B -->|No — type-only| C[Annotations, interfaces, type aliases, generics]\n  C --> D[Erase to whitespace]\n  D --> E[Node runs it]\n  B -->|Yes — needs codegen| F[enum, parameter properties, namespace]\n  F --> G[Nothing to erase — code must be GENERATED]\n  G --> H[ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]"}
      />

      <h2>What that looks like in practice</h2>
      <p>
        Everything below was run on the Node version installed alongside this site (v25). Plain
        type annotations need no flag at all:
      </p>

      <CodeBlock language="typescript" title="plain.ts — runs as-is">
{`interface User { id: number; name: string }
function greet(u: User): string { return \`Hi \${u.name}\`; }
const x: number = 42;
console.log(greet({ id: 1, name: "Ada" }), x);

// $ node plain.ts
// Hi Ada 42`}
      </CodeBlock>

      <p>
        The three constructs that need code generation fail, and the error names the reason
        directly:
      </p>

      <CodeBlock language="text" title="The strip-only failures — verbatim output">
{`$ node withenum.ts
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]:
  TypeScript enum is not supported in strip-only mode

$ node pp.ts
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]:
  TypeScript parameter property is not supported in strip-only mode

$ node ns.ts
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]:
  TypeScript namespace declaration is not supported in strip-only mode`}
      </CodeBlock>

      <InfoBox variant="tip" title="Read the error as a category, not three separate bugs">
        <p>
          &quot;Not supported in strip-only mode&quot; is not a list of arbitrary gaps that will be
          filled in later. It is the same fact three times: each of these constructs produces
          runtime code, so there is no way to honour it by deleting characters. Once you can
          classify a TypeScript feature as <em>type-only</em> or <em>emits code</em>, you can
          predict which side of this line it falls on without looking it up.
        </p>
      </InfoBox>

      <h2>There is no escape hatch anymore — avoid the constructs instead</h2>
      <p>
        Older Node versions could do the full transform behind{' '}
        <code>--experimental-transform-types</code>, a flag added in v22.7.0 that ran the
        parameter-property example above successfully. That flag is gone. Node.js{' '}
        <strong>removed it entirely in v26.0.0</strong> (released May&nbsp;2026, tracked in{' '}
        <a href="https://github.com/nodejs/node/pull/61803">nodejs/node PR&nbsp;#61803</a>) — it
        was not stabilised into a permanent option, it was deleted outright. The current Node docs
        are explicit that <code>enum</code>, parameter properties, and namespaces with runtime code
        still throw <code>ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX</code> under native execution, with{' '}
        <strong>no flag left to opt back in</strong> — full-transform support is not on Node&apos;s
        roadmap; the docs point to third-party tools like <code>tsx</code> instead.
      </p>
      <p>
        The move in new code, then, is not &ldquo;reach for the flag&rdquo; — it is to avoid the
        constructs entirely. Two of the three have modern replacements this course already
        recommends on other grounds — an <code>as const</code> object instead of <code>enum</code>,
        and ES modules instead of namespaces. TypeScript ships a compiler option,{' '}
        <code>erasableSyntaxOnly</code>, that turns &quot;this will not run under Node&quot; from a
        runtime surprise into a compile error, catching the problem long before anyone runs{' '}
        <code>node app.ts</code>.
      </p>
      <InfoBox variant="warning" title="If you genuinely need the full transform">
        <p>
          Native execution is for lightweight, erasable TypeScript. If your project relies on{' '}
          <code>enum</code>, parameter properties, decorators, or anything else that needs real
          code generation, native Node execution is not a fit — reach for a third-party loader
          such as <code>tsx</code>, which the Node docs themselves now recommend for &ldquo;full
          support&rdquo;, or keep a conventional <code>tsc</code> build step.
        </p>
      </InfoBox>

      <CodeBlock language="json" title="tsconfig.json — fail at build time instead of at startup">
{`{
  "compilerOptions": {
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true
  }
}`}
      </CodeBlock>

      <h2>The part that surprises people</h2>
      <InfoBox variant="danger" title="Node does not type-check. At all.">
        <p>
          Stripping requires no type information, and Node does not have a type checker. Running{' '}
          <code>.ts</code> files directly gives you <strong>zero</strong> type safety at runtime.
          This is not a subtle caveat — it is verifiable in one line:
        </p>
        <CodeBlock language="text" title="Verified — a blatant type error runs happily">
{`// bad.ts
const n: number = "not a number";
console.log(n);

$ node bad.ts
not a number`}
        </CodeBlock>
        <p>
          Nothing warned. Nothing failed. If your only &quot;build step&quot; is{' '}
          <code>node app.ts</code>, then <code>tsc --noEmit</code> in CI (or your editor) is the{' '}
          <em>only</em> thing standing between you and shipping that. Native execution replaces the
          bundler, not the compiler.
        </p>
      </InfoBox>

      <h2>Setting up a Node service</h2>
      <p>
        Node&apos;s own APIs need type definitions, and they are not bundled:
      </p>
      <CodeBlock language="bash" title="Dependencies">
{`npm i -D typescript @types/node
npm i express
npm i -D @types/express     # Express 4 ships no types of its own`}
      </CodeBlock>

      <CodeBlock language="json" title="tsconfig.json for a modern Node service">
{`{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",          // resolves ESM/CJS the way Node actually does
    "moduleResolution": "NodeNext",
    "types": ["node"],
    "strict": true,
    "erasableSyntaxOnly": true,    // stay runnable via node app.ts
    "noEmit": true                 // if Node runs the .ts directly
  }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="__dirname does not exist in ES modules">
        <p>
          This is the single most common Node + TypeScript papercut, and it has bitten three other
          lessons on this site. <code>__dirname</code> and <code>__filename</code> are CommonJS
          variables. In an ES module they are simply undefined, and the failure is a confusing{' '}
          <code>ReferenceError</code> rather than anything mentioning modules.
        </p>
        <CodeBlock language="typescript" title="The ESM replacements">
{`import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Node 20.11+ / 21.2+ give you these directly:
const here = import.meta.dirname;   // no import needed
const self = import.meta.filename;`}
        </CodeBlock>
      </InfoBox>

      <h2>Typing Express</h2>
      <p>
        Express&apos;s <code>Request</code> is generic. Naming the parameters is what turns{' '}
        <code>req.params</code> and <code>req.body</code> from <code>any</code> into something the
        compiler can check:
      </p>
      <CodeBlock language="typescript" title="Typed handlers">
{`import express, { type Request, type Response, type NextFunction } from 'express';

const app = express();
app.use(express.json());

// Request<Params, ResBody, ReqBody, Query>
app.get('/users/:id', (req: Request<{ id: string }>, res: Response) => {
  req.params.id;   // string — checked
  // req.params.nope;  // compile error
  res.json({ id: req.params.id });
});

app.post('/users', (req: Request<unknown, unknown, { name: string }>, res: Response) => {
  res.status(201).json({ name: req.body.name });
});`}
      </CodeBlock>

      <InfoBox variant="danger" title="req.body is a lie until you validate it">
        <p>
          Typing <code>ReqBody</code> as <code>{'{ name: string }'}</code> does not make it so. That
          body arrived over the network as JSON — it is exactly the untrusted input the previous
          lesson is about. The annotation is an assertion, and a client can send anything.
        </p>
        <p>
          Parse it with a schema at the edge and derive the type from that schema instead of
          declaring it twice. See{' '}
          <strong>Runtime Validation &amp; Schemas</strong> for the pattern — this is the same
          discipline Spring applies with <code>@Valid</code> on a request body, covered in{' '}
          <strong>Spring Boot → Building REST APIs</strong>.
        </p>
      </InfoBox>

      <h2>Adding your own properties to Request</h2>
      <p>
        Auth middleware usually wants to attach <code>req.user</code>. That requires telling
        TypeScript about a property Express never declared — module augmentation, which must reach
        the global Express namespace:
      </p>
      <CodeBlock language="typescript" title="types/express.d.ts">
{`import type { User } from '../models/user.ts';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};   // makes this file a module — without it, declare global is an error`}
      </CodeBlock>
      <InfoBox variant="note" title="Why declare global, and not declare module 'express'">
        <p>
          Reaching for <code>declare module &apos;express&apos;</code> here is the intuitive guess
          and it silently does nothing — the interface you want lives in a global namespace, not in
          the module&apos;s own exports. The <strong>Interfaces, Type Aliases &amp; Classes</strong> lesson
          covers this failure mode in detail; it is worth reading before you spend an afternoon on
          an augmentation that appears to be ignored.
        </p>
      </InfoBox>

      <h2>Error-handling middleware</h2>
      <CodeBlock language="typescript" title="The four-argument signature is load-bearing">
{`// Express identifies error middleware by ARITY — four parameters.
// Drop 'next' and it silently becomes ordinary middleware that never runs.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unknown error';
  res.status(500).json({ error: message });
});`}
      </CodeBlock>
      <p>
        Note <code>err: unknown</code> rather than <code>err: Error</code>. Anything can be thrown
        in JavaScript — including strings and <code>undefined</code> — so <code>unknown</code> plus
        a narrowing check is the honest type. This is the assignability rule from{' '}
        <strong>Type System Fundamentals</strong> doing real work.
      </p>

      <h2>Where this leaves you</h2>
      <InfoBox variant="success" title="Rules of thumb">
        <ul>
          <li>
            <strong>Native execution replaces your bundler, not your compiler.</strong> Keep{' '}
            <code>tsc --noEmit</code> in CI regardless.
          </li>
          <li>
            <strong>Set <code>erasableSyntaxOnly</code></strong> if you intend to run{' '}
            <code>.ts</code> directly. It converts a class of startup failures into build errors.
          </li>
          <li>
            <strong>Prefer <code>as const</code> objects over <code>enum</code></strong> and ES
            modules over namespaces — advice this course gives on other grounds anyway, and it
            happens to keep you strippable.
          </li>
          <li>
            <strong>Validate at the boundary.</strong> Types on <code>req.body</code> are claims,
            not checks.
          </li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
