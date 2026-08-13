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
