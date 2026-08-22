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
      lessonIndex={1}
      prev={{ path: '/auth/authz', label: 'AuthN vs AuthZ' }}
      next={{ path: '/auth/jwt', label: 'JWT Deep Dive' }}
    >
      <p>
        HTTP is stateless — each request is independent, with no memory of the one before it. That is the
        problem left open once the login itself succeeds: <a href="/cryptography/tls">TLS</a> secured the
        channel and the user sent their password, and then the very next request arrives looking exactly
        like an anonymous one. Cookies and sessions are the classic answer, and they are Phase 3 of the
        login flow.
      </p>

      <p>
        The idea is deliberately simple: the server keeps the real state and gives the browser nothing
        but a meaningless <strong>pointer</strong> to it. Everything in this lesson follows from that one
        decision — including why logout is trivial here and hard in the next lesson.
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
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Attribute</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Purpose</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Domain</strong></td>
            <td style={{ padding: '0.75rem' }}>Which domain(s) receive the cookie. Setting it <em>widens</em> scope to all subdomains; omitting it locks the cookie to the exact host, which is what you want for auth</td>
            <td style={{ padding: '0.75rem' }}><code>Domain=example.com</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Path</strong></td>
            <td style={{ padding: '0.75rem' }}>URL path that must exist for cookie to be sent</td>
            <td style={{ padding: '0.75rem' }}><code>Path=/api</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Max-Age / Expires</strong></td>
            <td style={{ padding: '0.75rem' }}>How long the cookie lives</td>
            <td style={{ padding: '0.75rem' }}><code>Max-Age=3600</code> (1 hour)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Secure</strong></td>
            <td style={{ padding: '0.75rem' }}>Only send over HTTPS</td>
            <td style={{ padding: '0.75rem' }}><code>Secure</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>HttpOnly</strong></td>
            <td style={{ padding: '0.75rem' }}>Inaccessible to JavaScript — critical for security</td>
            <td style={{ padding: '0.75rem' }}><code>HttpOnly</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
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

      <InfoBox variant="tip" title="The Default Is Lax — But Set It Anyway">
        <p>
          Since 2020 Chrome and Edge treat a cookie with <strong>no</strong>{' '}
          <code>SameSite</code> attribute as <code>SameSite=Lax</code>. Omitting it is therefore not the
          same as opting out on those browsers — you get Lax by default, which is usually what you
          wanted. <strong>Firefox never shipped this on release</strong>:{' '}
          <code>network.cookie.sameSite.laxByDefault</code> is enabled only on Nightly, and the
          rollout was abandoned over web-compatibility breakage.
        </p>
        <p>
          Still set it explicitly. The default is browser policy rather than a guarantee (Safari&apos;s
          behaviour has historically differed, and older clients default to <code>None</code>), and an
          explicit attribute documents the intent for the next person reading the code.
        </p>
        <p>
          One sharp edge worth knowing: under <em>schemeful</em> same-site — which is what governs{' '}
          <code>SameSite</code> today — a site is registrable-domain <strong>+ scheme</strong>, so{' '}
          <code>http://example.com</code> and <code>https://example.com</code> are{' '}
          <strong>different</strong> sites. That is the modern definition; the older schemeless one
          treated them as the same. Either way <code>SameSite</code> is not a substitute for{' '}
          <code>Secure</code>: a non-enforcing or older client will happily send a{' '}
          <code>Lax</code> cookie over plaintext, so you still need <code>Secure</code> to keep it
          off the wire.
        </p>
      </InfoBox>

      <h2>Session vs Persistent Cookies</h2>

      <InfoBox variant="info" title="Two Types of Cookies">
        <p><strong>Session Cookie</strong> — No <code>Max-Age</code> or <code>Expires</code> set. The browser keeps it only for the lifetime of the browser <em>session</em> and never writes it to disk. Used for temporary state like a session ID.</p>
        <p><strong>Persistent Cookie</strong> — Has <code>Max-Age</code> or <code>Expires</code>. Survives browser restarts. Used for "remember me" features, theme preferences, and analytics.</p>
      </InfoBox>

      <InfoBox variant="warning" title="A Session Cookie Is Not a Reliable Expiry Mechanism">
        <p>
          Two things people get wrong here. First, it dies when the <strong>browser</strong> closes, not
          when the tab does — other tabs and windows share the same cookie jar.
        </p>
        <p>
          Second, and more importantly: every major browser has a session-restore feature
          (&quot;continue where you left off&quot;, restore-after-crash, and mobile browsers that are
          almost never truly closed). When it kicks in, session cookies are restored too, so a
          &quot;session&quot; cookie can easily outlive the browser by days.
        </p>
        <p>
          <strong>Never rely on browser shutdown to end a session.</strong> Enforce the lifetime
          server-side — an idle timeout that slides on activity plus an absolute cap that does not — and
          treat the cookie&apos;s own expiry as a convenience for the browser, not a security control.
        </p>
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

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // CRITICAL: issue a BRAND NEW session ID at the moment privilege
  // changes. Writing userId onto the pre-login session ID is the
  // session fixation bug (see below).
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });

    req.session.userId = user.id;       // Store user ID in session
    req.session.roles = user.roles;     // Store roles in session
    res.json({ message: 'Logged in' });
  });
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
}

