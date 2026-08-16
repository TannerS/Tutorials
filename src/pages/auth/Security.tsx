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
      lessonIndex={5}
      prev={{ path: '/auth/gateway', label: 'Gateway Auth: Envoy, Redis & the Auth Wall' }}
      next={{ path: '/auth/sso', label: 'SSO & SAML' }}
    >
      <p>
        Every mechanism in this section works exactly as designed and the user can still be robbed,
        because all three of the attacks below abuse the browser&#39;s trust model rather than breaking
        your auth. They map directly onto what you just built: <strong>XSS</strong> steals or misuses the
        credential from the Cookies and JWT lessons, <strong>CSRF</strong> weaponises the fact that the
        browser attaches that cookie automatically, and <strong>CORS</strong> is the mechanism everyone
        mistakes for a defence against the other two.
      </p>

      <p>
        This closes the section: the three critical browser-security topics, plus security headers, input
        validation, and a checklist that collects every rule from the previous seven lessons in one place.
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

      <InfoBox variant="warning" title="What CORS Is Not">
        <p>
          CORS is the most widely misunderstood browser mechanism, and
          interviewers probe it for exactly that reason.
        </p>
        <p>
          <strong>It is not server-side access control.</strong> A restrictive
          CORS policy does not stop the request reaching your server — for a
          simple request the server has already executed it, and the browser
          merely refuses to hand the <em>response</em> back to the calling
          JavaScript. Any non-browser client (curl, Postman, a backend service,
          a script) ignores CORS entirely. Authorization must be enforced on
          the server, always.
        </p>
        <p>
          <strong>It does not prevent CSRF.</strong> The classic CSRF attack is
          a form POST or image load, which the same-origin policy permits
          cross-origin without any CORS involvement. Loosening CORS can{' '}
          <em>enable</em> attacks, but tightening it is not a CSRF defence.
        </p>
        <p>
          <strong>Reflecting the Origin header is the same as{' '}
          <code>*</code>.</strong> Reading <code>req.headers.origin</code> and
          echoing it back into{' '}
          <code>Access-Control-Allow-Origin</code> — often done to &quot;fix&quot;
          the fact that <code>*</code> is incompatible with{' '}
          <code>credentials: true</code> — allows every origin while also
          permitting cookies. Validate against an allowlist instead.
        </p>
      </InfoBox>

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
        <p><strong>SameSite Cookies (necessary, not sufficient)</strong> — Set <code>SameSite=Lax</code> or <code>Strict</code>. This stops the browser attaching the cookie to cross-site POSTs, which kills the classic attack. Treat it as your baseline layer, but see the caveats below — it is not a complete defence on its own.</p>
        <p><strong>Synchronizer Token Pattern (the strong default)</strong> — Server generates a random token bound to the session, embeds it in forms and AJAX requests, and validates it on every state-changing request. The attacker&apos;s site cannot read the token, so it cannot forge a valid request. This is what Spring Security does out of the box.</p>
        <p><strong>Signed Double Submit Cookie</strong> — Useful when you have no server-side session to bind a token to. Send a random value in both a cookie and a header, and check they match. Critically, the value must be <strong>signed or bound to the session</strong> — see the warning below.</p>
        <p><strong>Origin / Sec-Fetch-Site header check</strong> — Reject state-changing requests whose <code>Origin</code> does not match your own, or whose <code>Sec-Fetch-Site</code> is <code>cross-site</code>. Cheap, stateless, and well-supported in current browsers; excellent as a second layer.</p>
      </InfoBox>

      <InfoBox variant="warning" title="Why SameSite Alone Is Not Enough">
        <p>
          <strong>SameSite is site-scoped, not origin-scoped.</strong> A
          compromised or attacker-controlled subdomain
          (<code>blog.example.com</code>) counts as the <em>same site</em> as{' '}
          <code>app.example.com</code>, so <code>Lax</code> and{' '}
          <code>Strict</code> cookies are still sent. Subdomain takeover
          therefore reopens CSRF completely.
        </p>
        <p>
          <strong><code>Lax</code> still allows top-level GET
          navigations.</strong> Harmless if you follow the rule that GET must
          never change state — but any state-changing GET endpoint is
          immediately exploitable.
        </p>
        <p>
          <strong>You do not control the browser.</strong> Enforcement depends
          entirely on the client, so an outdated or non-standard browser gets
          no protection at all. Defence in depth means pairing SameSite with a
          token or Origin check, not choosing between them.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="Naive Double Submit Is Breakable">
        <p>
          The plain version — &quot;generate a random value, put it in a cookie
          and a header, check they match&quot; — assumes an attacker cannot{' '}
          <em>set</em> your cookies. That assumption fails: cookies ignore the
          origin boundary, so an attacker controlling any subdomain (or able to
          MITM a plain-HTTP subdomain) can write a cookie scoped to your parent
          domain and then submit a matching header. Both sides match and the
          check passes.
        </p>
        <p>
          The fix is to make the value unforgeable: use an HMAC of the session
          ID rather than a bare random value, so the server can verify the
          token actually belongs to <em>this</em> session. Use the{' '}
          <code>__Host-</code> cookie prefix as well, which forbids a{' '}
          <code>Domain</code> attribute and so blocks subdomain injection.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Bearer Tokens Are Naturally CSRF-Immune">
        <p>
          CSRF exists because browsers attach <strong>cookies</strong>{' '}
          automatically. A token sent in an <code>Authorization: Bearer</code>{' '}
          header is not attached automatically — the attacker&apos;s page would
          have to read your token and set the header itself, which the
          same-origin policy prevents.
        </p>
        <p>
          So a pure header-based API genuinely does not need CSRF tokens, and
          this is why Spring Security lets you disable CSRF for stateless JWT
          APIs. The trade-off is the one from the JWT lesson: storing that
          token somewhere JavaScript can reach it trades a CSRF problem for an
          XSS problem. If you store tokens in cookies — the safer choice
          against XSS — CSRF protection is back on the table and you need it.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Do Not Use csurf">
        <p>
          Most Express CSRF tutorials still reach for the <code>csurf</code>{' '}
          package. It was <strong>deprecated and archived by its maintainers
          in 2022</strong> and shipped a broken default double-submit
          implementation. If you find it in an existing codebase, replace it —{' '}
          <code>csrf-csrf</code> implements the signed double-submit pattern
          correctly, and <code>@fastify/csrf-protection</code> is the Fastify
          equivalent.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="CSRF Protection (Express.js, signed double submit)">
{`const { doubleCsrf } = require('csrf-csrf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  // Secret used to HMAC the token — this is what makes the token
  // unforgeable and fixes the naive double-submit weakness.
  getSecret: () => process.env.CSRF_SECRET,

  // Bind the token to the session so a token minted for one user
  // cannot be replayed against another.
  getSessionIdentifier: (req) => req.session.id,

  cookieName: '__Host-psifi.x-csrf-token', // __Host- blocks subdomain injection
  cookieOptions: {
    httpOnly: true,
    secure: true,      // required by the __Host- prefix
    sameSite: 'lax',   // layered defence, not the only one
    path: '/',         // required by the __Host- prefix
  },

  // GET/HEAD/OPTIONS are safe and skipped — which is only true
  // if you never change state in a GET handler.
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// Hand the token to the SPA.
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: generateCsrfToken(req, res) });
});

// Protect every state-changing route.
app.use(doubleCsrfProtection);

app.post('/transfer', (req, res) => {
  processTransfer(req.body);
  res.json({ success: true });
});

// Belt-and-braces: reject cross-site requests outright.
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('sec-fetch-site') === 'cross-site') {
    return res.status(403).json({ error: 'Cross-site request rejected' });
  }
  next();
});

// In your SPA, include the token in requests:
// fetch('/transfer', {
//   method: 'POST',
//   headers: {
//     'x-csrf-token': csrfToken,   // From /api/csrf-token
//     'Content-Type': 'application/json',
//   },
//   body: JSON.stringify({ to: 'alice', amount: 100 }),
//   credentials: 'include',
// });`}
      </CodeBlock>

      <CodeBlock language="java" title="CSRF Protection (Spring Security)">
{`@Configuration
@EnableWebSecurity
public class CsrfConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            // CSRF protection is ON by default — you configure it,
            // you do not enable it.
            .csrf(csrf -> csrf
                // Token in a JS-readable cookie so a SPA can echo it back
                // in a header. The cookie is NOT the credential here, so
                // httpOnly=false is correct for this specific cookie.
                .csrfTokenRepository(
                    CookieCsrfTokenRepository.withHttpOnlyFalse())
                // Keep the Xor handler — it randomises the token per
                // response, which is what defends against BREACH.
                // Setting the request-attribute name to null opts out of
                // Security 6's DEFERRED token loading, which is the part
                // that actually breaks SPAs: without it the cookie is
                // never written until something reads the token.
                .csrfTokenRequestHandler(spaCsrfHandler())
            )
            .build();
    }

    private static CsrfTokenRequestHandler spaCsrfHandler() {
        var handler = new XorCsrfTokenRequestAttributeHandler();
        handler.setCsrfRequestAttributeName(null);
        return handler;
    }
}

// ⚠️ Do NOT "fix" a SPA by swapping in the plain
// CsrfTokenRequestAttributeHandler. It is widely posted as the SPA fix,
// but its actual effect is to turn OFF the per-response XOR masking —
// you trade a BREACH mitigation for a deferred-loading problem it was
// never the right tool for. Spring Security 7 adds .csrf(csrf -> csrf.spa())
// which wires the correct combination for you.

// Stateless JWT API using ONLY the Authorization header?
// Then and only then is disabling CSRF correct:
//     .csrf(AbstractHttpConfigurer::disable)
// If your JWT lives in a cookie, you still need CSRF protection.`}
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
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Type</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>How It Works</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Stored XSS</strong></td>
            <td style={{ padding: '0.75rem' }}>Malicious script saved in database, served to all users</td>
            <td style={{ padding: '0.75rem' }}>Comment field with injected script tag</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Reflected XSS</strong></td>
            <td style={{ padding: '0.75rem' }}>Script included in URL, reflected in page response</td>
            <td style={{ padding: '0.75rem' }}>Search query echoed in results page</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
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
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Header</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Purpose</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Content-Security-Policy</strong></td>
            <td style={{ padding: '0.75rem' }}>Whitelist allowed sources for scripts, styles, images, etc. Primary XSS defense.</td>
            <td style={{ padding: '0.75rem' }}><code>default-src &#39;self&#39;</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>X-Frame-Options</strong></td>
            <td style={{ padding: '0.75rem' }}>Prevents clickjacking by controlling if page can be framed</td>
            <td style={{ padding: '0.75rem' }}><code>DENY</code> or <code>SAMEORIGIN</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>X-Content-Type-Options</strong></td>
            <td style={{ padding: '0.75rem' }}>Prevents MIME-type sniffing</td>
            <td style={{ padding: '0.75rem' }}><code>nosniff</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Strict-Transport-Security</strong></td>
            <td style={{ padding: '0.75rem' }}>Forces HTTPS — browser refuses HTTP connections</td>
            <td style={{ padding: '0.75rem' }}><code>max-age=31536000; includeSubDomains; preload</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Referrer-Policy</strong></td>
            <td style={{ padding: '0.75rem' }}>Controls how much referrer info is sent</td>
            <td style={{ padding: '0.75rem' }}><code>strict-origin-when-cross-origin</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Permissions-Policy</strong></td>
            <td style={{ padding: '0.75rem' }}>Controls browser features (camera, mic, geolocation)</td>
            <td style={{ padding: '0.75rem' }}><code>camera=(), microphone=(), geolocation=()</code></td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="tip" title="Two Header Details Worth Knowing">
        <p>
          <strong>Host allowlists in CSP are largely ineffective.</strong> Google&apos;s own research
          found the great majority of real-world CSP policies bypassable, because allowlisting a CDN also
          allowlists every JSONP endpoint and outdated Angular copy hosted on it. The modern policy is{' '}
          <strong>nonce-based with <code>&#39;strict-dynamic&#39;</code></strong>: trust scripts carrying
          a per-response nonce, let those scripts load their own dependencies, and ignore host
          allowlists entirely.
        </p>
        <p>
          <code>script-src &#39;nonce-{'{random}'}&#39; &#39;strict-dynamic&#39; https: &#39;unsafe-inline&#39;; object-src &#39;none&#39;; base-uri &#39;none&#39;</code>
        </p>
        <p>
          The trailing <code>https:</code> and <code>&#39;unsafe-inline&#39;</code> look alarming but are
          deliberate fallbacks for older browsers — any browser that understands{' '}
          <code>&#39;strict-dynamic&#39;</code> ignores both. Note <code>base-uri &#39;none&#39;</code>,
          which is easy to forget and stops an injected <code>&lt;base&gt;</code> tag redirecting every
          relative script URL. The nonce must be freshly random per response; a static &quot;nonce&quot;
          is no protection at all.
        </p>
        <p>
          <strong><code>X-Frame-Options</code> is superseded by{' '}
          <code>frame-ancestors</code>.</strong> CSP&apos;s <code>frame-ancestors &#39;none&#39;</code>{' '}
          does the same job with real allowlist support, and takes precedence where both are present.
          Keep <code>X-Frame-Options</code> only as a legacy fallback.
        </p>
      </InfoBox>

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

    // Password rules per current NIST SP 800-63B guidance:
    // length + a breach check, NOT character-class rules. See below.
    body('password')
      .isLength({ min: 12, max: 128 })   // max caps hashing-DoS cost
      .custom(async (pw) => {
        if (await isInBreachCorpus(pw)) {
          throw new Error('This password has appeared in a known breach');
        }
      }),

    body('name').trim().isLength({ min: 1, max: 100 }),
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

      <InfoBox variant="warning" title="Password Composition Rules Are Now Advised Against">
        <p>
          The &quot;one uppercase, one number, one special character&quot; validator is the single most
          common piece of outdated security code still being written, and it is worth knowing why current
          guidance rejects it.
        </p>
        <p>
          <strong>NIST SP 800-63B</strong> — the standard everyone else cites — explicitly says verifiers{' '}
          <em>shall not</em> impose composition rules, and <em>shall not</em> require periodic rotation
          without evidence of compromise. Both rules push users toward predictable behaviour:{' '}
          <code>Password1!</code> satisfies every complexity checker ever written, and forced 90-day
          expiry produces <code>Password2!</code>. Meanwhile the rules block genuinely strong
          passphrases and drive password reuse.
        </p>
        <p><strong>What the current guidance asks for instead:</strong></p>
        <ul>
          <li><strong>Length is the real control.</strong> Minimum 8 as an absolute floor; 15+ recommended for user-chosen secrets. Allow at least 64 characters so passphrases fit.</li>
          <li><strong>Check against a breach corpus.</strong> Screen new passwords against known-compromised lists — this is what actually stops credential stuffing. Have I Been Pwned&apos;s range API lets you do it with k-anonymity, never sending the full hash.</li>
          <li><strong>Accept all printable Unicode, including spaces and emoji.</strong> Normalise (NFKC) before hashing.</li>
          <li><strong>Do not truncate, and do not block paste.</strong> Blocking paste actively fights password managers.</li>
          <li><strong>Rotate only on evidence of compromise.</strong></li>
        </ul>
        <p>
          Note how this interacts with hashing from the <em>Encryption</em> lesson: bcrypt silently
          truncates at 72 bytes, so &quot;accept long passphrases&quot; is another reason to prefer
          Argon2id.
        </p>
      </InfoBox>

      <h2>Security Best Practices</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-green)' }}>DO</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-red-deep)' }}>DON&#39;T</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>HttpOnly on session/token cookies</td>
            <td style={{ padding: '0.75rem' }}>Store JWTs in localStorage (XSS risk)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Secure flag on all auth cookies</td>
            <td style={{ padding: '0.75rem' }}>Send cookies over HTTP</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>SameSite=Lax or Strict</td>
            <td style={{ padding: '0.75rem' }}>Use SameSite=None without Secure</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Short JWT expiry (15-60 min)</td>
            <td style={{ padding: '0.75rem' }}>Create JWTs that never expire</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>PKCE for SPAs and mobile apps</td>
            <td style={{ padding: '0.75rem' }}>Use the OAuth implicit flow</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Validate iss/aud/exp on every JWT</td>
            <td style={{ padding: '0.75rem' }}>Trust JWTs without verification</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Invalidate sessions on logout (server-side)</td>
            <td style={{ padding: '0.75rem' }}>Just clear the cookie without server invalidation</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Rotate refresh tokens on use</td>
            <td style={{ padding: '0.75rem' }}>Reuse refresh tokens indefinitely</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Use Content-Security-Policy header</td>
            <td style={{ padding: '0.75rem' }}>Allow inline scripts without nonces</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
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

      <h2>Closing the Loop</h2>

      <p>
        Read that checklist next to the six-phase diagram from the first lesson and the section closes on
        itself. TLS 1.3 and HSTS are Phase 1. Argon2 and OAuth with PKCE are Phase 2.{' '}
        <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite</code>, and short token lifetimes are
        Phase 3. CSRF tokens, CORS allowlists, and CSP protect Phase 4. Refresh-token rotation with reuse
        detection is Phase 5, and server-side session invalidation is Phase 6.
      </p>

      <p>
        None of these are separate topics. They are one flow, and every item above is a specific way one
        step of it fails.
      </p>

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
