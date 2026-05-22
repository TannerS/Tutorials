import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Styling() {
  return (
    <LessonLayout
      title="Styling Approaches"
      sectionId="react-cheatsheet"
      lessonIndex={3}
      prev={{ path: '/react-cheatsheet/state', label: 'State & Forms' }}
      next={{ path: '/react-cheatsheet/recipes', label: 'Common Recipes' }}
    >
      <p>Every major styling approach side by side — inline, CSS Modules, CSS-in-JS, Tailwind, MUI theming, animations.</p>

      <FlowChart
        title="Choosing a Styling Approach"
        chart={"graph TD\n  A[Project type?] --> B{Component library?}\n  B -->|Yes| C[CSS Modules or CSS-in-JS]\n  B -->|No| D{Rapid prototyping?}\n  D -->|Yes| E[Tailwind CSS]\n  D -->|No| F{Design system?}\n  F -->|Yes| G[MUI / Theme tokens]\n  F -->|No| H[CSS Modules]"}
      />

      {/* ── Inline Styles ────────────────────────────────── */}
      <h2>Inline Styles</h2>
      <CodeBlock language="jsx" title="Inline Styles">
{`// camelCase properties, values as strings or numbers
const style = { backgroundColor: '#1a1a2e', padding: 16, borderRadius: 8 };
<div style={style}>Content</div>

// Dynamic styles
<div style={{ color: isError ? 'red' : 'green' }}>Status</div>

// ✅ Good for: dynamic, computed values
// ❌ No pseudo-classes, media queries, keyframes, or hover states`}
      </CodeBlock>

      {/* ── CSS Modules ──────────────────────────────────── */}
      <h2>CSS Modules</h2>
      <CodeBlock language="jsx" title="CSS Modules">
{`// Button.module.css
// .btn { padding: 8px 16px; border-radius: 4px; }
// .btn.primary { background: #5b9cf6; color: #fff; }
// .btn.disabled { opacity: 0.5; cursor: not-allowed; }

import styles from './Button.module.css';

function Button({ variant = 'primary', disabled, children }) {
  const cls = [
    styles.btn,
    styles[variant],
    disabled && styles.disabled,
  ].filter(Boolean).join(' ');

  return <button className={cls} disabled={disabled}>{children}</button>;
}

// With clsx (npm i clsx)
import clsx from 'clsx';
<button className={clsx(styles.btn, styles[variant], { [styles.disabled]: disabled })}>
  {children}
</button>`}
      </CodeBlock>

      <InfoBox variant="tip" title="CSS Modules">
        <p>Scoped by default — class names become unique hashes at build time. No global leaks. Works out of the box with Vite and CRA. Best balance of simplicity and safety.</p>
      </InfoBox>

      {/* ── CSS-in-JS ────────────────────────────────────── */}
      <h2>CSS-in-JS (styled-components / Emotion)</h2>
      <CodeBlock language="jsx" title="styled-components">
{`import styled, { css } from 'styled-components';

const Button = styled.button\`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background: \${props => props.$primary ? '#5b9cf6' : '#444'};
  color: #fff;

  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  \${props => props.$size === 'lg' && css\`
    padding: 12px 24px;
    font-size: 1.1rem;
  \`}
\`;

// Usage
<Button $primary>Save</Button>
<Button $primary $size="lg">Big Save</Button>

// Extending
const DangerButton = styled(Button)\`
  background: #e74c3c;
\`;`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Emotion (@emotion/styled)">
{`import styled from '@emotion/styled';
import { css } from '@emotion/react';

// Same API as styled-components
const Card = styled.div\`
  padding: 16px;
  border: 1px solid \${p => p.theme.border};
\`;

// css prop (requires babel plugin or JSX pragma)
<div css={css\`padding: 16px; color: blue;\`}>Hello</div>`}
      </CodeBlock>

      {/* ── Tailwind ─────────────────────────────────────── */}
      <h2>Tailwind CSS with React</h2>
      <CodeBlock language="jsx" title="Tailwind Patterns">
{`// Basic usage
<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Save
</button>

// Conditional classes with clsx
import clsx from 'clsx';

function Badge({ variant, children }) {
  return (
    <span className={clsx(
      'px-2 py-1 rounded-full text-sm font-medium',
      variant === 'success' && 'bg-green-100 text-green-800',
      variant === 'error'   && 'bg-red-100 text-red-800',
      variant === 'warning' && 'bg-yellow-100 text-yellow-800',
    )}>
      {children}
    </span>
  );
}

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(i => <Card key={i.id} item={i} />)}
</div>

// Dark mode
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>

// Extracting components (avoids className bloat)
// ✅ Just make a React component — don't use @apply excessively`}
      </CodeBlock>

      {/* ── MUI Theming ──────────────────────────────────── */}
      <h2>MUI / Material UI Theming</h2>
      <CodeBlock language="jsx" title="MUI Theme Setup">
{`import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary:   { main: '#5b9cf6' },
    secondary: { main: '#a78bfa' },
    background: { default: '#0a0a1a', paper: '#1a1a2e' },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8 },
      },
      defaultProps: { variant: 'contained', disableElevation: true },
    },
  },
});

<ThemeProvider theme={theme}><App /></ThemeProvider>`}
      </CodeBlock>

      <CodeBlock language="jsx" title="MUI sx Prop & styled()">
{`import { Box, styled } from '@mui/material';

// sx prop — quick one-off styles with theme access
<Box sx={{
  p: 2,
  bgcolor: 'background.paper',
  borderRadius: 2,
  display: 'flex',
  gap: 1,
  '&:hover': { boxShadow: 3 },
}}>
  Content
</Box>

// styled() — reusable component with theme
const StyledCard = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  [theme.breakpoints.up('md')]: { padding: theme.spacing(4) },
}));`}
      </CodeBlock>

      {/* ── Conditional Styling ──────────────────────────── */}
      <h2>Conditional Styling Patterns</h2>
      <CodeBlock language="jsx" title="Conditional Classes & Styles">
{`// Template literal
<div className={\`card \${isActive ? 'active' : ''}\`} />

// Array join
<div className={['card', isActive && 'active', size].filter(Boolean).join(' ')} />

// clsx (recommended)
import clsx from 'clsx';
<div className={clsx('card', { active: isActive, 'card--lg': size === 'lg' })} />

// data attributes for CSS
<div data-state={isOpen ? 'open' : 'closed'} />
// CSS: [data-state="open"] { display: block; }

// CSS variables for dynamic values
<div style={{ '--progress': \`\${percent}%\` }}>
  {/* CSS: width: var(--progress); */}
</div>`}
      </CodeBlock>

      {/* ── CSS Variables ────────────────────────────────── */}
      <h2>CSS Variables with React</h2>
      <CodeBlock language="jsx" title="CSS Custom Properties">
{`// Set variables from React state
function ThemedSection({ hue }) {
  return (
    <section style={{
      '--primary-h': hue,
      '--primary': \`hsl(\${hue}, 70%, 55%)\`,
      '--primary-light': \`hsl(\${hue}, 70%, 90%)\`,
    }}>
      {/* All children can use var(--primary) */}
      <h2 style={{ color: 'var(--primary)' }}>Dynamic Theme</h2>
    </section>
  );
}

// Toggle dark mode via CSS variables
document.documentElement.style.setProperty('--bg', isDark ? '#111' : '#fff');
document.documentElement.style.setProperty('--text', isDark ? '#fff' : '#111');`}
      </CodeBlock>

      {/* ── Animations ───────────────────────────────────── */}
      <h2>Animation Approaches</h2>
      <CodeBlock language="jsx" title="CSS Transitions">
{`// CSS class toggle (simplest)
<div className={clsx('panel', { 'panel--open': isOpen })}>Content</div>

// panel.css
// .panel { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
// .panel--open { max-height: 500px; }`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Framer Motion Basics">
{`import { motion, AnimatePresence } from 'framer-motion';

// Animate on mount
<motion.div initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}>
  Content
</motion.div>

// Animate on unmount (requires AnimatePresence)
<AnimatePresence>
  {isVisible && (
    <motion.div key="modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}>
      <Modal />
    </motion.div>
  )}
</AnimatePresence>

// Layout animation (auto-animate position changes)
<motion.li layout>{item.name}</motion.li>

// Gesture animations
<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
  Click me
</motion.button>`}
      </CodeBlock>

      {/* ── Comparison Table ─────────────────────────────── */}
      <h2>Comparison</h2>
      <CodeBlock language="jsx" title="Styling Approaches Compared">
{`// Approach        | Bundle  | DX        | Perf     | SSR   | Dynamic
// --------------- | ------- | --------- | -------- | ----- | -------
// Inline styles   | 0 KB    | ⭐⭐      | ⭐⭐⭐⭐  | ✅    | ✅
// CSS Modules     | Small   | ⭐⭐⭐⭐   | ⭐⭐⭐⭐  | ✅    | ❌
// styled-comp.    | ~12 KB  | ⭐⭐⭐⭐   | ⭐⭐⭐    | ✅*   | ✅
// Emotion         | ~7 KB   | ⭐⭐⭐⭐   | ⭐⭐⭐    | ✅*   | ✅
// Tailwind        | ~10 KB† | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ | ✅    | ⚠️
// MUI sx/styled   | (MUI)   | ⭐⭐⭐⭐   | ⭐⭐⭐    | ✅*   | ✅
//
// † Tailwind after purge; * requires SSR setup
// Key: DX = Developer Experience, Perf = Runtime Performance`}
      </CodeBlock>

      <InfoBox variant="info" title="Recommendation">
        <p><strong>New project?</strong> CSS Modules + clsx for most cases. Tailwind if your team likes utility-first. MUI if you need a full design system out of the box.</p>
        <p><strong>Avoid</strong> mixing more than 2 approaches in one project — consistency trumps perfection.</p>
      </InfoBox>

      <InteractiveChallenge
        question={"Which styling approach has zero runtime JavaScript cost?"}
        options={[
          "styled-components",
          "Emotion css prop",
          "CSS Modules",
          "MUI sx prop"
        ]}
        correctIndex={2}
        explanation={"CSS Modules are compiled at build time into scoped CSS files. There's no runtime JS — the class names are just string constants after the build. All CSS-in-JS solutions (styled-components, Emotion, MUI sx) inject styles at runtime."}
        language="jsx"
      />
    </LessonLayout>
  );
}

export default Styling;
