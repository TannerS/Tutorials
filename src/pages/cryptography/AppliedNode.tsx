import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function CryptoAppliedNode() {
  return (
    <LessonLayout
      title="Applied Cryptography — Node & TypeScript"
      sectionId="cryptography"
      lessonIndex={13}
      prev={{ path: '/cryptography/applied-java', label: 'Applied Cryptography — Java' }}
      next={{ path: '/cryptography/mistakes', label: 'Common Cryptographic Mistakes' }}
    >
      <p>
        Earlier lessons showed AES-256-GCM and ECDSA as isolated snippets that encrypt a string in
        memory. Real code encrypts <em>files</em>, derives keys from passwords a human actually typed,
        and has to explain to a user why a signature check failed. This lesson is four complete,
        runnable programs that do exactly that, using nothing beyond Node&apos;s built-in{' '}
        <code>node:crypto</code> and <code>node:fs</code> modules — no dependencies to install. Every
        program below was run against real Node v25 and the output blocks are pasted verbatim from that
        run, not reconstructed. The companion Java lesson builds the identical four programs in the same
        order, so you can compare the two languages primitive-by-primitive.
      </p>

      <h2>1. Encrypt and Decrypt a File with AES-256-GCM</h2>

      <p>
        The in-memory version from the encryption lesson encrypted a JavaScript string. Encrypting a
        file is the same primitive with one extra concern: the IV and the authentication tag have to
        travel with the ciphertext, because <code>decryptFile</code> needs them back to undo the
        operation. This program writes them as a single header in front of the ciphertext —{' '}
        <code>12-byte IV | 16-byte auth tag | ciphertext</code> — and reads that layout back apart on
        the way in.
      </p>

      <CodeBlock language="javascript" title="01-file-encrypt.js (Node.js, verified)">
{`const crypto = require('crypto');
const fs = require('fs');

// Encrypt a file with AES-256-GCM
function encryptFile(inputPath, outputPath, key) {
  const iv = crypto.randomBytes(12); // 96-bit IV, the size GCM is designed for
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const plaintext = fs.readFileSync(inputPath);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16-byte GCM tag, computed after final()

  // Store iv + authTag + ciphertext together so decryptFile has everything it needs
  const out = Buffer.concat([iv, authTag, ciphertext]);
  fs.writeFileSync(outputPath, out);
}

// Decrypt a file that was written by encryptFile
function decryptFile(inputPath, outputPath, key) {
  const data = fs.readFileSync(inputPath);
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  // Throws if the ciphertext or authTag was tampered with
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  fs.writeFileSync(outputPath, plaintext);
}

const key = crypto.randomBytes(32); // AES-256 needs a 32-byte key

fs.writeFileSync('secret.txt', 'The launch codes are 4815162342.\\n');

encryptFile('secret.txt', 'secret.txt.enc', key);
decryptFile('secret.txt.enc', 'secret.txt.dec', key);

const original = fs.readFileSync('secret.txt');
const roundTripped = fs.readFileSync('secret.txt.dec');

console.log('Original bytes:      ', original.length);
console.log('Encrypted file bytes:', fs.readFileSync('secret.txt.enc').length);
console.log('Round-trip matches original byte-for-byte:', original.equals(roundTripped));
console.log('Decrypted content:', roundTripped.toString('utf8'));`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output">
{`Original bytes:       33
Encrypted file bytes: 61
Round-trip matches original byte-for-byte: true
Decrypted content: The launch codes are 4815162342.`}
      </CodeBlock>

      <p>
        61 = 12 (IV) + 16 (auth tag) + 33 (ciphertext) — GCM ciphertext is exactly as long as the
        plaintext, so every extra byte in the file is accounted for.{' '}
        <code>original.equals(roundTripped)</code> does a real byte-for-byte <code>Buffer</code>{' '}
        comparison, not a string comparison that could paper over an encoding mismatch — this is the
        strongest round-trip check you can write for binary data.
      </p>

      <h2>2. Derive a Key from a Password</h2>

      <p>
        A user cannot type a 32-byte AES key, so you need a{' '}
        <strong>key derivation function (KDF)</strong> that turns a password into one. Node&apos;s own
        docs answer the &quot;which KDF&quot; question directly:{' '}
        <a
          href="https://nodejs.org/api/deprecations.html#dep0106-cryptocreatecipher-and-cryptocreatedecipher"
          target="_blank"
          rel="noopener noreferrer"
        >
          DEP0106
        </a>{' '}
        — the note explaining why <code>crypto.createCipher()</code> was removed — says: &quot;It is
        recommended to derive a key using <code>crypto.pbkdf2()</code> or <code>crypto.scrypt()</code>{' '}
        with random salts.&quot; Node lists both as acceptable, so the tiebreaker comes from reading
        each function&apos;s own description: the <code>scrypt</code> docs describe it as{' '}
        &quot;designed to be expensive computationally <em>and memory-wise</em>&quot; — it is a{' '}
        <strong>memory-hard</strong> KDF, which is what makes GPU/ASIC cracking rigs expensive to build
        against it. The <code>pbkdf2</code> docs make no such claim; PBKDF2 is CPU-cost only, which is
        why it needs a very high iteration count to compensate and is rated the weaker option in this
        site&apos;s own algorithm table. This program uses <code>scrypt</code>.
      </p>

      <InfoBox variant="tip" title="Node Also Ships a Native Argon2 Now">
        <p>
          While confirming the above, <code>node:crypto</code> turned out to already have{' '}
          <code>crypto.argon2()</code> / <code>crypto.argon2Sync()</code> built in — added in Node{' '}
          v24.7.0, and present in this environment&apos;s v25 (<code>typeof crypto.argon2 ===
          &apos;function&apos;</code> returns true). Node&apos;s docs do not yet call it out as the
          preferred KDF over <code>scrypt</code>/<code>pbkdf2</code>, so this program sticks with{' '}
          <code>scrypt</code> to match Node&apos;s documented guidance above — but if you are starting a
          new project on Node 24.7+, a native Argon2id is worth knowing about.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="02-password-derive.js (Node.js, verified)">
{`const crypto = require('crypto');

// Derive a 256-bit AES key from a password using scrypt (memory-hard,
// unlike PBKDF2 — see the writeup for why that matters).
function deriveKey(password, salt) {
  return crypto.scryptSync(password, salt, 32); // 32 bytes = 256 bits
}

function encryptWithPassword(plaintext, password) {
  const salt = crypto.randomBytes(16); // unique per encryption, stored alongside the ciphertext
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return { salt, iv, authTag, ciphertext };
}

function decryptWithPassword({ salt, iv, authTag, ciphertext }, password) {
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

const password = 'correct horse battery staple';
const message = 'Meet at the north gate at midnight.';

const packet = encryptWithPassword(message, password);
console.log('Salt:      ', packet.salt.toString('hex'));
console.log('IV:        ', packet.iv.toString('hex'));
console.log('Ciphertext:', packet.ciphertext.toString('hex'));

const recovered = decryptWithPassword(packet, password);
console.log('Decrypted: ', recovered);
console.log('Matches original:', recovered === message);

// Wrong password must not decrypt
try {
  decryptWithPassword(packet, 'wrong password');
  console.log('Wrong password decrypted — THIS SHOULD NOT HAPPEN');
} catch (err) {
  console.log('Wrong password rejected:', err.message);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output">
{`Salt:       dc198afbbfd4a26414ff014556a7664d
IV:         90eb57ebad123b60603c6ca0
Ciphertext: 1b620b43155d96fb8950db3fa86634586f5fcf6d29d6fa83f59e4ddc280335b8582e14
Decrypted:  Meet at the north gate at midnight.
Matches original: true
Wrong password rejected: Unsupported state or unable to authenticate data`}
      </CodeBlock>

      <p>
        &quot;Unsupported state or unable to authenticate data&quot; is OpenSSL&apos;s error message for
        a GCM auth-tag mismatch, surfacing through <code>decipher.final()</code>. It looks unrelated to
        passwords, but that is exactly what a wrong password produces here: a different password derives
        a different key, the different key produces a garbage decryption, and GCM&apos;s built-in
        integrity check catches the garbage and throws instead of silently returning nonsense bytes.
        You never see a &quot;wrong password&quot; error as such — you see this.
      </p>

      <h2>3. Generate a Keypair, Sign, and Verify — With Tamper Detection</h2>

      <p>
        The signatures lesson used ECDSA with an explicit <code>SHA256</code> digest. This program uses{' '}
        <code>Ed25519</code> instead — a modern signature algorithm that hashes internally, so{' '}
        <code>crypto.sign()</code>/<code>crypto.verify()</code> take <code>null</code> where you would
        otherwise name a digest. The interesting part is not the happy path — it is what verification
        does when the input has actually changed, checked two different ways: tamper with the document
        and keep the real signature, or keep the real document and tamper with the signature.
      </p>

      <CodeBlock language="javascript" title="03-sign-verify.js (Node.js, verified)">
{`const crypto = require('crypto');

// Ed25519: modern signature algorithm, no separate digest algorithm to pick —
// it hashes internally, so \`algorithm\` is \`null\` in sign()/verify().
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

const document = Buffer.from('Invoice #4471: pay $18,204.00 to Acme Supply Co.', 'utf8');

const signature = crypto.sign(null, document, privateKey);
console.log('Signature (hex):', signature.toString('hex'));
console.log('Signature length (bytes):', signature.length);

const isValid = crypto.verify(null, document, publicKey, signature);
console.log('Verify against original document:', isValid);

// Tamper with the document — change the amount
const tampered = Buffer.from('Invoice #4471: pay $99,204.00 to Acme Supply Co.', 'utf8');
const isTamperedValid = crypto.verify(null, tampered, publicKey, signature);
console.log('Verify against tampered document:', isTamperedValid);

// Tamper with the signature instead, leave the document alone
const tamperedSignature = Buffer.from(signature);
tamperedSignature[0] ^= 0xff; // flip every bit in the first byte
const isTamperedSigValid = crypto.verify(null, document, publicKey, tamperedSignature);
console.log('Verify with tampered signature:', isTamperedSigValid);

console.log('\\nPublic key (SPKI PEM):');
console.log(publicKey.export({ type: 'spki', format: 'pem' }).toString());`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output">
{`Signature (hex): bfcb33f911a4f0f7123fd85853be8ff4d1364f08439ff1122c5c87033acfa597659e91f6c16524345eecd43571c058b129561eaa16f31b2b8e74bf515f0b860b
Signature length (bytes): 64
Verify against original document: true
Verify against tampered document: false
Verify with tampered signature: false

Public key (SPKI PEM):
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAYAH5jrkDGrkfD++0bCton/vvs2g3gzJ7uoHutMeDeFA=
-----END PUBLIC KEY-----`}
      </CodeBlock>

      <p>
        Both tamper checks come back <code>false</code>, and for different reasons. Changing the
        document means the bytes being verified no longer match what was signed. Changing one bit of
        the signature means the value being checked is no longer the signature at all. Either way,{' '}
        <code>crypto.verify()</code> returns a plain boolean — it never throws just because a signature
        is invalid, which is exactly what makes it safe to put directly in an{' '}
        <code>if</code> statement. (Your own run will print a different signature and public key —
        <code>generateKeyPairSync</code> generates a fresh random keypair every time — but{' '}
        <code>true</code>/<code>false</code>/<code>false</code> will not change.)
      </p>

      <h2>4. Hash a File via a Stream</h2>

      <p>
        <code>fs.readFileSync()</code> followed by <code>crypto.createHash().update()</code> works, but
        it means holding the entire file in memory at once — fine for a 33-byte secret, a real problem
        for a multi-gigabyte backup. The idiomatic Node way pipes a <code>ReadStream</code> straight into
        the <code>Hash</code> object (itself a stream) so the file moves through in fixed-size chunks
        and memory use stays flat regardless of file size.
      </p>

      <CodeBlock language="javascript" title="04-hash-stream.js (Node.js, verified)">
{`const crypto = require('crypto');
const fs = require('fs');
const { pipeline } = require('stream/promises');

async function hashFile(path, algorithm = 'sha256') {
  const hash = crypto.createHash(algorithm);
  // pipeline pumps the file through the hash in fixed-size chunks —
  // memory use stays flat no matter how large the file is.
  await pipeline(fs.createReadStream(path), hash);
  return hash.digest('hex');
}

async function main() {
  // Build a file big enough that "load it all into memory" would actually matter.
  const path = 'bigfile.bin';
  const chunk = crypto.randomBytes(1024 * 1024); // 1 MiB chunk, reused
  const fd = fs.openSync(path, 'w');
  for (let i = 0; i < 50; i++) fs.writeSync(fd, chunk); // 50 MiB total
  fs.closeSync(fd);

  const size = fs.statSync(path).size;
  console.log('File size (bytes):', size);

  const streamed = await hashFile(path);
  console.log('SHA-256 (streamed):', streamed);

  // Sanity check against the naive whole-buffer approach — same algorithm,
  // just to confirm the streamed digest is correct, not a different value.
  const wholeBuffer = fs.readFileSync(path);
  const naive = crypto.createHash('sha256').update(wholeBuffer).digest('hex');
  console.log('SHA-256 (buffer):  ', naive);
  console.log('Digests match:', streamed === naive);

  fs.unlinkSync(path);
}

main();`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output">
{`File size (bytes): 52428800
SHA-256 (streamed): 4d14bcc4e07afe0b54f20c19dd5c3c76739937594f490fc1f7fe805579e1fbfd
SHA-256 (buffer):   4d14bcc4e07afe0b54f20c19dd5c3c76739937594f490fc1f7fe805579e1fbfd
Digests match: true`}
      </CodeBlock>

      <p>
        <code>hash</code> here is a <code>Transform</code> stream, so <code>pipeline()</code> treats it
        like any other stage in a pipe chain — the same <code>stream/promises</code> function you would
        use to pipe a file through gzip. The buffer-based digest is computed here only to prove the
        streamed one is correct, not because you would ever do both in real code.
      </p>

      <InfoBox variant="warning" title="Common Node Crypto Gotchas">
        <p>
          <strong>
            <code>crypto.createCipher()</code>/<code>crypto.createDecipher()</code> are gone, not just
            discouraged.
          </strong>{' '}
          Node&apos;s deprecations reference (<code>DEP0106</code>) confirms it: these functions derived
          the key and IV from a password using OpenSSL&apos;s <code>EVP_BytesToKey()</code> —{' '}
          &quot;a weak key derivation function (MD5 with no salt) and static initialization
          vectors,&quot; in Node&apos;s own words — and the entry is marked{' '}
          <strong>Type: End-of-Life</strong>, removed as of v22.0.0. This is not theoretical:{' '}
          <code>typeof crypto.createCipher</code> is <code>&apos;undefined&apos;</code> on the Node v25
          this lesson was verified against. Every program above uses{' '}
          <code>createCipheriv</code>/<code>createDecipheriv</code> with an explicit, random IV — that
          is the only supported path now, and it was already the only secure one.
        </p>
        <p>
          <strong>Never seed any of this with <code>Math.random()</code>.</strong> Every key, IV, salt,
          and nonce above came from <code>crypto.randomBytes()</code>. <code>Math.random()</code> is not
          cryptographically secure and must never generate anything in this lesson&apos;s vocabulary —
          the <strong>Secure Random Number Generation</strong> lesson covers exactly why and what to
          reach for instead.
        </p>
      </InfoBox>

      <p>
        Four programs, one module, zero dependencies: encrypt a file, turn a password into a key,
        prove a document is both authentic and untampered, and fingerprint a file without loading it
        into memory. The next lesson collects the mistakes that show up when these same primitives are
        wired together carelessly.
      </p>

      <InteractiveChallenge
        question={"An older Node.js tutorial calls crypto.createCipher('aes-256-cbc', password) directly with a password string. Why does every program in this lesson use createCipheriv() instead?"}
        options={[
          "createCipher() is only slower — it is otherwise cryptographically equivalent to createCipheriv()",
          "createCipher() derived the key and IV from the password using EVP_BytesToKey() — MD5 with no salt and a static IV — and Node removed it entirely as of v22.0.0, so typeof crypto.createCipher is 'undefined' today",
          "createCipheriv() is required only when encrypting files, not in-memory strings",
          "createCipher() still works fine today; it was deprecated only for stylistic reasons"
        ]}
        correctIndex={1}
        explanation={"createCipher()/createDecipher() are not just discouraged, they are gone — Node's own DEP0106 entry is marked Type: End-of-Life, removed in v22.0.0, and confirms the reason was a weak key derivation function (MD5 with no salt) plus a static, non-random IV baked into EVP_BytesToKey(). A static IV is exactly the kind of mistake this section's other lessons call out repeatedly: reusing an IV/nonce breaks the confidentiality guarantee GCM and CBC both depend on. createCipheriv() forces you to supply your own IV explicitly — paired with crypto.randomBytes(), never Math.random() — which is the only path Node supports now, and was already the only secure one."}
      />
    </LessonLayout>
  );
}
