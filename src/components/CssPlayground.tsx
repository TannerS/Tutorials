import { useMemo, useState } from 'react';

interface Snippet {
  id: string;
  title: string;
  html: string;
  css: string;
}

const SNIPPETS: Snippet[] = [
  {
    id: 'flex-center',
    title: 'Flexbox — centering anything',
    html: `<div class="stage">
  <div class="card">
    <h2>Perfectly centered</h2>
    <p>Three lines of flexbox, both axes.</p>
  </div>
</div>`,
    css: `.stage {
  display: flex;
  align-items: center;      /* vertical */
  justify-content: center;  /* horizontal */
  min-height: 260px;
  background: #f1f5f9;
  border-radius: 12px;
}

.card {
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  text-align: center;
}

.card h2 { margin: 0 0 0.4rem; font-size: 1.1rem; }
.card p  { margin: 0; color: #64748b; font-size: 0.9rem; }`,
  },
  {
    id: 'grid-layout',
    title: 'CSS Grid — a page layout',
    html: `<div class="layout">
  <header>header</header>
  <nav>nav</nav>
  <main>main content</main>
  <aside>aside</aside>
  <footer>footer</footer>
</div>`,
    css: `.layout {
  display: grid;
  grid-template-columns: 120px 1fr 120px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  gap: 8px;
  min-height: 300px;
  font-family: system-ui, sans-serif;
}

header { grid-area: header; background: #6366f1; }
nav    { grid-area: nav;    background: #22c55e; }
main   { grid-area: main;   background: #0ea5e9; }
aside  { grid-area: aside;  background: #f59e0b; }
footer { grid-area: footer; background: #64748b; }

.layout > * {
  color: white;
  display: grid;
  place-items: center;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}`,
  },
  {
    id: 'animation',
    title: 'Transitions & keyframe animation',
    html: `<div class="wrap">
  <div class="pulse"></div>
  <button class="grow">Hover me</button>
  <div class="track"><div class="runner"></div></div>
</div>`,
    css: `.wrap {
  display: grid;
  gap: 1.5rem;
  justify-items: center;
  padding: 2rem;
  font-family: system-ui, sans-serif;
}

/* 1. Keyframe animation — runs on its own, forever */
@keyframes pulse {
  0%, 100% { transform: scale(1);   opacity: 1;   }
  50%      { transform: scale(1.4); opacity: 0.4; }
}
.pulse {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #ec4899;
  animation: pulse 1.6s ease-in-out infinite;
}

/* 2. Transition — interpolates only when a property changes */
.grow {
  padding: 0.7rem 1.4rem;
  border: none;
  border-radius: 8px;
  background: #6366f1;
  color: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 200ms ease, background 200ms ease;
}
.grow:hover {
  transform: translateY(-3px) scale(1.05);
  background: #4f46e5;
}

/* 3. Animating position along a track */
@keyframes slide {
  from { transform: translateX(0); }
  to   { transform: translateX(240px); }
}
.track {
  width: 280px;
  height: 40px;
  background: #e2e8f0;
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 4px;
}
.runner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #22c55e;
  animation: slide 2s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
}`,
  },
  {
    id: 'states',
    title: ':hover, :focus & other states',
    html: `<form class="form">
  <label>
    Email
    <input type="email" placeholder="you@example.com" required />
  </label>
  <label>
    Password
    <input type="password" placeholder="••••••••" required />
  </label>
  <button type="button">Sign in</button>
  <a href="#nowhere">Forgot password?</a>
</form>`,
    css: `.form {
  display: grid;
  gap: 1rem;
  max-width: 320px;
  margin: 2rem auto;
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;
}

label { display: grid; gap: 0.3rem; color: #334155; }

input {
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 150ms, box-shadow 150ms;
}

/* :focus-visible = keyboard focus only, no ring on mouse click */
input:focus-visible {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}

/* :invalid + :not(:placeholder-shown) = only complain once they've typed */
input:invalid:not(:placeholder-shown) {
  border-color: #ef4444;
}

button {
  padding: 0.65rem;
  border: none;
  border-radius: 8px;
  background: #6366f1;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
}
button:hover  { background: #4f46e5; }
button:active { transform: translateY(1px); }

a { color: #6366f1; text-decoration: none; text-align: center; }
a:hover { text-decoration: underline; }`,
  },
  {
    id: 'custom-props',
    title: 'Custom properties (CSS variables)',
    html: `<div class="palette">
  <div class="chip brand">brand</div>
  <div class="chip success">success</div>
  <div class="chip danger">danger</div>
</div>

<div class="panel">
  <p>Everything below inherits <code>--radius</code> and <code>--gap</code>
     from <code>:root</code>. Change one value up top and watch every
     element follow.</p>
</div>`,
    css: `:root {
  --brand: #6366f1;
  --success: #22c55e;
  --danger: #ef4444;
  --radius: 12px;
  --gap: 1rem;
  --pad: 1rem;
}

body {
  font-family: system-ui, sans-serif;
  display: grid;
  gap: var(--gap);
}

.palette {
  display: flex;
  gap: var(--gap);
}

.chip {
  flex: 1;
  padding: var(--pad);
  border-radius: var(--radius);
  color: white;
  text-align: center;
  font-size: 0.85rem;
  /* the variable is read here, but set per-class below */
  background: var(--chip-color);
}

/* Redefining a variable on a child only affects that subtree */
.brand   { --chip-color: var(--brand); }
.success { --chip-color: var(--success); }
.danger  { --chip-color: var(--danger); }

.panel {
  padding: var(--pad);
  border: 2px solid var(--brand);
  border-radius: var(--radius);
  font-size: 0.85rem;
  color: #334155;
}

code {
  background: #f1f5f9;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}`,
  },
  {
    id: 'blank',
    title: '📝 Blank canvas — build your own',
    html: `<div class="box">
  Edit the HTML on the left and the CSS below it.
</div>`,
    css: `.box {
  padding: 2rem;
  font-family: system-ui, sans-serif;
}`,
  },
];

