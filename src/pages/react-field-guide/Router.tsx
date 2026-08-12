import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideRouter() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React 19 · Field Reference"
      title="React Router v7"
      tagline="Route config, loaders, actions, and guards — the config-based API that replaced fetch-in-useEffect."
      meta={['v7', '13 patterns']}
      footerLabel="Personal study reference — React Router v7"
      pageLabel="React 19 Field Guide · Router"
      prev={{ path: '/react-field-guide/state-management', label: 'State Management' }}
      next={{ path: '/react-field-guide/recipes', label: 'Common Recipes' }}
    >
      <PosterCard
        glyph="R7"
        title={<>createBrowserRouter<span className="dim"> + RouterProvider</span></>}
        code={`const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [{ index: true, element: <Home /> }],
  },
]);

<RouterProvider router={router} />`}
        caption="The config-based API — use it for new projects. BrowserRouter + <Routes> still works but can't use loaders, actions, or route-level errorElements."
      />

      <PosterCard
        glyph="Cfg"
        title={<>Route Config — <span className="dim">key properties</span></>}
        code={`{
  path: 'users/:id',      // :id is a param, * is a splat
  index: true,             // matches parent path, no extra segment
  element: <Page />,
  loader: pageLoader,      // runs BEFORE render
  action: pageAction,      // handles POST/PUT/DELETE submissions
  errorElement: <Err />,   // catches loader/action/render throws
}`}
        caption="loader and action are v7's data APIs — the router runs them and hands the result to useLoaderData()/useActionData(), eliminating manual loading state and useEffect fetch chains."
      />

      <PosterCard
        glyph="Out"
        title={<>Nested Routes<span className="dim"> & Outlet</span></>}
        code={`{
  path: '/',
  element: <RootLayout />,   // must render <Outlet />
  children: [
    { index: true, element: <Home /> },
    { path: 'shop', element: <ShopLayout />, children: [ /* ... */ ] },
  ],
}

function RootLayout() { return <div><Nav /><Outlet /></div>; }`}
        caption="If a route has children but its component doesn't render <Outlet />, the child routes still match the URL but their components never appear — the parent silently swallows them."
      />

      <PosterCard
        glyph="Ld"
        title={<>loader<span className="dim">()</span></>}
        code={`export async function loader({ params, request }) {
  const res = await fetch(\`/api/users/\${params.userId}\`, {
    signal: request.signal,   // cancels if user navigates away mid-load
  });
  if (!res.ok) throw new Response('Not found', { status: res.status });
  return res.json();
}
// Component: const user = useLoaderData();`}
        caption="Loaders for every route in a matched tree run in parallel, not a waterfall — a Root > Dashboard > UserProfile tree fires all three loaders simultaneously."
      />

      <PosterCard
        glyph="Ac"
        title={<>action<span className="dim">() + </span>Form</>}
        code={`export async function action({ request }) {
  const formData = await request.formData();
  const name = formData.get('name');
  if (!name) return { error: 'Name required' };
  await saveToServer({ name });
  return redirect('/dashboard');
}

<Form method="post"><input name="name" /><button>Save</button></Form>`}
        caption={'Form method="post" triggers the route\'s action; method="get" triggers its loader instead. After a successful action, React Router automatically revalidates every active loader.'}
      />

      <PosterCard
        glyph="LD"
        title={<>useLoaderData<span className="dim"> & </span>useActionData</>}
        code={`export default function EditUser() {
  const user = useLoaderData();       // already-resolved loader data
  const actionData = useActionData(); // last action's return value

  return (
    <Form method="post">
      <input name="name" defaultValue={user.name} />
      {actionData?.errors?.name && <span>{actionData.errors.name}</span>}
    </Form>
  );
}`}
        caption="No loading state needed for useLoaderData — the router already awaited it before the component mounted. useActionData only reflects the most recent form submission."
      />

      <PosterCard
        glyph="Fe"
        title={<>useFetcher<span className="dim">()</span></>}
        code={`const fetcher = useFetcher();
const isDeleting = fetcher.state !== 'idle' &&
  fetcher.formData?.get('intent') === 'delete';

<fetcher.Form method="post" action={\`/todos/\${todo.id}\`}>
  <input type="hidden" name="intent" value="delete" />
  <button type="submit">Delete</button>
</fetcher.Form>`}
        caption="Submits to any route's action without navigating or changing the URL — the right tool for inline edits, toggles, and delete-from-a-list buttons."
      />

      <PosterCard
        glyph="Au"
        title={<>Auth Guard<span className="dim"> in a loader</span></>}
        code={`async function requireAuth(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    const url = new URL(request.url);
    throw redirect(\`/login?returnTo=\${encodeURIComponent(url.pathname)}\`);
  }
  return session;
}
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireAuth(request);
  return fetch('/api/dashboard', { headers: { Authorization: \`Bearer \${session.token}\` } });
}`}
        caption="Checking auth in the loader means the protected component never renders, not even for a flash — a component-based guard briefly mounts the page (firing its effects) before redirecting."
      />

      <PosterCard
        glyph="Hk"
        title={<>useNavigate<span className="dim"> / </span>useParams<span className="dim"> / </span>useSearchParams</>}
        code={`const navigate = useNavigate();
navigate('/dashboard', { replace: true });
navigate(-1); // back

const { userId } = useParams();               // /users/:userId

const [params, setParams] = useSearchParams();
setParams((prev) => { prev.set('page', '2'); return prev; });`}
        caption="navigate() does not stop execution — always return after calling it. It also does not re-run the current route's loader; use a fetcher or <Form> if you need fresh data after a mutation."
      />

      <PosterCard
        glyph="Nv"
        title="Link vs NavLink vs useNavigate"
        language="text"
        code={`Link          Anywhere clickable: content, buttons, breadcrumbs.
NavLink       Nav menus only — adds isActive/isPending for styling.
useNavigate   Navigation triggered by code, not a click:
                after form submit, after login, conditional redirects.`}
        caption="Reach for useNavigate only when navigation must happen inside a handler or effect — if it's a click, use Link, don't wire an onClick that just calls navigate()."
      />

      <PosterCard
        glyph="Er"
        title={<>errorElement<span className="dim"> + </span>useRouteError</>}
        code={`function RouteError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <h1>{error.status} — {error.statusText}</h1>;
  }
  return <h1>{(error as Error)?.message ?? 'Unknown error'}</h1>;
}
// Errors bubble up the tree until they hit an errorElement.`}
        caption="Place errorElement only on the root and one bad loader deep in the tree replaces your entire page. Add it at each route where you want granular, contained error handling."
      />

      <PosterCard
        glyph="Lz"
        title={<>Lazy Loading<span className="dim"> Routes</span></>}
        code={`{
  path: 'products',
  lazy: async () => {
    const mod = await import('./pages/ProductList');
    return { Component: mod.default, loader: mod.loader };
  },
}
// Wrap Suspense close to the route, not the root —
// a root-level Suspense replaces the whole app, nav included.`}
        caption="Each dynamic import becomes its own JS chunk, downloaded only on first visit to that route and served from cache after — free on every repeat visit."
      />

      <PosterCard
        glyph="TS"
        title={<>Typing Loader Data</>}
        code={`import type { LoaderFunctionArgs } from 'react-router-dom';

export async function loader({ params }: LoaderFunctionArgs): Promise<Product> {
  return getProduct(params.id!); // safe — loader only runs when the route matches
}

type LoaderData = Awaited<ReturnType<typeof loader>>;
const data = useLoaderData() as LoaderData;`}
        caption="useLoaderData() returns unknown in library mode. Deriving the type from the loader itself with Awaited<ReturnType<...>> keeps the component and loader always in sync — no manual duplicate type."
      />

      <PosterQuickRef
        title="Which API do I need?"
        rows={[
          { need: 'Fetch data before a route renders', answer: 'loader' },
          { need: 'Submit a form / mutate data', answer: 'action + <Form>' },
          { need: 'Mutate without changing the URL', answer: 'useFetcher' },
          { need: 'Navigate from code, not a click', answer: 'useNavigate (+ return after it)' },
          { need: 'Auth-protect a route', answer: 'throw redirect() in a loader' },
          { need: 'Read URL params / query string', answer: 'useParams / useSearchParams' },
          { need: 'Catch loader/action/render errors', answer: 'errorElement + useRouteError' },
          { need: 'Split a route into its own chunk', answer: 'lazy property on the route' },
        ]}
      />
    </PosterLayout>
  );
}
