import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Intro() {
  return (
    <LessonLayout
      title="Introduction to Java"
      sectionId="java"
      lessonIndex={0}
      prev={null}
      next={{ path: '/java/syntax', label: 'Syntax & Data Types' }}
    >
      <h2>What is Java?</h2>
      <p>
        Java is a high-level, object-oriented programming language developed by Sun Microsystems
        (now owned by Oracle) in 1995. It was designed with the philosophy of{' '}
        <strong>&quot;Write Once, Run Anywhere&quot;</strong> (WORA), meaning that compiled Java code
        can run on any platform that supports the Java Virtual Machine (JVM) without needing
        recompilation.
      </p>
      <p>
        Java is one of the most popular programming languages in the world, powering everything
        from Android apps and enterprise web applications to big data processing and embedded
        systems. Its combination of robustness, security, and platform independence makes it an
        excellent choice for both beginners and professionals.
      </p>

      <h2>JVM, JDK, and JRE</h2>
      <p>
        Before writing your first Java program, it helps to understand three key components of
        the Java ecosystem:
      </p>
      <ul>
        <li>
          <strong>JVM (Java Virtual Machine)</strong> — The engine that runs Java bytecode. It
          translates bytecode into machine-specific instructions for your operating system. This
          is what makes Java platform-independent.
        </li>
        <li>
          <strong>JRE (Java Runtime Environment)</strong> — The JVM plus the standard class
          libraries needed to <em>run</em> Java applications. Note that since Java 11 Oracle and
          most vendors no longer ship a standalone JRE download: you install a JDK, and if you
          need a trimmed runtime for deployment you build one with <code>jlink</code>. In practice
          today, &quot;install Java&quot; means &quot;install a JDK.&quot;
        </li>
        <li>
          <strong>JDK (Java Development Kit)</strong> — Includes the JRE plus development tools
          such as the Java compiler (<code>javac</code>), debugger, and documentation generator.
          You need the JDK to write and compile Java programs.
        </li>
      </ul>

      <InfoBox variant="info" title="JVM Architecture">
        <p>
          The JVM is an abstract computing machine that enables a computer to run Java programs.
          It performs three main tasks: loading bytecode, verifying it for security, and executing
          it. Each operating system has its own JVM implementation, but they all execute the same
          bytecode — this is the key to Java&apos;s portability.
        </p>
      </InfoBox>

      <h2>The Java Compilation Process</h2>
      <p>
        Unlike interpreted languages like Python or JavaScript, Java uses a two-step process:
        first, your source code is compiled into an intermediate form called <strong>bytecode</strong>,
        and then the JVM interprets (or JIT-compiles) that bytecode at runtime.
      </p>

      <FlowChart
        title="Java Compilation and Execution"
        chart={"graph TD\nA[\"Source Code (.java)\"] --> B[\"Java Compiler (javac)\"]\nB --> C[\"Bytecode (.class)\"]\nC --> D[\"JVM\"]\nD --> E[\"Machine Code\"]\nE --> F[\"Program Output\"]"}
      />

      <p>
        This two-step process is what gives Java its platform independence. The bytecode is the
        same regardless of where it was compiled, and any JVM on any platform can execute it.
      </p>

      <h2>Your First Java Program</h2>
      <p>
        Let&apos;s start with the classic &quot;Hello, World!&quot; program. Create a file called{' '}
        <code>HelloWorld.java</code> and add the following code:
      </p>

      <CodeBlock language="java" title="HelloWorld.java">
{`public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`}
      </CodeBlock>

      <p>Let&apos;s break down every part of this program:</p>
      <ul>
        <li>
          <code>public class HelloWorld</code> — Declares a public class named{' '}
          <code>HelloWorld</code>. In Java, every application must have at least one class, and
          the filename must match the public class name.
        </li>
        <li>
          <code>public static void main(String[] args)</code> — The main method is the entry
          point of any Java application. The JVM calls this method when you run your program.
        </li>
        <li>
          <code>System.out.println()</code> — Prints text to the console followed by a newline.{' '}
          <code>System</code> is a built-in class, <code>out</code> is its standard output stream,
          and <code>println</code> is a method that prints a line.
        </li>
      </ul>

      <h3>Why <code>main</code> has exactly that signature</h3>
      <p>
        &quot;It&apos;s just the magic incantation&quot; is the usual answer, and it leaves you
        unable to debug the day you typo it. Every word in that line is doing a specific job, and
        each one follows from the same fact: <strong>the JVM has to call your method before any of
        your code has run.</strong> Read the signature left to right with that in mind and it
        stops being arbitrary.
      </p>
      <ul>
        <li>
          <code>public</code> — the launcher lives outside your class and your package, so it needs
          access. Historically it required <code>public</code> exactly; since Java 25 the rule is
          only that <code>main</code> must not be <code>private</code>, so package-private and{' '}
          <code>protected</code> also launch. Keep writing <code>public</code> — it is the
          convention everywhere, and <code>private</code> still fails.
        </li>
        <li>
          <code>static</code> — this is the big one. A non-static method must be called{' '}
          <em>on an object</em>, so the JVM would have to construct a <code>HelloWorld</code>{' '}
          first — and to do that it would need to know which constructor to call and what to pass
          it. Making <code>main</code> static sidesteps the whole question: the method belongs to
          the class, so the JVM can call it the moment the class is loaded, with no instance in
          existence. (Java 25 relaxed this — see below — but by answering that question rather
          than dodging it.)
        </li>
        <li>
          <code>void</code> — there is no caller inside your program to hand a value back to, so
          the launcher only recognises a <code>main</code> that returns <code>void</code>. Note the
          language does not forbid other return types: <code>static int main(String[] args)</code>{' '}
          compiles perfectly well, it just is not an entry point, and you get the same
          &quot;Main method not found&quot; error as any other wrong signature. To report success or
          failure to the operating system you call <code>System.exit(1)</code>, which sets the
          process exit code directly.
        </li>
        <li>
          <code>String[] args</code> — the command-line arguments after the class name. Running{' '}
          <code>java HelloWorld alpha beta</code> gives you an array of length 2. Note it is length
          2, not 3: unlike C, <code>args[0]</code> is the first <em>argument</em>, not the program
          name.
        </li>
      </ul>
      <p>
        The practical payoff: if you get any part of it wrong, the class still compiles — it is a
        perfectly legal method, just not the one the launcher wants — and the failure shows up at
        launch instead. That distinction confuses a lot of beginners, so it is worth seeing:
      </p>

      <CodeBlock language="java" title="Compiles clean, fails to launch">
{`public class HelloWorld {
    public static void main(String args) { }   // a String, not a String[]
}

// javac HelloWorld.java   -> succeeds, produces HelloWorld.class
// java HelloWorld         -> Error: Main method not found in class HelloWorld,
//                            please define the main method as:
//                               public static void main(String[] args)

// The compiler had no reason to object: that is a valid method. It is simply
// an unrelated method that happens to share a name. Only the launcher cares.`}
      </CodeBlock>

      <h3>What the launcher actually looks for</h3>
      <p>
        Since Java 25 the rule is broader than &quot;must be <code>public static void
        main(String[])</code>&quot;. The launcher searches your class for a method named{' '}
        <code>main</code> returning <code>void</code> that is not <code>private</code>, and picks
        the first match in this order:
      </p>
      <ol>
        <li><code>main(String[] args)</code> — static or instance, whichever exists.</li>
        <li><code>main()</code> — static or instance, whichever exists.</li>
      </ol>
      <p>
        <strong>Arity is the primary key, not <code>static</code>.</strong> A{' '}
        <code>String[]</code> version wins over a no-parameter version even when the no-parameter
        one is <code>static</code> and declared right there in your class, and even when the{' '}
        <code>String[]</code> one is an instance method inherited from a superclass. It is worth
        being precise about this, because &quot;static first&quot; is the intuitive guess and it is
        wrong:
      </p>
      <CodeBlock language="java" title="Verified on JDK 26 — the instance String[] form wins">
{`public class D {
    public static void main() {
        System.out.println("LOCAL STATIC main()");
    }
    public void main(String[] a) {
        System.out.println("LOCAL INSTANCE main(String[])");
    }
}

// $ java D
// LOCAL INSTANCE main(String[])`}
      </CodeBlock>
      <p>
        If the launcher lands on an instance form, it constructs your class first — which is why{' '}
        <em>that</em> class needs a non-private zero-argument constructor:
      </p>

      <CodeBlock language="java" title="Instance main — what the launcher does for you">
{`public class HelloWorld {
    HelloWorld() { System.out.println("constructor ran"); }
    public void main(String[] args) { System.out.println("instance main"); }
}

// java HelloWorld
//   constructor ran
//   instance main

// But give it only a constructor that takes arguments:
public class Broken {
    private Broken(int x) { }
    public void main(String[] args) { }
}
// java Broken
//   Error: no non-private zero argument constructor found in class Broken`}
      </CodeBlock>

      <InfoBox variant="tip" title="The parts you can change">
        <p>
          The name <code>main</code>, the <code>void</code> return, and the parameter{' '}
          <em>type</em> (<code>String[]</code>, or nothing) are fixed. The parameter{' '}
          <em>name</em> is yours — <code>main(String[] cliArgs)</code> works fine and{' '}
          <code>args</code> is only convention. You may write it as{' '}
          <code>main(String... args)</code>, because varargs compile to an array parameter, so the
          launcher sees the signature it wants. And the method need not be <code>public</code> —
          only not <code>private</code>.
        </p>
        <p>
          Keep writing <code>public static void main(String[] args)</code> anyway. It is what
          every codebase, tutorial, and IDE template contains, and the relaxed rules exist mainly
          so that the compact form in the next section can work.
        </p>
      </InfoBox>

      <h2>Compiling and Running</h2>
      <p>To compile and run your program from the command line:</p>

      <CodeBlock language="java" title="Terminal Commands">
{`// Step 1: Compile the source file
javac HelloWorld.java

// Step 2: Run the compiled bytecode
java HelloWorld

// Output: Hello, World!`}
      </CodeBlock>

      <InfoBox variant="tip" title="Naming Conventions">
        <p>
          In Java, the file name must exactly match the public class name (including
          capitalization) and end with <code>.java</code>. So a class called{' '}
          <code>HelloWorld</code> must be in a file called <code>HelloWorld.java</code>. This is
          enforced by the compiler and will cause an error if not followed.
        </p>
      </InfoBox>

      <h2>The Shorter Way to Run Java</h2>
      <p>
        The two-command <code>javac</code> then <code>java</code> dance above is what actually
        happens, and you should understand it. But modern Java has removed nearly all of that
        ceremony for small programs, and you will want the short form while learning.
      </p>

      <CodeBlock language="java" title="Terminal">
{`// Java 11+ : run a single source file directly. No .class file is produced —
// the JDK compiles it in memory and runs it in one step.
java HelloWorld.java

// Java 25+ : the file itself can be this short. No class declaration,
// no "public static void", no imports for common types.
//   -- Hello.java --
//   void main() {
//       IO.println("Hello, World!");
//   }
java Hello.java`}
      </CodeBlock>

      <InfoBox variant="info" title="Compact source files (Java 25)">
        <p>
          Java 25 finalised <strong>compact source files and instance main methods</strong>. A
          source file may declare <code>void main()</code> at the top level with no enclosing class
          and no <code>String[] args</code>; the compiler wraps it for you. Those files also get
          the <code>java.base</code> module imported implicitly (so <code>List</code>,{' '}
          <code>Map</code>, and friends just work) plus a new <code>java.lang.IO</code> class with{' '}
          <code>IO.println(...)</code> and <code>IO.readln(...)</code>.
        </p>
        <p>
          This exists so that a first Java program does not require explaining{' '}
          <code>public</code>, <code>static</code>, <code>void</code>, arrays, and classes before
          printing a line. Real applications still use ordinary classes in packages — everything
          else in this course does — but you can reach for the short form any time you are just
          trying something out.
        </p>
      </InfoBox>

      <h2>A Slightly More Complex Example</h2>
      <p>
        Here is a program that demonstrates variables, user input, and string concatenation:
      </p>

      <CodeBlock language="java" title="Greeting.java">
{`import java.util.Scanner;

public class Greeting {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("What is your name? ");
        String name = scanner.nextLine();

        System.out.print("How old are you? ");
        int age = scanner.nextInt();

        System.out.println("Hello, " + name + "!");
        System.out.println("You are " + age + " years old.");

        scanner.close();
    }
}`}
      </CodeBlock>

      <h2>When It Breaks: Reading a Stack Trace</h2>
      <p>
        You will see a stack trace within your first hour of writing Java, so it is worth being
        able to read one now rather than treating it as a wall of red text. A stack trace is not
        an error message with decoration around it — it is a <strong>snapshot of the call stack at
        the instant the exception was created</strong>, printed innermost-first.
      </p>
      <p>Here is a real one. The program asks a two-element list for its third element:</p>

      <CodeBlock language="java" title="Report.java">
{`import java.util.List;                                    // line 1

public class Report {
    public static void main(String[] args) {
        List<String> names = List.of("Ada", "Alan");
        System.out.println(lengthOfThird(names));         // line 6
    }

    static int lengthOfThird(List<String> names) {
        return names.get(2).length();                     // line 10
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="What it prints">
{`Exception in thread "main" java.lang.IndexOutOfBoundsException: Index: 2 Size: 2
	at java.base/java.util.ImmutableCollections$AbstractImmutableList.outOfBounds(ImmutableCollections.java:345)
	at java.base/java.util.ImmutableCollections$List12.get(ImmutableCollections.java:600)
	at Report.lengthOfThird(Report.java:10)
	at Report.main(Report.java:6)`}
      </CodeBlock>

      <p>Read it in three passes:</p>
      <ol>
        <li>
          <strong>The first line is the what.</strong> The thread it happened on
          (<code>&quot;main&quot;</code>), the exception type
          (<code>java.lang.IndexOutOfBoundsException</code>), and the message
          (<code>Index: 2 Size: 2</code>). The type tells you the category of failure; the message
          is where the useful specifics live. Here it already tells you the whole story — you
          asked for index 2 of a 2-element list.
        </li>
        <li>
          <strong>The frames read bottom-to-top in time order.</strong> The <em>bottom</em> frame
          is where execution started and the <em>top</em> is where it blew up. So:{' '}
          <code>main</code> (line 6) called <code>lengthOfThird</code> (line 10), which called{' '}
          <code>get</code>, which called <code>outOfBounds</code>, which threw. Beginners often
          read the top line and conclude the bug is in the JDK. It almost never is.
        </li>
        <li>
          <strong>Find the topmost frame that is your code.</strong> That is where to put the
          breakpoint. Here it is <code>Report.lengthOfThird(Report.java:10)</code> — file and line
          number included. Frames prefixed with a module like <code>java.base/</code> are library
          code; they show you <em>how</em> you got there, but the mistake is nearly always in the
          first frame you wrote yourself.
        </li>
      </ol>

      <InfoBox variant="tip" title="NullPointerExceptions tell you the variable now">
        <p>
          An NPE used to give you a line number and nothing else — miserable when the line had
          five things on it that could be null. Since Java 15, <em>helpful NullPointerExceptions</em>{' '}
          are on by default and the message names the exact expression:
        </p>
        <CodeBlock language="java" title="Helpful NPE">
{`Map<String, User> users = Map.of("ada", new User("Ada"));
System.out.println(users.get("alan").name().toUpperCase());

// Exception in thread "main" java.lang.NullPointerException:
//   Cannot invoke "User.name()" because the return value of
//   "java.util.Map.get(Object)" is null`}
        </CodeBlock>
        <p>
          It names both the call that failed (<code>User.name()</code>) and{' '}
          <em>why the receiver was null</em> (<code>Map.get</code> returned null). Read those
          messages — they usually remove the need to debug at all. If you see a bare{' '}
          <code>NullPointerException</code> with no explanation, you are on an old JVM or someone
          disabled the feature.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="&quot;Caused by&quot; — read the last one first">
        <p>
          When a trace contains <code>Caused by:</code> sections, the exception was caught and
          rewrapped on the way up. The top block is the outermost wrapper (often something generic
          like a framework&apos;s <code>ServiceException</code>); each <code>Caused by:</code>{' '}
          takes you one layer deeper toward the original failure. The <strong>last</strong>{' '}
          <code>Caused by:</code> in the output is the root cause, and it is usually the only one
          worth reading first. You will meet the mechanism that produces these — exception
          chaining — in the Exceptions lesson.
        </p>
      </InfoBox>

      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question="What does the JVM do in the Java execution process?"
        options={[
          "Compiles .java files into machine code directly",
          "Interprets and executes Java bytecode on any platform",
          "Converts Java code to C++ before running it",
          "Only runs on Windows operating systems"
        ]}
        correctIndex={1}
        explanation="The JVM (Java Virtual Machine) interprets and executes Java bytecode. The Java compiler (javac) first compiles .java source files into .class bytecode files, and then the JVM executes that bytecode. Because each OS has its own JVM implementation that understands the same bytecode, Java achieves its 'Write Once, Run Anywhere' capability."
      />
    </LessonLayout>
  );
}

export default Intro;
