import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function SpringBoot2Cheatsheet() {
  return (
    <GuideLayout
      title="SPRING BOOT 2"
      kicker="FIELD GUIDE"
      glyph="🍂"
      tagline="The legacy Boot 2 surface — javax, Hibernate 5, WebSecurityConfigurerAdapter — mapped straight across to what replaced each piece."
      meta={['Spring Boot 2.7.18', 'javax / Hibernate 5 era', '21 panels']}
      page="1 / 1"
      footer="Every version number here was verified against real jars — see the individual lessons for the commands that produced them."
      prev={{ path: '/springboot2/migration', label: 'Migrating 2 → 3 → 4, In Order' }}
      next={null}
    >
      <GuidePanel n={1} title="Which Version Am I On?" accent="blue" glyph="🔎" span={2}>
        <GuideCode>{`# 1. What the build DECLARES (can lie — a BOM may override it)
grep -A2 spring-boot-starter-parent pom.xml
./gradlew dependencies --configuration runtimeClasspath | head

# 2. What actually RESOLVES (the truth)
mvn dependency:tree -Dincludes=org.springframework.boot:spring-boot
./gradlew dependencyInsight --dependency spring-boot --configuration runtimeClasspath

# 3. Smell tests — no build file needed
grep -rl "javax.persistence"            # javax imports  -> Boot 2
grep -rl "WebSecurityConfigurerAdapter" # removed in Security 6 -> Boot 2
grep -rl "@MockBean"                    # removed in Boot 4    -> Boot 2 or 3
grep -rl "tools.jackson"                # Jackson 3            -> Boot 4`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={2} title="Support Status" accent="purple" glyph="🕰️">
        <GuideDefs
          items={[
            ['Boot 2.7.18', 'last 2.x release'],
            ['OSS support', 'ended 2023-06-30'],
            ['commercial support', 'through 2029-06-30 — the reason it persists'],
            ['Boot 3.x', 'OSS support ended 2026-06-30 (commercial through 2032-06-30)'],
            ['Boot 4.x', 'current'],
          ]}
        />
        <GuideRules items={[
          'You are not "on an unsupported version" if your employer pays for commercial support. You ARE on one that gets no free security patches.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="javax → jakarta Namespace" accent="green" glyph="📦" span={2}>
        <GuideCode>{`javax.persistence.*   ->  jakarta.persistence.*     entities, JPA
javax.servlet.*       ->  jakarta.servlet.*          filters, servlets
javax.validation.*    ->  jakarta.validation.*       @Valid, @NotNull
javax.annotation.*    ->  jakarta.annotation.*       @PostConstruct, @Resource
javax.transaction.*   ->  jakarta.transaction.*
javax.jms.*           ->  jakarta.jms.*
javax.mail.*          ->  jakarta.mail.*`}</GuideCode>
        <GuideRules items={[
          'JDK-owned packages did NOT move: javax.crypto, javax.net, javax.naming, javax.management, javax.imageio, javax.sql, javax.security.auth. A blind sed across the tree breaks these — use OpenRewrite, which knows the difference.',
          'Your own code can compile clean against jakarta while a third-party jar is still compiled against javax. Nothing fails at build time — the app starts, then dies at class-load with NoClassDefFoundError: javax/servlet/Filter. Every dependency has to ship a Jakarta-compatible version; that, not your own imports, is what usually decides how long this migration takes.',
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="Dependency Coordinates That Changed" accent="amber" glyph="🏷️">
        <GuideTable
          head={['Old artifact', 'New artifact']}
          rows={[
            ['javax.servlet:javax.servlet-api', 'jakarta.servlet:jakarta.servlet-api'],
            ['mysql:mysql-connector-java', 'com.mysql:mysql-connector-j'],
            ['javax.validation:validation-api', 'jakarta.validation:jakarta.validation-api'],
          ]}
        />
        <GuideRules items={[
          'The old mysql coordinate has a <relocation> block in its POM — Maven will warn, then follow it. It still works, so it hides.',
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Security: The Whole Translation" accent="pink" glyph="🔐" span={2}>
        <GuideTable
          head={['Boot 2 (Security 5)', 'Boot 3/4 (Security 6+)']}
          rows={[
            ['extends WebSecurityConfigurerAdapter', '@Bean SecurityFilterChain'],
            ['configure(HttpSecurity)', 'the bean body itself'],
            ['authorizeRequests()', 'authorizeHttpRequests()'],
            ['antMatchers("/x/**")', 'requestMatchers("/x/**")'],
            ['mvcMatchers(...)', 'requestMatchers(...)'],
            ['.and().x() chaining', 'lambda DSL, no chaining'],
            ['@EnableGlobalMethodSecurity', '@EnableMethodSecurity'],
            ['configure(AuthenticationManagerBuilder)', '@Bean AuthenticationManager'],
            ['WebSecurityConfigurerAdapter#userDetailsService', '@Bean UserDetailsService'],
          ]}
        />
        <GuideRules items={[
          'Deprecated in Security 5.7, REMOVED in 6.0 (verified by bytecode).',
          'The lambda DSL arrived in Spring Security 5.7, which Boot 2.7 already ships — convert the whole security config to SecurityFilterChain while still on Boot 2, verify it there, and land the Boot 3 upgrade separately. Two risky changes decoupled into two boring ones.',
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="Testing" accent="cyan" glyph="🧪">
        <GuideCode>{`@MockBean      ->  @MockitoBean       (bean.override.mockito)
@SpyBean       ->  @MockitoSpyBean

deprecated in Boot 3.4, REMOVED in Boot 4.

JUnit:  Boot 2 -> JUnit 5      Boot 4 -> JUnit 6 baseline
        (5 -> 6 is near-drop-in; only long-deprecated APIs were removed)`}</GuideCode>
        <GuideRules items={[
          'Unchanged across all three: @SpringBootTest, @WebMvcTest, @DataJpaTest, @JsonTest, TestRestTemplate, MockMvc.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="Properties That Moved" accent="red" glyph="⚙️">
        <GuideTable
          head={['Old property', 'New property']}
          rows={[
            ['spring.redis.*', 'spring.data.redis.*'],
            ['spring.data.cassandra.*', 'spring.cassandra.*'],
            ['server.max-http-header-size', 'server.max-http-request-header-size'],
          ]}
        />
        <GuideCode>{`<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-properties-migrator</artifactId>
  <scope>runtime</scope>
</dependency>`}</GuideCode>
        <GuideRules items={[
          'Add it to a Boot 3 run and it reports every renamed property you are still using, at startup. Remove it once you are clean.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Actuator" accent="blue" glyph="📡">
        <GuideDefs
          items={[
            ['/actuator/httptrace', '-> /actuator/httpexchanges'],
            ['HttpTraceRepository', '-> HttpExchangeRepository (boot.actuate.web.exchanges)'],
          ]}
        />
        <GuideRules items={[
          'Only /health is exposed over JMX by default in 3.x.',
          '/env and /configprops sanitize far more aggressively in 3.x.',
          'Trailing-slash matching is OFF by default in 3.x — "/actuator/health/" no longer resolves.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="Data & JPA — Hibernate 5.6 → 6.1" accent="purple" glyph="🗃️" span={2}>
        <GuideCode>{`Hibernate 5.6   SequenceStyleGenerator.DEF_SEQUENCE_NAME = "hibernate_sequence"
                (one shared sequence for every entity, by default)
Hibernate 6.1   that constant is GONE — only DEF_SEQUENCE_SUFFIX = "_SEQ"
                (a per-entity sequence, <table>_SEQ)`}</GuideCode>
        <GuideRules items={[
          'AvailableSettings.USE_NEW_ID_GENERATOR_MAPPINGS existed in Hibernate 5.6 and is absent in 6.1 — you cannot opt back out.',
          '@GeneratedValue(strategy = SEQUENCE) without an explicit generator silently changes which sequence it reads. Name your generators — this is the one that corrupts data if you miss it.',
          'Embedded MongoDB auto-configuration is REMOVED in Boot 3 — replace with Testcontainers, or wire up Flapdoodle yourself.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="The Migration Order" accent="green" glyph="🧭" span={2}>
        <GuideCode>{`0. Pre-flight   green test suite, pinned deps, a rollback plan
1. Boot 2.7.18  get to the LAST 2.x patch first
2. Java 17      on Boot 2 still — decouple the JDK jump
3. Security DSL SecurityFilterChain, still on Boot 2 (see above)
4. Boot 3.0     jakarta via OpenRewrite + properties-migrator
5. Boot 3.x     walk up the line, patch by patch
6. Boot 4       Jackson 3 (com.fasterxml -> tools.jackson),
                @MockBean -> @MockitoBean, JUnit 6, module split`}</GuideCode>
        <GuideRules items={[
          'Steps 2 and 3 are done ON Boot 2. That is the point: arrive at the 3.0 upgrade with only ONE variable left to change.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="When Not To Migrate" accent="amber" glyph="🛑">
        <GuideRules items={[
          'A Boot 2 service with commercial support, no new feature work, and a hard dependency on a library that never shipped a Jakarta build is one to leave alone and plan to replace, not upgrade.',
          'The migration is worth it when you are actively developing on the codebase — the cost is roughly proportional to how many third-party jars you depend on, not to how much of your own code there is.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Section Index" accent="pink" glyph="📖" span={2}>
        <GuideCode>{`0.  Spring Boot 2 in 2026: Where It Stands   support status, version ID
1.  The javax World                          the namespace change
2.  Dependency Injection & IoC               what actually didn't change
3.  Building REST APIs                       javax.validation, no ProblemDetail
4.  Security the Boot 2 Way                  WebSecurityConfigurerAdapter
5.  Spring Data & JPA on Hibernate 5         ID generators, property moves
6.  Configuration & Properties That Moved    renames, properties-migrator
7.  Error Handling & Validation              ApiError DTO, include-message
8.  Testing in Boot 2                        @MockBean and the slices
9.  Transactions Deep-Dive                   self-invocation, protected methods
10. Kafka in Spring Boot 2                   spring-kafka 2.8.11, DLTs
11. AOP & Interceptors                       CGLIB proxy rules, spring-retry
12. Reactive Programming with WebFlux        Mono/Flux, R2DBC, no virtual threads
13. Resilience4j & Circuit Breakers          Hystrix's shadow, aspect order
14. Observability                            no Observation API, Sleuth
15. Actuator & Metrics Before the Rename     httptrace -> httpexchanges
16. Migrating 2 -> 3 -> 4, In Order          the ordered path
17. This field guide

For the far side of the migration see Spring Boot 4:
  /springboot/security-migration   Security 5/6 -> 7 in detail
  /springboot/boot4                what Boot 4 adds over Boot 3`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={13} title="DI & IoC — What's Actually Different" accent="cyan" glyph="🧵">
        <GuideDefs
          items={[
            ['@PostConstruct/@PreDestroy', 'still javax.annotation on 2.7 — the jakarta.annotation-api:1.3.5 jar ships javax/* classes inside'],
            ['@MockBean, not @MockitoBean', '@MockitoBean is Framework 6.2+ — absent from spring-test 5.3.31'],
            ['circular refs', 'refused by default since Boot 2.6, not a Boot 3 fix — spring.main.allow-circular-references defaults false on 2.7.18 too'],
            ['@Bean HTTP client factories', 'return RestTemplate — RestClient is Framework 6.1+'],
          ]}
        />
        <GuideRules items={[
          'Constructor injection, @Qualifier/@Primary, conditional beans, ObjectProvider — all unchanged since Framework 4.3, five Boot releases before 2.7.',
        ]} />
      </GuidePanel>

      <GuidePanel n={14} title="REST APIs — javax.validation & the Missing ProblemDetail" accent="red" glyph="🌐">
        <GuideCode>{`import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
// jakarta.validation-api:2.0.2 jar -- javax/* classes inside, same pattern
// as jakarta.annotation-api:1.3.5. Import javax on Boot 2, always.`}</GuideCode>
        <GuideRules items={[
          'ProblemDetail (RFC 7807) is a Framework 6.0 class, absent from spring-web 5.3.31 — hand-roll an ApiError DTO or use ResponseStatusException instead.',
          'PathPatternParser matchOptionalTrailingSeparator defaults TRUE on 5.3.31 (Boot 2), FALSE on 6.0.13+ (Boot 3+) — a trailing-slash URL that matched pre-upgrade 404s after.',
          'No @HttpExchange/RestClient (Framework 6.0+) — outbound clients are RestTemplate or Feign (@FeignClient, Spring Cloud).',
          'springdoc-openapi-ui 1.8.0 (not -starter-webmvc-ui, which needs jakarta.servlet) is the Boot 2-compatible OpenAPI artifact.',
        ]} />
      </GuidePanel>

      <GuidePanel n={15} title="Error Handling & Validation" accent="blue" glyph="🧯">
        <GuideDefs
          items={[
            ['ProblemDetail', 'Framework 6.0+ only — hand-roll an ApiError DTO + @RestControllerAdvice instead'],
            ['server.error.include-message', 'defaults "never" since Boot 2.3 — hides message/binding errors from the JSON body, not from logs'],
            ['Bean Validation engine', "Hibernate Validator 6.2.5.Final (BV 2.0, javax.validation) vs Boot 4's 8.x (jakarta.validation) — same ~20 constraint annotations either side"],
          ]}
        />
        <GuideRules items={[
          "The Exception.class catch-all swallows Spring Security's AccessDeniedException too (403 becomes 500) unless a more specific handler is added first.",
        ]} />
      </GuidePanel>

      <GuidePanel n={16} title="Transactions — Self-Invocation, and a Real 2-vs-4 Difference" accent="purple" glyph="💳" span={2}>
        <GuideCode>{`this.doWork() from inside the bean -> BYPASSES the proxy, @Transactional
silently ignored. Same rule on every version.

VERIFIED live -- protected/package-private @Transactional methods:
  spring-tx 5.3.31 (Boot 2.7)  ->  active=false   (CGLIB advises PUBLIC only)
  spring-tx 6.0.14 (Boot 3+)   ->  active=true    (protected/package-private too)`}</GuideCode>
        <GuideRules items={[
          "UnexpectedRollbackException: REQUIRED joins the same physical tx — a caught-and-swallowed exception downstream still marks it rollback-only.",
          "Never do HTTP/Kafka I/O inside @Transactional — it holds a pooled DB connection for the call's duration and exhausts the pool under load.",
          "javax.transaction.Transactional (JTA) still works via JtaTransactionAnnotationParser but has no isolation/readOnly/timeout/NESTED — a tell it should convert to Spring's own annotation.",
        ]} />
      </GuidePanel>

      <GuidePanel n={17} title="Kafka in Spring Boot 2" accent="green" glyph="📨" span={2}>
        <GuideDefs
          items={[
            ['spring-kafka / kafka-clients', '2.8.11 / 3.1.2 on Boot 2.7.18 vs 4.1.1 / 4.2.1 on Boot 4.1.1'],
            ['KafkaTemplate.send()', 'returns ListenableFuture on 2.8.11 — CompletableFuture only from spring-kafka 3.0.0+'],
            ['DefaultErrorHandler', 'already in 2.8.11 (replaced SeekToCurrentErrorHandler back in 2.8, 2021) — not a Boot 3 upgrade'],
            ['idempotent producer', "dedupes only the producer's OWN retries, not real exactly-once — assume at-least-once, make handlers idempotent"],
          ]}
        />
        <GuideRules items={[
          "max.poll.interval.ms (default 5 min), not the heartbeat, is what a slow handler blows through — triggers the rebalance-storm death spiral.",
          "Kafka 4.0 dropped ZooKeeper mode entirely (KRaft-only) — a client-library fact, independent of Boot/Spring version.",
          "Cross-system atomicity: transactional outbox (domain row + outbox row in one DB tx, relayed separately), not a Kafka transaction spanning your DB.",
        ]} />
      </GuidePanel>

      <GuidePanel n={18} title="AOP & Interceptors" accent="amber" glyph="🎯">
        <GuideDefs
          items={[
            ['CGLIB proxy advises', 'public, protected, package-visible — never private or final (same on 5.3 and 7.x)'],
            ['spring-retry 1.3.4 (Boot 2.7.18)', "@Retryable has value/include/exclude — retryFor/noRetryFor/notRecoverable are a LATER release and won't compile"],
          ]}
        />
        <GuideRules items={[
          "Same self-invocation rule as @Transactional — this.method() bypasses the proxy for any AOP-driven annotation (@Retryable, @Async, a custom @Aspect).",
          "spring.aop.auto / spring.aop.proxy-target-class both default true on Boot 2.7 — AopAutoConfiguration adds @EnableAspectJAutoProxy for you.",
        ]} />
      </GuidePanel>

      <GuidePanel n={19} title="WebFlux — Reactive on Boot 2" accent="pink" glyph="🌊" span={2}>
        <GuideDefs
          items={[
            ['shipped in', 'Boot 2.0 / Framework 5.0 (March 2018) — not a Boot 3/4 feature'],
            ['reactor-core', '3.4.34 (Boot 2.7.18) vs 3.8.7 (Boot 4.1.1) — Mono/Flux/map/flatMap/subscribe API unchanged across the gap'],
            ['spring.threads.virtual.enabled', "does NOT exist in Boot 2.7's metadata — Boot 3.2+ only; Boot 2.7.18 itself supports JDK up to 21, just with no autoconfigured flag"],
            ['R2DBC entities', '@Table/@Id from org.springframework.data.* — never touched javax.persistence or jakarta.persistence, on any Boot version'],
          ]}
        />
        <GuideRules items={[
          "RestClient doesn't exist (Framework 6.1+) — reactive code uses WebClient (5.0+); blocking code still only has RestTemplate.",
          "WebFlux does not make JPA non-blocking — running Hibernate from a handler stalls one of only 4-8 event-loop threads. Needs R2DBC for a truly non-blocking data layer.",
        ]} />
      </GuidePanel>

      <GuidePanel n={20} title="Resilience4j & Circuit Breakers" accent="cyan" glyph="🔌">
        <GuideDefs
          items={[
            ['artifact', 'resilience4j-spring-boot2 (not -boot3) — pulls resilience4j-annotations 2.3.0, missing only the newer configuration() attribute added in 2.4.0'],
            ['may find instead', 'Hystrix — Netflix maintenance-mode since Nov 2018, but spring-cloud-starter-netflix-hystrix shipped until 2021-11-17; still works, no further releases'],
            ['default aspect nesting', 'Retry( CircuitBreaker( RateLimiter( TimeLimiter( Bulkhead( Function ) ) ) ) ) — Retry outermost, so each retry re-enters and re-trips the breaker'],
          ]}
        />
        <GuideRules items={[
          "@CircuitBreaker/@Retry/@RateLimiter/@Bulkhead live in resilience4j-annotations, a plain-Java module with zero Spring-version coupling — safe to add on Boot 2 now.",
          "limitRefreshPeriod has no sane default (500 nanoseconds) — always set it explicitly or the rate limiter limits nothing.",
        ]} />
      </GuidePanel>

      <GuidePanel n={21} title="Observability — No Observation API on Boot 2.7" accent="red" glyph="📊" span={2}>
        <GuideDefs
          items={[
            ['Micrometer', "1.9.17 (Boot 2.7.18) vs 1.10.13 (Boot 3.0.13) — 1.10 added the Observation API; micrometer-observation 1.9.17 404s, it doesn't exist"],
            ['bumping micrometer.version', 'does NOT get you Observation — spring-boot-actuator-autoconfigure 2.7.18 ships ZERO ObservationAutoConfiguration classes (Boot 3.0.13 ships 5)'],
            ['tracing', 'Spring Cloud Sleuth (Brave) + spring-cloud-sleuth-zipkin — a SEPARATE BOM you version-pair yourself; last Sleuth release Feb 2024'],
            ['log correlation', "Sleuth's TraceEnvironmentPostProcessor sets logging.pattern.level and populates MDC traceId/spanId — same MDC keys Micrometer Tracing uses on Boot 3+"],
          ]}
        />
        <GuideRules items={[
          "MeterRegistry/Counter/Timer/Gauge (Micrometer core) are portable as-is — what's missing is the unifying Observation call, not metrics themselves.",
          "On Boot 2.7 a metric and a span for the same operation are two separate hand-written calls with nothing enforcing they agree.",
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
