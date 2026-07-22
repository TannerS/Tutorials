import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Security() {
  return (
    <LessonLayout
      title="Spring Security & Auth"
      sectionId="springboot"
      lessonIndex={5}
      prev={{ path: '/springboot/data', label: 'Spring Data & JPA' }}
      next={{ path: '/springboot/testing', label: 'Testing in Spring Boot' }}
    >
      <h2>Spring Security in One Diagram</h2>
      <p>
        Spring Security inserts itself into the servlet filter chain. Every request passes
        through a chain of security filters before reaching the dispatcher servlet. The
        filters authenticate (who are you?) and authorize (are you allowed?).
      </p>

      <FlowChart
        title="Spring Security filter chain"
        chart={"graph TD\nA[HTTP Request] --> B[SecurityContextPersistenceFilter]\nB --> C[Authentication Filter e.g. BearerTokenAuthenticationFilter]\nC --> D[Authorization Filter]\nD --> E[Controller]\nE --> F[Response]\nC -.->|Auth failure| G[401]\nD -.->|Access denied| H[403]"}
      />

      <h2>The Modern SecurityFilterChain (Boot 3+)</h2>
      <p>
        The old <code>WebSecurityConfigurerAdapter</code> was removed. You now configure
        security by exposing a <code>SecurityFilterChain</code> bean.
      </p>

      <CodeBlock language="java" title="Baseline stateless JWT config">
{`@Configuration
@EnableWebSecurity
@EnableMethodSecurity                        // enables @PreAuthorize / @PostAuthorize
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtDecoder jwtDecoder,
                                           JwtAuthenticationConverter authConverter) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())                              // stateless API: no CSRF
            .cors(Customizer.withDefaults())                           // enable global CORS bean
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.decoder(jwtDecoder)
                              .jwtAuthenticationConverter(authConverter)))
            .exceptionHandling(e -> e
                .authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint())
                .accessDeniedHandler(new BearerTokenAccessDeniedHandler()))
            .build();
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why oauth2ResourceServer if we're not doing OAuth2?">
        <p>
          Because <code>oauth2ResourceServer(jwt())</code> is the modern Spring name for
          "verify a JWT on every request." It doesn't require running an OAuth2 flow —
          the JWT can come from any issuer you trust, including your own auth service.
          The old hand-rolled <code>OncePerRequestFilter</code> that decodes a Bearer
          token is obsolete; use the built-in.
        </p>
      </InfoBox>

      <h2>Verifying JWTs</h2>
      <p>
        The <code>JwtDecoder</code> bean owns key resolution. Three common shapes:
      </p>
      <CodeBlock language="java" title="Three JwtDecoder patterns">
{`// 1. JWKS endpoint — fetches keys from an OIDC-compliant issuer.
//    Preferred when your auth service exposes a JWKS URL.
@Bean
JwtDecoder jwksDecoder(@Value("\${security.jwks-uri}") String jwksUri) {
    return NimbusJwtDecoder.withJwkSetUri(jwksUri).build();
}

// 2. Symmetric HMAC secret — for internal services signing with the same secret.
//    Never commit the secret; load from env.
@Bean
JwtDecoder hmacDecoder(@Value("\${security.jwt.secret}") String secret) {
    SecretKey key = new SecretKeySpec(secret.getBytes(UTF_8), "HmacSHA256");
    return NimbusJwtDecoder.withSecretKey(key).build();
}

// 3. Public-key PEM — for asymmetric RS256/ES256 tokens.
@Bean
JwtDecoder rsaDecoder(@Value("\${security.jwt.public-key}") RSAPublicKey publicKey) {
    return NimbusJwtDecoder.withPublicKey(publicKey).build();
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Mapping claims to Spring authorities">
{`@Bean
JwtAuthenticationConverter jwtAuthConverter() {
    JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
    authoritiesConverter.setAuthorityPrefix("ROLE_");
    authoritiesConverter.setAuthoritiesClaimName("roles");    // or "scope", "permissions"

    JwtAuthenticationConverter conv = new JwtAuthenticationConverter();
    conv.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
    conv.setPrincipalClaimName("sub");                        // or "email", "uid"
    return conv;
}`}
      </CodeBlock>

      <h2>Method-Level Authorization</h2>
      <p>
        With <code>@EnableMethodSecurity</code>, you can annotate service methods with
        SpEL access-control expressions. Cleaner than sprinkling
        <code>requestMatchers</code> for fine-grained rules.
      </p>
      <CodeBlock language="java" title="@PreAuthorize / @PostAuthorize">
{`@Service
public class OrderService {

    // Simple role check
    @PreAuthorize("hasRole('ADMIN')")
    public void cancelAllOrders() { /* ... */ }

    // Multiple roles OR
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public void reopenOrder(UUID id) { /* ... */ }

    // Parameter reference — check the user owns the order.
    @PreAuthorize("hasRole('ADMIN') or @orderSecurity.isOwner(#orderId, authentication.name)")
    public Order find(UUID orderId) { /* ... */ }

    // Post-authorize — check on the return value.
    @PostAuthorize("returnObject.owner == authentication.name or hasRole('ADMIN')")
    public Order findById(UUID id) { /* ... */ }
}

// The helper referenced by @orderSecurity above:
@Component
public class OrderSecurity {
    private final OrderRepository orders;
    public OrderSecurity(OrderRepository orders) { this.orders = orders; }

    public boolean isOwner(UUID orderId, String username) {
        return orders.findById(orderId)
            .map(o -> o.owner().equals(username))
            .orElse(false);
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Method security uses AOP — self-invocation applies here too">
        <p>
          Same trap as <code>@Transactional</code>: calling
          <code>this.securedMethod()</code> from another method in the same class bypasses
          the security proxy. The <em>Dependency Injection</em> lesson covers the pattern
          for avoiding this.
        </p>
      </InfoBox>

      <h2>Reading the Current User</h2>
      <CodeBlock language="java" title="Getting the authenticated principal">
{`// Style 1 — inject Authentication (or the specific type).
@GetMapping("/me")
public UserDto me(Authentication authentication) {
    Jwt jwt = (Jwt) authentication.getPrincipal();
    return userService.getBySub(jwt.getSubject());
}

// Style 2 — @AuthenticationPrincipal directly on the parameter.
@GetMapping("/me")
public UserDto me(@AuthenticationPrincipal Jwt jwt) {
    return userService.getBySub(jwt.getSubject());
}

// Style 3 — @AuthenticationPrincipal with a projection.
@GetMapping("/me")
public UserDto me(@AuthenticationPrincipal(expression = "claims['email']") String email) {
    return userService.byEmail(email);
}

// From a service (last resort — hides the dependency).
String username = SecurityContextHolder.getContext().getAuthentication().getName();`}
      </CodeBlock>

      <h2>Password Hashing</h2>
      <p>
        If you're storing passwords (not tokens), use a modern KDF: <code>BCrypt</code>,
        <code>Argon2id</code>, or <code>PBKDF2</code>. Never MD5 or SHA-256 alone.
      </p>
      <CodeBlock language="java" title="A PasswordEncoder that supports upgrades">
{`@Bean
public PasswordEncoder passwordEncoder() {
    // DelegatingPasswordEncoder stores hashes as "{id}hash" (e.g. "{bcrypt}...")
    // so you can migrate algorithms over time without a global rehash.
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
}

// Usage
@Service
public class UserService {
    private final PasswordEncoder encoder;
    public UserService(PasswordEncoder encoder) { this.encoder = encoder; }

    public void setPassword(User user, String raw) {
        user.setPasswordHash(encoder.encode(raw));   // "{bcrypt}\$2a\$10\$..."
    }

    public boolean verifyPassword(User user, String candidate) {
        return encoder.matches(candidate, user.getPasswordHash());
    }
}`}
      </CodeBlock>

      <h2>CSRF — When It Matters, When It Doesn't</h2>
      <p>
        CSRF protection defends against a malicious site tricking a logged-in browser into
        submitting a form to your API using its cookie.
      </p>
      <ul>
        <li>
          <strong>Cookie-authenticated browser session?</strong> Enable CSRF. Use
          <code>CookieCsrfTokenRepository.withHttpOnlyFalse()</code> so JS can read
          the token from a cookie and echo it back in a header.
        </li>
        <li>
          <strong>Stateless bearer-token API?</strong> Disable CSRF. The browser cannot
          attach the bearer token to a cross-origin request automatically, so there's
          nothing to forge.
        </li>
      </ul>
      <CodeBlock language="java" title="CSRF for cookie-session apps">
{`@Bean
SecurityFilterChain browserFilterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
        .authorizeHttpRequests(a -> a.anyRequest().authenticated())
        .formLogin(Customizer.withDefaults())
        .build();
}`}
      </CodeBlock>

      <h2>CORS in Spring Security</h2>
      <p>
        CORS must be enabled <em>on the security chain</em>, not only on
        <code>WebMvcConfigurer</code>. Otherwise Spring Security's preflight handling can
        reject the OPTIONS request before Spring MVC's CORS ever gets a chance.
      </p>
      <CodeBlock language="java" title="Global CORS config picked up by SecurityFilterChain">
{`@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://app.example.com"));
    config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}`}
      </CodeBlock>

      <h2>Testing Security</h2>
      <p>
        <code>spring-security-test</code> provides mock users and JWTs.
      </p>
      <CodeBlock language="java" title="Slice-test with a mock user">
{`@WebMvcTest(OrderController.class)
@Import(SecurityConfig.class)
class OrderControllerSecurityTest {

    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;

    @Test
    void anonymousGetsUnauthorized() throws Exception {
        mvc.perform(get("/api/orders/{id}", UUID.randomUUID()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCanReadAnyOrder() throws Exception {
        mvc.perform(get("/api/orders/{id}", UUID.randomUUID())
                .with(jwt().jwt(j -> j.claim("sub", "someone")).authorities(
                    new SimpleGrantedAuthority("ROLE_ADMIN"))))
            .andExpect(status().isOk());
    }

    @Test
    void nonOwnerGetsForbidden() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.find(id)).thenThrow(new AccessDeniedException("not owner"));

        mvc.perform(get("/api/orders/{id}", id)
                .with(jwt().jwt(j -> j.claim("sub", "different-user"))))
            .andExpect(status().isForbidden());
    }
}`}
      </CodeBlock>

      <h2>Security Checklist</h2>
      <InfoBox variant="success" title="A production-ready security setup has">
        <ul>
          <li>Stateless <code>SessionCreationPolicy.STATELESS</code> for bearer-token APIs.</li>
          <li>Route matchers ordered specific-to-general with a final
              <code>anyRequest().authenticated()</code>.</li>
          <li>JWT verified via a <code>JwtDecoder</code> that pulls keys from a JWKS
              endpoint (or a well-managed secret).</li>
          <li>Method security (<code>@PreAuthorize</code>) at the service layer for
              anything more granular than URL-level rules.</li>
          <li>Password hashing via <code>DelegatingPasswordEncoder</code> — never store
              raw or SHA-hashed passwords.</li>
          <li>CSRF explicitly on (browser sessions) or off (bearer-token APIs) — never
              left ambiguous.</li>
          <li>CORS configured through <code>CorsConfigurationSource</code> so Spring
              Security applies it correctly.</li>
          <li>Test coverage of at least: anonymous request, insufficient role,
              cross-user access, and happy path.</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="You have a stateless JWT-authenticated REST API. What's the correct CSRF setting?"
        options={[
          "Enable CSRF with CookieCsrfTokenRepository — always safer",
          "Disable CSRF — the bearer token cannot be attached to cross-origin requests automatically, so there's nothing to forge",
          "Enable CSRF only for POST/PUT/PATCH/DELETE",
          "CSRF is enabled by default in Spring Security 6 and shouldn't be changed"
        ]}
        correctIndex={1}
        explanation="CSRF exploits the fact that browsers automatically attach cookies to cross-origin requests. A bearer token in an Authorization header is NOT automatically attached — it must be added by JavaScript. So a stateless API using only bearer-token auth is immune to CSRF by construction, and CSRF protection just adds friction without value. For cookie-session apps, the opposite is true and CSRF should be on."
      />
    </LessonLayout>
  );
}
