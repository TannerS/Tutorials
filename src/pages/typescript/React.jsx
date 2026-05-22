import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TsReact() {
  return (
    <LessonLayout title="TypeScript with React" sectionId="typescript" lessonIndex={5} prev={{ path: "/typescript/advanced", label: "Advanced TypeScript" }} next={{ path: "/typescript/migration", label: "Migration Guide" }}>
      <p>TypeScript with React enables fully typed components, hooks, events, and refs. The combination gives you autocomplete for prop names, catches missing required props, and documents component APIs.</p>
      <CodeBlock language="typescript" title="React TypeScript Patterns">
{`import React, { useState, useRef, useCallback, FC, ReactNode, MouseEvent } from 'react';

// === COMPONENT PROPS ===
interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
}

// FC<Props> type — includes children type
const Button: FC<ButtonProps> = ({ label, variant = "primary", disabled, onClick, children }) => (
  <button
    className={\`btn btn-\${variant}\`}
    disabled={disabled}
    onClick={onClick}
  >
    {children ?? label}
  </button>
);

// === GENERIC COMPONENT ===
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
}
function List<T>({ items, renderItem, keyExtractor, emptyMessage = "No items" }: ListProps<T>) {
  if (!items.length) return <p>{emptyMessage}</p>;
  return <ul>{items.map((item, i) => <li key={keyExtractor(item)}>{renderItem(item, i)}</li>)}</ul>;
}
// Usage: <List items={users} keyExtractor={u => u.id} renderItem={u => <UserCard user={u} />} />

// === TYPED HOOKS ===
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<string[]>([]);
const inputRef = useRef<HTMLInputElement>(null);  // typed ref
inputRef.current?.focus();

// Custom hook with return type
function useApi<T>(url: string): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ... fetch logic
  return { data, loading, error };
}

// === EVENT HANDLERS ===
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value);
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); };
const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => setOption(e.target.value);`}
      </CodeBlock>
      <InteractiveChallenge
        question="How do you type a React ref for an HTML input element?"
        options={["useRef<Element>(null)", "useRef<HTMLInputElement>(null)", "useRef<Input>(null)", "useRef(null) — refs don't need types"]}
        correctIndex={1}
        explanation="useRef<HTMLInputElement>(null) types the ref as pointing to an HTML input element. TypeScript then knows what properties and methods are available on ref.current — including .value, .focus(), .select(), etc. The generic parameter is the DOM element type."
      />

    </LessonLayout>
  );
}
