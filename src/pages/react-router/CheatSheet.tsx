import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function ReactRouterCheatsheet() {
  return (
    <GuideLayout
      title="React Router"
      kicker="FIELD GUIDE"
      glyph="🧭"
      tagline="The v6/v7 Data Router API — createBrowserRouter, loaders, actions, and the hooks that read them."
      meta={['v6/v7 Data Router', 'createBrowserRouter API', '15 panels']}
      page="1 / 1"
      footer="This page is for recall. The lessons in this section carry the reasoning, the worked examples, and the v5→v6/v7 migration story."
      prev={{ path: '/react-router/migration', label: 'Migration Guide (v5→v8)' }}
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
        <GuideRules items={["BrowserRouter + <Routes> can't use loaders, actions, or route-level errorElements — createBrowserRouter is the v6.4+/v7 baseline for new apps."]} />
      </GuidePanel>

      <GuidePanel n={2} title="Route Object & Path Syntax" accent="purple" glyph="🗺️" span={2}>
        <GuideDefs
          items={[
            ['path', "URL pattern — ':id' is a param, '*' is a splat"],
            ['index', 'index route — matches the parent path with no extra segment'],
            ['loader / action', 'async data-in / data-out for this route'],
            ['errorElement', "renders when this route's loader, action, or render throws"],
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
        <GuideCode>{`export async function loader({ request, params }) {
  const url  = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 1;

  const res = await fetch(\`/api/products?page=\${page}\`, {
    signal: request.signal,          // cancels if the user navigates away mid-load
  });
  if (!res.ok) throw new Response('Not found', { status: res.status });

  const user = await getCurrentUser();
  if (!user) throw redirect('/login');   // throw redirect() to navigate instead

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

      <GuidePanel n={6} title="Hooks Reference" accent="cyan" glyph="🪝" span={2}>
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

      <GuidePanel n={7} title="Navigation" accent="red" glyph="🧭" span={2}>
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

      <GuidePanel n={8} title="Query Params" accent="blue" glyph="🔎">
        <GuideCode>{`// The URL IS the state — no useState for filters/pagination.
// Changing searchParams re-runs the loader automatically.

function setPage(p) {
  const next = new URLSearchParams(searchParams);
  p === 1 ? next.delete('page') : next.set('page', p);
  setSearchParams(next, { replace: true });
}

// ❌ Don't do this — wipes every other param
setSearchParams({ page: 2 });`}</GuideCode>
        <GuideRules items={['Read the same params in the loader via new URL(request.url).searchParams — that version also runs when the loader runs on the server.']} />
      </GuidePanel>

      <GuidePanel n={9} title="Lazy Loading Routes" accent="purple" glyph="🧩" span={2}>
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
          ]}
        />
      </GuidePanel>

      <GuidePanel n={10} title="Protected Routes & Errors" accent="green" glyph="🔐" span={2}>
        <GuideCode>{`export async function loader() {
  const user = await getCurrentUser();
  if (!user) throw redirect('/login');   // component never renders
  return { user };
}

function ErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <h1>{error.status} — {error.statusText}</h1>;
  }
  return <h1>Oops: {error?.message}</h1>;
}`}</GuideCode>
        <GuideRules items={["errorElement catches loader throws, action throws, and render errors — on the root route it catches everything.", 'Guard in the loader, not the component — throw redirect() aborts the navigation before anything renders.']} />
      </GuidePanel>

      <GuidePanel n={11} title="Link State & useFetcher" accent="amber" glyph="🎣" span={2}>
        <GuideCode>{`<Link to="/login" state={{ from: location.pathname }}>Login</Link>
navigate('/login', { state: { from: '/dashboard' } });
const from = useLocation().state?.from ?? '/';

// useFetcher — submit without navigating (like buttons, inline edits)
const fetcher = useFetcher();
<fetcher.Form method="post" action={\`/posts/\${postId}/like\`}>
  <button disabled={fetcher.state === 'submitting'}>Like</button>
</fetcher.Form>`}</GuideCode>
        <GuideRules items={["State lives in history, not the URL — not bookmarkable, gone when the tab closes. Good for redirect-after-login; bad for filters (use query params for those).", "fetcher.state is 'idle' | 'loading' | 'submitting'; fetcher.data is whatever the action returned."]} />
      </GuidePanel>

      <GuidePanel n={12} title="Revalidation" accent="pink" glyph="🔄">
        <GuideCode>{`const revalidator = useRevalidator();

<button onClick={() => revalidator.revalidate()}
        disabled={revalidator.state === 'loading'}>
  Refresh
</button>`}</GuideCode>
        <GuideRules items={['Loaders also re-run automatically on: route param change, search param change, and after any action completes.', 'navigate(location.pathname) to the SAME url also revalidates — not a no-op — but it pushes a history entry, so prefer useRevalidator() when all you want is fresh data.']} />
      </GuidePanel>

      <GuidePanel n={13} title="Lifecycle & Quick Decisions" accent="cyan" glyph="⏱️" span={2}>
        <GuideCode>{`Click <Link to="/shop/electronics/3">

1. Router matches the URL against the route tree (all nested levels)
2. Loaders for NEW/CHANGED routes run in PARALLEL
   (unchanged routes with unchanged params skip their loader)
3. All loaders resolve
4. Components render top -> down through each <Outlet />
5. Each component's useLoaderData() returns ONLY its own route's data`}</GuideCode>
        <GuideTable
          head={['Situation', 'Use']}
          rows={[
            ['Fetch data before rendering', 'loader'],
            ['Submit + navigate on success', 'action + <Form>'],
            ['Submit without changing the URL', 'useFetcher'],
            ['Programmatic navigation', 'useNavigate (+ return after it)'],
            ['Nav menu with active styling', 'NavLink'],
            ['Redirect inside a loader', "throw redirect('/path')"],
            ['Filters, search, pagination', 'query params + useSearchParams'],
            ['Split a route into its own chunk', 'lazy property on the route'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={14} title="TypeScript Essentials" accent="red" glyph="🔷" span={2}>
        <GuideCode>{`import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ params }: LoaderFunctionArgs) {
  return getProduct(params.id!);   // safe — the loader only runs once the route matched
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

function ProductDetail() {
  // Bare useLoaderData() is 'any' in library mode — pass the type explicitly
  const data = useLoaderData<LoaderData>();
}`}</GuideCode>
        <GuideRules items={["useParams<{ id: string }>() still returns id as string | undefined — the generic only names the keys, it doesn't make them required.", "location.state is 'any', not 'unknown' — cast it to the shape you expect before reading from it.", 'isRouteErrorResponse(error) is a type guard that narrows useRouteError()’s unknown result.']} />
      </GuidePanel>

      <GuidePanel n={15} title="Testing & Migration (v5 → v6/v7)" accent="blue" glyph="🧪" span={2}>
        <GuideCode>{`import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

const router = createMemoryRouter(
  [{ path: '/products', element: <ProductList />, loader: () => mockProducts }],
  { initialEntries: ['/products'] },
);
render(<RouterProvider router={router} />);`}</GuideCode>
        <GuideTable
          head={['v5', 'v6 / v7']}
          rows={[
            ['<Switch>', '<Routes> — exact-match by default'],
            ['<Route component={X} />', '<Route element={<X />} />'],
            ['useHistory()', 'useNavigate()'],
            ['withRouter(Component)', 'hooks — HOC removed entirely'],
            ['No built-in data loading', 'loader / action on route config (v6.4+)'],
          ]}
        />
        <GuideRules items={['createMemoryRouter keeps navigation in memory — no window.history side effects between tests, and it supports loaders/actions the same way createBrowserRouter does in the app.', "The official codemod handles <Switch>→<Routes> renames; it can't retrofit loaders — that's a design shift, not a syntax change."]} />
      </GuidePanel>
    </GuideLayout>
  );
}
