import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Jwt() {
  return (
    <LessonLayout
      title="JWT Deep Dive"
      sectionId="auth"
      lessonIndex={3}
      prev={{ path: '/auth/cookies', label: 'Cookies & Sessions' }}
      next={{ path: '/auth/oauth', label: 'OAuth 2.0 & OIDC' }}
    >
      <p>
        JSON Web Tokens (JWTs) are self-contained, signed tokens that encode user identity and claims.
        Unlike server-side sessions, JWTs can be verified without a database lookup — the token itself
        contains all the information needed. This makes them popular in stateless architectures, but
        they come with important trade-offs and security considerations.
      </p>

      <h2>JWT Structure</h2>

      <p>
        A JWT consists of three Base64URL-encoded parts separated by dots:
        <code>Header.Payload.Signature</code>. It is important to understand that JWTs are
        <strong> signed, not encrypted</strong> — anyone can decode and read the payload.
      </p>

      <FlowChart
        title="JWT Structure"
        chart={"graph LR\n  A[\"Header\"] --- B[\"Payload\"] --- C[\"Signature\"]\n  A -->|\"Algorithm + Type\"| D[\"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9\"]\n  B -->|\"Claims (user data)\"| E[\"eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6...\"]\n  C -->|\"RSASHA256 of Header.Payload\"| F[\"SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV...\"]\n  style A fill:#1a2744,stroke:#5b9cf6\n  style B fill:#1a3329,stroke:#4ade80\n  style C fill:#3d2f14,stroke:#d97706"}
      />

      <CodeBlock language="json" title="JWT Decoded">
{`// HEADER (algorithm and token type)
{
  "alg": "RS256",       // RSA with SHA-256
  "typ": "JWT",
  "kid": "key-2024-01"  // Key ID for key rotation
}

// PAYLOAD (claims)
{
  "sub": "user-12345",           // Subject (user ID)
  "email": "alice@example.com",
  "name": "Alice Johnson",
  "roles": ["admin", "editor"],  // Custom claims
  "iss": "https://auth.example.com",  // Issuer
  "aud": "https://api.example.com",   // Audience
  "iat": 1704067200,             // Issued At (Unix timestamp)
  "exp": 1704070800,             // Expiration (1 hour later)
  "jti": "unique-token-id-xyz"  // JWT ID (for revocation)
}

// SIGNATURE
RSASHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  privateKey
)`}
      </CodeBlock>

      <h3>JWT Claims</h3>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Claim</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Type</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><code>sub</code></td>
            <td style={{ padding: '0.75rem' }}>Registered</td>
            <td style={{ padding: '0.75rem' }}>Subject — the user ID</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><code>iss</code></td>
            <td style={{ padding: '0.75rem' }}>Registered</td>
            <td style={{ padding: '0.75rem' }}>Issuer — who created this token</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><code>aud</code></td>
            <td style={{ padding: '0.75rem' }}>Registered</td>
            <td style={{ padding: '0.75rem' }}>Audience — intended recipient</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><code>exp</code></td>
            <td style={{ padding: '0.75rem' }}>Registered</td>
            <td style={{ padding: '0.75rem' }}>Expiration time (Unix timestamp)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><code>iat</code></td>
            <td style={{ padding: '0.75rem' }}>Registered</td>
            <td style={{ padding: '0.75rem' }}>Issued at time</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><code>jti</code></td>
            <td style={{ padding: '0.75rem' }}>Registered</td>
            <td style={{ padding: '0.75rem' }}>JWT ID — unique token identifier</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><code>roles</code></td>
            <td style={{ padding: '0.75rem' }}>Private</td>
            <td style={{ padding: '0.75rem' }}>Application-specific roles</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><code>email</code></td>
            <td style={{ padding: '0.75rem' }}>Public (OIDC)</td>
            <td style={{ padding: '0.75rem' }}>User email address</td>
          </tr>
        </tbody>
      </table>

      <h2>Signing Algorithms: HS256 vs RS256</h2>

      <InfoBox variant="info" title="Symmetric vs Asymmetric JWT Signing">
        <p><strong>HS256 (HMAC-SHA256)</strong> — Symmetric. Same secret key signs and verifies. Simple, but the secret must be shared with every service that verifies tokens. If one service is compromised, all are.</p>
        <p><strong>RS256 (RSA-SHA256)</strong> — Asymmetric. Private key signs, public key verifies. The auth server keeps the private key; all other services only need the public key (often fetched via JWKS endpoint). More secure for distributed systems.</p>
        <p><strong>ES256 (ECDSA-SHA256)</strong> — Asymmetric with elliptic curves. Smaller signatures, faster verification. Increasingly preferred over RS256.</p>
      </InfoBox>

      <h2>JWT Verification Flow</h2>

      <FlowChart
        title="JWT Verification Process"
        chart={"graph TD\n  A[\"Receive JWT\"] --> B[\"Decode Header\"]\n  B --> C[\"Get Algorithm + Key ID\"]\n  C --> D[\"Fetch Public Key from JWKS endpoint\"]\n  D --> E[\"Verify Signature\"]\n  E --> F{\"Signature Valid?\"}\n  F -->|\"No\"| G[\"REJECT - Tampered!\"]\n  F -->|\"Yes\"| H[\"Check exp claim\"]\n  H --> I{\"Expired?\"}\n  I -->|\"Yes\"| J[\"REJECT - Expired!\"]\n  I -->|\"No\"| K[\"Check iss and aud\"]\n  K --> L{\"Valid issuer and audience?\"}\n  L -->|\"No\"| M[\"REJECT - Wrong issuer/audience!\"]\n  L -->|\"Yes\"| N[\"ACCEPT - Extract claims\"]\n  style G fill:#3b1a1a,stroke:#dc2626\n  style J fill:#3b1a1a,stroke:#dc2626\n  style M fill:#3b1a1a,stroke:#dc2626\n  style N fill:#1a3329,stroke:#4ade80"}
      />

      <h2>Code Examples</h2>

      <CodeBlock language="javascript" title="JWT with Node.js (jsonwebtoken)">
{`const jwt = require('jsonwebtoken');
const fs = require('fs');

// --- RS256: Asymmetric Signing ---
const privateKey = fs.readFileSync('private.pem');
const publicKey = fs.readFileSync('public.pem');

// Create (Sign) a JWT
function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    },
    privateKey,
    {
      algorithm: 'RS256',
      issuer: 'https://auth.example.com',
      audience: 'https://api.example.com',
      expiresIn: '1h',
      keyid: 'key-2024-01',
    }
  );
}

// Verify a JWT
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],            // Whitelist allowed algorithms!
      issuer: 'https://auth.example.com',
      audience: 'https://api.example.com',
    });
    return { valid: true, claims: decoded };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

// Express middleware
function authMiddleware(req, res, next) {
  // Prefer HttpOnly cookie over Authorization header
  const token = req.cookies?.accessToken
    || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const result = verifyToken(token);
  if (!result.valid) {
    return res.status(401).json({ error: result.error });
  }

  req.user = result.claims;
  next();
}`}
      </CodeBlock>

      <CodeBlock language="java" title="JWT with Java (jjwt)">
{`import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.security.*;
import java.util.*;

public class JwtService {

    private final PrivateKey privateKey;
    private final PublicKey publicKey;

    public JwtService(PrivateKey privateKey, PublicKey publicKey) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }

    // Create (Sign) a JWT
    public String createToken(User user) {
        return Jwts.builder()
            .subject(user.getId())
            .claim("email", user.getEmail())
            .claim("roles", user.getRoles())
            .issuer("https://auth.example.com")
            .audience().add("https://api.example.com").and()
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 3600000)) // 1 hour
            .signWith(privateKey, Jwts.SIG.RS256)
            .compact();
    }

    // Verify a JWT
    public Claims verifyToken(String token) {
        try {
            return Jwts.parser()
                .verifyWith(publicKey)
                .requireIssuer("https://auth.example.com")
                .requireAudience("https://api.example.com")
                .build()
                .parseSignedClaims(token)
                .getPayload();
        } catch (JwtException e) {
            throw new AuthenticationException("Invalid token: " + e.getMessage());
        }
    }
}

// Spring Boot filter
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        // Check HttpOnly cookie first, then Authorization header
        String token = extractFromCookie(request, "accessToken");
        if (token == null) {
            token = extractFromHeader(request);
        }

        if (token != null) {
            try {
                Claims claims = jwtService.verifyToken(token);
                SecurityContextHolder.getContext()
                    .setAuthentication(new JwtAuthentication(claims));
            } catch (AuthenticationException e) {
                response.setStatus(401);
                return;
            }
        }
        chain.doFilter(request, response);
    }
}`}
      </CodeBlock>

      <h2>JWT vs Sessions</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Aspect</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>JWT</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Server Sessions</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>Storage</td>
            <td style={{ padding: '0.75rem' }}>Client-side (cookie or header)</td>
            <td style={{ padding: '0.75rem' }}>Server-side (Redis/DB)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>DB Lookup</td>
            <td style={{ padding: '0.75rem' }}>Not required — self-contained</td>
            <td style={{ padding: '0.75rem' }}>Required on every request</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>Revocation</td>
            <td style={{ padding: '0.75rem' }}>Hard — needs blocklist or short expiry</td>
            <td style={{ padding: '0.75rem' }}>Easy — delete session from store</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>Size</td>
            <td style={{ padding: '0.75rem' }}>Larger (encoded claims)</td>
            <td style={{ padding: '0.75rem' }}>Small (just session ID)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>Scaling</td>
            <td style={{ padding: '0.75rem' }}>Stateless — scales easily</td>
            <td style={{ padding: '0.75rem' }}>Needs shared session store</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>Best For</td>
            <td style={{ padding: '0.75rem' }}>Microservices, APIs, SPAs</td>
            <td style={{ padding: '0.75rem' }}>Traditional web apps</td>
          </tr>
        </tbody>
      </table>

      <h2>JWT Security Warnings</h2>

      <InfoBox variant="danger" title="Critical JWT Security Rules">
        <p><strong>Never store sensitive data in the payload</strong> — JWTs are Base64-encoded, NOT encrypted. Anyone can decode and read the payload.</p>
        <p><strong>Store JWTs in HttpOnly cookies, NOT localStorage</strong> — localStorage is accessible to any JavaScript on the page. One XSS vulnerability = stolen tokens.</p>
        <p><strong>Use short expiry (15-60 min)</strong> — Since JWTs are hard to revoke, short expiry limits the damage window. Use refresh tokens for longer sessions.</p>
        <p><strong>Always validate iss, aud, exp, and alg</strong> — Never trust a JWT without checking these claims. Whitelist allowed algorithms to prevent algorithm confusion attacks.</p>
        <p><strong>Use RS256 or ES256 over HS256</strong> — Asymmetric signing is more secure for distributed systems. The private key stays on the auth server.</p>
      </InfoBox>

      <h2>Refresh Token Pattern</h2>

      <CodeBlock language="javascript" title="JWT + Refresh Token Flow">
{`// Token lifetimes
// Access Token:  15 minutes (short-lived, used for API calls)
// Refresh Token: 7 days (long-lived, used to get new access tokens)

// Login: issue both tokens
app.post('/login', async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password);

  const accessToken = jwt.sign(
    { sub: user.id, roles: user.roles },
    privateKey,
    { algorithm: 'RS256', expiresIn: '15m' }
  );

  const refreshToken = crypto.randomBytes(64).toString('hex');

  // Store refresh token in DB (server-side, for revocation)
  await db.refreshTokens.create({
    token: hashToken(refreshToken),
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Send both as HttpOnly cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true, secure: true, sameSite: 'lax', maxAge: 900000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, secure: true, sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, path: '/auth/refresh',
  });
  res.json({ message: 'Logged in' });
});

// Refresh: exchange refresh token for new access token
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.cookies;

  const stored = await db.refreshTokens.findOne({
    token: hashToken(refreshToken),
    expiresAt: { $gt: new Date() },
  });

  if (!stored) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Rotate refresh token (invalidate old, issue new)
  await db.refreshTokens.delete({ id: stored.id });

  const user = await db.users.findById(stored.userId);
  const newAccessToken = jwt.sign(
    { sub: user.id, roles: user.roles },
    privateKey,
    { algorithm: 'RS256', expiresIn: '15m' }
  );
  const newRefreshToken = crypto.randomBytes(64).toString('hex');

  await db.refreshTokens.create({
    token: hashToken(newRefreshToken),
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.cookie('accessToken', newAccessToken, {
    httpOnly: true, secure: true, sameSite: 'lax', maxAge: 900000,
  });
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true, secure: true, sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, path: '/auth/refresh',
  });
  res.json({ message: 'Tokens refreshed' });
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Refresh Token Rotation">
        <p>
          Always rotate refresh tokens: when a refresh token is used, invalidate it and issue a new one.
          This way, if a refresh token is stolen, the legitimate user&#39;s next refresh attempt will fail
          (because the old token was already used), alerting the system to potential compromise. This is
          called <strong>refresh token rotation</strong> and is a critical security pattern.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"Why should JWTs be stored in HttpOnly cookies instead of localStorage?"}
        options={[
          "localStorage has a smaller size limit than cookies",
          "HttpOnly cookies cannot be read by JavaScript, protecting against XSS attacks that could steal the token",
          "Cookies are encrypted while localStorage is not",
          "localStorage does not work in all browsers"
        ]}
        correctIndex={1}
        explanation={"localStorage is fully accessible to any JavaScript running on the page. If an attacker exploits an XSS vulnerability (injecting malicious JS), they can read localStorage and steal the JWT. HttpOnly cookies are invisible to JavaScript — document.cookie cannot access them. The browser sends them automatically, but no script can read or exfiltrate them. This is why security-sensitive tokens should always use HttpOnly cookies."}
      />

      <InteractiveChallenge
        question={"What is the main advantage of JWTs over server-side sessions?"}
        options={[
          "JWTs are more secure because they are encrypted",
          "JWTs can be easily revoked by the server",
          "JWTs are self-contained and can be verified without a database lookup, making them ideal for stateless distributed systems",
          "JWTs are smaller than session IDs"
        ]}
        correctIndex={2}
        explanation={"JWTs encode all necessary information (user ID, roles, expiration) directly in the token. Any service with the public key can verify a JWT independently — no shared session store needed. This is the key advantage in microservices architectures where many services need to authenticate requests. The trade-off is that JWTs are harder to revoke (you cannot just delete them from a store) and are larger than a simple session ID."}
      />
    </LessonLayout>
  );
}
