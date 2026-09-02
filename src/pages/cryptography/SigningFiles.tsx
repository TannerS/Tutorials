import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function CryptoSigningFiles() {
  return (
    <LessonLayout
      title="Signing Files & Software"
      sectionId="cryptography"
      lessonIndex={5}
      prev={{ path: '/cryptography/signatures', label: 'Digital Signatures' }}
      next={{ path: '/cryptography/certificate-issuance', label: 'How a Certificate Is Actually Made' }}
    >
      <p>
        Everything so far signed a short string in memory. The much more common real-world case is
        signing something big — a release tarball, an installer, a container image, a Git commit — and
        that changes the mechanics just enough to be worth its own lesson.
      </p>

      <h2>You Hash the File, Then Sign the Hash</h2>

      <p>
        Signature algorithms do not operate on arbitrary-length data. RSA signs a number bounded by its
        modulus; ECDSA signs a value bounded by the curve order. Hand either one a 5 GB installer and
        there is no operation defined for that input — mathematically, it is not a thing you can sign
        directly. The fix is the same one you already know from the Hashing lesson: reduce the file to
        a fixed-size digest first, and sign <em>that</em>.
      </p>

      <InfoBox variant="info" title="Sign the Fingerprint, Not the File">
        <p>
          Hash the file with SHA-256 (or whatever your hash lesson&#39;s properties call for — this
          lesson does not re-derive them), producing one fixed 32-byte digest no matter how large the
          input was. Sign that digest with your private key. To verify, the recipient re-hashes the
          file they received and checks the signature against the fresh digest. If a single bit
          changed anywhere in the file, the fresh hash will not match the one that was signed, and
          verification fails — you never need to run the signature algorithm over gigabytes of data,
          only over 32 bytes.
        </p>
      </InfoBox>

      <p>
        Below is the whole flow end to end, in both Node and Java: generate a signing key, write a 5 MB
        file to disk, hash it, sign the hash, verify against the untouched file, then flip exactly one
        byte and verify again to prove tampering is caught. Every line of output here is real, from
        running these exact scripts.
      </p>

      <CodeBlock language="javascript" title="Hash-Then-Sign a File, With Tamper Detection (Node.js)">
{`const crypto = require('crypto');
const fs = require('fs');

// 1. Generate a signing key pair (Ed25519 — small, fast, deterministic)
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

// 2. Write a "large file" to disk
const filePath = 'artifact.bin';
fs.writeFileSync(filePath, crypto.randomBytes(5 * 1024 * 1024)); // 5 MB

// 3. Hash the file — this is the step that makes signing tractable
function hashFile(path) {
  return crypto.createHash('sha256').update(fs.readFileSync(path)).digest();
}
const digest = hashFile(filePath);
console.log('SHA-256 of artifact.bin:', digest.toString('hex'));

// 4. Sign the 32-byte DIGEST, not the 5MB file
const signature = crypto.sign(null, digest, privateKey);
fs.writeFileSync(filePath + '.sig', signature); // a separate, detached signature file
console.log('Signature written to artifact.bin.sig (' + signature.length + ' bytes)');

// 5. Verify: re-hash the file, check the signature against the FRESH hash
function verify(path, sigPath) {
  const freshDigest = hashFile(path);
  const sig = fs.readFileSync(sigPath);
  return crypto.verify(null, freshDigest, publicKey, sig);
}
console.log('Verify (untouched file):', verify(filePath, filePath + '.sig'));

// 6. Flip exactly one byte and verify again
const buf = fs.readFileSync(filePath);
buf[1000] ^= 0x01;
fs.writeFileSync(filePath, buf);
console.log('Verify (1 byte flipped):', verify(filePath, filePath + '.sig'));

/* Real output:
SHA-256 of artifact.bin: 1a4c977c7e3e772bdd2d380fe3faaa4718120c56e307c3d85ff9a3f5e0e4c7a1
Signature written to artifact.bin.sig (64 bytes)
Verify (untouched file): true
Verify (1 byte flipped): false
*/`}
      </CodeBlock>

      <CodeBlock language="java" title="Hash-Then-Sign a File, With Tamper Detection (Java)">
{`import java.security.*;
import java.nio.file.*;

public class SignFileDemo {
    public static void main(String[] args) throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("Ed25519");
        KeyPair pair = kpg.generateKeyPair();

        Path filePath = Path.of("artifact.bin");
        byte[] contents = new byte[5 * 1024 * 1024];
        new SecureRandom().nextBytes(contents);
        Files.write(filePath, contents);

        byte[] digest = MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(filePath));
        System.out.println("SHA-256 of artifact.bin: " + bytesToHex(digest));

        Signature signer = Signature.getInstance("Ed25519");
        signer.initSign(pair.getPrivate());
        signer.update(digest);              // sign the digest, not the file
        byte[] signature = signer.sign();
        Files.write(Path.of("artifact.bin.sig"), signature);
        System.out.println("Signature written (" + signature.length + " bytes)");

        System.out.println("Verify (untouched file): " + verify(filePath, pair.getPublic(), signature));

        byte[] mutable = Files.readAllBytes(filePath);
        mutable[1000] ^= 0x01;
        Files.write(filePath, mutable);
        System.out.println("Verify (1 byte flipped): " + verify(filePath, pair.getPublic(), signature));
    }

    static boolean verify(Path path, PublicKey publicKey, byte[] signature) throws Exception {
        byte[] freshDigest = MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(path));
        Signature verifier = Signature.getInstance("Ed25519");
        verifier.initVerify(publicKey);
        verifier.update(freshDigest);
        return verifier.verify(signature);
    }

    static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}

/* Real output from javac SignFileDemo.java && java SignFileDemo:
SHA-256 of artifact.bin: 32fa70fc02ef4567070f2ab1b620e40e39036850ebbe8917d27bb74dfbdadd8c
Signature written (64 bytes)
Verify (untouched file): true
Verify (1 byte flipped): false
*/`}
      </CodeBlock>

      <h2>Detached Signatures — Why the Signature Lives in a Separate File</h2>

      <p>
        Both demos above wrote <code>artifact.bin.sig</code> as its own file next to{' '}
        <code>artifact.bin</code>, rather than embedding the signature inside the artifact. This is
        called a <strong>detached signature</strong>, and it is how most real signing tools ship
        signatures by default — <code>.sig</code> or <code>.asc</code> next to the thing it signs.
      </p>

      <InfoBox variant="tip" title="Why Detached, Not Embedded">
        <p>
          A detached signature lets the verifier check authenticity <strong>without needing to
          understand the artifact&#39;s file format at all</strong>. The verifier just needs bytes in,
          bytes out — it hashes the file and checks the signature against the hash. It works
          identically whether the artifact is a tarball, a container image layer, a PDF, or a raw
          binary. Embedding the signature inside the file, by contrast, means every consumer of that
          file format needs to know where inside the format the signature lives and how to strip it
          back out before hashing — format-specific work that a detached <code>.sig</code> avoids
          entirely. It also means you can distribute, mirror, or cache the artifact and the signature
          independently, and multiple parties can attach their own signatures to the same unmodified
          file.
        </p>
      </InfoBox>

      <h2>Real-World Examples</h2>

      <h3>GPG/PGP — Verified, Not Just Described</h3>

      <p>
        <code>gpg --detach-sign</code> is the classic tool for exactly this workflow, and GPG happens
        to be installed in this environment, so rather than describe it abstractly, here is the actual
        command sequence run end to end: generate a throwaway test key, sign a file, verify it, tamper
        with the file, verify again.
      </p>

      <CodeBlock language="bash" title="gpg --detach-sign, Verified for Real">
{`$ echo "This is a release artifact, version 1.0.0" > release.tar

$ gpg --batch --yes --detach-sign --local-user test@example.invalid \\
    --output release.tar.sig release.tar

$ gpg --verify release.tar.sig release.tar
gpg: Signature made Fri Aug 14 22:12:52 2026 CDT
gpg:                using EDDSA key DA52D452028F46A2D990B3C2893E6D80D2459A0A
gpg:                issuer "test@example.invalid"
gpg: Good signature from "Test Lesson Key <test@example.invalid>" [ultimate]

# Now tamper with the artifact and re-verify against the SAME .sig file
$ echo "This is a release artifact, version 9.9.9" > release.tar
$ gpg --verify release.tar.sig release.tar
gpg: Signature made Fri Aug 14 22:12:52 2026 CDT
gpg:                using EDDSA key DA52D452028F46A2D990B3C2893E6D80D2459A0A
gpg: BAD signature from "Test Lesson Key <test@example.invalid>" [ultimate]
$ echo $?
1`}
      </CodeBlock>

      <p>
        Same pattern as the Node/Java demos above — hash, sign the hash, ship a detached{' '}
        <code>.sig</code>, verify by re-hashing — just via a battle-tested CLI tool instead of code you
        wrote yourself. This is exactly how open-source maintainers sign release tarballs today: the
        signature file sits next to the download, and anyone can fetch the maintainer&#39;s public key
        and verify before running anything.
      </p>

      <h3>Package Managers Verifying Downloads</h3>

      <p>
        The same idea sits underneath most package ecosystems, described here at the concept level
        rather than any one tool&#39;s exact output: a package manager fetches an artifact and a
        signature (or a signed manifest covering several artifacts) alongside it, checks that signature
        against a public key it already trusts — from a keyring it ships with, a prior <code>TOFU</code>{' '}
        (trust-on-first-use) pin, or a certificate chain — and refuses to install the package if
        verification fails. The mechanics vary by ecosystem (some sign every artifact individually,
        others sign a repository-level index that references per-file hashes) but the underlying
        primitive is the same hash-then-sign-then-verify flow shown above.
      </p>

      <InfoBox variant="note" title="Sigstore / cosign — The Problem, Not the Syntax">
        <p>
          Container image signing has largely moved to <strong>Sigstore</strong> (with{' '}
          <code>cosign</code> as the common client), and it is worth understanding the problem it
          solves rather than memorizing its exact commands. Classic GPG signing asks a developer to
          generate a private key and then protect it <strong>forever</strong> — if it leaks, every
          artifact ever signed with it is suspect; if it is lost, they can never sign again, and there
          is no central authority who can easily tell a consumer &quot;yes, this really is the
          maintainer&#39;s key.&quot;
        </p>
        <p>
          Sigstore&#39;s answer is <strong>keyless signing</strong>: instead of a long-lived personal
          private key, the signer authenticates with an existing identity they already have (a GitHub
          Actions workflow, a Google account) via OIDC, and receives a{' '}
          <strong>short-lived certificate</strong> binding that identity to a freshly generated,
          ephemeral key pair — used for one signature and then discarded. A public transparency log
          records that the signing event happened. The result: verification asks &quot;was this signed
          by an identity I trust, at a time I can audit,&quot; and there is no long-lived secret sitting
          on a laptop for an attacker to steal. This is a conceptual description of the problem Sigstore
          solves — treat any exact <code>cosign</code> command syntax you see elsewhere as something to
          verify against the current docs before running it, since it was not tested as part of this
          lesson.
        </p>
      </InfoBox>

      <h3>Git Commit Signing — Verified, Not Just Described</h3>

      <p>
        The owner of this codebase will recognize this one directly:{' '}
        <code>git commit -S</code> signs a commit, and{' '}
        <code>git log --show-signature</code> verifies it. Same test key as the GPG demo above, run in
        a scratch Git repository — real output, not a description of expected behavior:
      </p>

      <CodeBlock language="bash" title="git commit -S / git log --show-signature, Verified for Real">
{`$ git config user.signingkey DA52D452028F46A2D990B3C2893E6D80D2459A0A
$ echo "hello" > file.txt
$ git add file.txt
$ git commit -S -m "Signed test commit"
[main (root-commit) 3296b02] Signed test commit
 1 file changed, 1 insertion(+)
 create mode 100644 file.txt

$ git log --show-signature -1
commit 3296b0219c857663d3f0741a289bfec10c6d7475
gpg: Signature made Fri Aug 14 22:13:08 2026 CDT
gpg:                using EDDSA key DA52D452028F46A2D990B3C2893E6D80D2459A0A
gpg: Good signature from "Test Lesson Key <test@example.invalid>" [ultimate]
Author: Test Lesson Key <test@example.invalid>
Date:   Fri Aug 14 22:13:08 2026 -0500

    Signed test commit`}
      </CodeBlock>

      <p>
        Under the hood this is still hash-then-sign: Git computes the commit object (author, message,
        parent hash, tree hash), and the GPG signature covers that commit object&#39;s content. GitHub
        and GitLab show the &quot;Verified&quot; badge on a commit by running the equivalent of{' '}
        <code>git log --show-signature</code> against the public keys the committer has uploaded to
        their account.
      </p>

      <h2>The Pattern Repeats</h2>

      <p>
        A release tarball, a container image, and a Git commit are three very different kinds of
        artifact, but every example above reduces to the same three steps: hash the thing, sign the
        hash with a private key, ship the signature detached so any verifier can re-hash and check it
        without understanding the artifact&#39;s internal format. The next lesson applies this exact
        primitive to a fourth kind of artifact — not a file, but an <em>identity</em>. A certificate
        turns out to be nothing more than a public key and some identity information, hashed and signed
        by a CA, using the same mechanism you just ran three times above.
      </p>

    </LessonLayout>
  );
}
