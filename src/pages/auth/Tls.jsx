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
      lessonIndex={1}
      prev={{ path: '/auth/encryption', label: 'Encryption Fundamentals' }}
      next={{ path: '/auth/cookies', label: 'Cookies & Sessions' }}
    >
      <p>
        TLS (Transport Layer Security) is what turns HTTP into HTTPS. It encrypts data in transit,
        authenticates the server (and optionally the client), and ensures data integrity. Every time
        you see that padlock icon in your browser, TLS is working behind the scenes. This lesson
        covers everything from certificates to the TLS 1.3 handshake.
      </p>

      <h2>What TLS Provides</h2>

      <InfoBox variant="info" title="The Three Pillars of TLS">
        <p><strong>Confidentiality</strong> — Data is encrypted using AES-256-GCM. Eavesdroppers see gibberish.</p>
        <p><strong>Authentication</strong> — X.509 certificates prove you are talking to the real server, not an impostor.</p>
        <p><strong>Integrity</strong> — HMAC ensures data has not been tampered with in transit.</p>
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
  Signature Algorithm: ecdsa-with-SHA256
  Issuer: CN=Let's Encrypt Authority X3, O=Let's Encrypt
  Validity:
    Not Before: Jan 1 00:00:00 2024 UTC
    Not After:  Apr 1 00:00:00 2024 UTC    (90 days!)
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

Step 7: Encrypted Communication
  - All traffic encrypted with AES-256-GCM
  - Using the derived session keys`}
      </CodeBlock>

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

      <h2>Certificate Revocation</h2>

      <p>
        What happens when a certificate needs to be invalidated before its expiration date? Maybe the
        private key was compromised, or the domain changed ownership. There are several mechanisms:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Method</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>How It Works</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Pros/Cons</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>CRL</strong></td>
            <td style={{ padding: '0.75rem' }}>CA publishes a list of revoked serial numbers</td>
            <td style={{ padding: '0.75rem' }}>Simple but can be large and stale</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>OCSP</strong></td>
            <td style={{ padding: '0.75rem' }}>Client asks CA in real-time if cert is revoked</td>
            <td style={{ padding: '0.75rem' }}>Real-time but adds latency and privacy concern</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>OCSP Stapling</strong></td>
            <td style={{ padding: '0.75rem' }}>Server pre-fetches OCSP response and includes it in TLS handshake</td>
            <td style={{ padding: '0.75rem' }}>Best approach — fast, private, no extra round trips</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>CT Logs</strong></td>
            <td style={{ padding: '0.75rem' }}>Public append-only log of all issued certificates</td>
            <td style={{ padding: '0.75rem' }}>Audit trail — detect misissued certs</td>
          </tr>
        </tbody>
      </table>

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
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Concept</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>TLS 1.3</strong></td>
            <td style={{ padding: '0.75rem' }}>Current version. 1-RTT handshake. Removed legacy ciphers.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>X.509</strong></td>
            <td style={{ padding: '0.75rem' }}>Certificate format binding public key to domain.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>PKI</strong></td>
            <td style={{ padding: '0.75rem' }}>Public Key Infrastructure — the chain of trust system.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>ECDH</strong></td>
            <td style={{ padding: '0.75rem' }}>Elliptic Curve Diffie-Hellman key exchange.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>HKDF</strong></td>
            <td style={{ padding: '0.75rem' }}>Derives session keys from shared secret.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>OCSP Stapling</strong></td>
            <td style={{ padding: '0.75rem' }}>Server-side revocation check, included in handshake.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>mTLS</strong></td>
            <td style={{ padding: '0.75rem' }}>Both client and server present certificates.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}><strong>SNI</strong></td>
            <td style={{ padding: '0.75rem' }}>Server Name Indication — client specifies domain in ClientHello so one IP can host multiple HTTPS sites.</td>
          </tr>
        </tbody>
      </table>

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