// NOTE: Spring Security's own login filters call changeSessionId()
// for you (sessionManagement().sessionFixation().changeSessionId()
// is the default). A hand-rolled controller like the one above does
// NOT — you must rotate the ID yourself, e.g. via
// request.changeSessionId() before writing the user attributes.`}
      </CodeBlock>

      <h2>Session Fixation — the Bug That Hides in Every Hand-Rolled Login</h2>

      <p>
        Notice the <code>regenerate()</code> call in the Express example above. It is not boilerplate; it
        is the entire defence against <strong>session fixation</strong>, and hand-written login handlers
        omit it constantly.
      </p>

      <InfoBox variant="danger" title="How the Attack Works">
        <p>
          Sessions are usually created on the <em>first</em> request, before anyone logs in — that is how
          a shopping cart survives until checkout. So the attacker does not need to steal your cookie
          afterwards; they can <strong>plant one beforehand</strong>.
        </p>
        <p>
          The attacker visits your site, gets an anonymous session ID, and gets the victim&apos;s browser
          to adopt that same ID (a crafted link if you ever accept a session ID from the URL, an injected
          <code> Set-Cookie</code> from a subdomain they control, or an XSS on any same-site page). The
          victim then logs in normally. If the server simply writes <code>userId</code> onto the existing
          session, the attacker&apos;s pre-planted ID is now an <strong>authenticated</strong> session —
          and they are holding a copy of it.
        </p>
        <p>
          <strong>The fix:</strong> rotate the session identifier every time the privilege level changes —
          at login, and again on any step-up such as re-authenticating before a password change. Express
          calls it <code>req.session.regenerate()</code>, Servlet/Spring calls it{' '}
          <code>request.changeSessionId()</code>, PHP calls it{' '}
          <code>session_regenerate_id(true)</code>. Same idea everywhere: the ID the attacker holds ceases
          to be the ID that is logged in.
        </p>
      </InfoBox>

      <h2>Cookie Name Prefixes: <code>__Host-</code> and <code>__Secure-</code></h2>

      <p>
        Cookie attributes are invisible once the cookie comes back — the browser sends only{' '}
        <code>Cookie: name=value</code>, with no indication of whether it was set with{' '}
        <code>Secure</code>, or which host set it. Prefixes solve that by making the browser refuse to
        store a cookie unless the attributes match its name, so the name itself becomes a guarantee.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Prefix</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Browser Enforces</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>What It Guarantees</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>__Secure-</code></td>
            <td style={{ padding: '0.75rem' }}>Must have <code>Secure</code>, must be set from an HTTPS page</td>
            <td style={{ padding: '0.75rem' }}>The cookie was never set over plain HTTP</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>__Host-</code></td>
            <td style={{ padding: '0.75rem' }}><code>Secure</code>, <code>Path=/</code>, and <strong>no <code>Domain</code> attribute</strong></td>
            <td style={{ padding: '0.75rem' }}>Locked to the exact host that set it — a subdomain cannot write it</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="tip" title="Why __Host- Is the One That Matters for Auth">
        <p>
          Cookies do not respect the origin boundary the way everything else in the browser does.{' '}
          <code>blog.example.com</code> can set a cookie with{' '}
          <code>Domain=example.com</code> that <code>app.example.com</code> will then send — so one
          neglected subdomain, or one subdomain takeover, is enough to overwrite your session cookie or
          plant a fixed session ID.
        </p>
        <p>
          Because <code>__Host-</code> forbids the <code>Domain</code> attribute entirely, the browser
          refuses to store any subdomain&apos;s attempt to set that name. Name your session cookie{' '}
          <code>__Host-sessionId</code> and subdomain cookie injection stops being your problem. This is
          the same reason the CSRF token in the <em>Web Security</em> lesson uses a{' '}
          <code>__Host-</code> name.
        </p>
      </InfoBox>

      <h2>Third-Party Cookies and CHIPS (<code>Partitioned</code>)</h2>

      <InfoBox variant="info" title="Same Cookie, Different Top-Level Site">
        <p>
          Historically a cookie set by <code>widget.example</code> was shared across <em>every</em> site
          that embedded that widget — which is precisely how cross-site tracking worked, and why browsers
          have been restricting third-party cookies (Safari&apos;s ITP and Firefox&apos;s Total Cookie
          Protection block them outright; Chrome ships user-facing controls for them).
        </p>
        <p>
          <strong>CHIPS</strong> (Cookies Having Independent Partitioned State) is the sanctioned way to
          keep a legitimate embedded widget working: adding the <code>Partitioned</code> attribute gives
          the cookie a separate jar <em>per top-level site</em>. Your chat widget on{' '}
          <code>shop-a.com</code> and the same widget on <code>shop-b.com</code> each get their own
          isolated cookie, and neither can be used to correlate the user across the two.
        </p>
        <p>
          <code>Set-Cookie: __Host-widgetSession=abc; Secure; Path=/; SameSite=None; Partitioned</code>
        </p>
        <p>
          <strong>Rule of thumb:</strong> a first-party login cookie should never need this. If you find
          yourself reaching for <code>SameSite=None</code> to make auth work inside an iframe, add{' '}
          <code>Partitioned</code> — and be aware that the partitioned cookie is genuinely a different
          cookie per embedding site, so a session established in one will not exist in another.
        </p>
      </InfoBox>

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
        <p><strong>Mitigation:</strong> <code>SameSite=Lax</code> or <code>Strict</code> is the baseline layer — it stops the browser attaching the cookie to a cross-site POST, which kills the classic version of this attack. It is <em>not</em> a complete defence on its own: <code>SameSite</code> is site-scoped, so a hostile subdomain still counts as same-site, and <code>Lax</code> still permits top-level GET navigations. Pair it with a CSRF token bound to the session, and an <code>Origin</code> / <code>Sec-Fetch-Site</code> check. The <strong>Web Security</strong> lesson at the end of this section works through all of this in detail.</p>
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
res.cookie('__Host-sessionId', sessionId, {
  httpOnly: true,      // Prevents XSS from reading the cookie
  secure: true,        // Only sent over HTTPS (required by __Host-)
  sameSite: 'lax',     // Baseline CSRF layer — not the whole defence
  maxAge: 3600000,     // 1 hour expiry
  path: '/',           // Required by __Host-
  // NO domain: — deliberately. Omitting Domain scopes the cookie to
  // this exact host, so no subdomain can read or overwrite it. The
  // __Host- prefix makes the browser ENFORCE that omission.
});

