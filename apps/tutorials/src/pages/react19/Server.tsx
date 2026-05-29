import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Server() {
  return (
    <LessonLayout
      title="Server Components & Actions"
      sectionId="react19"
      lessonIndex={7}
      prev={{ path: '/react19/react19', label: 'React 19 New Features' }}
      next={{ path: '/react19/patterns', label: 'Advanced Patterns' }}
    >
      <p>Server Components represent a fundamental shift in React architecture. Components can now run exclusively on the server, sending only their rendered output to the client — zero JavaScript for those components ships to the browser.</p>

      <h2>The Mental Model</h2>

      <FlowChart
        title="Server vs Client Component Execution"
        chart={"graph TD\n  A[Request] --> B[Server Components Execute on Server]\n  B --> C[Fetch data directly - no API needed]\n  B --> D[Access DB/filesystem/secrets]\n  B --> E[Render to serialized output]\n  E --> F[Stream to Client]\n  F --> G[Client Components Hydrate]\n  G --> H[Interactive - state/effects/events]\n  I[Key Rule] --> J[Server Components CANNOT use state/effects/browser APIs]\n  I --> K[Client Components CAN import Server Components as children]"}
      />

      <InfoBox variant="info" title="Default is Server">
        <p>In frameworks that support React Server Components (Next.js App Router, etc.), <strong>all components are Server Components by default</strong>. You opt INTO client behavior with <code>"use client"</code> at the top of a file. Think of it as a boundary — everything below that directive (and its imports) becomes client code.</p>
      </InfoBox>

      <h2>Server Components — Direct Data Access</h2>

      <CodeBlock language="jsx" title="Server Components — No useEffect, No Loading States" showLineNumbers>
{`// This is a Server Component (default in App Router)
// It runs ONLY on the server — no JS sent to browser for this component

import { db } from '@/lib/database';

async function ProductPage({ params }) {
  // Direct database access — no API route needed!
  const product = await db.products.findUnique({
    where: { slug: params.slug },
    include: { reviews: true, category: true },
  });

  // Access environment secrets safely
  const price = await convertCurrency(product.price, process.env.EXCHANGE_API_KEY);

  return (
    <div>
      <title>{product.name} | Our Store</title>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <span>\${price}</span>

      {/* Client Component for interactivity */}
      <AddToCartButton productId={product.id} />

      {/* Server-rendered list — could be 1000 reviews, zero client JS */}
      <ReviewList reviews={product.reviews} />
    </div>
  );
}

export default ProductPage;`}
      </CodeBlock>

      <h2>"use client" Directive</h2>

      <CodeBlock language="jsx" title="Client Components — When You Need Interactivity" showLineNumbers>
{`"use client"; // This file and its imports are client-side code

import { useState, useTransition } from 'react';
import { addToCart } from '@/actions/cart'; // Server Action

export function AddToCartButton({ productId }) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    startTransition(async () => {
      await addToCart(productId); // Calls server action
      setAdded(true);
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? 'Adding...' : added ? 'Added ✓' : 'Add to Cart'}
    </button>
  );
}

// When to use "use client":
// - useState, useEffect, useRef, or any hook with state/lifecycle
// - Event handlers (onClick, onChange, etc.)
// - Browser-only APIs (window, document, localStorage)
// - Third-party libs that use any of the above`}
      </CodeBlock>

      <h2>Server Actions — "use server"</h2>

      <CodeBlock language="jsx" title="Server Actions — Mutations Without API Routes" showLineNumbers>
{`// Server Action — runs on server, callable from client
"use server";

import { db } from '@/lib/database';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData) {
  // Validate on server — never trust client
  const title = formData.get('title');
  const content = formData.get('content');

  if (!title || title.length < 3) {
    return { error: 'Title must be at least 3 characters' };
  }

  // Direct DB mutation
  const post = await db.posts.create({
    data: { title, content, authorId: getCurrentUser().id },
  });

  // Invalidate cached data so UI refreshes
  revalidatePath('/posts');
  redirect(\`/posts/\${post.slug}\`);
}

export async function deletePost(postId) {
  await db.posts.delete({ where: { id: postId } });
  revalidatePath('/posts');
}

// Usage in a Client Component:
// import { createPost } from './actions';
// <form action={createPost}> ... </form>

// Or called imperatively:
// const result = await createPost(formData);`}
      </CodeBlock>

      <h2>Streaming & Suspense Boundaries</h2>

      <CodeBlock language="jsx" title="Progressive Loading with Suspense" showLineNumbers>
{`import { Suspense } from 'react';

// Server Component that orchestrates streaming
async function DashboardPage() {
  // This data loads fast — renders immediately
  const user = await getUser();

  return (
    <div>
      <h1>Welcome, {user.name}</h1>

      {/* Each Suspense boundary streams independently */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsPanel userId={user.id} />  {/* Slow query — streams when ready */}
      </Suspense>

      <Suspense fallback={<FeedSkeleton />}>
        <ActivityFeed userId={user.id} /> {/* Another slow query */}
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <AnalyticsChart userId={user.id} /> {/* Slowest — arrives last */}
      </Suspense>
    </div>
  );
}

// Each async server component resolves independently
async function StatsPanel({ userId }) {
  const stats = await db.stats.aggregate({ where: { userId } }); // 200ms
  return <div>{/* render stats */}</div>;
}

async function ActivityFeed({ userId }) {
  const feed = await db.activity.findMany({ where: { userId } }); // 500ms
  return <ul>{feed.map(item => <li key={item.id}>{item.text}</li>)}</ul>;
}

// Result: User sees header immediately, then stats pop in,
// then feed, then chart — no all-or-nothing loading`}
      </CodeBlock>

      <InfoBox variant="tip" title="Composition Rule">
        <p>Server Components can render Client Components (as imports). Client Components can render Server Components only if passed as <code>children</code> or other props (not as direct imports). This is because the client can't execute server code, but it CAN render pre-rendered server output passed to it.</p>
      </InfoBox>

      <h2>Error Handling in Server Components</h2>

      <InfoBox variant="warning" title="Server Errors Need Two Layers of Handling">
        <p>
          Server Components can throw errors during data fetching. These need to be caught by
          either an <strong>error boundary</strong> (for graceful UI degradation) or a
          framework-level <strong>error page</strong> (for full-page errors). Without a boundary,
          an error in one Server Component crashes the entire page.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="Error Boundaries Wrapping Server Components (Next.js)" showLineNumbers>
{`// error.tsx — Next.js App Router error boundary
// Must be a Client Component
"use client";

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset, // Retries rendering the segment
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong loading this section</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// not-found.tsx — handles notFound() calls from Server Components
export default function NotFound() {
  return (
    <div>
      <h2>Page not found</h2>
    </div>
  );
}

// In a Server Component — throw framework-specific errors:
import { notFound, redirect } from 'next/navigation';

async function PostPage({ params }: { params: { slug: string } }) {
  const post = await db.posts.findFirst({ where: { slug: params.slug } });

  if (!post) notFound(); // Renders not-found.tsx instead of crashing

  if (post.status === 'draft' && !isAdmin()) {
    redirect('/login'); // Client-side redirect
  }

  return <PostContent post={post} />;
}`}
      </CodeBlock>

      <h2>Caching and Revalidation</h2>

      <p>
        Server Components fetch data on the server, and Next.js (the primary RSC framework) adds
        a caching layer on top of <code>fetch</code>. Understanding this cache is critical —
        without it you either serve stale data or make unnecessary requests.
      </p>

      <CodeBlock language="jsx" title="fetch Cache Options in Server Components" showLineNumbers>
{`// Server Component — fetch has extended options in Next.js

// Default: cached indefinitely (static)
const res = await fetch('https://api.example.com/posts');

// Revalidate on a time interval (ISR — Incremental Static Regeneration)
const res = await fetch('https://api.example.com/posts', {
  next: { revalidate: 60 }, // Serve cached, regenerate every 60 seconds
});

// Never cache — always fresh (dynamic)
const res = await fetch('https://api.example.com/user/me', {
  cache: 'no-store', // Force dynamic — runs on every request
});

// Tag-based revalidation — revalidate when specific data changes
const res = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] }, // Tag this request
});

// In a Server Action — invalidate the tag
import { revalidateTag } from 'next/cache';

export async function publishPost(id: string) {
  await db.posts.update({ where: { id }, data: { status: 'published' } });
  revalidateTag('posts'); // Purge all fetches tagged with 'posts'
}

// Path revalidation — force a specific page to regenerate
import { revalidatePath } from 'next/cache';
revalidatePath('/blog'); // Regenerate all /blog/* pages`}
      </CodeBlock>

      <h2>Parallel vs Sequential Data Fetching</h2>

      <InfoBox variant="warning" title="Avoid Accidental Waterfalls">
        <p>
          In Server Components, <code>await</code> blocks. If you <code>await</code> each fetch
          one after another, you create a waterfall — 3 fetches of 200ms each = 600ms total.
          Use <code>Promise.all</code> when the requests are independent.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="Parallel Fetching — Eliminate Waterfalls" showLineNumbers>
{`// ❌ Sequential — 200ms + 150ms + 300ms = 650ms total
async function SlowDashboard({ userId }) {
  const user = await fetchUser(userId);       // 200ms
  const posts = await fetchPosts(userId);     // 150ms
  const stats = await fetchStats(userId);     // 300ms
  return <Dashboard user={user} posts={posts} stats={stats} />;
}

// ✅ Parallel — max(200ms, 150ms, 300ms) = 300ms total
async function FastDashboard({ userId }) {
  const [user, posts, stats] = await Promise.all([
    fetchUser(userId),   // All three start simultaneously
    fetchPosts(userId),
    fetchStats(userId),
  ]);
  return <Dashboard user={user} posts={posts} stats={stats} />;
}

// ✅ Even better — start fetches early, pass promises down
// This pattern lets Suspense stream each piece as it resolves
async function StreamingDashboard({ userId }) {
  // Kick off all fetches immediately — don't await yet
  const userPromise = fetchUser(userId);
  const postsPromise = fetchPosts(userId);
  const statsPromise = fetchStats(userId);

  // Fast data renders first
  const user = await userPromise;

  return (
    <div>
      <h1>{user.name}</h1>
      {/* Pass promises to child Server Components */}
      <Suspense fallback={<PostsSkeleton />}>
        <PostsList postsPromise={postsPromise} />
      </Suspense>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsPanel statsPromise={statsPromise} />
      </Suspense>
    </div>
  );
}

// Child receives and awaits the promise
async function PostsList({ postsPromise }) {
  const posts = await postsPromise;
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}`}
      </CodeBlock>

      <h2>Advanced Server Action Patterns</h2>

      <CodeBlock language="tsx" title="Server Actions — Validation, Types, and Error Handling" showLineNumbers>
{`"use server";

import { z } from 'zod'; // Schema validation
import { revalidatePath } from 'next/cache';

// Define a typed schema for the form data
const CreatePostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content too short'),
  tags: z.array(z.string()).optional(),
});

// Return type for the action — used by useActionState
type ActionResult =
  | { success: true; postId: string }
  | { success: false; errors: Record<string, string> };

export async function createPost(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // Parse and validate
  const raw = {
    title: formData.get('title'),
    content: formData.get('content'),
    tags: formData.getAll('tags'),
  };

  const parsed = CreatePostSchema.safeParse(raw);

  if (!parsed.success) {
    // Return field-level errors — useActionState will update the state
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string>,
    };
  }

  try {
    const post = await db.posts.create({ data: parsed.data });
    revalidatePath('/blog');
    return { success: true, postId: post.id };
  } catch (err) {
    return { success: false, errors: { _form: 'Database error — please try again' } };
  }
}

// Client Component consuming the action
"use client";
import { useActionState } from 'react';

function CreatePostForm() {
  const [state, action, isPending] = useActionState(createPost, null);

  if (state?.success) {
    return <p>Post created! ID: {state.postId}</p>;
  }

  return (
    <form action={action}>
      <input name="title" />
      {state?.errors?.title && <span>{state.errors.title}</span>}

      <textarea name="content" />
      {state?.errors?.content && <span>{state.errors.content}</span>}

      {state?.errors?._form && <p>{state.errors._form}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
}`}
      </CodeBlock>

      <h2>When NOT to Use Server Components</h2>

      <InfoBox variant="warning" title="Server Components Are Not Always the Right Choice">
        <ul style={{marginBottom: 0}}>
          <li><strong>Real-time data</strong> — Server Components fetch once per request. Use WebSockets or polling in Client Components for live data.</li>
          <li><strong>User-specific interactive state</strong> — shopping cart, form drafts, UI preferences belong in Client Components or client-side stores.</li>
          <li><strong>Heavy client-side computation</strong> — animations, canvas, WebGL stay on the client.</li>
          <li><strong>Libraries that use browser APIs</strong> — any third-party library calling <code>window</code>, <code>document</code>, or <code>localStorage</code> must be in Client Components.</li>
          <li><strong>Non-Next.js projects</strong> — Server Components require a framework that implements the RSC protocol. Vite + React alone does not support them.</li>
        </ul>
      </InfoBox>

      <FlowChart
        title="Server vs Client — Decision Tree"
        chart={"graph TD\n  A[New Component] --> B{Needs interactivity?}\n  B -->|Yes - onClick/useState/effects| C[Client Component]\n  B -->|No| D{Fetches data?}\n  D -->|Yes - direct DB/API| E[Server Component]\n  D -->|No| F{Uses browser APIs?}\n  F -->|Yes| C\n  F -->|No| G[Either works - prefer Server]\n  style C fill:#ef4444,color:#fff\n  style E fill:#10b981,color:#fff\n  style G fill:#3b82f6,color:#fff"}
      />

      <h2>The RSC Boundary in Practice</h2>

      <CodeBlock language="jsx" title="Typical Real-World Component Tree" showLineNumbers>
{`// app/products/[id]/page.tsx — Server Component (default)
async function ProductPage({ params }) {
  // Direct DB access — no API route needed
  const product = await db.products.findUnique({ where: { id: params.id } });

  return (
    <main>
      {/* Server-rendered — just HTML, zero JS */}
      <ProductHeader product={product} />
      <ProductDescription content={product.description} />

      {/* Client Component — needs state for cart interaction */}
      <AddToCartButton
        productId={product.id}
        price={product.price}
      />

      {/* Server Component renders reviews — but passes interactive piece as child */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsList productId={product.id}>
          {/* Client Component for rating interaction — passed as children (prop) */}
          <RatingForm productId={product.id} />
        </ReviewsList>
      </Suspense>
    </main>
  );
}

// components/ReviewsList.tsx — Server Component
async function ReviewsList({ productId, children }) {
  const reviews = await db.reviews.findMany({ where: { productId } });
  return (
    <section>
      <h2>Reviews ({reviews.length})</h2>
      {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
      {children} {/* Renders the RatingForm Client Component */}
    </section>
  );
}
// ReviewsList is a Server Component but it renders a Client Component child —
// this works because children are passed as props (pre-rendered RSC output),
// not imported directly by the Server Component.`}
      </CodeBlock>
    </LessonLayout>
  );
}
