import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function TestPerformance() {
  return (
    <LessonLayout
      title="Test Performance & Parallelization"
      sectionId="testing"
      lessonIndex={8}
      prev={{ path: '/testing/e2e', label: 'End-to-End Testing' }}
      next={{ path: '/testing/bestpractices', label: 'Testing Best Practices' }}
    >
      <h2>Slow Suites Stop Being Run</h2>
      <p>
        A test suite&apos;s value is a function of how often it runs. At two seconds you
        run it on every save; at forty seconds you run it before committing; at eleven
        minutes you push and go make coffee, and the feedback loop that was supposed to
        catch your mistake now catches it half an hour later, on someone else&apos;s
        branch. Suite speed is not a nice-to-have — it is what decides whether the tests
        are part of how you work or a tax you pay at the end.
      </p>
      <p>
        Suites never get slow in one commit. They accumulate: a Spring context that
        stopped being cached, a container started per test class, a{' '}
        <code>sleep(500)</code> added to stabilise a flake in 2023. This lesson is about
        finding those and fixing them, and about the parallelism that makes the
        remaining time smaller.
      </p>

      <h2>The Cost Model: Where the Time Actually Goes</h2>
      <p>
        The single most useful thing to internalise is that{' '}
        <strong>your assertions are almost never the cost.</strong> Executing{' '}
        <code>expect(total).toBe(170)</code> takes microseconds. Everything expensive
        happens before your test body starts, or while it waits:
      </p>

      <table>
        <thead>
          <tr>
            <th>Cost</th>
            <th>Order of Magnitude</th>
            <th>Paid</th>
            <th>Lever</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Runner / JVM startup</td>
            <td>0.3&ndash;3s</td>
            <td>Once per process or fork</td>
            <td>Fewer forks, reuse forks, more work per process</td>
          </tr>
          <tr>
            <td>Transform &amp; module resolution (TS/JSX &rarr; JS)</td>
            <td>5&ndash;100ms per module</td>
            <td>Per worker, per file graph</td>
            <td>esbuild/SWC over ts-jest, warm caches, smaller import graphs</td>
          </tr>
          <tr>
            <td>Framework bootstrap (Spring context, DI graph)</td>
            <td>1&ndash;15s</td>
            <td>Per <em>distinct</em> context configuration</td>
            <td>Context caching — the biggest single win in Java suites</td>
          </tr>
          <tr>
            <td>DOM environment (jsdom/happy-dom)</td>
            <td>100&ndash;500ms</td>
            <td>Per test file</td>
            <td>Node environment for non-DOM files</td>
          </tr>
          <tr>
            <td>Container / database startup</td>
            <td>0.5&ndash;20s</td>
            <td>Per container instance</td>
            <td>Singleton or reused containers, per-worker not per-test</td>
          </tr>
          <tr>
            <td>Schema migration &amp; seed data</td>
            <td>0.5&ndash;30s</td>
            <td>Per database created</td>
            <td>Template databases, snapshot restore, seed once</td>
          </tr>
          <tr>
            <td>Waiting: sleeps, polls, real network, real timers</td>
            <td>Unbounded</td>
            <td>Every single time</td>
            <td>Condition-based waiting, fake timers</td>
          </tr>
          <tr>
            <td>Your actual assertions</td>
            <td>Microseconds</td>
            <td>Per assertion</td>
            <td>None needed. Do not optimise here.</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="Fixed Cost vs Per-Test Cost">
        <p>
          Sort every cost above into <strong>fixed</strong> (paid once per process or
          per context) and <strong>marginal</strong> (paid per test). The two need
          opposite strategies.
        </p>
        <p>
          Fixed costs are attacked by <em>amortising</em>: share the context, reuse the
          container, keep the worker alive. Marginal costs are attacked by{' '}
          <em>removing work</em>: kill the sleep, stop hitting the network, stop
          rebuilding the world in <code>beforeEach</code>. Parallelism only helps
          marginal cost — it multiplies fixed cost by the number of workers, which is
          why naive parallelisation sometimes makes a suite <em>slower</em>.
        </p>
      </InfoBox>

      <h2>Measure First — Always</h2>
      <p>
        Test suite intuition is reliably wrong, because the slow thing is usually a
        setup step nobody wrote deliberately. Get per-test and per-file timings before
        you change anything, and re-measure after.
      </p>

      <CodeBlock language="bash" title="Getting Timings Out of a JS Suite">
{`# Vitest — per-file and per-test durations, slowest first
npx vitest run --reporter=verbose
npx vitest run --reporter=json --outputFile=timings.json   # machine-readable

# Vitest flags the slow ones for you; lower the bar to see more
npx vitest run --slowTestThreshold=100      # ms; default 300

# Jest — per-test durations plus a sorted per-file summary
npx jest --verbose
npx jest --detectOpenHandles                # find the handle keeping the run alive

# Where did the time go before any test ran? (transform + resolution)
npx jest --logHeapUsage
npx vitest run --reporter=verbose 2>&1 | tail -20   # the transform/collect/setup line`}
      </CodeBlock>

      <InfoBox variant="tip" title="Read Vitest&apos;s Summary Line, Not Just the Total">
        Vitest prints a breakdown like{' '}
        <code>
          transform 1.2s, setup 8.4s, collect 3.1s, tests 0.9s, environment 4.2s
        </code>
        . That line diagnoses the suite on its own. <code>setup</code> dominating means
        a heavy <code>setupFiles</code> running per file; <code>environment</code>{' '}
        dominating means jsdom is being booted for files that never touch the DOM;{' '}
        <code>collect</code> dominating means your import graph is huge. If{' '}
        <code>tests</code> is a small fraction of the total — the usual case — no amount
        of rewriting assertions will help you.
      </InfoBox>

      <CodeBlock language="bash" title="Getting Timings Out of a Java Suite">
{`# Maven Surefire writes a per-class report with elapsed time for every method
mvn test
grep -h "Time elapsed" target/surefire-reports/*.txt | sort -k5 -rn | head -20

# Gradle: the HTML report sorts tests by duration
./gradlew test
open build/reports/tests/test/index.html
./gradlew test --profile        # where the *build* time went, not just tests

# Spring: how many application contexts were actually created?
# (each "Refreshing ApplicationContext" line is several seconds you paid)
mvn test -Dlogging.level.org.springframework.test.context.cache=DEBUG \\
  | grep -c "Refreshing"`}
      </CodeBlock>

      <InfoBox variant="danger" title="Count Your Spring Contexts">
        <p>
          Spring&apos;s <code>TestContext</code> framework caches an application context
          and reuses it across every test class whose configuration is{' '}
          <em>identical</em>. Identical means the whole cache key: the config classes,
          the active profiles, the property sources, the web environment, and the set of{' '}
          <code>@MockitoBean</code> / <code>@MockBean</code> declarations.
        </p>
        <p>
          Change any of those in one test class and you get a second context — another
          five-to-fifteen seconds. A suite with thirty distinct context configurations
          spends minutes doing nothing but booting Spring. Standardise on a small number
          of base test classes, put your mocks in the same place, and treat every{' '}
          <code>@DirtiesContext</code> as a several-second charge that must justify
          itself.
        </p>
      </InfoBox>

      <h2>How Parallel Test Execution Actually Works</h2>
      <p>
        &quot;Run the tests in parallel&quot; hides several distinct layers, and they
        stack. Knowing which layer you are configuring explains both the speedup and the
        flakiness.
      </p>

      <FlowChart
        title="Layers of Parallelism"
        chart={"graph TD\n  CI[\"CI job\"] --> SHARD[\"Shards\\nseparate machines, disjoint test subsets\"]\n  SHARD --> PROC[\"Worker processes / JVM forks\\nseparate memory, separate globals\"]\n  PROC --> THREAD[\"Threads inside one process\\nSHARED memory and statics\"]\n  THREAD --> TEST[\"Individual tests\"]\n  PROC -.->|\"safe by default\"| SAFE[\"Process isolation:\\nsingletons and module state\\nare per-worker\"]\n  THREAD -.->|\"dangerous\"| RISK[\"Thread parallelism:\\nstatics, caches and mocks\\nare shared\"]"}
      />

      <h3>JavaScript: Vitest and Jest</h3>
      <p>
        Both default to <strong>file-level parallelism across worker processes</strong>:
        one file at a time per worker, tests inside a file run sequentially. That
        default is deliberate — it gives you process isolation for free, so module-level
        state and singletons cannot leak between files.
      </p>

      <CodeBlock language="typescript" title="vitest.config.ts — The Knobs That Matter">
{`export default defineConfig({
  test: {
    // 'threads' (worker_threads) starts faster; 'forks' (child processes) is
    // safer for native modules and code that touches process-level state.
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 4,
        // isolate: false reuses one environment across files in a worker.
        // Big win (often 30-50%) — and it is exactly what surfaces module-level
        // state leaks between files. Turn it on only with clean setup/teardown.
        isolate: true,
      },
    },

    // Node is far cheaper than jsdom. Opt in per file rather than globally:
    //   // @vitest-environment jsdom     <- top of the files that need a DOM
    environment: 'node',

    fileParallelism: true,   // false = one file at a time (debugging aid)
  },
});`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Concurrency Inside a File, and Opting Out">
{`// Tests in a file are sequential by default. Mark them concurrent when they
// are genuinely independent and mostly waiting on I/O:
describe.concurrent('catalogue queries', () => {
  test('finds by sku', async ({ expect }) => { /* ... */ });
  test('finds by name', async ({ expect }) => { /* ... */ });
});
// Note the destructured 'expect' — with concurrent tests the global expect
// cannot attribute a failed assertion to the right test.

// The reverse: force one file to have the machine to itself
describe.sequential('migration runner', () => { /* ... */ });

// Jest equivalents
// jest --maxWorkers=50%        percentage of cores, good default in CI
// jest --runInBand             single process; the debugging escape hatch
// test.concurrent.each([...])  concurrency within a file`}
      </CodeBlock>

      <InfoBox variant="warning" title="More Workers Is Not Monotonic">
        Each worker pays the full fixed cost — process startup, transform, setup files,
        jsdom. On a suite of 40 fast files, going from 4 to 16 workers can easily be
        slower, because you paid 16 bootstraps to save a few seconds of test time. CI
        containers make this worse: <code>os.cpus()</code> reports the{' '}
        <em>host&apos;s</em> core count, not your cgroup quota, so the default worker
        count is often wildly too high and every worker starves. Set{' '}
        <code>--maxWorkers</code> explicitly in CI and measure two or three values.
      </InfoBox>

      <h3>Java: JUnit 5/6 and the Build Tool</h3>
      <p>
        Java has two independent layers. Surefire/Gradle fork <strong>JVMs</strong>;
        JUnit (5.x or the current 6.x line — this layer is unchanged between them) runs
        tests on <strong>threads within</strong> a JVM. Forks give real
        isolation and cost a JVM startup each; threads are nearly free and share
        everything — statics, caches, the Spring context, <code>System.setProperty</code>.
      </p>

      <CodeBlock language="properties" title="src/test/resources/junit-platform.properties">
{`# Off by default. This is the single switch that enables JUnit 5 parallelism.
junit.jupiter.execution.parallel.enabled = true

# What runs concurrently:
#   same_thread  - sequential (the default for both)
#   concurrent   - parallel
junit.jupiter.execution.parallel.mode.default             = same_thread
junit.jupiter.execution.parallel.mode.classes.default     = concurrent
# The pairing above is the safe starting point: whole classes run in parallel
# with each other, but the methods inside one class stay sequential, so shared
# @BeforeEach state and instance fields behave as authors expected.

# Thread pool sizing
junit.jupiter.execution.parallel.config.strategy          = dynamic
junit.jupiter.execution.parallel.config.dynamic.factor    = 1.0
# or: strategy = fixed / config.fixed.parallelism = 4`}
      </CodeBlock>

      <CodeBlock language="java" title="Per-Class Overrides and Resource Locks">
{`// This class is not thread-safe — pin it to one thread regardless of config
@Execution(ExecutionMode.SAME_THREAD)
class LegacyStaticRegistryTest { /* ... */ }

// Opt a fast, independent class into method-level parallelism
@Execution(ExecutionMode.CONCURRENT)
class PriceCalculatorTest { /* ... */ }

// Declare the shared resource instead of serialising everything.
// JUnit runs READ locks concurrently with each other and READ_WRITE exclusively.
@ResourceLock(value = "orders-table", mode = ResourceAccessMode.READ_WRITE)
@Test
void truncatesAndReloadsOrders() { /* ... */ }

@ResourceLock(value = Resources.SYSTEM_PROPERTIES, mode = ResourceAccessMode.READ_WRITE)
@Test
void temporarilyOverridesATimeout() { /* ... */ }
// Built-in keys: SYSTEM_PROPERTIES, SYSTEM_OUT, SYSTEM_ERR, LOCALE, TIME_ZONE`}
      </CodeBlock>

      <CodeBlock language="xml" title="Surefire: Forked JVMs (the Other Layer)">
{`<plugin>
  <artifactId>maven-surefire-plugin</artifactId>
  <configuration>
    <!-- One JVM per available core; 1C means "1 x CPU count". -->
    <forkCount>1C</forkCount>
    <!-- reuseForks=true is the important one: without it you pay a full JVM
         (and Spring context) startup for every single test class. -->
    <reuseForks>true</reuseForks>
    <argLine>-Xmx1g -XX:TieredStopAtLevel=1 -XX:+UseSerialGC</argLine>
    <!-- TieredStopAtLevel=1 skips the C2 JIT: slower steady-state, much faster
         startup. Tests are short-lived, so this is usually a net win. -->
  </configuration>
</plugin>`}
      </CodeBlock>

      <h2>The Shared-State Hazards</h2>
      <p>
        Every flaky-in-parallel test is the same bug in a different costume: two tests
        that both assumed they were alone. The list of things they can collide on is
        short and finite — check it directly rather than re-running until green.
      </p>

      <table>
        <thead>
          <tr>
            <th>Shared Thing</th>
            <th>Symptom</th>
            <th>Fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Database rows and sequences</td>
            <td>Unique-constraint violations; counts off by exactly one other test&apos;s data</td>
            <td>Per-worker schema or database; transaction rollback; randomised keys</td>
          </tr>
          <tr>
            <td>Fixed ports (<code>8080</code>, a mock server, a container mapping)</td>
            <td><code>EADDRINUSE</code>, or a request answered by the wrong test&apos;s server</td>
            <td>Port 0 / ephemeral ports: <code>webEnvironment = RANDOM_PORT</code>, <code>listen(0)</code></td>
          </tr>
          <tr>
            <td>Temp files and fixed paths (<code>/tmp/output.csv</code>)</td>
            <td>Truncated or interleaved file content; passes alone, fails in the suite</td>
            <td><code>@TempDir</code> (JUnit), <code>fs.mkdtemp()</code>, a per-worker directory</td>
          </tr>
          <tr>
            <td>Statics, singletons, module-level caches</td>
            <td>Order-dependent failures; the second test sees the first&apos;s state</td>
            <td>Reset in setup; process isolation; avoid mutable statics in test-reachable code</td>
          </tr>
          <tr>
            <td>The system clock</td>
            <td>Midnight, month-end, and DST failures; a &quot;10ms&quot; assertion that fails on a loaded box</td>
            <td>Injectable <code>Clock</code>, fake timers — see Testing Best Practices</td>
          </tr>
          <tr>
            <td>Environment variables, system properties, locale, timezone</td>
            <td>Nonsense failures in an <em>unrelated</em> test running at the same moment</td>
            <td><code>@ResourceLock</code> on the built-in keys; <code>vi.stubEnv</code>; never mutate globally</td>
          </tr>
          <tr>
            <td>Working directory</td>
            <td>Relative-path reads fail once something calls <code>chdir</code></td>
            <td>Absolute paths from a fixtures root; never <code>chdir</code> in a test</td>
          </tr>
          <tr>
            <td>A shared HTTP mock or in-memory queue</td>
            <td>A handler registered by one test answers another test&apos;s request</td>
            <td>Per-test server instance, or reset handlers in <code>afterEach</code></td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="java" title="Ports and Temp Files, Done Right">
{`@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CheckoutApiTest {

    @LocalServerPort
    int port;                     // whatever the OS handed us — never hardcode 8080

    @TempDir
    Path workDir;                 // JUnit creates and deletes one per test

    @Test
    void writesAnInvoicePdf() throws Exception {
        Path invoice = workDir.resolve("invoice.pdf");   // collision-proof
        invoiceService.render(anOrder().build(), invoice);
        assertTrue(Files.size(invoice) > 0);
    }
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Per-Worker Isolation in Vitest">
{`// Vitest/Jest expose a worker id — the cheapest way to partition a shared
// resource without coordinating between processes.
const workerId = process.env.VITEST_WORKER_ID ?? process.env.JEST_WORKER_ID ?? '1';

// Each worker gets its own database, so DELETE and TRUNCATE are safe and
// tests never see another worker's rows.
export const testDbUrl =
  \`postgres://test:test@localhost:5432/app_test_\${workerId}\`;

// Same trick for anything else that must be unique
export const tmpDir = path.join(os.tmpdir(), \`app-tests-\${workerId}\`);
export const listenPort = 0;   // let the OS choose; read server.address().port`}
      </CodeBlock>

      <h2>Isolation Strategies, Cheapest First</h2>
      <p>
        Isolation and speed pull against each other, and the trick is to buy only as
        much as the layer needs. The Integration Testing lesson introduced transaction
        rollback; here is where each strategy sits once you are running in parallel.
      </p>

      <table>
        <thead>
          <tr>
            <th>Strategy</th>
            <th>Reset Cost</th>
            <th>Parallel-Safe?</th>
            <th>Catch</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Transaction per test, rolled back</td>
            <td>~1ms</td>
            <td>Yes, if each worker has its own connection</td>
            <td>Cannot test commit behaviour, <code>REQUIRES_NEW</code>, or anything on another connection (real HTTP calls, async workers)</td>
          </tr>
          <tr>
            <td><code>TRUNCATE ... RESTART IDENTITY CASCADE</code></td>
            <td>10&ndash;100ms</td>
            <td>Only with a per-worker database</td>
            <td>Grows with table count; needs a maintained table list</td>
          </tr>
          <tr>
            <td>Per-worker schema or database</td>
            <td>Migration cost, once per worker</td>
            <td>Yes — the workhorse for parallel integration suites</td>
            <td>N copies of the schema; migrations must be fast or cached</td>
          </tr>
          <tr>
            <td><code>CREATE DATABASE x TEMPLATE migrated_db</code></td>
            <td>50&ndash;300ms per reset</td>
            <td>Yes</td>
            <td>Postgres-specific; the template must have no open connections</td>
          </tr>
          <tr>
            <td>Fresh container per test class</td>
            <td>0.5&ndash;20s</td>
            <td>Yes, but expensive</td>
            <td>Only worth it for tests that mutate server-level state</td>
          </tr>
          <tr>
            <td>Fresh container per <em>test</em></td>
            <td>0.5&ndash;20s &times; every test</td>
            <td>Yes, and ruinous</td>
            <td>This is how a 90-second suite becomes 40 minutes</td>
          </tr>
        </tbody>
      </table>

      <h3>Fixtures vs Factories</h3>
      <p>
        The other half of isolation is data setup. A <strong>shared fixture</strong> (a
        seeded dataset every test reads) is fast but couples tests to each other — the
        moment one test mutates it, ordering matters. A <strong>factory</strong> builds
        exactly what this test needs and nothing else. Under parallelism the factory
        wins almost every time, because it has no cross-test surface at all.
      </p>

      <CodeBlock language="javascript" title="Seed Once, Mutate Never">
{`// The pragmatic middle ground: an immutable reference dataset seeded once per
// worker (countries, plans, feature flags) plus per-test factories for anything
// a test writes to. Reads are free; writes are always the test's own rows.

// globalSetup.ts — runs once per worker before any test file
export async function setup() {
  await migrate(testDbUrl);
  await seedReferenceData(testDbUrl);   // read-only rows, never mutated
}

// In tests — factories generate unique keys so parallel inserts never collide
test('an order over $50 ships free', async () => {
  const customer = await createCustomer();          // unique email per call
  const order = await createOrder({ customer, total: 75 });

  expect(await shippingCostFor(order.id)).toBe(0);
});`}
      </CodeBlock>

      <InfoBox variant="danger" title="Rollback Silently Fails Through the HTTP Layer">
        Wrapping a test in a rolled-back transaction works only while the code under
        test uses <em>that same connection</em>. Call your own API over HTTP (MockMvc
        with a real server, Supertest, Playwright), hand work to an async executor, or
        use <code>REQUIRES_NEW</code>, and the work happens on a different connection —
        it will not see your uncommitted setup data, and it will not be rolled back at
        the end. That combination produces the worst kind of failure: setup rows the
        code cannot see, plus leftover rows that poison the next test. For those tests,
        use truncation or a per-worker database instead.
      </InfoBox>

      <h2>Containers: Reuse Instead of Recreate</h2>
      <p>
        The <em>Testcontainers &amp; Test Data</em> lesson covered why real containers
        beat H2. The performance question is lifetime. A Postgres container costs
        roughly 0.5&ndash;2 seconds to start and be healthy; a Kafka or Elasticsearch
        container is 5&ndash;20. Do that arithmetic per test method and a suite of 200
        integration tests spends over an hour starting Docker containers.
      </p>

      <table>
        <thead>
          <tr>
            <th>Lifetime</th>
            <th>How</th>
            <th>200-Test Suite (2s/container)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Per test method</td>
            <td>Instance <code>@Container</code> field</td>
            <td>~400s of pure startup</td>
          </tr>
          <tr>
            <td>Per test class</td>
            <td><code>static</code> <code>@Container</code> field</td>
            <td>~40s across 20 classes</td>
          </tr>
          <tr>
            <td>Per JVM / worker</td>
            <td>Singleton container pattern</td>
            <td>~2s &times; number of forks</td>
          </tr>
          <tr>
            <td>Across whole runs</td>
            <td><code>withReuse(true)</code> — local dev only</td>
            <td>~0s after the first run</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="java" title="Singleton Container: One Postgres for the Whole JVM">
{`// Started once, in a static initialiser, and deliberately never stopped —
// Testcontainers' Ryuk sidecar reaps it when the JVM exits.
public abstract class PostgresTestBase {

    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withReuse(true);   // honoured only if reuse is enabled locally

    static {
        POSTGRES.start();               // NOT @Container — we manage the lifetime
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
}

// Every integration test extends this. One container, one Spring context
// configuration -> one context creation, for the entire run.
class OrderRepositoryTest extends PostgresTestBase { /* ... */ }
class InvoiceRepositoryTest extends PostgresTestBase { /* ... */ }`}
      </CodeBlock>

      <InfoBox variant="tip" title="Enabling Reuse Locally">
        <p>
          <code>withReuse(true)</code> does nothing unless the developer opts in on
          their machine — deliberately, so CI never leaves containers running. Add{' '}
          <code>testcontainers.reuse.enable=true</code> to{' '}
          <code>~/.testcontainers.properties</code> and the container survives between
          test runs, turning a 2-second startup into ~0 for every run after the first.
        </p>
        <p>
          The trade: a reused container keeps its data. Your suite must reset state
          itself (truncate or per-run schema) rather than relying on a fresh container —
          which is a good property to have anyway, since it is exactly what makes
          per-worker parallelism safe.
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="One Container per Worker in Vitest">
{`// globalSetup runs once per worker process, not once per file — the right
// place to pay a container startup.
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container;

export async function setup({ provide }) {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  await migrate(container.getConnectionUri());
  provide('dbUrl', container.getConnectionUri());   // read via inject('dbUrl')
}

export async function teardown() {
  await container?.stop();
}

// vitest.config.ts
//   test: { globalSetup: ['./test/globalSetup.ts'] }`}
      </CodeBlock>

      <h2>Hunting Down the Sleeps</h2>
      <p>
        Sleeps are the purest waste in a test suite: time spent doing nothing,
        guaranteed to be either too short (flaky) or too long (slow), usually both on
        different machines. They accumulate because a sleep is the fastest way to make a
        flaky test green, and nobody removes it afterwards.
      </p>

      <CodeBlock language="bash" title="Find Every One of Them">
{`# JS/TS — literal sleeps and Playwright's hard wait
grep -rnE "setTimeout\\(.*(resolve|done)|waitForTimeout\\(" src/ tests/ e2e/

# Long explicit timeouts are sleeps wearing a disguise
grep -rnE "timeout: *[0-9]{4,}|\\{ *timeout: *[0-9]+ *\\}" tests/

# Java
grep -rn "Thread.sleep\\|TimeUnit\\..*\\.sleep\\|awaitTermination" src/test/

# Then sort the suite by duration and look at the top 20 — sleeps sit at the
# top with suspiciously round numbers (exactly 500ms, exactly 2.0s).
npx vitest run --reporter=verbose | sort -t'(' -k2 -rn | head -20`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Replace Waiting-For-Time With Waiting-For-A-Condition">
{`// SLOW AND FLAKY — 500ms every run, and still fails on a loaded CI box
await userEvent.click(saveButton);
await new Promise((r) => setTimeout(r, 500));
expect(screen.getByText('Saved')).toBeInTheDocument();

// FAST AND STABLE — polls, returns the instant the condition holds
await userEvent.click(saveButton);
expect(await screen.findByText('Saved')).toBeInTheDocument();

// Playwright: web-first assertions retry until the timeout, and pass early.
// Never page.waitForTimeout() — it always burns the full duration.
await expect(page.getByRole('status')).toHaveText('Saved');
await expect.poll(() => api.getOrder(id).then((o) => o.status)).toBe('PAID');

// Timer-driven code: control time instead of living through it.
vi.useFakeTimers();
scheduleRetry();
await vi.advanceTimersByTimeAsync(30_000);   // 30s of logic, ~0ms of wall clock
expect(retryHandler).toHaveBeenCalledTimes(3);
vi.useRealTimers();`}
      </CodeBlock>

      <CodeBlock language="java" title="Awaitility and Container Wait Strategies">
{`// SLOW — a guess, padded for safety
Thread.sleep(3000);
assertEquals(Status.PROCESSED, repo.findById(id).orElseThrow().getStatus());

// FAST — polls every 100ms, returns as soon as it is true, fails at 5s
await().atMost(Duration.ofSeconds(5))
       .pollInterval(Duration.ofMillis(100))
       .untilAsserted(() ->
           assertEquals(Status.PROCESSED, repo.findById(id).orElseThrow().getStatus()));

// Same idea for containers: wait for readiness, not for a fixed duration.
new GenericContainer<>("my-service:latest")
        .withExposedPorts(8080)
        .waitingFor(Wait.forHttp("/actuator/health").forStatusCode(200));
// Testcontainers' built-in strategies already do this; a sleep after .start()
// means the wait strategy is wrong, not that the container is slow.`}
      </CodeBlock>

      <h2>Running Less: Selective Tests and Watch Mode</h2>
      <p>
        The fastest test is the one you correctly skipped. Local development should
        almost never run the whole suite — run the tests reachable from what you just
        edited, and let CI run everything.
      </p>

      <CodeBlock language="bash" title="Only the Affected Tests">
{`# Watch mode: re-runs only the tests whose module graph touched your edit
npx vitest              # watch is the default
npx jest --watch        # changed files vs git HEAD; --watchAll for everything

# One-shot, on a branch: only what changed since main
npx jest --changedSince=origin/main
npx vitest related src/pricing/discount.ts --run

# Given a source file, which tests cover it?
npx jest --findRelatedTests src/pricing/discount.ts

# Java — narrow the run down to a class, a method, or a tag
mvn test -Dtest=OrderServiceTest#rejectsOverdraft
./gradlew test --tests '*OrderService*'
mvn test -Dgroups=fast              # JUnit 5 @Tag("fast")

# Monorepo: only the packages affected by the diff, with caching
npx turbo run test --filter=...[origin/main]
npx nx affected --target=test`}
      </CodeBlock>

      <InfoBox variant="warning" title="Affected-Test Detection Has Blind Spots">
        Change detection follows the <em>static import graph</em>. It cannot see a
        dependency expressed through a config file, an environment variable, a database
        migration, a JSON fixture, a dynamic <code>import()</code>, or a service your
        tests call over HTTP. That is fine as a local accelerator and dangerous as a CI
        gate — which is why the standard split is affected-only on every save, full
        suite before merge.
      </InfoBox>

      <h2>The CI Dimension</h2>
      <p>
        CI has a lever local development does not: more machines. Sharding splits one
        suite across parallel jobs, and it is usually the difference between a
        twenty-minute and a four-minute pipeline.
      </p>

      <CodeBlock language="yaml" title="Sharding a Suite Across Jobs">
{`jobs:
  test:
    strategy:
      fail-fast: false          # let every shard report; do not hide 3 failures
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v7          # v4 runs on node20, which GitHub
      - uses: actions/setup-node@v7         # removes from runners 2026-09-16
        with:
          node-version: 24     # Active LTS; Node 20 went EOL April 2026
          cache: npm           # dependency cache: minutes -> seconds
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx vitest run --shard=\${{ matrix.shard }}/4 --reporter=junit \\
               --outputFile=results-\${{ matrix.shard }}.xml
      # Jest:       npx jest --shard=\${{ matrix.shard }}/4
      # Playwright: npx playwright test --shard=\${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v7
        if: always()
        with:
          name: results-\${{ matrix.shard }}
          path: results-*.xml`}
      </CodeBlock>

      <InfoBox variant="tip" title="Shard by Duration, Not by File Count">
        Naive sharding splits the file list evenly, so the shard that happens to get
        your three slowest E2E specs takes four times as long as the others — and your
        pipeline is only as fast as its slowest shard. Feed last run&apos;s timing report
        back in so shards are balanced by <em>duration</em>. Playwright and most CI
        providers support this directly; with Vitest or Jest you can partition the file
        list yourself from the JSON reporter output. Balanced shards routinely cut
        wall-clock time by a third with no other change.
      </InfoBox>

      <h3>Caching</h3>
      <ul>
        <li>
          <strong>Dependencies</strong> — <code>~/.npm</code> and <code>~/.m2</code>,
          keyed on the lockfile. The cheapest minutes you will ever save.
        </li>
        <li>
          <strong>Build outputs</strong> — the Gradle build cache and remote cache;
          Turborepo/Nx task caches. An unchanged package should not be rebuilt or
          retested at all.
        </li>
        <li>
          <strong>Browsers and container images</strong> — Playwright browsers and
          Docker layers are hundreds of megabytes downloaded on every cold run.
        </li>
        <li>
          <strong>Transform caches</strong> — Jest&apos;s <code>cacheDirectory</code> and
          Vite&apos;s <code>node_modules/.vite</code> survive across CI runs if you cache
          them, removing most of the transform cost.
        </li>
      </ul>

      <h3>Fail-Fast vs Full Signal</h3>
      <p>
        <code>--bail</code> stops at the first failure. It saves compute and it costs
        you information: you learn about one failure, fix it, push, and discover the
        second one nine minutes later. That serialised loop is usually more expensive in
        human time than the machine time you saved. A workable policy:
      </p>
      <table>
        <thead>
          <tr>
            <th>Stage</th>
            <th>Setting</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Local watch mode</td>
            <td><code>--bail=1</code></td>
            <td>You are fixing one thing; the first failure is the one you want</td>
          </tr>
          <tr>
            <td>Lint / typecheck / compile</td>
            <td>Fail fast</td>
            <td>Nothing downstream can be trusted, and it costs seconds to retry</td>
          </tr>
          <tr>
            <td>Unit and integration on a PR</td>
            <td>Run everything</td>
            <td>One push should tell you everything that is broken</td>
          </tr>
          <tr>
            <td>E2E on a PR</td>
            <td>Run all shards, <code>retries: 1</code></td>
            <td>Partial E2E results are misleading; a single retry absorbs infra noise <em>and</em> flags the flake</td>
          </tr>
          <tr>
            <td>Nightly / main branch</td>
            <td>Everything, no bail, no retries</td>
            <td>This is your honest flakiness measurement</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="danger" title="Retries Are Anaesthetic">
        <code>retries: 2</code> in CI turns a flaky suite green, which is exactly why it
        is dangerous. Retry only if the retried test is <em>reported</em> as flaky and
        that count is tracked over time. A retry policy with no visibility is a
        mechanism for silently accumulating flakes until the suite means nothing — see
        the flakiness section of Testing Best Practices for how to root-cause them.
      </InfoBox>

      <h2>Budgets Worth Holding To</h2>
      <InfoBox variant="success" title="Rough Targets for a Healthy Suite">
        <ul>
          <li><strong>A single unit test:</strong> under 10ms. Above that, something is doing I/O you did not intend.</li>
          <li><strong>The whole unit suite:</strong> under 10&ndash;30 seconds, run on every save.</li>
          <li><strong>Integration suite:</strong> a few minutes locally, parallelised in CI.</li>
          <li><strong>E2E on a PR:</strong> under 10 minutes wall-clock after sharding.</li>
          <li><strong>Total PR feedback:</strong> under 15 minutes. Past that, people stop waiting and start context-switching.</li>
        </ul>
      </InfoBox>
      <p>
        Treat these as a ratchet: fail the build if the unit suite exceeds its budget,
        the same way you would fail it on a lint error. A suite that has a budget stays
        fast; one that does not gets one second slower every week and is unfixable in a
        year.
      </p>

      <h2>Key Takeaways</h2>
      <ul>
        <li>Assertions are never the cost — startup, transforms, framework bootstrap, containers and waiting are</li>
        <li>Measure per-test and per-file timings before changing anything (<code>--reporter=verbose</code>, surefire reports, the Gradle HTML report)</li>
        <li>Amortise fixed costs (share the Spring context, reuse forks and containers); remove marginal costs (sleeps, real network, heavy <code>beforeEach</code>)</li>
        <li>Count your Spring contexts — every distinct configuration is another multi-second boot</li>
        <li>JS runners parallelise by file across worker processes; JUnit 5 parallelises on threads inside one JVM, so statics are shared</li>
        <li>More workers is not monotonically faster, and <code>os.cpus()</code> lies inside CI containers</li>
        <li>Parallel flakiness is always shared state: DB rows, fixed ports, temp files, statics, the clock, env vars</li>
        <li>Prefer per-worker databases and factories over shared mutable fixtures; rollback isolation breaks across connections</li>
        <li>Containers belong per class or per worker, never per test; <code>withReuse(true)</code> makes local runs near-instant</li>
        <li>Replace every sleep with a condition — <code>findBy*</code>, <code>expect.poll</code>, Awaitility, wait strategies, fake timers</li>
        <li>Run affected tests locally, the full suite in CI; shard by duration and cache dependencies, browsers and transforms</li>
        <li>Give the suite a time budget and fail the build when it regresses</li>
      </ul>
    </LessonLayout>
  );
}
