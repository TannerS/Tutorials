import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function CryptoEncodingVsEncryption() {
  return (
    <LessonLayout
      title="Encoding vs Encryption vs Hashing"
      sectionId="cryptography"
      lessonIndex={0}
      prev={null}
      next={{ path: '/cryptography/encryption', label: 'Encryption Fundamentals — AES, RSA, ECC' }}
    >
      <p>
        These three words get used interchangeably in standups and PRs, and that habit causes real
        security bugs. &quot;We encrypted the password&quot; sometimes means someone ran it through{' '}
        <code>btoa()</code>. &quot;We hashed the session token&quot; sometimes means SHA-256, when the
        situation actually called for something else entirely. Before any of the algorithms in this
        section make sense, you need the three buckets to be completely separate in your head:
      </p>

      <InfoBox variant="info" title="The Three Buckets">
        <p><strong>Encoding</strong> — Reversible, no key. Anyone can undo it. Not security.</p>
        <p><strong>Encryption</strong> — Reversible, <em>with a key</em>. Only someone holding the key can undo it.</p>
        <p><strong>Hashing</strong> — One-way. Nobody can undo it, key or not — that is the design goal.</p>
      </InfoBox>

      <h2>Encoding: Reversible, No Key</h2>

      <p>
        Encoding transforms data into a different <em>representation</em> so it survives a transport
        medium that cannot handle raw bytes — Base64 turns binary into ASCII for JSON bodies and email
        attachments, hex turns bytes into a form you can eyeball in logs, URL encoding escapes characters
        that would break a query string. None of this involves a secret. The transformation is a public,
        published algorithm, and reversing it takes zero information beyond knowing which encoding was
        used.
      </p>

      <p>
        Run this and you get the original string back — no key, no password, just the inverse function:
      </p>

      <CodeBlock language="javascript" title="Encoding Is Trivially Reversible (Node.js)">
{`const original = 'hunter2';

// Base64 — the same thing atob()/btoa() do in a browser
const b64 = Buffer.from(original, 'utf8').toString('base64');
console.log(b64);                                    // 'aHVudGVyMg=='
console.log(Buffer.from(b64, 'base64').toString());   // 'hunter2' — nothing secret required

// Base64URL — Base64 with +/  replaced by -_ and no padding, so it's
// safe to drop straight into a URL path or a JWT segment
const b64url = Buffer.from(original, 'utf8').toString('base64url');
console.log(b64url);                                  // 'aHVudGVyMg'

// Hex
const hex = Buffer.from(original, 'utf8').toString('hex');
console.log(hex);                                      // '68756e74657232'
console.log(Buffer.from(hex, 'hex').toString());       // 'hunter2'`}
      </CodeBlock>

      <p>
        That is not a contrived example — it is exactly what a browser's built-in{' '}
        <code>atob()</code>/<code>btoa()</code> do, and exactly what a JWT's header and payload segments
        are. Anyone who intercepts a JWT can read the claims inside it with zero effort; Base64URL is why
        JWTs are &quot;readable, not secret&quot; — the token's integrity comes from its signature, not
        from the encoding hiding anything.
      </p>

      <CodeBlock language="java" title="Same Thing in Java — Base64.getDecoder() Undoes It Instantly">
{`import java.util.Base64;
import java.nio.charset.StandardCharsets;

String original = "hunter2";
String encoded = Base64.getEncoder().encodeToString(original.getBytes(StandardCharsets.UTF_8));
System.out.println(encoded); // "aHVudGVyMg=="

String decoded = new String(Base64.getDecoder().decode(encoded), StandardCharsets.UTF_8);
System.out.println(decoded); // "hunter2" — no key was ever involved`}
      </CodeBlock>

      <InfoBox variant="danger" title='"We Encrypted It" (They Meant Base64)'>
        <p>
          This is a real, recurring incident category, not a hypothetical. A team stores{' '}
          <code>Buffer.from(password).toString('base64')</code> in a database and describes it in a
          design doc as &quot;encrypted at rest.&quot; A breach later exposes the table, and every
          password is one <code>atob()</code> call away from plaintext. Base64 is an encoding — it adds
          no confidentiality whatsoever. If a value needs to stay secret, encoding is not on the list of
          things that can do that job.
        </p>
      </InfoBox>

      <h2>Encryption: Reversible, With a Key</h2>

      <p>
        Encryption also produces something you can turn back into the original — but only if you hold the
        right key. Without the key, a well-designed cipher's output is computationally indistinguishable
        from random noise. This is the property encoding does not have: encoding requires no information
        to reverse; encryption requires the key, full stop.
      </p>

      <p>
        The next lesson covers AES, RSA, and ECC in depth, so this is deliberately the one-paragraph
        version: symmetric encryption (AES) uses one key for both directions, asymmetric encryption (RSA,
        ECC) uses a public/private key pair. Either way, the defining property is the same —{' '}
        <strong>reversible, gated by a key you must possess.</strong> Encrypt a password if you have a
        genuine, audited reason to recover the plaintext later (a password manager has to show you your
        stored password — that is legitimate encryption). A login password almost never needs that
        property, which is exactly why it does not belong in this bucket.
      </p>

      <h2>Hashing: One-Way, By Design</h2>

      <p>
        A cryptographic hash function takes input of any size and produces a fixed-size digest, and —
        unlike the two buckets above — there is no key and no inverse function. Not &quot;the inverse is
        hard to find without a key.&quot; There is no operation, with any input, that turns a SHA-256
        digest back into the string that produced it. That is the entire design goal, covered in depth in
        the next lesson; here is the minimum needed to place it correctly:
      </p>

      <CodeBlock language="javascript" title="There Is No unhash() (Node.js)">
{`const crypto = require('crypto');

const digest = crypto.createHash('sha256').update('hunter2').digest('hex');
console.log(digest);
// f52fbd32b2b3b86ff88ef6c490628285f482af15ddcb29541f94bcf526a3f6c7

console.log(typeof crypto.unhash); // 'undefined' — there is no such function,
                                    // in this library or in mathematics`}
      </CodeBlock>

      <p>
        The only way to find a string that produces a given SHA-256 digest is to guess strings and hash
        each one until you get a match — that is what password cracking <em>is</em>. There is no shortcut,
        no key that unlocks it, no &quot;decrypt with the right password&quot; step. This is precisely why
        hashing is the correct bucket for passwords: the server never needs the original password back, it
        only needs to check that a freshly submitted one hashes to the same value it stored.
      </p>

      <InfoBox variant="warning" title='"We Hashed the Password" — With What?'>
        <p>
          Placing passwords in the hashing bucket is correct. Reaching for <code>SHA-256</code> to do it
          is the second common mistake, and it looks correct enough to survive code review. SHA-256 is a{' '}
          <strong>general-purpose</strong> hash — it is deliberately as fast as possible, which is exactly
          wrong for passwords: a GPU can compute billions of SHA-256 hashes per second, so a stolen table
          of SHA-256 password hashes gets brute-forced fast. Passwords need a hash function engineered to
          be <em>slow</em> — <code>bcrypt</code> or <code>argon2</code>. The full comparison, with runnable
          code, is in the password-hashing section of the next lesson — the point here is only to place
          the mistake: it is not that they picked the wrong bucket, it is that &quot;hash&quot; is not one
          algorithm, and the general-purpose ones are the wrong tool for this specific job.
        </p>
      </InfoBox>

      <h2>Decision Table</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>I need to&hellip;</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Use</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Because</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Put binary data in a JSON field or URL</td>
            <td style={{ padding: '0.75rem' }}><strong>Encoding</strong> (Base64/Base64URL/hex)</td>
            <td style={{ padding: '0.75rem' }}>No secrecy needed — just a safe representation</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Store a value I must show the user again later (API key, card number)</td>
            <td style={{ padding: '0.75rem' }}><strong>Encryption</strong> (AES-256-GCM)</td>
            <td style={{ padding: '0.75rem' }}>Reversible when you hold the key — you need the plaintext back</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Store a login password</td>
            <td style={{ padding: '0.75rem' }}><strong>Hashing</strong> — slow variant (argon2id/bcrypt)</td>
            <td style={{ padding: '0.75rem' }}>Never need the plaintext back; must resist GPU cracking</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Verify a downloaded file was not corrupted or tampered with</td>
            <td style={{ padding: '0.75rem' }}><strong>Hashing</strong> — fast variant (SHA-256)</td>
            <td style={{ padding: '0.75rem' }}>No secret involved, just needs a unique fixed-size fingerprint</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Send session data the client can read but shouldn&apos;t forge</td>
            <td style={{ padding: '0.75rem' }}><strong>Encoding + signature</strong> (JWT)</td>
            <td style={{ padding: '0.75rem' }}>Readable claims (Base64URL) plus a signature nobody but the server can produce</td>
          </tr>
        </tbody>
      </table>

      <p>
        With that vocabulary locked down, the next lesson goes deep on the middle bucket — AES, RSA, ECC,
        and how TLS combines them — and the one after that goes deep on the third.
      </p>

      <InteractiveChallenge
        question={"A teammate says: \"We're storing user passwords Base64-encoded in the database, so they're encrypted.\" What's wrong with this statement?"}
        options={[
          "Nothing — Base64 is a form of encryption",
          "Base64 is encoding, not encryption — it's reversible by anyone with zero secret information, so it provides no confidentiality at all",
          "Base64 should be replaced with hex encoding for better security",
          "The statement is correct as long as the Base64 output is also hashed"
        ]}
        correctIndex={1}
        explanation={"Base64 is encoding: a public, keyless, fully reversible transformation. Anyone who sees the stored value can run it through atob() or Base64.getDecoder() and get the original password back instantly. Encryption requires a key to reverse; encoding requires nothing. Passwords should be hashed with a slow, purpose-built algorithm (argon2id/bcrypt), not encoded or encrypted."}
      />

      <InteractiveChallenge
        question={"Why can't you write an unhash() function that recovers the original input from a SHA-256 digest?"}
        options={[
          "It's technically possible but no one has implemented it yet",
          "SHA-256 requires a private key to reverse, and that key is kept secret by the algorithm's designers",
          "Hashing is a one-way function by design — no key exists to reverse it, and information is lost when many possible inputs map to the same fixed-size output",
          "You can reverse it, but only with a supercomputer"
        ]}
        correctIndex={2}
        explanation={"Hashing has no key at all, in either direction — that's what separates it from encryption. It's designed to be one-way: SHA-256 always produces a 256-bit output regardless of input size, so it can't be a lossless, invertible mapping for inputs longer than 256 bits. The only way to find an input producing a target digest is to guess and check, which is what password cracking is."}
      />
    </LessonLayout>
  );
}
