import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SpringSecurity() {
  return (
    <LessonLayout
      title="Spring Security"
      sectionId="springboot"
      lessonIndex={5}
      prev={{ path: "/springboot/data", label: "Spring Data JPA" }}
      next={{ path: "/springboot/testing", label: "Testing Spring Apps" }}
    >
      <p>Spring Security provides authentication (who are you?) and authorization (what can you do?) for Spring Boot applications.</p>

      <FlowChart
        title="Spring Security Filter Chain"
        chart={"graph LR\n  A[HTTP Request] --> B[SecurityFilterChain]\n  B --> C[AuthenticationFilter]\n  C --> D{Authenticated?}\n  D --> |No| E[401 Unauthorized]\n  D --> |Yes| F[AuthorizationFilter]\n  F --> G{Authorized?}\n  G --> |No| H[403 Forbidden]\n  G --> |Yes| I[Controller]"}
      />

      <h2>Security Configuration</h2>
      <CodeBlock language="java" title="SecurityFilterChain">
{`@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // enables @PreAuthorize, @PostAuthorize
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())           // disable for REST APIs
            .sessionManagement(s -> s
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()     // public endpoints
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()                   // everything else: auth
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // cost factor 12
    }
}`}
      </CodeBlock>

      <h2>UserDetailsService</h2>
      <CodeBlock language="java" title="Custom UserDetailsService">
{`@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepo;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepo.findByEmail(email)
            .map(user -> User.withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .build()
            )
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}

// Method-level security with @PreAuthorize
@RestController
public class AdminController {

    @GetMapping("/api/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDTO> getAllUsers() { ... }

    @DeleteMapping("/api/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userSecurity.isOwner(authentication, #id)")
    public void deleteUser(@PathVariable Long id) { ... }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Password Encoding">
        <p>Always store passwords hashed with BCrypt, not plain text or MD5/SHA. BCrypt is slow by design (tunable cost factor) and includes a salt automatically. Never implement your own hashing algorithm.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What HTTP status code should be returned when a user is authenticated but lacks permission?"
        options={["401 Unauthorized", "403 Forbidden", "404 Not Found", "500 Internal Server Error"]}
        correctIndex={1}
        explanation="403 Forbidden means the user is authenticated (we know who they are) but does not have permission to access the resource. 401 Unauthorized means the user is not authenticated at all (no valid credentials provided)."
      />
    </LessonLayout>
  );
}
