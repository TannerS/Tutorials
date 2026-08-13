import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import JsCompilerPlayground from '../../components/JsCompilerPlayground';
import LessonLayout from '../../components/LessonLayout';

export default function CompilerComparison() {
  return (
    <LessonLayout
      title="🧪 JS/TS Compiler Comparison"
      sectionId="playground"
      lessonIndex={0}
      prev={null}
      next={{ path: '/playground/type-checker', label: 'TypeScript Type Checker' }}
    >
      <p>
        Pick an example — or type your own — and choose a target ECMAScript
        version. You&apos;ll see exactly what TypeScript&apos;s compiler emits
        for that year, live. This works for plain JavaScript too: you never
        have to add a single type annotation.
      </p>

      <h2>Why does JS need to be &quot;compiled&quot; at all?</h2>
      <p>
        It doesn&apos;t, strictly — every JS engine (V8, SpiderMonkey, JavaScriptCore)
        parses and runs source text directly, with no separate compile step required
        from you. The problem isn&apos;t <em>execution</em>, it&apos;s <em>parsing</em>.
        If you write <code>a?.b</code> and the engine reading your file predates optional
        chaining, its parser throws a <code>SyntaxError</code> before a single line
        runs — it can&apos;t even read the file. This process — rewriting newer syntax
        into older, equivalent syntax so every target parser can read it — is called{' '}
        <strong>downleveling</strong> (the term TypeScript&apos;s own compiler uses
        internally), a specific case of the more general term <strong>transpiling</strong>.
      </p>

      <InfoBox variant="warning" title="Downleveling ≠ polyfilling">
        <p>
          This tool demonstrates <strong>syntax</strong> downleveling — arrow functions
          becoming <code>function</code> expressions, <code>class</code> becoming
          constructor functions, <code>??</code> becoming a ternary check, and so on.
          It does <strong>not</strong> polyfill missing runtime APIs. If you target ES5
          but call <code>Array.prototype.flat()</code>, the compiler emits{' '}
          <code>.flat()</code> as-is — it has no way to add a method to an engine that
          lacks it. That&apos;s a different problem, solved by a separate library
          (like <code>core-js</code>), not by the compiler&apos;s target setting.
        </p>
      </InfoBox>

      <h2>Playground</h2>
      <InfoBox variant="question" title="Three experiments worth running">
        <p>
          Don&apos;t just skim the widget — the point isn&apos;t that output changes,
          it&apos;s <em>where</em> it changes and how violently. Run these three in order:
        </p>
        <ol>
          <li>
            <strong>Find the cliff edge.</strong> Load <em>Optional Chaining &amp; Nullish
            Coalescing</em> and set the target to <strong>ES2020</strong> — the output is your
            source, untouched. Now step down one single year to <strong>ES2019</strong>. That
            same one-line function becomes a nest of <code>_a</code>/<code>_b</code> temporaries
            and <code>!== void 0</code> checks. Nothing gradual happened: one year either side of a
            feature&apos;s standardisation is the difference between free and expensive.
          </li>
          <li>
            <strong>Watch a feature get re-implemented, not just rewritten.</strong> Load{' '}
            <em>Async/Await</em> at <strong>ES2017</strong> (native — <code>async</code> and{' '}
            <code>await</code> survive verbatim), then drop to <strong>ES5</strong>. You get
            ~40 lines of injected <code>__awaiter</code>/<code>__generator</code> helpers and your
            function body turned inside out into a <code>switch</code>-based state machine. Notice
            your logic is no longer readable in the output — that is what a source map is for, and
            why debugging without one is miserable.
          </li>
          <li>
            <strong>Confirm types are erased, not compiled.</strong> Load <em>Type Annotations</em>{' '}
            and set the target to <strong>ESNext</strong> — the highest target, so nothing gets
            downleveled at all. The <code>interface User</code> block does not appear in the output
            in any form; it isn&apos;t converted to a runtime check, it&apos;s simply deleted along
            with every <code>: User</code> annotation. This is the single most useful fact about
            TypeScript: <strong>no type you write survives to runtime</strong>, which is why
            validating untrusted JSON needs an actual runtime validator, not an{' '}
            <code>interface</code>.
          </li>
        </ol>
      </InfoBox>
      <JsCompilerPlayground />

      <h2>A quick example</h2>
      <p>
        Same source, targeting ES2022 versus ES5 — notice the arrow function, template
        literal, class, and private field all survive untouched at ES2022 (all four are
        native syntax by then), but every one of them gets rewritten at ES5:
      </p>
      <CodeBlock language="javascript" title="Source">
{`const greet = (name) => \`Hi, \${name ?? "friend"}!\`;

class Counter {
  #count = 0;
  increment() { return ++this.#count; }
}`}
      </CodeBlock>
      <CodeBlock language="javascript" title="Target: ES5 (real compiler output, helper bodies elided)">
{`"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (...) { /* ... */ };
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (...) { /* ... */ };
var _Counter_count;
var greet = function (name) { return "Hi, ".concat(name !== null && name !== void 0 ? name : "friend", "!"); };
var Counter = /** @class */ (function () {
    function Counter() {
        _Counter_count.set(this, 0);
    }
    Counter.prototype.increment = function () { var _a; return __classPrivateFieldSet(this, _Counter_count, (_a = __classPrivateFieldGet(this, _Counter_count, "f"), ++_a), "f"); };
    return Counter;
}());
_Counter_count = new WeakMap();`}
      </CodeBlock>

      <p>
        The only thing edited above is the bodies of the two{' '}
        <code>__classPrivateField*</code> helpers, which are ~8 lines each of
        type-checking boilerplate. Everything else is byte-for-byte what the
        compiler emits — run it in the playground and compare.
      </p>

      <InfoBox variant="tip" title="What actually changed">
        <ul>
          <li>Arrow function → a <code>function</code> expression (ES5 has no arrow functions)</li>
          <li>Template literal → <code>.concat()</code> string building (no backtick syntax in ES5)</li>
          <li><code>??</code> → an explicit <code>!== null &amp;&amp; !== undefined</code> check (nullish coalescing is ES2020+)</li>
          <li><code>class</code> → an IIFE returning a constructor function with prototype methods (ES5 has no <code>class</code> keyword)</li>
          <li>
            <code>#count</code> → emulated with a <code>WeakMap</code> keyed on the
            instance, plus injected <code>__classPrivateFieldGet/Set</code> helpers that
            throw the same <code>TypeError</code> real private fields would if you
            access them on the wrong object (real private fields are ES2022+)
          </li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
