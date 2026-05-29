import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Annotations() {
  return (
    <LessonLayout
      title="Annotations & Common APIs"
      sectionId="java-cheatsheet"
      lessonIndex={4}
      prev={{ path: '/java-cheatsheet/concurrency', label: 'Concurrency Quick Ref' }}
      next={null}
    >
      {/* ───── CORE ANNOTATIONS ───── */}
      <h2>Core Java Annotations</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '6px' }}>Annotation</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Target</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Purpose</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['@Override', 'Method', 'Compile-time check that method overrides superclass/interface'],
            ['@Deprecated', 'Any', 'Marks element as deprecated; IDE warns on usage'],
            ['@SuppressWarnings', 'Any', 'Suppresses compiler warnings ("unchecked", "deprecation")'],
            ['@FunctionalInterface', 'Interface', 'Enforces exactly one abstract method (SAM)'],
            ['@SafeVarargs', 'Method/Constructor', 'Suppresses heap pollution warnings on generic varargs'],
          ].map(([ann, target, purpose]) => (
            <tr key={ann} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '6px', fontFamily: 'monospace', color: '#5b9cf6' }}>{ann}</td>
              <td style={{ padding: '6px' }}>{target}</td>
              <td style={{ padding: '6px' }}>{purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <CodeBlock language="java" title="Usage examples">{
`@Override
public String toString() { return "MyClass"; }

@Deprecated(since = "1.5", forRemoval = true)
public void oldMethod() { }

@SuppressWarnings({"unchecked", "deprecation"})
public void legacyCode() { }

@FunctionalInterface
interface Transformer<T, R> {
    R transform(T input);
    // Only ONE abstract method allowed
}`
      }</CodeBlock>

      {/* ───── CUSTOM ANNOTATIONS ───── */}
      <h2>Custom Annotations</h2>
      <CodeBlock language="java" title="Defining and using custom annotations">{
`// Define
@Retention(RetentionPolicy.RUNTIME)   // available via reflection
@Target(ElementType.METHOD)           // only on methods
@Documented                           // included in Javadoc
public @interface Cacheable {
    String key() default "";
    int ttlSeconds() default 300;
    boolean enabled() default true;
}

// Use
@Cacheable(key = "users", ttlSeconds = 600)
public List<User> getUsers() { /* ... */ }

// Read via reflection
Method m = MyClass.class.getMethod("getUsers");
if (m.isAnnotationPresent(Cacheable.class)) {
    Cacheable c = m.getAnnotation(Cacheable.class);
    System.out.println(c.key());         // "users"
    System.out.println(c.ttlSeconds());  // 600
}`
      }</CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginTop: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '6px' }}>Meta-Annotation</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Values</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['@Retention', 'SOURCE (compile only), CLASS (default), RUNTIME (reflection)'],
            ['@Target', 'TYPE, METHOD, FIELD, PARAMETER, CONSTRUCTOR, LOCAL_VARIABLE, etc.'],
            ['@Documented', 'Include in generated Javadoc'],
            ['@Inherited', 'Subclasses inherit the annotation'],
            ['@Repeatable', 'Can apply same annotation multiple times'],
          ].map(([ann, vals]) => (
            <tr key={ann} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '6px', fontFamily: 'monospace', color: '#5b9cf6' }}>{ann}</td>
              <td style={{ padding: '6px' }}>{vals}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ───── SPRING ANNOTATIONS ───── */}
      <h2>Spring Annotations Cheat Sheet</h2>
      <FlowChart
        title="Spring Stereotype Hierarchy"
        chart={"graph TD\n  Component[@Component]-->Service[@Service]\n  Component-->Repository[@Repository]\n  Component-->Controller[@Controller]\n  Controller-->RestController[@RestController]"}
      />

      <h3>Stereotype &amp; DI</h3>
      <CodeBlock language="java" title="Component scanning and injection">{
`@Component          // Generic Spring-managed bean
@Service            // Business logic layer
@Repository         // Data access layer (translates DB exceptions)
@Controller         // MVC controller (returns views)
@RestController     // @Controller + @ResponseBody on every method

// Dependency Injection
@Autowired                        // Field/constructor/setter injection
@Qualifier("beanName")            // Disambiguate when multiple beans match
@Primary                          // Default bean when multiple candidates
@Lazy                             // Initialize on first use, not startup

// Constructor injection (preferred — no @Autowired needed if single constructor)
@Service
public class UserService {
    private final UserRepo repo;
    public UserService(UserRepo repo) { this.repo = repo; }
}`
      }</CodeBlock>

      <h3>Configuration</h3>
      <CodeBlock language="java" title="Bean definitions and config">{
`@Configuration            // Declares a config class with @Bean methods
@Bean                     // Method-level: registers return value as bean
@Bean("customName")       // Named bean

@Value("\${app.name}")     // Inject property value
@Value("\${app.port:8080}") // With default

@Profile("dev")           // Activate bean only for "dev" profile
@Conditional(OnProperty.class)  // Conditional bean registration

@ConfigurationProperties(prefix = "app")
public class AppConfig {
    private String name;   // binds to app.name
    private int port;      // binds to app.port
}`
      }</CodeBlock>

      <h3>Web / REST</h3>
      <CodeBlock language="java" title="Request mapping annotations">{
`@RequestMapping("/api")            // Base path (class-level)
@GetMapping("/users")              // GET /api/users
@PostMapping("/users")             // POST
@PutMapping("/users/{id}")         // PUT
@DeleteMapping("/users/{id}")      // DELETE
@PatchMapping("/users/{id}")       // PATCH

// Parameter annotations
@PathVariable Long id              // /users/{id}
@RequestParam String name          // ?name=value
@RequestParam(defaultValue = "0") int page
@RequestBody UserDto dto           // JSON request body
@RequestHeader("Authorization") String auth

// Response
@ResponseStatus(HttpStatus.CREATED)
@ResponseBody                      // Serialize return value as JSON

// Validation
@Valid @RequestBody UserDto dto    // Triggers JSR-380 validation
@Validated                         // Spring variant (supports groups)`
      }</CodeBlock>

      <h3>Transaction &amp; Data</h3>
      <CodeBlock language="java" title="Transactional annotations">{
`@Transactional                              // Method/class level
@Transactional(readOnly = true)             // Optimization for reads
@Transactional(propagation = Propagation.REQUIRES_NEW)
@Transactional(isolation = Isolation.SERIALIZABLE)
@Transactional(rollbackFor = Exception.class)
@Transactional(timeout = 30)

// Caching
@EnableCaching
@Cacheable("users")                // Cache method result
@CacheEvict("users")              // Clear cache entry
@CachePut("users")                // Update cache

// Scheduling
@EnableScheduling
@Scheduled(fixedRate = 5000)       // Every 5s
@Scheduled(cron = "0 0 * * * *")   // Every hour
@Async                             // Run in separate thread`
      }</CodeBlock>

      {/* ───── JPA ANNOTATIONS ───── */}
      <h2>JPA Annotations</h2>
      <CodeBlock language="java" title="Entity mapping">{
`@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_name", nullable = false, length = 100)
    private String username;

    @Column(unique = true)
    private String email;

    @Enumerated(EnumType.STRING)        // Store enum as string
    private Role role;

    @Temporal(TemporalType.TIMESTAMP)   // Legacy Date mapping
    private Date createdAt;

    @Transient                          // Not persisted
    private String tempData;

    // Relationships
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_id")
    private Department department;

    @ManyToMany
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "profile_id")
    private Profile profile;
}`
      }</CodeBlock>

      <InfoBox variant="tip" title="Fetch Strategy">
        <code>@OneToMany</code> and <code>@ManyToMany</code> default to <code>LAZY</code>.
        <code>@ManyToOne</code> and <code>@OneToOne</code> default to <code>EAGER</code>.
        Almost always use LAZY and fetch explicitly with JOIN FETCH queries.
      </InfoBox>

      {/* ───── LOMBOK ───── */}
      <h2>Lombok Annotations</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '6px' }}>Annotation</th>
            <th style={{ textAlign: 'left', padding: '6px' }}>Generates</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['@Getter / @Setter', 'Getter/setter methods for fields'],
            ['@ToString', 'toString() from all fields'],
            ['@EqualsAndHashCode', 'equals() and hashCode() from all fields'],
            ['@NoArgsConstructor', 'No-argument constructor'],
            ['@AllArgsConstructor', 'Constructor with all fields'],
            ['@RequiredArgsConstructor', 'Constructor for final / @NonNull fields'],
            ['@Data', '@Getter + @Setter + @ToString + @EqualsAndHashCode + @RequiredArgsConstructor'],
            ['@Value', 'Immutable @Data (all fields final, no setters)'],
            ['@Builder', 'Builder pattern implementation'],
            ['@Slf4j', 'private static final Logger log = LoggerFactory.getLogger(...)'],
            ['@With', 'withField() methods that return a copy with one field changed'],
          ].map(([ann, gen]) => (
            <tr key={ann} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '6px', fontFamily: 'monospace', color: '#5b9cf6' }}>{ann}</td>
              <td style={{ padding: '6px' }}>{gen}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <CodeBlock language="java" title="Lombok in action">{
`@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
}

// Usage
UserDto user = UserDto.builder()
    .id(1L)
    .name("Alice")
    .email("alice@example.com")
    .build();

user.getName();     // generated getter
user.setEmail("new@example.com");  // generated setter`
      }</CodeBlock>

      <InfoBox variant="warning" title="Lombok + JPA Pitfalls">
        Avoid <code>@Data</code> on JPA entities — <code>@EqualsAndHashCode</code> with lazy-loaded
        fields triggers unintended fetches. Use <code>@Getter</code> + <code>@Setter</code> and write
        custom equals/hashCode using only the <code>@Id</code> field.
      </InfoBox>

      {/* ───── COMMON APIs ───── */}
      <h2>Common APIs Quick Ref</h2>

      <h3>Files &amp; Path (java.nio.file)</h3>
      <CodeBlock language="java" title="File I/O">{
`// Path
Path p = Path.of("data", "file.txt");   // data/file.txt
Path abs = p.toAbsolutePath();
p.getFileName()     // file.txt
p.getParent()       // data
p.resolve("sub")    // data/file.txt/sub
p.resolveSibling("other.txt") // data/other.txt

// Read/Write
String content = Files.readString(Path.of("file.txt"));
List<String> lines = Files.readAllLines(path);
byte[] bytes = Files.readAllBytes(path);

Files.writeString(path, "content");
Files.write(path, lines);
Files.write(path, bytes);

// Stream lines (lazy, for large files)
try (Stream<String> lines = Files.lines(path)) {
    lines.filter(l -> l.contains("ERROR")).forEach(System.out::println);
}

// Directory ops
Files.createDirectories(Path.of("a/b/c"));
Files.exists(path);    Files.isDirectory(path);
Files.copy(src, dst, StandardCopyOption.REPLACE_EXISTING);
Files.move(src, dst);  Files.delete(path);

// Walk directory tree
try (Stream<Path> tree = Files.walk(dir)) {
    tree.filter(Files::isRegularFile)
        .filter(p -> p.toString().endsWith(".java"))
        .forEach(System.out::println);
}`
      }</CodeBlock>

      <h3>Date/Time API (java.time)</h3>
      <CodeBlock language="java" title="Modern date/time">{
`// Current
LocalDate today = LocalDate.now();            // 2024-01-15
LocalTime now = LocalTime.now();              // 14:30:00
LocalDateTime ldt = LocalDateTime.now();      // 2024-01-15T14:30:00
ZonedDateTime zdt = ZonedDateTime.now();      // ...+01:00[Europe/London]
Instant instant = Instant.now();              // epoch-based

// Create
LocalDate date = LocalDate.of(2024, 1, 15);
LocalDate parsed = LocalDate.parse("2024-01-15");

// Manipulate (immutable — returns new instance)
date.plusDays(7)         date.minusMonths(1)
date.withYear(2025)      date.withDayOfMonth(1)

// Query
date.getDayOfWeek()      // DayOfWeek.MONDAY
date.getMonth()          // Month.JANUARY
date.isLeapYear()
date.isBefore(otherDate)

// Period & Duration
Period p = Period.between(start, end);        // years/months/days
Duration d = Duration.between(startTime, endTime); // hours/minutes/seconds
Duration.ofMinutes(30)
Period.ofWeeks(2)

// Format
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm");
String s = ldt.format(fmt);              // "01/15/2024 14:30"
LocalDateTime back = LocalDateTime.parse(s, fmt);

// Predefined formatters
DateTimeFormatter.ISO_LOCAL_DATE       // 2024-01-15
DateTimeFormatter.ISO_DATE_TIME        // 2024-01-15T14:30:00`
      }</CodeBlock>

      {/* ───── CHALLENGES ───── */}
      <InteractiveChallenge
        question={"Which Lombok annotation should you AVOID on JPA @Entity classes?"}
        options={["@Getter", "@Setter", "@Data", "@Builder"]}
        correctIndex={2}
        explanation={"@Data generates equals/hashCode using all fields, which can trigger lazy-loading of relationships and cause issues with JPA proxies. Use @Getter/@Setter separately and write custom equals/hashCode based on the @Id field only."}
        language="java"
      />

      <InteractiveChallenge
        question={"What does @Transactional(readOnly = true) do?"}
        options={[
          "Prevents any database queries from executing",
          "Allows the persistence provider to apply read optimizations",
          "Makes the method return null if an exception occurs",
          "Disables dirty checking but still writes on flush"
        ]}
        correctIndex={1}
        explanation={"readOnly=true hints to the persistence provider (e.g., Hibernate) that no writes will occur, allowing it to skip dirty checking, use read-only transactions at the DB level, and potentially route to read replicas."}
        language="java"
      />
    </LessonLayout>
  );
}

export default function AnnotationsPage() {
  return <Annotations />;
}
