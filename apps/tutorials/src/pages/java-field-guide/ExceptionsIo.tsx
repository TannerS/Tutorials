import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideJavaExceptionsIo() {
  return (
    <PosterLayout
      accent="amber"
      eyebrow="Java · Field Reference"
      title="Exceptions & I/O"
      tagline="Checked vs unchecked, custom exception hierarchies, and the NIO.2 file API that replaced java.io — condensed for offline study."
      meta={['Java 21+', '12 patterns']}
      footerLabel="Personal study reference — Java"
      pageLabel="Java Field Guide · Exceptions & I/O"
      prev={{ path: '/java-field-guide/collections-streams', label: 'Collections & Streams' }}
      next={{ path: '/java-field-guide/concurrency', label: 'Concurrency & Virtual Threads' }}
    >
      <PosterCard
        glyph="Hi"
        title={<>Exception Hierarchy<span className="dim"> — checked vs unchecked</span></>}
        language="java"
        code={`Throwable
├── Error                    // OutOfMemoryError — don't catch
└── Exception
    ├── IOException           // CHECKED — compiler forces catch/throws
    ├── SQLException           // CHECKED
    └── RuntimeException
        ├── NullPointerException      // UNCHECKED
        └── IllegalArgumentException  // UNCHECKED`}
        caption="Checked exceptions (Exception minus RuntimeException) are for conditions a caller can reasonably recover from — the compiler enforces handling. Unchecked (RuntimeException) usually signal a programming bug, so the compiler doesn't force a catch."
      />

      <PosterCard
        glyph="Mc"
        title={<>Multi-catch<span className="dim"> — Java 7+</span></>}
        language="java"
        code={`try {
    int[] nums = {1, 2, 3};
    System.out.println(nums[5]);
} catch (ArrayIndexOutOfBoundsException e) {
    // most specific first
} catch (RuntimeException e) {
    // broader fallback
}

// one block, unrelated types
catch (NullPointerException | IllegalArgumentException e) {
    System.out.println("Caught: " + e.getClass().getSimpleName());
}`}
        caption="catch clauses are tried top-to-bottom — order most-specific to least-specific, or the broader catch silently swallows the specific one. The pipe form (Java 7+) handles unrelated exception types identically without duplicating the block body."
      />

      <PosterCard
        glyph="Cx"
        title={<>Custom Exceptions<span className="dim"> — checked vs unchecked</span></>}
        language="java"
        code={`// Checked — extends Exception, caller must handle
public class InsufficientFundsException extends Exception {
    public InsufficientFundsException(double amt, double bal) {
        super("Cannot withdraw $" + amt + " — balance is $" + bal);
    }
}

// Unchecked — extends RuntimeException, caller isn't forced to catch
public class InvalidAccountException extends RuntimeException {
    public InvalidAccountException(String id) { super("Not found: " + id); }
}`}
        caption="Model your own exceptions the same way the JDK does: make it checked if the caller has a real recovery path (retry, prompt, fallback), unchecked if it represents a precondition violation the caller shouldn't be expected to catch everywhere."
      />

      <PosterCard
        glyph="Ch"
        title={<>Exception Chaining<span className="dim"> — preserve the cause</span></>}
        language="java"
        code={`public void goodPractice() throws ServiceException {
    try {
        riskyIo();
    } catch (IOException e) {
        // wrap with context, but keep the original as the cause
        throw new ServiceException("Failed to process data", e);
    }
}`}
        caption={<>Passing the original exception as the second constructor argument keeps it reachable via <code>getCause()</code> — losing it (re-throwing a fresh exception with no cause) erases the actual root of the failure from logs and stack traces.</>}
      />

      <PosterCard
        glyph="!!"
        title={<>Never Swallow<span className="dim"> — the empty catch block</span></>}
        language="java"
        code={`// WRONG — one of the worst anti-patterns in Java
try {
    riskyOperation();
} catch (Exception e) {
    // nothing here — error vanishes silently
}

// RIGHT — at minimum, log it; better, handle or rethrow with context
catch (IOException e) {
    log.warn("riskyOperation failed", e);
}`}
        caption="An empty catch block doesn't prevent the error — it just deletes the evidence. The bug still happens; you've only made it undiagnosable in production."
      />

      <PosterCard
        glyph="Rd"
        title={<>Reading Files<span className="dim"> — classic java.io</span></>}
        language="java"
        code={`try (BufferedReader reader = new BufferedReader(new FileReader("data.txt"))) {
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException e) {
    System.out.println("Error reading file: " + e.getMessage());
}`}
        caption="Always wrap FileReader/FileWriter in a Buffered* class — without it, every readLine()/write() is a separate OS system call. The buffer batches reads/writes and cuts that overhead by orders of magnitude."
      />

      <PosterCard
        glyph="Pt"
        title={<>Path<span className="dim"> — NIO.2, Java 7+</span></>}
        language="java"
        code={`Path filePath = Path.of("data", "example.txt");
Path absPath = Path.of("/home/user/documents/file.txt");

filePath.getFileName();       // example.txt
filePath.getParent();          // data
filePath.toAbsolutePath();
filePath.resolve("child.txt"); // join a segment onto this path`}
        caption="Path replaces java.io.File as the modern representation of a file-system location — it's immutable, composes cleanly with resolve(), and every Files method takes one."
      />

      <PosterCard
        glyph="Rf"
        title={<>Files<span className="dim"> — reading, three ways</span></>}
        language="java"
        code={`String content = Files.readString(Path.of("data.txt"));       // Java 11+, whole file
List<String> lines = Files.readAllLines(Path.of("data.txt"));  // whole file, as a list

// lazy, memory-efficient for large files — MUST be try-with-resources
try (var lineStream = Files.lines(Path.of("data.txt"))) {
    lineStream.filter(l -> !l.isBlank()).forEach(System.out::println);
}`}
        caption={<>readString/readAllLines load the entire file into memory — fine for small files, one-liners. <code>Files.lines()</code> streams lazily instead, but unlike the other two it holds an open file handle, so it MUST be closed via try-with-resources or the handle leaks.</>}
      />

      <PosterCard
        glyph="Wf"
        title={<>Files<span className="dim"> — writing &amp; appending</span></>}
        language="java"
        code={`Files.writeString(Path.of("output.txt"), "Hello NIO.2!");     // overwrites
Files.write(Path.of("lines.txt"), List.of("Line 1", "Line 2"));

Files.writeString(
    Path.of("output.txt"), "\\nAppended", StandardOpenOption.APPEND
);   // without APPEND, this silently overwrites the whole file`}
        caption={<>The default open option is <code>CREATE</code> + <code>TRUNCATE_EXISTING</code> — forgetting <code>StandardOpenOption.APPEND</code> when you meant to append is a quiet way to destroy existing file contents.</>}
      />

      <PosterCard
        glyph="Fs"
        title={<>File System Ops<span className="dim"> — exists, copy, walk</span></>}
        language="java"
        code={`Files.createDirectories(dir);              // creates parents too
Files.exists(file);  Files.isDirectory(dir);
Files.copy(file, copy, StandardCopyOption.REPLACE_EXISTING);
Files.move(copy, moved, StandardCopyOption.REPLACE_EXISTING);

try (var walk = Files.walk(Path.of("."))) {   // recursive, also needs closing
    walk.filter(Files::isRegularFile)
        .filter(p -> p.toString().endsWith(".java"))
        .forEach(System.out::println);
}`}
        caption="copy/move both need REPLACE_EXISTING explicitly or they throw FileAlreadyExistsException — Java won't silently clobber a file for you. Files.walk, like Files.lines, returns a lazy Stream backed by an open resource, so it needs try-with-resources too."
      />

      <PosterCard
        glyph="Sr"
        title={<>Serialization<span className="dim"> — legacy, use with care</span></>}
        language="java"
        code={`public class Person implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
    private transient String password;   // NOT serialized

    // ObjectOutputStream.writeObject(person) to save
    // ObjectInputStream.readObject() to load — password comes back null
}`}
        caption="Java's built-in serialization has known security vulnerabilities (deserializing untrusted data can execute arbitrary code) and is considered legacy — prefer JSON (Jackson/Gson) for new code. If you must use it, always pin serialVersionUID and mark sensitive fields transient."
      />

      <PosterCard
        glyph="Sup"
        title={<>Suppressed exceptions<span className="dim"> — try-with-resources</span></>}
        language="java"
        code={`try (var conn = open()) {
    conn.execute(q);          // throws QueryException
}                             // close() ALSO throws IOException
catch (Exception e) {
    // e is the QueryException — the one you care about.
    for (Throwable s : e.getSuppressed()) { log.warn("close failed", s); }
}
// The manual finally version LOSES the original exception. This doesn't.

// Resources close in REVERSE declaration order.
// Java 9+: an effectively-final resource can be used directly: try (reader) { }

// NEVER return from finally — it discards a propagating exception silently.`}
        caption="If both the body and close() throw, try-with-resources keeps the body's exception as primary and attaches the close failure as suppressed. Hand-written finally blocks throw away the real cause."
      />

      <PosterCard
        glyph="λ!"
        title={<>Checked exceptions in lambdas</>}
        language="java"
        code={`// DOES NOT COMPILE — Function.apply declares no checked exceptions.
paths.stream().map(p -> Files.readString(p)).toList();

// Fix 1 — wrap in the JDK's purpose-built unchecked wrapper.
.map(p -> { try { return Files.readString(p); }
            catch (IOException e) { throw new UncheckedIOException(e); } })

// Fix 2 — extract a helper so the pipeline stays readable.
.map(this::readOrThrow)

// Fix 3 — a plain for loop can declare 'throws IOException'. Often clearest.`}
        caption={<>Checked exceptions compose badly with lambdas, generics, and layer boundaries. Modern frameworks agree: Spring wraps <code>SQLException</code> in unchecked <code>DataAccessException</code>, and the JDK added <code>UncheckedIOException</code>.</>}
      />

      <PosterCard
        glyph="NPE"
        title={<>Fail fast<span className="dim"> — preconditions &amp; helpful NPEs</span></>}
        language="java"
        code={`this.repo = Objects.requireNonNull(repo, "repository");
Objects.checkIndex(i, list.size());
Objects.requireNonNullElseGet(value, this::computeFallback);

// Which unchecked exception says what:
//   IllegalArgumentException  a parameter's VALUE is unacceptable
//   NullPointerException      a parameter was null
//   IllegalStateException     the OBJECT is in the wrong state for this call

// Helpful NPE messages — default since Java 15:
// "Cannot invoke \\"C.getD()\\" because the return value of \\"B.getC()\\" is null"
// Older JVMs: -XX:+ShowCodeDetailsInExceptionMessages`}
        caption="The cheapest exception to debug is the one thrown where bad data entered, not fifteen frames later. Never use exceptions for expected control flow — building one captures the whole stack."
      />

      <PosterCard
        glyph="UTF"
        title={<>Charset<span className="dim"> — UTF-8 default since Java 18</span></>}
        language="java"
        code={`// Before Java 18, FileReader/new String(bytes)/getBytes() used the PLATFORM
// default: windows-1252 on Windows, UTF-8 on Linux. Same code, different bytes.
// JEP 400 made UTF-8 the default everywhere, regardless of OS or locale.

// Explicit is still safest, and works on every version:
Files.readString(path, StandardCharsets.UTF_8);
Files.newBufferedReader(path, StandardCharsets.UTF_8);
text.getBytes(StandardCharsets.UTF_8);

Charset.defaultCharset();       // UTF-8 on Java 18+
// System.out still follows CONSOLE encoding, not the file default.
// Legacy migration escape hatch: -Dfile.encoding=COMPAT`}
        caption="The classic mojibake bug: text written on a developer's Windows laptop reads back wrong on a Linux server. Java 18 removed the cause; passing the charset explicitly removes any doubt."
      />

      <PosterCard
        glyph="Htp"
        title={<>HttpClient<span className="dim"> — Java 11+</span></>}
        language="java"
        code={`// Immutable and thread-safe — create ONE, reuse it.
HttpClient client = HttpClient.newBuilder()
    .version(HttpClient.Version.HTTP_2)
    .connectTimeout(Duration.ofSeconds(5))
    .build();

HttpRequest req = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/orders/42"))
    .header("Accept", "application/json")
    .timeout(Duration.ofSeconds(10))
    .GET().build();

HttpResponse<String> res = client.send(req, BodyHandlers.ofString());
res.statusCode();     // 4xx/5xx do NOT throw — check it yourself

// Stream a big body straight to disk, never buffering it
client.send(req, BodyHandlers.ofFile(Path.of("download.bin")));`}
        caption={<>On Java 21+, prefer the blocking <code>send()</code> on a virtual thread over <code>sendAsync()</code> — same scalability, real stack traces, ordinary try/catch.</>}
      />

      <PosterQuickRef
        title="Which exceptions/I/O tool do I need?"
        rows={[
          { need: 'Caller has a real recovery path', answer: 'checked exception (extends Exception)' },
          { need: 'Programming bug / precondition violation', answer: 'unchecked exception (extends RuntimeException)' },
          { need: 'Preserve the original failure when wrapping', answer: 'pass cause to the exception constructor' },
          { need: 'Auto-close a resource on any exit path', answer: 'try-with-resources' },
          { need: 'Read a whole small file', answer: 'Files.readString / Files.readAllLines' },
          { need: 'Stream a large file lazily', answer: 'Files.lines(...) in try-with-resources' },
          { need: 'Overwrite vs append to a file', answer: 'default overwrites; add StandardOpenOption.APPEND' },
          { need: 'Copy/move without throwing on conflict', answer: 'StandardCopyOption.REPLACE_EXISTING' },
          { need: 'Exclude a field from serialization', answer: 'transient' },
          { need: 'Modern data interchange over Java serialization', answer: 'JSON (Jackson/Gson) — fewer security holes' },
        ]}
      />
    </PosterLayout>
  );
}
