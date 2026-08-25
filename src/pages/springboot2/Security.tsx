import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Security() {
  return (
    <LessonLayout
      title="Security the Boot 2 Way"
      sectionId="springboot2"
      lessonIndex={2}
      prev={{ path: '/springboot2/javax', label: 'The javax World — Namespace, JPA, Servlets' }}
      next={{ path: '/springboot2/data', label: 'Spring Data & JPA on Hibernate 5' }}
    >
      <p>
        Open any Spring Boot 2 codebase and go to the security configuration. You will find a
        class extending <code>WebSecurityConfigurerAdapter</code> with two{' '}
        <code>configure</code> overrides. It was the canonical idiom for roughly eight years, it
        is what every tutorial written before 2022 shows, and it is the shape most StackOverflow
        answers are still in.
      </p>

      <p>
        It is also <strong>gone</strong> — not deprecated-but-working, not behind a flag. Deleted.
        This lesson is about reading the old idiom fluently, and knowing precisely what each piece
        became.
      </p>

      <InfoBox variant="info" title="How this lesson relates to the others">
        <p>
          The <a href="/springboot/security">Spring Security &amp; Auth</a> lesson teaches
          security as it is today. The{' '}
          <a href="/springboot/security-migration">Spring Security 7 &amp; Boot 4 Changes</a>{' '}
          lesson covers the 5/6 &rarr; 7 upgrade in full detail — the lambda DSL, PathPattern
          matching, method security, password encoders, CSRF for SPAs. <strong>This page does not
          repeat any of that.</strong> It covers the one step before it: the Boot 2 idiom itself,
          and why a codebase sitting on it is in a more urgent position than it looks.
        </p>
      </InfoBox>

      <h2>The Deprecation Timeline, Verified</h2>

      <p>
        The dates here matter enormously to how you should feel about a Boot 2 codebase, so rather
        than assert them, here is the class itself checked in five published jars from Maven
        Central. The test is simply: is the class file present, and does it carry the{' '}
        <code>Deprecated</code> attribute in its bytecode?
      </p>

      <CodeBlock language="bash" title="The check">
{`for v in 5.6.12 5.7.14 5.8.16 6.0.8 6.5.11; do
  j=spring-security-config-$v.jar
  printf '  security %-8s ' $v
  if unzip -p $j org/springframework/security/config/annotation/web/\\
configuration/WebSecurityConfigurerAdapter.class > W.class 2>/dev/null && [ -s W.class ]; then
    if javap -v W.class | grep -q 'Deprecated: true';
      then echo "PRESENT, @Deprecated"; else echo "PRESENT, not deprecated"; fi
  else echo "REMOVED (class not in jar)"; fi
done`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`  security 5.6.12   PRESENT, not deprecated
  security 5.7.14   PRESENT, @Deprecated
  security 5.8.16   PRESENT, @Deprecated
  security 6.0.8    REMOVED (class not in jar)
  security 6.5.11   REMOVED (class not in jar)`}
      </CodeBlock>

      <p>So the story is exactly:</p>

      <CodeBlock language="text" title="WebSecurityConfigurerAdapter, end to end">
{`Spring Security 5.6 and earlier   the normal, recommended way to do this
Spring Security 5.7               DEPRECATED  (Boot 2.7 ships this)
Spring Security 5.8               still deprecated, still present
Spring Security 6.0               REMOVED — hard compile failure
Spring Security 7.x               still gone, obviously`}
      </CodeBlock>

      <InfoBox variant="danger" title="Why this specific timeline should worry you">
        <p>
          Spring Boot 2.7 ships Spring Security 5.7/5.8. That means a Boot 2.7 codebase using this
          class <strong>is compiling with deprecation warnings right now</strong> — warnings that
          are almost certainly switched off or scrolled past, because they have been there since
          2022 and nothing has broken.
        </p>
        <p>
          The moment someone bumps to Boot 3, those warnings become <strong>compile
          errors</strong>, and not in a file or two. In every security configuration class in the
          repository, all at once, in the same commit as the javax rename and the Java 17 bump.
          This is the single best argument for doing the security rewrite <em>while still on Boot
          2</em>, which is the recommendation at the bottom of this page.
        </p>
      </InfoBox>

      <h2>The Boot 2 Idiom, In Full</h2>

      <p>
        Here is the complete pattern as you will actually meet it. Read it carefully — every
        numbered piece is dissected below.
      </p>

      <CodeBlock language="java" title="SecurityConfig.java — the classic Boot 2 shape">
{`import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)          // (6)
public class SecurityConfig extends WebSecurityConfigurerAdapter {   // (1)

    private final UserDetailsService userDetailsService;

    public SecurityConfig(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {   // (2)
        http
            .csrf().disable()                                        // (4)
                .authorizeRequests()                                 // (3)
                .antMatchers("/public/**", "/actuator/health").permitAll()   // (3)
                .antMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
                .and()                                               // (4)
            .formLogin()
                .loginPage("/login")
                .permitAll()
                .and()
            .logout()
                .logoutUrl("/logout")
                .and()
            .sessionManagement()
                .maximumSessions(1);
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {  // (5)
        auth.userDetailsService(userDetailsService)
            .passwordEncoder(passwordEncoder());
    }

    @Override
    public void configure(WebSecurity web) {                          // (7)
        web.ignoring().antMatchers("/css/**", "/js/**", "/images/**");
    }

    @Override
    @Bean                                                             // (8)
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}`}
      </CodeBlock>

      <h2>What The Compiler Says About That File</h2>

      <p>
        Rather than describe the failure, here it is. I compiled a cut-down version of exactly
        that class against two real Spring Security releases pulled from Maven Central. First,
        against 5.8.16 — the line a Boot 2.7 application is on:
      </p>

      <CodeBlock language="java" title="SecurityConfig.java — the file under test">
{`import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

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
        auth.inMemoryAuthentication()
            .withUser("admin").password("{noop}secret").roles("ADMIN");
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Spring Security 5.8.16 (what Boot 2.7 sees today)">
{`$ javac --release 17 -Xlint:deprecation -cp "spring-security-*-5.8.16.jar:spring-*-5.3.39.jar:\\
javax.servlet-api-4.0.1.jar" -d out SecurityConfig.java

SecurityConfig.java:9: warning: [deprecation] WebSecurityConfigurerAdapter in org.springframework.security.config.annotation.web.configuration has been deprecated
public class SecurityConfig extends WebSecurityConfigurerAdapter {
                                    ^
SecurityConfig.java:14: warning: [deprecation] authorizeRequests() in HttpSecurity has been deprecated
            .authorizeRequests()
            ^
SecurityConfig.java:15: warning: [deprecation] antMatchers(String...) in AbstractRequestMatcherRegistry has been deprecated
                .antMatchers("/public/**").permitAll()
                ^
  where C is a type-variable:
    C extends Object declared in class AbstractRequestMatcherRegistry
3 warnings`}
      </CodeBlock>

      <InfoBox variant="warning" title="Three warnings. It compiles. That is the trap.">
        <p>
          The build is green. The tests pass. Nothing is on fire. And note that these only
          appeared because I passed <code>-Xlint:deprecation</code> — without it, javac prints a
          single summary line that most CI logs swallow entirely. This is what &quot;we didn&apos;t
          know it was a problem&quot; looks like from the inside.
        </p>
      </InfoBox>

      <p>Now the identical file against Spring Security 6.5.11:</p>

      <CodeBlock language="text" title="Real output — Spring Security 6.5.11 (what you get after upgrading)">
{`$ javac --release 17 -cp "spring-security-*-6.5.11.jar:spring-*-6.2.11.jar:\\
jakarta.servlet-api-6.0.0.jar" -d out SecurityConfig.java

SecurityConfig.java:5: error: cannot find symbol
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
                                                                       ^
  symbol:   class WebSecurityConfigurerAdapter
  location: package org.springframework.security.config.annotation.web.configuration
SecurityConfig.java:9: error: cannot find symbol
public class SecurityConfig extends WebSecurityConfigurerAdapter {
                                    ^
  symbol: class WebSecurityConfigurerAdapter
SecurityConfig.java:11: error: configure(HttpSecurity) in SecurityConfig does not override or implement a method from a supertype
    @Override
    ^
SecurityConfig.java:15: error: cannot find symbol
                .antMatchers("/public/**").permitAll()
                ^
  symbol:   method antMatchers(String)
  location: class ExpressionUrlAuthorizationConfigurer<HttpSecurity>.ExpressionInterceptUrlRegistry
SecurityConfig.java:21: error: configure(AuthenticationManagerBuilder) in SecurityConfig does not override or implement a method from a supertype
    @Override
    ^
5 errors
1 warning`}
      </CodeBlock>

      <InfoBox variant="note" title="Two details in that output worth pausing on">
        <p>
          <strong>One.</strong> Both <code>@Override</code> annotations produce their own separate
          error — <em>&quot;does not override or implement a method from a supertype&quot;</em>.
          Once the base class is gone, the compiler no longer knows these methods were meant to be
          overrides, so a single missing class fans out into an error per method. That is why the
          error count in a real codebase is so much larger than the number of classes involved,
          and why the first look at the build log is so demoralising.
        </p>
        <p>
          <strong>Two.</strong> The suppressed warning is the interesting one:{' '}
          <code>authorizeRequests() ... has been deprecated and marked for removal</code>. So on
          Security 6.5, <code>authorizeRequests()</code> still <em>exists</em> — but the registry
          object it returns no longer has <code>antMatchers</code> on it. That is why the
          <code>antMatchers</code> error names{' '}
          <code>ExpressionUrlAuthorizationConfigurer.ExpressionInterceptUrlRegistry</code> rather
          than your class. The old entry point survived one release line longer than the methods
          you reach through it.
        </p>
      </InfoBox>

      <h2>Piece By Piece: What Each Part Became</h2>

      <FlowChart
        title="Translating the Boot 2 idiom"
        chart={"graph TD\nA[\"extends WebSecurityConfigurerAdapter\"] --> B[\"A SecurityFilterChain @Bean\"]\nC[\"configure(HttpSecurity)\"] --> B\nD[\"configure(AuthenticationManagerBuilder)\"] --> E[\"A UserDetailsService / AuthenticationProvider @Bean\"]\nF[\"configure(WebSecurity) web.ignoring()\"] --> G[\"permitAll() rule, or a separate chain\"]\nH[\"authorizeRequests()\"] --> I[\"authorizeHttpRequests(lambda)\"]\nJ[\"antMatchers / mvcMatchers\"] --> K[\"requestMatchers\"]\nL[\".and() chaining\"] --> M[\"Nested lambdas — .and() removed in 7\"]\nN[\"@EnableGlobalMethodSecurity\"] --> O[\"@EnableMethodSecurity\"]\nstyle B fill:#1a3329,stroke:#4ade80\nstyle E fill:#1a3329,stroke:#4ade80"}
      />

      <h3>(1) and (2) — the adapter and configure(HttpSecurity)</h3>

      <p>
        These are one change. The subclass-and-override model became a bean-producing method. The
        rules inside are the <em>same rules</em>; only the container around them changed.
      </p>

      <CodeBlock language="java" title="Boot 2 — inheritance">
{`@Configuration
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
        // Note: no return. You mutate the HttpSecurity you were handed.
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Boot 3/4 — composition">
{`@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(Customizer.withDefaults())
            .build();          // <- you build and RETURN the chain
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why this was a genuine design improvement, not churn">
        <p>
          Under the adapter, two different security policies in one application meant two
          subclasses, an <code>@Order</code> on each, and a mental model of inherited{' '}
          <code>configure</code> methods. As beans, chains compose the ordinary Spring way — you
          can order them, conditionally register them, build them in a loop, or return one from a{' '}
          <code>@ConditionalOnProperty</code> method. The removal of the adapter is a consequence
          of that being strictly better, not a rename for its own sake. The{' '}
          <a href="/springboot/security-migration">migration lesson</a> shows the multi-chain
          pattern and the security hole to avoid when you use it.
        </p>
      </InfoBox>

      <h3>(3) — authorizeRequests and antMatchers</h3>

      <CodeBlock language="text" title="The renames">
{`authorizeRequests(...)     ->  authorizeHttpRequests(...)
antMatchers("/x/**")       ->  requestMatchers("/x/**")
mvcMatchers("/x/**")       ->  requestMatchers("/x/**")
regexMatchers(...)         ->  requestMatchers(RegexRequestMatcher.regexMatcher(...))

Deprecated in 5.8, removed in 7.0. The REPLACEMENT is not merely renamed —
authorizeHttpRequests uses the AuthorizationManager API underneath instead
of the old voter/decision-manager stack.`}
      </CodeBlock>

      <InfoBox variant="danger" title="antMatchers to requestMatchers is not always a pure rename">
        <p>
          The names map one-to-one, but the <em>matching semantics</em> changed underneath, and
          in Security 7 <code>AntPathRequestMatcher</code> and <code>MvcRequestMatcher</code> are
          both removed in favour of <code>PathPatternRequestMatcher</code>. The rule that bites:{' '}
          <code>**</code> in the <em>middle</em> of a pattern was legal for{' '}
          <code>AntPathMatcher</code> and is illegal for <code>PathPattern</code>. A rule like{' '}
          <code>/api/**/admin</code> must be restructured, not renamed.
        </p>
        <p>
          There is also a real CVE in this history — Spring Security used to <em>guess</em> which
          matcher type applied and could guess wrong, leaving endpoints unprotected. All of that,
          including the notorious &quot;This method cannot decide whether these patterns are
          Spring MVC patterns or not&quot; startup error, is covered properly in the{' '}
          <a href="/springboot/security-migration">Spring Security 7 &amp; Boot 4 Changes</a>{' '}
          lesson. Do not treat this line as a find-and-replace without reading it.
        </p>
      </InfoBox>

      <h3>(4) — csrf().disable() and the .and() chain</h3>

      <p>
        The <code>.and()</code> method exists to climb back up the builder after descending into a
        configurer. In the lambda DSL there is nothing to climb back up from, because each
        configurer&apos;s options are scoped inside its own lambda.
      </p>

      <CodeBlock language="java" title="Boot 2 — flat chain, indentation is the only structure">
{`http
    .csrf().disable()
        .authorizeRequests()
        .antMatchers("/public/**").permitAll()
        .anyRequest().authenticated()
        .and()
    .formLogin()
        .loginPage("/login")
        .permitAll()
        .and()
    .logout()
        .logoutUrl("/logout");`}
      </CodeBlock>

      <CodeBlock language="java" title="Boot 3/4 — the nesting is real, and the compiler enforces it">
{`http
    .csrf(csrf -> csrf.disable())
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/public/**").permitAll()
        .anyRequest().authenticated()
    )
    .formLogin(form -> form
        .loginPage("/login")
        .permitAll()
    )
    .logout(logout -> logout
        .logoutUrl("/logout")
    );

// csrf(AbstractHttpConfigurer::disable) is the idiomatic short form.
// A configurer with no options at all becomes Customizer.withDefaults().`}
      </CodeBlock>

      <InfoBox variant="warning" title="The bug the old style made easy">
        <p>
          In the flat chain, whether a call applies to the previous configurer or to{' '}
          <code>http</code> itself depends on what the previous method <em>returned</em>, which
          the indentation only suggests. Misplace one <code>.and()</code> and you silently attach
          an option to the wrong configurer — the code compiles and the rule quietly does
          something other than what it reads like. Look again at the sample above:{' '}
          <code>.csrf().disable()</code> returns <code>HttpSecurity</code>, so{' '}
          <code>.authorizeRequests()</code> is a fresh start despite being indented as though it
          is nested under csrf. The lambda form cannot express that ambiguity at all. This is the
          strongest argument for the rewrite beyond &quot;the old one was deleted&quot;.
        </p>
      </InfoBox>

      <h3>(5) — configure(AuthenticationManagerBuilder)</h3>

      <p>
        This was the hook for telling Spring Security where users come from. It also disappeared
        with the adapter, and its replacement is: <em>just publish the beans</em>.
      </p>

      <CodeBlock language="java" title="Boot 2 — three common variants">
{`// (a) A UserDetailsService plus an encoder
@Override
protected void configure(AuthenticationManagerBuilder auth) throws Exception {
    auth.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
}

// (b) In-memory users, usually for a demo or an internal tool
@Override
protected void configure(AuthenticationManagerBuilder auth) throws Exception {
    auth.inMemoryAuthentication()
        .withUser("admin").password("{noop}secret").roles("ADMIN");
}

// (c) A custom provider — LDAP, a legacy SSO, a bespoke token check
@Override
protected void configure(AuthenticationManagerBuilder auth) {
    auth.authenticationProvider(myCustomProvider);
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Boot 3/4 — the same three, as beans">
{`// (a)
@Bean
UserDetailsService userDetailsService(UserRepository repo) {
    return username -> repo.findByUsername(username)
        .map(u -> User.withUsername(u.getUsername())
                      .password(u.getPasswordHash())
                      .roles(u.getRoles())
                      .build())
        .orElseThrow(() -> new UsernameNotFoundException(username));
}

@Bean
PasswordEncoder passwordEncoder() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
}

// (b)
@Bean
UserDetailsService users() {
    return new InMemoryUserDetailsManager(
        User.withUsername("admin").password("{noop}secret").roles("ADMIN").build());
}

// (c) A DaoAuthenticationProvider, or any AuthenticationProvider, as a bean.
@Bean
AuthenticationProvider authenticationProvider(UserDetailsService uds, PasswordEncoder enc) {
    DaoAuthenticationProvider p = new DaoAuthenticationProvider();
    p.setUserDetailsService(uds);
    p.setPasswordEncoder(enc);
    return p;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Where the AuthenticationManager itself comes from now">
        <p>
          Spring Security builds one from whatever <code>AuthenticationProvider</code> or{' '}
          <code>UserDetailsService</code> beans it finds. If you need to inject it yourself —
          typically for a custom login endpoint that issues a JWT — obtain it from{' '}
          <code>AuthenticationConfiguration</code> rather than reaching for the old{' '}
          <code>authenticationManagerBean()</code> override:
        </p>
        <CodeBlock language="java" title="Getting an AuthenticationManager to inject">
{`@Bean
AuthenticationManager authenticationManager(AuthenticationConfiguration config)
        throws Exception {
    return config.getAuthenticationManager();
}`}
        </CodeBlock>
      </InfoBox>

      <h3>(6) — @EnableGlobalMethodSecurity</h3>

      <CodeBlock language="java" title="Old switch vs new switch">
{`// Boot 2. Note prePostEnabled defaulted to FALSE, which is why this exact
// incantation appears in every Boot 2 project that uses @PreAuthorize.
@EnableGlobalMethodSecurity(prePostEnabled = true, securedEnabled = true)

// Boot 3/4. @PreAuthorize / @PostAuthorize / @PreFilter / @PostFilter are
// ON by default; flags only enable the OPTIONAL annotation families.
@EnableMethodSecurity                          // the common case
@EnableMethodSecurity(securedEnabled = true)   // also honour @Secured
@EnableMethodSecurity(jsr250Enabled = true)    // also @RolesAllowed/@PermitAll/@DenyAll`}
      </CodeBlock>

      <InfoBox variant="danger" title="The silent failure mode when you migrate this line">
        <p>
          Dropping <code>prePostEnabled = true</code> is correct — it is the default now. But if
          you delete the annotation entirely, or forget to add{' '}
          <code>@EnableMethodSecurity</code> at all, your <code>@PreAuthorize</code> annotations
          <strong> silently stop being enforced</strong>. No error, no warning, no failed startup.
          Every method becomes accessible to every authenticated user, and your tests pass unless
          you specifically wrote authorization tests for the negative case.
        </p>
        <p>
          Spring Boot&apos;s security starter does not switch method security on for you. If you
          migrate this line, write a test that asserts a wrong-role call gets a 403 before you
          believe it works.
        </p>
      </InfoBox>

      <h3>(7) — configure(WebSecurity) and web.ignoring()</h3>

      <CodeBlock language="java" title="Boot 2 — bypass the filter chain entirely for static assets">
{`@Override
public void configure(WebSecurity web) {
    web.ignoring().antMatchers("/css/**", "/js/**", "/images/**");
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Boot 3/4 — express it as a rule instead">
{`@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/css/**", "/js/**", "/images/**").permitAll()
            .anyRequest().authenticated())
        .build();
}

// Boot 3+ also gives you a shortcut for the standard static locations:
//   .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()`}
      </CodeBlock>

      <InfoBox variant="warning" title="These two are not equivalent, and the difference is a security decision">
        <p>
          <code>web.ignoring()</code> means the request never enters the Spring Security filter
          chain at all — so no security headers are applied, no CSRF token is available, and no
          authentication context exists. <code>permitAll()</code> means the request goes{' '}
          <em>through</em> the chain and is then allowed. Spring Security actively warns against{' '}
          <code>ignoring()</code> for anything that is not a genuinely static, genuinely public
          file, precisely because the headers are the part people forget they lost.
        </p>
        <p>
          If a Boot 2 codebase has anything dynamic under <code>web.ignoring()</code> —{' '}
          <code>/api/**</code>, an actuator path, an upload endpoint — treat that as a finding
          during migration, not as a line to translate faithfully.
        </p>
      </InfoBox>

      <h3>(8) — the authenticationManagerBean() override</h3>

      <CodeBlock language="java" title="Boot 2 — the incantation for exposing the manager">
{`@Override
@Bean
public AuthenticationManager authenticationManagerBean() throws Exception {
    return super.authenticationManagerBean();
}

// This existed because the AuthenticationManager built by the adapter was
// NOT published as a bean by default, so a custom login controller could
// not inject it. Every JWT tutorial from that era includes this method.`}
      </CodeBlock>

      <p>
        Replaced by the <code>AuthenticationConfiguration</code> bean shown under (5). If you see
        this override, the codebase almost certainly has a hand-rolled login endpoint somewhere —
        worth finding, because it is usually where the interesting authentication logic lives.
      </p>

      <h2>The Full Translation Table</h2>

      <CodeBlock language="text" title="Boot 2 security -> current">
{`extends WebSecurityConfigurerAdapter   ->  a SecurityFilterChain @Bean
configure(HttpSecurity)                ->  the body of that @Bean, returning http.build()
configure(AuthenticationManagerBuilder)->  UserDetailsService / AuthenticationProvider @Beans
configure(WebSecurity) web.ignoring()  ->  permitAll() rule (NOT equivalent — see above)
authenticationManagerBean()            ->  AuthenticationConfiguration#getAuthenticationManager

authorizeRequests()                    ->  authorizeHttpRequests(lambda)
antMatchers(...)                       ->  requestMatchers(...)
mvcMatchers(...)                       ->  requestMatchers(...)
regexMatchers(...)                     ->  requestMatchers(RegexRequestMatcher.regexMatcher(...))
.and()                                 ->  delete it; nest a lambda instead
.csrf().disable()                      ->  .csrf(AbstractHttpConfigurer::disable)
bare .formLogin()                      ->  .formLogin(Customizer.withDefaults())

@EnableGlobalMethodSecurity(
    prePostEnabled = true)             ->  @EnableMethodSecurity  (prePost is now default)
@EnableGlobalMethodSecurity(
    securedEnabled = true)             ->  @EnableMethodSecurity(securedEnabled = true)

antMatchers on a non-default servlet   ->  PathPatternRequestMatcher with .basePath(...)
new AntPathRequestMatcher(...)         ->  PathPatternRequestMatcher  (removed in 7.0)
new MvcRequestMatcher(...)             ->  PathPatternRequestMatcher  (removed in 7.0)`}
      </CodeBlock>

      <h2>Do This Migration First, While Still On Boot 2</h2>

      <p>
        This is the practical recommendation of the whole lesson, and it is worth stating plainly.
      </p>

      <InfoBox variant="success" title="The security rewrite is available to you today">
        <p>
          <code>SecurityFilterChain</code> beans, the lambda DSL,{' '}
          <code>authorizeHttpRequests</code>, <code>requestMatchers</code> and{' '}
          <code>@EnableMethodSecurity</code> all landed in <strong>Spring Security 5.7</strong> —
          which is what Boot 2.7 ships. That is the entire reason the adapter was deprecated
          rather than removed in that release: to give you a window where both styles compile.
        </p>
        <p>
          So you can rewrite every security config in the repository{' '}
          <strong>without changing a single version number</strong>, ship it as its own pull
          request, run your existing security tests against it, and have it in production for
          weeks before anyone touches Boot 3. When the big upgrade finally happens, security is
          already done and is not competing for attention with javax imports and Hibernate 6.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="The alternative, for contrast">
        <p>
          Bundle it into the Boot 3 upgrade and your first compile produces the javax errors, the
          Java 17 errors, the Hibernate mapping errors, <em>and</em> five security errors per
          config class — with no way to tell which failure caused which. Worse, security failures
          are the category where &quot;I made the compiler happy&quot; and &quot;it is still
          correct&quot; are furthest apart. A green build proves nothing about whether{' '}
          <code>/admin/**</code> is still protected.
        </p>
      </InfoBox>

      <CodeBlock language="bash" title="Automate the mechanical part">
{`# OpenRewrite has a recipe for exactly this class.
./mvnw -U org.openrewrite.maven:rewrite-maven-plugin:run \\
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE \\
  -Drewrite.activeRecipes=org.openrewrite.java.spring.security5.WebSecurityConfigurerAdapter

# Verified present in rewrite-spring-6.37.1.jar. It converts the adapter
# subclass into SecurityFilterChain / UserDetailsService beans.
# Review the diff by hand — see the warning below.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Review this diff line by line, unlike the javax one">
        <p>
          The javax rename is safe to accept wholesale: a wrong answer does not compile. Security
          is the opposite — a wrong answer compiles fine and quietly changes who can reach what.
          The recipe is good, and it is still transforming an inheritance-based configuration into
          a bean-based one, which involves judgement about ordering and scope. Read every hunk,
          and gate the merge on tests that assert the negative cases: anonymous access denied,
          wrong role denied, cross-user access denied.
        </p>
      </InfoBox>

      <h2>Where To Go Next</h2>

      <p>
        Once the configs are in the <code>SecurityFilterChain</code> shape, the remaining distance
        to Boot 4 is the <code>.and()</code> removal, the PathPattern matcher change, and a
        handful of API renames — all covered in{' '}
        <a href="/springboot/security-migration">Spring Security 7 &amp; Boot 4 Changes</a>, which
        also has the upgrade checklist to work through in order.
      </p>

      <InteractiveChallenge
        question="Your team is on Boot 2.7 with Spring Security 5.8. The security config extends WebSecurityConfigurerAdapter and compiles with deprecation warnings. When is the best time to rewrite it as SecurityFilterChain beans?"
        options={[
          "During the Boot 3 upgrade, since that is when it stops compiling anyway",
          "Now, on Boot 2.7 — the SecurityFilterChain style works on Security 5.7+, so it ships as an isolated, independently testable change",
          "After the Boot 3 upgrade, once the javax and Hibernate work has settled",
          "Never rewrite it — add @SuppressWarnings(\"deprecation\") and revisit if it actually breaks"
        ]}
        correctIndex={1}
        explanation="SecurityFilterChain beans, the lambda DSL, authorizeHttpRequests, requestMatchers and @EnableMethodSecurity all arrived in Spring Security 5.7, which Boot 2.7 ships. That overlap is deliberate: the adapter was deprecated rather than removed precisely to give you a window where both styles compile. Doing it now means one focused PR, reviewable in isolation, testable against your existing suite, and in production long before the big upgrade. Option 1 is the common choice and the expensive one — you get javax errors, Java 17 errors, Hibernate errors and five security errors per config class in one build log, and security is the area where a compiling result proves the least. Option 3 is impossible: the code will not compile on Boot 3, so it cannot wait until after. Option 4 suppresses the warning without removing the problem, and guarantees that whoever does the upgrade meets it cold."
      />

      <InteractiveChallenge
        question={'A Boot 2 config contains: @Override public void configure(WebSecurity web) { web.ignoring().antMatchers("/api/internal/**"); }. What should you do when migrating it?'}
        options={[
          "Translate it directly to .requestMatchers(\"/api/internal/**\").permitAll() — that is the documented replacement",
          "Treat it as a security finding: web.ignoring() bypasses the filter chain entirely, so those endpoints have had no security headers and no CSRF protection",
          "Leave it as configure(WebSecurity), which was not removed alongside the adapter",
          "Replace it with PathRequest.toStaticResources().atCommonLocations()"
        ]}
        correctIndex={1}
        explanation="web.ignoring() does not mean 'allow this request' — it means the request never enters the Spring Security filter chain at all. No security headers, no CSRF token, no SecurityContext. For genuinely static files (/css/**, /js/**) that is a deliberate performance choice. For a path like /api/internal/**, it means a dynamic API has been running with no security headers and no CSRF protection, quite possibly without anyone realising. Option 1 is the mechanically correct translation and is exactly the trap: permitAll() routes the request THROUGH the chain and then allows it, which is stricter than what was there, so it may also change behaviour you did not intend to change — either way you should be making that call consciously, not by find-and-replace. Option 3 is wrong: configure(WebSecurity) was an adapter method and went with it (the bean-based equivalent is a WebSecurityCustomizer). Option 4 applies to static resources, not to an API path."
      />
    </LessonLayout>
  );
}

export default SpringBoot2Security;
