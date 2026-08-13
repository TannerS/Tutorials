import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Security() {
  return (
    <LessonLayout
      title="Testing Secured Endpoints"
      sectionId="api-testing"
      lessonIndex={3}
      prev={{ path: '/api-testing/validation', label: 'Testing Validation & Error Handling' }}
      next={{ path: '/api-testing/patterns', label: 'API Testing Patterns & CI' }}
    >
      <h2>Security Bugs Hide in Untested Branches</h2>
      <p>
        A controller test suite that only exercises the authenticated happy path is
        blind to the exact class of bug that matters most: the endpoint that should
        reject a request but doesn&apos;t. This lesson assumes you already know AuthN vs
        AuthZ concepts (see Auth &amp; Security → AuthN vs AuthZ) and Spring Security
        configuration (see Spring Boot → Spring Security &amp; Auth) — here we focus purely
        on how to <em>simulate</em> authenticated and unauthenticated requests inside
        MockMvc and WebTestClient tests.
      </p>

      <FlowChart
        title="What a Secured Endpoint Test Suite Must Cover"
        chart={"graph TD\n  E[\"Secured Endpoint\"] --> A[\"No credentials\\n→ expect 401\"]\n  E --> B[\"Valid user,\\nwrong role\\n→ expect 403\"]\n  E --> C[\"Valid user,\\ncorrect role\\n→ expect 2xx\"]\n  E --> D[\"Expired/invalid token\\n→ expect 401\"]\n  E --> F[\"CSRF missing on\\nstateful mutation\\n→ expect 403\"]"}
      />

      <h2>@WithMockUser — Simulating an Authenticated User</h2>
      <p>
        <code>spring-security-test</code>&apos;s <code>@WithMockUser</code> populates the{' '}
        <code>SecurityContext</code> with a mock <code>Authentication</code> before the
        request runs — no real login flow, no real token, just an authenticated
        principal with the roles you specify.
      </p>

      <CodeBlock language="java" title="Maven Dependency">
{`<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>`}
      </CodeBlock>

      <CodeBlock language="java" title="@WithMockUser Basics">
{`@WebMvcTest(OrderController.class)
class OrderControllerSecurityTest {

    @Autowired MockMvc mvc;
    @MockitoBean OrderService orders;

    @Test
    @DisplayName("unauthenticated request is rejected with 401")
    void noCredentialsReturns401() throws Exception {
        mvc.perform(get("/api/orders/ORD-1"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("authenticated user with USER role can read their own order")
    void userCanReadOwnOrder() throws Exception {
        when(orders.findById("ORD-1")).thenReturn(new OrderDto("ORD-1", "PLACED"));

        mvc.perform(get("/api/orders/ORD-1"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")  // not ADMIN
    @DisplayName("USER role is forbidden from the admin-only cancellation endpoint")
    void userCannotCancelOthersOrders() throws Exception {
        mvc.perform(post("/api/orders/ORD-1/cancel"))
            .andExpect(status().isForbidden());   // 403, not 401 — the user IS authenticated
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("ADMIN role can cancel any order")
    void adminCanCancelAnyOrder() throws Exception {
        mvc.perform(post("/api/orders/ORD-1/cancel"))
            .andExpect(status().isOk());
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="401 vs 403 — Test Them as Distinct Cases">
        <strong>401 Unauthorized</strong> means &quot;I don&apos;t know who you are&quot; (missing or
        invalid credentials — the fix is to authenticate and retry). <strong>403 Forbidden</strong>{' '}
        means &quot;I know exactly who you are, and you&apos;re not allowed to do this&quot; —
        retrying with the same credentials will never work. Conflating them in the API misleads
        clients into pointless token refresh loops on a 403, or into giving up on a recoverable
        401; conflating them in tests means a config change that downgrades real authorization to
        plain authentication passes unnoticed. Always write both cases as separate tests, never
        assume one implies the other.
        <br /><br />
        The information-disclosure question is a <em>different</em> axis: <strong>403 vs 404</strong>.
        A 403 confirms the resource exists, which for something like{' '}
        <code>/api/orders/ORD-1</code> tells an attacker that order ORD-1 is real. Where existence
        itself is sensitive, return 404 for both &quot;missing&quot; and &quot;not yours&quot; — and
        then assert that 404 in a test, because it looks like a bug to anyone who doesn&apos;t know
        it was deliberate.
      </InfoBox>

      <h2>Custom Principals with @WithSecurityContext</h2>
      <p>
        <code>@WithMockUser</code> covers username/roles, but real domain principals
        often carry more — a tenant ID, a customer ID, account flags. Build a custom
        annotation backed by <code>WithSecurityContextFactory</code> instead of
        constructing the <code>SecurityContext</code> by hand in every test.
      </p>

      <CodeBlock language="java" title="Custom @WithMockCustomer Annotation">
{`@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockCustomerFactory.class)
public @interface WithMockCustomer {
    String customerId() default "CUST-1";
    String[] roles() default { "USER" };
}

public class WithMockCustomerFactory implements WithSecurityContextFactory<WithMockCustomer> {
    @Override
    public SecurityContext createSecurityContext(WithMockCustomer annotation) {
        var principal = new CustomerPrincipal(annotation.customerId(), annotation.roles());
        var auth = new UsernamePasswordAuthenticationToken(
            principal, null, principal.getAuthorities());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        return context;
    }
}

// Usage — reads like a fixture, no boilerplate SecurityContext code in the test body
@Test
@WithMockCustomer(customerId = "CUST-42", roles = { "USER" })
void customerCanOnlyReadTheirOwnOrders() throws Exception {
    mvc.perform(get("/api/orders").param("customerId", "CUST-42"))
        .andExpect(status().isOk());
}

@Test
@WithMockCustomer(customerId = "CUST-42", roles = { "USER" })
void customerCannotReadAnotherCustomersOrders() throws Exception {
    mvc.perform(get("/api/orders").param("customerId", "CUST-99"))
        .andExpect(status().isForbidden());
}`}
      </CodeBlock>

      <h2>Testing JWT / OAuth2 Resource Server Endpoints</h2>
      <p>
        If your app validates bearer tokens via Spring Security&apos;s OAuth2 resource
        server support, <code>SecurityMockMvcRequestPostProcessors.jwt()</code> lets you
        inject a fake, already-decoded JWT — no real identity provider, no signing keys,
        no network calls.
      </p>

      <CodeBlock language="java" title="Mocking a Decoded JWT">
{`import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

@Test
@DisplayName("valid JWT with 'orders:read' scope can list orders")
void validJwtWithScopeGrantsAccess() throws Exception {
    mvc.perform(get("/api/orders")
            .with(jwt().jwt(jwt -> jwt
                .claim("sub", "alice")
                .claim("scope", "orders:read"))
                .authorities(new SimpleGrantedAuthority("SCOPE_orders:read"))))
        .andExpect(status().isOk());
}

@Test
@DisplayName("JWT missing the required scope is forbidden")
void jwtWithoutScopeReturns403() throws Exception {
    mvc.perform(get("/api/orders")
            .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_profile:read"))))
        .andExpect(status().isForbidden());
}

@Test
@DisplayName("expired or malformed bearer token returns 401")
void invalidBearerTokenReturns401() throws Exception {
    mvc.perform(get("/api/orders")
            .header("Authorization", "Bearer not-a-real-jwt"))
        .andExpect(status().isUnauthorized());
}`}
      </CodeBlock>

      <p>
        The reactive (WebFlux) equivalent is{' '}
        <code>SecurityMockServerConfigurers.mockJwt()</code>, applied through{' '}
        <code>WebTestClient</code>&apos;s mutation API:
      </p>

      <CodeBlock language="java" title="WebTestClient + Mock JWT">
{`import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt;

@Test
void reactiveEndpointHonorsScopeClaim() {
    webTestClient
        .mutateWith(mockJwt().authorities(new SimpleGrantedAuthority("SCOPE_orders:read")))
        .get().uri("/api/orders")
        .exchange()
        .expectStatus().isOk();
}`}
      </CodeBlock>

      <h2>Testing Method Security (@PreAuthorize)</h2>
      <p>
        When authorization is enforced with <code>@PreAuthorize</code> on service methods
        rather than (or in addition to) the controller, a <code>@WebMvcTest</code> slice
        test alone won&apos;t catch a missing annotation — the mocked service bypasses real
        method security entirely. Test the annotated method directly with a thin
        security-aware context.
      </p>

      <CodeBlock language="java" title="Testing @PreAuthorize Directly">
{`@Service
public class OrderService {
    @PreAuthorize("hasRole('ADMIN') or #customerId == authentication.principal.customerId")
    public List<OrderDto> findByCustomer(String customerId) { /* ... */ }
}

@SpringBootTest
@AutoConfigureMockMvc
class OrderServiceMethodSecurityTest {

    @Autowired OrderService orders;

    @Test
    @WithMockCustomer(customerId = "CUST-1", roles = { "USER" })
    void ownerCanReadTheirOrders() {
        assertThatCode(() -> orders.findByCustomer("CUST-1")).doesNotThrowAnyException();
    }

    @Test
    @WithMockCustomer(customerId = "CUST-1", roles = { "USER" })
    void nonOwnerNonAdminIsDenied() {
        assertThatThrownBy(() -> orders.findByCustomer("CUST-2"))
            .isInstanceOf(AccessDeniedException.class);
    }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Slice Tests Don't Exercise Method Security by Default">
        <code>@WebMvcTest</code> mocks the service layer with <code>@MockitoBean</code>,
        so <code>@PreAuthorize</code> annotations on the real service never run. Cover
        method-level authorization with a targeted <code>@SpringBootTest</code> (or a
        narrower <code>@ContextConfiguration</code> that loads just the service and
        security beans) rather than assuming the controller slice test proves it.
      </InfoBox>

      <h2>CSRF Testing for Stateful (Session-Based) Endpoints</h2>
      <p>
        If your app uses session-based auth with CSRF protection enabled (the default for
        form-based Spring Security), state-changing requests without a valid CSRF token
        are rejected — and by default MockMvc requests don&apos;t carry one.
      </p>

      <CodeBlock language="java" title="CSRF Token in Tests">
{`import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@Test
@WithMockUser
@DisplayName("POST without a CSRF token is rejected")
void missingCsrfTokenReturns403() throws Exception {
    mvc.perform(post("/api/orders")
            .contentType(APPLICATION_JSON)
            .content(validOrderJson()))
        // no .with(csrf())
        .andExpect(status().isForbidden());
}

@Test
@WithMockUser
@DisplayName("POST with a valid CSRF token succeeds")
void validCsrfTokenSucceeds() throws Exception {
    mvc.perform(post("/api/orders")
            .with(csrf())
            .contentType(APPLICATION_JSON)
            .content(validOrderJson()))
        .andExpect(status().isCreated());
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Stateless APIs Usually Disable CSRF">
        Pure token-based (JWT bearer) APIs typically disable CSRF protection entirely
        since there's no session cookie to forge against. If that's your setup, the CSRF
        tests above don't apply — but write one test confirming CSRF really is disabled
        so a future config change doesn't silently reintroduce 403s on every write.
      </InfoBox>

      <h2>A Role/Endpoint Access Matrix</h2>
      <p>
        For endpoints with several roles and several permission levels, a parameterized
        test keeps the full access matrix visible in one place instead of scattered
        across a dozen near-duplicate test methods.
      </p>

      <CodeBlock language="java" title="Parameterized Access Matrix">
{`@ParameterizedTest(name = "role={0} on DELETE /api/orders/id → {1}")
@CsvSource({
    "ANONYMOUS, 401",
    "USER,      403",
    "SUPPORT,   403",
    "ADMIN,     204"
})
void deleteOrderAccessMatrix(String role, int expectedStatus) throws Exception {
    var request = delete("/api/orders/ORD-1");
    if (!role.equals("ANONYMOUS")) {
        request = request.with(user("test").roles(role));
    }
    mvc.perform(request).andExpect(status().is(expectedStatus));
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"An authenticated USER hits an admin-only endpoint. What status code should the test expect, and why?"}
        options={[
          "401 — the request lacks proper authentication",
          "403 — the server knows who they are but denies the action",
          "404 — hide the endpoint's existence entirely",
          "400 — treat it as a malformed request"
        ]}
        correctIndex={1}
        explanation="401 is reserved for missing/invalid credentials — this user IS authenticated. 403 correctly signals 'I know who you are, and you're not allowed to do this.' Conflating 401 and 403 is a common bug that both tests and code reviews should catch. (404 is a legitimate deliberate choice when the mere existence of a resource is sensitive, but it is a hardening decision made per-endpoint — not the default answer for a failed role check on a known endpoint.)"
        language="java"
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>@WithMockUser simulates an authenticated principal without a real login flow; build a custom @WithSecurityContext annotation for richer domain principals</li>
        <li>Always test 401 (no/invalid credentials) and 403 (authenticated but forbidden) as separate cases — they are not interchangeable</li>
        <li>SecurityMockMvcRequestPostProcessors.jwt() / mockJwt() inject a fake decoded token for resource-server tests without a real identity provider</li>
        <li>@WebMvcTest mocks the service layer, so @PreAuthorize on real services needs its own targeted test — a slice test alone doesn't prove method security works</li>
        <li>CSRF-protected stateful endpoints need .with(csrf()) in tests; stateless JWT APIs typically disable CSRF and should have a test confirming that</li>
        <li>A parameterized role/endpoint matrix keeps complex authorization rules readable in one place</li>
      </ul>
    </LessonLayout>
  );
}
