import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Javax() {
  return (
    <LessonLayout
      title="The javax World — Namespace, JPA, Servlets"
      sectionId="springboot2"
      lessonIndex={1}
      prev={{ path: '/springboot2/intro', label: 'Spring Boot 2 in 2026: Where It Stands' }}
      next={{ path: '/springboot2/di', label: 'Dependency Injection & IoC' }}
    >
      <p>
        If you only learn one thing about Spring Boot 2, learn this one. Every other difference in
        this section is a handful of files. This one is <em>every</em> file that touches an
        entity, a servlet, a filter, or a validation annotation — and it is the change most likely
        to be the actual reason a team is stuck.
      </p>

      <p>
        The good news: as a rename it is almost insultingly simple. The bad news: simple renames
        that cross a jar boundary are not simple at all, and that is the whole lesson.
      </p>

      <h2>What Happened, In One Paragraph</h2>

      <p>
        Oracle donated Java EE to the Eclipse Foundation, where it was renamed Jakarta EE. The
        donation covered the code and the specifications but <strong>not the{' '}
        <code>javax</code> trademark</strong>. Eclipse was permitted to keep shipping the existing{' '}
        <code>javax.*</code> packages unchanged, but was not permitted to <em>evolve</em> them —
        no new classes, no new methods, in any package named <code>javax</code>. Jakarta EE 8 was
        therefore a byte-identical re-release under a new name. Jakarta EE 9 did the only thing
        left to do: renamed the root package from <code>javax</code> to <code>jakarta</code>{' '}
        across the board. Spring Framework 6 / Boot 3 targets Jakarta EE 9+, so Spring had no
        choice either.
      </p>

      <FlowChart
        title="Why a trademark caused a compile break in your repository"
        chart={"graph TD\nA[\"Oracle donates Java EE to Eclipse\"] --> B[\"Code and specs transferred\"]\nA --> C[\"'javax' TRADEMARK not transferred\"]\nC --> D[\"Eclipse may ship javax.* but never evolve it\"]\nD --> E[\"Jakarta EE 8: identical APIs, new brand\"]\nE --> F[\"Jakarta EE 9: rename root package to jakarta.*\"]\nF --> G[\"Spring Framework 6 targets Jakarta EE 9+\"]\nG --> H[\"Boot 3 cannot compile your javax imports\"]\nstyle C fill:#3a2f1a,stroke:#fbbf24\nstyle H fill:#3a1f1f,stroke:#f87171"}
      />

      <InfoBox variant="note" title="This is worth knowing because it explains the shape of the change">
        <p>
          A rename forced by trademark law rather than by engineering has a useful property:{' '}
          <strong>nothing else changed at the same time.</strong> The classes have the same names,
          the same methods, the same semantics. That is why the migration is mechanical, and why
          automated tooling handles it well. Compare that to the Hibernate 5 &rarr; 6 change in
          the <a href="/springboot2/data">data lesson</a>, where behaviour genuinely differs and
          no tool can be sure it got it right.
        </p>
      </InfoBox>

      <h3>How mechanical? Measurably so</h3>

      <p>
        Here is the JPA API jar from each side, compared by class path below the root package:
      </p>

      <CodeBlock language="text" title="Real comparison of javax.persistence-api 2.2 vs jakarta.persistence-api 3.1.0">
{`javax.persistence 2.2 classes:    207
jakarta.persistence 3.1 classes:  206
identical relative paths:         205

only in javax 2.2 :  persistence/Persistence$1.class
                     persistence/spi/PersistenceProviderResolverHolder$1.class
only in jakarta 3.1: persistence/spi/TransformerException.class

205 of 207 class paths are byte-for-byte the same string once you remove
the leading "javax/" or "jakarta/". The two differences are a synthetic
inner class and one genuinely new SPI type. This is a find-and-replace.`}
      </CodeBlock>

      <h2>The Packages That Moved</h2>

      <p>
        Verified by listing the package contents of each API jar — the mapping is strictly 1:1,
        with no package split, merged or dropped:
      </p>

      <CodeBlock language="text" title="Real package mapping, read out of the jars">
{`--- javax.persistence-api-2.2.jar   ->  jakarta.persistence-api-3.1.0.jar
    javax.persistence                     -> jakarta.persistence
    javax.persistence.criteria            -> jakarta.persistence.criteria
    javax.persistence.metamodel           -> jakarta.persistence.metamodel
    javax.persistence.spi                 -> jakarta.persistence.spi

--- javax.servlet-api-4.0.1.jar     ->  jakarta.servlet-api-6.0.0.jar
    javax.servlet                         -> jakarta.servlet
    javax.servlet.annotation              -> jakarta.servlet.annotation
    javax.servlet.descriptor              -> jakarta.servlet.descriptor
    javax.servlet.http                    -> jakarta.servlet.http

--- validation-api-2.0.1.Final.jar  ->  jakarta.validation-api-3.0.2.jar
    javax.validation                      -> jakarta.validation
    javax.validation.bootstrap            -> jakarta.validation.bootstrap
    javax.validation.constraints          -> jakarta.validation.constraints
    javax.validation.constraintvalidation -> jakarta.validation.constraintvalidation
    javax.validation.executable           -> jakarta.validation.executable
    javax.validation.groups               -> jakarta.validation.groups
    javax.validation.metadata             -> jakarta.validation.metadata
    javax.validation.spi                  -> jakarta.validation.spi
    javax.validation.valueextraction      -> jakarta.validation.valueextraction

--- javax.annotation-api-1.3.2.jar  ->  jakarta.annotation-api-2.1.1.jar
    javax.annotation                      -> jakarta.annotation
    javax.annotation.security             -> jakarta.annotation.security
    javax.annotation.sql                  -> jakarta.annotation.sql`}
      </CodeBlock>

      <p>Others you will meet less often, following the identical rule:</p>

      <CodeBlock language="text" title="The rest of the list">
{`javax.transaction.*   -> jakarta.transaction.*     @Transactional (the JTA one)
javax.jms.*           -> jakarta.jms.*             JMS messaging
javax.mail.*          -> jakarta.mail.*            JavaMail
javax.websocket.*     -> jakarta.websocket.*       WebSocket endpoints
javax.ws.rs.*         -> jakarta.ws.rs.*           JAX-RS (if you use Jersey/RESTEasy)
javax.xml.bind.*      -> jakarta.xml.bind.*        JAXB
javax.enterprise.*    -> jakarta.enterprise.*      CDI
javax.inject.*        -> jakarta.inject.*          @Inject, @Named`}
      </CodeBlock>

      <InfoBox variant="danger" title="Critical: some javax packages did NOT move, and must NOT be renamed">
        <p>
          This is the single most common way people break a migration by hand or with an
          over-eager <code>sed</code>. The packages that moved are the ones that belonged to{' '}
          <strong>Java EE</strong>. The ones that belong to the <strong>JDK itself</strong> were
          never Oracle&apos;s to donate and are still called <code>javax</code> today. Proof, on
          JDK 26:
        </p>
        <CodeBlock language="java" title="Keep.java — compiles clean on a modern JDK with no dependencies at all">
{`import javax.sql.DataSource;          // JDBC        - java.sql module
import javax.crypto.Cipher;           // JCE         - java.base
import javax.naming.InitialContext;   // JNDI        - java.naming
import javax.net.ssl.SSLContext;      // JSSE        - java.base
import javax.management.MBeanServer;  // JMX         - java.management

public class Keep { DataSource ds; Cipher c; InitialContext ic; SSLContext sc; MBeanServer ms; }`}
        </CodeBlock>
        <CodeBlock language="bash" title="Real output">
{`$ javac -d out Keep.java
$ echo "exit=$?"
exit=0

Zero errors. These are JDK packages. A blanket
  find . -name '*.java' | xargs sed -i 's/javax\\./jakarta./g'
would rewrite every one of them into a class that does not exist.`}
        </CodeBlock>
        <p>
          Also still <code>javax</code>: <code>javax.security.auth.*</code>,{' '}
          <code>javax.imageio.*</code>, <code>javax.swing.*</code>, <code>javax.script.*</code>,{' '}
          <code>javax.xml.parsers.*</code> and <code>javax.xml.transform.*</code>. Note the trap
          in that last pair — <code>javax.xml.bind</code> (JAXB) <em>moved</em>, while{' '}
          <code>javax.xml.parsers</code> (JAXP) <em>did not</em>. They look like siblings and are
          not.
        </p>
      </InfoBox>

      <h2>It Is a Compile Break, Not a Deprecation</h2>

      <p>
        Spring normally deprecates for a release line before removing, which gives you a window
        where old and new both work. <strong>There is no such window here.</strong> There is no
        overload, no bridge, no compatibility flag. The class you named does not exist.
      </p>

      <p>Here is that failure, produced for real — a Boot 2 entity compiled against Jakarta jars:</p>

      <CodeBlock language="java" title="Entity2.java — an ordinary Boot 2 entity">
{`import javax.persistence.Entity;
import javax.persistence.Id;
import javax.validation.constraints.NotBlank;

@Entity
public class Entity2 {
    @Id Long id;
    @NotBlank String name;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real javac output, compiled against jakarta.persistence 3.1 / jakarta.validation 3.0">
{`$ javac --release 17 -cp "jakarta.persistence-api-3.1.0.jar:jakarta.validation-api-3.0.2.jar" \\
        -d out Entity2.java

Entity2.java:1: error: package javax.persistence does not exist
import javax.persistence.Entity;
                        ^
Entity2.java:2: error: package javax.persistence does not exist
import javax.persistence.Id;
                        ^
Entity2.java:3: error: package javax.validation.constraints does not exist
import javax.validation.constraints.NotBlank;
                                   ^
Entity2.java:5: error: cannot find symbol
@Entity
 ^
  symbol: class Entity
Entity2.java:7: error: cannot find symbol
    @Id Long id;
     ^
  symbol:   class Id
  location: class Entity2
Entity2.java:8: error: cannot find symbol
    @NotBlank String name;`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why this is actually the good news">
        <p>
          A compile break is loud, total, and impossible to ship by accident. You cannot half-do
          it and find out in production. Every single occurrence is reported by the compiler with
          a file and a line number, which means the work is <em>bounded and countable</em> before
          you start:
        </p>
        <CodeBlock language="bash" title="Scope the job in one command">
{`# How big is this, really?
grep -rl 'javax\\.\\(persistence\\|servlet\\|validation\\|annotation\\|transaction\\|jms\\|mail\\|websocket\\|ws\\.rs\\|xml\\.bind\\|inject\\|enterprise\\)' \\
     --include='*.java' src/ | wc -l

# Which packages specifically, ranked by how often they appear:
grep -rho 'javax\\.[a-z.]*' --include='*.java' src/ | sort | uniq -c | sort -rn`}
        </CodeBlock>
      </InfoBox>

      <h2>The Same Code, Both Ways</h2>

      <h3>An entity</h3>

      <CodeBlock language="java" title="Boot 2 — javax.persistence">
{`package com.example.orders;

import java.time.Instant;
import java.util.List;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Positive;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String reference;

    @Positive
    private long totalCents;

    @Enumerated(EnumType.STRING)
    private Status status;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderLine> lines;

    private Instant placedAt;

    // getters/setters omitted
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Boot 3/4 — jakarta.persistence. Only the imports differ.">
{`package com.example.orders;

import java.time.Instant;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String reference;

    @Positive
    private long totalCents;

    @Enumerated(EnumType.STRING)
    private Status status;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderLine> lines;

    private Instant placedAt;

    // getters/setters omitted
}

// The class body is character-for-character identical. Every annotation,
// every enum constant, every attribute name. Only the import block moved.`}
      </CodeBlock>

      <h3>A controller</h3>

      <CodeBlock language="java" title="Boot 2 — javax.validation + javax.servlet">
{`import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import javax.validation.constraints.NotNull;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService service;

    OrderController(OrderService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<Order> create(@Valid @RequestBody CreateOrderRequest body,
                                        HttpServletRequest request) {
        String actor = request.getRemoteUser();
        return ResponseEntity.ok(service.create(body, actor));
    }

    public record CreateOrderRequest(@NotNull String reference, long totalCents) { }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Boot 3/4 — jakarta.validation + jakarta.servlet">
{`import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService service;

    OrderController(OrderService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<Order> create(@Valid @RequestBody CreateOrderRequest body,
                                        HttpServletRequest request) {
        String actor = request.getRemoteUser();
        return ResponseEntity.ok(service.create(body, actor));
    }

    public record CreateOrderRequest(@NotNull String reference, long totalCents) { }
}

// Note: the org.springframework.* imports are UNCHANGED. Spring's own
// package names never moved — only the Jakarta EE APIs it sits on top of.`}
      </CodeBlock>

      <h3>A filter</h3>

      <CodeBlock language="java" title="Boot 2 — javax.servlet">
{`import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {
        MDC.put("correlationId", resolve(request));
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");
        }
    }

    private String resolve(HttpServletRequest r) {
        String id = r.getHeader("X-Correlation-Id");
        return id != null ? id : java.util.UUID.randomUUID().toString();
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Boot 3/4 — jakarta.servlet">
{`import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {
        MDC.put("correlationId", resolve(request));
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");
        }
    }

    private String resolve(HttpServletRequest r) {
        String id = r.getHeader("X-Correlation-Id");
        return id != null ? id : java.util.UUID.randomUUID().toString();
    }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Spring's own base class moved underneath you">
        <p>
          <code>OncePerRequestFilter</code> is a Spring class, and its package never changed — but
          its <em>method signature</em> did, because the parameter types are servlet types. That
          is why the <code>@Override</code> still resolves after the rename: you changed your
          imports, Spring changed theirs. You can see this directly in the compiled jars:
        </p>
        <CodeBlock language="bash" title="Real output">
{`for v in 5.3.39 6.2.11; do
  printf 'spring-web %-8s ' $v
  unzip -p spring-web-$v.jar \\
    org/springframework/web/filter/OncePerRequestFilter.class \\
    | strings | grep -oE '(javax|jakarta)/servlet/http/HttpServletRequest' | sort -u
done

spring-web 5.3.39   javax/servlet/http/HttpServletRequest
spring-web 6.2.11   jakarta/servlet/http/HttpServletRequest`}
        </CodeBlock>
      </InfoBox>

      <h2>The Hard Part: Third-Party Libraries</h2>

      <p>
        Everything above is your code, and your code is the easy half. The difficult half is that{' '}
        <strong>every library that touches a Jakarta EE type had to be recompiled and
        re-released by its maintainer.</strong> You cannot fix those with <code>sed</code>. A jar
        compiled against <code>javax.servlet</code> contains <code>javax/servlet/...</code>{' '}
        constant-pool entries in its bytecode.
      </p>

      <p>
        And here is the part that catches people out: this failure is <em>not</em> a compile
        error. Your code compiles perfectly. The application starts. It dies later, when the
        classloader is asked for that vendor class. Reproduced end to end:
      </p>

      <CodeBlock language="java" title="Step 1 — the vendor's jar, compiled in 2019 against javax.servlet 4.0.1">
{`import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import java.io.IOException;

public class LegacyAuditFilter implements Filter {
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        chain.doFilter(req, res);
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the javax reference is baked into the bytecode">
{`$ javap -c -p -cp vendorlib LegacyAuditFilter | grep javax

public class LegacyAuditFilter implements javax.servlet.Filter {
  public void doFilter(javax.servlet.ServletRequest, javax.servlet.ServletResponse, javax.servlet.FilterChain) throws java.io.IOException, javax.servlet.ServletException;
         3: invokeinterface #7,  3            // InterfaceMethod javax/servlet/FilterChain.doFilter:(Ljavax/servlet/ServletRequest;Ljavax/servlet/ServletResponse;)V

Three separate places: the implemented interface, the method signature,
and the constant-pool entry for the call. These strings live in the class
file. No amount of editing YOUR source changes them. Only a rebuild by
whoever owns this jar does.`}
      </CodeBlock>

      <CodeBlock language="text" title="Step 2 — real output: running it with only jakarta.servlet on the classpath">
{`$ java -cp .:megacorp-audit-1.4.jar:jakarta.servlet-api-6.0.0.jar App

Boot 3 app starting; registering vendor filter...
Exception in thread "main" java.lang.NoClassDefFoundError: javax/servlet/Filter
	at java.base/java.lang.ClassLoader.defineClass1(Native Method)
	at java.base/java.lang.ClassLoader.defineClass(ClassLoader.java:974)
	at java.base/java.security.SecureClassLoader.defineClass(SecureClassLoader.java:145)
	at java.base/jdk.internal.loader.BuiltinClassLoader.defineClass(BuiltinClassLoader.java:776)
	at java.base/jdk.internal.loader.BuiltinClassLoader.findClassOnClassPathOrNull(...)
	at java.base/jdk.internal.loader.BuiltinClassLoader.loadClassOrNull(...)
	at java.base/jdk.internal.loader.BuiltinClassLoader.loadClass(...)
	at java.base/java.lang.ClassLoader.loadClass(ClassLoader.java:502)
	at java.base/java.lang.Class.forName0(Native Method)
	at java.base/java.lang.Class.forName(Class.java:478)`}
      </CodeBlock>

      <InfoBox variant="warning" title="Learn to recognise this stack trace">
        <p>
          <code>NoClassDefFoundError: javax/&lt;something&gt;</code> during startup, with{' '}
          <code>defineClass1</code> near the top of the trace, means exactly one thing:{' '}
          <strong>a jar on your classpath was compiled against the old namespace.</strong> The
          missing class name tells you which API; the class being <em>defined</em> when it failed
          tells you which jar. Note that the message says <code>NoClassDef<em>Found</em>Error</code>,
          not <code>ClassNotFoundException</code> — the difference matters. It means the JVM was
          part-way through linking a class that <em>does</em> exist, and hit a reference that does
          not.
        </p>
      </InfoBox>

      <h3>Finding stale jars before they find you</h3>

      <CodeBlock language="bash" title="Audit the whole dependency set in one pass">
{`# Scan every jar on the runtime classpath for javax.* references in bytecode.
./mvnw -q dependency:build-classpath -Dmdep.outputFile=/tmp/cp.txt
tr ':' '\\n' < /tmp/cp.txt | while read -r jar; do
  hits=$(unzip -p "$jar" '*.class' 2>/dev/null \\
         | strings \\
         | grep -cE 'javax/(servlet|persistence|validation|transaction|jms|mail|websocket|ws/rs|xml/bind|inject|enterprise)/')
  [ "$hits" -gt 0 ] && printf '%6s  %s\\n' "$hits" "$(basename "$jar")"
done | sort -rn

# Anything listed needs a Jakarta-compatible release, a replacement,
# or a decision. This list IS your migration blocker list.`}
      </CodeBlock>

      <InfoBox variant="danger" title="When a library never got a Jakarta release">
        <p>
          Sometimes there is no upgrade to move to. The vendor went out of business, the open
          source project was archived, or the licensed product wants a new contract for the
          Jakarta build. Your realistic options, worst to best:
        </p>
        <ul>
          <li>
            <strong>Replace it.</strong> Boring, correct, and usually cheaper than it looks once
            you scope it honestly.
          </li>
          <li>
            <strong>Transform the bytecode.</strong> The Eclipse Transformer project rewrites{' '}
            <code>javax/</code> constant-pool entries to <code>jakarta/</code> inside an existing
            jar. It genuinely works and is genuinely a last resort: you are now shipping a binary
            nobody supports, and you own every bug in it.
          </li>
          <li>
            <strong>Isolate it.</strong> Extract the dependency into its own small Boot 2 service
            behind an HTTP or queue boundary, and migrate everything else. You have not removed
            the problem, but you have shrunk it from &quot;the whole system&quot; to &quot;one
            service&quot; — and that service now has a clean seam for deletion later.
          </li>
          <li>
            <strong>Stay on Boot 2 deliberately.</strong> With a written risk acceptance and, if
            the exposure warrants it, a commercial support subscription. See the{' '}
            <a href="/springboot2/intro">previous lesson</a>.
          </li>
        </ul>
      </InfoBox>

      <h2>Dependency Coordinates That Changed</h2>

      <p>
        Separately from the package rename, several artifacts changed their Maven coordinates.
        These are two independent problems that arrived in the same release, which is why they are
        so often confused.
      </p>

      <CodeBlock language="xml" title="Servlet API — new groupId AND new artifactId">
{`<!-- Boot 2 -->
<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
    <version>4.0.1</version>
    <scope>provided</scope>
</dependency>

<!-- Boot 3/4 -->
<dependency>
    <groupId>jakarta.servlet</groupId>
    <artifactId>jakarta.servlet-api</artifactId>
    <scope>provided</scope>   <!-- version managed by the Boot BOM -->
</dependency>`}
      </CodeBlock>

      <CodeBlock language="xml" title="The rest of the Jakarta API coordinates">
{`javax.persistence:javax.persistence-api  ->  jakarta.persistence:jakarta.persistence-api
javax.validation:validation-api          ->  jakarta.validation:jakarta.validation-api
javax.annotation:javax.annotation-api    ->  jakarta.annotation:jakarta.annotation-api
javax.transaction:javax.transaction-api  ->  jakarta.transaction:jakarta.transaction-api
javax.xml.bind:jaxb-api                  ->  jakarta.xml.bind:jakarta.xml.bind-api
javax.jms:javax.jms-api                  ->  jakarta.jms:jakarta.jms-api

In practice you rarely declare these directly — the Spring Boot starters
pull the right ones. Check for stragglers:
  ./mvnw dependency:tree | grep -E 'javax\\.(servlet|persistence|validation|annotation)'`}
      </CodeBlock>

      <h3>MySQL: a coordinate change with nothing to do with Jakarta</h3>

      <p>
        The MySQL driver moved for an unrelated reason — Maven Central required reverse-DNS
        compliant group IDs — but it lands in the same migration, so it belongs on the same
        checklist. The old artifact carries a formal relocation notice. This is verbatim from the
        published POM:
      </p>

      <CodeBlock language="bash" title="Read it yourself">
{`curl -s https://repo1.maven.org/maven2/mysql/mysql-connector-java/\\
8.0.33/mysql-connector-java-8.0.33.pom | sed -n '/<distributionManagement>/,/<\\/distributionManagement>/p'`}
      </CodeBlock>

      <CodeBlock language="xml" title="Real output — the relocation block in mysql-connector-java 8.0.33">
{`<distributionManagement>
  <relocation>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <message>MySQL Connector/J artifacts moved to reverse-DNS compliant Maven 2+ coordinates.</message>
  </relocation>
</distributionManagement>`}
      </CodeBlock>

      <CodeBlock language="text" title="And the versions confirm it — the old coordinate is frozen">
{`$ curl -s .../mysql/mysql-connector-java/maven-metadata.xml | grep -oE '<version>[^<]+' | tail -3
<version>8.0.31
<version>8.0.32
<version>8.0.33        <- last release, then nothing

$ curl -s .../com/mysql/mysql-connector-j/maven-metadata.xml | grep -oE '<version>[^<]+' | tail -3
<version>9.6.0
<version>9.7.0
<version>26.7.0        <- development continues here`}
      </CodeBlock>

      <CodeBlock language="xml" title="So: change the coordinate">
{`<!-- Boot 2 era -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- Current -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>`}
      </CodeBlock>

      <InfoBox variant="tip" title="A relocation is a redirect, not a deprecation warning you can ignore forever">
        <p>
          Maven will follow that relocation and resolve <code>mysql-connector-j</code> for you,
          printing a warning as it does. So nothing breaks immediately — which is precisely why
          these linger in POMs for years. But the old coordinate is pinned at 8.0.33 forever, so
          your <em>declared</em> version stops tracking security fixes even though the build still
          works. Fix the coordinate.
        </p>
      </InfoBox>

      <h2>Do It Mechanically: OpenRewrite</h2>

      <p>
        A rename this uniform is exactly what automated refactoring is for. Doing it by hand
        across a few hundred files is not brave, it is a way to introduce typos into code the
        compiler cannot fully re-check.
      </p>

      <CodeBlock language="bash" title="Run the Jakarta migration with no build-file changes">
{`./mvnw -U org.openrewrite.maven:rewrite-maven-plugin:run \\
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-migrate-java:RELEASE \\
  -Drewrite.activeRecipes=org.openrewrite.java.migrate.jakarta.JakartaEE10

# Or the whole Boot 3 migration, which chains the Jakarta step for you
# (see the recipe list in the previous lesson):
./mvnw -U org.openrewrite.maven:rewrite-maven-plugin:run \\
  -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE \\
  -Drewrite.activeRecipes=org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_0

# Preview instead of applying — writes patch files under target/rewrite/:
#   ...:rewrite-maven-plugin:dryRun`}
      </CodeBlock>

      <InfoBox variant="note" title="Where that recipe name comes from">
        <p>
          <code>org.openrewrite.java.migrate.jakarta.JakartaEE10</code> is not invented for this
          page — it is the recipe Spring&apos;s own Framework 6.0 migration recipe delegates to.
          From <code>META-INF/rewrite/spring-framework-60.yml</code> inside{' '}
          <code>rewrite-spring-6.37.1.jar</code>:
        </p>
        <CodeBlock language="yaml" title="Real excerpt">
{`name: org.openrewrite.java.spring.framework.UpgradeSpringFramework_6_0
displayName: Migrate to Spring Framework 6.0
recipeList:
  - org.openrewrite.java.spring.framework.UpgradeSpringFramework_5_3
  - org.openrewrite.java.migrate.jakarta.JakartaEE10`}
        </CodeBlock>
      </InfoBox>

      <InfoBox variant="warning" title="What OpenRewrite will and will not do">
        <p>
          <strong>Will:</strong> rewrite imports and fully-qualified names correctly, including
          knowing which <code>javax</code> packages to leave alone; update Maven and Gradle
          coordinates; handle the property files and XML it recognises.
        </p>
        <p>
          <strong>Will not:</strong> fix third-party jars that were never re-released — the
          blocker list from the audit script above is still yours to solve. It also cannot rewrite{' '}
          <code>javax</code> names that appear as <em>strings</em> rather than as types:{' '}
          <code>Class.forName(&quot;javax.servlet.Filter&quot;)</code>, a{' '}
          <code>&lt;filter-class&gt;</code> in a <code>web.xml</code>, a class name in a{' '}
          <code>persistence.xml</code>, or a fully-qualified name inside a{' '}
          <code>@ConditionalOnClass</code> string. Grep for those separately — they fail at
          runtime, not at build time.
        </p>
      </InfoBox>

      <CodeBlock language="bash" title="The grep that catches the string-literal cases">
{`# Type references are handled by the tool; STRING references are not.
grep -rn '"javax\\.' --include='*.java' --include='*.xml' \\
                     --include='*.properties' --include='*.yml' . \\
  | grep -vE 'javax\\.(sql|crypto|naming|net|management|security\\.auth|imageio|swing|script|xml\\.parsers|xml\\.transform)'`}
      </CodeBlock>

      <h2>The Order To Do This In</h2>

      <FlowChart
        title="A javax to jakarta migration that does not strand you halfway"
        chart={"graph TD\nA[\"Get to Boot 2.7 first\"] --> B[\"Audit jars for javax bytecode references\"]\nB --> C{\"Any blocker with no Jakarta release?\"}\nC -->|Yes| D[\"Replace, transform, isolate, or stop here\"]\nC -->|No| E[\"Upgrade the JDK to 17 — ship that alone\"]\nD --> E\nE --> F[\"Run OpenRewrite JakartaEE10 on a branch\"]\nF --> G[\"Grep for string-literal javax references\"]\nG --> H[\"Fix dependency coordinates: servlet, mysql, ...\"]\nH --> I[\"Compile. The compiler enumerates what is left.\"]\nI --> J[\"Run the full test suite\"]\nstyle A fill:#1a2744,stroke:#5b9cf6\nstyle D fill:#3a1f1f,stroke:#f87171\nstyle J fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="success" title="The one sequencing rule worth internalising">
        <p>
          <strong>Audit the jars before you touch a single import.</strong> The rename itself is
          hours of machine time. A vendor library with no Jakarta release is weeks of human
          negotiation, and it is the thing that decides whether this migration is possible at all.
          Finding that out on day one is a scoping exercise; finding it out after you have
          rewritten four hundred files is a rollback.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="A colleague migrates the codebase with: find . -name '*.java' | xargs sed -i 's/javax\\./jakarta./g'. Everything compiles except a handful of files. What went wrong?"
        options={[
          "Nothing conceptually — sed is the standard approach and those files just need manual fixes",
          "It rewrote JDK-owned javax packages (javax.sql, javax.crypto, javax.naming, javax.net.ssl) that never moved to jakarta",
          "sed cannot handle multi-line import statements, so some imports were missed",
          "The regex needed to be case-insensitive to catch all variants"
        ]}
        correctIndex={1}
        explanation="Only the Java EE packages moved to jakarta. The javax packages that ship with the JDK — javax.sql.DataSource, javax.crypto.Cipher, javax.naming.InitialContext, javax.net.ssl.SSLContext, javax.management, javax.security.auth, javax.imageio, javax.swing, javax.script, javax.xml.parsers, javax.xml.transform — were never Oracle's to donate to Eclipse and are still called javax today. A blanket rewrite turns javax.sql.DataSource into jakarta.sql.DataSource, which does not exist. The failures are loud here, which is lucky; the genuinely nasty version of this mistake is javax.xml.bind (JAXB, which DID move) sitting next to javax.xml.parsers (JAXP, which did NOT) — they look like siblings and behave differently. This is exactly why OpenRewrite is the right tool: it operates on resolved types, so it knows which is which."
      />

      <InteractiveChallenge
        question="Your Boot 3 migration compiles cleanly and all unit tests pass, but the application dies at startup with 'NoClassDefFoundError: javax/servlet/Filter' and defineClass1 near the top of the trace. What is the cause?"
        options={[
          "You missed a javax import somewhere — search the source again",
          "The jakarta.servlet-api dependency is missing from the pom",
          "A third-party jar on the classpath was compiled against javax.servlet and needs a Jakarta-compatible release from its maintainer",
          "Spring Boot 3 needs spring.jakarta.enabled=true set in application.properties"
        ]}
        correctIndex={2}
        explanation="The fact that it COMPILED is the key evidence. If one of your own imports were still javax, javac would have failed with 'package javax.servlet does not exist' — a compile break, not a runtime one. Compiling clean means your source is fully migrated. The javax reference is therefore in bytecode you did not compile: a third-party jar whose constant pool still contains javax/servlet/Filter. javap -c on the offending class shows the reference baked in. Option 2 would produce a failure about the jakarta types instead. Option 4 is invented — there is no such flag, and no compatibility mode exists precisely because the rename is a hard break. Your fix is a Jakarta-compatible release of that library, a replacement, Eclipse Transformer as a last resort, or isolating it behind a service boundary. Find these with a bytecode audit BEFORE starting the migration, not after."
      />
    </LessonLayout>
  );
}

export default SpringBoot2Javax;
