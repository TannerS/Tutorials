import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Patterns() {
  return (
    <LessonLayout
      title="Layout Patterns & Recipes"
      sectionId="css-mastery"
      lessonIndex={10}
      prev={{ path: '/css-mastery/style-inclusion', label: 'Style-Inclusion Methods' }}
      next={{ path: '/css-mastery/field-guide', label: '📋 CSS Field Guide' }}
    >
      <p>
        Battle-tested layout patterns you can drop into any project. Each recipe includes
        complete CSS + HTML and an explanation of <em>why</em> it works.
        Bookmark this page — it&apos;s your CSS recipe book.
      </p>

      <FlowChart
        title="Pattern Selection Guide"
        chart={"graph TD\nA[Need a Layout?] --> B{Full Page?}\nB -->|Yes| C{Sidebar?}\nC -->|Yes| D[Holy Grail / Dashboard]\nC -->|No| E[Full-Bleed / Sticky Header]\nB -->|No| F{Repeating Items?}\nF -->|Yes| G[Card Grid / Pricing Table]\nF -->|No| H{Overlay?}\nH -->|Yes| I[Modal / Toast]\nH -->|No| J[Aspect Ratio / Truncation]"}
      />

      {/* ───── 1. Holy Grail ───── */}
      <h2>1. Holy Grail Layout</h2>
      <p>Header / left-sidebar / content / right-sidebar / footer via <code>grid-template-areas</code>.</p>
      <CodeBlock language="css" title="Holy Grail — CSS">
{`.holy-grail {
  display: grid;
  grid-template-areas:
    "header  header  header"
    "left    content right"
    "footer  footer  footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;   /* dvh, not vh — see the Responsive lesson */
}
.holy-grail > header { grid-area: header; }
.holy-grail > .left  { grid-area: left; }
.holy-grail > main   { grid-area: content; }
.holy-grail > .right { grid-area: right; }
.holy-grail > footer { grid-area: footer; }`}
      </CodeBlock>
      <CodeBlock language="html" title="Holy Grail — HTML">
{`<div class="holy-grail">
  <header>Header</header>
  <aside class="left">Left</aside>
  <main>Content</main>
  <aside class="right">Right</aside>
  <footer>Footer</footer>
</div>`}
      </CodeBlock>
      <p><strong>Why it works:</strong> Named areas map to the visual layout. <code>1fr</code> absorbs remaining space so sidebars stay fixed.</p>

      {/* ───── 2. Dashboard Grid ───── */}
      <h2>2. Dashboard Grid with Sidebar</h2>
      <p>Fixed sidebar + fluid auto-wrapping card grid.</p>
      <CodeBlock language="css" title="Dashboard — CSS">
{`.dashboard {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100dvh;
}
.dash-sidebar {
  position: sticky; top: 0; height: 100dvh;
  overflow-y: auto; background: #1e293b; color: #f8fafc;
}
.dash-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem; padding: 1.5rem; align-content: start;
}`}
      </CodeBlock>
      <CodeBlock language="html" title="Dashboard — HTML">
{`<div class="dashboard">
  <nav class="dash-sidebar">Nav</nav>
  <section class="dash-content">
    <div class="card">Widget 1</div>
    <div class="card">Widget 2</div>
  </section>
</div>`}
      </CodeBlock>
      <p><strong>Why it works:</strong> The 240 px column is fixed; <code>1fr</code> gives all remaining space to the content grid which auto-wraps children.</p>

      {/* ───── 3. Card Grid ───── */}
      <h2>3. Card Grid (No Media Queries)</h2>
      <p>Responsive equal-height cards using <code>auto-fit</code> + <code>minmax</code>.</p>
      <CodeBlock language="css" title="Card Grid — CSS">
{`.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}
.card-grid .card {
  display: flex; flex-direction: column;
  border-radius: 8px; background: #fff;
  box-shadow: 0 1px 3px rgb(0 0 0 / .12); overflow: hidden;
}
.card-grid .card > .body  { flex: 1; padding: 1rem; }
.card-grid .card > .footer { padding: 1rem; border-top: 1px solid #e2e8f0; }`}
      </CodeBlock>
      <CodeBlock language="html" title="Card Grid — HTML">
{`<div class="card-grid">
  <article class="card">
    <img src="thumb.jpg" alt="" />
    <div class="body"><h3>Title</h3><p>Desc</p></div>
    <div class="footer"><button>Action</button></div>
  </article>
  <!-- repeat cards -->
</div>`}
      </CodeBlock>
      <p><strong>Why it works:</strong> <code>auto-fit</code> creates as many 260 px+ columns as fit; flex-column on each card pushes the footer down.</p>

      <InfoBox variant="tip" title="auto-fit vs auto-fill">
        <code>auto-fit</code> collapses empty tracks so cards stretch. <code>auto-fill</code> keeps empty tracks, leaving whitespace. Prefer <code>auto-fit</code> for card grids.
      </InfoBox>

      {/* ───── 4. Sticky Header ───── */}
      <h2>4. Sticky Header with Scrollable Content</h2>
      <CodeBlock language="css" title="Sticky Header — CSS">
{`.sticky-header {
  position: sticky; top: 0; z-index: 100;
  background: #fff; box-shadow: 0 1px 3px rgb(0 0 0 / .1);
}
.page-content { max-width: 72rem; margin: 0 auto; padding: 2rem; }`}
      </CodeBlock>
      <CodeBlock language="html" title="Sticky Header — HTML">
{`<header class="sticky-header">Nav Bar</header>
<main class="page-content"><!-- scrollable content --></main>`}
      </CodeBlock>
      <p><strong>Why it works:</strong> <code>position: sticky</code> keeps the element in flow but pins it at <code>top: 0</code> on scroll. No JS needed.</p>

      <InfoBox variant="warning" title="Sticky Gotcha: overflow">
        A sticky element sticks within its <strong>nearest scrolling ancestor</strong>, not
        necessarily the viewport — and that&apos;s the whole gotcha. Give an ancestor{' '}
        <code>overflow: hidden</code> or <code>clip</code> and that ancestor becomes the scroll
        container, but it can never actually scroll, so the element has no scroll to react to and
        appears to do nothing. (It is still <code>position: sticky</code>; it never computes back to{' '}
        <code>static</code>.) By contrast <code>overflow: auto</code> or <code>scroll</code> on an
        ancestor doesn&apos;t break anything — the element simply sticks inside <em>that</em> box
        instead of the page, which is exactly how sticky table headers inside a scrollable panel are
        built. So the rule is: if sticky &quot;does nothing,&quot; walk up the ancestor chain looking
        for <code>overflow: hidden</code>/<code>clip</code>, and remember a sticky element can also
        never escape its own parent&apos;s box.
      </InfoBox>

      {/* ───── 5. Collapsible Sidebar ───── */}
      <h2>5. Sidebar that Collapses on Mobile</h2>
      <p>Desktop sidebar becomes a horizontal nav strip on small screens.</p>
      <CodeBlock language="css" title="Collapsible Sidebar — CSS">
{`.app-layout {
  display: grid; grid-template-columns: 240px 1fr; min-height: 100dvh;
}
.app-sidebar { background: #1e293b; color: #f8fafc; padding: 1rem; }

@media (max-width: 768px) {
  .app-layout { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .app-sidebar {
    display: flex; gap: 1rem; overflow-x: auto;
    white-space: nowrap; padding: 0.5rem 1rem;
  }
}`}
      </CodeBlock>
      <CodeBlock language="html" title="Collapsible Sidebar — HTML">
{`<div class="app-layout">
  <nav class="app-sidebar"><a href="#">Home</a><a href="#">Settings</a></nav>
  <main>Content</main>
</div>`}
      </CodeBlock>
      <p><strong>Why it works:</strong> Above 768 px the grid has two columns; below it collapses to one and the sidebar becomes a scrollable horizontal strip.</p>

      {/* ───── 6. Modal Overlay ───── */}
      <h2>6. Modal Overlay Centered</h2>
      <CodeBlock language="css" title="Modal — CSS">
{`.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  display: grid; place-items: center;
  background: rgb(0 0 0 / .5);
}
.modal {
  background: #fff; border-radius: 12px; padding: 2rem;
  width: min(90vw, 500px); max-height: 85vh; overflow-y: auto;
  box-shadow: 0 25px 50px rgb(0 0 0 / .25);
}`}
      </CodeBlock>
      <CodeBlock language="html" title="Modal — HTML">
{`<div class="modal-backdrop">
  <div class="modal" role="dialog" aria-modal="true">
    <h2>Title</h2><p>Content here.</p><button>Close</button>
  </div>
</div>`}
      </CodeBlock>
      <p><strong>Why it works:</strong> <code>place-items: center</code> on a grid centers the child on both axes. <code>min(90vw, 500px)</code> keeps it responsive.</p>

      {/* ───── 7. Toast Notifications ───── */}
      <h2>7. Toast Notification Positioning</h2>
      <CodeBlock language="css" title="Toasts — CSS">
{`.toast-container {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 2000;
  display: flex; flex-direction: column-reverse; gap: 0.75rem;
  pointer-events: none;
}
.toast {
  pointer-events: auto; background: #1e293b; color: #f8fafc;
  padding: 0.75rem 1.25rem; border-radius: 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / .15);
  animation: slide-in 0.3s ease-out;
}
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}`}
      </CodeBlock>
      <CodeBlock language="html" title="Toasts — HTML">
{`<div class="toast-container" aria-live="polite">
  <div class="toast">File saved successfully.</div>
  <div class="toast">New message received.</div>
</div>`}
      </CodeBlock>
      <p><strong>Why it works:</strong> <code>column-reverse</code> stacks newest toasts at the bottom. <code>pointer-events: none</code> on the container lets clicks through; each toast re-enables them.</p>

      {/* ───── 8. Aspect Ratio ───── */}
      <h2>8. Aspect Ratio Media Containers</h2>
      <CodeBlock language="css" title="Aspect Ratio — CSS">
{`.video-container {
  aspect-ratio: 16 / 9; width: 100%;
  background: #000; border-radius: 8px; overflow: hidden;
}
.video-container > iframe,
.video-container > video { width: 100%; height: 100%; object-fit: cover; }
.thumb-square { aspect-ratio: 1; object-fit: cover; border-radius: 8px; }`}
      </CodeBlock>
      <CodeBlock language="html" title="Aspect Ratio — HTML">
{`<div class="video-container">
  <iframe src="https://www.youtube.com/embed/ID" allowfullscreen></iframe>
</div>
<img class="thumb-square" src="photo.jpg" alt="Profile" />`}
      </CodeBlock>
      <p><strong>Why it works:</strong> <code>aspect-ratio</code> sets an intrinsic ratio; the browser calculates height from width automatically. Supported in all evergreen browsers since 2021.</p>

      <InfoBox variant="info" title="Legacy Aspect Ratio Fallback">
        For older browsers, use the padding-top hack: <code>padding-top: 56.25%</code> for 16:9, with an absolutely positioned child filling the container.
      </InfoBox>

      {/* ───── 9. Truncated Text ───── */}
      <h2>9. Truncated Text</h2>
      <p>Single-line ellipsis and multi-line clamping.</p>
      <CodeBlock language="css" title="Text Truncation — CSS">
{`/* Single-line ellipsis */
.truncate {
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
/* Multi-line clamp */
.line-clamp-2 {
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.line-clamp-3 {
  display: -webkit-box; -webkit-line-clamp: 3;
  -webkit-box-orient: vertical; overflow: hidden;
}`}
      </CodeBlock>
      <CodeBlock language="html" title="Text Truncation — HTML">
{`<p class="truncate">Long single-line text gets an ellipsis...</p>
<p class="line-clamp-2">This paragraph truncates after two lines
  with an ellipsis at the end of the second line.</p>`}
      </CodeBlock>
      <p><strong>Why it works:</strong> Single-line needs all three properties. Multi-line uses the legacy <code>-webkit-box</code> spec, now supported in all browsers despite the prefix.</p>

      {/* ───── 10. Custom Scrollbar ───── */}
      <h2>10. Custom Scrollbar Styling</h2>
      <CodeBlock language="css" title="Custom Scrollbar — CSS">
{`/* STANDARD properties — now supported by Firefox, Chromium AND Safari.
   Reach for these first; they are all most projects need. */
.custom-scroll { scrollbar-width: thin; scrollbar-color: #94a3b8 #f1f5f9; }

/* Legacy WebKit pseudo-elements — only for finer control than the two
   standard properties allow (hover states, custom thumb radius, arrows). */
.custom-scroll::-webkit-scrollbar { width: 8px; }
.custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background: #64748b; }`}
      </CodeBlock>
      <CodeBlock language="html" title="Custom Scrollbar — HTML">
{`<div class="custom-scroll" style="max-height: 300px; overflow-y: auto;">
  <!-- scrollable content -->
</div>`}
      </CodeBlock>
      <p><strong>Why it works:</strong> <code>scrollbar-width</code> and <code>scrollbar-color</code> are the standardised properties and are the ones to reach for by default — Firefox has had them for years, Chromium shipped them in 121 and Safari in 18.2, so the &quot;these are the Firefox-only ones&quot; framing you&apos;ll still find in older articles is out of date. The <code>::-webkit-scrollbar</code> pseudo-elements remain useful only when you need finer control than <code>thin</code> plus two colours gives you, and they have never been on a standards track.</p>

      {/* ───── 11. Full-Bleed ───── */}
      <h2>11. Full-Bleed Layout</h2>
      <p>Break a child out of a constrained parent to span the full viewport.</p>
      <CodeBlock language="css" title="Full-Bleed — CSS">
{`.wrapper { max-width: 65ch; margin-inline: auto; padding-inline: 1.5rem; }
.full-bleed { width: 100vw; margin-left: calc(50% - 50vw); }`}
      </CodeBlock>
      <CodeBlock language="html" title="Full-Bleed — HTML">
{`<div class="wrapper">
  <p>Constrained paragraph.</p>
  <div class="full-bleed">
    <img src="hero.jpg" alt="Hero" style="width:100%" />
  </div>
  <p>Back to constrained width.</p>
</div>`}
      </CodeBlock>
      <p><strong>Why it works:</strong> <code>calc(50% - 50vw)</code> shifts the element left to the viewport edge, then <code>100vw</code> stretches it across.</p>

      <InfoBox variant="warning" title="100vw includes the scrollbar">
        <code>100vw</code> is the width of the viewport <em>including</em> a classic (non-overlay)
        scrollbar gutter, while <code>50%</code> resolves against the content box, which excludes it.
        On any desktop browser showing a permanent scrollbar the element therefore ends up ~15px too
        wide and triggers a horizontal scrollbar of its own — the single most common complaint about
        this recipe. Reaching for <code>overflow-x: hidden</code> on the body is the usual patch, but
        it silently breaks <code>position: sticky</code> further down the page (per the gotcha
        above). The robust fix drops viewport units entirely and lets a grid do the measuring:
        <CodeBlock language="css" title="Scrollbar-safe full-bleed — the grid breakout">
{`.wrapper {
  display: grid;
  grid-template-columns: 1fr min(65ch, 100%) 1fr;
}
.wrapper > * { grid-column: 2; }        /* content sits in the middle track */
.full-bleed  { grid-column: 1 / -1; }   /* this one spans all three */

/* No vw anywhere, so the scrollbar can't skew it: the side tracks are
   just whatever 1fr of the CONTENT width happens to be. */`}
        </CodeBlock>
      </InfoBox>

      {/* ───── 12. Pricing Table ───── */}
      <h2>12. Pricing Table Layout</h2>
      <p>Responsive pricing cards with a highlighted &quot;featured&quot; option.</p>
      <CodeBlock language="css" title="Pricing Table — CSS">
{`.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem; padding: 2rem; align-items: start;
}
.pricing-card {
  display: flex; flex-direction: column; text-align: center;
  border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 2rem; background: #fff; transition: transform 0.2s;
}
.pricing-card.featured {
  border-color: #6366f1; transform: scale(1.05);
  box-shadow: 0 8px 30px rgb(99 102 241 / .2); position: relative;
}
.pricing-card.featured::before {
  content: "Most Popular"; position: absolute; top: -14px; left: 50%;
  transform: translateX(-50%); background: #6366f1; color: #fff;
  padding: 0.25rem 1rem; border-radius: 999px; font-size: 0.8rem;
}
.pricing-card .price { font-size: 2.5rem; font-weight: 700; margin: 1rem 0; }
.pricing-card ul { list-style: none; padding: 0; text-align: left; }
.pricing-card ul li::before { content: "\\2713\\0020"; color: #22c55e; font-weight: 700; }
.pricing-card .cta {
  margin-top: auto; padding: 0.75rem 1.5rem; border: none;
  border-radius: 8px; background: #6366f1; color: #fff; cursor: pointer;
}`}
      </CodeBlock>
      <CodeBlock language="html" title="Pricing Table — HTML">
{`<div class="pricing-grid">
  <div class="pricing-card">
    <h3>Starter</h3>
    <div class="price">$9<span>/mo</span></div>
    <ul><li>5 Projects</li><li>10 GB Storage</li></ul>
    <button class="cta">Get Started</button>
  </div>
  <div class="pricing-card featured">
    <h3>Pro</h3>
    <div class="price">$29<span>/mo</span></div>
    <ul><li>Unlimited Projects</li><li>100 GB Storage</li><li>Priority Support</li></ul>
    <button class="cta">Get Started</button>
  </div>
  <div class="pricing-card">
    <h3>Enterprise</h3>
    <div class="price">$99<span>/mo</span></div>
    <ul><li>Everything in Pro</li><li>SSO &amp; Audit Logs</li></ul>
    <button class="cta">Contact Sales</button>
  </div>
</div>`}
      </CodeBlock>
      <p><strong>Why it works:</strong> <code>auto-fit</code> + <code>minmax</code> handles responsiveness. The featured card uses <code>scale(1.05)</code> and a <code>::before</code> badge to draw attention without extra markup.</p>

      <InfoBox variant="tip" title="Accessible Pricing Cards">
        Add <code>aria-label</code> to each CTA (e.g., <code>aria-label=&quot;Get started with Pro plan&quot;</code>) so screen readers can distinguish identical &quot;Get Started&quot; buttons.
      </InfoBox>
    </LessonLayout>
  );
}
