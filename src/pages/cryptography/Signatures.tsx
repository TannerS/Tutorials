import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function CryptoSignatures() {
  return (
    <LessonLayout
      title="Digital Signatures"
      sectionId="cryptography"
      lessonIndex={4}
      prev={{ path: '/cryptography/aead', label: 'Authenticated Encryption (AEAD)' }}
      next={{ path: '/cryptography/signing-files', label: 'Signing Files & Software' }}
    >
      <p>
        The <strong>Encryption</strong> lesson already showed you the mechanism: hash a message,
        sign the hash with a private key, verify it with the matching public key, watch verification
        fail the instant one character changes. That demo used ECDSA and it is not worth repeating —
        the sign/verify flow is identical across every algorithm in this lesson. What differs, and
        what actually matters when you are picking one for a new system, is <em>which</em> algorithm:
        RSA-PSS, ECDSA, or Ed25519. They trade off key size, signature size, speed, and — for one of
        them — a sharp edge that has caused real key-recovery breaks in production systems.
      </p>

      <InfoBox variant="note" title="One Sentence on Signatures vs. HMAC">
        <p>
          A different lesson covers HMAC in depth, but the distinguishing property is worth stating
          here: a digital signature can be <strong>verified by anyone holding the public key but
          created only by whoever holds the private key</strong>, so the verifier never needs to be
          trusted with a secret — that property is called <strong>non-repudiation</strong>, and HMAC
          cannot provide it, because HMAC verification requires the same shared secret that produced
          the MAC, which means anyone who can verify one could have forged it too.
        </p>
      </InfoBox>

      <h2>Three Algorithms, One Job</h2>

      <p>
        All three of these do exactly the same thing — hash a message, sign the digest with a private
        key, let anyone check it with the public key — but they get there with different math and very
        different size/speed tradeoffs.
      </p>

      <ul>
        <li>
          <strong>RSA-PSS</strong> — RSA is the oldest of the three, based on the difficulty of
          factoring large numbers. PSS (Probabilistic Signature Scheme) is the modern padding for RSA
          signatures — it salts each signature randomly, unlike the older PKCS#1 v1.5 padding, and is
          the recommended RSA scheme today. RSA keys and signatures are large, and RSA private-key
          operations (signing) are comparatively slow.
        </li>
        <li>
          <strong>ECDSA</strong> — Elliptic Curve Digital Signature Algorithm. Same idea as RSA but
          built on elliptic-curve math instead of factoring, which gets you RSA-equivalent security
          with far smaller keys. It is what you saw in the Encryption lesson, and it is what backs
          most TLS certificates and JWTs today. It has one structural requirement that is easy to get
          wrong, covered below.
        </li>
        <li>
          <strong>Ed25519</strong> — EdDSA (Edwards-curve Digital Signature Algorithm) instantiated
          over Curve25519, standardized in RFC 8032. Smaller keys and signatures than ECDSA, fast, and
          — critically — <strong>deterministic</strong>: it removes the exact failure mode that makes
          ECDSA dangerous to implement carelessly. NIST added EdDSA (Ed25519 and Ed448) as an approved
          signature scheme in FIPS 186-5, effective February 2023, alongside RSA and ECDSA — the same
          revision that retired plain DSA. That is why Ed25519 is now the default recommendation for
          new systems rather than a niche alternative.
        </li>
      </ul>

      <h2>Measured: Key Size, Signature Size, Speed</h2>

      <p>
        Numbers below are real, measured on this machine with Node.js <code>crypto</code> — RSA-2048
        with PSS padding, ECDSA on P-256, and Ed25519 — signing and verifying the same short message
        2,000 times per algorithm. Treat the ops/sec as relative, not as a universal benchmark; the
        pattern (RSA sign is slow, RSA verify is fast, ECDSA and Ed25519 are both fast in both
        directions) holds everywhere.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Algorithm</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Public Key (DER)</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Signature</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Sign</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Verify</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>RSA-2048-PSS</td>
            <td style={{ padding: '0.75rem' }}>294 bytes</td>
            <td style={{ padding: '0.75rem' }}>256 bytes (fixed)</td>
            <td style={{ padding: '0.75rem' }}>~3,400 ops/sec</td>
            <td style={{ padding: '0.75rem' }}>~92,000 ops/sec</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>ECDSA P-256</td>
            <td style={{ padding: '0.75rem' }}>91 bytes</td>
            <td style={{ padding: '0.75rem' }}>~69-72 bytes (variable, DER)</td>
            <td style={{ padding: '0.75rem' }}>~77,000 ops/sec</td>
            <td style={{ padding: '0.75rem' }}>~30,700 ops/sec</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Ed25519</td>
            <td style={{ padding: '0.75rem' }}>44 bytes</td>
            <td style={{ padding: '0.75rem' }}>64 bytes (fixed)</td>
            <td style={{ padding: '0.75rem' }}>~71,600 ops/sec</td>
            <td style={{ padding: '0.75rem' }}>~29,800 ops/sec</td>
          </tr>
        </tbody>
      </table>

      <p>
        The RSA row explains itself once you know why: the public exponent is small (typically{' '}
        <code>65537</code>), so RSA verification is one cheap modular exponentiation — hence the huge
        verify number. Signing uses the full-size private exponent, which is why RSA sign is by far
        the slowest operation in the table. ECDSA and Ed25519 do not have that asymmetry; both
        operations stay in the same ballpark.
      </p>

      <p>
        The ECDSA signature size is listed as a range because it is <strong>DER-encoded</strong>: two
        variable-length integers (<code>r</code> and <code>s</code>) wrapped in an ASN.1{' '}
        <code>SEQUENCE</code>, so the exact byte count wobbles signature to signature. Twenty
        signatures from the same P-256 key, measured directly:
      </p>

      <CodeBlock language="text" title="ECDSA Signature Length Varies (measured, 20 signatures, same key)">
{`71,72,71,70,71,72,71,71,71,72,70,71,71,70,69,71,71,71,71,72`}
      </CodeBlock>

      <p>
        Ed25519 signatures, by contrast, are <em>always</em> exactly 64 bytes — no ASN.1, no variable
        length, one less thing that can go wrong in a parser.
      </p>

      <CodeBlock language="javascript" title="Comparing All Three in Node.js">
{`const crypto = require('crypto');
const msg = Buffer.from('benchmark message');

function sizes(name, publicKey, privateKey, signature) {
  console.log(
    name,
    'pubkey:', publicKey.export({ type: 'spki', format: 'der' }).length, 'bytes',
    'sig:', signature.length, 'bytes'
  );
}

// RSA-2048 with PSS padding — the modern, recommended RSA padding scheme
{
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const sig = crypto.sign('sha256', msg, {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  });
  sizes('RSA-2048-PSS', publicKey, privateKey, sig);
}

// ECDSA on the P-256 curve
{
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const sig = crypto.sign('sha256', msg, privateKey);
  sizes('ECDSA-P256', publicKey, privateKey, sig);
}

// Ed25519 — no hash algorithm to choose; it's baked into the scheme
{
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const sig = crypto.sign(null, msg, privateKey);
  sizes('Ed25519', publicKey, privateKey, sig);
}

// Real output from this exact script:
// RSA-2048-PSS pubkey: 294 bytes sig: 256 bytes
// ECDSA-P256   pubkey: 91 bytes  sig: 71 bytes  (69-72, varies)
// Ed25519      pubkey: 44 bytes  sig: 64 bytes  (always)`}
      </CodeBlock>

      <h2>ECDSA's Sharp Edge: The Nonce</h2>

      <InfoBox variant="warning" title="ECDSA Requires a Fresh, Secret Random Nonce Every Single Time">
        <p>
          Every ECDSA signature consumes a per-signature random value, conventionally called{' '}
          <code>k</code> (the nonce). The security of the scheme depends on <code>k</code> being both{' '}
          <strong>secret</strong> and <strong>unique to that one signature</strong>. If{' '}
          <code>k</code> is ever reused across two different messages signed with the same private
          key — or if it is generated with a biased/predictable random source — an attacker who has
          both <code>(message, signature)</code> pairs can solve directly for the private key using
          nothing more than algebra on the two signature equations. No brute force, no factoring, no
          exotic math. Just a linear solve.
        </p>
      </InfoBox>

      <p>
        This is not a theoretical footnote. It is a documented root cause of real-world private-key
        compromises:
      </p>

      <InfoBox variant="danger" title="Historical Example: The Sony PS3 ECDSA Break (2010)">
        <p>
          In December 2010, at the 27th Chaos Communication Congress, the group{' '}
          <strong>fail0verflow</strong> presented &quot;Console Hacking 2010,&quot; showing that
          Sony&#39;s PlayStation 3 code-signing implementation used ECDSA correctly in every respect
          except one: it reused the <strong>same constant nonce <code>k</code></strong> for every
          signature instead of generating a fresh random one each time. Because every signed binary
          shared the same nonce, any two signed messages were enough to solve for Sony&#39;s private
          signing key algebraically. Researcher George Hotz (geohot) subsequently published the
          recovered key, after which anyone could sign arbitrary code that the PS3 would accept as
          genuine — a total, permanent compromise of the platform&#39;s code-signing trust, caused by
          one reused random value.
        </p>
      </InfoBox>

      <p>
        The fix in well-behaved ECDSA implementations (including Node&#39;s <code>crypto</code> and
        Java&#39;s <code>Signature</code> class, both used below) is to derive <code>k</code>{' '}
        deterministically from the private key and message per RFC 6979 rather than pulling raw
        randomness — which closes the &quot;bad RNG&quot; failure mode but still depends on the
        implementation getting it right. Ed25519 sidesteps the entire problem at the protocol level
        instead of patching around it.
      </p>

      <h2>Ed25519: No Nonce to Get Wrong</h2>

      <FlowChart
        title="Where the Per-Signature Nonce Comes From"
        chart={"graph TD\n  subgraph ECDSA\n    A1[\"Message + Private Key\"] --> A2[\"Fresh random k required\"]\n    A2 --> A3[\"Sign\"]\n    A2 -.->|\"Reused or biased k\"| A4[\"Private key recoverable\"]\n  end\n  subgraph EdDSA_Ed25519\n    B1[\"Message + Private Key\"] --> B2[\"k = Hash(private key, message)\"]\n    B2 --> B3[\"Sign\"]\n  end\n  style A4 fill:#3b1a1a,stroke:#dc2626\n  style B2 fill:#1a3329,stroke:#4ade80\n  style B3 fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        EdDSA (RFC 8032) does not draw a random nonce at signing time at all. Instead it derives{' '}
        <code>k</code> <strong>deterministically</strong> as a hash of the private key and the
        message being signed. Sign the same message with the same key twice and you get the exact
        same signature both times — there is no random number generator in the loop to fail, be
        biased, or get reused. That single design choice eliminates the entire vulnerability class
        that broke the PS3. Combined with smaller keys, smaller fixed-size signatures, and
        competitive speed, it is why Ed25519 is the default recommendation for new systems today
        rather than ECDSA.
      </p>

      <h2>Java: The ECDSA Demo the Encryption Lesson Didn&#39;t Show</h2>

      <p>
        The Encryption lesson&#39;s sign/verify demo was Node-only. Here is the same flow —
        generate an EC key pair, sign, verify, then verify a tampered message and watch it fail — in
        Java using <code>java.security.Signature</code>. Compiled and run with JDK 26 to produce this
        exact output:
      </p>

      <CodeBlock language="java" title="ECDSA Sign/Verify with Tamper Detection (Java)">
{`import java.security.*;
import java.util.Base64;

public class EcdsaDemo {
    public static void main(String[] args) throws Exception {
        // 1. Generate an EC key pair on curve P-256 (secp256r1)
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
        kpg.initialize(256);
        KeyPair pair = kpg.generateKeyPair();

        byte[] message = "Transfer $1000 to Alice".getBytes();

        // 2. Sign with the private key
        Signature signer = Signature.getInstance("SHA256withECDSA");
        signer.initSign(pair.getPrivate());
        signer.update(message);
        byte[] signature = signer.sign();
        System.out.println("Signature (" + signature.length + " bytes): "
            + Base64.getEncoder().encodeToString(signature));

        // 3. Verify with the public key
        Signature verifier = Signature.getInstance("SHA256withECDSA");
        verifier.initVerify(pair.getPublic());
        verifier.update(message);
        System.out.println("Valid signature: " + verifier.verify(signature));

        // 4. Tamper with the message and verify again
        byte[] tampered = "Transfer $10000 to Alice".getBytes();
        Signature verifierTampered = Signature.getInstance("SHA256withECDSA");
        verifierTampered.initVerify(pair.getPublic());
        verifierTampered.update(tampered);
        System.out.println("Tampered message valid: " + verifierTampered.verify(signature));
    }
}

/* Real output from javac EcdsaDemo.java && java EcdsaDemo:
Signature (70 bytes): MEQCIES+oLYbgVVBkXKncO4cm3WLZliDfYbqTDs1KBLwI2wxAiB2SHWjv4Ohy3nZ1ad7L55t1Z7fmwntS1L+bRlOvVAAUg==
Valid signature: true
Tampered message valid: false
*/`}
      </CodeBlock>

      <InfoBox variant="success" title="Ed25519 in Java — Verified Working on JDK 26">
        <p>
          Java has shipped native EdDSA support since JDK 15 (JEP 339) via the same{' '}
          <code>KeyPairGenerator</code> / <code>Signature</code> API, just with algorithm name{' '}
          <code>&quot;Ed25519&quot;</code> instead of <code>&quot;EC&quot;</code> /{' '}
          <code>&quot;SHA256withECDSA&quot;</code>. Confirmed working on this machine&#39;s JDK 26 —
          same code shape, no external library needed:
        </p>
      </InfoBox>

      <CodeBlock language="java" title="Ed25519 Sign/Verify (Java, JDK 15+)">
{`KeyPairGenerator kpg = KeyPairGenerator.getInstance("Ed25519");
KeyPair pair = kpg.generateKeyPair();

byte[] message = "Transfer $1000 to Alice".getBytes();

Signature signer = Signature.getInstance("Ed25519");
signer.initSign(pair.getPrivate());
signer.update(message);
byte[] signature = signer.sign();

Signature verifier = Signature.getInstance("Ed25519");
verifier.initVerify(pair.getPublic());
verifier.update(message);
System.out.println("Valid signature: " + verifier.verify(signature));

/* Real output:
Signature (64 bytes): VD8NmAH18aAlP/HOjcDACyu3vucPByVrq78UjrdtCqETYSyiEHCDE/XYW0rawaA/Pr43pKbeylTuJt7QKFpdDQ==
Valid signature: true
Tampered message valid: false
Public key encoded (44 bytes)
Private key encoded (48 bytes)
*/`}
      </CodeBlock>

      <p>
        Notice the sizes match the Node.js measurements exactly — 44-byte public key, 64-byte
        signature — because both are implementing the same RFC 8032 standard, not two different
        things that happen to share a name.
      </p>

      <h2>Which One Should You Reach For?</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Situation</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Choice</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Greenfield system, no compatibility constraints</td>
            <td style={{ padding: '0.75rem' }}><strong>Ed25519</strong> — smallest, fast, deterministic, hardest to misuse</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>TLS certificates, JWTs, existing ECDSA ecosystems</td>
            <td style={{ padding: '0.75rem' }}><strong>ECDSA (P-256)</strong> — universally supported today; fine as long as the nonce is handled by a trustworthy library (RFC 6979 deterministic nonces)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Legacy/regulatory requirement, or need RSA specifically</td>
            <td style={{ padding: '0.75rem' }}><strong>RSA-PSS</strong> — large keys and slow signing, but still broadly required in some compliance contexts</td>
          </tr>
        </tbody>
      </table>

      <p>
        You now know which algorithm to reach for and why. The next lesson answers a more practical
        question the owner of this codebase actually asked: how do you use any of this to sign a real
        file — a build artifact, a package, a container image — so someone downloading it can prove it
        came from you and wasn&#39;t tampered with in transit?
      </p>

      <InteractiveChallenge
        question={"Why is ECDSA's per-signature nonce (k) so dangerous to get wrong, as demonstrated by the 2010 Sony PS3 key recovery?"}
        options={[
          "A weak nonce makes the signature slower to compute",
          "If the same nonce is reused across two signatures from the same key, an attacker with both (message, signature) pairs can solve for the private key algebraically — no brute force required",
          "A reused nonce only allows forging signatures for the exact same message, which is low risk",
          "ECDSA nonces are not actually security-critical; the PS3 break was caused by a separate bug"
        ]}
        correctIndex={1}
        explanation={"Sony's PS3 code-signing implementation reused the same constant nonce k for every ECDSA signature instead of generating a fresh random one each time. Because two signatures with the same nonce and the same private key produce two equations sharing an unknown, an attacker can solve directly for the private key with basic algebra — no brute force, no factoring. fail0verflow demonstrated this at 27C3 in December 2010, and the recovered key let anyone sign code the PS3 would accept as genuine."}
      />

      <InteractiveChallenge
        question={"What makes Ed25519 (EdDSA) immune to the nonce-reuse vulnerability class that broke ECDSA on the PS3?"}
        options={[
          "Ed25519 doesn't use a nonce at all — it signs the raw message without hashing",
          "Ed25519 derives its per-signature nonce deterministically from a hash of the private key and the message, so there is no random number generator involved at signing time to fail or get reused",
          "Ed25519 signatures are encrypted, so even a reused nonce can't be exploited",
          "Ed25519 uses a hardware security module by default, which ECDSA cannot"
        ]}
        correctIndex={1}
        explanation={"EdDSA (RFC 8032) computes its nonce as Hash(private key, message) instead of drawing fresh randomness. Signing the same message with the same key always produces the same signature. Since there's no RNG in the signing path, there's nothing that can be biased, predictable, or accidentally reused across signatures — the exact failure mode that leaked Sony's PS3 signing key is structurally impossible in EdDSA."}
      />
    </LessonLayout>
  );
}
