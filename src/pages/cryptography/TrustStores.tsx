import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function CryptoTrustStores() {
  return (
    <LessonLayout
      title="Where Keys & Certs Actually Live"
      sectionId="cryptography"
      lessonIndex={8}
      prev={{ path: '/cryptography/tls', label: 'TLS & HTTPS' }}
      next={{ path: '/cryptography/key-wrapping', label: 'Key Wrapping & Envelope Encryption' }}
    >
      <p>
        That intuition is correct, and it is worth pinning down exactly what &quot;loaded into the OS or
        browser&quot; means, because the mechanism is more concrete than it sounds. Your operating system
        and each of your browsers ship a <strong>trust store</strong> — a bundled, curated list of root
        Certificate Authority (CA) certificates they have decided to trust unconditionally. The previous
        lesson covered the chain of trust in the abstract; this one finds the actual list on disk, counts
        it, and proves — with a real certificate from a real bank — that the chain resolves into it.
      </p>

      <InfoBox variant="info" title="Trust Store, Defined">
        <p>
          A trust store is not a key vault and it holds no secrets — every certificate in it is a{' '}
          <strong>public</strong> root certificate. What it protects is a decision: &quot;these ~150
          organizations are allowed to vouch for who owns a domain.&quot; When a server presents a
          certificate chain during TLS, your OS or browser checks whether that chain terminates at one of
          the roots already sitting in this list. If it does, no warning. If it does not, you get the red
          padlock.
        </p>
      </InfoBox>

      <h2>Finding the Real List</h2>

      <p>
        On macOS, the OS-level trust store is a keychain file, and you can query it directly with the{' '}
        <code>security</code> CLI. This is not a hypothetical count — it was run on this machine while
        writing this lesson:
      </p>

      <CodeBlock language="bash" title="Counting Trusted Roots (macOS, real output)">
{`$ security find-certificate -a /System/Library/Keychains/SystemRootCertificates.keychain | grep -c '"labl"'
158

# Cross-checked a second way, counting keychain entry headers instead of labels —
# same file, independent method, same answer:
$ security find-certificate -a /System/Library/Keychains/SystemRootCertificates.keychain | grep -c 'keychain:'
158`}
      </CodeBlock>

      <p>
        <strong>158 root CA certificates</strong>, bundled by Apple and updated with OS updates. That
        number is not universal — it will differ on Windows, on Linux distributions (which pull from{' '}
        <code>ca-certificates</code>, ultimately sourced from Mozilla&apos;s <code>NSS</code> root
        program), and it changes over time as CAs are added or distrusted. The exact figure matters less
        than the structure: it is a finite, small, curated list, not &quot;every CA that exists.&quot;
      </p>

      <InfoBox variant="note" title="A Nuance Worth Knowing">
        <p>
          This keychain lists every root Apple ships, but macOS can layer per-certificate trust
          <em> overrides</em> on top (visible in Keychain Access under each cert&apos;s &quot;Trust&quot;
          settings) — a root can be present in this file but explicitly distrusted, which is how Apple has
          handled roots it no longer considers safe without deleting them outright. 158 is the count of
          bundled roots, not a guarantee every one of them is currently honored for TLS.
        </p>
      </InfoBox>

      <h2>Proving the Chain Actually Resolves Into It</h2>

      <p>
        Here is the part that turns &quot;trust store&quot; from a definition into the actual reason your
        bank does not warn you. A live TLS connection to <code>chase.com</code>, captured on this machine,
        shows exactly what the server sends and exactly what it deliberately does <em>not</em> send:
      </p>

      <CodeBlock language="bash" title="What chase.com Actually Presents (real output)">
{`$ echo | openssl s_client -connect chase.com:443 -servername chase.com -showcerts 2>/dev/null \\
    | openssl x509 -noout -subject -issuer   # (repeated per cert in the chain)

Certificate 0 (the leaf):
  subject= ... O=JPMorgan Chase & Co., CN=www.chase.com
  issuer=  C=US, O=DigiCert Inc, CN=DigiCert EV RSA CA G2

Certificate 1 (the intermediate):
  subject= C=US, O=DigiCert Inc, CN=DigiCert EV RSA CA G2
  issuer=  C=US, O=DigiCert Inc, OU=www.digicert.com, CN=DigiCert Global Root G2

# Only 2 certificates were sent over the wire. The root — "DigiCert Global
# Root G2" — was never transmitted. It doesn't need to be; it's supposed to
# already be sitting on your machine.`}
      </CodeBlock>

      <p>
        So — is it actually there? Querying the same 158-entry trust store from above for that exact root:
      </p>

      <CodeBlock language="bash" title="Confirming the Root Is Already Trusted Locally (real output)">
{`$ security find-certificate -a -c "DigiCert Global Root G2" /System/Library/Keychains/SystemRootCertificates.keychain \\
    | grep '"labl"'
    "labl"<blob>="DigiCert Global Root G2"

# And the definitive test — hand macOS the exact two certificates chase.com
# sent and ask it to verify the chain against the system trust store:
$ security verify-cert -c cert0.pem -c cert1.pem
...certificate verification successful.`}
      </CodeBlock>

      <p>
        That is the entire mechanism, end to end, with nothing taken on faith: the bank&apos;s leaf
        certificate chains to an intermediate, the intermediate chains to a root, and that root was
        already one of the 158 entries bundled into this Mac before the connection ever happened. No
        warning appears not because the bank is special — it is because DigiCert (the CA that issued its
        certificate) paid to be audited into every major trust store years ago, and every OS and browser
        vendor already shipped that decision to your machine.
      </p>

      <FlowChart
        title="Why No Warning Appears"
        chart={"graph TD\n  A[\"Leaf cert: CN=www.chase.com\"] -->|\"issued by\"| B[\"Intermediate: DigiCert EV RSA CA G2\"]\n  B -->|\"issued by\"| C[\"Root: DigiCert Global Root G2\"]\n  C -.->|\"already present\"| D[\"Local trust store (158 roots on this Mac)\"]\n  D --> E[\"Chain resolves -> padlock, no warning\"]\n  style A fill:#1a2744,stroke:#5b9cf6\n  style D fill:#3d2f14,stroke:#d97706\n  style E fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="danger" title="The Inverse Is the Whole Point of the Warning">
        <p>
          Flip the scenario: if an attacker stands up a fake <code>chase.com</code> with a self-signed
          certificate, or one signed by a CA that isn&apos;t in that 158-entry list, the chain has nowhere
          to terminate inside your trust store. That is precisely the condition that produces the red,
          full-page &quot;Your connection is not private&quot; warning — the browser isn&apos;t guessing
          the site is fake, it is reporting a hard fact: it could not walk the presented chain to any root
          it already trusts.
        </p>
      </InfoBox>

      <h2>OS Trust Store vs. Browser Trust Store — They Are Not Always the Same List</h2>

      <p>
        The keychain queried above is the <strong>OS-level</strong> store, and Safari uses it directly.
        Firefox does not — it has always shipped its own independent root list, built into its NSS
        (Network Security Services) library, so a root Apple distrusts might still be trusted by Firefox,
        or vice versa. That independence is easy to confirm without opening the browser at all: Firefox
        keeps its own certificate database file on disk, entirely separate from the macOS keychain queried
        above.
      </p>

      <CodeBlock language="bash" title="Firefox's Independent Cert Database (real output, this machine)">
{`$ find "$HOME/Library/Application Support/Firefox/Profiles" -maxdepth 2 -iname "cert9.db"
/Users/.../Firefox/Profiles/afed1s1d.default-release/cert9.db

# That file — not the macOS Keychain — is what Firefox consults. It ships its
# own bundled root list independent of Apple's.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Chrome — Hedged, Not Verified Here">
        <p>
          Chrome is the trickiest of the three, and I want to be precise about what is documented versus
          what I actually queried on this machine. Historically Chrome deferred to the host OS&apos;s
          trust store on each platform. Per Google&apos;s own published documentation, starting with{' '}
          <strong>Chrome 105 (2022)</strong> it switched to its own curated list, the{' '}
          <strong>Chrome Root Store</strong>, used by default on Windows, macOS, Linux, ChromeOS, and
          Android (iOS is the documented exception — Apple requires browsers there to use the system
          store). I have not independently queried Chrome&apos;s internal root list count on this machine
          the way I did for the OS keychain and Firefox&apos;s <code>cert9.db</code> above, so treat the
          Chrome-specific version number and rollout details as documentation-sourced rather than
          command-verified.
        </p>
      </InfoBox>

      <h2>Hardware-Backed Keys: TPM and Secure Enclave</h2>

      <p>
        A trust store answers &quot;which public root certificates does this device believe?&quot; A
        separate, related piece of hardware answers a different question: &quot;where does a{' '}
        <em>private</em> key live so it can be used without ever being extractable?&quot; This is the
        mechanism underneath Touch ID, Windows Hello, and passkeys, and it is worth being precise about
        since it is easy to overstate.
      </p>

      <InfoBox variant="info" title="TPM and Secure Enclave — Conceptually">
        <p>
          <strong>TPM (Trusted Platform Module)</strong> — A dedicated security chip (or firmware
          equivalent) standard on modern Windows PCs, used for full-disk encryption key storage
          (BitLocker), Windows Hello biometric credentials, and measured boot. Private keys generated
          inside it are marked non-exportable: the chip will perform sign/decrypt operations with the key
          on request, but the OS itself is never handed the raw key material.
        </p>
        <p>
          <strong>Secure Enclave</strong> — Apple&apos;s equivalent: a physically separate coprocessor
          built into every Apple Silicon Mac, iPhone, and iPad, with its own encrypted memory the main CPU
          cannot read directly. It generates and stores the private keys behind Touch ID and Face ID, and
          apps can request a Secure-Enclave-backed key via the Keychain APIs — the key material never
          leaves the coprocessor even if the OS itself is compromised.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="What I Verified vs. What I Am Hedging">
        <p>
          This machine is confirmed Apple Silicon —{' '}
          <code>system_profiler SPHardwareDataType</code> reports <strong>Chip: Apple M4 Pro</strong> —
          so it does physically contain a Secure Enclave; that part is a direct hardware fact about this
          Mac, not a guess. What I did <em>not</em> do is drive an actual Secure-Enclave-backed key
          generation and signing round trip from the command line — that requires a small native
          Swift/Objective-C program using the Keychain <code>kSecAttrTokenIDSecureEnclave</code> API
          rather than anything scriptable from a shell, so it is out of scope for a verified demo here.
          Take the mechanism above as an accurate description of how the hardware works, not as something
          this lesson ran and captured output from.
        </p>
      </InfoBox>

      <h2>Practical: Getting a Locally-Trusted Certificate for Development</h2>

      <p>
        Everything above explains why a <em>self-signed</em> certificate for <code>localhost</code> throws
        a browser warning — it isn&apos;t in anyone&apos;s trust store. <code>mkcert</code> is the standard
        tool for making local development HTTPS actually clean: it generates its own local CA and installs{' '}
        <em>that CA&apos;s root</em> into your OS and browser trust stores, so certificates it subsequently
        issues for <code>localhost</code> are trusted exactly the same way DigiCert&apos;s root is trusted
        above — because now it&apos;s sitting in the same list.
      </p>

      <InfoBox variant="warning" title="Checked on This Machine: mkcert Is Not Installed">
        <p>
          Before writing the command below, I checked whether it was actually available here:
        </p>
        <p>
          <code>$ mkcert --version</code>
          <br />
          <code>zsh: command not found: mkcert</code>
        </p>
        <p>
          Per the ground rule for this lesson, I am not fabricating what running it would print. What
          follows is the documented workflow, described accurately, and clearly labeled as{' '}
          <strong>not executed here</strong>. Homebrew <em>is</em> installed on this machine (confirmed:{' '}
          <code>brew --version</code> → Homebrew 6.0.17), so <code>brew install mkcert</code> is the real,
          working install path if you want to run this yourself.
        </p>
      </InfoBox>

      <CodeBlock language="bash" title="mkcert Workflow (documented, NOT run on this machine)">
{`# 1. Install (Homebrew is present on this Mac, so this command would work)
brew install mkcert

# 2. Generate a local CA and install its root into the OS + browser trust
#    stores mkcert can find (this is the step that makes it seamless —
#    no manual "add exception" click required afterward)
mkcert -install

# 3. Issue a certificate for local development domains
mkcert localhost 127.0.0.1 ::1

# Produces two files in the current directory:
#   localhost+2.pem       <- the leaf certificate
#   localhost+2-key.pem   <- the private key
#
# Point your dev server's TLS config at these two files. Because step 2
# installed mkcert's CA root into your trust store, the browser resolves
# the chain the exact same way it resolved chase.com's chain above --
# no red warning, no manually dismissed exception.`}
      </CodeBlock>

      <p>
        The mechanism is identical to the DigiCert example above, just at a much smaller, local scale:
        mkcert&apos;s CA takes the place of DigiCert, your own trust store takes the place of the 158-entry
        bundle you queried, and a <code>localhost</code> cert takes the place of <code>chase.com</code>
        &apos;s. Nothing about how trust resolution works changes — only who is running the CA.
      </p>

      <h2>Key Takeaways</h2>

      <InfoBox variant="tip" title="What This Lesson Actually Proved">
        <p>
          <strong>Trust stores are real, bundled, and countable.</strong> This Mac ships 158 root CA
          certificates in its system keychain — verified with <code>security find-certificate</code>, two
          independent ways.
        </p>
        <p>
          <strong>The chain-of-trust check is not abstract.</strong> A live connection to{' '}
          <code>chase.com</code> sends exactly 2 certificates; the root it ultimately depends on was
          already sitting in the local trust store before the connection started — confirmed with{' '}
          <code>security verify-cert</code>.
        </p>
        <p>
          <strong>OS and browser trust stores can diverge.</strong> Firefox keeps its own independent{' '}
          <code>cert9.db</code>, confirmed present on this machine. Chrome&apos;s move to its own root
          store (documented, not independently re-verified here) is another instance of the same pattern.
        </p>
        <p>
          <strong>Hardware key stores (TPM / Secure Enclave) are a related but separate mechanism</strong>{' '}
          — they protect where a <em>private</em> key lives, not which public roots are trusted.
        </p>
      </InfoBox>

      <p>
        Trust stores answer where the <em>public</em> half of a certificate chain gets believed. The next
        lesson turns to the private side — specifically, what happens when a key itself needs protecting,
        and how systems avoid re-encrypting an entire dataset every time a protecting key is rotated.
      </p>

      <InteractiveChallenge
        question={"Why doesn't your browser warn you when connecting to your bank's website, but it does warn you for a self-signed certificate on localhost?"}
        options={[
          "Banks pay browser vendors a fee to skip the warning",
          "The bank's certificate chains up to a root CA already bundled in the OS/browser's trust store; a self-signed cert has no such chain to a trusted root",
          "Bank websites use a special encryption algorithm that localhost doesn't support",
          "The warning is based on the website's traffic volume, not its certificate"
        ]}
        correctIndex={1}
        explanation={"The trust store is a finite, bundled list of root CA certificates (158 on a typical Mac, verified with `security find-certificate`). A bank's leaf certificate chains through an intermediate up to a root that CAs like DigiCert got audited into that list years ago. A self-signed cert has no issuer chaining to any of those roots, so the browser has nothing to resolve trust against -- hence the warning. mkcert works around this for local development by installing its own CA root into your trust store, at which point certs it issues resolve exactly the same way."}
      />

      <InteractiveChallenge
        question={"What is the key difference between a trust store and a TPM/Secure Enclave?"}
        options={[
          "They are two names for the same thing",
          "A trust store holds public root certificates used to validate certificate chains; a TPM/Secure Enclave is hardware that stores private keys so they can be used without ever being extracted",
          "A trust store is hardware, a TPM is software",
          "TPMs replace the need for trust stores entirely"
        ]}
        correctIndex={1}
        explanation={"A trust store (like macOS's SystemRootCertificates.keychain, or Firefox's cert9.db) is a list of public root CA certificates the OS or browser has decided to believe -- it contains no secrets. A TPM or Secure Enclave is separate hardware whose job is protecting private key material: it can perform sign/decrypt operations with a key on request, but the raw private key is never handed to the OS, even if the OS is compromised. One is about which public certificates to trust; the other is about where a private key physically lives."}
      />
    </LessonLayout>
  );
}
