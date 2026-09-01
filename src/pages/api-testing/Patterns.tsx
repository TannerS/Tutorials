import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Patterns() {
  return (
    <LessonLayout
      title="API Testing Patterns & CI"
      sectionId="api-testing"
      lessonIndex={4}
      prev={{ path: '/api-testing/security', label: 'Testing Secured Endpoints' }}
      next={null}
    >
      <h2>Stepping Outside the JVM</h2>
      <p>
        Every tool so far — MockMvc, WebTestClient, method security tests — runs inside
        the same JVM as the code under test. That&apos;s fast and precise, but it can&apos;t catch
        bugs introduced by a reverse proxy, a load balancer stripping headers, or a
        Jackson config difference between your test classpath and the deployed jar. This
        lesson covers black-box tools that test the actual deployed artifact over real
        HTTP, plus the CI concerns specific to running API tests at scale.
      </p>

      <h2>REST Assured — Black-Box Testing with a Readable DSL</h2>
      <p>
        REST Assured is framework-agnostic: it doesn&apos;t know or care that the server is
        Spring Boot. It sends real HTTP requests to a real running server and asserts on
        the real response. Its given/when/then DSL reads close to plain English.
      </p>

      <CodeBlock language="java" title="Maven Dependency">
{`<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <version>5.4.0</version>
    <scope>test</scope>
</dependency>`}
      </CodeBlock>

      <CodeBlock language="java" title="REST Assured Against a Running Spring Boot Server">
{`@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderApiBlackBoxTest {

    @LocalServerPort int port;

    @BeforeEach
    void setUp() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
    }

    @Test
    void createsAndFetchesOrder() {
        String orderId =
            given()
                .contentType(ContentType.JSON)
                .body("""
                    { "customerEmail": "alice@test.com", "items": ["SKU-1"] }
                    """)
            .when()
                .post("/api/orders")
            .then()
                .statusCode(201)
                .header("Location", notNullValue())
                .body("status", equalTo("PLACED"))
                .extract().path("id");

        given()
            .pathParam("id", orderId)
        .when()
            .get("/api/orders/{id}")
        .then()
            .statusCode(200)
            .body("status", equalTo("PLACED"))
            .body("customerEmail", equalTo("alice@test.com"));
    }

    @Test
    void rejectsInvalidEmailWith400() {
        given()
            .contentType(ContentType.JSON)
            .body("{ \\"customerEmail\\": \\"not-an-email\\", \\"items\\": [] }")
        .when()
            .post("/api/orders")
        .then()
            .statusCode(400)
            .body("errors.field", hasItems("customerEmail", "items"));
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="REST Assured Isn't Tied to Spring">
        Because REST Assured only cares about HTTP, it works identically against a
        Node/Express service, a Go binary, or a third-party API you don&apos;t control. It&apos;s
        the same tool whether you&apos;re testing your own deployed jar in CI or writing a
        smoke test against a partner&apos;s staging environment.
      </InfoBox>

      <h2>Postman / Newman — Cross-Team, CLI-Automated API Checks</h2>
      <p>
        Postman collections are the common ground between backend engineers, QA, and
        API consumers who don&apos;t write Java — a collection is just a documented,
        runnable set of requests with assertions attached, shareable outside the
        codebase. <strong>Newman</strong> is Postman&apos;s CLI runner, which turns a
        collection into something CI can execute headlessly.
      </p>

      <CodeBlock language="bash" title="Running a Postman Collection with Newman">
{`# Install once
npm install -g newman

# Run a collection against a target environment
newman run orders-api.postman_collection.json \\
  --environment staging.postman_environment.json \\
  --reporters cli,junit \\
  --reporter-junit-export newman-results.xml`}
      </CodeBlock>

      <CodeBlock language="javascript" title="A Postman Test Script (inside the collection JSON)">
{`// Attached to the "POST /api/orders" request as a "Tests" script
pm.test("Status code is 201", () => {
    pm.response.to.have.status(201);
});

pm.test("Response has a Location header", () => {
    pm.response.to.have.header("Location");
});

pm.test("Order status is PLACED", () => {
    const body = pm.response.json();
    pm.expect(body.status).to.eql("PLACED");
});

// Chain requests: capture the created id for the next request in the collection
pm.collectionVariables.set("orderId", pm.response.json().id);`}
      </CodeBlock>

      <InfoBox variant="info" title="Postman/Newman vs REST Assured — When to Reach for Which">
        <ul>
          <li><strong>REST Assured</strong> — lives in your Java test suite, runs in the same CI job as your unit tests, best when the whole team writes Java</li>
          <li><strong>Postman/Newman</strong> — lives independently of any codebase language, best for cross-team contracts, manual exploratory testing before automating, and checks that need to run against APIs your team doesn&apos;t own the source for</li>
        </ul>
        Many teams use both: REST Assured for the fast feedback loop in CI, Postman for
        exploratory testing and as living, shareable API documentation.
      </InfoBox>

      <h2>Validating Against the OpenAPI Contract</h2>
      <p>
        If you publish an OpenAPI spec, a schema-validation test catches drift between
        the documented contract and the actual response shape — the kind of bug that
        breaks generated client SDKs silently.
      </p>

      <CodeBlock language="java" title="REST Assured + OpenAPI Schema Validation">
{`<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>json-schema-validator</artifactId>
    <version>5.4.0</version>
    <scope>test</scope>
</dependency>`}
      </CodeBlock>

      <CodeBlock language="java" title="Asserting the Response Matches Its Schema">
{`@Test
void orderResponseMatchesPublishedSchema() {
    given()
        .pathParam("id", "ORD-1")
    .when()
        .get("/api/orders/{id}")
    .then()
        .statusCode(200)
        .body(matchesJsonSchemaInClasspath("schemas/order-response.schema.json"));
}`}
      </CodeBlock>

      <h2>Parallel Test Execution</h2>
      <p>
        API/integration tests are slow enough that running them serially in CI becomes a
        bottleneck fast. JUnit 5 supports parallel execution, but it introduces
        isolation problems that pure unit tests never hit — shared databases, shared
        ports, shared static container fields.
      </p>
      <p>
        The properties below are repeated here only so this lesson stands on its own. What
        each knob does, how to pick a thread count, and why adding workers can make a suite{' '}
        <em>slower</em> belong to <strong>Testing Strategies → Test Performance &amp;
        Parallelization</strong>. What follows is the part that is genuinely specific to
        HTTP-level tests: the three things that break the moment two API test classes run
        at the same time.
      </p>

      <CodeBlock language="properties" title="junit-platform.properties — Enabling Parallelism">
{`junit.jupiter.execution.parallel.enabled = true
junit.jupiter.execution.parallel.mode.default = concurrent
junit.jupiter.execution.parallel.mode.classes.default = concurrent
junit.jupiter.execution.parallel.config.strategy = dynamic
junit.jupiter.execution.parallel.config.dynamic.factor = 1.0`}
      </CodeBlock>

      <FlowChart
        title="What Breaks When API Tests Run in Parallel"
        chart={"graph TD\n  P[\"Parallel Test Classes\"] --> DB[\"Shared test database\\n→ row-level collisions\"]\n  P --> PORT[\"Fixed server port\\n→ bind conflicts\"]\n  P --> CTR[\"One static container\\nshared across classes\\n→ hidden state leaks\"]\n  DB --> FIX1[\"Fix: per-class schema\\nor unique key prefixes\"]\n  PORT --> FIX2[\"Fix: RANDOM_PORT,\\nTestcontainers dynamic ports\"]\n  CTR --> FIX3[\"Fix: @DynamicPropertySource\\nper test class, or a\\nreusable container pool\"]"}
      />

      <InfoBox variant="warning" title="RANDOM_PORT Is Not Optional Once You Parallelize">
        A fixed port (<code>WebEnvironment.DEFINED_PORT</code> or a hardcoded{' '}
        <code>server.port</code>) works fine for one test class at a time but breaks
        instantly under parallel execution — two classes racing to bind port 8080. Use{' '}
        <code>@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)</code>{' '}
        everywhere API tests run against a real server, no exceptions.
      </InfoBox>

      <CodeBlock language="java" title="Isolating Test Data Between Parallel Classes">
{`// Each test class gets a unique prefix for any data it writes, avoiding
// collisions with other classes hitting the same shared Testcontainers instance.
@SpringBootTest
class OrderApiTest {
    private static final String PREFIX = "OrderApiTest-" + UUID.randomUUID();

    @Test
    void createsOrder() {
        String email = PREFIX + "-alice@test.com";
        // ... use 'email' as the unique key for this test's data
    }
}`}
      </CodeBlock>

      <h2>Flaky Test Mitigation for API Tests</h2>
      <p>
        API tests introduce timing sources that pure unit tests don&apos;t have: network
        latency, async processing, eventual consistency after a write. Flakiness here
        has specific, fixable causes rather than being an unavoidable cost.
      </p>

      <table>
        <thead>
          <tr>
            <th>Symptom</th>
            <th>Cause</th>
            <th>Fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Test passes locally, fails in CI</td>
            <td>Fixed port conflicts under parallel/shared CI runners</td>
            <td>RANDOM_PORT everywhere; never hardcode a port</td>
          </tr>
          <tr>
            <td>Intermittent 404 right after a POST</td>
            <td>Async write (event-driven projection, cache) not yet visible on read</td>
            <td>Poll with Awaitility instead of a single immediate GET</td>
          </tr>
          <tr>
            <td>Container startup timeout under load</td>
            <td>CI runner resource contention with many parallel Testcontainers</td>
            <td>Container reuse (<code>testcontainers.reuse.enable=true</code>), fewer parallel forks</td>
          </tr>
          <tr>
            <td>Occasional Connection refused</td>
            <td>Test starts firing requests before the app context fully initializes</td>
            <td>Wait on the actuator health endpoint before the first request</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="java" title="Awaitility Instead of Thread.sleep for Eventual Consistency">
{`// FLAKY — arbitrary sleep, too short under load, wastes time when it's not
Thread.sleep(2000);
mvc.perform(get("/api/orders/ORD-1/status")).andExpect(jsonPath("$.status").value("INDEXED"));

// RELIABLE — polls until true or times out, fast when the condition is already met
@Test
void orderBecomesSearchableAfterAsyncIndexing() {
    given().contentType(ContentType.JSON).body(validOrderJson())
        .when().post("/api/orders")
        .then().statusCode(201);

    await()
        .atMost(Duration.ofSeconds(5))
        .pollInterval(Duration.ofMillis(200))
        .untilAsserted(() ->
            given().pathParam("id", "ORD-1")
                .when().get("/api/orders/{id}/status")
                .then().body("status", equalTo("INDEXED"))
        );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Awaitility Over Manual Retry Loops">
        Awaitility (<code>org.awaitility:awaitility</code>) replaces hand-rolled
        while-loops with sleeps. It gives you a clear timeout, a readable failure message
        showing the last assertion failure, and a poll interval — all the things a
        manual retry loop gets wrong by default.
      </InfoBox>

      <h2>CI Pipeline for API Tests</h2>
      <CodeBlock language="yaml" title=".github/workflows/api-tests.yml">
{`name: API Tests
on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7          # v4 runs on node20, which GitHub
      - uses: actions/setup-java@v6         # removes from runners 2026-09-23
        with:
          java-version: 21
          distribution: temurin
          cache: maven

      # Docker is required for Testcontainers-backed integration tests
      - name: Verify Docker is available
        run: docker info

      - name: Run unit + slice tests
        run: mvn -B test

      - name: Run black-box API tests (REST Assured) against a packaged jar
        run: |
          mvn -B spring-boot:build-image
          docker run -d -p 8080:8080 --name api-under-test my-app:latest
          ./scripts/wait-for-health.sh http://localhost:8080/actuator/health
          mvn -B verify -Dtest=*BlackBoxTest -DfailIfNoTests=false

      - name: Run Postman collection with Newman
        run: |
          npm install -g newman
          newman run postman/orders-api.postman_collection.json \\
            --environment postman/ci.postman_environment.json \\
            --reporters cli,junit --reporter-junit-export newman-results.xml

      - uses: actions/upload-artifact@v7
        if: always()
        with:
          name: test-results
          path: |
            target/surefire-reports/
            newman-results.xml`}
      </CodeBlock>

      <h2>Where the Rest of This Fits</h2>
      <InfoBox variant="note" title="Already Covered Elsewhere — Don't Duplicate">
        <ul>
          <li>Consumer-driven contract testing across service boundaries (Pact) → <strong>Testing Strategies → Contract &amp; Property-Based Testing</strong></li>
          <li>Real-database integration testing with Testcontainers (JVM-level setup) → <strong>Testing Strategies → Testcontainers &amp; Test Data</strong> and <strong>Spring Boot → Testing in Spring Boot</strong></li>
          <li>General flaky-test causes and CI staging (lint → unit → integration → e2e) → <strong>Testing Strategies → Testing Best Practices</strong></li>
          <li>Frontend E2E testing against this same API (Playwright) → <strong>Testing Strategies → End-to-End Testing</strong></li>
          <li>The general performance model — what actually costs time in a suite, JUnit/Vitest parallelism knobs, container reuse, sharding and eliminating sleeps → <strong>Testing Strategies → Test Performance &amp; Parallelization</strong></li>
          <li>Deciding which endpoints and cases deserve a test at all, and what to skip → <strong>Testing Strategies → What to Test (and What Not To)</strong></li>
        </ul>
        This lesson only adds what&apos;s specific to API-layer black-box tooling and the
        parallel/flaky concerns unique to running real HTTP tests at CI scale.
      </InfoBox>

      <InteractiveChallenge
        question={"A test does Thread.sleep(2000) then checks if an async-indexed order is searchable. Under CI load the indexing sometimes takes longer, and the test flakes. What's the right fix?"}
        options={[
          "Increase the sleep to 5000ms",
          "Retry the whole test method up to 3 times",
          "Replace the sleep with Awaitility's await().atMost(...).untilAsserted(...) to poll until the condition holds or a timeout is hit",
          "Remove the assertion since async behavior can't be tested reliably"
        ]}
        correctIndex={2}
        explanation="A longer fixed sleep just moves the flakiness threshold rather than fixing it, and wastes time when indexing is fast. Awaitility polls repeatedly up to a bounded timeout, succeeding as soon as the condition is true and failing with a clear message if it never is — the correct tool for eventual-consistency assertions."
        language="java"
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>REST Assured tests the real deployed artifact over HTTP with a readable given/when/then DSL — framework-agnostic, catches what in-process tests structurally can't</li>
        <li>Postman/Newman collections are shareable outside the codebase and automate via CLI in CI — complementary to REST Assured, not a replacement</li>
        <li>Validate responses against a published OpenAPI/JSON schema to catch contract drift before it breaks generated clients</li>
        <li>Parallel test execution requires RANDOM_PORT everywhere and unique test-data prefixes — fixed ports and shared static state break instantly</li>
        <li>Use Awaitility instead of Thread.sleep for eventual-consistency assertions — bounded, fast, and gives a clear failure message</li>
        <li>A CI pipeline for API tests typically layers unit/slice tests, black-box tests against a packaged artifact, and a Postman/Newman run</li>
      </ul>
    </LessonLayout>
  );
}
