import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function AuthCookies() {
  return (
    <LessonLayout
      title="Cookies and Sessions"
      sectionId="auth"
      lessonIndex={2}
      prev={{ path: "/auth/tls", label: "TLS and HTTPS" }}
      next={{ path: "/auth/jwt", label: "JWT Tokens" }}
    >
      <p>Cookies are small pieces of data stored in the browser and sent with every request to the matching domain. Session-based authentication uses cookies to track server-side sessions. Understanding cookie security attributes is essential for preventing XSS and CSRF attacks.</p>

      <h2>Cookie Security Attributes</h2>

      <CodeBlock language="java" title="Secure Cookie Configuration">
{`@Configuration
public class SessionConfig {
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("SESSIONID");
        serializer.setHttpOnly(true);         // JS cannot read (prevents XSS theft)
        serializer.setUseSecureCookie(true);  // HTTPS only (prevents network sniffing)
        serializer.setSameSite("Strict");     // no cross-site sends (prevents CSRF)
        serializer.setCookiePath("/");
        serializer.setCookieMaxAge(3600);     // 1 hour expiry
        // Do NOT set domain= — limits scope to exact domain
        return serializer;
    }
}

// The three critical attributes explained:
// HttpOnly: Cookie is invisible to JavaScript document.cookie
//           → Attacker's XSS payload cannot steal the session cookie
//
// Secure: Browser only sends cookie over HTTPS connections
//         → Cookie cannot be intercepted on HTTP (even on same network)
//
// SameSite=Strict: Cookie NOT sent on cross-site requests (forms, links)
//                  → CSRF attacks cannot use the session cookie
// SameSite=Lax:    Cookie sent on top-level navigation (links) but not POST
//                  → Good balance for most apps`}
      </CodeBlock>

      <h2>Session Fixation Prevention</h2>

      <CodeBlock language="java" title="Spring Security Session Management">
{`@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .sessionManagement(session -> session
                // Rotate session ID after login (prevents session fixation)
                .sessionFixation().migrateSession()
                // Limit concurrent sessions per user
                .maximumSessions(3)
                .maxSessionsPreventsLogin(false)   // expire oldest, not reject new
                .sessionRegistry(sessionRegistry())
                // Invalidate session on logout
                .and()
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .invalidateHttpSession(true)
                .deleteCookies("SESSIONID")
            );
        return http.build();
    }
}`}
      </CodeBlock>

      <FlowChart
        title="Session Auth Flow"
        chart={"graph LR\n  A[Login POST] --> B[Validate credentials]\n  B --> C[Create session]\n  C --> D[Set-Cookie SESSIONID]\n  D --> E[Browser stores cookie]\n  E --> F[Subsequent requests]\n  F --> G[Cookie sent automatically]\n  G --> H[Server validates session]\n  H --> I[Authorized response]"}
      />

      <InfoBox variant="warning" title="CSRF Protection">
        <p>With cookies, you need CSRF protection. An attacker's site can make a form POST to your site and the browser will include the victim's cookie. CSRF tokens (synchronizer token pattern) or SameSite=Strict cookies prevent this. With JWT in Authorization headers, CSRF is not an issue — foreign sites cannot access localStorage.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What does the HttpOnly cookie attribute prevent?"
        options={["The cookie from being sent over HTTP", "JavaScript from reading the cookie via document.cookie", "The cookie from being sent in cross-site requests", "The cookie from persisting after the browser closes"]}
        correctIndex={1}
        explanation="HttpOnly makes the cookie inaccessible to JavaScript's document.cookie API. Even if an attacker manages to inject a script into your page (XSS), they cannot read HttpOnly cookies. This prevents session hijacking via XSS — the most common way session cookies are stolen."
      />

    </LessonLayout>
  );
}
