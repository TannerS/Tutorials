import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TsBestPractices() {
  return (
    <LessonLayout title="TypeScript Best Practices" sectionId="typescript" lessonIndex={7} prev={{ path: "/typescript/migration", label: "TypeScript Migration" }} next={{ path: "/typescript/newproject", label: "New Project Setup" }}>
      <p>TypeScript best practices that make codebases maintainable, refactorable, and self-documenting.</p>
      <CodeBlock language="typescript" title="TypeScript Best Practices">
{`// ✓ Enable strict mode — catches the most bugs
// tsconfig.json: "strict": true
// Enables: strictNullChecks, noImplicitAny, strictFunctionTypes, etc.

// ✓ Prefer interfaces for object shapes that may be extended
interface UserRepository {
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<User>;
}
class JpaUserRepository implements UserRepository { ... }
class InMemoryUserRepository implements UserRepository { ... } // for tests

// ✓ Use const assertions for immutable config
const ROLES = ["admin", "user", "guest"] as const;
type Role = typeof ROLES[number];  // "admin" | "user" | "guest"

// ✓ Type guards for runtime type narrowing
function isUser(obj: unknown): obj is User {
  return typeof obj === "object" && obj !== null
    && "id" in obj && "name" in obj;
}
const data: unknown = parseJson(rawJson);
if (isUser(data)) {
  console.log(data.name);  // TypeScript knows it's User
}

// ✓ Exhaustiveness checking in switch
function assertNever(x: never): never {
  throw new Error("Unexpected value: " + x);
}
function handleShape(s: Shape) {
  switch (s.kind) {
    case "circle":    return circleArea(s);
    case "rectangle": return rectArea(s);
    default: return assertNever(s); // Error if Shape has unhandled member
  }
}

// ✓ Use ReturnType and Parameters utility types
async function createOrder(req: CreateOrderRequest): Promise<Order> { ... }
type OrderReturn = Awaited<ReturnType<typeof createOrder>>;  // Order
type OrderParams = Parameters<typeof createOrder>[0];        // CreateOrderRequest

// ✗ Avoid — these weaken type safety
declare const x: any;           // avoid any
declare const y: object;        // use Record<string,unknown> instead
declare const z: Function;      // use specific function signature
const arr: Array<any> = [];     // use Array<string> or unknown[]`}
      </CodeBlock>
      <InteractiveChallenge
        question="What does enabling strict mode in tsconfig do?"
        options={["Makes TypeScript compile faster", "Enables a group of checks including strictNullChecks, noImplicitAny, and strictFunctionTypes that catch the most common type bugs", "Prevents any runtime errors", "Disables all implicit type inference"]}
        correctIndex={1}
        explanation="strict: true is a shorthand that enables several strict flags simultaneously: strictNullChecks (null/undefined are not assignable to other types), noImplicitAny (must explicitly type anything that can't be inferred), strictFunctionTypes, strictPropertyInitialization, and more. Together they catch the vast majority of type-related bugs."
      />

    </LessonLayout>
  );
}
