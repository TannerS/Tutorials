import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Chunks() {
  return (
    <LessonLayout
      title="What the Bundler Actually Emits"
      sectionId="frontend-tooling"
      lessonIndex={2}
      prev={{ path: '/frontend-tooling/webpack', label: 'Webpack: Getting Started' }}
      next={{ path: '/frontend-tooling/linting', label: 'ESLint & Prettier' }}
    >
      <p>
        Every other lesson tells you <em>how</em> to split code. This one tells you what
        comes out the other side — because &quot;the bundle&quot; is not a file, and most
        of the confusion about lazy loading is really confusion about chunks.
      </p>
      <p>
        The numbers throughout are from a real production build of this site: 458 source
        files, 428 of them lazy-loaded routes.
      </p>

      <h2>There Is No <code>app.js</code></h2>

      <CodeBlock language="text" title="Real output — the built index.html references exactly one module">
{`<script type="module" src="/assets/index-DUJ5Ntuj.js">

...while the build emitted 522 .js files totalling 23 MB.`}
      </CodeBlock>

      <p>
        A <strong>chunk</strong> is just a <code>.js</code> file the bundler decided to
        emit. Nothing more exotic than that. There are three kinds, and knowing which is
        which explains everything else:
      </p>

      <table>
        <thead>
          <tr>
            <th>Kind</th>
            <th>What it is</th>
            <th>When it loads</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Entry</strong></td>
            <td>
              The one <code>index.html</code> points at. Your app shell, router, React.
            </td>
            <td>Always, first, before anything renders.</td>
          </tr>
          <tr>
            <td><strong>Async</strong></td>
            <td>
              One per <code>import()</code> split point.
            </td>
            <td>Only when that <code>import()</code> actually runs.</td>
          </tr>
          <tr>
            <td><strong>Shared</strong></td>
            <td>
              Code reachable from several chunks, factored out. You never wrote these
              files.
            </td>
            <td>
              When the first chunk that needs it loads. Cached for the rest.
            </td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="note" title="Chunks are not 1:1 with your files">
        <p style={{ marginBottom: 0 }}>
          458 source files in, 522 chunks out. And the output is not only your code — the
          two largest chunks in this build are the <strong>TypeScript compiler</strong>{' '}
          (3,386 kB) and <strong>Sass</strong> (3,243 kB), both pulled in by one interactive
          playground page. All chunks together = your code <em>plus every library it
          actually reaches</em>, minus whatever tree shaking proved unreachable. That is how
          11 MB of source becomes 23 MB of output.
        </p>
      </InfoBox>

      <h2>How It Decides What Goes Where</h2>

      <p>Two rules, applied in order.</p>

      <p>
        <strong>Rule 1 — every <code>import()</code> is a forced split point.</strong> This
        is not a heuristic. A dynamic import <em>must</em> become its own file, or it could
        not be deferred. 428 lazy routes guarantee at least 428 async chunks.
      </p>

      <p>
        <strong>Rule 2 — a module reachable from more than one chunk gets extracted.</strong>{' '}
        The bundler builds the whole module graph, then asks of each module: <em>which
        chunks can reach this?</em> Modules with the same answer get grouped into one shared
        chunk.
      </p>

      <CodeBlock language="text" title="Real output — why rule 2 matters">
{`CodeBlock      statically imported by 394 chunks
LessonLayout   statically imported by 400 chunks
FlowChart      statically imported by 371 chunks

CodeBlock is 619.6 kB.
  inlined into each importer:  394 x 619.6 kB  =  ~244 MB
  extracted as a shared chunk: 619.6 kB, downloaded once

One lesson chunk is 17.2 kB — it merely REFERENCES the shared ones.`}
      </CodeBlock>

      <p>
        Reachable from one chunk only &rarr; inlined into it. Reachable from many &rarr;
        pulled out. You can override the grouping (<code>manualChunks</code> in Vite,{' '}
        <code>optimization.splitChunks</code> in Webpack), but the default is usually right
        and manual grouping is easy to get wrong.
      </p>

      <h2>How One Chunk Loads Another</h2>

      <p>
        Two mechanisms, both boring once you see them. First, <strong>the bundler rewrites
        your source path into the output filename at build time.</strong> You write this:
      </p>

      <CodeBlock language="javascript" title="Your source">
{`const NpkgAdvanced = lazy(() => import('./pages/npm-packages/Advanced'));`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the same line, as shipped">
{`Ju = lazy(() => h(() => import(\`./Advanced-vLtJorqy.js\`), __vite__mapDeps(...)))

The source path is GONE. The emitted filename is baked in as a literal
string. There are 428 of these in the entry chunk — one per lazy route.`}
      </CodeBlock>

      <p>
        So &quot;how does it know where to look&quot; is answered at build time, not
        runtime. At runtime it is a plain native <code>import()</code>: the browser fetches
        that URL, evaluates it as a module, hands back the exports. No framework magic.
      </p>

      <p>
        Second, <strong>each chunk declares its own dependencies with ordinary static
        imports</strong>, and the browser&apos;s module loader walks the graph itself:
      </p>

      <CodeBlock language="text" title="Real output — the top of one lesson chunk">
{`from "./index-DUJ5Ntuj.js"      <- the entry chunk; already loaded, free
from "./LessonLayout-*.js"      <- shared
from "./CodeBlock-*.js"         <- shared
from "./FlowChart-*.js"         <- shared, and it pulls in mermaid...

...which is why navigating to one lesson fetched 30 files, not 1.`}
      </CodeBlock>

      <FlowChart
        title="One navigation, from click to rendered page"
        chart={"graph TD\n  A[\"entry chunk\\nalways loaded\"] --> B[\"user navigates\\nto /npm-packages/advanced\"]\n  B --> C[\"React calls the stored\\narrow function\"]\n  C --> D[\"import('./Advanced-vLtJorqy.js')\\nfilename baked in at build time\"]\n  D --> E[\"browser fetches + evaluates it\"]\n  E --> F[\"its STATIC imports are resolved\\nby the browser's module loader\"]\n  F --> G[\"shared chunks\\nLessonLayout, CodeBlock, FlowChart\\n(cached after the first lesson)\"]\n  F --> H[\"entry chunk\\nalready in cache — free\"]\n  G --> I[\"component renders\"]\n  H --> I\n  style D fill:#3d2f14,stroke:#d97706\n  style G fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="tip" title="Why the 30 files do not waterfall">
        <p style={{ marginBottom: 0 }}>
          That <code>h(...)</code> wrapper with <code>__vite__mapDeps</code> is Vite&apos;s
          preload helper. It injects <code>&lt;link rel=&quot;modulepreload&quot;&gt;</code>{' '}
          tags for the dependency list it already knows about, so those files are fetched{' '}
          <strong>in parallel</strong> rather than being discovered one level at a time.
          Without it you would pay a round trip per level of the import graph.
        </p>
      </InfoBox>

      <h2>Chunks Without Lazy Loading</h2>

      <p>
        Splitting and deferring are two different things, and you can have the first without
        the second. Here is a build with <strong>no <code>import()</code> anywhere</strong>:
      </p>

      <CodeBlock language="javascript" title="Source — both imports are static">
{`// main.js
import { a } from './a.js';
import { b } from './b.js';
document.body.textContent = a + b;

// vite.config.js
export default {
  build: { rollupOptions: { output: { manualChunks(id) {
    if (id.includes('/src/a.js')) return 'groupA';
    if (id.includes('/src/b.js')) return 'groupB';
  } } } }
};`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — three chunks, all loaded up front">
{`emitted:
  index-Bq4x5key.js      <- entry
  groupA-CN-BklpM.js
  groupB-Ckre9qiM.js

index.html:
  <script type="module" src="/assets/index-Bq4x5key.js">
  <link rel="modulepreload" href="/assets/groupA-CN-BklpM.js">
  <link rel="modulepreload" href="/assets/groupB-Ckre9qiM.js">
                ^ eagerly preloaded — nothing is deferred`}
      </CodeBlock>

      <InfoBox variant="warning" title="The distinction worth keeping">
        <p style={{ marginBottom: 0 }}>
          <strong>Many things produce chunks</strong> — <code>manualChunks</code>, multiple
          entry points, workers, CSS splitting. <strong>Only <code>import()</code> makes a
          chunk optional.</strong> Manual chunks buy you parallel downloads and, in
          principle, better caching — but the browser still downloads all of them before
          first paint. If your goal is &quot;do not ship what nobody visits&quot;, a split
          point is the only tool that achieves it.
        </p>
      </InfoBox>

      <h2>Content Hashes, and the Cascade That Defeats Them</h2>

      <p>
        The <code>-vLtJorqy</code> in <code>Advanced-vLtJorqy.js</code> is a hash of the
        file&apos;s contents. Same content &rarr; same filename &rarr; the browser reuses its
        cached copy. Changed content &rarr; new filename &rarr; it fetches. That is how you
        cache JavaScript for a year and still never serve a stale file.
      </p>

      <p>
        The usual promise is that editing one page invalidates one chunk. Test it before
        you believe it:
      </p>

      <CodeBlock language="text" title="Real output — edit ONE line in ONE lesson, rebuild, diff the filenames">
{`chunks whose filename changed:   495
chunks whose filename survived:    27
                          total:  522`}
      </CodeBlock>

      <InfoBox variant="danger" title="Why almost everything changed">
        <p>
          A <strong>hash cascade</strong>. Every lesson chunk statically imports the entry
          chunk. Editing one lesson changed the entry chunk&apos;s contents, so its hash
          changed, so the import line <em>inside every chunk that references it</em> changed,
          so their hashes changed too. The invalidation propagates up the dependency graph
          to everything downstream.
        </p>
        <p style={{ marginBottom: 0 }}>
          The fix is to make the widely-depended-on code <strong>stable</strong> — split
          framework and vendor code into their own chunks that rarely change, so a content
          edit cannot reach them. Until you do, treat &quot;content hashing gives me
          fine-grained caching&quot; as an assumption to verify, not a property you get for
          free. Diff the filenames across two builds; it takes a minute and the answer is
          frequently humbling.
        </p>
      </InfoBox>

      <h2>What to Take Away</h2>

      <CodeBlock language="text" title="The model, compressed">
{`"the bundle"        -> is not a file. 1 entry + N async + M shared chunks.

a chunk            -> a .js file the bundler chose to emit.

import()           -> a forced split point. The ONLY thing that defers.
manualChunks       -> splits files. Does NOT defer them.

grouping rule      -> reachable from 1 chunk  -> inlined
                      reachable from many     -> extracted as shared

chunk -> chunk     -> emitted filename baked in at build time, then a
                      plain native import(). Static imports inside the
                      chunk are resolved by the browser's module loader.

content hash       -> real, but cascades. Verify, do not assume.`}
      </CodeBlock>

      <p>
        The React-side half of this — when <code>lazy()</code> actually calls your import
        function, and why passing a component to a <code>&lt;Route&gt;</code> does not fetch
        anything — is in{' '}
        <a href="/react18/performance">Performance &amp; Memoization</a>. The language
        feature underneath it all is in{' '}
        <a href="/javascript/modules">Modules &amp; Tooling</a>, and bundle analysis is in{' '}
        <a href="/frontend-tooling/performance">Bundle Analysis &amp; Performance</a>.
      </p>
    </LessonLayout>
  );
}
