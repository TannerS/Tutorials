import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Advanced() {
  return (
    <LessonLayout
      title="Advanced Patterns"
      sectionId="react-router"
      lessonIndex={4}
      prev={{ path: '/react-router/guards', label: 'Auth Guards & Protected Routes' }}
      next={{ path: '/react-router/testing', label: 'Testing Routes' }}
    >
      <p>
        Once you have the fundamentals, these advanced patterns help you build
        production-quality SPAs — lazy-loaded routes for fast initial loads,
        scroll restoration, modal routes, breadcrumbs, and route-level code
        splitting.
      </p>

      <h2>Lazy Loading Routes</h2>
      <p>
        React Router v7 supports a <code>lazy</code> property on route objects.
        It returns a module that exports route properties (element, loader,
        action, etc.). The router only downloads the module when the route is
        visited for the first time.
      </p>

      <CodeBlock language="jsx" title="Route-Level Lazy Loading (v7 lazy property)">
{`const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },  // always bundled
      {
        path: 'dashboard',
        // Everything for this route loads on demand
        lazy: () => import('./routes/Dashboard'),
      },
      {
        path: 'settings',
        lazy: () => import('./routes/Settings'),
      },
      {
        path: 'admin',
        lazy: () => import('./routes/Admin'),
      },
    ],
  },
]);

// routes/Dashboard.jsx — export named properties
export async function loader() {
  return fetch('/api/dashboard').then(r => r.json());
}

export function Component() {   // 'Component' (capital C) is the element
  const data = useLoaderData();
  return <div>Dashboard: {data.title}</div>;
}

// Optional: custom error boundary for this route
export function ErrorBoundary() {
  const error = useRouteError();
  return <p>Dashboard failed: {error.message}</p>;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="lazy() vs React.lazy()">
        React Router&apos;s <code>lazy</code> property loads the entire route module
        (element, loader, action, errorElement) in one import. <code>React.lazy()</code>{' '}
        only lazy-loads the component. Prefer the route-level <code>lazy</code> for
        full code splitting — it also parallelizes loader execution with chunk loading.
      </InfoBox>

      <h3>Fallback with React.lazy (Classic Pattern)</h3>
      <CodeBlock language="jsx" title="React.lazy + Suspense Fallback">
{`import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function LazyRoute({ component: Component }) {
  return (
    <Suspense fallback={<div className="route-skeleton">Loading...</div>}>
      <Component />
    </Suspense>
  );
}

// In route config
{
  path: 'dashboard',
  element: <LazyRoute component={Dashboard} />,
}`}
      </CodeBlock>

      <h2>Code Splitting with Vite</h2>
      <CodeBlock language="jsx" title="Vite Chunk Naming for Routes">
{`// Vite automatically code-splits dynamic imports.
// Name chunks for better debugging:
const router = createBrowserRouter([
  {
    path: 'dashboard',
    lazy: () => import(/* webpackChunkName: "dashboard" */ './routes/Dashboard'),
  },
  {
    path: 'reports',
    lazy: () => import(/* webpackChunkName: "reports" */ './routes/Reports'),
  },
]);

// vite.config.js — control chunk output
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
        },
      },
    },
  },
});`}
      </CodeBlock>

      <FlowChart
        title="Lazy Route Loading Sequence"
        chart={"graph TD\nA[User clicks /dashboard link] --> B[Router matches /dashboard route]\nB --> C{Route has lazy property?}\nC -->|Yes| D[Download route chunk]\nC -->|No| E[Use static element/loader]\nD --> F[Extract Component + loader + action]\nF --> G[Run loader in parallel with render prep]\nG --> H[Render Component with loader data]\nE --> G\nstyle D fill:#8b5cf6,color:#fff\nstyle G fill:#3b82f6,color:#fff\nstyle H fill:#10b981,color:#fff"}
      />

      <h2>Scroll Restoration</h2>
      <p>
        By default, browsers don&apos;t restore scroll position for SPA
        navigations. React Router provides <code>&lt;ScrollRestoration /&gt;</code>{' '}
        to handle this automatically.
      </p>

      <CodeBlock language="jsx" title="ScrollRestoration">
{`import { ScrollRestoration, Outlet } from 'react-router-dom';

function RootLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      {/* Place once, at the root layout */}
      <ScrollRestoration
        // Optional: customize which navigations restore scroll
        getKey={(location) => {
          // Same key = restore position; different key = scroll to top
          const noRestore = ['/search', '/explore'];
          return noRestore.includes(location.pathname)
            ? location.key       // unique per visit — always scroll top
            : location.pathname; // same path = restore scroll position
        }}
      />
    </>
  );
}`}
      </CodeBlock>

      <InfoBox variant="info" title="ScrollRestoration Requirements">
        <code>&lt;ScrollRestoration /&gt;</code> only works with{' '}
        <code>createBrowserRouter</code>. It uses <code>sessionStorage</code> to
        persist scroll positions across refreshes. Place it in your root layout,
        after all content.
      </InfoBox>

      <h2>Modal Routes</h2>
      <p>
        Modal routes let you open a detail view as a modal overlay while keeping
        the list visible underneath. The URL updates so users can share or
        bookmark the modal state.
      </p>

      <CodeBlock language="jsx" title="Modal Route Pattern">
{`import { Outlet, useNavigate, useLocation } from 'react-router-dom';

function PhotoGrid() {
  const photos = useLoaderData();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if there's a background location (modal is open)
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <>
      <div className="photo-grid">
        {photos.map((photo) => (
          <Link
            key={photo.id}
            to={\`/photos/\${photo.id}\`}
            // Pass current location as background
            state={{ backgroundLocation: location }}
          >
            <img src={photo.thumbnail} alt={photo.title} />
          </Link>
        ))}
      </div>

      {/* Render modal when backgroundLocation exists */}
      {backgroundLocation && <Outlet />}
    </>
  );
}

function PhotoModal() {
  const photo = useLoaderData();
  const navigate = useNavigate();

  return (
    <div className="modal-overlay" onClick={() => navigate(-1)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={photo.fullSize} alt={photo.title} />
        <h2>{photo.title}</h2>
        <button onClick={() => navigate(-1)}>Close</button>
      </div>
    </div>
  );
}

// In router config — render modal OR full page depending on state
function App() {
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <Routes location={backgroundLocation || location}>
      <Route path="/" element={<Layout />}>
        <Route path="photos" element={<PhotoGrid />} />
        <Route path="photos/:id" element={<PhotoDetail />} />
      </Route>

      {/* Modal layer — only renders if background location exists */}
      {backgroundLocation && (
        <Routes location={location}>
          <Route path="photos/:id" element={<PhotoModal />} />
        </Routes>
      )}
    </Routes>
  );
}`}
      </CodeBlock>

      <h2>Breadcrumbs with useMatches</h2>
      <p>
        <code>useMatches()</code> returns every matched route from root to leaf.
        Attach a <code>handle</code> object to routes to carry metadata like
        breadcrumb labels.
      </p>

      <CodeBlock language="jsx" title="Breadcrumbs from Route Matches">
{`// Route config with handle metadata
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    handle: { breadcrumb: 'Home' },
    children: [
      {
        path: 'projects',
        element: <Projects />,
        handle: { breadcrumb: 'Projects' },
        children: [
          {
            path: ':projectId',
            element: <ProjectDetail />,
            loader: projectLoader,
            // Dynamic breadcrumb from loader data
            handle: {
              breadcrumb: (data) => data.project.name,
            },
          },
        ],
      },
    ],
  },
]);

// Breadcrumb component
import { useMatches, Link } from 'react-router-dom';

function Breadcrumbs() {
  const matches = useMatches();

  const crumbs = matches
    .filter((match) => match.handle?.breadcrumb)
    .map((match) => {
      const label = typeof match.handle.breadcrumb === 'function'
        ? match.handle.breadcrumb(match.data)
        : match.handle.breadcrumb;

      return { path: match.pathname, label };
    });

  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumbs">
        {crumbs.map((crumb, i) => (
          <li key={crumb.path}>
            {i < crumbs.length - 1 ? (
              <Link to={crumb.path}>{crumb.label}</Link>
            ) : (
              <span aria-current="page">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}`}
      </CodeBlock>

      <h2>Programmatic Navigation Patterns</h2>
      <CodeBlock language="jsx" title="Advanced Navigation">
{`import { useNavigate, useLocation } from 'react-router-dom';

function useSmartNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return {
    // Navigate with return-to support
    goTo: (path, options) => navigate(path, options),

    // Navigate back, with fallback if no history
    goBack: (fallback = '/') => {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallback, { replace: true });
      }
    },

    // Replace current entry (no back-button)
    replace: (path) => navigate(path, { replace: true }),

    // Navigate with state
    goWithState: (path, state) => navigate(path, { state }),

    // Redirect after action (e.g., delete then go to list)
    redirectAfterAction: (path) => {
      navigate(path, { replace: true, state: { flash: 'Action completed' } });
    },
  };
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Avoid Navigation in Render">
        Never call <code>navigate()</code> during render. It must be in an event
        handler, effect, or callback. For render-time redirects, use{' '}
        <code>&lt;Navigate to=&quot;/path&quot; /&gt;</code> instead.
      </InfoBox>

      <h2>Route Transition Animations</h2>
      <CodeBlock language="jsx" title="Animated Route Transitions (framer-motion)">
{`import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

function AnimatedLayout() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}

// In route config
{
  path: '/',
  element: <AnimatedLayout />,
  children: [
    { index: true, element: <Home /> },
    { path: 'about', element: <About /> },
  ],
}`}
      </CodeBlock>

      <h2>React Router v6 vs v7 Changes</h2>
      <CodeBlock language="jsx" title="Key Differences: v6 → v7">
{`/*
┌──────────────────────────┬──────────────────────────────────────┐
│ v6                       │ v7                                   │
├──────────────────────────┼──────────────────────────────────────┤
│ Separate Remix framework │ Remix merged INTO React Router       │
│ No framework mode        │ Optional framework mode (Vite)       │
│ useLoaderData (Remix)    │ useLoaderData (built-in)             │
│ json() for responses     │ json() deprecated — return plain obj │
│ defer() + Await          │ Still works, but Suspense preferred  │
│ No lazy() on routes      │ lazy() for code-split route modules  │
│ No pre-rendering         │ Static pre-rendering support         │
│ No typesafe routes       │ Typesafe route modules (framework)   │
│ Manual scroll restore    │ <ScrollRestoration /> built-in       │
│ V6 flag system           │ Future flags removed (now defaults)  │
└──────────────────────────┴──────────────────────────────────────┘
*/`}
      </CodeBlock>

      <InfoBox variant="note" title="Migration Tips">
        Moving from v6 to v7: (1) replace <code>json()</code> responses in
        loaders with plain object returns, (2) remove future flags that are now
        defaults, (3) adopt <code>lazy()</code> for code splitting, and (4) consider
        the framework mode if you want file-based routing with Vite.
      </InfoBox>

      <h2>Framework Mode (File-Based Routing)</h2>
      <CodeBlock language="jsx" title="React Router v7 Framework Mode">
{`// v7 can act as a framework (like Remix) with Vite
// File-based routing in app/routes/

// app/routes/home.tsx        →  /
// app/routes/about.tsx       →  /about
// app/routes/users.$id.tsx   →  /users/:id
// app/routes/dashboard_.tsx  →  /dashboard (pathless layout escape)

// Each route file exports:
// - default component (the page)
// - loader function (data fetching)
// - action function (mutations)
// - meta function (page metadata)
// - ErrorBoundary component

// react-router.config.ts
import type { Config } from 'react-router';

export default {
  appDirectory: 'app',
  ssr: false,  // SPA mode (no server rendering)
} satisfies Config;`}
      </CodeBlock>

      <h2>Prefetching Routes</h2>
      <CodeBlock language="jsx" title="Prefetch on Hover/Focus">
{`import { Link } from 'react-router-dom';

// In framework mode, Link supports prefetch
<Link to="/dashboard" prefetch="intent">
  Dashboard
</Link>

// prefetch options:
// "none"   — no prefetching (default in SPA mode)
// "intent" — prefetch when user hovers or focuses
// "render" — prefetch as soon as the link renders
// "viewport" — prefetch when link enters viewport

// In SPA mode (no framework), manual prefetch pattern:
function PrefetchLink({ to, children, ...props }) {
  const prefetch = () => {
    // Trigger the lazy import to cache the chunk
    import(\`./routes/\${to.replace('/', '')}\`).catch(() => {});
  };

  return (
    <Link
      to={to}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      {...props}
    >
      {children}
    </Link>
  );
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"What is the advantage of React Router v7's lazy() property over React.lazy()?"}
        options={[
          "lazy() is faster because it uses Web Workers",
          "lazy() loads the entire route module (component + loader + action) in one import",
          "lazy() works without Suspense boundaries",
          "lazy() pre-renders the component on the server",
        ]}
        correctIndex={1}
        explanation={"React Router's lazy() property loads the complete route module — component, loader, action, and error boundary — in a single dynamic import. This means the loader can run as soon as the chunk downloads, in parallel with render preparation. React.lazy() only handles the component, leaving loader/action separate."}
        language="jsx"
      />

      <h2>Quick Reference: When to Use What</h2>
      <CodeBlock language="jsx" title="Pattern Decision Guide">
{`/*
Need                          → Pattern
─────────────────────────────────────────────────────────
Shared layout                 → Nested route + Outlet
Auth guard                    → Loader redirect (config-based)
                              → ProtectedRoute wrapper (JSX-based)
Data before render            → loader + useLoaderData
Form mutation                 → action + Form component
Inline mutation (no nav)      → useFetcher
Non-critical data             → defer + Await + Suspense
Loading indicators            → useNavigation
Route errors                  → errorElement + useRouteError
URL breadcrumbs               → useMatches + handle.breadcrumb
Code splitting                → lazy() on route objects
Scroll position               → <ScrollRestoration />
Modal overlay                 → backgroundLocation state pattern
Page transitions              → AnimatePresence + useOutlet
Type-safe routes              → Framework mode + route modules
*/`}
      </CodeBlock>

      <FlowChart
        title="React Router v7 Architecture Overview"
        chart={"graph TD\nA[URL Change] --> B[Router]\nB --> C[Match Routes]\nC --> D{lazy route?}\nD -->|Yes| E[Load chunk]\nD -->|No| F[Use static config]\nE --> F\nF --> G[Run loaders in parallel]\nG --> H[Render matched components]\nH --> I[Outlets fill with children]\nI --> J[ScrollRestoration runs]\nJ --> K[Page visible to user]\nstyle B fill:#3b82f6,color:#fff\nstyle G fill:#8b5cf6,color:#fff\nstyle K fill:#10b981,color:#fff"}
      />

      <InfoBox variant="success" title="You Made It!">
        You now have a comprehensive understanding of React Router v7 — from basic
        setup through advanced production patterns. The key insight: v7 merges the
        best of Remix into React Router, making loaders, actions, and route-level
        code organization first-class features. Start with{' '}
        <code>createBrowserRouter</code> and progressively adopt loaders, actions,
        and lazy routes as your app grows.
      </InfoBox>
    </LessonLayout>
  );
}
