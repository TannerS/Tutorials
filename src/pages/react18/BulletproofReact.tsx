import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function BulletproofReact() {
  return (
    <LessonLayout
      title="Bulletproof React — A Concrete File Structure"
      sectionId="react18"
      lessonIndex={19}
      prev={{ path: '/react18/feature-folder', label: 'Feature-Based Architecture' }}
      next={{ path: '/react18/error-boundaries', label: 'Error Boundaries' }}
    >
      <p>
        <a href="https://github.com/alan2207/bulletproof-react" rel="noreferrer" target="_blank">
          Bulletproof React
        </a>{' '}
        is an open-source reference architecture (35,000+ GitHub stars, MIT licensed,
        maintained by Alan Alickovic) that answers the question the previous lesson left open:
        <em>okay, feature folders — but what exactly goes in one, and how do I stop people from
        cheating on the boundary?</em> It isn't a framework or a package you install. It's a
        sample app plus a set of docs showing one opinionated, consistent way to wire up
        components, hooks, API calls, state, and tests. This lesson maps its actual folder
        names and rules — verified against the live repo, not a half-remembered version of it.
      </p>

      <InfoBox variant="note" title="Read Feature-Based Architecture first if you haven't">
        <p style={{ marginBottom: 0 }}>
          This lesson assumes you already have the core idea: group code by feature, not by
          kind, and put a boundary between features so nothing can silently reach into another
          feature's internals. That lesson covers <em>why</em>. This one covers the specific{' '}
          <em>what</em> — real folder names, a real ESLint config, a real API layer pattern —
          as documented in the repo today.
        </p>
      </InfoBox>

      <h2>It's a Monorepo Now, With Three Reference Apps</h2>
      <p>
        If you looked at this repo a couple of years ago, expect one thing to have changed:
        it's no longer a single sample app. The repo root has an <code>apps/</code> folder
        with three full example implementations of the same architecture —{' '}
        <code>nextjs-app</code> (App Router), <code>nextjs-pages</code> (Pages Router), and{' '}
        <code>react-vite</code>. The principles — feature folders, unidirectional imports, the
        API layer shape — are identical across all three. Since this site is Vite-based, every
        file path and code sample below comes from <code>apps/react-vite</code>.
      </p>

      <h2>The Top-Level src/ Layout</h2>
      <CodeBlock language="text" title="apps/react-vite/src — verified against the live repo">
{`src/
├─ app/                 # routing, providers, the router itself
│  ├─ routes/
│  ├─ index.tsx         # main application component
│  ├─ provider.tsx      # wraps the tree in every global provider
│  └─ router.tsx        # router configuration
├─ assets/              # static files: images, fonts
├─ components/          # shared components used across the whole app
├─ config/              # env.ts, paths.ts — global config, exported env vars
├─ features/            # feature-based modules — see below
│  ├─ auth/
│  ├─ comments/
│  ├─ discussions/
│  ├─ teams/
│  └─ users/
├─ hooks/                # shared hooks used across the whole app
├─ lib/                  # preconfigured libraries: api-client.ts, react-query.ts, auth.tsx
├─ testing/               # test utilities and MSW mocks
├─ types/                 # shared types used across the app
├─ utils/                 # shared utility functions
├─ main.tsx
└─ vite-env.d.ts`}
      </CodeBlock>
      <p>
        This is close to what <code>FeatureFolder.tsx</code> called <code>shared/</code>,
        except Bulletproof React doesn't nest it under one folder — <code>components/</code>,{' '}
        <code>hooks/</code>, <code>lib/</code>, <code>types/</code>, and <code>utils/</code> sit
        directly under <code>src/</code>, each one a distinct shared concern. <code>app/</code>{' '}
        is the shell: routing and top-level providers, nothing feature-specific. Everything
        else lives inside a feature. Note there&apos;s no top-level <code>stores/</code>{' '}
        folder in the live repo, despite the project-structure docs sketching one — global
        Zustand stores are colocated with the UI they back instead. The notifications store used
        later in this lesson, for example, actually lives at{' '}
        <code>src/components/ui/notifications/notifications-store.ts</code>.
      </p>

      <h2>Inside a Single Feature</h2>
      <CodeBlock language="text" title="src/features/discussions — verified against the live repo">
{`src/features/discussions
├─ api/
│  ├─ get-discussions.ts    # one file per endpoint
│  ├─ get-discussion.ts
│  ├─ create-discussion.ts
│  ├─ update-discussion.ts
│  └─ delete-discussion.ts
└─ components/
   ├─ discussions-list.tsx
   ├─ discussion-view.tsx
   └─ ...`}
      </CodeBlock>
      <p>
        The docs list a fuller template — <code>api/</code>, <code>assets/</code>,{' '}
        <code>components/</code>, <code>hooks/</code>, <code>stores/</code>, <code>types/</code>,{' '}
        <code>utils/</code> — but <code>discussions</code> in the actual repo only needs{' '}
        <code>api/</code> and <code>components/</code> today. That's intentional:
      </p>
      <InfoBox variant="tip" title="Only include what a feature actually needs">
        <p style={{ marginBottom: 0 }}>
          The docs are explicit: "You don't need all of these folders for every feature. Only
          include the ones that are necessary for the feature." A feature with no local state
          doesn't get a <code>stores/</code> folder just because the template lists one.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="No index.ts — this is where it diverges from the general pattern">
        <p>
          The previous lesson's rule was: expose a feature's public surface through an{' '}
          <code>index.ts</code> barrel. Bulletproof React explicitly recommends{' '}
          <strong>against</strong> that now. Its docs say plainly: "In the past, it was
          recommended to use barrel files... However, it can cause issues for Vite to do tree
          shaking and can lead to performance issues. Therefore, it is recommended to import the
          files directly."
        </p>
        <p style={{ marginBottom: 0 }}>
          None of the feature folders in the live repo has an <code>index.ts</code>. The
          boundary isn't enforced by a curated export list — it's enforced entirely by ESLint,
          which is the next section.
        </p>
      </InfoBox>

      <h2>Unidirectional Codebase Architecture</h2>
      <p>
        The rule: code flows one direction, shared → features → app, never backward, and never
        sideways between two features.
      </p>

      <FlowChart
        title="Unidirectional imports (and where the ESLint rule blocks you)"
        chart={"graph TD\n  Shared[shared: components/ hooks/ lib/ types/ utils/] --> Auth[features/auth]\n  Shared --> Comments[features/comments]\n  Shared --> Discussions[features/discussions]\n  Auth --> App[app: routes + router + provider]\n  Comments --> App\n  Discussions --> App\n  Shared --> App\n  Discussions -.->|blocked: import/no-restricted-paths| Comments\n  App -.->|blocked: features must not import app| Auth\n  style Shared fill:#1a3329\n  style App fill:#1a2744"}
      />

      <p>
        This is stricter than the "go through the other feature's public API" pattern from the
        previous lesson. Bulletproof React doesn't give features an approved way to import each
        other at all — cross-feature imports are disabled outright. If <code>discussions</code>{' '}
        needs something from <code>comments</code>, the fix is to compose them at the{' '}
        <code>app/</code> level (option 1 from that lesson's "Cross-Feature Communication"
        list), not to reach across the boundary.
      </p>

      <p>The repo enforces both rules — no cross-feature imports, and no importing "up" the
      stack — with <code>eslint-plugin-import</code>'s <code>import/no-restricted-paths</code>,
      configured per feature in <code>.eslintrc.cjs</code>:</p>

      <CodeBlock language="js" title="apps/react-vite/.eslintrc.cjs — the actual rule, trimmed to the pattern">
{`'import/no-restricted-paths': [
  'error',
  {
    zones: [
      // disables cross-feature imports:
      // eg. src/features/discussions should not import from src/features/comments, etc.
      { target: './src/features/auth',        from: './src/features', except: ['./auth'] },
      { target: './src/features/comments',    from: './src/features', except: ['./comments'] },
      { target: './src/features/discussions', from: './src/features', except: ['./discussions'] },
      { target: './src/features/teams',       from: './src/features', except: ['./teams'] },
      { target: './src/features/users',       from: './src/features', except: ['./users'] },

      // enforce unidirectional codebase:
      // src/app can import from src/features, but not the other way around
      { target: './src/features', from: './src/app' },

      // src/features and src/app can import these shared modules, but not the other way around
      {
        target: ['./src/components', './src/hooks', './src/lib', './src/types', './src/utils'],
        from: ['./src/features', './src/app'],
      },
    ],
  },
],`}
      </CodeBlock>
      <p>
        Every <code>target</code> is a folder that gets restricted; <code>from</code> is what it
        may <em>not</em> be imported from; <code>except</code> carves out the one legal path (a
        feature importing its own files). It's declarative and it fails a build the moment
        someone violates it — the same mechanism the previous lesson suggested with plain{' '}
        <code>no-restricted-imports</code>, just expressed with the path-aware plugin that ships
        with this config.
      </p>

      <h2>Absolute Imports</h2>
      <p>
        Configured in <code>tsconfig.json</code>, with <code>vite-tsconfig-paths</code> as a
        dev dependency so Vite's bundler actually resolves the alias — TypeScript's{' '}
        <code>paths</code> only satisfies the type checker on its own, not the bundler.
      </p>
      <CodeBlock language="json" title="apps/react-vite/tsconfig.json — the relevant part, verified against the live repo">
{`{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`}
      </CodeBlock>
      <p>
        Every import in the repo goes through <code>@/</code> —{' '}
        <code>{"import { api } from '@/lib/api-client'"}</code> — instead of counting{' '}
        <code>../../../</code> segments. One alias, not a dozen (<code>@components</code>,{' '}
        <code>@hooks</code>, etc.) — the docs' reasoning is that <code>@/*</code> is short
        enough to need no further splitting, and visually distinct from a{' '}
        <code>node_modules</code> package.
      </p>

      <InfoBox variant="info" title="TanStack Query and Zustand are covered later in this path">
        <p style={{ marginBottom: 0 }}>
          The code below uses TanStack Query (<code>useQuery</code>, <code>useMutation</code>,{' '}
          <code>queryOptions</code>, cache invalidation) and Zustand (
          <code>useNotifications.getState()</code>) at full production depth, ahead of where this
          site actually teaches either library from scratch. If a hook below looks unfamiliar,
          that's expected — the dedicated lessons are{' '}
          <a href="/react-query/fundamentals">React Query: Fundamentals</a> and{' '}
          <a href="/state-mgmt/zustand-fundamentals">Zustand: Fundamentals</a>, both later in this
          learning path. Treat this section as a preview of what a production API layer looks
          like once you know both tools, not the place to learn them for the first time.
        </p>
      </InfoBox>

      <h2>The API Layer</h2>
      <p>
        One shared Axios instance with interceptors, plus one file per endpoint inside each
        feature's <code>api/</code> folder. Each endpoint file bundles the fetcher, the{' '}
        <a href="https://tanstack.com/query" rel="noreferrer" target="_blank">TanStack Query</a>{' '}
        wiring, and (for mutations) a{' '}
        <a href="https://zod.dev" rel="noreferrer" target="_blank">Zod</a> schema, all colocated
        instead of scattered across a services layer and a hooks layer.
      </p>

      <FlowChart
        title="A read request, start to finish"
        chart={"graph LR\n  C[Component] --> H[useDiscussions hook]\n  H --> Q[TanStack Query cache]\n  Q --> QO[getDiscussionsQueryOptions]\n  QO --> F[getDiscussions fetcher]\n  F --> A[api - axios instance]\n  A --> I[response/error interceptors]\n  I --> S[Backend REST API]\n  style A fill:#1a2744\n  style Q fill:#2a1f44"}
      />

      <CodeBlock language="ts" title="src/lib/api-client.ts — the one shared instance, trimmed from the live repo">
{`export const api = Axios.create({
  baseURL: env.API_URL,
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message;
    useNotifications.getState().addNotification({ type: 'error', title: 'Error', message });

    if (error.response?.status === 401) {
      window.location.href = paths.auth.login.getHref(window.location.pathname);
    }
    return Promise.reject(error);
  },
);`}
      </CodeBlock>
      <p>
        Auth headers, a global error toast, and the 401-redirect all live in one place. No
        feature reimplements error handling.
      </p>

      <CodeBlock language="ts" title="src/features/discussions/api/get-discussions.ts — a read endpoint, trimmed from the live repo (imports and the UseDiscussionsOptions type omitted)">
{`export const getDiscussions = (page = 1): Promise<{ data: Discussion[]; meta: Meta }> => {
  return api.get('/discussions', { params: { page } });
};

export const getDiscussionsQueryOptions = ({ page }: { page?: number } = {}) => {
  return queryOptions({
    queryKey: page ? ['discussions', { page }] : ['discussions'],
    queryFn: () => getDiscussions(page),
  });
};

export const useDiscussions = ({ page, queryConfig }: UseDiscussionsOptions) => {
  return useQuery({ ...getDiscussionsQueryOptions({ page }), ...queryConfig });
};`}
      </CodeBlock>
      <CodeBlock language="ts" title="src/features/discussions/api/create-discussion.ts — a write endpoint, trimmed from the live repo (imports and the UseCreateDiscussionOptions type omitted)">
{`export const createDiscussionInputSchema = z.object({
  title: z.string().min(1, 'Required'),
  body: z.string().min(1, 'Required'),
});
export type CreateDiscussionInput = z.infer<typeof createDiscussionInputSchema>;

export const createDiscussion = ({ data }: { data: CreateDiscussionInput }): Promise<Discussion> => {
  return api.post('/discussions', data);
};

export const useCreateDiscussion = ({ mutationConfig }: UseCreateDiscussionOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig || {};
  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getDiscussionsQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...rest,
    mutationFn: createDiscussion,
  });
};`}
      </CodeBlock>
      <p>
        Every mutation invalidates the read query it affects, right next to where it's defined
        — a component calling <code>useCreateDiscussion</code> gets cache invalidation for
        free, with no separate "when should this refetch" logic to maintain elsewhere. State
        management for anything that isn't server data (a UI toggle, a notification queue)
        goes in <code>stores/</code>, backed by{' '}
        <a href="https://github.com/pmndrs/zustand" rel="noreferrer" target="_blank">zustand</a> —
        the <code>useNotifications.getState()</code> call in the interceptor above is calling
        into exactly that kind of store from outside a component.
      </p>

      <h2>Naming and File Conventions</h2>
      <p>
        Every file and folder in <code>src/</code> is kebab-case —{' '}
        <code>get-discussions.ts</code>, <code>discussions-list.tsx</code>, not{' '}
        <code>getDiscussions.ts</code> or <code>DiscussionsList.tsx</code>. It's enforced, not
        just a convention people happen to follow:
      </p>
      <CodeBlock language="js" title="apps/react-vite/.eslintrc.cjs — via eslint-plugin-check-file">
{`'check-file/filename-naming-convention': [
  'error',
  { '**/*.{ts,tsx}': 'KEBAB_CASE' },
  { ignoreMiddleExtensions: true }, // so babel.config.js, smoke.spec.ts still pass
],
'check-file/folder-naming-convention': [
  'error',
  { '**/*': 'KEBAB_CASE' },
],`}
      </CodeBlock>
      <InfoBox variant="note" title="Notice what this site's own files do">
        <p style={{ marginBottom: 0 }}>
          This lesson's own file is <code>src/pages/react18/BulletproofReact.tsx</code> —
          PascalCase, the convention most Vite + CRA React codebases actually use for component
          files. Bulletproof React's kebab-case rule is a real, deliberate, enforced choice, not
          "the" React convention. If you adopt this pattern, decide on a casing rule up front
          and let ESLint hold the line — which one matters less than that everyone agrees.
        </p>
      </InfoBox>

      <h2>Testing Conventions</h2>
      <p>
        The docs are opinionated about where the value is: unit tests for genuinely isolated
        logic, but most of the confidence should come from integration tests, because passing
        unit tests doesn't guarantee the pieces work together.
      </p>
      <ul>
        <li>
          <strong>Unit</strong> — <a href="https://vitest.dev" rel="noreferrer" target="_blank">Vitest</a>.
          Colocated in a <code>__tests__/</code> folder next to the code, e.g.{' '}
          <code>components/ui/dialog/confirmation-dialog/__tests__/confirmation-dialog.test.tsx</code>.
        </li>
        <li>
          <strong>Integration</strong> — Vitest +{' '}
          <a href="https://testing-library.com" rel="noreferrer" target="_blank">Testing Library</a>,
          same colocation pattern at the route level, e.g.{' '}
          <code>app/routes/app/discussions/__tests__/discussion.test.tsx</code>. Testing
          Library's philosophy applies: assert what the user sees, not internal state.
        </li>
        <li>
          <strong>E2E</strong> — <a href="https://playwright.dev" rel="noreferrer" target="_blank">Playwright</a>,
          living outside <code>src/</code> in a top-level <code>e2e/tests/</code> folder, e.g.{' '}
          <code>e2e/tests/smoke.spec.ts</code>.
        </li>
        <li>
          <strong>Mocking</strong> — <a href="https://mswjs.io" rel="noreferrer" target="_blank">MSW</a>{' '}
          intercepts real HTTP calls at the network level instead of mocking <code>fetch</code>{' '}
          or Axios directly, so the same handlers back local dev (a mock server), Vitest, and
          Playwright. Handlers and mock data live in <code>src/testing/mocks/</code>.
        </li>
      </ul>

      <h2>Where This Is Worth It — and Where It's Overkill</h2>
      <p>
        The repo's own README has a disclaimer worth taking at face value: "This is not
        supposed to be a template, boilerplate, or a framework... decide what works best for
        you and your team and stay consistent with your style." Treat the folder names as a
        reference, not a mandate.
      </p>
      <ul>
        <li>
          <strong>Worth adopting almost as-is</strong> — a production app with more than one
          contributor, a REST or GraphQL backend, and a lifespan measured in years. The
          ESLint-enforced boundaries pay for themselves the first time two people touch
          adjacent features in the same sprint.
        </li>
        <li>
          <strong>Adopt the shape, skip the tooling</strong> — a small team that wants feature
          folders and the unidirectional rule but doesn't need Storybook, Playwright, MSW,
          Radix UI, and Husky all on day one. Take the <code>features/</code> +{' '}
          <code>app/</code> + shared-folders layout and the ESLint zones; add the rest only
          when the pain shows up.
        </li>
        <li>
          <strong>Overkill</strong> — a prototype, a single-contributor side project, or an app
          under roughly 20-30 files. The per-endpoint API files, the kebab-case ESLint rule,
          and the zoned import restrictions are all overhead with no one around to violate the
          boundaries they prevent.
        </li>
      </ul>

      <h2>Checklist</h2>
      <InfoBox variant="success" title="A Bulletproof-React-flavored codebase has">
        <ul>
          <li><code>features/</code>, <code>app/</code>, and flat shared folders (
            <code>components/</code>, <code>hooks/</code>, <code>lib/</code>,{' '}
            <code>types/</code>, <code>utils/</code>) at the top of <code>src/</code>.</li>
          <li><code>import/no-restricted-paths</code> zones that name every feature explicitly
            — a new feature needs a new zone entry, not just a new folder.</li>
          <li>No feature folder importing directly from another feature folder — composition
            happens in <code>app/</code>.</li>
          <li>No <code>index.ts</code> barrels inside feature folders; imports go straight to
            the file that defines what you need.</li>
          <li>One shared API client with interceptors; one file per endpoint, each exporting a
            fetcher plus its query or mutation hook.</li>
          <li>An enforced file and folder naming convention — kebab-case in this repo — checked
            by ESLint, not left to memory.</li>
          <li>Tests colocated in <code>__tests__/</code> next to the code they cover, with true
            e2e living outside <code>src/</code> entirely.</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
