import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function CryptoCheatsheet() {
  return (
    <LessonLayout
      title="📋 Cryptography Cheat Sheet"
      sectionId="cryptography"
      lessonIndex={15}
      prev={{ path: '/cryptography/mistakes', label: 'Common Cryptographic Mistakes' }}
      next={null}
    >
      <p>
        A single-page reconciliation of every number and API name used across this section. Every
        figure below was measured or quoted from primary docs somewhere in the 15 lessons that precede
        this one — nothing here is restated from memory.
      </p>

      <h2>The Three Buckets</h2>

      <CodeBlock language="text" title="Encoding vs Encryption vs Hashing">
{`Encoding    Reversible, NO key      Base64 / hex / URL-encoding     Not security
Encryption  Reversible, WITH a key  AES-256-GCM / RSA / ECC         Confidentiality
Hashing     One-way, no inverse     SHA-256 / bcrypt / argon2id     Integrity or verification

Rule of thumb: if you ever need the original value back, it's
encryption. If you never need it back, it's hashing.`}
      </CodeBlock>

      <h2>Symmetric Encryption</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Mode</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Use it?</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>AES-256-GCM</strong></td>
            <td style={{ padding: '0.75rem', color: 'var(--accent-green)' }}>Yes — default choice</td>
            <td style={{ padding: '0.75rem' }}>AEAD: encryption + integrity in one step, hardware-accelerated</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>ChaCha20-Poly1305</strong></td>
            <td style={{ padding: '0.75rem', color: 'var(--accent-green)' }}>Yes — no AES hardware</td>
            <td style={{ padding: '0.75rem' }}>Same AEAD guarantee, faster in pure software (mobile/embedded)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>AES-CBC (+ HMAC)</strong></td>
            <td style={{ padding: '0.75rem', color: 'var(--accent-amber)' }}>Legacy only</td>
            <td style={{ padding: '0.75rem' }}>Only safe as Encrypt-then-MAC; MAC-then-Encrypt caused Lucky 13</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>AES-ECB</strong></td>
            <td style={{ padding: '0.75rem', color: 'var(--accent-red)' }}>Never</td>
            <td style={{ padding: '0.75rem' }}>Identical plaintext blocks → identical ciphertext blocks, patterns leak</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="danger" title="The One Rule That Breaks Everything If Violated">
        <p>
          <strong>Never reuse a nonce/IV with the same key</strong> — with GCM specifically, this
          breaks both confidentiality and the integrity guarantee simultaneously. Generate a fresh
          random 12-byte nonce (<code>crypto.randomBytes(12)</code> / <code>SecureRandom</code>) for
          every single encryption call.
        </p>
      </InfoBox>

      <h2>Asymmetric Encryption &amp; Signatures</h2>

      <CodeBlock language="text" title="Key/signature sizes — measured on this machine, Node crypto + JDK 26">
{`Algorithm       Public key   Signature        Sign speed    Verify speed
RSA-2048-PSS    294 bytes    256 bytes fixed   ~3.4K/s       ~92K/s   (slow sign, fast verify)
ECDSA P-256     91 bytes     ~70-72B variable  ~77K/s        ~30.7K/s
Ed25519         44 bytes     64 bytes fixed    ~71.6K/s      ~29.8K/s (deterministic, no nonce risk)

Default recommendation for new systems: Ed25519.
Reason: deterministic signing means no per-signature random nonce
to get wrong — ECDSA nonce reuse/bias caused real key-recovery
breaks (Sony PS3, 2010). RSA-2048's asymmetric sign/verify cost is
also why TLS and most protocols default to elliptic-curve schemes.`}
      </CodeBlock>

      <CodeBlock language="text" title="Hybrid encryption — what TLS actually does">
{`Asymmetric (ECDHE)  →  establishes a SHARED SECRET, once, at connection start
       ↓
Symmetric (AES-256-GCM)  →  encrypts ALL bulk data, for the life of the connection

Why: asymmetric solves key distribution (no pre-shared secret
needed), symmetric solves performance (orders of magnitude faster
for bulk data). Every HTTPS connection uses this exact pattern.`}
      </CodeBlock>

      <h2>Hashing</h2>

      <CodeBlock language="text" title="Which hash for which job">
{`General-purpose / fast   SHA-256, SHA-3        File integrity, git, checksums
Message authentication  HMAC-SHA256           Verify a message + shared secret (not non-repudiable)
Password storage         argon2id / bcrypt     Deliberately SLOW — resists GPU cracking
BROKEN — do not use      MD5, SHA-1            MD5: trivial collisions. SHA-1: practical collision
                                                (Google/CWI "SHAttered," Feb 2017)

SHA-256 hashing a password directly is the #2 most common mistake
in this section — general-purpose hashes are fast BY DESIGN, which
is exactly wrong for passwords. Use argon2id/bcrypt instead.`}
      </CodeBlock>

      <h2>Trust: Certificates, CAs, and Signing</h2>

      <CodeBlock language="text" title="A certificate, structurally">
{`A certificate IS: a public key + an identity, SIGNED by someone.

Self-signed   →  signed by its own key. Nobody vouches for it but
                  you (legitimate for local dev — that's what a
                  self-signed cert or mkcert's local CA is).
CA-signed     →  the CA verifies you control the identity (ACME
                  HTTP-01/DNS-01 challenge, etc.), then signs your
                  public key + identity with the CA's OWN private
                  key. That signature IS the certificate.

Signing a MESSAGE and signing a CERTIFICATE are the same operation.
The only difference is what's inside the thing being signed.`}
      </CodeBlock>

      <InfoBox variant="info" title="Where the Trust Actually Comes From">
        <p>
          Your OS/browser ships a <strong>trust store</strong> — a bundled list of root CA
          certificates it already trusts (158 measured on a real Mac). A site&apos;s certificate
          doesn&apos;t need to be known in advance; it just needs to chain, through a signature at
          every link, up to one of those roots. That's the entire mechanism behind &quot;why doesn't
          my browser warn me at my bank&quot; — see <strong>Anatomy of a Secure Login</strong> for the
          full connection walked step by step.
        </p>
      </InfoBox>

      <h2>Key Management</h2>

      <CodeBlock language="text" title="Envelope encryption — why rotation doesn't mean re-encrypting everything">
{`DEK (Data Encryption Key)   encrypts the actual data — can be huge
KEK (Key Encryption Key)    encrypts (wraps) the DEK — stored in an
                             HSM / cloud KMS, rarely touched

Only the WRAPPED DEK sits next to the data. If the KEK leaks:
re-wrap the small DEK with a new KEK — do NOT re-encrypt the data.
Measured: wrapped-DEK size stays constant (32 bytes) whether the
protected data is 40 bytes or 5 MB. Rotation cost is constant, not
proportional to data size.`}
      </CodeBlock>

      <h2>Random Number Generation</h2>

      <CodeBlock language="text" title="Never for security — always for security">
{`NEVER for anything security-related:
  Math.random()        JS  — documented NOT cryptographically secure
  java.util.Random      Java — documented 48-bit LCG, predictable from 2 outputs

ALWAYS instead:
  crypto.randomBytes() / crypto.randomInt()   Node — CSPRNG
  java.security.SecureRandom                  Java — CSPRNG
                                               (default algorithm on this JDK: NativePRNG)`}
      </CodeBlock>

      <h2>Password Key Derivation — What to Use, in Order</h2>

      <CodeBlock language="text" title="KDF recommendation, current as of this section's verification pass">
{`1st choice   argon2id           Winner of the Password Hashing Competition; memory-hard
2nd choice   scrypt              Memory-hard; crypto.scrypt() is Node's built-in recommendation
3rd choice   bcrypt               Widely deployed, no memory-hardness tuning
Compliance   PBKDF2-HMAC-SHA256   Use ONLY if FIPS/compliance requires it —
             (600,000 iterations)  600,000 is OWASP's current minimum recommendation,
                                    confirmed against their live Password Storage Cheat Sheet

Node 24.7.0+ ships a native crypto.argon2()/argon2Sync() — confirmed
present in this environment's Node v25.`}
      </CodeBlock>

      <h2>API Quick Reference</h2>

      <CodeBlock language="text" title="Node.js (node:crypto)">
{`AES-256-GCM encrypt/decrypt   crypto.createCipheriv/createDecipheriv('aes-256-gcm', ...)
Hash (one-shot)               crypto.createHash('sha256').update(x).digest('hex')
Hash (streaming, large files) createHash() piped through fs.createReadStream via pipeline()
HMAC                          crypto.createHmac('sha256', key)
Password KDF                  crypto.argon2(...)  <- preferred, Node 24.7+
                              crypto.scrypt(password, salt, keylen)  <- fallback
Sign / verify                 crypto.sign() / crypto.verify() (with generateKeyPairSync)
Constant-time compare         crypto.timingSafeEqual(a, b)   — THROWS if lengths differ
CSPRNG                        crypto.randomBytes(n) / crypto.randomInt(min, max)

DEPRECATED / REMOVED (Node 22+): crypto.createCipher / createDecipher
  — no explicit IV, weak MD5-based key derivation. Use createCipheriv instead.`}
      </CodeBlock>

      <CodeBlock language="text" title="Java (javax.crypto / java.security)">
{`AES-256-GCM encrypt/decrypt   Cipher.getInstance("AES/GCM/NoPadding")  — NEVER "AES" alone
                                (Cipher.getInstance("AES") with no mode defaults to ECB — verified)
Hash (one-shot)               MessageDigest.getInstance("SHA-256")
Hash (streaming, large files) DigestInputStream wrapping a BufferedInputStream
Password KDF                  SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
Sign / verify                 Signature.getInstance("SHA256withECDSA" / "SHA256withRSA")
Constant-time compare         MessageDigest.isEqual(a, b)   — returns false on length
                                mismatch (Node's timingSafeEqual THROWS instead — different
                                contract, verified directly, don't assume they match)
CSPRNG                        new SecureRandom()  /  SecureRandom.getInstanceStrong()

Gotcha, empirically confirmed: Cipher instances are NOT safe to
share across threads without synchronization — 8 threads sharing
one Cipher produced 646/1600 (~40%) corrupted results in a real test.`}
      </CodeBlock>

      <h2>Full Section Index</h2>

      <CodeBlock language="text" title="All 16 lessons, in reading order">
{`1.  Encoding vs Encryption vs Hashing        Vocabulary — read this first
2.  Encryption Fundamentals                  AES, RSA, ECC, hybrid encryption
3.  Hashing & Data Integrity                 SHA-256/SHA-3, HMAC, Merkle trees
4.  Authenticated Encryption (AEAD)          Why encryption + integrity must be one step
5.  Digital Signatures                       RSA-PSS vs ECDSA vs Ed25519
6.  Signing Files & Software                 GPG, git commit -S, Sigstore/cosign
7.  How a Certificate Is Actually Made       CSR → CA verification → signature = cert
8.  TLS & HTTPS                              The full 1.3 handshake, mTLS
9.  Where Keys & Certs Actually Live         OS/browser trust stores, TPM/Secure Enclave
10. Key Wrapping & Envelope Encryption       DEK/KEK, why rotation is cheap
11. Secure Random Number Generation          CSPRNG vs Math.random()/java.util.Random
12. Anatomy of a Secure Login                The full flow, DNS to session cookie
13. Applied Cryptography — Java              5 complete, verified programs
14. Applied Cryptography — Node & TypeScript 4 complete, verified programs
15. Common Cryptographic Mistakes            ECB, nonce reuse, padding oracles, timing attacks
16. This page`}
      </CodeBlock>
    </LessonLayout>
  );
}
