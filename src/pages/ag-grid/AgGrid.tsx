import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';

export default function AgGrid() {
  return (
    <LessonLayout
      title="AG Grid — Data Tables at Scale"
      sectionId="ag-grid"
      lessonIndex={0}
      prev={null}
      next={null}
    >
      <p>
        A <code>&lt;table&gt;</code> or a hand-rolled div grid works fine until a real dataset shows up —
        a few thousand rows, sortable and filterable columns, cells that need inline editing, maybe a
        &quot;group by region, then by rep&quot; view a stakeholder asked for in a meeting. That's the gap{' '}
        <a href="https://github.com/ag-grid/ag-grid" rel="noreferrer" target="_blank">AG Grid</a> fills: a
        data grid, not a styling library — it owns rendering, scrolling, sorting, filtering, editing, and
        (in the paid tier) grouping/pivoting/server-side pagination, all with a rendering strategy built to
        stay fast at row counts that would bring a plain <code>&lt;table&gt;</code> to its knees.
      </p>

      <h2>Why Reach for AG Grid</h2>

      <p>
        The concrete thing AG Grid buys you, ahead of everything else, is <strong>row virtualization</strong>:
        rendering only the rows currently scrolled into view, no matter how many rows are in the underlying
        dataset. Layer on top of that a large built-in feature set — column sort/filter/resize/reorder,
        pinned columns, cell editing, CSV export — and most CRUD-heavy internal tools never need custom
        table code again. The tradeoff is real, though: it's a big dependency with its own object model
        (grid options, column definitions, row nodes) sitting between your data and the DOM, and its own
        opinions about how state should flow in. For a handful of rows with no sorting or editing, that's
        pure overhead — plain JSX and CSS render faster and stay simpler to reason about.
      </p>

      <InfoBox variant="note" title="Community vs. Enterprise — Checked Against the Real Docs">
        <p>
          AG Grid Community (<code>ag-grid-community</code> + <code>ag-grid-react</code>) is MIT-licensed
          and free for production use — confirmed via the package's <code>license</code> field on npm.
          Sorting, filtering, column pinning, resizing, and cell editing all ship in Community. Row{' '}
          <strong>grouping</strong>, the Excel-style Set Filter, Master/Detail, Excel export, and the
          Server-Side Row Model are flagged <code>enterprise: true</code> in AG Grid's own docs source —
          they require a commercial license for production use (<code>ag-grid-enterprise</code> reports{' '}
          <code>&quot;license&quot;: &quot;Commercial&quot;</code> on npm). Free to evaluate locally, not
          free to ship. Plan column/feature scope with that split in mind before committing to a design
          that leans on grouping or the Server-Side Row Model.
        </p>
      </InfoBox>

      <p>
        The other common comparison is <a href="https://tanstack.com/table" rel="noreferrer" target="_blank">
        TanStack Table</a> (<code>@tanstack/react-table</code>, confirmed at version <code>9.2.4</code> on
        npm). It's the opposite design: headless — no DOM output, no virtualization, no styling of its own,
        just the sorting/filtering/pagination <em>state and logic</em>, handed back as data for you to render
        however you like (typically paired separately with something like TanStack Virtual for large lists).
        Reach for TanStack Table when you want full control over markup and a small footprint; reach for AG
        Grid when you want the rendering, virtualization, and editing infrastructure already built and
        battle-tested, and you're fine working inside its component model to get it.
      </p>

      <h2>Install &amp; Core Setup</h2>

      <CodeBlock language="bash" title="Install (npm registry, checked directly)">{`npm install ag-grid-react
# installs ag-grid-community as a dependency automatically — confirmed via
# ag-grid-react's package.json: "dependencies": { "ag-grid-community": "36.1.0" }`}
      </CodeBlock>

      <p>
        Current released version, checked directly against the npm registry rather than assumed: both{' '}
        <code>ag-grid-community</code> and <code>ag-grid-react</code> are at <code>36.1.0</code>, and{' '}
        <code>ag-grid-react</code>'s <code>peerDependencies</code> list{' '}
        <code>&quot;react&quot;: &quot;^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0&quot;</code> — React 19 is
        fully supported, not a version you'd need to double-check compatibility for.
      </p>

      <InfoBox variant="warning" title="Modules Have to Be Registered — This Isn't Optional">
        <p>
          Since v33, AG Grid ships as a set of independent modules so unused features don't bloat your
          bundle, and the grid throws at runtime if you reference a feature (a row model, an export format,
          a filter type) whose module was never registered. For React specifically, AG Grid added the{' '}
          <code>AgGridProvider</code> component in <strong>v35.1</strong> — checked directly against the
          current docs source — as the idiomatic way to register modules, replacing the pattern of calling{' '}
          <code>ModuleRegistry.registerModules(...)</code> yourself before any grid mounts (that global-registry
          approach still exists and still works, but <code>AgGridProvider</code> is what the current docs
          lead with for React).
        </p>
      </InfoBox>

      <CodeBlock language="tsx" title="Minimal Setup — Adapted Directly From AG Grid's Own Quick-Start Example">
{`import { useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import { AgGridProvider, AgGridReact } from 'ag-grid-react';

interface Car {
  make: string;
  model: string;
  price: number;
  electric: boolean;
}

function CarGrid() {
  const [rowData] = useState<Car[]>([
    { make: 'Tesla', model: 'Model Y', price: 64950, electric: true },
    { make: 'Ford', model: 'F-Series', price: 33850, electric: false },
    { make: 'Toyota', model: 'Corolla', price: 29600, electric: false },
  ]);

  const [colDefs] = useState<ColDef<Car>[]>([
    { field: 'make' },
    { field: 'model' },
    { field: 'price' },
    { field: 'electric' },
  ]);

  return (
    // AgGridProvider only needs to wrap the grid(s) once, near the app root —
    // it's a module-registration context, not a per-grid wrapper.
    <AgGridProvider modules={[AllCommunityModule]}>
      {/* The grid fills its parent — the parent MUST have an explicit height,
          or the grid renders at 0px and appears to silently do nothing. */}
      <div style={{ height: 500 }}>
        <AgGridReact rowData={rowData} columnDefs={colDefs} />
      </div>
    </AgGridProvider>
  );
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="The #1 'My Grid Is Blank' Bug">
        <p>
          AG Grid sizes itself to fill its parent container — it does not pick a default height of its own.
          A parent <code>&lt;div&gt;</code> with no explicit <code>height</code> (or one sized only by
          content, which the grid itself doesn't contribute to) collapses to zero height, and the grid
          renders nothing visible with no error in the console. This is directly from AG Grid's own
          getting-started docs, which call out the container needing &quot;a fixed height&quot; explicitly —
          it's the single most common first-run mistake, not an edge case.
        </p>
      </InfoBox>

      <h2>Theming: the Theming API, Not CSS Imports</h2>

      <p>
        Older AG Grid material you'll find online — and older projects still on AG Grid v32 or earlier —
        style the grid by importing a theme's CSS file directly (<code>ag-grid.css</code> plus{' '}
        <code>ag-theme-alpine.css</code>, etc.) and applying the theme's class name to the container div.
        Checked directly against the current docs: that CSS-import approach is now labeled{' '}
        <strong>Legacy Themes</strong>, superseded since v33 by the <strong>Theming API</strong> — themes are
        JS objects imported from <code>ag-grid-community</code> and passed to the grid via a{' '}
        <code>theme</code> prop, and the grid injects the resulting CSS into the page itself at runtime
        instead of you linking a stylesheet.
      </p>

      <CodeBlock language="tsx" title="Theming API — Verified Against the Current Docs Source">
{`import { themeQuartz, themeAlpine, themeBalham, themeMaterial } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

// Quartz is the current default theme if you omit the \`theme\` prop entirely.
// Alpine is kept around specifically to ease migration for apps that were
// already using the pre-Theming-API "ag-theme-alpine" CSS class.
<AgGridReact theme={themeQuartz} rowData={rowData} columnDefs={colDefs} />`}
      </CodeBlock>

      <p>
        Themes are starting points, not fixed presets — <code>theme.withParams({'{'} spacing: 6, accentColor: '#2563eb' {'}'})</code>{' '}
        layers parameter overrides (spacing, colors, fonts, border radius) onto a built-in theme without
        writing raw CSS, and you can still drop to plain CSS custom properties or your own stylesheet for
        anything the parameter set doesn't cover. If a project you inherit still imports{' '}
        <code>ag-grid-community/styles/ag-theme-alpine.css</code>, that's a signal it predates v33 and hasn't
        migrated — not a sign the CSS-import approach is still the recommended path for new code.
      </p>

      <h2>How Row Virtualization Actually Works</h2>

      <p>
        The performance story isn't magic — it's the grid deliberately keeping the DOM small regardless of
        dataset size. Loading 10,000 rows into the grid does not create 10,000 DOM row elements; it only
        renders the rows currently scrolled into the visible viewport, plus a small buffer above and below
        (10 rows each way by default, per AG Grid's own DOM Virtualisation docs) so fast scrolling doesn't
        flash blank space before new rows paint. As the user scrolls, rows that fall out of that window get
        torn down and rows that enter it get created — the DOM node count stays roughly constant no matter
        how large <code>rowData</code> grows.
      </p>

      <FlowChart
        title="Row Virtualization: 10,000 Rows in Memory, ~70 in the DOM"
        chart={"graph TB\n  subgraph Memory[\"rowData in JS memory - all 10,000 rows\"]\n    M1[Rows 1 - 500: scrolled past]\n    M2[Rows 501 - 570: buffer + visible viewport]\n    M3[Rows 571 - 10,000: not scrolled to yet]\n  end\n  subgraph Dom[\"Actual DOM elements the grid renders\"]\n    B1[Row buffer: 10 rows above viewport]\n    V1[Visible rows: fill the scrollable viewport]\n    B2[Row buffer: 10 rows below viewport]\n  end\n  M2 -->|becomes real DOM nodes| B1\n  M2 --> V1\n  M2 --> B2\n  M1 -.->|torn down as you scroll past| Gone[No DOM node - scrolled out of range]\n  M3 -.->|not created until scrolled into range| NotYet[No DOM node yet]\n  style B1 fill:#1a2744\n  style V1 fill:#1a3329\n  style B2 fill:#1a2744\n  style Gone fill:#3b1a1a\n  style NotYet fill:#3b1a1a"}
      />

      <InfoBox variant="tip" title="There's a Safety Cap, Too">
        <p>
          As a backstop against a misconfigured container silently trying to render everything, AG Grid caps
          rendering at 500 rows by default even if virtualization math would otherwise ask for more (e.g. a
          broken height calculation) — configurable via <code>suppressMaxRenderedRowRestriction</code>, but
          it exists specifically so a sizing bug degrades performance instead of crashing the tab.
        </p>
      </InfoBox>

      <h2>Column Definitions: field, valueGetter, valueFormatter</h2>

      <p>
        The simple case — a column that displays one property of the row object as-is — just needs{' '}
        <code>field</code> (dot notation works for nested objects, e.g. <code>field: 'medals.gold'</code>).
        Two escape hatches cover everything else, and it's worth keeping them distinct: a{' '}
        <strong>value getter</strong> computes what the cell's underlying <em>value</em> is (used for
        sorting, filtering, and export, not just display); a <strong>value formatter</strong> only changes
        how an already-computed value is <em>displayed</em> as text.
      </p>

      <CodeBlock language="tsx" title="field vs. valueGetter vs. valueFormatter">
{`const columnDefs: ColDef<Order>[] = [
  { field: 'customerName', pinned: 'left' },       // straight passthrough

  {
    headerName: 'Total',
    // valueGetter computes the actual cell VALUE — this is what sorting,
    // filtering, and CSV export all operate on, not just what's painted.
    valueGetter: (p) => (p.data ? p.data.qty * p.data.unitPrice : null),
  },

  {
    field: 'unitPrice',
    // valueFormatter only changes the DISPLAYED text; the underlying value
    // used for sorting/filtering is still the raw number.
    valueFormatter: (p) => (p.value == null ? '' : \`$\${p.value.toFixed(2)}\`),
  },
];`}
      </CodeBlock>

      <InfoBox variant="warning" title="Both Callbacks Have to Handle Missing Data">
        <p>
          <code>params.data</code> in a value getter, and <code>params.value</code> in a value formatter,
          can both be <code>null</code>/<code>undefined</code> — for group rows, or rows whose data hasn't
          loaded yet under the Infinite or Server-Side Row Models covered below. AG Grid's own docs call this
          out explicitly for both callbacks; skipping the null check is a real, common crash, not a
          theoretical edge case.
        </p>
      </InfoBox>

      <h2>Custom Cell Renderers</h2>

      <p>
        This is where the React integration gets genuinely interesting: a cell renderer is a normal React
        component — AG Grid's own docs state this plainly — that receives grid-provided props (typed as{' '}
        <code>CustomCellRendererProps</code> from <code>ag-grid-react</code>, a superset of the underlying{' '}
        <code>ICellRendererParams</code>) and returns whatever JSX it wants for that cell:
      </p>

      <CodeBlock language="tsx" title="Custom Cell Renderer — Pattern Adapted From AG Grid's Own Docs Example">
{`import type { CustomCellRendererProps } from 'ag-grid-react';

interface Order {
  status: 'pending' | 'shipped' | 'delivered';
}

function StatusBadge({ value }: CustomCellRendererProps<Order, Order['status']>) {
  const colors: Record<Order['status'], string> = {
    pending: '#f59e0b',
    shipped: '#3b82f6',
    delivered: '#10b981',
  };
  return (
    <span style={{ color: colors[value], fontWeight: 600, textTransform: 'capitalize' }}>
      {value}
    </span>
  );
}

const columnDefs: ColDef<Order>[] = [
  { field: 'status', cellRenderer: StatusBadge },
];`}
      </CodeBlock>

      <p>
        The re-render question every React developer eventually hits: does editing one cell's value
        re-render the whole grid, or just that cell? AG Grid's change detection compares each cell's value
        with <code>===</code> on every refresh cycle and only touches cells whose value actually changed —
        confirmed against AG Grid's own Change Detection docs. For primitive values (strings, numbers,
        booleans) that comparison works exactly as expected. It breaks down for <strong>mutable objects</strong>{' '}
        passed as a cell's value: mutating a nested field in place and leaving the object reference unchanged
        means <code>===</code> sees &quot;no change&quot; and the cell renderer doesn't re-run, even though
        the data underneath it did change. AG Grid's own docs point to <code>colDef.equals(val1, val2)</code>{' '}
        as the escape hatch for exactly this case — a custom comparator instead of relying on reference
        equality.
      </p>

      <InfoBox variant="tip" title="Wrap Renderers in memo() the Same Way You Would Any List Item Component">
        <p>
          AG Grid's own React best-practices docs recommend wrapping a custom cell renderer in{' '}
          <code>memo()</code> when it's re-rendering more than expected — the same instinct you'd apply to
          any component rendered many times in a list, because a cell renderer effectively is one.
          Referencing the component directly on <code>cellRenderer</code> (rather than inlining a new
          function per render) already avoids most unnecessary renders on its own; <code>memo()</code> is
          the next lever if profiling still shows more renders than the data justifies.
        </p>
      </InfoBox>

      <h2>The Reference-Equality Gotcha</h2>

      <p>
        This is the AG Grid-specific version of a very familiar React mistake. <code>rowData</code>,{' '}
        <code>columnDefs</code>, and object-shaped props like <code>defaultColDef</code> are all compared by{' '}
        <em>reference</em> between renders — not deep-equality. Defining any of them inline in the component
        body hands the grid a brand-new array or object on every single render, even when nothing in it
        actually changed, and the grid reacts as if the data or configuration genuinely changed: column
        widths and sort state can reset, row selection can drop, and (with a large dataset) the grid does
        real recomputation work it didn't need to do.
      </p>

      <CodeBlock language="tsx" title="Verified Against AG Grid's Own React Best Practices Docs">
{`function OrdersGrid({ orders }: { orders: Order[] }) {
  // BAD — new array reference every render, even though defaultColDef's
  // actual contents never change. The grid treats this as a real update.
  return (
    <AgGridReact
      rowData={orders}
      columnDefs={[{ field: 'customerName' }, { field: 'total' }]}
      defaultColDef={{ filter: true }}
    />
  );
}

function OrdersGridFixed({ orders }: { orders: Order[] }) {
  // GOOD — rowData already has a stable reference from useState in the
  // parent (or useMemo, if this component never mutates it itself).
  const columnDefs = useMemo<ColDef<Order>[]>(
    () => [{ field: 'customerName' }, { field: 'total' }],
    [],
  );
  const defaultColDef = useMemo<ColDef>(() => ({ filter: true }), []);

  return <AgGridReact rowData={orders} columnDefs={columnDefs} defaultColDef={defaultColDef} />;
}`}
      </CodeBlock>

      <p>
        The same rule applies to any grid-option callback — <code>isRowSelectable</code>,{' '}
        <code>getRowId</code>, and similar — wrap them in <code>useCallback</code> with the correct
        dependency array for the same reason you'd wrap any prop-drilled callback: a new function identity
        every render looks, to the grid, exactly like a real configuration change. AG Grid also ships a{' '}
        <code>debug</code> prop on <code>AgGridReact</code> that logs exactly which property changed and
        what its old/new values were on every update — the fastest way to actually confirm which prop is
        churning, rather than guessing.
      </p>

      <h2>When rowData Itself Is Too Big to Hold in Memory</h2>

      <p>
        Everything above assumes the Client-Side Row Model — the default, where all of <code>rowData</code>{' '}
        lives in the browser and the grid virtualizes the DOM, not the data. AG Grid's own row-model docs
        put its practical ceiling around 100k+ rows before browser memory becomes the limiting factor, not
        the grid itself. Past that, two other row models fetch rows on demand instead of holding everything
        client-side:
      </p>

      <CodeBlock language="tsx" title="Infinite Row Model (Community) — set rowModelType and provide a datasource">
{`import type { IDatasource, IGetRowsParams } from 'ag-grid-community';

const datasource: IDatasource = {
  getRows: (params: IGetRowsParams) => {
    fetch(\`/api/orders?start=\${params.startRow}&end=\${params.endRow}\`)
      .then((res) => res.json())
      .then((rows) => params.successCallback(rows, /* total known? */ undefined))
      .catch(() => params.failCallback());
  },
};

<AgGridReact rowModelType="infinite" datasource={datasource} columnDefs={colDefs} />;`}
      </CodeBlock>

      <p>
        AG Grid asks the datasource for rows in blocks as the user scrolls, rather than requiring the whole
        dataset up front — useful for a large, flat (ungrouped) list backed by a paginated API. The{' '}
        <strong>Server-Side Row Model</strong> (Enterprise) is described in AG Grid's own docs as building on
        top of the Infinite Row Model with the same lazy-loading, plus server-driven grouping, aggregation,
        filtering, and sorting — set <code>rowModelType=&quot;serverSide&quot;</code> and implement{' '}
        <code>IServerSideDatasource</code>'s <code>getRows(params)</code>, which hands back rows via{' '}
        <code>params.success({'{'} rowData {'}'})</code> or reports a failure via{' '}
        <code>params.fail()</code>. AG Grid's guidance, stated directly in the row-model docs: if you already
        have an Enterprise license, prefer Server-Side over Infinite — it's a strict superset.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Situation</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Reach for&hellip;</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>A few dozen rows, no sort/filter/edit needed</td>
            <td style={{ padding: '0.75rem' }}>Plain JSX + CSS — AG Grid is pure overhead here</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Thousands of rows, need sort/filter/pin/edit, want to own the markup</td>
            <td style={{ padding: '0.75rem' }}>TanStack Table + your own virtualization (e.g. TanStack Virtual)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Same, but you want the rendering/virtualization/editing built and tested</td>
            <td style={{ padding: '0.75rem' }}>AG Grid Community</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Row grouping/pivoting, Excel export, Master/Detail, Set Filter</td>
            <td style={{ padding: '0.75rem' }}>AG Grid Enterprise (commercial license required in production)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Millions of rows, can't load them all client-side</td>
            <td style={{ padding: '0.75rem' }}>Infinite Row Model (Community) or Server-Side Row Model (Enterprise)</td>
          </tr>
        </tbody>
      </table>

    </LessonLayout>
  );
}
