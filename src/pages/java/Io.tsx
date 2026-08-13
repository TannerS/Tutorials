import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Io() {
  return (
    <LessonLayout
      title="I/O & File Handling"
      sectionId="java"
      lessonIndex={8}
      prev={{ path: '/java/concurrency', label: 'Concurrency & Threads' }}
      next={{ path: '/java/advanced', label: 'Advanced Java Features' }}
    >
      <h2>Java I/O Overview</h2>
      <p>
        Java provides two main I/O systems: the original <code>java.io</code> package
        (stream-based, since Java 1.0) and the newer <code>java.nio</code> package (buffer and
        channel-based, since Java 1.4, enhanced in Java 7). The NIO.2 API introduced in Java 7
        with the <code>Path</code> and <code>Files</code> classes is now the recommended approach
        for most file operations.
      </p>

      <FlowChart
        title="Java I/O APIs"
        chart={"graph TD\nA[Java I/O] --> B[java.io - Classic]\nA --> C[java.nio - New I/O]\nB --> D[InputStream/OutputStream]\nB --> E[Reader/Writer]\nD --> F[FileInputStream]\nD --> G[BufferedInputStream]\nE --> H[FileReader]\nE --> I[BufferedReader]\nC --> J[Path/Files - NIO.2]\nC --> K[Channels/Buffers]\nJ --> L[Files.readString]\nJ --> M[Files.readAllLines]\nJ --> N[Files.walk]"}
      />

      <h2>Reading Files — Classic I/O</h2>
      <p>
        The classic approach uses <code>BufferedReader</code> for efficient line-by-line reading
        of text files. Always use buffered wrappers around raw streams for better performance.
      </p>

      <CodeBlock language="java" title="ClassicFileReading.java">
{`import java.io.*;

public class ClassicFileReading {
    public static void main(String[] args) {
        // BufferedReader with try-with-resources
        try (BufferedReader reader = new BufferedReader(new FileReader("data.txt"))) {
            String line;
            int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                System.out.println(lineNumber + ": " + line);
                lineNumber++;
            }
        } catch (FileNotFoundException e) {
            System.out.println("File not found: " + e.getMessage());
        } catch (IOException e) {
            System.out.println("Error reading file: " + e.getMessage());
        }

        // Reading all content at once with Scanner
        try (var scanner = new java.util.Scanner(new File("data.txt"))) {
            while (scanner.hasNextLine()) {
                System.out.println(scanner.nextLine());
            }
        } catch (FileNotFoundException e) {
            System.out.println("File not found: " + e.getMessage());
        }
    }
}`}
      </CodeBlock>

      <h2>Writing Files — Classic I/O</h2>

      <CodeBlock language="java" title="ClassicFileWriting.java">
{`import java.io.*;

public class ClassicFileWriting {
    public static void main(String[] args) {
        // BufferedWriter for efficient text writing
        try (BufferedWriter writer = new BufferedWriter(new FileWriter("output.txt"))) {
            writer.write("Line 1: Hello, Java I/O!");
            writer.newLine();
            writer.write("Line 2: Writing files is straightforward.");
            writer.newLine();
            writer.write("Line 3: Always use buffered writers for performance.");
            System.out.println("File written successfully.");
        } catch (IOException e) {
            System.out.println("Error writing file: " + e.getMessage());
        }

        // Appending to an existing file (second parameter = true)
        try (BufferedWriter writer = new BufferedWriter(new FileWriter("output.txt", true))) {
            writer.newLine();
            writer.write("Line 4: This line was appended.");
            System.out.println("Content appended.");
        } catch (IOException e) {
            System.out.println("Error appending: " + e.getMessage());
        }

        // PrintWriter for formatted output
        try (PrintWriter pw = new PrintWriter(new FileWriter("report.txt"))) {
            pw.println("Monthly Report");
            pw.println("===============");
            pw.printf("Revenue: $%,.2f%n", 125000.50);
            pw.printf("Expenses: $%,.2f%n", 89000.75);
            pw.printf("Profit: $%,.2f%n", 36000.00);
        } catch (IOException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}`}
      </CodeBlock>

      <h3>Why buffering matters — and where it actually matters</h3>
      <p>
        &quot;Always wrap your streams in a buffer&quot; is repeated everywhere, usually with the
        explanation that otherwise <em>every <code>read()</code> is a system call</em>. That
        explanation is right about the mechanism and wrong about which classes it applies to, and
        the difference is worth 60x.
      </p>
      <p>
        A system call is a transition into the kernel — expensive relative to ordinary work, so
        doing one per byte is ruinous. A buffered wrapper asks the OS for a large block (8 KB by
        default), then serves individual <code>read()</code> calls from memory. Reading a 2.3 MB
        file one byte at a time, measured:
      </p>

      <CodeBlock language="java" title="Measured on a 2.3 MB file, JDK 26">
{`// Genuinely unbuffered — one syscall per byte.
try (var in = new FileInputStream(f)) { while (in.read() != -1) {} }
//   669 ms

// Buffered — one syscall per 8 KB.
try (var in = new BufferedInputStream(new FileInputStream(f))) { while (in.read() != -1) {} }
//    10 ms          <-- 66x faster

// But now the same test with the CHARACTER streams:
try (var r = new FileReader(f)) { while (r.read() != -1) {} }
//    31 ms
try (var r = new BufferedReader(new FileReader(f))) { while (r.read() != -1) {} }
//    10 ms          <-- only 3x`}
      </CodeBlock>

      <InfoBox variant="warning" title="FileReader is already partly buffered">
        <p>
          The 66x case is <code>FileInputStream</code> — a raw byte stream that really does issue
          one syscall per <code>read()</code>. <code>FileReader</code> is not that. It decodes
          bytes into characters through an internal <code>StreamDecoder</code> that already pulls
          from the file in 8 KB blocks, so the syscalls were never per-character. Wrapping it
          still helps — 3x here, by removing per-call synchronization and decoder overhead — but
          the &quot;orders of magnitude&quot; claim you will read in most tutorials is describing
          the byte-stream case and quietly attaching it to the character-stream one.
        </p>
        <p>
          The practical rule survives intact: <strong>buffer anyway</strong>. It is one wrapper,
          it never hurts, and it is a large win on raw streams. Just know which failure you are
          preventing, so that &quot;I already buffered it&quot; does not become the wrong answer
          when you profile something slow. And note that{' '}
          <code>BufferedReader</code> also gives you <code>readLine()</code>, which{' '}
          <code>FileReader</code> does not have at all — often the real reason to reach for it.
        </p>
        <p>
          For writers there is a second, sharper reason: a <code>BufferedWriter</code> holds data
          in memory until the buffer fills, so anything not flushed is lost if the program exits
          without closing. Try-with-resources closes (and therefore flushes) for you — which is
          why the manual <code>finally</code> version of this code is a data-loss bug waiting to
          happen, not just a style preference.
        </p>
      </InfoBox>

      <h2>NIO.2 — Path and Files (Recommended)</h2>
      <p>
        The NIO.2 API introduced in Java 7 provides a much cleaner and more powerful way to work
        with files. The <code>Path</code> class represents file system paths, and the{' '}
        <code>Files</code> utility class provides static methods for common operations.
      </p>

      <CodeBlock language="java" title="NioFileOperations.java">
{`import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.io.IOException;
import java.util.List;

public class NioFileOperations {
    public static void main(String[] args) throws IOException {
        // Creating Path objects
        Path filePath = Path.of("data", "example.txt");
        Path absPath = Path.of("/home/user/documents/file.txt");

        // Path operations
        System.out.println("File name: " + filePath.getFileName());
        System.out.println("Parent: " + filePath.getParent());
        System.out.println("Absolute: " + filePath.toAbsolutePath());

        // Reading files (concise one-liners)
        // Read entire file as a single string (Java 11+)
        String content = Files.readString(Path.of("data.txt"));
        System.out.println(content);

        // Read all lines into a List
        List<String> lines = Files.readAllLines(Path.of("data.txt"));
        lines.forEach(System.out::println);

        // Read as a stream (lazy, memory-efficient for large files)
        try (var lineStream = Files.lines(Path.of("data.txt"))) {
            lineStream
                .filter(line -> !line.isBlank())
                .map(String::trim)
                .forEach(System.out::println);
        }

        // Writing files
        Files.writeString(Path.of("output.txt"), "Hello NIO.2!");

        // Write multiple lines
        List<String> outputLines = List.of("Line 1", "Line 2", "Line 3");
        Files.write(Path.of("lines.txt"), outputLines);

        // Append to file
        Files.writeString(
            Path.of("output.txt"),
            "\\nAppended content",
            StandardOpenOption.APPEND
        );

        // Read bytes (for binary files)
        byte[] bytes = Files.readAllBytes(Path.of("image.png"));
        System.out.println("File size: " + bytes.length + " bytes");
    }
}`}
      </CodeBlock>

      <h2>File System Operations</h2>

      <CodeBlock language="java" title="FileSystemOps.java">
{`import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.io.IOException;

public class FileSystemOps {
    public static void main(String[] args) throws IOException {
        Path dir = Path.of("myproject");
        Path file = dir.resolve("readme.txt");

        // Create directories (including parents)
        Files.createDirectories(dir);

        // Create and write a file
        Files.writeString(file, "Project README");

        // Check file existence and properties
        System.out.println("Exists: " + Files.exists(file));
        System.out.println("Is directory: " + Files.isDirectory(dir));
        System.out.println("Is regular file: " + Files.isRegularFile(file));
        System.out.println("Size: " + Files.size(file) + " bytes");

        // File attributes
        BasicFileAttributes attrs = Files.readAttributes(file, BasicFileAttributes.class);
        System.out.println("Created: " + attrs.creationTime());
        System.out.println("Modified: " + attrs.lastModifiedTime());

        // Copy and move files
        Path copy = dir.resolve("readme-backup.txt");
        Files.copy(file, copy, StandardCopyOption.REPLACE_EXISTING);

        Path moved = dir.resolve("README.md");
        Files.move(copy, moved, StandardCopyOption.REPLACE_EXISTING);

        // List directory contents
        System.out.println("\\nDirectory contents:");
        try (var entries = Files.list(dir)) {
            entries.forEach(entry -> System.out.println("  " + entry.getFileName()));
        }

        // Walk file tree recursively
        System.out.println("\\nAll files recursively:");
        try (var walk = Files.walk(Path.of("."))) {
            walk.filter(Files::isRegularFile)
                .filter(p -> p.toString().endsWith(".java"))
                .forEach(p -> System.out.println("  " + p));
        }

        // Find files matching a pattern
        try (var found = Files.find(Path.of("."), 5,
                (path, attr) -> path.toString().endsWith(".txt") && attr.isRegularFile())) {
            found.forEach(p -> System.out.println("Found: " + p));
        }

        // Delete files
        Files.deleteIfExists(moved);
        Files.deleteIfExists(file);
        Files.deleteIfExists(dir);
    }
}`}
      </CodeBlock>

      <h2>Character Encoding</h2>
      <p>
        Encoding bugs are the most common source of &quot;it worked on my machine&quot; in file
        handling: text written on a developer&apos;s laptop reads back as mojibake on a Linux
        server. Java 18 removed most of this class of bug by changing a two-decade-old default.
      </p>

      <InfoBox variant="info" title="UTF-8 is the default since Java 18 (JEP 400)">
        <p>
          Before Java 18, APIs that took no explicit charset — <code>new FileReader(f)</code>,{' '}
          <code>new FileWriter(f)</code>, <code>new String(bytes)</code>,{' '}
          <code>String.getBytes()</code> — used the platform default charset, which was{' '}
          <code>windows-1252</code> on a US Windows machine and <code>UTF-8</code> on Linux. The
          same code produced different bytes on different machines. Since Java 18 the default is{' '}
          <strong>UTF-8 everywhere</strong>, regardless of OS or locale.
        </p>
        <p>
          Two caveats. <code>System.out</code> / <code>System.err</code> still follow the console
          encoding, not the file default (tune with{' '}
          <code>-Dstdout.encoding</code>). And if you are on Java 17 or older — or maintaining code
          that must behave identically on both — pass the charset explicitly. Doing so is still the
          most defensive habit.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Encoding.java">
{`// Explicit is always safe, on every Java version.
String content = Files.readString(path, StandardCharsets.UTF_8);
Files.writeString(path, content, StandardCharsets.UTF_8);
byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
String back  = new String(bytes, StandardCharsets.UTF_8);

// Buffered readers/writers with an explicit charset — prefer these
// over new FileReader/FileWriter, which had no charset parameter at all
// until Java 11.
try (BufferedReader r = Files.newBufferedReader(path, StandardCharsets.UTF_8)) { }
try (BufferedWriter w = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) { }

// Inspect what the JVM is actually using
System.out.println(Charset.defaultCharset());          // UTF-8 on Java 18+
System.out.println(System.getProperty("file.encoding"));

// Force the old behaviour for a legacy app during migration:
//   java -Dfile.encoding=COMPAT -jar app.jar`}
      </CodeBlock>

      <h2>The HTTP Client (Java 11+)</h2>
      <p>
        Network I/O is I/O, and since Java 11 the JDK ships a modern HTTP client that supports
        HTTP/2, synchronous and asynchronous calls, and WebSocket — replacing the ancient{' '}
        <code>HttpURLConnection</code> and removing the reflex to pull in a third-party library for
        a single call.
      </p>

      <CodeBlock language="java" title="HttpClientExample.java">
{`import java.net.URI;
import java.net.http.*;
import java.time.Duration;

// The client is immutable and thread-safe — create ONE and reuse it.
HttpClient client = HttpClient.newBuilder()
    .version(HttpClient.Version.HTTP_2)
    .connectTimeout(Duration.ofSeconds(5))
    .followRedirects(HttpClient.Redirect.NORMAL)
    .build();

// GET — synchronous
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/orders/42"))
    .header("Accept", "application/json")
    .timeout(Duration.ofSeconds(10))     // per-request, separate from connect timeout
    .GET()
    .build();

HttpResponse<String> response =
    client.send(request, HttpResponse.BodyHandlers.ofString());

System.out.println(response.statusCode());   // note: 4xx/5xx do NOT throw
System.out.println(response.body());

// POST with a JSON body
HttpRequest post = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/orders"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(json))
    .build();

// Asynchronous — returns immediately with a CompletableFuture
client.sendAsync(post, HttpResponse.BodyHandlers.ofString())
      .thenApply(HttpResponse::body)
      .thenAccept(System.out::println);

// Stream a large response straight to a file, never holding it in memory
client.send(request, HttpResponse.BodyHandlers.ofFile(Path.of("download.bin")));`}
      </CodeBlock>

      <InfoBox variant="tip" title="On Java 21+, prefer blocking calls on virtual threads">
        <p>
          <code>sendAsync</code> exists because blocking a platform thread per request was
          expensive. With virtual threads that constraint is gone: the simple, readable{' '}
          <code>client.send(...)</code> form running on a virtual thread scales to tens of
          thousands of concurrent requests, and it gives you real stack traces and ordinary{' '}
          <code>try/catch</code>. Reach for <code>sendAsync</code> only when you genuinely want
          non-blocking composition. See the Concurrency lesson.
        </p>
        <p>
          Also note that a non-2xx status does <strong>not</strong> throw — always check{' '}
          <code>response.statusCode()</code> yourself.
        </p>
      </InfoBox>

      <h2>Serialization</h2>
      <p>
        Serialization converts an object into a byte stream that can be saved to a file or sent
        over a network. Deserialization reverses the process. A class must implement{' '}
        <code>Serializable</code> to be serializable.
      </p>

      <CodeBlock language="java" title="SerializationExample.java">
{`import java.io.*;

public class Person implements Serializable {
    private static final long serialVersionUID = 1L;

    private String name;
    private int age;
    private transient String password; // transient fields are NOT serialized

    public Person(String name, int age, String password) {
        this.name = name;
        this.age = age;
        this.password = password;
    }

    @Override
    public String toString() {
        return "Person{name='" + name + "', age=" + age +
               ", password='" + password + "'}";
    }
}

public class SerializationDemo {
    public static void main(String[] args) {
        Person person = new Person("Alice", 30, "secret123");

        // Serialize (save) to file
        try (ObjectOutputStream oos = new ObjectOutputStream(
                new FileOutputStream("person.ser"))) {
            oos.writeObject(person);
            System.out.println("Serialized: " + person);
        } catch (IOException e) {
            System.out.println("Serialization error: " + e.getMessage());
        }

        // Deserialize (load) from file
        try (ObjectInputStream ois = new ObjectInputStream(
                new FileInputStream("person.ser"))) {
            Person loaded = (Person) ois.readObject();
            System.out.println("Deserialized: " + loaded);
            // Note: password will be null (it was transient)
        } catch (IOException | ClassNotFoundException e) {
            System.out.println("Deserialization error: " + e.getMessage());
        }
    }
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="Serialization Security — deserialization is remote code execution">
        <p>
          This is not a theoretical risk. <code>ObjectInputStream.readObject()</code> constructs
          arbitrary classes named in the byte stream and runs their{' '}
          <code>readObject</code> methods <em>before</em> you ever get a chance to check the type.
          If an attacker controls those bytes and a suitable &quot;gadget chain&quot; is on your
          classpath, they get code execution. Whole CVE families (Apache Commons Collections,
          Log4j 1.x, and many more) are exactly this bug. Java serialization is now officially a
          legacy feature the JDK intends to replace.
        </p>
        <p>
          <strong>Never deserialize data you do not control.</strong> For data interchange use
          JSON (Jackson), Protocol Buffers, or Avro — formats that build a value from a schema
          rather than instantiating whatever the payload asks for.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="SerializationFilter.java">
{`// If you genuinely cannot remove Java serialization, put an allow-list filter
// in front of it. Filters (JEP 290, Java 9; per-stream factories in JEP 415,
// Java 17) are checked BEFORE any class is resolved or constructed.

ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
    "com.myapp.dto.*;java.util.*;java.lang.*;" +   // allowed patterns
    "maxdepth=20;maxarray=10000;maxrefs=1000;" +   // resource limits
    "!*"                                           // reject everything else
);

try (var in = new ObjectInputStream(source)) {
    in.setObjectInputFilter(filter);               // MUST be set before readObject
    Order order = (Order) in.readObject();
}

// Process-wide default, no code change required:
//   java -Djdk.serialFilter='com.myapp.dto.*;!*' -jar app.jar

// Other hardening, in rough order of value:
//   1. Don't accept serialized input at a trust boundary at all.
//   2. Allow-list with a filter (above) — never a deny-list; new gadget
//      chains are found constantly.
//   3. Set 'serialVersionUID' explicitly, or any field change breaks
//      compatibility with an unhelpful InvalidClassException.
//   4. Mark secrets 'transient' so they never reach the stream.
//   5. Validate invariants in readObject() — the constructor did NOT run,
//      so a hand-crafted stream can produce an "impossible" object.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Records deserialize more safely">
        <p>
          A <code>record</code> that implements <code>Serializable</code> is deserialized through
          its <strong>canonical constructor</strong>, not by field-stuffing an uninitialized
          object. That means your compact-constructor validation actually runs, and the classic
          &quot;deserialization bypasses my invariants&quot; attack does not apply. It is one more
          reason to model data as records.
        </p>
      </InfoBox>

      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question="Which is the recommended modern API for file operations in Java?"
        options={[
          "java.io.File with FileInputStream/FileOutputStream",
          "java.nio.file.Path and java.nio.file.Files",
          "java.util.Scanner for all file operations",
          "System.in and System.out"
        ]}
        correctIndex={1}
        explanation="The java.nio.file package (NIO.2), introduced in Java 7, is the modern recommended API for file operations. Path replaces java.io.File, and the Files utility class provides concise, powerful methods like readString(), readAllLines(), write(), walk(), and more. The classic java.io package still works but is more verbose and less capable."
      />
    </LessonLayout>
  );
}

export default Io;
