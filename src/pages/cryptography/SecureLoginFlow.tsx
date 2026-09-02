import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';

export default function CryptoSecureLoginFlow() {
  return (
    <LessonLayout
      title="Anatomy of a Secure Login"
      sectionId="cryptography"
      lessonIndex={11}
      prev={{ path: '/cryptography/secure-random', label: 'Secure Random Number Generation' }}
      next={{ path: '/cryptography/applied-java', label: 'Applied Cryptography — Java' }}
    >
      <p>
        Every other lesson in this section takes one piece of the puzzle — a cipher, a hash, a
        certificate, a trust store — and holds it still long enough to examine it. This lesson puts
        the pieces back in motion. It answers one question end to end: <strong>what actually happens,
        step by step, between typing a bank's URL and successfully logging in?</strong> Nothing here
        is new cryptography — every step links back to a lesson that already covered it in depth.
        What&apos;s new is seeing them fire in the correct order, because the order is where most of
        the security actually comes from.
      </p>

      <FlowChart
        title="From URL Bar to Logged In"
        chart={"graph TD\n  A[\"1. DNS lookup\\nmybank.com -> IP\"] --> B[\"2. TCP handshake\\nSYN / SYN-ACK / ACK, port 443\"]\n  B --> C[\"3. TLS handshake begins\\nClientHello / ServerHello\"]\n  C --> D[\"4. Server sends its cert chain\"]\n  D --> E{\"5. Chain validates against\\nOS/browser TRUST STORE?\"}\n  E -->|\"No\"| X[\"Browser blocks the connection\\n(cert warning)\"]\n  E -->|\"Yes\"| F[\"6. ECDHE key exchange\\nshared secret derived\"]\n  F --> G[\"7. Symmetric session keys derived\\n(HKDF)\"]\n  G --> H[\"8. Tunnel is now encrypted\\n+ tamper-evident\"]\n  H --> I[\"9. ONLY NOW: login form POSTs\\nusername + password\"]\n  I --> J[\"10. Server checks credentials\\nagainst stored password hash\"]\n  J -->|\"Match\"| K[\"11. Server issues a session\\ncookie or JWT\"]\n  J -->|\"No match\"| L[\"Reject — generic error,\\nno hint which field was wrong\"]\n  K --> M[\"12. Every later request\\nsends that cookie/JWT back\\nno re-login needed\"]\n  style E fill:#2a1f44,stroke:#a78bfa\n  style H fill:#1a3329,stroke:#4ade80\n  style I fill:#1a2744,stroke:#5b9cf6\n  style X fill:#3b1a1a,stroke:#dc2626"}
      />

      <h2>Step by Step</h2>

      <h3>1&ndash;2. DNS and TCP — before any crypto happens</h3>
      <p>
        Your OS asks a DNS resolver &quot;what IP address is <code>mybank.com</code>?&quot; and gets an
        answer. Classic DNS is <strong>plaintext</strong> — a network observer between you and the
        resolver can see which hostname you looked up. DNS-over-HTTPS (DoH) and DNS-over-TLS (DoT)
        encrypt this step, but they are opt-in and not yet universal, so treat plain DNS as visible by
        default. Once your OS has an IP, it opens a plain TCP connection to that IP on port 443 — the
        familiar SYN / SYN-ACK / ACK handshake. Nothing here is encrypted yet either; TCP just
        establishes a reliable byte stream for TLS to run on top of.
      </p>

      <h3>3&ndash;5. TLS handshake and the trust-store check</h3>
      <p>
        This is where <strong>TLS &amp; HTTPS</strong> takes over — that lesson has the full
        step-by-step handshake, so it isn&apos;t repeated here. The part worth pulling forward
        explicitly is step 5, because it&apos;s the direct answer to &quot;how does my browser already
        have the keys for places I&apos;ve never visited?&quot; It doesn&apos;t. What it already has is
        a bundled list of root certificate authorities it has decided to trust — the{' '}
        <strong>trust store</strong> covered two lessons back, where we measured 158 of them on a real
        Mac and used one to validate a live connection to <code>chase.com</code>. The bank&apos;s
        certificate doesn&apos;t need to be known in advance; it just needs to chain up to one of those
        158 roots through a signature at every link, exactly the mechanism from{' '}
        <strong>How a Certificate Is Actually Made</strong>. If that chain doesn&apos;t resolve, the
        browser stops here and shows a warning — it does not proceed and quietly encrypt anyway.
      </p>

      <InfoBox variant="info" title="This Is the Answer to the Original Question">
        <p>
          &quot;Keys loaded into the OS or browser, used to secure the connection when you log in&quot;
          &mdash; that&apos;s the trust store, and step 5 is the exact moment it gets used. It doesn&apos;t
          hold a key <em>for</em> your bank specifically. It holds the small set of root keys needed to
          verify whatever certificate your bank presents, at connection time, for any of the millions of
          sites that chain up to one of those same roots.
        </p>
      </InfoBox>

      <h3>6&ndash;8. Key exchange and the encrypted tunnel</h3>
      <p>
        Once the certificate is trusted, an ECDHE key exchange runs — both sides compute the same
        shared secret without ever transmitting it, the asymmetric half of the{' '}
        <strong>hybrid encryption</strong> pattern. That shared secret is fed through HKDF to derive
        the actual symmetric session keys, and from that point on every byte in both directions is
        protected by <strong>AEAD</strong> (AES-256-GCM, typically) — confidential and tamper-evident.
        This is also the point where the <strong>mutual-TLS</strong> variant would add a second
        certificate check in the other direction, though an ordinary consumer login only authenticates
        the server this way, not the client.
      </p>

      <h3>9. Only now does the login form submit</h3>
      <p>
        This is the step that makes everything above it matter. The browser sends an HTTP{' '}
        <code>POST</code> containing your username and password — but it does so <em>inside</em> the
        tunnel established in steps 6&ndash;8, not before it. If a site&apos;s login form could
        somehow submit before the handshake finished, the password would cross the network as plain
        text, readable by anyone positioned between you and the server. That is precisely why a login
        form served over plain <code>http://</code> is dangerous even if the form itself
        &quot;looks fine&quot;: modern browsers actively flag password fields on non-HTTPS pages for
        exactly this reason, and a correctly built site simply won&apos;t let the request leave the
        browser until the TLS tunnel in steps 3&ndash;8 is fully established.
      </p>

      <h3>10. The server checks what you sent — against a hash, never the original</h3>
      <p>
        The server does not keep your actual password anywhere. It stores a slow, salted hash of it —
        the distinction from ordinary hashing that <strong>Hashing &amp; Data Integrity</strong> and
        the password-hashing section of <strong>Encryption Fundamentals</strong> both cover. Login
        verification means hashing the password you just sent with the same algorithm and salt, then
        comparing the result to what&apos;s stored — using a <strong>constant-time comparison</strong>,
        not <code>===</code>, for exactly the timing-attack reason covered in <strong>Common
        Cryptographic Mistakes</strong>. Either it matches or it doesn&apos;t; a well-built server
        returns the same generic error either way, so a failed login doesn&apos;t leak whether the{' '}
        <em>username</em> or the <em>password</em> was wrong.
      </p>

      <h3>11&ndash;12. A session gets established so you don&apos;t repeat all of this on every click</h3>
      <p>
        On success, the server hands back either a session cookie or a signed JWT — the full mechanics
        of both, including why each choice trades off differently, live in the Web Auth &amp; Sessions
        subsection (<code>Cookies &amp; Sessions</code> and <code>JWT Deep Dive</code>), not here. What
        matters for this lesson is just the handoff: that token now rides along on every subsequent
        request, inside the same TLS tunnel, so the browser doesn&apos;t have to re-run steps 9&ndash;10
        every time you click a link.
      </p>

      <h2>What Can Go Wrong at Each Layer</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Layer</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>What can go wrong</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>DNS (step 1)</td>
            <td style={{ padding: '0.75rem' }}>DNS spoofing/cache poisoning — an attacker answers the lookup with the wrong IP, aimed at their own server</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Certificate chain (steps 3&ndash;5)</td>
            <td style={{ padding: '0.75rem' }}>A compromised or careless CA issues a fraudulent certificate for a domain it shouldn&apos;t have &mdash; the reason Certificate Transparency logs and revocation exist</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Handshake negotiation (steps 3&ndash;8)</td>
            <td style={{ padding: '0.75rem' }}>Downgrade attacks trying to force an older, weaker TLS version or cipher suite &mdash; TLS 1.3&apos;s signed transcript in the Finished message is the specific defense</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Login submission (step 9)</td>
            <td style={{ padding: '0.75rem' }}>Credential stuffing &mdash; an attacker doesn&apos;t break any crypto, they just try passwords leaked from other breaches at scale</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Session handoff (steps 11&ndash;12)</td>
            <td style={{ padding: '0.75rem' }}>Session fixation or cookie theft (XSS) &mdash; covered in depth in <code>Cookies &amp; Sessions</code></td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="success" title="The One Sentence to Keep">
        <p>
          Every step before &quot;the tunnel is encrypted&quot; exists to make that one guarantee true
          before anything sensitive is allowed to move — the trust store validates <em>who</em>
          you&apos;re talking to, the key exchange makes sure only the two of you can read what&apos;s
          said, and only then does the password get sent. Security here isn&apos;t one algorithm; it&apos;s
          a sequence where each step refuses to proceed until the previous one succeeded.
        </p>
      </InfoBox>

    </LessonLayout>
  );
}
