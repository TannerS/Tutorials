import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Responsive() {
  return (
    <LessonLayout
      title="Responsive Design"
      sectionId="css-mastery"
      lessonIndex={2}
      prev={{ path: '/css-mastery/grid', label: 'CSS Grid Complete Guide' }}
      next={{ path: '/css-mastery/animations', label: 'Animations & Transitions' }}
    >
      <p>Responsive design in 2024+ goes far beyond media queries. Container queries, fluid typography, dynamic viewport units, and logical properties have fundamentally changed how we build adaptive layouts. This is the modern toolkit every senior engineer should have internalized.</p>

      <h2>Mobile-First vs Desktop-First</h2>

      <p>Mobile-first means writing your base CSS for the smallest viewport, then layering on complexity with <code>min-width</code> media queries. Desktop-first does the inverse with <code>max-width</code>. Mobile-first wins for three reasons:</p>

      <p><strong>1. Progressive Enhancement:</strong> Your base styles work everywhere — even on devices you haven&apos;t tested. Desktop styles are additive layers, not subtractive patches. If a media query fails to load, users still get a usable layout.</p>
      <p><strong>2. Performance:</strong> Mobile devices download only the CSS they need. Desktop overrides add styles; they don&apos;t undo them. With desktop-first, mobiles download heavy desktop styles then override them — wasted bytes on the most constrained devices.</p>
      <p><strong>3. Simpler Overrides:</strong> Adding a grid column or sidebar is easier than collapsing one. Mobile-first CSS tends to be shorter because you&apos;re building up rather than tearing down.</p>

      <CodeBlock language="css" title="Mobile-First vs Desktop-First">
{`/* ✅ MOBILE-FIRST — base styles are mobile, add complexity upward */
.nav { display: flex; flex-direction: column; }

@media (min-width: 768px) {
  .nav { flex-direction: row; gap: 2rem; }
}

@media (min-width: 1200px) {
  .nav { max-width: 1400px; margin-inline: auto; }
}

/* ❌ DESKTOP-FIRST — base styles are desktop, strip down for mobile */
.nav { display: flex; gap: 2rem; max-width: 1400px; margin-inline: auto; }

@media (max-width: 1199px) {
  .nav { max-width: none; }
}

@media (max-width: 767px) {
  .nav { flex-direction: column; gap: 0; }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="When Desktop-First Makes Sense">
        <p>If your app is <strong>primarily used on desktop</strong> (admin dashboards, internal tools), desktop-first can be pragmatic. The key is consistency — pick one strategy and use it throughout. Mixing min-width and max-width queries leads to specificity nightmares.</p>
      </InfoBox>

      <h2>Media Queries — The Full Picture</h2>

      <CodeBlock language="css" title="Media Query Patterns">
{`/* Range queries (min/max) */
@media (min-width: 768px) { /* tablets and up */ }
@media (max-width: 767px) { /* mobile only */ }

/* Combined range — targeting a specific band */
@media (min-width: 768px) and (max-width: 1023px) {
  /* tablets only */
}

/* Modern range syntax (Level 4) — cleaner than min/max */
@media (width >= 768px) { /* tablets and up */ }
@media (768px <= width <= 1023px) { /* tablets only */ }

/* User preference queries */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a2e;
    --text: #e0e0e0;
    --accent: #64ffda;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Hover capability — critical for touch vs pointer devices */
@media (hover: hover) {
  .card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,.15); }
}

@media (hover: none) {
  /* Touch devices — use active states instead */
  .card:active { transform: scale(0.98); }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="The hover: hover Trap">
        <p>Many devs forget that laptops with touchscreens report <code>hover: hover</code>. The hover query detects the <strong>primary</strong> input capability. For truly robust code, pair it with <code>@media (pointer: fine)</code> to target precise pointers (mice) vs coarse ones (fingers).</p>
      </InfoBox>

      <h2>Breakpoint Strategy</h2>

      <CodeBlock language="css" title="Practical Breakpoint System">
{`/* Breakpoint tokens — content-driven, not device-driven */
:root {
  --bp-sm: 640px;   /* Large phones in landscape */
  --bp-md: 768px;   /* Tablets portrait */
  --bp-lg: 1024px;  /* Tablets landscape / small laptops */
  --bp-xl: 1280px;  /* Desktops */
  --bp-2xl: 1536px; /* Large displays */
}

/* Usage (CSS custom properties can't go in @media, so use the values) */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }

/* Pro tip: add a content-specific breakpoint when your layout breaks,
   not when a popular device happens to be that size. The best breakpoint
   is the one where YOUR content stops looking good. */`}
      </CodeBlock>

      <h2>Container Queries — The Game Changer</h2>

      <p>Media queries ask &quot;how wide is the <em>viewport</em>?&quot; Container queries ask &quot;how wide is my <em>parent</em>?&quot; This is revolutionary for component-based architectures where the same card component lives in a sidebar, a main content area, and a full-width hero — each needing different layouts regardless of screen size.</p>

      <CodeBlock language="css" title="Container Query Fundamentals">
{`/* Step 1: Establish a containment context */
.card-grid {
  container-type: inline-size; /* Track inline (width) dimension */
  container-name: card-wrapper; /* Optional: name for targeting */
}

/* Shorthand */
.card-grid {
  container: card-wrapper / inline-size;
}

/* Step 2: Query the container, not the viewport */
@container card-wrapper (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 1rem;
  }
}

@container card-wrapper (min-width: 700px) {
  .card {
    grid-template-columns: 250px 1fr auto;
  }
  .card__actions { align-self: center; }
}

/* Unnamed container queries — matches nearest ancestor with containment */
@container (min-width: 500px) {
  .widget { flex-direction: row; }
}`}
      </CodeBlock>

      <CodeBlock language="html" title="Container Query HTML Structure">
{`<div class="sidebar card-grid">
  <!-- Cards adapt to sidebar width, not viewport -->
  <article class="card">
    <img class="card__image" src="thumb.jpg" alt="...">
    <div class="card__body">
      <h3>Article Title</h3>
      <p>Preview text...</p>
    </div>
    <div class="card__actions">
      <button>Read More</button>
    </div>
  </article>
</div>`}
      </CodeBlock>

      <InfoBox variant="info" title="container-type Values">
        <p><strong>inline-size</strong> — containment on the inline axis only (width in horizontal writing modes). This is what you want 95% of the time.</p>
        <p><strong>size</strong> — containment on both axes. Rarely needed and more expensive; requires the element to have an explicit size on both axes.</p>
        <p><strong>normal</strong> — no containment (default). The element can&apos;t be queried.</p>
      </InfoBox>

      <h2>Viewport Units — The Mobile Trap</h2>

      <p>On mobile browsers, <code>100vh</code> famously doesn&apos;t equal the visible viewport because it ignores the dynamic toolbar (URL bar, bottom nav). The new dynamic viewport units fix this:</p>

      <CodeBlock language="css" title="Dynamic Viewport Units">
{`/* Classic units — broken on mobile */
.hero { height: 100vh; } /* Includes space behind browser chrome */

/* Dynamic viewport units */
.hero { height: 100dvh; } /* Adjusts as toolbar shows/hides */

/* Small viewport height — toolbar visible (smallest viewport) */
.hero { height: 100svh; }

/* Large viewport height — toolbar hidden (largest viewport) */
.hero { height: 100lvh; }

/* Practical pattern: use dvh for full-screen sections */
.full-screen {
  min-height: 100dvh;
  display: grid;
  place-items: center;
}

/* Use svh when you need guaranteed visibility (e.g., above the fold) */
.above-fold-cta {
  min-height: 100svh; /* Always fully visible, even with toolbar */
}`}
      </CodeBlock>

      <h2>Fluid Typography with clamp()</h2>

      <p>Before <code>clamp()</code>, fluid type meant stacking media queries at every breakpoint. Now a single line scales text smoothly between a minimum and maximum size, proportional to viewport width.</p>

      <CodeBlock language="css" title="Fluid Typography">
{`/* The formula: clamp(MIN, PREFERRED, MAX)
   PREFERRED is typically a viewport-relative value
   Common formula: clamp(minRem, viewportScalar + baseRem, maxRem) */

h1 {
  /* Scales from 2rem to 4rem fluidly */
  font-size: clamp(2rem, 1rem + 3vw, 4rem);
}

h2 {
  font-size: clamp(1.5rem, 0.75rem + 2.5vw, 3rem);
}

p {
  /* Body text: subtle scaling, narrow range */
  font-size: clamp(1rem, 0.925rem + 0.5vw, 1.25rem);
  line-height: clamp(1.5, 1.4 + 0.3vw, 1.8);
}

/* Full responsive type scale */
:root {
  --text-xs:  clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm:  clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
  --text-base: clamp(1rem, 0.925rem + 0.5vw, 1.25rem);
  --text-lg:  clamp(1.125rem, 0.95rem + 0.75vw, 1.5rem);
  --text-xl:  clamp(1.25rem, 1rem + 1vw, 2rem);
  --text-2xl: clamp(1.5rem, 1rem + 2vw, 2.5rem);
  --text-3xl: clamp(2rem, 1rem + 3vw, 4rem);
}

/* Fluid spacing too — same concept */
.section {
  padding-block: clamp(2rem, 1rem + 4vw, 6rem);
}`}
      </CodeBlock>

      <h2>Responsive Images</h2>

      <p>There are two distinct problems: <strong>resolution switching</strong> (same image, different sizes for performance) and <strong>art direction</strong> (different crops/compositions at different viewports). Use <code>srcset</code>/<code>sizes</code> for the first, <code>&lt;picture&gt;</code> for the second.</p>

      <CodeBlock language="html" title="Resolution Switching with srcset/sizes">
{`<!-- Resolution switching: browser picks best size -->
<img
  srcset="hero-400.jpg 400w,
          hero-800.jpg 800w,
          hero-1200.jpg 1200w,
          hero-1600.jpg 1600w"
  sizes="(min-width: 1200px) 1200px,
         (min-width: 768px) 90vw,
         100vw"
  src="hero-800.jpg"
  alt="Mountain landscape at sunset"
  loading="lazy"
  decoding="async"
>`}
      </CodeBlock>

      <CodeBlock language="html" title="Art Direction with picture Element">
{`<!-- Art direction: different images at different viewports -->
<picture>
  <!-- Wide crop for desktop -->
  <source
    media="(min-width: 1024px)"
    srcset="hero-wide-1200.webp 1200w, hero-wide-1800.webp 1800w"
    sizes="100vw"
    type="image/webp"
  >
  <!-- Square crop for tablet -->
  <source
    media="(min-width: 640px)"
    srcset="hero-square-600.webp 600w, hero-square-900.webp 900w"
    sizes="80vw"
    type="image/webp"
  >
  <!-- Tall crop for mobile — subject is centered and larger -->
  <source
    srcset="hero-tall-400.webp 400w, hero-tall-600.webp 600w"
    sizes="100vw"
    type="image/webp"
  >
  <!-- Fallback -->
  <img src="hero-wide-1200.jpg" alt="Product showcase" loading="lazy">
</picture>`}
      </CodeBlock>

      <h2>The aspect-ratio Property</h2>

      <p>Before <code>aspect-ratio</code>, we used the padding-bottom hack (<code>padding-bottom: 56.25%</code> for 16:9). That was fragile, required a wrapper, and broke with content inside. Now it&apos;s one line:</p>

      <CodeBlock language="css" title="aspect-ratio Replaces the Padding Hack">
{`/* Modern: clean and semantic */
.video-embed {
  aspect-ratio: 16 / 9;
  width: 100%;
}

.square-avatar {
  aspect-ratio: 1;        /* Shorthand for 1 / 1 */
  width: 3rem;
  border-radius: 50%;
  object-fit: cover;
}

/* Responsive card images that maintain ratio */
.card__image {
  aspect-ratio: 4 / 3;
  width: 100%;
  object-fit: cover;      /* Crop to fill without distortion */
}

/* ❌ OLD: The padding-bottom hack (don't use this anymore) */
.video-wrapper {
  position: relative;
  padding-bottom: 56.25%; /* 9/16 = 0.5625 */
  height: 0;
}
.video-wrapper iframe {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}`}
      </CodeBlock>

      <h2>Logical Properties</h2>

      <p>Physical properties like <code>margin-left</code> break in RTL layouts. Logical properties use <code>inline</code> (the text-flow direction) and <code>block</code> (perpendicular to text flow) instead, making your CSS internationalization-ready by default.</p>

      <CodeBlock language="css" title="Logical Properties Reference">
{`/* Physical → Logical mapping */
/* margin-left/right → margin-inline-start/end or margin-inline (shorthand) */
/* margin-top/bottom → margin-block-start/end or margin-block (shorthand) */
/* padding-left/right → padding-inline */
/* width → inline-size */
/* height → block-size */
/* top → inset-block-start */
/* border-left → border-inline-start */

/* Practical usage */
.sidebar {
  inline-size: 280px;          /* width in LTR, still correct in RTL */
  padding-inline: 1.5rem;      /* left+right padding */
  padding-block: 2rem 1rem;    /* top=2rem, bottom=1rem */
  margin-inline-end: 2rem;     /* right margin in LTR, left in RTL */
  border-inline-start: 3px solid var(--accent);
}

.modal {
  inset: 0;                    /* top:0; right:0; bottom:0; left:0 */
  max-inline-size: 600px;      /* max-width */
  max-block-size: 80dvh;       /* max-height */
  margin-inline: auto;         /* center horizontally */
}

/* Text alignment too */
.pull-quote {
  text-align: start;           /* left in LTR, right in RTL */
  float: inline-end;           /* float right in LTR */
}`}
      </CodeBlock>

      <h2>Responsive Patterns — Real-World Code</h2>

      <h3>Responsive Navigation</h3>

      <CodeBlock language="css" title="Mobile Hamburger → Desktop Horizontal Nav">
{`/* Base: mobile vertical nav, hidden behind toggle */
.nav { display: none; flex-direction: column; gap: 0; }
.nav.is-open { display: flex; }
.nav__toggle { display: block; }
.nav__link {
  display: block;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
}

/* Tablet+: horizontal nav, toggle hidden */
@media (min-width: 768px) {
  .nav {
    display: flex;
    flex-direction: row;
    gap: 1.5rem;
    align-items: center;
  }
  .nav__toggle { display: none; }
  .nav__link {
    padding: 0.5rem 0;
    border-bottom: none;
    position: relative;
  }
  .nav__link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    inset-inline: 0;
    height: 2px;
    background: var(--accent);
    transform: scaleX(0);
    transition: transform 0.2s ease;
  }
  .nav__link:hover::after { transform: scaleX(1); }
}`}
      </CodeBlock>

      <h3>Responsive Table</h3>

      <CodeBlock language="css" title="Table → Card Layout on Mobile">
{`/* Desktop: normal table */
.data-table { width: 100%; border-collapse: collapse; }
.data-table th,
.data-table td { padding: 0.75rem 1rem; text-align: start; }
.data-table thead { border-bottom: 2px solid var(--border); }

/* Mobile: each row becomes a card */
@media (max-width: 767px) {
  .data-table thead { display: none; }
  .data-table,
  .data-table tbody,
  .data-table tr,
  .data-table td { display: block; }

  .data-table tr {
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .data-table td {
    padding: 0.25rem 0;
    display: flex;
    justify-content: space-between;
  }
  /* Use data-label attr for row headers */
  .data-table td::before {
    content: attr(data-label);
    font-weight: 600;
    margin-inline-end: 1rem;
  }
}`}
      </CodeBlock>

      <CodeBlock language="html" title="Table HTML with data-label">
{`<table class="data-table">
  <thead>
    <tr><th>Name</th><th>Role</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Name">Alice Chen</td>
      <td data-label="Role">Senior Engineer</td>
      <td data-label="Status">Active</td>
    </tr>
  </tbody>
</table>`}
      </CodeBlock>

      <h3>Responsive Typography Scale</h3>

      <CodeBlock language="css" title="Complete Responsive Type System">
{`/* Modular scale that adapts fluidly */
:root {
  --scale-ratio: 1.2;  /* Minor third on mobile */
  --base-size: clamp(1rem, 0.925rem + 0.5vw, 1.125rem);
}

@media (min-width: 1024px) {
  :root { --scale-ratio: 1.25; } /* Major third on desktop */
}

body { font-size: var(--base-size); line-height: 1.6; }

h1 { font-size: clamp(2rem, 1.25rem + 3vw, 3.5rem); line-height: 1.1; }
h2 { font-size: clamp(1.5rem, 1rem + 2vw, 2.5rem); line-height: 1.2; }
h3 { font-size: clamp(1.25rem, 1rem + 1vw, 1.75rem); line-height: 1.3; }

/* Measure (line length) — critical for readability */
.prose {
  max-inline-size: 65ch;  /* 65 characters per line is optimal */
  margin-inline: auto;
}`}
      </CodeBlock>

      <FlowChart
        title="Responsive Design Strategy Decision Tree"
        chart={"graph TD\n  A[Does the component need to adapt?] -->|Yes| B[Based on what?]\n  A -->|No| C[Use fixed or intrinsic sizing]\n  B --> D[Viewport size]\n  B --> E[Parent container size]\n  B --> F[Content amount]\n  D --> G[Use media queries]\n  E --> H[Use container queries]\n  F --> I[Use intrinsic sizing - min/max/clamp]\n  G --> J[Need fluid scaling?]\n  J -->|Yes| K[Use clamp with vw units]\n  J -->|No| L[Use breakpoint steps]\n  H --> M[Set container-type on parent]\n  M --> N[Write @container rules on children]"}
      />

      <InteractiveChallenge
        question={"What is the key advantage of container queries over media queries for component-based architectures?"}
        options={[
          "Container queries have better browser support",
          "Components adapt to their parent's size, not the viewport, making them truly reusable in any layout context",
          "Container queries are faster to render than media queries",
          "Container queries support animation triggers"
        ]}
        correctIndex={1}
        explanation="Container queries let a component respond to how much space its parent gives it. A card in a 300px sidebar behaves differently than the same card in a 900px main area — without the component knowing anything about the viewport. This is the missing piece for truly portable UI components."
        language="css"
      />

      <InteractiveChallenge
        question={"Which viewport unit should you use for a full-screen hero section on mobile to avoid content being hidden behind browser chrome?"}
        options={[
          "100vh — the classic viewport height",
          "100svh — small viewport height",
          "100dvh — dynamic viewport height",
          "100lvh — large viewport height"
        ]}
        correctIndex={2}
        explanation="100dvh (dynamic viewport height) adjusts as the mobile browser toolbar shows and hides, giving you the actual visible area at any moment. 100vh includes space behind the toolbar. 100svh is the smallest possible viewport (toolbar visible), and 100lvh is the largest (toolbar hidden). For hero sections, dvh ensures the content fills exactly the visible area."
        language="css"
      />

      <InteractiveChallenge
        question={"What does clamp(1rem, 0.5rem + 2vw, 2.5rem) do for font-size?"}
        options={[
          "Sets font to exactly 2vw at all viewport sizes",
          "Sets font to 1rem on mobile and 2.5rem on desktop with no transition",
          "Fluidly scales the font between 1rem minimum and 2.5rem maximum, using the viewport-relative middle value",
          "Randomly picks a size between 1rem and 2.5rem"
        ]}
        correctIndex={2}
        explanation="clamp(MIN, PREFERRED, MAX) ensures the computed value never goes below MIN or above MAX. The middle value (0.5rem + 2vw) scales with the viewport. On a 320px viewport: 0.5rem + 6.4px ≈ 14.4px, clamped to 1rem (16px). On a 1920px viewport: 0.5rem + 38.4px ≈ 46.4px, clamped to 2.5rem (40px). In between, it scales fluidly."
        language="css"
      />

      <InfoBox variant="tip" title="Debugging Responsive Layouts">
        <p><strong>Outline everything:</strong> <code>* {'{'} outline: 1px solid red {'}'}</code> instantly reveals overflow, unexpected widths, and collapsed containers.</p>
        <p><strong>Container query debugging:</strong> Chrome DevTools shows a &quot;container&quot; badge on elements with containment. Click it to see the container&apos;s dimensions and which <code>@container</code> rules are active.</p>
        <p><strong>Test real devices:</strong> DevTools device simulation doesn&apos;t replicate mobile browser chrome behavior (the <code>100vh</code> bug), touch event timing, or actual rendering performance. Test on real phones.</p>
      </InfoBox>
    </LessonLayout>
  );
}
