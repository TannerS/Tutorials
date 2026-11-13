import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ReactVirtualDom() {
  return (
    <LessonLayout
      title="The Virtual DOM, Fibers & Reconciliation"
      sectionId="react18"
      lessonIndex={24}
      prev={{ path: '/react18/jsx', label: 'What JSX Really Is' }}
      next={{ path: '/react18/events', label: "React's Event System" }}
    >
      <p>
        &ldquo;Virtual DOM&rdquo; is the most-repeated and least-defined phrase in React.
        The usual one-liner — <em>React keeps a lightweight copy of the DOM in memory,
        diffs it, and updates only what changed</em> — is wrong in its first clause,
        misleading in its second, and right in its third. There is no copy of the DOM,
        and nothing is ever compared against the document.
      </p>
      <p>
        This lesson replaces the slogan with the three concrete things it conflates:
        the <strong>element tree</strong> your components return, the{' '}
        <strong>fiber tree</strong> React turns it into, and the{' '}
        <strong>commit</strong> that writes to the DOM. Once those are separate in your
        head, a long list of React behaviours stops being folklore —{' '}
        <code>key</code>, lost component state, why a component declared inside another
        component resets, why you cannot read the DOM during render.
      </p>
      <InfoBox variant="note" title="How the numbers below were produced">
        <p style={{ marginBottom: 0 }}>
          Every mutation count, node-identity check and fiber dump on this page came
          from a lab run against <strong>React 19.3.1</strong> and{' '}
          <strong>react-dom 19.3.1</strong> on <strong>jsdom 29.1.1</strong> / Node
          25.2.1, using a <code>MutationObserver</code> to record exactly which DOM
          operations React performed. The headline measurements were then re-run in a
          real <strong>Chromium 149.0.7827.55</strong> through a Vite dev server and
          came back <em>identical</em> — same counts, same node identities — so nothing
          here is a jsdom artefact.
        </p>
      </InfoBox>

      <h2>1. There Is No Copy of the DOM</h2>
      <p>
        The previous lesson established what <code>jsx(...)</code> returns: a plain
        object with <code>type</code>, <code>props</code> and <code>key</code>. A
        component returns a tree of those objects, and that tree is the whole of the
        &ldquo;virtual DOM&rdquo;. It contains no DOM nodes, no methods, no parent
        pointers and nothing read from the document.
      </p>
      <p>
        So what does React diff it against? <strong>The element tree from the previous
        render.</strong> Not the document. That distinction sounds academic until you
        edit the DOM behind React&apos;s back and watch what it does and does not
        notice:
      </p>

      <CodeBlock language="jsx" title="The experiment">
{`function App() {
  const [label, setLabel] = useState('from React');
  return (
    <div>
      <p id="watched">{label}</p>
      <p id="other">sibling</p>
    </div>
  );
}

// After mounting, edit the DOM directly — as a jQuery plugin, a chart
// library, a browser extension or a stray querySelector would:
watched.textContent = 'HAND-EDITED';
watched.setAttribute('data-hand', 'yes');

// …then re-render React with the SAME label it last committed,
// and then with a different one.`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — React 19.3.1, mutations recorded by MutationObserver">
{`1. after mount           : <div><p id="watched">from React</p><p id="other">sibling</p></div>
2. after the hand edit   : <div><p id="watched" data-hand="yes">HAND-EDITED</p>…
3. re-render, same value : <div><p id="watched" data-hand="yes">HAND-EDITED</p>…
   what React touched    : 0 mutations
4. re-render, new value  : <div><p id="watched" data-hand="yes">from React (v2)</p>…
   what React touched    : 1 mutation
     characterData   on text node  -> "from React (v2)"

5. did the hand-set attribute survive?  yes
   is it still the same <p> node?       true`}
      </CodeBlock>

      <p>
        Read line 3 again. React re-rendered, compared{' '}
        <code>&lt;p id=&quot;watched&quot;&gt;from React&lt;/p&gt;</code> with{' '}
        <code>&lt;p id=&quot;watched&quot;&gt;from React&lt;/p&gt;</code>, found them
        equal and emitted <strong>nothing</strong> — while the actual document said{' '}
        <code>HAND-EDITED</code>. If React held a copy of the DOM, or read the document
        to decide, it would have repaired the node. It did not, because the only two
        things it looked at were its own two element trees.
      </p>
      <p>
        Line 5 is the same fact from the other side. When the value <em>did</em> change,
        React rewrote the text and left <code>data-hand</code> alone — that attribute is
        in neither of its trees, so as far as React is concerned it does not exist. This
        is the whole reason &ldquo;React and some other library both own this node&rdquo;
        goes wrong in such strange ways: the two never fight, they just write over each
        other at unpredictable moments.
      </p>

      <FlowChart
        title="One update, start to finish"
        chart={"graph TD\n  A[\"setState / new props\"] --> B[\"RENDER PHASE\\ncall your component functions\"]\n  B --> C[\"a NEW tree of element objects\"]\n  C --> D[\"RECONCILE\\ncompare new elements with the\\nPREVIOUS elements, fiber by fiber\"]\n  D --> E[\"mark each fiber with flags:\\nPlacement / Update / Deletion\"]\n  E --> F[\"COMMIT PHASE\\nwalk the marked fibers and call\\nappendChild / setAttribute / data =\"]\n  F --> G[\"the real DOM, now in sync\"]\n  H[\"the document itself\"] -.->|\"never read\"| D\n  style D fill:#1a3329,stroke:#4ade80\n  style H fill:#3b1a1a,stroke:#f87171"}
      />

      <h2>2. What a Re-render Actually Costs</h2>
      <p>
        The same list rendered four ways, with a <code>MutationObserver</code> counting
        every DOM operation. One row&apos;s text changes from <code>beta</code> to{' '}
        <code>BETA!</code> in all cases, so the visible result is identical:
      </p>

      <table>
        <thead>
          <tr>
            <th>How the change was made</th>
            <th>DOM mutations</th>
            <th>What they were</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>React, one row&apos;s text changed</td>
            <td><strong>1</strong></td>
            <td><code>characterData</code> on one text node</td>
          </tr>
          <tr>
            <td>React, re-rendered with identical strings</td>
            <td><strong>0</strong></td>
            <td>nothing at all</td>
          </tr>
          <tr>
            <td>
              Imperative: <code>ul.innerHTML = …</code>
            </td>
            <td><strong>1 record, 6 nodes</strong></td>
            <td>
              <code>childList</code>: 3 <code>&lt;li&gt;</code> removed, 3 added
            </td>
          </tr>
          <tr>
            <td>
              Imperative: <code>node.firstChild.data = …</code>
            </td>
            <td><strong>1</strong></td>
            <td><code>characterData</code> on one text node</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="text" title="Real output — the React rows, with node identity checked">
{`REACT: one row text changed
  mutations: 1
    characterData   on text node  -> "BETA!"
  same <li> objects as before?  true
  same text nodes as before?    true

REACT: re-render, new array, same strings
  mutations: 0

IMPERATIVE A: ul.innerHTML = ...  (same visible result)
  mutations: 1
    childList   on <ul>  added: <li>, <li>, <li>  removed: <li>, <li>, <li>

IMPERATIVE B: node.firstChild.data = ...  (the optimum)
  mutations: 1
    characterData   on text node  -> "beta again"`}
      </CodeBlock>

      <p>
        React and the hand-optimised version did <em>exactly the same single
        operation</em>. Not fewer, not more. And it kept every{' '}
        <code>&lt;li&gt;</code> and every text node — the same JavaScript objects as
        before, which is what preserves focus, scroll position, text selection, CSS
        transitions and anything else the browser attaches to node identity. The{' '}
        <code>innerHTML</code> version threw six nodes away to achieve an identical
        appearance, which is why focus and selection die when you rebuild markup from
        strings.
      </p>

      <InfoBox variant="warning" title="&ldquo;The virtual DOM is faster than the DOM&rdquo; is not the claim">
        <p>
          The table above is the honest version: React&apos;s output is{' '}
          <strong>equal to the best imperative code</strong> and far better than the
          naive imperative code. It is not faster than the DOM, and it cannot be — it
          calls the same DOM methods you would. It also does strictly{' '}
          <em>more</em> work than hand-written code, because before those DOM calls it
          re-runs your component functions and walks a tree in JavaScript.
        </p>
        <p style={{ marginBottom: 0 }}>
          What you actually buy is a <strong>cost ceiling with no bookkeeping</strong>:
          you write &ldquo;here is what the UI should look like&rdquo;, and the DOM work
          that follows is about as small as a careful human would have written, without
          anyone maintaining a list of which nodes to touch. When React is slow it is
          almost never the DOM commit — it is the JS-side render pass, which is why the
          fix is <code>memo</code> / <code>useMemo</code> / fewer re-rendering
          components (see <a href="/react18/performance">Performance &amp;
          Memoization</a>) rather than anything DOM-related.
        </p>
      </InfoBox>

      <h2>3. The Four Rules the Diff Follows</h2>
      <p>
        Reconciliation is not a general tree-diff. A real minimal-edit-distance diff
        between two trees is O(n³), which is unusable, so React applies a handful of
        deliberately cheap heuristics and gets O(n). Those heuristics <em>are</em> the
        API. Every one of them is observable.
      </p>

      <h3>Rule 1: same position + same type = update; different type = destroy</h3>
      <p>
        React compares the element at a given position with the element that was at that
        position last time. Same <code>type</code> → keep the DOM node and the component
        state, update the differences. Different <code>type</code> → unmount the entire
        subtree and build a new one, however identical the children look.
      </p>

      <CodeBlock language="jsx" title="Only the WRAPPER changes — the child is untouched">
{`function App() {
  const [mode, setMode] = useState('div');
  return React.createElement(mode, { id: 'wrap' }, <Child />);
  //                         ^^^^ 'div' on the first render, 'span' on the second
}
// <Child /> is the same element, with the same props, in the same position.`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — React 19.3.1">
{`mount:
      [Child] MOUNTED   (wrapper was <div>)
  html: <div id="wrap"><b>child state = 0</b></div>

the child acquires some state:
  html: <div id="wrap"><b>child state = 42</b></div>

re-render with the SAME wrapper type:
  mutations: 0
  wrapper node reused?  true

change the WRAPPER tag from <div> to <span>:
      [Child] UNMOUNTED (wrapper was <div>)
      [Child] MOUNTED   (wrapper was <span>)
  html: <span id="wrap"><b>child state = 0</b></span>
  2 mutation records:
    childList   on <div>  added: none    removed: <div>
    childList   on <div>  added: <span>  removed: none
  wrapper node reused?  false
  inner <b> reused?     false`}
      </CodeBlock>

      <p>
        The child&apos;s state went from <code>42</code> back to <code>0</code>, its
        effect cleanup ran, its effect re-ran, and its <code>&lt;b&gt;</code> is a
        different DOM node — all because its <em>parent&apos;s</em> tag letter changed.
        Note also the shape of the commit: two <code>childList</code> records, remove
        then insert. React built the replacement subtree off-document and attached it in
        one operation.
      </p>
      <p>
        This is the answer to <em>&ldquo;why did my form lose everything when I toggled
        that layout?&rdquo;</em>. Conditional structure like{' '}
        <code>{'{wide ? <div><Form/></div> : <section><Form/></section>}'}</code> remounts{' '}
        <code>Form</code> on every toggle. Changing the wrapper&apos;s{' '}
        <em>props</em> is free; changing which <em>component or tag</em> occupies the
        position is not.
      </p>

      <h3>Rule 2: <code>type</code> is compared with <code>===</code></h3>
      <p>
        For a host element the type is a string, so <code>&apos;div&apos; ===
        &apos;div&apos;</code> and all is well. For a component the type is{' '}
        <strong>the function itself</strong>, compared by reference. Declare a component
        inside another component and you create a new function object on every render —
        a new type, every time:
      </p>

      <CodeBlock language="jsx" title="The same component, declared in two places">
{`// A — module scope. One function object, forever.
function Inner() { /* useState + an uncontrolled <input> */ }
function Outer() {
  const [n, setN] = useState(0);
  return <div>n={n} <Inner /></div>;
}

// B — declared inside. A NEW function object on every Outer render.
function Outer() {
  const [n, setN] = useState(0);
  function Inner() { /* identical body */ }
  return <div>n={n} <Inner /></div>;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — one unrelated parent state update, both variants">
{`Inner declared at module scope
  html after both edits: <div>n=0 <div><i>edited</i><input value=""></div></div>
                         | input value: "typed by the user"
  after an unrelated PARENT state update:
    component state kept?  "edited"
    DOM state kept?        "typed by the user"
    same <input> node?     true
    3 mutation records:
      characterData   on text node  -> "n=1 "
      attributes      on <input>  name     (x2, see the note below)

Inner declared inside the parent
  html after both edits: <div>n=0 <div><i>edited</i><input value=""></div></div>
                         | input value: "typed by the user"
  after an unrelated PARENT state update:
    component state kept?  "fresh"      <- reset
    DOM state kept?        ""           <- the typed text is gone
    same <input> node?     false        <- new node
    3 mutation records:
      childList   on <div>  added: none   removed: <div>
      characterData on text node -> "n=1 "
      childList   on <div>  added: <div>  removed: none`}
      </CodeBlock>

      <p>
        Both kinds of state die in variant B: the <code>useState</code> value, which
        lives in the fiber, and the typed text, which lives in the DOM node. Nothing is
        &ldquo;slow&rdquo; here — it is <em>wrong</em>, and it gets worse the more real
        the component is, because an input that is remounted mid-keystroke loses focus
        too. The rule to carry away: <strong>components are declared at module
        scope</strong>. If you need to parameterise one, pass props or use a render prop
        — never a nested declaration.
      </p>
      <InfoBox variant="note" title="Those paired `name` attribute records">
        <p style={{ marginBottom: 0 }}>
          Two <code>attributes</code> records naming <code>name</code> show up around
          any commit that touches an <code>&lt;input&gt;</code>, in both variants above.
          That is react-dom&apos;s own workaround, not your code: before writing an
          input&apos;s default value it blanks the <code>name</code> attribute and puts
          it back afterwards, so that assigning a value to one radio button cannot
          disturb its group. Harmless, but worth recognising so you do not go hunting
          for the attribute write in your own components.
        </p>
      </InfoBox>

      <h3>Rule 3: an identical element object skips the subtree entirely</h3>
      <p>
        If the element React finds at a position is <strong>reference-equal</strong> to
        the one that was there last time, it cannot possibly have changed, so React does
        not call that component at all. This is not a documented optimisation you opt
        into; it falls straight out of the diff, and it is the mechanism behind{' '}
        <code>children</code> being &ldquo;free&rdquo;:
      </p>

      <CodeBlock language="text" title="Real output — render counts across 3 renders of the parent">
{`# The <Heavy /> element is created ONCE, outside Shell, and passed as children.
after mount                  : { "shell": 1, "heavy": 1 }
after 2 shell state updates  : { "shell": 3, "heavy": 1 }   <- Heavy never re-ran

# The same component tree, but <Heavy /> is rebuilt inside Shell's render.
child element rebuilt each render: { "shell": 3, "heavy": 3 }`}
      </CodeBlock>

      <p>
        Three parent renders, <strong>one</strong> child render. The child was not
        memoised, had no <code>memo()</code> wrapper and compared no props — the element
        object simply never changed, because it was created in a component that did not
        re-render. That is why &ldquo;lift the expensive subtree out and pass it as{' '}
        <code>children</code>&rdquo; works as a performance fix, and why{' '}
        <code>{'<Layout><Dashboard /></Layout>'}</code> does not re-render{' '}
        <code>Dashboard</code> when <code>Layout</code>&apos;s own state changes.
      </p>

      <h3>Rule 4: <code>key</code> identifies a child among its siblings</h3>
      <p>
        Within one list of children, <code>key</code> overrides position. React matches
        new children to old children by key first, and only falls back to index when
        there is no key. The next section measures what that changes.
      </p>

      <h2>4. Keys, Measured</h2>
      <p>
        A two-row list, where each row contains an uncontrolled{' '}
        <code>&lt;input&gt;</code> the user has typed into and a per-mount id from a{' '}
        <code>useRef</code>. Then one item is <strong>prepended</strong>, so every
        existing row shifts down a position. Same data, same mutation, two key
        strategies:
      </p>

      <CodeBlock language="text" title="Real output — key={index}">
{`before:
  alpha -> input "typed-into-alpha"  (vwx6)
  beta  -> input "typed-into-beta"   (f0b9)

after prepending ZERO:
  ZERO  -> input "typed-into-alpha"  (vwx6)   <- alpha's input, and alpha's ref
  alpha -> input "typed-into-beta"   (f0b9)   <- beta's input, and beta's ref
  beta  -> input ""                  (9ve9)   <- a brand-new row at the END

  7 mutation records:
    characterData   on text node  -> "ZERO"
    attributes      on <input>  name   (x2)
    characterData   on text node  -> "alpha"
    attributes      on <input>  name   (x2)
    childList       on <ul>  added: <li>  removed: none
  alpha's original <li> object still in the DOM? true, at row index 0`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — key={item.id}">
{`before:
  alpha -> input "typed-into-alpha"  (r65r)
  beta  -> input "typed-into-beta"   (ldci)

after prepending ZERO:
  ZERO  -> input ""                  (cxrx)   <- the new row is new
  alpha -> input "typed-into-alpha"  (r65r)   <- state followed the row
  beta  -> input "typed-into-beta"   (ldci)

  5 mutation records:
    childList   on <ul>  added: <li>  removed: none
    attributes  on <input>  name   (x4)
  alpha's original <li> object still in the DOM? true, at row index 1`}
      </CodeBlock>

      <p>
        With index keys, React was told &ldquo;row 0 is still row 0&rdquo;, so it kept
        row 0&apos;s DOM node and fiber and rewrote the text inside them. The typed text
        and the ref id <strong>stayed with the position</strong> while the labels moved,
        so <code>&quot;typed-into-alpha&quot;</code> is now sitting in the{' '}
        <code>ZERO</code> row. Nothing crashed, nothing warned, and the data on screen is
        wrong.
      </p>
      <p>
        With stable keys, React matched <code>alpha</code> to <code>alpha</code>, left
        both existing rows exactly as they were, and did a{' '}
        <strong>single insertion</strong> at the front — two fewer operations than the
        index version, as a side effect of being correct. (Inserting at position 0 shifts
        the rest for free; a <code>MutationObserver</code> sees one{' '}
        <code>childList</code> record and no moves.)
      </p>

      <InfoBox variant="danger" title="Index keys are not a performance problem">
        <p>
          The received wisdom is that <code>key={'{index}'}</code> is &ldquo;slower&rdquo;
          or &ldquo;less efficient&rdquo;. The measurement says otherwise: 7 mutations
          versus 5 is noise. The actual failure is a <strong>correctness</strong> one —
          state, DOM state, refs, focus and in-flight animations are attached to the
          wrong item — and it is silent, which makes it far worse than a slow render you
          can profile.
        </p>
        <p style={{ marginBottom: 0 }}>
          <code>key={'{index}'}</code> is harmless under exactly one condition: the list
          is never reordered, filtered, prepended to or spliced, <em>and</em> no row
          holds state the user can see (no inputs, no open/closed rows, no focus, no
          animations). A static footer-link list qualifies. A table with sortable columns
          does not. When there is genuinely no id,{' '}
          <code>key={'{`${item.date}-${item.amount}`}'}</code> beats the index — any
          value derived from the item itself is more stable than its position.
        </p>
      </InfoBox>

      <h2>5. What the Elements Become: Fibers</h2>
      <p>
        Element objects are created and thrown away on every render. The thing that{' '}
        <em>persists</em> — the thing holding your state, your effect list, the DOM node
        pointer and the diff bookkeeping — is a parallel tree of{' '}
        <strong>fibers</strong>. One fiber per component instance and per host element.
        React hangs the fiber for a DOM node directly off that node, so you can read it:
      </p>

      <CodeBlock language="javascript" title="Finding a fiber from a DOM node">
{`const el = document.querySelector('#p');
Object.keys(el);
// -> ['__reactFiber$o98xdrh1o4d', '__reactProps$o98xdrh1o4d']

const fiber = el[Object.keys(el).find(k => k.startsWith('__reactFiber$'))];`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — React 19.3.1, the fiber for a <p>">
{`tag           = 5                      (5 = HostComponent)
type          = "p"
key           = null
stateNode     = the real <p> DOM node
return        = the fiber for Counter   (the PARENT; the field is not called 'parent')
child         = null                    (its text is a prop, not a child fiber)
sibling       = null
memoizedProps = { "id": "p", "className": "c0", "children": "n = 0" }
flags         = 0
lanes         = 0
alternate     = null                    (only one tree exists so far)

walk up one: the fiber for the Counter COMPONENT
  tag        = 0                        (0 = FunctionComponent)
  type.name  = Counter
  stateNode  = null                     (no DOM node of its own)
  memoizedState is the HOOK CHAIN, in call order:
    hook[0] = 0                             <- the useState
    hook[1] = { current: "a-ref-value" }    <- the useRef`}
      </CodeBlock>

      <p>
        Three things in that dump are worth more than the rest. First,{' '}
        <code>child</code> / <code>sibling</code> / <code>return</code>: the fiber tree
        is a <strong>linked list you can walk with a loop</strong>, not a nested array
        you have to recurse into. That is the entire reason the structure is called a
        fiber and the reason concurrent rendering is possible at all — a loop over
        pointers can stop after any step, hand control back to the browser, and resume
        from the fiber it was holding. A recursive walk cannot pause.
      </p>
      <p>
        Second, <code>memoizedState</code> on a function component is a{' '}
        <strong>singly-linked list of hooks in call order</strong>, with no names in it.
        That is the mechanism behind the rules of hooks, and it makes the rule obvious
        rather than arbitrary: React matches your third <code>useState</code> to the
        third node in the chain. Put one behind an <code>if</code> and every subsequent
        hook reads the wrong node.
      </p>
      <p>
        Third, <code>stateNode</code>: a host fiber points at its DOM node, and a
        function-component fiber points at nothing. The &ldquo;virtual DOM&rdquo; touches
        the real DOM at exactly these points.
      </p>

      <h3>Two trees, alternating — the double buffer</h3>
      <p>
        <code>alternate</code> was <code>null</code> above only because nothing had
        re-rendered yet. React keeps <strong>two</strong> fiber trees: the one currently
        on screen, and the work-in-progress one it is building. When the new one is
        ready, committing it is a single pointer swap on the root, and the old tree
        becomes the scratch space for the next render. Following the root&apos;s{' '}
        <code>current</code> pointer across five commits shows it exactly:
      </p>

      <CodeBlock language="text" title="Real output — five commits, counting distinct fiber objects">
{`commit 0: root.current -> <p> fiber #0 (className="c0")   its .alternate = none
          the DOM node's __reactFiber$ points at #0
commit 1: root.current -> <p> fiber #1 (className="c1")   its .alternate = #0 (className="c0")
          the DOM node's __reactFiber$ points at #0
commit 2: root.current -> <p> fiber #0 (className="c2")   its .alternate = #1 (className="c1")
          the DOM node's __reactFiber$ points at #0
commit 3: root.current -> <p> fiber #1 (className="c3")   its .alternate = #0 (className="c2")
          the DOM node's __reactFiber$ points at #0
commit 4: root.current -> <p> fiber #0 (className="c4")   its .alternate = #1 (className="c3")
          the DOM node's __reactFiber$ points at #0

distinct <p> fiber objects across five commits: 2`}
      </CodeBlock>

      <p>
        <strong>Two objects. Five commits.</strong> React does not allocate a fresh tree
        per render; it ping-pongs between two and copies the unchanged fields across.
        That is the real answer to &ldquo;isn&apos;t keeping a whole second tree
        expensive?&rdquo; — there are only ever two, and the one not on screen is reused
        as the buffer for the next render.
      </p>

      <InfoBox variant="warning" title="If you ever read __reactFiber$ in anger">
        <p style={{ marginBottom: 0 }}>
          Notice the second line of every commit above: the DOM node&apos;s{' '}
          <code>__reactFiber$</code> property kept pointing at fiber{' '}
          <strong>#0</strong> the whole time. It is set when the node is created and not
          re-pointed on commit, so on half the commits it hands you the{' '}
          <em>stale</em> half of the pair — at commit 3 it reads{' '}
          <code>className=&quot;c2&quot;</code> while the screen shows{' '}
          <code>c3</code>. <code>__reactProps$</code> on the same node <em>is</em> kept
          current (it read <code>c4</code> at the end). Both are private, both are
          renamed per build, and neither is safe to ship — read them in a debugger, never
          in product code.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="The other key React leaves on the container">
        <p style={{ marginBottom: 0 }}>
          The root container node carried two own properties:{' '}
          <code>__reactContainer$…</code>, which is the host-root fiber, and{' '}
          <code>_reactListening…</code>, which is the marker proving React attached its
          delegated event listeners <em>there</em> rather than on your elements. That is
          the subject of the next lesson,{' '}
          <a href="/react18/events">React&apos;s Event System</a>, and it is why a
          stray <code>stopPropagation</code> on a real DOM listener can swallow a React
          <code> onClick</code>.
        </p>
      </InfoBox>

      <h2>6. Render and Commit Are Two Separate Passes</h2>
      <p>
        Reconciliation happens in the render pass; DOM writes happen in the commit pass.
        It is tempting to treat that as an implementation detail until you notice it is
        directly observable: read the DOM while a <em>later</em> sibling is rendering and
        you can see the old value, because nothing has been written yet.
      </p>

      <CodeBlock language="jsx" title="Reading the document in the middle of a render">
{`function First({ n })  { return <p id="first">first {n}</p>; }

function Second({ n }) {
  // Reading the DOM during the render pass. Never do this; it is here to
  // show WHEN the commit happens.
  const live = document.getElementById('first');
  console.log('#first currently reads', live && live.textContent);
  return <p id="second">second {n}</p>;
}

function Watcher({ n }) {
  useLayoutEffect(() => console.log('useLayoutEffect ->', first.textContent), [n]);
  useEffect(()       => console.log('useEffect       ->', first.textContent), [n]);
  return null;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — React 19.3.1">
{`--- mount ---
  render First  -> returns "first 0"
  render Second -> #first currently reads null        <- the node does not exist yet
  useLayoutEffect -> #first reads "first 0"
  useEffect       -> #first reads "first 0"

--- update to n = 1 ---
  render First  -> returns "first 1"
  render Second -> #first currently reads "first 0"   <- STILL the old text
  useLayoutEffect -> #first reads "first 1"
  useEffect       -> #first reads "first 1"`}
      </CodeBlock>

      <p>
        <code>First</code> had already rendered and returned{' '}
        <code>first 1</code>, and the document still said <code>first 0</code>. The
        render pass produced element objects and nothing else. By the time{' '}
        <code>useLayoutEffect</code> runs the commit is done — which is precisely the
        contract: <strong>layout effects are the first place in the cycle where the DOM
        is guaranteed to match the render you are in</strong>, and they run before the
        browser paints, which is why measuring and scroll-correcting belong there and
        not in <code>useEffect</code>.
      </p>
      <p>
        The practical consequences of the split, in one list:
      </p>
      <ul>
        <li>
          <strong>The render pass must be pure</strong> because React may run it and
          throw the result away — on a concurrent interruption, on a re-render triggered
          before the commit, and deliberately twice in <code>StrictMode</code>. A{' '}
          <code>fetch</code> or a counter increment inside a component body happens an
          unpredictable number of times.
        </li>
        <li>
          <strong>The commit pass is synchronous and uninterruptible.</strong> No
          partially-updated DOM is ever visible to the user, however long the render took
          or how many times it restarted.
        </li>
        <li>
          <strong>Reading layout during render is meaningless</strong>, as measured
          above. <code>getBoundingClientRect</code> in a component body returns
          last-commit geometry or crashes on <code>null</code>.
        </li>
      </ul>
      <p>
        <a href="/react18/lifecycle">Component Lifecycle</a> walks the full ordering of
        cleanups and effects across an update; this section is only about where the DOM
        write sits relative to your code.
      </p>

      <h2>7. Four Things &ldquo;Virtual DOM&rdquo; Is Not</h2>
      <p>
        Most of the confusion around the term comes from it being used for four
        different things. Separating them is the single most useful thing on this page.
      </p>

      <table>
        <thead>
          <tr>
            <th>Not the virtual DOM</th>
            <th>What it actually is</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>jsdom</strong>
            </td>
            <td>
              A <em>real</em> DOM implementation written in JavaScript, with real{' '}
              <code>Element</code> and <code>Node</code> classes, real{' '}
              <code>querySelector</code> and real <code>MutationObserver</code>. It is
              what your tests run against instead of a browser. React treats it as a
              host, exactly like a browser — all the measurements on this page are React
              driving jsdom. Calling it &ldquo;a virtual DOM&rdquo; is the single most
              common source of the muddle, and it matters in practice: see{' '}
              <a href="/react-testing/leaks">Leaking Tests</a>, where
              &ldquo;which document am I querying?&rdquo; is the whole bug.
            </td>
          </tr>
          <tr>
            <td>
              <strong>The React DevTools tree</strong>
            </td>
            <td>
              A rendering of the <em>fiber</em> tree, which is why it shows components
              and hooks that have no DOM node at all. The browser&apos;s Elements panel
              shows the DOM. They are different trees and they are allowed to look
              nothing alike.
            </td>
          </tr>
          <tr>
            <td>
              <strong>The shadow DOM</strong>
            </td>
            <td>
              A browser feature for encapsulating a real subtree and its styles (web
              components). Unrelated to React, and genuinely part of the document. The
              similar names are an accident.
            </td>
          </tr>
          <tr>
            <td>
              <strong>A copy of the DOM</strong>
            </td>
            <td>
              Measured in section 1: React holds its own two element trees and never
              reads the document. The word &ldquo;virtual&rdquo; means &ldquo;a
              description of a UI&rdquo;, not &ldquo;a mirror of what is on
              screen&rdquo;.
            </td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="success" title="The payoff: the same reconciler, different hosts">
        <p style={{ marginBottom: 0 }}>
          Because the element tree describes a UI rather than a document, the diffing
          half of React is host-agnostic. <code>react-dom</code> turns commits into{' '}
          <code>appendChild</code>; React Native turns the same commits into native view
          operations; <code>react-three-fiber</code> turns them into scene-graph updates;
          Ink turns them into terminal output. Same elements, same fibers, same four
          rules — only the commit layer differs. That is what the indirection bought,
          and it is a better reason for it than performance ever was.
        </p>
      </InfoBox>

      <h2>8. The Shape to Remember</h2>
      <ul>
        <li>
          <strong>Elements</strong> are disposable descriptions. <strong>Fibers</strong>{' '}
          are the persistent instances holding state, hooks and the DOM pointer. There
          are exactly two fiber trees, and a commit is a pointer swap between them.
        </li>
        <li>
          The diff compares <strong>new elements with previous elements</strong>. It
          never reads the document — which is why a hand-edit survives an unrelated
          re-render, and why two libraries writing to one node never conflict visibly
          until they do.
        </li>
        <li>
          <strong>Same position + same type</strong> → update in place.{' '}
          <strong>Different type</strong> → destroy the subtree and all its state.
          Component types are compared by reference, so{' '}
          <strong>never declare a component inside a component</strong>.
        </li>
        <li>
          <strong>A reference-equal element</strong> skips its subtree with no{' '}
          <code>memo</code> involved — the reason passing <code>children</code> is free.
        </li>
        <li>
          <strong><code>key</code> is identity, not a performance hint.</strong> Index
          keys leave state, focus and typed text behind at the old position, silently.
        </li>
        <li>
          React&apos;s DOM output matched hand-optimal imperative code operation for
          operation (1 vs 1), and beat the <code>innerHTML</code> rewrite by six nodes of
          preserved identity. The win is that you did not have to write it, not that it
          is faster than the DOM.
        </li>
      </ul>

      <InfoBox variant="tip" title="Reproducing any of this yourself">
        <p style={{ marginBottom: 0 }}>
          Every measurement here is a dozen lines: render with{' '}
          <code>createRoot</code>, wrap updates in <code>act()</code> from{' '}
          <code>react</code>, and record the DOM work with a{' '}
          <code>MutationObserver</code> over{' '}
          <code>{'{ childList: true, subtree: true, attributes: true, characterData: true }'}</code>.
          One trap worth knowing if you try it: accumulate records in the observer{' '}
          <em>callback</em> as well as calling <code>takeRecords()</code>. Any{' '}
          <code>await</code> between the mutation and your read lets the microtask
          deliver the batch first, and a delivered batch is gone from{' '}
          <code>takeRecords()</code> — which looks exactly like &ldquo;React did
          nothing&rdquo;.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
