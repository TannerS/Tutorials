import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Srp() {
  return (
    <LessonLayout
      title="Single Responsibility Principle"
      sectionId="solid"
      lessonIndex={1}
      prev={{ path: '/solid/intro', label: 'SOLID Overview' }}
      next={{ path: '/solid/ocp', label: 'Open/Closed Principle' }}
    >
      <h2>One Class, One Reason to Change</h2>
      <p>
        The Single Responsibility Principle (SRP) states that a class should
        have only <strong>one reason to change</strong>. In other words, a
        class should encapsulate exactly one responsibility or concern. When a
        class handles multiple concerns, a change to one concern risks
        breaking the others.
      </p>

      <InfoBox variant="tip" title="Uncle Bob's Definition">
        <p>
          Robert C. Martin defines SRP not as &quot;do one thing&quot; but as
          &quot;gather together the things that change for the same reason, and
          separate those things that change for different reasons.&quot; Think
          of a <em>reason to change</em> as a single actor or stakeholder
          whose requirements might evolve.
        </p>
      </InfoBox>

      <FlowChart
        title="SRP Violation vs. SRP Compliance"
        chart={"graph TD\nA[God Class] -->|handles| B[Validation]\nA -->|handles| C[Persistence]\nA -->|handles| D[Formatting]\nA -->|handles| E[Notification]\nF[Validator] -->|single job| B\nG[Repository] -->|single job| C\nH[Formatter] -->|single job| D\nI[Notifier] -->|single job| E"}
      />

      <h2>Bad Example — The God Class</h2>
      <p>
        The following <code>Employee</code> class violates SRP because it is
        responsible for business logic, persistence, and report generation.
        A change to the database schema, the tax rules, or the report format
        would all require modifying this single class.
      </p>

      <CodeBlock language="java" title="EmployeeGodClass.java">
{`// BAD — Employee class has three reasons to change:
// 1. Business rules (pay calculation)
// 2. Database schema (save logic)
// 3. Report format (report generation)
public class Employee {
    private String name;
    private double baseSalary;
    private String department;

    public double calculatePay() {
        double tax = baseSalary * 0.3;
        double bonus = department.equals("Sales")
            ? baseSalary * 0.15
            : baseSalary * 0.05;
        return baseSalary - tax + bonus;
    }

    public void saveToDatabase() {
        Connection conn = DriverManager.getConnection("jdbc:mysql://...");
        PreparedStatement ps = conn.prepareStatement(
            "INSERT INTO employees (name, salary, dept) VALUES (?, ?, ?)");
        ps.setString(1, name);
        ps.setDouble(2, baseSalary);
        ps.setString(3, department);
        ps.executeUpdate();
        conn.close();
    }

    public String generateReport() {
        return String.format(
            "<html><body><h1>%s</h1><p>Salary: $%.2f</p>"
            + "<p>Dept: %s</p></body></html>",
            name, calculatePay(), department);
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Why That Costs You — Three Teams, One File">
        <p>
          &quot;Three reasons to change&quot; sounds abstract until you notice that three{' '}
          <em>different teams</em> now edit the same file. Finance changes the tax rate. The DBA
          renames the <code>dept</code> column. Marketing wants the report in the new brand
          template. Each of those is a separate ticket, and every one of them lands in{' '}
          <code>Employee.java</code>.
        </p>
        <p>
          The concrete damage: <strong>merge conflicts on every release</strong>, and a blast
          radius nobody can predict. Notice that <code>generateReport()</code> calls{' '}
          <code>calculatePay()</code> — so when Finance adjusts the bonus rule, the report&apos;s
          numbers change too. Was that intended? Nobody can tell from this file, so the reporting
          team has to re-verify their output every time payroll ships.
        </p>
        <p>
          And the test story is worse. To assert one thing about the bonus formula, you need a
          live MySQL connection, because <code>saveToDatabase()</code> lives in the same class and
          drags JDBC into the test&apos;s classpath. A pure arithmetic rule has become an
          integration test.
        </p>
      </InfoBox>

      <h2>Good Example — Separated Responsibilities</h2>
      <p>
        By extracting each concern into its own class, we ensure that each
        class has exactly one reason to change. The payroll team owns{' '}
        <code>PayCalculator</code>, the DBA owns{' '}
        <code>EmployeeRepository</code>, and the reporting team owns{' '}
        <code>EmployeeReportGenerator</code>.
      </p>

      <CodeBlock language="java" title="Employee.java">
{`// GOOD — Employee is now a simple data holder (entity).
public class Employee {
    private String name;
    private double baseSalary;
    private String department;

    public Employee(String name, double baseSalary, String department) {
        this.name = name;
        this.baseSalary = baseSalary;
        this.department = department;
    }

    public String getName() { return name; }
    public double getBaseSalary() { return baseSalary; }
    public String getDepartment() { return department; }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="PayCalculator.java">
{`// GOOD — Only reason to change: pay calculation rules.
public class PayCalculator {
    public double calculatePay(Employee employee) {
        double tax = employee.getBaseSalary() * 0.3;
        double bonus = employee.getDepartment().equals("Sales")
            ? employee.getBaseSalary() * 0.15
            : employee.getBaseSalary() * 0.05;
        return employee.getBaseSalary() - tax + bonus;
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="EmployeeRepository.java">
{`// GOOD — Only reason to change: how employees are persisted.
public class EmployeeRepository {
    private final DataSource dataSource;

    public EmployeeRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public void save(Employee employee) throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO employees (name, salary, dept) VALUES (?, ?, ?)");
            ps.setString(1, employee.getName());
            ps.setDouble(2, employee.getBaseSalary());
            ps.setString(3, employee.getDepartment());
            ps.executeUpdate();
        }
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="EmployeeReportGenerator.java">
{`// GOOD — Only reason to change: report formatting.
public class EmployeeReportGenerator {
    private final PayCalculator payCalculator;

    public EmployeeReportGenerator(PayCalculator payCalculator) {
        this.payCalculator = payCalculator;
    }

    public String generate(Employee employee) {
        double pay = payCalculator.calculatePay(employee);
        return String.format(
            "<html><body><h1>%s</h1><p>Salary: $%.2f</p>"
            + "<p>Dept: %s</p></body></html>",
            employee.getName(), pay, employee.getDepartment());
    }
}`}
      </CodeBlock>

      <h2>The Payoff, Made Concrete</h2>
      <p>
        The split is only worth its extra files if something actually got better. Compare the
        test you can now write against the one you could write before:
      </p>

      <CodeBlock language="java" title="PayCalculatorTest.java">
{`// The whole point of the refactor, in one test.
// No database. No SMTP server. No HTML parsing. No Spring context.
// It runs in single-digit milliseconds and never flakes.
class PayCalculatorTest {

    @Test
    void salesEmployeesGetTheLargerBonus() {
        var calculator = new PayCalculator();
        var employee = new Employee("Dana", 100_000, "Sales");

        // 100,000 - 30% tax (30,000) + 15% sales bonus (15,000) = 85,000
        assertEquals(85_000, calculator.calculatePay(employee), 0.01);
    }

    @Test
    void everyoneElseGetsTheStandardBonus() {
        var calculator = new PayCalculator();
        var employee = new Employee("Ravi", 100_000, "Engineering");

        // 100,000 - 30% tax (30,000) + 5% standard bonus (5,000) = 75,000
        assertEquals(75_000, calculator.calculatePay(employee), 0.01);
    }
}

// Against the God Class version, this test was impossible to write
// without a running MySQL instance -- not because the pay rule needed
// one, but because saveToDatabase() shared the class with it.`}
      </CodeBlock>

      <p>
        That is what &quot;one reason to change&quot; buys: Finance can now change the bonus rule
        and re-run <em>two fast tests</em> to prove it, instead of re-running an integration suite
        and manually eyeballing a report. The DBA can change the schema without recompiling the
        pay logic. The three tickets that used to collide in one file now touch three files that
        nobody else is editing.
      </p>

      <InfoBox variant="warning" title="Common Misconception">
        <p>
          SRP does not mean a class should have only one method. It means
          all methods in the class should relate to the <strong>same
          responsibility</strong>. A <code>PayCalculator</code> could have
          methods for gross pay, tax deductions, and net pay — those all serve
          the single responsibility of pay calculation.
        </p>
      </InfoBox>

      <h2>How to Spot SRP Violations</h2>
      <ul>
        <li>The class name contains &quot;And&quot; or &quot;Manager&quot; (e.g., <code>OrderAndPaymentManager</code>)</li>
        <li>You struggle to describe what the class does in one sentence</li>
        <li>Different stakeholders request changes to the same class</li>
        <li>The class imports libraries from unrelated domains (JDBC + SMTP + XML)</li>
        <li>Unit tests require complex setup with many mocks</li>
      </ul>

    </LessonLayout>
  );
}
