import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function CryptoSecureRandom() {
  return (
    <LessonLayout
      title="Secure Random Number Generation"
      sectionId="cryptography"
      lessonIndex={10}
      prev={{ path: '/cryptography/key-wrapping', label: 'Key Wrapping & Envelope Encryption' }}
      next={{ path: '/cryptography/secure-login-flow', label: 'Anatomy of a Secure Login' }}
    >
      <p>
        Every algorithm in this section — key generation, IVs, salts, session tokens — eventually calls
        down into a random number generator, and if that generator is the wrong kind, everything built on
        top of it is broken regardless of how correctly AES or bcrypt is implemented. The wrong kind is not
        subtle in test output. <code>Math.random()</code> and <code>java.util.Random</code> both pass
        every statistical smell test you throw at them — they look uniformly distributed, no obvious
        pattern jumps out, a histogram looks flat. Statistically random is not the property that matters
        here. What matters is whether an attacker who has seen some of the output can predict the rest, and
        for both of those generators the answer is yes — not &quot;theoretically, given enough compute,&quot;
        but demonstrably, from two numbers, using arithmetic a spreadsheet could do.
      </p>

      <InfoBox variant="danger" title="The One Distinction This Lesson Is About">
        <p>
          A <strong>PRNG</strong> (pseudo-random number generator) only has to look random —
          statistically flat, no repeating cycles a human would notice. A{' '}
          <strong>CSPRNG</strong> (cryptographically secure PRNG) has to survive an attacker who knows the
          exact algorithm, has seen prior outputs, and is actively trying to predict the next one.{' '}
          <code>Math.random()</code> and <code>java.util.Random</code> are PRNGs. Neither one was designed
          to survive that attacker, and both of their specifications say so directly.
        </p>
      </InfoBox>

      <h2>Math.random() Is Not Cryptographically Secure — In MDN&apos;s Own Words</h2>

      <p>
        This is not an inference from behavior. MDN&apos;s documentation for <code>Math.random()</code>{' '}
        states it as a direct warning, not a footnote:
      </p>

      <InfoBox variant="warning" title="MDN — Math.random()">
        <p>
          &quot;<strong>Note:</strong> <code>Math.random()</code> <em>does not</em> provide cryptographically
          secure random numbers. Do not use them for anything related to security. Use the Web Crypto API
          instead, and more precisely the <code>Crypto.getRandomValues()</code> method.&quot;
        </p>
      </InfoBox>

      <p>
        The ECMAScript spec deliberately does not mandate an algorithm for <code>Math.random()</code> — it
        is implementation-defined, which is itself part of the problem, since the exact behavior can differ
        by engine and version. V8, the engine behind both Node.js and Chrome, documents its current
        implementation as <strong>xorshift128+</strong>: 128 bits of internal state, updated with a fixed,
        fully public bit-shifting recurrence. Nothing about that algorithm involves a secret — knowing the
        128-bit state at any point lets you compute every value that generator will ever produce, forward or
        backward. Ten consecutive draws already look exactly like what you would expect from a fair, uniform
        generator:
      </p>

      <CodeBlock language="javascript" title="Math.random() — Ten Draws (Node.js v25.2.1, actually run)">
{`// node -e "for (let i = 0; i < 10; i++) console.log(Math.random())"
0.11025162659451926
0.43204191945729487
0.8915503726450683
0.5910543342651727
0.6815011338422976
0.13760639448398848
0.8281984744978783
0.7211653364953299
0.15205160270573148
0.4427367370334344

// Statistically indistinguishable from good randomness — that is exactly
// the property a PRNG is built to have, and exactly why "looks random"
// is the wrong test for a security decision.`}
      </CodeBlock>

      <h2>java.util.Random — A Documented 48-bit Linear Congruential Generator</h2>

      <p>
        Java is more explicit than JavaScript here: the algorithm is not implementation-defined, it is
        specified, in the class Javadoc, in enough detail to reimplement from scratch:
      </p>

      <InfoBox variant="warning" title="Javadoc — java.util.Random">
        <p>
          &quot;An instance of this class is used to generate a stream of pseudorandom numbers; its period
          is only 2<sup>48</sup>. The class uses a 48-bit seed, which is modified using a linear
          congruential formula.&quot; The <code>next(int bits)</code> method documentation cites the exact
          source: &quot;This is a linear congruential pseudorandom number generator, as defined by D. H.
          Lehmer and described by Donald E. Knuth in <em>The Art of Computer Programming</em>, Volume 2,
          Third edition: Seminumerical Algorithms, section 3.2.1.&quot; And directly: &quot;Instances of{' '}
          <code>java.util.Random</code> are not cryptographically secure. Consider instead using{' '}
          <code>SecureRandom</code> to get a cryptographically secure pseudo-random number generator for
          use by security-sensitive applications.&quot;
        </p>
      </InfoBox>

      <p>
        The recurrence itself is published in the same Javadoc:{' '}
        <code>seed = (seed * 0x5DEECE66DL + 0xBL) &amp; ((1L &lt;&lt; 48) - 1)</code>, with each call to{' '}
        <code>nextInt()</code> returning the top 32 bits of the newly updated 48-bit seed. Same seed, same
        multiplier, same addend, every time — which means same seed produces the identical stream on two
        completely separate instances, no coordination required:
      </p>

      <CodeBlock language="java" title="Same Seed -> Identical Output, Two Independent Instances (JDK 26.0.1, actually run)">
{`Random insecure1 = new Random(42);
Random insecure2 = new Random(42);
System.out.println("Instance 1: " + insecure1.nextInt(1000000));
System.out.println("Instance 2: " + insecure2.nextInt(1000000));

// Instance 1: 431130
// Instance 2: 431130   <- identical, because the seed is the entire secret`}
      </CodeBlock>

      <p>
        That is the easy version of the attack — it requires knowing the seed. The Javadoc's algorithm
        disclosure enables a harder, more interesting one: recovering the internal state from{' '}
        <em>observed output alone</em>, with no seed knowledge at all. Each <code>nextInt()</code> call
        reveals the top 32 bits of the 48-bit state; the bottom 16 bits are hidden, but 16 bits is a
        65,536-entry brute force — instantaneous, not cryptographic. Two consecutive outputs are enough to
        recover full internal state and predict every future draw before it happens:
      </p>

      <CodeBlock language="java" title="Predicting the Next Draw From Two Observed Outputs (JDK 26.0.1, actually run — real values below)">
{`static final long MULTIPLIER = 0x5DEECE66DL;
static final long ADDEND = 0xBL;
static final long MASK = (1L << 48) - 1;

Random victim = new Random(System.nanoTime()); // seed unknown to the attacker

int r1 = victim.nextInt(); // attacker observes this
int r2 = victim.nextInt(); // and this — nothing else

long r1u = ((long) r1) & 0xFFFFFFFFL;
long r2u = ((long) r2) & 0xFFFFFFFFL;

Long recoveredS1 = null;
for (int low16 = 0; low16 < 65536; low16++) {           // brute force: 65,536 tries
    long candidateS1 = (r1u << 16) | (long) low16;
    long candidateS2 = (candidateS1 * MULTIPLIER + ADDEND) & MASK;
    if ((candidateS2 >>> 16) == r2u) { recoveredS1 = candidateS1; break; }
}

long S2 = (recoveredS1 * MULTIPLIER + ADDEND) & MASK;
long S3 = (S2 * MULTIPLIER + ADDEND) & MASK;
int predictedR3 = (int) (S3 >>> 16);

int actualR3 = victim.nextInt();  // the draw the attacker had NOT seen yet

System.out.println("Predicted: " + predictedR3);
System.out.println("Actual:    " + actualR3);

// Real run:
// Observed r1 = 252676378
// Observed r2 = -1509228005
// Recovered 48-bit state S1 = 16559399112414
// Predicted r3 (computed BEFORE it was ever drawn) = -1963688014
// Actual r3 drawn from the live generator          = -1963688014
// Match: true
//
// Reran this three times with fresh nanoTime-based seeds — all three
// predicted the undrawn value exactly, every time.`}
      </CodeBlock>

      <InfoBox variant="danger" title="What That Demo Actually Proves">
        <p>
          Nothing above touched the seed. The attack only used two numbers the generator had already
          produced, plus the recurrence formula published in the Javadoc. If <code>java.util.Random</code>{' '}
          were ever used to generate a password-reset token, a session ID, or a CSRF token, an attacker who
          obtains any two consecutive outputs — their own two tokens from two requests, say — can compute
          every token that generator will produce afterward, including yours. This is not a weakness that
          better seeding fixes. The seed is not the vulnerability; the 48-bit state space and the fact that
          each output leaks 32 of those 48 bits is.
        </p>
      </InfoBox>

      <h2>What a CSPRNG Actually Guarantees</h2>

      <p>
        A CSPRNG&apos;s defining property is stated precisely in the <code>SecureRandom</code> Javadoc:
        &quot;This class provides a cryptographically strong random number generator (RNG).&quot; And more
        specifically: &quot;A cryptographically strong random number minimally complies with the
        statistical random number generator tests specified in <em>FIPS 140-2, Security Requirements for
        Cryptographic Modules</em>, section 4.9.1. Additionally, <code>SecureRandom</code> must produce
        non-deterministic output. Therefore, any seed material passed to a <code>SecureRandom</code> object
        must be unpredictable, and all <code>SecureRandom</code> output sequences must be cryptographically
        strong, as described in <em>RFC 4086: Randomness Requirements for Security</em>.&quot;
      </p>

      <InfoBox variant="note" title="The Javadoc Cites a Superseded Standard — Quoted Verbatim Anyway">
        <p>
          FIPS 140-2 was superseded by <strong>FIPS 140-3</strong>; the CMVP stopped accepting
          140-2 validations in September 2021. The quote above is reproduced exactly as the JDK
          ships it, so the stale reference is the <em>Javadoc&apos;s</em>, not this page&apos;s.
          Nothing about the requirement changed in substance — 140-3 incorporates ISO/IEC 19790 and
          the statistical-test bar for a CSPRNG is the same one. Worth knowing mostly so you are not
          confused when an auditor asks which revision you are claiming against.
        </p>
      </InfoBox>

      <p>
        Stripped of the standards references, the bar is: an attacker who knows the exact algorithm and has
        seen every prior output must still be unable to distinguish the next output from true randomness,
        or predict it, with better than negligible probability. That is a fundamentally different design
        target than &quot;passes statistical tests.&quot; A CSPRNG is built assuming the algorithm is public
        (it always is — you are reading the source of both generators in this lesson) and the entire
        defense has to come from the internal state being large enough, and mixed thoroughly enough, that
        observing output never leaks it back. The 48-bit-LCG demo above is exactly the attack a CSPRNG has
        to be immune to by construction.
      </p>

      <h2>The Fix in Node.js: crypto.randomBytes() and crypto.randomInt()</h2>

      <p>
        Node&apos;s docs describe <code>randomBytes()</code> plainly: &quot;Generates cryptographically
        strong pseudo-random data.&quot; It draws from the platform CSPRNG through OpenSSL rather than a
        fixed-size, fully disclosed LCG or xorshift state:
      </p>

      <CodeBlock language="javascript" title="crypto.randomBytes() and crypto.randomInt() (Node.js v25.2.1, actually run)">
{`const crypto = require('crypto');

console.log(crypto.randomBytes(16).toString('hex'));
console.log(crypto.randomBytes(16).toString('hex'));
// 0ec024904f04a706d7dca6851daf4785
// e36bdad05c1600e4bd7f5f419734f61c
// Two calls, no relationship between them an attacker can exploit —
// contrast with java.util.Random, where two calls are exactly the
// information needed to compute the third.

for (let i = 0; i < 10; i++) console.log(crypto.randomInt(0, 100));
// 9, 4, 76, 68, 7, 40, 3, 58, 78, 24

console.log(crypto.randomUUID());
// c0f0b025-8c82-4d52-b4e7-a0687f21f2f3`}
      </CodeBlock>

      <InfoBox variant="tip" title="randomInt() vs Math.random() * n">
        <p>
          <code>crypto.randomInt(0, 100)</code> is not just &quot;the secure version of{' '}
          <code>Math.floor(Math.random() * 100)</code>&quot; — it also avoids modulo/scaling bias that a
          naive <code>Math.random() * n</code> conversion can introduce, by design rejecting and re-drawing
          values that would skew the distribution. Prefer it over hand-rolled range math even in
          non-cryptographic code where the distribution needs to actually be uniform.
        </p>
      </InfoBox>

      <h2>The Fix in Java: java.security.SecureRandom</h2>

      <p>
        The no-argument constructor&apos;s behavior is also specified, not left to guesswork: &quot;This
        constructor traverses the list of registered security Providers, starting with the most preferred
        Provider. A new <code>SecureRandom</code> object encapsulating the <code>SecureRandomSpi</code>{' '}
        implementation from the first provider that supports a <code>SecureRandom</code> (RNG) algorithm is
        returned. If none of the providers support an RNG algorithm, then an implementation-specific default
        is returned.&quot; In plain terms: the default algorithm is not fixed by the JDK spec — it depends on
        the platform and installed providers. Rather than assume, here is a program that just asks:
      </p>

      <CodeBlock language="java" title="What SecureRandom Actually Defaults To Here (actually compiled & run)">
{`import java.security.SecureRandom;

public class WhichAlgorithm {
    public static void main(String[] args) throws Exception {
        SecureRandom sr = new SecureRandom();
        System.out.println(sr.getAlgorithm());
        System.out.println(sr.getProvider());

        SecureRandom strong = SecureRandom.getInstanceStrong();
        System.out.println(strong.getAlgorithm());
    }
}

// Real output, JDK 26.0.1 (build 26.0.1+8-34), macOS:
// NativePRNG
// SUN version 26
// NativePRNGBlocking`}
      </CodeBlock>

      <InfoBox variant="note" title="The Default Is Platform-Specific — Don't Assume It Elsewhere">
        <p>
          On this machine, <code>new SecureRandom()</code> resolves to <code>NativePRNG</code> from the SUN
          provider, and <code>SecureRandom.getInstanceStrong()</code> resolves to{' '}
          <code>NativePRNGBlocking</code>. That is a real, measured result on JDK 26.0.1 on macOS — not an
          assumption. Because the Javadoc explicitly defines this as provider-traversal-dependent, the same
          call can legitimately resolve differently on Windows or Linux, or on a JDK with different
          providers installed. If an algorithm choice needs to be pinned for compliance reasons, call{' '}
          <code>SecureRandom.getInstance(&quot;DRBG&quot;)</code> or a specific named algorithm explicitly
          rather than relying on the no-arg default, and verify with <code>getAlgorithm()</code> the way
          this lesson just did — on the actual target environment, not assumed from a blog post.
        </p>
      </InfoBox>

      <p>Same actual byte and integer output as the Node example, produced by SecureRandom on this machine:</p>

      <CodeBlock language="java" title="SecureRandom Output (JDK 26.0.1, actually run)">
{`SecureRandom sr = new SecureRandom();

byte[] bytes = new byte[16];
sr.nextBytes(bytes);
// 1d27c0e6ab1292fe450c14c8af6c7291
sr.nextBytes(bytes);
// a0f94705624d5eae5a33ac0bda2050fc

for (int i = 0; i < 10; i++) System.out.println(sr.nextInt(100));
// 92, 5, 94, 87, 38, 87, 35, 6, 89, 32`}
      </CodeBlock>

      <h2>Where the Entropy Actually Comes From</h2>

      <p>
        <code>NativePRNG</code> did not appear from nowhere — this JDK&apos;s own configuration says exactly
        where it seeds from. The installed <code>java.security</code> file on this machine (JDK 26.0.1,{' '}
        <code>.../Contents/Home/conf/security/java.security</code>) contains:
      </p>

      <CodeBlock language="text" title="java.security config, this JDK install (actually read from disk)">
{`securerandom.source=file:/dev/random
securerandom.strongAlgorithms=NativePRNGBlocking:SUN,DRBG:SUN`}
      </CodeBlock>

      <p>
        On this specific machine, <code>/dev/random</code> and <code>/dev/urandom</code> are not two
        different quality tiers the way they can be discussed on older Linux systems. macOS&apos;s own{' '}
        <code>man 4 random</code> states this directly:
      </p>

      <InfoBox variant="info" title="man 4 random (macOS, this machine)">
        <p>
          &quot;/dev/urandom is a compatibility nod to Linux. On Linux, /dev/urandom will produce lower
          quality output if the entropy pool drains, while /dev/random will prefer to block and wait for
          additional entropy to be collected. With Fortuna, this choice and distinction is not necessary,
          and the two devices behave identically. You may use either. The random device implements the
          Fortuna pseudo random number generator algorithm and maintains its entropy pool.&quot;
        </p>
      </InfoBox>

      <p>
        So on this Mac, both device files sit on top of the same kernel-level Fortuna CSPRNG — confirmed by
        reading the actual man page installed on this system, not assumed. Node&apos;s{' '}
        <code>crypto.randomBytes()</code> is built on OpenSSL, which on Unix-like systems is documented to
        draw its entropy from the operating system&apos;s CSPRNG rather than maintaining its own — the same
        family of source <code>/dev/urandom</code> exposes. That chain (Node → OpenSSL → OS CSPRNG) was not
        independently re-verified line-by-line in this lesson the way the JDK config file and the macOS man
        page were, so treat it as high-confidence but, unlike the two boxes above, not something pulled
        directly off this machine&apos;s own files.
      </p>

      <h2>Which Generator For Which Job</h2>

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
            <td style={{ padding: '0.75rem' }}>Shuffle a deck in a game, jitter a retry delay, pick a UI animation variant</td>
            <td style={{ padding: '0.75rem' }}><strong>Math.random() / java.util.Random</strong></td>
            <td style={{ padding: '0.75rem' }}>No attacker benefits from predicting it — fast, seedable, reproducible for tests is a feature here</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Generate a session ID, CSRF token, password-reset token, or API key</td>
            <td style={{ padding: '0.75rem' }}><strong>crypto.randomBytes() / SecureRandom</strong></td>
            <td style={{ padding: '0.75rem' }}>Predicting it lets an attacker hijack a session or reset someone else&apos;s password</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Pick a random integer for an OTP code or a lottery-style draw</td>
            <td style={{ padding: '0.75rem' }}><strong>crypto.randomInt() / SecureRandom.nextInt()</strong></td>
            <td style={{ padding: '0.75rem' }}>Also needs unbiased distribution, which the crypto-grade APIs guarantee explicitly</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Generate an AES key, an IV, or an RSA/EC keypair</td>
            <td style={{ padding: '0.75rem' }}><strong>crypto.randomBytes() / SecureRandom (via KeyGenerator)</strong></td>
            <td style={{ padding: '0.75rem' }}>A predictable key is not a key — the entire scheme collapses to the LCG-recovery attack above</td>
          </tr>
        </tbody>
      </table>

      <p>
        The next lesson builds a login flow end to end — session tokens, CSRF tokens, password reset links —
        and every one of those values is only as strong as the generator that produced it. This is the
        lesson that decides which generator that is.
      </p>

    </LessonLayout>
  );
}
