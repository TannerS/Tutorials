import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Classpath() {
  return (
    <LessonLayout
      title="Classes, Jars & the Classpath"
      sectionId="java"
      lessonIndex={15}
      prev={{ path: '/java/reflection', label: 'Reflection & Annotations' }}
      next={{ path: '/java/build-tools', label: 'Build Tools: Maven & Gradle' }}
    >
      <p>
        Every program in this section so far has been one file you could run with{' '}
        <code>java Thing.java</code>. A real Java application is a few hundred of your own
        classes plus eighty jars you did not write, and the question &ldquo;how does the JVM
        find a class?&rdquo; stops being academic the first time it cannot.
      </p>
      <p>
        This lesson answers it concretely, because the answer explains a whole family of
        errors that otherwise look like black magic:{' '}
        <code>ClassNotFoundException</code>, <code>NoClassDefFoundError</code>,{' '}
        <code>UnsupportedClassVersionError</code>, &ldquo;Could not find or load main
        class&rdquo;, two jars shipping the same config file and only one of them winning, and
        the whole category of bug that appears when a service that worked alone is packaged
        together with seven others. Every command and transcript below was run on{' '}
        java 26.0.1.
      </p>

      <h2>Step 1: <code>.java</code> Becomes <code>.class</code></h2>
      <p>
        <code>javac</code> reads source and writes bytecode: one <code>.class</code> file per
        class, named after the class rather than the file, plus extra ones for nested and
        anonymous classes. Bytecode is the instruction set the JVM executes — not machine code
        for your CPU, which is what the JIT produces later from this.
      </p>

      <CodeBlock language="bash" title="Two source files, compiled separately">
{`$ javac -d out/framework framework/com/acme/framework/AuditLogger.java
$ javac -cp out/framework -d out/orders orders/com/acme/orders/OrderService.java

$ find out -name '*.class' | sort
out/framework/com/acme/framework/AuditLogger.class
out/orders/com/acme/orders/OrderService.class`}
      </CodeBlock>

      <p>
        Note the second command: compiling <code>OrderService</code> needed{' '}
        <code>-cp out/framework</code>, because the source says{' '}
        <code>import com.acme.framework.AuditLogger</code> and the compiler has to find that
        type to check the call. <strong>The classpath is used at compile time and again,
        separately, at run time</strong> — and the fact that they are two different lists you
        can get wrong independently is the root of half this lesson.
      </p>
      <p>
        Notice also that the directory structure mirrors the package name. That is not a
        convention a tool imposes; it is how a class is located. Package{' '}
        <code>com.acme.framework</code>, class <code>AuditLogger</code> means the loader looks
        for the path <code>com/acme/framework/AuditLogger.class</code> under each classpath
        entry.
      </p>

      <h3>What is actually in a <code>.class</code> file</h3>
      <p>
        It is binary, but it is not opaque. Two tools make it readable, and both are in the
        JDK you already have:
      </p>

      <CodeBlock language="bash" title="javap — the signatures">
{`$ javap -cp out/framework com.acme.framework.AuditLogger
Compiled from "AuditLogger.java"
public class com.acme.framework.AuditLogger {
  public com.acme.framework.AuditLogger();
  public void log(java.lang.String);
}`}
      </CodeBlock>

      <p>
        That no-argument constructor was never written in the source — it is the default
        constructor, and here it is as a real method in the compiled output. This is also the
        fastest way to answer &ldquo;what version of this library is actually on my
        classpath&rdquo;: <code>javap</code> the class and read the signatures rather than
        guessing from the pom.
      </p>

      <CodeBlock language="bash" title="The first bytes, and the class file version">
{`$ od -A d -t x1 -N 16 out/framework/com/acme/framework/AuditLogger.class
0000000    ca  fe  ba  be  00  00  00  46  00  2d  0a  00  02  00  03  07

$ javap -v -cp out/framework com.acme.framework.AuditLogger | head -8
Classfile .../AuditLogger.class
  Last modified Oct 22, 2026; size 857 bytes
  SHA-256 checksum 2cc4db4646eb965cac4bb27171d12f65044e753c3664f60cc1c2cafe55d7e99c
  Compiled from "AuditLogger.java"
public class com.acme.framework.AuditLogger
  minor version: 0
  major version: 70
  flags: (0x0021) ACC_PUBLIC, ACC_SUPER`}
      </CodeBlock>

      <p>
        Every class file starts with the four bytes <code>ca fe ba be</code> — a magic number
        chosen as a joke in 1991 and frozen into the format forever. The next four are the
        version: <code>0x46</code> is 70 decimal, which is the <code>major version</code>{' '}
        javap reports.
      </p>

      <InfoBox variant="warning" title="Major version 70 is why UnsupportedClassVersionError happens">
        <p>
          Class file versions start at 45 for Java 1.1 and increment by one per release, so{' '}
          <strong>major version = Java version + 44</strong>. 70 means Java 26; 61 means Java
          17; 65 means Java 21.
        </p>
        <p>
          A JVM refuses to load a class file newer than itself — it cannot know what the new
          instructions mean. That is the entire content of this message, which is otherwise one
          of the most cryptic in Java:
        </p>
        <CodeBlock language="text" title="Reading the error">
{`UnsupportedClassVersionError: com/acme/Thing has been compiled by a more recent
version of the Java Runtime (class file version 70.0), this version of the Java
Runtime only recognizes class file versions up to 61.0`}
        </CodeBlock>
        <p>
          Translated: something compiled for Java 26 is being run on Java 17. It is a{' '}
          <em>runtime</em> mismatch, not a dependency problem, so the fix is on the{' '}
          <code>java</code> side (or in your build&apos;s <code>--release</code> target), not
          in the pom. The reverse direction is always fine: a newer JVM runs old class files,
          which is why Java libraries from 2008 still work.
        </p>
      </InfoBox>

      <h2>Step 2: <code>.class</code> Files Become a <code>.jar</code></h2>
      <p>
        Shipping a tree of loose <code>.class</code> files is impractical, so Java packages
        them. A jar is a <strong>zip file</strong> — not zip-like, literally zip — containing
        the compiled classes, any resources, and a manifest.
      </p>

      <CodeBlock language="bash" title="Create one, then look inside">
{`$ jar --create --file orders.jar -C out/orders .

$ jar tf orders.jar
META-INF/
META-INF/MANIFEST.MF
com/
com/acme/
com/acme/orders/
com/acme/orders/OrderService.class

$ unzip -l orders.jar
Archive:  orders.jar
  Length      Date    Time    Name
---------  ---------- -----   ----
        0  10-22-2026 18:54   META-INF/
       66  10-22-2026 18:54   META-INF/MANIFEST.MF
        0  10-22-2026 18:54   com/
        0  10-22-2026 18:54   com/acme/
        0  10-22-2026 18:54   com/acme/orders/
      445  10-22-2026 18:54   com/acme/orders/OrderService.class
---------                     -------
      511                     6 files`}
      </CodeBlock>

      <p>
        <code>unzip</code> read it without complaint, which is the proof: rename any jar
        to <code>.zip</code> and your file manager will open it. Inside, the directory
        structure is the package structure, exactly as it was on disk. A jar adds no magic —
        it is a directory of class files that travels as one file.
      </p>

      <InfoBox variant="note" title="If you are coming from Node">
        <p>
          The mapping is close enough to be useful:
        </p>
        <ul>
          <li>
            A <code>.class</code> file is one compiled module — the single transpiled{' '}
            <code>.js</code> file TypeScript emits for one <code>.ts</code> input.
          </li>
          <li>
            A <code>.jar</code> is the published package tarball: many compiled files plus
            metadata, versioned and depended on as a unit.
          </li>
          <li>
            The classpath is <code>node_modules</code> plus resolution — with one important
            difference covered in the next section.
          </li>
        </ul>
      </InfoBox>

      <h2>Step 3: The Classpath</h2>
      <p>
        The classpath is an <strong>ordered list of places to look for classes and
        resources</strong>. Entries are directories or jars, separated by <code>:</code> on
        macOS and Linux and <code>;</code> on Windows. When the JVM needs{' '}
        <code>com.acme.framework.AuditLogger</code>, it walks the list in order, checking each
        entry for <code>com/acme/framework/AuditLogger.class</code>, and uses the{' '}
        <strong>first</strong> one it finds.
      </p>

      <FlowChart
        title="Resolving one class name"
        chart={"graph LR\nA[Need com.acme.framework.AuditLogger] --> B[Translate to com/acme/framework/AuditLogger.class]\nB --> C[Entry 1: out/app]\nC -->|not here| D[Entry 2: framework.jar]\nD -->|found| E[Define the class, use it]\nD -->|not here either| F[ClassNotFoundException]"}
      />

      <CodeBlock language="bash" title="All three jars present">
{`$ javac -cp "framework.jar:orders.jar" -d out/app app/Main.java
$ java -cp "out/app:framework.jar:orders.jar" Main
AUDIT: orders listed`}
      </CodeBlock>

      <p>
        Three entries: the directory holding <code>Main.class</code>, and the two jars its code
        reaches into. Now remove one and watch what the JVM says.
      </p>

      <CodeBlock language="bash" title="framework.jar left off the run classpath">
{`$ java -cp "out/app:orders.jar" Main
Exception in thread "main" java.lang.NoClassDefFoundError: com/acme/framework/AuditLogger
	at com.acme.orders.OrderService.<init>(OrderService.java:4)
	at Main.main(Main.java:4)
Caused by: java.lang.ClassNotFoundException: com.acme.framework.AuditLogger
	at java.base/jdk.internal.loader.BuiltinClassLoader.loadClass(BuiltinClassLoader.java:580)
	at java.base/java.lang.ClassLoader.loadClass(ClassLoader.java:502)
	... 2 more`}
      </CodeBlock>

      <p>
        It compiled fine and failed at run time, because the two classpaths are separate lists.
        And notice that the <em>same single mistake</em> produced both of the errors people
        treat as unrelated, nested one inside the other. That is the clearest possible
        statement of how they differ.
      </p>

      <InfoBox variant="info" title="ClassNotFoundException vs NoClassDefFoundError">
        <p>
          <strong><code>ClassNotFoundException</code></strong> is a checked{' '}
          <em>exception</em>: someone asked for a class <em>by name</em> and it was not on the
          classpath. It is the lower-level fact — the loader looked and did not find it. You
          get it directly when your own code does the asking:
        </p>
        <CodeBlock language="bash" title="Class.forName, with and without the jar">
{`$ java -cp "out/app:framework.jar" Forname
loaded com.acme.framework.AuditLogger from jdk.internal.loader.ClassLoaders$AppClassLoader@41e986c9

$ java -cp "out/app" Forname
ClassNotFoundException: com.acme.framework.AuditLogger`}
        </CodeBlock>
        <p>
          <strong><code>NoClassDefFoundError</code></strong> is an <em>Error</em>: the JVM
          needed a class to execute code that was <strong>successfully compiled against
          it</strong>, and could not produce it. It means &ldquo;this worked when it was
          built&rdquo;, which is why it almost always points at a packaging or deployment
          difference rather than at your source.
        </p>
        <p>
          One trap worth knowing: <code>NoClassDefFoundError</code> is also what you get on
          every attempt <em>after the first</em> when a class&apos;s static initialiser threw.
          The first attempt reports <code>ExceptionInInitializerError</code> with the real
          cause; the class is then marked unusable, and later attempts report only{' '}
          <code>NoClassDefFoundError</code> with no hint of why. If you see one on a class that
          is obviously present, go looking in the logs for the earlier{' '}
          <code>ExceptionInInitializerError</code> — that is where the actual bug is.
        </p>
      </InfoBox>

      <CodeBlock language="bash" title="And the one you meet on day one">
{`$ java -cp "framework.jar" Main
Error: Could not find or load main class Main
Caused by: java.lang.ClassNotFoundException: Main`}
      </CodeBlock>

      <p>
        Same mechanism, friendlier wording: the launcher could not find the class you named.
        In practice this is nearly always a wrong or missing <code>-cp</code>, a typo in the
        fully-qualified name, or a class sitting in a package whose directory structure does
        not match.
      </p>

      <h3>Practicalities</h3>
      <CodeBlock language="bash" title="Ways the classpath gets set">
{`# Explicit, ordered. -cp and -classpath are the same flag.
java -cp "out:lib/a.jar:lib/b.jar" com.acme.Main

# Wildcard: every .jar in that directory, in unspecified order. The * is
# expanded by the JVM, so quote it or the shell will eat it first.
java -cp "out:lib/*" com.acme.Main

# An executable jar: the classpath comes from Main-Class and Class-Path
# entries in META-INF/MANIFEST.MF. Note that -jar IGNORES -cp entirely,
# which surprises everyone once.
java -jar app.jar

# The CLASSPATH environment variable also works and is a bad idea: it applies
# to every java process on the machine, invisibly. Prefer -cp always.
export CLASSPATH=/some/path`}
      </CodeBlock>

      <p>
        You will rarely type any of this. The build tool computes the list from your declared
        dependencies, which is the subject of the next lesson — but it is the same list, and
        the same first-match-wins rule, however it gets built.
      </p>

      <h2>The Classpath Carries Resources Too, and They Collide</h2>
      <p>
        Jars hold more than classes. Anything on the classpath can be read as a resource by
        path, and this is how configuration, SQL files, templates and migrations travel:
      </p>

      <CodeBlock language="java" title="Reading a resource">
{`// Leading slash = absolute from the classpath root.
try (InputStream in = getClass().getResourceAsStream("/application.yml")) { ... }

// From the loader: never a leading slash, always absolute.
ClassLoader cl = getClass().getClassLoader();
try (InputStream in = cl.getResourceAsStream("application.yml")) { ... }`}
      </CodeBlock>

      <p>
        Here is where the ordered-list rule stops being trivia. Two jars, each containing its
        own <code>application.yml</code> at the root — exactly what you get when two Spring
        Boot services are packaged into one application:
      </p>

      <CodeBlock language="java" title="Shadow.java">
{`ClassLoader cl = Shadow.class.getClassLoader();

// What almost all code does: ask for THE resource.
try (InputStream in = cl.getResourceAsStream("application.yml")) {
    System.out.println("getResourceAsStream() returned:");
    new BufferedReader(new InputStreamReader(in)).lines()
        .forEach(l -> System.out.println("    " + l));
}

// What is actually out there.
System.out.println("getResources() finds");
Enumeration<URL> all = cl.getResources("application.yml");
int n = 0;
while (all.hasMoreElements()) {
    System.out.println("    [" + (++n) + "] " + all.nextElement());
}
System.out.println("  -> " + n + " copies on the classpath, 1 of them won");`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — same two jars, classpath order swapped">
{`$ java -cp "out/app:ordersconf.jar:usersconf.jar" Shadow
getResourceAsStream() returned:
    service: orders
    port: 8081
getResources() finds
    [1] .../cp/ordersconf.jar!/application.yml
    [2] .../cp/usersconf.jar!/application.yml
  -> 2 copies on the classpath, 1 of them won

$ java -cp "out/app:usersconf.jar:ordersconf.jar" Shadow
getResourceAsStream() returned:
    service: users
    port: 8082
getResources() finds
    [1] .../cp/usersconf.jar!/application.yml
    [2] .../cp/ordersconf.jar!/application.yml
  -> 2 copies on the classpath, 1 of them won`}
      </CodeBlock>

      <p>
        Read those two transcripts side by side. <strong>Nothing changed but the order of two
        jars, and the application loaded a different configuration.</strong> No warning, no
        error, no mention anywhere that a second copy existed. The singular{' '}
        <code>getResourceAsStream</code> returns the first match and silently discards the
        rest; only the plural <code>getResources</code> admits that there were two.
      </p>

      <InfoBox variant="danger" title="This is the mechanism behind &ldquo;works standalone, breaks when packaged together&rdquo;">
        <p>
          A service that reads its own <code>application.yml</code> works perfectly when it is
          the only jar on the classpath. Package it alongside seven sibling services that each
          have a file of the same name, and six of those files vanish — whichever jar the build
          tool happens to order first wins, and that order can change when someone adds an
          unrelated dependency.
        </p>
        <p>
          The symptom is a service reading another service&apos;s port, datasource or feature
          flags, with nothing in the logs to explain it. Three things avoid it:
        </p>
        <ul>
          <li>
            <strong>Give every file a unique name.</strong> <code>orders-service.yml</code>,
            not <code>application.yml</code>. Uniqueness across the whole classpath, not within
            your own repository, is the requirement.
          </li>
          <li>
            <strong>Or namespace by directory:</strong>{' '}
            <code>config/orders/application.yml</code>. The classpath path is what has to be
            unique, not the file name alone.
          </li>
          <li>
            <strong>Or merge deliberately.</strong> Spring Boot can import several files
            explicitly with <code>spring.config.import</code>, which is a decision you can read
            in a diff, unlike classpath ordering.
          </li>
        </ul>
        <p>
          And when you suspect it is happening, the diagnosis is the plural method above:{' '}
          <code>getResources("...")</code> and print every URL. It names the jars.
        </p>
      </InfoBox>

      <h2>Duplicate Classes, and Why the Order Matters There Too</h2>
      <p>
        The same first-match-wins rule applies to classes, and the consequences are stranger
        because there is no error at all. If two jars contain{' '}
        <code>com.acme.util.Strings</code>, you get the one from whichever jar comes first and
        the other is invisible. This is what people mean by <em>jar hell</em>: it most often
        happens when a library is pulled in twice at different versions, or shipped both
        standalone and bundled inside something else.
      </p>
      <p>
        The giveaway is a <code>NoSuchMethodError</code> or{' '}
        <code>NoSuchFieldError</code> on a class that plainly has that method in the source you
        are reading — you compiled against version 2 and the JVM loaded version 1. Build tools
        have purpose-built commands for this (<code>mvn dependency:tree</code>,{' '}
        <code>gradle dependencies</code>), and that is the next lesson.
      </p>

      <h3>Class loaders, in one paragraph</h3>
      <p>
        &ldquo;The classpath&rdquo; is strictly the search path of one loader. A JVM has
        several arranged in a chain, and each delegates upward before looking in its own path:
        the <strong>bootstrap</strong> loader has the core JDK classes, the{' '}
        <strong>platform</strong> loader has the rest of the JDK, and the{' '}
        <strong>application</strong> loader is the one your <code>-cp</code> configures. The{' '}
        <code>Forname</code> output above named it:{' '}
        <code>ClassLoaders$AppClassLoader</code>.
      </p>
      <p>
        Parent-first delegation is why you cannot shadow a JDK class by putting your own{' '}
        <code>java.lang.String</code> on the classpath — the bootstrap loader is asked first
        and always answers. It also explains one baffling error worth recognising: a class&apos;s
        identity is its name <em>plus its loader</em>, so if two loaders each define{' '}
        <code>com.acme.Thing</code>, those are two different types, and you get{' '}
        <code>ClassCastException: class com.acme.Thing cannot be cast to class
        com.acme.Thing</code>. Reading that twice does not help; the cause is always two
        loaders, and it shows up in app servers, plugin systems and hot-reloading frameworks
        rather than in ordinary applications. The{' '}
        <a href="/java/reflection">Reflection &amp; Annotations</a> lesson works with{' '}
        <code>Class</code> objects directly, and{' '}
        <a href="/java/jvm-internals">JVM Internals</a> covers where their metadata lives.
      </p>

      <h2>Fat Jars, and Why Spring Boot Needs a Trick</h2>
      <p>
        A plain executable jar cannot contain other jars — the class loader has no concept of a
        jar inside a jar. But shipping one file is exactly what you want for a container
        image, so there are two solutions, and the difference shows up in a stack trace:
      </p>
      <ul>
        <li>
          <strong>Shading / uber-jar</strong> (Maven Shade, Gradle Shadow): unpack every
          dependency and write all the class files into one flat jar. Simple, and lossy —
          duplicate resources across dependencies collide exactly as above, so plugins need
          explicit merge rules for things like <code>META-INF/services</code> entries.
        </li>
        <li>
          <strong>Nested jars</strong> (Spring Boot&apos;s approach): keep the dependency jars
          whole, in <code>BOOT-INF/lib/</code>, and ship a custom loader that can read them in
          place. That is why a Boot jar&apos;s <code>Main-Class</code> is a launcher rather
          than your own class, and why your code lives under <code>BOOT-INF/classes/</code>{' '}
          instead of at the root. Run <code>jar tf</code> on any Spring Boot jar and the
          layout is right there.
        </li>
      </ul>
      <p>
        There is also a newer, stricter model that replaces the classpath entirely — the module
        path, where dependencies declare what they export and the JVM refuses to start on a
        missing or duplicated module instead of failing later. That is covered in the{' '}
        <a href="/java/advanced">Advanced Java Features</a> lesson, and it is worth knowing
        exists even though most application code is still on the classpath.
      </p>

      <h2>How One Application Runs Eight Services' Code</h2>
      <p>
        Everything above adds up to an answer for a pattern you will meet in real systems and
        which looks like magic until you have read this lesson. A team has eight Spring Boot
        microservices plus a shared framework library, and <em>also</em> runs all of them as a
        single deployed application. There is no clustering and no inter-service coordination
        involved. The mechanism is only this:
      </p>

      <FlowChart
        title="Eight services, one process"
        chart={"graph TD\nA[orders.jar] --> CP[One classpath]\nB[users.jar] --> CP\nC[billing.jar] --> CP\nD[framework.jar] --> CP\nCP --> M[Wrapper's single main method]\nM --> S[Component scan over all those packages]\nS --> X[One container, one set of shared singletons, one HTTP port]"}
      />

      <ol>
        <li>
          Each service is built as an ordinary library jar. Its{' '}
          <code>@RestController</code> and <code>@Service</code> classes are just compiled
          classes in that jar.
        </li>
        <li>
          A small wrapper project declares all eight as dependencies, so every class is on{' '}
          <strong>one classpath</strong> in <strong>one JVM</strong>.
        </li>
        <li>
          The wrapper has the only <code>main</code> that runs. Each service&apos;s own{' '}
          <code>main</code> is still sitting in its jar, never called — an unused method in a
          library.
        </li>
        <li>
          Spring scans the packages, finds the annotated classes, and registers them all in a
          single container, where a shared bean really is one object injected into all eight
          services&apos; code.
        </li>
      </ol>
      <p>
        Nothing is copied, and nothing is &ldquo;merged&rdquo;: declaring a dependency puts
        that jar&apos;s classes on the classpath, and from there they are as reachable as code
        you wrote yourself. It is the same thing as importing eight Express routers into one{' '}
        <code>index.js</code> and calling <code>listen</code> once, except that the wiring is
        done by annotation scanning rather than by hand.
      </p>
      <p>
        The failure modes are the ones this lesson predicts — duplicate resources shadowing
        each other, two jars defining the same class — plus a set that are specific to the
        Spring container: two services naming a bean the same thing, two controllers mapping
        the same route, and configuration from eight sources landing in one environment. Those
        are worked through, with the wrapper&apos;s code, in the{' '}
        <strong>Many Services, One App</strong> lesson in the Spring Boot section.
      </p>

      <h2>The Error Table</h2>
      <CodeBlock language="text" title="Symptom to cause">
{`Could not find or load main class X
    The launcher cannot find X. Wrong -cp, wrong name, or the package
    directories do not match the declared package.

ClassNotFoundException: a.b.C
    Something asked for a.b.C by name and no classpath entry had it.
    Usually a missing dependency, or reflection naming an optional class.

NoClassDefFoundError: a/b/C
    Compiled against a.b.C, cannot find it now. A packaging or deployment
    difference between build and run -- OR a static initialiser that threw
    earlier; look for ExceptionInInitializerError further up the log.

UnsupportedClassVersionError (class file version 70.0)
    Built for a newer Java than the JVM running it. 70 = Java 26,
    65 = Java 21, 61 = Java 17. Fix the runtime or the --release target.

NoSuchMethodError / NoSuchFieldError
    The class was found but is the wrong version. Two copies of a library
    on the classpath, and the first one won. Check the dependency tree.

ClassCastException: a.b.C cannot be cast to a.b.C
    Two class loaders each defined a.b.C. Not a classpath ordering issue -
    a loader-isolation issue.

Config/resource read with unexpected values
    Two jars contain the same resource path. Print getResources("...") to
    see every copy and which jar it came from.`}
      </CodeBlock>

      <h2>Where This Leads</h2>
      <p>
        You now know what the classpath is, what goes on it, and what the JVM does when
        something is missing, duplicated or too new. What you would not want to do is maintain
        that list by hand for eighty jars, each of which has dependencies of its own.
      </p>
      <p>
        That is precisely the job of the next lesson.{' '}
        <strong><a href="/java/build-tools">Build Tools: Maven &amp; Gradle</a></strong>{' '}
        is about the machinery that resolves your declared dependencies — transitively, picking
        one version when two libraries disagree — and hands the resulting classpath to{' '}
        <code>javac</code> and <code>java</code>. Every concept there, from dependency scopes
        to <code>mvn dependency:tree</code>, is a way of controlling the ordered list you have
        just been looking at by hand.
      </p>
    </LessonLayout>
  );
}
