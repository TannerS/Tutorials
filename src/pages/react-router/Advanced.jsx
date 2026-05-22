import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RRAdvanced() {
  return (
    <LessonLayout
      title="Advanced Routing Patterns"
      sectionId="react-router"
      lessonIndex={4}
      prev={{ path: '/react-router/guards', label: 'Route Guards' }}
      next={{ path: '/react-router/testing', label: 'Testing Routes' }}
    >
      <h2>Code Splitting with Lazy Routes</h2>
      <p>
        Large applications should not load all code on the first page visit. React Router's
        <code>lazy</code> option integrates with dynamic imports to split your bundle by route —
        each route's code is only fetched when the user navigates to it.
      </p>

      <FlowChart
        title="Lazy Route Loading"
        chart={"graph LR\n  A[User navigates to /admin] --> B[React Router checks route]\n  B --> C[lazy function runs]\n  C --> D[Dynamic import fetches chunk]\n  D --> E[Component renders]\n  B --> F[Suspense shows fallback during fetch]"}
      />

      <CodeBlock language="jsx" title="Lazy Routes — Code Splitting by Route">
{`import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// ── OPTION 1: React.lazy + Suspense (works with JSX Routes too) ────
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ReportsPage    = lazy(() => import('./pages/Reports'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },  // NOT lazy — critical path

      // Wrap lazy routes in Suspense
      {
        path: 'admin',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <AdminDashboard />
          </Suspense>
        ),
      },
    ],
  },
]);

// ── OPTION 2: Route-level lazy (v6.9+, preferred) ──────────────────
// The lazy function returns the module — React Router handles Suspense
const router2 = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'admin',
        // lazy() must return { Component, loader, action, errorElement, etc. }
        lazy: async () => {
          const mod = await import('./pages/AdminDashboard');
          return {
            Component: mod.default,   // the default export component
            loader: mod.adminLoader,  // named export loader
          };
        },
      },
      {
        path: 'reports',
        lazy: async () => {
          const { default: Component, loader } = await import('./pages/Reports');
          return { Component, loader };
        },
      },
    ],
  },
]);

// ── OPTION 3: Preload on hover for instant navigation ─────────────
function NavLink({ to, children }) {
  const preload = () => import('./pages/' + to.slice(1));  // warm the cache
  return (
    <Link to={to} onMouseEnter={preload} onFocus={preload}>
      {children}
    </Link>
  );
}`}
      </CodeBlock>

      <h2>Deferred Data Loading</h2>

      <CodeBlock language="jsx" title="defer — Stream Data to the Client">
{`import { defer, Await, useLoaderData, Suspense } from 'react-router-dom';

// defer lets you return some data immediately and stream the rest
// Critical data (user) blocks the route render
// Non-critical data (recommendations) streams in after
export async function productLoader({ params }) {
  // Immediately awaited — blocks navigation until ready
  const product = await fetchProduct(params.id);

  // NOT awaited — starts fetching but doesn't block
  const reviewsPromise = fetchReviews(params.id);
  const recommendationsPromise = fetchRecommendations(params.id);

  return defer({
    product,               // immediately available
    reviews: reviewsPromise,          // streamed
    recommendations: recommendationsPromise,  // streamed
  });
}

function ProductPage() {
  const { product, reviews, recommendations } = useLoaderData();

  // product is already resolved — render immediately
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      {/* Suspense + Await for deferred data */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Await
          resolve={reviews}
          errorElement={<p>Failed to load reviews.</p>}
        >
          {(resolvedReviews) => (
            <ReviewList reviews={resolvedReviews} />
          )}
        </Await>
      </Suspense>

      <Suspense fallback={<RecommendationsSkeleton />}>
        <Await resolve={recommendations}>
          {(items) => <ProductGrid products={items} />}
        </Await>
      </Suspense>
    </div>
  );
}`}
      </CodeBlock>

      <h2>Search Params — URL as State</h2>

      <CodeBlock language="jsx" title="useSearchParams — Filters, Pagination, Search">
{`import { useSearchParams } from 'react-router-dom';

// URL search params are the best place for:
// - Filter state (?category=books&sort=price)
// - Pagination (?page=3)
// - Search queries (?q=react+hooks)
// They are bookmarkable, shareable, and survive page refresh

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query    = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? 'all';
  const sort     = searchParams.get('sort') ?? 'newest';
  const page     = Number(searchParams.get('page') ?? '1');

  // Update one param without losing others
  const updateParam = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, String(value));
      } else {
        next.delete(key);
      }
      // Reset page when filters change
      if (key !== 'page') next.set('page', '1');
      return next;
    });
  };

  // replace: true means filter changes don't pollute history
  const updateFilter = (key, value) => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.set(key, value);
        next.set('page', '1');
        return next;
      },
      { replace: true }  // don't push history entry for each filter change
    );
  };

  return (
    <div>
      <input
        value={query}
        onChange={e => updateFilter('q', e.target.value)}
        placeholder="Search..."
      />
      <select value={category} onChange={e => updateFilter('category', e.target.value)}>
        <option value="all">All</option>
        <option value="books">Books</option>
        <option value="electronics">Electronics</option>
      </select>
      <select value={sort} onChange={e => updateFilter('sort', e.target.value)}>
        <option value="newest">Newest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
      <Pagination
        current={page}
        onChange={p => updateParam('page', p)}
      />
    </div>
  );
}`}
      </CodeBlock>

      <h2>Scroll Restoration and Navigation State</h2>

      <CodeBlock language="jsx" title="Scroll Restoration and useNavigation">
{`import { ScrollRestoration, useNavigation, useBeforeUnload } from 'react-router-dom';

// ── SCROLL RESTORATION ─────────────────────────────────────────────
// Add once to your root layout — restores scroll on back/forward
function RootLayout() {
  return (
    <>
      <ScrollRestoration
        // Custom position per route
        getKey={(location) => {
          // Don't restore scroll for modal-style routes
          if (location.pathname.includes('/modal')) return location.key;
          return location.pathname;  // restore scroll by path
        }}
      />
      <Outlet />
    </>
  );
}

// ── NAVIGATION STATE — loading indicators ─────────────────────────
function GlobalLoader() {
  const navigation = useNavigation();
  const isLoading = navigation.state !== 'idle';

  return isLoading ? (
    <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse" />
  ) : null;
}

// navigation.state:
// 'idle'       — not navigating
// 'loading'    — navigating, running loaders
// 'submitting' — form submitted, running action

function SubmitButton() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Save'}
    </button>
  );
}

// ── UNSAVED CHANGES WARNING ────────────────────────────────────────
function EditForm({ isDirty }) {
  // Warns user if they try to close tab with unsaved changes
  useBeforeUnload(
    React.useCallback(
      (e) => {
        if (isDirty) {
          e.preventDefault();
          e.returnValue = '';  // shows browser's default warning dialog
        }
      },
      [isDirty]
    )
  );

  return <form>{/* ... */}</form>;
}`}
      </CodeBlock>

      <h2>Route-Based Error Boundaries</h2>

      <CodeBlock language="jsx" title="errorElement — Per-Route Error Boundaries">
{`// Each route can define its own errorElement
// React Router catches errors from loaders, actions, and rendering

function RouteError() {
  const error = useRouteError();

  // isRouteErrorResponse: error from a Response throw (HTTP-like errors)
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data?.message ?? 'An error occurred'}</p>
      </div>
    );
  }

  // Regular JavaScript errors
  return (
    <div>
      <h1>Something went wrong</h1>
      <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
    </div>
  );
}

// Throwing from loaders — type-safe HTTP-like errors
export async function productLoader({ params }) {
  const product = await fetchProduct(params.id);

  if (!product) {
    throw new Response('Not Found', {
      status: 404,
      statusText: 'Product not found',
    });
  }

  if (!product.isPublished) {
    throw new Response('Forbidden', { status: 403 });
  }

  return product;
}

// Router config with error boundaries at different granularities
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <GlobalError />,  // catches everything not caught below
    children: [
      {
        path: 'products/:id',
        element: <ProductDetail />,
        loader: productLoader,
        errorElement: <ProductError />,  // only catches product errors
      },
    ],
  },
]);`}
      </CodeBlock>

      <InfoBox variant="tip" title="useNavigate vs Link — When to Use Each">
        <p>
          Prefer <code>{'<Link>'}</code> for all navigation the user triggers directly — it renders an
          <code>{'<a>'}</code> tag, so right-click → open in new tab works, SEO crawlers follow it,
          and keyboard navigation works natively. Use <code>useNavigate()</code> only for programmatic
          navigation: after a form submission, after an async operation, or conditional redirects.
          Never use <code>{'<button onClick={() => navigate("/")}>'}</code> for navigation that should
          be a link — use <code>{'<Link>'}</code>.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the advantage of using setSearchParams over navigate for filter/sort state?"
        options={[
          "setSearchParams is significantly faster than navigate at runtime",
          "setSearchParams updates URL params without adding a new history entry by default — state is bookmarkable and shareable without navigation noise",
          "setSearchParams works in offline mode while navigate requires a server",
          "navigate does not support query strings at all"
        ]}
        correctIndex={1}
        explanation="setSearchParams updates URL search params (like ?category=books&sort=price), making filter state bookmarkable and shareable. With { replace: true }, it replaces the current history entry instead of pushing a new one — so the back button goes back to the previous page, not the previous filter state. This gives you persistent URL state without polluting browser history with every filter change."
      />

      <InteractiveChallenge
        question="What does defer() do in a React Router loader?"
        options={[
          "It delays the loader from running until the page is idle",
          "It lets you return some data immediately while other data streams in asynchronously — critical data blocks render, non-critical data loads after",
          "It caches the loader result for subsequent navigations",
          "defer() prevents the loader from blocking the navigation"
        ]}
        correctIndex={1}
        explanation="defer() lets you return multiple promises from a loader, where some are awaited (blocking navigation) and some are not (streamed). The route renders as soon as the awaited data is ready. Non-awaited promises are passed to <Await> components wrapped in <Suspense>, which show fallbacks until the data arrives. Use this to prioritize critical content (product details) over non-critical content (reviews, recommendations)."
      />
    </LessonLayout>
  );
}
