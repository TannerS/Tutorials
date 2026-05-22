import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function AuthOauth() {
  return (
    <LessonLayout
      title="OAuth 2.0"
      sectionId="auth"
      lessonIndex={4}
      prev={{ path: "/auth/jwt", label: "JWT Tokens" }}
      next={{ path: "/auth/authz", label: "Authorization Patterns" }}
    >
      <p>OAuth 2.0 is an authorization framework that lets applications request limited access to user accounts on third-party services without exposing passwords. It's the protocol behind "Login with Google/GitHub" and API authorization.</p>

      <h2>OAuth 2.0 Flows</h2>

      <FlowChart
        title="OAuth 2.0 Authorization Code Flow"
        chart={"graph TD\n  A[User clicks Login with Google] --> B[Redirect to Google]\n  B --> C[User grants permission]\n  C --> D[Google sends auth code]\n  D --> E[App exchanges code for tokens]\n  E --> F[Google returns access token]\n  F --> G[App calls Google API]"}
      />

      <CodeBlock language="yaml" title="Spring Boot OAuth2 Client">
{`# application.yml — configure OAuth providers
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope:
              - openid
              - profile
              - email
          github:
            client-id: ${GITHUB_CLIENT_ID}
            client-secret: ${GITHUB_CLIENT_SECRET}
            scope:
              - user:email
              - read:user
        provider:
          github:
            authorization-uri: https://github.com/login/oauth/authorize
            token-uri: https://github.com/login/oauth/access_token
            user-info-uri: https://api.github.com/user`}
      </CodeBlock>

      <CodeBlock language="java" title="Custom OAuth2 User Service">
{`@Service
public class OAuth2UserService
        extends DefaultOAuth2UserService {

    private final UserRepository userRepo;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oauthUser = super.loadUser(request);

        String provider = request.getClientRegistration().getRegistrationId(); // "google", "github"
        String providerId = oauthUser.getName();
        String email = oauthUser.getAttribute("email");
        String name  = oauthUser.getAttribute("name");

        // Create or update local user record
        User user = userRepo.findByProviderAndProviderId(provider, providerId)
            .orElseGet(() -> User.builder()
                .provider(provider)
                .providerId(providerId)
                .email(email)
                .displayName(name)
                .build());

        user.setDisplayName(name);
        user.setEmail(email);
        userRepo.save(user);

        return new CustomOAuth2User(oauthUser, user);
    }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="OpenID Connect">
        <p>OpenID Connect (OIDC) is built on top of OAuth 2.0. OAuth 2.0 handles authorization (can this app access your data?). OIDC adds authentication (who is this user?). OIDC adds an ID token (a JWT containing user identity) in addition to the access token. "Login with Google" uses OIDC.</p>
      </InfoBox>

      <InteractiveChallenge
        question="In OAuth 2.0 Authorization Code Flow, why is the authorization code exchanged for tokens server-to-server rather than in the browser?"
        options={["It is faster to exchange on the server", "The client secret cannot be safely stored in the browser — server-to-server keeps it confidential", "Browsers cannot make POST requests", "It allows the token to be cached"]}
        correctIndex={1}
        explanation="The authorization code exchange requires the client_secret to prove the app's identity. Client secrets cannot be safely stored in browsers (accessible via DevTools, localStorage). The server-side exchange keeps the secret on the server, and only the resulting tokens are sent to the frontend — never the secret."
      />

    </LessonLayout>
  );
}
