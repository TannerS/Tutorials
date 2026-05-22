import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function AuthJwt() {
  return (
    <LessonLayout
      title="JWT Tokens"
      sectionId="auth"
      lessonIndex={3}
      prev={{ path: "/auth/cookies", label: "Cookies and Sessions" }}
      next={{ path: "/auth/oauth", label: "OAuth 2.0" }}
    >
      <p>JSON Web Tokens (JWT) are self-contained tokens that encode claims as JSON, signed with a secret or private key. They enable stateless authentication — the server doesn't need to store session state because all information is in the token.</p>

      <h2>JWT Structure</h2>

      <CodeBlock language="javascript" title="JWT Anatomy">
{`// JWT = base64url(header) . base64url(payload) . signature
// Example token:
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsIm5hbWUiOiJBbGljZSIsInJvbGVzIjpbIlVTRVIiXSwiaWF0IjoxNzE2MDAwMDAwLCJleHAiOjE3MTYwMDM2MDB9.abc123...

// Header (algorithm + type)
{
  "alg": "HS256",  // HMAC-SHA256 (symmetric) or RS256 (asymmetric)
  "typ": "JWT"
}

// Payload (claims)
{
  "sub": "42",              // subject (user ID)
  "name": "Alice Smith",    // custom claim
  "roles": ["USER", "ADMIN"],
  "iat": 1716000000,        // issued at (Unix timestamp)
  "exp": 1716003600,        // expiry (1 hour from iat)
  "iss": "https://auth.example.com",  // issuer
  "aud": "https://api.example.com"    // audience
}

// Signature (server verifies this — payload hasn't been tampered)
HMAC-SHA256(base64url(header) + "." + base64url(payload), secret)`}
      </CodeBlock>

      <CodeBlock language="java" title="JWT with Spring Security and JJWT">
{`@Service
public class JwtService {
    @Value("\${app.jwt.secret}")
    private String secret;

    @Value("\${app.jwt.expiry-ms:3600000}")  // 1 hour default
    private long expiryMs;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    public String generateToken(UserDetails user) {
        return Jwts.builder()
            .subject(user.getUsername())
            .claim("roles", user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).toList())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiryMs))
            .signWith(signingKey())
            .compact();
    }

    public Claims validateAndParse(String token) {
        return Jwts.parser()
            .verifyWith(signingKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
        // Throws JwtException if signature invalid or token expired
    }

    public String getSubject(String token) {
        return validateAndParse(token).getSubject();
    }
}

// Filter: extract JWT from Authorization header on every request
@Component
public class JwtFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain) throws ... {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            Claims claims = jwtService.validateAndParse(token);
            // Set SecurityContext with authenticated user
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                claims.getSubject(), null,
                ((List<String>) claims.get("roles")).stream()
                    .map(SimpleGrantedAuthority::new).toList()
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        chain.doFilter(request, response);
    }
}`}
      </CodeBlock>

      <FlowChart
        title="JWT Authentication Flow"
        chart={"graph LR\n  A[POST /login] --> B[Validate credentials]\n  B --> C[Generate JWT]\n  C --> D[Return JWT to client]\n  D --> E[Client stores JWT]\n  E --> F[API request]\n  F -- Authorization Bearer token --> G[JwtFilter]\n  G --> H[Verify signature]\n  H --> I[Set SecurityContext]\n  I --> J[Controller handles request]"}
      />

      <InfoBox variant="warning" title="JWT Security Pitfalls">
        <p>Never store JWTs in localStorage — XSS can steal them. Use httpOnly cookies or memory. Use RS256 (asymmetric) for distributed systems so only the auth server can sign tokens. Validate exp, iss, and aud claims. Implement refresh token rotation. Short-lived access tokens (15min) + long-lived refresh tokens (7 days) is the recommended pattern.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the main security advantage of using RS256 (RSA) instead of HS256 (HMAC) for JWT signing in microservices?"
        options={["RS256 produces shorter tokens", "RS256 is faster to verify", "The private key signs; all services only need the public key to verify — the secret is never shared", "RS256 tokens never expire"]}
        correctIndex={2}
        explanation="With HS256, every service that needs to verify JWTs must have the secret key — if any service is compromised, the attacker can forge tokens. With RS256, only the auth server holds the private signing key. All other services get the public key to verify — compromise of a downstream service doesn't allow token forgery."
      />

    </LessonLayout>
  );
}
