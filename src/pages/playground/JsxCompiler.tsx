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
{`function Greeting({ name }) {
    return React.createElement("h1", { className: "title" }, "Hello, ", name, "!");
}`}
      </CodeBlock>
      <CodeBlock language="javascript" title="Classic runtime, target: ES5">
{`function Greeting(_a) {
    var name = _a.name;
    return React.createElement("h1", { className: "title" }, "Hello, ", name, "!");
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The JSX transform and the year target are independent">
        <p>
          The JSX runtime (classic vs. automatic) and the ES target (which year&apos;s
          syntax you get) are two separate compiler settings that both apply to the same
          file. JSX always gets turned into function calls, on every target — that part
          never changes. What the target controls is everything <em>around</em> the JSX:
          whether <code>{'{ name }'}</code> stays a destructured parameter or becomes a{' '}
          <code>var _a = arguments[0]</code>-style unpack, whether arrow functions survive
          or become <code>function</code> expressions, and so on.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
