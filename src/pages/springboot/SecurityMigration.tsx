import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SecurityMigration() {
  return (
    <LessonLayout
      title="Spring Security 7 & Boot 4 Changes"
      sectionId="springboot"
      lessonIndex={6}
      prev={{ path: '/springboot/security', label: 'Spring Security & Auth' }}
      next={{ path: '/springboot/testing', label: 'Testing in Spring Boot' }}
    >
      <p>
        The previous lesson teaches Spring Security as it is <em>today</em>. This one is the
        translation layer: what actually changed on the way from Security 5/6 to Security 7, so
        that when you find a nine-year-old StackOverflow answer — and you will — you can convert
        it instead of pasting it.
      </p>

      <h2>Which Version Am I Actually On?</h2>
      <p>
        The three version numbers move together, and you almost never pick them independently.
        Boot chooses the Framework and Security versions for you through its dependency
        management.
      </p>

      <CodeBlock language="text" title="The version chain">
{`Spring Boot 2.x   ->  Spring Framework 5.x  ->  Spring Security 5.x    (javax.*)
Spring Boot 3.x   ->  Spring Framework 6.x  ->  Spring Security 6.x    (jakarta.*)
Spring Boot 4.x   ->  Spring Framework 7.x  ->  Spring Security 7.x

So: "we're on Boot 4" means "we're on Security 7". You do not get to
mix and match — check the version you are on before trusting any
tutorial, including this one.

  ./mvnw dependency:tree | grep spring-security-core
  ./gradlew dependencies --configuration runtimeClasspath | grep spring-security-core`}
      </CodeBlock>

      <FlowChart
        title="Translating an old snippet you found online"
        chart={"graph TD\nA[Old config snippet] --> B{extends WebSecurityConfigurerAdapter?}\nB -->|Yes| C[Pre-5.7 style — rewrite as a SecurityFilterChain bean]\nB -->|No| D{Uses .and chaining?}\nD -->|Yes| E[Security 5/6 style — rewrite in the lambda DSL]\nD -->|No| F{antMatchers / authorizeRequests?}\nF -->|Yes| G[Rename to requestMatchers / authorizeHttpRequests]\nF -->|No| H{new AntPathRequestMatcher / MvcRequestMatcher?}\nH -->|Yes| I[Both removed in 7 — use PathPatternRequestMatcher]\nH -->|No| J[Probably already Security 7-compatible]"}
      />

      <h2>1. The Lambda DSL Is No Longer a Style Choice</h2>
      <p>
        There have been three generations of Spring Security configuration. All three are still
        floating around the internet, and only the third one compiles on Security 7.
      </p>

      <CodeBlock language="java" title="Generation 1 — pre-5.7. Removed in Spring Security 6.">
{`// DOES NOT COMPILE on Security 6 or 7. The base class no longer exists.
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .antMatchers("/public/**").permitAll()
                .anyRequest().authenticated()
                .and()
            .formLogin();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(myUserDetailsService);
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Generation 2 — Security 5.7 to 6.x. Compiles on 6, REMOVED in 7.">
{`// A SecurityFilterChain bean, but still using the non-lambda overloads and
// .and() to climb back up. Every .and() here is a compile error on Security 7.
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests()
            .requestMatchers("/public/**").permitAll()
            .anyRequest().authenticated()
            .and()
        .formLogin()
            .loginPage("/login")
            .permitAll()
            .and()
        .rememberMe();

    return http.build();
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Generation 3 — the only form that compiles on Security 7">
{`@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(authorize -> authorize
            .requestMatchers("/public/**").permitAll()
            .anyRequest().authenticated()
        )
        .formLogin(formLogin -> formLogin
            .loginPage("/login")
            .permitAll()
        )
        // Customizer.withDefaults() means "turn this on with stock settings" —
        // it is the lambda equivalent of the bare .rememberMe() call above.
        .rememberMe(Customizer.withDefaults());

    return http.build();
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The mechanical translation rule">
        <p>
          Take everything between a configurer call and its matching{' '}
          <code>.and()</code>, and move it inside a lambda passed to that configurer. Drop the{' '}
          <code>.and()</code>. A bare configurer call with no options becomes{' '}
          <code>Customizer.withDefaults()</code>. That is the entire migration — the option
          methods themselves did not change names.
        </p>
      </InfoBox>

      <h3>The rest of the rename list</h3>
      <CodeBlock language="text" title="Old name → Security 7 name">
{`authorizeRequests(...)              -> authorizeHttpRequests(...)   (removed in 7.0)
antMatchers("/x/**")                -> requestMatchers("/x/**")
mvcMatchers("/x/**")                -> requestMatchers("/x/**")
regexMatchers(...)                  -> requestMatchers(RegexRequestMatcher...)
.and()                              -> (delete it; use a lambda)

http.apply(customDsl)               -> http.with(customDsl, customizer)
    // The custom-DSL entry point. apply() was deprecated in 6.2 precisely
    // because it depended on .and() chaining to be useful.

authorizeHttpRequests(a -> a
    .shouldFilterAllDispatcherTypes(false))
                                    -> authorizeHttpRequests(a -> a
                                          .dispatcherTypeMatchers(DispatcherType.ERROR)
                                          .permitAll())

AuthorizationManager#check(...)     -> AuthorizationManager#authorize(...)
    // Only matters if you wrote your own AuthorizationManager. check() was
    // removed in 7.0.

new AntPathRequestMatcher("/x/**")  -> PathPatternRequestMatcher.withDefaults()
new MvcRequestMatcher(...)                  .matcher("/x/**")
    // Both classes removed in 7.0. See the next section.`}
      </CodeBlock>

      <h2>2. PathPatternRequestMatcher Replaces Ant and Mvc Matching</h2>
      <p>
        This is the change with the sharpest edges, because it is not only a rename — the{' '}
        <em>matching semantics</em> changed, and the classes it replaces existed for a reason.
      </p>

      <h3>Why there were two matchers in the first place</h3>
      <p>
        Spring Security 5/6 had to guess how to interpret a string like{' '}
        <code>&quot;/api/orders&quot;</code>. If the request was going to be handled by Spring
        MVC&apos;s <code>DispatcherServlet</code>, MVC&apos;s own path-matching rules applied
        (suffix tolerance, trailing slashes, servlet-path stripping) — that was{' '}
        <code>MvcRequestMatcher</code>. If it was going to some other servlet, plain string
        matching applied — that was <code>AntPathRequestMatcher</code>. Spring Security tried to
        pick for you.
      </p>

      <InfoBox variant="danger" title="This guess was an actual CVE, not a theoretical concern">
        <p>
          <strong>CVE-2023-34035</strong>: when an application registered more than one servlet,
          Spring Security could choose the wrong matcher type and the authorization rule would
          silently match a different set of URLs than the author intended — potentially leaving an
          endpoint unprotected. The fix in 5.8.5 / 6.0.5 / 6.1.2 was to stop guessing and instead
          throw at startup, which is where the notorious{' '}
          <code>
            &quot;This method cannot decide whether these patterns are Spring MVC patterns or
            not&quot;
          </code>{' '}
          error comes from. If you hit that message, you are on a 6.x line and being asked to
          disambiguate by hand.
        </p>
        <p>
          Security 7 removes the ambiguity at the root: there is one matcher type,{' '}
          <code>PathPatternRequestMatcher</code>, and the DSL requires absolute URIs (less the
          context path). Nothing is inferred from which servlet will handle the request.
        </p>
      </InfoBox>

      <h3>The semantics that changed</h3>
      <p>
        <code>PathPattern</code> is Spring Framework&apos;s parsed, pre-compiled path matcher (the
        same one Spring MVC uses for <code>@RequestMapping</code>). It is faster than{' '}
        <code>AntPathMatcher</code> because patterns are parsed once into a linked structure
        instead of re-scanned per request — but it is deliberately <em>stricter</em>.
      </p>

      <CodeBlock language="text" title="PathPattern syntax, and the one rule that breaks old patterns">
{`?              matches exactly one character
*              matches zero or more characters WITHIN a single path segment
**             matches zero or more path SEGMENTS — only at the END of a pattern
{id}           matches one path segment, captured as a variable named "id"
{id:[0-9]+}    matches one segment against a regex, captured as "id"
{*path}        matches zero or more segments to the end, captured as "path"

THE BREAKING RULE:
  AntPathMatcher allowed ** in the middle:   /pages/**/details      LEGAL
  PathPattern allows ** only at the end:     /pages/**/details      ILLEGAL
                                             /pages/**             legal
                                             /pages/{*rest}        legal

  The restriction exists so two patterns can always be ranked for
  specificity without ambiguity. If you have a mid-pattern **, you must
  restructure the rule — usually by splitting it into several patterns.`}
      </CodeBlock>

      <CodeBlock language="java" title="Constructing matchers explicitly">
{`import static org.springframework.security.web.servlet.util.matcher
        .PathPatternRequestMatcher.pathPattern;

// The string overloads in the DSL already build PathPattern matchers in 7,
// so most rules need no change at all:
http.authorizeHttpRequests(a -> a
    .requestMatchers("/api/public/**").permitAll()
    .requestMatchers(HttpMethod.POST, "/api/orders").hasRole("USER")
    .anyRequest().authenticated());

// You only construct one by hand where the DSL takes a RequestMatcher —
// logout matchers, CSRF exclusions, custom filters:
RequestMatcher webhook = pathPattern(HttpMethod.POST, "/webhooks/stripe");
RequestMatcher anyDocs = pathPattern("/docs/**");

http.csrf(csrf -> csrf.ignoringRequestMatchers(webhook));

// Non-default servlet? Declare its prefix once with basePath, then write
// paths relative to it. This replaces MvcRequestMatcher's servlet-path
// awareness with something explicit you can read.
PathPatternRequestMatcher.Builder mvc =
    PathPatternRequestMatcher.withDefaults().basePath("/mvc");

http.authorizeHttpRequests(a -> a
    .requestMatchers(mvc.matcher("/orders/**")).authenticated());`}
      </CodeBlock>

      <InfoBox variant="tip" title="Still on 6.x? You can opt into the new behaviour early">
        <p>
          The 6.x migration guide gives you a way to flip to PathPattern matching{' '}
          <em>before</em> upgrading, so the semantics change and the version bump are two separate
          debugging sessions rather than one:
        </p>
        <CodeBlock language="java" title="Opt in while still on Spring Security 6.x">
{`@Bean
PathPatternRequestMatcherBuilderFactoryBean requestMatcherBuilder() {
    return new PathPatternRequestMatcherBuilderFactoryBean();
}`}
        </CodeBlock>
        <p>
          Run your security tests, fix whatever breaks, then upgrade. On Security 7 this bean is
          unnecessary — PathPattern is simply the default.
        </p>
      </InfoBox>

      <h2>3. SecurityFilterChain Is the Unit of Composition</h2>
      <p>
        Under <code>WebSecurityConfigurerAdapter</code>, having two different security policies
        meant two subclasses and a mental model of inherited <code>configure</code> overrides.
        Now a chain is a bean, and beans compose the ordinary way — which is the real reason the
        adapter was removed, not merely style.
      </p>

      <CodeBlock language="java" title="Two policies in one app: token API and browser session">
{`@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    @Order(1)                                   // lower number = consulted first
    SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        return http
            // securityMatcher scopes the WHOLE CHAIN. Requests that don't match
            // fall through to the next chain by @Order.
            .securityMatcher("/api/**")
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
            .build();
    }

    @Bean                                       // no @Order = last
    SecurityFilterChain browserChain(HttpSecurity http) throws Exception {
        return http
            // No securityMatcher: this chain matches everything the API
            // chain declined, so it is the catch-all.
            .authorizeHttpRequests(a -> a
                .requestMatchers("/", "/login", "/css/**").permitAll()
                .anyRequest().authenticated())
            .formLogin(Customizer.withDefaults())
            .csrf(csrf -> csrf.spa())
            .build();
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="securityMatcher vs requestMatchers — and the silent hole">
        <p>
          <code>securityMatcher</code> decides <strong>which chain handles a request</strong>.{' '}
          <code>requestMatchers</code> inside <code>authorizeHttpRequests</code> decides{' '}
          <strong>which rule applies within that chain</strong>. Mixing them up produces a
          specific, dangerous failure:
        </p>
        <p>
          The first chain whose <code>securityMatcher</code> matches wins, and{' '}
          <em>no other chain is consulted</em> — including its authorization rules. And if{' '}
          <strong>no</strong> chain matches a request at all, the request is not protected by
          Spring Security at all. So every application wants exactly one catch-all chain with no{' '}
          <code>securityMatcher</code> and a terminal{' '}
          <code>anyRequest().authenticated()</code> (or <code>denyAll()</code>). Ordering the
          scoped chains with <code>@Order</code> and leaving the catch-all unordered gives you
          that for free, since an unordered bean sorts last.
        </p>
      </InfoBox>

      <h2>4. Method Security: @EnableMethodSecurity</h2>
      <p>
        <code>@EnableGlobalMethodSecurity</code> is the old switch. It is deprecated (still
        present at the time of writing, but on the way out) and superseded by{' '}
        <code>@EnableMethodSecurity</code>, which is not merely a rename — the machinery
        underneath it was rewritten.
      </p>

      <CodeBlock language="java" title="Old switch vs new switch">
{`// OLD — deprecated. Note that prePostEnabled defaulted to FALSE here, which
// is why so many old projects have this exact incantation:
@EnableGlobalMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class MethodSecurityConfig extends GlobalMethodSecurityConfiguration { }

// NEW — @PreAuthorize / @PostAuthorize / @PreFilter / @PostFilter are ON by
// default. You only pass flags to turn on the OPTIONAL annotation families.
@Configuration
@EnableMethodSecurity                              // the common case: just this
class MethodSecurityConfig { }

@EnableMethodSecurity(securedEnabled = true)       // also honour @Secured
@EnableMethodSecurity(jsr250Enabled = true)        // also honour @RolesAllowed,
                                                   // @PermitAll, @DenyAll`}
      </CodeBlock>

      <InfoBox variant="note" title="What actually improved underneath">
        <ul>
          <li>
            It uses the <code>AuthorizationManager</code> API instead of the old stack of metadata
            sources, config attributes, decision managers and voters. One interface, one method.
          </li>
          <li>
            It is configured with plain beans instead of by extending{' '}
            <code>GlobalMethodSecurityConfiguration</code>.
          </li>
          <li>
            It is built on native Spring AOP rather than the old abstraction layer.
          </li>
          <li>
            It <strong>detects conflicting annotations</strong> and fails, rather than silently
            picking one — a real class of bug under the old implementation.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="warning" title="@Secured is not deprecated — it is just weak">
        <p>
          <code>@Secured(&quot;ROLE_ADMIN&quot;)</code> still works if you set{' '}
          <code>securedEnabled = true</code>. But it takes literal authority strings and nothing
          else: no SpEL, no method arguments, no return-value checks. Anything expressed with{' '}
          <code>@Secured</code> can be expressed with <code>@PreAuthorize</code>; the reverse is
          not true. Treat <code>@Secured</code> as a compatibility switch for existing code, not
          as something to write today.
        </p>
        <p>
          Also worth knowing: Spring Boot&apos;s security starter does{' '}
          <strong>not</strong> switch on method security for you. If your{' '}
          <code>@PreAuthorize</code> annotations appear to do nothing, the missing{' '}
          <code>@EnableMethodSecurity</code> is the first thing to check.
        </p>
      </InfoBox>

      <h2>5. Password Encoding and Migrating Stored Hashes</h2>
      <p>
        The <code>PasswordEncoder</code> story has been stable since Security 5.x — what changes
        in practice is the algorithm you want to be on. The mechanism that lets you move without
        a flag day is <code>DelegatingPasswordEncoder</code>.
      </p>

      <CodeBlock language="text" title="The storage format">
{`{id}encodedPassword

The id must be the first thing in the string, start with "{" and end
with "}". It selects which PasswordEncoder verifies the rest.

{bcrypt}\$2a\$10\$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG
{argon2}\$argon2id\$v=19\$m=16384,t=2,p=1\$...
{pbkdf2@SpringSecurity_v5_8}5d923b44a6d129f3ddf3e3c8d2941272...
{noop}password                     <- plaintext. Tests only. Never production.

Because the algorithm travels WITH the hash, several algorithms coexist
in one column. That is the whole trick.`}
      </CodeBlock>

      <CodeBlock language="java" title="The encoder, and what the ids map to">
{`@Bean
PasswordEncoder passwordEncoder() {
    // Encodes new passwords with bcrypt; verifies any id in the map.
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
}

// Equivalent to roughly this — build it by hand only when you want a
// different idForEncode or a custom encoder in the map.
String idForEncode = "bcrypt";
Map<String, PasswordEncoder> encoders = new HashMap<>();
encoders.put("bcrypt", new BCryptPasswordEncoder());
encoders.put("argon2", Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8());
encoders.put("pbkdf2", Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8());
encoders.put("scrypt", SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8());
encoders.put("noop", NoOpPasswordEncoder.getInstance());

PasswordEncoder encoder = new DelegatingPasswordEncoder(idForEncode, encoders);`}
      </CodeBlock>

      <InfoBox variant="note" title="New in Security 7: Password4j-backed encoders">
        <p>
          Security 7 adds a family of encoders delegating to the Password4j library —{' '}
          <code>Argon2Password4jPasswordEncoder</code>,{' '}
          <code>BcryptPassword4jPasswordEncoder</code>,{' '}
          <code>ScryptPassword4jPasswordEncoder</code>,{' '}
          <code>Pbkdf2Password4jPasswordEncoder</code> and{' '}
          <code>BalloonHashingPassword4jPasswordEncoder</code>. They are additions, not
          replacements: the existing <code>BCryptPasswordEncoder</code> and friends are
          untouched, and nothing about an upgrade forces you to adopt them.
        </p>
      </InfoBox>

      <h3>Migrating hashes without locking everyone out</h3>
      <p>
        The failure mode here is memorable because it takes down login for every user at once:
      </p>
      <CodeBlock language="text" title="The error you get from unprefixed legacy hashes">
{`java.lang.IllegalArgumentException:
    There is no PasswordEncoder mapped for the id "null"

Cause: the stored value has no {id} prefix — e.g. a bare bcrypt hash
"\$2a\$10\$..." written by an application that used a raw
BCryptPasswordEncoder before DelegatingPasswordEncoder existed.
DelegatingPasswordEncoder parses no id, and refuses to guess.`}
      </CodeBlock>

      <p>Two safe ways out, in order of preference:</p>

      <CodeBlock language="sql" title="Option A (preferred) — backfill the prefix, once">
{`-- You know what algorithm wrote these hashes. Say so, in the data.
-- Reversible, auditable, and the code stays free of legacy branches.
UPDATE users
   SET password_hash = '{bcrypt}' || password_hash
 WHERE password_hash NOT LIKE '{%}%';

-- Run it inside your migration tool (Flyway/Liquibase), and verify the
-- count matches before committing. Test the login path on a restored
-- copy of production data, not on seed data.`}
      </CodeBlock>

      <CodeBlock language="java" title="Option B — accept unprefixed hashes as a transition">
{`@Bean
PasswordEncoder passwordEncoder() {
    DelegatingPasswordEncoder encoder =
        (DelegatingPasswordEncoder) PasswordEncoderFactories.createDelegatingPasswordEncoder();

    // Anything with no recognisable {id} is tried with this encoder.
    // NOTE: this is a bridge, not a destination — it permanently accepts
    // an unlabelled hash format, which is exactly the ambiguity the {id}
    // prefix exists to remove. Backfill and delete this line.
    encoder.setDefaultPasswordEncoderForMatches(new BCryptPasswordEncoder());
    return encoder;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Upgrading the algorithm itself (bcrypt → argon2)">
        <p>
          You cannot re-hash what you do not have in plaintext, so the upgrade is{' '}
          <em>opportunistic</em>: at the one moment you legitimately hold the plaintext — a
          successful login — re-encode it and overwrite the stored value. Change{' '}
          <code>idForEncode</code> to <code>argon2</code>, keep <code>bcrypt</code> in the map,
          and the population migrates itself as people log in. The{' '}
          <strong>Auth &rarr; Encryption</strong> lesson covers the cost-factor side of choosing
          parameters.
        </p>
        <p>
          Spring Security exposes <code>PasswordEncoder.upgradeEncoding(String)</code> for the
          &quot;should I re-hash this?&quot; question;{' '}
          <code>DaoAuthenticationProvider</code> can call it during authentication, but persisting
          the new hash is your application&apos;s job — the framework does not write to your user
          table.
        </p>
      </InfoBox>

      <h2>6. OAuth2 Resource Server in Its Current Form</h2>
      <p>
        The previous lesson builds <code>JwtDecoder</code> beans by hand, which is the right
        thing when key resolution is unusual. For the ordinary case, Boot 4 wants configuration
        properties and no Java at all.
      </p>

      <CodeBlock language="yaml" title="The whole configuration, for a standard OIDC issuer">
{`spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # OIDC discovery: Boot fetches
          # <issuer-uri>/.well-known/openid-configuration, derives the
          # JWKS URI, and builds the JwtDecoder. It also validates "iss".
          issuer-uri: https://idp.example.com

          # Validate the "aud" claim declaratively. Skipping this is the
          # classic hole: a token minted for another service in the same
          # realm otherwise authenticates here.
          audiences: https://orders.example.com

          # Optional overrides:
          # jwk-set-uri: https://idp.example.com/.well-known/jwks.json
          # jws-algorithms: RS256
          # public-key-location: classpath:my-key.pub`}
      </CodeBlock>

      <CodeBlock language="java" title="...and the chain that uses it">
{`@Bean
SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(a -> a.anyRequest().authenticated())
        // No decoder argument: Boot's auto-configured JwtDecoder is used.
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .build();
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Scope-based rules without hand-writing 'SCOPE_' strings">
{`import static org.springframework.security.oauth2.core.authorization
        .OAuth2AuthorizationManagers.hasScope;

@Bean
SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(a -> a
            .requestMatchers("/messages/**").access(hasScope("message:read"))
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .build();
}

// Why this helper exists: JwtGrantedAuthoritiesConverter maps the "scope"
// claim to authorities with a "SCOPE_" prefix by default, so the equivalent
// hand-written rule is hasAuthority("SCOPE_message:read"). Getting that
// prefix wrong produces a 403 with no useful message. hasScope() removes
// the opportunity.`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to drop back to a hand-built JwtDecoder">
        <p>
          Properties cover discovery, JWKS, static keys, algorithms, issuer and audience. Reach
          for a <code>JwtDecoder</code> <code>@Bean</code> when you need something the properties
          cannot express: multiple issuers in one application, a non-standard clock skew, a
          custom claim validator, or a <code>JwkSource</code> you supply yourself (new in
          Security 7&apos;s <code>NimbusJwtDecoder</code>). Everything the previous lesson shows
          still applies — it is just no longer the starting point.
        </p>
      </InfoBox>

      <h2>7. CSRF, and the SPA Case Specifically</h2>
      <p>
        CSRF protection is <strong>on by default</strong> and always has been. What trips people
        up is a default that was added in Security 5.8 for a good reason and quietly breaks the
        React-frontend setup.
      </p>

      <h3>The two defaults that interact badly</h3>
      <ul>
        <li>
          <strong>BREACH protection.</strong> The default token request handler is{' '}
          <code>XorCsrfTokenRequestAttributeHandler</code>, which XORs random bytes into the token
          on every request so the rendered value differs each time. This defeats BREACH, a
          compression-oracle attack that recovers a repeated secret from HTTPS response sizes.
        </li>
        <li>
          <strong>Deferred loading.</strong> The <code>CsrfToken</code> is not resolved until
          something needs it — an unsafe request arrives, or the response renders it. This avoids
          loading the session on every GET.
        </li>
      </ul>

      <p>
        Now consider a React SPA with <code>CookieCsrfTokenRepository</code>. The cookie holds the{' '}
        <strong>raw</strong> token. Your JavaScript reads the cookie and echoes it back in the{' '}
        <code>X-XSRF-TOKEN</code> header — but the server, running the Xor handler, expects to
        decode a randomised value. Raw in, decode attempted, mismatch, <code>403</code>. Add to
        that: the cookie is cleared on authentication and on logout success (the token must rotate
        with the session), so a SPA that cached the token at page load starts failing right after
        the user signs in.
      </p>

      <InfoBox variant="danger" title="The fix everyone finds first is a downgrade">
        <p>
          Search this 403 and the top answer is &quot;set{' '}
          <code>csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())</code>.&quot; It
          does work — because that handler&apos;s{' '}
          <strong>stated purpose is to opt out of BREACH protection</strong>. You have fixed the
          symptom by removing the mitigation, and usually without realising it. The correct shape
          is to keep Xor for <em>rendering</em> and resolve the plain value on the way{' '}
          <em>in</em>, which is fiddly enough that people got it wrong for three years.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Security 7: the whole problem is one method">
{`@Bean
SecurityFilterChain spaChain(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(a -> a.anyRequest().authenticated())
        // New in 7.0. Per its javadoc: "Sensible CSRF defaults when used in
        // combination with a single page application. Creates a cookie-based
        // token repository and a custom request handler to resolve the actual
        // token value instead of the encoded token."
        .csrf(csrf -> csrf.spa())
        .build();
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Before 7.0 — what spa() replaces, if you are still on 6.x">
{`// The equivalent hand-rolled setup: cookie repository, plus a handler that
// delegates rendering to Xor but resolves the incoming value plainly.
@Bean
SecurityFilterChain spaChain(HttpSecurity http) throws Exception {
    CsrfTokenRequestAttributeHandler plain = new CsrfTokenRequestAttributeHandler();
    XorCsrfTokenRequestAttributeHandler xor = new XorCsrfTokenRequestAttributeHandler();

    CsrfTokenRequestHandler spa = new CsrfTokenRequestHandler() {
        @Override
        public void handle(HttpServletRequest req, HttpServletResponse res,
                           Supplier<CsrfToken> token) {
            xor.handle(req, res, token);        // render: BREACH-protected
        }
        @Override
        public String resolveCsrfTokenValue(HttpServletRequest req, CsrfToken token) {
            // Header set by the SPA from the cookie -> raw value.
            // Form parameter -> encoded value, so fall back to xor.
            return StringUtils.hasText(req.getHeader(token.getHeaderName()))
                ? plain.resolveCsrfTokenValue(req, token)
                : xor.resolveCsrfTokenValue(req, token);
        }
    };

    return http
        .csrf(csrf -> csrf
            .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .csrfTokenRequestHandler(spa))
        .build();
}

// Sketch of the well-known 6.x workaround, not a verbatim quote from the
// reference docs — check yours against the Spring Security samples repo
// for the exact shape before shipping it. On 7, prefer csrf.spa().`}
      </CodeBlock>

      <InfoBox variant="warning" title="httpOnly=false is correct here, and only here">
        <p>
          <code>CookieCsrfTokenRepository.withHttpOnlyFalse()</code> deliberately makes the CSRF
          cookie readable by JavaScript, which sounds like a mistake and is not: the CSRF token is
          not a credential. Knowing it grants nothing; the protection comes from a cross-origin
          attacker being unable to <em>read</em> it off your origin. Your session cookie is a
          different cookie and stays <code>HttpOnly</code>. If your JS does not need to read the
          token — a server-rendered form app — leave <code>HttpOnly</code> on.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="Cookie settings moved to a customizer in 7">
        <p>
          The individual setters on <code>CookieCsrfTokenRepository</code> —{' '}
          <code>setCookieHttpOnly</code>, <code>setCookieMaxAge</code>,{' '}
          <code>setSecure</code>, <code>setCookieDomain</code> — are replaced by one{' '}
          <code>setCookieCustomizer</code>:
        </p>
        <CodeBlock language="java" title="Old setters → cookie customizer">
{`// Before
repository.setCookieMaxAge(86400);

// After
repository.setCookieCustomizer(c -> c.maxAge(86400));`}
        </CodeBlock>
      </InfoBox>

      <h3>And when you should not have CSRF on at all</h3>
      <p>
        Nothing here changes the rule from the previous lesson: a genuinely stateless API where
        the only credential is an <code>Authorization: Bearer</code> header has no CSRF exposure,
        because a browser will not attach that header cross-origin on its own. Disable it.{' '}
        <em>But</em> — if your React app authenticates with a session cookie, or with a JWT{' '}
        <em>stored in a cookie</em>, the browser does attach it automatically and you are back in
        CSRF territory. The credential&apos;s transport decides, not the token format.
      </p>

      <h2>The 5/6 → 7 Upgrade Checklist</h2>
      <InfoBox variant="success" title="Work through this in order">
        <ul>
          <li>
            <strong>Do it on 6.x first.</strong> Get to the latest 6.x, turn on deprecation
            warnings, and fix every deprecation before touching the major version. Most of
            Security 7&apos;s removals were deprecated for a full release line.
          </li>
          <li>
            <strong>Delete every <code>.and()</code>.</strong> Convert each configurer to the
            lambda form; a bare configurer becomes{' '}
            <code>Customizer.withDefaults()</code>.
          </li>
          <li>
            <strong>Rename <code>authorizeRequests</code> → <code>authorizeHttpRequests</code></strong>{' '}
            and <code>antMatchers</code>/<code>mvcMatchers</code> →{' '}
            <code>requestMatchers</code>.
          </li>
          <li>
            <strong>Replace <code>AntPathRequestMatcher</code> and <code>MvcRequestMatcher</code></strong>{' '}
            with <code>PathPatternRequestMatcher</code>. Publish{' '}
            <code>PathPatternRequestMatcherBuilderFactoryBean</code> on 6.x to test the semantics
            change in isolation.
          </li>
          <li>
            <strong>Grep your patterns for a mid-pattern <code>**</code></strong> — e.g.{' '}
            <code>/api/**/admin</code>. Illegal under PathPattern; restructure the rule.
          </li>
          <li>
            <strong>Confirm you have a catch-all chain</strong> with no{' '}
            <code>securityMatcher</code> ending in <code>anyRequest().authenticated()</code>, so
            no request escapes unmatched.
          </li>
          <li>
            <strong>Swap <code>@EnableGlobalMethodSecurity</code> for <code>@EnableMethodSecurity</code></strong>,
            dropping <code>prePostEnabled = true</code> (now the default) and keeping{' '}
            <code>securedEnabled</code>/<code>jsr250Enabled</code> only if you actually use those
            annotations.
          </li>
          <li>
            <strong>Custom <code>AuthorizationManager</code>?</strong> Implement{' '}
            <code>authorize(...)</code>; <code>check(...)</code> was removed.
          </li>
          <li>
            <strong>Verify every stored password hash carries an <code>{'{id}'}</code> prefix</strong>{' '}
            before deploying — this is the one item on the list that fails for 100% of users
            simultaneously.
          </li>
          <li>
            <strong>Replace SPA CSRF hand-rolling with <code>csrf.spa()</code></strong>, and check
            you have not silently opted out of BREACH protection with a bare{' '}
            <code>CsrfTokenRequestAttributeHandler</code>.
          </li>
          <li>
            <strong>Move OAuth2 resource-server config to properties</strong> where a hand-built
            decoder is no longer earning its keep — and add <code>audiences</code> if it is
            missing.
          </li>
          <li>
            <strong>Run the security tests before and after.</strong> The Testing lesson&apos;s
            four cases — anonymous, wrong role, cross-user, happy path — are exactly the ones a
            matcher-semantics change breaks.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="note" title="Where this page is deliberately vague">
        <p>
          Two things above are described rather than asserted precisely. The pre-7.0 SPA CSRF
          handler is a sketch of the widely-circulated workaround, not a quotation — if you are
          staying on 6.x, copy it from the Spring Security samples repository instead of from
          here. And <code>@EnableGlobalMethodSecurity</code> is <em>deprecated</em> as of the
          current documentation, not removed; assume it disappears in a future release rather
          than treating its continued presence as a guarantee.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Your React SPA gets 403 on every POST. The chain uses CookieCsrfTokenRepository.withHttpOnlyFalse() and the frontend reads the XSRF-TOKEN cookie and sends it as X-XSRF-TOKEN. What is happening, and what is the right fix on Spring Security 7?"
        options={[
          "CSRF is broken for SPAs — disable it with csrf(AbstractHttpConfigurer::disable)",
          "The cookie needs httpOnly=true so the browser sends it automatically",
          "The default XorCsrfTokenRequestAttributeHandler expects a BREACH-randomised token, but the cookie holds the raw value — use csrf(csrf -> csrf.spa())",
          "Set csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()) — it is the documented SPA handler"
        ]}
        correctIndex={2}
        explanation="Spring Security's default token request handler is XorCsrfTokenRequestAttributeHandler, which encodes randomness into the rendered token so the value changes per request and BREACH cannot recover it. The cookie written by CookieCsrfTokenRepository holds the RAW token, so a SPA echoing the cookie back sends a value the Xor handler then tries to decode — mismatch, 403. Option 4 is the answer you will find online and it does stop the 403, but only because that handler's documented purpose is to opt OUT of BREACH protection; you have removed a mitigation to fix a symptom. Option 1 is worse: a cookie-authenticated app genuinely needs CSRF. Option 2 is backwards — httpOnly=false is required precisely so JavaScript can read the token, and the CSRF token is not a credential. Spring Security 7 adds csrf.spa(), which wires a cookie repository plus a handler that resolves the actual token value instead of the encoded one, keeping BREACH protection on the rendering path."
      />
    </LessonLayout>
  );
}
