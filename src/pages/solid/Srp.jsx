import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SolidSrp() {
  return (
    <LessonLayout
      title="Single Responsibility Principle"
      sectionId="solid"
      lessonIndex={1}
      prev={{ path: '/solid/intro', label: 'SOLID Overview' }}
      next={{ path: '/solid/ocp', label: 'Open/Closed Principle' }}
    >
      <h2>What Is SRP?</h2>
      <p>
        The Single Responsibility Principle: <em>a class should have only one reason to change.</em>
        "Reason to change" means a stakeholder or actor whose requirements could force a modification.
        A class that handles user logic, database persistence, email notifications, and password
        hashing has four reasons to change — four teams, four sources of bugs, four merge conflicts.
        SRP says each class should serve exactly one actor.
      </p>

      <FlowChart
        title="SRP — One Reason to Change"
        chart={"graph TD\n  A[UserManager God Class] --> B[Business Logic Changes]\n  A --> C[DB Schema Changes]\n  A --> D[Email Template Changes]\n  A --> E[Security Policy Changes]\n  F[SRP Applied] --> G[UserService - 1 reason]\n  F --> H[UserRepository - 1 reason]\n  F --> I[EmailService - 1 reason]\n  F --> J[PasswordService - 1 reason]"}
      />

      <h2>Recognizing SRP Violations</h2>

      <CodeBlock language="java" title="God Class — Four Responsibilities in One">
{`// VIOLATION: This class has four distinct reasons to change
public class UserManager {
    private Connection dbConnection;

    // RESPONSIBILITY 1: Business logic / validation
    public User createUser(String email, String password) {
        if (!email.contains("@"))
            throw new IllegalArgumentException("Invalid email format");
        if (password.length() < 8)
            throw new IllegalArgumentException("Password must be 8+ characters");
        String hashedPassword = hashPassword(password);
        return saveToDatabase(email, hashedPassword);
    }

    // RESPONSIBILITY 2: Database / persistence
    private User saveToDatabase(String email, String hash) {
        try {
            String sql = "INSERT INTO users (email, password_hash) VALUES (?, ?)";
            PreparedStatement stmt = dbConnection.prepareStatement(sql, RETURN_GENERATED_KEYS);
            stmt.setString(1, email);
            stmt.setString(2, hash);
            stmt.executeUpdate();
            ResultSet keys = stmt.getGeneratedKeys();
            keys.next();
            return new User(keys.getLong(1), email);
        } catch (SQLException e) {
            throw new RuntimeException("DB error", e);
        }
    }

    // RESPONSIBILITY 3: Email / notifications
    public void sendWelcomeEmail(User user) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost("smtp.gmail.com");
        sender.setPort(587);
        sender.setUsername("system@company.com");
        sender.setPassword("secret");
        MimeMessage msg = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg);
        helper.setTo(user.getEmail());
        helper.setSubject("Welcome to our platform!");
        helper.setText("Thanks for signing up, " + user.getName() + "!");
        sender.send(msg);
    }

    // RESPONSIBILITY 4: Security / hashing
    private String hashPassword(String raw) {
        return BCrypt.hashpw(raw, BCrypt.gensalt(12));
    }
}
// Problems:
// - DB schema change → modify UserManager
// - Switch from BCrypt to Argon2 → modify UserManager
// - Change email provider → modify UserManager
// - Add phone validation → modify UserManager
// - Can't unit test without SMTP server and database
// - Impossible to reuse email logic in other services`}
      </CodeBlock>

      <h2>Applying SRP — Decompose by Actor</h2>

      <CodeBlock language="java" title="After SRP — Each Class Has One Reason to Change">
{`// Each class answers to exactly one stakeholder

// 1. UserValidator — answers to: product team (validation rules)
@Component
public class UserValidator {
    public void validate(String email, String password) {
        if (email == null || !email.matches("^[^@]+@[^@]+\\.[^@]+$"))
            throw new InvalidUserException("Invalid email: " + email);
        if (password == null || password.length() < 8)
            throw new InvalidUserException("Password must be at least 8 characters");
    }
}

// 2. PasswordService — answers to: security team (hashing algorithm)
@Service
public class PasswordService {
    public String hash(String rawPassword) {
        return BCrypt.hashpw(rawPassword, BCrypt.gensalt(12));
    }
    public boolean verify(String rawPassword, String hashedPassword) {
        return BCrypt.checkpw(rawPassword, hashedPassword);
    }
}

// 3. UserRepository — answers to: DBA team (schema, queries)
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}

// 4. EmailService — answers to: marketing team (templates, provider)
@Service
public class EmailService {
    private final JavaMailSender mailSender;

    public void sendWelcome(String to, String name) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Welcome to Our Platform!");
        message.setText("Hi " + name + ", thanks for joining us!");
        mailSender.send(message);
    }
}

// 5. UserService — orchestrator (thin — just delegates)
// Answers to: application architect (registration workflow)
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserValidator validator;
    private final PasswordService passwords;
    private final UserRepository users;
    private final EmailService email;

    @Transactional
    public User register(String emailAddr, String rawPassword, String name) {
        validator.validate(emailAddr, rawPassword);
        if (users.existsByEmail(emailAddr))
            throw new DuplicateEmailException(emailAddr);

        User user = users.save(new User(emailAddr, passwords.hash(rawPassword), name));
        email.sendWelcome(emailAddr, name);
        return user;
    }
}`}
      </CodeBlock>

      <h2>SRP in Frontend — React Components</h2>

      <CodeBlock language="jsx" title="SRP Applied to React Components">
{`// VIOLATION: one component fetches, transforms, and renders
function UserDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Responsibility 1: data fetching
    fetch('/api/users').then(r => r.json()).then(data => {
      // Responsibility 2: data transformation
      const active = data.filter(u => u.status === 'active');
      const stats = {
        total: data.length,
        active: active.length,
        revenue: active.reduce((sum, u) => sum + u.revenue, 0),
      };
      setUsers(active);
      setStats(stats);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="spinner">Loading...</div>;

  // Responsibility 3: layout/rendering
  return (
    <div>
      <div className="stat-card">{stats.active} active users</div>
      {/* lots of rendering logic mixed with data concerns */}
    </div>
  );
}

// ✓ SRP APPLIED — split into focused units

// Responsibility 1: data fetching — custom hook
function useUserData() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { users, loading, error };
}

// Responsibility 2: data transformation — pure function
function computeStats(users) {
  const active = users.filter(u => u.status === 'active');
  return {
    total: users.length,
    active: active.length,
    revenue: active.reduce((sum, u) => sum + u.revenue, 0),
  };
}

// Responsibility 3a: single stat display
function StatCard({ label, value }) {
  return <div className="stat-card"><span>{value}</span><p>{label}</p></div>;
}

// Responsibility 3b: layout orchestrator (thin)
function UserDashboard() {
  const { users, loading, error } = useUserData();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const stats = computeStats(users);

  return (
    <div>
      <StatCard label="Total Users" value={stats.total} />
      <StatCard label="Active Users" value={stats.active} />
      <StatCard label="Revenue" value={"$" + stats.revenue.toLocaleString()} />
    </div>
  );
}`}
      </CodeBlock>

      <h2>The "Reason to Change" Test</h2>

      <CodeBlock language="markdown" title="Practical SRP Heuristics">
{`## Red Flags — Class Likely Violates SRP

1. Class name contains "And": UserAuthAndProfileManager
2. Class name too generic: Manager, Helper, Utils, Handler, Processor
   (these accumulate unrelated methods over time)
3. Class has >200 lines of actual logic (not counting getters/tests)
4. You describe the class with "and": "it handles users AND sends emails"
5. The class imports from many different layers:
   import java.sql.*;        // persistence
   import javax.mail.*;      // notifications
   import org.springframework.security.*;  // auth
   import org.apache.kafka.*;  // messaging
   All in one class = multiple responsibilities

## How to Decompose

Ask: if I had to change [feature X], which lines would I touch?
Map those lines to a conceptual unit → that unit should be a class.

Common decomposition patterns:
- Validator (validate inputs, throw if invalid)
- Repository (CRUD operations against a data store)
- Service (business logic, orchestrates other services)
- Mapper / Converter (transforms between domain + DTO)
- EventPublisher (sends domain events to message broker)
- Notifier / Sender (sends emails, SMS, push notifications)

## SRP Does NOT Mean One Method Per Class

SRP is about one REASON TO CHANGE — one actor, one concern.
A UserRepository can have save(), findById(), findByEmail(), delete() —
all in the same class. They all change for the same reason: DB schema/queries.
That is high cohesion, not SRP violation.`}
      </CodeBlock>

      <InfoBox variant="tip" title="SRP and Testability">
        <p>
          SRP and testability go hand in hand. A class that mixes DB, email, and business logic
          cannot be unit tested without spinning up real infrastructure. When you separate concerns,
          each class becomes trivially testable in isolation: inject a mock repository, call the
          method, assert the result. If a class is hard to test, it is almost always an SRP
          violation — the class is doing too much.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="If a Report class generates a report AND emails it AND saves it to disk, which principle does it violate?"
        options={[
          "Open/Closed Principle — it is closed for extension",
          "Liskov Substitution — it cannot be subclassed",
          "Single Responsibility — it has three distinct reasons to change",
          "Dependency Inversion — it depends on concretions"
        ]}
        correctIndex={2}
        explanation="The Report class has three responsibilities: generating the report (format may change), sending emails (provider may change), and file I/O (storage location/format may change). Each is driven by a different actor — content team, infrastructure team, and ops team respectively. SRP says these should be separate classes so that a change to the email provider does not risk breaking the report format logic."
      />

      <InteractiveChallenge
        question="A class has 15 methods but they all deal with database queries for the User entity. Does this violate SRP?"
        options={[
          "Yes — 15 methods is too many for one class",
          "No — all 15 methods serve the same actor (DB layer) and have one reason to change: the User schema",
          "Yes — any class with more than 5 methods violates SRP",
          "It depends on whether the methods are public or private"
        ]}
        correctIndex={1}
        explanation="SRP is about one reason to change — one actor. A UserRepository with 15 query methods (findByEmail, findByStatus, countActiveUsers, etc.) all serve the same purpose: data access for the User entity. They all change when the User schema changes. That is high cohesion, not SRP violation. A class with only 2 methods that does both business logic and email sending violates SRP more than the 15-method repository does."
      />
    </LessonLayout>
  );
}
