import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function AuthTls() {
  return (
    <LessonLayout
      title="TLS and HTTPS"
      sectionId="auth"
      lessonIndex={1}
      prev={{ path: "/auth/encryption", label: "Encryption Basics" }}
      next={{ path: "/auth/cookies", label: "Cookies and Sessions" }}
    >
      <p>TLS (Transport Layer Security) encrypts data in transit, preventing eavesdropping and tampering. HTTPS is HTTP over TLS. Every web application must use HTTPS — modern browsers mark HTTP sites as "Not Secure" and many features are HTTPS-only.</p>

      <h2>TLS Handshake</h2>

      <FlowChart
        title="TLS 1.3 Handshake"
        chart={"graph LR\n  A[Client Hello] --> B[Server Hello]\n  B --> C[Certificate]\n  C --> D[Client Verifies Cert]\n  D --> E[Key Exchange]\n  E --> F[Encrypted Channel]\n  F --> G[Application Data]"}
      />

      <CodeBlock language="yaml" title="HTTPS in Spring Boot">
{`# application.yml — enable TLS
server:
  port: 8443
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: myapp
    protocol: TLS
    enabled-protocols: TLSv1.3,TLSv1.2  # disable TLS 1.0/1.1
    ciphers:
      - TLS_AES_128_GCM_SHA256
      - TLS_AES_256_GCM_SHA384
      - TLS_CHACHA20_POLY1305_SHA256`}
      </CodeBlock>

      <CodeBlock language="java" title="Security Headers — Critical HTTP Headers">
{`@Configuration
public class SecurityHeadersConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.headers(headers -> headers
            // Force HTTPS for 1 year, include subdomains
            .httpStrictTransportSecurity(hsts -> hsts
                .maxAgeInSeconds(31536000)
                .includeSubdomains(true)
                .preload(true))
            // Prevent MIME sniffing
            .contentTypeOptions(Customizer.withDefaults())
            // Control iframe embedding (prevent clickjacking)
            .frameOptions(frame -> frame.sameOrigin())
            // Enable XSS filter in older browsers
            .xssProtection(Customizer.withDefaults())
            // Content Security Policy — most powerful XSS defense
            .contentSecurityPolicy(csp -> csp
                .policyDirectives("default-src 'self'; " +
                    "script-src 'self' https://cdn.jsdelivr.net; " +
                    "style-src 'self' 'unsafe-inline'; " +
                    "img-src 'self' data: https:; " +
                    "frame-ancestors 'none'"))
            // Remove server fingerprint
            .and()
        );
        return http.build();
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Let's Encrypt">
        <p>Let's Encrypt provides free, automated TLS certificates. Use Certbot to get and auto-renew certificates. In production, handle TLS at the load balancer or reverse proxy (nginx/HAProxy) rather than in the application — simpler certificate management and better performance.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What does HSTS (HTTP Strict Transport Security) do?"
        options={["Encrypts HTTP request bodies", "Tells browsers to only connect via HTTPS for a specified duration, preventing downgrade attacks", "Validates TLS certificates automatically", "Prevents cross-site request forgery"]}
        correctIndex={1}
        explanation="HSTS tells browsers to always use HTTPS for your domain, even if the user types http://. Once a browser sees the HSTS header, it will refuse to make HTTP connections to that domain for the duration specified. This prevents SSL stripping attacks where an attacker downgrades HTTPS to HTTP."
      />

    </LessonLayout>
  );
}
