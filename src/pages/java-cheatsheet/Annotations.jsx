import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JavaCAnnotations() {
  return (
    <LessonLayout
      title="Annotations Cheat Sheet"
      sectionId="java-cheatsheet"
      lessonIndex={4}
      prev={{ path: "/java-cheatsheet/concurrency", label: "Concurrency Cheat Sheet" }}
      next={{ path: "/react-cheatsheet/hooks", label: "React Hooks Cheat Sheet" }}
    >
      <p>Quick reference for essential Java and Spring Boot annotations.</p>

      <h2>Java Core Annotations</h2>
      <CodeBlock language="java" title="Java Annotations Reference">
{`// === JAVA BUILT-INS ===
@Override        // compiler checks you're actually overriding a supertype method
@Deprecated      // marks API as obsolete; use @deprecated in javadoc for replacement
@SuppressWarnings("unchecked")  // suppress specific compiler warnings
@FunctionalInterface  // verifies interface has exactly one abstract method
@SafeVarargs     // suppresses heap pollution warnings for varargs with generics

// === LOMBOK ===
@Data            // @Getter + @Setter + @EqualsAndHashCode + @ToString + @RequiredArgsConstructor
@Value           // immutable @Data — all fields final, no setters
@Builder         // generates builder pattern
@Slf4j           // injects: private static final Logger log = LoggerFactory.getLogger(...)
@NoArgsConstructor
@AllArgsConstructor
@RequiredArgsConstructor  // constructor for final / @NonNull fields

// === SPRING CORE ===
@Component       // generic Spring-managed bean
@Service         // business logic layer (same as @Component, semantic hint)
@Repository      // data access layer — wraps checked exceptions to DataAccessException
@Controller      // MVC controller (returns view names)
@RestController  // @Controller + @ResponseBody — returns JSON/XML
@Configuration   // class contains @Bean definitions
@Bean            // method produces a bean managed by Spring container
@Primary         // preferred bean when multiple candidates exist
@Qualifier("name") // specify which bean to inject when multiple exist
@Lazy            // delay bean initialization until first use
@Scope("prototype") // new instance per injection (default: singleton)

// === SPRING DI ===
@Autowired       // inject by type (prefer constructor injection over this)
@Value("\${app.timeout:5000}") // inject property value with default
@ConfigurationProperties(prefix="app") // bind properties to a class

// === SPRING WEB ===
@RequestMapping("/api/users")
@GetMapping @PostMapping @PutMapping @PatchMapping @DeleteMapping
@PathVariable @RequestParam @RequestBody @RequestHeader
@ResponseStatus(HttpStatus.CREATED)
@ResponseBody @Valid @Validated
@CrossOrigin(origins = "https://myfrontend.com")

// === SPRING DATA ===
@Entity @Table(name="users") @Id @GeneratedValue
@Column(nullable=false, unique=true, length=255)
@OneToMany @ManyToOne @ManyToMany @JoinColumn
@Transactional @Transactional(readOnly=true)

// === SPRING SECURITY ===
@EnableWebSecurity @EnableMethodSecurity
@PreAuthorize("hasRole('ADMIN')") @PostAuthorize
@Secured("ROLE_ADMIN")

// === VALIDATION ===
@NotNull @NotBlank @NotEmpty
@Size(min=2, max=50) @Length
@Min(0) @Max(100) @Positive @PositiveOrZero
@Email @Pattern(regexp="...") @URL
@Past @Future @PastOrPresent`}
      </CodeBlock>

      <InfoBox variant="tip" title="Annotation Best Practices">
        <p>Prefer constructor injection over @Autowired on fields — it makes dependencies explicit and enables immutability. Use @Transactional(readOnly=true) for query methods — it skips dirty checking and optimizes performance. Use @Valid on controller method params to trigger Bean Validation automatically.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between @Component, @Service, and @Repository?"
        options={["They have different performance characteristics", "They are functionally identical but carry semantic meaning; @Repository additionally translates persistence exceptions", "They scan different package paths", "@Service adds transaction management automatically"]}
        correctIndex={1}
        explanation="All three register a class as a Spring bean. Semantically: @Component is generic, @Service marks business logic, @Repository marks data access. Functionally, @Repository adds an extra behavior: it wraps technology-specific exceptions (JPA, JDBC) into Spring's unified DataAccessException hierarchy."
      />

    </LessonLayout>
  );
}
