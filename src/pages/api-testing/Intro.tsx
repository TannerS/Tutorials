import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="The API Testing Landscape"
      sectionId="api-testing"
      lessonIndex={0}
      prev={null}
      next={{ path: '/api-testing/controllers', label: 'Testing Controllers & Responses' }}
    >
      <h2>What This Section Covers — and What It Doesn&apos;t</h2>
      <p>
        This site already has two places that touch backend testing: <strong>Testing
        Strategies</strong> (general philosophy — the testing pyramid, mocking taxonomy,
        Testcontainers, contract testing, TDD/BDD) and <strong>Spring Boot → Testing in
        Spring Boot</strong> (the annotation cheat sheet — <code>@WebMvcTest</code>,{' '}
        <code>@DataJpaTest</code>, <code>@SpringBootTest</code>, WireMock, <code>@JsonTest</code>).
        Both are good references and this section deliberately does not re-explain them.
      </p>

      <InfoBox variant="note" title="Cross-References, Not Rehashes">
        <ul>
          <li>Testing pyramid, TDD/BDD, mocking taxonomy → <strong>Testing Strategies → Testing Pyramid &amp; Philosophy</strong></li>
          <li>Stubs vs mocks vs fakes, Mockito basics → <strong>Testing Strategies → Mocking &amp; Test Doubles</strong></li>
          <li><code>@WebMvcTest</code> / <code>@DataJpaTest</code> slice basics, <code>@SpringBootTest</code> → <strong>Spring Boot → Testing in Spring Boot</strong></li>
          <li>Real-database testing with Docker → <strong>Testing Strategies → Testcontainers &amp; Test Data</strong></li>
          <li>Consumer-driven contract testing with Pact → <strong>Testing Strategies → Contract &amp; Property-Based Testing</strong></li>
        </ul>
        This section is the <strong>hands-on, API-layer companion</strong> — the same role
        React Testing plays for components. It goes deep on the things those pages only
        touch in passing: response assertions, content negotiation, validation error
        shapes, securing endpoints in tests, and black-box tools that test the wire
        format instead of Java objects.
      </InfoBox>

      <h2>Where API Testing Sits in the Pyramid</h2>
      <p>
        Every layer of the testing pyramid has an API-shaped version. A pure unit test
        checks a service method with mocked collaborators. A <strong>controller slice
        test</strong> checks that HTTP requests map to the right method calls and that
        responses are shaped correctly. A <strong>black-box test</strong> checks the
        actual bytes on the wire against a running server — no JVM internals in sight.
      </p>

      <FlowChart
        title="API Testing, White-Box to Black-Box"
        chart={"graph LR\n  U[\"Unit Test\\nService method,\\nmocked deps\"] --> S[\"Slice Test\\n@WebMvcTest + MockMvc\\nJVM in-process\"]\n  S --> I[\"Integration Test\\n@SpringBootTest\\nreal wiring\"]\n  I --> B[\"Black-Box Test\\nREST Assured / Postman\\nreal HTTP over the wire\"]"}
      />

      <h2>Three Tools, Three Jobs</h2>
      <p>
        You&apos;ll reach for a different tool depending on whether you have access to the
        Spring context, whether the endpoint is blocking (MVC) or reactive (WebFlux),
        and whether you want to test in-process or against a real running server.
      </p>

      <table>
        <thead>
          <tr>
            <th>Tool</th>
            <th>Stack</th>
            <th>Runs Against</th>
            <th>Best For</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>MockMvc</code></td>
            <td>Spring MVC (blocking)</td>
            <td>In-process, no real HTTP/socket</td>
            <td>Fast controller slice tests, <code>@WebMvcTest</code></td>
          </tr>
          <tr>
            <td><code>WebTestClient</code></td>
            <td>Spring WebFlux (reactive) — also works against MVC</td>
            <td>In-process (bindToController) or real server (bindToServer)</td>
            <td>Reactive endpoints, streaming responses, async assertions</td>
          </tr>
          <tr>
            <td><code>TestRestTemplate</code></td>
            <td>Any Spring Boot app</td>
            <td>Real HTTP against <code>RANDOM_PORT</code></td>
            <td>Full-stack smoke tests, filters/interceptors included</td>
          </tr>
          <tr>
            <td>REST Assured</td>
            <td>Framework-agnostic</td>
            <td>Real HTTP against any running server</td>
            <td>Black-box API testing, non-Spring services, readable given/when/then DSL</td>
          </tr>
          <tr>
            <td>Postman / Newman</td>
            <td>Framework-agnostic</td>
            <td>Real HTTP, manual or CLI-automated</td>
            <td>Exploratory testing, cross-team API contracts, non-JVM CI checks</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="tip" title="Rule of Thumb">
        If you&apos;re testing <em>your own controller&apos;s</em> behavior and want speed, use{' '}
        <code>MockMvc</code> (or <code>WebTestClient</code> for reactive). If you&apos;re
        testing the <em>deployed artifact</em> as a black box — the way a consumer or a
        QA engineer would hit it — reach for REST Assured or Postman/Newman.
      </InfoBox>

      <h2>MockMvc: A 60-Second Recap</h2>
      <p>
        You&apos;ve seen the basics in <strong>Testing in Spring Boot</strong>. As a quick
        anchor before we go deeper in the next lesson:
      </p>

      <CodeBlock language="java" title="MockMvc Skeleton">
{`@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean OrderService orders;

    @Test
    void returnsOrderById() throws Exception {
        when(orders.findById("ORD-1")).thenReturn(new OrderDto("ORD-1", "PAID"));

        mvc.perform(get("/api/orders/{id}", "ORD-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PAID"));
    }
}`}
      </CodeBlock>

      <h2>WebTestClient: The Reactive Counterpart</h2>
      <p>
        If your controllers return <code>Mono&lt;T&gt;</code> / <code>Flux&lt;T&gt;</code>{' '}
        (Spring WebFlux), <code>MockMvc</code> doesn&apos;t apply — it assumes a blocking
        servlet request/response cycle. <code>WebTestClient</code> is built for the
        reactive pipeline and offers a fluent assertion API that reads similarly.
      </p>

      <CodeBlock language="java" title="WebTestClient — Bound Directly to a Controller">
{`@WebFluxTest(ProductController.class)
class ProductControllerTest {

    @Autowired WebTestClient client;
    @MockitoBean ProductService products;

    @Test
    void returnsProductStream() {
        when(products.findAll()).thenReturn(Flux.just(
            new ProductDto("P1", "Widget"),
            new ProductDto("P2", "Gadget")
        ));

        client.get().uri("/api/products")
            .accept(MediaType.APPLICATION_NDJSON)
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(ProductDto.class)
            .hasSize(2);
    }
}`}
      </CodeBlock>

      <p>
        <code>WebTestClient</code> also works against a <em>real, running</em> server —
        useful when you want reactive-style assertions but a full integration test:
      </p>

      <CodeBlock language="java" title="WebTestClient Against a Running Server">
{`@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProductApiIntegrationTest {

    @Autowired WebTestClient webTestClient; // auto-configured to the random port

    @Test
    void createsAndFetchesProduct() {
        webTestClient.post().uri("/api/products")
            .bodyValue(new CreateProductRequest("Widget", "9.99"))
            .exchange()
            .expectStatus().isCreated()
            .expectHeader().exists("Location");
    }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="MockMvc Can Go Reactive Too">
        Since Spring 5.2, <code>MockMvc</code> can wrap a <code>WebTestClient</code> via{' '}
        <code>MockMvcWebTestClient.bindTo(mockMvc)</code>, giving you WebTestClient&apos;s
        fluent syntax on top of MockMvc&apos;s speed for MVC apps that want the nicer
        assertion chain. Most teams just pick one style and stay consistent.
      </InfoBox>

      <h2>White-Box vs Black-Box Testing</h2>
      <p>
        Every tool above falls into one of two philosophies, and confusing them is a
        common source of false confidence:
      </p>

      <FlowChart
        title="White-Box vs Black-Box"
        chart={"graph TD\n  Q[\"How does the test know\\nwhat to expect?\"] --> WB[\"White-Box\\n(MockMvc, WebTestClient)\"]\n  Q --> BB[\"Black-Box\\n(REST Assured, Postman)\"]\n  WB --> WBD[\"Knows internals:\\nSpring beans, DTOs,\\nSpring's serialization\"]\n  BB --> BBD[\"Only knows the contract:\\nraw JSON, real HTTP,\\nno JVM classes involved\"]"}
      />

      <InfoBox variant="warning" title="A White-Box Test Can Still Miss Real Bugs">
        A <code>MockMvc</code> test that asserts against a Java DTO field will pass even
        if a Jackson serialization quirk or a reverse proxy header rewrite would break
        the response for a real client. Reserve at least a handful of black-box tests
        (REST Assured or Postman/Newman, covered in the last lesson of this section) for
        your most critical endpoints — they catch what in-process tests structurally cannot.
      </InfoBox>

      <h2>What&apos;s Ahead</h2>
      <ul>
        <li><strong>Testing Controllers &amp; Responses</strong> — status codes, headers, content negotiation, pagination, multipart uploads</li>
        <li><strong>Testing Validation &amp; Error Handling</strong> — bad input, <code>@ExceptionHandler</code> testing, RFC 9457 <code>ProblemDetail</code> assertions</li>
        <li><strong>Testing Secured Endpoints</strong> — <code>@WithMockUser</code>, mocking JWTs, 401 vs 403, CSRF, method security</li>
        <li><strong>API Testing Patterns &amp; CI</strong> — REST Assured, Postman/Newman, parallel execution, flaky test mitigation</li>
      </ul>

      <InteractiveChallenge
        question={"You need to test a Spring WebFlux controller that returns Flux<ProductDto>. Which tool is purpose-built for this?"}
        options={[
          "MockMvc — it works identically for reactive and blocking controllers",
          "WebTestClient — designed for the reactive request/response pipeline",
          "TestRestTemplate — the only option for streaming responses",
          "None of these; reactive controllers can't be tested in isolation"
        ]}
        correctIndex={1}
        explanation="MockMvc assumes a blocking servlet request/response cycle and doesn't understand Mono/Flux. WebTestClient was built specifically for WebFlux's reactive pipeline, though it can also be pointed at a real running server (blocking or reactive) for full integration tests."
        language="java"
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>This section is the hands-on API layer companion to Testing Strategies and Spring Boot → Testing — it cross-references rather than repeats those pages</li>
        <li><code>MockMvc</code> tests blocking MVC controllers in-process; <code>WebTestClient</code> is the reactive (WebFlux) equivalent and can also hit a real server</li>
        <li>REST Assured and Postman/Newman are black-box tools — they exercise the real HTTP contract with no JVM knowledge</li>
        <li>White-box tests are fast and precise but can miss serialization/proxy-layer bugs that only a real request over the wire reveals</li>
      </ul>
    </LessonLayout>
  );
}
