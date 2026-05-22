import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Security() {
  return (
    <LessonLayout
      title="Spring Security & Auth"
      sectionId="springboot"
      lessonIndex={5}
      prev={{ path: '/springboot/data', label: 'Spring Data & JPA' }}
      next={{ path: '/springboot/testing', label: 'Testing in Spring Boot' }}
    >
      <h2>Securing Your Application with Spring Security</h2>
      <p>
        Spring Security is a powerful and highly customizable authentication and access control
        framework. It is the de facto standard for securing Spring-based applications. By adding
        <code>spring-boot-starter-security</code> to your project, Spring Boot auto-configures
        basic security with form login, CSRF protection, and session management — then you
        customize it to fit your needs.
      </p>

      <FlowChart
        title="Spring Security Filter Chain"
        chart={"graph TD\nA[HTTP Request] --> B[SecurityFilterChain]\nB --> C[CorsFilter]\nC --> D[CsrfFilter]\nD --> E[AuthenticationFilter]\nE --> F{Valid Token?}\nF -->|Yes| G[Set SecurityContext]\nF -->|No| H[401 Unauthorized]\nG --> I[AuthorizationFilter]\nI --> J{Has Permission?}\nJ -->|Yes| K[Controller Method]\nJ -->|No| L[403 Forbidden]"}
      />

      <h3>Configuring SecurityFilterChain</h3>
      <p>
        Since Spring Security 6, security configuration is done through a
        <code>SecurityFilterChain</code> bean using the <code>HttpSecurity</code> builder.
        The older <code>WebSecurityConfigurerAdapter</code> approach is deprecated.
      </p>

      <CodeBlock language="java" title="SecurityConfig.java">
{`@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter,
                          AuthenticationProvider authenticationProvider) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.authenticationProvider = authenticationProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter,
                UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET","POST","PUT","DELETE"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}`}
      </CodeBlock>

      <h3>JWT Authentication Filter</h3>
      <p>
        For stateless REST APIs, JSON Web Tokens (JWT) are a popular authentication mechanism.
        A custom filter intercepts each request, extracts the JWT from the Authorization header,
        validates it, and sets the authentication in the SecurityContext.
      </p>

      <CodeBlock language="java" title="JwtAuthenticationFilter.java">
{`@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.substring(7);
        String userEmail = jwtService.extractUsername(jwt);

        if (userEmail != null && SecurityContextHolder.getContext()
                .getAuthentication() == null) {
            UserDetails userDetails =
                userDetailsService.loadUserByUsername(userEmail);

            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null,
                        userDetails.getAuthorities());
                authToken.setDetails(
                    new WebAuthenticationDetailsSource()
                        .buildDetails(request));
                SecurityContextHolder.getContext()
                    .setAuthentication(authToken);
            }
        }
        filterChain.doFilter(request, response);
    }
}`}
      </CodeBlock>

      <h3>Method-Level Security</h3>
      <p>
        With <code>@EnableMethodSecurity</code>, you can secure individual methods using
        annotations like <code>@PreAuthorize</code> and <code>@Secured</code>.
      </p>

      <CodeBlock language="java" title="SecuredMethods.java">
{`@Service
public class AdminService {

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(Long userId) {
        // Only users with ADMIN role can call this
    }

    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public UserDTO getUser(Long userId) {
        // Admins can view anyone; regular users only themselves
    }

    @PreAuthorize("@permissionService.canEdit(#postId, authentication)")
    public void editPost(Long postId, UpdatePostRequest request) {
        // Custom permission check via a Spring bean
    }
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="Security Best Practices">
        <p>
          Never store plain-text passwords — always use <code>BCryptPasswordEncoder</code>.
          Disable CSRF only for stateless APIs using JWT. Always validate and sanitize user
          input. Use HTTPS in production. Set short JWT expiration times and implement
          token refresh. Never expose stack traces or internal error details in API responses.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="In Spring Security 6, what is the recommended way to configure HTTP security?"
        options={[
          "Extending WebSecurityConfigurerAdapter",
          "Creating a SecurityFilterChain @Bean",
          "Using XML security configuration",
          "Annotating the main class with @Secured"
        ]}
        correctIndex={1}
        explanation="Since Spring Security 6, the recommended approach is to define a SecurityFilterChain @Bean in a @Configuration class. The older WebSecurityConfigurerAdapter has been removed. The new approach is more flexible and aligns with Spring's general move toward component-based configuration."
      />
    </LessonLayout>
  );
}
