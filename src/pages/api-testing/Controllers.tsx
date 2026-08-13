import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Controllers() {
  return (
    <LessonLayout
      title="Testing Controllers & Responses"
      sectionId="api-testing"
      lessonIndex={1}
      prev={{ path: '/api-testing/intro', label: 'The API Testing Landscape' }}
      next={{ path: '/api-testing/validation', label: 'Testing Validation & Error Handling' }}
    >
      <h2>Beyond Status Code and Body</h2>
      <p>
        A controller slice test that only checks <code>status().isOk()</code> and one{' '}
        <code>jsonPath</code> is testing a fraction of the contract. A real HTTP response
        carries status code, headers, content type, and body — and clients depend on all
        four. This lesson works through the response surface area that&apos;s easy to skip.
      </p>

      <FlowChart
        title="The Full Response Contract"
        chart={"graph TD\n  R[\"HTTP Response\"] --> SC[\"Status Code\\n2xx/4xx/5xx semantics\"]\n  R --> H[\"Headers\\nLocation, ETag, Cache-Control\"]\n  R --> CT[\"Content-Type\\nnegotiated format\"]\n  R --> B[\"Body\\nshape, types, nesting\"]"}
      />

      <h2>Status Code Assertions, Precisely</h2>
      <p>
        Don&apos;t just assert <code>isOk()</code> everywhere — match the status to the
        semantic the endpoint actually promises. MockMvc&apos;s <code>status()</code> matcher
        has named methods for the full range.
      </p>

      <CodeBlock language="java" title="Status Code Matchers">
{`@Test
void createReturns201Created() throws Exception {
    mvc.perform(post("/api/orders")
            .contentType(APPLICATION_JSON)
            .content(validOrderJson()))
        .andExpect(status().isCreated());          // 201, not 200
}

@Test
void deleteReturns204NoContent() throws Exception {
    mvc.perform(delete("/api/orders/{id}", "ORD-1"))
        .andExpect(status().isNoContent())          // 204
        .andExpect(content().string(""));           // and an empty body
}

@Test
void putOnMissingResourceReturns404() throws Exception {
    mvc.perform(put("/api/orders/{id}", "UNKNOWN")
            .contentType(APPLICATION_JSON)
            .content(validOrderJson()))
        .andExpect(status().isNotFound());
}

@Test
void unsupportedMethodReturns405() throws Exception {
    mvc.perform(patch("/api/orders/{id}", "ORD-1"))  // controller has no PATCH mapping
        .andExpect(status().isMethodNotAllowed())
        .andExpect(header().exists("Allow"));        // RFC 9110 requires this header on a 405
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="POST Should (Usually) Return 201, Not 200">
        A common review-comment-worthy bug: a <code>POST</code> that creates a resource
        but returns <code>200 OK</code> instead of <code>201 Created</code>. Write the
        test for <code>isCreated()</code> before you write the controller — it forces the
        right status code from day one. See API Design → HTTP Methods &amp; Status Codes
        for the full semantics reference.
      </InfoBox>

      <h2>Header Assertions</h2>
      <p>
        Headers carry contract information the body doesn&apos;t: where a created resource
        lives, whether a cached response is still valid, what content type was actually
        negotiated.
      </p>

      <CodeBlock language="java" title="Location, ETag, and Cache-Control">
{`@Test
void createSetsLocationHeader() throws Exception {
    when(orders.place(any())).thenReturn(new OrderDto("ORD-99", "PLACED"));

    mvc.perform(post("/api/orders")
            .contentType(APPLICATION_JSON)
            .content(validOrderJson()))
        .andExpect(status().isCreated())
        .andExpect(header().string("Location", endsWith("/api/orders/ORD-99")));
}

@Test
void getReturnsETagForCaching() throws Exception {
    when(orders.findById("ORD-1")).thenReturn(new OrderDto("ORD-1", "PLACED"));

    mvc.perform(get("/api/orders/{id}", "ORD-1"))
        .andExpect(status().isOk())
        .andExpect(header().exists("ETag"))
        .andExpect(header().string("Cache-Control", "max-age=60, must-revalidate"));
}

@Test
void conditionalGetReturns304WhenNotModified() throws Exception {
    String etag = "\\"abc123\\"";
    when(orders.findById("ORD-1")).thenReturn(new OrderDto("ORD-1", "PLACED"));

    mvc.perform(get("/api/orders/{id}", "ORD-1")
            .header("If-None-Match", etag))
        .andExpect(status().isNotModified());
}`}
      </CodeBlock>

      <h2>Content Negotiation</h2>
      <p>
        Endpoints that support multiple representations (JSON and XML, or versioned
        media types) must be tested against the <code>Accept</code> header, not just the
        default. This is the part of the contract that&apos;s invisible if you only ever
        curl without headers.
      </p>

      <CodeBlock language="java" title="Testing Accept-Header-Driven Content Negotiation">
{`@Test
void respondsWithJsonByDefault() throws Exception {
    mvc.perform(get("/api/orders/{id}", "ORD-1"))
        .andExpect(content().contentType(MediaType.APPLICATION_JSON));
}

@Test
void respondsWithXmlWhenRequested() throws Exception {
    mvc.perform(get("/api/orders/{id}", "ORD-1")
            .accept(MediaType.APPLICATION_XML))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.APPLICATION_XML))
        .andExpect(xpath("/order/status").string("PLACED"));
}

@Test
void rejectsUnsupportedAcceptTypeWith406() throws Exception {
    mvc.perform(get("/api/orders/{id}", "ORD-1")
            .accept(MediaType.APPLICATION_PDF))
        .andExpect(status().isNotAcceptable());   // 406
}

@Test
void rejectsUnsupportedContentTypeWith415() throws Exception {
    mvc.perform(post("/api/orders")
            .contentType(MediaType.TEXT_PLAIN)     // controller only accepts JSON
            .content("not json"))
        .andExpect(status().isUnsupportedMediaType());  // 415
}`}
      </CodeBlock>

      <InfoBox variant="info" title="406 vs 415 — Don't Mix Them Up">
        <strong>406 Not Acceptable</strong> means the server can&apos;t produce a response in
        any format the client&apos;s <code>Accept</code> header allows. <strong>415
        Unsupported Media Type</strong> means the server can&apos;t parse the request body
        because of its <code>Content-Type</code>. They&apos;re opposite directions of the
        same negotiation and worth testing separately.
      </InfoBox>

      <h2>Query Parameters: Pagination and Sorting</h2>
      <CodeBlock language="java" title="Testing Paginated, Sorted Endpoints">
{`@Test
void returnsPagedResultsWithMetadata() throws Exception {
    Page<OrderDto> page = new PageImpl<>(
        List.of(new OrderDto("ORD-1", "PLACED"), new OrderDto("ORD-2", "PAID")),
        PageRequest.of(0, 2), 10);
    when(orders.findAll(any(Pageable.class))).thenReturn(page);

    mvc.perform(get("/api/orders")
            .param("page", "0")
            .param("size", "2")
            .param("sort", "createdAt,desc"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content", hasSize(2)))
        .andExpect(jsonPath("$.totalElements").value(10))
        .andExpect(jsonPath("$.totalPages").value(5))
        .andExpect(jsonPath("$.number").value(0));
}

@Test
void rejectsNegativePageSizeWith400() throws Exception {
    mvc.perform(get("/api/orders").param("size", "-1"))
        .andExpect(status().isBadRequest());
}

@Test
void filtersByQueryParameter() throws Exception {
    when(orders.findByStatus("PAID")).thenReturn(List.of(new OrderDto("ORD-2", "PAID")));

    // A List is serialized as a top-level JSON array, so the path is $[*] —
    // $.content[*] only applies when the controller returns a Page.
    mvc.perform(get("/api/orders").param("status", "PAID"))
        .andExpect(jsonPath("$[*].status", everyItem(is("PAID"))));
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Two of These Only Pass If You Wrote the Validation">
        <p>
          <code>rejectsNegativePageSizeWith400</code> assumes the endpoint validates
          page parameters. Out of the box, Spring Data&apos;s{' '}
          <code>PageableHandlerMethodArgumentResolver</code> does <strong>not</strong>{' '}
          reject a negative or oversized <code>size</code> — it silently clamps to the
          default (and to <code>spring.data.web.pageable.max-page-size</code>, 2000 by
          default). To get a 400 you need explicit constraints, e.g.{' '}
          <code>@Validated</code> on the controller plus{' '}
          <code>@Min(1) @Max(100) int size</code> as a bound parameter. Write the test
          expecting 400, watch it fail, then add the validation — otherwise the test
          documents behavior you don&apos;t actually have.
        </p>
        <p>
          Likewise the 413 upload test below: multipart size limits are enforced by the
          servlet container, which <code>MockMvc</code> does not run.{' '}
          <code>MockMultipartFile</code> bypasses the parser entirely, so a slice test
          will happily accept an 11MB file. Assert 413 in a{' '}
          <code>@SpringBootTest(webEnvironment = RANDOM_PORT)</code> test against a real
          server instead.
        </p>
      </InfoBox>

      <h2>Multipart File Uploads</h2>
      <CodeBlock language="java" title="Testing File Upload Endpoints">
{`@Test
void uploadsAttachmentAndReturns201() throws Exception {
    MockMultipartFile file = new MockMultipartFile(
        "file",                          // form field name
        "invoice.pdf",                   // original filename
        MediaType.APPLICATION_PDF_VALUE,
        "fake-pdf-bytes".getBytes());

    mvc.perform(multipart("/api/orders/{id}/attachments", "ORD-1")
            .file(file)
            .param("description", "Signed invoice"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.filename").value("invoice.pdf"));
}

@Test
void rejectsOversizedUploadWith413() throws Exception {
    byte[] tooLarge = new byte[11 * 1024 * 1024]; // over a 10MB limit
    MockMultipartFile file = new MockMultipartFile(
        "file", "huge.pdf", MediaType.APPLICATION_PDF_VALUE, tooLarge);

    mvc.perform(multipart("/api/orders/{id}/attachments", "ORD-1").file(file))
        .andExpect(status().isPayloadTooLarge());  // 413
}

@Test
void rejectsDisallowedFileTypeWith415() throws Exception {
    MockMultipartFile exe = new MockMultipartFile(
        "file", "malware.exe", "application/x-msdownload", "binary".getBytes());

    mvc.perform(multipart("/api/orders/{id}/attachments", "ORD-1").file(exe))
        .andExpect(status().isUnsupportedMediaType());
}`}
      </CodeBlock>

      <h2>Partial Updates: PATCH and JSON Merge Patch</h2>
      <CodeBlock language="java" title="Testing PATCH Semantics">
{`@Test
void patchUpdatesOnlyProvidedFields() throws Exception {
    when(orders.patch(eq("ORD-1"), any(OrderPatchRequest.class)))
        .thenReturn(new OrderDto("ORD-1", "SHIPPED"));

    mvc.perform(patch("/api/orders/{id}", "ORD-1")
            .contentType("application/merge-patch+json")
            .content("""
                { "status": "SHIPPED" }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("SHIPPED"));

    // Verify only the changed field was passed through, not a full object overwrite
    ArgumentCaptor<OrderPatchRequest> captor = ArgumentCaptor.forClass(OrderPatchRequest.class);
    verify(orders).patch(eq("ORD-1"), captor.capture());
    assertThat(captor.getValue().status()).isEqualTo("SHIPPED");
    assertThat(captor.getValue().customerEmail()).isNull(); // untouched field stayed unset
}`}
      </CodeBlock>

      <h2>WebTestClient: The Same Assertions, Reactive Style</h2>
      <p>
        For WebFlux controllers, the equivalent assertions read fluently through{' '}
        <code>expectStatus()</code>, <code>expectHeader()</code>, and{' '}
        <code>expectBody()</code>.
      </p>

      <CodeBlock language="java" title="WebTestClient Response Assertions">
{`@Test
void createReturnsLocationHeader() {
    webTestClient.post().uri("/api/orders")
        .bodyValue(new CreateOrderRequest("alice@test.com", List.of("SKU-1")))
        .exchange()
        .expectStatus().isCreated()
        .expectHeader().exists("Location")
        .expectHeader().contentType(MediaType.APPLICATION_JSON)
        .expectBody()
            .jsonPath("$.status").isEqualTo("PLACED");
}

@Test
void streamsOrdersAsServerSentEvents() {
    webTestClient.get().uri("/api/orders/stream")
        .accept(MediaType.TEXT_EVENT_STREAM)
        .exchange()
        .expectStatus().isOk()
        .returnResult(OrderDto.class)
        .getResponseBody()
        .as(StepVerifier::create)
        .expectNextMatches(o -> o.status().equals("PLACED"))
        .expectNextCount(2)
        .thenCancel()
        .verify(Duration.ofSeconds(3));
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="StepVerifier for Streaming Bodies">
        When a response body is a stream (SSE, NDJSON), <code>expectBodyList()</code>{' '}
        only works for finite, already-complete lists. For infinite or long-lived
        streams, pull the <code>Flux</code> out with <code>returnResult()</code> and
        drive it with Reactor&apos;s <code>StepVerifier</code>, which understands
        backpressure and can assert on individual emitted elements.
      </InfoBox>

      <InteractiveChallenge
        question={"A client sends Accept: application/pdf to an endpoint that only produces JSON and XML. What status code should the test expect?"}
        options={[
          "400 Bad Request",
          "415 Unsupported Media Type",
          "406 Not Acceptable",
          "200 OK with a JSON fallback"
        ]}
        correctIndex={2}
        explanation="406 Not Acceptable is for the server-can't-produce-what-you-asked-for direction (Accept header). 415 Unsupported Media Type is the opposite direction — the server can't parse the Content-Type of what the client sent."
        language="java"
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>Assert the exact status code semantic (201 vs 200, 204 with empty body, 405 with an Allow header) — not just isOk() everywhere</li>
        <li>Test headers explicitly: Location on create, ETag/Cache-Control for caching, conditional GET returning 304</li>
        <li>Content negotiation needs its own tests against the Accept header — 406 vs 415 are opposite failure directions</li>
        <li>Pagination/sorting/filtering endpoints deserve tests for both the happy path and invalid params (negative page size → 400)</li>
        <li>Multipart uploads test via MockMultipartFile — cover size limits (413) and type restrictions (415) alongside the happy path</li>
        <li>WebTestClient mirrors these assertions for reactive controllers, with StepVerifier for streaming bodies</li>
      </ul>
    </LessonLayout>
  );
}
