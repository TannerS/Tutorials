import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactCStyling() {
  return (
    <LessonLayout
      title="Styling Cheat Sheet"
      sectionId="react-cheatsheet"
      lessonIndex={3}
      prev={{ path: "/react-cheatsheet/state", label: "State Management Cheat Sheet" }}
      next={{ path: "/react-cheatsheet/recipes", label: "React Recipes" }}
    >
      <p>Quick reference for styling React applications — CSS Modules, Tailwind, styled-components, and inline styles.</p>

      <CodeBlock language="jsx" title="Styling Approaches Comparison">
{`// === CSS MODULES ===
// styles/Button.module.css: .button { background: blue; }
import styles from './Button.module.css';
<button className={styles.button}>Click</button>
// Scoped automatically — .button becomes .Button_button__abc123

// Conditional classes with clsx
import clsx from 'clsx';
<button className={clsx(styles.button, {
  [styles.primary]: variant === 'primary',
  [styles.disabled]: disabled,
  [styles.large]: size === 'large',
})}>

// === TAILWIND CSS ===
<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
  Click
</button>
// Dynamic classes — must use full class names (no string concatenation)
const color = isError ? 'bg-red-500' : 'bg-green-500';  // OK
// const color = isError ? 'red' : 'green'; \`bg-\${color}-500\`  // BAD - purged!

// === STYLED-COMPONENTS ===
import styled from 'styled-components';
const Button = styled.button\`
  background: \${props => props.primary ? '#5b9cf6' : '#e2e8f0'};
  color: \${props => props.primary ? 'white' : '#1a1a2e'};
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  &:hover { opacity: 0.9; }
\`;
<Button primary>Primary</Button>
<Button>Secondary</Button>

// === CSS VARIABLES (design tokens) ===
// :root { --color-primary: #5b9cf6; --spacing-md: 1rem; }
const buttonStyle = {
  backgroundColor: 'var(--color-primary)',
  padding: 'var(--spacing-md)',
};

// === INLINE STYLES (for dynamic values) ===
// Use for: JS-computed values, animations, prototyping
// Avoid for: large amounts of styles, pseudo-classes/media queries
<div style={{ transform: \`translateX(\${offsetX}px)\`, opacity }}>

// === CLASS MERGE UTILITY (Tailwind + shadcn) ===
import { cn } from '@/lib/utils';  // clsx + tailwind-merge
<div className={cn("base-classes", condition && "conditional-class", className)}>`}
      </CodeBlock>

      <InfoBox variant="tip" title="Styling Choice Guide">
        <p>CSS Modules: best for traditional CSS authors, zero runtime cost, good for design systems. Tailwind: best for rapid development, consistent design tokens, tiny production CSS. Styled-components/Emotion: best for dynamic styles based on props, component-scoped theming. Mix approaches — use Tailwind for layout/utilities, CSS Modules or styled-components for complex dynamic components.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Why should you avoid dynamic Tailwind class construction like `bg-${color}-500`?"
        options={["It causes TypeScript errors", "Tailwind's build tool scans for complete class names — partial strings are not detected and the class is not included in the output CSS", "It makes the component re-render more often", "Dynamic classes are deprecated in Tailwind v4"]}
        correctIndex={1}
        explanation="Tailwind uses static analysis to find class names in your source files. If you write `bg-${color}-500`, the scanner sees a template literal, not a complete class name, and doesn't include bg-red-500 or bg-green-500 in the output CSS. Always use the complete class name: `isError ? 'bg-red-500' : 'bg-green-500'`."
      />

    </LessonLayout>
  );
}
