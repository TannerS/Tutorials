import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function FeatureFolder() {
  return (
    <LessonLayout
      title="Feature-Based Architecture"
      sectionId="react19"
      lessonIndex={17}
      prev={{ path: '/react19/module-federation', label: 'Module Federation & MFEs' }}
      next={null}
    >
      <h2>The Two Ways to Organize a Frontend</h2>
      <p>
        Almost every React project settles into one of two folder layouts. The difference
        looks trivial in a small app and turns into the primary maintainability lever in a
        large one.
      </p>

      <FlowChart
        title="Layer-based vs feature-based"
        chart={"graph TD\nA[src/] --> B[Layer: components/]\nA --> C[Layer: hooks/]\nA --> D[Layer: services/]\nA --> E[Layer: types/]\nA --> F[Layer: pages/]\nG[src/features/] --> H[orders/]\nG --> I[customers/]\nG --> J[invoices/]\nH --> H1[components/]\nH --> H2[hooks/]\nH --> H3[services/]\nH --> H4[types.ts]"}
      />

      <h2>Layer-Based (default in most tutorials)</h2>
      <CodeBlock language="text" title="Everything grouped by kind">
{`src/
├─ components/
│  ├─ OrderList.tsx
│  ├─ OrderDetail.tsx
│  ├─ CustomerList.tsx
│  ├─ CustomerDetail.tsx
│  └─ InvoiceList.tsx
├─ hooks/
│  ├─ useOrders.ts
│  ├─ useCustomers.ts
│  └─ useInvoices.ts
├─ services/
│  ├─ orders.ts
│  ├─ customers.ts
│  └─ invoices.ts
├─ types/
│  ├─ Order.ts
│  ├─ Customer.ts
│  └─ Invoice.ts
└─ pages/
   ├─ OrdersPage.tsx
   └─ CustomersPage.tsx`}
      </CodeBlock>
      <p>Pros:</p>
      <ul>
        <li>Every file of a kind is in one place. Easy to jump to.</li>
        <li>Matches how React itself is documented (components / hooks).</li>
      </ul>
      <p>Cons at scale:</p>
      <ul>
        <li>Adding a feature means editing five folders. Reviewers see fragments.</li>
        <li>Deleting a feature means hunting orphans across five folders. You always
            miss some.</li>
        <li>Coupling is invisible — nothing prevents <code>components/OrderList.tsx</code>
            from importing <code>types/Customer.ts</code>. Everything can import
            everything.</li>
      </ul>

      <h2>Feature-Based</h2>
      <CodeBlock language="text" title="Everything a feature needs, colocated">
{`src/
├─ app/                          # shell — routes, providers, layout
│  ├─ App.tsx
│  ├─ providers/
│  └─ router.tsx
├─ features/
│  ├─ orders/                    # a self-contained slice
│  │  ├─ components/
│  │  │  ├─ OrderList.tsx
│  │  │  └─ OrderDetail.tsx
│  │  ├─ hooks/
│  │  │  └─ useOrders.ts
│  │  ├─ api/                    # or "services/"
│  │  │  ├─ ordersClient.ts
│  │  │  └─ ordersAdapter.ts
│  │  ├─ types.ts
│  │  ├─ routes.tsx              # this feature's route definitions
│  │  └─ index.ts                # the feature's PUBLIC surface
│  ├─ customers/
│  └─ invoices/
├─ shared/                       # cross-feature reusable stuff
│  ├─ ui/                        # generic components (Button, Modal)
│  ├─ hooks/                     # generic hooks (useDebounce)
│  ├─ api/                       # fetch wrapper, apiFetch, ApiError
│  └─ types/                     # cross-feature types (Money, UserId)
└─ index.tsx`}
      </CodeBlock>

      <h2>The Rule That Makes It Work</h2>
      <InfoBox variant="tip" title="Features import from features/x — but only through x's index.ts">
        <p>
          Every feature is a package. It exposes a small, deliberate public API through
          its <code>index.ts</code>. Inside the feature, files are free to import each
          other. Outside the feature, imports must go through the index.
        </p>
      </InfoBox>
      <CodeBlock language="ts" title="A feature's public surface">
{`// features/orders/index.ts
export { OrdersRoutes } from './routes';
export { useOrder, useOrderList } from './hooks';
export type { Order, OrderStatus } from './types';
// Nothing else is exported. Internal components, adapters, API clients
// are all private to the feature.`}
      </CodeBlock>
      <CodeBlock language="ts" title="What the shell imports">
{`// app/router.tsx
import { OrdersRoutes } from '@/features/orders';
import { CustomersRoutes } from '@/features/customers';

<Routes>
  <Route path="/orders/*"    element={<OrdersRoutes />} />
  <Route path="/customers/*" element={<CustomersRoutes />} />
</Routes>`}
      </CodeBlock>

      <h2>Enforcing the Boundary</h2>
      <p>
        The convention is only as good as the tooling that keeps people honest. Two
        approaches:
      </p>
      <CodeBlock language="ts" title="ESLint no-restricted-imports">
{`// eslint.config.js
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        // Prevent deep-import into another feature.
        { group: ['**/features/*/**'], message: 'Import from features/<name> only.' },
      ],
    }],
  },
}

// This blocks:  import { OrdersList } from '@/features/orders/components/OrdersList';
// This allows:  import { OrdersRoutes } from '@/features/orders';`}
      </CodeBlock>
      <p>
        In an Nx or Turborepo monorepo, each feature can be a real workspace package,
        and the build tool enforces boundaries via tags. That's stronger than lint rules
        and scales better.
      </p>

      <h2>What Goes in shared/</h2>
      <p>
        <code>shared/</code> is the place for things that are <em>genuinely</em> generic —
        useful in three or more features and never business-specific.
      </p>
      <CodeBlock language="text" title="Rule of thumb">
{`Belongs in shared:
  - Button, Modal, Table, Skeleton, Spinner
  - useDebounce, useMediaQuery, useLocalStorage
  - The apiFetch wrapper, ApiError type, error normalizer
  - Cross-cutting types: Money, UserId, PaginatedResponse<T>

Does NOT belong in shared (this is where teams go wrong):
  - OrderRow — this belongs in features/orders even if a Table renders it
  - useOrders — same
  - CustomerAvatar — feature-owned even if the shell also renders it
  - Anything with a business domain concept in its name`}
      </CodeBlock>

      <h2>Cross-Feature Communication</h2>
      <p>
        Real apps have features that need to know things about each other — an invoice
        shows customer info; a dashboard mentions recent orders. Three options in order
        of preference:
      </p>
      <ol>
        <li>
          <strong>Compose at the shell.</strong> The shell page renders both features'
          components side by side. Each feature owns its own data fetch. No cross-feature
          imports needed.
        </li>
        <li>
          <strong>Public hook exports.</strong> <code>features/customers</code> exposes
          <code>useCustomer(id)</code> in its <code>index.ts</code>;
          <code>features/invoices</code> imports it. Explicit, discoverable, boundary
          rules satisfied.
        </li>
        <li>
          <strong>Event bus / global state.</strong> Only for truly cross-cutting concerns
          (auth, feature flags, notifications). Anything else is a smell.
        </li>
      </ol>

      <h2>The "Where Does This File Go?" Test</h2>
      <p>
        For any new file, ask three questions:
      </p>
      <CodeBlock language="text" title="Decision tree">
{`1. Is it specific to one feature's business logic?
      -> features/<name>/... (usually components/hooks/api)

2. Is it generic UI or utility used by 3+ features with no business meaning?
      -> shared/ui or shared/hooks or shared/api

3. Is it about how the app is wired together (routes, providers, error boundaries)?
      -> app/

If you're unsure, default to the feature. Moving a file OUT of a feature later
is easier than dragging feature logic out of a shared folder that half the app
depends on.`}
      </CodeBlock>

      <h2>When Feature-Based Falls Down</h2>
      <p>
        No architecture is free.
      </p>
      <ul>
        <li>
          <strong>Small apps</strong>. A 20-file app doesn't need features. The layer
          layout is faster to work in when there's little of anything.
        </li>
        <li>
          <strong>Truly interdependent domains</strong>. If Feature A always renders inside
          Feature B, they may actually be one feature you haven't named yet. Merge them
          before you invent cross-feature APIs to keep them apart.
        </li>
        <li>
          <strong>Team topology mismatch</strong>. If one team owns everything and no one
          else touches the codebase, boundaries are ceremony. Feature folders shine when
          different teams own different features and want isolation.
        </li>
      </ul>

      <h2>Comparison to Micro-Frontend Split</h2>
      <p>
        Feature-based folders and Module Federation micro-frontends are complementary:
        feature folders give you <em>compile-time</em> module boundaries; MFEs give you
        <em>deploy-time</em> boundaries.
      </p>
      <CodeBlock language="text" title="A common progression">
{`Small team, one repo, one deploy:
  layer-based -> feature-based

Multiple teams, one repo, one deploy:
  feature-based, with strict boundaries via ESLint or Nx tags

Multiple teams, want independent deploys:
  Move each feature to its own package, then to its own MFE

Multiple orgs, no shared monorepo:
  MFEs on separate build+deploy pipelines behind a shell contract`}
      </CodeBlock>

      <h2>Migration — From Layers to Features</h2>
      <p>
        Refactor incrementally. Trying to move the whole tree in one commit produces
        merge chaos and unresolved review conflicts.
      </p>
      <ol>
        <li>Create <code>src/features/</code>, <code>src/shared/</code>, <code>src/app/</code>.
            Nothing else changes.</li>
        <li>Pick one small feature — the one most self-contained. Move its files. Fix
            imports. Ship.</li>
        <li>Add the ESLint boundary rule for that feature only. Ship.</li>
        <li>Repeat one feature at a time. Old layer folders shrink until they disappear.</li>
        <li>The last thing to move is <code>shared/</code>: promote from
            <code>components/</code> and <code>hooks/</code> only what's actually generic.
            Anything left over probably belongs in a feature.</li>
      </ol>

      <h2>Anti-Patterns</h2>
      <InfoBox variant="danger" title="Traps that erode feature boundaries">
        <ul>
          <li><strong>Deep imports</strong> —
              <code>import '@/features/orders/components/OrdersList'</code>. Add the
              ESLint rule from day one.</li>
          <li><strong>Business components in shared</strong> — the moment
              <code>shared/OrderCard.tsx</code> exists, the boundary is dead. Move it
              back into <code>features/orders</code>.</li>
          <li><strong>Feature A directly manipulating Feature B's state</strong> — hooks
              in Feature A dispatching into Feature B's store. Rewrite as compose-at-shell
              or an explicit public API.</li>
          <li><strong>"Shared" becoming a graveyard</strong> — unused utilities that no
              one dares delete. Include shared/ in your dead-code audits.</li>
          <li><strong>Feature folders that don't have an index.ts</strong> — no public
              surface, so anything anywhere can import anything. The boundary exists in
              name only.</li>
        </ul>
      </InfoBox>

      <h2>Checklist</h2>
      <InfoBox variant="success" title="A healthy feature-based codebase has">
        <ul>
          <li>Every feature has an <code>index.ts</code> that lists its public exports.</li>
          <li>ESLint (or an Nx / Turbo boundary rule) rejects deep imports into feature
              internals.</li>
          <li><code>shared/</code> contains only truly generic UI and utilities with no
              business terms in their names.</li>
          <li>Cross-feature dependencies go through public feature APIs, not
              module paths.</li>
          <li>Route definitions live inside each feature, not in a monolithic router.</li>
          <li>Adding a new feature = adding one folder; deleting a feature = deleting
              one folder.</li>
          <li>A new engineer can find the code for feature X in under 30 seconds without
              knowing the codebase.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="Which of these BEST belongs in features/orders/ rather than shared/?"
        options={[
          "useDebounce — a hook that debounces any value",
          "Button — a themed <button> wrapper",
          "OrderStatusBadge — a badge that renders 'Placed', 'Shipped', 'Cancelled' with domain-specific colors and translation keys",
          "apiFetch — the generic fetch wrapper that applies auth and error normalization"
        ]}
        correctIndex={2}
        explanation="OrderStatusBadge encodes business meaning: the labels 'Placed / Shipped / Cancelled', the mapping from status to color, likely feature-specific translation keys. It's owned by the orders feature and belongs in features/orders/components. useDebounce, Button, and apiFetch are all generic — no business domain concept in their names, useful in many features — and belong in shared. The moment a business-domain component moves into shared/, the boundary is porous and everyone loses."
      />
    </LessonLayout>
  );
}
