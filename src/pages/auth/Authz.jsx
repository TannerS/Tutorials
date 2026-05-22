import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function AuthAuthz() {
  return (
    <LessonLayout
      title="Authorization Patterns"
      sectionId="auth"
      lessonIndex={5}
      prev={{ path: "/auth/oauth", label: "OAuth 2.0" }}
      next={{ path: "/auth/security", label: "Security Best Practices" }}
    >
      <p>Authentication answers "who are you?" Authorization answers "what are you allowed to do?" Spring Security provides RBAC (Role-Based Access Control) and method-level security for fine-grained authorization.</p>

      <h2>RBAC with Spring Security</h2>

      <CodeBlock language="java" title="Role-Based Access Control">
{`@Configuration
@EnableMethodSecurity  // enables @PreAuthorize, @PostAuthorize
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
            // Public endpoints
            .requestMatchers("/api/auth/**", "/actuator/health").permitAll()
            // Role-based access
            .requestMatchers(HttpMethod.GET, "/api/products/**").hasAnyRole("USER","ADMIN")
            .requestMatchers(HttpMethod.POST, "/api/products/**").hasRole("ADMIN")
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            // Everything else requires authentication
            .anyRequest().authenticated()
        );
        return http.build();
    }
}

// Method-level security (preferred — checked even if URL config changes)
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public List<OrderDto> myOrders(@AuthenticationPrincipal UserDetails user) {
        return orderService.findByUser(user.getUsername());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrderDto> allOrders() {
        return orderService.findAll();
    }

    // User can only access their OWN order, unless admin
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @orderSecurity.isOwner(#id, authentication)")
    public OrderDto getOrder(@PathVariable Long id) {
        return orderService.findById(id);
    }
}

// Custom security bean for domain-specific authorization
@Component("orderSecurity")
public class OrderSecurityService {
    public boolean isOwner(Long orderId, Authentication auth) {
        return orderRepo.findById(orderId)
            .map(o -> o.getUserId().equals(auth.getName()))
            .orElse(false);
    }
}`}
      </CodeBlock>

      <FlowChart
        title="Authorization Decision Flow"
        chart={"graph TD\n  A[Request] --> B[Authenticate]\n  B --> C{URL matcher}\n  C -- Denied --> D[403 Forbidden]\n  C -- Allowed --> E[Controller]\n  E --> F{@PreAuthorize check}\n  F -- Denied --> D\n  F -- Allowed --> G[Business logic]\n  G --> H{@PostAuthorize check}\n  H -- Denied --> D\n  H -- Allowed --> I[Return response]"}
      />

      <InfoBox variant="tip" title="Attribute-Based Access Control">
        <p>RBAC (roles) works well for coarse-grained access. For fine-grained control — "user can only edit their own posts," "manager can only approve orders in their department" — use ABAC (Attribute-Based Access Control) with Spring's @PreAuthorize SpEL expressions that evaluate object attributes and user attributes together.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between @PreAuthorize and @PostAuthorize?"
        options={["@PreAuthorize checks roles; @PostAuthorize checks permissions", "@PreAuthorize runs before the method; @PostAuthorize runs after and can check the return value", "@PostAuthorize is faster because it uses caching", "@PreAuthorize is for REST controllers; @PostAuthorize is for service methods"]}
        correctIndex={1}
        explanation="@PreAuthorize evaluates the expression before the method executes — useful for role checks and input validation. @PostAuthorize evaluates after the method returns, with access to the return value via returnObject — useful for checking 'can this user see this specific returned object?'"
      />

    </LessonLayout>
  );
}
