import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function CryptoCheatsheet() {
  return (
    <GuideLayout
      title="Cryptography"
      kicker="FIELD GUIDE"
      glyph="🔑"
      tagline="Encoding vs encryption vs hashing, AEAD, signatures, TLS trust and key management — reconciled against Node crypto, JDK crypto and OWASP, nothing restated from memory."
      meta={['AES-256-GCM / RSA / ECC', 'Node crypto + JDK APIs', '13 panels']}
      page="1 / 1"
      footer="Every figure here was measured or quoted from primary docs somewhere in the lessons that precede this one. The lessons carry the reasoning; this page is the recall sheet."
      prev={{ path: '/cryptography/mistakes', label: 'Common Cryptographic Mistakes' }}
      next={null}
    >
      <GuidePanel n={1} title="The Three Buckets" accent="blue" glyph="🪣" span={2}>
        <GuideTable
          head={['Bucket', 'Reversible?', 'Examples', 'Gives you']}
          rows={[
            ['Encoding', 'Yes — NO key', 'Base64 / hex / URL-encoding', 'Not security'],
            ['Encryption', 'Yes — WITH a key', 'AES-256-GCM / RSA / ECC', 'Confidentiality'],
            ['Hashing', 'No — one-way', 'SHA-256 / bcrypt / argon2id', 'Integrity or verification'],
          ]}
        />
        <GuideRules items={[
          "Rule of thumb: if you ever need the original value back, it's encryption. If you never need it back, it's hashing.",
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Symmetric Encryption & AEAD" accent="purple" glyph="🔐">
        <GuideTable
          head={['Mode', 'Use it?', 'Why']}
          rows={[
            ['AES-256-GCM', 'Yes — default choice', 'AEAD: encryption + integrity in one step, hardware-accelerated'],
            ['ChaCha20-Poly1305', 'Yes — no AES hardware', 'Same AEAD guarantee, faster in pure software (mobile/embedded)'],
            ['AES-CBC (+ HMAC)', 'Legacy only', 'Only safe as Encrypt-then-MAC; MAC-then-Encrypt caused Lucky 13'],
            ['AES-ECB', 'Never', 'Identical plaintext blocks -> identical ciphertext blocks, patterns leak'],
          ]}
        />
        <GuideRules items={[
          'Never reuse a nonce/IV with the same key — with GCM this breaks confidentiality AND integrity simultaneously.',
          'Generate a fresh random 12-byte nonce (crypto.randomBytes(12) / SecureRandom) for every single encryption call.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="Asymmetric Encryption & Signatures" accent="green" glyph="✍️" span={2}>
        <GuideTable
          head={['Algorithm', 'Public key', 'Signature', 'Sign/s', 'Verify/s']}
          rows={[
            ['RSA-2048-PSS', '294 bytes', '256 bytes fixed', '~3.4K', '~92K'],
            ['ECDSA P-256', '91 bytes', '~70-72B variable', '~77K', '~30.7K'],
            ['Ed25519', '44 bytes', '64 bytes fixed', '~71.6K', '~29.8K'],
          ]}
        />
        <GuideRules items={[
          'Measured on this machine — Node crypto + JDK 26.',
          'Default for new systems: Ed25519 — deterministic signing removes the per-signature random nonce that caused real key-recovery breaks (ECDSA nonce reuse/bias, Sony PS3, 2010).',
          "RSA-2048's slow-sign / fast-verify asymmetry is why TLS and most protocols default to elliptic-curve schemes instead.",
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="Hybrid Encryption — What TLS Does" accent="amber" glyph="🔗">
        <GuideCode>{`Asymmetric (ECDHE)  ->  establishes a SHARED SECRET, once, at
                         connection start
        |
Symmetric (AES-256-GCM)  ->  encrypts ALL bulk data, for the life
                              of the connection`}</GuideCode>
        <GuideRules items={[
          'Asymmetric solves key distribution — no pre-shared secret needed.',
          'Symmetric solves performance — orders of magnitude faster for bulk data.',
          'Every HTTPS connection uses this exact pattern.',
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Hashing" accent="pink" glyph="#️⃣">
        <GuideTable
          head={['Job', 'Hash / KDF to use']}
          rows={[
            ['General-purpose / fast', 'SHA-256, SHA-3 — file integrity, git, checksums'],
            ['Message authentication', 'HMAC-SHA256 — message + shared secret (not non-repudiable)'],
            ['Password storage', 'argon2id / bcrypt — deliberately SLOW, resists GPU cracking'],
          ]}
        />
        <GuideRules items={[
          'BROKEN, do not use: MD5 (trivial collisions), SHA-1 (practical collision — Google/CWI "SHAttered," Feb 2017).',
          'Hashing a password directly with SHA-256 is the #2 most common mistake in this section — general-purpose hashes are fast BY DESIGN, exactly wrong for passwords.',
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="Certificates & Chain of Trust" accent="cyan" glyph="📜" span={2}>
        <GuideCode>{`A certificate IS: a public key + an identity, SIGNED by someone.

Self-signed  ->  signed by its own key. Nobody vouches for it but
                  you (legitimate for local dev — a self-signed
                  cert or mkcert's local CA).
CA-signed    ->  the CA verifies you control the identity (ACME
                  HTTP-01/DNS-01, etc.), then signs your public key
                  + identity with the CA's OWN private key. That
                  signature IS the certificate.`}</GuideCode>
        <GuideRules items={[
          'Signing a MESSAGE and signing a CERTIFICATE are the same operation — only what’s inside differs.',
          'Your OS/browser ships a trust store — a bundled list of root CA certificates it already trusts (158 measured on a real Mac).',
          "A site's certificate doesn't need to be known in advance — it just needs to chain, through a signature at every link, up to one of those roots.",
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="Key Management — Envelope Encryption" accent="red" glyph="🗝️">
        <GuideCode>{`DEK (Data Encryption Key)   encrypts the actual data — can be huge
KEK (Key Encryption Key)    encrypts (wraps) the DEK — stored in an
                             HSM / cloud KMS, rarely touched`}</GuideCode>
        <GuideRules items={[
          'Only the WRAPPED DEK sits next to the data.',
          'If the KEK leaks: re-wrap the small DEK with a new KEK — do NOT re-encrypt the data.',
          'Measured: wrapped-DEK size stays constant (32 bytes) whether the protected data is 40 bytes or 5 MB — rotation cost is constant, not proportional to data size.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Secure Random Number Generation" accent="blue" glyph="🎲">
        <GuideCode>{`NEVER for anything security-related:
  Math.random()        JS   — documented NOT cryptographically secure
  java.util.Random      Java — documented 48-bit LCG, predictable
                               from 2 outputs

ALWAYS instead:
  crypto.randomBytes() / crypto.randomInt()   Node — CSPRNG
  java.security.SecureRandom                  Java — CSPRNG
                          (default algorithm on this JDK: NativePRNG)`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={9} title="Password Key Derivation, In Order" accent="purple" glyph="🔑">
        <GuideTable
          head={['Choice', 'KDF', 'Why']}
          rows={[
            ['1st', 'argon2id', 'Winner of the Password Hashing Competition; memory-hard'],
            ['2nd', 'scrypt', "Memory-hard; crypto.scrypt() is Node's built-in recommendation"],
            ['3rd', 'bcrypt', 'Widely deployed, no memory-hardness tuning'],
            ['Compliance', 'PBKDF2-HMAC-SHA256, 600,000 iterations', "Only if FIPS/compliance requires it — 600,000 is OWASP's current minimum recommendation"],
          ]}
        />
        <GuideRules items={[
          "Node 24.7.0+ ships a native crypto.argon2()/argon2Sync() — confirmed present in this environment's Node v25.",
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="Node.js (node:crypto) API" accent="green" glyph="🟢" span={2}>
        <GuideCode>{`AES-256-GCM encrypt/decrypt   crypto.createCipheriv/createDecipheriv('aes-256-gcm', ...)
Hash (one-shot)                crypto.createHash('sha256').update(x).digest('hex')
Hash (streaming, large files)  createHash() piped through fs.createReadStream via pipeline()
HMAC                            crypto.createHmac('sha256', key)
Password KDF                    crypto.argon2(...)                     <- preferred, Node 24.7+
                                crypto.scrypt(password, salt, keylen)   <- fallback
Sign / verify                   crypto.sign() / crypto.verify() (with generateKeyPairSync)
Constant-time compare           crypto.timingSafeEqual(a, b)   — THROWS if lengths differ
CSPRNG                           crypto.randomBytes(n) / crypto.randomInt(min, max)`}</GuideCode>
        <GuideRules items={[
          'DEPRECATED / REMOVED (Node 22+): crypto.createCipher / createDecipher — no explicit IV, weak MD5-based key derivation. Use createCipheriv instead.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="Java (javax.crypto / java.security) API" accent="amber" glyph="☕" span={2}>
        <GuideCode>{`AES-256-GCM encrypt/decrypt   Cipher.getInstance("AES/GCM/NoPadding")  — NEVER "AES" alone
                                (Cipher.getInstance("AES") with no mode defaults to ECB)
Hash (one-shot)                MessageDigest.getInstance("SHA-256")
Hash (streaming, large files)  DigestInputStream wrapping a BufferedInputStream
Password KDF                    SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
Sign / verify                   Signature.getInstance("SHA256withECDSA" / "SHA256withRSA")
Constant-time compare           MessageDigest.isEqual(a, b)   — returns false on length
                                mismatch (Node's timingSafeEqual THROWS instead — different
                                contract, don't assume they match)
CSPRNG                           new SecureRandom()  /  SecureRandom.getInstanceStrong()`}</GuideCode>
        <GuideRules items={[
          'Cipher instances are NOT safe to share across threads without synchronization — 8 threads sharing one Cipher produced 646/1600 (~40%) corrupted results in a real test.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Common Mistakes, Reconciled" accent="pink" glyph="⚠️">
        <GuideRules items={[
          'Reusing a nonce/IV with the same key — breaks confidentiality and integrity together under GCM.',
          'AES-ECB — identical plaintext blocks leak patterns through identical ciphertext blocks.',
          'MAC-then-Encrypt instead of Encrypt-then-MAC — caused the Lucky 13 attack against CBC.',
          'Hashing a password directly with a fast general-purpose hash (SHA-256) instead of argon2id/bcrypt.',
          'Math.random() / java.util.Random anywhere security-related — neither is a CSPRNG.',
          'Cipher.getInstance("AES") with no mode specified — silently defaults to ECB.',
          'crypto.createCipher / createDecipher (Node) — deprecated/removed, weak MD5-based key derivation.',
        ]} />
      </GuidePanel>

      <GuidePanel n={13} title="Full Section Index" accent="cyan" glyph="📚" span={2}>
        <GuideCode>{`1.  Encoding vs Encryption vs Hashing        Vocabulary — read this first
2.  Encryption Fundamentals                  AES, RSA, ECC, hybrid encryption
3.  Hashing & Data Integrity                 SHA-256/SHA-3, HMAC, Merkle trees
4.  Authenticated Encryption (AEAD)          Why encryption + integrity must be one step
5.  Digital Signatures                       RSA-PSS vs ECDSA vs Ed25519
6.  Signing Files & Software                 GPG, git commit -S, Sigstore/cosign
7.  How a Certificate Is Actually Made       CSR -> CA verification -> signature = cert
8.  TLS & HTTPS                              The full 1.3 handshake, mTLS
9.  Where Keys & Certs Actually Live         OS/browser trust stores, TPM/Secure Enclave
10. Key Wrapping & Envelope Encryption       DEK/KEK, why rotation is cheap
11. Secure Random Number Generation          CSPRNG vs Math.random()/java.util.Random
12. Anatomy of a Secure Login                The full flow, DNS to session cookie
13. Applied Cryptography — Java              5 complete, verified programs
14. Applied Cryptography — Node & TypeScript 4 complete, verified programs
15. Common Cryptographic Mistakes            ECB, nonce reuse, padding oracles, timing attacks
16. This field guide                         You are here`}</GuideCode>
      </GuidePanel>
    </GuideLayout>
  );
}
