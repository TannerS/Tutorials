import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Authz() {
  return (
    <LessonLayout
      title="AuthN vs AuthZ"
      sectionId="auth"
      lessonIndex={5}
      prev={{ path: '/auth/oauth', label: 'OAuth 2.0 & OIDC' }}
      next={{ path: '/auth/security', label: 'Web Security (CORS, CSRF, XSS)' }}
    >
      <p>
        Authentication and authorization are the two pillars of access control. They are often confused
        because they work together, but they solve fundamentally different problems. This lesson clarifies
        both concepts, covers the major authorization models, and then brings everything together with the
        full browser login flow showing how all the pieces from previous lessons connect.
      </p>

      <h2>Authentication (AuthN): Who Are You?</h2>

      <p>
        Authentication is the process of <strong>proving identity</strong>. It answers the question: &quot;Who
        are you?&quot; Before a system can decide what you are allowed to do, it must first verify that you are
        who you claim to be.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Method</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>How It Works</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Common Use</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Password</strong></td>
            <td style={{ padding: '0.75rem' }}>Something you know — hashed and compared</td>
            <td style={{ padding: '0.75rem' }}>Most web apps</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Biometric</strong></td>
            <td style={{ padding: '0.75rem' }}>Something you are — fingerprint, face, iris</td>
            <td style={{ padding: '0.75rem' }}>Mobile devices, physical access</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Certificate</strong></td>
            <td style={{ padding: '0.75rem' }}>Something you have — X.509 client cert (mTLS)</td>
            <td style={{ padding: '0.75rem' }}>Microservices, IoT, enterprise</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Magic Link</strong></td>
            <td style={{ padding: '0.75rem' }}>One-time link sent to email</td>
            <td style={{ padding: '0.75rem' }}>Slack, Notion, many SaaS</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>OTP (TOTP/HOTP)</strong></td>
            <td style={{ padding: '0.75rem' }}>Time-based one-time password from authenticator app</td>
            <td style={{ padding: '0.75rem' }}>2FA, MFA</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>SSO (OAuth/OIDC)</strong></td>
            <td style={{ padding: '0.75rem' }}>Delegated auth via identity provider</td>
            <td style={{ padding: '0.75rem' }}>Enterprise, &quot;Login with Google&quot;</td>
          </tr>
        </tbody>
      </table>

      <h2>Authorization (AuthZ): What Can You Do?</h2>

      <p>
        Authorization happens <strong>after</strong> authentication. Once the system knows who you are,
        it checks what you are <strong>allowed to do</strong>. Authorization answers: &quot;Do you have
        permission to access this resource or perform this action?&quot;
      </p>

      <h3>RBAC (Role-Based Access Control)</h3>

      <p>
        The most common authorization model. Users are assigned <strong>roles</strong>, and roles have
        <strong>permissions</strong>. Simple, widely understood, and sufficient for most applications.
      </p>

      <CodeBlock language="javascript" title="RBAC Implementation (Node.js)">
{`// Role definitions
const ROLES = {
  admin: {
    permissions: ['read', 'write', 'delete', 'manage_users', 'view_audit'],
  },
  editor: {
    permissions: ['read', 'write'],
  },
  viewer: {
    permissions: ['read'],
  },
};

// Middleware: check role permission
function requirePermission(permission) {
  return (req, res, next) => {
    const userRoles = req.user.roles; // From JWT or session

    const hasPermission = userRoles.some(
      role => ROLES[role]?.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission: ' + permission,
      });
    }
    next();
  };
}

// Usage in routes
app.get('/articles', requirePermission('read'), getArticles);
app.post('/articles', requirePermission('write'), createArticle);
app.delete('/articles/:id', requirePermission('delete'), deleteArticle);
app.get('/admin/users', requirePermission('manage_users'), listUsers);`}
      </CodeBlock>

      <CodeBlock language="java" title="RBAC with Spring Security">
{`@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/public/**").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/**").hasAnyRole("ADMIN", "EDITOR")
                .requestMatchers(HttpMethod.GET, "/api/**").authenticated()
                .anyRequest().denyAll()
            )
            .build();
    }
}

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    @GetMapping
    @PreAuthorize("hasAuthority('SCOPE_read')")
    public List<Article> getArticles() {
        return articleService.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public Article createArticle(@RequestBody Article article) {
        return articleService.create(article);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteArticle(@PathVariable Long id) {
        articleService.delete(id);
    }

    // Fine-grained: only author or admin can edit
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @articleService.isAuthor(#id, authentication.name)")
    public Article updateArticle(@PathVariable Long id, @RequestBody Article article) {
        return articleService.update(id, article);
    }
}`}
      </CodeBlock>

      <h3>ABAC (Attribute-Based Access Control)</h3>

      <InfoBox variant="info" title="ABAC: More Flexible, More Complex">
        <p>
          ABAC makes authorization decisions based on <strong>attributes</strong> of the user, resource,
          action, and environment. It can express complex policies that RBAC cannot:
        </p>
        <p>&quot;Allow access if the user&#39;s department matches the document&#39;s department AND it is during business hours AND the user&#39;s clearance level is above the document&#39;s classification.&quot;</p>
        <p>
          ABAC is more powerful but significantly more complex to implement and audit. Use RBAC unless
          you genuinely need attribute-based policies.
        </p>
      </InfoBox>

      <h3>How OAuth Maps to AuthN/AuthZ</h3>

      <InfoBox variant="tip" title="OAuth + OIDC = AuthN + AuthZ">
        <p><strong>Authentication (AuthN)</strong> — Handled by OIDC. The ID Token (JWT) proves who the user is. The auth server (Google) verified their identity.</p>
        <p><strong>Authorization (AuthZ)</strong> — Handled by OAuth scopes and access tokens. The access token grants specific permissions (e.g., read email, access calendar). The resource server checks the token&#39;s scopes.</p>
        <p>In your own app, you typically map the authenticated user to internal roles (RBAC) for fine-grained authorization decisions.</p>
      </InfoBox>

      <h2>The Full Browser Login Flow</h2>

      <p>
        Now let&#39;s connect ALL the pieces from the previous lessons into one complete flow. This is what
        happens when a user logs into a modern web application:
      </p>

      <FlowChart
        title="Complete Browser Login Flow (All 6 Phases)"
        chart={"graph TD\n  subgraph Phase1[\"Phase 1: TLS\"]\n    A[\"Browser connects to server\"] --> B[\"TLS 1.3 Handshake\"]\n    B --> C[\"Encrypted channel established\"]\n  end\n  subgraph Phase2[\"Phase 2: OAuth/OIDC\"]\n    C --> D[\"User clicks Login with Google\"]\n    D --> E[\"OAuth Authorization Code Flow\"]\n    E --> F[\"Receive access_token + id_token\"]\n  end\n  subgraph Phase3[\"Phase 3: Session/Cookie\"]\n    F --> G[\"Create server session or JWT\"]\n    G --> H[\"Set HttpOnly Secure cookie\"]\n  end\n  subgraph Phase4[\"Phase 4: Requests\"]\n    H --> I[\"Browser sends requests with cookie\"]\n    I --> J[\"Server validates session/JWT\"]\n    J --> K[\"Check authorization - RBAC\"]\n  end\n  subgraph Phase5[\"Phase 5: Refresh\"]\n    K --> L[\"Access token expires\"]\n    L --> M[\"Use refresh token for new access token\"]\n  end\n  subgraph Phase6[\"Phase 6: Logout\"]\n    M --> N[\"User clicks logout\"]\n    N --> O[\"Delete session + clear cookies\"]\n  end\n  style A fill:#1a2744,stroke:#5b9cf6\n  style F fill:#1a3329,stroke:#4ade80\n  style H fill:#3d2f14,stroke:#d97706\n  style K fill:#2a1f44,stroke:#a78bfa"}
      />

      <CodeBlock language="text" title="Full Login Flow — Phase by Phase">
{`Phase 1: TLS (Secure Channel)
  - Browser initiates TLS 1.3 handshake
  - ECDH key exchange → shared secret → AES-256-GCM session keys
  - All subsequent communication is encrypted
  - Server authenticated via X.509 certificate chain

Phase 2: OAuth/OIDC (Delegate Authentication)
  - User clicks "Login with Google"
  - Authorization Code Flow + PKCE
  - User authenticates at Google, consents to scopes
  - Server receives: access_token, id_token (JWT), refresh_token

Phase 3: Session/Cookie (Remember User)
  - Server creates session (Redis) or issues app-level JWT
  - Sets HttpOnly, Secure, SameSite=Lax cookie
  - Browser stores cookie automatically

Phase 4: Subsequent Requests
  - Browser sends cookie with every request
  - Server validates session (Redis lookup) or JWT (signature check)
  - Server checks authorization (RBAC: does this user's role allow this action?)
  - Returns data or 403 Forbidden

Phase 5: Token Refresh
  - Access token expires (15 min - 1 hour)
  - Server uses refresh token to get new access token from Google
  - User stays logged in without re-authenticating

Phase 6: Logout
  - Server deletes session from Redis (critical! don't just clear cookie)
  - Server clears all auth cookies
  - Optionally: revoke refresh token at Google
  - User is fully logged out`}
      </CodeBlock>

      <h2>Architecture Patterns</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Pattern</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>AuthN</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Token</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>AuthZ</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Traditional Web App</strong></td>
            <td style={{ padding: '0.75rem' }}>Password login</td>
            <td style={{ padding: '0.75rem' }}>Server session + cookie</td>
            <td style={{ padding: '0.75rem' }}>RBAC</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Modern SPA + REST API</strong></td>
            <td style={{ padding: '0.75rem' }}>Password or OAuth</td>
            <td style={{ padding: '0.75rem' }}>JWT in HttpOnly cookie</td>
            <td style={{ padding: '0.75rem' }}>JWT claims</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Enterprise SSO</strong></td>
            <td style={{ padding: '0.75rem' }}>OAuth 2.0 + OIDC</td>
            <td style={{ padding: '0.75rem' }}>ID Token JWT + app session</td>
            <td style={{ padding: '0.75rem' }}>RBAC</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Microservices</strong></td>
            <td style={{ padding: '0.75rem' }}>OAuth/OIDC at gateway</td>
            <td style={{ padding: '0.75rem' }}>JWT passed between services</td>
            <td style={{ padding: '0.75rem' }}>Per-service AuthZ</td>
          </tr>
        </tbody>
      </table>

      <h2>Concept Relationship Map</h2>

      <FlowChart
        title="How Auth Concepts Connect"
        chart={"graph TD\n  A[\"Encryption\"] -->|\"Secures transport\"| B[\"TLS/HTTPS\"]\n  B -->|\"Secure channel for\"| C[\"Cookies\"]\n  B -->|\"Secure channel for\"| D[\"OAuth/OIDC\"]\n  C -->|\"Stores\"| E[\"Session ID\"]\n  C -->|\"Stores\"| F[\"JWT\"]\n  D -->|\"Issues\"| F\n  D -->|\"Creates\"| E\n  E -->|\"Server-side state\"| G[\"Session Store\"]\n  F -->|\"Self-contained\"| H[\"Stateless Auth\"]\n  G --> I[\"Authorization - RBAC\"]\n  H --> I\n  I -->|\"Decides\"| J[\"Allow or Deny\"]\n  style A fill:#1a2744,stroke:#5b9cf6\n  style I fill:#3d2f14,stroke:#d97706\n  style J fill:#1a3329,stroke:#4ade80"}
      />

      <h2>Quick Reference Cheat Sheet</h2>

      <InfoBox variant="success" title="AuthN vs AuthZ — Summary">
        <p><strong>Authentication (AuthN)</strong>: &quot;Who are you?&quot; → Proves identity → Methods: password, biometric, certificate, OAuth/OIDC, magic link, OTP</p>
        <p><strong>Authorization (AuthZ)</strong>: &quot;What can you do?&quot; → Checks permissions → Methods: RBAC (roles), ABAC (attributes), scopes, policies</p>
        <p><strong>Order</strong>: Always AuthN first, then AuthZ. You must know WHO before checking WHAT.</p>
        <p><strong>OAuth 2.0</strong>: Authorization framework (scopes, access tokens)</p>
        <p><strong>OIDC</strong>: Authentication layer on OAuth (ID tokens, user identity)</p>
        <p><strong>Together</strong>: OIDC authenticates the user, OAuth authorizes the app, your app uses RBAC for fine-grained authorization</p>
      </InfoBox>

      <InteractiveChallenge
        question={"What is the correct relationship between authentication and authorization?"}
        options={[
          "They are the same thing with different names",
          "Authorization must happen before authentication",
          "Authentication (who are you?) must happen first, then authorization (what can you do?) checks permissions based on the verified identity",
          "Authentication handles permissions while authorization handles identity"
        ]}
        correctIndex={2}
        explanation={"Authentication and authorization are sequential: first you prove your identity (AuthN), then the system checks what you are allowed to do (AuthZ). You cannot authorize someone whose identity you have not verified. In a typical web app: the user logs in (AuthN via password/OAuth), receives a session/JWT, and then on each request the server checks their roles/permissions (AuthZ via RBAC) before allowing access to resources."}
      />

      <InteractiveChallenge
        question={"In RBAC, why is it better to assign permissions to roles rather than directly to users?"}
        options={[
          "Roles are faster to check than individual permissions",
          "Users cannot have permissions without roles",
          "Roles group permissions logically — when a user changes position, you change their role instead of updating dozens of individual permissions, making the system maintainable and auditable",
          "Roles provide encryption for permissions"
        ]}
        correctIndex={2}
        explanation={"RBAC provides a layer of indirection: permissions are grouped into roles (admin, editor, viewer), and users are assigned roles. When someone gets promoted, you change their role from 'editor' to 'admin' — one change instead of updating 20 individual permissions. This is more maintainable, less error-prone, and easier to audit. You can answer 'what can admins do?' and 'who are the admins?' easily."}
      />
    </LessonLayout>
  );
}
