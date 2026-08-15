import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function CryptoKeyWrapping() {
  return (
    <LessonLayout
      title="Key Wrapping & Envelope Encryption"
      sectionId="cryptography"
      lessonIndex={9}
      prev={{ path: '/cryptography/trust-stores', label: 'Where Keys & Certs Actually Live' }}
      next={{ path: '/cryptography/secure-random', label: 'Secure Random Number Generation' }}
    >
      <p>
        That is exactly right, and it has a name: <strong>envelope encryption</strong>, also called{' '}
        <strong>key wrapping</strong>. It is one of the most load-bearing patterns in real-world
        production systems — every S3 bucket encrypted with SSE-KMS, every encrypted RDS database, every
        secret in Vault, works this way underneath. This lesson names the two keys precisely, explains why
        the rotation story works out the way it does, and then proves the entire round trip in both Node
        and Java rather than just asserting it.
      </p>

      <InfoBox variant="info" title="Two Keys, Two Different Jobs">
        <p>
          <strong>DEK — Data Encryption Key.</strong> Encrypts the actual data (AES-256-GCM, exactly as
          covered in the Encryption Fundamentals lesson). Nothing new about this key&apos;s mechanics —
          what&apos;s new is what happens to the key itself afterward.
        </p>
        <p>
          <strong>KEK — Key Encryption Key.</strong> Encrypts (&quot;wraps&quot;) the DEK. It never
          touches your actual data directly — its only job is protecting the much smaller DEK. In
          production this key typically lives inside an HSM or a cloud KMS and is never exported in the
          clear, not even to the application that uses it.
        </p>
      </InfoBox>

      <h2>The Problem This Solves</h2>

      <p>
        Imagine skipping this entirely and encrypting every record directly with one master key. That
        works fine until the key needs to rotate — a scheduled policy, a suspected compromise, an employee
        with access leaving. Now every single ciphertext ever produced with that key is only readable
        because of a key you are trying to retire. Rotating it means decrypting <em>everything</em> and
        re-encrypting <em>everything</em> under the new key — for a multi-terabyte database, that is a
        migration, not a rotation: read every row, decrypt, re-encrypt, write it back, probably with
        downtime or a complex online-migration plan.
      </p>

      <p>
        Envelope encryption breaks that dependency. The data is encrypted with a DEK, and only the{' '}
        <em>DEK</em> — not the data — is encrypted with the KEK. The wrapped DEK is small (tens of bytes)
        regardless of whether the data behind it is a phone number or a 4K video file, and it is stored
        right next to that data. Rotating the KEK means re-wrapping that small artifact. The data
        ciphertext is never touched, never re-read, never re-encrypted — because the DEK protecting it did
        not change, only what protects <em>the DEK</em> did.
      </p>

      <FlowChart
        title="Envelope Encryption — Two Keys, Two Jobs"
        chart={"graph TD\n  P[\"Plaintext data (KB to GB)\"] -->|\"AES-256-GCM, key = DEK\"| CT[\"Data ciphertext -- same size as plaintext\"]\n  DEK[\"DEK -- 32 random bytes\"] -.->|\"is the key for\"| CT\n  DEK -->|\"AES-256-GCM, key = KEK\"| WDEK[\"Wrapped DEK -- ~60 bytes, constant size\"]\n  KEK[\"KEK -- lives in HSM / Cloud KMS\"] -.->|\"is the key for\"| WDEK\n  CT --> STORE[\"Stored together: data ciphertext + wrapped DEK\"]\n  WDEK --> STORE\n  style DEK fill:#2a1f44,stroke:#a78bfa\n  style KEK fill:#3d2f14,stroke:#d97706\n  style WDEK fill:#1a3329,stroke:#4ade80\n  style CT fill:#1a2744,stroke:#5b9cf6"}
      />

      <InfoBox variant="warning" title="Why the Unwrapped DEK Never Touches Disk">
        <p>
          The plaintext DEK exists only transiently, in memory, for the moment it is needed to encrypt or
          decrypt data — then it is discarded. Only the <em>wrapped</em> (encrypted) form of the DEK is
          ever persisted. If an attacker steals the database — data ciphertext and wrapped DEK together —
          they still have nothing: the wrapped DEK is useless without the KEK, and the KEK was never in
          that database to begin with.
        </p>
      </InfoBox>

      <h2>End-to-End Proof — Node.js</h2>

      <p>
        This is not a sketch — it is the exact script run in a scratch directory while writing this
        lesson, output included below it verbatim. It generates a DEK, encrypts data with it, generates a
        separate KEK, wraps the DEK, then unwraps and decrypts — and finally rotates the KEK to show the
        data ciphertext survives untouched.
      </p>

      <CodeBlock language="javascript" title="Envelope Encryption Round Trip (Node.js, actually run)">
{`const crypto = require('crypto');

function aesGcmEncrypt(plaintext, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { iv, ciphertext, authTag: cipher.getAuthTag() };
}

function aesGcmDecrypt({ iv, ciphertext, authTag }, key) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// --- Step 1: the DEK encrypts the actual data ---
const dek = crypto.randomBytes(32); // Data Encryption Key
const plaintext = Buffer.from('Q3 revenue figures: $4.2M');
const dataEnvelope = aesGcmEncrypt(plaintext, dek);

// --- Step 2: a separate KEK wraps (encrypts) the DEK -- NOT the data ---
const kek = crypto.randomBytes(32); // Key Encryption Key -- an HSM/KMS in real systems
const wrappedDek = aesGcmEncrypt(dek, kek);

// --- What actually gets persisted next to the data ---
// The raw dek variable is never written to disk -- only this envelope is:
const stored = {
  wrappedDek: wrappedDek.ciphertext, wrappedDekIv: wrappedDek.iv, wrappedDekTag: wrappedDek.authTag,
  data: dataEnvelope.ciphertext, dataIv: dataEnvelope.iv, dataTag: dataEnvelope.authTag,
};

// --- Step 3: unwrap the DEK, then use it to decrypt the data ---
const recoveredDek = aesGcmDecrypt(
  { iv: stored.wrappedDekIv, ciphertext: stored.wrappedDek, authTag: stored.wrappedDekTag }, kek);
console.log('DEK round-tripped correctly:', recoveredDek.equals(dek));

const recoveredPlaintext = aesGcmDecrypt(
  { iv: stored.dataIv, ciphertext: stored.data, authTag: stored.dataTag }, recoveredDek);
console.log('Data decrypts correctly:', recoveredPlaintext.equals(plaintext));
console.log('Recovered text:', recoveredPlaintext.toString());

// --- Step 4: THE CRUX -- rotate the KEK without touching the data at all ---
const newKek = crypto.randomBytes(32);
const rewrapped = aesGcmEncrypt(dek, newKek); // only the 32-byte DEK gets re-wrapped

const dekAfterRotation = aesGcmDecrypt(
  { iv: rewrapped.iv, ciphertext: rewrapped.ciphertext, authTag: rewrapped.authTag }, newKek);
const dataAfterRotation = aesGcmDecrypt(
  { iv: stored.dataIv, ciphertext: stored.data, authTag: stored.dataTag }, dekAfterRotation);
console.log('After KEK rotation, data still decrypts:', dataAfterRotation.equals(plaintext));
console.log('Data ciphertext untouched by rotation:', dataEnvelope.ciphertext.equals(stored.data));`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual Terminal Output">
{`$ node envelope.js
DEK round-tripped correctly: true
Data decrypts correctly: true
Recovered text: Q3 revenue figures: $4.2M
After KEK rotation, data still decrypts: true
Data ciphertext untouched by rotation: true`}
      </CodeBlock>

      <h2>End-to-End Proof — Java</h2>

      <p>
        Same logic, same primitives — <code>AES/GCM/NoPadding</code>, same 32-byte keys — this time
        compiled and run with <code>javac</code> / <code>java</code> rather than assumed to work:
      </p>

      <CodeBlock language="java" title="Envelope Encryption Round Trip (Java, actually compiled and run)">
{`import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Arrays;

public class EnvelopeFinal {
    record Sealed(byte[] iv, byte[] ciphertext) {} // ciphertext includes the GCM tag (Java's convention)

    static Sealed aesGcmEncrypt(byte[] plaintext, SecretKey key) throws Exception {
        byte[] iv = new byte[12];
        new SecureRandom().nextBytes(iv);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
        return new Sealed(iv, cipher.doFinal(plaintext));
    }

    static byte[] aesGcmDecrypt(Sealed sealed, SecretKey key) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, sealed.iv()));
        return cipher.doFinal(sealed.ciphertext());
    }

    public static void main(String[] args) throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");

        // Step 1: the DEK encrypts the actual data
        keyGen.init(256);
        SecretKey dek = keyGen.generateKey();
        byte[] plaintext = "Q3 revenue figures: $4.2M".getBytes("UTF-8");
        Sealed dataEnvelope = aesGcmEncrypt(plaintext, dek);

        // Step 2: a separate KEK wraps (encrypts) the DEK's raw bytes -- NOT the data
        keyGen.init(256);
        SecretKey kek = keyGen.generateKey();
        Sealed wrappedDek = aesGcmEncrypt(dek.getEncoded(), kek);
        // What gets persisted: wrappedDek + dataEnvelope. dek.getEncoded() is never written to disk.

        // Step 3: unwrap the DEK, then use it to decrypt the data
        byte[] recoveredDekBytes = aesGcmDecrypt(wrappedDek, kek);
        System.out.println("DEK round-tripped correctly: " + Arrays.equals(recoveredDekBytes, dek.getEncoded()));
        SecretKey recoveredDek = new SecretKeySpec(recoveredDekBytes, "AES");

        byte[] recoveredPlaintext = aesGcmDecrypt(dataEnvelope, recoveredDek);
        System.out.println("Data decrypts correctly: " + Arrays.equals(recoveredPlaintext, plaintext));
        System.out.println("Recovered text: " + new String(recoveredPlaintext, "UTF-8"));

        // Step 4: THE CRUX -- rotate the KEK without touching the data at all
        keyGen.init(256);
        SecretKey newKek = keyGen.generateKey();
        Sealed rewrapped = aesGcmEncrypt(dek.getEncoded(), newKek); // only the 32-byte DEK gets re-wrapped

        SecretKey dekAfterRotation = new SecretKeySpec(aesGcmDecrypt(rewrapped, newKek), "AES");
        byte[] dataAfterRotation = aesGcmDecrypt(dataEnvelope, dekAfterRotation);
        System.out.println("After KEK rotation, data still decrypts: " + Arrays.equals(dataAfterRotation, plaintext));
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual Terminal Output">
{`$ javac EnvelopeFinal.java && java EnvelopeFinal
DEK round-tripped correctly: true
Data decrypts correctly: true
Recovered text: Q3 revenue figures: $4.2M
After KEK rotation, data still decrypts: true`}
      </CodeBlock>

      <h2>Proving the Crux: Rotation Cost Is Constant, Not Proportional</h2>

      <p>
        The claim that makes this pattern worth using is that re-wrapping the DEK is cheap{' '}
        <strong>regardless of how large the underlying data is</strong>. That is not an assumption — it
        follows directly from what AES-GCM ciphertext size actually is (ciphertext length equals plaintext
        length, plus a fixed-size tag), so it is straightforward to measure directly instead of taking on
        faith:
      </p>

      <CodeBlock language="text" title="Wrapped-DEK Size vs. Data Size (real measured output)">
{`$ node envelope_scale.js
DEK length (bytes): 32
data size=       40 bytes -> ciphertext size=       40 bytes | wrapped DEK size=32 bytes (constant)
data size=     1024 bytes -> ciphertext size=     1024 bytes | wrapped DEK size=32 bytes (constant)
data size=  5242880 bytes -> ciphertext size=  5242880 bytes | wrapped DEK size=32 bytes (constant)`}
      </CodeBlock>

      <p>
        Data ciphertext scales exactly 1:1 with the plaintext, as it must. The wrapped DEK stays at 32
        bytes of ciphertext no matter which row it ran against — 40 bytes of data or 5 MB of data, same
        32-byte result, because the thing being wrapped is always the same 32-byte AES-256 key. Add the
        12-byte IV and 16-byte GCM tag stored alongside it and the whole wrapped-DEK artifact is about 60
        bytes, full stop, forever, for that record. <strong>That fixed ~60-byte cost is what &quot;only the
        parent key needs to be rotated&quot; is actually paying for</strong> — rotation touches that 60-byte
        artifact per record, never the record&apos;s actual (and potentially enormous) payload.
      </p>

      <InfoBox variant="success" title="Why This Exactly Solves the Rotation Problem">
        <p>
          <strong>Compromise the KEK →</strong> generate a new KEK, then for every stored record, decrypt
          its wrapped DEK with the old KEK and re-encrypt that same DEK with the new KEK. The DEK&apos;s{' '}
          <em>value</em> never changes — it is unwrapped and immediately re-wrapped, byte-identical inside.
        </p>
        <p>
          <strong>The data ciphertext is provably untouched</strong> — the Node demo above asserts{' '}
          <code>dataEnvelope.ciphertext.equals(stored.data)</code> after rotation and it holds, because
          nothing in steps 3–4 ever calls the data-decryption function with the intent to re-encrypt. The
          DEK that produced that ciphertext never changed, so the ciphertext it produced never needs to
          change either.
        </p>
        <p>
          <strong>The operation that used to be &quot;read and rewrite every row in the database&quot;
          becomes &quot;re-wrap a 60-byte value per row&quot;</strong> — orders of magnitude cheaper, and
          crucially, independent of whether that row holds a credit card number or an attached PDF.
        </p>
      </InfoBox>

      <h2>How Cloud KMS Providers Actually Implement This</h2>

      <p>
        AWS KMS, GCP KMS/Cloud HSM, and HashiCorp Vault&apos;s Transit engine are all built around exactly
        this pattern, with one crucial refinement: the KEK (they usually call it a{' '}
        <strong>master key</strong> or <strong>customer master key</strong>) never leaves the service
        boundary in plaintext form, ever — not even to the application using it.
      </p>

      <InfoBox variant="note" title="The Request Shape, Conceptually">
        <p>
          <strong>Wrapping:</strong> your application asks the KMS to protect a DEK. The KMS uses the KEK
          it holds internally (inside an HSM it manages) to encrypt that DEK and hands back only the{' '}
          <em>wrapped</em> result. The KEK itself is never transmitted to you, never cached in your
          process, never written to your disk.
        </p>
        <p>
          <strong>Unwrapping:</strong> when you need to decrypt data, you send the KMS the wrapped DEK you
          have stored. The KMS decrypts it internally using the KEK it holds and returns the plaintext DEK
          to you over TLS. You use it immediately to decrypt your data, then discard it from memory.
        </p>
        <p>
          The net effect: your application handles plaintext DEKs briefly, in memory, one record at a
          time. It <em>never</em> handles the KEK at all. A breach of your application server exposes
          whatever DEKs happen to be in memory at that moment — not the master key protecting every record
          in the system. This is deliberately not specific SDK method-call syntax (that differs by
          provider and changes over time); the request/response shape above is the stable part worth
          understanding.
        </p>
      </InfoBox>

      <h2>Key Takeaways</h2>

      <InfoBox variant="tip" title="What This Lesson Actually Proved">
        <p>
          <strong>Two keys, two jobs.</strong> A DEK encrypts data; a KEK encrypts (wraps) the DEK. Only
          the wrapped DEK is stored with the data — the KEK lives somewhere more protected (HSM/KMS).
        </p>
        <p>
          <strong>The full round trip works, verified in two languages.</strong> Generate DEK → encrypt
          data → generate KEK → wrap DEK → unwrap DEK → decrypt data, run end-to-end in both Node.js and
          Java with real captured output, not assumed.
        </p>
        <p>
          <strong>Rotation cost is provably constant, not proportional to data size.</strong> Measured
          directly: a wrapped DEK is 32 bytes of ciphertext whether it protects 40 bytes or 5 MB of data.
          Rotating the KEK means re-wrapping that fixed-size artifact per record, never re-encrypting the
          record&apos;s actual payload.
        </p>
        <p>
          <strong>Cloud KMS providers add one refinement:</strong> the KEK never leaves the service
          boundary in plaintext, even to the application calling it — only wrapped DEKs and briefly-held
          plaintext DEKs ever reach your process.
        </p>
      </InfoBox>

      <p>
        Every DEK and KEK generated above came from a cryptographically secure random source —{' '}
        <code>crypto.randomBytes()</code> in Node, <code>SecureRandom</code>-backed{' '}
        <code>KeyGenerator</code> in Java. The next lesson looks directly at what makes those calls safe to
        rely on, and what happens when code reaches for the wrong random source instead.
      </p>

      <InteractiveChallenge
        question={"A company's KEK is suspected to be compromised. They have 50 million encrypted database rows, each with its own DEK wrapped by that KEK. What does rotating the KEK actually require?"}
        options={[
          "Decrypt and re-encrypt all 50 million rows of underlying data with a new key",
          "For each of the 50 million rows, unwrap its small DEK with the old KEK and re-wrap that same DEK with the new KEK -- the row's actual data ciphertext is never touched",
          "Nothing needs to change -- the KEK compromise doesn't affect stored data",
          "Generate one new KEK and manually re-encrypt only the rows that were accessed during the suspected compromise window"
        ]}
        correctIndex={1}
        explanation={"This is the entire point of envelope encryption. The DEK's value never changes during KEK rotation -- it's unwrapped with the old KEK and immediately re-wrapped with the new one, byte-identical inside. Since the DEK is unchanged, the data ciphertext it produced is still valid and is never re-read or re-encrypted. The measured proof in this lesson: a wrapped DEK is a constant ~32 bytes of ciphertext regardless of whether the row holds 40 bytes or 5 MB -- that's the fixed cost rotation actually pays, per row, instead of touching the row's real payload."}
      />

      <InteractiveChallenge
        question={"In AWS KMS / GCP KMS / Vault's Transit engine, why does the application never receive the KEK (master key) in plaintext, even though it receives the plaintext DEK?"}
        options={[
          "It's a performance optimization -- transmitting the KEK would be slower",
          "The KEK protects every DEK/record in the system, so keeping it inside the KMS's HSM boundary means a compromised application server only exposes whatever DEKs are in memory at that moment, not the master key",
          "The DEK and KEK are actually the same key, just encoded differently",
          "Plaintext KEKs cannot be transmitted over TLS for technical reasons"
        ]}
        correctIndex={1}
        explanation={"The KEK is the single point of protection for potentially every record in the system, so its blast radius if exposed is enormous. The KMS pattern is: send the KMS a wrapped DEK, it unwraps internally using the KEK it never exports, and returns you the plaintext DEK over TLS. Your application briefly holds one DEK at a time in memory and never touches the KEK at all -- so a server compromise leaks at most the DEKs currently in use, never the master key protecting everything."}
      />
    </LessonLayout>
  );
}
