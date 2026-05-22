import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function IPTypescript() {
  return (
    <LessonLayout
      title="TypeScript Interview Q&A"
      sectionId="interview-prep"
      lessonIndex={1}
      prev={{ path: '/interview-prep/react', label: 'React Interview Q&A' }}
      next={{ path: '/interview-prep/frontend', label: 'Frontend System Design' }}
    >
      <h2>Top 25 TypeScript Interview Questions</h2>
      <p>
        Answers to the most common TypeScript interview questions. Cover the type system deeply —
        interviewers expect you to explain structural typing, generics, and utility types clearly.
      </p>

      <h2>Core Type System (Q1-10)</h2>

      <InfoBox variant="info" title="Q1: What is structural typing?">
        <p>
          TypeScript uses structural (duck) typing: a type is compatible if it has the required shape,
          regardless of how it was declared. If object A has all properties of type B, A is assignable to B
          even without an explicit declaration. This contrasts with nominal typing (Java/C#) where you must
          explicitly declare that A implements B.
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="Q2: any vs unknown">
{`// any — disables type checking entirely (avoid)
let a: any = 'hello'
a.toFixed()          // no error — TypeScript gives up checking

// unknown — safe top type, must narrow before use
let u: unknown = 'hello'
u.toFixed()          // ERROR — must check type first
if (typeof u === 'number') {
  u.toFixed()        // OK — narrowed to number
}

// Rule: never use any. Use unknown for truly unknown values
// (API responses, JSON.parse, error catch blocks)
function parseJSON(input: string): unknown {
  return JSON.parse(input)
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Q3: Interface vs type alias">
{`// Interface — open (can be extended with declaration merging)
interface User { name: string }
interface User { age: number }   // merges with above — OK

// Type alias — closed (cannot be re-opened)
type User = { name: string }
type User = { age: number }     // ERROR: duplicate identifier

// Interface — only for object shapes
// Type alias — for unions, intersections, primitives, tuples
type ID = string | number                // union
type Point = [number, number]            // tuple
type Callback = (err: Error | null) => void

// Both support:
interface UserWithRole extends User { role: string }
type UserWithRole = User & { role: string }

// Rule: prefer interface for object shapes (extensible),
// prefer type for unions, mapped types, conditionals`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Q4: Type narrowing techniques">
{`type Shape = { kind: 'circle'; radius: number }
           | { kind: 'square'; side: number }

function area(shape: Shape): number {
  // Discriminated union narrowing
  if (shape.kind === 'circle') {
    return Math.PI * shape.radius ** 2   // shape: { kind: 'circle'; radius: number }
  }
  return shape.side ** 2                // shape: { kind: 'square'; side: number }
}

// typeof narrowing
function process(value: string | number) {
  if (typeof value === 'string') return value.toUpperCase()
  return value.toFixed(2)
}

// instanceof narrowing
function handleError(err: unknown) {
  if (err instanceof Error) console.log(err.message)
}

// Type predicate / user-defined type guard
function isUser(x: unknown): x is User {
  return typeof x === 'object' && x !== null && 'name' in x
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Q5: What is never and when does it appear?">
        <p>
          <code>never</code> represents a value that never exists. It appears in: (1) exhaustive switch checks
          — if you miss a case, the unhandled variant is typed as never. (2) Functions that never return
          (throw or infinite loop). (3) Conditional types when a branch is impossible.
          Assigning to never is useful for exhaustive checks at compile time.
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="Q6: Generics">
{`// Generic function
function first<T>(arr: T[]): T | undefined {
  return arr[0]
}
const n = first([1, 2, 3])    // T inferred as number
const s = first(['a', 'b'])   // T inferred as string

// Generic with constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

// Generic interface
interface Repository<T> {
  findById(id: string): Promise<T>
  save(entity: T): Promise<T>
  delete(id: string): Promise<void>
}

// Default generic
interface Response<T = unknown> {
  data: T
  status: number
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Q7: Utility types">
{`interface User {
  id: number
  name: string
  email: string
  createdAt: Date
}

type PartialUser = Partial<User>           // all props optional
type RequiredUser = Required<User>         // all props required
type ReadonlyUser = Readonly<User>         // all props readonly
type UserPreview = Pick<User, 'id' | 'name'>    // subset
type UserWithoutDates = Omit<User, 'createdAt'>  // exclude

// Record — map type
type RolePermissions = Record<'admin' | 'user', string[]>

// Exclude / Extract — from union
type NumOrStr = number | string | boolean
type NumOnly = Exclude<NumOrStr, string | boolean>  // number
type StrOnly = Extract<NumOrStr, string>             // string

// ReturnType and Parameters
function greet(name: string, greeting: string) { return \`\${greeting}, \${name}\` }
type GreetParams = Parameters<typeof greet>   // [string, string]
type GreetReturn = ReturnType<typeof greet>   // string

// NonNullable
type MaybeString = string | null | undefined
type DefiniteString = NonNullable<MaybeString>  // string`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Q8: Conditional types">
{`// Basic conditional type
type IsArray<T> = T extends any[] ? true : false
type A = IsArray<string[]>  // true
type B = IsArray<string>    // false

// Infer — extract types from complex types
type UnpackPromise<T> = T extends Promise<infer U> ? U : T
type Unpacked = UnpackPromise<Promise<string>>   // string

// Distributive conditional types
type ToArray<T> = T extends any ? T[] : never
type Arr = ToArray<string | number>  // string[] | number[]

// Mapped types
type Optional<T> = { [K in keyof T]?: T[K] }
type ReadOnly<T> = { readonly [K in keyof T]: T[K] }

// Template literal types
type EventName = 'click' | 'focus' | 'blur'
type HandlerName = \`on\${Capitalize<EventName>}\`
// 'onClick' | 'onFocus' | 'onBlur'`}
      </CodeBlock>

      <InfoBox variant="info" title="Q9: What is declaration merging?">
        <p>
          TypeScript merges multiple declarations of the same name. Most commonly used with interfaces
          (extending third-party types) and module augmentation. Example: augmenting Express Request
          to add a user property by re-declaring the namespace.
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="Q10: Module augmentation">
{`// Augment Express Request to add user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string }
    }
  }
}

// Augment window
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    analytics: Analytics
  }
}

// Augment third-party types with module augmentation
declare module 'some-library' {
  interface SomeInterface {
    newProperty: string
  }
}`}
      </CodeBlock>

      <h2>Advanced Questions (Q11-25)</h2>

      <CodeBlock language="typescript" title="Q11: Discriminated unions (tagged unions)">
{`// Each variant has a literal type discriminant field
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function fetchUser(id: string): Result<User> {
  // ...
}

const result = fetchUser('123')
if (result.success) {
  console.log(result.data.name)  // data is available
} else {
  console.log(result.error)      // error is available
}

// switch version
type Action =
  | { type: 'increment'; amount: number }
  | { type: 'reset' }

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'increment': return state + action.amount
    case 'reset': return 0
  }
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Q12-14: as const, satisfies, and strict null checks">
{`// as const — infer literal types (not widened)
const config = {
  endpoint: 'https://api.example.com',
  timeout: 5000,
} as const
// type: { readonly endpoint: 'https://api.example.com'; readonly timeout: 5000 }

// satisfies operator (TS 4.9) — validate type without widening
const palette = {
  red: [255, 0, 0],
  green: '#00ff00',
} satisfies Record<string, string | number[]>
// palette.red is number[] (preserved), not string | number[]

// strict null checks
function greet(name: string | null) {
  // name.toUpperCase()  // ERROR — name might be null
  if (name !== null) {
    name.toUpperCase()   // OK — narrowed
  }
  return name?.toUpperCase() ?? 'Stranger'  // optional chaining + nullish coalescing
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Q15: What is type erasure in TypeScript?">
        <p>
          TypeScript types exist only at compile time. The TypeScript compiler strips all type annotations
          before producing JavaScript. At runtime, there are no interfaces, generics, or type aliases.
          This means you cannot use TypeScript types for runtime checks — you need runtime validation
          (typeof, instanceof, Zod, io-ts) for that.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between Partial<T> and Required<T>?"
        options={[
          "Partial makes all properties readonly; Required removes readonly",
          "Partial makes all properties optional; Required makes all properties required",
          "Partial picks a subset of properties; Required keeps all properties",
          "They are equivalent utility types"
        ]}
        correctIndex={1}
        explanation="Partial<T> transforms all properties of T to optional (adds ? to each). Required<T> does the opposite — removes optional markers from all properties. They are utility types built using mapped types: Partial<T> = { [K in keyof T]?: T[K] }, Required<T> = { [K in keyof T]-?: T[K] }. The -? syntax removes optionality."
      />

      <InteractiveChallenge
        question="What does 'as const' do to an object literal in TypeScript?"
        options={[
          "Makes all properties readonly at runtime",
          "Infers the most specific literal types and marks all properties as readonly",
          "Prevents the object from being assigned to any type",
          "Converts the object to a class with private properties"
        ]}
        correctIndex={1}
        explanation="'as const' tells TypeScript to infer the most narrow (literal) types instead of widening them. Without as const, const endpoint = 'http://api.com' gives type string. With as const, it gives type 'http://api.com'. For objects, it makes all nested values readonly and infers literal types. This is useful for defining constants that should never change and for discriminated union discriminant values."
      />
    </LessonLayout>
  );
}
