import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function CryptoMistakes() {
  return (
    <LessonLayout
      title="Common Cryptographic Mistakes"
      sectionId="cryptography"
      lessonIndex={14}
      prev={{ path: '/cryptography/applied-node', label: 'Applied Cryptography — Node & TypeScript' }}
      next={{ path: '/cryptography/cheatsheet', label: '📋 Cheat Sheet' }}
    >
      <p>
        Every mistake below has shipped to production somewhere, more than once. None of them require
        exotic math to understand — they are all failures to respect one rule or another about how a
        primitive is allowed to be used. Each section is a wrong/right pair, and where the failure has a
        visible mechanism, it is demonstrated with real output, not asserted.
      </p>

      <h2>1. ECB Mode Leaks Patterns</h2>

      <p>
        AES is a <em>block</em> cipher — it encrypts one 16-byte block at a time. ECB (Electronic
        Codebook) mode is the &quot;do nothing clever&quot; way to extend that to a longer message: split
        the plaintext into 16-byte blocks and encrypt each one independently with the same key. The bug is
        right there in &quot;independently&quot; — identical plaintext blocks produce identical ciphertext
        blocks, every time, because there is no mechanism linking one block's encryption to the next.
      </p>

      <InfoBox variant="danger" title="Wrong — AES-256-ECB">
        <p>
          Encrypt four repeated 16-byte blocks and look at the ciphertext blocks individually:
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="ECB: Identical Plaintext Blocks -> Identical Ciphertext Blocks (Node.js, verified)">
{`const crypto = require('crypto');

const key = crypto.randomBytes(32); // AES-256
const block = Buffer.from('YELLOW SUBMARINE', 'utf8').subarray(0, 16); // exactly 16 bytes
const plaintext = Buffer.concat([block, block, block, block]); // same block x4

const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
cipher.setAutoPadding(false); // exact multiple of the block size already
const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

for (let i = 0; i < ciphertext.length; i += 16) {
  console.log(ciphertext.subarray(i, i + 16).toString('hex'));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output">
{`248ac1f7a81ee3b9b8ae31b7e0d8da51
248ac1f7a81ee3b9b8ae31b7e0d8da51
248ac1f7a81ee3b9b8ae31b7e0d8da51
248ac1f7a81ee3b9b8ae31b7e0d8da51`}
      </CodeBlock>

      <p>
        All four blocks are byte-for-byte identical, because all four plaintext blocks were identical. An
        attacker who cannot read a single byte of the key still learns that blocks 1, 2, 3, and 4 of the
        plaintext are the same — that is a real information leak, and it is the entire reason ECB-encrypted
        bitmaps famously still show the outline of the original image: uniform regions of pixels become
        uniform regions of ciphertext blocks, so the shape survives encryption. Encrypting the same
        four-block input with AES-256-CBC (random IV, one key, everything else held equal) gives four
        completely different blocks instead — <code>439a187c…</code>, <code>5c13f751…</code>,{' '}
        <code>5bdad831…</code>, <code>65485d2a…</code> — because each block is XORed with the previous
        block's ciphertext before encryption, so repeated input no longer means repeated output.
      </p>

      <InfoBox variant="tip" title="Fix">
        <p>
          Don&apos;t use ECB mode. Ever. There is no legitimate use case for it in application code — use
          an authenticated mode instead, <strong>AES-256-GCM</strong> being the default choice covered
          throughout this section. If you see <code>aes-*-ecb</code> or a cipher call with no IV/nonce
          argument at all, that is the bug, full stop.
        </p>
      </InfoBox>

      <h2>2. Nonce Reuse With GCM Is Catastrophic</h2>

      <p>
        GCM (Galois/Counter Mode) turns AES into a stream cipher: it generates a keystream from the
        key and a nonce (12 bytes, conventionally), then XORs that keystream with the plaintext. The
        security of that construction rests entirely on one guarantee — <strong>the (key, nonce) pair is
        never reused.</strong> Reuse it once and two separate failures happen simultaneously:
      </p>

      <InfoBox variant="danger" title="The Rule">
        <p>
          <strong>Never reuse a nonce with the same key. Not once.</strong> Same key + same nonce means
          the exact same keystream gets generated and XORed into two different messages. That is
          mathematically identical to reusing a one-time pad, and it fails for the same reason a reused OTP
          fails.
        </p>
      </InfoBox>

      <p>
        Encrypt two different messages under the same key <em>and the same nonce</em>, then XOR the two
        ciphertexts together:
      </p>

      <CodeBlock language="javascript" title="Nonce Reuse Breaks Confidentiality (Node.js, verified)">
{`const crypto = require('crypto');

const key = crypto.randomBytes(32);
const nonce = crypto.randomBytes(12); // reused below on purpose — this is the bug

function encrypt(key, nonce, plaintext) {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return ct;
}

const m1 = 'Transfer $100 to Alice';
const m2 = 'Transfer $999 to Mallory';

const ct1 = encrypt(key, nonce, Buffer.from(m1, 'utf8'));
const ct2 = encrypt(key, nonce, Buffer.from(m2, 'utf8'));

const len = Math.min(ct1.length, ct2.length);
const xorCiphertexts = Buffer.alloc(len);
for (let i = 0; i < len; i++) xorCiphertexts[i] = ct1[i] ^ ct2[i];

const p1 = Buffer.from(m1, 'utf8');
const p2 = Buffer.from(m2, 'utf8');
const xorPlaintexts = Buffer.alloc(len);
for (let i = 0; i < len; i++) xorPlaintexts[i] = p1[i] ^ p2[i];

console.log('XOR(ct1, ct2):', xorCiphertexts.toString('hex'));
console.log('XOR(pt1, pt2):', xorPlaintexts.toString('hex'));
console.log('Equal:', xorCiphertexts.equals(xorPlaintexts));`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output">
{`XOR(ct1, ct2): 00000000000000000000080909000000000c0d050f0a
XOR(pt1, pt2): 00000000000000000000080909000000000c0d050f0a
Equal: true`}
      </CodeBlock>

      <p>
        Because the same key and nonce produce the same keystream both times, XORing the two ciphertexts
        together cancels the keystream out completely — the result is exactly the XOR of the two
        plaintexts, with no key required to compute it. An attacker holding two nonce-reused ciphertexts
        already has enough to recover this relationship, and if either plaintext is guessable (padding,
        known headers, boilerplate) the other falls out via classic crib-dragging. That is the
        confidentiality break. The integrity break is separate and just as bad: GCM derives its
        authentication subkey <code>H</code> from encrypting an all-zero block under the same
        keystream, so nonce reuse leaks enough algebraic structure about <code>H</code> that an attacker
        can forge valid authentication tags for messages they never saw encrypted — GCM stops
        authenticating anything once a nonce repeats.
      </p>

      <InfoBox variant="tip" title="Fix — a Fresh Nonce Every Call">
        <p>
          Generate a new random 12-byte nonce for <em>every</em> encryption call and send it alongside the
          ciphertext (it does not need to be secret, only unique-per-key):
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="Fresh Random Nonce Per Message (Node.js, verified)">
{`function encrypt(key, plaintext) {
  const nonce = crypto.randomBytes(12); // NEW nonce every single call
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { nonce, ct, tag }; // ship nonce + tag with the ciphertext
}

// Two calls, two different messages -> two different random nonces:
// nonce1: 33aa13b6b2ec7f6c4a7e5443
// nonce2: 3991511d2fab7d72e340b8ef`}
      </CodeBlock>

      <p>
        With random-per-message nonces, decrypting a message whose ciphertext was flipped by a single bit
        throws immediately instead of silently returning garbage — verified above by flipping the first
        byte of a valid ciphertext and calling <code>decipher.final()</code>, which threw{' '}
        <code>Unsupported state or unable to authenticate data</code> rather than returning anything.
        With a 12-byte random nonce, the birthday-bound collision risk is negligible for any reasonable
        per-key message volume; if a single key legitimately needs to encrypt billions of messages,
        switch to a counter-based nonce construction instead of trusting randomness at that volume — that
        is an edge case, not the default concern.
      </p>

      <h2>3. Padding Oracle Attacks</h2>

      <p>
        This one is specific to CBC mode with PKCS7 padding — GCM is not affected, for reasons that fall
        out of the mechanism itself. PKCS7 padding pads a message out to a multiple of the block size by
        appending N bytes, each with value N (e.g. three bytes needed -&gt; append{' '}
        <code>0x03 0x03 0x03</code>). Decryption reverses this by decrypting, then reading the last byte
        to know how many trailing bytes to strip — and rejecting the input if that padding does not
        parse as valid.
      </p>

      <p>
        The mistake is exposing <em>whether that padding check passed</em> as observable behavior — a
        distinct error message, a different HTTP status code, even a measurably different response time.
        An attacker who can submit arbitrary ciphertext and observe only &quot;padding was valid&quot; vs
        &quot;padding was invalid&quot; can decrypt the entire message byte-by-byte without ever knowing
        the key, by manipulating the previous ciphertext block and using the oracle's yes/no answer as a
        one-bit-per-query side channel (Vaudenay's 2002 attack; it is what POODLE and Lucky13 exploited in
        the wild against TLS). Here is the actual asymmetry that creates the oracle, produced by tampering
        with a real CBC ciphertext in two different places:
      </p>

      <CodeBlock language="javascript" title="Where the Oracle Comes From (Node.js, verified)">
{`// ct = AES-256-CBC(key, iv, 'this is some plaintext!!'), auto-padded, 32 bytes long

// Case 1: flip a byte in the FIRST block. That scrambles the first block's
// plaintext, but the padding lives in the LAST block, which is untouched --
// so PKCS7 unpadding still succeeds, and decrypt() returns garbage silently.
tamperedEarly[0] ^= 0xff;
decryptCBC(tamperedEarly);
// -> NO ERROR, garbage content: "oxÄæDö-ãäD\\u000fµVntext!!"

// Case 2: flip a byte in the SECOND-TO-LAST block. In CBC each plaintext
// block is XORed with the previous CIPHERTEXT block after decryption, so
// flipping ct[15] here lands directly on the padding LENGTH byte of the
// final plaintext block -- PKCS7 unpadding then fails.
// (Flipping the very last byte also throws, but for a different reason:
//  it changes the block-cipher input and scrambles all 16 bytes of P2.
//  It is the XOR-with-previous-block path that the real attack drives.)
tamperedLastByte[15] ^= 0xff;
decryptCBC(tamperedLastByte);
// -> throws: error:1C800064:Provider routines::bad decrypt`}
      </CodeBlock>

      <p>
        Case 1 and Case 2 tamper with the same ciphertext by the same amount (one flipped byte) and both
        produce meaningless plaintext — but only one of them throws. If that distinction is visible to
        the caller in any form, it <em>is</em> the oracle. GCM has no separate padding-check step to leak
        in the first place: it is an authenticated stream construction, so any tampering — anywhere in the
        ciphertext — fails the same single authentication check with the same single error, which is
        exactly what we saw for the flipped byte in the nonce-reuse fix above.
      </p>

      <InfoBox variant="tip" title="Fix">
        <p>
          Use an authenticated mode (AES-256-GCM) so there is no padding-validity signal to leak. If you
          are stuck maintaining CBC for compatibility reasons, add an HMAC over the ciphertext
          (encrypt-then-MAC) and verify the MAC <em>before</em> attempting to decrypt or unpad, returning
          one identical generic error for every failure — no padding-specific branch, no distinguishable
          timing, no distinguishable message.
        </p>
      </InfoBox>

      <h2>4. Timing Attacks on Comparison</h2>

      <p>
        <code>===</code> in JavaScript and <code>.equals()</code> in Java both compare byte-by-byte and{' '}
        <strong>return as soon as they find a mismatch.</strong> That is a reasonable, desirable
        optimization for ordinary code — it is a bug when the two values being compared are a secret
        (an HMAC signature, an API key, a session token) and an attacker-supplied guess. A comparison that
        returns faster for &quot;first byte wrong&quot; than for &quot;first 30 bytes right, byte 31
        wrong&quot; leaks the secret one byte at a time to anyone who can measure response time precisely
        enough and repeat the request — this is a real, practically exploited attack class, not a
        theoretical one.
      </p>

      <p>
        The fix is a <em>constant-time</em> comparison: one that always inspects every byte of both
        inputs and only reveals equal/not-equal at the end, so elapsed time carries no information about
        <em> where</em> the first mismatch was. Both platforms ship one:
      </p>

      <CodeBlock language="javascript" title="crypto.timingSafeEqual (Node.js, verified)">
{`const crypto = require('crypto');

const a = Buffer.from('secret-token-abc123', 'utf8');
const b = Buffer.from('secret-token-abc123', 'utf8');
const c = Buffer.from('secret-token-xyz999', 'utf8');

crypto.timingSafeEqual(a, b); // true
crypto.timingSafeEqual(a, c); // false

// Gotcha: it throws if the lengths differ -- it refuses to compare, rather
// than silently returning false, so you can't leak length via a caught error either
crypto.timingSafeEqual(Buffer.from('short'), Buffer.from('a longer buffer'));
// -> throws: "Input buffers must have the same byte length"`}
      </CodeBlock>

      <CodeBlock language="java" title="MessageDigest.isEqual (Java, verified — JDK 26)">
{`import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

byte[] a = "secret-token-abc123".getBytes(StandardCharsets.UTF_8);
byte[] b = "secret-token-abc123".getBytes(StandardCharsets.UTF_8);
byte[] c = "secret-token-xyz999".getBytes(StandardCharsets.UTF_8);

MessageDigest.isEqual(a, b); // true
MessageDigest.isEqual(a, c); // false

// Different from Node: mismatched lengths return false instead of throwing --
// still safe (no branch on content), just a different API contract to know about
byte[] shortArr = "short".getBytes(StandardCharsets.UTF_8);
byte[] longArr = "a much longer buffer here".getBytes(StandardCharsets.UTF_8);
MessageDigest.isEqual(shortArr, longArr); // false, no exception`}
      </CodeBlock>

      <p>
        Both calls above were run for real, not just read from documentation — same equal/not-equal
        results as <code>===</code>/<code>.equals()</code> would give, but without the short-circuit
        timing leak. The one behavioral difference worth remembering: Node throws on a length mismatch,
        Java's <code>MessageDigest.isEqual</code> returns <code>false</code>. Either is safe against the
        timing attack; only Node's version forces you to handle mismatched-length inputs as a distinct
        code path.
      </p>

      <InfoBox variant="warning" title="This Only Matters for Secret-vs-Guess Comparisons">
        <p>
          Comparing two non-secret strings — a username, a public ID — gets no benefit from a
          constant-time function and it is not worth the (tiny) overhead. Reach for{' '}
          <code>timingSafeEqual</code>/<code>MessageDigest.isEqual</code> specifically when one side of
          the comparison is a secret an attacker is trying to guess: HMAC signatures, API keys, CSRF
          tokens, password reset tokens, session identifiers.
        </p>
      </InfoBox>

      <h2>5. Hardcoded Keys in Source Control</h2>

      <p>
        A key or secret committed to a git repository is compromised the moment it is pushed, full stop —
        it is in every clone, every fork, every CI log that ever checked the branch out, and rewriting
        history after the fact does not un-leak it from anywhere it was already cloned. This is still one
        of the most common findings in real security audits, and it keeps happening because it is the path
        of least resistance during a quick prototype that later ships unchanged.
      </p>

      <InfoBox variant="tip" title="Fix">
        <p>
          Load keys from environment variables or a secrets manager (AWS Secrets Manager, HashiCorp Vault,
          GCP Secret Manager) at runtime, never from a literal in source — key management, rotation, and
          storage strategy in depth is its own lesson elsewhere in this section, so this is deliberately
          the one-paragraph version.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"ECB mode and GCM nonce reuse both leak information about the plaintext without ever exposing the key. What's the actual difference in what each one leaks?"}
        options={[
          "There is no real difference — both are just \"weak encryption\" in roughly the same way",
          "ECB leaks a structural pattern (which blocks of plaintext repeat, visible in any single message) because identical blocks always produce identical ciphertext under one key; GCM nonce reuse leaks the literal XOR of two plaintexts, because the same (key, nonce) regenerates the same keystream for both messages, canceling it out when the ciphertexts are XORed together",
          "ECB is only a performance problem, not a security one; nonce reuse is the only real vulnerability of the two",
          "Both failures require the attacker to already know the encryption key before either leak becomes exploitable"
        ]}
        correctIndex={1}
        explanation={"They're both \"repetition breaks the guarantee,\" but at different levels. ECB's leak is structural and needs only ONE message: because every block is encrypted independently with no chaining, identical plaintext blocks always produce identical ciphertext blocks — that's why an ECB-encrypted bitmap still shows the outline of the original image, no second message required. GCM nonce reuse needs TWO messages under the same (key, nonce): the demo above showed that XORing the two ciphertexts together exactly reproduces XOR(plaintext1, plaintext2), because the identical keystream cancels out — no key needed to compute it. Different mechanism, same underlying lesson: a cipher's security guarantees hold only under the exact usage rules (unique blocks-worth-of-chaining for CBC/GCM's design, unique nonces for GCM) — break the rule and the guarantee doesn't degrade gracefully, it disappears."}
      />
    </LessonLayout>
  );
}
