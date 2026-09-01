import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function CryptoAppliedJava() {
  return (
    <LessonLayout
      title="Applied Cryptography — Java"
      sectionId="cryptography"
      lessonIndex={12}
      prev={{ path: '/cryptography/secure-login-flow', label: 'Anatomy of a Secure Login' }}
      next={{ path: '/cryptography/applied-node', label: 'Applied Cryptography — Node & TypeScript' }}
    >
      <p>
        Every lesson so far in this section has shown a fragment — a key generation call, a signing
        snippet, an isolated <code>Cipher</code> block. This lesson is different: five complete, runnable
        Java programs, each one a full program with a <code>main</code> method, compiled with{' '}
        <code>javac</code> and executed with <code>java</code> on a real JDK, with the real console output
        pasted underneath — not the output you&apos;d expect, the output that actually printed. Where a
        claim about the JVM&apos;s behavior could be checked instead of quoted from memory, it was checked.
        Every program uses only <code>javax.crypto</code> and <code>java.security</code> — no third-party
        crypto library, because the point of this lesson is what the JDK gives you out of the box.
      </p>

      <h2>1. Encrypting and Decrypting a File — AES-256-GCM</h2>

      <p>
        The <strong>Encryption Fundamentals</strong> lesson encrypted a string in memory. Real systems
        encrypt files — config secrets, backups, uploads at rest. The mechanics are the same as before
        (random 12-byte IV, <code>GCMParameterSpec</code> with a 128-bit tag), but now bytes come from{' '}
        <code>Files.readAllBytes</code>, the IV is prepended to the ciphertext and written to disk, and the
        decrypt routine reads that file back, splits the IV off the front, and reconstructs the original.
        The check that matters is not &quot;it ran without an exception&quot; — it&apos;s{' '}
        <code>Arrays.equals</code> against the original bytes.
      </p>

      <CodeBlock language="java" title="FileEncryptor.java — Full File Round Trip">
{`import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Arrays;

public class FileEncryptor {

    private static final int GCM_IV_LENGTH = 12;   // 96-bit IV, the size GCM is designed for
    private static final int GCM_TAG_LENGTH = 128;  // 128-bit authentication tag

    public static void encryptFile(Path in, Path out, SecretKey key) throws Exception {
        byte[] plaintext = Files.readAllBytes(in);

        byte[] iv = new byte[GCM_IV_LENGTH];
        new SecureRandom().nextBytes(iv);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] ciphertext = cipher.doFinal(plaintext);

        try (FileOutputStream fos = new FileOutputStream(out.toFile())) {
            fos.write(iv);          // first 12 bytes of the file
            fos.write(ciphertext);  // everything after that, tag included at the end
        }
    }

    public static byte[] decryptFile(Path in, SecretKey key) throws Exception {
        byte[] fileBytes = Files.readAllBytes(in);

        byte[] iv = Arrays.copyOfRange(fileBytes, 0, GCM_IV_LENGTH);
        byte[] ciphertext = Arrays.copyOfRange(fileBytes, GCM_IV_LENGTH, fileBytes.length);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        return cipher.doFinal(ciphertext);
    }

    public static void main(String[] args) throws Exception {
        Path original = Path.of("report.txt");
        Path encrypted = Path.of("report.txt.enc");
        Path decrypted = Path.of("report.decrypted.txt");

        Files.writeString(original, "Q3 numbers: revenue up 12%, churn down 2%.\\nDo not forward externally.\\n");

        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256);
        SecretKey key = keyGen.generateKey();

        encryptFile(original, encrypted, key);
        byte[] roundTrip = decryptFile(encrypted, key);
        Files.write(decrypted, roundTrip);

        byte[] originalBytes = Files.readAllBytes(original);

        System.out.println("Original size:  " + originalBytes.length + " bytes");
        System.out.println("Encrypted size: " + Files.size(encrypted) + " bytes (12-byte IV + ciphertext + 16-byte tag)");
        System.out.println("Decrypted size: " + roundTrip.length + " bytes");
        System.out.println("Bytes identical: " + Arrays.equals(originalBytes, roundTrip));
        System.out.println("Decrypted text:");
        System.out.println(new String(roundTrip));
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="$ javac FileEncryptor.java && java FileEncryptor — Actual output">
{`Original size:  70 bytes
Encrypted size: 98 bytes (12-byte IV + ciphertext + 16-byte tag)
Decrypted size: 70 bytes
Bytes identical: true
Decrypted text:
Q3 numbers: revenue up 12%, churn down 2%.
Do not forward externally.`}
      </CodeBlock>

      <p>
        The arithmetic checks out on its own: 70 bytes of plaintext plus a 12-byte IV plus a 16-byte GCM
        tag is exactly 98 bytes on disk — GCM adds no per-block padding, so ciphertext length always equals
        plaintext length. <code>Arrays.equals</code> reports <code>true</code>, meaning every one of those
        70 bytes survived the round trip unchanged, byte for byte, not just &quot;the program didn&apos;t
        throw.&quot;
      </p>

      <h2>2. Deriving a Key from a Password — PBKDF2WithHmacSHA256</h2>

      <p>
        Every program above assumed a <code>SecretKey</code> already existed, generated by{' '}
        <code>KeyGenerator</code>. In practice you often start with something a human typed, and a
        password is not a key — it&apos;s low-entropy, unevenly distributed text, and using it as raw AES
        key bytes would be a disaster. <code>PBKDF2WithHmacSHA256</code>, reached through{' '}
        <code>SecretKeyFactory</code>, stretches a password plus a random salt into a fixed-length key by
        applying HMAC-SHA256 repeatedly — the iteration count is a deliberate speed bump against brute
        force.
      </p>

      <InfoBox variant="info" title="Why 600,000 Iterations">
        <p>
          The number is not arbitrary. OWASP&apos;s Password Storage Cheat Sheet lists its current
          recommendation as <strong>PBKDF2-HMAC-SHA256: 600,000 iterations</strong> — confirmed directly
          from the cheat sheet itself while writing this lesson, not recalled from memory. That figure
          replaced an older 310,000 recommendation as hardware got faster; PBKDF2 has no memory-hardness
          (unlike Argon2id or scrypt), so its only real defense against GPU/ASIC cracking is raising the
          iteration count, and 600,000 is the number OWASP currently considers defensible for that role.
          On this machine, deriving one key at that setting took <strong>~110 ms</strong> — noticeable on a
          login form, appropriate for a value you intend to keep secret for a long time.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="PasswordBasedEncryption.java — PBKDF2 Key Derivation, Full Round Trip">
{`import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

public class PasswordBasedEncryption {

    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final int SALT_LENGTH = 16;

    // OWASP Password Storage Cheat Sheet (current revision) recommends 600,000
    // iterations for PBKDF2-HMAC-SHA256. We're deriving an AES key here rather
    // than storing a password verifier, but the same brute-force economics
    // apply, so the same floor is the defensible choice.
    private static final int PBKDF2_ITERATIONS = 600_000;
    private static final int KEY_LENGTH_BITS = 256;

    public static SecretKey deriveKey(char[] password, byte[] salt) throws Exception {
        PBEKeySpec spec = new PBEKeySpec(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH_BITS);
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        byte[] keyBytes = factory.generateSecret(spec).getEncoded();
        spec.clearPassword(); // zero the char[] copy PBEKeySpec made internally
        return new SecretKeySpec(keyBytes, "AES");
    }

    public static void main(String[] args) throws Exception {
        char[] password = "correct horse battery staple".toCharArray();

        byte[] salt = new byte[SALT_LENGTH];
        new SecureRandom().nextBytes(salt);

        long start = System.nanoTime();
        SecretKey key = deriveKey(password, salt);
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;

        System.out.println("Salt (base64): " + Base64.getEncoder().encodeToString(salt));
        System.out.println("Iterations: " + PBKDF2_ITERATIONS);
        System.out.println("Derivation time: " + elapsedMs + " ms");

        // Full round trip: encrypt with the derived key
        byte[] plaintext = "wire transfer approved: $4,200 to acct #88213".getBytes();

        byte[] iv = new byte[GCM_IV_LENGTH];
        new SecureRandom().nextBytes(iv);
        Cipher encryptCipher = Cipher.getInstance("AES/GCM/NoPadding");
        encryptCipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] ciphertext = encryptCipher.doFinal(plaintext);

        System.out.println("Ciphertext (base64): " + Base64.getEncoder().encodeToString(ciphertext));

        // Decrypt: re-derive the SAME key from the password + stored salt
        SecretKey rederived = deriveKey(password, salt);
        Cipher decryptCipher = Cipher.getInstance("AES/GCM/NoPadding");
        decryptCipher.init(Cipher.DECRYPT_MODE, rederived, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] decrypted = decryptCipher.doFinal(ciphertext);

        System.out.println("Decrypted: " + new String(decrypted));
        System.out.println("Round trip matches: " + Arrays.equals(plaintext, decrypted));

        // Prove the wrong password produces a different key and fails to decrypt
        SecretKey wrongKey = deriveKey("wrong password entirely".toCharArray(), salt);
        Cipher wrongCipher = Cipher.getInstance("AES/GCM/NoPadding");
        wrongCipher.init(Cipher.DECRYPT_MODE, wrongKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        try {
            wrongCipher.doFinal(ciphertext);
            System.out.println("Wrong password decrypted successfully -- THIS SHOULD NOT HAPPEN");
        } catch (Exception e) {
            System.out.println("Wrong password failed as expected: " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="$ javac PasswordBasedEncryption.java && java PasswordBasedEncryption — Actual output">
{`Salt (base64): blaBlQjwV2MUfELIWmydhA==
Iterations: 600000
Derivation time: 111 ms
Ciphertext (base64): W0lNoAd+4XlMbQndlabhBaRjKf0Ic3s2eHdvenu9Wr13znySLMlgnbW9DclZ+Z1TutgE5EbB8A5vULY6gQ==
Decrypted: wire transfer approved: $4,200 to acct #88213
Round trip matches: true
Wrong password failed as expected: AEADBadTagException: Tag mismatch`}
      </CodeBlock>

      <p>
        The salt and ciphertext will look different every time you run this — both are freshly randomized
        each run, which is exactly what should happen. What&apos;s deterministic and worth checking is the
        shape of the result: the correct password re-derives the identical key from the stored salt and
        decrypts cleanly, while a wrong password derives a <em>different</em> key and GCM&apos;s
        authentication tag catches it immediately — <code>AEADBadTagException: Tag mismatch</code>, not
        silently wrong plaintext. That failure mode is GCM doing its job: it refuses to hand back data it
        cannot authenticate.
      </p>

      <h2>3. Signing and Verifying a Document — RSA / SHA256withRSA</h2>

      <p>
        Encryption keeps a document confidential; it says nothing about who wrote it or whether it was
        altered afterward. A digital signature answers that question, and the acid test for a signature
        implementation isn&apos;t &quot;does verify() return true on the original&quot; — it&apos;s{' '}
        &quot;does verify() return false the instant one byte changes.&quot; The program below generates a
        2048-bit RSA key pair, signs a contract with <code>SHA256withRSA</code>, verifies it, then actually
        edits the file — changing the unit price — and runs verification again against the tampered bytes.
      </p>

      <CodeBlock language="java" title="DocumentSigning.java — Sign, Verify, Then Verify Against a Tampered Document">
{`import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.util.Base64;

public class DocumentSigning {

    public static byte[] sign(byte[] data, PrivateKey privateKey) throws Exception {
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(data);
        return signature.sign();
    }

    public static boolean verify(byte[] data, byte[] signatureBytes, PublicKey publicKey) throws Exception {
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initVerify(publicKey);
        signature.update(data);
        return signature.verify(signatureBytes);
    }

    public static void main(String[] args) throws Exception {
        Path contract = Path.of("contract.txt");
        Files.writeString(contract, "Vendor agrees to deliver 500 units at $12.00/unit, net 30 terms.\\n");

        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(2048);
        KeyPair keyPair = keyGen.generateKeyPair();

        byte[] original = Files.readAllBytes(contract);
        byte[] signatureBytes = sign(original, keyPair.getPrivate());

        System.out.println("Signature (base64, first 60 chars): "
                + Base64.getEncoder().encodeToString(signatureBytes).substring(0, 60) + "...");
        System.out.println("Signature length: " + signatureBytes.length + " bytes");

        boolean validOnOriginal = verify(original, signatureBytes, keyPair.getPublic());
        System.out.println("Verify against original document: " + validOnOriginal);

        // Actually tamper with the document -- change the price
        String tamperedText = Files.readString(contract).replace("$12.00/unit", "$120.00/unit");
        Files.writeString(contract, tamperedText);
        byte[] tamperedBytes = Files.readAllBytes(contract);

        System.out.println("Original bytes:  " + new String(original).trim());
        System.out.println("Tampered bytes:  " + new String(tamperedBytes).trim());

        boolean validOnTampered = verify(tamperedBytes, signatureBytes, keyPair.getPublic());
        System.out.println("Verify against tampered document: " + validOnTampered);
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="$ javac DocumentSigning.java && java DocumentSigning — Actual output">
{`Signature (base64, first 60 chars): WAgzRrDMMppvis3xAFPO4+UX+fuyCo0owRdLVvuqwHwtIzZetzsnr7AzY3Il...
Signature length: 256 bytes
Verify against original document: true
Original bytes:  Vendor agrees to deliver 500 units at $12.00/unit, net 30 terms.
Tampered bytes:  Vendor agrees to deliver 500 units at $120.00/unit, net 30 terms.
Verify against tampered document: false`}
      </CodeBlock>

      <p>
        256 bytes is exactly what a 2048-bit RSA signature should be — 2048 ÷ 8. Verification against the
        original returns <code>true</code>; after changing <code>$12.00</code> to <code>$120.00</code> in
        the actual file on disk and re-verifying the same signature against those new bytes, it returns{' '}
        <code>false</code>. Nothing about the key pair changed between those two calls — only the document
        did, by one substring, and that was enough to flip the result.
      </p>

      <h2>4. Hashing a Large File Without Loading It Into Memory</h2>

      <p>
        <code>Files.readAllBytes()</code> is fine for a 70-byte report. It is not fine for a multi-gigabyte
        backup — it allocates one contiguous array the size of the whole file, and on a memory-constrained
        JVM that allocation can fail outright. <code>DigestInputStream</code> wraps a normal{' '}
        <code>InputStream</code> and updates a <code>MessageDigest</code> as a side effect of every{' '}
        <code>read()</code> call, so the program only ever holds one buffer&apos;s worth of the file in
        memory, no matter how large the file is.
      </p>

      <p>
        To make the difference real rather than theoretical, the program below writes a 200 MB file, hashes
        it with the streaming approach, then — still on the exact same JVM, capped at{' '}
        <code>-Xmx100m</code> — attempts <code>Files.readAllBytes()</code> on that same file and lets
        whatever happens, happen.
      </p>

      <CodeBlock language="java" title="StreamingFileHash.java — DigestInputStream vs. Loading the Whole File">
{`import java.io.BufferedInputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

public class StreamingFileHash {

    private static final int BUFFER_SIZE = 8192; // 8 KiB -- the only memory this method uses,
                                                   // regardless of file size

    public static String sha256Streaming(Path file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");

        try (InputStream fis = new FileInputStream(file.toFile());
             DigestInputStream dis = new DigestInputStream(new BufferedInputStream(fis), digest)) {
            byte[] buffer = new byte[BUFFER_SIZE];
            while (dis.read(buffer) != -1) {
                // DigestInputStream updates the digest as a side effect of read();
                // we never hold more than BUFFER_SIZE bytes ourselves.
            }
        }

        return HexFormat.of().formatHex(digest.digest());
    }

    public static void main(String[] args) throws Exception {
        Path bigFile = Path.of("bigfile.bin");

        // 200 MB file, deliberately larger than the heap this JVM is given
        // (run with -Xmx100m) so the two approaches genuinely diverge.
        long fileSizeBytes = 200L * 1024 * 1024;
        SecureRandom rng = new SecureRandom();
        byte[] chunk = new byte[1024 * 1024];
        try (var out = Files.newOutputStream(bigFile)) {
            long written = 0;
            while (written < fileSizeBytes) {
                rng.nextBytes(chunk);
                out.write(chunk);
                written += chunk.length;
            }
        }

        System.out.println("File size: " + Files.size(bigFile) + " bytes");
        System.out.println("Max heap (-Xmx): " + (Runtime.getRuntime().maxMemory() / (1024 * 1024)) + " MB");

        long start = System.nanoTime();
        String streamedHash = sha256Streaming(bigFile);
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;
        System.out.println("Streaming SHA-256 succeeded: " + streamedHash);
        System.out.println("Time: " + elapsedMs + " ms");

        System.out.println("Now trying Files.readAllBytes() on the same file, same heap limit...");
        try {
            byte[] wholeFile = Files.readAllBytes(bigFile);
            // Only reached if the heap happened to be big enough.
            MessageDigest wholeDigest = MessageDigest.getInstance("SHA-256");
            String wholeFileHash = HexFormat.of().formatHex(wholeDigest.digest(wholeFile));
            System.out.println("Whole-file read succeeded (heap was large enough): " + wholeFileHash);
            System.out.println("Hashes match: " + streamedHash.equals(wholeFileHash));
        } catch (OutOfMemoryError e) {
            System.out.println("Whole-file read FAILED: " + e.getClass().getName() + ": " + e.getMessage());
            System.out.println("The streaming version above already produced the correct digest without this problem.");
        }
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="$ javac StreamingFileHash.java && java -Xmx100m StreamingFileHash — Actual output">
{`File size: 209715200 bytes
Max heap (-Xmx): 104 MB
Streaming SHA-256 succeeded: f49c7284553b1d065c73ef5ae4f2865122e860dd40f02c6ffd9c8356b64ae920
Time: 103 ms
Now trying Files.readAllBytes() on the same file, same heap limit...
Whole-file read FAILED: java.lang.OutOfMemoryError: Java heap space
The streaming version above already produced the correct digest without this problem.`}
      </CodeBlock>

      <p>
        With a 104 MB effective heap and a 200 MB file, the streaming hash finishes in 103 ms using an
        8 KiB buffer, and <code>Files.readAllBytes()</code> on the identical file throws a genuine{' '}
        <code>OutOfMemoryError: Java heap space</code> — not a simulated failure, the JVM actually ran out
        of contiguous heap trying to materialize one 200 MB array. That is the entire argument for{' '}
        <code>DigestInputStream</code> in one side-by-side run: streaming isn&apos;t a micro-optimization
        here, it&apos;s the difference between the program finishing and the program crashing.
      </p>

      <h2>Two Claims, Checked Instead of Assumed</h2>

      <p>
        Two things get repeated constantly about <code>Cipher</code> — that instances aren&apos;t
        thread-safe, and that leaving off the mode silently gives you ECB. Both are true, but both are
        worth actually checking rather than passing along from memory, so here&apos;s each one, verified.
      </p>

      <h3>Is &quot;Cipher is not thread-safe&quot; actually documented?</h3>

      <p>
        Searching the official <code>javax.crypto.Cipher</code> class Javadoc and the JCA Reference Guide
        directly for the word &quot;thread&quot; turns up <strong>zero matches in either document</strong> —
        neither one uses the literal phrase &quot;not thread-safe.&quot; What the Javadoc does say, on{' '}
        <code>init()</code>, is that &quot;initializing a <code>Cipher</code> object is equivalent to
        creating a new instance of that <code>Cipher</code> object and initializing it&quot; — which is a
        precise way of saying a <code>Cipher</code> carries mutable state across{' '}
        <code>init()</code>/<code>update()</code>/<code>doFinal()</code>, with no synchronization
        mentioned anywhere. Rather than trust that inference, the test below shares <em>one</em>{' '}
        <code>Cipher</code> instance across 8 threads doing 1,600 encrypt/decrypt round trips total and
        counts how many come back corrupted.
      </p>

      <CodeBlock language="java" title="CipherThreadSafetyCheck.java — One Cipher Instance, Eight Threads">
{`import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.security.SecureRandom;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

public class CipherThreadSafetyCheck {

    public static void main(String[] args) throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256);
        SecretKey key = keyGen.generateKey();

        // ONE Cipher instance, shared across threads -- the anti-pattern.
        Cipher sharedCipher = Cipher.getInstance("AES/GCM/NoPadding");

        int threadCount = 8;
        int opsPerThread = 200;
        AtomicInteger corruptedOrFailed = new AtomicInteger(0);
        AtomicInteger succeeded = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(threadCount);

        Runnable task = () -> {
            for (int i = 0; i < opsPerThread; i++) {
                try {
                    byte[] iv = new byte[12];
                    new SecureRandom().nextBytes(iv);
                    byte[] plaintext = ("message-" + Thread.currentThread().threadId() + "-" + i).getBytes();

                    // Shared instance: init + doFinal is not an atomic operation,
                    // so another thread can call init() on the SAME object in between.
                    sharedCipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
                    byte[] ciphertext = sharedCipher.doFinal(plaintext);

                    sharedCipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));
                    byte[] roundTrip = sharedCipher.doFinal(ciphertext);

                    if (java.util.Arrays.equals(plaintext, roundTrip)) {
                        succeeded.incrementAndGet();
                    } else {
                        corruptedOrFailed.incrementAndGet();
                    }
                } catch (Exception e) {
                    corruptedOrFailed.incrementAndGet();
                }
            }
            latch.countDown();
        };

        for (int i = 0; i < threadCount; i++) {
            new Thread(task).start();
        }
        latch.await();

        System.out.println("Threads: " + threadCount + ", ops/thread: " + opsPerThread
                + ", total ops: " + (threadCount * opsPerThread));
        System.out.println("Succeeded (correct round trip): " + succeeded.get());
        System.out.println("Corrupted or threw an exception: " + corruptedOrFailed.get());
        System.out.println("Sharing one Cipher instance across threads is unsafe: " + (corruptedOrFailed.get() > 0));
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="$ javac CipherThreadSafetyCheck.java && java CipherThreadSafetyCheck — Actual output">
{`Threads: 8, ops/thread: 200, total ops: 1600
Succeeded (correct round trip): 954
Corrupted or threw an exception: 646
Sharing one Cipher instance across threads is unsafe: true`}
      </CodeBlock>

      <p>
        646 of 1,600 operations — roughly 40% — came back corrupted or threw an exception, purely from
        letting 8 threads call <code>init()</code>/<code>doFinal()</code> on the same shared object. The
        exact count varies run to run (it&apos;s a race, by definition), but it is never zero. This lines
        up with real-world bug reports against the JDK itself, such as{' '}
        <a href="https://bugs.openjdk.org/browse/JDK-8191177" target="_blank" rel="noreferrer">JDK-8191177</a>,
        &quot;Java Cipher - PBE thread-safety issue.&quot; So: the exact words &quot;not thread-safe&quot;
        are not in Oracle&apos;s official docs for this class, but the stateful design the docs{' '}
        <em>do</em> describe, combined with this test, is the same conclusion — give each thread (or each
        operation) its own <code>Cipher</code> instance.
      </p>

      <h3>Does the JDK really default to ECB with no mode specified?</h3>

      <p>
        The claim: call <code>Cipher.getInstance("AES")</code> with no <code>/mode/padding</code> suffix,
        and the JDK silently resolves it to <code>AES/ECB/PKCS5Padding</code>. Rather than assert that, the
        test below checks it two ways on this JDK 26 install — first by asking the resulting cipher for its
        algorithm string, then, more convincingly, by encrypting two identical 16-byte plaintext blocks and
        checking whether the two ciphertext blocks come out identical. Identical ciphertext blocks from
        identical plaintext blocks is the specific, unmistakable fingerprint of ECB — it cannot happen
        under GCM or CBC with a random IV, because every block&apos;s encryption depends on more than just
        that block&apos;s content.
      </p>

      <CodeBlock language="java" title="EcbDefaultCheck.java — Does &quot;AES&quot; Alone Mean ECB?">
{`import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.util.Arrays;
import java.util.Base64;

public class EcbDefaultCheck {
    public static void main(String[] args) throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256);
        SecretKey key = keyGen.generateKey();

        // No mode/padding specified -- what does the JDK actually pick?
        Cipher noModeCipher = Cipher.getInstance("AES");
        System.out.println("Cipher.getInstance(\\"AES\\") -> algorithm: " + noModeCipher.getAlgorithm());

        Cipher explicitEcb = Cipher.getInstance("AES/ECB/PKCS5Padding");

        // Two identical 16-byte blocks repeated -- ECB famously produces
        // IDENTICAL ciphertext blocks for identical plaintext blocks because
        // there's no IV / chaining. That's the observable fingerprint of ECB.
        byte[] plaintext = new byte[32];
        byte[] block = "AAAAAAAAAAAAAAAA".getBytes(); // 16 bytes
        System.arraycopy(block, 0, plaintext, 0, 16);
        System.arraycopy(block, 0, plaintext, 16, 16);

        noModeCipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] noModeCiphertext = noModeCipher.doFinal(plaintext);

        explicitEcb.init(Cipher.ENCRYPT_MODE, key);
        byte[] explicitEcbCiphertext = explicitEcb.doFinal(plaintext);

        byte[] noModeBlock1 = Arrays.copyOfRange(noModeCiphertext, 0, 16);
        byte[] noModeBlock2 = Arrays.copyOfRange(noModeCiphertext, 16, 32);

        System.out.println("No-mode ciphertext (base64): " + Base64.getEncoder().encodeToString(noModeCiphertext));
        System.out.println("Block 1 == Block 2 (ECB fingerprint): " + Arrays.equals(noModeBlock1, noModeBlock2));
        System.out.println("No-mode ciphertext == explicit AES/ECB/PKCS5Padding ciphertext: "
                + Arrays.equals(noModeCiphertext, explicitEcbCiphertext));
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="$ javac EcbDefaultCheck.java && java EcbDefaultCheck — Actual output (JDK 26.0.1)">
{`Cipher.getInstance("AES") -> algorithm: AES
No-mode ciphertext (base64): RBSRJxx1kR36mshruvRbvUQUkSccdZEd+prIa7r0W72YkYIt/Zd810OUgLFaMtd4
Block 1 == Block 2 (ECB fingerprint): true
No-mode ciphertext == explicit AES/ECB/PKCS5Padding ciphertext: true`}
      </CodeBlock>

      <p>
        Both checks land the same way: the two ciphertext blocks from the no-mode cipher are byte-for-byte
        identical to each other, and the entire no-mode ciphertext is byte-for-byte identical to what{' '}
        <code>AES/ECB/PKCS5Padding</code> produces from the same key and plaintext. Confirmed on JDK
        26.0.1: <code>Cipher.getInstance("AES")</code> really does silently resolve to ECB with PKCS5
        padding, no warning, no exception — exactly the outcome every AES-256-GCM example in this section
        has been avoiding by spelling out <code>&quot;AES/GCM/NoPadding&quot;</code> in full every time.
      </p>

      <InfoBox variant="warning" title="Common Java Crypto Gotchas">
        <p>
          <strong>1. <code>Cipher</code> instances are not safe to share across threads.</strong> The
          official Javadoc never uses the words &quot;thread-safe,&quot; but it does document that a{' '}
          <code>Cipher</code> carries mutable state through <code>init()</code>/<code>update()</code>/
          <code>doFinal()</code>, and the test above shows what that means in practice: ~40% corruption
          when 8 threads share one instance. Create a new <code>Cipher</code> per operation (they&apos;re
          cheap to construct), or give each thread its own via <code>ThreadLocal&lt;Cipher&gt;</code> if
          allocation overhead genuinely matters.
        </p>
        <p>
          <strong>2. <code>Cipher.getInstance(&quot;AES&quot;)</code> with no mode is ECB on this JDK —
          verified, not assumed.</strong> There is no compiler warning and no runtime exception; you get a
          working, insecure cipher that leaks plaintext block patterns, as demonstrated above and in the{' '}
          <strong>Common Cryptographic Mistakes</strong> lesson. Every program in this lesson spells out
          the full transformation — <code>&quot;AES/GCM/NoPadding&quot;</code> — for exactly this reason.
          Never call <code>Cipher.getInstance()</code> with just an algorithm name.
        </p>
        <p>
          <strong>3. A caught exception is not proof of correctness.</strong> Every &quot;this should
          fail&quot; check in this lesson — the wrong PBKDF2 password, the tampered contract — printed the
          actual exception type and message, or the actual boolean, rather than a bare try/catch that
          swallows the detail. When you write a negative test, log what actually came back.
        </p>
      </InfoBox>

      <p>
        Every program above ran on a real JDK 26 install, compiled and executed exactly as shown. The next
        lesson repeats the same five ideas — file encryption, password-based key derivation, digital
        signatures, streaming hashes, and the sharp edges — in Node.js and TypeScript, so you can see where
        the concepts stay identical and where the platform&apos;s idioms genuinely differ.
      </p>

      <InteractiveChallenge
        question={"A teammate writes Cipher.getInstance(\"AES\") with no mode or padding specified, and it compiles and runs with no warning or exception. What actually happens, and why is that dangerous?"}
        options={[
          "It throws a NoSuchAlgorithmException at runtime, so the mistake is caught immediately",
          "The JDK silently resolves it to AES/ECB/PKCS5Padding — verified above by two identical plaintext blocks producing two identical ciphertext blocks — and ECB leaks patterns in the plaintext with no IV or chaining to prevent it",
          "It defaults to AES/GCM/NoPadding, the same secure mode used throughout this lesson, so nothing is actually wrong",
          "It picks a random mode each time the program runs, making the ciphertext non-reproducible"
        ]}
        correctIndex={1}
        explanation={"Nothing about calling Cipher.getInstance(\"AES\") alone fails loudly — it compiles, it runs, and it returns a working cipher, which is exactly what makes it dangerous. The demo above proved it two ways on a real JDK 26 install: the no-mode cipher's algorithm string is just \"AES\", and encrypting two identical 16-byte plaintext blocks produced two byte-for-byte identical ciphertext blocks — the unmistakable fingerprint of ECB, which encrypts each block independently with no IV or chaining. That's why every other program in this lesson spells out the full transformation, \"AES/GCM/NoPadding\", explicitly rather than relying on any default."}
      />
    </LessonLayout>
  );
}
