import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ReactJsx() {
  return (
    <LessonLayout
      title="What JSX Really Is"
      sectionId="react18"
      lessonIndex={0}
      prev={null}
      next={{ path: '/react18/lifecycle', label: 'Component Lifecycle' }}
    >
      <p>
        JSX is not HTML, it is not a template language, and the browser never sees it.
        It is <strong>syntax sugar for one function call</strong>, and once you have read
        the compiled output, a whole set of React&apos;s rules stop being arbitrary —
        why components must be capitalised, why <code>key</code> is not a prop, why{' '}
        <code>&&</code> renders <code>0</code>, why you cannot put an <code>if</code> in
        the middle of a return.
      </p>
      <p>
        Every compiled snippet below is real <code>esbuild</code> output, and every
        runtime value was read off React 19.2.6.
      </p>

      <h2>The Source, and What It Becomes</h2>
      <CodeBlock language="jsx" title="demo.jsx — the input">
{`export const App = ({ user, items }) => (
  <div className="card" data-id={user.id}>
    <h1>{user.name}</h1>
    {items.length > 0 && <ul>{items.map(i => <li key={i.id}>{i.text}</li>)}</ul>}
    <Button onClick={() => save(user)} disabled>Save</Button>
    <><span>fragment child</span></>
  </div>
);`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Real output — esbuild --jsx=automatic (what Vite does)">
{`import { Fragment, jsx, jsxs } from "react/jsx-runtime";

const App = ({ user, items }) => jsxs("div", { className: "card", "data-id": user.id, children: [
  jsx("h1", { children: user.name }),
  items.length > 0 && jsx("ul", { children: items.map((i) => jsx("li", { children: i.text }, i.id)) }),
  jsx(Button, { onClick: () => save(user), disabled: true, children: "Save" }),
  jsx(Fragment, { children: jsx("span", { children: "fragment child" }) })
] });`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Real output — esbuild --jsx=transform (the classic runtime)">
{`const App = ({ user, items }) => React.createElement("div", { className: "card", "data-id": user.id },
  React.createElement("h1", null, user.name),
  items.length > 0 && React.createElement("ul", null, items.map((i) => React.createElement("li", { key: i.id }, i.text))),
  React.createElement(Button, { onClick: () => save(user), disabled: true }, "Save"),
  React.createElement(React.Fragment, null, React.createElement("span", null, "fragment child")));`}
      </CodeBlock>

      <p>Read those two and nine of React&apos;s rules fall out immediately.</p>

      <h2>1. Capitalisation Decides Everything</h2>
      <CodeBlock language="javascript" title="Look at the first argument">
{`<div>    ->  jsx("div", …)      a STRING — the DOM tag name
<Button> ->  jsx(Button, …)     an IDENTIFIER — your variable`}
      </CodeBlock>
      <p>
        That is the entire rule. A lowercase name compiles to a <em>string</em>, so{' '}
        <code>&lt;button&gt;</code> is the HTML element. A capitalised name compiles to a{' '}
        <em>variable reference</em>, so <code>&lt;Button&gt;</code> is whatever{' '}
        <code>Button</code> is in scope. Write <code>&lt;button&gt;</code> expecting your
        component and React renders a real <code>&lt;button&gt;</code>; forget the import
        and you get <code>Button is not defined</code>, because it is a plain variable
        lookup.
      </p>

      <h2>2. Props Are Just an Object Literal</h2>
      <CodeBlock language="javascript" title="…which explains the attribute naming">
{`className="card"      ->  { className: "card" }
data-id={user.id}     ->  { "data-id": user.id }     <- quoted: not a
                                                        valid identifier
disabled              ->  { disabled: true }         <- bare = true
onClick={fn}          ->  { onClick: fn }
{...rest}             ->  { ...rest }                <- object spread

// So "why className and not class?" — because it is a JS object key,
// and class is a reserved word. Same for htmlFor instead of for.
// And data-* / aria-* keep their hyphens because they are quoted
// strings, not identifiers.`}
      </CodeBlock>

      <h2>3. <code>children</code> Is a Prop</h2>
      <p>
        In the automatic runtime it is literally a key in the props object. In the classic
        runtime it is the third-and-beyond argument, which{' '}
        <code>createElement</code> collects into the same prop. Either way:
      </p>
      <CodeBlock language="javascript" title="These are identical">
{`<Button>Save</Button>
<Button children="Save" />

// Which is why a component can do either of these:
function Card({ children }) { return <div className="card">{children}</div>; }
function Card(props)        { return <div className="card">{props.children}</div>; }`}
      </CodeBlock>

      <InfoBox variant="note" title="jsx vs jsxs — the plural one">
        <p style={{ marginBottom: 0 }}>
          Notice the compiler emitted <code>jsxs</code> (with an <em>s</em>) for the{' '}
          <code>&lt;div&gt;</code> and <code>jsx</code> for everything else.{' '}
          <code>jsxs</code> is the variant for <strong>static multiple children</strong> —
          it tells React the children array is a fixed-length literal, so React can skip
          the key-warning scan it has to run on a dynamically-built array. A compiler
          optimisation, nothing you ever call yourself, but worth recognising in a stack
          trace.
        </p>
      </InfoBox>

      <h2>4. A React Element Is a Plain Object</h2>
      <CodeBlock language="text" title="Real output — React 19.2.6, inspecting what jsx() returns">
{`jsx("div", { className: "card", children: "hi" })

{
  "type": "div",
  "key": null,
  "props": { "className": "card", "children": "hi" },
  "_owner": null,
  "_store": {}
}

$$typeof   ->  Symbol(react.transitional.element)
frozen?    ->  true   (in development)`}
      </CodeBlock>
      <p>
        No DOM nodes, no rendering, no side effects. Calling a component function returns
        a <strong>description</strong> of what should exist, and React compares that
        description to the previous one to decide what to change. That is what &quot;the
        virtual DOM&quot; means, concretely: these objects.
      </p>
      <p>
        The <code>$$typeof</code> symbol is a security feature. Because a{' '}
        <code>Symbol</code> cannot survive <code>JSON.parse</code>, a JSON payload from a
        server can never masquerade as a React element, which closes off an XSS vector
        where user data gets rendered as markup.
      </p>

      <InfoBox variant="danger" title="5. key is NOT a prop — and now you can see why">
        <p>
          In the compiled output, <code>key</code> is the <strong>third argument</strong>{' '}
          to <code>jsx()</code>, sitting outside the props object entirely:
        </p>
        <CodeBlock language="javascript" title="Where key goes">
{`<li key={i.id}>{i.text}</li>

// automatic runtime:
jsx("li", { children: i.text }, i.id)
//         ^^^^^^^^^^^^^^^^^^^  ^^^^
//         props                key — a SEPARATE parameter`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — what the element actually holds">
{`el.key                      ->  "k1"
el.props                    ->  { children: "x" }
Object.keys(el.props)       ->  ["children"]

// There IS a props.key, but look at what it is:
descriptor for props.key    ->  { get: function, enumerable: false }
el.props.key                ->  undefined
                            +  console warning:
   "key is not a prop. Trying to access it will result in undefined
    being returned."`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          So <code>props.key</code> is a non-enumerable getter React installs purely to
          warn you. If a child needs the id, pass it twice:{' '}
          <code>&lt;Row key=&#123;id&#125; id=&#123;id&#125; /&gt;</code>. The same is
          true of <code>ref</code> in the classic runtime.
        </p>
      </InfoBox>

      <h2>6. Why You Cannot Put an <code>if</code> in JSX</h2>
      <p>
        Everything inside <code>&#123;…&#125;</code> becomes an <strong>argument to a
        function call</strong>. Arguments are expressions, and <code>if</code> is a{' '}
        statement — there is nowhere for it to go. That is the whole reason, and it is
        syntactic rather than philosophical.
      </p>
      <CodeBlock language="javascript" title="Which is why these are the only options">
{`{cond && <A />}                 // logical AND
{cond ? <A /> : <B />}          // ternary
{items.map(…)}                  // a method call returning an array
{(() => { if (x) return <A />; })()}   // an IIFE, if you must

// …and why extracting to a variable above the return works fine:
let body;
if (loading) body = <Spinner />;
else if (error) body = <Error />;
else body = <List items={items} />;
return <div>{body}</div>;`}
      </CodeBlock>

      <InfoBox variant="warning" title="7. The && trap, explained by the compiled output">
        <p>
          <code>&&</code> returns its <em>left</em> operand when that operand is falsy —
          it is plain JavaScript, not a React construct. And React renders{' '}
          <code>0</code> as the text &quot;0&quot;, while it renders{' '}
          <code>false</code>, <code>null</code> and <code>undefined</code> as nothing.
        </p>
        <CodeBlock language="jsx" title="The classic bug">
{`{items.length && <List />}      // items.length === 0  ->  renders "0"
{items.length > 0 && <List />}  // false  ->  renders nothing  ✓
{!!items.length && <List />}    // also fine
{items.length ? <List /> : null}// also fine`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          A stray <code>0</code> in your UI is almost always this.
        </p>
      </InfoBox>

      <h2>8. Fragments Are a Real Component</h2>
      <CodeBlock language="javascript" title="The empty tag is not magic">
{`<><span>x</span></>
  ->  jsx(Fragment, { children: jsx("span", { children: "x" }) })

// Fragment is an import, like any other component. So:
//   - a fragment emits NO DOM node (that is its whole job)
//   - which is why it is safe inside <tbody> or <ul>, where a <div>
//     would be invalid markup and get hoisted out by the parser
//     (see: How the Browser Parses & Repairs HTML)
//   - and why a KEYED fragment needs the long form:
//       <React.Fragment key={id}>…</React.Fragment>
//     because <> </> has no syntax for attributes.`}
      </CodeBlock>

      <h2>9. You No Longer Import React — Here Is Why</h2>
      <FlowChart
        title="The two JSX runtimes"
        chart={"graph TD\n  A[\"your .jsx / .tsx file\"] --> B{\"which runtime?\"}\n  B -->|\"classic\\n(React 16 and earlier)\"| C[\"React.createElement(…)\"]\n  C --> D[\"React must be IN SCOPE.\\nHence the mandatory\\nimport React from 'react'\"]\n  B -->|\"automatic\\n(React 17+, the default now)\"| E[\"jsx / jsxs / Fragment\"]\n  E --> F[\"the compiler INSERTS\\nimport … from 'react/jsx-runtime'\\nfor you\"]\n  F --> G[\"no React import needed.\\nImport React only for\\nuseState, memo, etc.\"]\n  style D fill:#3d2f14,stroke:#d97706\n  style G fill:#1a3329,stroke:#4ade80"}
      />
      <p>
        That is also why the old error{' '}
        <em>&quot;React must be in scope when using JSX&quot;</em> has disappeared: with
        the automatic runtime the import is generated, and it points at{' '}
        <code>react/jsx-runtime</code> rather than <code>react</code>. You still import
        React (or named exports from it) for hooks and <code>memo</code> — just not for
        JSX itself.
      </p>

      <InfoBox variant="success" title="See it for yourself">
        <p style={{ marginBottom: 0 }}>
          This site has a live tool for exactly this:{' '}
          <a href="/playground/jsx-compiler">JSX Compiler Comparison</a> compiles JSX you
          type under both runtimes side by side. There is a companion for the language
          itself —{' '}
          <a href="/playground/compiler">JS/TS Compiler Comparison</a> — which shows the
          same source downlevelled to every ECMAScript target from ES2015 to ES2024, so
          you can watch what <code>async</code>, optional chaining and class fields turn
          into.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="One thing JSX is not">
        <p style={{ marginBottom: 0 }}>
          JSX is not React-specific. It is a syntax extension with a configurable
          transform — Preact, Solid, Vue and Hono all use it with different targets, and
          the <code>jsxImportSource</code> pragma chooses which. React is the reason it
          exists, not the limit of where it works.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
