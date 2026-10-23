import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ModularMonolith() {
  return (
    <LessonLayout
      title="Many Services, One App — The Wrapper Pattern"
      sectionId="springboot"
      lessonIndex={18}
      prev={{ path: '/springboot/resilience', label: 'Resilience4j & Circuit Breakers' }}
      next={{ path: '/springboot/cheatsheet', label: 'Spring Boot 4 Field Guide' }}
    >
      <p>
        Here is a setup that exists in a lot of real companies and sounds impossible the first
        time it is described to you. A team has eight Spring Boot microservices, plus a shared
        framework library that provides common interfaces and infrastructure. The services can
        run independently. But there is <em>also</em> a &ldquo;wrapper&rdquo; service that
        brings all eight together and runs them as <strong>one</strong> application, on one
        port, where they share the same Spring beans.
      </p>
      <p>
        The natural question is how the eight Spring contexts coordinate: how do they agree on
        one instance of a bean, who elects the leader, what protocol do they speak?
      </p>
      <p>
        <strong>They do not coordinate, because there are not eight contexts.</strong> There is
        one. Nothing in Spring is doing anything clever here, and once you see the mechanism
        the mystery disappears entirely — along with the reason that a service which works
        standalone can break the moment it is packaged this way.
      </p>

      <InfoBox variant="note" title="Two lessons this builds on">
        <p>
          The <a href="/java/classpath">Classes, Jars &amp; the Classpath</a> lesson in Core
          Java covers the first half: how declaring a jar as a dependency makes its compiled
          classes reachable, and what happens when two jars contain the same thing. The{' '}
          <a href="/springboot/di">Dependency Injection &amp; IoC</a> lesson covers the second
          half: component scanning, the container, and singleton beans. This lesson is what you
          get when you put those two facts together.
        </p>
      </InfoBox>

      <h2>The Mechanism, in Four Steps</h2>
      <ol>
        <li>
          <strong>Each service is built as an ordinary jar.</strong> Its{' '}
          <code>@RestController</code>, <code>@Service</code> and{' '}
          <code>@Configuration</code> classes are just compiled classes sitting in a zip file.
          Nothing about being annotated makes a class special until something scans for it.
        </li>
        <li>
          <strong>The wrapper declares all eight as dependencies.</strong> So every class from
          every service is on <em>one classpath</em>, in <em>one JVM</em>, exactly as if you
          had written them all yourself.
        </li>
        <li>
          <strong>The wrapper has the only <code>main</code> that runs.</strong> One call to{' '}
          <code>SpringApplication.run</code> creates one <code>ApplicationContext</code>. Each
          service&apos;s own <code>main</code> method is still there in its jar, never invoked
          — an unused method in a library.
        </li>
        <li>
          <strong>Component scanning finds everything.</strong> Spring walks the configured
          packages, finds every annotated class regardless of which jar it came from, and
          registers them all in that single container. A container is essentially a map from
          bean name to instance; it has no concept of which jar a class arrived in.
        </li>
      </ol>
      <p>
        Because it is one container in one JVM, <strong>bean sharing is not a feature that had
        to be built — it is just what happens</strong>. A singleton is one object. Eight
        services&apos; worth of code asking to be injected with it all receive the same
        reference. Controllers from all eight register with the same embedded Tomcat on the
        same port.
      </p>

      <FlowChart
        title="Eight jars, one container"
        chart={"graph TD\nA[orders.jar] --> CP[One classpath, one JVM]\nB[users.jar] --> CP\nC[billing.jar] --> CP\nD[framework.jar] --> CP\nCP --> M[Wrapper's single main - one SpringApplication.run]\nM --> S[Component scan across all those packages]\nS --> CTX[One ApplicationContext]\nCTX --> R1[All controllers on one Tomcat, one port]\nCTX --> R2[One instance of each shared bean]"}
      />

      <InfoBox variant="tip" title="The Node equivalent">
        <p>
          Imagine a monorepo where each service exports an Express router instead of calling{' '}
          <code>app.listen()</code>. One <code>index.js</code> imports all eight routers, mounts
          them on a single <code>app</code>, calls <code>listen</code> once, and passes the
          same DB pool and Redis client into each. Nothing is &ldquo;running&rdquo; eight
          servers; you imported eight modules.
        </p>
        <p>
          Spring&apos;s container is doing the same job, with two differences: the wiring is
          discovered by annotation scanning rather than written out by hand, and the shared
          singletons are injected rather than passed as arguments. The wrapper&apos;s{' '}
          <code>main</code> is that <code>index.js</code>.
        </p>
      </InfoBox>

      <h2>A Complete Working Example</h2>
      <p>
        Below is the whole pattern at two-service scale. Everything in this lesson was compiled
        and run on <strong>Spring Boot 4.0.6 / Spring Framework 7.0.7, Java 26.0.1</strong>, as
        four separate jars on one classpath — the outputs are transcripts, not sketches.
      </p>

      <CodeBlock language="java" title="framework.jar — the shared library">
{`package com.acme.framework;

@Component
public class AuditLogger {
    private final AtomicInteger calls = new AtomicInteger();

    public AuditLogger() {
        System.out.println("### AuditLogger CONSTRUCTED, identity=" + System.identityHashCode(this));
    }

    public String log(String msg) {
        int n = calls.incrementAndGet();
        return "AuditLogger@" + System.identityHashCode(this) + " call #" + n + ": " + msg;
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="orders.jar — a service, with its own unused main">
{`package com.acme.orders;

@RestController
public class OrderController {
    private final AuditLogger audit;                        // from the framework jar

    public OrderController(AuditLogger audit) { this.audit = audit; }

    @GetMapping("/orders")
    public String orders() { return audit.log("orders listed") + "\\n"; }
}

// Same jar, same package: the service's own entry point. It still compiles and
// still works when this jar is run on its own.
@SpringBootApplication
public class OrdersApplication {
    public static void main(String[] args) {
        System.out.println("### ORDERS OWN main() RUNNING - you should never see this line");
        SpringApplication.run(OrdersApplication.class, args);
    }
}`}
      </CodeBlock>

      <p>
        <code>users.jar</code> is the same shape: a <code>UserController</code> mapping{' '}
        <code>/users</code> and injecting the same <code>AuditLogger</code>, plus its own{' '}
        <code>UsersApplication</code>. The wrapper is the only project that is not a service:
      </p>

      <CodeBlock language="java" title="wrapper.jar — the only main that runs">
{`package com.acme.wrapper;

@SpringBootApplication(scanBasePackages = {
    "com.acme.wrapper",          // see the warning below — this line is load-bearing
    "com.acme.framework",
    "com.acme.orders",
    "com.acme.users"
})
public class WrapperApplication {
    public static void main(String[] args) {
        var ctx = SpringApplication.run(WrapperApplication.class, args);
        System.out.println("### beans named *Controller: "
            + Arrays.toString(ctx.getBeanNamesForAnnotation(RestController.class)));
        System.out.println("### AuditLogger bean count = "
            + ctx.getBeansOfType(AuditLogger.class).size());
    }
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Run it — four jars, one classpath, one process">
{`$ java -cp "<spring deps>:framework.jar:orders.jar:users.jar:wrapper.jar" \\
       -Dserver.port=8099 com.acme.wrapper.WrapperApplication`}
      </CodeBlock>

      <CodeBlock language="text" title="Real startup output">
{`### AuditLogger CONSTRUCTED, identity=384752294
... o.s.boot.tomcat.TomcatWebServer : Tomcat started on port 8099 (http) with context path '/'
... com.acme.wrapper.WrapperApplication : Started WrapperApplication in 0.634 seconds
### beans named *Controller: [orderController, userController]
### AuditLogger bean count = 1`}
      </CodeBlock>

      <CodeBlock language="bash" title="Real output — three requests across both services">
{`$ curl localhost:8099/orders
AuditLogger@384752294 call #1: orders listed
$ curl localhost:8099/users
AuditLogger@384752294 call #2: users listed
$ curl localhost:8099/orders
AuditLogger@384752294 call #3: orders listed`}
      </CodeBlock>

      <InfoBox variant="success" title="What that output proves, line by line">
        <ul>
          <li>
            <strong>One container.</strong> Two controllers from two different jars appear in
            one <code>getBeanNamesForAnnotation</code> result.
          </li>
          <li>
            <strong>One port.</strong> One Tomcat serves <code>/orders</code> and{' '}
            <code>/users</code>; neither service started a server of its own.
          </li>
          <li>
            <strong>One shared bean, genuinely shared.</strong>{' '}
            <code>AuditLogger CONSTRUCTED</code> printed exactly once, the bean count is 1, and
            the <em>same</em> identity hash <code>384752294</code> appears in responses from
            both services. The call counter runs 1, 2, 3 <em>across</em> them, which is the
            strong form of the claim: this is one object with one piece of state, not two
            objects that happen to look alike.
          </li>
          <li>
            <strong>Neither service&apos;s <code>main</code> ran.</strong> The{' '}
            <code>### ORDERS OWN main() RUNNING</code> line never appears. That is the sentence
            worth keeping: the wrapper is not starting the services, it is{' '}
            <em>linking</em> them.
          </li>
        </ul>
      </InfoBox>

      <h3>But their <code>@SpringBootApplication</code> classes are still beans</h3>
      <p>
        One detail that surprises people, and it is checkable rather than theoretical. Printing
        the bean definition names from that same run:
      </p>

      <CodeBlock language="text" title="Real output — beans whose names mention 'application'">
{`### bean: wrapperApplication
### bean: ordersApplication
### bean: usersApplication`}
      </CodeBlock>

      <p>
        The services&apos; entry-point classes live in scanned packages, and{' '}
        <code>@SpringBootApplication</code> is itself a <code>@Configuration</code> — so the
        scan registers them. Their <code>main</code> methods are never called, but the
        annotation&apos;s other halves, <code>@EnableAutoConfiguration</code> and{' '}
        <code>@ComponentScan</code>, are now active <em>in addition to</em> the wrapper&apos;s.
      </p>
      <p>
        Usually harmless, occasionally not: it is how a service can drag in auto-configuration
        the wrapper never asked for, or scan a package the wrapper deliberately excluded. If
        you want to prevent it, exclude those classes from the scan explicitly, and remember
        that the cleanest version of this pattern keeps each service&apos;s entry point in its
        own package outside the scanned tree.
      </p>

      <CodeBlock language="java" title="Excluding the services' entry points">
{`@SpringBootApplication(
    scanBasePackages = { "com.acme.wrapper", "com.acme.framework", "com.acme.orders", "com.acme.users" },
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = { OrdersApplication.class, UsersApplication.class }))
public class WrapperApplication { /* ... */ }`}
      </CodeBlock>

      <InfoBox variant="danger" title="scanBasePackages REPLACES the default scan — including your own package">
        <p>
          This one cost real time to find while writing the lesson, and the symptom is a
          component that is silently never registered. By default{' '}
          <code>@SpringBootApplication</code> scans the package of the class it annotates and
          everything below it. The moment you pass <code>scanBasePackages</code>, that default
          is <strong>replaced</strong>, not extended.
        </p>
        <p>
          A <code>@Component</code> added next to <code>WrapperApplication</code> in{' '}
          <code>com.acme.wrapper</code> therefore did not exist as far as the container was
          concerned — no error, no warning, and an <code>ApplicationRunner</code> that simply
          never ran. Adding <code>&quot;com.acme.wrapper&quot;</code> to the list fixed it.
          If your wrapper lists sibling packages, it must list its own too.
        </p>
      </InfoBox>

      <h3>Three ways to point the wrapper at the services</h3>
      <CodeBlock language="java" title="From most coupled to least">
{`// 1. Name the packages. Simple, and the wrapper now hardcodes every service's
//    package layout -- renaming a package in a service breaks the wrapper silently.
@SpringBootApplication(scanBasePackages = { "com.acme.orders", "com.acme.users" })

// 2. Import each service's own configuration class. The service decides what it
//    exposes; the wrapper depends on one type instead of a string.
@SpringBootApplication
@Import({ OrdersConfiguration.class, UsersConfiguration.class })

// 3. Let each service ship auto-configuration. The jar carries a file at
//    META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
//    listing its config classes, and the wrapper needs no knowledge of it at all --
//    adding the dependency is the entire integration. This is how starters work,
//    and it is the right answer for a framework library used by eight services.
@SpringBootApplication`}
      </CodeBlock>

      <p>
        Option 1 is what most wrappers actually do, and it is worth knowing that options 2 and
        3 exist, because a string in an annotation is the weakest possible contract between two
        teams.
      </p>

      <h2>What Breaks</h2>
      <p>
        Everything above is the easy part. The failure modes all come from the same root cause:{' '}
        <strong>things that used to be separated by a process boundary are now in one
        process</strong>, and a process boundary was doing a lot of quiet work.
      </p>

      <h3>1. Two beans that want the same name</h3>
      <p>
        Spring derives a bean name from the class&apos;s simple name. Two services that each
        have a <code>UserService</code> — in different packages, which standalone is completely
        fine — both ask for the name <code>userService</code>:
      </p>

      <CodeBlock language="text" title="Real output — Spring Boot 4.0.6">
{`Caused by: org.springframework.context.annotation.ConflictingBeanDefinitionException:
Annotation-specified bean name 'userService' for bean class [com.acme.users.UserService]
conflicts with existing, non-compatible bean definition of same name and class
[com.acme.orders.UserService]`}
      </CodeBlock>

      <p>
        The good news is that this one fails loudly at startup, which is the behaviour you
        want: the alternative — one service silently receiving the other&apos;s bean — would be
        far worse. The message names both classes, so the fix is mechanical:
      </p>

      <CodeBlock language="java" title="Three fixes, in order of preference">
{`// Best: name the bean explicitly, per service. Costs nothing and documents ownership.
@Service("ordersUserService")
public class UserService { }

// Also fine: give the classes names that say which domain they belong to.
// OrdersUserService / IdentityUserService.

// Last resort: exclude one from the scan and register it yourself with @Bean
// under a chosen name. Use when you cannot change the service's source.`}
      </CodeBlock>

      <h3>2. Two controllers that map the same route</h3>
      <p>
        Two services that each expose <code>GET /health</code> — again, individually
        reasonable:
      </p>

      <CodeBlock language="text" title="Real output — Spring Boot 4.0.6">
{`Caused by: java.lang.IllegalStateException: Ambiguous mapping. Cannot map 'usersHealth' method
com.acme.users.UsersHealth#h()
to {GET [/health]}: There is already 'ordersHealth' bean method
com.acme.orders.OrdersHealth#h() mapped.`}
      </CodeBlock>

      <p>
        Also a startup failure, also naming both sides. The structural fix is a path prefix per
        service, declared at the class level so it cannot be forgotten on a new method:
      </p>

      <CodeBlock language="java" title="Prefix at the class level">
{`@RestController
@RequestMapping("/orders-api")        // every method below is now under this prefix
public class OrderController {
    @GetMapping("/health") public String health() { return "orders ok"; }
    @GetMapping("/orders") public List<String> list() { ... }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="server.servlet.context-path cannot solve this">
        <p>
          The reflex is to give each service its own context path. It does not apply: there is
          one servlet context in one application, so <code>context-path</code> is a single
          global prefix for all eight services at once. The same goes for{' '}
          <code>spring.mvc.servlet.path</code>. Per-service prefixes have to come from the
          mappings themselves — which is why wrapper setups tend to standardise{' '}
          <code>/&#123;service&#125;/...</code> as a convention enforced in review.
        </p>
      </InfoBox>

      <h3>3. Configuration files that shadow each other</h3>
      <p>
        This is the one that does <em>not</em> fail at startup, which makes it the most
        expensive of the three. Spring Boot reads <code>application.yml</code> from the
        classpath root. Eight jars with a file of that name do not get merged — the classpath
        returns the first match and the rest are invisible.
      </p>
      <p>
        Two jars, each with its own <code>application.yml</code>, the same application started
        twice with nothing changed but the order of two classpath entries:
      </p>

      <CodeBlock language="yaml" title="The two files">
{`# inside orders-conf.jar
app:
  owner: orders-service
server:
  port: 8097

# inside users-conf.jar
app:
  owner: users-service
server:
  port: 8096`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Spring Boot 4.0.6, orders jar first">
{`### Spring resolved app.owner   = orders-service
### Spring resolved server.port = 8097
###   copy 1: jar:.../orders-conf.jar!/application.yml
###   copy 2: jar:.../users-conf.jar!/application.yml
### 2 application.yml on the classpath`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — same build, users jar first">
{`### Spring resolved app.owner   = users-service
### Spring resolved server.port = 8096
###   copy 1: jar:.../users-conf.jar!/application.yml
###   copy 2: jar:.../orders-conf.jar!/application.yml
### 2 application.yml on the classpath`}
      </CodeBlock>

      <p>
        Spring found and used one file, and the application would have listened on a{' '}
        <strong>different port</strong> depending on nothing but dependency order — which can
        change when someone adds an unrelated library. Nothing in the logs mentions that a
        second copy existed; only asking the class loader for <em>all</em> copies reveals it.
        <strong> This is the mechanism behind &ldquo;it works standalone but breaks in the
        wrapper&rdquo;</strong>, and it applies to every classpath resource, not just config:
        SQL files, templates, message bundles, <code>banner.txt</code>.
      </p>

      <CodeBlock language="java" title="The diagnostic worth keeping in a scratch endpoint">
{`Enumeration<URL> all = getClass().getClassLoader().getResources("application.yml");
while (all.hasMoreElements()) log.warn("config copy: {}", all.nextElement());
// Prints the jar each copy came from. Run it the moment config looks wrong.`}
      </CodeBlock>

      <CodeBlock language="yaml" title="And the fixes">
{`# 1. Unique names per service, imported deliberately by the wrapper.
#    Uniqueness must hold across the whole classpath, not just your own repo.
spring:
  config:
    import:
      - classpath:orders-service.yml
      - classpath:users-service.yml

# 2. Or namespace by directory, so the classpath PATH is unique:
#    config/orders/application.yml, config/users/application.yml

# 3. Or keep all shared settings in the wrapper's own application.yml and let
#    the services carry none. Most wrapper projects end up here; it is the
#    least surprising, at the cost of the services not being self-contained.`}
      </CodeBlock>

      <h3>4. State that the process boundary used to isolate</h3>
      <p>
        No error message for any of these. They are simply true once eight services share a
        JVM, and they are the reason this pattern needs deliberate review rather than just a
        working build:
      </p>
      <CodeBlock language="text" title="What stops being isolated">
{`static fields and caches   Eight services' in-memory caches now share one heap.
                           A static Map that was "per service" is now global, and
                           one service's unbounded cache can OOM all eight.

Thread pools               @Async and @Scheduled defaults are per-application, not
                           per-service. spring.task.scheduling.pool.size defaults
                           to 1, so one service's slow nightly job delays every
                           other service's scheduled work. See the Core Java
                           Executors lesson for why that pool size matters.

@Scheduled jobs            Each service's cron jobs now run in the same process as
                           the others -- and if the wrapper AND the standalone
                           services are both deployed, the job runs twice.

ThreadLocals               SecurityContextHolder, MDC and transaction state are
                           thread-bound. In one process, a request to service A
                           may be served by a thread that previously served B.
                           Anything not cleared in a finally block leaks across
                           service boundaries that used to be machines apart.

Auto-configuration         Eight services each expecting "the" DataSource, Kafka
                           consumer or RestClient means several beans of one type
                           in one context -> NoUniqueBeanDefinitionException. The
                           @Qualifier / @Primary section of the DI lesson is the
                           fix, and it has to be applied deliberately per service.

Failure domain             One OutOfMemoryError, one bad deploy, one uncaught
                           error in startup takes down all eight at once. This is
                           the real cost, and it is not visible in any log until
                           the day it happens.

Observability              Metric and trace names collide. Eight services
                           reporting http.server.requests on one meter registry
                           need a tag identifying the service, or the dashboards
                           are meaningless.`}
      </CodeBlock>

      <h2>Where the Swagger/OpenAPI YAML Fits</h2>
      <p>
        A common follow-up: if each service has its own OpenAPI YAML that generates its
        endpoints and response classes, do those definitions come along into the wrapper too?
      </p>
      <p>
        Mostly yes, but not for the reason it looks like — and the distinction matters when
        something goes wrong. <strong>Endpoints are never defined in YAML at run time.</strong>{' '}
        They are defined by Java annotations on compiled classes. Which of the two generation
        styles a service uses decides where those annotations come from:
      </p>

      <FlowChart
        title="Spec-first versus code-first"
        chart={"graph TD\nY[openapi.yaml in the service repo] -->|build-time codegen| G[Generated Java interfaces and model DTOs]\nG --> J[Compiled into the service jar]\nJ --> SC[Wrapper scans it like any other controller]\nC[Hand-written controllers] --> J2[Compiled into the service jar]\nJ2 --> SD[springdoc scans the live context at runtime]\nSD --> ONE[One combined spec for all eight services]"}
      />

      <ul>
        <li>
          <strong>Spec-first</strong> (the YAML is the source, usually via{' '}
          <code>openapi-generator</code>): the generator runs during <em>that
          service&apos;s</em> build and emits Java API interfaces and model classes carrying
          the <code>@GetMapping</code>-style annotations. Developers implement the interfaces.
          By the time a jar exists, the YAML has already done its job — the wrapper sees plain
          compiled classes and scans them like anything else. The YAML is never read at run
          time to create a route.
        </li>
        <li>
          <strong>Code-first</strong> (annotations are the source, via{' '}
          <code>springdoc-openapi</code>): the spec is generated at run time by inspecting the
          live context. In the wrapper, that context contains all eight services&apos;
          controllers, so you get one combined spec and one Swagger UI covering everything —
          which is often the single nicest side effect of the whole arrangement.
        </li>
      </ul>

      <InfoBox variant="warning" title="Two collisions specific to generated code">
        <ul>
          <li>
            <strong>Generated packages must be unique per service.</strong> The generator&apos;s{' '}
            <code>apiPackage</code> and <code>modelPackage</code> settings decide where classes
            land. If two services generate a <code>User</code> or an{' '}
            <code>ErrorResponse</code> into the <em>same</em> package, you get two classes with
            the same fully-qualified name on one classpath — and from the classpath lesson, the
            first one on the list silently wins. The symptom is a{' '}
            <code>NoSuchMethodError</code> or a field that deserialises as null, not a helpful
            error. Check <code>modelPackage</code> in each service&apos;s build file; it should
            contain the service name.
          </li>
          <li>
            <strong>A YAML served as a static resource collides like any other resource.</strong>{' '}
            If each service bundles <code>openapi.yaml</code> at its classpath root to serve at{' '}
            <code>/openapi.yaml</code>, eight copies at the same path means seven are
            unreachable — the exact shadowing demonstrated above. Serve a combined springdoc
            spec, or give each file a unique path.
          </li>
        </ul>
        <p>
          A genuinely shared response shape — one <code>ErrorResponse</code> every service
          returns — belongs in the framework jar and should be generated once there, not eight
          times into eight packages.
        </p>
      </InfoBox>

      <h2>Is This a Good Idea?</h2>
      <p>
        It is a <strong>modular monolith</strong>, and it is a legitimate architecture rather
        than a mistake — the{' '}
        <a href="/microservices/intro">microservices section</a> covers the trade-off in
        general terms. What is worth being clear-eyed about is that running the same code both
        ways gives you the union of the constraints, not the union of the benefits:
      </p>
      <CodeBlock language="text" title="What you gain and what you give up">
{`Gained   One deployable, one startup, one set of infrastructure to operate.
         No network hop, no serialisation, no retry logic between the eight --
         an in-process method call cannot time out or half-fail.
         Shared caches and connection pools used once instead of eight times.
         One combined API surface and one set of docs.

Given up Independent deployment. Shipping a one-line fix to one service means
         redeploying all eight.
         Independent scaling. The CPU-heavy service and the memory-heavy one
         now size the same JVM.
         Failure isolation. One OOM or one startup error stops everything.
         Version independence. All eight must agree on one Spring Boot version,
         one Jackson, one of everything -- and a transitive conflict in service
         A is now service B's problem.

Watch    Because a shared bean is a compile-time dependency, coupling grows
         invisibly. Two services that could only talk over HTTP now cannot
         be separated again without unpicking every @Autowired between them.
         Keeping the services deployable standalone is what preserves the
         option, and the only way to know they still are is to keep building
         and testing them that way in CI.`}
      </CodeBlock>

      <h2>How to Investigate a Wrapper You Have Inherited</h2>
      <p>
        If this describes your workplace, these are the places the whole arrangement is
        written down, and they will take under an hour to read:
      </p>
      <CodeBlock language="bash" title="Where to look">
{`# 1. The wrapper's pom.xml / build.gradle: the eight service dependencies.
#    This is the complete list of what is in the application.

# 2. The wrapper's @SpringBootApplication: scanBasePackages, @Import,
#    excludeFilters. This is the complete list of what gets wired.

# 3. What is actually inside a service jar, including stray resources:
jar tf orders-service-1.4.2.jar | grep -v '\\.class$'

# 4. Which version of each library actually won:
mvn dependency:tree -Dverbose
./gradlew dependencies --configuration runtimeClasspath

# 5. Ask the running application, which beats reading any amount of source.
#    Needs actuator and these endpoints exposed in a non-prod profile:
curl localhost:8080/actuator/beans     | jq '.contexts.application.beans | keys'
curl localhost:8080/actuator/mappings  | jq               # every route, and its handler
curl localhost:8080/actuator/env       | jq               # every property and its source
curl localhost:8080/actuator/configprops | jq

# 6. Why a bean exists or does not: the auto-configuration condition report.
java -jar wrapper.jar --debug`}
      </CodeBlock>

      <p>
        Point 5 is the one to reach for first. <code>/actuator/env</code> reports the{' '}
        <em>source</em> of every resolved property, which answers the config-shadowing question
        directly, and <code>/actuator/mappings</code> shows every route with the bean that
        handles it, which answers &ldquo;which service is serving this?&rdquo; without reading
        eight repositories.
      </p>

      <h2>Checklist</h2>
      <InfoBox variant="success" title="Signs a wrapper setup is under control">
        <ul>
          <li>Every service names its beans explicitly, or uses domain-prefixed class names.</li>
          <li>Every controller carries a class-level path prefix identifying its service.</li>
          <li>No two jars contain a resource at the same classpath path — config, SQL,
              OpenAPI specs or templates.</li>
          <li>Configuration is either the wrapper&apos;s alone, or imported by unique name
              with <code>spring.config.import</code>.</li>
          <li>Generated OpenAPI models go to per-service packages; genuinely shared shapes
              live in the framework jar.</li>
          <li>Scheduled jobs are owned by exactly one deployment, not run by both the wrapper
              and a standalone service.</li>
          <li>Thread pools are sized for the combined workload, and slow background work has
              its own pool.</li>
          <li>Metrics and traces carry a service tag.</li>
          <li>Each service still builds and starts on its own in CI — that is what keeps the
              option to split them later.</li>
        </ul>
      </InfoBox>

      <h2>Where This Leads</h2>
      <p>
        The takeaway is smaller than the question: there is no distributed-systems problem
        here. Declaring a jar as a dependency puts its classes on one classpath; one{' '}
        <code>main</code> builds one container; scanning finds everything in it; a singleton
        is one object. Everything difficult about this pattern is a <em>collision</em> —
        bean names, routes, resource paths, library versions, shared state — and every one of
        those collisions is a consequence of the same mechanism rather than a separate mystery.
      </p>
      <p>
        Next is the <strong><a href="/springboot/cheatsheet">Spring Boot 4 Field
        Guide</a></strong>, which condenses this section into panels for recall. If this
        lesson is immediately relevant to your work, the two to re-read alongside it are{' '}
        <a href="/springboot/di">Dependency Injection &amp; IoC</a> for qualifiers and bean
        lifecycle, and <a href="/java/classpath">Classes, Jars &amp; the Classpath</a> for
        what the jars are doing underneath.
      </p>
    </LessonLayout>
  );
}
