import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SpringTesting() {
  return (
    <LessonLayout
      title="Testing Spring Apps"
      sectionId="springboot"
      lessonIndex={6}
      prev={{ path: "/springboot/security", label: "Spring Security" }}
      next={{ path: "/springboot/config", label: "Configuration" }}
    >
      <p>Spring Boot provides excellent testing support with sliced test annotations that load only relevant parts of the context, making tests fast and focused.</p>

      <h2>Testing Layers</h2>
      <FlowChart
        title="Spring Boot Test Slices"
        chart={"graph TD\n  A[@SpringBootTest] --> B[Full context - slow]\n  C[@WebMvcTest] --> D[Web layer only - fast]\n  E[@DataJpaTest] --> F[JPA layer only - fast]\n  G[@JsonTest] --> H[JSON serialization only]\n  I[Unit Tests] --> J[No Spring context - fastest]"}
      />

      <h2>Unit Tests (No Spring)</h2>
      <CodeBlock language="java" title="Plain Unit Tests with Mockito">
{`import org.junit.jupiter.api.*;
import org.mockito.*;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    UserRepository userRepo;

    @Mock
    EmailValidator validator;

    @InjectMocks
    UserService userService;

    @Test
    void createUser_validInput_savesAndReturns() {
        // Arrange
        var req = new CreateUserRequest("alice@example.com", "Alice", 25);
        when(validator.isValid("alice@example.com")).thenReturn(true);
        when(userRepo.existsByEmail(anyString())).thenReturn(false);
        when(userRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Act
        User result = userService.create(req);

        // Assert
        assertThat(result.getEmail()).isEqualTo("alice@example.com");
        verify(userRepo).save(any(User.class));
    }

    @Test
    void createUser_duplicateEmail_throwsException() {
        when(userRepo.existsByEmail("dup@test.com")).thenReturn(true);
        assertThatThrownBy(() -> userService.create(new CreateUserRequest("dup@test.com","Name",20)))
            .isInstanceOf(DuplicateEmailException.class);
    }
}`}
      </CodeBlock>

      <h2>@WebMvcTest — Controller Tests</h2>
      <CodeBlock language="java" title="MockMvc Tests">
{`@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean  UserService userService; // @MockBean adds mock to Spring context

    @Test
    void getUser_exists_returns200() throws Exception {
        var dto = new UserDTO(1L, "alice@test.com", "Alice", 25);
        when(userService.findById(1L)).thenReturn(Optional.of(dto));

        mockMvc.perform(get("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("alice@test.com"))
            .andExpect(jsonPath("$.name").value("Alice"));
    }

    @Test
    void createUser_validBody_returns201() throws Exception {
        var req = new CreateUserRequest("new@test.com", "New User", 30);
        var dto = new UserDTO(5L, "new@test.com", "New User", 30);
        when(userService.create(any())).thenReturn(dto);

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", containsString("/api/users/5")));
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="@DataJpaTest">
        <p>Use @DataJpaTest for repository tests. It configures an in-memory H2 database, scans @Entity and @Repository classes only, and wraps each test in a transaction that rolls back automatically.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between @Mock and @MockBean?"
        options={["They are identical", "@Mock is Mockito only; @MockBean creates a mock and registers it in the Spring ApplicationContext", "@MockBean is for integration tests only", "@Mock is for Spring, @MockBean is for Mockito"]}
        correctIndex={1}
        explanation="@Mock (Mockito) creates a mock but does not interact with Spring. @MockBean (Spring Boot Test) creates a mock AND replaces or adds a bean in the Spring ApplicationContext, allowing @Autowired components to receive the mock."
      />
    </LessonLayout>
  );
}
