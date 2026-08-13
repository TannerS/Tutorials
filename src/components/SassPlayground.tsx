import { useEffect, useMemo, useState } from 'react';
import CodeBlock from './CodeBlock';

interface SassWarning {
  message: string;
  deprecation: boolean;
}

interface SassModule {
  compileString: (
    source: string,
    options?: {
      style?: 'expanded' | 'compressed';
      logger?: {
        warn?: (message: string, options: { deprecation?: boolean }) => void;
      };
    },
  ) => { css: string };
}

interface Snippet {
  id: string;
  title: string;
  blurb: string;
  code: string;
}

const SNIPPETS: Snippet[] = [
  {
    id: 'variables',
    title: 'Variables — $sass vs. CSS custom properties',
    blurb: '$variables are resolved at compile time and disappear; custom properties survive into the output and inherit at runtime.',
    code: `// A Sass variable is compile-time: it vanishes from the output.
$brand: #6366f1;
$radius: 10px;
$space: 1rem;

:root {
  // A CSS custom property is runtime: it survives into the output,
  // inherits down the tree, and can be changed by JS or a media query.
  --brand: #{$brand};
  --radius: #{$radius};
}

.button {
  background: $brand;          // baked in at compile time
  border-radius: $radius;
  padding: $space ($space * 2); // real arithmetic, done by Sass
}

.card {
  background: var(--brand);    // resolved by the browser, at runtime
  border-radius: var(--radius);
}`,
  },
  {
    id: 'nesting',
    title: 'Nesting & the & parent selector',
    blurb: 'Nesting flattens into descendant selectors; & splices the parent in with no space, which is what makes BEM and state classes readable.',
    code: `.card {
  padding: 1rem;
  border-radius: 8px;

  // Descendant: compiles to ".card .title"
  .title {
    font-size: 1.1rem;
    margin: 0;
  }

  // & = the parent selector, glued on with no space
  &:hover { transform: translateY(-2px); }
  &--featured { border: 2px solid #6366f1; }  // BEM modifier
  &.is-open .title { color: #6366f1; }

  // & can also be used on the *right* side
  .dark-mode & { background: #1e293b; }
}`,
  },
  {
    id: 'mixins',
    title: 'Mixins — @mixin and @include',
    blurb: 'A mixin injects declarations. Note @content, which lets the caller pass a whole block in — the trick behind every Sass breakpoint helper.',
    code: `@mixin flex-center($direction: row, $gap: 0) {
  display: flex;
  flex-direction: $direction;
  align-items: center;
  justify-content: center;
  gap: $gap;
}

@mixin respond-to($breakpoint) {
  @if $breakpoint == tablet {
    @media (min-width: 768px) { @content; }
  } @else if $breakpoint == desktop {
    @media (min-width: 1200px) { @content; }
  } @else {
    @error "Unknown breakpoint: #{$breakpoint}";
  }
}

.toolbar {
  @include flex-center(row, 0.75rem);
  padding: 0.5rem;

  @include respond-to(tablet) {
    padding: 1rem 2rem;
  }
}

.stack {
  @include flex-center($direction: column, $gap: 1rem);
}`,
  },
  {
    id: 'functions',
    title: 'Functions — @function and @return',
    blurb: 'A function returns a value you can use inside a declaration; a mixin returns the declarations themselves. That is the whole difference.',
    code: `@use "sass:math";
@use "sass:color";

// A function returns a *value*; a mixin returns *declarations*.
@function rem($px, $base: 16px) {
  @return math.div($px, $base) * 1rem;
}

@function tint($color, $amount) {
  @return color.mix(white, $color, $amount);
}

$brand: #6366f1;

.title {
  font-size: rem(24px);   // -> 1.5rem
  margin-bottom: rem(12px);
}

.badge {
  background: tint($brand, 80%);
  color: $brand;
  padding: rem(4px) rem(10px);
}`,
  },
  {
    id: 'modules',
    title: '@use — the built-in Sass modules',
    blurb: 'Built-in modules (sass:math, sass:color, sass:string, sass:map, sass:list) resolve without any files on disk, so they work here.',
    code: `@use "sass:math";
@use "sass:color";
@use "sass:string";

$brand: #6366f1;

.demo {
  // sass:math
  width: math.div(100%, 3);
  height: math.round(12.7px);
  z-index: math.max(4, 9, 2);

  // sass:color
  background: color.adjust($brand, $lightness: 20%);
  border-color: color.scale($brand, $saturation: -40%);
  outline-color: color.complement($brand);

  // sass:string
  content: string.quote(hello);
}`,
  },
  {
    id: 'maps-each',
    title: 'Maps & @each loops',
    blurb: 'One map plus one loop generates an entire utility-class set — this is roughly how Bootstrap and older utility frameworks are built.',
    code: `@use "sass:map";

$palette: (
  "brand":   #6366f1,
  "success": #22c55e,
  "danger":  #ef4444,
  "muted":   #64748b,
);

$spacing: (0: 0, 1: 0.25rem, 2: 0.5rem, 3: 1rem, 4: 2rem);

// One loop generates the whole utility set.
@each $name, $color in $palette {
  .text-#{$name} { color: $color; }
  .bg-#{$name}   { background: $color; }
}

@each $step, $size in $spacing {
  .p-#{$step} { padding: $size; }
  .m-#{$step} { margin: $size; }
}

// Maps can be read directly too.
.alert {
  border-left: 4px solid map.get($palette, "danger");
}`,
  },
];

