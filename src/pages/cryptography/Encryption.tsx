import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Encryption() {
  return (
    <LessonLayout
      title="Encryption Fundamentals"
      sectionId="cryptography"
      lessonIndex={1}
      prev={{ path: '/cryptography/encoding-vs-encryption', label: 'Encoding vs Encryption vs Hashing' }}
      next={{ path: '/cryptography/hashing', label: 'Hashing & Data Integrity' }}
    >
      <p>
        Phase 1 of the login flow you just saw is a single line — &quot;the browser and server establish
        an encrypted channel.&quot; Everything after it depends on that line being true, so this is where
        we start. Encryption is the primitive underneath the whole section: TLS is built from it, cookies
        and JWTs are trusted because of it, and OAuth assumes it exists.
      </p>

      <p>
        This lesson covers symmetric and asymmetric encryption, digital signatures, the hybrid approach
        that powers the modern internet, and — the one place where all of this logic runs backwards —
        password hashing.
      </p>

      <h2>Symmetric Encryption (AES-256)</h2>

      <p>
        Symmetric encryption uses <strong>one key</strong> to both encrypt and decrypt data. Think of it
        like a lockbox with a single key — whoever has the key can lock and unlock the box. AES-256
        (Advanced Encryption Standard with 256-bit keys) is the gold standard for symmetric encryption.
      </p>

      <InfoBox variant="info" title="Why AES-256?">
        <p>
          AES is <strong>hardware accelerated</strong> on modern CPUs (via the AES-NI instruction set),
          making it incredibly fast — typically 1-10 Gbps throughput. It has been extensively analyzed by
          cryptographers worldwide since 2001 and remains unbroken. The 256-bit key space means 2^256
          possible keys, a number so large that brute-force attacks are physically impossible.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="Symmetric Encryption with AES-256-GCM (Node.js)">
{`const crypto = require('crypto');

// AES-256-GCM: Authenticated Encryption
// GCM mode provides both confidentiality AND integrity
function encrypt(plaintext, key) {
  // IV = Initialization Vector: a per-message value that makes the same
  // plaintext encrypt to a different ciphertext every time. It is NOT a
  // secret -- it ships alongside the ciphertext -- but it must never repeat
  // for a given key. GCM wants 96 bits.
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();         // 128-bit authentication tag

  return {
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex'),
  };
}

function decrypt(encryptedData, key) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(encryptedData.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');         // Throws if tampered!

  return decrypted;
}

// Generate a random 256-bit key
const key = crypto.randomBytes(32);
const result = encrypt('Secret message', key);
console.log(decrypt(result, key)); // 'Secret message'`}
      </CodeBlock>

      <CodeBlock language="java" title="Symmetric Encryption with AES-256-GCM (Java)">
{`import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.security.SecureRandom;
import java.util.Base64;

public class AesGcmEncryption {
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    public static byte[] encrypt(byte[] plaintext, SecretKey key) throws Exception {
        byte[] iv = new byte[GCM_IV_LENGTH];
        new SecureRandom().nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

        byte[] ciphertext = cipher.doFinal(plaintext);

        // Prepend IV to ciphertext for transmission
        byte[] result = new byte[iv.length + ciphertext.length];
        System.arraycopy(iv, 0, result, 0, iv.length);
        System.arraycopy(ciphertext, 0, result, iv.length, ciphertext.length);
        return result;
    }

    public static byte[] decrypt(byte[] encrypted, SecretKey key) throws Exception {
        byte[] iv = new byte[GCM_IV_LENGTH];
        System.arraycopy(encrypted, 0, iv, 0, iv.length);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

        return cipher.doFinal(encrypted, GCM_IV_LENGTH, encrypted.length - GCM_IV_LENGTH);
    }

    public static void main(String[] args) throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256);
        SecretKey key = keyGen.generateKey();

        byte[] encrypted = encrypt("Secret message".getBytes(), key);
        byte[] decrypted = decrypt(encrypted, key);
        System.out.println(new String(decrypted)); // "Secret message"
    }
}`}
      </CodeBlock>

      <h3>AES Modes: GCM vs CBC</h3>

      <InfoBox variant="tip" title="GCM vs CBC — Which Mode?">
        <p>
          <strong>GCM (Galois/Counter Mode)</strong> — The modern choice. Provides <em>authenticated encryption</em>,
          meaning it ensures both confidentiality and integrity. If anyone tampers with the ciphertext, decryption
          fails. Used in TLS 1.3.
        </p>
        <p>
          <strong>CBC (Cipher Block Chaining)</strong> — The older mode. Provides confidentiality only. You need
          a separate HMAC for integrity checking. Vulnerable to padding oracle attacks if not implemented carefully.
          Still found in legacy systems.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="The Key Distribution Problem">
        <p>
          The fundamental challenge with symmetric encryption: <strong>how do you securely share the key?</strong> If
          you send it over the network, an attacker can intercept it. If you share it in person, it does not scale.
          This is exactly why asymmetric encryption exists — it solves the key distribution problem.
        </p>
      </InfoBox>

      <h2>Asymmetric Encryption (RSA, ECDH, ECDSA)</h2>

      <p>
        Asymmetric encryption uses <strong>two mathematically linked keys</strong>: a public key and a private key.
        Data encrypted with the public key can only be decrypted with the private key, and vice versa. This solves
        the key distribution problem — you can freely share your public key with the world.
      </p>

      <FlowChart
        title="Symmetric vs Asymmetric Encryption"
        chart={"graph LR\n  subgraph Symmetric\n    A[\"Plaintext\"] -->|\"Encrypt with Key K\"| B[\"Ciphertext\"]\n    B -->|\"Decrypt with Key K\"| C[\"Plaintext\"]\n  end\n  subgraph Asymmetric\n    D[\"Plaintext\"] -->|\"Encrypt with Public Key\"| E[\"Ciphertext\"]\n    E -->|\"Decrypt with Private Key\"| F[\"Plaintext\"]\n  end\n  style A fill:#1a3329,stroke:#4ade80\n  style C fill:#1a3329,stroke:#4ade80\n  style D fill:#1a2744,stroke:#5b9cf6\n  style F fill:#1a2744,stroke:#5b9cf6"}
      />

      <h3>The Locksmith Analogy</h3>

      <InfoBox variant="note" title="Think of It Like This">
        <p>
          Imagine you are a locksmith. You create a special padlock and keep the only key. You make <strong>thousands
          of copies of the padlock</strong> (public key) and hand them out to everyone. Anyone can use your padlock to
          lock a box (encrypt a message), but only you can open it with your private key. You never share the key — only
          the padlock.
        </p>
      </InfoBox>

      <h3>RSA (Rivest-Shamir-Adleman)</h3>

      <p>
        RSA is the most well-known asymmetric algorithm. It is based on the mathematical difficulty of factoring
        the product of two large prime numbers. RSA-2048 uses 2048-bit keys and is approximately <strong>1000x
        slower</strong> than AES for bulk encryption. This is why RSA is never used for encrypting large amounts
        of data — only for key exchange and digital signatures.
      </p>

      <h3>Elliptic Curve Cryptography (ECC)</h3>

      <p>
        Modern systems prefer elliptic curve algorithms over RSA because they provide <strong>equivalent security
        with much smaller keys</strong>. A 256-bit ECC key provides roughly the same security as a 3072-bit RSA
        key, making operations much faster and bandwidth-efficient.
      </p>

      <ul>
        <li><strong>ECDH (Elliptic Curve Diffie-Hellman)</strong> — Key exchange protocol. Both parties can independently compute the same shared secret. Used in TLS 1.3 for establishing session keys.</li>
        <li><strong>ECDSA (Elliptic Curve Digital Signature Algorithm)</strong> — Digital signature algorithm. Used for signing certificates, JWTs, and software packages.</li>
      </ul>

      <CodeBlock language="javascript" title="ECDH Key Exchange (Node.js)">
{`const crypto = require('crypto');

// Alice generates her key pair
const alice = crypto.createECDH('prime256v1');
alice.generateKeys();

// Bob generates his key pair
const bob = crypto.createECDH('prime256v1');
bob.generateKeys();

// They exchange public keys (safe to send over insecure channel)
const alicePublicKey = alice.getPublicKey();
const bobPublicKey = bob.getPublicKey();

// Both independently compute the SAME shared secret
const aliceSecret = alice.computeSecret(bobPublicKey);
const bobSecret = bob.computeSecret(alicePublicKey);

console.log(aliceSecret.equals(bobSecret)); // true!
// Neither Alice nor Bob ever transmitted the shared secret`}
      </CodeBlock>

      <h3>Algorithm Comparison</h3>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Algorithm</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Type</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Speed</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>AES-256</td>
            <td style={{ padding: '0.75rem' }}>Symmetric</td>
            <td style={{ padding: '0.75rem' }}>Very Fast</td>
            <td style={{ padding: '0.75rem' }}>Bulk data encryption</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>RSA-2048</td>
            <td style={{ padding: '0.75rem' }}>Asymmetric</td>
            <td style={{ padding: '0.75rem' }}>1000x slower</td>
            <td style={{ padding: '0.75rem' }}>Legacy key exchange</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>ECDH-256</td>
            <td style={{ padding: '0.75rem' }}>Asymmetric</td>
            <td style={{ padding: '0.75rem' }}>Fast</td>
            <td style={{ padding: '0.75rem' }}>Key exchange (TLS 1.3)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>ECDSA-256</td>
            <td style={{ padding: '0.75rem' }}>Asymmetric</td>
            <td style={{ padding: '0.75rem' }}>Fast</td>
            <td style={{ padding: '0.75rem' }}>Digital signatures</td>
          </tr>
        </tbody>
      </table>

      <h2>Digital Signatures</h2>

      <p>
        Digital signatures prove <strong>authenticity</strong> and <strong>integrity</strong>. They answer two
        questions: "Who sent this?" and "Was it tampered with?" The process is the reverse of encryption — the
        sender signs with their <em>private</em> key, and anyone can verify with the <em>public</em> key.
      </p>

      <FlowChart
        title="Digital Signature Flow"
        chart={"graph TD\n  A[\"Original Message\"] --> B[\"Hash with SHA-256\"]\n  B --> C[\"Message Digest\"]\n  C --> D[\"Sign with Private Key\"]\n  D --> E[\"Digital Signature\"]\n  E --> F[\"Send Message + Signature\"]\n  F --> G[\"Receiver: Hash Message\"]\n  G --> H[\"Verify Signature with Public Key\"]\n  H --> I{\"Match?\"}\n  I -->|\"Yes\"| J[\"Authentic & Unmodified\"]\n  I -->|\"No\"| K[\"Tampered or Forged!\"]\n  style A fill:#1a3329,stroke:#4ade80\n  style J fill:#1a3329,stroke:#4ade80\n  style K fill:#3b1a1a,stroke:#dc2626"}
      />

      <CodeBlock language="javascript" title="Digital Signatures with ECDSA (Node.js)">
{`const crypto = require('crypto');

// Generate key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Sign a message
const message = 'Transfer $1000 to Alice';
const sign = crypto.createSign('SHA256');
sign.update(message);
const signature = sign.sign(privateKey, 'hex');

// Verify the signature (anyone with the public key can do this)
const verify = crypto.createVerify('SHA256');
verify.update(message);
const isValid = verify.verify(publicKey, signature, 'hex');
console.log('Valid signature:', isValid); // true

// Try verifying a tampered message
const verifyTampered = crypto.createVerify('SHA256');
verifyTampered.update('Transfer $10000 to Alice');
const isTampered = verifyTampered.verify(publicKey, signature, 'hex');
console.log('Tampered message valid:', isTampered); // false!`}
      </CodeBlock>

      <h2>The Hybrid Approach: Why TLS Uses Both</h2>

      <p>
        Here is the key insight: <strong>TLS combines asymmetric and symmetric encryption</strong> to get the best
        of both worlds. Asymmetric encryption (ECDH) is used once at the start to securely exchange a shared
        secret. That shared secret is then used to derive symmetric keys (AES-256-GCM) for encrypting all
        subsequent data. This is the hybrid approach.
      </p>

      <FlowChart
        title="Hybrid Encryption (How TLS Works)"
        chart={"graph TD\n  A[\"Client & Server\"] --> B[\"ECDH Key Exchange\"]\n  B --> C[\"Shared Secret Established\"]\n  C --> D[\"Derive AES-256 Session Keys\"]\n  D --> E[\"All Data Encrypted with AES-256-GCM\"]\n  B -.->|\"Asymmetric: Slow but solves key distribution\"| C\n  D -.->|\"Symmetric: Fast for bulk data\"| E\n  style A fill:#1a2744,stroke:#5b9cf6\n  style C fill:#2a1f44,stroke:#a78bfa\n  style E fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="success" title="Best of Both Worlds">
        <p>
          The hybrid approach elegantly solves both problems: asymmetric encryption handles the
          <strong> key distribution problem</strong> (no need to pre-share secrets), while symmetric encryption
          handles the <strong>performance problem</strong> (fast bulk encryption for all data). This is why every
          HTTPS connection on the internet uses this exact pattern.
        </p>
      </InfoBox>

      <h2>Password Hashing — Deliberately Slow Is the Point</h2>

      <p>
        Everything above is designed to be <em>fast</em>. Password storage is
        the one place where that instinct is exactly backwards, and it is the
        most common crypto mistake in real codebases.
      </p>

      <InfoBox variant="danger" title="Passwords Are Not Encrypted — They Are Hashed">
        <p>
          Encryption is reversible by design; if you can decrypt a password,
          so can whoever steals your database and your key. Passwords must be
          run through a <strong>one-way password hashing function</strong>{' '}
          instead, so that verification means re-hashing the input and
          comparing, never recovering the original.
        </p>
        <p>
          And not just any hash. <strong>MD5, SHA-1, SHA-256, and SHA-512 are
          all wrong for passwords</strong> — not because they are broken as
          hashes (SHA-256 is fine), but because they are{' '}
          <em>fast</em>. A modern GPU computes billions of SHA-256 hashes per
          second, so a stolen table of SHA-256 password hashes is cracked at
          enormous speed. Password hashing functions are deliberately
          engineered to be slow and memory-hungry to destroy that economics.
        </p>
      </InfoBox>

      <h3>Choosing an Algorithm</h3>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Algorithm</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Verdict</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Argon2id</strong></td>
            <td style={{ padding: '0.75rem', color: 'var(--accent-green, #4ade80)' }}>First choice</td>
            <td style={{ padding: '0.75rem' }}>Winner of the Password Hashing Competition; OWASP&apos;s current top recommendation. Memory-hard, so GPU/ASIC attacks lose their advantage. The <code>id</code> variant resists both side-channel and GPU attacks.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>scrypt</strong></td>
            <td style={{ padding: '0.75rem', color: 'var(--accent-green, #4ade80)' }}>Good</td>
            <td style={{ padding: '0.75rem' }}>Also memory-hard. A reasonable choice when Argon2 is unavailable.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>bcrypt</strong></td>
            <td style={{ padding: '0.75rem' }}>Acceptable</td>
            <td style={{ padding: '0.75rem' }}>Battle-tested and still perfectly usable — the pragmatic default in the Java/Spring world. Two caveats: it is CPU-hard but not memory-hard, and it <strong>silently truncates input at 72 bytes</strong>.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>PBKDF2</strong></td>
            <td style={{ padding: '0.75rem' }}>Legacy / compliance</td>
            <td style={{ padding: '0.75rem' }}>Use when FIPS certification requires it. Weakest of the four against GPUs — needs a very high iteration count.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>SHA-256 / MD5 / SHA-1</strong></td>
            <td style={{ padding: '0.75rem', color: 'var(--accent-red-deep)' }}>Never</td>
            <td style={{ padding: '0.75rem' }}>Far too fast. Salting helps against rainbow tables but does nothing against a GPU brute-forcing each hash individually.</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="javascript" title="Password Hashing with Argon2id (Node.js)">
{`const argon2 = require('argon2');

// Register — hash the password before storing it.
// The salt is generated automatically and embedded in the output,
// so you do NOT need a separate salt column.
async function hashPassword(plaintext) {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 19456,  // 19 MiB — OWASP baseline
    timeCost: 2,        // iterations
    parallelism: 1,
  });
}

// Login — re-hash the candidate and compare in constant time.
// argon2.verify() reads the parameters back out of the stored hash,
// so old hashes keep verifying after you raise the cost settings.
async function checkPassword(plaintext, storedHash) {
  return argon2.verify(storedHash, plaintext);
}

// Stored value encodes algorithm, parameters, salt, and hash:
// $argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObG`}
      </CodeBlock>

      <InfoBox variant="warning" title="Three Mistakes That Survive Code Review">
        <p>
          <strong>1. Comparing hashes with <code>==</code>.</strong> A normal
          string comparison returns early on the first differing byte, leaking
          timing information. Always use the library&apos;s{' '}
          <code>verify()</code>, or a constant-time comparison like Node&apos;s{' '}
          <code>crypto.timingSafeEqual()</code>.
        </p>
        <p>
          <strong>2. Rolling your own salt.</strong> Every algorithm above
          generates a cryptographically random salt per password and embeds it
          in the output string. A hand-rolled salt column is a chance to get it
          wrong — and reusing one salt across all users defeats its purpose
          entirely.
        </p>
        <p>
          <strong>3. Not capping the input length.</strong> Because these
          functions are intentionally expensive, accepting a 10 MB
          &quot;password&quot; hands an attacker a cheap CPU-exhaustion DoS.
          Reject anything over ~128 characters before hashing.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="Upgrading Cost Factors Over Time">
        <p>
          Cost parameters must rise as hardware improves, but you cannot re-hash
          passwords you do not have in plaintext. The standard approach is to
          upgrade opportunistically: on each successful login, check whether the
          stored hash used outdated parameters and, if so, re-hash the
          plaintext you just verified and overwrite the stored value.
        </p>
        <p>
          Spring Security automates exactly this with{' '}
          <code>DelegatingPasswordEncoder</code>, which prefixes stored hashes
          with an algorithm tag (<code>{'{bcrypt}'}</code>,{' '}
          <code>{'{argon2}'}</code>) so several algorithms can coexist during a
          migration — see the <strong>Spring Boot → Security</strong> lesson for
          the framework-specific setup.
        </p>
      </InfoBox>

      <h2>Quantum Computing and Cryptography</h2>

      <InfoBox variant="danger" title="The Quantum Threat">
        <p>
          Quantum computers running <strong>Shor&#39;s algorithm</strong> can break both RSA and ECC by efficiently
          solving the mathematical problems they rely on (integer factorization and discrete logarithm). A
          sufficiently powerful quantum computer could break RSA-2048 and ECDH-256 in hours.
        </p>
        <p>
          <strong>AES-256 is safe</strong> — quantum computers only halve its effective security (to 128-bit via
          Grover&#39;s algorithm), which is still impractical to brute-force.
        </p>
        <p>
          <strong>Post-quantum cryptography is no longer a future item.</strong> NIST finished the
          standardisation process in August 2024, publishing <strong>FIPS 203 (ML-KEM</strong>, the
          standardised form of CRYSTALS-Kyber, for key encapsulation), <strong>FIPS 204 (ML-DSA</strong>,
          from CRYSTALS-Dilithium, for signatures) and <strong>FIPS 205 (SLH-DSA</strong>, from
          SPHINCS+, a hash-based signature backup). Say &quot;ML-KEM&quot; rather than
          &quot;Kyber&quot; if you want to sound current.
        </p>
        <p>
          It has also shipped. Hybrid post-quantum key exchange —{' '}
          <code>X25519MLKEM768</code>, which combines classical X25519 with ML-KEM so the connection is
          safe if <em>either</em> holds — is enabled by default in Chrome and Firefox and supported
          across Cloudflare and AWS. A large fraction of TLS 1.3 traffic is already post-quantum
          protected today.
        </p>
        <p>
          <strong>And there are now dates attached.</strong> NIST IR 8547 sets the migration
          schedule: RSA-2048 and ECC P-256 become <em>deprecated</em> in 2030 and{' '}
          <em>disallowed</em> in 2035. In the US that stopped being advisory in June 2026, when
          EO 14412 and OMB M-26-15 turned it into a federal compliance deadline. NIST also selected{' '}
          <strong>HQC</strong> in March 2025 as a non-lattice backup KEM — insurance in case a
          structural break is found in the lattice assumptions ML-KEM rests on — with a draft
          standard in 2026 and finalisation expected 2027. FN-DSA (FIPS 206) is still draft.
          If you are planning work, 2030 is the number to plan against.
        </p>
        <p>
          <strong>Why the hurry, given no quantum computer can do this yet?</strong> Because of{' '}
          <em>harvest now, decrypt later</em>: an adversary records encrypted traffic today and decrypts
          it once the hardware exists. Any secret that must stay secret for a decade is already at risk,
          which is why key exchange was migrated first. <strong>Signatures</strong> are less urgent — a
          signature only needs to resist forgery at the moment it is verified — which is why certificates
          are still ECDSA/RSA while key exchange has already moved.
        </p>
      </InfoBox>

      <h2>Key Takeaways</h2>

      <InfoBox variant="tip" title="Remember These Core Concepts">
        <p><strong>Symmetric (AES)</strong>: One key, fast, for bulk data. Problem: key distribution.</p>
        <p><strong>Asymmetric (RSA/ECC)</strong>: Two keys, slower, solves key distribution. Used for key exchange and signatures.</p>
        <p><strong>Digital Signatures</strong>: Hash + sign with private key. Proves authenticity and integrity.</p>
        <p><strong>Hybrid (TLS)</strong>: Asymmetric for key exchange, symmetric for data. Best of both worlds.</p>
        <p><strong>Password Hashing</strong>: The exception to everything above — deliberately slow. Argon2id first, bcrypt acceptable. Never a plain SHA.</p>
        <p><strong>Quantum</strong>: Breaks RSA/ECC. AES-256 survives. Post-quantum standards are final (ML-KEM/ML-DSA) and hybrid key exchange is already deployed.</p>
      </InfoBox>

      <p>
        You now have the pieces but not the protocol. Knowing that ECDH can produce a shared secret does
        not tell you how a browser and a server you have never spoken to before agree on one, or how the
        browser knows it is talking to the real <code>bank.com</code> rather than an impostor performing
        a perfectly valid key exchange. That is exactly what the next lesson assembles: TLS is the hybrid
        approach above, plus an identity check, turned into a real handshake.
      </p>

    </LessonLayout>
  );
}
