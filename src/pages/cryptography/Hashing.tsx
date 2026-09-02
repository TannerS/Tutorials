import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';

export default function CryptoHashing() {
  return (
    <LessonLayout
      title="Hashing & Data Integrity"
      sectionId="cryptography"
      lessonIndex={2}
      prev={{ path: '/cryptography/encryption', label: 'Encryption Fundamentals — AES, RSA, ECC' }}
      next={{ path: '/cryptography/aead', label: 'Authenticated Encryption (AEAD)' }}
    >
      <p>
        The previous lesson&apos;s password-hashing section stopped at the conclusion — use argon2id,
        never a bare SHA-256 — without stopping to explain what a hash function actually promises, or
        why two of history&apos;s most widely deployed ones no longer keep that promise. This lesson backs
        up to the primitive itself: the guarantees a cryptographic hash makes, precisely where and how
        badly MD5 and SHA-1 broke those guarantees, the real difference between a checksum and a
        cryptographic hash, and the two constructions built on top of a plain hash once a bare digest by
        itself isn&apos;t enough — HMAC and the Merkle tree.
      </p>

      <h2>The Three Guarantees</h2>

      <p>
        A cryptographic hash function takes an input of any size and returns a fixed-size digest, and it
        makes exactly three promises. It is <strong>deterministic</strong> — the same input always
        produces the same digest, so two parties can compute it independently and compare. Its output is{' '}
        <strong>fixed-size</strong> — SHA-256 always returns 256 bits, whether the input is one byte or
        one gigabyte. And it has the <strong>avalanche effect</strong> — changing a single bit of input
        flips roughly half the output bits, so similar inputs never produce similar-looking digests. That
        last property is what stops an attacker from treating digest-guessing like a game of &quot;warmer,
        colder&quot; — there is no partial credit for an input that is almost right.
      </p>

      <InfoBox variant="info" title="What a Hash Function Promises">
        <p><strong>Deterministic</strong> — same input, same digest, every time, on every machine.</p>
        <p><strong>Fixed-size</strong> — a 3-byte input and a 3-gigabyte input both produce a 256-bit SHA-256 digest.</p>
        <p><strong>Avalanche effect</strong> — flip one input bit and roughly half the output bits flip, unpredictably.</p>
      </InfoBox>

      <p>Run it and the numbers back that up exactly:</p>

      <CodeBlock language="javascript" title="The Avalanche Effect, For Real (Node.js)">
{`const crypto = require('crypto');

const helloDigest = crypto.createHash('sha256').update('hello').digest('hex');
const HelloDigest = crypto.createHash('sha256').update('Hello').digest('hex');

console.log(helloDigest);
// 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
console.log(HelloDigest);
// 185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969

// Count differing bits between the two digests
const a = Buffer.from(helloDigest, 'hex');
const b = Buffer.from(HelloDigest, 'hex');
let diffBits = 0;
for (let i = 0; i < a.length; i++) {
  diffBits += (a[i] ^ b[i]).toString(2).split('1').length - 1;
}
console.log(diffBits + ' of ' + (a.length * 8) + ' bits differ (' +
  (diffBits / (a.length * 8) * 100).toFixed(1) + '%)');
// 125 of 256 bits differ (48.8%) -- one capitalized letter, half the digest changed

console.log(crypto.createHash('sha256').update('hello').digest('hex') === helloDigest);
// true -- deterministic, every run

console.log(crypto.createHash('sha256').update('a'.repeat(1000000)).digest('hex').length);
// 64 -- 64 hex chars = 256 bits, the same fixed size as hashing 5 bytes`}
      </CodeBlock>

      <CodeBlock language="java" title="Same Computation in Java — Identical Digests">
{`import java.security.MessageDigest;
import java.util.HexFormat;

public class Avalanche {
    public static void main(String[] args) throws Exception {
        MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
        byte[] helloDigest = sha256.digest("hello".getBytes("UTF-8"));
        sha256.reset();
        byte[] HelloDigest = sha256.digest("Hello".getBytes("UTF-8"));

        System.out.println(HexFormat.of().formatHex(helloDigest));
        // 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
        System.out.println(HexFormat.of().formatHex(HelloDigest));
        // 185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969

        int diffBits = 0;
        for (int i = 0; i < helloDigest.length; i++) {
            diffBits += Integer.bitCount((helloDigest[i] ^ HelloDigest[i]) & 0xFF);
        }
        System.out.printf("%d of %d bits differ (%.1f%%)%n", diffBits, helloDigest.length * 8,
            100.0 * diffBits / (helloDigest.length * 8));
        // 125 of 256 bits differ (48.8%) -- byte-for-byte identical to the Node run above
    }
}`}
      </CodeBlock>

      <h2>Where MD5 and SHA-1 Actually Broke</h2>

      <p>
        &quot;Broken&quot; does not mean what it sounds like here. Nobody can take a SHA-1 digest and
        recover the message that produced it — <strong>preimage resistance</strong> is intact for both
        MD5 and SHA-1 to this day. What broke is <strong>collision resistance</strong>: the guarantee that
        nobody can find two <em>different</em> inputs that hash to the same digest. That distinction
        decides which use cases actually got dangerous. SHA-1 in a password hash was never the real
        problem (wrong tool anyway — see the previous lesson). SHA-1 backing a certificate or a
        code-signing payload is a different story, because collision resistance is precisely what a
        signature depends on to mean &quot;this document, and only this document, was signed.&quot;
      </p>

      <p>
        <strong>MD5</strong> lost collision resistance first and worst. Xiaoyun Wang, Dengguo Feng, Xuejia
        Lai, and Hongbo Yu published a practical full-MD5 collision in August 2004 — about an hour of
        compute on a cluster at the time. Chosen-prefix collisions — letting an attacker pick two{' '}
        <em>meaningful</em> documents in advance and force them to collide, rather than colliding on
        garbage — followed by 2007, at a cost of roughly 2<sup>39</sup> MD5 evaluations. This stopped
        being academic in 2012: the Flame malware used a novel MD5 chosen-prefix collision to forge a
        valid Microsoft code-signing certificate, letting it push malicious Windows updates that looked
        authentically signed by Microsoft. MD5 collisions today are a laptop-seconds problem, not a
        research problem.
      </p>

      <p>
        <strong>SHA-1</strong> held out until 2017. On February 23, 2017, a joint team from Google and CWI
        Amsterdam (Marc Stevens, Elie Bursztein, Pierre Karpman, Ange Albertini, and Yarik Markov)
        published <strong>SHAttered</strong> — the first public collision for full SHA-1: two distinct
        PDFs sharing one SHA-1 digest. It was not cheap. The attack needed roughly 9.2 quintillion
        (9,223,372,036,854,775,808) SHA-1 computations, the equivalent of about 6,500 CPU-years and 110
        GPU-years, run in parallel on Google&apos;s infrastructure. That is a real, practical break — not
        theoretical — but nowhere near the &quot;seconds on a laptop&quot; territory MD5 sits in. Browsers
        and certificate authorities were already phasing SHA-1 certificates out before 2017; SHAttered
        removed any remaining excuse.
      </p>

      <InfoBox variant="note" title="Git Still Uses SHA-1 — With a Catch">
        <p>
          Git identifies every object by SHA-1 by default, which sounds alarming after the above. In
          practice Git has shipped a collision-<em>detecting</em> variant (<code>sha1dc</code>) since
          shortly after the SHAttered disclosure, specifically built to recognize the kind of
          near-collision blocks that attack (and its descendants) produce and refuse them. Newer Git
          versions also let you opt an entire repository into SHA-256 object IDs —{' '}
          <code>git init --object-format=sha256</code> — confirmed locally against Git 2.50.1, which
          writes <code>[extensions] objectformat = sha256</code> into the new repo&apos;s config.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="MD5 and SHA-1 Still Run — They Just Don't Resist a Determined Attacker (Node.js)">
{`const crypto = require('crypto');

console.log(crypto.createHash('md5').update('hello').digest('hex'));
// 5d41402abc4b2a76b9719d911017c592 -- 128-bit digest, 16 bytes

console.log(crypto.createHash('sha1').update('hello').digest('hex'));
// aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d -- 160-bit digest, 20 bytes

// Both compute fine -- Node hasn't removed them, and single-input hashing
// like this is still exactly as deterministic as SHA-256. The break is
// specifically that an adversary can now construct two *different* inputs
// that collide: cheaply for MD5, expensively-but-really for SHA-1.`}
      </CodeBlock>

      <h2>SHA-256 vs SHA-3: Same Job, Different Machine</h2>

      <p>
        SHA-256 and SHA-3 solve the same problem with structurally different internals, and the
        difference is not cosmetic. SHA-256 is a <strong>Merkle-Damgård</strong> construction: it splits
        the input into blocks and runs each one through a compression function that chains into the next,
        block by block, ending in the digest. SHA-3 — standardized as <strong>Keccak</strong>, winner of
        NIST&apos;s 2007–2012 SHA-3 competition (announced October 2, 2012, published as FIPS 202 on
        August 5, 2015) — uses a completely different <strong>sponge</strong> construction instead: input
        is &quot;absorbed&quot; into a large internal state through repeated permutation, then the digest
        is &quot;squeezed&quot; back out. NIST did not standardize SHA-3 because SHA-256 was broken — it
        isn&apos;t — but as structural insurance: if a cryptanalytic advance ever threatened the
        Merkle-Damgård design, a sponge construction sharing none of that structure would be unaffected.
        There is one concrete consequence today, not just in some hypothetical future: Merkle-Damgård
        hashes (MD5, SHA-1, SHA-256) are vulnerable to a <strong>length-extension attack</strong> — given{' '}
        <code>H(secret || message)</code> — where <code>||</code> means <em>concatenation</em>, not logical OR — and the length of <code>secret</code>, an attacker can compute a
        valid <code>H(secret || message || padding || extra)</code> without ever learning{' '}
        <code>secret</code>. SHA-3&apos;s sponge construction is not vulnerable to this. It is also exactly
        why HMAC, below, does not just concatenate the key and the message — it uses a specific nested
        construction designed to neutralize length extension on Merkle-Damgård hashes.
      </p>

      <h2>Checksums vs Cryptographic Hashes: A Different Design Goal</h2>

      <p>
        CRC32 looks superficially like a hash function — feed it bytes, get a fixed-size fingerprint back
        — and that similarity causes real confusion. CRC32 was designed to catch{' '}
        <strong>accidental</strong> corruption: a bad network packet, a flipped bit from a failing disk
        sector, a truncated file. It was never designed to resist someone deliberately trying to produce a
        collision. CRC32&apos;s math is linear — it is built from polynomial division over GF(2), the two-element field where addition is just XOR — which
        means that given a message and a target checksum, computing the exact bytes to append or patch in
        to hit that target is cheap arithmetic, not a search. This is routinely how tampered firmware
        images and zip files are patched to still pass a CRC check. A cryptographic hash&apos;s collision
        resistance is instead an actual design goal, backed by decades of public cryptanalysis trying to
        break it — precisely the property CRC32 never had and was never meant to have.
      </p>

      <CodeBlock language="javascript" title="Same Tamper, Two Different Fingerprints (Node.js)">
{`const crypto = require('crypto');
const zlib = require('zlib');   // Node 22.2+: zlib.crc32() is a built-in checksum

const original = 'Transfer $100 to Alice';
const tampered = 'Transfer $900 to Alice';   // one digit changed

const crc = s => zlib.crc32(Buffer.from(s)).toString(16).padStart(8, '0');
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');

console.log('CRC32   original:', crc(original));
// CRC32   original: 75354ff6
console.log('CRC32   tampered:', crc(tampered));
// CRC32   tampered: 73393908
console.log('SHA-256 original:', sha256(original));
// SHA-256 original: 76aecfa667ee3b408c6cb64eaeca752a910330b17bc22981e77b86fcd914be7b
console.log('SHA-256 tampered:', sha256(tampered));
// SHA-256 tampered: 9250560fd497ba42f5134ca5d3848e5a239e8dd7a85ac48bf155148d9975de4e`}
      </CodeBlock>

      <p>
        Both fingerprints change — that part isn&apos;t the point. The point is what each one is{' '}
        <em>for</em>. CRC32&apos;s 32-bit output space (about 4.3 billion possibilities) exists to catch
        random noise cheaply, not to survive an adversary who gets to choose the tampered bytes.
        SHA-256&apos;s 256-bit space and its designed-in collision resistance exist specifically because
        someone is assumed to be trying.
      </p>

      <InfoBox variant="tip" title="Where CRC32 Still Belongs">
        <p>
          CRC32 is still the right tool inside zip, gzip, PNG chunks, and Ethernet frame checks — anywhere
          the threat model is a noisy channel or flaky storage, not an adversary, and where a
          near-instant, easy-to-implement-in-hardware checksum matters more than cryptographic strength.
          The mistake is reaching for it anywhere an attacker gets to choose the corrupted bytes.
        </p>
      </InfoBox>

      <h2>HMAC: A Hash, Plus a Secret</h2>

      <p>
        A plain hash proves a message was not <em>corrupted</em> — anyone can recompute SHA-256 over a
        file and confirm it matches. It proves nothing about who <em>sent</em> it, because anyone can also
        recompute SHA-256 over a forged file. HMAC fixes that by mixing a shared secret key into the
        computation, so producing a valid tag requires holding the key, not just knowing the algorithm.
      </p>

      <CodeBlock language="javascript" title="HMAC-SHA256 (Node.js)">
{`const crypto = require('crypto');

const key = Buffer.from(
  '4f3c9a2b8e1d6f7a0c5b3e9d2a1f4c8b6e0a3d7f2b5c9e1a4d8f0c6b3e9a2d5f',
  'hex'
);

const tag = crypto.createHmac('sha256', key)
  .update('Transfer $100 to Alice')
  .digest('hex');
console.log('HMAC-SHA256:', tag);
// HMAC-SHA256: 3141711b54e4e20a1ef4088886bb8bdfcb1345f8c000c97b21506105aa89aacd

const reverify = crypto.createHmac('sha256', key)
  .update('Transfer $100 to Alice')
  .digest('hex');
console.log('Reverify with same key matches:', tag === reverify);
// Reverify with same key matches: true

const wrongKey = crypto.randomBytes(32);
const forged = crypto.createHmac('sha256', wrongKey)
  .update('Transfer $100 to Alice')
  .digest('hex');
console.log('Tag from a different key:', forged);
// Tag from a different key: f6bc497e4dae3603daf9d8a19df5a5beb0ece8b0fb0c8e1a0c099c57f1e89289 -- no match`}
      </CodeBlock>

      <InfoBox variant="note" title="HMAC Is Authentication, Not a Signature">
        <p>
          HMAC proves the sender holds the same secret key as the verifier — enough for two parties who
          already share a secret, like a client and a server holding the same API key. It is{' '}
          <strong>not</strong> a digital signature: there is no public/private key pair, so whoever can
          verify a tag holds the exact same secret needed to forge one. A signature — the next lesson but
          one — uses an asymmetric key pair specifically so the verifier can check authenticity without
          ever holding anything that lets it forge one.
        </p>
      </InfoBox>

      <h2>Merkle Trees: Hashing at Scale</h2>

      <p>
        A Merkle tree hashes each piece of data individually as a leaf, then hashes pairs of those hashes
        together going up the tree, repeating until a single <strong>root hash</strong> summarizes
        everything beneath it. Change one byte anywhere in the dataset and its leaf hash changes, which
        changes its parent, which changes its parent, all the way up to a completely different root — so
        one small hash can vouch for an arbitrarily large dataset. This shows up constantly in real
        infrastructure. <strong>Git</strong> is a Merkle tree of content-addressed objects — blobs hash
        into trees, trees hash into commits, commits chain into history — so a single commit hash
        transitively vouches for every byte in the repository at that point in time.{' '}
        <strong>Blockchains</strong> store every block&apos;s transactions under one Merkle root in the
        block header, which is what lets a lightweight client verify a single transaction was included in
        a block using a short proof path instead of downloading the whole block.{' '}
        <strong>Certificate Transparency logs</strong> are append-only Merkle trees of every certificate a
        CA issues, published so anyone can audit them and cryptographically prove a certificate is (or is
        not) logged — which is how browsers now catch a CA that quietly issued a certificate it should
        not have.
      </p>

      <FlowChart
        title="A Merkle Tree: Four Leaves to One Root"
        chart={"graph BT\n  D1[\"Data A\"] --> L1[\"H(A)\"]\n  D2[\"Data B\"] --> L2[\"H(B)\"]\n  D3[\"Data C\"] --> L3[\"H(C)\"]\n  D4[\"Data D\"] --> L4[\"H(D)\"]\n  L1 --> P1[\"H(H(A) + H(B))\"]\n  L2 --> P1\n  L3 --> P2[\"H(H(C) + H(D))\"]\n  L4 --> P2\n  P1 --> R[\"Root = H(P1 + P2)\"]\n  P2 --> R\n  style D2 fill:#3b1a1a,stroke:#dc2626\n  style L2 fill:#3b1a1a,stroke:#dc2626\n  style P1 fill:#3b1a1a,stroke:#dc2626\n  style R fill:#3b1a1a,stroke:#dc2626"}
      />

      <p>
        Every leaf hash feeds exactly one parent, and every parent feeds exactly one grandparent, until
        one root remains. The diagram highlights what a single-byte change to <strong>Data B</strong>{' '}
        does: its leaf hash <code>H(B)</code> changes, which changes the parent hash that combines it
        with <code>H(A)</code>, which changes the root — even though <strong>Data A, C, and D</strong>{' '}
        never changed at all. That is the whole mechanism in one picture: a change anywhere always
        propagates to the top, and nowhere else needs to be touched, hashed, or even downloaded to prove
        it happened — a verifier only needs the sibling hashes along one path (the &quot;proof path&quot;
        mentioned above) to confirm a single leaf belongs under a given root.
      </p>

      <h2>Key Takeaways</h2>

      <InfoBox variant="tip" title="Remember These">
        <p><strong>Three guarantees</strong>: deterministic, fixed-size output, avalanche effect. No key, no inverse, ever.</p>
        <p><strong>MD5 / SHA-1</strong>: collision resistance broken (MD5 since 2004, trivial today; SHA-1 since SHAttered in 2017, expensive but real). Preimage resistance intact for both. Do not use either where two attacker-chosen inputs colliding would matter — certificates, signatures, dedup keys.</p>
        <p><strong>SHA-256 vs SHA-3</strong>: same job, different internals — Merkle-Damgård vs sponge. SHA-3 exists as structural insurance, not because SHA-2 broke.</p>
        <p><strong>Checksums (CRC32)</strong>: catch accidental corruption. Not adversarial. Never use for integrity against a deliberate attacker.</p>
        <p><strong>HMAC</strong>: hash + shared secret = authentication between two parties who both hold the key. Not a signature — the verifier could forge one too.</p>
        <p><strong>Merkle trees</strong>: one root hash vouches for an entire dataset. Git, blockchains, and Certificate Transparency all run on this.</p>
      </InfoBox>

      <p>
        Hashing gets you integrity, and HMAC adds authentication on top of it — but neither keeps data{' '}
        <em>confidential</em>. The next lesson closes that gap: combining encryption and a MAC in the same
        construction, why two of the three historical ways to do that turned out to be exploitable, and
        how AES-GCM and ChaCha20-Poly1305 fold confidentiality and integrity into one operation so there is
        no manual composition left to get wrong.
      </p>

    </LessonLayout>
  );
}
