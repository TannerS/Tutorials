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
      lessonIndex={4}
      prev={{ path: '/auth/jwt', label: 'JWT Deep Dive' }}
      next={{ path: '/auth/authz', label: 'AuthN vs AuthZ' }}
    >
      <p>
        OAuth 2.0 is an authorization framework that allows applications to obtain limited access to user
        accounts on third-party services without the user sharing their password. When you click
        &quot;Login with Google,&quot; you are using OAuth 2.0. OpenID Connect (OIDC) adds an identity layer on
        top, providing standardized user authentication.
      </p>

      <h2>The Four Roles</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Role</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Who</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Resource Owner</strong></td>
            <td style={{ padding: '0.75rem' }}>The user who owns the data</td>
            <td style={{ padding: '0.75rem' }}>You (the Google user)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Client</strong></td>
            <td style={{ padding: '0.75rem' }}>The application requesting access</td>
            <td style={{ padding: '0.75rem' }}>Your web app (example.com)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Authorization Server</strong></td>
            <td style={{ padding: '0.75rem' }}>Issues tokens after user consent</td>
            <td style={{ padding: '0.75rem' }}>Google Auth (accounts.google.com)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
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
  {
    "grant_type": "authorization_code",
    "code": "4/0AY0e-g7...",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uri": "https://example.com/callback",
    "code_verifier": "original_code_verifier"    # PKCE
  }

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

  // Store code verifier in session for later
  req.session.codeVerifier = codeVerifier;
  req.session.oauthState = crypto.randomBytes(16).toString('hex');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', req.session.oauthState);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  res.redirect(authUrl.toString());
});

// Step 4-6: Handle callback
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  // Verify state to prevent CSRF
  if (state !== req.session.oauthState) {
    return res.status(403).json({ error: 'Invalid state' });
  }

  // Exchange code for tokens
  const tokenResponse = await axios.post(
    'https://oauth2.googleapis.com/token',
    {
      grant_type: 'authorization_code',
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code_verifier: req.session.codeVerifier,
    }
  );

  const { access_token, id_token, refresh_token } = tokenResponse.data;

  // Decode ID token to get user info (verify signature in production!)
  const userInfo = JSON.parse(
    Buffer.from(id_token.split('.')[1], 'base64url').toString()
  );

  // Create session or JWT for your app
  req.session.user = {
    id: userInfo.sub,
    email: userInfo.email,
    name: userInfo.name,
  };

  res.redirect('/dashboard');
});`}
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
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Token</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Lifetime</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Purpose</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Format</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Authorization Code</strong></td>
            <td style={{ padding: '0.75rem' }}>One-time use</td>
            <td style={{ padding: '0.75rem' }}>Exchanged for tokens</td>
            <td style={{ padding: '0.75rem' }}>Opaque string</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Access Token</strong></td>
            <td style={{ padding: '0.75rem' }}>15 min — 1 hour</td>
            <td style={{ padding: '0.75rem' }}>Call resource server APIs</td>
            <td style={{ padding: '0.75rem' }}>Opaque or JWT</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>Refresh Token</strong></td>
            <td style={{ padding: '0.75rem' }}>Days to weeks</td>
            <td style={{ padding: '0.75rem' }}>Get new access tokens</td>
            <td style={{ padding: '0.75rem' }}>Opaque string</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
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
        <p><strong>Authorization Code (no PKCE)</strong> — Legacy server-side apps with a client secret. Still acceptable for confidential clients.</p>
        <p><strong>Client Credentials</strong> — Machine-to-machine (M2M) communication. No user involved. Service A calls Service B.</p>
        <p><strong>Device Code</strong> — For devices with limited input (smart TVs, CLI tools). User authorizes on a separate device.</p>
        <p style={{ color: '#dc2626' }}><strong>Implicit Flow — DEPRECATED!</strong> Do not use. Tokens exposed in URL fragment. Replaced by Authorization Code + PKCE.</p>
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
