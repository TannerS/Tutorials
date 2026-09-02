import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function RuntimeValidation() {
  return (
    <LessonLayout
      title="Runtime Validation & Schemas"
      sectionId="typescript"
      lessonIndex={14}
      prev={{ path: '/typescript/native-compiler', label: 'TypeScript 6 → 7: The Native Compiler' }}
      next={{ path: '/typescript/node', label: 'TypeScript on Node' }}
    >
      <p>
        Every other lesson in this section is about the compiler. This one is about the
        moment the compiler <em>stops being present</em>. Types are erased before your code
        runs, so any value arriving from outside your program &mdash; a{' '}
        <code>fetch</code> response, <code>JSON.parse</code>, <code>process.env</code>, a
        form field, a URL param, <code>localStorage</code> &mdash; is completely
        unvalidated at runtime no matter how carefully you typed it.
      </p>
      <p>
        This lesson is the one the rest of the section keeps promising. Several pages point
        at &ldquo;a schema validator such as Zod&rdquo; as the fuller answer; this is that
        answer.
      </p>

      {/* ── Section 1: The hole ───────────────────────────────────── */}
      <h2>1. The Hole: Annotations Are Not Checks</h2>

      <p>
        Here is the single most common way type safety leaks out of an otherwise strict
        codebase. It looks like a declaration. It is an <strong>assertion</strong>.
      </p>

      <CodeBlock language="typescript" title="This compiles. Under strict. With zero errors.">
{`interface User { id: number; name: string; email: string }

async function getUser(id: number): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`);
  const data: User = await res.json();   // ← a LIE the compiler accepts
  return data;
}`}
      </CodeBlock>

      <p>
        The reason is mechanical: <code>Response.json()</code> is typed as returning{' '}
        <code>Promise&lt;any&gt;</code> in the DOM lib. And <code>any</code> is assignable
        to everything, so annotating the result <code>: User</code> asks TypeScript no
        question at all. The same is true of <code>JSON.parse</code>, which is also typed{' '}
        <code>any</code>.
      </p>

      <InfoBox variant="danger" title="Verified, not asserted">
        <p>
          The snippet below was compiled with this repo&rsquo;s TypeScript (6.0.3) under{' '}
          <code>strict</code> to confirm the claim rather than repeat it from memory. The{' '}
          <code>any</code> version produces <strong>no error</strong>; the{' '}
          <code>unknown</code> version errors, which is the whole point.
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="any vs unknown at the boundary">
{`async function a(res: Response) {
  const d = await res.json();          // inferred: any
  return d.whatever.nested as string;  // compiles clean — no such property exists
}

async function b(res: Response) {
  const d: unknown = await res.json();
  return d.whatever;
  //     ~~~~~~~~~ Error: 'd' is of type 'unknown'.
}`}
      </CodeBlock>

      <p>
        So the failure mode is not &ldquo;TypeScript missed a bug&rdquo;. TypeScript never
        promised to catch it. Rename <code>data</code> to <code>results</code> on the
        backend and nothing fails at the boundary &mdash; it fails three components deep as{' '}
        <em>Cannot read properties of undefined</em>, in a file that is not the broken one.
      </p>

      <FlowChart
        title="Where the guarantee ends"
        chart={"graph LR\n  A[Your typed code] -->|compiler checks this| B[Boundary]\n  B -->|types erased here| C[Network / disk / env / user]\n  C -->|arbitrary JSON| B\n  B -->|assertion only| A\n  style C fill:#3b1a1a\n  style B fill:#3d2f14"}
      />

      {/* ── Section 2: Schemas ────────────────────────────────────── */}
      <h2>2. The Fix: A Schema as Single Source of Truth</h2>

      <p>
        The idea matters more than any particular library. A <strong>schema</strong> is a
        runtime value that describes a shape. Because it exists at runtime, it can actually
        check data. And because the library encodes the shape in its types, you can{' '}
        <em>derive</em> the static type from the same declaration.
      </p>
      <p>
        That is the key move: <strong>one declaration, two outputs</strong>. Write the
        shape once, get a validator and a type. The alternative &mdash; an{' '}
        <code>interface</code> next to a hand-written check &mdash; is two things that drift
        apart the first time someone edits one of them.
      </p>

      <FlowChart
        title="One schema, two outputs"
        chart={"graph TD\n  S[Schema — a runtime value] --> V[Validator: checks real data]\n  S --> T[Static type via z.infer]\n  V --> R[Parsed, trusted value]\n  T --> R\n  style S fill:#1a2744\n  style R fill:#1a3329"}
      />

      <InfoBox variant="note" title="Which library, and which version">
        <p>
          The examples use <strong>Zod v4</strong> &mdash; verified against{' '}
          <code>4.5.4</code>, the current <code>latest</code> release on npm. Every API call
          below was re-run directly against it; behavior is identical to the{' '}
          <code>4.4.3</code> copy this repo transitively resolves to (see below), which is
          how the lesson originally shipped.
        </p>
        <p>
          Note that <code>zod</code> is <em>not</em> a direct dependency of this tutorial
          site &mdash; it is present only transitively (via{' '}
          <code>eslint-plugin-react-hooks</code>), currently pinned at <code>4.4.3</code>.
          Nothing here is wired into the app; this is a teaching lesson. To use it in a
          project of your own, <code>npm install zod</code>.
        </p>
        <p>
          <strong>Version matters more than usual here.</strong> Zod&rsquo;s API changed
          meaningfully between v3 and v4 &mdash; string formats moved to top-level
          functions, and error customization changed keyword. Tutorials written for v3 will
          not all copy-paste. Check <code>npm ls zod</code> before trusting any example,
          including this one.
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="Defining a schema — the common shapes">
{`import * as z from 'zod';
// 'import { z } from "zod"' also works in v4 — both were verified.

const UserSchema = z.object({
  id:    z.number().int().positive(),
  name:  z.string().min(1),
  email: z.email(),                    // v4: top-level. v3 was z.string().email()
  role:  z.enum(['admin', 'user']),
  tags:  z.array(z.string()).default([]),
  bio:   z.string().optional(),        // may be absent
  avatar: z.string().nullable(),       // may be null
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="v3 → v4: the change that bites first">
        <p>
          In v3 you wrote <code>z.string().email()</code>, <code>z.string().url()</code>,{' '}
          <code>z.string().uuid()</code>. In v4 these are top-level:{' '}
          <code>z.email()</code>, <code>z.url()</code>, <code>z.uuid()</code>. The old
          method forms are deprecated. If you copy a v3 snippet into a v4 project, this is
          usually the first thing that breaks.
        </p>
      </InfoBox>

      {/* ── Section 3: parse vs safeParse ─────────────────────────── */}
      <h2>3. <code>parse</code> vs <code>safeParse</code></h2>

      <p>
        Two ways to run a schema, and choosing wrongly is the most common design mistake.
      </p>

      <CodeBlock language="typescript" title="parse — throws on failure">
{`const user = UserSchema.parse(raw);
// Returns the parsed value, typed. On failure THROWS a ZodError.
// (Verified: the thrown value is a ZodError and passes 'instanceof z.ZodError'.)`}
      </CodeBlock>

      <CodeBlock language="typescript" title="safeParse — returns a discriminated union">
{`const result = UserSchema.safeParse(raw);

if (result.success) {
  result.data;    // fully typed, narrowed
} else {
  result.error;   // ZodError — narrowed here, not available above
}`}
      </CodeBlock>

      <p>
        <code>safeParse</code> returns a discriminated union on <code>success</code>, so
        the narrowing you get is exactly the discriminated-union narrowing covered in{' '}
        <em>Advanced Types</em>. No exceptions, no <code>try</code>/<code>catch</code>.
      </p>

      <InfoBox variant="tip" title="Which one, when">
        <p>
          <strong>Use <code>safeParse</code></strong> when failure is an expected outcome
          you must render: form submission, user-supplied search params, anything where
          the answer is &ldquo;show the user what&rsquo;s wrong&rdquo;.
        </p>
        <p>
          <strong>Use <code>parse</code></strong> when failure means the program is
          broken and should not continue: env-var validation at startup, or an API contract
          violation you want surfaced loudly to your error tracker. Crashing at boot with{' '}
          <em>PORT must be a number</em> beats booting into undefined behaviour.
        </p>
        <p>
          The rough rule: <code>safeParse</code> for humans, <code>parse</code> for
          programmer errors and startup invariants.
        </p>
      </InfoBox>

      {/* ── Section 4: infer ──────────────────────────────────────── */}
      <h2>4. Infer the Type &mdash; Don&rsquo;t Declare It Twice</h2>

      <p>
        Declaring an <code>interface</code> <em>and</em> a schema means maintaining the
        same shape in two places. They will diverge. Derive instead:
      </p>

      <CodeBlock language="typescript" title="z.infer — the type follows the schema">
{`const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});

type User = z.infer<typeof UserSchema>;
// => { id: number; name: string }

// Add a field to the schema and every consumer of \`User\` updates.
// Delete one, and the compiler shows you every site that assumed it.`}
      </CodeBlock>

      <InfoBox variant="note" title="z.infer is a type, not a value">
        <p>
          <code>z.infer</code> exists only in the type system &mdash; it is not a runtime
          export (checking <code>'infer' in z</code> at runtime returns{' '}
          <code>false</code>, which is expected and correct). Use it in type position
          only, and note that <code>typeof UserSchema</code> is required: you are asking
          for the type <em>of the schema value</em>.
        </p>
      </InfoBox>

      <h3>Input vs output types</h3>
      <p>
        Once a schema has a <code>.default()</code> or a <code>.transform()</code>, the
        type going <em>in</em> differs from the type coming <em>out</em>. Zod exposes both,
        and confusing them is a real source of head-scratching.
      </p>

      <CodeBlock language="typescript" title="z.input vs z.infer (verified with tsc)">
{`const S = z.object({
  id:   z.number(),
  tags: z.array(z.string()).default([]),
  when: z.string().transform(s => new Date(s)),
});

type Out = z.infer<typeof S>;   // { id: number; tags: string[];  when: Date }
type In  = z.input<typeof S>;   // { id: number; tags?: string[]; when: string }

const o: Out = { id: 1, tags: [], when: new Date() };
const i: In  = { id: 1, when: '2026-01-01' };  // tags optional; when is a string`}
      </CodeBlock>

      <p>
        <code>z.infer</code> is an alias for <code>z.output</code>. Reach for{' '}
        <code>z.input</code> when typing the thing you hand <em>to</em> the parser &mdash;
        a form&rsquo;s raw values, for instance.
      </p>

      {/* ── Section 5: boundaries ─────────────────────────────────── */}
      <h2>5. Validating at the Boundary</h2>

      <p>
        The discipline that makes this affordable: <strong>validate once, at the edge,
        then trust internally</strong>. You are not sprinkling checks through your domain
        logic. You are building a wall at the places data enters, and behind that wall the
        static types are honest again.
      </p>

      <h3>API responses</h3>

      <CodeBlock language="typescript" title="A typed fetch wrapper that actually checks">
{`async function fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(\`\${res.status} \${res.statusText} for \${url}\`);

  const raw: unknown = await res.json();  // annotate unknown, NOT your target type
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    // Log the real shape mismatch — this is the message that saves the debugging session
    console.error('Contract violation at', url, z.prettifyError(parsed.error));
    throw new Error(\`Unexpected response shape from \${url}\`);
  }
  return parsed.data;
}

// Call site: the return type is derived, and the value is verified.
const user = await fetchJson('/api/users/1', UserSchema);  // user: User`}
      </CodeBlock>

      <InfoBox variant="tip" title="The one-line habit">
        <p>
          Even without a schema library, annotating boundary values{' '}
          <code>: unknown</code> instead of <code>: User</code> converts a silent runtime
          crash into a compile error you cannot ignore. That is the cheapest possible
          version of this lesson, and it is covered in{' '}
          <em>Type System Fundamentals</em>. Schemas are the same idea with the check
          written for you.
        </p>
      </InfoBox>

      <h3>Environment variables</h3>
      <p>
        <code>process.env</code> is the purest example of the problem: every value is{' '}
        <code>string | undefined</code>, and a missing one usually surfaces as a bizarre
        failure hours later. Validate it at startup with <code>parse</code> so the process
        refuses to boot misconfigured.
      </p>

      <CodeBlock language="typescript" title="env.ts — parse once, export the result">
{`const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT:     z.coerce.number().int().min(1).max(65535),   // "8080" -> 8080
  DEBUG:    z.stringbool(),                              // "true"/"1"/"yes" -> boolean
  DATABASE_URL: z.url(),
});

// Throws loudly at import time if the environment is wrong.
export const env = EnvSchema.parse(process.env);

// env.PORT is number. env.DEBUG is boolean. Verified against zod 4.5.4.`}
      </CodeBlock>

      <p>
        <code>z.coerce.number()</code> applies JavaScript coercion before validating, which
        is what you want for env vars and query strings where everything arrives as text.{' '}
        <code>z.stringbool()</code> is a v4 addition for the specific misery of{' '}
        <code>DEBUG=&quot;false&quot;</code> being truthy.
      </p>

      <h3>Form input</h3>

      <CodeBlock language="typescript" title="Cross-field validation with .refine()">
{`const SignupSchema = z.object({
  email:    z.email(),
  password: z.string().min(12, { error: 'Use at least 12 characters' }),
  confirm:  z.string(),
}).refine(v => v.password === v.confirm, {
  error: 'Passwords must match',
  path: ['confirm'],          // attach the error to the field the user must fix
});`}
      </CodeBlock>

      <p>
        The <code>path</code> option is what makes the message land under the right input
        instead of floating at the top of the form. The issue produced is{' '}
        <code>{'{ code: "custom", path: ["confirm"], message: "Passwords must match" }'}</code>{' '}
        &mdash; verified output.
      </p>

      {/* ── Section 6: refinements & transforms ───────────────────── */}
      <h2>6. Refinements and Transforms</h2>

      <p>
        <code>.refine()</code> adds a check the type system cannot express.{' '}
        <code>.transform()</code> changes the value on the way through. They compose, and{' '}
        <code>.pipe()</code> lets you validate <em>after</em> transforming.
      </p>

      <CodeBlock language="typescript" title="transform, then re-validate">
{`// Trim first, then require non-empty — so "   " is rejected, not silently accepted.
const Trimmed = z.string().transform(s => s.trim()).pipe(z.string().min(1));

Trimmed.safeParse('   hi  ');   // { success: true, data: 'hi' }
Trimmed.safeParse('      ');    // success: false
// Both verified.`}
      </CodeBlock>

      <p>
        Order matters. <code>z.string().min(1).transform(s =&gt; s.trim())</code> would
        accept <code>&quot;&nbsp;&nbsp;&nbsp;&quot;</code>, because the length check runs
        before the trim.
      </p>

      <h3>Unknown keys: the default may surprise you</h3>

      <CodeBlock language="typescript" title="Three strictness modes (all verified)">
{`z.object({ a: z.string() }).parse({ a: 'x', extra: 1 });
// => { a: 'x' }            ← default: unknown keys are STRIPPED, silently

z.strictObject({ a: z.string() }).safeParse({ a: 'x', extra: 1 });
// => success: false, issue: { code: 'unrecognized_keys', keys: ['extra'] }

z.looseObject({ a: z.string() }).parse({ a: 'x', extra: 1 });
// => { a: 'x', extra: 1 }  ← unknown keys preserved`}
      </CodeBlock>

      <InfoBox variant="warning" title="Stripping is usually right, but know it is happening">
        <p>
          The default silently discards fields you did not declare. For API responses that
          is usually what you want &mdash; a backend adding a field should not break your
          client. But it also means a <em>typo in your schema</em> (<code>emial</code>)
          strips the real field and hands you <code>undefined</code>. Use{' '}
          <code>z.strictObject</code> for config files and internal payloads where an
          unexpected key genuinely indicates a mistake.
        </p>
      </InfoBox>

      <h3>Discriminated unions</h3>
      <p>
        The runtime counterpart to the tagged unions from <em>Advanced Types</em>. Zod uses
        the discriminant to pick one branch, which gives far better error messages than a
        plain union trying every option.
      </p>

      <CodeBlock language="typescript" title="Tagged unions, checked at runtime">
{`const Event = z.discriminatedUnion('type', [
  z.object({ type: z.literal('click'), x: z.number(), y: z.number() }),
  z.object({ type: z.literal('key'),   key: z.string() }),
]);

type Event = z.infer<typeof Event>;
// { type: 'click'; x: number; y: number } | { type: 'key'; key: string }`}
      </CodeBlock>

      {/* ── Section 7: errors ─────────────────────────────────────── */}
      <h2>7. Error Handling and Reporting</h2>

      <p>
        A <code>ZodError</code> carries an <code>issues</code> array. Each issue has a{' '}
        <code>path</code>, a <code>code</code>, and a <code>message</code>. Zod v4 ships
        three helpers for turning that into something usable, and picking the right one per
        audience is most of the work.
      </p>

      <CodeBlock language="typescript" title="A failing parse (real output from zod 4.5.4)">
{`const bad = UserSchema.safeParse({ id: -1, name: '', email: 'nope', role: 'ghost' });

bad.success;              // false
bad.error.issues.length;  // 4

bad.error.issues[0];
// {
//   origin: 'number', code: 'too_small', minimum: 0,
//   inclusive: false, path: ['id'],
//   message: 'Too small: expected number to be >0'
// }`}
      </CodeBlock>

      <CodeBlock language="typescript" title="z.prettifyError — for logs and terminals">
{`console.log(z.prettifyError(bad.error));

// ✖ Too small: expected number to be >0
//   → at id
// ✖ Too small: expected string to have >=1 characters
//   → at name
// ✖ Invalid email address
//   → at email
// ✖ Invalid option: expected one of "admin"|"user"
//   → at role`}
      </CodeBlock>

      <CodeBlock language="typescript" title="z.treeifyError — for forms, mirrors your data shape">
{`z.treeifyError(bad.error);
// {
//   errors: [],
//   properties: {
//     id:    { errors: ['Too small: expected number to be >0'] },
//     name:  { errors: ['Too small: expected string to have >=1 characters'] },
//     email: { errors: ['Invalid email address'] },
//     role:  { errors: ['Invalid option: expected one of "admin"|"user"'] }
//   }
// }`}
      </CodeBlock>

      <p>
        Use <code>prettifyError</code> for server logs, <code>treeifyError</code> when
        rendering messages next to nested form fields, and{' '}
        <code>z.flattenError</code> for the flat{' '}
        <code>{'{ formErrors, fieldErrors }'}</code> shape that suits shallow forms.
      </p>

      <InfoBox variant="note" title="v3 → v4: error helpers moved">
        <p>
          In v3 these were methods on the error &mdash; <code>err.format()</code> and{' '}
          <code>err.flatten()</code>. In v4 they are top-level functions:{' '}
          <code>z.treeifyError(err)</code>, <code>z.flattenError(err)</code>,{' '}
          <code>z.prettifyError(err)</code>. Another v3 snippet that will not copy-paste.
        </p>
      </InfoBox>

      <h3>Custom messages</h3>

      <CodeBlock language="typescript" title="v4 uses `error`; `message` still works">
{`z.string({ error: 'Name is required' });
z.string().min(3, { error: 'Too short!' });

// The v3 keyword still functioned in 4.5.4 when tested:
z.string().min(3, { message: 'legacy msg' });   // still produced 'legacy msg'
// but \`error\` is the documented v4 form — prefer it in new code.`}
      </CodeBlock>

      <p>
        Default messages are aimed at developers, not end users. &ldquo;Too small: expected
        string to have &gt;=1 characters&rdquo; is fine in a log and unacceptable in a
        signup form. Write custom messages for anything a user will read.
      </p>

      {/* ── Section 8: Java parallel ──────────────────────────────── */}
      <h2>8. The Same Discipline in Java/Spring</h2>

      <p>
        This is not a JavaScript problem, and if you work across both stacks the parallel
        is worth holding onto. Java erases generics rather than all types, but the boundary
        problem is identical: a JSON body deserialized into a DTO is only <em>shaped</em>{' '}
        like your class &mdash; nothing has checked that <code>email</code> is an email or
        that <code>quantity</code> is positive.
      </p>
      <p>
        Spring&rsquo;s answer is Bean Validation: annotate the DTO with constraints, put{' '}
        <code>@Valid</code> on the controller parameter, and the framework rejects bad
        input before your method body runs. See <em>Spring Boot → REST APIs</em> in this
        site for the full treatment.
      </p>

      <CodeBlock language="java" title="Bean Validation — the same wall, different syntax">
{`public record CreateUserRequest(
    @NotBlank                 String name,
    @Email                    String email,
    @Min(1) @Max(65535)       int    port
) {}

@PostMapping("/users")
public ResponseEntity<User> create(@Valid @RequestBody CreateUserRequest req) {
    // If we reach this line, req is verified — not merely typed.
    return ResponseEntity.ok(service.create(req));
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Same idea, two ecosystems">
        <p>
          Zod builds the schema as a value and derives the type from it. Bean Validation
          starts from the type and attaches constraints as annotations. Opposite
          directions, one principle: <strong>validate at the boundary, then trust
          internally.</strong> If you can articulate that in an interview, you have said
          something more useful than naming either library.
        </p>
      </InfoBox>

      {/* ── Section 9: trade-offs ─────────────────────────────────── */}
      <h2>9. Honest Trade-offs</h2>

      <h3>Bundle cost</h3>
      <p>
        Zod is real code shipped to the browser &mdash; it is not erased like a type. That
        cost is trivial on a server and worth thinking about on a client, particularly if
        you are validating one small form. Zod v4 ships a <code>zod/mini</code> entry point
        (confirmed present in the package&rsquo;s <code>exports</code>) offering a
        function-based, more tree-shakeable API for exactly this reason.
      </p>
      <p>
        I have deliberately not quoted a kilobyte figure here. Bundle size depends on your
        version, bundler, and which parts you import; measure your own build rather than
        trusting a number from a blog post.
      </p>

      <h3>Don&rsquo;t validate everything</h3>
      <p>
        The failure mode of enthusiasm is parsing the same object at every layer. Validate
        where data <em>enters</em>: HTTP responses, request bodies, env, storage, message
        queues, third-party SDK callbacks. Data flowing between your own already-validated
        functions needs no re-checking &mdash; that is what the static types are for.
      </p>

      <h3>Alternatives, and a standard</h3>
      <p>
        Zod is the most widely used, not the only option. <strong>Valibot</strong> is
        designed around modular imports for smaller bundles;{' '}
        <strong>ArkType</strong> parses TypeScript-like syntax; <strong>typia</strong>{' '}
        takes a different route entirely, generating validators at build time from your
        existing types via a transformer, which trades tooling complexity for near-zero
        runtime overhead.
      </p>
      <p>
        <strong>Standard Schema</strong> is a shared interface these libraries have been
        adopting so that consuming tools &mdash; form libraries, routers, tRPC-style RPC
        layers &mdash; can accept any of them rather than hard-coding one. If you are
        writing a library that takes a schema, target that interface instead of a specific
        vendor. I have not pinned its adoption status per library here; check each
        library&rsquo;s current docs, as this space is moving.
      </p>

      <InfoBox variant="question" title="The interview answer">
        <p>
          If asked &ldquo;is TypeScript type-safe?&rdquo;, the strong answer is: it is
          sound about values it can see, and says nothing about values it cannot. Anything
          crossing a process boundary needs a runtime check. Naming Zod is fine; explaining{' '}
          <em>why</em> a compile-time-only type system structurally cannot cover the
          boundary is what actually lands.
        </p>
      </InfoBox>

      <h2>Recap</h2>
      <ul>
        <li>Types are erased; every value from outside the program is unchecked at runtime.</li>
        <li><code>res.json()</code> and <code>JSON.parse</code> return <code>any</code>, so annotating them is an assertion, not a check &mdash; verified with tsc, not assumed.</li>
        <li>A schema is one declaration that yields both a runtime validator and a static type via <code>z.infer</code>. Never write the shape twice.</li>
        <li><code>safeParse</code> for expected failures you render; <code>parse</code> for invariants that should crash.</li>
        <li>Validate at the edge &mdash; API responses, env, forms, storage &mdash; then trust internally.</li>
        <li>Zod v4 moved string formats to top level (<code>z.email()</code>) and error helpers to top-level functions (<code>z.prettifyError</code>). v3 snippets will not all copy-paste.</li>
        <li>Objects strip unknown keys by default; use <code>z.strictObject</code> when an unexpected key is a bug.</li>
        <li>Same discipline as Spring&rsquo;s <code>@Valid</code> + Bean Validation, from the opposite direction.</li>
      </ul>
    </LessonLayout>
  );
}
