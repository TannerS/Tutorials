import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function AnnotationPipeline() {
  return (
    <LessonLayout
      title="How an Annotation Becomes a Bean"
      sectionId="springboot"
      lessonIndex={19}
      prev={{ path: '/springboot/modular-monolith', label: 'Many Services, One App — The Wrapper Pattern' }}
      next={{ path: '/springboot/cheatsheet', label: '📋 Spring Boot 4 Field Guide' }}
    >
      <p>
        <code>@Service</code> is not a keyword. The compiler does not know what it means, the
        JVM does not know what it means, and nothing in the Java language turns an annotated
        class into an object. Something has to <em>read</em> that annotation and decide to
        construct the class, and that something is ordinary Spring code you could have written
        yourself.
      </p>
      <p>
        This lesson follows one <code>@Service</code> from a <code>.class</code> file on disk
        to a live object in the container, naming the component responsible at each step. It is
        the mechanism underneath the previous lesson: once you can see where bean definitions
        come from, why absorbing ten applications collides the way it does stops being
        mysterious.
      </p>

      <InfoBox variant="note" title="The one fact this all rests on">
        <p>
          From the Java lessons: an annotation is <strong>data stored in the class file</strong>,
          in an attribute called <code>RuntimeVisibleAnnotations</code>, and it is only stored
          there if the annotation is declared{' '}
          <code>@Retention(RetentionPolicy.RUNTIME)</code>. Every Spring annotation is. See{' '}
          <a href="/java/classpath">Class Files, Jars and the Classpath</a> for the{' '}
          <code>javap</code> output that shows the attribute directly.
        </p>
        <p>
          So Spring is not reading your source code and it is not doing anything the language
          forbids. It is opening files and looking for bytes that <code>javac</code> put there.
        </p>
      </InfoBox>

      <h2>The Whole Pipeline</h2>
      <p>
        Five stages. The important structural fact is the gap in the middle:{' '}
        <strong>for most of startup there are no beans at all</strong>, only descriptions of
        beans. Almost every confusing Spring error comes from code that runs on the wrong side
        of that gap.
      </p>

      <FlowChart
        title="From javac to a live object"
        chart={"graph TD\nSRC[Your .java source] -->|javac| CF[.class file with RuntimeVisibleAnnotations]\nCF -->|Gradle or Maven| CP[On the classpath]\nCP -->|ClassPathScanningCandidateComponentProvider reads BYTES via ASM| BD[BeanDefinition - metadata only, no instance]\nBD -->|BeanFactoryPostProcessors edit the DEFINITIONS| BD2[Final set of definitions]\nBD2 -->|Container instantiates| OBJ[Raw object]\nOBJ -->|BeanPostProcessors edit the INSTANCES| READY[Ready bean, possibly a proxy]"}
      />

      <h2>Stage 1: The Build Puts Class Files Somewhere Findable</h2>
      <p>
        Before Spring can scan anything, the class files have to be on the classpath, and that
        is purely the build tool&apos;s job. Spring has no opinion about it. Gradle and Maven
        differ in vocabulary but do the same work:
      </p>

      <CodeBlock language="text" title="The same job, two vocabularies">
{`Maven                                  Gradle
-----                                  ------
src/main/java      -> target/classes   src/main/java  -> build/classes/java/main
src/main/resources -> target/classes   src/main/resources -> build/resources/main
<dependency>                           implementation / api
mvn package                            ./gradlew build
spring-boot:repackage                  bootJar task

Both end up handing the JVM the same thing: a list of
directories and jars to search, in order.`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Gradle detail that matters when combining services">
        <p>
          Gradle and Maven both end up with the fat jar under the module&apos;s plain
          coordinates, but they get there differently, and the difference is worth knowing
          because the fix is not the same shape.
        </p>
        <p>
          <strong>Maven replaces.</strong> The <code>repackage</code> goal overwrites the main
          artifact with the executable jar and moves the original aside as{' '}
          <code>.jar.original</code>. There is only one published artifact, and it is the fat
          one.
        </p>
        <p>
          <strong>Gradle builds both.</strong> Keeping the plain jar is the default: when{' '}
          <code>bootJar</code> is configured, Gradle gives the ordinary <code>jar</code> task
          the classifier <code>plain</code> so the two archives land in different files. You get{' '}
          <code>myapp-1.0.jar</code> (executable) <em>and</em>{' '}
          <code>myapp-1.0-plain.jar</code> (a normal library jar). The catch is which one holds
          the unclassified name: <code>bootJar</code> does, so a dependency on the module
          still resolves to the fat jar whose classes hide under{' '}
          <code>BOOT-INF/classes/</code>.
        </p>
        <p>
          The documented fix is to swap the two classifiers, which is exactly the case the
          Spring Boot Gradle plugin documents it for:
        </p>
        <CodeBlock language="text" title="Swapping which archive owns the plain name">
{`// build.gradle -- now a <dependency> on this module gets the LIBRARY jar
tasks.named("bootJar") {
    archiveClassifier = "boot"    // executable one takes the suffix
}
tasks.named("jar") {
    archiveClassifier = ""        // plain one takes the main coordinates
}`}
        </CodeBlock>
        <p>
          Disabling the <code>jar</code> task entirely is also possible and is the opposite of
          what you want here &mdash; and the plugin docs warn against it when building native
          images.
        </p>
      </InfoBox>

      <h2>Stage 2: Scanning Reads Bytes, Not Classes</h2>
      <p>
        Here is the step most people picture incorrectly. The intuitive model is that Spring
        loads every class in the scanned packages and calls{' '}
        <code>getAnnotation(Component.class)</code> on each. It does not, and it deliberately
        does not — loading a class runs its static initialisers, so scanning a package would
        execute arbitrary code belonging to classes you never intended to use.
      </p>
      <p>
        Instead <code>ClassPathScanningCandidateComponentProvider</code> opens each{' '}
        <code>.class</code> file as a <em>byte stream</em> and parses the annotation attribute
        out of it directly, using a copy of the ASM bytecode library that Spring bundles under
        its own package name so it cannot clash with yours:
      </p>

      <CodeBlock language="bash" title="Real output — it ships inside spring-core">
{`$ unzip -l spring-core-7.0.9.jar | grep -E "asm/ClassReader|SimpleMetadataReader"
    50843  org/springframework/asm/ClassReader.class
     3455  org/springframework/core/type/classreading/SimpleMetadataReader.class
     1846  org/springframework/core/type/classreading/SimpleMetadataReaderFactory.class`}
      </CodeBlock>

      <p>
        That is an implementation detail until you try to observe it, at which point it becomes
        a checkable claim. A <code>@Component</code> with a static initialiser that prints,
        marked <code>@Lazy</code> so that nothing instantiates it during startup:
      </p>

      <CodeBlock language="java" title="The probe">
{`@Lazy                 // so startup does not instantiate it
@Component
public class Watched {
    static { System.out.println("### STATIC INIT ran -- the class was LOADED"); }
    public Watched() { System.out.println("### CONSTRUCTOR ran -- INSTANTIATED"); }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Spring Boot 4.1.1, Java 26.0.1">
{`>>> STARTED OK. total beans = 153
>>> Watched is a registered bean definition? true
>>> --- scanning is OVER. Nothing above printed STATIC INIT. ---
>>> now asking for the bean:
### STATIC INIT ran -- the class was LOADED
### CONSTRUCTOR ran -- INSTANTIATED`}
      </CodeBlock>

      <InfoBox variant="success" title="What that transcript proves">
        <p>
          Read the first two lines together. Spring <em>definitely</em> found the class &mdash;
          it is a registered bean definition, and the bean count rose to include it. Yet the
          static initialiser had not run. A class whose static initialiser has not run has{' '}
          <strong>not been loaded</strong>. So Spring knew the class was annotated{' '}
          <code>@Component</code>, knew its name, and knew enough to register it, all without
          loading it.
        </p>
        <p>
          The only way to know an annotation without loading the class is to read the class
          file. This is the behaviour, not the documentation, confirming the mechanism.
        </p>
      </InfoBox>

      <h2>Stage 3: A BeanDefinition Is Not a Bean</h2>
      <p>
        What scanning produces is a <code>BeanDefinition</code>: a small metadata record saying
        &ldquo;there is a class named <code>com.acme.OrderService</code>, its scope is
        singleton, it is lazy or not, construct it like this&rdquo;. No instance exists.
        The container is at this point a map from bean <em>name</em> to <em>description</em>.
      </p>
      <p>
        This is why the collision in the previous lesson was a{' '}
        <code>ConflictingBeanDefinitionException</code> raised at scan time rather than
        anything to do with objects: two descriptions wanted the same key in that map, and the
        scanner refused to overwrite one with the other. Nothing had been constructed yet, and
        that is also exactly why{' '}
        <code>spring.main.allow-bean-definition-overriding</code> could not help &mdash; it
        governs a later registry operation the scanner never reaches.
      </p>

      <h2>Stage 4: Who Actually Reads Which Annotation</h2>
      <p>
        Annotations are not handled by one central switch statement. Each family is handled by
        a dedicated processor, and they fall into two phases with very different powers. These
        are the real processors present in the merged application from the previous lesson,
        printed out of the live context rather than recalled:
      </p>

      <CodeBlock language="text" title="Real output — Spring Boot 4.1.1">
{`>>> BFPP  ConfigurationClassPostProcessor
>>> BFPP  EventListenerMethodProcessor
>>> BFPP  PropertySourcesPlaceholderConfigurer
>>> BFPP  PreserveErrorControllerTargetClassPostProcessor

>>> BPP   AutowiredAnnotationBeanPostProcessor
>>> BPP   CommonAnnotationBeanPostProcessor
>>> BPP   ConfigurationPropertiesBindingPostProcessor
>>> BPP   WebServerFactoryCustomizerBeanPostProcessor
>>> BPP   InfrastructureAdvisorAutoProxyCreator`}
      </CodeBlock>

      <p>
        <strong>BeanFactoryPostProcessors (BFPP) run first and edit definitions.</strong> At
        this point they can add, remove and rewrite descriptions, because nothing is
        constructed:
      </p>
      <ul>
        <li>
          <code>ConfigurationClassPostProcessor</code> is the big one. It handles{' '}
          <code>@Configuration</code>, <code>@ComponentScan</code>, <code>@Import</code>,{' '}
          <code>@Bean</code> and all the <code>@Conditional</code> evaluation. Auto-configuration
          is this class reading entries from{' '}
          <code>META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports</code>.
          It is also what recursively processes an absorbed service&apos;s{' '}
          <code>@SpringBootApplication</code> class.
        </li>
        <li>
          <code>PropertySourcesPlaceholderConfigurer</code> resolves{' '}
          <code>${'{'}...{'}'}</code> placeholders in definitions.
        </li>
        <li>
          <code>EventListenerMethodProcessor</code> finds <code>@EventListener</code> methods.
        </li>
      </ul>

      <p>
        <strong>BeanPostProcessors (BPP) run per instance, after construction.</strong> They
        receive an actual object and may configure it or replace it with a proxy:
      </p>
      <ul>
        <li>
          <code>AutowiredAnnotationBeanPostProcessor</code> &mdash;{' '}
          <code>@Autowired</code>, <code>@Value</code>, and constructor selection.
        </li>
        <li>
          <code>CommonAnnotationBeanPostProcessor</code> &mdash; the JSR-250 annotations:{' '}
          <code>@PostConstruct</code>, <code>@PreDestroy</code>, <code>@Resource</code>.
        </li>
        <li>
          <code>ConfigurationPropertiesBindingPostProcessor</code> &mdash;{' '}
          <code>@ConfigurationProperties</code> binding.
        </li>
        <li>
          <code>InfrastructureAdvisorAutoProxyCreator</code> and its relatives &mdash; the
          proxies behind <code>@Transactional</code>, <code>@Cacheable</code>,{' '}
          <code>@Async</code> and your own aspects. <strong>This is the step that returns a
          different object than the one constructed.</strong>
        </li>
      </ul>

      <h2>Why That Split Explains Real Errors</h2>
      <p>
        The two phases are not trivia; the boundary between them is the cause of several
        failures that otherwise look arbitrary.
      </p>

      <InfoBox variant="danger" title="Four symptoms, one root cause">
        <ul>
          <li>
            <strong><code>@Value</code> or <code>@Autowired</code> is null inside a
            BeanFactoryPostProcessor.</strong> It has to be: injection is performed by a{' '}
            <code>BeanPostProcessor</code>, which runs in the <em>later</em> phase. A BFPP that
            needs configuration must read the <code>Environment</code> directly.
          </li>
          <li>
            <strong>Declaring a BFPP forces beans to be created early.</strong> A BFPP is
            itself a bean, so it must be constructed before the phase it participates in &mdash;
            dragging its dependencies up with it, ahead of post-processing. This is the usual
            source of &ldquo;is not eligible for getting processed by all
            BeanPostProcessors&rdquo; warnings, and why a BFPP should depend on as little as
            possible.
          </li>
          <li>
            <strong><code>@Transactional</code> does nothing when a method calls another
            method on <code>this</code>.</strong> The annotation works because the container
            handed everyone <em>else</em> a proxy. Inside the object, <code>this</code> is the
            raw instance, so the proxy is bypassed. Covered as the self-invocation trap in the
            DI lesson; the reason it exists is this stage.
          </li>
          <li>
            <strong><code>@PostConstruct</code> runs before dependent beans are fully
            ready.</strong> Ordering within the instance phase is per-bean, not global.
          </li>
        </ul>
      </InfoBox>

      <h2>What <code>@ComponentScan</code> Actually Does</h2>
      <p>
        With the pipeline in view, the answer to &ldquo;can one application pull in ten
        services&apos; beans with <code>scanBasePackages</code>?&rdquo; becomes precise. Yes
        &mdash; and the reason it works is almost disappointingly mundane:
      </p>

      <CodeBlock language="java" title="What the annotation is, mechanically">
{`@SpringBootApplication(scanBasePackages = { "com.example.a", "com.example.b" })
public class GiantApplication { }

// That list is just an argument to a directory walk. For each package:
//   1. turn "com.example.a" into the path "com/example/a"
//   2. find every .class file under it, on every classpath entry
//   3. ASM-read each file's annotation attribute
//   4. if it carries @Component (or anything meta-annotated with it --
//      @Service, @Repository, @Controller, @Configuration), register a
//      BeanDefinition
//
// There is no registry of services, no handshake, no discovery protocol.
// It is a filesystem-and-jar walk plus an attribute check.`}
      </CodeBlock>

      <p>
        Two consequences follow directly, and both are the kind of thing that only makes sense
        once you know it is a byte-level attribute scan:
      </p>

      <ul>
        <li>
          <strong>A stereotype annotation is found by meta-annotation, not by name.</strong>{' '}
          <code>@Service</code> is itself annotated <code>@Component</code>, so the scanner
          matches it without knowing the word &ldquo;Service&rdquo;. Your own annotation
          annotated <code>@Component</code> is discovered identically &mdash; provided you give
          it <code>@Retention(RetentionPolicy.RUNTIME)</code>, since the default{' '}
          <code>CLASS</code> retention leaves nothing for ASM to find.
        </li>
        <li>
          <strong>The scan cannot tell which service a class came from.</strong> A{' '}
          <code>BeanDefinition</code> records the class name, not the jar. This is why every
          remedy in the previous lesson keyed on the <em>package</em>: the package is the only
          durable marker of origin that survives into the merged container, which is what makes
          it serve as both the routing namespace and the documentation boundary.
        </li>
      </ul>

      <InfoBox variant="warning" title="And why the services' entry points are a landmine">
        <p>
          <code>ConfigurationClassPostProcessor</code> processes{' '}
          <code>@Configuration</code> classes <em>recursively</em>. An absorbed service&apos;s{' '}
          <code>@SpringBootApplication</code> class is a <code>@Configuration</code>, so when
          your scan registers it, that processor then honours its{' '}
          <code>@ComponentScan</code> and its <code>@EnableAutoConfiguration</code> too &mdash;
          a second application&apos;s entire configuration, imported because one class file
          happened to sit in a package you scanned.
        </p>
        <p>
          That is the complete explanation of the measured result in the previous lesson, where
          a <code>nameGenerator</code> on the wrapper&apos;s own{' '}
          <code>@ComponentScan</code> appeared to be ignored. It was not ignored: the duplicate
          bean was registered by the <em>service&apos;s</em> nested scan, which uses its own
          default generator and never saw your setting.
        </p>
      </InfoBox>

      <h2>Seeing It Yourself</h2>
      <p>
        All of this is inspectable in any application, and two flags answer most questions
        faster than reading code:
      </p>

      <CodeBlock language="text" title="The diagnostics worth knowing">
{`# Why is this bean here -- or why is it NOT here? Prints every
# @Conditional decision ConfigurationClassPostProcessor made:
--debug          (or logging.level.org.springframework.boot.autoconfigure=DEBUG)

# What definitions exist, and under what names:
ctx.getBeanDefinitionNames()

# Is this bean a proxy -- i.e. did a BeanPostProcessor replace it?
bean.getClass().getName()        // contains "$$SpringCGLIB$$" if so
AopUtils.isAopProxy(bean)

# Which annotations does the scanner actually see on a class?
new SimpleMetadataReaderFactory()
    .getMetadataReader("com.example.a.OrderService")
    .getAnnotationMetadata()
    .getAnnotationTypes()`}
      </CodeBlock>

      <p>
        That last one is the scanner&apos;s own entry point. If a class is not being picked up
        and you cannot see why, calling it directly separates the two possible causes
        immediately: either the annotation is not visible in the class file &mdash; wrong
        retention, or the class was never compiled where you think &mdash; or it is visible and
        the problem is your scan configuration.
      </p>

      <h2>The Shape to Remember</h2>
      <CodeBlock language="text" title="One sentence per stage">
{`javac        writes the annotation into the class file as a
             RuntimeVisibleAnnotations attribute

Gradle/Maven puts that class file on the classpath, as a plain jar
             (NOT a Boot fat jar, whose classes hide in BOOT-INF/classes)

scanning     ASM-reads the bytes without loading the class, and emits
             a BeanDefinition -- metadata, not an object

BFPPs        rewrite the set of definitions; @Configuration,
             @ComponentScan, @Bean, @Conditional all resolve here

instantiate  the container constructs objects from the final definitions

BPPs         inject into, configure, and sometimes PROXY each instance;
             @Autowired, @Value, @PostConstruct, @Transactional`}
      </CodeBlock>

      <p>
        Nothing in that list is unique to Spring. It is a build tool, a file format, a
        directory walk and two lists of callbacks &mdash; which is the useful thing to know,
        because every one of those stages is something you can inspect, print and verify when
        an annotation does not do what you expected.
      </p>
    </LessonLayout>
  );
}
