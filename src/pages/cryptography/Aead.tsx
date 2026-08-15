import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function CryptoAead() {
  return (
    <LessonLayout
      title="Authenticated Encryption (AEAD)"
      sectionId="cryptography"
      lessonIndex={3}
      prev={{ path: '/cryptography/hashing', label: 'Hashing & Data Integrity' }}
      next={{ path: '/cryptography/signatures', label: 'Digital Signatures' }}
    >
      <p>
        &quot;Algorithms that combine encryption and hashing&quot; is exactly the right instinct, and it
        deserves a precise name: <strong>AEAD</strong>, Authenticated Encryption with Associated Data.
        The previous two lessons covered encryption (confidentiality — nobody without the key can read
        it) and hashing plus HMAC (integrity and authentication — nobody can tamper with it undetected)
        as separate primitives. AEAD is what happens when a construction delivers{' '}
        <strong>both properties from one operation</strong>, rather than gluing two separate primitives
        together by hand. That last clause is not a minor implementation detail — it is the entire
        history of this topic, because &quot;gluing them together by hand&quot; has three possible
        orderings, and real protocols have shipped all three, and only one of them turned out to be safe.
      </p>

      <h2>Three Ways to Combine a Cipher and a MAC</h2>

      <p>
        Bellare and Namprempre&apos;s 2000 paper on generic composition analyzed exactly this question —
        given a symmetric cipher and a MAC, in what order do you apply them? — and identified three
        candidate compositions. Two of them are unsafe in general, and history has concrete incidents
        attached to both.
      </p>

      <InfoBox variant="info" title="Encrypt-and-MAC (E&amp;M) — SSH's Original Approach">
        <p>
          Compute the MAC over the <em>plaintext</em>, encrypt the plaintext separately, and send both.
          SSH&apos;s binary packet protocol (RFC 4253) does exactly this: the MAC covers the plaintext
          payload and sequence number and is transmitted <em>unencrypted</em>, appended after the
          separately encrypted payload. The weakness Bellare, Kohno, and Namprempre demonstrated in their
          SSH-specific follow-up (&quot;Breaking and Provably Repairing the SSH Authenticated Encryption
          Scheme&quot;) is that a MAC computed over plaintext is not obligated to hide anything about that
          plaintext — some MAC constructions leak partial information through the tag itself, even though
          the payload sitting next to it is encrypted. The confidentiality guarantee of the whole
          construction now depends on a property most MACs were never designed to provide.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="MAC-then-Encrypt (MtE) — Classic TLS CBC Suites">
        <p>
          Compute the MAC over the plaintext, append it, pad to the block size, then encrypt the whole
          thing with CBC. This is what TLS&apos;s older CBC cipher suites did, and it puts the padding{' '}
          <em>inside</em> the ciphertext — so the receiver must decrypt first and check padding validity
          before it can even get to the MAC. How long that padding check takes, or what error it produces,
          becomes a side channel. Serge Vaudenay described the general padding-oracle attack in 2002;
          Nadhem AlFardan and Kenny Paterson turned it into <strong>Lucky Thirteen</strong> in February
          2013 — a timing side-channel specifically against TLS and DTLS&apos;s CBC MAC-then-Encrypt
          construction, needing roughly 2<sup>23</sup> sessions under realistic conditions (as few as
          2<sup>13</sup> per byte under ideal ones). The name comes from the 13 bytes of TLS header
          (5-byte record header plus 8-byte sequence number) folded into the MAC computation, which is
          what makes the timing math work out the way it does. All CBC-mode TLS/DTLS ciphersuites were
          potentially exposed, including compliant TLS 1.1, TLS 1.2, and DTLS implementations.
        </p>
      </InfoBox>

      <InfoBox variant="success" title="Encrypt-then-MAC (EtM) — The Safe One">
        <p>
          Encrypt the plaintext first, then compute the MAC over the <em>ciphertext</em>. A tampered
          ciphertext now fails the MAC check before decryption ever runs — there is no padding-oracle
          window to time, because the receiver never gets far enough to look at padding. Bellare and
          Namprempre proved this composition is secure regardless of which specific IND-CPA-secure cipher
          and unforgeable MAC you plug into it, which is not true of the other two orderings — this is why
          it is described as <em>generically</em> safe rather than safe only for particular algorithm
          choices. TLS eventually added it as an option for CBC suites via the Encrypt-then-MAC extension
          (RFC 7366, 2014), and IPsec&apos;s ESP uses Encrypt-then-MAC by default. By the time RFC 7366
          shipped, though, GCM-based AEAD suites were already taking over — because they sidestep the
          ordering question entirely.
        </p>
      </InfoBox>

      <h2>Modern AEAD: One Step, Not Three Choices</h2>

      <p>
        AES-GCM and ChaCha20-Poly1305 do not ask an implementer to pick an ordering at all. Encryption and
        authentication happen inside a <strong>single primitive</strong>: one call produces ciphertext and
        an authentication tag together, and decryption checks the tag and produces plaintext together.
        There is no separate &quot;now MAC it&quot; step where someone could reach for MAC-then-Encrypt out
        of habit, because the API never exposes that step. This is precisely why TLS 1.3 (RFC 8446, 2018)
        removed every non-AEAD cipher suite outright — its entire cipher suite list is five entries, all
        AEAD (<code>TLS_AES_128_GCM_SHA256</code>, <code>TLS_AES_256_GCM_SHA384</code>,{' '}
        <code>TLS_CHACHA20_POLY1305_SHA256</code>, and two AES-CCM variants) — and CBC mode is not an
        option in TLS 1.3 at all. There is nothing left to compose incorrectly.
      </p>

      <h2>Watching It Actually Enforce Integrity</h2>

      <p>
        &quot;Decryption fails if the ciphertext was tampered with&quot; is easy to state and easy to
        take on faith. Here it is happening for real: encrypt a message with AES-256-GCM, flip a single
        bit in the ciphertext, and try to decrypt.
      </p>

      <CodeBlock language="javascript" title="AES-256-GCM — Encrypt, Tamper, Watch Decryption Fail (Node.js)">
{`const crypto = require('crypto');

const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(12);

const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let ciphertext = cipher.update('Transfer $100 to Alice', 'utf8', 'hex');
ciphertext += cipher.final('hex');
const authTag = cipher.getAuthTag();

console.log('ciphertext:', ciphertext);
// ciphertext: a4a0d3e09088274d9a9451fa05ec7ad9fc4a3c90865d
console.log('authTag:', authTag.toString('hex'));
// authTag: 6a841ebc9af36ccdf8bef32182bcafb1 -- 16 bytes, kept separate from the ciphertext

// Decrypting with the untouched ciphertext + tag round-trips normally
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher.setAuthTag(authTag);
let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
plaintext += decipher.final('utf8');
console.log('decrypted:', plaintext);
// decrypted: Transfer $100 to Alice

// Flip a single bit in the ciphertext. Nothing touches the tag.
const buf = Buffer.from(ciphertext, 'hex');
buf[0] ^= 0x01;
const tamperedCiphertext = buf.toString('hex');

const decipher2 = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher2.setAuthTag(authTag);
const provisional = decipher2.update(tamperedCiphertext, 'hex', 'utf8');
console.log('provisional output from update(), before the tag is checked:', provisional);
// provisional output from update(), before the tag is checked: Uransfer $100 to Alice
// -- flipping bit 0 of ciphertext byte 0 flipped 'T' to 'U'. update() already handed
// this back. The tag hasn't been checked yet -- that happens in final().

decipher2.final('utf8'); // <-- throws here, real error below`}
      </CodeBlock>

      <InfoBox variant="danger" title="The Real Node.js Exception">
        <p>
          <code>Error: Unsupported state or unable to authenticate data</code>
        </p>
        <p>
          Thrown from <code>Decipheriv.final()</code>, not <code>update()</code>. That ordering is not
          cosmetic: GCM cannot verify the tag until it has processed the entire ciphertext, so Node&apos;s
          streaming API hands back <em>provisional</em> plaintext from <code>update()</code> — as shown
          above, the corrupted &quot;Uransfer $100 to Alice&quot; came back before the throw — and only
          confirms it was legitimate when <code>final()</code> returns without throwing. Code that streams{' '}
          <code>update()</code> output onward (to a socket, to disk, to a log) before checking that{' '}
          <code>final()</code> succeeded can leak tampered plaintext despite GCM correctly detecting the
          tampering a moment later.
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Same Thing in Java — AES/GCM/NoPadding">
{`import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.security.SecureRandom;
import java.util.HexFormat;

public class GcmTamper {
    public static void main(String[] args) throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256);
        SecretKey key = keyGen.generateKey();

        byte[] iv = new byte[12];
        new SecureRandom().nextBytes(iv);
        GCMParameterSpec spec = new GCMParameterSpec(128, iv);

        Cipher encryptCipher = Cipher.getInstance("AES/GCM/NoPadding");
        encryptCipher.init(Cipher.ENCRYPT_MODE, key, spec);
        byte[] ciphertextWithTag = encryptCipher.doFinal("Transfer $100 to Alice".getBytes("UTF-8"));
        // Java appends the 16-byte tag onto the ciphertext -- no separate getAuthTag() call
        System.out.println(HexFormat.of().formatHex(ciphertextWithTag));
        // beda3dd9d994c2813c7d9fc3490fe647f4085c2341db2a89ae9d54483d717cf368e25e29d767
        System.out.println(ciphertextWithTag.length + " bytes (22 plaintext + 16 tag = 38)");

        Cipher decryptCipher = Cipher.getInstance("AES/GCM/NoPadding");
        decryptCipher.init(Cipher.DECRYPT_MODE, key, spec);
        System.out.println(new String(decryptCipher.doFinal(ciphertextWithTag), "UTF-8"));
        // Transfer $100 to Alice

        byte[] tampered = ciphertextWithTag.clone();
        tampered[0] ^= 0x01;

        // Unlike Node, javax.crypto's GCM buffers everything internally --
        // update() on tampered ciphertext returns 0 bytes, not a provisional guess.
        Cipher decryptCipher2 = Cipher.getInstance("AES/GCM/NoPadding");
        decryptCipher2.init(Cipher.DECRYPT_MODE, key, spec);
        byte[] provisional = decryptCipher2.update(tampered);
        System.out.println("update() returned: " + provisional.length + " bytes");
        // update() returned: 0 bytes

        decryptCipher2.doFinal(); // <-- throws here, real exception below
    }
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="The Real Java Exception">
        <p>
          <code>javax.crypto.AEADBadTagException: Tag mismatch</code>
        </p>
        <p>
          Same security property as Node — a single flipped ciphertext bit is unrecoverably detected, no
          plaintext is returned — but a stricter buffering strategy. Java&apos;s <code>Cipher.update()</code>{' '}
          for <code>AES/GCM/NoPadding</code> withholds output entirely until <code>doFinal()</code> both
          decrypts and verifies the tag, so there is no provisional-plaintext window to worry about the way
          there is in Node&apos;s streaming API. Different implementation strategy, identical guarantee:
          nothing usable comes out unless the tag checks out.
        </p>
      </InfoBox>

      <h2>Key Takeaways</h2>

      <InfoBox variant="tip" title="Remember These">
        <p><strong>AEAD</strong>: confidentiality + integrity from one construction, not two primitives glued together by hand.</p>
        <p><strong>Encrypt-and-MAC</strong> (SSH): MAC covers plaintext, can leak information about it. Not generically safe.</p>
        <p><strong>MAC-then-Encrypt</strong> (old TLS CBC): padding sits inside the ciphertext, creating the padding-oracle family — Vaudenay 2002, Lucky Thirteen 2013. Not generically safe.</p>
        <p><strong>Encrypt-then-MAC</strong>: MAC covers ciphertext, tampering is rejected before decryption runs. Proven generically safe by Bellare–Namprempre (2000).</p>
        <p><strong>Modern AEAD</strong> (AES-GCM, ChaCha20-Poly1305): does Encrypt-then-MAC&apos;s job as one atomic operation. TLS 1.3&apos;s only cipher suites are AEAD; CBC is gone entirely.</p>
        <p><strong>Verified above</strong>: flip one ciphertext bit, decryption throws — <code>Unsupported state or unable to authenticate data</code> in Node, <code>AEADBadTagException: Tag mismatch</code> in Java. Trust only output from after the final call succeeds, not from intermediate <code>update()</code> calls.</p>
      </InfoBox>

      <p>
        AEAD proves a message came from someone holding a <em>shared</em> secret key — the same key
        verifies and forges. That is fine between two parties who already trust each other with one key,
        but it cannot answer &quot;prove to a third party, who was never given any secret, that this
        specific person signed this.&quot; That is what asymmetric digital signatures are for, and it is
        where the next lesson picks up.
      </p>

      <InteractiveChallenge
        question={"Why was TLS's old CBC-mode MAC-then-Encrypt construction vulnerable to attacks like Lucky Thirteen, while Encrypt-then-MAC is not?"}
        options={[
          "MAC-then-Encrypt uses a weaker MAC algorithm than Encrypt-then-MAC",
          "In MAC-then-Encrypt, padding is inside the ciphertext, so the receiver must decrypt and check padding before reaching the MAC -- the timing of that check leaks information. Encrypt-then-MAC rejects tampered ciphertext via the MAC before decryption ever runs",
          "MAC-then-Encrypt only works with RSA, which is inherently insecure",
          "Encrypt-then-MAC uses a longer key, making brute-force attacks infeasible"
        ]}
        correctIndex={1}
        explanation={"MAC-then-Encrypt (plaintext + MAC, then encrypt the whole thing with CBC) buries the padding inside the ciphertext, so decryption -- and a padding-validity check -- has to happen before the MAC can even be checked. How long that takes is a timing side channel; Lucky Thirteen (AlFardan & Paterson, 2013) turned it into a practical attack against TLS/DTLS. Encrypt-then-MAC computes the MAC over the ciphertext, so a tampered ciphertext is rejected before decryption runs at all -- no padding oracle exists to time. Bellare and Namprempre proved in 2000 that only Encrypt-then-MAC is generically safe regardless of which specific cipher and MAC are plugged in."}
      />

      <InteractiveChallenge
        question={"In the AES-256-GCM demo above, Node's decipher.update() returned a provisional (and wrong) plaintext before final() threw, while Java's Cipher.update() returned 0 bytes for the same tampered input. What's the practical lesson?"}
        options={[
          "Java's AES-GCM implementation is broken and should not be used",
          "Node's AES-GCM implementation is insecure because it returns data before verifying the tag",
          "Both implementations ultimately reject the tampered ciphertext with the same security guarantee -- but code that acts on streaming update() output before the final call succeeds can be exposed to unverified data, depending on the library's buffering strategy",
          "GCM mode cannot detect single-bit tampering reliably, which is why both languages behave differently"
        ]}
        correctIndex={2}
        explanation={"Both implementations correctly reject the tampered ciphertext -- Node throws in final(), Java throws in doFinal() -- so the security guarantee is identical. The difference is purely a buffering strategy: GCM can't verify the tag until it has seen the whole ciphertext, so any implementation that streams plaintext out via update() before that point is, by construction, handing back data it hasn't verified yet. Node does this and Java doesn't for this particular API, which is exactly why code should only trust output once the final call (final()/doFinal()) has returned successfully, never mid-stream."}
      />
    </LessonLayout>
  );
}
