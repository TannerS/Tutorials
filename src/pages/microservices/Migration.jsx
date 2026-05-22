import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function MicroservicesMigration() {
  return (
    <LessonLayout
      title="Migration Strategies"
      sectionId="microservices"
      lessonIndex={7}
      prev={{ path: "/microservices/containers", label: "Containers and Docker" }}
      next={{ path: "/apidesign/intro", label: "API Design Introduction" }}
    >
      <p>Migrating a monolith to microservices is one of the most challenging architectural transformations. The Strangler Fig pattern provides a safe, incremental approach: gradually replace monolith functionality with services without a big-bang rewrite.</p>

      <h2>Strangler Fig Pattern</h2>

      <FlowChart
        title="Strangler Fig Migration"
        chart={"graph LR\n  A[All Traffic] --> B[Monolith v1]\n  C[50/50 Traffic] --> D[API Gateway]\n  D --> E[Monolith v1]\n  D --> F[New Services]\n  G[All Traffic] --> H[API Gateway]\n  H --> I[Microservices Only]"}
      />

      <CodeBlock language="java" title="Strangler Fig — Feature Flag Routing">
{`// API Gateway routes to monolith OR new service based on flag
@Component
public class UserRouteFilter implements GlobalFilter {
    private final FeatureFlags flags;
    private final String MONOLITH_URL = "http://monolith:8080";
    private final String USERS_SVC_URL = "http://user-service:8080";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        if (path.startsWith("/api/users") && flags.isEnabled("USE_USER_SERVICE")) {
            // Route to new microservice
            return chain.filter(exchange.mutate()
                .request(exchange.getRequest().mutate()
                    .uri(URI.create(USERS_SVC_URL + path))
                    .build())
                .build());
        }
        // Fall through to monolith
        return chain.filter(exchange);
    }
}`}
      </CodeBlock>

      <h2>Data Migration Strategy</h2>

      <CodeBlock language="java" title="Dual-Write During Migration">
{`// Phase 1: Write to both old and new, read from old
// Phase 2: Write to both, read from new
// Phase 3: Write and read from new only, remove old

@Service
public class UserService {
    private final LegacyUserDao legacyDao;       // monolith's DB
    private final UserRepository newRepo;         // new service's DB
    private final FeatureFlags flags;

    public User createUser(CreateUserRequest req) {
        User user = new User(req);

        // Always write to legacy during migration
        legacyDao.insert(user);

        // Also write to new DB if migrating
        if (flags.isEnabled("DUAL_WRITE_USERS")) {
            try {
                newRepo.save(user);
            } catch (Exception e) {
                // Don't fail the request — log and alert
                log.error("Dual-write to new user service failed", e);
                metrics.increment("dual_write.failure");
            }
        }

        return user;
    }

    public User getUser(Long id) {
        if (flags.isEnabled("READ_FROM_NEW_USER_SERVICE")) {
            return newRepo.findById(id).orElseThrow();
        }
        return legacyDao.findById(id);
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Migration Pitfalls">
        <p>Don't start by extracting the smallest service — extract based on team boundaries and change frequency. Don't migrate everything at once — one service at a time. Don't neglect distributed tracing from day one — you'll need it immediately. Don't forget to set up monitoring, logging, and alerting before extracting a service to production.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the Strangler Fig pattern for monolith migration?"
        options={["Immediately rewrite the entire monolith as microservices", "Incrementally extract services one at a time, routing traffic gradually until the monolith is replaced", "Split the monolith database first, then split the code", "Run two separate monoliths in parallel until one is removed"]}
        correctIndex={1}
        explanation="The Strangler Fig pattern (named after a vine that slowly surrounds and replaces a tree) extracts functionality piece by piece. An API gateway routes some traffic to new services while the monolith handles the rest. Over time, more traffic moves to services until the monolith handles nothing and can be removed."
      />

    </LessonLayout>
  );
}
