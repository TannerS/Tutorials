import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactServer() {
  return (
    <LessonLayout
      title="Server Components"
      sectionId="react19"
      lessonIndex={8}
      prev={{ path: "/react19/react19", label: "React 19 New Features" }}
      next={{ path: "/react19/patterns", label: "React Patterns" }}
    >
      <p>React Server Components (RSC) run on the server, enabling direct database access and reduced client bundle sizes. They represent a fundamental shift in how React apps are architected.</p>

      <FlowChart
        title="Server vs Client Components"
        chart={"graph TD\n  A[React App] --> B[Server Components]\n  A --> C[Client Components]\n  B --> D[Run on server only]\n  B --> E[Zero client JS]\n  B --> F[Direct DB access]\n  C --> G[Run in browser]\n  C --> H[useState hooks]\n  C --> I[Event handlers]"}
      />

      <h2>Server Components</h2>
      <CodeBlock language="jsx" title="Server Component (Next.js App Router)">
{`// app/users/page.tsx — Server Component by default
// No "use client" directive = server component

import { db } from '@/lib/database';

// Direct database access — no API layer needed!
async function UsersPage() {
    const users = await db.query('SELECT * FROM users ORDER BY name');

    return (
        <main>
            <h1>Users ({users.length})</h1>
            <ul>
                {users.map(user => (
                    <li key={user.id}>
                        {user.name}
                        {/* Nest a client component for interactivity */}
                        <DeleteButton userId={user.id} />
                    </li>
                ))}
            </ul>
        </main>
    );
}

export default UsersPage;`}
      </CodeBlock>

      <h2>Client Components</h2>
      <CodeBlock language="jsx" title="Client Component with use client">
{`'use client'; // Opt into client-side rendering

import { useState } from 'react';

// Client components: useState, useEffect, event handlers, browser APIs
function DeleteButton({ userId }) {
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);
        await fetch("/api/users/" + userId, { method: "DELETE" });
        router.refresh(); // revalidate server component data
    }

    return (
        <button onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
        </button>
    );
}`}
      </CodeBlock>

      <h2>Server Actions</h2>
      <CodeBlock language="jsx" title="Server Actions for Form Mutations">
{`// Server action — runs on server when called from client
'use server';

export async function createUser(formData) {
    const name  = formData.get('name');
    const email = formData.get('email');

    // Validate
    if (!name || !email) throw new Error('Name and email required');

    // Direct DB write from server action
    await db.insert('users', { name, email, createdAt: new Date() });

    // Revalidate cached data
    revalidatePath('/users');
}

// In a Client Component:
function CreateUserForm() {
    return (
        <form action={createUser}> {/* server action as form action */}
            <input name="name" required />
            <input name="email" type="email" required />
            <button type="submit">Create User</button>
        </form>
    );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="RSC vs SSR">
        <p>Server Components and Server-Side Rendering (SSR) are different. SSR renders a full page to HTML on the server and hydrates on the client. RSC selectively renders components on the server with zero hydration cost. RSC can be nested inside SSR pages.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Can a Server Component use useState?"
        options={["Yes, all hooks work in Server Components", "No — useState and other stateful hooks only work in Client Components", "Yes, but only in useEffect", "Only if marked with use server directive"]}
        correctIndex={1}
        explanation="Server Components run only on the server and have no concept of state, effects, or browser APIs. They cannot use useState, useEffect, useContext, or event handlers. Add 'use client' at the top of a file to make it a Client Component with access to all hooks."
      />
    </LessonLayout>
  );
}
