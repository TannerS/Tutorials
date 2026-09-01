import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function ReactRouterV8Cheatsheet() {
  return (
    <GuideLayout
      title="React Router v8"
      kicker="FIELD GUIDE"
      glyph="🧭"
      tagline="The v8 Data Router API — createBrowserRouter, loaders, actions, and the stable middleware/context system that's new since v7."
      meta={['v8 Data Router', 'createBrowserRouter API', '15 panels']}
      page="1 / 1"
      footer="This page is for recall. The lessons in this section carry the reasoning, the worked examples, and the full v7→v8 migration story."
      prev={{ path: '/react-router-v8/migration', label: 'Migration Guide (v7→v8)' }}
      next={null}
    >
      <GuidePanel n={1} title="Router Setup" accent="blue" glyph="🧭">
        <GuideCode>{`import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [ /* child routes */ ],
  },
]);

createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);`}</GuideCode>
        <GuideRules items={["There is no react-router-dom in v8 — it was removed entirely. RouterProvider/HydratedRouter come from react-router/dom; everything else comes from react-router."]} />
      </GuidePanel>

      <GuidePanel n={2} title="Route Object & Path Syntax" accent="purple" glyph="🗺️" span={2}>
        <GuideDefs
          items={[
            ['path', "URL pattern — ':id' is a param, '*' is a splat"],
            ['index', 'index route — matches the parent path with no extra segment'],
            ['loader / action', 'async data-in / data-out for this route'],
            ['middleware', 'array of functions that run before loader/action, top-down then bottom-up'],
            ['errorElement', "renders when this route's loader, action, middleware, or render throws"],
            ['lazy', "code-split — returns { Component, loader, ... }"],
            ['id', "lets useRouteLoaderData('id') read this route's data from a child"],
          ]}
        />
        <GuideCode>{`'users/:id'            -> params.id
'files/*'              -> params['*']   (splat: matches a/b/c)
''  or  index: true    -> parent's own path, no extra segment

// Route order matters for ambiguous paths — put the most specific first.
// React Router picks the BEST match, not the first match.`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={3} title="Nested Routes & Outlet" accent="green" glyph="🪆" span={2}>
        <GuideCode>{`{
  path: '/',
  element: <RootLayout />,        // must render <Outlet />
  children: [
    { index: true, element: <Home /> },
    {
      path: 'shop',
      element: <ShopLayout />,    // must render <Outlet />
      loader: shopLoader,
      children: [
        { index: true, element: <ShopHome /> },
        { path: ':category', element: <CategoryPage />, loader: categoryLoader },
      ],
    },
  ],
}

function ShopLayout() {
  return (
    <div>
      <ShopSidebar />
      <main><Outlet /></main>   {/* child route renders here */}
    </div>
  );
}`}</GuideCode>
        <GuideRules items={["If a route has children but its component doesn't render <Outlet />, the children still match the URL — their components just never appear. The parent silently swallows them."]} />
      </GuidePanel>

      <GuidePanel n={4} title="Loaders" accent="amber" glyph="📥" span={2}>
        <GuideCode>{`export async function loader({ request, params, context }) {
  const url  = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 1;

  const res = await fetch(\`/api/products?page=\${page}\`, {
    signal: request.signal,          // cancels if the user navigates away mid-load
  });
  if (!res.ok) throw new Response('Not found', { status: res.status });

  return res.json();
}

function ProductList() {
  const data = useLoaderData();          // no useEffect, no loading state
  return <ul>{data.products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}`}</GuideCode>
        <GuideRules items={['Runs BEFORE the component renders — React Router awaits it, then hands the result to useLoaderData().', 'Throwing a Response shows errorElement with that status; throwing redirect() navigates instead of rendering.']} />
      </GuidePanel>

      <GuidePanel n={5} title="Actions & Forms" accent="pink" glyph="📤">
        <GuideCode>{`export async function action({ request }) {
  const formData = await request.formData();
  const name = formData.get('name');
  if (!name) return { error: 'Name is required' };
  await saveToServer({ name });
  return redirect('/dashboard');
}

<Form method="post">
  <input name="name" />
  <button type="submit">Save</button>
</Form>`}</GuideCode>
        <GuideRules items={['<Form method="post"> runs the route’s action; method="get" runs the loader instead (a search form).', 'Returning from an action re-renders with useActionData(); redirect() navigates on success.']} />
      </GuidePanel>

      <GuidePanel n={6} title="Middleware & Context (new, stable in v8)" accent="cyan" glyph="🧬" span={2}>
        <GuideCode>{`import { createContext, RouterContextProvider, redirect } from 'react-router';

export const userContext = createContext(null);

async function authMiddleware({ request, context }) {
  const user = await getSessionUser(request);
  if (!user) throw redirect('/login');
  context.set(userContext, user);      // visible to every descendant loader/action
}

const router = createBrowserRouter(
  [{ path: 'dashboard', middleware: [authMiddleware], children: [ /* ... */ ] }],
  {
    getContext() {                     // seeds EVERY navigation, even unguarded routes
      const context = new RouterContextProvider();
      context.set(loggerContext, createLogger());
      return context;
    },
  },
);

export function loader({ context }) {
  const user = context.get(userContext);   // no re-fetch, no re-decode
  return fetchDashboardStats(user.id);
}`}</GuideCode>
        <GuideRules items={[
          'Runs in a nested chain: root middleware -> parent -> child, THEN loaders, THEN back up child -> parent -> root.',
          'context is always a RouterContextProvider instance in v8 — a custom server getLoadContext returning a plain object will break every context.get() call.',
          'A single-route guard is still fine as a loader-level throw redirect(); reach for middleware when several routes need the same check or need to share what it produces.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="Hooks Reference" accent="cyan" glyph="🪝" span={2}>
        <GuideTable
          head={['Hook', 'Returns', 'Use when']}
          rows={[
            ['useLoaderData()', "this route's loader data", 'Read data in a component'],
            ['useActionData()', "last submission's action data", 'Read action errors/results'],
            ['useParams()', '{ id, category, ... }', 'Read URL path params'],
            ['useSearchParams()', '[params, setParams]', 'Read/write the query string'],
            ['useLocation()', '{ pathname, search, state }', 'Full current location + state'],
            ['useNavigate()', 'navigate fn', 'Programmatic navigation'],
            ['useRouteError()', 'thrown value', 'Inside errorElement only'],
            ['useRouteLoaderData(id)', "a PARENT route's loader data", 'Read it from a child component'],
            ['useFetcher()', '{ load, submit, data, state, Form }', 'Fetch/submit without navigating'],
            ['useNavigation()', '{ state, location, formData }', 'Global pending/loading state'],
            ['useRevalidator()', '{ revalidate, state }', 'Re-run loaders without navigating'],
          ]}
        />
        <GuideCode>{`const [searchParams, setSearchParams] = useSearchParams();
const next = new URLSearchParams(searchParams);   // copy existing params first
next.set('q', value);
setSearchParams(next, { replace: true });

// Needs id: 'shop-root' set in the route config
const shopData = useRouteLoaderData('shop-root');`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={8} title="Navigation" accent="red" glyph="🧭" span={2}>
        <GuideCode>{`<Link to="/products">Products</Link>
<Link to="/login" state={{ from: '/dashboard' }}>Login</Link>

<NavLink to="/products" end
  className={({ isActive, isPending }) => isActive ? 'active' : isPending ? 'pending' : ''}>
  Products
</NavLink>

const navigate = useNavigate();
navigate('/dashboard', { replace: true });
navigate(-1);

// navigate() does NOT stop execution — always return after it
if (!valid) { navigate('/error'); return; }`}</GuideCode>
        <GuideTable
          head={['Use', 'For']}
          rows={[
            ['Link', 'any clickable link — renders <a>, no active styling'],
            ['NavLink', 'nav menus — adds isActive / isPending for styling'],
            ['useNavigate', 'navigation from code: after submit, after login, conditional redirects'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={9} title="Query Params" accent="blue" glyph="🔎">
        <GuideCode>{`// The URL IS the state — no useState for filters/pagination.
// Changing searchParams re-runs the loader automatically.

function setPage(p) {
  const next = new URLSearchParams(searchParams);
  p === 1 ? next.delete('page') : next.set('page', p);
  setSearchParams(next, { replace: true });
}

// ❌ Don't do this — wipes every other param
setSearchParams({ page: 2 });`}</GuideCode>
        <GuideRules items={['Read the same params in the loader via new URL(request.url).searchParams — or the normalized url param if future.v8_passThroughRequests-era behavior applies to your setup.']} />
      </GuidePanel>

      <GuidePanel n={10} title="Lazy Loading Routes" accent="purple" glyph="🧩" span={2}>
        <GuideCode>{`const router = createBrowserRouter([
  {
    path: 'products',
    lazy: async () => {
      const mod = await import('./pages/ProductList');
      return { Component: mod.default, loader: mod.loader };
    },
  },
]);`}</GuideCode>
        <GuideDefs
          items={[
            ['route lazy', 'resolves before render, as part of navigation — no Suspense needed; useNavigation().state already covers it'],
            ['React.lazy()', 'component-level splitting — DOES need a <Suspense> boundary, placed close to the component, not the app root'],
            ['splitRouteModules', 'Framework mode build option (default true in v8) that chunks clientLoader/clientAction separately from the component — no code changes needed to benefit from it'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={11} title="Protected Routes & Errors" accent="green" glyph="🔐" span={2}>
        <GuideCode>{`// Option A — loader guard, fine for a single route
export async function loader() {
  const user = await getCurrentUser();
  if (!user) throw redirect('/login');
  return { user };
}

// Option B — middleware guard, for a whole subtree (see Panel 6)
export const middleware = [authMiddleware];

function ErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <h1>{error.status} — {error.statusText}</h1>;
  }
  return <h1>Oops: {error?.message}</h1>;
}`}</GuideCode>
        <GuideRules items={["errorElement catches loader/action/middleware throws and render errors — on the root route it catches everything.", 'A redirect thrown from middleware or a loader aborts navigation before anything renders — it never reaches errorElement.']} />
      </GuidePanel>

      <GuidePanel n={12} title="Link State, Fetcher & Revalidation" accent="amber" glyph="🎣" span={2}>
        <GuideCode>{`<Link to="/login" state={{ from: location.pathname }}>Login</Link>
navigate('/login', { state: { from: '/dashboard' } });
const from = useLocation().state?.from ?? '/';

// useFetcher — submit without navigating (like buttons, inline edits)
const fetcher = useFetcher();
<fetcher.Form method="post" action={\`/posts/\${postId}/like\`}>
  <button disabled={fetcher.state === 'submitting'}>Like</button>
</fetcher.Form>

// useRevalidator — refresh loader data without a navigation
const revalidator = useRevalidator();
<button onClick={() => revalidator.revalidate()}>Refresh</button>`}</GuideCode>
        <GuideRules items={["State lives in history, not the URL — not bookmarkable, gone when the tab closes. Good for redirect-after-login; bad for filters (use query params for those).", "Loaders also re-run automatically on: route/search param change and after any action completes — revalidator.revalidate() is for everything else."]} />
      </GuidePanel>

      <GuidePanel n={13} title="Lifecycle & Quick Decisions" accent="cyan" glyph="⏱️" span={2}>
        <GuideCode>{`Click <Link to="/dashboard/settings">

1. Router matches the URL against the route tree (all nested levels)
2. Middleware for matched routes runs top -> down (root first)
3. Loaders for NEW/CHANGED routes run in PARALLEL
4. All loaders resolve
5. Middleware resumes bottom -> up (leaf first) after loaders finish
6. Components render top -> down through each <Outlet />
7. Each component's useLoaderData() returns ONLY its own route's data`}</GuideCode>
        <GuideTable
          head={['Situation', 'Use']}
          rows={[
            ['Fetch data before rendering', 'loader'],
            ['Submit + navigate on success', 'action + <Form>'],
            ['Guard ONE route', 'throw redirect() in that loader'],
            ['Guard a whole subtree / share request-scoped data', 'middleware + context'],
            ['Submit without changing the URL', 'useFetcher'],
            ['Filters, search, pagination', 'query params + useSearchParams'],
            ['Split a route into its own chunk', 'lazy property on the route'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={14} title="TypeScript Essentials" accent="red" glyph="🔷" span={2}>
        <GuideCode>{`import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ params, context }: LoaderFunctionArgs) {
  return getProduct(params.id!);   // safe — the loader only runs once the route matched
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

function ProductDetail() {
  // Bare useLoaderData() is 'any' in library mode — pass the type explicitly
  const data = useLoaderData<LoaderData>();
}`}</GuideCode>
        <GuideRules items={["useParams<{ id: string }>() still returns id as string | undefined — the generic only names the keys, it doesn't make them required.", "context in loader/action/middleware is always Readonly<RouterContextProvider> in v8 — no Future module augmentation needed, unlike the old v7 unstable_middleware flag.", 'isRouteErrorResponse(error) is a type guard that narrows useRouteError()’s unknown result.']} />
      </GuidePanel>

      <GuidePanel n={15} title="v7 → v8 Migration Quick Reference" accent="blue" glyph="🧪" span={2}>
        <GuideTable
          head={['v7', 'v8']}
          rows={[
            ["import ... from 'react-router-dom'", "react-router-dom REMOVED — react-router / react-router/dom"],
            ['meta({ data })', 'meta({ loaderData })'],
            ['matches[i].data', 'matches[i].loaderData'],
            ['future.v8_middleware: false', 'middleware always on, no flag'],
            ['Node 20+ / React 18.3+ / Vite 5+', 'Node 22.22+ / React 19.2.7+ / Vite 7+'],
            ['CJS + ESM builds', 'ESM-only'],
          ]}
        />
        <GuideRules items={['No official codemod for this jump — nearly the whole surface is future-flag adoption you can do incrementally on v7, one flag and one commit at a time.', 'Full breaking-changes list, the getLoadContext gotcha, and a step-by-step checklist are in the Migration Guide lesson.']} />
      </GuidePanel>
    </GuideLayout>
  );
}
