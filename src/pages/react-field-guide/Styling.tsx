import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideStyling() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React 19 · Field Reference"
      title="Styling Approaches"
      tagline="CSS Modules, CSS-in-JS, Tailwind, inline styles, and custom properties — how each wires into a component, and which one actually fits the job."
      meta={['React 19', '12 approaches']}
      footerLabel="Personal study reference — React 19"
      pageLabel="React 19 Field Guide · Styling"
      prev={{ path: '/react-field-guide/component-patterns', label: 'Component Patterns' }}
      next={{ path: '/react-field-guide/state-management', label: 'State Management' }}
    >
      <PosterCard
        glyph="CM"
        title={<>CSS Modules<span className="dim"> — scoped by default</span></>}
        language="tsx"
        code={`/* Button.module.css */
.button { padding: 8px 16px; border-radius: 6px; }
.primary { background: var(--color-primary); }

// Button.tsx
import styles from './Button.module.css';

function Button({ variant = 'primary' }) {
  return <button className={\`\${styles.button} \${styles[variant]}\`}>Save</button>;
}
// Compiled class names are hashed: "Button_button__a1b2c" — no collisions ever`}
        caption="Each .module.css file is scoped to the component that imports it — the build tool hashes class names so 'button' in two files never collides. Zero runtime cost since it compiles to plain CSS at build time."
      />

      <PosterCard
        glyph="Cx"
        title={<>composes<span className="dim"> — sharing rules between modules</span></>}
        language="css"
        code={`/* base.module.css */
.resetButton { border: none; background: none; cursor: pointer; }

/* IconButton.module.css */
.iconButton {
  composes: resetButton from './base.module.css';
  padding: 4px;
}
/* className={styles.iconButton} applies BOTH rule sets */`}
        caption="composes lets one module class inherit another module's rules without duplicating CSS or reaching for a preprocessor — the two class names are both applied to the element at build time."
      />

      <PosterCard
        glyph="SC"
        title={<>CSS-in-JS <span className="dim">— styled-components</span></>}
        language="tsx"
        code={`import styled from 'styled-components';

const Button = styled.button<{ $variant: 'primary' | 'ghost' }>\`
  padding: 8px 16px;
  border-radius: 6px;
  background: \${p => (p.$variant === 'primary' ? '#6366f1' : 'transparent')};
\`;

<Button $variant="primary">Save</Button>
// Props prefixed with $ are "transient" — consumed by styled-components,
// never forwarded to the underlying DOM element`}
        caption="Styles live next to the component as tagged template literals, with full access to props for dynamic values — no separate CSS file, no className string-building. Ships a runtime that generates and injects styles at render time."
      />

      <PosterCard
        glyph="Em"
        title={<>CSS-in-JS <span className="dim">— Emotion's css prop</span></>}
        language="tsx"
        code={`/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

function Card({ elevated }: { elevated: boolean }) {
  return (
    <div css={css\`
      padding: 1rem;
      box-shadow: \${elevated ? '0 4px 12px rgba(0,0,0,.15)' : 'none'};
    \`}>
      Content
    </div>
  );
}`}
        caption="Emotion's css prop skips creating a named component just to apply conditional styles — useful for one-off dynamic styling where styled-components' extra component layer is overkill."
      />

      <PosterCard
        glyph="Tw"
        title={<>Tailwind <span className="dim">— utility classes in JSX</span></>}
        language="tsx"
        code={`function Button({ variant }: { variant: 'primary' | 'ghost' }) {
  return (
    <button
      className={\`px-4 py-2 rounded-md \${
        variant === 'primary' ? 'bg-indigo-500 text-white' : 'bg-transparent'
      }\`}
    >
      Save
    </button>
  );
}
// No CSS file, no naming — the class list IS the style declaration`}
        caption="Styling lives entirely in the className string — there's no separate stylesheet to keep in sync and no naming to invent. The tradeoff is verbose JSX and a build step (PostCSS/Vite plugin) that purges unused classes for production."
      />

      <PosterCard
        glyph="cl"
        title={<>clsx<span className="dim"> — conditional className, done right</span></>}
        code={`import clsx from 'clsx';

function Button({ variant, isLoading, className }) {
  return (
    <button
      className={clsx(
        'btn',
        variant === 'primary' && 'btn-primary',
        isLoading && 'btn-loading',
        className, // caller can still extend/override
      )}
    >
      Save
    </button>
  );
}
// clsx skips falsy values automatically — no manual filter/join`}
        caption="Template-literal className strings get unreadable past 2-3 conditions. clsx (or the older classnames) takes any mix of strings, objects, and falsy values and joins only the truthy ones — pairs naturally with both CSS Modules and Tailwind."
      />

      <PosterCard
        glyph="St"
        title={<>Inline Styles <span className="dim">— the style prop</span></>}
        code={`function ProgressBar({ percent }: { percent: number }) {
  // Truly dynamic, per-instance value — computed from data, not a fixed variant
  return (
    <div style={{ width: '100%', background: '#eee' }}>
      <div style={{ width: \`\${percent}%\`, height: 8, background: '#6366f1' }} />
    </div>
  );
}
// ❌ Don't use style for anything that's just a variant — that's what
// className/CSS Modules/Tailwind classes are for`}
        caption="Reach for the style prop only when the value is computed at runtime and can't be expressed as a fixed set of classes — a measured width, a drag position, a chart bar's height. It skips the cascade entirely and can't use pseudo-classes or media queries."
      />

      <PosterCard
        glyph="Vr"
        title={<>Custom Properties <span className="dim">for Theming</span></>}
        code={`/* Three-layer tokens — primitives feed semantic aliases */
:root {
  --indigo-500: #6366f1;
  --color-primary: var(--indigo-500);   /* semantic layer */
}
[data-theme="dark"] { --color-primary: #818cf8; }

// React only ever toggles the attribute — every component
// consuming var(--color-primary) updates with zero re-renders
function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
}`}
        caption="Custom properties live in the CSSOM, not React state — flipping a data-theme attribute restyles the entire app instantly with no component re-renders, because every var() reference resolves live in the browser."
      />

      <PosterCard
        glyph="JS"
        title="Reading/Writing Custom Properties From React"
        code={`// Read a computed custom property value
const styles = getComputedStyle(document.documentElement);
const primary = styles.getPropertyValue('--color-primary').trim();

// Write one dynamically — e.g. a user-picked accent color
function setAccent(hex: string) {
  document.documentElement.style.setProperty('--color-accent', hex);
}
// Combine with useEffect to sync a React state value into CSS:
useEffect(() => {
  document.documentElement.style.setProperty('--sidebar-width', \`\${width}px\`);
}, [width]);`}
        caption="Custom properties are the bridge between React state and the CSS cascade — set one from an effect and every descendant using var() picks it up without prop-drilling the value through the component tree."
      />

      <PosterCard
        glyph="Ts"
        title="Typing Style Props"
        code={`interface CardProps {
  title: string;
  style?: React.CSSProperties;   // the style prop's type
  className?: string;
}

function Card({ title, style, className }: CardProps) {
  return <div className={className} style={style}>{title}</div>;
}
// CSS custom properties need a cast — CSSProperties doesn't know about them
const dynamicStyle = { '--bar-width': \`\${percent}%\` } as React.CSSProperties;`}
        caption="React.CSSProperties is the built-in type for the style prop. It doesn't include custom property names by TypeScript's design — cast the object when you need to set a --custom-property inline."
      />

      <PosterCard
        glyph="Rt"
        title="Runtime Cost — What Actually Ships"
        language="text"
        code={`CSS Modules      Zero runtime. Compiles to plain .css at build time.
Tailwind         Zero runtime. Purged utility CSS at build time.
styled-components Runtime style injection — parses template
                  literals and injects <style> tags as it renders.
Emotion           Same runtime category, generally faster than
                  styled-components; also offers a zero-runtime
                  compiler mode.
Inline styles     Zero build step, but no cascade, no pseudo-
                  classes/media queries, and a new object every
                  render unless memoized.`}
        caption="CSS Modules and Tailwind resolve entirely at build time — nothing left for the browser to compute. Classic CSS-in-JS libraries do real work on every render to generate and inject styles, which shows up in profiling on style-heavy pages."
      />

      <PosterCard
        glyph="Gl"
        title="Global Styles & Resets"
        language="tsx"
        code={`// main.tsx — imported once, applies app-wide
import './index.css'; // resets, :root tokens, base typography

// A component-scoped file should almost never touch global selectors —
// keep body/html/* rules in the one global entry point
// so there's a single place to look for anything app-wide.`}
        caption="Mixing global selectors into component-scoped files (even CSS Modules, via :global()) makes styling bugs hard to trace — keep exactly one global stylesheet imported at the app root for resets and design tokens."
      />

      <PosterQuickRef
        title="Which styling approach do I need?"
        rows={[
          { need: 'New project, want zero runtime cost', answer: 'CSS Modules or Tailwind' },
          { need: 'Rapid prototyping, no context-switching to CSS files', answer: 'Tailwind' },
          { need: 'Highly dynamic per-prop styling, component library', answer: 'CSS-in-JS (styled-components/Emotion)' },
          { need: 'One-off truly runtime-computed value (drag position, chart bar)', answer: 'style prop (inline)' },
          { need: 'App-wide theming / dark mode', answer: 'CSS custom properties + data attribute' },
          { need: 'Multiple conditional classes on one element', answer: 'clsx (or classnames)' },
          { need: 'Sharing base rules between component styles', answer: 'CSS Modules composes' },
          { need: 'Team already has strong opinions either way', answer: 'Match the existing codebase — consistency beats preference' },
        ]}
      />
    </PosterLayout>
  );
}