// INSECURE cookie configuration - DON'T DO THIS
res.cookie('sessionId', sessionId, {
  // httpOnly omitted (default false) - JS can read it!
  // secure omitted (default false) - sent over plain HTTP!
  // sameSite omitted - modern browsers apply Lax, but you are
  //   relying on a browser default instead of stating intent.
  domain: '.example.com',  // WIDENS scope to every subdomain --
                           // one compromised subdomain gets the session.
});`}
      </CodeBlock>

      <h2>Quick Reference</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Attack</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>What Happens</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Cookie Defense</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>XSS</td>
            <td style={{ padding: '0.75rem' }}>Malicious JS reads <code>document.cookie</code></td>
            <td style={{ padding: '0.75rem' }}><code>HttpOnly</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>CSRF</td>
            <td style={{ padding: '0.75rem' }}>Forged cross-site request with auto-sent cookies</td>
            <td style={{ padding: '0.75rem' }}><code>SameSite=Lax/Strict</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Theft</td>
            <td style={{ padding: '0.75rem' }}>Network interception over HTTP</td>
            <td style={{ padding: '0.75rem' }}><code>Secure</code></td>
          </tr>
        </tbody>
      </table>

      <h2>The Bill for Server-Side State</h2>

      <p>
        Look back at the cons above, because they are the entire motivation for the next lesson. Every
        request costs a lookup in a shared store, that store has to be highly available, and once you run
        services across several teams and machines they all need to reach it. The session ID is
        meaningless on its own — its meaning lives in Redis.
      </p>

      <p>
        So the obvious question is: what if the token carried its own meaning, signed so it cannot be
        tampered with, so any service could verify it locally with no lookup at all? That is a JWT. It is
        not a replacement for what you just learned — it is the same problem solved from the opposite
        end, and it trades away the one thing sessions are best at: instant revocation.
      </p>

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
          "Session cookies have no Max-Age/Expires and are held in memory; persistent cookies have one and are written to disk",
          "Session cookies can only be used for authentication",
          "Persistent cookies are larger than session cookies"
        ]}
        correctIndex={1}
        explanation={"A session cookie has no Max-Age or Expires attribute, so the browser holds it in memory rather than writing it to disk. A persistent cookie has one, so it is stored on disk and survives a restart. Note the careful wording: a session cookie dies with the BROWSER, not the tab — and session-restore features routinely bring it back, so it is not a reliable expiry mechanism. 'Remember me' features typically use persistent cookies with a longer Max-Age."}
      />
    </LessonLayout>
  );
}
