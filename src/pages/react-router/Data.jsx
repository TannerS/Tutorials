import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RRData() {
  return (
    <LessonLayout
      title="Data Loading"
      sectionId="react-router"
      lessonIndex={2}
      prev={{ path: "/react-router/nested", label: "Nested Routes" }}
      next={{ path: "/react-router/guards", label: "Route Guards" }}
    >
      <p>
        React Router v6.4+ introduced a data API that moves data fetching directly into route
        definitions. Loaders fetch data before a component renders; actions handle form submissions.
        This eliminates loading state boilerplate and enables parallel data fetching across nested routes.
      </p>

      <FlowChart
        title="Data Loading Lifecycle"
        chart={"graph LR\n  A[URL Change] --> B[Run all loaders in parallel]\n  B --> C{All loaders resolve?}\n  C -->|Yes| D[Render components]\n  C -->|Error| E[Render errorElement]\n  D --> F[User submits Form]\n  F --> G[Run action]\n  G --> H[Revalidate loaders]\n  H --> D"}
      />

      <h2>createBrowserRouter with Loaders</h2>
      <p>
        The data API requires <code>createBrowserRouter</code> (not the JSX <code>BrowserRouter</code>).
        Each route can define a <code>loader</code> function that runs before the component renders.
      </p>

      <CodeBlock language="jsx" title="createBrowserRouter with loader Functions">
{`import {
  createBrowserRouter, RouterProvider,
  useLoaderData, useNavigation,
} from 'react-router-dom';

// Loader runs BEFORE the component renders — return data, throw redirect, or throw error
async function productsLoader({ params, request }) {
  // params contains URL parameters: params.id, params.category, etc.
  // request is a standard Fetch Request object (URL, headers, etc.)
  const url = new URL(request.url);
  const sort = url.searchParams.get('sort') || 'name';

  const response = await fetch('/api/products?sort=' + sort);
  if (!response.ok) {
    // Throwing a Response or Error triggers the route's errorElement
    throw new Response('Failed to load products', { status: 500 });
  }
  return response.json(); // React Router makes this available via useLoaderData
}

async function productDetailLoader({ params }) {
  const product = await fetchProduct(params.id);
  if (!product) {
    throw new Response('Product not found', { status: 404 });
  }
  return { product };
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'products',
        element: <ProductsPage />,
        loader: productsLoader,           // runs before ProductsPage renders
        errorElement: <ProductsError />,  // renders if loader throws
      },
      {
        path: 'products/:id',
        element: <ProductDetail />,
        loader: productDetailLoader,
      },
    ],
  },
]);

// useLoaderData() returns whatever the loader returned — no useState/useEffect needed
function ProductsPage() {
  const products = useLoaderData(); // array of products
  const navigation = useNavigation();
  // navigation.state: "idle" | "loading" | "submitting"

  if (navigation.state === 'loading') return <Spinner />;

  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}`}
      </CodeBlock>

      <h2>Action Functions and the Form Component</h2>
      <p>
        Actions handle mutations — form submissions, deletions, updates. React Router's{' '}
        <code>Form</code> component submits to the route's action and automatically revalidates
        all loaders after the action completes.
      </p>

      <CodeBlock language="jsx" title="Actions with the Form Component">
{`import { Form, useActionData, redirect } from 'react-router-dom';

// Action runs when a Form in this route submits
async function createProductAction({ request }) {
  const formData = await request.formData();
  const name = formData.get('name');
  const price = formData.get('price');

  // Server-side validation
  const errors = {};
  if (!name) errors.name = 'Name is required';
  if (!price || isNaN(Number(price))) errors.price = 'Valid price required';
  if (Object.keys(errors).length > 0) {
    return { errors }; // useActionData() returns this
  }

  const product = await createProduct({ name, price: Number(price) });
  // redirect() throws a redirect Response — no return needed
  return redirect('/products/' + product.id);
}

const router = createBrowserRouter([
  {
    path: 'products/new',
    element: <NewProductForm />,
    action: createProductAction,  // handles POST from <Form>
  },
]);

function NewProductForm() {
  const actionData = useActionData(); // { errors } from action, or undefined
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    // React Router's Form — serializes to FormData, posts to action
    <Form method="post">
      <label>
        Name
        <input name="name" />
        {actionData?.errors?.name && <span>{actionData.errors.name}</span>}
      </label>
      <label>
        Price
        <input name="price" type="number" />
        {actionData?.errors?.price && <span>{actionData.errors.price}</span>}
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Product'}
      </button>
    </Form>
  );
}`}
      </CodeBlock>

      <h2>defer() and Await for Streaming</h2>
      <p>
        Use <code>defer()</code> to stream slow data — the route renders immediately with fast data
        while slow data loads in the background, wrapped in a <code>Suspense</code> boundary.
      </p>

      <CodeBlock language="jsx" title="defer and Await for Streamed Data">
{`import { defer, Await, useLoaderData, Suspense } from 'react-router-dom';

// defer() returns immediately — slow data loads in background
async function dashboardLoader() {
  const userPromise = fetchUser();          // fast (~50ms)
  const statsPromise = fetchStats();        // slow (~2000ms)

  return defer({
    user: await userPromise,   // awaited — must resolve before render
    stats: statsPromise,       // NOT awaited — streams in later
  });
}

function Dashboard() {
  const { user, stats } = useLoaderData();

  return (
    <div>
      <h1>Welcome, {user.name}</h1> {/* available immediately */}

      {/* Suspense shows fallback while stats stream in */}
      <Suspense fallback={<StatsSkeletonLoader />}>
        <Await
          resolve={stats}
          errorElement={<p>Could not load stats.</p>}
        >
          {(resolvedStats) => (
            <StatsGrid stats={resolvedStats} />
          )}
        </Await>
      </Suspense>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Parallel Loader Execution">
        React Router runs all loaders for the matched route tree in parallel — not sequentially.
        If you have a root layout loader and a child page loader, both run at the same time.
        This is a major performance advantage over the traditional <code>useEffect</code> waterfall
        where each component waits for its parent to render before fetching.
      </InfoBox>

      <h2>Error Boundaries in Routes</h2>

      <CodeBlock language="jsx" title="errorElement for Route Error Handling">
{`import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

// errorElement renders when:
// 1. The loader throws an error or a Response
// 2. The action throws an error or a Response
// 3. The component itself throws during render

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <GlobalError />, // catches errors from any descendant
    children: [
      {
        path: 'products/:id',
        element: <ProductDetail />,
        loader: productLoader,
        errorElement: <ProductError />, // catches only this route's errors
      },
    ],
  },
]);

