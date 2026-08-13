import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideServerComponents() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React 19 · Field Reference"
      title="Server Components & Actions"
      tagline="Server vs Client Components, the 'use client'/'use server' boundary, Server Actions, and streaming — what's React 19 core vs Next.js on top of it."
      meta={['React 19 · RSC', '12 concepts']}
      footerLabel="Personal study reference — React 19"
      pageLabel="React 19 Field Guide · Server Components"
      prev={{ path: '/react-field-guide/gotchas', label: 'Gotchas & Anti-Patterns' }}
      next={null}
    >
      <PosterCard
        glyph="RSC"
        title="Server Components — The Mental Model"
        language="jsx"
        code={`// Runs ONLY on the server — zero JS shipped for this component
async function ProductPage({ params }) {
  // Direct DB access — no API route, no useEffect, no loading state
  const product = await db.products.findUnique({ where: { slug: params.slug } });

  return (
    <div>
      <h1>{product.name}</h1>
      <AddToCartButton productId={product.id} /> {/* Client Component */}
    </div>
  );
}`}
        caption="A Server Component can be async and await data directly — no fetch-in-useEffect, no client-side loading state. It renders to serialized output that streams to the browser as HTML, not JavaScript."
      />

      <PosterCard
        glyph="Def"
        title="Default Is Server, Opt Into Client"
        badge="Next.js"
        language="text"
        code={`In frameworks implementing the RSC protocol (Next.js App
Router being the primary one): EVERY component is a Server
Component by default. You opt INTO client behavior with
"use client" at the top of a file.

That directive is a BOUNDARY — everything below it in the
import tree (the file + its imports) becomes client code.

Requires a framework that implements RSC. Vite + React alone
does NOT support Server Components.`}
        caption="This default-server behavior and the whole RSC protocol is framework-provided, not a bare React 19 API — React 19 ships the primitives (the directives, streaming, use()), but you need Next.js or another RSC-capable framework to actually render on the server."
      />

      <PosterCard
        glyph="UC"
        title={<>"use client"<span className="dim"> — the escape hatch</span></>}
        language="jsx"
        code={`"use client"; // This file and its imports are client-side code

import { useState, useTransition } from 'react';
import { addToCart } from '@/actions/cart'; // Server Action

export function AddToCartButton({ productId }) {
  const [isPending, startTransition] = useTransition();
  const handleClick = () => startTransition(async () => {
    await addToCart(productId); // Calls the server action
  });
  return <button onClick={handleClick} disabled={isPending}>Add to Cart</button>;
}`}
        caption="Reach for 'use client' when a component needs: useState/useEffect/any stateful hook, event handlers (onClick/onChange), browser-only APIs (window/document/localStorage), or a third-party lib that uses any of those."
      />

      <PosterCard
        glyph="Cmp"
        title="Composition Rule — Who Can Render Whom"
        language="text"
        code={`Server Component → CAN import & render Client Components
                    directly, as normal children.

Client Component → CANNOT import a Server Component directly
                    (the client can't execute server code).

Client Component → CAN render a Server Component if it's
                    passed in as children/props — i.e. the
                    parent already rendered it to output first.`}
        caption="The client can't run server code, but it CAN render pre-rendered server output that's handed to it. This is why the children-as-prop pattern below exists — it's the one legal way a Client Component hosts server-rendered content."
      />

      <PosterCard
        glyph="Ch"
        title="Server Component Renders a Client Child, Which Hosts a Server Child"
        language="jsx"
        code={`// Server Component
async function ReviewsList({ productId, children }) {
  const reviews = await db.reviews.findMany({ where: { productId } });
  return (
    <section>
      {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
      {children} {/* renders whatever was passed in — could be a Client Component */}
    </section>
  );
}

// Usage — RatingForm (Client) passed as children, not imported by ReviewsList
<ReviewsList productId={id}><RatingForm productId={id} /></ReviewsList>`}
        caption="ReviewsList is a Server Component but never imports RatingForm — it just renders whatever children it was handed. This lets a server-rendered list host a client-interactive form without violating the import direction rule."
      />

      <PosterCard
        glyph="US"
        title={<>"use server"<span className="dim"> — Server Actions</span></>}
        badge="Next.js"
        language="jsx"
        code={`"use server"; // Runs on server, callable directly from the client

export async function createPost(formData) {
  const title = formData.get('title');
  if (!title || title.length < 3) return { error: 'Title too short' };

  const post = await db.posts.create({ data: { title } });
  revalidatePath('/posts');   // Next.js cache invalidation
  redirect(\`/posts/\${post.slug}\`);
}

// Usage: <form action={createPost}> ... </form>
// Or imperatively: const result = await createPost(formData);`}
        caption="A Server Action is a mutation that runs on the server but is callable directly from a form's action prop or imperatively — no hand-written API route or fetch call. Always validate on the server; never trust the client."
      />

      <PosterCard
        glyph="AS"
        title={<>useActionState<span className="dim"> + Server Action</span></>}
        code={`"use server";
type ActionResult = { success: true; postId: string }
  | { success: false; errors: Record<string, string> };

export async function createPost(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = CreatePostSchema.safeParse({ title: formData.get('title') });
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
  const post = await db.posts.create({ data: parsed.data });
  return { success: true, postId: post.id };
}
// Client: const [state, action, isPending] = useActionState(createPost, null);`}
        caption="useActionState wires a Server Action straight to a form — the action's signature (prevState, formData) matches exactly what useActionState expects, giving pending state and typed validation errors with no extra plumbing."
      />

      <PosterCard
        glyph="St"
        title="Streaming With Suspense Boundaries"
        code={`async function DashboardPage() {
  const user = await getUser(); // fast — renders immediately

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsPanel userId={user.id} />   {/* slow query streams in when ready */}
      </Suspense>
      <Suspense fallback={<FeedSkeleton />}>
        <ActivityFeed userId={user.id} /> {/* independent — streams separately */}
      </Suspense>
    </div>
  );
}`}
        caption="Each Suspense boundary streams independently — the header renders immediately, then each panel pops in as its own async Server Component resolves. No all-or-nothing loading screen."
      />

      <PosterCard
        glyph="Pa"
        title="Parallel vs Sequential Fetching"
        code={`// ❌ Sequential — 200ms + 150ms + 300ms = 650ms total
const user = await fetchUser(userId);
const posts = await fetchPosts(userId);
const stats = await fetchStats(userId);

// ✅ Parallel — max(200,150,300) = 300ms total
const [user, posts, stats] = await Promise.all([
  fetchUser(userId), fetchPosts(userId), fetchStats(userId),
]);`}
        caption="In a Server Component, await blocks — awaiting fetches one after another creates a waterfall. Use Promise.all whenever the requests don't depend on each other's results."
      />

      <PosterCard
        glyph="use"
        title={<>use<span className="dim">() — resolve promises &amp; read context conditionally</span></>}
        code={`import { use, Suspense } from 'react';

function UserProfile({ userPromise }) {
  const user = use(userPromise); // suspends until resolved
  return <h1>{user.name}</h1>;
}

function ProfilePage({ userId }) {
  const userPromise = fetchUser(userId); // kick off immediately, not in an effect
  return <Suspense fallback={<Skeleton />}><UserProfile userPromise={userPromise} /></Suspense>;
}

// use() with Context — legal INSIDE a conditional, unlike useContext
if (showAdmin) { const admin = use(AdminContext); }`}
        caption="use() is a React 19 core API (not framework-specific) that can be called conditionally — it reads a Promise (suspending the component until it resolves) or a Context. It replaces many useState+useEffect data-fetching patterns."
      />

      <PosterCard
        glyph="Ca"
        title="fetch Caching & Revalidation"
        badge="Next.js"
        language="jsx"
        code={`// Default: cached indefinitely (static)
await fetch(url);

// Revalidate on an interval (ISR)
await fetch(url, { next: { revalidate: 60 } });

// Never cache — always fresh (dynamic, runs every request)
await fetch(url, { cache: 'no-store' });

// Tag-based — invalidate from a Server Action
await fetch(url, { next: { tags: ['posts'] } });
import { revalidateTag } from 'next/cache';
revalidateTag('posts'); // purge every fetch tagged 'posts'`}
        caption="This extended fetch cache is Next.js's layer on top of the platform fetch, not React itself. Without understanding it you either serve stale data or make unnecessary requests on every render."
      />

      <PosterCard
        glyph="Er"
        title="Errors Need Two Layers of Handling"
        badge="Next.js"
        language="jsx"
        code={`// error.tsx — must be a Client Component
"use client";
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <button onClick={reset}>Try again</button>;
}

// In a Server Component:
import { notFound, redirect } from 'next/navigation';
if (!post) notFound();        // renders not-found.tsx instead of crashing
if (isDraft) redirect('/login');`}
        caption="Without an error boundary, an error thrown in one Server Component's data fetch crashes the entire page — there's no try/catch around it in JSX like there would be in a client event handler."
      />

      <PosterQuickRef
        title="When to use Server vs Client Components"
        rows={[
          { need: 'Fetching data (DB, API, filesystem)', answer: 'Server Component — direct access, zero client JS' },
          { need: 'useState / useEffect / any stateful hook', answer: 'Client Component — needs "use client"' },
          { need: 'onClick, onChange, any event handler', answer: 'Client Component' },
          { need: 'window, document, localStorage', answer: 'Client Component' },
          { need: 'Real-time data (WebSocket, polling)', answer: 'Client Component — Server Components fetch once per request' },
          { need: 'Shopping cart / form drafts / UI prefs', answer: 'Client Component — user-specific interactive state' },
          { need: 'Rendering 1000s of static rows', answer: 'Server Component — ships zero JS for the list' },
          { need: 'Mutating data from a form', answer: 'Server Action ("use server") + <form action={fn}>' },
          { need: 'Plain Vite + React project (no framework)', answer: 'Not available — RSC needs a framework that implements it' },
        ]}
      />
    </PosterLayout>
  );
}
