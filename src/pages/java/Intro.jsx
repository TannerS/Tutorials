import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaIntro() {
  return (
    <LessonLayout
      title="Introduction to Java"
      sectionId="java"
      lessonIndex={0}
      prev={null}
      next={{ path: '/java/syntax', label: 'Java Syntax' }}
    >
      <p>Java is a high-level, object-oriented programming language designed by James Gosling at Sun Microsystems in 1995. Its core philosophy is <strong>Write Once, Run Anywhere (WORA)</strong> — Java code compiles to bytecode that runs on any Java Virtual Machine (JVM), regardless of the underlying operating system.</p>

      <h2>JVM, JDK, and JRE</h2>
      <p>Understanding the Java ecosystem requires knowing three key components that are often confused with one another. They form a hierarchy where each builds on top of the previous.</p>

      <ul>
        <li><strong>JVM (Java Virtual Machine)</strong> — Executes Java bytecode. It handles memory management, garbage collection, and provides the runtime environment. The JVM is platform-specific.</li>
        <li><strong>JRE (Java Runtime Environment)</strong> — Contains the JVM plus standard class libraries. It's what end users need to run Java applications.</li>
        <li><strong>JDK (Java Development Kit)</strong> — Contains the JRE plus development tools: the compiler (javac), debugger, and javadoc. Developers need the JDK.</li>
      </ul>

      <FlowChart
        title="Java Compilation and Execution Flow"
        chart={"graph LR\n  A[Source Code .java] --> B[javac Compiler]\n  B --> C[Bytecode .class]\n  C --> D[JVM]\n  D --> E[Machine Code]\n  E --> F[OS Execution]"}
      />

      <h2>Java Versions Timeline</h2>
      <p>Java has evolved significantly. Key milestones: Java 8 (lambdas, streams), Java 11 (LTS), Java 17 (LTS, sealed classes), and Java 21 (LTS, virtual threads, pattern matching). For new projects, use Java 21 (latest LTS).</p>

      <InfoBox variant="tip" title="Which Version to Use?">
        <p>Use Java 21 for production — it is the latest Long-Term Support (LTS) release. Java 17 is also solid. Avoid older versions for new projects as they lack modern features and security patches.</p>
      </InfoBox>

      <h2>Your First Java Program</h2>
      <p>Every Java application starts with a class containing a <code>main</code> method. The JVM looks for this exact signature as the program entry point.</p>

      <CodeBlock language="java" title="HelloWorld.java">
{`public class HelloWorld {
    // The main method is the program entry point
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.printf("Java version: %s%n",
            System.getProperty("java.version"));

        // Print command line arguments
        for (String arg : args) {
            System.out.println("Arg: " + arg);
        }
    }
}`}
      </CodeBlock>

      <h2>Java Program Structure</h2>
      <p>Every Java file follows a consistent structure: package declaration, imports, then one public class matching the filename.</p>

      <CodeBlock language="java" title="Typical Java File Structure">
{`// 1. Package declaration (must match directory structure)
package com.example.myapp;

// 2. Import statements
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

// 3. Class declaration (filename must match public class name)
public class MyClass {

    // 4. Fields (instance variables)
    private String name;
    private int age;
    private static int instanceCount = 0; // shared across all instances

    // 5. Constructors
    public MyClass(String name, int age) {
        this.name = name;
        this.age = age;
        instanceCount++;
    }

    // 6. Methods
    public String getName() { return name; }
    public int getAge()     { return age; }

    public void greet() {
        System.out.println("Hi, I am " + name + ", age " + age);
    }

    // 7. Static methods
    public static int getInstanceCount() {
        return instanceCount;
    }

    // 8. toString for human-readable output
    @Override
    public String toString() {
        return "MyClass{name='" + name + "', age=" + age + "}";
    }

    // 9. Main method (entry point)
    public static void main(String[] args) {
        MyClass obj = new MyClass("Alice", 30);
        obj.greet();
        System.out.println("Instances: " + getInstanceCount());
    }
}`}
      </CodeBlock>

      <h2>Java Ecosystem</h2>
      <p>Java powers a vast ecosystem — Android mobile apps, enterprise backends (Spring Boot), big data tools (Apache Kafka, Hadoop), and financial systems. Its maturity and tooling make it the #1 language for enterprise software.</p>

      <FlowChart
        title="Java Ecosystem Applications"
        chart={"graph TD\n  A[Java Language] --> B[Web - Spring Boot]\n  A --> C[Android Mobile]\n  A --> D[Big Data - Hadoop/Kafka]\n  A --> E[Enterprise - Jakarta EE]\n  A --> F[Desktop - JavaFX]\n  B --> G[REST APIs]\n  B --> H[Microservices]"}
      />

      <InfoBox variant="note" title="Java vs JavaScript">
        <p>Despite the similar names, Java and JavaScript are completely different languages. Java is statically typed, compiled to bytecode, and runs on the JVM. JavaScript is dynamically typed, interpreted, and runs in browsers or Node.js. The naming similarity is purely historical marketing.</p>
      </InfoBox>

      <h2>Compilation and Running</h2>
      <CodeBlock language="bash" title="Compile and Run">
{`# Compile (creates HelloWorld.class)
javac HelloWorld.java

# Run
java HelloWorld

# Run with arguments
java HelloWorld arg1 arg2

# Compile entire directory
javac -d out src/**/*.java

# Check Java version
java -version`}
      </CodeBlock>

      <InteractiveChallenge
        question="What does WORA stand for in Java?"
        options={["Write Once, Run Anywhere", "Write Once, Reuse Anywhere", "Web Object Runtime Architecture", "Write Optimized Runtime Applications"]}
        correctIndex={0}
        explanation="WORA — Write Once, Run Anywhere — is Java's core philosophy. Java code compiles to bytecode that runs on any platform with a JVM installed, without needing to recompile for each operating system."
      />

      <InteractiveChallenge
        question="Which component contains the javac compiler?"
        options={["JRE", "JVM", "JDK", "JDE"]}
        correctIndex={2}
        explanation="The JDK (Java Development Kit) contains the javac compiler, along with the JRE and other developer tools. The JRE only contains what's needed to run compiled Java programs. The JVM is the runtime environment within the JRE."
      />
    </LessonLayout>
  );
}