function ProductError() {
  const error = useRouteError();

  // isRouteErrorResponse checks if it's a thrown Response
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <h1>Product not found</h1>;
    }
    return <h1>Error {error.status}: {error.statusText}</h1>;
  }

  // Regular JS error
  return <h1>Unexpected error: {error.message}</h1>;
}

// Loader that throws different errors
async function productLoader({ params }) {
  const product = await fetchProduct(params.id);
  if (!product) throw new Response('Not Found', { status: 404 });
  if (!product.isPublished) throw new Response('Forbidden', { status: 403 });
  return product;
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"What happens to loaders for nested routes when the URL changes?"}
        options={[
          "Loaders run sequentially — parent first, then child",
          "Only the leaf route's loader runs",
          "All loaders in the matched route tree run in parallel",
          "Loaders only run on the first page load"
        ]}
        correctIndex={2}
        explanation={"React Router runs all loaders for the matched route tree in parallel simultaneously. This eliminates the waterfall fetch problem where each component waits for its parent before fetching. Parallel loading is one of the primary performance benefits of the data API."}
      />

      <InteractiveChallenge
        question={"What does defer() enable that a regular async loader cannot do?"}
        options={[
          "It allows the loader to run after the component renders",
          "It lets the route render immediately with fast data while slow data streams in via Suspense",
          "It makes the loader run in a web worker",
          "It caches the loader result between route navigations"
        ]}
        correctIndex={1}
        explanation={"defer() returns a mix of resolved and pending data. Values that are awaited resolve before render; values that are passed as Promises stream in later. The component renders immediately with the resolved data, and uses <Await> inside <Suspense> to show a skeleton until the deferred data arrives."}
      />
    </LessonLayout>
  );
}
