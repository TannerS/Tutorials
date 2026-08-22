import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Oauth() {
  return (
    <LessonLayout
      title="OAuth 2.0 & OIDC"
      sectionId="auth"
      lessonIndex={3}
      prev={{ path: '/auth/jwt', label: 'JWT Deep Dive' }}
      next={{ path: '/auth/gateway', label: 'Gateway Auth: Envoy, Redis & the Auth Wall' }}
    >
      <p>
        This is Phase 2 of the login flow — the part the last two lessons took for granted. Instead of
        checking a password yourself, you delegate: another party verifies the user and returns signed
        proof of who they are. When you click &quot;Login with Google,&quot; that is OAuth 2.0 obtaining
        limited access to an account on a third-party service without your app ever seeing the password.
        OpenID Connect (OIDC) adds the identity layer on top.
      </p>

      <p>
        Watch for two things you have already met. The <code>id_token</code> you receive at the end is a
        plain JWT, verified with the exact rules from the previous lesson. And once it verifies, you are
        right back at Phase 3 — the app still has to mint its own session cookie or token, because a
        Google token is not a login to <em>your</em> app.
      </p>

      <h2>The Four Roles</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Role</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Who</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Resource Owner</strong></td>
            <td style={{ padding: '0.75rem' }}>The user who owns the data</td>
            <td style={{ padding: '0.75rem' }}>You (the Google user)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Client</strong></td>
            <td style={{ padding: '0.75rem' }}>The application requesting access</td>
            <td style={{ padding: '0.75rem' }}>Your web app (example.com)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Authorization Server</strong></td>
            <td style={{ padding: '0.75rem' }}>Issues tokens after user consent</td>
            <td style={{ padding: '0.75rem' }}>Google Auth (accounts.google.com)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Resource Server</strong></td>
            <td style={{ padding: '0.75rem' }}>Hosts protected resources / APIs</td>
            <td style={{ padding: '0.75rem' }}>Google API (googleapis.com)</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="OAuth is Authorization, Not Authentication">
        <p>
          A critical distinction: OAuth 2.0 is an <strong>authorization</strong> framework. It answers
          &quot;What is this app allowed to access?&quot; not &quot;Who is the user?&quot; The authorization server issues
          an access token that grants limited access to resources. OAuth alone does not tell you who the
          user is — that is what OIDC adds.
        </p>
      </InfoBox>

      <h2>Authorization Code Flow</h2>

      <p>
        The Authorization Code Flow is the most secure and most common OAuth flow. It is used by
        server-side applications and SPAs (with PKCE). Here is the complete step-by-step flow:
      </p>

      <FlowChart
        title="OAuth 2.0 Authorization Code Flow"
        chart={"graph TD\n  A[\"1. User clicks 'Login with Google'\"] --> B[\"2. App redirects to Google Auth\"]\n  B --> C[\"3. User logs in at Google\"]\n  C --> D[\"4. User consents to permissions\"]\n  D --> E[\"5. Google redirects back with auth code\"]\n  E --> F[\"6. App server exchanges code for tokens\"]\n  F --> G[\"7. Google returns access_token + id_token + refresh_token\"]\n  G --> H[\"8. App calls Google API with access_token\"]\n  H --> I[\"9. Google API returns user data\"]\n  style A fill:#1a2744,stroke:#5b9cf6\n  style E fill:#3d2f14,stroke:#d97706\n  style G fill:#1a3329,stroke:#4ade80\n  style I fill:#2a1f44,stroke:#a78bfa"}
      />

      <CodeBlock language="text" title="Authorization Code Flow — Detailed Steps">
{`Step 1: User clicks "Login with Google"
  Browser redirects to:
  https://accounts.google.com/o/oauth2/v2/auth?
    response_type=code
    &client_id=YOUR_CLIENT_ID
    &redirect_uri=https://example.com/callback
    &scope=openid email profile
    &state=random-csrf-token
    &nonce=random-nonce                      # OIDC: binds the id_token
    &code_challenge=SHA256(code_verifier)    # PKCE
    &code_challenge_method=S256

Step 2: User authenticates at Google
  Google shows login form → user enters credentials

Step 3: User consents
  "Example App wants to: View your email, View your profile"
  User clicks "Allow"

Step 4: Google redirects back with authorization code
  https://example.com/callback?
    code=4/0AY0e-g7...   (one-time authorization code)
    &state=random-csrf-token

Step 5: Server exchanges code for tokens (server-to-server)
  POST https://oauth2.googleapis.com/token
  Content-Type: application/x-www-form-urlencoded   # NOT JSON

  grant_type=authorization_code
  &code=4/0AY0e-g7...
  &client_id=YOUR_CLIENT_ID
  &client_secret=YOUR_CLIENT_SECRET
  &redirect_uri=https://example.com/callback
  &code_verifier=original_code_verifier             # PKCE

Step 6: Google returns tokens
  {
    "access_token": "ya29.a0AfH6SM...",     // 1 hour
    "id_token": "eyJhbGciOiJSUzI1...",      // JWT with user identity
    "refresh_token": "1//0gBsL9...",         // Long-lived
    "token_type": "Bearer",
    "expires_in": 3600
  }`}
      </CodeBlock>

      <CodeBlock language="javascript" title="OAuth 2.0 Implementation (Node.js/Express)">
{`const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://example.com/auth/callback';

// Step 1: Redirect to Google
app.get('/auth/google', (req, res) => {
  // PKCE: Generate code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  // Store the verifier, state and nonce in the session for later.
  // All three are generated here and checked on the way back.
  req.session.codeVerifier = codeVerifier;
  req.session.oauthState = crypto.randomBytes(16).toString('hex');
  req.session.oauthNonce = crypto.randomBytes(16).toString('hex');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', req.session.oauthState);
  authUrl.searchParams.set('nonce', req.session.oauthNonce);  // OIDC replay defence
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  res.redirect(authUrl.toString());
});

// Step 4-6: Handle callback
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  // Verify state to prevent CSRF. Compare in constant time and make
  // it single-use — a state value must never be accepted twice.
  const expectedState = req.session.oauthState;
  const expectedNonce = req.session.oauthNonce;
  const codeVerifier = req.session.codeVerifier;
  delete req.session.oauthState;
  delete req.session.oauthNonce;
  delete req.session.codeVerifier;

  // timingSafeEqual needs equal-length buffers, hence the length guard
  // first. A plain !== here would short-circuit on the first differing
  // byte, which is exactly what the comment above tells you not to do.
  const stateOk =
    expectedState &&
    typeof state === 'string' &&
    Buffer.byteLength(state) === Buffer.byteLength(expectedState) &&
    crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expectedState));

  if (!stateOk) {
    return res.status(403).json({ error: 'Invalid state' });
  }

  // Exchange code for tokens. NOTE: the token endpoint takes
  // application/x-www-form-urlencoded, NOT JSON (RFC 6749 s4.1.3).
  // Posting a JSON body is a classic first-time mistake — most
  // providers reject it with invalid_request.
  const tokenResponse = await axios.post(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, id_token, refresh_token } = tokenResponse.data;

  // VERIFY the ID token — never just base64-decode it. An unverified
  // decode trusts whatever the token says, which is exactly the bug
  // that lets a forged token log an attacker in as anyone.
  const userInfo = await verifyIdToken(id_token, expectedNonce);

  // Federated login is NOT the end of the story: Google authenticated
  // the user, but the user still has no session with YOUR app. Mint
  // one now — and rotate the session ID first, exactly as in the
  // Cookies lesson, because the privilege level just changed.
  req.session.regenerate((err) => {
    if (err) return res.status(500).send('Session error');
    req.session.user = {
      id: userInfo.sub,        // 'sub' is the stable user key, NOT email
      email: userInfo.email,
      name: userInfo.name,
    };
    res.redirect('/dashboard');
  });
});

// ID token verification using the provider's published JWKS.
const { createRemoteJWKSet, jwtVerify } = require('jose');

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs')
);

async function verifyIdToken(idToken, expectedNonce) {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: 'https://accounts.google.com',  // must match exactly
    audience: GOOGLE_CLIENT_ID,             // token was minted for US
    algorithms: ['RS256'],
    clockTolerance: 30,
  });

  // The nonce binds this ID token to THIS login attempt — replaying an
  // old, still-valid ID token from another session will not match.
  if (payload.nonce !== expectedNonce) {
    throw new Error('Nonce mismatch — possible token replay');
  }

  // Do not trust an unverified email as an account identifier.
  if (!payload.email_verified) {
    throw new Error('Email not verified by provider');
  }

  return payload;
}`}
      </CodeBlock>

      <h2>PKCE (Proof Key for Code Exchange)</h2>

      <InfoBox variant="warning" title="PKCE is Required for SPAs">
        <p>
          PKCE (pronounced &quot;pixy&quot;) prevents authorization code interception attacks. It is <strong>required</strong> for
          public clients (SPAs, mobile apps) and recommended for all clients.
        </p>
        <p>
          <strong>How it works:</strong> The client generates a random <code>code_verifier</code> and
          sends its SHA-256 hash (<code>code_challenge</code>) in the initial authorization request.
          When exchanging the code for tokens, the client sends the original <code>code_verifier</code>.
          The auth server verifies that SHA-256(code_verifier) matches the code_challenge. An attacker
          who intercepts the authorization code cannot complete the exchange because they do not have
          the original code_verifier.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="Three PKCE Details People Get Wrong">
        <p>
          <strong>1. <code>S256</code>, never <code>plain</code>.</strong> The spec defines a{' '}
          <code>plain</code> method where the challenge <em>is</em> the verifier, unhashed. That defeats
          the entire mechanism: an attacker who intercepts the authorization request has just been handed
          the verifier. <code>plain</code> exists only for clients incapable of SHA-256, which in practice
          means nothing you will write. OAuth 2.1 requires <code>S256</code> wherever the client can do
          it, and a server should refuse <code>plain</code> outright.
        </p>
        <p>
          <strong>2. The verifier must be high-entropy and per-request.</strong> The spec mandates 43–128
          characters from an unreserved alphabet, generated by a CSPRNG (cryptographically secure pseudo-random number generator &mdash; <code>crypto.randomBytes</code>, never <code>Math.random</code>). A verifier derived from
          something guessable, or reused across requests, is no verifier at all.
        </p>
        <p>
          <strong>3. PKCE is not a client secret, and not a substitute for <code>state</code>.</strong>{' '}
          PKCE proves that the party redeeming the code is the same party that started the flow. It does
          not authenticate <em>which</em> client that is, and it does not prove the callback landed in the
          browser session that initiated it — that is still <code>state</code>&apos;s job. A confidential
          client sends a client secret <em>and</em> PKCE <em>and</em> state.
        </p>
      </InfoBox>

      <h2>Sender-Constrained Tokens (DPoP and mTLS Binding)</h2>

      <p>
        The OAuth 2.1 table below mentions refresh tokens being &quot;sender-constrained.&quot; That term
        is worth unpacking, because it names the one structural weakness left in ordinary OAuth.
      </p>

      <InfoBox variant="info" title="The Bearer Token Problem">
        <p>
          A <strong>bearer</strong> token means exactly what the word says: whoever bears it may use it.
          The resource server checks the token is valid, not that <em>you</em> are the party it was issued
          to. Steal it — from a log, a proxy, a compromised SDK, an exfiltrated backup — and you are
          indistinguishable from the legitimate client. Every other defence in this lesson is about
          keeping the token from being stolen, because nothing catches it once it has been.
        </p>
        <p>
          <strong>Sender-constrained</strong> (or proof-of-possession) tokens close that gap by binding
          the token to a key the client holds. Presenting the token is no longer sufficient; you must also
          prove you hold the matching private key. A stolen token alone becomes useless.
        </p>
      </InfoBox>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Mechanism</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>How the Binding Works</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Fits</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>DPoP</strong> (RFC 9449)</td>
            <td style={{ padding: '0.75rem' }}>Client generates a key pair and sends a signed <code>DPoP</code> proof JWT with each request, covering the method, URL, and a timestamp. The access token carries a thumbprint of that key in a <code>cnf</code> claim</td>
            <td style={{ padding: '0.75rem' }}>Browsers, SPAs, mobile — anywhere client certificates are impractical</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>mTLS binding</strong> (RFC 8705)</td>
            <td style={{ padding: '0.75rem' }}>The token is bound to the client&apos;s TLS certificate; the resource server compares the presented cert against the token&apos;s <code>cnf</code> claim</td>
            <td style={{ padding: '0.75rem' }}>Server-to-server, finance/open-banking, anywhere PKI already exists</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="text" title="A DPoP-Protected Request">
{`GET /orders HTTP/1.1
Host: api.example.com
Authorization: DPoP eyJhbGciOiJSUzI1NiIs...     <- note: DPoP, not Bearer
DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2Ii...

# The DPoP proof header is a JWT signed by the client's private key:
#   htm: "GET"                      <- method it is valid for
#   htu: "https://api.example.com/orders"   <- URL it is valid for
#   iat: 1767225600                 <- freshness
#   jti: "..."                      <- server tracks these to block replay
#   ath: "<hash of the access token>"
#
# Replaying the access token without a matching, fresh, correctly-scoped
# proof fails. Replaying the proof itself fails on jti/iat.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Do You Need This?">
        <p>
          For most applications, no — short-lived bearer tokens in <code>HttpOnly</code> cookies, or the
          BFF pattern from the Gateway lesson, are the proportionate answer. DPoP earns its complexity
          when tokens must live in a browser, or in high-value domains (open banking, healthcare) where
          regulation demands proof-of-possession. Know the term and the one-line reason it exists: it
          turns a stolen token from a complete compromise into a useless string.
        </p>
      </InfoBox>

      <h2>OpenID Connect (OIDC)</h2>

      <p>
        OIDC is an identity layer built on top of OAuth 2.0. While OAuth only provides authorization
        (access tokens), OIDC adds authentication by introducing the <strong>ID Token</strong> — a JWT
        that contains verified user identity information.
      </p>

      <InfoBox variant="info" title="What OIDC Adds to OAuth">
        <p><strong>ID Token (JWT)</strong> — Contains user identity claims: sub, email, name, picture. Signed by the auth server.</p>
        <p><strong>/userinfo Endpoint</strong> — A standardized API endpoint to fetch additional user profile information using the access token.</p>
        <p><strong>scope: openid</strong> — Including this scope signals that you want OIDC (authentication), not just OAuth (authorization).</p>
        <p><strong>Discovery Document</strong> — <code>/.well-known/openid-configuration</code> provides all endpoints, supported scopes, and signing keys.</p>
      </InfoBox>

      <CodeBlock language="json" title="OIDC ID Token (Decoded)">
{`{
  "iss": "https://accounts.google.com",
  "sub": "110169484474386276334",
  "aud": "YOUR_CLIENT_ID",
  "email": "alice@gmail.com",
  "email_verified": true,
  "name": "Alice Johnson",
  "picture": "https://lh3.googleusercontent.com/...",
  "given_name": "Alice",
  "family_name": "Johnson",
  "locale": "en",
  "iat": 1704067200,
  "exp": 1704070800,
  "nonce": "abc123"
}`}
      </CodeBlock>

      <h2>Token Types</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Token</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Lifetime</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Purpose</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Format</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Authorization Code</strong></td>
            <td style={{ padding: '0.75rem' }}>One-time use</td>
            <td style={{ padding: '0.75rem' }}>Exchanged for tokens</td>
            <td style={{ padding: '0.75rem' }}>Opaque string</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Access Token</strong></td>
            <td style={{ padding: '0.75rem' }}>15 min — 1 hour</td>
            <td style={{ padding: '0.75rem' }}>Call resource server APIs</td>
            <td style={{ padding: '0.75rem' }}>Opaque or JWT</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Refresh Token</strong></td>
            <td style={{ padding: '0.75rem' }}>Days to weeks</td>
            <td style={{ padding: '0.75rem' }}>Get new access tokens</td>
            <td style={{ padding: '0.75rem' }}>Opaque string</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>ID Token</strong></td>
            <td style={{ padding: '0.75rem' }}>Short-lived</td>
            <td style={{ padding: '0.75rem' }}>User identity (OIDC)</td>
            <td style={{ padding: '0.75rem' }}>JWT (always)</td>
          </tr>
        </tbody>
      </table>

      <h2>OAuth Grant Types</h2>

      <InfoBox variant="tip" title="Which Flow Should You Use?">
        <p><strong>Authorization Code + PKCE</strong> — Use for SPAs, mobile apps, and server-side apps. The most secure flow. Always use this.</p>
        <p><strong>Authorization Code (no PKCE)</strong> — Legacy server-side apps with a client secret. Tolerated under OAuth 2.0, but OAuth 2.1 makes PKCE mandatory here too — add it.</p>
        <p><strong>Client Credentials</strong> — Machine-to-machine (M2M) communication. No user involved. Service A calls Service B.</p>
        <p><strong>Device Code</strong> — For devices with limited input (smart TVs, CLI tools). User authorizes on a separate device.</p>
        <p><strong>Refresh Token</strong> — Exchanges a refresh token for a new access token. Rotate on every use for public clients.</p>
        <p style={{ color: 'var(--accent-red-deep)' }}><strong>Implicit Flow — REMOVED in OAuth 2.1!</strong> Do not use. Tokens exposed in URL fragment. Replaced by Authorization Code + PKCE.</p>
        <p style={{ color: 'var(--accent-red-deep)' }}><strong>Password Grant (ROPC) — REMOVED in OAuth 2.1!</strong> Requires your app to collect the user&apos;s password directly, defeating the purpose of OAuth and breaking MFA/SSO. Never use it for new work.</p>
      </InfoBox>

      <h2>OAuth 2.1 — What Actually Changed</h2>

      <p>
        OAuth 2.1 is a consolidation, not a redesign. It folds fifteen years of
        security best-practice RFCs and errata into a single document and{' '}
        <strong>removes the options that kept going wrong</strong>. If you have
        been following current guidance, you are already writing OAuth 2.1.
        Interviewers like this question because the answer shows whether you
        know <em>why</em> each thing was removed.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Change</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>OAuth 2.0</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>OAuth 2.1</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>PKCE</strong></td>
            <td style={{ padding: '0.75rem' }}>Optional; recommended for public clients</td>
            <td style={{ padding: '0.75rem' }}><strong>Mandatory</strong> for all clients using the authorization code flow — including confidential ones</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Implicit flow</strong></td>
            <td style={{ padding: '0.75rem' }}>Defined (<code>response_type=token</code>)</td>
            <td style={{ padding: '0.75rem' }}><strong>Removed.</strong> Tokens in URL fragments leak via history, referrers, and logs</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Password grant (ROPC)</strong></td>
            <td style={{ padding: '0.75rem' }}>Defined</td>
            <td style={{ padding: '0.75rem' }}><strong>Removed.</strong> Requires the app to handle raw passwords — the exact thing OAuth exists to avoid, and incompatible with MFA and federation</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Redirect URI matching</strong></td>
            <td style={{ padding: '0.75rem' }}>Allowed partial/prefix matching</td>
            <td style={{ padding: '0.75rem' }}><strong>Exact string comparison</strong> required — wildcard matching enabled open-redirect code theft</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Refresh tokens (public clients)</strong></td>
            <td style={{ padding: '0.75rem' }}>Long-lived, reusable</td>
            <td style={{ padding: '0.75rem' }}>Must be <strong>sender-constrained or one-time-use with rotation</strong></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Bearer tokens in URLs</strong></td>
            <td style={{ padding: '0.75rem' }}>Query-string tokens permitted</td>
            <td style={{ padding: '0.75rem' }}><strong>Prohibited.</strong> Authorization header only</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="tip" title="The One-Sentence Answer">
        <p>
          If asked to summarise it: <em>&quot;OAuth 2.1 doesn&apos;t add
          features — it deletes the insecure ones. PKCE becomes mandatory
          everywhere, the implicit and password grants are gone, redirect URIs
          must match exactly, and refresh tokens for public clients must
          rotate.&quot;</em>
        </p>
      </InfoBox>

      <InfoBox variant="info" title="state vs. nonce — a Frequently Confused Pair">
        <p>
          Both are random values you generate and check on return, but they
          defend different things:
        </p>
        <p>
          <strong><code>state</code></strong> protects the{' '}
          <em>authorization request</em>. It is a CSRF token proving the
          callback belongs to a flow this browser actually started — stopping
          an attacker from injecting their own authorization code into your
          session (session fixation).
        </p>
        <p>
          <strong><code>nonce</code></strong> protects the{' '}
          <em>ID token</em>. You send it in the authorization request; the
          provider embeds it in the ID token it mints. Checking it on return
          proves the token was issued for this specific login rather than
          replayed from an older one.
        </p>
        <p>
          PKCE overlaps with <code>state</code>&apos;s protection but does not
          replace it, and neither replaces <code>nonce</code>. Send all three.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Spring Boot OAuth 2.0 / OIDC Configuration">
{`// application.yml
// spring:
//   security:
//     oauth2:
//       client:
//         registration:
//           google:
//             client-id: \${GOOGLE_CLIENT_ID}
//             client-secret: \${GOOGLE_CLIENT_SECRET}
//             scope: openid, email, profile
//             redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
//         provider:
//           google:
//             authorization-uri: https://accounts.google.com/o/oauth2/v2/auth
//             token-uri: https://oauth2.googleapis.com/token
//             jwk-set-uri: https://www.googleapis.com/oauth2/v3/certs
//             user-info-uri: https://openidconnect.googleapis.com/v1/userinfo

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/login", "/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth -> oauth
                .loginPage("/login")
                .defaultSuccessUrl("/dashboard")
                .userInfoEndpoint(userInfo -> userInfo
                    .oidcUserService(oidcUserService())
                )
            )
            .build();
    }

    @Bean
    public OidcUserService oidcUserService() {
        OidcUserService delegate = new OidcUserService();
        return request -> {
            OidcUser oidcUser = delegate.loadUser(request);

            // Extract user info from ID token
            String email = oidcUser.getEmail();
            String name = oidcUser.getFullName();
            String sub = oidcUser.getSubject();

            // Create or update user in your database
            User user = userService.findOrCreate(sub, email, name);

            return oidcUser;
        };
    }
}`}
      </CodeBlock>

      <h2>Security Considerations</h2>

      <InfoBox variant="danger" title="OAuth Security Rules">
        <p><strong>Always use PKCE</strong> — Even for server-side apps. It prevents authorization code interception.</p>
        <p><strong>Validate the state parameter</strong> — Prevents CSRF attacks during the OAuth flow.</p>
        <p><strong>Validate the ID token</strong> — Verify signature, issuer, audience, expiration, and nonce.</p>
        <p><strong>Never use the Implicit Flow</strong> — Tokens in URL fragments are visible in browser history, referrer headers, and server logs.</p>
        <p><strong>Store tokens securely</strong> — Access tokens in HttpOnly cookies. Refresh tokens server-side or in secure HttpOnly cookies with restricted path.</p>
      </InfoBox>

      <h2>Now Scale It to Forty Services</h2>

      <p>
        The complete login is now on the table: an encrypted channel, an identity verified (by you or by
        a provider), a session or token issued, and a permission check on each request. Every lesson so
        far has quietly assumed one server doing all of it.
      </p>

      <p>
        Real systems are a fleet of services behind one edge, and repeating token verification in each of
        them means every team ships its own JWT library, its own JWKS cache, and its own subtly different
        bug. The next lesson moves the entire check to the gateway — one wall, checked once, with the raw
        credential stripped before anything internal ever sees it.
      </p>

      <InteractiveChallenge
        question={"In the OAuth 2.0 Authorization Code Flow, why is the authorization code exchanged server-to-server rather than directly returning the access token to the browser?"}
        options={[
          "The browser cannot handle access tokens",
          "The authorization code exchange requires the client_secret, which must never be exposed to the browser. This server-to-server exchange keeps the secret safe.",
          "Access tokens are too large for browser redirects",
          "The authorization server only supports server-to-server communication"
        ]}
        correctIndex={1}
        explanation={"The authorization code is a short-lived, one-time-use code returned to the browser via redirect. The browser forwards it to your server, which then exchanges it for tokens in a server-to-server request that includes the client_secret. This keeps the client_secret out of the browser entirely. With PKCE, even if someone intercepts the code, they cannot exchange it without the code_verifier."}
      />

      <InteractiveChallenge
        question={"What does OpenID Connect (OIDC) add on top of OAuth 2.0?"}
        options={[
          "Encryption for all tokens",
          "An ID Token (JWT) with user identity, a /userinfo endpoint, and the openid scope — adding authentication to OAuth's authorization",
          "A way to revoke access tokens",
          "Support for mobile applications"
        ]}
        correctIndex={1}
        explanation={"OAuth 2.0 only handles authorization — it tells you what the app can access, but not who the user is. OIDC adds an identity layer: the ID Token is a JWT containing user claims (sub, email, name), the /userinfo endpoint provides additional profile data, and the openid scope signals you want authentication. Together, these give you both authentication (who is the user) and authorization (what can they access)."}
      />
    </LessonLayout>
  );
}
