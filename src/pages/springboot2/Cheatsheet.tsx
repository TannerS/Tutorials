import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function SpringBoot2Cheatsheet() {
  return (
    <GuideLayout
      title="SPRING BOOT 2"
      kicker="FIELD GUIDE"
      glyph="🍂"
      tagline="The legacy Boot 2 surface — javax, Hibernate 5, WebSecurityConfigurerAdapter — mapped straight across to what replaced each piece."
      meta={['Spring Boot 2.7.18', 'javax / Hibernate 5 era', '12 panels']}
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
            ['Boot 3.x', 'current LTS line'],
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
        <GuideCode>{`1. Spring Boot 2 in 2026: Where It Stands   support status, version ID
2. The javax World                          the namespace change
3. Security the Boot 2 Way                  WebSecurityConfigurerAdapter
4. Spring Data & JPA on Hibernate 5         ID generators, property moves
5. Configuration & Properties That Moved    renames, properties-migrator
6. Testing in Boot 2                        @MockBean and the slices
7. Actuator & Metrics Before the Rename     httptrace -> httpexchanges
8. Migrating 2 -> 3 -> 4, In Order          the ordered path
9. This field guide

For the far side of the migration see Spring Boot 4:
  /springboot/security-migration   Security 5/6 -> 7 in detail
  /springboot/boot4                what Boot 4 adds over Boot 3`}</GuideCode>
      </GuidePanel>
    </GuideLayout>
  );
}
