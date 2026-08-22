import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function StyleInclusion() {
  return (
    <LessonLayout
      title="Style-Inclusion Methods"
      sectionId="css-mastery"
      lessonIndex={9}
      prev={{ path: '/css-mastery/design-system-tokens', label: 'Design System Tokens: A Carbon Deep Dive' }}
      next={{ path: '/css-mastery/patterns', label: 'Layout Patterns & Recipes' }}
    >
      <p>
        Every CSS/Sass/token technique in this section still has to reach the browser somehow. That
        delivery mechanism has real, measurable tradeoffs — bundle size, SSR behavior, runtime cost,
        dynamic theming, developer experience — and picking the wrong one for a project&apos;s shape
        is a common, expensive mistake. This lesson compares the five inclusion methods you&apos;ll
        actually encounter, head to head, with no &quot;it depends&quot; hand-waving where a real
        answer exists.
      </p>

      <h2>1. The &lt;link&gt; Stylesheet</h2>
      <p>
        The oldest method: a plain <code>.css</code> file, requested once, cached by the browser
        forever (with a hashed filename), parsed into the CSSOM before first paint.
      </p>

      <CodeBlock language="html" title="Plain <link> — Still the Fastest Path to First Paint">
{`<link rel="stylesheet" href="/assets/app.a3f9c1.css" />`}
      </CodeBlock>

      <InfoBox variant="info" title="<link> tradeoffs">
        <strong>Bundle size:</strong> one flat file, trivially cached across navigations — best case
        of all five. <strong>SSR:</strong> not a concept that applies; it&apos;s just a static asset,
        works identically with or without a server render. <strong>Dynamic theming:</strong> only via
        custom properties (see the previous lesson) — the file itself is static once shipped.{' '}
        <strong>DX:</strong> worst of the five — zero scoping, so class names collide project-wide
        unless you hand-discipline a naming convention (BEM, etc.).{' '}
        <strong>Runtime cost:</strong> zero — all the work happened at build time.
      </InfoBox>

      <h2>2. Sass @use Module Imports</h2>
      <p>
        Not a delivery mechanism on its own — Sass always compiles down to option 1, a plain{' '}
        <code>.css</code> file served via <code>&lt;link&gt;</code>. What it changes is the{' '}
        <em>authoring</em> experience: partials, mixins, and namespacing (covered last lesson) let
        you organize source across many files that still compile into that one flat, cacheable
        output.
      </p>

      <CodeBlock language="scss" title="Sass Compiles Away — the Runtime Story Is Identical to Plain <link>">
{`// src: many partials, @use'd and namespaced
@use 'tokens';
@use 'components/button';

/* output: one flat app.css, same as if you'd hand-written it —
   Sass adds ZERO runtime cost or bytes beyond what the CSS itself needs */`}
      </CodeBlock>

      <InfoBox variant="tip" title="Sass tradeoffs">
        Same runtime profile as plain <code>&lt;link&gt;</code> (because that&apos;s literally what
        it becomes) — the entire tradeoff is at build time and in DX. <strong>DX:</strong> big win
        over raw CSS — mixins, functions, partials, loops — but still no automatic scoping; you still
        need a naming convention or you&apos;re back to global collisions, just organized into nicer
        source files.
      </InfoBox>

      <h2>3. CSS Modules</h2>
      <p>
        Each <code>Button.module.css</code> file is processed at build time; every class name gets
        hashed to something locally unique (<code>.button_kX9f2</code>), and the mapping is exported
        as a JS object. This solves the global-namespace problem structurally instead of by
        convention.
      </p>

      <CodeBlock language="css" title="Button.module.css">
{`.button {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  background: var(--color-primary);
}
.danger { background: var(--color-danger); }`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Button.tsx — Import Resolves to Hashed Class Names">
{`import styles from './Button.module.css';

function Button({ danger }: { danger?: boolean }) {
  return (
    <button className={\`\${styles.button} \${danger ? styles.danger : ''}\`}>
      Click
    </button>
  );
}
// compiles to: <button class="button_kX9f2 danger_p1a03">`}
      </CodeBlock>

      <InfoBox variant="info" title="CSS Modules tradeoffs">
        <strong>Bundle size:</strong> still plain CSS extracted to a file at build time — same
        near-zero cost as <code>&lt;link&gt;</code>. <strong>SSR:</strong> fully static, no runtime
        style injection, so it&apos;s free of any server/client mismatch risk.{' '}
        <strong>Dynamic theming:</strong> works great through custom properties referenced inside the
        module (as above) — the hashing only touches class <em>names</em>, not values.{' '}
        <strong>DX:</strong> real scoping with zero runtime, but co-locating styles per-component
        means no truly global utility classes without an explicit <code>:global()</code> escape hatch.{' '}
        <strong>Runtime cost:</strong> zero — the hashing happens at build time, not in the browser.
      </InfoBox>

      <h2>4. styled-components / CSS-in-JS</h2>
      <p>
        Styles are written as tagged template literals (or object styles) directly in the component
        file, compiled to a stylesheet, and — for the classic runtime CSS-in-JS libraries — injected
        into a <code>&lt;style&gt;</code> tag by JavaScript as the component mounts.
      </p>

      <CodeBlock language="tsx" title="Runtime CSS-in-JS — styled-components">
{`const Button = styled.button<{ $danger?: boolean }>\`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: \${p => p.$danger ? p.theme.colors.danger : p.theme.colors.primary};
\`;

// theme prop can change at runtime — styles regenerate on the fly
<ThemeProvider theme={darkTheme}><Button $danger /></ThemeProvider>`}
      </CodeBlock>

      <InfoBox variant="warning" title="CSS-in-JS tradeoffs — the real cost is at runtime">
        <strong>Bundle size:</strong> the styling library itself ships to the client (tens of KB), on
        top of whatever CSS it generates. <strong>SSR:</strong> needs an explicit extraction step
        (collect styles server-side, inject a <code>&lt;style&gt;</code> block in the HTML) or users
        get a flash of unstyled content — this is a genuinely tricky integration, not a footnote.{' '}
        <strong>Dynamic theming:</strong> the best of all five — a theme object can drive styles with
        full JS logic, conditionals, computed values, no custom-property indirection required.{' '}
        <strong>DX:</strong> co-located styles and logic in one file, full JS expressiveness in your
        CSS. <strong>Runtime cost:</strong> real and non-trivial — style objects get serialized to
        CSS strings and injected into the DOM on the client, repeatedly, as props change; this is the
        actual reason the ecosystem has shifted toward build-time-extracted CSS-in-JS (vanilla-extract,
        Panda CSS, zero-runtime styled-components usage) and toward CSS Modules for anything
        performance-sensitive.
      </InfoBox>

      <h2>5. Inline Styles in React</h2>
      <p>
        The <code>style</code> prop, taking a plain JS object — no build step, no external file, no
        class name at all.
      </p>

      <CodeBlock language="tsx" title="Inline style Prop">
{`<div style={{
  padding: '1rem',
  background: isActive ? 'var(--accent-blue)' : 'var(--bg-card)',
  borderRadius: 8,
}}>
  Panel
</div>`}
      </CodeBlock>

      <InfoBox variant="info" title="Inline style tradeoffs">
        <strong>Bundle size:</strong> no separate CSS payload — the cost is folded into whatever JS
        already ships. <strong>SSR:</strong> trivially correct, renders identically server and client
        with no extraction step (this is exactly why this very site&apos;s components use it
        pervasively). <strong>Dynamic theming:</strong> works, but every dynamic value has to be
        computed in JS and re-applied on every render — no cascade, no inheritance, no{' '}
        <code>:hover</code>/<code>:focus</code> pseudo-classes at all without a JS event handler
        standing in for them. <strong>DX:</strong> fast to write for one-off, deeply dynamic values;
        painful for anything needing media queries, pseudo-selectors, or reuse across components.{' '}
        <strong>Runtime cost:</strong> a new style object is created every render (no caching across
        instances the way a stylesheet rule is shared), and the browser can&apos;t apply its normal
        CSS rule-matching/caching machinery to it.
      </InfoBox>

      <InfoBox variant="note" title="What this site actually does, and why">
        Every component here (<code>InfoBox</code>, <code>LessonLayout</code>, <code>CodeBlock</code>)
        uses inline <code>style</code> objects that read CSS custom properties —{' '}
        <code>{'background: \'var(--bg-card)\''}</code> — rather than CSS Modules or styled-components.
        For a single-owner project with no design-system consumers and no performance budget under
        real pressure, that combination gets SSR-safety and zero-build-step simplicity from inline
        styles while still getting themeable, cascade-free values from custom properties — it
        deliberately gives up cascade/pseudo-class ergonomics it doesn&apos;t need in exchange for not
        maintaining a CSS Modules build step across ~40 components.
      </InfoBox>

      <h2>Head-to-Head Comparison</h2>
      <CodeBlock language="text" title="Five Methods, Five Axes">
{`Method              Bundle    SSR risk       Dynamic theming        Runtime cost
─────────────────────────────────────────────────────────────────────────────
<link> stylesheet    lowest    none           custom-props only       zero
Sass (@use)          lowest    none           custom-props only       zero
CSS Modules          low       none           custom-props only       zero
CSS-in-JS (runtime)  highest   real risk      best (full JS logic)    real, ongoing
Inline style (React) folds     none           good (JS-computed)      per-render object`}
      </CodeBlock>

      <FlowChart
        title="Which Inclusion Method?"
        chart={"graph TD\n  Q[Styling this?] --> SHARED{Reused across many components?}\n  SHARED -->|Yes, static-ish| MOD[CSS Modules / Sass @use]\n  SHARED -->|No, one-off dynamic value| DYN{Needs :hover/media query?}\n  DYN -->|Yes| MOD\n  DYN -->|No, just computed JS values| INLINE[Inline style prop]\n  Q --> PERF{Perf-sensitive, high render frequency?}\n  PERF -->|Yes| MOD\n  PERF -->|No, DX / full theme logic matters more| CIJ[CSS-in-JS]\n  style MOD fill:#10b981,color:#fff\n  style INLINE fill:#6366f1,color:#fff\n  style CIJ fill:#f59e0b,color:#000"}
      />

      <InteractiveChallenge
        question={"Why does runtime CSS-in-JS (like classic styled-components) carry ongoing runtime cost that CSS Modules doesn't?"}
        options={[
          "CSS-in-JS files are larger to download over the network",
          "CSS Modules use a different CSS syntax that parses faster",
          "CSS Modules hash class names and extract styles to a static file at BUILD time; runtime CSS-in-JS serializes style objects to CSS strings and injects them into the DOM on the CLIENT, repeatedly, as props/theme change",
          "Runtime CSS-in-JS doesn't support the cascade at all"
        ]}
        correctIndex={2}
        explanation={"CSS Modules' hashing and extraction happen once, at build time — the browser just gets a normal stylesheet. Runtime CSS-in-JS libraries generate and inject styles in the browser as components mount and props change, which is real ongoing JS work on every affected render, not a one-time build cost."}
        language="tsx"
      />

      <InteractiveChallenge
        question={"Why can inline React styles safely use var(--accent-blue) for theming, but can't express a :hover state the same way a stylesheet rule can?"}
        options={[
          "var() doesn't work inside the style prop at all",
          "The style prop reads a live custom property fine (it's just a runtime CSSOM value), but pseudo-classes like :hover aren't expressible as a JS object property — they require an actual CSS rule or a JS event handler standing in for the interaction state",
          ":hover only works with class selectors, never inline styles, for any value",
          "Custom properties can't be read from JavaScript"
        ]}
        correctIndex={1}
        explanation={"The style prop maps directly to an element's inline style declaration, which var() resolves against the CSSOM just fine — the limitation is structural: there's no way to write '&:hover' as a plain JS style object key. You'd need onMouseEnter/onMouseLeave to toggle state and recompute the style object, standing in for what a stylesheet's :hover selector gets for free."}
        language="tsx"
      />
    </LessonLayout>
  );
}
