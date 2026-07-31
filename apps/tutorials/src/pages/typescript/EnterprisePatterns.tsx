import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function EnterprisePatterns() {
  return (
    <LessonLayout
      title="Enterprise TypeScript Patterns"
      sectionId="typescript"
      lessonIndex={11}
      prev={{ path: '/typescript/interactive', label: 'Interactive Challenges' }}
      next={{ path: '/typescript/cheatsheet', label: 'Cheat Sheet' }}
    >
      <h2>Why This Lesson Exists</h2>
      <p>
        The Advanced Types lesson covers the mechanics — branded types, discriminated
        unions, <code>satisfies</code>, mapped and conditional types. This lesson covers
        how those mechanics get <em>applied</em> at scale in a real codebase, where the
        cost of getting types wrong is measured in production incidents, not exam
        points.
      </p>

      <h2>Pattern 1 — Branded IDs at Scale</h2>
      <p>
        In any non-trivial app, you'll pass IDs of different entities around as strings.
        Nothing stops <code>updateOrder(customerId)</code> from compiling. Branded
        (nominal) types close that hole.
      </p>

      <CodeBlock language="ts" title="A branded-id factory">
{`// Shared brand helper — one file, one export.
declare const brand: unique symbol;
export type Brand<T, TBrand extends string> = T & { readonly [brand]: TBrand };

// Per-entity ID types.
export type UserId     = Brand<string, 'UserId'>;
export type OrderId    = Brand<string, 'OrderId'>;
export type ProductId  = Brand<string, 'ProductId'>;
export type CustomerId = Brand<string, 'CustomerId'>;

// Constructors that validate at the boundary and produce the branded type.
export const UserId = {
  parse(raw: string): UserId {
    if (!/^usr_[A-Za-z0-9]{16}$/.test(raw)) {
      throw new Error(\`Invalid UserId: \${raw}\`);
    }
    return raw as UserId;
  },
  unsafe(raw: string): UserId {   // for tests, or when you're deserializing trusted input
    return raw as UserId;
  },
};

// The same shape for every entity. Copy-paste is fine here — the shape is stable.
export const OrderId = {
  parse(raw: string): OrderId {
    if (!/^ord_[A-Za-z0-9]{16}$/.test(raw)) throw new Error(\`Invalid OrderId: \${raw}\`);
    return raw as OrderId;
  },
  unsafe(raw: string): OrderId { return raw as OrderId; },
};`}
      </CodeBlock>

      <CodeBlock language="ts" title="What this catches">
{`function updateOrder(orderId: OrderId, patch: OrderPatch) { /* ... */ }

const user = await fetchUser(/* ... */);
updateOrder(user.id, patch);
//         ^^^^^^^ Argument of type 'UserId' is not assignable to parameter of type 'OrderId'.

// Still a string at runtime — no wrapper overhead.
console.log(user.id);                    // 'usr_...'
console.log(typeof user.id);             // 'string'
sessionStorage.setItem('u', user.id);    // works, string-compatible`}
      </CodeBlock>

      <h3>The Boundary Rule</h3>
      <InfoBox variant="tip" title="Brand only at the boundary; never in the middle">
        <p>
          The value <em>enters</em> your typed world through a constructor
          (<code>UserId.parse</code> at the fetch layer or JSON parse step) and stays
          branded from there. Every function that produces or consumes an ID uses the
          branded type. This turns every ID-shaped bug into a compile error.
        </p>
      </InfoBox>

      <CodeBlock language="ts" title="Wiring brands into adapters and fetch">
{`interface CustomerRow {
  id: string;              // wire — plain string
  email: string;
  display_name: string;
}

interface Customer {
  id: CustomerId;          // model — branded
  email: string;
  displayName: string;
}

const customerAdapter = {
  toModel(row: CustomerRow): Customer {
    return {
      id: CustomerId.parse(row.id),     // brand once, at the boundary
      email: row.email,
      displayName: row.display_name,
    };
  },
  toWire(m: Customer): CustomerRow {
    return { id: m.id, email: m.email, display_name: m.displayName };
    // branded value is still a string; sending it over the wire is fine.
  },
};`}
      </CodeBlock>

      <h2>Pattern 2 — Discriminated Unions for Every State Machine</h2>
      <p>
        Anywhere your UI or logic has multiple mutually-exclusive states — loading,
        success, error; draft, published, archived; connected, connecting,
        disconnected — a discriminated union produces cleaner code than a struct with
        optional fields.
      </p>

      <CodeBlock language="ts" title="A fetch result you can't misuse">
{`// Anti-pattern: everything optional, all combinations technically possible
type BadRemoteData<T> = {
  loading?: boolean;
  data?: T;
  error?: Error;
};

// Pattern: exclusive states
type RemoteData<T> =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; data: T }
  | { kind: 'error';   error: Error };

// Impossible to have data AND error at the same time. The type system says so.
function render<T>(rd: RemoteData<T>) {
  switch (rd.kind) {
    case 'idle':    return <Placeholder />;
    case 'loading': return <Spinner />;
    case 'success': return <Content data={rd.data} />;   // rd.data is T, not T | undefined
    case 'error':   return <ErrorMessage error={rd.error} />;
    default: {
      const _exhaustive: never = rd;
      return _exhaustive;
    }
  }
}`}
      </CodeBlock>

      <h3>Applied to Domain State</h3>
      <CodeBlock language="ts" title="A subscription workflow">
{`type Subscription =
  | { status: 'trial';    trialEndsAt: Date }
  | { status: 'active';   renewsAt: Date; plan: PlanId }
  | { status: 'past-due'; graceEndsAt: Date; plan: PlanId }
  | { status: 'canceled'; endedAt: Date };

function currentPlan(sub: Subscription): PlanId | null {
  switch (sub.status) {
    case 'trial':    return null;
    case 'canceled': return null;
    case 'active':
    case 'past-due': return sub.plan;    // TS knows both branches have .plan
  }
}

// Adding a new state (e.g. 'paused') is a compile error until every switch is updated.`}
      </CodeBlock>

      <h2>Pattern 3 — <code>satisfies</code> for Real Config Objects</h2>
      <p>
        <code>satisfies</code> tells the compiler "this value must conform to this type"
        without <em>widening</em> the value to the type. You keep the literal shape for
        downstream inference AND the compile-time check.
      </p>

      <CodeBlock language="ts" title="Route table: literal keys, checked shape">
{`type RouteHandler = (req: Request) => Promise<Response>;

// Type annotation widens — you lose knowledge of the specific keys.
const routes1: Record<string, RouteHandler> = {
  '/api/orders':   listOrders,
  '/api/orders/:id': getOrder,
};
// routes1['/typo'] compiles. No autocomplete on the keys.

// satisfies preserves the literal shape while checking it.
const routes = {
  '/api/orders':      listOrders,
  '/api/orders/:id':  getOrder,
  '/api/customers':   listCustomers,
} satisfies Record<string, RouteHandler>;

// Now:
//  - routes['/api/orders'] is a RouteHandler
//  - typeof routes has literal keys — 'routes' is not just Record<string, RouteHandler>
//  - Adding a value that isn't a RouteHandler is a compile error`}
      </CodeBlock>

      <CodeBlock language="ts" title="Feature-flag catalog — self-documenting typing">
{`type FlagSpec = { default: boolean; description: string };

const flags = {
  'new-checkout':   { default: false, description: 'Cutover to the v2 checkout flow' },
  'darkmode':       { default: true,  description: 'Dark mode enabled for all users' },
  'ai-suggestions': { default: false, description: 'Show ML-generated suggestions' },
} satisfies Record<string, FlagSpec>;

// Downstream — flag names become a real type.
type FlagName = keyof typeof flags;    // 'new-checkout' | 'darkmode' | 'ai-suggestions'

function isEnabled(name: FlagName): boolean {
  return flags[name].default;
}

isEnabled('new-checkout');   // ok
isEnabled('darkomode');       // Argument of type '"darkomode"' is not assignable...`}
      </CodeBlock>

      <h3>satisfies vs 'as' vs annotation</h3>
      <CodeBlock language="text" title="Three ways to constrain a value — different trade-offs">
{`Value: any                Compile check: no    Inference: any
Value: T (annotation)     Compile check: yes   Inference: WIDENED to T
Value as T                Compile check: NO    Inference: T (unsafe assertion)
Value satisfies T         Compile check: yes   Inference: preserved literal type

Rule: use satisfies for anything you author as a value that must conform to a schema
but where you also want to look up specific keys or narrow later.`}
      </CodeBlock>

      <h2>Pattern 4 — Type Predicates for Runtime Guards</h2>
      <p>
        When you validate a value at runtime, use a type predicate return so the compiler
        picks up the narrowing.
      </p>
      <CodeBlock language="ts" title="Type predicates in practice">
{`interface CustomerRow { id: string; email: string; display_name: string; }

// The 'v is CustomerRow' return type tells TS: if this returns true,
// the value at the call site is a CustomerRow.
function isCustomerRow(v: unknown): v is CustomerRow {
  return typeof v === 'object' && v !== null
    && typeof (v as any).id === 'string'
    && typeof (v as any).email === 'string'
    && typeof (v as any).display_name === 'string';
}

async function loadCustomer(id: string): Promise<Customer> {
  const raw = await (await fetch(\`/api/customers/\${id}\`)).json() as unknown;
  if (!isCustomerRow(raw)) {
    throw new Error('Unexpected shape from /api/customers');
  }
  // raw is now typed as CustomerRow
  return customerAdapter.toModel(raw);
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Predicates > casts at the boundary">
        <p>
          <code>as CustomerRow</code> tells the compiler "trust me" — a lie you can't
          take back. Type predicates make you write the check <em>and</em> get the
          narrowing. For high-stakes boundaries (form input, third-party APIs, LocalStorage
          reads) prefer <code>zod</code>, <code>valibot</code>, or another schema library
          — the same predicate story, but the check code is generated from the schema.
        </p>
      </InfoBox>

      <h2>Pattern 5 — Exhaustiveness Guards</h2>
      <p>
        Any time you switch on a discriminant, close with a <code>never</code> catch to
        force the compiler to flag missing cases.
      </p>
      <CodeBlock language="ts" title="One tiny helper, many payoffs">
{`export function assertNever(x: never): never {
  throw new Error(\`Unhandled discriminated case: \${JSON.stringify(x)}\`);
}

function describeSub(sub: Subscription): string {
  switch (sub.status) {
    case 'trial':    return 'Trial ends ' + sub.trialEndsAt.toISOString();
    case 'active':   return 'Renews ' + sub.renewsAt.toISOString();
    case 'past-due': return 'Payment overdue';
    case 'canceled': return 'Canceled ' + sub.endedAt.toISOString();
    default:         return assertNever(sub);
  }
}

// Add a new status to Subscription -> assertNever call becomes a compile error.
// The switch above stops compiling until every case is handled.`}
      </CodeBlock>

      <h2>Pattern 6 — Const Assertions for Configuration Trees</h2>
      <CodeBlock language="ts" title="'as const' vs plain literal">
{`// Without: TypeScript widens strings to 'string', numbers to 'number'.
const config = {
  version: 2,
  channels: ['email', 'sms'],
  levels: { retry: 3 }
};
// typeof config.channels: string[]
// typeof config.version: number

// With 'as const': every value is its literal type.
const config = {
  version: 2,
  channels: ['email', 'sms'],
  levels: { retry: 3 }
} as const;
// typeof config.channels: readonly ['email', 'sms']
// typeof config.version: 2

// This unlocks:
type Channel = typeof config.channels[number];   // 'email' | 'sms'
type Version = typeof config.version;            // 2`}
      </CodeBlock>

      <h2>Pattern 7 — Result Type Instead of Throwing</h2>
      <p>
        For expected failure modes (parse errors, validation failures, business rule
        violations) a <code>Result</code> type gives callers explicit branches. Throwing
        should be reserved for genuinely exceptional errors.
      </p>
      <CodeBlock language="ts" title="A minimal Result">
{`export type Result<T, E> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

export const Result = {
  ok:    <T>(value: T): Result<T, never>      => ({ ok: true, value }),
  err:   <E>(error: E): Result<never, E>      => ({ ok: false, error }),
};

// A validator that returns instead of throwing
type FieldErrors = Record<string, string>;
function parseEmail(raw: unknown): Result<string, FieldErrors> {
  if (typeof raw !== 'string')       return Result.err({ email: 'must be a string' });
  if (!raw.includes('@'))            return Result.err({ email: 'must contain @' });
  if (raw.length > 254)              return Result.err({ email: 'too long' });
  return Result.ok(raw);
}

// Consumer
const r = parseEmail(input);
if (!r.ok) return <ValidationBanner errors={r.error} />;
sendWelcome(r.value);`}
      </CodeBlock>

      <h2>Pattern 8 — Public Types via <code>Omit</code> and <code>Pick</code></h2>
      <CodeBlock language="ts" title="Sculpt public types from a canonical model">
{`interface Customer {
  id: CustomerId;
  email: string;
  displayName: string;
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date | null;
  metadata: Record<string, string>;
}

// A create request drops server-generated fields.
export type CreateCustomerRequest = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;

// An update request is partial except for the id.
export type UpdateCustomerRequest = { id: CustomerId } & Partial<Omit<Customer, 'id'>>;

// A public list view drops sensitive fields.
export type CustomerListItem = Pick<Customer, 'id' | 'displayName' | 'status'>;`}
      </CodeBlock>

      <InfoBox variant="tip" title="Sculpting keeps types honest">
        <p>
          You could hand-write every request/response type as a separate interface. Six
          months later, adding a field to <code>Customer</code> means editing six type
          declarations and remembering to keep them in sync. <code>Omit/Pick</code>-derived
          types stay in sync by construction.
        </p>
      </InfoBox>

      <h2>Pattern 9 — <code>readonly</code> on Function Parameters</h2>
      <CodeBlock language="ts" title="Signal intent, catch accidental mutations">
{`// The signature says: 'I do not modify this array'.
function total(items: readonly Item[]): Money {
  // items.push(...)  <- compile error
  return items.reduce((sum, i) => sum + i.price, 0);
}

// For records, DeepReadonly is a common utility.
type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

function preview(order: DeepReadonly<Order>) { /* ... */ }`}
      </CodeBlock>

      <h2>Pattern 10 — Documenting Types Inline With JSDoc</h2>
      <p>
        Types are the ultimate documentation, but a one-line JSDoc on a non-obvious field
        pays for itself at every autocomplete.
      </p>
      <CodeBlock language="ts" title="JSDoc as hover-help">
{`export interface Money {
  /** ISO 4217 currency code, e.g. 'USD', 'EUR'. */
  currency: string;
  /**
   * Amount in the currency's smallest unit (cents, satoshi, ...).
   * NEVER represent money as a floating-point number.
   */
  minorUnits: number;
}

export function format(m: Money): string { /* ... */ }
//                     ^ hover shows the JSDoc, immediately clarifying "minorUnits"`}
      </CodeBlock>

      <h2>Anti-Patterns Recap</h2>
      <InfoBox variant="danger" title="Habits that erode type safety">
        <ul>
          <li>
            <strong><code>any</code> and <code>as</code> at the boundary.</strong> The
            reasons TypeScript exists. Prefer <code>unknown</code> + a type predicate.
          </li>
          <li>
            <strong>String IDs everywhere.</strong> Nothing catches
            <code>updateOrder(user.id)</code>. Brand your IDs.
          </li>
          <li>
            <strong>Struct-of-optionals for state machines.</strong> Every combination
            is technically legal; bugs are inevitable. Discriminated unions.
          </li>
          <li>
            <strong><code>enum</code> for string constants.</strong> TypeScript's enum
            has known trade-offs (numeric enums leak reverse-mappings, string enums
            aren't structurally compatible). Prefer <code>as const</code> objects with
            a derived union type.
          </li>
          <li>
            <strong><code>satisfies</code> confused with <code>as</code>.</strong>
            <code>as</code> is a claim you can't take back. <code>satisfies</code> is
            a check that keeps inference.
          </li>
          <li>
            <strong>Deep <code>readonly</code> everywhere out of superstition.</strong>
            Costs autocomplete quality and adds friction. Use it where it prevents an
            actual class of bugs, not by default.
          </li>
        </ul>
      </InfoBox>

      <h2>Checklist</h2>
      <InfoBox variant="success" title="Signs your TS is enterprise-grade">
        <ul>
          <li>Every ID has a branded type; construction happens once at a boundary.</li>
          <li>State machines are discriminated unions; every switch has an
              <code>assertNever</code> guard.</li>
          <li><code>satisfies</code> preserves literal shapes for configs, routes,
              feature-flag tables.</li>
          <li>Request/response types are derived via <code>Omit</code>/<code>Pick</code>
              from a canonical model — no hand-maintained parallel interfaces.</li>
          <li>Boundaries (network, storage, form input) use type predicates or a schema
              library, not <code>as</code>.</li>
          <li>Money and time have dedicated types; never <code>number</code> for money
              or <code>string</code> for opaque datetimes.</li>
          <li>Non-obvious fields carry a JSDoc line for hover help.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="You define type Status = 'draft' | 'published' | 'archived' and a switch on it. Later someone adds a 'scheduled' case to the type. Where does TypeScript complain?"
        options={[
          "TypeScript doesn't complain — it just returns undefined at runtime for unhandled cases",
          "TypeScript complains at every function that returns Status",
          "TypeScript complains only if you use exhaustiveness checking via const _: never = value in the default branch — otherwise the switch silently misses the new case",
          "TypeScript complains only if strict mode is enabled"
        ]}
        correctIndex={2}
        explanation="TypeScript by itself won't flag a switch that doesn't cover every case of a union — it just infers the return type more loosely. The exhaustiveness pattern (`const _exhaustive: never = value;` in the default branch, or an `assertNever(value)` helper) forces the type system to check every case, because `never` only assigns from a value TypeScript has narrowed to `never`. Add 'scheduled' to the union, and every switch that relies on this pattern breaks — you find them all at compile time instead of in production."
      />
    </LessonLayout>
  );
}
