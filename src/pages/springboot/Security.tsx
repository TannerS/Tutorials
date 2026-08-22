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
      next={{ path: '/springboot/security-migration', label: 'Spring Security 7 & Boot 4 Changes' }}
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

      <h3>How that chain gets in front of your controller</h3>
      <p>
        Worth thirty seconds, because it explains where to put a breakpoint and why a rule can
        silently apply to nothing. Spring Security is not wired into Spring MVC at all — it is
        a <em>servlet filter</em>, sitting entirely outside the framework that handles your
        request.
      </p>

      <CodeBlock language="text" title="Request → your controller, with the security layer named">
{`Servlet container (Tomcat)
   |
   v
DelegatingFilterProxy  — a plain servlet Filter registered under the fixed
   |                     name "springSecurityFilterChain". Its only job is to
   |                     look that bean up in the Spring context and delegate,
   |                     so the container needn't know about Spring at all.
   v
FilterChainProxy       — holds a LIST of SecurityFilterChain beans. It walks
   |                     them in order and picks the FIRST whose matcher
   |                     accepts this request. Exactly one chain is used.
   v
that chain's filters   — CsrfFilter, the authentication filter for your setup,
   |                     ExceptionTranslationFilter, AuthorizationFilter, ...
   |                     Each may reject: the request stops here, and your
   |                     controller is never called.
   v
DispatcherServlet      — only now does Spring MVC exist. HandlerMapping,
   |                     argument resolvers, your @RestController.
   v
your controller method

TWO CONSEQUENCES WORTH REMEMBERING:
  * A 401/403 from a URL rule is produced BEFORE MVC runs — which is why
    @RestControllerAdvice cannot catch it. (See the Error Handling lesson;
    you configure an AuthenticationEntryPoint / AccessDeniedHandler instead.)
  * permitAll() does NOT mean "skip security". The request still traverses
    the whole chain; the authorization filter simply votes to allow it. An
    anonymous Authentication is still populated.`}
      </CodeBlock>

      <h2>The Modern SecurityFilterChain (Boot 3 and Boot 4)</h2>
      <p>
        The old <code>WebSecurityConfigurerAdapter</code> was removed. You now configure
        security by exposing a <code>SecurityFilterChain</code> bean.
      </p>

      <InfoBox variant="warning" title="Reading the examples below: one chain at a time">
        <p>
          This lesson shows several <code>SecurityFilterChain</code> beans — a token-API one
          here, a form-login one later, a CSRF one after that. Each is a <em>standalone
          illustration</em> of one policy. If you paste two of them into the same application
          you have two chains with no matcher and no order, and{' '}
          <code>FilterChainProxy</code> will route every request to whichever happens to sort
          first, silently ignoring the other. Applications that genuinely need two policies
          scope them with <code>securityMatcher</code> and order them with{' '}
          <code>@Order</code> — the <strong>Spring Security 7 &amp; Boot 4 Changes</strong>{' '}
          lesson works through that pattern.
        </p>
      </InfoBox>

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

      <InfoBox variant="danger" title="Signature verification is not validation">
        <p>
          A <code>JwtDecoder</code> built as above verifies the signature and the{' '}
          <code>exp</code> claim. It does <strong>not</strong>, by default, check who issued the
          token or who it was meant for. If two services trust the same issuer, a token minted for
          service A will sail straight through service B&apos;s authentication. Always validate{' '}
          <code>iss</code> and <code>aud</code>.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Validating issuer, audience, and clock skew">
{`@Bean
JwtDecoder jwtDecoder(@Value("\${security.issuer-uri}") String issuerUri,
                      @Value("\${security.audience}") String audience) {

    // fromIssuerLocation performs OIDC discovery: it fetches
    // /.well-known/openid-configuration and derives the JWKS URI for you.
    NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuerUri);

    OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuerUri);
    OAuth2TokenValidator<Jwt> withAudience = jwt ->
        jwt.getAudience().contains(audience)
            ? OAuth2TokenValidatorResult.success()
            : OAuth2TokenValidatorResult.failure(
                new OAuth2Error("invalid_token", "Required audience missing", null));

    decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(withIssuer, withAudience));
    return decoder;
}

// Clock skew: JwtTimestampValidator allows 60 seconds by default. If your
// services' clocks drift more than that you will see sporadic 401s — fix the
// clocks rather than widening the window.`}
      </CodeBlock>

      <InfoBox variant="warning" title="hasRole vs hasAuthority — the ROLE_ prefix trap">
        <p>
          Spring Security has exactly one concept, <code>GrantedAuthority</code>, and a naming
          convention layered on top. <code>hasRole(&quot;ADMIN&quot;)</code> is literally{' '}
          <code>hasAuthority(&quot;ROLE_ADMIN&quot;)</code> — it prepends the prefix for you.
          The failure mode: your JWT converter maps a <code>roles</code> claim of{' '}
          <code>[&quot;ADMIN&quot;]</code> without a prefix, so the authority is{' '}
          <code>ADMIN</code>, and <code>hasRole(&quot;ADMIN&quot;)</code> looks for{' '}
          <code>ROLE_ADMIN</code> and silently denies every request with a 403.
        </p>
        <p>
          Pick one convention and be consistent. Either set{' '}
          <code>setAuthorityPrefix(&quot;ROLE_&quot;)</code> on the converter (as the example
          above does) and use <code>hasRole</code>, or set the prefix to <code>&quot;&quot;</code>{' '}
          and use <code>hasAuthority</code> everywhere. When debugging a mysterious 403, print{' '}
          <code>authentication.getAuthorities()</code> — the answer is almost always visible
          there.
        </p>
      </InfoBox>

      <h2>The Other Path: Sessions, Form Login, and UserDetailsService</h2>
      <p>
        Not every application is a stateless token API. Server-rendered applications and internal
        tools commonly authenticate against a database and keep a session cookie. The moving parts
        are a <code>UserDetailsService</code> (loads the user), a{' '}
        <code>PasswordEncoder</code> (verifies the hash), and <code>formLogin</code>.
      </p>

      <CodeBlock language="java" title="Database-backed form login">
{`@Service
public class DatabaseUserDetailsService implements UserDetailsService {

    private final UserRepository users;
    public DatabaseUserDetailsService(UserRepository users) { this.users = users; }

    @Override
    public UserDetails loadUserByUsername(String username) {
        var user = users.findByUsernameIgnoreCase(username)
            // Throw the SAME exception for "no such user" and "wrong password"
            // upstream, so the response cannot be used to enumerate accounts.
            .orElseThrow(() -> new UsernameNotFoundException("bad credentials"));

        return User.withUsername(user.getUsername())
            .password(user.getPasswordHash())        // already encoded, with {bcrypt} prefix
            .authorities(user.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                .toList())
            .accountLocked(user.isLocked())
            .disabled(!user.isEnabled())
            .build();
    }
}

@Bean
SecurityFilterChain browserChain(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(a -> a
            .requestMatchers("/", "/login", "/css/**").permitAll()
            .anyRequest().authenticated())
        .formLogin(f -> f
            .loginPage("/login")
            .defaultSuccessUrl("/dashboard", true)
            .failureUrl("/login?error"))
        .logout(l -> l
            .logoutSuccessUrl("/login?logout")
            .invalidateHttpSession(true)
            .deleteCookies("JSESSIONID"))
        .sessionManagement(s -> s
            // Rotate the session id on login — defeats session fixation.
            // This is the DEFAULT; the point is not to turn it off.
            .sessionFixation(SessionFixationConfigurer::changeSessionId)
            .maximumSessions(1).maxSessionsPreventsLogin(false))
        .build();
}

// Spring Boot auto-wires a DaoAuthenticationProvider as soon as it finds a
// UserDetailsService bean and a PasswordEncoder bean. You rarely declare it
// by hand.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Sessions in a multi-instance deployment">
        <p>
          The default <code>HttpSession</code> lives in the memory of a single JVM, so a rolling
          deploy or a load balancer without sticky sessions logs everyone out. Add{' '}
          <strong>Spring Session</strong> (backed by Redis or JDBC) to externalise it —{' '}
          <code>spring-session-data-redis</code> plus a Redis connection is essentially the whole
          configuration, and it makes the session survive instance restarts.
        </p>
      </InfoBox>

      <h2>Security Response Headers</h2>
      <p>
        Spring Security sends a sensible set of defence-in-depth headers by default. Knowing which
        are on — and which you must add yourself — is worth thirty seconds.
      </p>

      <CodeBlock language="java" title="Headers: defaults and the ones you should add">
{`// ON by default:
//   Cache-Control: no-cache, no-store, max-age=0, must-revalidate
//   X-Content-Type-Options: nosniff        (stops MIME sniffing)
//   X-Frame-Options: DENY                  (clickjacking protection)
//   Strict-Transport-Security               (only on HTTPS requests)

// NOT on by default and worth adding:
http.headers(h -> h
    .contentSecurityPolicy(csp -> csp
        .policyDirectives("default-src 'self'; frame-ancestors 'none'; object-src 'none'"))
    .referrerPolicy(r -> r.policy(ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
    .httpStrictTransportSecurity(hsts -> hsts
        .includeSubDomains(true)
        .maxAgeInSeconds(31536000))
);

// Behind a reverse proxy or load balancer, tell Boot to trust the
// X-Forwarded-* headers, or every redirect it generates will be http://
// and HSTS will never be applied:
//   server.forward-headers-strategy: framework`}
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
          <strong>Server-rendered form app on a cookie session?</strong> Enable CSRF and leave
          the defaults alone. Thymeleaf/JSP form tags inject the token for you.
        </li>
        <li>
          <strong>SPA (React/Vue) on a cookie session?</strong> Enable CSRF and use{' '}
          <code>csrf.spa()</code>. See the warning below — this is the one people get wrong.
        </li>
        <li>
          <strong>Stateless bearer-token API?</strong> Disable CSRF. The browser cannot
          attach the bearer token to a cross-origin request automatically, so there's
          nothing to forge.
        </li>
      </ul>
      <CodeBlock language="java" title="CSRF for a server-rendered form app">
{`@Bean
SecurityFilterChain browserFilterChain(HttpSecurity http) throws Exception {
    return http
        // Defaults are correct here: session-backed token repository plus the
        // Xor request handler (BREACH protection). The form tag library reads
        // the token out of the request attribute and renders it as a hidden field.
        .authorizeHttpRequests(a -> a.anyRequest().authenticated())
        .formLogin(Customizer.withDefaults())
        .build();
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="For a SPA, the cookie repository ALONE gives you a 403">
        <p>
          The advice you will find everywhere — &quot;just set{' '}
          <code>csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())</code> so JS
          can read the token&quot; — is only half the change, and the missing half is the half
          that breaks. That cookie holds the <strong>raw</strong> token, but the default request
          handler is <code>XorCsrfTokenRequestAttributeHandler</code>, which expects the incoming
          header to carry a <em>randomised</em> value. Raw in, decode attempted, mismatch,{' '}
          <code>403</code> on every POST.
        </p>
        <p>
          Spring Security 7 collapses the whole fix into one method:
        </p>
        <CodeBlock language="java" title="Security 7: CSRF for a SPA">
{`@Bean
SecurityFilterChain spaChain(HttpSecurity http) throws Exception {
    return http
        // Cookie-based repository + a request handler that resolves the actual
        // token value on the way in, while still rendering the Xor-encoded value
        // on the way out. BREACH protection is kept, not traded away.
        .csrf(csrf -> csrf.spa())
        .authorizeHttpRequests(a -> a.anyRequest().authenticated())
        .build();
}`}
        </CodeBlock>
        <p>
          On Security 6.x there is no <code>spa()</code>, and the popular workaround — swapping
          in the plain <code>CsrfTokenRequestAttributeHandler</code> — works by{' '}
          <em>disabling BREACH protection</em>. The next lesson,{' '}
          <strong>Spring Security 7 &amp; Boot 4 Changes</strong>, walks through both the 6.x
          hand-rolled equivalent and why the token rotates on login in its CSRF section.
        </p>
      </InfoBox>

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
