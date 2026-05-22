import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Typescript() {
  return (
    <LessonLayout
      title="React + TypeScript"
      sectionId="react19"
      lessonIndex={9}
      prev={{ path: '/react19/patterns', label: 'Advanced Patterns' }}
      next={{ path: '/react19/build-toolchain', label: 'Build Toolchain' }}
    >
      <p>TypeScript and React together provide excellent DX — catching prop errors at compile time, enabling autocomplete, and documenting component APIs. Here are the patterns and utility types that matter most.</p>

      <h2>Typing Props — The Foundation</h2>

      <FlowChart
        title="Props Typing Decision Tree"
        chart={"graph TD\n  A[Defining component props] --> B{Children needed?}\n  B -->|Yes| C[PropsWithChildren or explicit children prop]\n  B -->|No| D[Plain interface]\n  D --> E{Extending HTML element?}\n  E -->|Yes| F[ComponentPropsWithRef or ComponentPropsWithoutRef]\n  E -->|No| G[Custom interface]\n  G --> H{Variant props - show A or B?}\n  H -->|Yes| I[Discriminated Union]\n  H -->|No| J[Simple interface with optional props]"}
      />

      <CodeBlock language="typescript" title="Props Patterns" showLineNumbers>
{`import { ReactNode, ComponentPropsWithoutRef, ComponentPropsWithRef } from 'react';

// Basic props with children
interface CardProps {
  title: string;
  variant?: 'default' | 'elevated' | 'outlined';
  children: ReactNode; // Explicit is better than PropsWithChildren
}

function Card({ title, variant = 'default', children }: CardProps) {
  return <div className={variant}><h2>{title}</h2>{children}</div>;
}

// Extending HTML element props — get all native props for free
interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

function Button({ variant = 'primary', isLoading, children, ...rest }: ButtonProps) {
  return (
    <button disabled={isLoading || rest.disabled} {...rest}>
      {isLoading ? <Spinner /> : children}
    </button>
  );
}
// Consumer gets: onClick, disabled, type, className, etc. — all typed!

// Polymorphic "as" prop — render as different elements
interface BoxProps<T extends React.ElementType = 'div'> {
  as?: T;
  children?: ReactNode;
}

type PolymorphicProps<T extends React.ElementType> =
  BoxProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof BoxProps>;

function Box<T extends React.ElementType = 'div'>({
  as, children, ...props
}: PolymorphicProps<T>) {
  const Component = as || 'div';
  return <Component {...props}>{children}</Component>;
}

// Usage:
// <Box as="section" id="main">  → renders <section>
// <Box as="a" href="/home">     → renders <a>, href is typed!`}
      </CodeBlock>

      <h2>Discriminated Unions — Mutually Exclusive Props</h2>

      <InfoBox variant="tip" title="When to Use Discriminated Unions">
        <p>Use when a component has different "modes" that require different props. Instead of making everything optional (which allows invalid combinations), define explicit variants that TypeScript can narrow on.</p>
      </InfoBox>

      <CodeBlock language="typescript" title="Discriminated Union Props" showLineNumbers>
{`// BAD: All optional — allows invalid states like { href, onClick, disabled }
interface BadButtonProps {
  href?: string;
  onClick?: () => void;
  disabled?: boolean; // Makes no sense for links
  target?: string;    // Makes no sense for buttons
}

// GOOD: Discriminated union — each variant has exactly the right props
type ButtonProps =
  | {
      as: 'button';
      onClick: () => void;
      disabled?: boolean;
      type?: 'button' | 'submit' | 'reset';
    }
  | {
      as: 'link';
      href: string;
      target?: '_blank' | '_self';
      // No disabled — links don't have that
    };

function ActionButton(props: ButtonProps) {
  if (props.as === 'link') {
    // TypeScript narrows: props.href exists, props.disabled doesn't
    return <a href={props.href} target={props.target}>Click</a>;
  }
  // TypeScript narrows: props.onClick exists, props.href doesn't
  return <button onClick={props.onClick} disabled={props.disabled}>Click</button>;
}

// Another example: Alert with conditional action
type AlertProps =
  | { severity: 'info' | 'success'; message: string }
  | { severity: 'error'; message: string; retryAction: () => void }
  | { severity: 'warning'; message: string; dismissable: true; onDismiss: () => void };`}
      </CodeBlock>

      <h2>Typing Hooks</h2>

      <CodeBlock language="typescript" title="Hook Type Patterns" showLineNumbers>
{`// useState — type inference usually works, specify for complex/null types
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]); // Type the array

// useRef — DOM refs vs mutable refs
const inputRef = useRef<HTMLInputElement>(null);     // DOM ref (readonly .current)
const timerRef = useRef<number | undefined>(undefined); // Mutable ref

// useReducer — type the state and action
type State = { count: number; error: string | null };
type Action =
  | { type: 'increment'; payload: number }
  | { type: 'decrement'; payload: number }
  | { type: 'reset' }
  | { type: 'error'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + action.payload };
    case 'decrement': return { ...state, count: state.count - action.payload };
    case 'reset': return { count: 0, error: null };
    case 'error': return { ...state, error: action.payload };
  }
}

// Custom hook with explicit return type
function useFetch<T>(url: string): {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then((d: T) => { setData(d); setIsLoading(false); })
      .catch(e => { if (e.name !== 'AbortError') { setError(e); setIsLoading(false); }});
    return () => controller.abort();
  }, [url]);

  return { data, error, isLoading };
}`}
      </CodeBlock>

      <h2>Generic Components</h2>

      <CodeBlock language="typescript" title="Generic Components for Reusable Lists/Tables" showLineNumbers>
{`// Generic List component — works with any item type
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
  emptyState?: ReactNode;
}

function List<T>({ items, renderItem, keyExtractor, emptyState }: ListProps<T>) {
  if (items.length === 0) return <>{emptyState || <p>No items</p>}</>;
  return (
    <ul>
      {items.map((item, i) => (
        <li key={keyExtractor(item)}>{renderItem(item, i)}</li>
      ))}
    </ul>
  );
}

// Usage — TypeScript infers T from items
<List
  items={users}                           // T = User
  keyExtractor={(user) => user.id}        // user is typed as User
  renderItem={(user) => <span>{user.name}</span>}  // user is typed!
/>

// Generic Select component
interface SelectProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

function Select<T extends string>({ options, value, onChange, label }: SelectProps<T>) {
  return (
    <label>
      {label}
      <select value={value} onChange={e => onChange(e.target.value as T)}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </label>
  );
}

const STATUSES = ['active', 'inactive', 'pending'] as const;
// value and onChange are typed as 'active' | 'inactive' | 'pending'
<Select options={STATUSES} value={status} onChange={setStatus} label="Status" />`}
      </CodeBlock>

      <h2>Typing Events & Utility Types</h2>

      <CodeBlock language="typescript" title="Events and React Utility Types" showLineNumbers>
{`// Event handler types
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') submit();
};

// Typing event handler props
interface FormProps {
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

// Useful utility types
type PropsOf<T extends React.ElementType> = React.ComponentPropsWithoutRef<T>;

// Extract props from an existing component
type ButtonProps = React.ComponentProps<typeof Button>;

// Make all props required (useful for internal component state)
type RequiredProps = Required<CardProps>;

// Pick specific props for a subset component
type CardHeaderProps = Pick<CardProps, 'title' | 'variant'>;

// Omit props when wrapping
type WrapperProps = Omit<ButtonProps, 'variant'> & { theme: 'light' | 'dark' };`}
      </CodeBlock>

      <InfoBox variant="note" title="React 19 TypeScript Changes">
        <p>React 19 simplifies types: <code>ref</code> is now part of regular props (no need for <code>forwardRef</code> wrapper types), <code>useActionState</code> and other new hooks have built-in type inference, and the <code>use()</code> hook correctly infers the resolved type from the Promise generic.</p>
      </InfoBox>

      <InteractiveChallenge
        question="You have a component that accepts either `onClick` (button behavior) OR `href` (link behavior), but never both. What TypeScript pattern enforces this?"
        options={[
          "Make both props optional with `?`",
          "Use a discriminated union type with a literal discriminant",
          "Use `Partial<ButtonProps & LinkProps>`",
          "Use `Exclude<ButtonProps, LinkProps>`"
        ]}
        correctIndex={1}
        explanation="A discriminated union with a literal field (e.g., `as: 'button' | as: 'link'`) lets TypeScript narrow the type in each branch. Optional props allow invalid combinations (both href AND onClick). Partial makes everything optional. Exclude works on simple types, not object shapes in this way."
        language="typescript"
        code={"type Props =\n  | { as: 'button'; onClick: () => void }\n  | { as: 'link'; href: string };\n\n// TypeScript error: Property 'href' does not exist\nconst bad: Props = { as: 'button', href: '/foo' };"}
      />
    </LessonLayout>
  );
}
