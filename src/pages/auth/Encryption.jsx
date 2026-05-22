import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Encryption() {
  return (
    <LessonLayout
      title="Encryption Fundamentals"
      sectionId="auth"
      lessonIndex={0}
      prev={null}
      next={{ path: '/auth/tls', label: 'TLS & HTTPS' }}
    >
      <p>
        Encryption is the foundation of everything in security. Before you can understand TLS, JWTs,
        OAuth, or any authentication system, you need to understand how data is protected. This lesson
        covers symmetric and asymmetric encryption, digital signatures, and how they all come together
        in the hybrid approach that powers the modern internet.
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
  const iv = crypto.randomBytes(12);           // 96-bit IV for GCM
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
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Algorithm</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Type</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Speed</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fbbf24' }}>Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>AES-256</td>
            <td style={{ padding: '0.75rem' }}>Symmetric</td>
            <td style={{ padding: '0.75rem' }}>Very Fast</td>
            <td style={{ padding: '0.75rem' }}>Bulk data encryption</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>RSA-2048</td>
            <td style={{ padding: '0.75rem' }}>Asymmetric</td>
            <td style={{ padding: '0.75rem' }}>1000x slower</td>
            <td style={{ padding: '0.75rem' }}>Legacy key exchange</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
            <td style={{ padding: '0.75rem' }}>ECDH-256</td>
            <td style={{ padding: '0.75rem' }}>Asymmetric</td>
            <td style={{ padding: '0.75rem' }}>Fast</td>
            <td style={{ padding: '0.75rem' }}>Key exchange (TLS 1.3)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #2a2e42' }}>
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
          <strong>Post-quantum cryptography</strong> is being standardized by NIST. Algorithms like CRYSTALS-Kyber
          (key exchange) and CRYSTALS-Dilithium (signatures) are designed to resist quantum attacks. Google and
          Cloudflare are already experimenting with hybrid post-quantum TLS.
        </p>
      </InfoBox>

      <h2>Key Takeaways</h2>

      <InfoBox variant="tip" title="Remember These Core Concepts">
        <p><strong>Symmetric (AES)</strong>: One key, fast, for bulk data. Problem: key distribution.</p>
        <p><strong>Asymmetric (RSA/ECC)</strong>: Two keys, slower, solves key distribution. Used for key exchange and signatures.</p>
        <p><strong>Digital Signatures</strong>: Hash + sign with private key. Proves authenticity and integrity.</p>
        <p><strong>Hybrid (TLS)</strong>: Asymmetric for key exchange, symmetric for data. Best of both worlds.</p>
        <p><strong>Quantum</strong>: Breaks RSA/ECC. AES-256 survives. Post-quantum standards coming.</p>
      </InfoBox>

      <InteractiveChallenge
        question={"Why does TLS use a hybrid approach (asymmetric + symmetric encryption) rather than just asymmetric encryption for everything?"}
        options={[
          "Asymmetric encryption is not secure enough for bulk data",
          "Asymmetric encryption is approximately 1000x slower than symmetric encryption, making it impractical for bulk data transfer",
          "Symmetric encryption provides better key distribution",
          "Asymmetric encryption cannot encrypt data larger than its key size"
        ]}
        correctIndex={1}
        explanation={"RSA-2048 is roughly 1000x slower than AES-256. Using asymmetric encryption for all data would make HTTPS connections unbearably slow. The hybrid approach uses slow asymmetric (ECDH) just once to exchange a shared secret, then fast symmetric (AES-256-GCM) for all data. This gives you the security of asymmetric key exchange with the speed of symmetric bulk encryption."}
      />

      <InteractiveChallenge
        question={"What is the fundamental problem with symmetric encryption that asymmetric encryption solves?"}
        options={[
          "Symmetric encryption is too slow for modern hardware",
          "Symmetric encryption cannot handle large files",
          "Both parties must share the same secret key, but transmitting it securely is difficult",
          "Symmetric encryption does not provide any authentication"
        ]}
        correctIndex={2}
        explanation={"The key distribution problem is the core limitation of symmetric encryption. If Alice wants to send Bob an encrypted message, they both need the same key. But how does Alice get the key to Bob securely? If she sends it over the network, an eavesdropper can intercept it. Asymmetric encryption (like ECDH) solves this by allowing both parties to independently compute a shared secret without ever transmitting it."}
      />
    </LessonLayout>
  );
}
