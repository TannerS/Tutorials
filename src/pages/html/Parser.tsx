import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function HtmlParser() {
  return (
    <LessonLayout
      title="How the Browser Parses & Repairs HTML"
      sectionId="html"
      lessonIndex={5}
      prev={{ path: '/html/media', label: 'Images, Media & Responsive Assets' }}
      next={{ path: '/html/field-guide', label: 'HTML Field Guide' }}
    >
      <p>
        HTML has no syntax errors. Hand a browser the worst markup you can write and it
        will not refuse it — the spec requires it to <strong>repair</strong> the input and
        produce <em>some</em> DOM. That is why HTML feels forgiving, and it is also the
        single best explanation for a class of React bug that otherwise looks like
        witchcraft.
      </p>
      <p>
        This is the most useful lesson in the section for a React developer. Every output
        below is from Chromium 149.
      </p>

      <h2>The DOM You Get Is Not Always the HTML You Wrote</h2>
      <p>
        Six real repairs. In each case the markup is something a person would plausibly
        write, and the resulting DOM is not what they wrote:
      </p>

      <CodeBlock language="text" title="Real output — innerHTML read back after parsing, Chromium 149">
{`1. A block element inside a paragraph
   wrote:  <p><div>x</div></p>
   got:    <p></p><div>x</div><p></p>
   // <p> can only contain inline content, so the <div> CLOSES it. The
   // stray </p> then opens and closes a second empty paragraph.
   // You asked for 1 element and got 3.

2. Anything that is not a row inside a table
   wrote:  <table><div>oops</div><tr><td>c</td></tr></table>
   got:    <div>oops</div><table><tbody><tr><td>c</td></tr></tbody></table>
   // The <div> is HOISTED OUT, to BEFORE the table. It does not stay put.

3. The implicit tbody
   wrote:  <table><tr><td>c</td></tr></table>
   got:    table.firstElementChild.tagName === "TBODY"
   // You never wrote a tbody. There is one now, always.

4. A link inside a link
   wrote:  <a href="/x"><a href="/y">y</a></a>
   got:    2 sibling <a> elements, not nested
   // <a> cannot nest, so the second one closes the first.

5. Unclosed list items
   wrote:  <ul><li>a<li>b</ul>
   got:    2 children
   // <li> auto-closes the previous <li>. This one is legal and fine.

6. A form inside a table
   wrote:  <table><form><tr><td>x</td></tr></form></table>
   got:    form.parentElement.tagName === "TABLE"
   // The form stays but the rows move out from under it, so the inputs
   // are no longer inside the form. This is why "my table form submits
   // nothing" happens.`}
      </CodeBlock>

      <FlowChart
        title="Why repair happens at all"
        chart={"graph TD\n  A[\"your markup\"] --> B[\"tokenizer\"]\n  B --> C[\"tree construction\"]\n  C --> D{\"is this element allowed here?\"}\n  D -->|yes| E[\"insert it\"]\n  D -->|\"no — and there is a rule\"| F[\"close, hoist, or wrap\\nsilently\"]\n  F --> E\n  E --> G[\"the DOM\"]\n  H[\"no error is ever reported\"] --> G\n  style F fill:#3d2f14,stroke:#d97706\n  style H fill:#3b1a1a,stroke:#f87171"}
      />

      <InfoBox variant="danger" title="This is where React hydration mismatches come from">
        <p>
          A hydration mismatch means the server-rendered HTML and the client-rendered tree
          disagree. The most confusing instance of that has nothing to do with your data
          being different — it is this lesson:
        </p>
        <p>
          React renders <code>&lt;p&gt;&lt;div&gt;x&lt;/div&gt;&lt;/p&gt;</code> to a
          string on the server. The browser parses that string and <em>repairs</em> it
          into three sibling elements. React then hydrates, walks the DOM expecting the
          tree it rendered, and finds a different shape. The error says the markup did not
          match — and nothing in your component is random or environment-dependent.
        </p>
        <p style={{ marginBottom: 0 }}>
          The practical rule: <strong>a hydration mismatch with no obvious cause is often
          invalid nesting.</strong> Check for a block element inside{' '}
          <code>&lt;p&gt;</code>, a <code>&lt;div&gt;</code> inside{' '}
          <code>&lt;tbody&gt;</code>, or an <code>&lt;a&gt;</code> inside an{' '}
          <code>&lt;a&gt;</code>. React dev builds warn about several of these directly —{' '}
          <em>validateDOMNesting: &lt;div&gt; cannot appear as a descendant of
          &lt;p&gt;</em> — and that warning is worth treating as an error.
        </p>
      </InfoBox>

      <h2>The Nesting Rules Worth Memorising</h2>
      <CodeBlock language="html" title="The handful that actually bite">
{`<!-- <p> takes INLINE content only. No div, section, ul, table, or
     another p. This is the one that catches everyone, because wrapping
     a paragraph around a layout feels natural. -->
<p><span>fine</span></p>
<p><div>broken</div></p>

<!-- <ul>/<ol> take ONLY <li> (plus script/template) as children.
     A wrapper div between them is invalid. -->
<ul><li>fine</li></ul>
<ul><div><li>broken</li></div></ul>

<!-- <table> takes caption/colgroup/thead/tbody/tfoot/tr. Nothing else.
     A conditional wrapper div around rows is the common React version. -->
<table><tbody><tr><td>fine</td></tr></tbody></table>

<!-- <a> cannot contain <a>. <button> cannot contain <button> or <a>
     (interactive content cannot nest). -->
<button><span>fine</span></button>
<button><a href="/x">broken</a></button>

<!-- <li> must be inside ul/ol/menu. <td>/<th> inside <tr>. -->`}
      </CodeBlock>

      <InfoBox variant="tip" title="A React fragment does not create an element, so it is always safe">
        <p>
          When you need to group children without introducing a wrapper the parser will
          reject, that is exactly what <code>&lt;&gt;…&lt;/&gt;</code> is for. A fragment
          emits no DOM node, so <code>&lt;tbody&gt;&#123;rows.map(…)&#125;&lt;/tbody&gt;</code>{' '}
          with a fragment inside stays valid where a <code>&lt;div&gt;</code> would not.
        </p>
      </InfoBox>

      <h2>Whitespace, Entities and the Two Gotchas</h2>
      <CodeBlock language="html" title="Things that surprise people once">
{`<!-- 1. Runs of whitespace collapse to ONE space, and newlines count
        as whitespace. These two render identically: -->
<p>a     b</p>
<p>a
b</p>

<!-- ...which is why inline-block elements have mysterious gaps between
     them: the newline in your source IS a space character. -->

<!-- 2. <pre> and <textarea> are the exceptions — they preserve it.
        A <textarea> also eats ONE leading newline, so write the
        content tight against the tag. -->
<textarea>no leading newline here</textarea>

<!-- 3. Five characters need escaping in text or attributes: -->
&lt;  &gt;  &amp;  &quot;  &#39;

<!-- 4. &nbsp; is a non-breaking space: it does NOT collapse and does
        NOT wrap. Useful between a number and its unit ("5&nbsp;MB"),
        abused as a layout spacer. -->`}
      </CodeBlock>

      <InfoBox variant="warning" title="innerHTML runs the parser — and that is the XSS surface">
        <p>
          Setting <code>innerHTML</code> invokes this same parser on a string, which is
          why it executes markup. Injected <code>&lt;script&gt;</code> tags do not run
          via <code>innerHTML</code>, but{' '}
          <code>&lt;img src=x onerror=alert(1)&gt;</code> does — the attribute is a real
          event handler on a real element. React&apos;s{' '}
          <code>dangerouslySetInnerHTML</code> is named that way for exactly this reason.
          If you need to insert plain text, use <code>textContent</code>, which does not
          parse at all.
        </p>
      </InfoBox>

      <h2>Validating, Because You Cannot See These By Eye</h2>
      <p>
        The repairs above are invisible in a browser — the page looks fine, the DOM is
        just not what you wrote. Three ways to catch them:
      </p>
      <ul>
        <li>
          <strong>React&apos;s dev warnings.</strong> <code>validateDOMNesting</code>{' '}
          covers the worst cases and costs nothing, because you already have it.
        </li>
        <li>
          <strong>Inspect the DOM, not the source.</strong> DevTools&apos; Elements panel
          shows the <em>repaired</em> tree. &quot;View source&quot; shows what you sent.
          When those disagree, the parser rewrote something.
        </li>
        <li>
          <strong>The W3C validator</strong> (<code>validator.w3.org</code>) for a built
          page, or <code>html-validate</code> as a lint step if you want it in CI.
        </li>
      </ul>

      <InfoBox variant="success" title="The one-sentence takeaway">
        <p style={{ marginBottom: 0 }}>
          The browser will never tell you your HTML was wrong — it will quietly build a
          different tree and carry on. So invalid markup does not show up as an error; it
          shows up later as a layout you cannot explain, a form that submits nothing, or a
          hydration mismatch with no obvious cause.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