// Injected ahead of the user's CSS so the preview starts from a predictable,
// light-themed baseline — and so anything the user writes overrides it.
const PREVIEW_RESET = `*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; }
body { padding: 16px; background: #ffffff; color: #0f172a; font-family: system-ui, -apple-system, sans-serif; }`;

export default function CssPlayground() {
  const [snippetId, setSnippetId] = useState(SNIPPETS[0]!.id);
  const [html, setHtml] = useState(SNIPPETS[0]!.html);
  const [css, setCss] = useState(SNIPPETS[0]!.css);

  const handleSnippetChange = (id: string) => {
    const snippet = SNIPPETS.find((s) => s.id === id);
    if (!snippet) return;
    setSnippetId(id);
    setHtml(snippet.html);
    setCss(snippet.css);
  };

  // The preview is a fully isolated document: the iframe gets its own
  // stylesheet scope, so nothing here can leak out and restyle the site.
  // Rebuilding the string on every keystroke is cheap — no debounce needed.
  const srcDoc = useMemo(
    () => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>${PREVIEW_RESET}</style>
    <style>${css}</style>
  </head>
  <body>${html}</body>
</html>`,
    [html, css],
  );

  return (
    <div className="interactive-embed" style={{
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      background: 'var(--bg-secondary)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '0.85rem 1.1rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'flex-end',
      }}>
        <label style={labelStyle}>
          Load example
          <select value={snippetId} onChange={(e) => handleSnippetChange(e.target.value)} style={selectStyle}>
            {SNIPPETS.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </label>

        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Renders live in a sandboxed iframe — scripts are disabled.
        </span>
      </div>

      <div className="js-playground-split">
        <div style={{ background: 'var(--bg-secondary)' }}>
          <div style={panelLabelStyle}>HTML</div>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            spellCheck={false}
            style={{ ...textareaStyle, minHeight: '150px' }}
          />
          <div style={{ ...panelLabelStyle, borderTop: '1px solid var(--border-color)' }}>CSS</div>
          <textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            spellCheck={false}
            style={{ ...textareaStyle, minHeight: '320px' }}
          />
        </div>

        <div style={{ background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
          <div style={panelLabelStyle}>Live preview</div>
          <iframe
            title="CSS preview"
            srcDoc={srcDoc}
            sandbox=""
            style={{
              flex: 1,
              width: '100%',
              minHeight: '480px',
              border: 'none',
              background: '#ffffff',
            }}
          />
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  fontSize: '0.78rem',
  color: 'var(--text-secondary)',
};

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  padding: '0.4rem 0.6rem',
  fontSize: '0.85rem',
  minWidth: '260px',
};

const panelLabelStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.72rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  resize: 'vertical',
  padding: '0 1rem 1rem',
  background: 'transparent',
  color: 'var(--text-primary)',
  border: 'none',
  outline: 'none',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.85rem',
  lineHeight: 1.6,
  boxSizing: 'border-box',
};
