import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Adapters() {
  return (
    <LessonLayout
      title="API Adapters & Error Envelopes"
      sectionId="react19"
      lessonIndex={14}
      prev={{ path: '/react19/cheat-sheet', label: 'Cheat Sheet' }}
      next={{ path: '/react19/imperative-bridge', label: 'Imperative Bridge Patterns' }}
    >
      <h2>Why This Lesson Exists</h2>
      <p>
        Two shapes almost always disagree in a real product:
      </p>
      <ol>
        <li>What the <strong>backend sends</strong> — snake_case fields, ISO date strings,
            optional envelopes, nullable IDs, evolving schemas across versions.</li>
        <li>What your <strong>UI wants</strong> — camelCase, real <code>Date</code> objects,
            discriminated union states, non-nullable IDs where the UI type guarantees them.</li>
      </ol>
      <p>
        Sprinkling the mapping across the entire component tree ("call
        <code>new Date(response.data.created_at)</code> in the component that displays
        it") is a slow-burning fire. The adapter pattern gives you one seam where the wire
        shape becomes the UI shape.
      </p>

      <FlowChart
        title="Where an adapter sits"
        chart={"graph LR\nA[Backend API] -->|wire JSON| B[Fetch layer]\nB -->|typed ApiRow| C[Adapter]\nC -->|UI-shaped Model| D[Hooks / State]\nD --> E[Components]\nE -->|form data| F[Adapter reverse]\nF -->|typed ApiPayload| B"}
      />

      <h2>The Interface</h2>
      <p>
        A single, generic interface. Bi-directional so create/update flows can round-trip
        the same type.
      </p>
      <CodeBlock language="ts" title="A reusable Adapter interface">
{`// TWire = server's shape (JSON row, snake_case, envelope stripped)
// TModel = UI's shape (camelCase, real Date/Enum types, non-nullable where UI guarantees it)

export interface Adapter<TWire, TModel> {
  toModel(row: TWire): TModel;
  toWire(model: TModel): TWire;
  // Optional convenience for lists.
  rowKey?(model: TModel): string;
}

// A safer variant when creation and update payloads differ from the read row.
export interface EntityAdapter<TRead, TModel, TCreate = TRead, TUpdate = Partial<TCreate>> {
  toModel(row: TRead): TModel;
  toCreatePayload(model: Omit<TModel, 'id'>): TCreate;
  toUpdatePayload(model: TModel): TUpdate;
  rowKey?(model: TModel): string;
}`}
      </CodeBlock>

      <h2>A Concrete Adapter</h2>
      <CodeBlock language="ts" title="A customer entity adapter">
{`// The wire shape — exactly what the backend sends.
interface CustomerRow {
  id: string;
  email: string;
  display_name: string;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;         // ISO 8601
  updated_at: string | null;
  metadata?: Record<string, string>;
}

// The UI shape — how components consume it.
export interface Customer {
  id: string;
  email: string;
  displayName: string;
  status: CustomerStatus;     // typed enum from the client
  createdAt: Date;
  updatedAt: Date | null;
  metadata: Record<string, string>;   // never undefined in the model
}

export enum CustomerStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Archived = 'ARCHIVED',
}

export const customerAdapter: Adapter<CustomerRow, Customer> = {
  toModel(row) {
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      status: mapStatus(row.status),
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
      metadata: row.metadata ?? {},        // canonicalize to non-optional
    };
  },
  toWire(model) {
    return {
      id: model.id,
      email: model.email,
      display_name: model.displayName,
      status: unmapStatus(model.status),
      created_at: model.createdAt.toISOString(),
      updated_at: model.updatedAt?.toISOString() ?? null,
      metadata: Object.keys(model.metadata).length ? model.metadata : undefined,
    };
  },
  rowKey: (m) => m.id,
};

function mapStatus(s: CustomerRow['status']): CustomerStatus {
  switch (s) {
    case 'active':   return CustomerStatus.Active;
    case 'inactive': return CustomerStatus.Inactive;
    case 'archived': return CustomerStatus.Archived;
  }
}
function unmapStatus(s: CustomerStatus): CustomerRow['status'] {
  return s.toLowerCase() as CustomerRow['status'];
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why the round-trip matters">
        <p>
          If your adapter is only one-way, updates become painful — you have to reconstruct
          the wire shape by hand at every form submission. A round-trip adapter means
          fetch → edit in UI → submit is one clean pipeline with no lossy conversions in
          the middle.
        </p>
      </InfoBox>

      <h2>Wiring the Adapter Into Fetching</h2>
      <p>
        The adapter is called once, at the fetch-layer boundary. Nothing downstream ever
        touches the wire shape again.
      </p>
      <CodeBlock language="tsx" title="A hook that returns UI-shaped data">
{`import { useQuery } from '@tanstack/react-query';   // or your equivalent
import { customerAdapter, type Customer } from './customerAdapter';

async function fetchCustomer(id: string): Promise<Customer> {
  const res = await fetch(\`/api/customers/\${id}\`);
  if (!res.ok) throw await parseApiError(res);
  const row = (await res.json()) as { data: CustomerRow };
  return customerAdapter.toModel(row.data);
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => fetchCustomer(id),
  });
}

// Component never sees the wire shape.
function CustomerCard({ id }: { id: string }) {
  const { data, isLoading, error } = useCustomer(id);
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return (
    <div>
      <h3>{data!.displayName}</h3>
      <p>Joined {data!.createdAt.toLocaleDateString()}</p>
    </div>
  );
}`}
      </CodeBlock>

      <h2>Error Envelope Normalization</h2>
      <p>
        The other half of the same problem. Real APIs return errors in multiple shapes
        even inside one product:
      </p>
      <ul>
        <li>New endpoints use RFC 7807 ProblemDetail: <code>{`{ type, title, status, detail, code, errors: [...] }`}</code>.</li>
        <li>Legacy endpoints send <code>{`{ error: { code, message } }`}</code>.</li>
        <li>Older still: <code>{`{ error: "some string" }`}</code>.</li>
        <li>Gateway timeouts return HTML.</li>
        <li>Network failures throw before any body arrives.</li>
      </ul>
      <p>
        The fix is a normalization layer that turns all of them into one
        <code>ApiError</code> your UI understands.
      </p>

      <CodeBlock language="ts" title="A unified error type">
{`export type ApiError =
  | { kind: 'validation';   fieldErrors: Record<string, string>; message: string }
  | { kind: 'business';     code: string; message: string; details?: unknown }
  | { kind: 'auth';         message: string }
  | { kind: 'notFound';     message: string }
  | { kind: 'server';       message: string; correlationId?: string }
  | { kind: 'network';      message: string }
  | { kind: 'unknown';      message: string; raw?: unknown };

export async function parseApiError(res: Response): Promise<ApiError> {
  if (res.status === 401) {
    return { kind: 'auth', message: 'Not authenticated' };
  }
  if (res.status === 404) {
    return { kind: 'notFound', message: await safeText(res) };
  }

  // Some servers send HTML error pages. If so, fail closed as 'server'.
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('json')) {
    return { kind: 'server', message: \`\${res.status} \${res.statusText}\` };
  }

  const body = await res.json().catch(() => null) as unknown;

  // Shape 1 — RFC 7807 ProblemDetail
  if (isProblemDetail(body)) {
    if (body.status === 400 && Array.isArray(body.errors)) {
      return {
        kind: 'validation',
        message: body.detail ?? body.title ?? 'Validation failed',
        fieldErrors: Object.fromEntries(
          body.errors.map((e: any) => [e.field, e.message])
        ),
      };
    }
    return {
      kind: res.status >= 500 ? 'server' : 'business',
      code: body.code ?? String(body.status ?? res.status),
      message: body.detail ?? body.title ?? 'Request failed',
      details: body,
    } as ApiError;
  }

  // Shape 2 — legacy { error: { code, message } }
  if (isNestedError(body)) {
    return {
      kind: 'business',
      code: body.error.code,
      message: body.error.message,
    };
  }

  // Shape 3 — { error: "string" }
  if (isStringError(body)) {
    return { kind: 'business', code: 'UNKNOWN', message: body.error };
  }

  // Anything else — reachable server, unrecognized body.
  return { kind: 'unknown', message: \`Unexpected \${res.status} response\`, raw: body };
}

function isProblemDetail(v: unknown): v is Record<string, any> {
  return typeof v === 'object' && v !== null &&
         'status' in v && ('title' in v || 'detail' in v);
}
function isNestedError(v: unknown): v is { error: { code: string; message: string } } {
  return typeof v === 'object' && v !== null &&
         'error' in v && typeof (v as any).error === 'object' &&
         'code' in (v as any).error && 'message' in (v as any).error;
}
function isStringError(v: unknown): v is { error: string } {
  return typeof v === 'object' && v !== null &&
         'error' in v && typeof (v as any).error === 'string';
}

async function safeText(res: Response): Promise<string> {
  try { return await res.text(); } catch { return res.statusText; }
}`}
      </CodeBlock>

      <h2>Discriminated Unions Make Error UI Bulletproof</h2>
      <p>
        Because <code>ApiError</code> is a discriminated union on <code>kind</code>, the
        UI must handle every case — TypeScript enforces it.
      </p>
      <CodeBlock language="tsx" title="Exhaustive error rendering">
{`function ErrorBanner({ error }: { error: ApiError }) {
  switch (error.kind) {
    case 'validation':
      return (
        <div role="alert" className="banner banner-warning">
          <p>{error.message}</p>
          <ul>
            {Object.entries(error.fieldErrors).map(([field, msg]) => (
              <li key={field}><b>{field}</b>: {msg}</li>
            ))}
          </ul>
        </div>
      );
    case 'business':
      return <div className="banner banner-warning">{error.message}</div>;
    case 'auth':
      return <RedirectToLogin />;
    case 'notFound':
      return <NotFoundPage />;
    case 'server':
    case 'unknown':
      return (
        <div className="banner banner-danger">
          Something went wrong. {error.correlationId && \`Ref: \${error.correlationId}\`}
        </div>
      );
    case 'network':
      return <div className="banner banner-danger">Cannot reach the server. Check your connection.</div>;
    default: {
      const _exhaustive: never = error;
      return _exhaustive;
    }
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The 'never' trick catches missing cases at build time">
        <p>
          The <code>const _exhaustive: never = error;</code> line only compiles if every
          <code>kind</code> was handled above. Add a new kind to the union and TypeScript
          instantly flags every switch that forgot to handle it. This is the pattern that
          makes discriminated unions worth the ceremony.
        </p>
      </InfoBox>

      <h2>Fetch Wrapper — One Place for All the Rules</h2>
      <p>
        Combining adapter + envelope normalization + network-error handling into a small
        wrapper is the pragmatic way to keep call sites clean.
      </p>
      <CodeBlock language="ts" title="A tiny typed fetch helper">
{`export async function apiFetch<TWire, TModel>(
  path: string,
  init: RequestInit,
  adapter: Adapter<TWire, TModel>,
): Promise<TModel> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch (e) {
    throw { kind: 'network', message: e instanceof Error ? e.message : 'Network failure' } as ApiError;
  }
  if (!res.ok) throw await parseApiError(res);
  const body = (await res.json()) as { data: TWire };
  return adapter.toModel(body.data);
}

// Usage
const customer = await apiFetch<CustomerRow, Customer>(
  \`/api/customers/\${id}\`,
  { method: 'GET' },
  customerAdapter,
);`}
      </CodeBlock>

      <h2>Versioned Wire Shapes</h2>
      <p>
        When a backend endpoint changes shape, the natural pattern is a versioned adapter
        family that all produce the same model.
      </p>
      <CodeBlock language="ts" title="Two versions of the same wire, one model">
{`// v1 — deprecated but still in use somewhere
interface CustomerRowV1 { id: string; name: string; }
// v2 — current
interface CustomerRowV2 { id: string; display_name: string; status: string; }

export const customerV1Adapter: Adapter<CustomerRowV1, Customer> = {
  toModel: (row) => ({ id: row.id, displayName: row.name, status: CustomerStatus.Active, /* defaults */ } as Customer),
  toWire: () => { throw new Error('v1 is read-only'); },
};
export const customerV2Adapter: Adapter<CustomerRowV2, Customer> = { /* as above */ } as any;

// Callers pick the right adapter per endpoint version.
const legacy = await apiFetch('/api/v1/customers/1', {}, customerV1Adapter);
const current = await apiFetch('/api/v2/customers/1', {}, customerV2Adapter);`}
      </CodeBlock>

      <h2>Testing Adapters</h2>
      <p>
        Adapters are pure functions — the easiest thing in the app to test. A snapshot of
        a real wire response + expected model is often enough.
      </p>
      <CodeBlock language="ts" title="Adapter tests">
{`import { customerAdapter } from './customerAdapter';

test('toModel maps snake_case + parses dates', () => {
  const row: CustomerRow = {
    id: '1', email: 'a@b.com', display_name: 'Alice',
    status: 'active', created_at: '2026-01-15T12:00:00Z',
    updated_at: null,
  };
  const model = customerAdapter.toModel(row);
  expect(model.displayName).toBe('Alice');
  expect(model.status).toBe(CustomerStatus.Active);
  expect(model.createdAt).toEqual(new Date('2026-01-15T12:00:00Z'));
  expect(model.updatedAt).toBeNull();
  expect(model.metadata).toEqual({});
});

test('round-trip is stable', () => {
  const row: CustomerRow = { /* ... */ } as CustomerRow;
  const model = customerAdapter.toModel(row);
  const wire = customerAdapter.toWire(model);
  expect(wire).toEqual(row);
});`}
      </CodeBlock>

      <h2>Anti-Patterns to Avoid</h2>
      <InfoBox variant="danger" title="Traps that ruin adapters over time">
        <ul>
          <li><strong>Adapter-per-component</strong>: one adapter for the list, one for the
              detail page, one for the form. Ends up with three sources of truth. Normalize
              on a single canonical model per entity.</li>
          <li><strong>Silent field renames</strong> without updating the adapter — the
              component then reads <code>undefined</code>. Prefer TypeScript strict null
              checks + explicit fallbacks in the adapter.</li>
          <li><strong>Business logic in adapters</strong>: computing totals, filtering,
              formatting for display. Adapters translate; hooks and components consume.</li>
          <li><strong>Ignoring the reverse direction</strong>: create/update flows manually
              rebuild the wire shape. Provide <code>toWire</code> or a
              <code>toCreatePayload</code>/<code>toUpdatePayload</code> pair.</li>
          <li><strong>Errors bypassing the normalizer</strong>: one call site returns a raw
              string, another returns an object. The UI grows a matrix of
              <code>typeof error === 'string' ? ... : ...</code> checks. Always route
              through <code>parseApiError</code>.</li>
        </ul>
      </InfoBox>

      <h2>Checklist</h2>
      <InfoBox variant="success" title="Signs your adapter layer is healthy">
        <ul>
          <li>Exactly one adapter per entity, exporting <code>toModel</code> and
              <code>toWire</code> (or create/update variants).</li>
          <li>Components never see the wire shape.</li>
          <li>All errors flow through a single normalizer into a discriminated
              <code>ApiError</code> union.</li>
          <li>Error UI uses a <code>switch</code> on <code>kind</code> with a
              <code>never</code> exhaustiveness check.</li>
          <li>Adapters have unit tests for the round-trip and for edge cases
              (nulls, missing metadata, enum mapping).</li>
          <li>Versioned adapters (v1/v2) all produce the same model — the UI never
              branches on endpoint version.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="Your UI shows dates by calling new Date(customer.created_at).toLocaleDateString() in dozens of components. The backend suddenly starts returning epoch milliseconds instead of ISO strings. What's the right structural fix — not just a hotfix?"
        options={[
          "Add a defensive if-check inline at every component that formats a date",
          "Add a Jackson deserializer on the backend that always emits ISO strings",
          "Put an adapter layer between fetch and state: adapter.toModel() converts created_at to a real Date object exactly once, and components consume a Date, not a string. When the wire shape changes, only the adapter changes.",
          "Use a global custom hook that memoizes date parsing"
        ]}
        correctIndex={2}
        explanation="The reason the change is painful is that the wire shape (a string) leaked into every consumer. An adapter layer is the seam where wire shape becomes UI shape: consumers hold a `Date`, and switching between ISO strings, epoch millis, or a whole new field structure only requires updating the adapter. This is the same reason enterprise codebases universally have some form of adapter/mapper/translator between API and UI models."
      />
    </LessonLayout>
  );
}
