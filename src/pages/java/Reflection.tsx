import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function Reflection() {
  return (
    <LessonLayout
      title="Reflection & Annotations"
      sectionId="java"
      lessonIndex={12}
      prev={{ path: '/java/jvm-internals', label: 'JVM Internals & Garbage Collection' }}
      next={{ path: '/java/build-tools', label: 'Build Tools: Maven & Gradle' }}
    >
      <p>
        Reflection is the API that lets running Java code inspect and manipulate classes, fields,
        methods, and constructors it did not know about at compile time — including ones marked{' '}
        <code>private</code>. Every dependency-injection container, every JSON library, and every
        test runner you have ever used depends on it. It also has a genuinely sharp edge that trips
        up developers who learned Java before version 9: the module system introduced{' '}
        <strong>strong encapsulation</strong>, and reflection that used to just work can now throw at
        runtime. Every example on this page was compiled and run on a real, currently installed JDK
        26 — including the exception, pasted verbatim, from the module-system gotcha.
      </p>

      <h2><code>Class&lt;?&gt;</code>: Where Reflection Starts</h2>

      <p>
        Every object carries a reference to a <code>Class</code> object describing its runtime type —
        that is what <code>getClass()</code> returns. But <code>getClass()</code> has a hard
        requirement: you need a live <em>instance</em> to call it on. <code>Class.forName(String)</code>{' '}
        has no such requirement — hand it a fully-qualified class name as a string, sourced from
        anywhere (a config file, a plugin manifest, user input), and it loads that class, running its
        static initializer, without you ever having written a compile-time reference to it anywhere
        else in your program. That is the real distinction, not a cosmetic one: <code>forName</code>{' '}
        can reach a class your code never otherwise mentions.
      </p>

      <CodeBlock language="java" title="ClassBasics.java — run on JDK 26">
{`static class NeverReferencedDirectly {
    static { System.out.println("NeverReferencedDirectly: static initializer ran"); }
    void hello() { System.out.println("hello from NeverReferencedDirectly"); }
}

public static void main(String[] args) throws Exception {
    // getClass() -- needs a live instance
    List<String> list = new ArrayList<>();
    Class<?> c1 = list.getClass();
    System.out.println("getClass() on an ArrayList instance -> " + c1.getName());

    // Class.forName() -- works from a STRING, no instance required
    Class<?> c2 = Class.forName("java.util.ArrayList");
    System.out.println("Class.forName(\\"java.util.ArrayList\\") -> " + c2.getName());
    System.out.println("c1 == c2 ? " + (c1 == c2));

    // The real difference: forName loads a class named only as a STRING at
    // runtime, with no source-code reference to it anywhere else in this file.
    String className = "ClassBasics$NeverReferencedDirectly";
    Class<?> dynamic = Class.forName(className);
    System.out.println("Loaded: " + dynamic.getName());

    Object instance = dynamic.getDeclaredConstructor().newInstance();
    System.out.println("getClass() on the resulting instance -> " + instance.getClass().getName());
}

// Output:
//   getClass() on an ArrayList instance -> java.util.ArrayList
//   Class.forName("java.util.ArrayList") -> java.util.ArrayList
//   c1 == c2 ? true
//   NeverReferencedDirectly: static initializer ran
//   Loaded: ClassBasics$NeverReferencedDirectly
//   getClass() on the resulting instance -> ClassBasics$NeverReferencedDirectly`}
      </CodeBlock>

      <p>
        Two details worth calling out in that output. First, <code>c1 == c2</code> is{' '}
        <code>true</code> — the JVM caches exactly one <code>Class</code> object per (class loader,
        fully-qualified name) pair, so <code>getClass()</code> and <code>Class.forName()</code> for
        the same class always return the identical object, not just an equal one. Second, the static
        initializer ran <em>before</em> <code>forName</code> returned — the single-argument{' '}
        <code>Class.forName(String)</code> is documented to initialize the class by default (there is
        a three-argument overload, <code>forName(name, initialize, classLoader)</code>, that lets you
        opt out). This is exactly how a plugin system or a JDBC driver-loading mechanism works: a
        string naming a class you never <code>import</code>, resolved and initialized purely at
        runtime.
      </p>

      <h2>Reading and Writing What&#39;s Private</h2>

      <p>
        <code>getDeclaredMethod</code>/<code>getDeclaredField</code> return a class&#39;s own members —{' '}
        <code>private</code> included — regardless of access modifier; the non-<code>Declared</code>{' '}
        variants (<code>getMethod</code>/<code>getField</code>) return only <em>public</em> members,
        inherited ones included. Getting a <code>Field</code> or <code>Method</code> object back does
        not mean you can use it yet, though — the JVM still enforces the same access rules reflection
        would otherwise let you route around. <code>setAccessible(true)</code> is the call that lifts
        that check, and <code>canAccess(Object)</code> (the modern replacement for the older,
        deprecated <code>isAccessible()</code>) lets you ask first instead of catching an exception.
      </p>

      <p>
        Below, <code>PrivateAccess</code> and <code>Account</code> are two separate top-level
        classes in two separate files — that matters, because nested classes in the{' '}
        <em>same</em> top-level class are treated as nestmates since Java 11 and can already see each
        other&#39;s private members without reflection at all, which would make this demo prove
        nothing. With genuinely separate classes, the JVM&#39;s normal access rules apply, and the
        program below constructs an object through a private constructor, then reads, writes, and
        invokes a private field and a private method reflectively — first showing the real failure
        without <code>setAccessible</code>, then showing it succeed with it:
      </p>

      <CodeBlock language="java" title="Account.java + PrivateAccess.java — run on JDK 26">
{`// Account.java — a separate top-level class, not nested in PrivateAccess
public class Account {
    private String owner;
    private double balance = 100.0;

    private Account(String owner) { this.owner = owner; }

    private double applyInterest(double rate) {
        balance += balance * rate;
        return balance;
    }

    @Override
    public String toString() {
        return "Account{owner=" + owner + ", balance=" + balance + "}";
    }
}

// PrivateAccess.java
Class<Account> clazz = Account.class;
var ctor = clazz.getDeclaredConstructor(String.class);

System.out.println("Constructor accessible before setAccessible(true)? " + ctor.canAccess(null));
try {
    ctor.newInstance("Ada");
} catch (IllegalAccessException e) {
    System.out.println("Got expected IllegalAccessException: " + e.getMessage());
}

ctor.setAccessible(true);
Account acct = ctor.newInstance("Ada");
System.out.println("Constructed via private constructor: " + acct);

Field balanceField = clazz.getDeclaredField("balance");
System.out.println("Field accessible before setAccessible(true)? " + balanceField.canAccess(acct));
try {
    balanceField.get(acct);
} catch (IllegalAccessException e) {
    System.out.println("Got expected IllegalAccessException: " + e.getMessage());
}

balanceField.setAccessible(true);
System.out.println("Read private field 'balance' via reflection: " + balanceField.get(acct));
balanceField.set(acct, 9999.0);
System.out.println("Wrote private field 'balance' via reflection -> " + acct);

Method interestMethod = clazz.getDeclaredMethod("applyInterest", double.class);
interestMethod.setAccessible(true);
Object result = interestMethod.invoke(acct, 0.05);
System.out.println("Invoked private method applyInterest(0.05) -> returned " + result);

// Output:
//   Constructor accessible before setAccessible(true)? false
//   Got expected IllegalAccessException: class PrivateAccess cannot access
//     a member of class Account with modifiers "private"
//   Constructed via private constructor: Account{owner=Ada, balance=100.0}
//   Field accessible before setAccessible(true)? false
//   Got expected IllegalAccessException: class PrivateAccess cannot access
//     a member of class Account with modifiers "private"
//   Read private field 'balance' via reflection: 100.0
//   Wrote private field 'balance' via reflection -> Account{owner=Ada, balance=9999.0}
//   Invoked private method applyInterest(0.05) -> returned 10498.95`}
      </CodeBlock>

      <p>
        That is the real mechanism, proven end to end: a private constructor, a private field read
        and mutated, and a private method invoked, all from outside the class, all gated by a single{' '}
        <code>setAccessible(true)</code> call.
      </p>

      <h2>The Module System Changed The Rules</h2>

      <InfoBox variant="warning" title="Strong Encapsulation Since Java 9">
        <p>
          Everything above worked with no special flags because <code>PrivateAccess</code> and{' '}
          <code>Account</code> both live in the JVM&#39;s <strong>unnamed module</strong> (plain
          classpath code, which is still how most application code runs). The Java Platform Module
          System, introduced in Java 9, adds a second, independent layer of access control on top of{' '}
          <code>public</code>/<code>private</code>: a named module must explicitly{' '}
          <code>opens</code> a package before reflection from outside that module is allowed to call{' '}
          <code>setAccessible(true)</code> on anything in it — <code>exports</code> alone is not
          enough, because <code>exports</code> only grants normal compile-time access to public
          types, not reflective access to their internals. The JDK&#39;s own modules, including{' '}
          <code>java.base</code>, do <em>not</em> open their internal packages by default. This is the
          single most common &quot;reflection just stopped working&quot; moment for anyone who learned
          Java before 9, and it specifically bites code that reflects into <em>JDK internals</em> or
          another strongly-encapsulated named module — not your own application classes on the
          classpath, which behave exactly as shown above.
        </p>
      </InfoBox>

      <p>
        Reproduced directly: <code>java.lang.String</code> has a private internal field,{' '}
        <code>value</code>, holding its backing byte array. <code>java.lang</code> is part of the{' '}
        <code>java.base</code> module, which does not open itself to arbitrary reflection. Getting the{' '}
        <code>Field</code> object works fine — that part is just metadata lookup — but{' '}
        <code>setAccessible(true)</code> is where it throws:
      </p>

      <CodeBlock language="java" title="JpmsDemo.java — run WITHOUT --add-opens">
{`Field valueField = String.class.getDeclaredField("value");
System.out.println("Got the Field object fine: " + valueField);
valueField.setAccessible(true); // <-- throws here
System.out.println("unreachable");

// Real output (JDK 26, no flags):
//
// Got the Field object fine: private final byte[] java.lang.String.value
// Exception in thread "main" java.lang.reflect.InaccessibleObjectException:
//   Unable to make field private final byte[] java.lang.String.value
//   accessible: module java.base does not "opens java.lang" to unnamed module @1dbd16a6
//     at java.base/java.lang.reflect.AccessibleObject.throwInaccessibleObjectException(AccessibleObject.java:343)
//     at java.base/java.lang.reflect.AccessibleObject.checkCanSetAccessible(AccessibleObject.java:319)
//     at java.base/java.lang.reflect.AccessibleObject.checkCanSetAccessible(AccessibleObject.java:267)
//     at java.base/java.lang.reflect.Field.checkCanSetAccessible(Field.java:207)
//     at java.base/java.lang.reflect.Field.setAccessible(Field.java:201)
//     at JpmsDemo.main(JpmsDemo.java:11)`}
      </CodeBlock>

      <p>
        That exception is real, unedited output — not a paraphrase. The fix is the{' '}
        <code>--add-opens</code> JVM flag, in the form{' '}
        <code>--add-opens &lt;module&gt;/&lt;package&gt;=&lt;target-module&gt;</code>, where the
        target is the module doing the reflecting (<code>ALL-UNNAMED</code> for plain classpath code).
        Same program, same class, only the launch command changes:
      </p>

      <CodeBlock language="java" title="JpmsDemo.java — run WITH --add-opens java.base/java.lang=ALL-UNNAMED">
{`// $ java --add-opens java.base/java.lang=ALL-UNNAMED JpmsDemo

// Output:
//   Got the Field object fine: private final byte[] java.lang.String.value
//   setAccessible(true) succeeded (only happens with --add-opens)
//   Read String's internal value field: [B@3764951d`}
      </CodeBlock>

      <p>
        Same class, same field, same call — the only variable is whether the launching command opened{' '}
        <code>java.lang</code> to reflection. This is exactly the failure mode that surfaced in the
        real world as Mockito, older versions of Lombok, and various serialization libraries breaking
        the moment users upgraded from Java 8 to Java 9+ — they reflected into JDK internals that used
        to be reachable and suddenly were not. Spring Boot, JUnit, and Jackson reflecting into{' '}
        <em>your own</em> application classes never hit this, because your classes are not a
        strongly-encapsulated named module unless you deliberately built a{' '}
        <code>module-info.java</code> that closes them off.
      </p>

      <h2>Where This Actually Shows Up</h2>

      <p>
        This is not an academic API. Three tools you use constantly are built directly on the
        mechanism demonstrated above:
      </p>

      <ul>
        <li>
          <strong>Spring&#39;s IoC container</strong> constructs beans and wires their dependencies
          using exactly <code>Constructor.newInstance</code> and <code>Field.set</code> /{' '}
          <code>Method.invoke</code> — the same calls used on <code>Account</code> above, just
          orchestrated across your whole application context instead of one object.
        </li>
        <li>
          <strong>Jackson</strong>&#39;s default <code>ObjectMapper</code> reflects over a POJO&#39;s
          fields and accessor methods to decide how to serialize it to JSON and deserialize JSON back
          into it, which is why a getter/setter or field rename silently changes your JSON shape
          unless an annotation pins the name.
        </li>
        <li>
          <strong>JUnit</strong> discovers every <code>@Test</code>-annotated method in a test class
          via reflection and invokes each one via reflection — there is no other way for the runner to
          know which methods exist and call them without you registering them by hand.
        </li>
      </ul>

      <p>
        This site&#39;s Spring Boot dependency-injection lesson covers constructor and field injection
        from the container&#39;s point of view; reflection — specifically the{' '}
        <code>Constructor.newInstance</code> and <code>Field.set</code> calls proven above — is the
        actual mechanism running underneath that API.
      </p>

      <InfoBox variant="info" title="Reflection Is Slower — Measured, Not Just Asserted">
        <p>
          That reflective calls cost more than direct ones is well-established and mostly comes down
          to one thing: the JIT compiler can inline and aggressively optimize a direct call site once
          it is hot, but <code>Method.invoke</code> goes through an extra layer of argument boxing and
          indirection that resists the same optimizations. To put a real number on it rather than just
          citing the claim, a tight loop calling a trivial <code>static int add(int, int)</code> 50
          million times, after JIT warmup, measured on this machine (JDK 26):
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <code>Direct call: ~0.27&ndash;0.28 ns/call &nbsp;|&nbsp; Reflective call (Method.invoke):
          ~4.6&ndash;5.85 ns/call &nbsp;|&nbsp; roughly 17&ndash;20x slower</code>
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Take the exact multiplier with a grain of salt — it moves with JDK version, JIT warmup, and
          hardware, and back-to-back runs on the same machine varied by a few nanoseconds per call in
          this test. The order of magnitude, not the precise number, is the durable finding: reflection
          is genuinely slower per call, which is irrelevant for a DI container doing it a few hundred
          times at startup and can matter a great deal in a per-request hot path. It is also why
          performance-sensitive libraries increasingly reach for lower-level alternatives like{' '}
          <code>java.lang.invoke.MethodHandle</code> or generated bytecode accessors instead of raw{' '}
          <code>Method.invoke</code> on their hottest paths.
        </p>
      </InfoBox>

      <h2>Annotations: Visible at Runtime Only If You Ask For That</h2>

      <p>
        An annotation&#39;s <code>@Retention</code> controls how long the compiler and JVM keep its
        data around, and this directly gates whether reflection can see it at all:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Retention</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Survives to</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Visible via <code>getAnnotations()</code>?</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>SOURCE</code></td>
            <td style={{ padding: '0.75rem' }}>Discarded by the compiler (e.g. <code>@Override</code>)</td>
            <td style={{ padding: '0.75rem' }}>No</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>CLASS</code> (default if <code>@Retention</code> is omitted)</td>
            <td style={{ padding: '0.75rem' }}>Kept in the <code>.class</code> bytecode, not loaded by the JVM at runtime</td>
            <td style={{ padding: '0.75rem' }}>No</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>RUNTIME</code></td>
            <td style={{ padding: '0.75rem' }}>Loaded into the JVM and kept on the <code>Class</code>/<code>Method</code>/<code>Field</code> object</td>
            <td style={{ padding: '0.75rem' }}><strong>Yes</strong></td>
          </tr>
        </tbody>
      </table>

      <p>
        Proven with two custom annotations on the same method, one of each retention that matters —
        only the <code>RUNTIME</code>-retained one shows up:
      </p>

      <CodeBlock language="java" title="RetentionDemo.java — run on JDK 26">
{`@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface VisibleAtRuntime { String value(); }

@Retention(RetentionPolicy.CLASS) // the default if you omit @Retention entirely
@Target(ElementType.METHOD)
@interface CompiledOnly { String value(); }

static class Target1 {
    @VisibleAtRuntime("kept-for-reflection")
    @CompiledOnly("stripped-before-runtime")
    void doWork() {}
}

public static void main(String[] args) throws Exception {
    Method m = Target1.class.getDeclaredMethod("doWork");

    System.out.println("All annotations getAnnotations() finds at runtime:");
    for (var a : m.getAnnotations()) {
        System.out.println("  " + a);
    }

    System.out.println("Probing @VisibleAtRuntime (RUNTIME): " + m.getAnnotation(VisibleAtRuntime.class));
    System.out.println("Probing @CompiledOnly (CLASS):       " + m.getAnnotation(CompiledOnly.class));
}

// Output:
//   All annotations getAnnotations() finds at runtime:
//     @RetentionDemo.VisibleAtRuntime("kept-for-reflection")
//   Probing @VisibleAtRuntime (RUNTIME): @RetentionDemo.VisibleAtRuntime("kept-for-reflection")
//   Probing @CompiledOnly (CLASS):       null`}
      </CodeBlock>

      <p>
        <code>@CompiledOnly</code> is not missing by accident — the compiler wrote it into the{' '}
        <code>.class</code> file (tools like bytecode viewers can still see it), but the JVM never
        loads <code>CLASS</code>-retention annotations into the runtime metadata reflection reads, so{' '}
        <code>getAnnotation</code> correctly returns <code>null</code> for it. This is exactly why
        every annotation meant to drive runtime behavior — Spring&#39;s <code>@Component</code>,{' '}
        <code>@Autowired</code>, and every stereotype annotation; JUnit&#39;s <code>@Test</code>;
        Jackson&#39;s <code>@JsonProperty</code> — is itself declared with{' '}
        <code>@Retention(RetentionPolicy.RUNTIME)</code>. Without that, none of those frameworks could
        see the annotation at all, because reflection genuinely cannot retrieve what the JVM never
        loaded.
      </p>

      <InteractiveChallenge
        question={"You have working reflection code that calls setAccessible(true) on a private field of a class in java.util, compiled and tested years ago on Java 8. On a current JDK it throws java.lang.reflect.InaccessibleObjectException. What actually changed, and what's the correct fix?"}
        options={[
          "setAccessible(true) was removed from the API; you must rewrite the code to avoid reflection entirely",
          "The field was renamed between JDK versions, so getDeclaredField needs an updated field name",
          "The Java Platform Module System (Java 9+) added strong encapsulation — java.util's module doesn't open that package to reflection by default; add the JVM flag --add-opens <module>/<package>=<target-module> (or ALL-UNNAMED) at launch to restore the old behavior",
          "This only happens in unit tests, not in a normally launched application, so no fix is needed"
        ]}
        correctIndex={2}
        explanation={"Nothing about the field or the setAccessible API changed. Java 9 added a second access-control layer on top of public/private: a named module must explicitly 'opens' a package before code outside that module can call setAccessible(true) on its members, and the JDK's own modules don't open their internals by default. The fix isn't rewriting the reflection code — it's telling the JVM to allow it at launch time with --add-opens, exactly as demonstrated by java.lang.String's private 'value' field above: identical code, InaccessibleObjectException without the flag, success with it."}
      />
    </LessonLayout>
  );
}
