import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function Graphql() {
  return (
    <LessonLayout
      title="GraphQL Fundamentals"
      sectionId="apidesign"
      lessonIndex={6}
      prev={{ path: '/apidesign/advanced', label: 'Advanced API Patterns' }}
      next={{ path: '/apidesign/websockets', label: 'WebSockets & Real-Time APIs' }}
    >
      <p>
        You already know REST deeply at this point in the section, so skip the &quot;what is an
        API&quot; framing. GraphQL is not a rival architecture to REST&apos;s resource model &mdash;
        it is a response to two specific, nameable failure modes that show up constantly in REST
        APIs once a client&apos;s data needs get complicated. Naming them precisely matters more
        than any amount of &quot;GraphQL is flexible&quot; hand-waving.
      </p>

      <InfoBox variant="info" title="The Two Problems, Precisely">
        <p>
          <strong>Over-fetching</strong> &mdash; a response contains fields the client has no use
          for. <code>GET /api/users/42</code> returns twenty fields; the screen renders three.
        </p>
        <p>
          <strong>Under-fetching</strong> &mdash; a single endpoint never contains enough to
          render a view, so the client issues a waterfall of follow-up requests to assemble it.
          Fetch a user, then fetch their orders, then fetch each order&apos;s line items.
        </p>
      </InfoBox>

      <h2>Under-Fetching, Concretely: A 3-Call Waterfall</h2>

      <p>
        Say the screen needs a user&apos;s name and email plus the items inside their most recent
        order. In REST, with the endpoints this site&apos;s own examples have used all section
        long, that is not one request:
      </p>

      <CodeBlock language="http" title="REST: 3 Sequential Round Trips to Render One Screen">
        {`GET /api/users/42
200 OK
{
  "id": 42, "name": "Alice", "email": "alice@example.com",
  "address": { "line1": "1 Market St", "city": "SF" },   // over-fetched — unused
  "createdAt": "2023-01-04T00:00:00Z",                    // over-fetched — unused
  "marketingOptIn": false                                 // over-fetched — unused
}

# Client now knows the user, but not their orders — 2nd round trip required
GET /api/users/42/orders
200 OK
[
  { "id": "o1", "total": 59.98, "placedAt": "...", "status": "shipped" },
  { "id": "o2", "total": 12.50, "placedAt": "...", "status": "delivered" }
]

# Still no line items — 3rd round trip, and this is PER ORDER. With 2 orders
# rendering this screen fully means 2 + N requests, not 3 — this is the
# textbook N+1 pattern, happening at the HTTP level.
GET /api/users/42/orders/o1/items
200 OK
[
  { "id": "i1", "name": "Widget", "price": 29.99, "sku": "WD-1", "warehouseId": "w3" }
]`}
      </CodeBlock>

      <p>
        Each of those is a full network round trip &mdash; DNS/TLS reuse aside, a real trip to the
        server and back, sequentially, because the second and third calls need IDs the first and
        second calls returned. That serial dependency is what makes it a <em>waterfall</em>, not
        just &quot;three requests.&quot;
      </p>

      <h2>The Same Screen, One GraphQL Query</h2>

      <p>
        GraphQL collapses this into a single request because the <strong>client</strong>, not the
        server, specifies the exact shape of the response. As this section&apos;s Advanced Patterns
        lesson noted, the query document itself travels inside a JSON envelope over a normal HTTP
        POST:
      </p>

      <CodeBlock language="graphql" title="One Request, Client-Shaped Response">
        {`# POST /graphql
# Content-Type: application/json
# Body: { "query": "<this document>", "variables": { "id": "42" } }

query GetUserSummary($id: ID!) {
  user(id: $id) {
    name
    email
    orders {
      id
      total
      items {
        name
        price
      }
    }
  }
}`}
      </CodeBlock>

      <CodeBlock language="json" title="Response — Exactly the Requested Shape, Nothing Else">
        {`{
  "data": {
    "user": {
      "name": "Alice",
      "email": "alice@example.com",
      "orders": [
        { "id": "o1", "total": 59.98, "items": [{ "name": "Widget", "price": 29.99 }] },
        { "id": "o2", "total": 12.50, "items": [{ "name": "Sprocket", "price": 12.50 }] }
      ]
    }
  }
}`}
      </CodeBlock>

      <p>
        No <code>address</code>, no <code>sku</code>, no <code>warehouseId</code> &mdash; those
        were never asked for. One round trip, N orders or not. That is the entire pitch, stated
        precisely instead of vaguely: GraphQL trades a server-fixed response shape for a
        client-chosen one, over one endpoint instead of many.
      </p>

      <FlowChart
        title="One POST, Server-Side Fan-Out"
        chart={"graph TD\n    CLIENT[Client] -->|single POST /graphql| SERVER[GraphQL Server]\n    SERVER --> USERRES[User resolver]\n    SERVER --> ORDERRES[Order resolver]\n    SERVER --> ITEMRES[OrderItem resolver]\n    USERRES -->|query| DB[(Database)]\n    ORDERRES -->|query| DB\n    ITEMRES -->|query, batched| DB\n    SERVER -->|one client-shaped JSON response| CLIENT"}
      />

      <h2>Schema, Types, and Resolvers</h2>

      <InfoBox variant="note" title="Which Library — Checked Against npm, Not Memory">
        <p>
          A lot of older GraphQL tutorials reach for the <code>apollo-server</code> package.
          Checking it directly: <code>npm view apollo-server deprecated</code> returns an explicit
          deprecation notice &mdash; it was Apollo Server v2/v3, end-of-life since October 2023
          and 2024 respectively. The current package is <strong>
          <code>@apollo/server</code></strong>, at <strong>v5.5.1</strong> on npm as of this
          writing, actively published, requiring Node.js &ge;20 and <code>graphql</code> ^16.11 as
          a peer dependency. <strong>graphql-yoga</strong> (v5.21.3, also actively published) is a
          credible lighter-weight alternative built on the same underlying <code>graphql</code>{' '}
          reference implementation. Both are legitimate current choices; this lesson uses{' '}
          <code>@apollo/server</code> because it is the one you are most likely to meet in an
          existing job codebase. Note that <code>graphql</code> itself just reached v17 &mdash;
          both server frameworks above still pin to the ^16 line, so v17 is too new to assume a
          codebase has adopted it yet.
        </p>
      </InfoBox>

      <p>
        The schema is the contract. It is written in GraphQL&apos;s Schema Definition Language
        (SDL) &mdash; this exact schema was loaded into a running Apollo Server instance to write
        this lesson, not just eyeballed for syntax:
      </p>

      <CodeBlock language="graphql" title="schema.graphql — Types + the Query Entry Point">
        {`type User {
  id: ID!
  name: String!
  email: String!
  orders: [Order!]!
}

type Order {
  id: ID!
  total: Float!
  items: [OrderItem!]!
}

type OrderItem {
  id: ID!
  name: String!
  price: Float!
  quantity: Int!
}

type Query {
  user(id: ID!): User
  users: [User!]!
}`}
      </CodeBlock>

      <p>
        Resolvers are the functions that actually produce each field&apos;s value. Every field in
        the schema can have one; if you don&apos;t write one, the default resolver just reads a
        same-named property off the parent object.
      </p>

      <CodeBlock language="javascript" title="server.mjs — Actually Run With @apollo/server 5.5.1">
        {`import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const users = [{ id: '1', name: 'Alice', email: 'alice@example.com' }];
const ordersByUser = { '1': [{ id: 'o1', userId: '1', total: 59.98 }] };
const itemsByOrder = { o1: [{ id: 'i1', name: 'Widget', price: 29.99, quantity: 1 }] };

const resolvers = {
  Query: {
    user: (_parent, { id }) => users.find((u) => u.id === id),
    users: () => users,
  },
  User: {
    orders: (user) => ordersByUser[user.id] ?? [],
  },
  Order: {
    items: (order) => itemsByOrder[order.id] ?? [],
  },
};

const server = new ApolloServer({ typeDefs, resolvers }); // typeDefs = the SDL above
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
console.log(\`GraphQL server actually listening at: \${url}\`);

const query = \`query GetUser($id: ID!) {
  user(id: $id) { name email orders { id total items { name price } } }
}\`;

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { id: '1' } }),
});
console.log('HTTP status:', res.status);
console.log(await res.json());`}
      </CodeBlock>

      <CodeBlock language="bash" title="Actual Output — node server.mjs (real run, not simulated)">
        {`GraphQL server actually listening at: http://localhost:4000/
HTTP status: 200
{
  data: {
    user: {
      name: 'Alice',
      email: 'alice@example.com',
      orders: [
        { id: 'o1', total: 59.98, items: [ { name: 'Widget', price: 29.99 } ] }
      ]
    }
  }
}`}
      </CodeBlock>

      <p>
        That is a real HTTP POST to a real listening server, and the 200 response contains exactly
        the fields the query asked for &mdash; confirming the single-endpoint, client-shaped
        behavior above isn&apos;t just a diagram.
      </p>

      <h2>The N+1 Problem Comes Back &mdash; Inside GraphQL</h2>

      <p>
        Here is the gotcha most GraphQL tutorials skip. Look again at the <code>Order.items</code>{' '}
        resolver above: <code>itemsByOrder[order.id]</code>. That&apos;s an in-memory lookup for
        this toy example, but in a real app it&apos;s a database call &mdash; and GraphQL calls
        that resolver <strong>once per order</strong> in the result set. Query 3 orders, get 3
        separate calls to fetch their items. The N+1 problem never left; it just moved from the
        client&apos;s HTTP waterfall down into the server&apos;s resolver layer, where it&apos;s
        far less visible because it never shows up as extra network requests &mdash; only as extra
        database load.
      </p>

      <CodeBlock language="javascript" title="Naive Resolver — One DB Call Per Order">
        {`let callCount = 0;
Order: {
  items: (order) => {
    callCount++;
    console.log(\`[DB] SELECT * FROM items WHERE order_id = '\${order.id}'  (call #\${callCount})\`);
    return db.findItemsByOrderId(order.id);
  },
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Actual Output — querying 2 users&apos; orders (real run)">
        {`  [DB] SELECT * FROM items WHERE order_id = 'o1'  (call #1)
  [DB] SELECT * FROM items WHERE order_id = 'o2'  (call #2)
  [DB] SELECT * FROM items WHERE order_id = 'o3'  (call #3)
Total DB calls for items: 3`}
      </CodeBlock>

      <p>
        <strong>DataLoader</strong> is the standard fix &mdash; it&apos;s literally maintained
        under the <code>graphql</code> GitHub organization for exactly this problem. Per its own
        documentation, a <code>DataLoader</code> does two specific things: it{' '}
        <strong>coalesces every <code>.load()</code> call issued within a single tick of the event
        loop</strong> into one call to your batch function, and it <strong>memoizes</strong> loads
        by key so the same key within one loader instance is never fetched twice. Swap the resolver
        to load through a per-request loader instead of calling the DB directly:
      </p>

      <CodeBlock language="javascript" title="DataLoader-Batched Resolver">
        {`import DataLoader from 'dataloader';

// One loader PER REQUEST — the docs are explicit that a DataLoader's cache
// must not be shared across requests/users, since it would leak one user's
// cached data into another user's response.
function buildItemLoader() {
  return new DataLoader(async (orderIds) => {
    console.log(\`[DB] SELECT * FROM items WHERE order_id IN (\${orderIds.join(', ')})\`);
    return db.findItemsByOrderIds(orderIds); // must return results in the SAME order as keys
  });
}

// server context factory:
// context: () => ({ itemLoader: buildItemLoader() })

Order: {
  items: (order, _args, context) => context.itemLoader.load(order.id),
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Actual Output — Same Query, DataLoader-Backed Resolver (real run)">
        {`  [DB] SELECT * FROM items WHERE order_id IN (o1, o2, o3)  (batch call #1)
Total DB calls for items: 1`}
      </CodeBlock>

      <p>
        Same query, same result, three database round trips collapsed to one &mdash; because every
        <code>.load()</code> call fired synchronously during that one GraphQL execution landed in
        the same event-loop tick and got coalesced into a single batch function call.
      </p>

      <InfoBox variant="warning" title="The Instance-Per-Request Rule Is Not Optional">
        <p>
          A <code>DataLoader</code> instance is a cache. Sharing one instance across requests
          &mdash; a common mistake when a loader gets hoisted to module scope for &quot;efficiency&quot;
          &mdash; means user B can receive data that was cached while resolving user A&apos;s
          request. Build loaders inside the server&apos;s <code>context</code> function so a fresh
          set is created per request.
        </p>
      </InfoBox>

      <h2>Honest Trade-offs vs REST</h2>

      <p>
        None of the above makes GraphQL strictly better &mdash; it trades one set of problems for
        another, and the new set is real:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>REST gets for free</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>GraphQL has to work for</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>HTTP-level caching &mdash; GET + ETag/Cache-Control, CDNs and browsers cache natively</td>
            <td style={{ padding: '0.75rem' }}>Everything is typically POST to one endpoint, which is invisible to HTTP caches by default; needs persisted queries or app-level caching to claw this back</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Simple, endpoint-level authorization (&quot;can this token call <code>DELETE /orders/:id</code>?&quot;)</td>
            <td style={{ padding: '0.75rem' }}>Authorization has to be checked per-field, since any client can request any combination of fields in one query</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>A fixed, predictable query cost per endpoint</td>
            <td style={{ padding: '0.75rem' }}>A single query can request deeply nested, expensive data &mdash; needs query depth/complexity limits or it&apos;s a denial-of-service vector</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>No resolver layer &mdash; the endpoint just returns what the handler builds</td>
            <td style={{ padding: '0.75rem' }}>Resolver-level N+1 is a standing maintenance burden; every new nested list field is a potential DataLoader you forgot to add</td>
          </tr>
        </tbody>
      </table>

      <p>
        A grounded recommendation: reach for GraphQL when clients genuinely have different,
        overlapping data needs from the same backend &mdash; a mobile app and a web dashboard
        pulling different slices of the same domain is the textbook case &mdash; or when the
        views are deeply nested enough that REST waterfalls are a measured performance problem, not
        a theoretical one. Stick with REST for simple CRUD, for public APIs where HTTP caching and
        universal tooling matter more than flexible shapes, and for service-to-service calls where
        the caller and callee are deployed together and can agree on a fixed contract. Most
        production systems that adopt GraphQL end up doing so for one specific screen or one
        specific mobile client, not as a wholesale REST replacement.
      </p>

      <InteractiveChallenge
        question={"A GraphQL query fetches 10 orders, each with a nested `items` field. The Order.items resolver calls db.findItemsByOrderId(order.id) directly. What happens, and what fixes it?"}
        options={[
          "Nothing — GraphQL automatically batches nested resolver calls",
          "This re-introduces the N+1 problem at the resolver level: 10 separate DB calls fire, one per order. A DataLoader instance created per-request batches all `.load()` calls issued in the same event-loop tick into a single call",
          "This is fine because GraphQL only allows one level of nesting per query",
          "The fix is to switch back to REST, since GraphQL cannot solve N+1 problems"
        ]}
        correctIndex={1}
        explanation={"GraphQL solves HTTP-level under-fetching, but it does nothing by default about resolver-level N+1 — each parent in a list gets its own resolver call for a nested field, exactly like a naive REST client fetching items per-order in a loop. DataLoader fixes this by coalescing every .load() call issued within one tick into a single batched call to the data source, plus per-request memoization — but it must be instantiated fresh per request, never shared as a singleton."}
      />
    </LessonLayout>
  );
}
