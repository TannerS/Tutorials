import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ImperativeBridge() {
  return (
    <LessonLayout
      title="Imperative Bridge Patterns"
      sectionId="react19"
      lessonIndex={15}
      prev={{ path: '/react19/adapters', label: 'API Adapters & Error Envelopes' }}
      next={{ path: '/react19/module-federation', label: 'Module Federation' }}
    >
      <h2>Two Patterns, One Idea</h2>
      <p>
        React is declarative — components render as a function of state. Real apps
        sometimes need imperative flow control: <code>await confirm('Delete?')</code>
        before a destructive action, or "swap the auth token without unmounting the tree
        that lives under the auth provider." This lesson covers two patterns that give
        you the imperative feel without leaving React's model:
      </p>
      <ol>
        <li>
          <strong>Promise-bridged dialogs</strong> — an <code>await</code>-able
          <code>confirm()</code> or <code>approve()</code> that opens a modal, resolves
          when the user picks, and survives Strict-Mode double-invocation.
        </li>
        <li>
          <strong>Dual-context split</strong> — separate contexts for reading a value vs
          writing it, so mutations don't cascade-re-render every consumer of the value.
        </li>
      </ol>

      <h2>Pattern 1 — Promise-Bridged Dialogs</h2>
      <p>
        The API you want to write:
      </p>
      <CodeBlock language="tsx" title="What the caller sees">
{`function DeleteButton({ id }: { id: string }) {
  const confirm = useConfirm();
  const remove = useDeleteItem(id);

  async function handleClick() {
    const ok = await confirm({
      title: 'Delete this item?',
      body: 'This cannot be undone.',
      danger: true,
    });
    if (!ok) return;
    await remove.mutateAsync();
  }
  return <button onClick={handleClick}>Delete</button>;
}`}
      </CodeBlock>
      <p>
        No callbacks, no dialog-open state to track in the button, no matrix of
        <code>onConfirm</code>/<code>onCancel</code> props. The button reads like the
        business logic it represents. Behind the scenes, one shared provider renders the
        modal.
      </p>

      <FlowChart
        title="Promise-bridged dialog flow"
        chart={"graph TD\nA[Caller: await confirm]\nA --> B[Provider stores resolve fn in ref]\nB --> C[Provider setState opens dialog]\nC --> D[Modal renders]\nD --> E[User clicks OK or Cancel]\nE --> F[Handler reads resolve from ref, calls resolve boolean]\nF --> G[Provider setState closes dialog, clears ref]\nG --> H[Caller resumes with the value]"}
      />

      <h2>The Implementation</h2>
      <CodeBlock language="tsx" title="ConfirmProvider — the full pattern">
{`import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type ConfirmOptions = { title: string; body?: ReactNode; danger?: boolean };

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (!fn) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return fn;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  // The pending promise's resolver lives in a ref, not state.
  // Reason: we don't want the provider to re-render every time it changes,
  // and Strict Mode's double-invocation would otherwise create two dialogs.
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  // The dialog options do live in state — they need to re-render the modal.
  const [current, setCurrent] = useState<ConfirmOptions | null>(null);

  // Stable callback — never a new reference across renders.
  const confirm = useCallback((opts: ConfirmOptions) => {
    // If a previous dialog is still open, resolve it as cancelled and supersede.
    // This is the Strict-Mode / rapid-click dedup safety.
    if (resolveRef.current) {
      resolveRef.current(false);
    }
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setCurrent(opts);
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setCurrent(null);
    resolve?.(value);
  }, []);

  // Memoize the context value so consumers only re-render when 'confirm' identity
  // changes (which is never, given the empty deps above).
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {current !== null && (
        <Modal danger={current.danger} onClose={() => settle(false)}>
          <h3>{current.title}</h3>
          {current.body && <div>{current.body}</div>}
          <div className="row">
            <button onClick={() => settle(false)}>Cancel</button>
            <button
              onClick={() => settle(true)}
              className={current.danger ? 'danger' : 'primary'}
              autoFocus
            >
              {current.danger ? 'Delete' : 'OK'}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Why the ref, not state, for the resolver">
        <p>
          If the resolver lived in state, React 18/19 Strict Mode's double-render would
          call <code>confirm()</code> twice and store two different <code>resolve</code>
          functions. The first would leak — the caller would never see its resolution.
          A <code>ref</code> is mutable across renders without triggering re-render, and
          the "supersede previous" logic ensures at most one is ever pending.
        </p>
      </InfoBox>

      <h2>Extending to Typed Approvals</h2>
      <p>
        The same shape scales beyond boolean confirmations. Any imperative flow that fits
        "open modal → user chooses → resolve with a typed value" uses the identical
        pattern.
      </p>
      <CodeBlock language="tsx" title="A typed approval hook">
{`type ApprovalOptions<T> = {
  title: string;
  options: Array<{ label: string; value: T; danger?: boolean }>;
};

type ApprovalFn = <T>(opts: ApprovalOptions<T>) => Promise<T | null>;

const ApprovalContext = createContext<ApprovalFn | null>(null);

export function ApprovalProvider({ children }: { children: ReactNode }) {
  const resolveRef = useRef<((v: any) => void) | null>(null);
  const [current, setCurrent] = useState<ApprovalOptions<any> | null>(null);

  const approve = useCallback(<T,>(opts: ApprovalOptions<T>): Promise<T | null> => {
    if (resolveRef.current) resolveRef.current(null);
    return new Promise<T | null>((resolve) => {
      resolveRef.current = resolve;
      setCurrent(opts);
    });
  }, []);

  const settle = useCallback((value: unknown) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setCurrent(null);
    resolve?.(value);
  }, []);

  return (
    <ApprovalContext.Provider value={approve as ApprovalFn}>
      {children}
      {current && (
        <Modal onClose={() => settle(null)}>
          <h3>{current.title}</h3>
          {current.options.map((opt, i) => (
            <button
              key={i}
              className={opt.danger ? 'danger' : ''}
              onClick={() => settle(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </Modal>
      )}
    </ApprovalContext.Provider>
  );
}

// Usage
const approve = useApproval();
const choice = await approve<'accept' | 'reject' | 'defer'>({
  title: 'Review this request',
  options: [
    { label: 'Accept',  value: 'accept' },
    { label: 'Defer',   value: 'defer' },
    { label: 'Reject',  value: 'reject', danger: true },
  ],
});
if (choice === 'accept') { /* ... */ }`}
      </CodeBlock>

      <h2>Testing Promise Bridges</h2>
      <CodeBlock language="tsx" title="Test that resolves the dialog imperatively">
{`import { render, screen, userEvent } from '@/test-utils';
import { ConfirmProvider, useConfirm } from './ConfirmProvider';

function Harness({ onResult }: { onResult: (v: boolean) => void }) {
  const confirm = useConfirm();
  return (
    <button
      onClick={async () => onResult(await confirm({ title: 'Sure?' }))}
    >
      Delete
    </button>
  );
}

test('resolves true when OK is clicked', async () => {
  const results: boolean[] = [];
  render(
    <ConfirmProvider>
      <Harness onResult={(v) => results.push(v)} />
    </ConfirmProvider>,
  );
  await userEvent.click(screen.getByText('Delete'));
  await userEvent.click(await screen.findByText('OK'));
  expect(results).toEqual([true]);
});

test('supersedes a pending dialog when a second confirm arrives', async () => {
  // ... trigger two confirms in quick succession, assert the first resolves false.
});`}
      </CodeBlock>

      <h2>Pattern 2 — Dual-Context Split</h2>
      <p>
        The classic auth-context problem: every consumer of <code>useAuth()</code>
        re-renders whenever the auth token refreshes (every 5 minutes, say), even though
        the vast majority of consumers only care that "the user is logged in as X" —
        not the token bytes.
      </p>
      <p>
        The fix: split the provider into two contexts. One holds the value
        (<code>{`user`}</code>), one holds the setters. Components subscribe only to what
        they need.
      </p>

      <CodeBlock language="tsx" title="The single-context problem">
{`type AuthState = { user: User | null; token: string | null };
type AuthActions = {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
};

// Single context — everything in one value object.
const AuthContext = createContext<AuthState & AuthActions | null>(null);

// PROBLEM: every time the token refreshes, every consumer re-renders,
// even those that only read state.user.`}
      </CodeBlock>

      <CodeBlock language="tsx" title="The dual-context fix">
{`// Two contexts: one for the value, one for the actions.
const AuthStateContext   = createContext<AuthState | null>(null);
const AuthActionsContext = createContext<AuthActions | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null });

  // Actions live behind stable references — never a new function identity.
  const actions = useMemo<AuthActions>(() => ({
    login: async (email, password) => { /* ... */ setState({ user, token }); },
    logout: () => setState({ user: null, token: null }),
    refreshToken: async () => setState((s) => ({ ...s, token: await getFreshToken() })),
  }), []);

  return (
    <AuthActionsContext.Provider value={actions}>
      <AuthStateContext.Provider value={state}>
        {children}
      </AuthStateContext.Provider>
    </AuthActionsContext.Provider>
  );
}

export function useAuthState() {
  const ctx = useContext(AuthStateContext);
  if (!ctx) throw new Error('useAuthState must be inside <AuthProvider>');
  return ctx;
}

export function useAuthActions() {
  const ctx = useContext(AuthActionsContext);
  if (!ctx) throw new Error('useAuthActions must be inside <AuthProvider>');
  return ctx;
}`}
      </CodeBlock>

      <p>
        Now components make a deliberate choice:
      </p>
      <CodeBlock language="tsx" title="Consumers subscribe to only what they need">
{`// Header shows the user. Re-renders whenever state changes (rare).
function Header() {
  const { user } = useAuthState();
  return <div>Hello, {user?.name ?? 'guest'}</div>;
}

// LoginButton triggers actions. Never re-renders because actions are stable.
function LoginButton() {
  const { login } = useAuthActions();
  return <button onClick={() => login('a@b.com', 'pw')}>Login</button>;
}

// Interceptor needs the token for outgoing requests. Re-renders on token refresh.
function ApiInterceptor() {
  const { token } = useAuthState();
  useEffect(() => { installBearerInterceptor(token); return () => uninstall(); }, [token]);
  return null;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why not just useReducer or Zustand?">
        <p>
          <strong>useReducer</strong> improves state transitions but doesn't solve the
          re-render fan-out — dispatch is one shape, state is another, both usually still
          live in one context. <strong>Zustand</strong> (or Jotai) uses selectors and
          <code>useSyncExternalStore</code> under the hood, which is genuinely better if
          you have many consumers and complex state. Dual-context is the zero-dependency
          answer that works fine for auth, theme, feature flags, and other "read many,
          write occasionally" values.
        </p>
      </InfoBox>

      <h2>When to Split, When Not To</h2>
      <p>
        Splitting adds one file and one extra <code>&lt;Provider&gt;</code>. Only do it
        when you have real re-render pain.
      </p>
      <CodeBlock language="text" title="Rule of thumb">
{`Split into (state, actions) when:
  - The state changes on a schedule (token refresh, live subscription).
  - Many consumers read one field but only a few write.
  - React DevTools Profiler shows a Provider re-rendering causing wide render fan-out.

Keep single-context when:
  - The state and actions change together (a form's { values, setValues } is fine).
  - There are 2-3 consumers total.
  - It's a small feature-local provider (not app-wide).`}
      </CodeBlock>

      <h2>Combining Both — A Real-World Example</h2>
      <p>
        A "notification client" that maintains a WebSocket connection and lets consumers
        subscribe to incoming messages naturally uses both patterns: dual context (so a
        token rotation doesn't remount every subscriber) and a promise-bridged approval
        (so the app can pause and ask "the server sent this request — accept?").
      </p>
      <CodeBlock language="tsx" title="Sketch of a notification provider">
{`function NotificationProvider({ authToken, children }: Props) {
  // 1) Split contexts for read (client instance) vs write (reconnect action).
  const clientRef = useRef<NotificationClient>();
  const [client, setClient] = useState<NotificationClient | null>(null);

  // 2) Promise-bridge for server-initiated approvals (see pattern 1).
  const pendingApprovalsRef = useRef(new Map<string, (v: boolean) => void>());

  useEffect(() => {
    const c = new NotificationClient(authToken);
    c.on('approval-request', (req) => {
      // ask the user by opening the shared approval dialog...
      // resolve pendingApprovalsRef.current.get(req.id)!(userChoice);
    });
    clientRef.current = c;
    setClient(c);
    return () => c.close();
  }, [authToken]);

  return (
    <ReconnectContext.Provider value={reconnect}>
      <NotificationClientContext.Provider value={client}>
        {children}
      </NotificationClientContext.Provider>
    </ReconnectContext.Provider>
  );
}`}
      </CodeBlock>

      <h2>Anti-Patterns</h2>
      <InfoBox variant="danger" title="Traps that show up in imperative-bridge code">
        <ul>
          <li><strong>Resolver in state, not ref.</strong> Strict Mode double-fires it;
              first resolver leaks; the caller hangs forever.</li>
          <li><strong>No superseding logic.</strong> Two rapid clicks open two dialogs;
              the first is orphaned. Always resolve-as-cancelled when superseding.</li>
          <li><strong>Non-memoized context value.</strong> Every provider render creates
              a new object identity; every consumer re-renders. Wrap in
              <code>useMemo</code> with correct deps.</li>
          <li><strong>Dual-context that puts state and actions in one provider return
              value.</strong> Defeats the point; the actions object gets a new identity
              on state change and every action consumer re-renders anyway.</li>
          <li><strong>Bespoke event emitters inside providers</strong> to avoid the
              re-render problem — usually a sign you should reach for a real state
              library (Zustand / Jotai) instead.</li>
        </ul>
      </InfoBox>

      <h2>Checklist</h2>
      <InfoBox variant="success" title="Signs these patterns are in good shape">
        <ul>
          <li>One <code>ConfirmProvider</code> / <code>ApprovalProvider</code> lives near
              the root; callers <code>await confirm(...)</code>.</li>
          <li>The pending resolver lives in a <code>ref</code>, not state.</li>
          <li>Rapid re-invocations supersede the previous dialog and resolve it as
              cancelled.</li>
          <li>Auth / theme / config providers split state and actions when the state
              refreshes independently of consumers.</li>
          <li>Context values are memoized so identity doesn't churn.</li>
          <li>Tests spin up the provider and exercise the imperative call end-to-end.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="Your auth token refreshes every 5 minutes. Every consumer of useAuth() re-renders on refresh, including the header that only reads user.name. What's the surgical fix?"
        options={[
          "Wrap every consumer in React.memo",
          "Move the auth state into a Redux store",
          "Split the provider into two contexts: one for the auth state value, one for the actions. Components that only need user.name subscribe to a slice that changes rarely; the token consumer subscribes to a slice that changes often.",
          "Use useReducer instead of useState in the provider"
        ]}
        correctIndex={2}
        explanation="The re-render fan-out comes from the single context value being replaced on every token refresh, invalidating every consumer. Splitting the context lets you route consumers to only the slices they need — the header component reading user.name never re-renders on token refresh at all. React.memo doesn't help here because context change triggers consumers regardless of memoization. useReducer changes how state transitions but not the fan-out. A full state library works but is heavier than the dual-context split."
      />
    </LessonLayout>
  );
}
