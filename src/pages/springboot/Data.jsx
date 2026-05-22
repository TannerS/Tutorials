import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SpringData() {
  return (
    <LessonLayout
      title="Spring Data JPA"
      sectionId="springboot"
      lessonIndex={4}
      prev={{ path: "/springboot/rest", label: "Building REST APIs" }}
      next={{ path: "/springboot/security", label: "Spring Security" }}
    >
      <p>Spring Data JPA makes database access trivial — define an interface, and Spring generates the implementation automatically.</p>

      <h2>Entity Definition</h2>
      <CodeBlock language="java" title="JPA Entity">
{`import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // One User has many Orders
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();

    @PrePersist
    void prePersist() { this.createdAt = LocalDateTime.now(); }

    // constructors, getters, setters...
}`}
      </CodeBlock>

      <h2>JpaRepository</h2>
      <CodeBlock language="java" title="Repository Interface">
{`import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

// Extend JpaRepository<EntityType, IdType>
// Spring auto-implements: findAll, findById, save, delete, count, exists...
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Derived query method — Spring generates SQL from method name
    Optional<User> findByEmail(String email);
    List<User> findByNameContainingIgnoreCase(String name);
    List<User> findByAgeBetween(int min, int max);
    boolean existsByEmail(String email);
    long countByActiveTrue();

    // Custom JPQL query
    @Query("SELECT u FROM User u WHERE u.email LIKE %:domain%")
    List<User> findByEmailDomain(@Param("domain") String domain);

    // Native SQL query
    @Query(value = "SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days'",
           nativeQuery = true)
    List<User> findRecentUsers();

    // Pagination
    Page<User> findByActiveTrue(Pageable pageable);
}`}
      </CodeBlock>

      <h2>Service Layer with Transactions</h2>
      <CodeBlock language="java" title="Service with @Transactional">
{`@Service
@Transactional(readOnly = true)  // default: read-only for performance
public class UserService {
    private final UserRepository userRepo;

    public UserService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    public List<User> findAll() { return userRepo.findAll(); }

    public Optional<User> findById(Long id) { return userRepo.findById(id); }

    @Transactional  // overrides class-level: this method is read-write
    public User create(CreateUserRequest req) {
        if (userRepo.existsByEmail(req.email()))
            throw new DuplicateEmailException(req.email());
        User user = new User(req.email(), req.name());
        return userRepo.save(user);
    }

    @Transactional
    public void delete(Long id) {
        userRepo.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
        userRepo.deleteById(id);
    }

    // Pagination example
    public Page<User> findPage(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name"));
        return userRepo.findByActiveTrue(pageable);
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="N+1 Problem">
        <p>Be careful with LAZY loading in collections. Accessing a LAZY collection outside a transaction triggers one query per parent record. Use @EntityGraph or JOIN FETCH in your JPQL to load associations eagerly when needed.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What does @Transactional(readOnly = true) do?"
        options={["Prevents any database reads", "Optimizes the transaction for read-only operations — no write-lock overhead", "Makes the method return null for writes", "It is equivalent to @Cacheable"]}
        correctIndex={1}
        explanation="readOnly=true hints to the JPA provider and database that no writes will occur. Hibernate skips dirty checking (comparing entity state), and some databases use more efficient read-only transactions. Use it as the default at the class level, then override with @Transactional on write methods."
      />
    </LessonLayout>
  );
}
