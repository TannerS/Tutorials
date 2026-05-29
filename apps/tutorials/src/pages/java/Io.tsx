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

      <InfoBox variant="tip" title="Always Buffer Your I/O">
        <p>
          Wrapping a <code>FileReader</code> or <code>FileWriter</code> in a{' '}
          <code>BufferedReader</code> or <code>BufferedWriter</code> dramatically improves
          performance. Without buffering, every <code>read()</code> or <code>write()</code> call
          results in a system call to the OS. Buffered wrappers batch these operations, reducing
          the number of system calls by orders of magnitude.
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

      <InfoBox variant="warning" title="Serialization Security">
        <p>
          Java serialization has known security vulnerabilities and is considered a legacy
          feature. For new projects, prefer JSON (using Jackson or Gson), XML, or Protocol
          Buffers for data interchange. If you must use Java serialization, always define a{' '}
          <code>serialVersionUID</code>, use <code>transient</code> for sensitive fields, and
          consider implementing custom <code>readObject</code>/<code>writeObject</code> methods
          for validation.
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
