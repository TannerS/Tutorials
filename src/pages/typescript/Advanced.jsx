import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TsAdvanced() {
  return (
    <LessonLayout title="Advanced TypeScript" sectionId="typescript" lessonIndex={4} prev={{ path: "/typescript/generics", label: "Generics" }} next={{ path: "/typescript/react", label: "TypeScript with React" }}>
      <p>Advanced TypeScript features: mapped types, conditional types, template literals, decorators, and discriminated unions that enable sophisticated type-level programming.</p>
      <CodeBlock language="typescript" title="Advanced Type Patterns">
{`// === DISCRIMINATED UNIONS ===
type Shape =
  | { kind: "circle";    radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle";  base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {  // discriminant narrows the type
    case "circle":    return Math.PI * shape.radius ** 2;
    case "rectangle": return shape.width * shape.height;
    case "triangle":  return 0.5 * shape.base * shape.height;
  }
}

// === MAPPED TYPES ===
// Make all properties nullable
type Nullable<T> = { [K in keyof T]: T[K] | null };
// Make all properties mutable (remove readonly)
type Mutable<T> = { -readonly [K in keyof T]: T[K] };
// Make specific keys required, rest optional
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// === INFER keyword ===
type UnpackPromise<T> = T extends Promise<infer U> ? U : T;
type A = UnpackPromise<Promise<string>>;  // string
type B = UnpackPromise<number>;           // number (not a promise)

type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type Fn = () => { id: number; name: string };
type FnReturn = ReturnType<Fn>;  // { id: number; name: string }

// === TEMPLATE LITERAL TYPES ===
type EventNames = "click" | "focus" | "keydown";
type OnEventNames = \`on\${Capitalize<EventNames>}\`;
// "onClick" | "onFocus" | "onKeydown"

type CSSProperty = "margin" | "padding";
type CSSDirection = "Top" | "Right" | "Bottom" | "Left";
type CSSShorthand = \`\${CSSProperty}\${CSSDirection}\`;
// "marginTop" | "marginRight" | ... | "paddingLeft" (8 combinations)

// === CONST ASSERTION ===
const config = {
  endpoint: "https://api.example.com",
  timeout: 5000,
  methods: ["GET", "POST"] as const,  // readonly ["GET","POST"], not string[]
} as const;
type Method = typeof config.methods[number];  // "GET" | "POST"`}
      </CodeBlock>
      <InteractiveChallenge
        question="What is a discriminated union and when should you use it?"
        options={["A union type with no common properties", "A union where each member has a common literal property (discriminant) that uniquely identifies it, enabling exhaustive type narrowing", "A union that can only hold one type at a time", "A union of enum values"]}
        correctIndex={1}
        explanation="Discriminated unions add a common literal field (the discriminant, like 'kind' or 'type') to each member. TypeScript uses the discriminant value in switch/if statements to narrow the type, giving you full type safety inside each branch and exhaustiveness checking — if you add a new shape, TypeScript warns you've missed handling it."
      />

    </LessonLayout>
  );
}