const STYLES = [
  { key: 'expanded', label: 'Expanded (readable)' },
  { key: 'compressed', label: 'Compressed (minified)' },
] as const;

export default function SassPlayground() {
  const [sass, setSass] = useState<SassModule | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [snippetId, setSnippetId] = useState(SNIPPETS[0]!.id);
  const [source, setSource] = useState(SNIPPETS[0]!.code);
  const [outputStyle, setOutputStyle] = useState<(typeof STYLES)[number]['key']>('expanded');

  // Dart Sass is a large module, so it's loaded on demand rather than
  // imported at the top of the file — that keeps it in its own lazy chunk.
  useEffect(() => {
    let cancelled = false;
    import('sass')
      .then((mod) => {
        if (!cancelled) setSass((mod.default ?? mod) as unknown as SassModule);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load the Sass compiler. Check your connection and reload.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSnippetChange = (id: string) => {
    const snippet = SNIPPETS.find((s) => s.id === id);
    if (!snippet) return;
    setSnippetId(id);
    setSource(snippet.code);
  };

  const { css, error, warnings } = useMemo(() => {
    if (!sass) return { css: '', error: null as string | null, warnings: [] as SassWarning[] };
    const collected: SassWarning[] = [];
    try {
      const result = sass.compileString(source, {
        style: outputStyle,
        logger: {
          warn: (message, options) => {
            collected.push({ message, deprecation: Boolean(options?.deprecation) });
          },
        },
      });
      return { css: result.css, error: null as string | null, warnings: collected };
    } catch (e) {
      return {
        css: '',
        error: e instanceof Error ? e.message : 'Compilation failed.',
        warnings: collected,
      };
    }
  }, [sass, source, outputStyle]);

  const activeSnippet = SNIPPETS.find((s) => s.id === snippetId);

  return (
    <div style={{
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

        <label style={{ ...labelStyle, marginLeft: 'auto' }}>
          Output style
          <select
            value={outputStyle}
            onChange={(e) => setOutputStyle(e.target.value as (typeof STYLES)[number]['key'])}
            style={{ ...selectStyle, minWidth: '190px' }}
          >
            {STYLES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {activeSnippet && (
        <div style={{
          padding: '0.5rem 1.1rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
        }}>
          {activeSnippet.blurb}
        </div>
      )}

      <div className="js-playground-split">
        <div style={{ background: 'var(--bg-secondary)' }}>
          <div style={panelLabelStyle}>Source (SCSS)</div>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            style={textareaStyle}
          />
        </div>
        <div style={{ background: 'var(--bg-secondary)' }}>
          <div style={panelLabelStyle}>Compiled CSS — {STYLES.find((s) => s.key === outputStyle)?.label}</div>
          {loadError ? (
            <div style={{ padding: '1rem', color: 'var(--accent-red, #ef4444)', fontSize: '0.85rem' }}>{loadError}</div>
          ) : !sass ? (
            <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading the Sass compiler…</div>
          ) : (
            <CodeBlock language="css" showLineNumbers={false} code={css || '/* (empty output) */'} />
          )}
        </div>
      </div>

      {warnings.length > 0 && !error && (
        <div style={{
          padding: '0.75rem 1.1rem',
          borderTop: '1px solid var(--border-color)',
          color: 'var(--accent-amber, #f59e0b)',
          fontSize: '0.78rem',
          fontFamily: "'JetBrains Mono', monospace",
          whiteSpace: 'pre-wrap',
        }}>
          {warnings.map((w, i) => (
            <div key={i} style={{ marginBottom: i === warnings.length - 1 ? 0 : '0.5rem' }}>
              {w.deprecation ? 'DEPRECATION: ' : 'WARNING: '}
              {w.message}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{
          padding: '0.75rem 1.1rem',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--accent-red-bg, #3b1a1a)',
          color: 'var(--accent-red, #f87171)',
          fontSize: '0.8rem',
          fontFamily: "'JetBrains Mono', monospace",
          whiteSpace: 'pre-wrap',
        }}>
          {error}
        </div>
      )}
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
  minWidth: '280px',
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
  minHeight: '420px',
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
