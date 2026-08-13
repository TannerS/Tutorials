import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import JsxCompilerPlayground from '../../components/JsxCompilerPlayground';
import LessonLayout from '../../components/LessonLayout';

export default function JsxCompilerLesson() {
  return (
    <LessonLayout
      title="⚛️ JSX Compiler Comparison"
      sectionId="playground"
      lessonIndex={2}
      prev={{ path: '/playground/type-checker', label: 'TypeScript Type Checker' }}
      next={{ path: '/playground/css-playground', label: 'CSS Playground' }}
    >
      <p>
        JSX isn&apos;t JavaScript — browsers have never executed{' '}
        <code>{'<h1>Hi</h1>'}</code> directly. It gets compiled into plain
        function calls before it ever reaches a browser. This tool shows you
        both axes at once: <strong>which JSX runtime</strong> your JSX compiles
        to, and <strong>which ECMAScript year</strong> the surrounding
        JavaScript gets downleveled to.
      </p>

      <h2>Two JSX runtimes</h2>
      <p>
        TypeScript (and Babel) can compile JSX two different ways:
      </p>
      <InfoBox variant="note" title="Classic vs. Automatic">
        <p>
          <strong>Classic</strong> (pre-React 17) compiles{' '}
          <code>{'<h1>Hi</h1>'}</code> to <code>React.createElement("h1", null, "Hi")</code>{' '}
          — every file using JSX needed <code>import React from &quot;react&quot;</code> in
          scope, even if you never wrote <code>React.</code> anywhere yourself, purely
          so that generated call had something to reference.
        </p>
        <p>
          <strong>Automatic</strong> (React 17+, the default this whole site is built with)
          compiles the same JSX to <code>_jsx("h1", {'{'} children: "Hi" {'}'})</code>,
          with the compiler auto-inserting <code>import {'{'} jsx as _jsx {'}'} from
          "react/jsx-runtime"</code> for you — the &quot;you don&apos;t need to import
          React just to use JSX&quot; change you may have noticed in newer React docs.
        </p>
      </InfoBox>

      <h2>Playground</h2>
      <InfoBox variant="question" title="Three experiments worth running">
        <p>
          The widget starts on <strong>Automatic</strong> at <strong>ES2022</strong>. Each of
          these explains a React rule you have probably followed without knowing why:
        </p>
        <ol>
          <li>
            <strong>Why <code>key</code> is not a prop.</strong> Load <em>List Rendering</em>.
            Every attribute you write lands inside the props object — except one. The output is{' '}
            <code>{'_jsx("li", { children: user.name }, user.id)'}</code>: <code>key</code> is
            passed as a <em>third argument</em>, entirely outside props. That is the mechanical
            reason <code>props.key</code> is always <code>undefined</code> inside your component,
            and why React can read a key before it ever renders the element.
          </li>
          <li>
            <strong>Why <code>{'{count && <p/>}'}</code> renders a stray 0.</strong> Load{' '}
            <em>Conditional Rendering</em>. Your <code>{'isOnline && <p>…</p>'}</code> compiles to
            plain JavaScript <code>&amp;&amp;</code> — the compiler adds no truthiness helper
            whatsoever. So <code>&amp;&amp;</code> keeps its normal JS semantics and returns the{' '}
            <em>left</em> operand when it is falsy. With <code>0</code> on the left, React receives
            the number <code>0</code> as a child and dutifully renders it. Hence{' '}
            <code>{'count > 0 && …'}</code> rather than <code>{'count && …'}</code>.
          </li>
          <li>
            <strong>Watch the import list rewrite itself.</strong> Keep an eye on line 1 as you
            switch snippets. <em>Basic Component</em> imports only <code>jsxs</code>;{' '}
            <em>List Rendering</em> only <code>jsx</code> (singular — one child);{' '}
            <em>Fragments</em> pulls in <code>jsx</code>, <code>jsxs</code> <em>and</em>{' '}
            <code>Fragment</code>. The compiler imports exactly what each file uses, which is why{' '}
            <code>{'<>…</>'}</code> works without you importing anything. Now flip the runtime to{' '}
            <strong>Classic</strong>: the import vanishes and every call becomes{' '}
            <code>React.createElement</code> — with <em>no</em> <code>import React</code> added for
            you. That missing import is precisely the{' '}
            <code>&quot;React is not defined&quot;</code> error that made pre-17 codebases put{' '}
            <code>import React from &quot;react&quot;</code> at the top of every single file.
          </li>
        </ol>
      </InfoBox>
      <JsxCompilerPlayground />

      <h2>A quick example</h2>
      <p>
        The same component, classic runtime, at two different targets. Notice the JSX
        transform to <code>React.createElement</code> happens either way — what changes
        with the target is the destructured parameter:
      </p>
      <CodeBlock language="jsx" title="Source">
{`function Greeting({ name }) {
  return <h1 className="title">Hello, {name}!</h1>;
}`}
      </CodeBlock>
      <CodeBlock language="javascript" title="Classic runtime, target: ES2022">
{`"use strict";
function Greeting({ name }) {
    return React.createElement("h1", { className: "title" },
        "Hello, ",
        name,
        "!");
}`}
      </CodeBlock>
      <CodeBlock language="javascript" title="Classic runtime, target: ES5">
{`"use strict";
function Greeting(_a) {
    var name = _a.name;
    return React.createElement("h1", { className: "title" },
        "Hello, ",
        name,
        "!");
}`}
      </CodeBlock>
      <p>
        Switch the runtime to <strong>automatic</strong> and the same source becomes a{' '}
        <code>_jsxs</code> call instead — <code>jsxs</code> (&quot;s&quot; for static
        children) is the variant the compiler picks when an element has more than one
        child, and children move <em>inside</em> the props object rather than trailing
        after it:
      </p>
      <CodeBlock language="javascript" title="Automatic runtime, target: ES2022">
{`import { jsxs as _jsxs } from "react/jsx-runtime";
function Greeting({ name }) {
    return _jsxs("h1", { className: "title", children: ["Hello, ", name, "!"] });
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The JSX transform and the year target are independent">
        <p>
          The JSX runtime (classic vs. automatic) and the ES target (which year&apos;s
          syntax you get) are two separate compiler settings that both apply to the same
          file. JSX always gets turned into function calls, on every target — that part
          never changes. What the target controls is everything <em>around</em> the JSX:
          whether <code>{'{ name }'}</code> stays a destructured parameter or gets
          renamed to a placeholder parameter and unpacked on the next line (
          <code>function Greeting(_a) {'{'} var name = _a.name; ... {'}'}</code>, since
          ES5 has no destructuring), whether arrow functions survive or become{' '}
          <code>function</code> expressions, and so on.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
