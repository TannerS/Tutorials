import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Tls() {
  return (
    <LessonLayout
      title="TLS & HTTPS"
      sectionId="auth"
      lessonIndex={2}
      prev={{ path: '/auth/encryption', label: 'Encryption Fundamentals' }}
      next={{ path: '/auth/cookies', label: 'Cookies & Sessions' }}
    >
      <p>
        TLS (Transport Layer Security) is the previous lesson made real. It takes ECDH key exchange,
        AES-256-GCM, and digital signatures — the exact primitives you just met — and wires them into a
        protocol that turns HTTP into HTTPS: encrypted in transit, server identity verified, tampering
        detectable. Every time you see the padlock, this is what happened.
      </p>

      <p>
        This is still Phase 1 of the login flow, and it has to come before everything else in this
        section for a simple reason: <strong>a password, a session cookie, or a token sent over plain
        HTTP is already compromised.</strong> Nothing built on top matters until the wire is safe. This
        lesson covers certificates, the chain of trust, and the TLS 1.3 handshake step by step.
      </p>

      <h2>What TLS Provides</h2>

      <InfoBox variant="info" title="The Three Pillars of TLS">
        <p><strong>Confidentiality</strong> — Data is encrypted using AES-256-GCM. Eavesdroppers see gibberish.</p>
        <p><strong>Authentication</strong> — X.509 certificates prove you are talking to the real server, not an impostor.</p>
        <p><strong>Integrity</strong> — Every record carries an authentication tag; any tampering makes decryption fail outright.</p>
      </InfoBox>

      <InfoBox variant="note" title="Where Integrity Actually Comes From (a Common Interview Trip-Up)">
        <p>
          People often say &quot;TLS uses HMAC for integrity.&quot; That was true of TLS 1.2 and earlier,
          which encrypted with a cipher like AES-CBC and then bolted on a separate HMAC — the
          MAC-then-encrypt construction that produced a decade of padding-oracle attacks (BEAST, Lucky13,
          POODLE).
        </p>
        <p>
          <strong>TLS 1.3 removed that entirely.</strong> It permits only <strong>AEAD</strong>{' '}
          (Authenticated Encryption with Associated Data) ciphers — AES-GCM, ChaCha20-Poly1305,
          AES-CCM — where confidentiality and integrity are the same operation and the authentication tag
          is produced by the cipher itself. HMAC is still present in TLS 1.3, but for{' '}
          <em>key derivation</em> (HKDF) and the <code>Finished</code> message, not for record integrity.
        </p>
      </InfoBox>

      <h2>X.509 Certificates</h2>

      <p>
        An X.509 certificate is a digital document that binds a public key to a domain name. It is the
        server&#39;s proof of identity. When your browser connects to <code>google.com</code>, the server presents
        its certificate, and your browser checks it against trusted Certificate Authorities (CAs).
      </p>

      <CodeBlock language="text" title="X.509 Certificate Structure">
{`Certificate:
  Version: 3 (v3)
  Serial Number: 04:e5:ab:12:...
  Signature Algorithm: ecdsa-with-SHA384
  Issuer: CN=E5, O=Let's Encrypt, C=US
  Validity:
    Not Before: Jan 1 00:00:00 2026 UTC
    Not After:  Apr 1 00:00:00 2026 UTC    (90 days!)
  Subject: CN=www.example.com
  Subject Public Key Info:
    Algorithm: EC (prime256v1)
    Public Key: 04:3a:7f:...
  X509v3 Extensions:
    Subject Alternative Name (SAN):
      DNS: www.example.com
      DNS: example.com
      DNS: api.example.com
    Key Usage: Digital Signature
    Extended Key Usage: TLS Web Server Authentication
  Signature: 30:45:02:21:...   (CA's digital signature)`}
      </CodeBlock>

      <InfoBox variant="tip" title="Key Certificate Fields">
        <p><strong>Subject / CN</strong> — The domain this certificate is for.</p>
        <p><strong>Issuer</strong> — The CA that signed this certificate.</p>
        <p><strong>Validity</strong> — When the cert is valid. Modern certs are 90 days (Let&#39;s Encrypt).</p>
        <p><strong>Public Key</strong> — The server&#39;s public key for ECDH key exchange.</p>
        <p><strong>SAN (Subject Alternative Name)</strong> — Additional domains covered by this cert.</p>
        <p><strong>Signature</strong> — The CA&#39;s digital signature proving this cert is legitimate.</p>
      </InfoBox>

      <h2>Certificate Chain of Trust (PKI)</h2>

      <p>
        Certificates do not exist in isolation — they form a <strong>chain of trust</strong> based on Public
        Key Infrastructure (PKI). Each certificate is signed by the one above it, all the way up to a
        root certificate that your operating system explicitly trusts.
      </p>

      <FlowChart
        title="Certificate Chain of Trust"
        chart={"graph TD\n  A[\"Root CA Certificate\"] -->|\"Signs\"| B[\"Intermediate CA Certificate\"]\n  B -->|\"Signs\"| C[\"Leaf Certificate - your server\"]\n  A -.->|\"Self-signed, stored in OS trust store\"| A\n  A -.->|\"Kept OFFLINE for security\"| A\n  B -.->|\"Online, issues leaf certs\"| B\n  C -.->|\"Presented to browsers\"| C\n  style A fill:#3d2f14,stroke:#d97706\n  style B fill:#2a1f44,stroke:#a78bfa\n  style C fill:#1a3329,stroke:#4ade80"}
      />

      <h3>Why Not Sign Directly with the Root CA?</h3>

      <InfoBox variant="warning" title="Why Intermediate CAs Exist">
        <p><strong>Security</strong> — If the root CA private key is compromised, every certificate in the world signed by that root is compromised. Root CAs are kept offline in hardware security modules (HSMs) in secure facilities.</p>
        <p><strong>Damage Containment</strong> — If an intermediate CA is compromised, you revoke just that intermediate. The root and all other intermediates remain trusted.</p>
        <p><strong>Scalability</strong> — Multiple intermediate CAs can issue certs in parallel across regions without exposing the root.</p>
        <p><strong>Shorter Lifetimes</strong> — Intermediates have shorter lifetimes than roots, reducing window of exposure.</p>
      </InfoBox>

      <h2>TLS 1.3 Handshake</h2>

      <p>
        TLS 1.3 dramatically simplified the handshake compared to TLS 1.2. It completes in just
        <strong> 1 round trip</strong> (1-RTT), down from 2 round trips in TLS 1.2. Here is exactly
        what happens when your browser connects to an HTTPS server:
      </p>

      <FlowChart
        title="TLS 1.3 Handshake (1-RTT)"
        chart={"graph LR\n  subgraph Client\n    A[\"ClientHello\"]\n    F[\"Compute Shared Secret\"]\n    H[\"Derive Session Keys\"]\n  end\n  subgraph Server\n    B[\"ServerHello\"]\n    C[\"Certificate\"]\n    D[\"Certificate Verify\"]\n    E[\"Compute Shared Secret\"]\n    G[\"Derive Session Keys\"]\n  end\n  A -->|\"TLS version, cipher suites, ECDH public value\"| B\n  B -->|\"Chosen cipher, ECDH public value\"| F\n  C -->|\"X.509 cert chain\"| F\n  D -->|\"Signature proving key ownership\"| F\n  A -->|\"Client ECDH public value\"| E\n  E --> G\n  F --> H\n  style A fill:#1a2744,stroke:#5b9cf6\n  style B fill:#1a3329,stroke:#4ade80\n  style H fill:#2a1f44,stroke:#a78bfa\n  style G fill:#2a1f44,stroke:#a78bfa"}
      />

      <h3>Step-by-Step Breakdown</h3>

      <CodeBlock language="text" title="TLS 1.3 Handshake Steps">
{`Step 1: ClientHello (Client → Server)
  - Supported TLS versions (1.3)
  - Supported cipher suites (TLS_AES_256_GCM_SHA384, etc.)
  - Client's ECDH public value (key_share)
  - Random nonce

Step 2: ServerHello (Server → Client)
  - Chosen TLS version (1.3)
  - Chosen cipher suite (TLS_AES_256_GCM_SHA384)
  - Server's ECDH public value (key_share)
  - Random nonce

Step 3: Server sends Certificate
  - X.509 certificate chain (leaf + intermediate)
  - Client verifies chain up to trusted root

Step 4: Server sends CertificateVerify
  - Signature over handshake transcript
  - Proves server owns the private key for the certificate

Step 5: Both compute Shared Secret
  - Client: own private key + server's public value = S
  - Server: own private key + client's public value = S
  - Same shared secret S, never transmitted!

Step 6: Key Derivation (HKDF)
  - Shared Secret S → HKDF-Extract → master secret
  - Master secret → HKDF-Expand → client/server write keys
  - Separate keys for each direction

Step 7: Finished (both directions)
  - Each side sends an HMAC over the entire handshake transcript
  - Proves neither side's messages were altered mid-handshake
    (this is what defeats downgrade attacks)

Step 8: Encrypted Communication
  - All traffic encrypted with AES-256-GCM
  - Using the derived session keys`}
      </CodeBlock>

      <InfoBox variant="tip" title="Almost Everything Is Encrypted Earlier Than You Think">
        <p>
          One detail that trips people up: in TLS 1.3 only <code>ClientHello</code> and{' '}
          <code>ServerHello</code> travel in the clear. The key exchange completes immediately after them,
          so the <strong>certificate itself is encrypted</strong> — unlike TLS 1.2, where a passive
          observer could read which certificate the server presented.
        </p>
        <p>
          The gap that remains is <strong>SNI</strong>: the client still has to name the host it wants in
          the plaintext <code>ClientHello</code> so a server hosting many sites knows which certificate to
          send. That is why a network observer can still see <em>which site</em> you visited even under
          TLS 1.3. Encrypted Client Hello (ECH) is the extension that closes this last gap, and it is
          rolling out now.
        </p>
      </InfoBox>

      <h3>Key Derivation from ECDH</h3>

      <InfoBox variant="note" title="How ECDH Creates a Shared Secret">
        <p>
          ECDH is mathematical magic: both parties can independently compute the same shared secret
          without ever transmitting it. The math works like this:
        </p>
        <p><strong>Client</strong>: client_private_key × Server_public_point = Shared_Secret_S</p>
        <p><strong>Server</strong>: server_private_key × Client_public_point = Shared_Secret_S</p>
        <p>
          Both computations yield the same point S on the elliptic curve. An eavesdropper who sees both
          public values cannot compute S without one of the private keys (this is the Elliptic Curve
          Discrete Logarithm Problem — computationally infeasible).
        </p>
        <p>
          From S, both sides use <strong>HKDF (HMAC-based Key Derivation Function)</strong> to derive
          separate encryption keys for client-to-server and server-to-client traffic.
        </p>
      </InfoBox>

      <h2>Forward Secrecy — Why the Key Exchange Is Ephemeral</h2>

      <p>
        There is a reason the handshake above generates a <em>fresh</em> ECDH key pair per connection
        rather than just using the long-lived key inside the certificate. That property has a name, and it
        is one of the most commonly asked TLS questions.
      </p>

      <InfoBox variant="info" title="Forward Secrecy (PFS)">
        <p>
          <strong>The threat model:</strong> an adversary records your encrypted traffic today and stores
          it. Years later they obtain the server&apos;s private key — a breach, a subpoena, a
          decommissioned server sold on eBay. Can they now decrypt the traffic they recorded?
        </p>
        <p>
          <strong>Old TLS: yes.</strong> With RSA key transport (the classic{' '}
          <code>TLS_RSA_WITH_AES_128_CBC_SHA</code> family), the client picked the session secret,
          encrypted it <em>to the server&apos;s public key</em>, and sent it. That secret is sitting in
          the recorded traffic, and the server&apos;s private key unlocks it. One key compromise
          retroactively decrypts every session ever recorded.
        </p>
        <p>
          <strong>TLS 1.3: no.</strong> The session secret comes from an ECDHE exchange using key pairs
          generated for that one connection and discarded afterwards. The certificate&apos;s private key
          is used only to <em>sign</em> the handshake (the <code>CertificateVerify</code> step) — proving
          identity in real time, never protecting the session secret. Stealing it later lets you
          impersonate the server going forward, but it does not decrypt a single recorded session.
        </p>
        <p>
          TLS 1.3 makes this mandatory: static RSA and static DH key exchange were removed from the
          protocol outright. In TLS 1.2 forward secrecy was merely an option you had to configure — which
          is the single best reason to insist on 1.3.
        </p>
      </InfoBox>

      <h2>0-RTT Resumption and Its Sharp Edge</h2>

      <p>
        TLS 1.3 also added <strong>0-RTT</strong> (&quot;early data&quot;): on a <em>reconnection</em> to
        a server you have spoken to before, the client can send application data in its very first
        packet, using a pre-shared key from the previous session. Zero round trips of handshake latency.
        It is a large win for mobile and for repeat page loads, and it comes with a genuine security
        caveat that interviewers like.
      </p>

      <InfoBox variant="danger" title="0-RTT Data Is Replayable">
        <p>
          Early data is not covered by any live exchange with the server — that is exactly what makes it
          fast. Nothing about it is fresh, so an attacker who captures a 0-RTT packet can{' '}
          <strong>re-send it later</strong> and the server will process it again. There is no nonce to
          catch the duplicate.
        </p>
        <p>
          0-RTT also does not have forward secrecy for the early data itself, since it is protected by the
          pre-shared key rather than a fresh exchange.
        </p>
        <p>
          <strong>The rule:</strong> only ever put idempotent requests in early data. A replayed{' '}
          <code>GET /home</code> is harmless; a replayed <code>POST /transfer</code> moves money twice.
          Servers should restrict early data to safe methods (nginx&apos;s <code>ssl_early_data</code>{' '}
          sets <code>Early-Data: 1</code> so your application can reject anything non-idempotent with
          <code> 425 Too Early</code>). If you cannot reason about it, leave 0-RTT off — it is off by
          default in most stacks for this reason.
        </p>
      </InfoBox>

      <h2>Certificate Revocation</h2>

      <p>
        What happens when a certificate needs to be invalidated before its expiration date? Maybe the
        private key was compromised, or the domain changed ownership. There are several mechanisms:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Method</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>How It Works</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Pros/Cons</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>CRL</strong></td>
            <td style={{ padding: '0.75rem' }}>CA publishes a list of revoked serial numbers</td>
            <td style={{ padding: '0.75rem' }}>Simple but can be large and stale</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>OCSP</strong></td>
            <td style={{ padding: '0.75rem' }}>Client asks the CA in real time whether a cert is revoked</td>
            <td style={{ padding: '0.75rem' }}>Real-time, but leaks the user&#39;s browsing to the CA, adds latency, and fails open — being phased out</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>OCSP Stapling</strong></td>
            <td style={{ padding: '0.75rem' }}>Server pre-fetches the OCSP response and includes it in the handshake</td>
            <td style={{ padding: '0.75rem' }}>Fixes OCSP&#39;s latency and privacy problems, but inherits its decline as CAs retire OCSP responders</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Browser-pushed lists</strong></td>
            <td style={{ padding: '0.75rem' }}>Vendor aggregates CRLs and ships them to the browser out of band (Chrome CRLSets, Firefox CRLite)</td>
            <td style={{ padding: '0.75rem' }}>What browsers actually rely on today — zero latency, no privacy leak, no fail-open</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Short-lived certs</strong></td>
            <td style={{ padding: '0.75rem' }}>Sidestep revocation by expiring quickly and renewing automatically via ACME</td>
            <td style={{ padding: '0.75rem' }}>The direction the whole industry is moving — nothing to revoke if it expires in days</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>CT Logs</strong></td>
            <td style={{ padding: '0.75rem' }}>Public append-only log of all issued certificates</td>
            <td style={{ padding: '0.75rem' }}>Audit trail — detect misissued certs (not revocation, but how you find out you need it)</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="Revocation Is the Part of PKI That Never Really Worked">
        <p>
          Be careful repeating &quot;OCSP stapling is the answer&quot; — it is the answer to a question
          the industry has largely stopped asking. Online revocation checking fails open by design: if the
          responder is unreachable, browsers proceed anyway, because doing otherwise would make a CA
          outage into an internet outage. An attacker positioned to use a stolen key is also positioned to
          block the check. Chrome has never done live OCSP for this reason, preferring its own pushed
          CRLSets, and Firefox uses CRLite.
        </p>
        <p>
          The industry answer is to make revocation matter less by shrinking certificate lifetimes. The
          CA/Browser Forum has agreed a schedule stepping the maximum public TLS certificate lifetime down
          from 398 days to <strong>47 days by 2029</strong>, and Let&apos;s Encrypt now issues 6-day
          certificates. A cert that expires this week barely needs revoking.
        </p>
        <p>
          <strong>The practical consequence for you:</strong> certificate renewal has to be automated
          (ACME, cert-manager, your cloud provider&apos;s managed certs). Anything involving a human
          diarising a renewal date is already broken at a 47-day cadence.
        </p>
      </InfoBox>

      <h2>Mutual TLS (mTLS)</h2>

      <p>
        Standard TLS only authenticates the <em>server</em>. Mutual TLS (mTLS) requires <strong>both</strong> sides
        to present certificates. The client also proves its identity with a certificate signed by a trusted CA.
      </p>

      <InfoBox variant="info" title="Where mTLS is Used">
        <p><strong>Zero-trust microservice environments</strong> — Every service verifies every other service. No implicit trust based on network location.</p>
        <p><strong>Service meshes</strong> — Istio, Linkerd automatically manage mTLS between pods in Kubernetes.</p>
        <p><strong>API gateways</strong> — Partners authenticate via client certificates instead of API keys.</p>
        <p><strong>IoT devices</strong> — Each device has a unique certificate for authentication.</p>
      </InfoBox>

      <CodeBlock language="javascript" title="mTLS Configuration (Node.js)">
{`const https = require('https');
const fs = require('fs');

// Server requires client certificate
const server = https.createServer({
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem'),
  ca: fs.readFileSync('client-ca-cert.pem'),  // CA that signed client certs
  requestCert: true,                            // Require client certificate
  rejectUnauthorized: true,                     // Reject invalid client certs
}, (req, res) => {
  const clientCert = req.socket.getPeerCertificate();
  console.log('Client CN:', clientCert.subject.CN);
  res.end('Hello, authenticated client!');
});

server.listen(443);

// Client with certificate
const options = {
  hostname: 'api.example.com',
  port: 443,
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem'),
  ca: fs.readFileSync('server-ca-cert.pem'),
};

https.get(options, (res) => {
  res.on('data', (d) => process.stdout.write(d));
});`}
      </CodeBlock>

      <h2>TLS Key Concepts Reference</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Concept</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>TLS 1.3</strong></td>
            <td style={{ padding: '0.75rem' }}>Current version. 1-RTT handshake. Removed legacy ciphers.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>X.509</strong></td>
            <td style={{ padding: '0.75rem' }}>Certificate format binding public key to domain.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>PKI</strong></td>
            <td style={{ padding: '0.75rem' }}>Public Key Infrastructure — the chain of trust system.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>ECDH</strong></td>
            <td style={{ padding: '0.75rem' }}>Elliptic Curve Diffie-Hellman key exchange.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>HKDF</strong></td>
            <td style={{ padding: '0.75rem' }}>Derives session keys from shared secret.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>OCSP Stapling</strong></td>
            <td style={{ padding: '0.75rem' }}>Server-side revocation check, included in handshake.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>mTLS</strong></td>
            <td style={{ padding: '0.75rem' }}>Both client and server present certificates.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>SNI</strong></td>
            <td style={{ padding: '0.75rem' }}>Server Name Indication — client specifies domain in ClientHello so one IP can host multiple HTTPS sites. Sent in plaintext; ECH encrypts it.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>AEAD</strong></td>
            <td style={{ padding: '0.75rem' }}>Authenticated Encryption with Associated Data — confidentiality and integrity in one operation. The only kind of cipher TLS 1.3 allows.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Forward Secrecy</strong></td>
            <td style={{ padding: '0.75rem' }}>Ephemeral per-connection keys, so a future private-key compromise cannot decrypt past recorded traffic. Mandatory in TLS 1.3.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>0-RTT</strong></td>
            <td style={{ padding: '0.75rem' }}>Early data on resumed connections. Fast, but replayable — idempotent requests only.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>HSTS</strong></td>
            <td style={{ padding: '0.75rem' }}>Response header telling the browser to only ever use HTTPS for this host, closing the plaintext-first-request gap. Covered in <em>Web Security</em>.</td>
          </tr>
        </tbody>
      </table>

      <h2>What TLS Still Does Not Solve</h2>

      <p>
        The channel is now private and the server is who it claims to be, so the user can finally send a
        password safely. But TLS protects a <em>connection</em>, not a <em>user</em> — and HTTP itself is
        stateless, so the very next request arrives with no memory that a login ever happened. Handing
        over your password on every single request is obviously not the answer.
      </p>

      <p>
        That is Phase 3 of the flow: the server needs to hand the browser something it can present again
        later. The next two lessons are the two competing answers to that one question — the classic
        stateful one first.
      </p>

      <InteractiveChallenge
        question={"In the TLS 1.3 handshake, why is the shared secret never transmitted over the network?"}
        options={[
          "It is encrypted with AES before being sent",
          "Both sides independently compute the same shared secret using ECDH — each combines their private key with the other party's public value",
          "The certificate authority sends it through a secure side channel",
          "It is split into fragments and sent in different packets"
        ]}
        correctIndex={1}
        explanation={"ECDH (Elliptic Curve Diffie-Hellman) allows both parties to compute the same shared secret independently. The client computes: client_private × server_public = S. The server computes: server_private × client_public = S. Both get the same S due to the mathematical properties of elliptic curves. An eavesdropper who sees both public values cannot compute S without one of the private keys."}
      />

      <InteractiveChallenge
        question={"Why do Certificate Authorities use intermediate certificates instead of signing directly with the root CA?"}
        options={[
          "Root certificates are too large to use for signing",
          "Intermediate certificates are faster at signing",
          "If the root CA is compromised, all certificates everywhere are compromised — intermediates provide damage containment, security, and scalability",
          "Web browsers only accept certificates from intermediate CAs"
        ]}
        correctIndex={2}
        explanation={"The root CA private key is the most valuable secret in the PKI system. It is kept offline in hardware security modules (HSMs) in secure facilities. If it were used to sign leaf certificates directly and got compromised, every certificate in the world signed by that root would be untrustworthy. With intermediate CAs, a compromise only affects certificates issued by that intermediate — you revoke it and the root remains trusted."}
      />
    </LessonLayout>
  );
}
