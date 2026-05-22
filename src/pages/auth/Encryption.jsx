import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function AuthEncryption() {
  return (
    <LessonLayout
      title="Encryption Basics"
      sectionId="auth"
      lessonIndex={0}
      prev={{ path: "/apidesign/advanced", label: "Advanced API Design" }}
      next={{ path: "/auth/tls", label: "TLS and HTTPS" }}
    >
      <p>Encryption is the process of transforming readable data (plaintext) into an unreadable form (ciphertext) using a key. There are two main types: symmetric (same key encrypts and decrypts) and asymmetric (public key encrypts, private key decrypts).</p>

      <h2>Symmetric vs Asymmetric</h2>

      <FlowChart
        title="Encryption Types"
        chart={"graph TD\n  A[Encryption] --> B[Symmetric]\n  A --> C[Asymmetric]\n  B --> D[AES-256]\n  B --> E[Same key both ways]\n  B --> F[Fast - bulk data]\n  C --> G[RSA / ECC]\n  C --> H[Public key encrypts]\n  C --> I[Private key decrypts]\n  C --> J[Key exchange / signatures]"}
      />

      <CodeBlock language="java" title="AES Encryption in Java">
{`import javax.crypto.*;
import javax.crypto.spec.*;
import java.security.*;
import java.util.Base64;

public class AesEncryption {
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;   // 96 bits
    private static final int GCM_TAG_LENGTH = 128; // 128 bits

    // Generate a secure random key
    public static SecretKey generateKey() throws Exception {
        KeyGenerator keygen = KeyGenerator.getInstance("AES");
        keygen.init(256, new SecureRandom());
        return keygen.generateKey();
    }

    public static String encrypt(String plaintext, SecretKey key) throws Exception {
        byte[] iv = new byte[GCM_IV_LENGTH];
        new SecureRandom().nextBytes(iv);  // fresh IV for every encryption!

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

        byte[] ciphertext = cipher.doFinal(plaintext.getBytes("UTF-8"));

        // Prepend IV to ciphertext (IV is not secret, needed for decryption)
        byte[] result = new byte[iv.length + ciphertext.length];
        System.arraycopy(iv, 0, result, 0, iv.length);
        System.arraycopy(ciphertext, 0, result, iv.length, ciphertext.length);
        return Base64.getEncoder().encodeToString(result);
    }

    public static String decrypt(String encoded, SecretKey key) throws Exception {
        byte[] decoded = Base64.getDecoder().decode(encoded);

        // Extract IV (first 12 bytes) and ciphertext (rest)
        byte[] iv         = new byte[GCM_IV_LENGTH];
        byte[] ciphertext = new byte[decoded.length - GCM_IV_LENGTH];
        System.arraycopy(decoded, 0, iv, 0, iv.length);
        System.arraycopy(decoded, iv.length, ciphertext, 0, ciphertext.length);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        return new String(cipher.doFinal(ciphertext), "UTF-8");
    }
}`}
      </CodeBlock>

      <h2>Hashing Passwords</h2>

      <CodeBlock language="java" title="Password Hashing with BCrypt">
{`// NEVER encrypt passwords — HASH them (one-way, no decryption)
// BCrypt automatically handles salting and work factor

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordService {
    // Cost factor 12: ~250ms per hash (intentionally slow to resist brute force)
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    public String hashPassword(String rawPassword) {
        // Output includes: algorithm + cost + salt + hash
        // e.g. $2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
        return encoder.encode(rawPassword);
    }

    public boolean verifyPassword(String rawPassword, String storedHash) {
        return encoder.matches(rawPassword, storedHash);
    }
}

// Usage
String hash = passwordService.hashPassword("mySecret123");
boolean valid = passwordService.verifyPassword("mySecret123", hash); // true
boolean wrong = passwordService.verifyPassword("wrongPassword", hash); // false

// Why not MD5/SHA-256 for passwords?
// MD5/SHA are FAST (millions/sec with GPU) — great for attackers
// BCrypt is SLOW by design (hundreds/sec) — brute force impractical`}
      </CodeBlock>

      <InfoBox variant="warning" title="Cryptography Rules">
        <p>Never roll your own crypto. Use established libraries (Bouncy Castle, Java Cryptography Extension). Always use AES-256 with GCM mode (authenticated encryption). Use a fresh random IV for every encryption. Use BCrypt/Argon2 for passwords, never MD5/SHA for passwords. Never store plaintext secrets.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Why should you use BCrypt instead of SHA-256 for storing passwords?"
        options={["BCrypt produces longer hashes", "BCrypt is intentionally slow and includes salting, making brute-force attacks impractical", "BCrypt is reversible so you can recover passwords", "SHA-256 is deprecated"]}
        correctIndex={1}
        explanation="BCrypt is designed to be slow (configurable work factor) and automatically generates a unique salt per password. SHA-256 is extremely fast — an attacker with a GPU can test billions of SHA-256 hashes per second. BCrypt limits this to hundreds per second, making dictionary attacks impractical."
      />

    </LessonLayout>
  );
}
