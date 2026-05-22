import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Testing() {
  return (
    <LessonLayout
      title="Testing in Spring Boot"
      sectionId="springboot"
      lessonIndex={6}
      prev={{ path: '/springboot/security', label: 'Spring Security & Auth' }}
      next={{ path: '/springboot/config', label: 'Configuration & Profiles' }}
    >
      <h2>Testing Strategies in Spring Boot</h2>
      <p>
        Spring Boot provides excellent testing support through <code>spring-boot-starter-test</code>,
        which bundles JUnit 5, Mockito, AssertJ, Spring Test, and MockMvc. A good testing
        strategy uses a pyramid approach — many fast unit tests, fewer integration tests, and
        a small number of end-to-end tests.
      </p>

      <FlowChart
        title="Testing Pyramid"
        chart={"graph TD\nA[E2E Tests - Few, Slow, High Confidence] --> B[Integration Tests - @SpringBootTest, @WebMvcTest]\nB --> C[Unit Tests - Fast, Isolated, Many]\nC --> D[Foundation: Mocks and Stubs]"}
      />

      <h3>Unit Testing Services</h3>
      <p>
        Unit tests for service classes should be fast and isolated. Use Mockito to mock
        dependencies so you are testing only the logic within the service itself, not the
        behavior of its collaborators.
      </p>

      <CodeBlock language="java" title="UserServiceTest.java">
{`@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void createUser_WithValidData_ReturnsUserDTO() {
        // Arrange
        CreateUserRequest request = new CreateUserRequest(
            "john@example.com", "password123", "John Doe");

        when(userRepository.existsByEmail("john@example.com"))
            .thenReturn(false);
        when(passwordEncoder.encode("password123"))
            .thenReturn("encoded_password");
        when(userRepository.save(any(User.class)))
            .thenAnswer(invocation -> {
                User saved = invocation.getArgument(0);
                saved.setId(1L);
                return saved;
            });

        // Act
        UserDTO result = userService.create(request);

        // Assert
        assertThat(result.email()).isEqualTo("john@example.com");
        assertThat(result.displayName()).isEqualTo("John Doe");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_WithDuplicateEmail_ThrowsException() {
        CreateUserRequest request = new CreateUserRequest(
            "existing@example.com", "password123", "Jane");

        when(userRepository.existsByEmail("existing@example.com"))
            .thenReturn(true);

        assertThatThrownBy(() -> userService.create(request))
            .isInstanceOf(DuplicateEmailException.class)
            .hasMessageContaining("existing@example.com");

        verify(userRepository, never()).save(any());
    }
}`}
      </CodeBlock>

      <h3>Testing Controllers with @WebMvcTest</h3>
      <p>
        <code>@WebMvcTest</code> loads only the web layer — your controller, filters, and
        Spring MVC configuration — while mocking the service layer. This makes tests faster
        than a full <code>@SpringBootTest</code> while still verifying HTTP behavior.
      </p>

      <CodeBlock language="java" title="UserControllerTest.java">
{`@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getAllUsers_ReturnsUserList() throws Exception {
        List<UserDTO> users = List.of(
            new UserDTO(1L, "john@test.com", "John",
                        LocalDateTime.now()),
            new UserDTO(2L, "jane@test.com", "Jane",
                        LocalDateTime.now())
        );
        when(userService.findAll()).thenReturn(users);

        mockMvc.perform(get("/api/users")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].email").value("john@test.com"))
            .andExpect(jsonPath("$[1].displayName").value("Jane"));
    }

    @Test
    void createUser_WithValidData_Returns201() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
            "new@test.com", "password123", "New User");
        UserDTO response = new UserDTO(
            3L, "new@test.com", "New User", LocalDateTime.now());

        when(userService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("new@test.com"));
    }

    @Test
    void getUserById_WhenNotFound_Returns404() throws Exception {
        when(userService.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/999"))
            .andExpect(status().isNotFound());
    }
}`}
      </CodeBlock>

      <h3>Integration Tests with @SpringBootTest</h3>
      <p>
        Integration tests load the full application context and test multiple layers together.
        Use <code>@SpringBootTest</code> with a test database (like H2) to verify that your
        components work correctly when wired together.
      </p>

      <CodeBlock language="java" title="UserIntegrationTest.java">
{`@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Transactional
class UserIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void fullUserLifecycle() throws Exception {
        // Create
        String createJson = objectMapper.writeValueAsString(
            new CreateUserRequest("integration@test.com",
                                  "password123", "Test User"));

        String response = mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(createJson))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        Long userId = objectMapper.readTree(response).get("id").asLong();

        // Read
        mockMvc.perform(get("/api/users/" + userId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("integration@test.com"));

        // Verify in database
        assertThat(userRepository.findByEmail("integration@test.com"))
            .isPresent();
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Testing Best Practices">
        <p>
          Use <code>@WebMvcTest</code> for controller tests (fast, focused on HTTP).
          Use <code>@DataJpaTest</code> for repository tests (auto-configures an embedded DB).
          Reserve <code>@SpringBootTest</code> for integration tests that need the full context.
          Always use <code>@Transactional</code> in integration tests so each test gets a
          clean database state through automatic rollback.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between @MockBean and @Mock?"
        options={[
          "They are identical and interchangeable",
          "@MockBean is for Spring context (replaces a bean); @Mock is for plain Mockito unit tests",
          "@Mock works with Spring; @MockBean does not",
          "@MockBean creates real instances; @Mock creates fakes"
        ]}
        correctIndex={1}
        explanation="@MockBean is a Spring Boot test annotation that creates a Mockito mock and registers it in the Spring ApplicationContext, replacing any existing bean of that type. @Mock is a plain Mockito annotation for unit tests that don't load the Spring context at all. Use @MockBean with @WebMvcTest/@SpringBootTest and @Mock with @ExtendWith(MockitoExtension.class)."
      />
    </LessonLayout>
  );
}
