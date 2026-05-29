import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Cookies() {
  return (
    <LessonLayout
      title="Cookies & Sessions"
      sectionId="auth"
      lessonIndex={2}
      prev={{ path: '/auth/tls', label: 'TLS & HTTPS' }}
      next={{ path: '/auth/jwt', label: 'JWT Deep Dive' }}
    >
      <p>
        HTTP is stateless — each request is independent with no memory of previous requests. Cookies and
        sessions are the mechanisms that give HTTP the illusion of state. Understanding these is critical
        because they underpin authentication, shopping carts, user preferences, and virtually every
        personalized web experience.
      </p>

      <h2>How Cookies Work</h2>

      <p>
        Cookies are small key-value pairs that the server instructs the browser to store. The server sends
        a <code>Set-Cookie</code> header in its response, and the browser automatically includes matching
        cookies in every subsequent request to that domain.
      </p>

      <FlowChart
        title="Cookie Lifecycle"
        chart={"graph TD\n  A[\"Browser sends POST /login\"] --> B[\"Server authenticates user\"]\n  B --> C[\"Server creates session\"]\n  C --> D[\"Server sends Set-Cookie: sessionId=abc123\"]\n  D --> E[\"Browser stores cookie\"]\n  E --> F[\"Browser sends GET /dashboard\"]\n  F --> G[\"Cookie: sessionId=abc123 sent automatically\"]\n  G --> H[\"Server looks up session abc123\"]\n  H --> I[\"Server returns personalized response\"]\n  style A fill:#1a2744,stroke:#5b9cf6\n  style D fill:#1a3329,stroke:#4ade80\n  style G fill:#2a1f44,stroke:#a78bfa"}
      />

      <CodeBlock language="text" title="HTTP Headers — Setting and Sending Cookies">
{`--- Server Response (Set-Cookie) ---
HTTP/1.1 200 OK
Set-Cookie: sessionId=abc123; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600
Set-Cookie: theme=dark; Path=/; Max-Age=31536000

--- Browser Request (automatic) ---
GET /dashboard HTTP/1.1
Host: example.com
Cookie: sessionId=abc123; theme=dark`}
      </CodeBlock>

      <h2>Cookie Attributes</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Attribute</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Purpose</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Domain</strong></td>
            <td style={{ padding: '0.75rem' }}>Which domain(s) receive the cookie</td>
            <td style={{ padding: '0.75rem' }}><code>Domain=.example.com</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Path</strong></td>
            <td style={{ padding: '0.75rem' }}>URL path that must exist for cookie to be sent</td>
            <td style={{ padding: '0.75rem' }}><code>Path=/api</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Max-Age / Expires</strong></td>
            <td style={{ padding: '0.75rem' }}>How long the cookie lives</td>
            <td style={{ padding: '0.75rem' }}><code>Max-Age=3600</code> (1 hour)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Secure</strong></td>
            <td style={{ padding: '0.75rem' }}>Only send over HTTPS</td>
            <td style={{ padding: '0.75rem' }}><code>Secure</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>HttpOnly</strong></td>
            <td style={{ padding: '0.75rem' }}>Inaccessible to JavaScript — critical for security</td>
            <td style={{ padding: '0.75rem' }}><code>HttpOnly</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>SameSite</strong></td>
            <td style={{ padding: '0.75rem' }}>Controls cross-site sending behavior</td>
            <td style={{ padding: '0.75rem' }}><code>SameSite=Lax</code></td>
          </tr>
        </tbody>
      </table>

      <h3>SameSite Deep Dive</h3>

      <InfoBox variant="warning" title="SameSite Values Explained">
        <p><strong>Strict</strong> — Cookie is NEVER sent on cross-site requests. Most secure, but can break legitimate flows (e.g., clicking a link from email to your bank).</p>
        <p><strong>Lax</strong> — Cookie is sent on top-level navigations (GET) from external sites, but NOT on cross-site POST/AJAX. The sweet spot for most apps.</p>
        <p><strong>None</strong> — Cookie is always sent, even cross-site. Must have <code>Secure</code> flag. Only for legitimate cross-site needs (embedded iframes, third-party APIs).</p>
      </InfoBox>

      <h2>Session vs Persistent Cookies</h2>

      <InfoBox variant="info" title="Two Types of Cookies">
        <p><strong>Session Cookie</strong> — No <code>Max-Age</code> or <code>Expires</code> set. Dies when the browser tab or window closes. Used for temporary state like a session ID.</p>
        <p><strong>Persistent Cookie</strong> — Has <code>Max-Age</code> or <code>Expires</code>. Survives browser restarts. Used for "remember me" features, theme preferences, and analytics.</p>
      </InfoBox>

      <h2>Server-Side Sessions</h2>

      <p>
        The most common pattern for maintaining user state: store a session ID in a cookie, store the actual
        session data on the server (in Redis, a database, or memory). On each request, the server looks up
        the session by ID and retrieves the associated user data.
      </p>

      <FlowChart
        title="Server-Side Session Architecture"
        chart={"graph TD\n  A[\"Browser\"] -->|\"Cookie: sessionId=abc123\"| B[\"Web Server\"]\n  B -->|\"Lookup abc123\"| C[\"Session Store\"]\n  C -->|\"Return user data\"| B\n  B -->|\"Personalized response\"| A\n  subgraph Session Store Options\n    D[\"Redis - Fast, in-memory\"]\n    E[\"PostgreSQL - Persistent\"]\n    F[\"In-Memory - Dev only\"]\n  end\n  C --- D\n  C --- E\n  C --- F\n  style A fill:#1a2744,stroke:#5b9cf6\n  style C fill:#1a3329,stroke:#4ade80\n  style D fill:#3d2f14,stroke:#d97706"}
      />

      <CodeBlock language="javascript" title="Express.js Session Management">
{`const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

const app = express();

// Redis client
const redisClient = createClient({ url: 'redis://localhost:6379' });
redisClient.connect();

// Session middleware
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  name: 'sessionId',                  // Cookie name (avoid default 'connect.sid')
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,                    // Not accessible via JavaScript
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    sameSite: 'lax',                   // CSRF protection
    maxAge: 1000 * 60 * 60,           // 1 hour
  },
}));

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticate(email, password);

  if (user) {
    req.session.userId = user.id;       // Store user ID in session
    req.session.roles = user.roles;     // Store roles in session
    res.json({ message: 'Logged in' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protected route
app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Session data available without DB lookup
  res.json({ userId: req.session.userId, roles: req.session.roles });
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {       // Delete session from Redis
    res.clearCookie('sessionId');       // Clear the cookie
    res.json({ message: 'Logged out' });
  });
});`}
      </CodeBlock>

      <CodeBlock language="java" title="Spring Boot Session Management (Redis-backed)">
{`// build.gradle dependencies
// implementation 'org.springframework.session:spring-session-data-redis'
// implementation 'org.springframework.boot:spring-boot-starter-data-redis'

// application.yml
// spring:
//   session:
//     store-type: redis
//     timeout: 3600s
//   redis:
//     host: localhost
//     port: 6379

@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 3600)
public class SessionConfig {

    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("sessionId");
        serializer.setUseHttpOnlyCookie(true);
        serializer.setUseSecureCookie(true);
        serializer.setSameSite("Lax");
        serializer.setCookiePath("/");
        return serializer;
    }
}

@RestController
@RequestMapping("/api")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpSession session) {

        User user = authService.authenticate(
            request.getEmail(), request.getPassword());

        if (user != null) {
            session.setAttribute("userId", user.getId());
            session.setAttribute("roles", user.getRoles());
            return ResponseEntity.ok(Map.of("message", "Logged in"));
        }
        return ResponseEntity.status(401)
            .body(Map.of("error", "Invalid credentials"));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401)
                .body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "roles", session.getAttribute("roles")
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }
}`}
      </CodeBlock>

      <h2>Session Pros and Cons</h2>

      <InfoBox variant="tip" title="Server-Side Sessions: Trade-offs">
        <p><strong>Pros:</strong></p>
        <ul>
          <li>Easy to invalidate — just delete the session from the store</li>
          <li>Data never leaves the server — more secure</li>
          <li>Small cookie size — just the session ID</li>
          <li>Server controls what data is stored</li>
        </ul>
        <p><strong>Cons:</strong></p>
        <ul>
          <li>Requires a shared session store (Redis/DB) for horizontal scaling</li>
          <li>Every request requires a session store lookup — adds latency</li>
          <li>Session store becomes a single point of failure</li>
          <li>Sticky sessions needed if no shared store</li>
        </ul>
      </InfoBox>

      <h2>Cookie Security Risks</h2>

      <h3>XSS (Cross-Site Scripting)</h3>

      <InfoBox variant="danger" title="XSS Cookie Theft">
        <p>
          If an attacker can inject JavaScript into your page, they can steal cookies:
          <code>document.cookie</code> gives access to all non-HttpOnly cookies. The attacker sends
          stolen session cookies to their server and impersonates the user.
        </p>
        <p><strong>Mitigation:</strong> Always set <code>HttpOnly</code> on session cookies. This makes them completely invisible to JavaScript.</p>
      </InfoBox>

      <h3>CSRF (Cross-Site Request Forgery)</h3>

      <InfoBox variant="danger" title="CSRF Attack">
        <p>
          A malicious site tricks the user&#39;s browser into making a request to your site. Because cookies
          are sent automatically, the request includes the session cookie, and the server thinks the request
          is legitimate.
        </p>
        <p><strong>Mitigation:</strong> Use <code>SameSite=Lax</code> or <code>SameSite=Strict</code> cookies. For legacy browsers, use CSRF tokens — a unique random value included in each form that the attacker cannot predict.</p>
      </InfoBox>

      <h3>Cookie Theft</h3>

      <InfoBox variant="danger" title="Network Interception">
        <p>
          If cookies are sent over plain HTTP, anyone on the same network (coffee shop WiFi, etc.) can
          intercept them using tools like Wireshark.
        </p>
        <p><strong>Mitigation:</strong> Always set the <code>Secure</code> flag so cookies are only sent over HTTPS.</p>
      </InfoBox>

      <CodeBlock language="javascript" title="Security Checklist for Cookies">
{`// SECURE cookie configuration
res.cookie('sessionId', sessionId, {
  httpOnly: true,      // Prevents XSS from reading the cookie
  secure: true,        // Only sent over HTTPS
  sameSite: 'lax',     // Prevents CSRF (most cases)
  maxAge: 3600000,     // 1 hour expiry
  path: '/',           // Sent for all paths
  domain: '.example.com',
});

// INSECURE cookie configuration - DON'T DO THIS
res.cookie('sessionId', sessionId, {
  // httpOnly: false (default) - JS can read it!
  // secure: false (default) - sent over HTTP!
  // sameSite: 'none' - sent cross-site!
  // No maxAge - session cookie only
});`}
      </CodeBlock>

      <h2>Quick Reference</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Attack</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>What Happens</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Cookie Defense</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>XSS</td>
            <td style={{ padding: '0.75rem' }}>Malicious JS reads <code>document.cookie</code></td>
            <td style={{ padding: '0.75rem' }}><code>HttpOnly</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>CSRF</td>
            <td style={{ padding: '0.75rem' }}>Forged cross-site request with auto-sent cookies</td>
            <td style={{ padding: '0.75rem' }}><code>SameSite=Lax/Strict</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>Theft</td>
            <td style={{ padding: '0.75rem' }}>Network interception over HTTP</td>
            <td style={{ padding: '0.75rem' }}><code>Secure</code></td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"Which cookie attribute prevents JavaScript from accessing a session cookie, mitigating XSS attacks?"}
        options={[
          "Secure",
          "SameSite=Strict",
          "HttpOnly",
          "Path=/"
        ]}
        correctIndex={2}
        explanation={"The HttpOnly flag makes the cookie completely invisible to JavaScript — document.cookie will not include it. This is the primary defense against XSS cookie theft. Even if an attacker injects malicious JavaScript into your page, they cannot read HttpOnly cookies. This is why session cookies and JWT cookies should ALWAYS be HttpOnly."}
      />

      <InteractiveChallenge
        question={"What is the key difference between a session cookie and a persistent cookie?"}
        options={[
          "Session cookies are encrypted while persistent cookies are not",
          "Session cookies have no Max-Age/Expires and are deleted when the browser closes; persistent cookies survive browser restarts",
          "Session cookies can only be used for authentication",
          "Persistent cookies are larger than session cookies"
        ]}
        correctIndex={1}
        explanation={"A session cookie has no Max-Age or Expires attribute. The browser keeps it in memory and deletes it when the tab or browser window closes. A persistent cookie has a Max-Age or Expires, so the browser writes it to disk and includes it even after restart. 'Remember me' features typically use persistent cookies with a longer Max-Age."}
      />
    </LessonLayout>
  );
}
