import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
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
          Likewise the 413 test further down this section: multipart size limits are
          enforced by the servlet container, which <code>MockMvc</code> does not run.{' '}
          <code>MockMultipartFile</code> bypasses the parser entirely, so a slice test
          will happily accept an 11MB file — verified empirically against a real Spring
          Boot 3.5.16 <code>@WebMvcTest</code>: given an 11MB <code>MockMultipartFile</code>{' '}
          and <code>spring.servlet.multipart.max-file-size=10MB</code>, the slice test
          returns <strong>201</strong>, not 413. Assert 413 in a{' '}
          <code>@SpringBootTest(webEnvironment = RANDOM_PORT)</code> test against a real
          server instead — shown below.
        </p>
      </InfoBox>

      <h2>Multipart File Uploads</h2>
      <p>
        The happy path and content-type validation below are genuine controller logic, so
        a <code>MockMvc</code> slice test is the right tool — it&apos;s exercising code you
        wrote, not the servlet container. Note what makes the 415 case actually work:
        Spring&apos;s <code>consumes</code> matching operates on the request&apos;s overall{' '}
        <code>Content-Type</code> (<code>multipart/form-data</code>), never on an individual
        file part&apos;s content type, so <code>@PostMapping(consumes = ...)</code> alone can
        never reject a bad file type. The controller has to check{' '}
        <code>file.getContentType()</code> itself and throw a{' '}
        <code>ResponseStatusException(UNSUPPORTED_MEDIA_TYPE, ...)</code> — without that
        explicit check, this test fails the same silent way the 413 test above does.
      </p>
      <CodeBlock language="java" title="Testing File Upload Endpoints — MockMvc, Controller-Level Checks">
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
void rejectsDisallowedFileTypeWith415() throws Exception {
    // Passes only because the controller explicitly checks file.getContentType()
    // against an allow-list and throws ResponseStatusException(UNSUPPORTED_MEDIA_TYPE).
    // consumes = MULTIPART_FORM_DATA_VALUE on the mapping has no opinion about this --
    // it already matched, since the REQUEST's Content-Type is multipart/form-data.
    MockMultipartFile exe = new MockMultipartFile(
        "file", "malware.exe", "application/x-msdownload", "binary".getBytes());

    mvc.perform(multipart("/api/orders/{id}/attachments", "ORD-1").file(exe))
        .andExpect(status().isUnsupportedMediaType());
}`}
      </CodeBlock>

      <p>
        The size limit is different in kind — it&apos;s enforced by Tomcat&apos;s multipart
        parser before your controller code ever runs, so there&apos;s no controller logic
        for <code>MockMvc</code> to exercise even in principle. Testing it means booting a
        real embedded server and sending real bytes over real HTTP:
      </p>

      <CodeBlock language="java" title="Testing the 413 Size Limit — Real Server, Not MockMvc">
{`@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AttachmentUploadLimitTest {

    @Autowired TestRestTemplate restTemplate;

    @Test
    void rejectsOversizedUploadWith413() {
        byte[] tooLarge = new byte[11 * 1024 * 1024]; // over the configured 10MB limit

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(tooLarge) {
            @Override
            public String getFilename() {
                return "huge.pdf"; // ByteArrayResource has no filename of its own
            }
        });

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        ResponseEntity<String> response = restTemplate.postForEntity(
            "/api/orders/{id}/attachments", new HttpEntity<>(body, headers),
            String.class, "ORD-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Verified — This One Actually Returns 413">
        Re-run against the same Spring Boot 3.5.16 project as the InfoBox above: swapping{' '}
        <code>@WebMvcTest</code> + <code>MockMvc</code> for{' '}
        <code>@SpringBootTest(webEnvironment = RANDOM_PORT)</code> + <code>TestRestTemplate</code>{' '}
        boots a real embedded Tomcat, so the same 11MB payload against the same{' '}
        <code>max-file-size=10MB</code> config now hits the real parser and returns{' '}
        <strong>413 Payload Too Large</strong> — the difference the InfoBox above describes,
        confirmed empirically rather than assumed.
      </InfoBox>

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

      <h2>Key Takeaways</h2>
      <ul>
        <li>Assert the exact status code semantic (201 vs 200, 204 with empty body, 405 with an Allow header) — not just isOk() everywhere</li>
        <li>Test headers explicitly: Location on create, ETag/Cache-Control for caching, conditional GET returning 304</li>
        <li>Content negotiation needs its own tests against the Accept header — 406 vs 415 are opposite failure directions</li>
        <li>Pagination/sorting/filtering endpoints deserve tests for both the happy path and invalid params (negative page size → 400)</li>
        <li>Multipart uploads: MockMvc + MockMultipartFile is right for controller-level checks (type restrictions, happy path) but the servlet container never runs in a slice test, so the 413 size limit needs a real @SpringBootTest(RANDOM_PORT) server, not MockMvc</li>
        <li>WebTestClient mirrors these assertions for reactive controllers, with StepVerifier for streaming bodies</li>
      </ul>
    </LessonLayout>
  );
}
