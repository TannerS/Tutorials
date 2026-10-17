import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function HtmlSemantics() {
  return (
    <LessonLayout
      title="Semantic Structure & Text Elements"
      sectionId="html"
      lessonIndex={1}
      prev={{ path: '/html/document', label: 'The Document, head & Metadata' }}
      next={{ path: '/html/forms', label: 'Forms, Inputs & Native Validation' }}
    >
      <p>
        &quot;Use semantic HTML&quot; is advice everyone has heard and few can justify
        past &quot;it is better for accessibility&quot;. This lesson is the justification,
        because the real answer is more concrete: <strong>the element you pick decides
        what behaviour you get for free</strong>, and every behaviour you do not get free
        is one you have to reimplement and keep correct forever.
      </p>

      <h2>The Cost of a <code>div</code>, Priced Out</h2>
      <p>
        Here is the same button written two ways. The difference is not stylistic — the
        second one is a list of things you now own.
      </p>

      <CodeBlock language="html" title="What a div costs you">
{`<!-- The div version -->
<div class="btn" onclick="save()">Save</div>

<!-- To make that genuinely equivalent to a <button>, you need: -->
<div class="btn"
     role="button"              <!-- so it is announced as a button -->
     tabindex="0"               <!-- so it can be focused by keyboard -->
     onclick="save()"
     onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();save()}">
     <!-- Enter AND Space, because a real button responds to both.
          preventDefault because Space scrolls the page otherwise. -->
  Save
</div>

<!-- ...and you STILL do not have: the disabled attribute, form submission,
     :focus-visible ring behaviour, the activation on Enter-held-down
     repeat semantics, or forced-colors-mode contrast. -->

<!-- The button version -->
<button onclick="save()">Save</button>`}
      </CodeBlock>

      <InfoBox variant="tip" title="The rule that makes this decision for you">
        <p>
          Reach for the element whose <em>name</em> matches what the thing is. If it
          navigates, it is an <code>&lt;a href&gt;</code>. If it performs an action, it is
          a <code>&lt;button&gt;</code>. If it is a list of things, it is a{' '}
          <code>&lt;ul&gt;</code>. <code>&lt;div&gt;</code> and{' '}
          <code>&lt;span&gt;</code> are the elements that mean <em>nothing</em>, which
          makes them the right choice only when you genuinely need a styling hook and
          nothing more.
        </p>
      </InfoBox>

      <h2>Link or Button? The One That Actually Trips People</h2>
      <p>
        This is the most common semantic mistake in React codebases, and it has a
        one-question test: <strong>does it change the URL?</strong>
      </p>

      <FlowChart
        title="Choosing between a and button"
        chart={"graph TD\n  A[\"I need a clickable thing\"] --> B{\"Does it change the URL?\"}\n  B -->|Yes| C[\"a href — gets: middle-click to new tab,\\ncopy link address, browser history,\\nCmd-click, crawlable\"]\n  B -->|No| D[\"button — gets: Space and Enter,\\ndisabled, form submit,\\nannounced as a button\"]\n  C --> E{\"Is href a real URL?\"}\n  E -->|\"No — href='#' or onClick only\"| F[\"This is a button wearing a link costume.\\nFix the element, not the CSS.\"]\n  style C fill:#1a3329,stroke:#4ade80\n  style D fill:#1a2744,stroke:#5b9cf6\n  style F fill:#3b1a1a,stroke:#f87171"}
      />

      <CodeBlock language="html" title="Both failure directions, and why each one hurts">
{`<!-- WRONG: a link that does not link. Middle-click opens a blank tab,
     Cmd-click opens a blank tab, "copy link address" copies nothing,
     and it is announced as a link that goes nowhere. -->
<a href="#" onclick="openModal()">Settings</a>

<!-- WRONG the other way: a button that navigates. The user cannot
     open it in a new tab, cannot copy the address, and the browser
     cannot record it in history. -->
<button onclick="location.href='/settings'">Settings</button>

<!-- RIGHT -->
<button type="button" onclick="openModal()">Settings</button>
<a href="/settings">Settings</a>`}
      </CodeBlock>

      <InfoBox variant="warning" title="In React Router this is the same mistake with a different spelling">
        <p>
          <code>&lt;div onClick=&#123;() =&gt; navigate('/x')&#125;&gt;</code> is the{' '}
          <code>href="#"</code> bug in modern clothing: it loses middle-click,
          Cmd-click, hover preview of the target, and keyboard activation.{' '}
          <code>&lt;Link to="/x"&gt;</code> renders a real <code>&lt;a href&gt;</code>{' '}
          and intercepts the click, so you keep all of it. Use{' '}
          <code>useNavigate</code> for navigation that follows an <em>action</em> — after
          a successful form submit, say — not for things the user clicks directly.
        </p>
      </InfoBox>

      <h2>Sectioning: The Elements That Build the Outline</h2>
      <p>
        Six elements describe the shape of a page. Assistive technology turns them into a
        navigable list of landmarks, which is how a screen-reader user skips your nav
        instead of hearing it on every page.
      </p>

      <CodeBlock language="html" title="A page outline, with the rules that matter">
{`<body>
  <header>            <!-- banner. ONE per page, at the top level. -->
    <nav>…</nav>      <!-- navigation. Several are fine IF you name them:
                           <nav aria-label="Primary">, <nav aria-label="Breadcrumb"> -->
  </header>

  <main>              <!-- EXACTLY ONE per page, and not nested in the others.
                           This is the "skip to content" target. -->
    <h1>Invoice 1042</h1>

    <article>         <!-- self-contained: still makes sense if syndicated -->
      <h2>Line items</h2>
    </article>

    <section>         <!-- a thematic grouping. Needs a heading to be
                           useful — a section with no heading is a div. -->
      <h2>Payment history</h2>
    </section>

    <aside>…</aside>  <!-- tangential: related links, a pull quote -->
  </main>

  <footer>…</footer>  <!-- contentinfo. ONE per page at the top level. -->
</body>`}
      </CodeBlock>

      <InfoBox variant="danger" title="section vs div: the distinction people get backwards">
        <p>
          <code>&lt;section&gt;</code> is not &quot;a div with better vibes&quot;. It
          creates a landmark <em>only</em> when it has an accessible name — which in
          practice means a heading inside it, or an explicit{' '}
          <code>aria-label</code>. A <code>&lt;section&gt;</code> with no heading is
          announced as a plain group and buys you nothing over a{' '}
          <code>&lt;div&gt;</code>.
        </p>
        <p style={{ marginBottom: 0 }}>
          So: if you are wrapping things purely to attach a class, use a{' '}
          <code>&lt;div&gt;</code>. Reach for <code>&lt;section&gt;</code> when there is a
          real heading that names the region. The landmark roles themselves are covered in{' '}
          <a href="/accessibility/semantic">Semantic HTML &amp; Landmarks</a>.
        </p>
      </InfoBox>

      <h2>Headings Describe Structure, Not Size</h2>
      <p>
        The single most load-bearing rule in this lesson: heading level means{' '}
        <em>depth in the outline</em>. It has nothing to do with how big the text is —
        that is <code>font-size</code>&apos;s job.
      </p>

      <CodeBlock language="html" title="The two ways to get headings wrong">
{`<!-- WRONG: level chosen for appearance. A screen-reader user navigating
     by heading now hears a structure that does not exist, and skipped
     levels read as "something is missing here". -->
<h1>Dashboard</h1>
<h4>Recent activity</h4>        <!-- jumped h1 -> h4 for smaller text -->
<h3>Today</h3>                  <!-- and back UP again -->

<!-- WRONG: styled text pretending to be a heading. Invisible to
     heading navigation entirely. -->
<p class="section-title" style="font-size:1.5rem;font-weight:700">Settings</p>

<!-- RIGHT: levels follow nesting, CSS controls size. -->
<h1>Dashboard</h1>
  <h2>Recent activity</h2>
    <h3>Today</h3>
    <h3>Yesterday</h3>
  <h2>Settings</h2>`}
      </CodeBlock>

      <InfoBox variant="tip" title="One h1, and it is not negotiable in a SPA">
        <p>
          One <code>&lt;h1&gt;</code> per rendered view, naming that view. In a
          single-page app the heading structure changes on navigation while the document
          stays put, so it is easy to end up with a route whose <code>h1</code> is still
          the shell&apos;s app name and whose real title is an <code>h2</code>. Each route
          component should own its own <code>h1</code>.
        </p>
      </InfoBox>

      <h2>Text-Level Elements Worth Knowing</h2>
      <p>
        The ones with a real meaning, and the ones they get confused with:
      </p>

      <CodeBlock language="html" title="Pairs that look identical and are not">
{`<!-- Emphasis vs italics -->
<em>really</em>      <!-- stress emphasis; a screen reader may change tone -->
<i>Felis catus</i>   <!-- "offset" text: a taxonomic name, a foreign phrase -->

<!-- Importance vs bold -->
<strong>Warning</strong>  <!-- strong importance -->
<b>Acme Corp</b>          <!-- draws the eye, carries NO importance -->

<!-- Code and output -->
<code>npm install</code>  <!-- a fragment of code -->
<kbd>Cmd</kbd>+<kbd>K</kbd>  <!-- keys the user presses -->
<samp>Error: ENOENT</samp>   <!-- output from a program -->
<pre><code>…</code></pre>    <!-- a BLOCK of code: pre keeps whitespace -->

<!-- Quotes -->
<q>inline quote</q>                       <!-- browser adds the quote marks -->
<blockquote cite="https://…">block</blockquote>

<!-- Time, machine-readable -->
<time datetime="2026-10-16">last Thursday</time>

<!-- Abbreviations and edits -->
<abbr title="Cumulative Layout Shift">CLS</abbr>
<del>$40</del> <ins>$30</ins>

<!-- The one that is purely visual and that is fine -->
<span>no meaning at all, by design</span>`}
      </CodeBlock>

      <InfoBox variant="note" title="b and i are not deprecated — they were redefined">
        <p>
          You will read that <code>&lt;b&gt;</code> and <code>&lt;i&gt;</code> are
          obsolete. They are not; HTML5 redefined them to mean &quot;bold/italic
          <em>presentation</em> with no added importance&quot;, which is a real thing to
          need — a ship name, a brand, a term being introduced.{' '}
          <code>&lt;em&gt;</code> and <code>&lt;strong&gt;</code> are the ones that carry
          meaning. Reaching for the right pair costs nothing and the distinction shows up
          the first time something is read aloud.
        </p>
      </InfoBox>

      <h2>Lists, Properly</h2>
      <CodeBlock language="html" title="Three kinds, and the one people forget exists">
{`<ul>  <!-- order does not matter -->
  <li>Tabs</li>
  <li>Spaces</li>
</ul>

<ol start="3" reversed>  <!-- order matters; both attributes are real -->
  <li>Third</li>
</ol>

<dl>  <!-- description list: the forgotten one. Perfect for key/value
           display, which otherwise gets built out of divs. -->
  <dt>Status</dt>
  <dd>Paid</dd>
  <dt>Due</dt>
  <dd><time datetime="2026-11-01">1 Nov 2026</time></dd>
</dl>

<!-- Only <li>, <script> and <template> may be direct children of a
     ul/ol. A <div> wrapper between ul and li is invalid, and the
     parser will move it — see the parser lesson. -->`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why a list is not just styling">
        <p>
          A screen reader announces &quot;list, 7 items&quot; and lets the user jump the
          whole thing. Seven <code>&lt;div&gt;</code>s announce nothing and cannot be
          skipped. This is the clearest small example of the whole lesson: the semantic
          version carries information the visual version only implies.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
