import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function CryptoCertificateIssuance() {
  return (
    <LessonLayout
      title="How a Certificate Is Actually Made"
      sectionId="cryptography"
      lessonIndex={6}
      prev={{ path: '/cryptography/signing-files', label: 'Signing Files & Software' }}
      next={{ path: '/cryptography/tls', label: 'TLS & HTTPS' }}
    >
      <p>
        The TLS lesson explains <em>why</em> the chain of trust is shaped the way it is — why an
        intermediate CA exists, why the root stays offline, why compromising one link only burns that
        link. This lesson does not repeat that reasoning. It answers a narrower, more mechanical
        question instead: when a certificate gets &quot;issued,&quot; what literally happens, byte by
        byte? The answer turns out to be everything from the last two lessons, applied to a slightly
        different kind of payload.
      </p>

      <InfoBox variant="info" title="The Claim This Lesson Proves">
        <p>
          A certificate is, structurally, nothing but <strong>&quot;a public key and an identity,
          signed by someone.&quot;</strong> That is it. Every field you saw in the TLS lesson&#39;s
          X.509 structure box — Subject, Issuer, Validity, Signature — exists to make that one
          sentence auditable. This lesson demonstrates it directly with real commands and real output,
          using OpenSSL 3.6.2, actually run in this environment.
        </p>
      </InfoBox>

      <h2>Step 1: Generate a Key Pair</h2>

      <p>
        Every certificate starts exactly where the last two lessons started — with a private/public key
        pair. Nothing about certificate issuance changes this step; it is the same key generation you
        already know.
      </p>

      <CodeBlock language="bash" title="Generate an EC Private Key (Real Output)">
{`$ openssl ecparam -name prime256v1 -genkey -noout -out server.key
$ cat server.key
-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIDlBuo6pd2XLopiaDGrBPEDkHuYyEP6KZYr209TNMxr+oAoGCCqGSM49
AwEHoUQDQgAE5pKiaVgLESVu0hxad5exgl32TAkpya/sZF912gNlm+vIU6+tgU0d
SXf/fg5VSAT5i2ean2QB+/ILTeD1QyHmMA==
-----END EC PRIVATE KEY-----`}
      </CodeBlock>

      <h2>Step 2: Build a CSR (Certificate Signing Request)</h2>

      <p>
        A CSR bundles your <strong>public key</strong> with the <strong>identity you are claiming</strong>{' '}
        (a domain name, an organization) into one document, and sends it to a CA to ask for a
        certificate. Critically, the CSR is signed too — but with the <em>applicant&#39;s own private
        key</em>, not the CA&#39;s. That self-signature is not an identity claim; it is <strong>proof
        of possession</strong> — it demonstrates that whoever submitted this CSR actually holds the
        private key matching the public key inside it, so the CA is not about to bind someone else&#39;s
        key to your name.
      </p>

      <CodeBlock language="bash" title="Build and Inspect a CSR (Real Output)">
{`$ openssl req -new -key server.key -out server.csr \\
    -subj "/CN=www.example-lesson.test/O=Example Lesson Co"

$ openssl req -in server.csr -text -noout
Certificate Request:
    Data:
        Version: 1 (0x0)
        Subject: CN=www.example-lesson.test, O=Example Lesson Co
        Subject Public Key Info:
            Public Key Algorithm: id-ecPublicKey
                Public-Key: (256 bit)
                pub:
                    04:e6:92:a2:69:58:0b:11:25:6e:d2:1c:5a:77:97:
                    b1:82:5d:f6:4c:09:29:c9:af:ec:64:5f:75:da:03:
                    65:9b:eb:c8:53:af:ad:81:4d:1d:49:77:ff:7e:0e:
                    55:48:04:f9:8b:67:9a:9f:64:01:fb:f2:0b:4d:e0:
                    f5:43:21:e6:30
                ASN1 OID: prime256v1
                NIST CURVE: P-256
        Attributes:
            (none)
    Signature Algorithm: ecdsa-with-SHA256
    Signature Value:
        30:45:02:21:00:ff:3f:b6:5c:fc:9e:f7:b1:e3:58:e4:6c:04:
        e7:1a:a3:19:21:bd:ce:26:c3:11:f3:04:4a:23:79:9e:ac:42:
        a2:02:20:22:06:b9:2a:a4:fa:9e:b2:cf:e4:99:e0:47:ea:a0:
        51:1d:ed:79:b3:dc:c2:82:9f:1b:67:f4:8c:21:df:f4:ec`}
      </CodeBlock>

      <p>
        Notice what is <em>not</em> here: there is no <code>Issuer</code> field. A CSR is not a
        certificate — nobody has vouched for this identity yet. It is just a signed request: &quot;here
        is a public key, here is who I claim to be, and here is proof I hold the matching private
        key.&quot; (A production CSR for a real site would also carry a Subject Alternative Name
        extension — the <code>DNS:</code> entries the TLS lesson&#39;s certificate structure box shows
        — omitted here to keep the example focused on the signing mechanics.)
      </p>

      <h2>Step 3: The CA Verifies You Control the Identity</h2>

      <p>
        This is the step no <code>openssl</code> command can demonstrate, because it is not
        cryptography — it is the CA checking a real-world fact before it will sign anything. For a
        domain-validated certificate, the modern mechanism is the <strong>ACME protocol</strong> (RFC
        8555), which is what powers Let&#39;s Encrypt and every automated CA today. ACME defines two
        challenge types worth knowing precisely:
      </p>

      <InfoBox variant="tip" title="HTTP-01 vs DNS-01 — What Each One Actually Proves">
        <p>
          <strong>HTTP-01</strong> — The CA hands your ACME client a token. Your client publishes a
          file at <code>http://your-domain/.well-known/acme-challenge/&lt;token&gt;</code>{' '}
          containing that token plus a thumbprint of your ACME account key. The CA fetches that URL
          over port 80. If it gets back the expected value, that proves you control{' '}
          <strong>whatever is currently serving HTTP for that domain</strong> — nothing more, nothing
          less.
        </p>
        <p>
          <strong>DNS-01</strong> — The CA hands your ACME client a token. Your client publishes a{' '}
          <code>TXT</code> record at <code>_acme-challenge.your-domain</code> whose value is the
          SHA-256 digest of the key authorization (token + account key thumbprint). The CA queries DNS
          for that record. This proves you control <strong>the domain&#39;s DNS zone</strong> — which
          is why it is the only option for wildcard certificates (<code>*.example.com</code>): there is
          no single HTTP server that could answer for every possible subdomain, but one DNS record can.
        </p>
      </InfoBox>

      <p>
        Either way, notice what domain validation is and is not: it proves control of a resource
        (a web path or a DNS zone) at the moment of the challenge. It says nothing about the legal
        entity behind the domain — that stronger claim is what Organization Validation (OV) and
        Extended Validation (EV) certificates exist for, and why they involve actual human paperwork
        instead of an automated challenge.
      </p>

      <h2>Step 4: The CA Signs — and That Signature IS the Certificate</h2>

      <p>
        Once the CA is satisfied, it takes the public key and identity from your CSR and signs{' '}
        <em>that</em> with the <strong>CA&#39;s own private key</strong> — the same key whose matching
        public key sits in every browser&#39;s trust store. The output of that one signing operation is
        your certificate. To make this concrete, here is a toy CA, built and used for real:
      </p>

      <CodeBlock language="bash" title="Build a Toy CA and Sign the CSR (Real Output)">
{`# The CA's own key pair and self-signed root certificate
$ openssl ecparam -name prime256v1 -genkey -noout -out ca.key
$ openssl req -x509 -new -key ca.key -out ca.crt -days 3650 \\
    -subj "/CN=Example Lesson Root CA/O=Example Lesson Co"

# The CA signs the CSR's public key + identity with the CA's PRIVATE key
$ openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \\
    -CAcreateserial -out server.crt -days 365 -sha256
Certificate request self-signature ok
subject=CN=www.example-lesson.test, O=Example Lesson Co

# Inspect the resulting certificate
$ openssl x509 -in server.crt -text -noout
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            6f:8c:d5:fa:7b:e8:69:ca:da:69:80:bb:b3:5e:a8:cd:e6:5b:94:75
        Signature Algorithm: ecdsa-with-SHA256
        Issuer: CN=Example Lesson Root CA, O=Example Lesson Co
        Validity
            Not Before: Aug 15 03:15:51 2026 GMT
            Not After : Aug 15 03:15:51 2027 GMT
        Subject: CN=www.example-lesson.test, O=Example Lesson Co
        Subject Public Key Info:
            Public Key Algorithm: id-ecPublicKey
                Public-Key: (256 bit)
                pub:
                    04:e6:92:a2:69:58:0b:11:25:6e:d2:1c:5a:77:97:
                    b1:82:5d:f6:4c:09:29:c9:af:ec:64:5f:75:da:03:
                    65:9b:eb:c8:53:af:ad:81:4d:1d:49:77:ff:7e:0e:
                    55:48:04:f9:8b:67:9a:9f:64:01:fb:f2:0b:4d:e0:
                    f5:43:21:e6:30
                ASN1 OID: prime256v1
                NIST CURVE: P-256
        X509v3 extensions:
            X509v3 Subject Key Identifier:
                37:90:C7:72:FE:3A:BB:F8:04:12:1B:58:2C:C5:1F:3A:4D:71:67:E5
            X509v3 Authority Key Identifier:
                62:06:2C:CB:F0:AE:0A:A5:62:7F:87:00:4D:83:A5:11:27:1C:06:94
    Signature Algorithm: ecdsa-with-SHA256
    Signature Value:
        30:44:02:20:6e:fe:d1:f0:26:ef:e4:bb:82:e3:c1:f6:0f:17:
        8b:e8:0a:74:7b:90:d0:0a:d2:99:d7:a4:92:63:1c:b8:96:e1:
        02:20:07:7d:de:ff:f9:40:a3:72:62:2f:cd:60:b7:25:4d:7b:
        df:cd:e3:3d:ff:60:78:d1:12:c5:ef:0f:fe:dc:92:25

# Confirm the chain actually validates
$ openssl verify -CAfile ca.crt server.crt
server.crt: OK`}
      </CodeBlock>

      <p>
        Look at the shape of that output: <strong>Subject Public Key Info</strong> is the exact same
        public key that was in the CSR — the CA did not generate a new key, it certified the one you
        already had. <strong>Issuer</strong> now reads <code>Example Lesson Root CA</code>, not{' '}
        <code>www.example-lesson.test</code> — someone other than the subject is vouching for this.
        And at the very bottom, <strong>Signature Algorithm / Signature Value</strong> is the CA&#39;s
        ECDSA signature over everything above it (subject, public key, validity dates, extensions) —
        computed with the CA&#39;s private key, verifiable by anyone holding the CA&#39;s public key.
        That signature is not a decoration on the certificate. It <em>is</em> the certificate; strip it
        away and you are back to an unverified CSR.
      </p>

      <InfoBox variant="note" title="No OpenSSL? Java's keytool Does the Same Job">
        <p>
          This environment has OpenSSL, so that is what generated the output above. If it were not
          available, the JDK ships <code>keytool</code> for the same purpose —{' '}
          <code>keytool -genkeypair</code> to create a key pair and self-signed certificate,{' '}
          <code>keytool -certreq</code> to produce a CSR, and{' '}
          <code>keytool -printcert -file cert.crt</code> to inspect one. The underlying mechanics —
          key pair, CSR, CA signature — are identical; only the CLI surface differs.
        </p>
      </InfoBox>

      <h2>Self-Signed vs. CA-Signed</h2>

      <p>
        Run the CSR through <code>openssl req -x509</code> instead of asking the toy CA to sign it, and
        you get a certificate signed by the <strong>same key</strong> whose public half it certifies —
        a self-signed certificate. Compare the subject and issuer side by side, both taken from real
        certificates generated in this session:
      </p>

      <CodeBlock language="bash" title="Self-Signed vs. CA-Issued — Real Output, Same Key Pair">
{`$ openssl x509 -in selfsigned.crt -noout -subject -issuer
subject=CN=www.example-lesson.test, O=Example Lesson Co
issuer=CN=www.example-lesson.test, O=Example Lesson Co

$ openssl x509 -in server.crt -noout -subject -issuer
subject=CN=www.example-lesson.test, O=Example Lesson Co
issuer=CN=Example Lesson Root CA, O=Example Lesson Co`}
      </CodeBlock>

      <p>
        In the first certificate, subject and issuer are the same entity: the certificate is
        vouching for itself. Nothing is cryptographically wrong with it — the math checks out, the
        signature is valid, the public key really does belong to whoever holds the matching private
        key. What&#39;s missing is a <em>third party</em> the verifier already trusts saying &quot;I
        checked, this identity is real.&quot; That is exactly why browsers show a warning on self-signed
        certificates and not a cryptographic failure — and exactly why self-signed certificates are
        completely legitimate for local development, internal tooling, and service-to-service mTLS
        inside a network you control, where you can distribute the CA (or the cert itself) out of band
        and skip the public CA entirely.
      </p>

      <h2>Signing a Message and Signing a Certificate Are the Same Operation</h2>

      <InfoBox variant="success" title="The Distinction That Actually Matters">
        <p>
          Go back to the Java <code>SHA256withECDSA</code> demo two lessons ago: generate a key pair,
          call <code>Signature.sign()</code> on some bytes with a private key, call{' '}
          <code>Signature.verify()</code> with the matching public key. Every certificate in this
          lesson was produced by that exact same operation. The only difference is <strong>what bytes
          got signed</strong> — a plain message in the Signatures lesson, a structure containing a
          public key and an identity here. The CA does not run some separate &quot;certificate
          algorithm.&quot; It runs the same <code>ecdsa-with-SHA256</code> you already know, over a
          different payload.
        </p>
      </InfoBox>

      <p>
        With that, the mechanical gap in the TLS lesson is closed: you now know not just{' '}
        <em>why</em> the chain of trust is shaped the way it is, but exactly what &quot;issuing a
        certificate&quot; does at the byte level, using the identical signing primitive you already
        implemented by hand.
      </p>

      <InteractiveChallenge
        question={"A CSR (Certificate Signing Request) is signed by the applicant's own private key before being sent to a CA. What does that self-signature actually prove?"}
        options={[
          "It proves the CA has already verified the applicant's identity",
          "It proves the applicant possesses the private key matching the public key in the CSR — it is proof of possession, not an identity guarantee",
          "It proves the domain named in the CSR is currently reachable over HTTPS",
          "It is purely decorative and CAs ignore it"
        ]}
        correctIndex={1}
        explanation={"The CSR's self-signature demonstrates that whoever submitted it actually controls the private key paired with the public key inside — otherwise the CA could end up certifying a public key on behalf of someone who doesn't hold the corresponding private key. It says nothing about identity; that's a separate step (domain validation via ACME's HTTP-01/DNS-01, or human verification for OV/EV certs) that happens before the CA will sign anything with its own key."}
      />

      <InteractiveChallenge
        question={"What is structurally different between signing a plain message (the Signatures lesson) and signing a certificate?"}
        options={[
          "Certificates require a completely different signature algorithm than messages do",
          "Nothing about the cryptographic operation — it's the same sign/verify primitive (e.g. ecdsa-with-SHA256) applied to a different payload: a structure containing a public key and identity information instead of an arbitrary message",
          "Certificate signing requires a hardware security module; message signing does not",
          "Certificates are encrypted in addition to being signed, unlike plain messages"
        ]}
        correctIndex={1}
        explanation={"A CA issuing a certificate runs the exact same signature operation you used to sign a message with java.security.Signature — same algorithm, same sign-with-private-key / verify-with-public-key shape. The only thing that changes is what bytes are being signed: a certificate's payload is a structure containing the subject's public key, their claimed identity, and validity dates, rather than an arbitrary string. That's the entire trick behind 'a certificate is a public key and an identity, signed by someone.'"}
      />
    </LessonLayout>
  );
}
