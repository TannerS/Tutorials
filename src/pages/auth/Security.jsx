import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Security() {
  return (
    <LessonLayout
      title="Web Security (CORS, CSRF, XSS)"
      sectionId="auth"
      lessonIndex={6}
      prev={{ path: '/auth/authz', label: 'AuthN vs AuthZ' }}
      next={null}
    >
      <p>
        Even with perfect authentication and authorization, web applications face a variety of attacks
        that exploit the browser&#39;s trust model. This lesson covers the three most critical web security
        topics — CORS, CSRF, and XSS — along with security headers, input validation, and a comprehensive
        security checklist for API developers.
      </p>

      <h2>CORS (Cross-Origin Resource Sharing)</h2>

      <p>
        CORS is a browser security mechanism that controls which origins (domains) can make requests to
        your API. By default, browsers enforce the <strong>Same-Origin Policy</strong>: JavaScript on
        <code>app.example.com</code> cannot make requests to <code>api.other.com</code> unless the
        server explicitly allows it via CORS headers.
      </p>

      <h3>How CORS Works</h3>

      <InfoBox variant="info" title="Simple vs Preflight Requests">
        <p><strong>Simple Requests</strong> — GET, POST (with simple content types), HEAD. Browser sends the request directly with an <code>Origin</code> header. Server responds with <code>Access-Control-Allow-Origin</code>.</p>
        <p><strong>Preflight Requests</strong> — Triggered by custom headers, PUT/DELETE methods, or JSON content type. Browser sends an OPTIONS request first to ask for permission. Server must respond with appropriate CORS headers before the actual request is sent.</p>
      </InfoBox>

      <FlowChart
        title="CORS Preflight Flow"
        chart={"graph TD\n  A[\"Browser: JS calls fetch to api.other.com\"] --> B{\"Simple request?\"}\n  B -->|\"Yes\"| C[\"Send request with Origin header\"]\n  B -->|\"No\"| D[\"Send OPTIONS preflight\"]\n  D --> E[\"Server responds with CORS headers\"]\n  E --> F{\"Allowed?\"}\n  F -->|\"No\"| G[\"Browser blocks request\"]\n  F -->|\"Yes\"| H[\"Send actual request\"]\n  C --> I[\"Server responds with Access-Control-Allow-Origin\"]\n  H --> I\n  I --> J{\"Origin allowed?\"}\n  J -->|\"Yes\"| K[\"Browser delivers response to JS\"]\n  J -->|\"No\"| L[\"Browser blocks response\"]\n  style G fill:#3b1a1a,stroke:#dc2626\n  style L fill:#3b1a1a,stroke:#dc2626\n  style K fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="text" title="CORS Preflight — Request and Response">
{`--- Preflight Request (browser sends automatically) ---
OPTIONS /api/users HTTP/1.1
Host: api.example.com
Origin: https://app.example.com
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: Authorization, Content-Type

--- Preflight Response (server must respond) ---
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400    (cache preflight for 24 hours)`}
      </CodeBlock>

      <CodeBlock language="javascript" title="CORS Configuration (Express.js)">
{`const cors = require('cors');

// SECURE: whitelist specific origins
app.use(cors({
  origin: [
    'https://app.example.com',
    'https://admin.example.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,          // Allow cookies
  maxAge: 86400,              // Cache preflight for 24 hours
}));

// INSECURE — DON'T DO THIS IN PRODUCTION
app.use(cors({
  origin: '*',                // Any origin can access
  credentials: true,          // This actually fails — * and credentials are incompatible
}));`}
      </CodeBlock>

      <CodeBlock language="java" title="CORS Configuration (Spring Boot)">
{`@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "https://app.example.com",
                "https://admin.example.com"
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("Authorization", "Content-Type")
            .allowCredentials(true)
            .maxAge(86400);
    }
}

// Or per-controller
@RestController
@CrossOrigin(
    origins = "https://app.example.com",
    allowCredentials = "true"
)
@RequestMapping("/api/users")
public class UserController {
    // ...
}`}
      </CodeBlock>

      <h2>CSRF (Cross-Site Request Forgery)</h2>

      <p>
        CSRF tricks the user&#39;s browser into making an unwanted request to a site where the user is
        authenticated. Because cookies are sent automatically, the malicious request includes the
        session cookie, and the server cannot distinguish it from a legitimate request.
      </p>

      <h3>CSRF Attack Flow</h3>

      <FlowChart
        title="CSRF Attack"
        chart={"graph TD\n  A[\"User logs into bank.com\"] --> B[\"Session cookie stored in browser\"]\n  B --> C[\"User visits evil.com\"]\n  C --> D[\"evil.com has hidden form\"]\n  D --> E[\"Form auto-submits POST to bank.com/transfer\"]\n  E --> F[\"Browser includes bank.com session cookie\"]\n  F --> G[\"bank.com thinks it is legitimate!\"]\n  G --> H[\"Money transferred to attacker\"]\n  style C fill:#3b1a1a,stroke:#dc2626\n  style D fill:#3b1a1a,stroke:#dc2626\n  style H fill:#3b1a1a,stroke:#dc2626"}
      />

      <h3>CSRF Defenses</h3>

      <InfoBox variant="tip" title="Defense Strategies">
        <p><strong>SameSite Cookies (Primary)</strong> — Set <code>SameSite=Lax</code> or <code>Strict</code>. The browser will not send the cookie with cross-site POST requests, blocking CSRF entirely.</p>
        <p><strong>CSRF Tokens (Legacy)</strong> — Server generates a random token per session, embeds it in forms and AJAX requests. Server validates the token on every state-changing request. Attacker cannot guess the token.</p>
        <p><strong>Double Submit Cookie</strong> — Set a random value in both a cookie and a request header. Server checks that they match. Works because the attacker can send the cookie (automatic) but cannot read it to set the header (same-origin policy).</p>
      </InfoBox>

      <CodeBlock language="javascript" title="CSRF Protection (Express.js)">
{`const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

// CSRF token middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  },
});

// Generate token for forms
app.get('/form', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Validate token on state-changing requests
app.post('/transfer', csrfProtection, (req, res) => {
  // If CSRF token is missing or invalid, csurf throws an error
  processTransfer(req.body);
  res.json({ success: true });
});

// In your SPA, include the token in requests:
// fetch('/transfer', {
//   method: 'POST',
//   headers: {
//     'CSRF-Token': csrfToken,     // From the /form endpoint
//     'Content-Type': 'application/json',
//   },
//   body: JSON.stringify({ to: 'alice', amount: 100 }),
//   credentials: 'include',
// });`}
      </CodeBlock>

      <h2>XSS (Cross-Site Scripting)</h2>

      <p>
        XSS attacks inject malicious JavaScript into web pages viewed by other users. Once the attacker&#39;s
        script runs in the victim&#39;s browser, it can steal cookies, session tokens, capture keystrokes,
        redirect users, or modify the page content.
      </p>

      <h3>Types of XSS</h3>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Type</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>How It Works</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Stored XSS</strong></td>
            <td style={{ padding: '0.75rem' }}>Malicious script saved in database, served to all users</td>
            <td style={{ padding: '0.75rem' }}>Comment field with injected script tag</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Reflected XSS</strong></td>
            <td style={{ padding: '0.75rem' }}>Script included in URL, reflected in page response</td>
            <td style={{ padding: '0.75rem' }}>Search query echoed in results page</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>DOM-based XSS</strong></td>
            <td style={{ padding: '0.75rem' }}>Client-side JS inserts untrusted data into DOM unsafely</td>
            <td style={{ padding: '0.75rem' }}>Using innerHTML with user input</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="javascript" title="XSS Prevention">
{`// BAD: Direct insertion of user input (DOM XSS)
document.getElementById('output').innerHTML = userInput;

// GOOD: Use textContent (auto-escapes HTML)
document.getElementById('output').textContent = userInput;

// React auto-escapes by default!
function Comment({ text }) {
  return <p>{text}</p>;  // Safe — React escapes HTML entities
}

// DANGEROUS in React: dangerouslySetInnerHTML
function Comment({ html }) {
  // ONLY use with sanitized content!
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}

// Server-side: sanitize input
const DOMPurify = require('isomorphic-dompurify');
const clean = DOMPurify.sanitize(userInput);

// Server-side: escape HTML entities
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}`}
      </CodeBlock>

      <h2>Security Headers</h2>

      <p>
        Security headers are HTTP response headers that instruct the browser to enable additional
        security protections. They form a critical layer of defense-in-depth.
      </p>

      <CodeBlock language="javascript" title="Security Headers (Express.js with Helmet)">
{`const helmet = require('helmet');

app.use(helmet());

// Or configure individually:
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'nonce-{random}'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.example.com"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));

app.use(helmet.hsts({
  maxAge: 31536000,             // 1 year
  includeSubDomains: true,
  preload: true,
}));`}
      </CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Header</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Purpose</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Content-Security-Policy</strong></td>
            <td style={{ padding: '0.75rem' }}>Whitelist allowed sources for scripts, styles, images, etc. Primary XSS defense.</td>
            <td style={{ padding: '0.75rem' }}><code>default-src &#39;self&#39;</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>X-Frame-Options</strong></td>
            <td style={{ padding: '0.75rem' }}>Prevents clickjacking by controlling if page can be framed</td>
            <td style={{ padding: '0.75rem' }}><code>DENY</code> or <code>SAMEORIGIN</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>X-Content-Type-Options</strong></td>
            <td style={{ padding: '0.75rem' }}>Prevents MIME-type sniffing</td>
            <td style={{ padding: '0.75rem' }}><code>nosniff</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Strict-Transport-Security</strong></td>
            <td style={{ padding: '0.75rem' }}>Forces HTTPS — browser refuses HTTP connections</td>
            <td style={{ padding: '0.75rem' }}><code>max-age=31536000; includeSubDomains; preload</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Referrer-Policy</strong></td>
            <td style={{ padding: '0.75rem' }}>Controls how much referrer info is sent</td>
            <td style={{ padding: '0.75rem' }}><code>strict-origin-when-cross-origin</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Permissions-Policy</strong></td>
            <td style={{ padding: '0.75rem' }}>Controls browser features (camera, mic, geolocation)</td>
            <td style={{ padding: '0.75rem' }}><code>camera=(), microphone=(), geolocation=()</code></td>
          </tr>
        </tbody>
      </table>

      <h2>Input Validation and Rate Limiting</h2>

      <CodeBlock language="javascript" title="Input Validation and Rate Limiting (Express.js)">
{`const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 5,                       // 5 attempts per window
  message: { error: 'Too many login attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,         // 1 minute
  max: 100,                     // 100 requests per minute
});

app.use('/api/', apiLimiter);

// Input validation
app.post('/register',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .matches(/[A-Z]/).withMessage('Must contain uppercase')
      .matches(/[0-9]/).withMessage('Must contain number')
      .matches(/[^A-Za-z0-9]/).withMessage('Must contain special char'),
    body('name').trim().escape().isLength({ min: 1, max: 100 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process registration...
  }
);`}
      </CodeBlock>

      <h2>Security Best Practices</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#4ade80' }}>DO</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#dc2626' }}>DON&#39;T</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>HttpOnly on session/token cookies</td>
            <td style={{ padding: '0.75rem' }}>Store JWTs in localStorage (XSS risk)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>Secure flag on all auth cookies</td>
            <td style={{ padding: '0.75rem' }}>Send cookies over HTTP</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>SameSite=Lax or Strict</td>
            <td style={{ padding: '0.75rem' }}>Use SameSite=None without Secure</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>Short JWT expiry (15-60 min)</td>
            <td style={{ padding: '0.75rem' }}>Create JWTs that never expire</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>PKCE for SPAs and mobile apps</td>
            <td style={{ padding: '0.75rem' }}>Use the OAuth implicit flow</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>Validate iss/aud/exp on every JWT</td>
            <td style={{ padding: '0.75rem' }}>Trust JWTs without verification</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>Invalidate sessions on logout (server-side)</td>
            <td style={{ padding: '0.75rem' }}>Just clear the cookie without server invalidation</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>Rotate refresh tokens on use</td>
            <td style={{ padding: '0.75rem' }}>Reuse refresh tokens indefinitely</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>Use Content-Security-Policy header</td>
            <td style={{ padding: '0.75rem' }}>Allow inline scripts without nonces</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>Rate limit authentication endpoints</td>
            <td style={{ padding: '0.75rem' }}>Allow unlimited login attempts</td>
          </tr>
        </tbody>
      </table>

      <h2>API Security Checklist</h2>

      <InfoBox variant="success" title="Security Checklist for API Developers">
        <p><strong>Transport:</strong> TLS 1.3 everywhere. HSTS header. No mixed content.</p>
        <p><strong>Authentication:</strong> Hash passwords with bcrypt/argon2. Use OAuth 2.0 + PKCE for third-party auth. Short-lived JWTs + refresh token rotation.</p>
        <p><strong>Cookies:</strong> HttpOnly, Secure, SameSite=Lax on all auth cookies.</p>
        <p><strong>CORS:</strong> Whitelist specific origins. Never use <code>*</code> with credentials.</p>
        <p><strong>Input:</strong> Validate and sanitize all input. Use parameterized queries (no SQL injection). Escape output.</p>
        <p><strong>Headers:</strong> CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy.</p>
        <p><strong>Rate Limiting:</strong> Throttle login attempts. Rate limit API endpoints. Implement account lockout.</p>
        <p><strong>Logging:</strong> Log auth events (login, logout, failed attempts). Monitor for anomalies. Never log passwords or tokens.</p>
      </InfoBox>

      <InfoBox variant="warning" title="Defense in Depth">
        <p>
          No single security measure is sufficient. Security is about <strong>layers</strong>: TLS protects
          data in transit, HttpOnly protects cookies from XSS, SameSite protects against CSRF, CSP limits
          script execution, rate limiting prevents brute force, input validation prevents injection. Each
          layer catches what the others might miss. If one layer fails, the others still protect you.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"A CORS preflight request is triggered when the browser needs to send a non-simple request (like DELETE or a request with custom headers). What HTTP method does the browser use for the preflight?"}
        options={[
          "GET",
          "POST",
          "HEAD",
          "OPTIONS"
        ]}
        correctIndex={3}
        explanation={"The browser sends an OPTIONS request as the preflight. This request includes Access-Control-Request-Method and Access-Control-Request-Headers to tell the server what the actual request will look like. The server must respond with appropriate Access-Control-Allow-* headers. Only if the preflight response allows it will the browser send the actual request. The preflight is cached (via Access-Control-Max-Age) to avoid repeating it."}
      />

      <InteractiveChallenge
        question={"Which security measure is the PRIMARY defense against XSS attacks in modern web applications?"}
        options={[
          "CORS headers",
          "CSRF tokens",
          "Content-Security-Policy (CSP) header combined with output encoding and input sanitization",
          "Rate limiting"
        ]}
        correctIndex={2}
        explanation={"CSP is the most powerful defense against XSS. It whitelists which sources can execute scripts, load styles, and fetch resources. Even if an attacker injects a script tag, CSP blocks it from executing because the source is not whitelisted. Combined with output encoding (escaping HTML entities in server responses) and input sanitization (cleaning user input), these form a multi-layered defense. React auto-escapes JSX output, providing built-in XSS protection."}
      />
    </LessonLayout>
  );
}
