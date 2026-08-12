import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function CheatSheet() {
  return (
    <LessonLayout
      title="React Router 7 — Cheat Sheet"
      sectionId="react-router"
      lessonIndex={8}
      prev={{ path: '/react-router/migration', label: 'Migration Guide' }}
      next={null}
    >
      <p>
        Every React Router 7 concept in one place — route config, hooks, patterns,
        and gotchas. Use this as a quick lookup while building.
      </p>

      {/* ══════════════════════════════════════════════
          1. ROUTER SETUP
      ══════════════════════════════════════════════ */}
      <h2>Router Setup</h2>
      <CodeBlock language="jsx" title="createBrowserRouter + RouterProvider (recommended)">
{`import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [ /* child routes */ ],
  },
]);

// Mount once at the top level
createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);

// ❌ Don't use BrowserRouter + <Routes> for new apps — it can't use
//    loaders, actions, or route-level errorElements.`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════
          2. ROUTE CONFIG
      ══════════════════════════════════════════════ */}
      <h2>Route Config — All Properties</h2>
      <CodeBlock language="jsx" title="Every route property">
{`{
  path: 'users/:id',      // URL pattern — :id is a param, * is a splat
  index: true,            // index route — matches parent path with no extra segment
  element: <Page />,      // component to render
  loader: pageLoader,     // async fn that runs BEFORE render, returns data
  action: pageAction,     // handles form POST/PUT/DELETE submissions
  errorElement: <Err />,  // renders when this route's loader/action/render throws
  lazy: () => import('./Page'),  // code-split — returns { Component, loader, ... }
  children: [],           // nested routes
  id: 'user-detail',      // optional — lets useRouteLoaderData('user-detail') work
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Route patterns — path syntax">
{`'/'              → exact root
'users'          → /users
'users/:id'      → /users/42       — params.id = '42'
'users/:id/posts/:postId'          — params.id + params.postId
'files/*'        → /files/a/b/c   — params['*'] = 'a/b/c'  (splat)
''               → same as parent path (layout route with no extra segment)

index: true      → matches parent's exact path (replaces '' for index routes)

// In route array order matters for ambiguous paths.
// More specific paths first — React Router picks the best match, not first match.`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════
          3. NESTED ROUTES & OUTLET
      ══════════════════════════════════════════════ */}
      <h2>Nested Routes &amp; Outlet</h2>
      <CodeBlock language="jsx" title="Nesting and Outlet">
{`// Route config
{
  path: '/',
  element: <RootLayout />,     // ← must render <Outlet /> somewhere
  children: [
    { index: true, element: <Home /> },       // matches /
    {
      path: 'shop',
      element: <ShopLayout />,  // ← must render <Outlet /> somewhere
      loader: shopLoader,
      children: [
        { index: true, element: <ShopHome /> },       // matches /shop
        {
          path: ':category',
          element: <CategoryLayout />,
          loader: categoryLoader,
          children: [
            { index: true, element: <CategoryProducts /> },  // /shop/:category
            { path: ':productId', element: <ProductPage />,  // /shop/:category/:productId
              children: [
                { index: true, element: <Navigate to="reviews" replace /> },
                { path: 'reviews', element: <Reviews /> },   // .../reviews
                { path: 'specs',   element: <Specs /> },     // .../specs
              ]
            },
          ],
        },
      ],
    },
  ],
}

// In every layout component — renders the matched child route
import { Outlet } from 'react-router-dom';
function ShopLayout() {
  return (
    <div>
      <ShopSidebar />
      <main>
        <Outlet />    {/* ← child route renders here */}
      </main>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Outlet is required in every layout">
        If a route has children but its component doesn't render <code>&lt;Outlet /&gt;</code>,
        the child routes will match the URL but their components will never appear.
        The parent silently swallows them.
      </InfoBox>

      {/* ══════════════════════════════════════════════
          4. LOADERS
      ══════════════════════════════════════════════ */}
      <h2>Loaders</h2>
      <CodeBlock language="jsx" title="Loader signature, errors, and redirects">
{`// Loader runs BEFORE the component renders.
// React Router awaits it, then passes the return value to useLoaderData().
// If it throws, errorElement renders instead of the component.

export async function loader({ request, params }) {
  // request — standard Fetch API Request object (has .url, .signal, .headers, etc.)
  // params  — URL params from the route pattern { id: '42', category: 'books' }

  // Read query params from the URL
  const url      = new URL(request.url);
  const page     = Number(url.searchParams.get('page')) || 1;
  const q        = url.searchParams.get('q') ?? '';

  // Fetch data
  const res = await fetch(\`/api/products?page=\${page}&q=\${q}\`, {
    signal: request.signal,    // cancel if user navigates away mid-load
  });

  // Throw a Response to show errorElement with a specific status
  if (!res.ok) throw new Response('Not found', { status: res.status });

  // Throw redirect() to navigate instead of rendering
  const user = await getCurrentUser();
  if (!user) throw redirect('/login');

  return res.json();           // anything returned is available via useLoaderData()
}

// Component reads loader data — no useEffect, no loading state needed
export default function ProductList() {
  const data = useLoaderData();
  return <ul>{data.products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════
          5. ACTIONS
      ══════════════════════════════════════════════ */}
      <h2>Actions (Form Submissions)</h2>
      <CodeBlock language="jsx" title="Action + Form">
{`// Action handles POST/PUT/DELETE — triggered by <Form> or fetcher
export async function action({ request, params }) {
  const formData = await request.formData();
  const name     = formData.get('name');

  if (!name) {
    return { error: 'Name is required' };  // return = re-render with error
  }

  await saveToServer({ name });
  return redirect('/dashboard');           // redirect = navigate after success
}

// In the component — <Form> wires to the route's action automatically
import { Form, useActionData } from 'react-router-dom';

export default function NewProduct() {
  const result = useActionData();          // what action() returned (if anything)
  return (
    <Form method="post">
      <input name="name" />
      {result?.error && <p>{result.error}</p>}
      <button type="submit">Save</button>
    </Form>
  );
}

// <Form method="post"> → action runs
// <Form method="get">  → loader runs (like a search form)`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════
          6. HOOKS REFERENCE
      ══════════════════════════════════════════════ */}
      <h2>Hooks Reference</h2>
      <CodeBlock language="text" title="Every hook — what it returns">
{`HOOK                    RETURNS                         USE WHEN
──────────────────────  ──────────────────────────────  ──────────────────────────────────
useLoaderData()         data returned by this route's   Read loader data in a component
                        loader
useActionData()         data returned by this route's   Read action errors/results
                        action (last submission)
useParams()             { id, category, ... }           Read URL path params
useSearchParams()       [params, setParams]             Read/write query string (?key=val)
useLocation()           { pathname, search, hash,       Read full current location + state
                          state, key }
useNavigate()           navigate fn                     Programmatic navigation
useRouteError()         thrown value                    Inside errorElement only
useRouteLoaderData(id)  data from a specific route's    Read a PARENT route's loader data
                        loader by route id                from a child component
useFetcher()            { load, submit, data,           Fetch/submit without navigating
                          state, Form }
useNavigation()         { state, location, formData }   Global navigation state (pending,
                                                          loading, submitting)
useMatches()            array of matched routes         Breadcrumbs, route-aware logic`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Key hook examples">
{`// useParams — all URL params accumulated from matched routes
const { category, productId } = useParams();

// useSearchParams — read and write query string
const [searchParams, setSearchParams] = useSearchParams();
const page = Number(searchParams.get('page')) || 1;
const q    = searchParams.get('q') ?? '';

function updateSearch(newQ) {
  const next = new URLSearchParams(searchParams);  // copy existing params
  newQ ? next.set('q', newQ) : next.delete('q');
  next.delete('page');                             // reset pagination on search
  setSearchParams(next, { replace: true });
}

// useLocation — read full location including state passed via navigate/Link
const location = useLocation();
const from = location.state?.from ?? '/';

// useRouteLoaderData — read a parent loader's data from a deeply nested child
// (the route must have an id: 'shop-root' in the config)
const shopData = useRouteLoaderData('shop-root');

// useNavigation — show a global loading indicator
const navigation = useNavigation();
const isLoading = navigation.state === 'loading';`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════
          7. NAVIGATION
      ══════════════════════════════════════════════ */}
      <h2>Navigation</h2>
      <CodeBlock language="jsx" title="Link, NavLink, Navigate, useNavigate">
{`// Link — client-side navigation (never use <a href> for internal routes)
<Link to="/products">Products</Link>
<Link to="settings">Settings</Link>             // relative to current route
<Link to="/login" state={{ from: '/dashboard' }}>Login</Link>  // state in history

// NavLink — Link + isActive/isPending for styling nav menus
<NavLink
  to="/products"
  end                                           // only active on exact match
  className={({ isActive, isPending }) =>
    isActive ? 'active' : isPending ? 'pending' : ''
  }
>
  Products
</NavLink>

// Navigate — declarative redirect (renders nothing, just redirects)
// index: true, element: <Navigate to="reviews" replace />

// useNavigate — programmatic navigation
const navigate = useNavigate();
navigate('/dashboard');                         // basic push
navigate('/dashboard', { replace: true });      // replace history entry
navigate('/login', { state: { from: '/dashboard' } });  // with state
navigate(-1);                                   // go back
navigate(1);                                    // go forward

// ⚠️ navigate() does NOT stop execution — always return after it
function handleSubmit() {
  if (!valid) {
    navigate('/error');
    return;           // ← required to stop the lines below from running
  }
  saveData();
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Link vs NavLink vs useNavigate — when to use each">
{`Link          Anywhere you need a clickable link: content, buttons, breadcrumbs.
              Renders an <a> tag. No active styling.

NavLink       Navigation menus only. Same as Link but calls className/style
              with { isActive, isPending } so you can style the active route.
              isPending is only true when a loader is running on the destination.

useNavigate   When navigation must happen in code, not from a click:
                - After a form submission (redirect to success page)
                - After login (navigate back to where they came from)
                - Conditional navigation (navigate(-1) if not authenticated)
              Don't use it just because you want to navigate on click — that's Link.`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════
          8. QUERY PARAMS
      ══════════════════════════════════════════════ */}
      <h2>Query Params (Search Params)</h2>
      <CodeBlock language="jsx" title="Reading and writing query params">
{`// The URL IS the state — no useState needed for filters/pagination.
// When searchParams change, the loader re-runs automatically.

// Reading in a loader (preferred — runs server-side too)
export async function loader({ request }) {
  const url  = new URL(request.url);       // /products?q=shoes&page=2
  const q    = url.searchParams.get('q')    ?? '';
  const page = Number(url.searchParams.get('page')) || 1;
  return getProducts({ q, page });
}

// Reading in a component
const [searchParams] = useSearchParams();
const q    = searchParams.get('q') ?? '';
const page = Number(searchParams.get('page')) || 1;

// Writing — setSearchParams triggers loader re-run
const [searchParams, setSearchParams] = useSearchParams();

// ✅ Preserve all existing params, only change what you need
function setPage(p) {
  const next = new URLSearchParams(searchParams);
  p === 1 ? next.delete('page') : next.set('page', p);
  setSearchParams(next, { replace: true });   // replace so back skips page changes
}

function setSearch(q) {
  const next = new URLSearchParams(searchParams);
  q ? next.set('q', q) : next.delete('q');
  next.delete('page');                         // reset to page 1 on new search
  setSearchParams(next, { replace: true });
}

// ❌ Don't do this — wipes all other params
setSearchParams({ page: 2 });`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════
          9. LAZY LOADING
      ══════════════════════════════════════════════ */}
      <h2>Lazy Loading Routes</h2>
      <CodeBlock language="jsx" title="lazy property on a route">
{`// Each dynamic import() becomes its own JS chunk at build time.
// The chunk is only downloaded when the user first navigates to that route.
// On subsequent visits it's served from the browser cache — free.

const router = createBrowserRouter([
  {
    path: 'products',
    lazy: async () => {
      const mod = await import('./pages/ProductList');
      return {
        Component: mod.default,   // the component to render
        loader: mod.loader,       // the loader to run before render
        // action, errorElement, etc. can also be returned here
      };
    },
  },
]);

// In the page file — export loader alongside default component
export async function loader({ request, params }) { ... }
export default function ProductList() { ... }

// The router config is the wiring — it's what connects loader to Component.
// The file location is irrelevant; you could import them from separate files.

// ✅ Wrap lazy routes in Suspense as close as possible (not at the root!)
// A root-level Suspense replaces your entire app (nav, header, everything)
// with the fallback. Per-route Suspense only replaces the content area.
<Route path="/products" element={
  <Suspense fallback={<PageSkeleton />}>
    <ProductList />
  </Suspense>
} />`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════
          10. PROTECTED ROUTES
      ══════════════════════════════════════════════ */}
      <h2>Protected Routes &amp; Auth Redirects</h2>
      <CodeBlock language="jsx" title="Auth guard in a loader">
{`// The loader is the right place to protect a route — not inside the component.
// throw redirect() aborts the navigation; the component NEVER renders.

export async function loader() {
  const user = await getCurrentUser();
  if (!user) {
    // state passes the intended destination without putting it in the URL
    // (avoids the open-redirect security issue of ?from=/dashboard)
    throw redirect('/login');
  }
  return { user };
}

// On the login page — redirect back after auth
function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from ?? '/';

  async function handleLogin(credentials) {
    await authService.login(credentials);
    navigate(from, { replace: true });   // replace so back doesn't re-show login
    return;
  }
}`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════
          11. ERROR HANDLING
      ══════════════════════════════════════════════ */}
      <h2>Error Handling</h2>
      <CodeBlock language="jsx" title="errorElement + useRouteError">
{`// errorElement catches: loader throws, action throws, render errors.
// Placed on the root route it catches everything. Place it on a specific
// route to handle that route's errors independently.

export default function ErrorPage() {
  const error = useRouteError();

  // isRouteErrorResponse = thrown via new Response(...) or failed fetch
  if (isRouteErrorResponse(error)) {
    return <h1>{error.status} — {error.statusText}</h1>;
  }

  // Plain JS error (thrown Error, undefined reference, etc.)
  return <h1>Oops: {error?.message}</h1>;
}

// In a loader — how to throw different error types:
throw new Response('Not found', { status: 404 });    // isRouteErrorResponse = true
throw new Error('Something broke');                   // plain Error object
throw redirect('/login');                             // not an error — navigates instead`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════
          12. LINK STATE
      ══════════════════════════════════════════════ */}
      <h2>Link State — Data Without the URL</h2>
      <CodeBlock language="jsx" title="Passing and reading state">
{`// State lives in the browser history object — not visible in the address bar,
// not bookmarkable, gone when the tab closes.
// Use it for data that should not be in the URL.

// Passing state via Link
<Link to="/login" state={{ from: location.pathname }}>Login</Link>

// Passing state via navigate()
navigate('/login', { state: { from: '/dashboard' } });

// Reading state in the destination
const location = useLocation();
const from = location.state?.from ?? '/';

// Good uses for state:
//   ✅ Where to redirect after login (avoids open redirect attacks)
//   ✅ Highlighting a newly created item after redirect
//   ✅ Passing context between steps of a flow
//   ✅ Remembering scroll position on back navigation

// Bad uses for state:
//   ❌ Data the user should be able to bookmark or share
//   ❌ Filter/search values (those belong in query params)
//   ❌ Data that must survive a hard refresh or new tab`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════
          13. FETCHER
      ══════════════════════════════════════════════ */}
      <h2>useFetcher — Submit Without Navigating</h2>
      <CodeBlock language="jsx" title="useFetcher for inline mutations">
{`// Regular <Form> navigates after submit (runs action + loader, re-renders route).
// useFetcher submits to any route's action WITHOUT changing the URL.
// Use it for: like buttons, inline edits, delete from a list, notifications.

import { useFetcher } from 'react-router-dom';

function LikeButton({ postId, liked }) {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === 'submitting';

  return (
    <fetcher.Form method="post" action={\`/posts/\${postId}/like\`}>
      <button disabled={isSubmitting}>
        {liked ? '❤️' : '🤍'} Like
      </button>
    </fetcher.Form>
  );
}

// fetcher.state:  'idle' | 'loading' | 'submitting'
// fetcher.data:   what the action returned (after submission)
// fetcher.load('/api/data')  — load data without submitting
// fetcher.submit(formData, { method: 'post', action: '/api' })`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════
          14. FULL LIFECYCLE
      ══════════════════════════════════════════════ */}
      <h2>Request Lifecycle</h2>
      <CodeBlock language="text" title="What happens when the URL changes">
{`User clicks <Link to="/shop/electronics/3/reviews">

1. Router matches the URL against the route tree
   Matched routes (all 5 levels):
     /                              → RootLayout
     /shop                          → ShopLayout        (loader: categories)
     /shop/:category                → CategoryLayout     (loader: category + products)
     /shop/:category/:productId     → ProductPage        (loader: product)
     /shop/:category/:productId/reviews → ProductReviews (loader: reviews)

2. All loaders for NEW or CHANGED routes run in PARALLEL
   (unchanged routes whose params didn't change skip their loaders)
   shopLoader()      → fetches categories
   categoryLoader()  → fetches electronics products
   productLoader()   → fetches product #3
   reviewsLoader()   → fetches reviews for product #3

3. All loaders resolve

4. React renders the matched component tree, top to bottom:
   RootLayout renders → its <Outlet /> renders ShopLayout
   ShopLayout renders → its <Outlet /> renders CategoryLayout
   CategoryLayout renders → its <Outlet /> renders ProductPage
   ProductPage renders → its <Outlet /> renders ProductReviews

5. Each component calls useLoaderData() and gets ITS OWN loader's data
   useLoaderData() in ShopLayout   → { categories }
   useLoaderData() in CategoryLayout → { name, products }
   useLoaderData() in ProductPage  → { product }
   useLoaderData() in ProductReviews → { reviews }

6. NavLink to="/shop/electronics/3/reviews" gets isActive=true`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════
          15. QUICK DECISION TABLE
      ══════════════════════════════════════════════ */}
      <h2>Quick Decisions</h2>
      <CodeBlock language="text" title="What to use and when">
{`SITUATION                                     USE
────────────────────────────────────────────  ─────────────────────────────────
Fetch data for a route before rendering       loader
Submit a form and navigate on success         action + <Form>
Submit/mutate without changing the URL        useFetcher
Programmatic navigation after an event        useNavigate (+ return after it)
Clickable link in content or a button         Link
Nav menu with active/pending styling          NavLink
Redirect inside a loader                      throw redirect('/path')
Redirect inside a component                   <Navigate> or navigate()
Auth guard a route                            throw redirect() in loader
Pass data between pages without URL           Link/navigate state
Filters, search, pagination                   Query params + useSearchParams
URL segment that varies (user ID, etc.)       :param in path + useParams()
Catch-all 404                                 path="*"
Split a large route into its own JS chunk     lazy property on the route
Read a parent route's loader data             useRouteLoaderData('route-id')
Track global navigation state (loading bar)   useNavigation().state`}
      </CodeBlock>

      <InfoBox variant="warning" title="Two things navigate() does NOT do">
        <p>
          <strong>1. It does not stop execution.</strong> Code after <code>navigate()</code>{' '}
          still runs — always <code>return</code> after it when you want to stop.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>2. It does not reload loader data.</strong> If you mutate data and want
          the current route's loader to re-run, use a <code>fetcher.submit()</code> or a{' '}
          <code>{'<Form>'}</code> instead. <code>navigate(location.pathname)</code> feels
          like it should re-run the loader but it won't if the URL hasn't actually changed.
        </p>
      </InfoBox>

      {/* ══════════════════════════════════════════════
          16. TYPESCRIPT PATTERNS
      ══════════════════════════════════════════════ */}
      <h2>TypeScript Patterns</h2>
      <p>
        React Router 7 ships its own TypeScript types — no <code>@types/</code> package
        needed. The key gotcha: <code>useLoaderData()</code> returns <code>unknown</code>{' '}
        in library mode, so you must cast it. The cleanest pattern derives the type
        directly from the loader so they always stay in sync.
      </p>

      <h3>Loader Function</h3>
      <CodeBlock language="jsx" title="JavaScript">
{`// No types — params and request are any
export async function loader({ request, params }) {
  const url  = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 1;
  const data = await getProducts({ page });
  return data;
}`}
      </CodeBlock>
      <CodeBlock language="tsx" title="TypeScript">
{`import type { LoaderFunctionArgs } from 'react-router-dom';
import type { ProductsResult } from '../mockApi';

// LoaderFunctionArgs types both request and params
export async function loader({ request, params }: LoaderFunctionArgs): Promise<ProductsResult> {
  const url  = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 1;
  const data = await getProducts({ page });
  return data;   // TypeScript now enforces this matches ProductsResult
}`}
      </CodeBlock>

      <h3>useLoaderData — Typing Loader Data in a Component</h3>
      <CodeBlock language="jsx" title="JavaScript">
{`export default function ProductList() {
  const { products, total, page } = useLoaderData();
  // products, total, page are all 'any' — no autocomplete
}`}
      </CodeBlock>
      <CodeBlock language="tsx" title="TypeScript">
{`// Derive the type FROM the loader — never goes out of sync.
// Awaited<ReturnType<...>> unwraps the Promise and gets the resolved type.
type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function ProductList() {
  // useLoaderData() returns 'unknown' in library mode — cast it.
  const { products, total, page } = useLoaderData() as LoaderData;
  // products → Product[], total → number, page → number (all typed)
}`}
      </CodeBlock>

      <h3>useParams — URL Parameters</h3>
      <CodeBlock language="jsx" title="JavaScript">
{`export async function loader({ params }) {
  const product = await getProduct(params.id);  // params.id could be undefined
  return product;
}

function ProductDetail() {
  const { id } = useParams();  // id is string | undefined
}`}
      </CodeBlock>
      <CodeBlock language="tsx" title="TypeScript">
{`export async function loader({ params }: LoaderFunctionArgs): Promise<Product> {
  // params.id! — non-null assertion is safe inside a loader.
  // The loader only runs when the route matches, so :id is always present.
  return getProduct(params.id!);
}

function ProductDetail() {
  // useParams() always returns string | undefined for each param.
  // If you need to use it, narrow it first or assert it.
  const { id } = useParams<{ id: string }>();   // narrows to string (still runtime-unsafe)
  // or:
  const params = useParams();
  if (!params.id) return null;   // runtime guard
}`}
      </CodeBlock>

      <h3>Event Handlers</h3>
      <CodeBlock language="jsx" title="JavaScript">
{`function handleSearch(e) {
  const value = e.target.value;  // any
  setSearchParams(...);
}

function handleSubmit(e) {
  e.preventDefault();
}`}
      </CodeBlock>
      <CodeBlock language="tsx" title="TypeScript">
{`function handleSearch(e: React.ChangeEvent<HTMLInputElement>): void {
  const value = e.target.value;  // string
  setSearchParams(...);
}

function handleCategory(e: React.ChangeEvent<HTMLSelectElement>): void {
  setSearchParams(...);
}

function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
  e.preventDefault();
}`}
      </CodeBlock>

      <h3>Location State</h3>
      <CodeBlock language="jsx" title="JavaScript">
{`const location = useLocation();
const from = location.state?.from ?? '/';  // from is any`}
      </CodeBlock>
      <CodeBlock language="tsx" title="TypeScript">
{`const location = useLocation();
// location.state is typed as 'unknown' — cast to the shape you expect.
// Only do this cast where you know who set the state (e.g. the login page).
const from = (location.state as { from?: string } | null)?.from ?? '/';`}
      </CodeBlock>

      <h3>Error Page</h3>
      <CodeBlock language="jsx" title="JavaScript">
{`export default function ErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <h1>{error.status} {error.statusText}</h1>;
  }

  return <h1>{error?.message ?? 'Unknown error'}</h1>;
}`}
      </CodeBlock>
      <CodeBlock language="tsx" title="TypeScript">
{`export default function ErrorPage() {
  const error = useRouteError();  // typed as unknown

  // isRouteErrorResponse is a type guard — narrows error to ErrorResponse
  if (isRouteErrorResponse(error)) {
    return <h1>{error.status} {error.statusText}</h1>;
  }

  // Plain Error — cast to access .message
  if (error instanceof Error) {
    return <h1>{error.message}</h1>;
  }

  // Loader threw a custom object with a status property
  if ((error as { status?: number })?.status === 404) {
    return <h1>404 — Not Found</h1>;
  }

  return <h1>Unknown error</h1>;
}`}
      </CodeBlock>

      <h3>Lazy Routes</h3>
      <CodeBlock language="jsx" title="JavaScript">
{`{
  path: 'products',
  lazy: async () => {
    const mod = await import('./pages/ProductList');
    return { Component: mod.default, loader: mod.loader };
  },
}`}
      </CodeBlock>
      <CodeBlock language="tsx" title="TypeScript">
{`import type { RouteObject } from 'react-router-dom';

// RouteObject types the entire route config — optional but helpful for large apps
const routes: RouteObject[] = [
  {
    path: 'products',
    lazy: async () => {
      const mod = await import('./pages/ProductList');
      return { Component: mod.default, loader: mod.loader };
    },
  },
];

// The lazy() return type is inferred automatically — TypeScript checks that
// Component, loader, action, etc. are valid route properties.`}
      </CodeBlock>

      <h3>Summary — Key TypeScript Imports</h3>
      <CodeBlock language="tsx" title="TypeScript — all the types you'll use">
{`// From react-router-dom (no @types/ package needed)
import type {
  LoaderFunctionArgs,   // type for loader({ request, params })
  ActionFunctionArgs,   // type for action({ request, params })
  RouteObject,          // type for the route config array
} from 'react-router-dom';

// Pattern: derive loader data type from the loader itself
type LoaderData = Awaited<ReturnType<typeof loader>>;
// Then in the component:
const data = useLoaderData() as LoaderData;

// From React (for event handlers)
React.ChangeEvent<HTMLInputElement>     // onChange on input
React.ChangeEvent<HTMLSelectElement>    // onChange on select
React.FormEvent<HTMLFormElement>        // onSubmit on form
React.MouseEvent<HTMLButtonElement>     // onClick on button`}
      </CodeBlock>

      <InfoBox variant="tip" title="Type safety without complexity">
        You don't need to annotate everything. The minimum viable TypeScript setup for
        React Router is: <code>LoaderFunctionArgs</code> on loaders,{' '}
        <code>Awaited&lt;ReturnType&lt;typeof loader&gt;&gt;</code> for loader data, and{' '}
        <code>React.ChangeEvent&lt;...&gt;</code> on event handlers. Everything else
        TypeScript infers automatically from your return types and the router types.
      </InfoBox>
    </LessonLayout>
  );
}
