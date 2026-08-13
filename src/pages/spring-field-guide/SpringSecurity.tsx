import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideSpringSecurity() {
  return (
    <PosterLayout
      accent="emerald"
      eyebrow="Spring Boot 4 · Field Reference"
      title="Spring Security"
      tagline="The modern SecurityFilterChain, JWT resource servers, and method-level auth — condensed for offline study."
      meta={['Spring Boot 4', '12 patterns']}
      footerLabel="Personal study reference — Spring Boot"
      pageLabel="Spring Field Guide · Security"
      prev={{ path: '/spring-field-guide/config-transactions', label: 'Config & Transactions' }}
      next={{ path: '/spring-field-guide/aop-events', label: 'AOP & Async Events' }}
    >
      <PosterCard
        glyph="Fc"
        title={<>SecurityFilterChain<span className="dim"> bean</span></>}
        language="java"
        code={`@Bean
SecurityFilterChain filterChain(HttpSecurity http,
                                JwtDecoder jwtDecoder) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())        // stateless API
        .sessionManagement(s -> s
            .sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(a -> a
            .requestMatchers("/api/public/**").permitAll()
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(j ->
            j.decoder(jwtDecoder)))
        .build();
}`}
        caption="WebSecurityConfigurerAdapter is gone since Boot 3 — every app now exposes a SecurityFilterChain bean instead of extending a base class."
      />

      <PosterCard
        glyph="Rq"
        title={<>authorizeHttpRequests<span className="dim">()</span></>}
        language="java"
        code={`.authorizeHttpRequests(a -> a
    .requestMatchers("/actuator/health/**").permitAll()
    .requestMatchers(HttpMethod.POST, "/api/auth/login")
        .permitAll()
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    .anyRequest().authenticated())`}
        caption="Order matters — matchers are evaluated top to bottom, so put specific routes before the catch-all anyRequest().authenticated() at the end."
      />

      <PosterCard
        glyph="Jwt"
        title={<>oauth2ResourceServer<span className="dim">(jwt)</span></>}
        language="java"
        code={`// "Verify a JWT on every request" — no OAuth2 flow required.
@Bean
JwtDecoder jwksDecoder(@Value("\${security.jwks-uri}") String uri) {
    return NimbusJwtDecoder.withJwkSetUri(uri).build();
}

@Bean
JwtDecoder hmacDecoder(@Value("\${security.jwt.secret}") String s) {
    SecretKey key = new SecretKeySpec(s.getBytes(UTF_8), "HmacSHA256");
    return NimbusJwtDecoder.withSecretKey(key).build();
}`}
        caption="oauth2ResourceServer is the modern Spring name for JWT verification — no full OAuth2 flow required. Note that a bare decoder checks the SIGNATURE and exp only: also validate iss and aud via a DelegatingOAuth2TokenValidator, or a token minted for a sibling service sails straight through yours."
      />

      <PosterCard
        glyph="Cl"
        title={<>JwtAuthenticationConverter</>}
        language="java"
        code={`@Bean
JwtAuthenticationConverter jwtAuthConverter() {
    var authorities = new JwtGrantedAuthoritiesConverter();
    authorities.setAuthorityPrefix("ROLE_");
    authorities.setAuthoritiesClaimName("roles");

    var conv = new JwtAuthenticationConverter();
    conv.setJwtGrantedAuthoritiesConverter(authorities);
    conv.setPrincipalClaimName("sub");
    return conv;
}`}
        caption="Maps a JWT claim (roles, scope, permissions) onto Spring's GrantedAuthority objects so hasRole()/hasAuthority() checks work downstream."
      />

      <PosterCard
        glyph="@"
        title={<>@PreAuthorize<span className="dim"> / @PostAuthorize</span></>}
        language="java"
        code={`@Service
public class OrderService {

    @PreAuthorize("hasRole('ADMIN')")
    public void cancelAllOrders() { /* ... */ }

    @PreAuthorize("hasRole('ADMIN') or " +
        "@orderSecurity.isOwner(#orderId, authentication.name)")
    public Order find(UUID orderId) { /* ... */ }

    @PostAuthorize("returnObject.owner == authentication.name")
    public Order findById(UUID id) { /* ... */ }
}`}
        caption="Requires @EnableMethodSecurity on the config class. Cleaner than sprinkling requestMatchers for fine-grained, per-resource rules."
      />

      <PosterCard
        glyph="!"
        title={<>Method security<span className="dim"> self-invocation</span></>}
        language="java"
        code={`// Same trap as @Transactional.
@Service
public class ReportService {
    @PreAuthorize("hasRole('ADMIN')")
    public void secured() { /* ... */ }

    public void caller() {
        this.secured();   // bypasses the AOP proxy — check skipped!
    }
}`}
        caption="@PreAuthorize is AOP-proxy-based like @Transactional. Calling this.securedMethod() from inside the same class skips the check silently."
      />

      <PosterCard
        glyph="Me"
        title={<>Reading the current user</>}
        language="java"
        code={`@GetMapping("/me")
public UserDto me(@AuthenticationPrincipal Jwt jwt) {
    return userService.getBySub(jwt.getSubject());
}

// Projection straight to a claim
@GetMapping("/me")
public UserDto me(
        @AuthenticationPrincipal(expression = "claims['email']")
        String email) {
    return userService.byEmail(email);
}`}
        caption="@AuthenticationPrincipal is the preferred style — injects the JWT (or a projection of it) directly into the handler without touching SecurityContextHolder."
      />

      <PosterCard
        glyph="Pw"
        title={<>PasswordEncoder</>}
        language="java"
        code={`@Bean
public PasswordEncoder passwordEncoder() {
    // Stores hashes as "{bcrypt}..." — lets you migrate
    // algorithms later without a global rehash.
    return PasswordEncoderFactories
        .createDelegatingPasswordEncoder();
}

user.setPasswordHash(encoder.encode(raw));
encoder.matches(candidate, user.getPasswordHash());`}
        caption="Never MD5 or plain SHA-256. DelegatingPasswordEncoder wraps BCrypt (or Argon2id/PBKDF2) and tags the hash so you can upgrade algorithms per-user over time."
      />

      <PosterCard
        glyph="Cs"
        title={<>CSRF<span className="dim"> — on or off?</span></>}
        language="java"
        code={`// Cookie-session browser app: enable CSRF.
.csrf(csrf -> csrf.csrfTokenRepository(
    CookieCsrfTokenRepository.withHttpOnlyFalse()))

// Stateless bearer-token API: disable CSRF.
.csrf(csrf -> csrf.disable())`}
        caption="CSRF forges a request using a browser's automatically-attached cookie. A bearer token in a header is never auto-attached cross-origin, so stateless APIs have nothing to forge."
      />

      <PosterCard
        glyph="Co"
        title={<>CORS<span className="dim"> on the security chain</span></>}

        language="java"
        code={`@Bean
public CorsConfigurationSource corsConfigurationSource() {
    var config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://app.example.com"));
    config.setAllowedMethods(List.of("GET","POST","PUT","DELETE"));
    config.setAllowCredentials(true);
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}`}
        caption="CORS must be wired through CorsConfigurationSource, not just WebMvcConfigurer — otherwise Spring Security can reject the OPTIONS preflight before MVC's CORS ever runs."
      />

      <PosterCard
        glyph="Ts"
        title={<>Security slice test<span className="dim"></span></>}
        language="java"
        code={`@WebMvcTest(OrderController.class)
@Import(SecurityConfig.class)
class OrderControllerSecurityTest {

    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;

    @Test
    void adminCanReadAnyOrder() throws Exception {
        mvc.perform(get("/api/orders/{id}", id)
                .with(jwt().jwt(j -> j.claim("sub", "u"))
                    .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
            .andExpect(status().isOk());
    }
}`}
        caption="spring-security-test's jwt() post-processor stubs an authenticated JWT principal directly into MockMvc — no real token issuer needed for the test."
      />

      <PosterCard
        glyph="Ex"
        title={<>Auth failure handlers<span className="dim"></span></>}
        language="java"
        code={`.exceptionHandling(e -> e
    .authenticationEntryPoint(
        new BearerTokenAuthenticationEntryPoint())
    .accessDeniedHandler(
        new BearerTokenAccessDeniedHandler()))`}
        caption="Without this, an unauthenticated or unauthorized bearer-token request can fall back to a form-login redirect instead of a clean 401/403 JSON response."
      />

      <PosterQuickRef
        title="Security checklist at a glance"
        rows={[
          { need: 'Stateless bearer API', answer: 'SessionCreationPolicy.STATELESS + csrf disabled' },
          { need: 'Verify JWT', answer: 'oauth2ResourceServer(jwt(decoder))' },
          { need: 'Role check on a method', answer: '@PreAuthorize("hasRole(...)")' },
          { need: 'Check return value owner', answer: '@PostAuthorize("returnObject...")' },
          { need: 'Current user in a controller', answer: '@AuthenticationPrincipal Jwt jwt' },
          { need: 'Hash a password', answer: 'PasswordEncoderFactories.createDelegatingPasswordEncoder()' },
          { need: 'Cookie-session app', answer: 'Enable CSRF with CookieCsrfTokenRepository' },
          { need: 'CORS for /api/**', answer: 'CorsConfigurationSource bean, not just WebMvcConfigurer' },
          { need: 'Test a secured endpoint', answer: '@WebMvcTest + .with(jwt().authorities(...))' },
        ]}
      />
    </PosterLayout>
  );
}
