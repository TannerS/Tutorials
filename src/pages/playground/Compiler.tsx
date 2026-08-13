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
    Counter.prototype.increment = function () {
        var _a;
        return __classPrivateFieldSet(this, _Counter_count, (_a = __classPrivateFieldGet(this, _Counter_count, "f"), ++_a), "f");
    };
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
