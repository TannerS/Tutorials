import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Gateway() {
  return (
    <LessonLayout
      title="Gateway Auth: Envoy, Redis & the Auth Wall"
      sectionId="auth"
      lessonIndex={6}
      prev={{ path: '/auth/authz', label: 'AuthN vs AuthZ' }}
      next={{ path: '/auth/security', label: 'Web Security (CORS, CSRF, XSS)' }}
    >
      <p>
        Every previous lesson assumed the backend itself validates a JWT or looks up a session. Many
        real production systems do it differently: <strong>nothing behind the edge ever sees a token at
        all</strong>. A gateway (commonly Envoy) intercepts every request, calls a dedicated auth service
        that checks an opaque session ID against Redis, and only then proxies the request inward — with the
        raw credential stripped out and replaced by a handful of trusted, network-verified headers. This
        lesson documents that pattern end to end, compares it with the JWT-everywhere approach, and covers
        several other production auth patterns that don&#39;t fit neatly into &quot;cookies vs JWT.&quot;
      </p>

      <InfoBox variant="info" title="The Core Idea">
        <p>
          Instead of every microservice knowing how to verify a token, <strong>only the edge knows</strong>.
          The gateway and its auth sidecar form a single &quot;wall&quot; between the public internet and your
          services. Backends sit on a private network with no public ingress — they are not reachable
          directly, so they never need to authenticate a request themselves. They simply trust whatever the
          gateway hands them, because the network topology guarantees nothing else could have reached them.
        </p>
      </InfoBox>

      <h2>Architecture: The Auth Wall</h2>

      <FlowChart
        title="Request Flow — Login to API Call"
        chart={"graph TD\n  A[\"Browser\"] -->|\"1. Cookie: session=8f2a...(opaque token)\"| B[\"Envoy Edge Proxy\"]\n  B -->|\"2. ext_authz Check (gRPC/HTTP)\"| C[\"Auth Service\"]\n  C -->|\"3. HGETALL session:8f2a...\"| D[(\"Redis\")]\n  D -->|\"4. userId, roles, TTL\"| C\n  C -->|\"5a. 200 OK + x-user-id, x-user-roles\"| B\n  C -.->|\"5b. 401/403 (no session or no permission)\"| B\n  B -->|\"6. Proxy request + trusted headers only\"| E[\"Backend Service\"]\n  E -->|\"7. Trusts headers - no token, no JWT lib needed\"| B\n  B -->|\"8. Response\"| A\n  style C fill:#1a2744,stroke:#5b9cf6\n  style D fill:#3d2f14,stroke:#d97706\n  style E fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        Walk through this slowly, because step 5b and step 7 are the whole point of the pattern:
      </p>

      <ul>
        <li><strong>The browser never holds a JWT.</strong> The cookie is an opaque, random, unguessable string — it means nothing outside the auth service and Redis.</li>
        <li><strong>Every single request</strong> — not just login — goes through the gateway&#39;s <code>ext_authz</code> check. There is no such thing as an unauthenticated path reaching a backend.</li>
        <li><strong>The auth service is the only thing that reads Redis.</strong> It looks up the session, checks it hasn&#39;t expired, checks the caller is permitted to hit this route, and returns either an allow (with headers to inject) or a deny.</li>
        <li><strong>The backend receives trusted headers, not a token.</strong> <code>x-user-id</code>, <code>x-user-roles</code> arrive already verified. The backend has no idea what a JWT or a cookie even is.</li>
      </ul>

      <h2>Network Topology: Why the Backend Is &quot;Invisible&quot;</h2>

      <FlowChart
        title="Public Edge vs Private Network"
        chart={"graph TD\n  subgraph Internet[\"Public Internet\"]\n    A[\"Browser / Mobile App\"]\n  end\n  subgraph Edge[\"Edge - public ingress allowed\"]\n    B[\"Envoy Gateway\"]\n    C[\"Auth Service\"]\n    D[(\"Redis Session Store\")]\n  end\n  subgraph Internal[\"Private Network - NO public ingress\"]\n    E[\"Orders Service\"]\n    F[\"Billing Service\"]\n    G[\"Inventory Service\"]\n  end\n  A -->|\"HTTPS\"| B\n  B <-->|\"ext_authz\"| C\n  C <--> D\n  B -->|\"mTLS + trusted headers\"| E\n  B -->|\"mTLS + trusted headers\"| F\n  B -->|\"mTLS + trusted headers\"| G\n  style B fill:#1a2744,stroke:#5b9cf6\n  style C fill:#3d2f14,stroke:#d97706\n  style D fill:#3d2f14,stroke:#d97706\n  style E fill:#1a3329,stroke:#4ade80\n  style F fill:#1a3329,stroke:#4ade80\n  style G fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="tip" title="Defense in Depth, Not Just Convenience">
        <p>
          This isn&#39;t only about avoiding duplicated JWT-verification code. Backend services live in a
          private subnet with security-group / firewall rules that only allow traffic from the gateway&#39;s
          identity (often enforced with mTLS client certs). Even if an attacker got a valid session cookie,
          they could not reach <code>orders-service</code> directly — there is no route to it from the
          public internet at all. The gateway is the single choke point, which makes it the single place
          you need to get security exactly right.
        </p>
      </InfoBox>

      <h2>Envoy Configuration: <code>ext_authz</code></h2>

      <p>
        Envoy&#39;s <code>ext_authz</code> HTTP filter calls out to an external service on every request before
        it reaches the router. The auth service&#39;s response headers get selectively copied onto the
        upstream request.
      </p>

      <CodeBlock language="yaml" title="envoy.yaml — ext_authz filter">
{`http_filters:
  # Strip anything a client tried to sneak in as a "trusted" header —
  # otherwise a caller could just set x-user-id themselves and skip auth.
  - name: envoy.filters.http.header_mutation
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.header_mutation.v3.HeaderMutation
      mutations:
        request_mutations:
          - remove: "x-user-id"
          - remove: "x-user-roles"
          - remove: "x-session-id"

  - name: envoy.filters.http.ext_authz
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.ext_authz.v3.ExtAuthz
      transport_api_version: V3
      failure_mode_allow: false   # if the auth service is down, DENY — never fail open
      http_service:
        server_uri:
          uri: http://auth-service.internal:9191/authorize
          cluster: auth_service_cluster
          timeout: 0.25s
        authorization_request:
          headers_to_add:
            - key: x-forwarded-proto
              value: https
        authorization_response:
          # Only these headers from the auth service's response are
          # allowed onto the upstream (backend) request.
          allowed_upstream_headers:
            patterns:
              - exact: x-user-id
              - exact: x-user-roles
              - exact: x-session-id

  - name: envoy.filters.http.router`}
      </CodeBlock>

      <InfoBox variant="danger" title="failure_mode_allow: false Is Not Optional">
        <p>
          If the auth service or Redis is unreachable, <code>failure_mode_allow: true</code> would let
          every request through <strong>unauthenticated</strong>. Always fail closed on an auth check. The
          trade-off is that your auth service and Redis now sit on your availability critical path for
          every single request — so they need to be fast (Redis lookups are sub-millisecond) and
          horizontally scaled.
        </p>
      </InfoBox>

      <h2>The Auth Service</h2>

      <p>
        This is the piece that actually talks to Redis. Envoy forwards the original request&#39;s headers
        (including the cookie) to it; it returns <code>200</code> with headers to inject, or <code>401</code>/<code>403</code>.
      </p>

      <CodeBlock language="javascript" title="auth-service — ext_authz HTTP check endpoint (Node.js)">
{`const express = require('express');
const Redis = require('ioredis');
const cookie = require('cookie');

const redis = new Redis(process.env.REDIS_URL);
const app = express();

const SESSION_TTL_SECONDS = 900; // 15 min idle timeout

// Envoy calls this on EVERY request that hits the edge listener
app.all('/authorize', async (req, res) => {
  const cookies = cookie.parse(req.headers['cookie'] || '');
  const token = cookies.session;

  if (!token) return res.status(401).end();

  const sessionKey = \`session:\${token}\`;
  const session = await redis.hgetall(sessionKey);

  if (!session || Object.keys(session).length === 0) {
    // Key doesn't exist -> expired, logged out, or never existed.
    return res.status(401).end();
  }

  // Route the auth check knows about via the original request Envoy saw
  const path = req.headers['x-envoy-original-path'] || req.path;
  const method = req.headers['x-envoy-original-method'] || req.method;
  const roles = JSON.parse(session.roles);

  if (!isAuthorized(roles, method, path)) {
    return res.status(403).end();
  }

  // Sliding expiration: every successful call resets the idle timer.
  await redis.expire(sessionKey, SESSION_TTL_SECONDS);

  // Only these headers reach the backend — never the raw token itself.
  res.set('x-user-id', session.userId);
  res.set('x-user-roles', session.roles);
  res.set('x-session-id', token);
  return res.status(200).end();
});

function isAuthorized(roles, method, path) {
  if (path.startsWith('/api/admin') && !roles.includes('admin')) return false;
  if (method === 'DELETE' && !roles.some(r => ['admin', 'editor'].includes(r))) return false;
  return true;
}

app.listen(9191);`}
      </CodeBlock>

      <h2>Login &amp; Logout: Owning the Session Store</h2>

      <p>
        Login still happens once, at an edge-facing endpoint (often the auth service itself, or a
        dedicated identity service in front of it). It generates a random opaque token, writes the
        session into Redis, and hands the browser only the token.
      </p>

      <CodeBlock language="javascript" title="Login & logout — Redis session lifecycle">
{`const crypto = require('crypto');

app.post('/login', async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = crypto.randomBytes(32).toString('hex'); // opaque, unguessable
  const sessionKey = \`session:\${token}\`;

  await redis.hset(sessionKey, {
    userId: user.id,
    roles: JSON.stringify(user.roles),
    createdAt: Date.now(),
  });
  await redis.expire(sessionKey, SESSION_TTL_SECONDS);

  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
  res.json({ message: 'Logged in' });
});

// Logout is the payoff for this whole architecture: revocation is
// instant and total. No waiting for a JWT to expire, no blocklist.
app.post('/logout', async (req, res) => {
  const token = req.cookies.session;
  await redis.del(\`session:\${token}\`);
  res.clearCookie('session');
  res.json({ message: 'Logged out' });
});

// Also lets you kill EVERY session for a user at once (e.g. "log out
// of all devices", or a security team force-revoking a compromised
// account) — something a self-contained JWT can never do cheaply.
app.post('/admin/revoke-all/:userId', async (req, res) => {
  const keys = await redis.keys('session:*');
  for (const key of keys) {
    const session = await redis.hgetall(key);
    if (session.userId === req.params.userId) await redis.del(key);
  }
  res.json({ message: 'All sessions revoked' });
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="SCAN, Not KEYS, in Production">
        <p>
          <code>redis.keys('session:*')</code> above is for clarity — it blocks Redis while it scans the
          entire keyspace. In production, use <code>SCAN</code> with a cursor, or better, maintain a
          secondary index (a Redis <em>set</em> per user: <code>user:42:sessions</code> holding that
          user&#39;s active session tokens) so revoke-all is an O(sessions-for-that-user) operation instead of
          an O(all-sessions) scan.
        </p>
      </InfoBox>

      <h2>This Pattern vs. Self-Contained JWT</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Aspect</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>JWT Passed to Every Service</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Gateway + Redis Session (Auth Wall)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Where auth is checked</td>
            <td style={{ padding: '0.75rem' }}>Every service, independently</td>
            <td style={{ padding: '0.75rem' }}>Once, at the edge</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Revocation</td>
            <td style={{ padding: '0.75rem' }}>Hard — must wait for expiry or maintain a blocklist everywhere</td>
            <td style={{ padding: '0.75rem' }}>Instant — <code>DEL</code> the Redis key</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Backend complexity</td>
            <td style={{ padding: '0.75rem' }}>Every service needs a JWT library, public keys, JWKS caching</td>
            <td style={{ padding: '0.75rem' }}>Zero — backend reads a plain header</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Latency</td>
            <td style={{ padding: '0.75rem' }}>No network call — local signature check</td>
            <td style={{ padding: '0.75rem' }}>One extra hop (gateway → auth service → Redis), sub-ms with a local Redis</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Single point of failure</td>
            <td style={{ padding: '0.75rem' }}>None — fully stateless</td>
            <td style={{ padding: '0.75rem' }}>Auth service + Redis must be highly available</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Attack surface if a backend is compromised</td>
            <td style={{ padding: '0.75rem' }}>Compromised service can decode/replay JWTs it received</td>
            <td style={{ padding: '0.75rem' }}>Compromised backend never had a token to steal in the first place</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Scaling model</td>
            <td style={{ padding: '0.75rem' }}>Scales trivially — no shared state</td>
            <td style={{ padding: '0.75rem' }}>Redis must scale with total active sessions (cluster/replicas)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Good fit for</td>
            <td style={{ padding: '0.75rem' }}>Public APIs, third-party integrations, mobile-to-backend, low-trust networks</td>
            <td style={{ padding: '0.75rem' }}>Internal microservice fleets behind one gateway, orgs that need instant revocation/compliance</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="note" title="A Common Hybrid: Gateway-Minted Internal JWT">
        <p>
          Some systems split the difference: the gateway/auth service validates the opaque session against
          Redis exactly as above, but instead of injecting flat headers, it <strong>mints a short-lived
          (30–60s), narrowly-scoped internal JWT</strong> and attaches that to the proxied request. Downstream
          services that need to call each other can forward that internal JWT a few hops without going back
          to the gateway, while the outside world still only ever sees the opaque token. This buys some of
          the stateless convenience of JWTs for internal service-to-service calls without ever exposing a
          long-lived, hard-to-revoke token externally.
        </p>
      </InfoBox>

      <h2>Other Production Auth Patterns</h2>

      <p>
        A few more patterns worth knowing that don&#39;t fit cleanly into &quot;cookie vs JWT&quot; — each solves a
        different piece of the puzzle once you&#39;re past a single-service app.
      </p>

      <h3>Backend for Frontend (BFF)</h3>

      <InfoBox variant="info" title="One Backend per Frontend">
        <p>
          Instead of a public SPA holding any token at all, each frontend (web, iOS, Android) gets its own
          thin backend that owns the OAuth client secret and refresh token. The browser only ever holds an
          <code>HttpOnly</code> session cookie to <em>its own BFF</em>; the BFF is the only thing that talks
          to the real resource servers, attaching the real access token server-side. This eliminates the
          entire class of &quot;where do I safely store an access token in a browser&quot; problems, since the
          browser never has one.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="BFF pattern — token never leaves the server">
{`// Browser -> BFF: only ever sends its own HttpOnly session cookie
app.get('/api/orders', requireBffSession, async (req, res) => {
  const { accessToken } = await sessionStore.get(req.cookies.bffSession);

  // BFF -> real resource server: attaches the real OAuth access token
  const orders = await fetch('https://api.orders.internal/orders', {
    headers: { Authorization: \`Bearer \${accessToken}\` },
  });
  res.json(await orders.json());
});`}
      </CodeBlock>

      <h3>Token Exchange (RFC 8693) — Preserving Identity Across Services</h3>

      <InfoBox variant="info" title="Delegation Without Forwarding the Original Token">
        <p>
          When Service A needs to call Service B <em>on behalf of the current user</em>, forwarding A&#39;s own
          token to B is risky — B now holds a credential broader than it needs. Token exchange lets A trade
          its token at the identity provider for a new, narrowly-scoped token that identifies both the
          original user and A as the acting party, valid only for calling B.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="RFC 8693 Token Exchange Request">
{`POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&subject_token=<Service A's incoming token>
&subject_token_type=urn:ietf:params:oauth:token-type:access_token
&audience=service-b
&scope=orders:read`}
      </CodeBlock>

      <h3>Service Mesh mTLS (Istio / Linkerd)</h3>

      <InfoBox variant="info" title="Zero Trust at the Network Layer">
        <p>
          Complements the gateway pattern for internal traffic: every service gets its own cryptographic
          identity (a SPIFFE ID baked into a short-lived cert, rotated automatically by the mesh&#39;s sidecar).
          All service-to-service calls are mutually authenticated over mTLS regardless of what the
          application layer does. This is how you make the &quot;private network&quot; claim in the diagram above
          actually enforceable rather than just a firewall rule someone could misconfigure.
        </p>
      </InfoBox>

      <CodeBlock language="yaml" title="Istio — require strict mTLS mesh-wide">
{`apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT   # reject any plaintext service-to-service traffic`}
      </CodeBlock>

      <h3>Passkeys / WebAuthn — Phishing-Resistant Login</h3>

      <InfoBox variant="info" title="Public-Key Auth Built Into the Browser">
        <p>
          Replaces &quot;something you know&quot; (password) with a device-bound key pair. The private key never
          leaves the user&#39;s device or hardware security module; the server only ever stores a public key.
          Because the browser binds the credential to the exact origin, a phishing site simply cannot obtain
          a valid signature — this is what makes WebAuthn resistant to credential phishing in a way OTP and
          passwords aren&#39;t.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="WebAuthn — registration (browser side)">
{`const credential = await navigator.credentials.create({
  publicKey: {
    challenge: base64ToBuffer(serverChallenge),
    rp: { name: 'Example App', id: 'example.com' },
    user: { id: userIdBuffer, name: user.email, displayName: user.name },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }], // ES256
    authenticatorSelection: { userVerification: 'required' },
  },
});
// Send credential.response (attestation + public key) to the server to store`}
      </CodeBlock>

      <h3>Step-Up Authentication</h3>

      <InfoBox variant="info" title="A Valid Session Isn't Always Enough">
        <p>
          A user with a valid, hours-old session shouldn&#39;t necessarily be able to wire money or change
          their password without re-proving identity. Step-up auth re-challenges (a fresh MFA prompt, a
          WebAuthn re-assertion) for specific sensitive actions, and records the fact in the session — e.g.
          an <code>acr</code> (Authentication Context Class Reference) claim or, in the Redis-session model
          above, a short-TTL <code>elevated: true</code> flag that expires in a minute or two even though
          the main session stays alive.
        </p>
      </InfoBox>

      <h2>Where This Fits in the Bigger Picture</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Pattern</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Solves</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Gateway + Redis (auth wall)</td>
            <td style={{ padding: '0.75rem' }}>Centralized session validation, instant revocation, backends never see a credential</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>BFF</td>
            <td style={{ padding: '0.75rem' }}>Keeping OAuth tokens off the browser entirely</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Token exchange</td>
            <td style={{ padding: '0.75rem' }}>Safely delegating identity across service-to-service calls</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Service mesh mTLS</td>
            <td style={{ padding: '0.75rem' }}>Enforcing the &quot;private network&quot; boundary cryptographically, not just by firewall rule</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Passkeys / WebAuthn</td>
            <td style={{ padding: '0.75rem' }}>Phishing-resistant login at the AuthN step</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Step-up auth</td>
            <td style={{ padding: '0.75rem' }}>Re-verifying identity for high-risk actions mid-session</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"In the Envoy + Redis auth wall pattern, why is revoking access (e.g., an admin force-logging-out a compromised account) instant, while it's hard with a self-contained JWT?"}
        options={[
          "Redis is simply faster than a database",
          "The session is server-side state that can be deleted directly (DEL session:token) — the very next request finds nothing and is denied. A self-contained JWT is valid until it expires, since no server-side record needs to be consulted to trust it",
          "JWTs cannot be revoked under any circumstances",
          "Envoy automatically expires all sessions every hour"
        ]}
        correctIndex={1}
        explanation={"This is the core trade-off of the whole pattern. A self-contained JWT is trusted purely by its signature — nothing needs to be looked up, which is fast but means the token remains valid until it naturally expires (you'd need a blocklist checked on every request to revoke it early, which reintroduces the exact server-side lookup JWTs were meant to avoid). An opaque token backed by a Redis session has no meaning on its own — the auth service must find session:<token> in Redis for every request to succeed. Delete that key, and the very next request fails immediately, with zero propagation delay."}
      />

      <InteractiveChallenge
        question={"Why does the Envoy config strip x-user-id and x-user-roles from the incoming request BEFORE the ext_authz filter runs, rather than trusting whatever the auth service later sets?"}
        options={[
          "To save bandwidth on large headers",
          "Because if a client could set x-user-id=admin themselves and the backend blindly trusts that header (since it never validates a token itself), they could impersonate any user — stripping ensures the ONLY way those headers reach the backend is via the auth service's verified response",
          "Envoy requires all custom headers to be removed by policy",
          "It has no security purpose, only a performance one"
        ]}
        correctIndex={1}
        explanation={"The entire pattern relies on backend services implicitly trusting x-user-id and x-user-roles instead of validating a token themselves. That trust is only safe if it's structurally impossible for anyone but the auth service to set those headers. If Envoy didn't strip client-supplied copies first, an attacker could simply attach x-user-id: admin-user directly to their request and skip authentication entirely — the backend would happily believe it. Stripping-then-injecting is what makes the 'invisible wall' actually a wall."}
      />
    </LessonLayout>
  );
}
