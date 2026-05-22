import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Data() {
  return (
    <LessonLayout
      title="Spring Data & JPA"
      sectionId="springboot"
      lessonIndex={4}
      prev={{ path: '/springboot/rest', label: 'Building REST APIs' }}
      next={{ path: '/springboot/security', label: 'Spring Security & Auth' }}
    >
      <h2>Persistence with Spring Data JPA</h2>
      <p>
        Spring Data JPA provides a powerful abstraction over JPA (Java Persistence API) and
        Hibernate. It eliminates boilerplate data access code by generating repository
        implementations at runtime from simple interface definitions. You define the
        interface, Spring provides the implementation.
      </p>

      <FlowChart
        title="Entity Relationship Example"
        chart={"graph TD\nA[User Entity] -->|OneToMany| B[Post Entity]\nB -->|ManyToOne| A\nB -->|ManyToMany| C[Tag Entity]\nC -->|ManyToMany| B\nA -->|OneToOne| D[Profile Entity]\nD -->|OneToOne| A"}
      />

      <h3>Defining JPA Entities</h3>
      <p>
        A JPA entity is a plain Java class mapped to a database table. Each instance of the
        entity represents a row in that table. You use annotations like <code>@Entity</code>,
        <code>@Table</code>, <code>@Id</code>, and <code>@Column</code> to control the mapping.
      </p>

      <CodeBlock language="java" title="User.java">
{`@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL,
               orphanRemoval = true)
    private List<Post> posts = new ArrayList<>();

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "profile_id")
    private Profile profile;

    // Constructors, getters, setters omitted for brevity
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Post.java">
{`@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToMany
    @JoinTable(
        name = "post_tags",
        joinColumns = @JoinColumn(name = "post_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    @CreationTimestamp
    private LocalDateTime createdAt;
}`}
      </CodeBlock>

      <h3>Repository Interfaces</h3>
      <p>
        Spring Data JPA generates repository implementations automatically. You just define
        an interface extending <code>JpaRepository</code> and Spring creates the implementation
        at runtime, including methods for CRUD operations, pagination, and sorting.
      </p>

      <CodeBlock language="java" title="UserRepository.java">
{`@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring generates the query from the method name
    Optional<User> findByEmail(String email);

    List<User> findByDisplayNameContainingIgnoreCase(String name);

    boolean existsByEmail(String email);

    // Custom JPQL query
    @Query("SELECT u FROM User u WHERE u.createdAt >= :since")
    List<User> findRecentUsers(@Param("since") LocalDateTime since);

    // Native SQL query
    @Query(value = "SELECT * FROM users WHERE email LIKE %:domain",
           nativeQuery = true)
    List<User> findByEmailDomain(@Param("domain") String domain);

    // Pagination support
    Page<User> findByDisplayNameContaining(String name, Pageable pageable);

    // Modifying queries
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.displayName = :name WHERE u.id = :id")
    int updateDisplayName(@Param("id") Long id,
                          @Param("name") String name);
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Query Method Naming Convention">
        <p>
          Spring Data derives queries from method names. The pattern is
          <code>findBy + PropertyName + Condition</code>. Examples:
          <code>findByEmailAndActive</code>, <code>findByCreatedAtAfter</code>,
          <code>findByTitleContainingOrderByCreatedAtDesc</code>. For complex queries,
          use <code>@Query</code> with JPQL or native SQL instead of extremely long method names.
        </p>
      </InfoBox>

      <h3>Using Repositories in Services</h3>

      <CodeBlock language="java" title="UserService.java">
{`@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Page<UserDTO> findAll(Pageable pageable) {
        return userRepository.findAll(pageable)
            .map(this::toDTO);
    }

    public Optional<UserDTO> findById(Long id) {
        return userRepository.findById(id).map(this::toDTO);
    }

    @Transactional
    public UserDTO create(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateEmailException(request.email());
        }
        User user = new User();
        user.setEmail(request.email());
        user.setDisplayName(request.displayName());
        user.setPassword(passwordEncoder.encode(request.password()));
        return toDTO(userRepository.save(user));
    }

    private UserDTO toDTO(User user) {
        return new UserDTO(
            user.getId(), user.getEmail(),
            user.getDisplayName(), user.getCreatedAt()
        );
    }
}`}
      </CodeBlock>

      <InteractiveChallenge
        question="What does JpaRepository provide out of the box?"
        options={[
          "Only custom queries defined by @Query annotations",
          "CRUD operations, pagination, sorting, and query derivation from method names",
          "Automatic REST endpoint generation",
          "Database migration management"
        ]}
        correctIndex={1}
        explanation="JpaRepository extends PagingAndSortingRepository and CrudRepository, providing built-in methods for save, findById, findAll, delete, count, and existsById, plus pagination and sorting support. Spring Data also derives query implementations from method names you define in the interface."
      />
    </LessonLayout>
  );
}
