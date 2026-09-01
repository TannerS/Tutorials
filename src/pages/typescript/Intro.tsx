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
        Running <code>npx tsc --init</code> generates a <code>tsconfig.json</code> in your
        project root &mdash; the single source of truth for how TypeScript compiles your
        code. On TypeScript 5.9+ (what this course runs), that command writes a short,
        opinionated file with strict checking already turned on, not the sprawling,
        every-option-commented-out file older tutorials show. You do not need to understand
        everything in it today: <strong>tsconfig Mastery</strong>, later in this course, is
        the dedicated option-by-option reference, including copy-paste-ready production
        configs for both React and Node.js projects. For now, the three commands above are
        enough to get a project type-checking.
      </p>

      {/* 5. How TS Compilation Works */}
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

      {/* 6. TypeScript Playground */}
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

      {/* 7. Interactive Challenges */}
      <h2>Knowledge Check</h2>

      <InteractiveChallenge
        question={"A tsconfig.json flips one option and suddenly every unannotated parameter and every possibly-null value becomes an error. Which option is the most likely single cause?"}
        options={[
          '"noImplicitAny": true',
          '"strict": true',
          '"checkAll": true',
          '"skipLibCheck": true',
        ]}
        correctIndex={1}
        explanation={
          '"strict": true is a master switch that turns on a whole family of stricter checks ' +
          'at once — noImplicitAny (bans silent any) and strictNullChecks (bans treating null ' +
          'and undefined as assignable to everything) are the two you will hit constantly, and ' +
          'together they explain the symptom in the question. TypeScript 6 already turns strict ' +
          'on by default, but writing the line out documents intent for anyone reading the ' +
          'config. See tsconfig Mastery, later in this course, for the complete list of what ' +
          'strict enables and why alwaysStrict is no longer counted among them.'
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
