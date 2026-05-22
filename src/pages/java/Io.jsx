import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaIo() {
  return (
    <LessonLayout
      title="I/O & NIO.2"
      sectionId="java"
      lessonIndex={8}
      prev={{ path: "/java/concurrency", label: "Concurrency" }}
      next={{ path: "/java/advanced", label: "Modern Java Features" }}
    >
      <p>Java provides two I/O APIs: the classic java.io (stream-based) and the modern java.nio.file (path-based). Prefer NIO.2 for new code — it is cleaner and more powerful.</p>

      <h2>NIO.2 — Modern File Operations</h2>
      <CodeBlock language="java" title="Path and Files API">
{`import java.nio.file.*;
import java.nio.charset.StandardCharsets;

// Path construction
Path p = Path.of("data/file.txt");
Path abs = p.toAbsolutePath();
Path parent = p.getParent();     // data
Path name   = p.getFileName();   // file.txt

// Check file properties
boolean exists = Files.exists(p);
boolean isDir  = Files.isDirectory(p);
long size      = Files.size(p);

// Read file content
String content = Files.readString(p);
List<String> lines = Files.readAllLines(p);
byte[] bytes = Files.readAllBytes(p);

// Write file content
Files.writeString(p, "Hello World");
Files.write(p, List.of("line1", "line2"),
    StandardOpenOption.CREATE, StandardOpenOption.APPEND);

// File operations
Files.copy(Path.of("src.txt"), Path.of("dst.txt"),
    StandardCopyOption.REPLACE_EXISTING);
Files.move(Path.of("old.txt"), Path.of("new.txt"));
Files.deleteIfExists(p);

// Directory operations
Files.createDirectories(Path.of("a/b/c"));
Files.list(Path.of(".")).forEach(System.out::println);

// Walk tree — find all .java files
Files.walk(Path.of("src"))
    .filter(f -> f.toString().endsWith(".java"))
    .forEach(System.out::println);`}
      </CodeBlock>

      <h2>Buffered I/O</h2>
      <CodeBlock language="java" title="BufferedReader and BufferedWriter">
{`// Buffered reading (efficient — reads chunks at a time)
try (BufferedReader br = Files.newBufferedReader(Path.of("file.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
}

// Stream-based reading (functional style)
try (var lines = Files.lines(Path.of("file.txt"))) {
    lines.filter(l -> !l.isBlank())
         .map(String::trim)
         .forEach(System.out::println);
}

// Buffered writing
try (BufferedWriter bw = Files.newBufferedWriter(Path.of("out.txt"))) {
    bw.write("First line");
    bw.newLine();
    bw.write("Second line");
}

// PrintWriter — formatted output
try (PrintWriter pw = new PrintWriter(Files.newBufferedWriter(Path.of("report.txt")))) {
    pw.printf("User: %s, Score: %.2f%n", "Alice", 95.5);
    pw.println("End of report");
}`}
      </CodeBlock>

      <h2>Byte Streams</h2>
      <CodeBlock language="java" title="InputStream and OutputStream">
{`// Reading binary data
try (InputStream in = new FileInputStream("image.png");
     OutputStream out = new FileOutputStream("copy.png")) {
    byte[] buffer = new byte[8192];
    int bytesRead;
    while ((bytesRead = in.read(buffer)) != -1) {
        out.write(buffer, 0, bytesRead);
    }
}

// Use Files.copy for simple copies (handles buffer internally)
Files.copy(Path.of("image.png"), Path.of("copy.png"),
    StandardCopyOption.REPLACE_EXISTING);`}
      </CodeBlock>

      <InfoBox variant="tip" title="Use Try-With-Resources">
        <p>Always wrap I/O resources in try-with-resources to ensure they are closed properly, even when exceptions occur. Failing to close streams can cause file locks, connection leaks, and data corruption.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Which API should you prefer for file I/O in modern Java?"
        options={["java.io.File", "java.nio.file.Files and Path", "java.io.FileInputStream", "java.net.URLConnection"]}
        correctIndex={1}
        explanation="java.nio.file.Files and Path (NIO.2, introduced in Java 7) is the modern API. It provides cleaner methods, consistent IOException handling, symlink support, and atomic operations. The older java.io.File is still supported but has inconsistent error handling."
      />
    </LessonLayout>
  );
}
