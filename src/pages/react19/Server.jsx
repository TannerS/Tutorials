import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
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

      <InteractiveChallenge
        question="A Server Component imports and renders a Client Component. What gets sent to the browser?"
        options={[
          "Both components' JavaScript code",
          "Only the Client Component's JS; the Server Component's rendered HTML is inlined",
          "Neither — Server Components handle all rendering",
          "The Server Component's JS with a placeholder for the Client Component"
        ]}
        correctIndex={1}
        explanation="Server Components execute on the server and produce serialized output (RSC payload / HTML). Only Client Components ship their JavaScript to the browser for hydration and interactivity. The Server Component's output is already rendered — it's just HTML/data by the time it reaches the client."
        language="jsx"
      />
    </LessonLayout>
  );
}
