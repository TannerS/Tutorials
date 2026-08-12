import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideCssTokens() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="CSS · Field Reference"
      title="Design Tokens & Style Inclusion"
      tagline="Carbon-style token tiers, naming, theming — plus a head-to-head on how styles actually ship to the browser."
      meta={['Token Architecture', '12 references']}
      footerLabel="Personal study reference — Tokens & Delivery"
      pageLabel="CSS Field Guide · Tokens & Style Inclusion"
      prev={{ path: '/css-field-guide/sass', label: 'Sass Essentials' }}
      next={null}
    >
      <PosterCard
        glyph="T1"
        title={<>Tier 1<span className="dim"> — Primitive Tokens</span></>}
        language="css"
        code={`:root {
  --blue-60: #4589ff;
  --gray-100: #161616;
  --gray-10: #f4f4f4;
}
/* raw values, NO meaning attached — never referenced from components */`}
        caption="A palette, not a decision. Only earns its keep once multiple semantic tokens need to share (and later re-derive from) the exact same raw value."
      />

      <PosterCard
        glyph="T2"
        title={<>Tier 2<span className="dim"> — Semantic Tokens</span></>}
        language="css"
        code={`:root {
  --background: var(--gray-10);
  --text-primary: var(--gray-100);
  --link-primary: var(--blue-60);
}
/* THIS is the layer components should actually consume */`}
        caption="Named by intent (--text-primary), not appearance (--gray-900) — this is the real API of a token system. Redefining what a color means never requires touching component code."
      />

      <PosterCard
        glyph="T3"
        title={<>Tier 3<span className="dim"> — Component Tokens</span></>}
        language="css"
        code={`.button {
  --button-color-primary: var(--link-primary);
  background: var(--button-color-primary);
}
/* narrow, scoped to ONE component, sourced from the semantic tier */`}
        caption="Rarely sources straight from primitives — going through the semantic tier keeps a single redefinition point. This site's --syn-keyword family (CodeBlock's syntax colors) is a real example of this tier."
      />

      <PosterCard
        glyph="Nm"
        title={<>Naming<span className="dim"> — category-first, then role</span></>}
        language="css"
        code={`--bg-primary    --bg-secondary    --bg-card       /* sorts & scans together */
--accent-blue   --accent-blue-bg                   /* [category]-[role]-[variant] */

--cds-background        /* Carbon: prefix + category, avoids collisions
--cds-text-primary          when the token system ships to OTHER apps  */`}
        caption="Carbon prefixes every token (--cds-*) because it's distributed to host apps that own their own CSS. A single-page site can skip the prefix since it owns the whole document — the category-first ordering is the convention worth keeping regardless."
      />

      <PosterCard
        glyph="Fb"
        title={<>Fallback Chains<span className="dim"> — var()'s second argument</span></>}
        language="css"
        code={`.button {
  background: var(--btn-bg, var(--color-primary, #6366f1));
}
/* everything after the FIRST comma is the fallback — nest them
   for a component library with optional consumer-supplied tokens */`}
        caption="Consumers who never set --btn-bg fall through to --color-primary; consumers who never set either get the hardcoded default. This is how token-based component libraries stay themeable without requiring every token to be defined."
      />

      <PosterCard
        glyph="Th"
        title={<>Theme Redefinition<span className="dim"> — same names, new values</span></>}
        language="css"
        code={`:root { --bg-primary: #0f1117; --text-primary: #e4e6f0; }

:root[data-theme="light"] {
  --bg-primary: #f6f7fa;   /* SAME token name, different value */
  --text-primary: #14161f;
}
/* every var(--bg-primary) reference repaints automatically —
   zero component CSS changes needed */`}
        caption="This is the entire payoff of the semantic tier: a theme switch is nothing but redeclaring the same names under a different selector. No component file has to know dark mode exists."
      />

      <PosterCard
        glyph="Tg"
        title={<>Theme Toggle<span className="dim"> — the JS side</span></>}
        language="tsx"
        code={`useEffect(() => {
  document.documentElement.dataset.theme = theme; // "light" | "dark"
  localStorage.setItem('site-theme', theme);
}, [theme]);`}
        caption={<>The entire runtime theming mechanism is one attribute write — <code>dataset.theme = &apos;light&apos;</code> flips the <code>[data-theme=&quot;light&quot;]</code> selector on, which the CSS above is already listening for.</>}
      />

      <PosterCard
        glyph="@p"
        title={<>@property<span className="dim"> — typed tokens, animatable</span></>}
        language="css"
        code={`@property --gradient-angle {
  syntax: "<angle>"; initial-value: 0deg; inherits: false;
}
.border { transition: --gradient-angle 0.6s ease; }
/* without @property, custom props are opaque STRINGS —
   the browser can't interpolate "0deg" toward "180deg" */`}
        caption="Registering a token's type is what unlocks smooth animation of custom properties — angle, color, and number tokens can transition natively once declared, gradients and glows included."
      />

      <PosterCard
        glyph="Lk"
        title={<>&lt;link&gt; Stylesheet</>}
        language="html"
        code={`<link rel="stylesheet" href="/app.a3f9c1.css" />
/* Bundle: smallest.  SSR: N/A, always correct.
   Theming: custom-props only.  Runtime cost: ZERO. */`}
        caption="The fastest path to first paint and the cheapest at runtime — the tradeoff is zero automatic scoping, so class collisions are avoided only by naming discipline (BEM, etc.), not by the tool."
      />

      <PosterCard
        glyph="Md"
        title={<>CSS Modules<span className="dim"> vs CSS-in-JS</span></>}
        language="tsx"
        code={`import styles from './Button.module.css';
<button className={styles.button} />
// hashed at BUILD time — zero runtime cost, real scoping

const Button = styled.button\`background: \${p => p.theme.primary};\`;
// styles generated in the BROWSER as props change — real ongoing cost`}
        caption="CSS Modules hash class names once at build time — same near-zero runtime profile as plain CSS. Runtime CSS-in-JS trades that for full JS-driven theming logic, at the cost of client-side style generation on every relevant render."
      />

      <PosterCard
        glyph="Is"
        title={<>Inline style<span className="dim"> Prop — this site's actual choice</span></>}
        language="tsx"
        code={`<div style={{ background: 'var(--bg-card)', borderRadius: 8 }} />
/* SSR-safe with zero extraction step. Reads live tokens fine.
   Can't express :hover or media queries without a JS handler. */`}
        caption="Every component in this codebase (InfoBox, LessonLayout, PosterCard) uses this pattern — SSR-safety and no build step, paired with custom properties for theming, at the cost of giving up cascade/pseudo-class ergonomics it doesn't need for a single-owner site."
      />

      <PosterQuickRef
        title="Token & delivery quick reference"
        rows={[
          { need: 'Where do raw hex values live?', answer: 'Primitive tier (rarely — often inlined for small projects)' },
          { need: 'What should components actually reference?', answer: 'Semantic tier tokens, named by intent' },
          { need: 'How does dark mode actually work?', answer: 'Redeclare the same token names under [data-theme]' },
          { need: 'How does the toggle button work?', answer: 'One line: documentElement.dataset.theme = next' },
          { need: 'Make a custom property animatable', answer: '@property with a typed syntax descriptor' },
          { need: 'Lowest runtime cost style delivery', answer: '<link> stylesheet or CSS Modules (both build-time)' },
          { need: 'Best DX for JS-driven dynamic theming', answer: 'CSS-in-JS — at a real, ongoing runtime cost' },
          { need: 'Best fit for a single-owner SSR-safe app', answer: 'Inline style + CSS custom properties (this site)' },
        ]}
      />
    </PosterLayout>
  );
}
