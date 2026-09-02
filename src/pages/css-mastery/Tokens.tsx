import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Tokens() {
  return (
    <LessonLayout
      title="Design Tokens & Theming Architecture"
      sectionId="css-mastery"
      lessonIndex={7}
      prev={{ path: '/css-mastery/sass', label: 'Sass & SCSS Fundamentals' }}
      next={{ path: '/css-mastery/design-system-tokens', label: 'Design System Tokens: A Carbon Deep Dive' }}
    >
      <p>
        A design token is a named, single source of truth for a design decision — a color, a spacing
        step, a font size — stored once and referenced everywhere instead of hand-copied. This is
        the discipline behind systems like IBM&apos;s{' '}
        <a href="https://carbondesignsystem.com" target="_blank" rel="noreferrer">Carbon Design System</a>{' '}
        and it&apos;s not academic: this very site runs a real, working token system in{' '}
        <code>src/styles/global.css</code>, and we&apos;ll dissect it directly rather than build a
        hypothetical example.
      </p>

      <h2>Three Tiers: Primitive → Semantic → Component</h2>
      <p>
        The Custom Properties &amp; Modern CSS lesson already introduced this exact primitive →
        semantic → component split, with a generic Indigo/gray example. What&apos;s new here: why
        the middle tier is the one actually worth naming carefully, and two examples grounded in a
        real system instead of a hypothetical one — how Carbon itself names its tokens, and how this
        very site&apos;s token file (<code>global.css</code>) collapses a tier under real constraints.
      </p>

      <CodeBlock language="css" title="The Three Tiers, Generically">
{`/* TIER 1 — Primitive/global tokens: raw values, no meaning attached.
   Never referenced directly from component CSS. */
:root {
  --blue-60: #4589ff;
  --gray-100: #161616;
  --gray-10: #f4f4f4;
}

/* TIER 2 — Semantic/alias tokens: map primitives to INTENT.
   This is the layer components should actually consume. */
:root {
  --background: var(--gray-10);
  --text-primary: var(--gray-100);
  --link-primary: var(--blue-60);
}

/* TIER 3 — Component tokens: narrow, scoped to one component,
   sourced from the semantic layer (rarely straight from primitives). */
.button {
  --button-color-primary: var(--link-primary);
  background: var(--button-color-primary);
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why the middle tier is the one that matters most">
        The primitive tier is a palette, not a design decision. The component tier is too narrow to
        reuse. The <strong>semantic tier is the actual API</strong> — it&apos;s what you name after
        intent (<code>--text-primary</code>, <code>--surface-danger</code>) rather than appearance
        (<code>--gray-900</code>, <code>--red-500</code>), so that redefining what &quot;danger&quot;
        looks like never requires touching a single component file.
      </InfoBox>

      <h2>Worked Example: This Site&apos;s Own Token System</h2>
      <p>
        <code>global.css</code> is a real, two-tier system rather than a textbook three-tier one, and
        it&apos;s instructive to see exactly where it collapses a tier and why that&apos;s a
        legitimate tradeoff for a project this size — not a mistake.
      </p>

      <CodeBlock language="css" title="From src/styles/global.css — Semantic Tier, Primitives Inlined">
{`:root {
  /* No separate --gray-900 / --gray-50 primitive layer exists here —
     hex values are written directly into the SEMANTIC names below.
     For a one-person site with one palette, that's a reasonable
     simplification: the primitive tier only earns its keep once
     multiple semantic tokens need to share (and later re-derive
     from) the exact same raw value. */
  --bg-primary: #0f1117;
  --bg-secondary: #161822;
  --bg-card: #1a1d2e;
  --text-primary: #e4e6f0;
  --text-secondary: #9399b2;
  --border-color: #2a2e42;
  --accent-blue: #5b9cf6;
  --accent-green: #4ade80;
  --radius: 8px;
}`}
      </CodeBlock>

      <p>
        Where this system <em>does</em> commit to intent-based naming — the actual point of the
        semantic tier — is in tokens like <code>--bg-card</code> vs <code>--bg-secondary</code>{' '}
        (two different dark shades, named by <em>where they&apos;re used</em>, not by their hex value)
        and the whole <code>--syn-*</code> family, which is a component-tier token set purpose-built
        for one consumer:
      </p>

      <CodeBlock language="css" title="Component-Tier Tokens — Scoped to CodeBlock's Syntax Highlighting">
{`--syn-keyword: #c792ea;
--syn-string: #c3e88d;
--syn-function: #82aaff;
--syn-number: #f78c6c;
--syn-comment: #6c7293;
--syn-property: #f07178;

/* consumed only by CodeBlock's Prism token classes: */
.site-code .token.keyword { color: var(--syn-keyword); }
.site-code .token.string  { color: var(--syn-string); }`}
      </CodeBlock>

      <InfoBox variant="note" title="A pragmatic middle ground: the retrofit comment">
        The <code>--accent-emerald</code> / <code>--accent-amber</code> / <code>--accent-blue-bg</code>{' '}
        block in <code>global.css</code> even has a comment explaining <em>why</em> those tokens
        exist: they cover ad-hoc inline accent colors used across lesson content that had no
        light-mode equivalent yet. That&apos;s a token system growing under real pressure — new
        tokens get added when a real light/dark gap is found, not speculatively upfront. Carbon&apos;s
        system is far larger because it serves many products; the tiering principle scales down to a
        two-tier, one-person site just as validly as it scales up.
      </InfoBox>

      <h2>Naming Conventions</h2>
      <p>
        Carbon prefixes every token with its namespace — <code>--cds-background</code>,{' '}
        <code>--cds-text-primary</code>, <code>--cds-spacing-05</code> — so tokens are unambiguous
        even when mixed with a host app&apos;s own CSS. This site skips a prefix (it owns the whole
        page, so there&apos;s no collision risk) but keeps Carbon&apos;s other core convention:{' '}
        <strong>category-first, then role</strong> — <code>--bg-primary</code>,{' '}
        <code>--bg-secondary</code>, <code>--bg-card</code> all sort and scan together, rather than{' '}
        <code>--primary-bg</code> scattered alphabetically away from <code>--card-bg</code>.
      </p>

      <CodeBlock language="css" title="Naming Pattern: [category]-[role]-[variant]">
{`--bg-primary       /* category: bg,   role: primary            */
--bg-secondary     /* category: bg,   role: secondary           */
--accent-blue      /* category: accent, role: blue (a named hue) */
--accent-blue-bg   /* category: accent, role: blue, variant: bg  */
--syn-keyword      /* category: syn (syntax-highlight), role: keyword */

/* Carbon's equivalent, namespaced for library distribution: */
--cds-background            /* prefix + category           */
--cds-text-primary          /* prefix + category + role     */
--cds-layer-01               /* prefix + category + numbered step */`}
      </CodeBlock>

      <h2>Light/Dark Theming via Token Redefinition</h2>
      <p>
        The Custom Properties &amp; Modern CSS lesson&apos;s Dark Mode Implementation section already
        covered the toggle mechanics in depth — the <code>:root[data-theme]</code> specificity trap,{' '}
        <code>prefers-color-scheme</code>, and <code>light-dark()</code>. This isn&apos;t a second pass
        at those mechanics; it&apos;s watching the payoff on the real file this site ships (
        <code>global.css</code> and <code>ThemeProvider.tsx</code>, not a hypothetical example), and why
        token discipline turns dark-mode correctness into a structural guarantee instead of something
        audited page by page.
      </p>
      <p>
        This is the entire payoff of putting values behind semantic names: a theme switch is nothing
        more than redeclaring the same token names under a different selector. No component CSS
        changes — every <code>var(--bg-primary)</code> reference across the whole app repaints
        automatically the instant the attribute flips.
      </p>

      <CodeBlock language="css" title="From global.css — The Actual Light-Mode Override Block">
{`:root {
  --bg-primary: #0f1117;    /* dark, the default */
  --text-primary: #e4e6f0;
  --accent-blue: #5b9cf6;
}

:root[data-theme="light"] {
  --bg-primary: #f6f7fa;    /* same NAME, different value */
  --text-primary: #14161f;
  --accent-blue: #2563eb;   /* darker blue — stays readable on a light bg */
}`}
      </CodeBlock>

      <CodeBlock language="tsx" title="From src/components/ThemeProvider.tsx — What Actually Flips the Attribute">
{`useEffect(() => {
  document.documentElement.dataset.theme = theme; // sets data-theme="light" | "dark"
  localStorage.setItem('site-theme', theme);
}, [theme]);`}
      </CodeBlock>

      <InfoBox variant="warning" title="Notice what ISN'T there">
        There is no per-component dark-mode CSS anywhere in this site&apos;s ~30 lesson pages. Every
        page, card, and code block only ever writes <code>var(--bg-card)</code>,{' '}
        <code>var(--text-primary)</code>, etc. Dark/light correctness is guaranteed structurally —
        by never letting a component reach past the semantic tier for a raw color — rather than
        audited page by page. That guarantee is the entire reason token tiers exist.
      </InfoBox>

      <h2>One Level Deeper: FlowChart Also Consumes These Tokens</h2>
      <p>
        The token discipline extends past plain CSS. <code>FlowChart.tsx</code> (the Mermaid diagram
        renderer used throughout these lessons) can&apos;t use <code>var(--accent-blue)</code>{' '}
        directly — Mermaid needs literal hex strings for its theme config — so it keeps a manually
        maintained <code>lightSwap</code> map that mirrors every dark hex in <code>global.css</code>{' '}
        to its light equivalent. It&apos;s a real illustration of a hard truth about tokens: any
        rendering pipeline that can&apos;t consume <code>var()</code> directly (canvas, SVG-string
        libraries, native mobile) has to re-encode the token mapping by hand, and that copy can drift
        from the source of truth if the CSS changes without updating it.
      </p>

      <FlowChart
        title="Token Tier Decision Guide"
        chart={"graph TD\n  V[New value needed in CSS] --> SHARED{Used by 2+ semantic tokens\\nor needs its own name in the palette?}\n  SHARED -->|Yes| PRIM[Primitive tier: --blue-60, --gray-100]\n  SHARED -->|No, one-off| SKIP[Skip primitive tier, go straight to semantic]\n  PRIM --> SEM[Semantic tier: --text-primary maps to primitive]\n  SKIP --> SEM\n  SEM --> SCOPE{Only ONE component will ever read it?}\n  SCOPE -->|Yes| COMP[Component tier: --button-color-primary]\n  SCOPE -->|No| USE[Components reference the semantic token directly]\n  style PRIM fill:#1a2744\n  style SEM fill:#1a3329\n  style COMP fill:#3d2f14"}
      />

    </LessonLayout>
  );
}
