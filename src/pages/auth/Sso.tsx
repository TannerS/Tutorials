import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';

export default function Sso() {
  return (
    <LessonLayout
      title="SSO & SAML"
      sectionId="auth"
      lessonIndex={6}
      prev={{ path: '/auth/security', label: 'Web Security (CORS, CSRF, XSS)' }}
      next={null}
    >
      <p>
        The OAuth 2.0 &amp; OIDC lesson already covers, in real depth, how a user proves who they are to
        one relying party through a federated login. This lesson is about a different question:{' '}
        <strong>an employee at a company signs in once and lands in Slack, then Salesforce, then the
        internal wiki, without typing a password again</strong>. That pattern is called Single Sign-On
        (SSO), and the biggest source of confusion around it is treating &quot;SSO&quot; as if it were a
        protocol. It is not — it is a goal that more than one protocol can implement, and SAML is the
        other major one, alongside OIDC.
      </p>

      <InfoBox variant="info" title="SSO Is a Pattern, Not a Protocol">
        <p>
          <strong>Single Sign-On</strong> means: authenticate once at a central{' '}
          <strong>Identity Provider (IdP)</strong>, and get into any number of separate{' '}
          <strong>Service Providers (SPs)</strong> — the individual applications — without
          re-entering credentials at each one. That is the entire definition. It says nothing about
          XML or JSON, tokens or assertions, redirects or POSTs.
        </p>
        <p>
          <strong>OAuth 2.0 / OIDC</strong> and <strong>SAML</strong> are two separate, technically
          unrelated protocols that both happen to be popular ways of <em>delivering</em> SSO. An
          organization running Okta or Azure AD as its IdP might have some applications wired up via
          OIDC and others via SAML — the end-user experience (log in once, land everywhere) looks
          identical either way, but the wire format, the token type, and the trust mechanics
          underneath are completely different. &quot;We use SSO&quot; is not a complete sentence
          about your stack; &quot;we use SAML-based SSO&quot; or &quot;we use OIDC-based SSO&quot; is.
        </p>
      </InfoBox>

      <h2>SAML 2.0: The Other SSO Protocol</h2>

      <p>
        SAML — Security Assertion Markup Language — is XML-based, in direct contrast to OIDC's
        JSON/JWT-based approach covered in the OAuth lesson. SAML 2.0 was ratified as an OASIS
        standard in March 2005, roughly a decade before OIDC existed (OIDC 1.0 arrived in 2014), which
        makes it the older of the two protocols by a wide margin.
      </p>

      <p>
        Age alone would not keep a protocol alive — what does is that large enterprises built entire
        identity infrastructures on top of it. A corporation running Active Directory Federation
        Services (ADFS) or an Okta/Azure AD tenant configured years ago has hundreds of internal and
        vendor applications already wired to it as SAML Service Providers. Ripping that out to move to
        OIDC is a project, not a config change, so it does not happen just because a newer protocol
        exists. On top of that, SAML support is frequently a hard line item on enterprise procurement
        and security-compliance checklists — a vendor selling to large companies typically has to
        support SAML SSO to even get on the shortlist, independent of technical merit. The practical
        rule of thumb: new consumer-facing apps default to OIDC; anything selling into enterprise IT
        needs to support SAML too, because that is what the buyer's identity team already runs.
      </p>

      <h2>The SP-Initiated Flow</h2>

      <p>
        SAML defines a couple of flow shapes, but the one you will meet in practice is{' '}
        <strong>SP-initiated</strong>: the user starts at the application, not at the identity portal.
      </p>

      <FlowChart
        title="SAML 2.0 — SP-Initiated SSO"
        chart={"graph TD\n  A[\"1. User requests a protected resource at the SP\"] --> B[\"2. SP redirects browser to the IdP with a SAML AuthnRequest\"]\n  B --> C[\"3. User authenticates at the IdP (or already has a session there)\"]\n  C --> D[\"4. IdP POSTs a signed SAML Response to the SP's Assertion Consumer Service (ACS) URL\"]\n  D --> E[\"5. SP validates the assertion's signature and creates a local session\"]\n  E --> F[\"User lands on the originally requested resource\"]\n  style A fill:#1a2744,stroke:#5b9cf6\n  style B fill:#1a2744,stroke:#5b9cf6\n  style D fill:#3d2f14,stroke:#d97706\n  style E fill:#1a3329,stroke:#4ade80\n  style F fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        Spelled out: (1) the user hits something like{' '}
        <code>https://app.example.com/dashboard</code> with no local session; (2) the SP builds a SAML{' '}
        <code>AuthnRequest</code> and redirects the browser to the IdP's Single Sign-On endpoint; (3)
        the IdP prompts for credentials, or silently reuses a session it already has for that user;
        (4) on success the IdP renders an auto-submitting HTML form that <code>POST</code>s a SAML{' '}
        <code>Response</code> — containing a signed XML assertion — to the SP's Assertion Consumer
        Service (ACS) URL; (5) the SP checks the signature, checks the assertion's conditions
        (audience, timing), and only then mints its own local session, exactly the same &quot;mint
        your own session&quot; step the OAuth lesson makes at the end of its flow.
      </p>

      <CodeBlock language="text" title="Step 2 — The AuthnRequest Redirect">
{`GET https://idp.example.org/sso/saml?SAMLRequest=fVLLbtswEPwVgXe9... HTTP/1.1
Host: idp.example.org

# SAMLRequest is a deflated, base64-encoded, URL-encoded XML document.
# Decoded, the core of it looks like:

<samlp:AuthnRequest
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    ID="_a1b2c3d4e5"
    Version="2.0"
    IssueInstant="2026-08-15T14:02:11Z"
    Destination="https://idp.example.org/sso/saml"
    AssertionConsumerServiceURL="https://app.example.com/saml/acs"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>https://app.example.com/saml/metadata</saml:Issuer>
</samlp:AuthnRequest>`}
      </CodeBlock>

      <p>
        Step 4 is where the actual proof of identity travels. Here is a trimmed but structurally real
        SAML assertion — the element names below are the genuine SAML 2.0 vocabulary, not
        approximations:
      </p>

      <CodeBlock language="xml" title="Step 4 — Signed Assertion Inside the SAML Response (Trimmed)">
{`<saml:Assertion
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="_f9e8d7c6b5" Version="2.0" IssueInstant="2026-08-15T14:02:14Z">

  <saml:Issuer>https://idp.example.org/SAML2</saml:Issuer>

  <!-- Signed by the IdP's private key — see "Why the Assertion Is Signed" below -->
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <ds:SignedInfo>...</ds:SignedInfo>
    <ds:SignatureValue>MIIDbTCC...</ds:SignatureValue>
    <ds:KeyInfo><ds:X509Data><ds:X509Certificate>MIIC...</ds:X509Certificate></ds:X509Data></ds:KeyInfo>
  </ds:Signature>

  <saml:Subject>
    <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress">
      alice@example.com
    </saml:NameID>
    <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
      <saml:SubjectConfirmationData
          Recipient="https://app.example.com/saml/acs"
          NotOnOrAfter="2026-08-15T14:07:14Z" />
    </saml:SubjectConfirmation>
  </saml:Subject>

  <saml:Conditions NotBefore="2026-08-15T14:01:44Z" NotOnOrAfter="2026-08-15T14:07:14Z">
    <saml:AudienceRestriction>
      <saml:Audience>https://app.example.com/saml/metadata</saml:Audience>
    </saml:AudienceRestriction>
  </saml:Conditions>

  <saml:AttributeStatement>
    <saml:Attribute Name="email">
      <saml:AttributeValue>alice@example.com</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="department">
      <saml:AttributeValue>Engineering</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
</saml:Assertion>`}
      </CodeBlock>

      <p>
        The shape maps directly onto OIDC concepts you already know: <code>saml:Subject</code>'s{' '}
        <code>NameID</code> is the equivalent of a JWT's <code>sub</code> claim,{' '}
        <code>saml:Conditions</code>'s audience/timing checks are the equivalent of a JWT's{' '}
        <code>aud</code>/<code>exp</code>, and <code>saml:AttributeStatement</code> is the equivalent
        of the extra claims OIDC would put in the ID token or return from <code>/userinfo</code>. The
        difference is entirely notation — SAML says the same things in XML that OIDC says in JSON.
      </p>

      <h2>Why the Assertion Is Signed</h2>

      <p>
        The <code>ds:Signature</code> block is not decoration. The IdP signs the assertion with its
        private key so that the SP — using the IdP's public key or certificate, exchanged in advance
        as part of SAML metadata — can verify the assertion genuinely came from the trusted IdP and
        was not forged or altered in transit. Change a single character of a signed assertion and
        signature verification fails, exactly the same non-repudiation property this site's Digital
        Signatures lesson covers in the cryptography section. An SP that skips this check is trusting
        an unsigned claim of &quot;this user is who they say they are&quot; from anyone who can reach
        its ACS endpoint, which defeats the entire point of delegating authentication to an IdP.
      </p>

      <h2>SCIM: Provisioning Alongside SSO</h2>

      <p>
        SSO answers &quot;can this already-known user log in without a password prompt?&quot; It does
        not answer a related question enterprises also need solved: when someone joins or leaves the
        company, who creates or deletes their accounts in every downstream tool? That is what{' '}
        <strong>SCIM</strong> — System for Cross-domain Identity Management, standardized in RFC 7643
        (schema) and RFC 7644 (protocol) — is for. It is a REST/JSON API convention for automatically
        provisioning and deprovisioning user accounts across systems, and it is commonly deployed
        alongside SAML or OIDC SSO: a new hire's IdP account triggers SCIM calls that create matching
        accounts in Slack, GitHub, and whatever else is wired up, and an offboarding disables the IdP
        account and lets SCIM deprovision everything downstream in the same motion. SSO controls
        access to an existing account; SCIM controls whether the account exists at all.
      </p>

      <InfoBox variant="tip" title="Do Not Hand-Roll SAML">
        <p>
          Parsing and validating SAML XML correctly — canonicalization, signature verification,
          handling both signed assertions and signed responses, XML-specific attacks like signature
          wrapping — is a genuinely well-known pain point in the industry, with a long history of
          real vulnerabilities in hand-written implementations. In practice, teams do not implement
          this from scratch. They use an identity platform (Okta, Auth0, Azure AD/Entra ID) as the IdP
          and a mature, audited library (or the platform's own SDK) on the SP side. Know the flow well
          enough to configure it, debug it, and reason about what a broken step implies — that is what
          this lesson is for — but treat writing your own SAML XML signing and parsing code as a task
          to avoid, not a rite of passage.
        </p>
      </InfoBox>

    </LessonLayout>
  );
}
