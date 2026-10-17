import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function BrowserDom() {
  return (
    <LessonLayout
      title="The DOM API"
      sectionId="browser-runtime"
      lessonIndex={0}
      prev={null}
      next={{ path: '/browser-runtime/events', label: 'Events, Phases & Delegation' }}
    >
      <p>
        React exists so you do not write DOM code. You still need to read it — in a
        third-party script, in a <code>useEffect</code> that measures something, in a
        Stack Overflow answer from 2014 — and the parts React does not cover (focus,
        measurement, scroll, clipboard) are all raw DOM.
      </p>
      <p>
        This lesson is the useful subset. Everything was run in Chromium 149.
      </p>

      <h2>Selecting</h2>
      <CodeBlock language="javascript" title="Two APIs, and the difference that matters">
{`// The modern pair. Takes any CSS selector.
document.querySelector('.card')         // first match, or null
document.querySelectorAll('.card')      // a STATIC NodeList of all matches

// The older family, still everywhere in legacy code:
document.getElementById('root')          // fastest, id only
document.getElementsByClassName('card')  // a LIVE HTMLCollection
document.getElementsByTagName('li')      // also LIVE

// Scoped to a subtree — this is the one people forget exists:
const card = document.querySelector('.card');
card.querySelector('.title');            // searches INSIDE card only`}
      </CodeBlock>

      <InfoBox variant="warning" title="Live vs static collections — the loop that eats itself">
        <p>
          <code>getElementsBy*</code> returns a <strong>live</strong> collection: it
          re-queries the document as you read it. So removing items while iterating
          forward skips half of them, because the collection shrinks under you.
        </p>
        <CodeBlock language="javascript" title="The bug, and the two fixes">
{`// BROKEN: removing shifts every later index down by one.
const live = document.getElementsByClassName('row');
for (let i = 0; i < live.length; i++) live[i].remove();

// FIX 1: querySelectorAll is STATIC — a snapshot. Safe to mutate during.
document.querySelectorAll('.row').forEach(el => el.remove());

// FIX 2: if you must use a live collection, iterate backwards.
for (let i = live.length - 1; i >= 0; i--) live[i].remove();`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — Chromium 149, four .row elements, forward loop">
{`started with : 4
after the loop: 2 remaining

// Exactly half. i=0 removes the first, everything shifts down, so
// i=1 now points at what used to be index 2 — the old index 1 is
// skipped entirely. The loop also exits early because length shrank.

// And the static version, for contrast:
const snapshot = document.querySelectorAll('.s');   // length 2
snapshot.forEach(el => el.remove());
snapshot.length -> still 2    // the NodeList never changes`}
        </CodeBlock>
      </InfoBox>

      <h2>Traversing</h2>
      <CodeBlock language="javascript" title="Element-only vs node-aware — pick the element versions">
{`// ELEMENT versions: skip text and comment nodes. Use these.
el.children            // HTMLCollection of child ELEMENTS
el.firstElementChild
el.lastElementChild
el.nextElementSibling
el.previousElementSibling
el.parentElement

// NODE versions: include text nodes, which means whitespace in your
// source counts as a child. This is why el.firstChild is usually a
// useless "\\n      " text node.
el.childNodes
el.firstChild
el.nextSibling
el.parentNode

// Upward search by selector — the inverse of querySelector, and the
// single most useful traversal method:
e.target.closest('[data-id]')   // nearest ancestor (or self) that matches`}
      </CodeBlock>

      <InfoBox variant="tip" title="closest() is what makes event delegation practical">
        <p>
          When a click lands on an <code>&lt;svg&gt;</code> inside a{' '}
          <code>&lt;span&gt;</code> inside the <code>&lt;button&gt;</code> you care
          about, <code>e.target</code> is the SVG. <code>e.target.closest('button')</code>{' '}
          walks up to the button. Without it, every delegated handler needs a manual
          parent-walking loop. More on this in the next lesson.
        </p>
      </InfoBox>

      <h2>Reading and Writing Content</h2>
      <CodeBlock language="javascript" title="Three ways, one of which is a security decision">
{`el.textContent = userInput;   // SAFE. Sets text. No parsing at all.
el.innerHTML   = userInput;   // RUNS THE PARSER. This is the XSS surface.
el.innerText;                 // text AS RENDERED — respects display:none
                              // and triggers a REFLOW to compute it

// textContent vs innerText, measured:
//   <div>a<span style="display:none">b</span></div>
//   textContent -> "ab"   (everything in the markup)
//   innerText   -> "a"    (what the user can see)`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Chromium 149, innerHTML really does execute">
{`div.innerHTML = '<script>window.flag = true<\\/script>'
  -> window.flag is still false.  Injected <script> does NOT run.

div.innerHTML = '<img src="/missing.png" onerror="window.flag = true">'
  -> window.flag becomes TRUE.  The attribute is a real event handler
     on a real element, and a broken src fires it immediately.`}
      </CodeBlock>

      <InfoBox variant="danger" title="This is why dangerouslySetInnerHTML is named that">
        <p>
          &quot;<code>innerHTML</code> is fine because script tags do not run&quot; is a
          dangerous half-truth. Inline event handlers run, and so do{' '}
          <code>javascript:</code> URLs, <code>&lt;iframe srcdoc&gt;</code>, and SVG{' '}
          <code>&lt;animate&gt;</code> tricks. If the string contains anything a user
          supplied, either use <code>textContent</code> or sanitise with a real library
          (DOMPurify) — never a regex.
        </p>
      </InfoBox>

      <h2>Attributes, Properties, Classes and Data</h2>
      <CodeBlock language="javascript" title="attribute vs property — they are not the same thing">
{`// An ATTRIBUTE is the markup. A PROPERTY is the live JS value.
// For most things they track each other. For form state they do NOT:
input.getAttribute('value')   // the ORIGINAL markup value, never changes
input.value                   // what the user has typed right now

checkbox.getAttribute('checked')  // the DEFAULT (present or absent)
checkbox.checked                  // the CURRENT state — use this

// classList: never build className strings by hand
el.classList.add('is-open', 'is-visible');
el.classList.remove('is-open');
el.classList.toggle('is-open');          // returns the new boolean
el.classList.toggle('is-open', isOpen);  // force to a specific state
el.classList.contains('is-open');
el.classList.replace('old', 'new');

// dataset: data-* attributes, camelCased
// <div data-user-id="42" data-role="card">
el.dataset.userId   // "42"  — ALWAYS a string
el.dataset.role     // "card"`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — verified in Chromium 149">
{`<div id="a" class="x" data-role="card">
  el.dataset              -> { role: "card" }
  el.classList methods    -> add, remove, toggle, contains, replace`}
      </CodeBlock>

      <h2>Creating and Inserting</h2>
      <CodeBlock language="javascript" title="The modern insertion methods">
{`const li = document.createElement('li');
li.textContent = 'New row';
li.classList.add('row');

// The modern four. All take multiple nodes AND plain strings.
parent.append(li, 'some text');    // at the end   (appendChild takes ONE node)
parent.prepend(li);                 // at the start
el.before(li);                      // as a previous sibling
el.after(li);                       // as a next sibling
el.replaceWith(li);                 // swap it out
el.remove();                        // delete it (no parent reference needed)

// Precise positioning relative to an element's own tags:
el.insertAdjacentHTML('beforeend', '<li>parsed</li>');
//   'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend'`}
      </CodeBlock>

      <InfoBox variant="tip" title="DocumentFragment: one reflow instead of N">
        <p>
          Appending 1,000 elements one at a time can trigger layout work on every
          insertion. A <code>DocumentFragment</code> is a container that is not in the
          document — build inside it, then insert once. When you append the fragment, its
          children move in and the fragment itself vanishes.
        </p>
        <CodeBlock language="javascript" title="The pattern">
{`const frag = document.createDocumentFragment();
for (const row of rows) {
  const li = document.createElement('li');
  li.textContent = row.name;
  frag.append(li);              // not in the document yet — no layout cost
}
list.append(frag);              // ONE insertion`}
        </CodeBlock>
      </InfoBox>

      <h2>Measuring — and the Thing That Makes It Slow</h2>
      <CodeBlock language="javascript" title="Geometry, and which properties force work">
{`// Reading these FORCES the browser to flush pending layout, because it
// cannot answer without knowing where things are:
el.getBoundingClientRect()   // position + size, relative to the VIEWPORT
el.offsetWidth / offsetHeight   // layout size, incl. padding + border
el.clientWidth  / clientHeight  // inside the border, excl. scrollbar
el.scrollHeight                 // full content height, incl. overflow
el.scrollTop                    // current scroll offset

window.scrollY, window.innerHeight`}
      </CodeBlock>

      <InfoBox variant="danger" title="Layout thrashing: the read/write loop">
        <p>
          Writing a style invalidates layout. Reading a geometry property then forces the
          browser to recompute it <em>immediately</em>, before the next line runs.
          Alternating the two in a loop makes the browser do that work once per
          iteration:
        </p>
        <CodeBlock language="javascript" title="The bug and the fix">
{`// BAD: read, write, read, write… forces a synchronous layout per item.
for (const el of items) {
  el.style.height = el.offsetHeight + 10 + 'px';   // read THEN write
}

// GOOD: batch all reads, then all writes. One layout pass.
const heights = items.map(el => el.offsetHeight);  // all reads
items.forEach((el, i) => {                          // all writes
  el.style.height = heights[i] + 10 + 'px';
});`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          In DevTools this shows up as repeated purple &quot;Layout&quot; bars, often
          flagged as <em>Forced reflow</em>. The{' '}
          <a href="/devtools/performance">Performance panel lesson</a> shows how to spot
          it.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="Where this touches React">
        <p style={{ marginBottom: 0 }}>
          You will write exactly this code inside a ref callback or an effect — measuring
          a tooltip&apos;s position, focusing an input, scrolling a list item into view.
          React has no abstraction for those, which is why{' '}
          <a href="/react18/refs">Refs In Depth</a> spends its time here. The rule is the
          same as in that lesson: capture the node in a local variable, because{' '}
          <code>ref.current</code> is already <code>null</code> by the time a{' '}
          <code>useEffect</code> cleanup runs.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
