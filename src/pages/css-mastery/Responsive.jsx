import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function CSSResponsive() {
  return (
    <LessonLayout
      title="Responsive Design"
      sectionId="css-mastery"
      lessonIndex={2}
      prev={{ path: "/css-mastery/grid", label: "Grid" }}
      next={{ path: "/css-mastery/animations", label: "Animations" }}
    >
      <p>
        Responsive design makes websites work beautifully on every screen size — from a 320px
        phone to a 4K monitor. Modern CSS gives you powerful tools: fluid layouts, container
        queries, clamp(), and logical properties.
      </p>

      <FlowChart
        title="Mobile-First Responsive Strategy"
        chart={"graph TD\n  A[Start: mobile styles] --> B[Base CSS for 320px+]\n  B --> C[sm: min-width 640px]\n  C --> D[md: min-width 768px]\n  D --> E[lg: min-width 1024px]\n  E --> F[xl: min-width 1280px]\n  B --> G[Fluid: clamp + fr + %]\n  G --> H[Container queries for component scope]\n  H --> I[No media query needed for card grid]"}
      />

      <CodeBlock language="css" title="Mobile-First Breakpoints and Media Queries">
{`/* === MOBILE-FIRST: base styles target the smallest screen === */
/* Then use min-width queries to layer on complexity */

/* Common breakpoint scale (matches Tailwind CSS) */
/* xs:  320px  — small phones */
/* sm:  640px  — large phones / small tablets */
/* md:  768px  — tablets */
/* lg:  1024px — laptops */
/* xl:  1280px — desktops */
/* 2xl: 1536px — large desktops */

/* Container — responsive max-width with mobile padding */
.container {
  width: 100%;
  padding: 0 1rem;
  margin: 0 auto;
}
@media (min-width: 640px)  { .container { max-width: 640px;  padding: 0 1.5rem; } }
@media (min-width: 768px)  { .container { max-width: 768px; } }
@media (min-width: 1024px) { .container { max-width: 1024px; padding: 0 2rem; } }
@media (min-width: 1280px) { .container { max-width: 1280px; } }

/* Responsive navigation */
.nav-links { display: none; }          /* hidden on mobile */
@media (min-width: 768px) {
  .nav-links { display: flex; gap: 2rem; } /* visible on tablet+ */
  .hamburger { display: none; }            /* hide toggle button */
}

/* Responsive grid of cards */
.cards {
  display: grid;
  grid-template-columns: 1fr;          /* 1 column on mobile */
  gap: 1rem;
}
@media (min-width: 640px)  { .cards { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .cards { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1280px) { .cards { grid-template-columns: repeat(4, 1fr); } }

/* MEDIA QUERY SYNTAX — all features */
@media screen and (min-width: 768px) { }          /* screen only */
@media (min-width: 768px) and (max-width: 1024px) { } /* range */
@media print { }                                   /* print styles */
@media (orientation: landscape) { }               /* landscape mode */
@media (hover: hover) { }                          /* has hover capability */
@media (pointer: coarse) { }                       /* touch — increase tap targets */
@media (prefers-color-scheme: dark) { }            /* dark mode */
@media (prefers-reduced-motion: reduce) { }        /* motion sensitivity */
@media (prefers-contrast: high) { }               /* high contrast mode */

/* Modern range syntax (Chrome 113+, Firefox 63+) */
@media (768px <= width <= 1024px) { }             /* more readable range */`}
      </CodeBlock>

      <CodeBlock language="css" title="Container Queries — Component-Scoped Responsiveness">
{`/* Container queries respond to the PARENT element's size, not the viewport */
/* This lets components adapt based on where they are placed, not screen width */

/* 1. Mark the parent as a container */
.card-grid   { container-type: inline-size; container-name: grid; }
.sidebar     { container-type: inline-size; container-name: sidebar; }

/* 2. Query the container size inside child components */
.card {
  display: flex;
  flex-direction: column;   /* stacked by default (narrow context) */
}
@container (min-width: 400px) {
  .card {
    flex-direction: row;    /* side-by-side when container is wide enough */
    align-items: center;
  }
  .card-image { width: 120px; flex-shrink: 0; }
}
@container (min-width: 600px) {
  .card { gap: 2rem; }
  .card-image { width: 200px; }
}

/* Query a named container specifically */
@container sidebar (min-width: 300px) {
  .widget { font-size: 1.125rem; }
}

/* Container query units (cqw, cqh, cqi, cqb, cqmin, cqmax) */
.responsive-text {
  font-size: clamp(0.875rem, 3cqi, 1.25rem); /* scales with container width */
}

/* Why container queries beat media queries for components:
   - A card looks right whether it is in a 3-col grid OR a sidebar
   - No more @media hacks just because a component moved to a different location
   - Components become truly portable */`}
      </CodeBlock>

      <CodeBlock language="css" title="clamp(), Fluid Typography, and Viewport Units">
{`/* clamp(min, preferred, max) — fluid values without breakpoints */
/* preferred: a relative value that scales with the viewport */

/* Fluid typography */
h1 { font-size: clamp(1.75rem, 5vw + 1rem, 3.5rem); }
h2 { font-size: clamp(1.5rem, 4vw + 0.5rem, 2.5rem); }
p  { font-size: clamp(1rem, 2vw + 0.5rem, 1.25rem); }

/* Fluid spacing */
.section { padding: clamp(2rem, 8vw, 6rem) 0; }
.card    { padding: clamp(1rem, 3vw, 2rem); }
.gap     { gap: clamp(1rem, 3vw, 2rem); }

/* === VIEWPORT UNITS === */
/* vw: 1% of viewport width     vh: 1% of viewport height */
/* svh: small viewport height   (excludes mobile browser chrome) */
/* dvh: dynamic viewport height (adjusts as browser chrome shows/hides) */
/* lvh: large viewport height   (maximum, as if chrome hidden) */

.hero  { min-height: 100svh; }  /* won't be too tall on mobile */
.modal { max-height: 80dvh; }   /* adjusts when address bar appears */
.sidebar { height: 100dvh; }    /* correct height on mobile Safari */

/* vmin / vmax */
.square { width: 50vmin; height: 50vmin; } /* fits in any orientation */

/* === ASPECT RATIO === */
.video-embed { aspect-ratio: 16 / 9; width: 100%; }
.avatar      { aspect-ratio: 1 / 1; border-radius: 50%; }
.card-image  { aspect-ratio: 4 / 3; object-fit: cover; width: 100%; }
.square-grid { aspect-ratio: 1; } /* automatically square */

/* === LOGICAL PROPERTIES — writing-mode and direction aware === */
/* Instead of left/right (physical), use inline/block (logical) */
.box {
  margin-inline: auto;        /* = margin-left + margin-right: auto */
  margin-block: 2rem;         /* = margin-top + margin-bottom: 2rem */
  padding-inline: 1.5rem;     /* horizontal padding */
  padding-block: 1rem;        /* vertical padding */
  inset-inline-start: 0;      /* = left in LTR, right in RTL */
  border-inline-end: 1px solid; /* right border in LTR, left in RTL */
}
/* Use logical properties for international sites — RTL languages work automatically */`}
      </CodeBlock>

      <CodeBlock language="css" title="Responsive Images — srcset, sizes, and picture">
{`/* Basic responsive image */
img { max-width: 100%; height: auto; }

/* srcset — browser picks best resolution */
<img
  src="hero-800.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1600.jpg 1600w"
  sizes="(min-width: 1024px) 50vw, 100vw"
  alt="Hero image"
  loading="lazy"
  decoding="async"
/>
/* sizes tells the browser: on screens >= 1024px the image takes 50vw,
   otherwise it takes 100vw. Browser picks from srcset accordingly. */

/* picture — art direction (different crops per screen size) */
<picture>
  <source media="(min-width: 1024px)" srcset="hero-wide.webp" type="image/webp" />
  <source media="(min-width: 1024px)" srcset="hero-wide.jpg" />
  <source srcset="hero-square.webp" type="image/webp" />
  <img src="hero-square.jpg" alt="Hero" />
</picture>

/* object-fit for images in fixed containers */
.thumbnail {
  width: 200px;
  height: 150px;
  object-fit: cover;      /* crop to fill — no distortion */
  object-position: center top; /* focus on top of image */
}

/* CSS Grid responsive WITHOUT any media queries */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
  gap: 1.5rem;
}
/* min(250px, 100%) prevents overflow on very small containers */`}
      </CodeBlock>

      <InteractiveChallenge
        question="What is the mobile-first approach and why is it preferred?"
        options={[
          "Design only for mobile and ignore desktop users",
          "Write base CSS targeting mobile screens, then use min-width media queries to progressively add styles for larger screens",
          "Use JavaScript to detect mobile devices and load different CSS files",
          "Create separate websites for mobile and desktop at different URLs"
        ]}
        correctIndex={1}
        explanation="Mobile-first means your default CSS targets the smallest screens (no media query needed — it applies everywhere), then min-width media queries layer on additional styles for larger screens. This ensures mobile devices download only the styles they need. It also forces good design thinking: if it matters enough to show on mobile, it matters everywhere. The alternative (desktop-first with max-width queries) often leads to 'fixing' mobile as an afterthought."
      />

      <InteractiveChallenge
        question="What does clamp(1rem, 4vw, 2rem) compute to on a 1000px wide viewport?"
        options={[
          "Always 1rem",
          "Always 2rem",
          "40px (4vw = 40px), clamped between 1rem (16px) and 2rem (32px), so 40px",
          "4vw = 40px, which is above the max of 2rem (32px), so the result is 32px"
        ]}
        correctIndex={3}
        explanation="clamp(min, preferred, max) returns the preferred value unless it falls outside the min-max range. At 1000px: 4vw = 40px. The max is 2rem = 32px. Since 40px > 32px, clamp returns 32px. At 600px: 4vw = 24px, which is between 16px and 32px, so it returns 24px. At 300px: 4vw = 12px < 16px minimum, so it returns 16px."
      />

      <InfoBox variant="tip" title="Responsive Without Media Queries">
        <p>
          Modern CSS can handle many responsive scenarios without any media queries:
        </p>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
          <li><code>repeat(auto-fill, minmax(250px, 1fr))</code> — grid that adds/removes columns automatically</li>
          <li><code>clamp(1rem, 4vw, 2rem)</code> — fluid values that scale with viewport</li>
          <li><code>flex-wrap: wrap</code> with <code>flex: 1 1 250px</code> — flexible wrapping rows</li>
          <li>Container queries — components adapt to their container, not the viewport</li>
        </ul>
        <p style={{ marginTop: '0.5rem' }}>
          Reach for media queries when you need specific layout changes at defined breakpoints,
          like switching a horizontal nav to a hamburger menu.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
