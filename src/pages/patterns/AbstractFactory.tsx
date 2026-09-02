import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function AbstractFactory() {
  return (
    <LessonLayout
      title="Abstract Factory Pattern"
      sectionId="patterns"
      lessonIndex={2}
      prev={{ path: '/patterns/singleton', label: 'Singleton & Factory' }}
      next={{ path: '/patterns/strategy', label: 'Strategy & Observer' }}
    >
      <h2>Start With the Bug, Not the Definition</h2>
      <p>
        You are writing a reporting service that has to run against Postgres in production and
        SQL Server for one enterprise customer. Three pieces of your data layer are
        vendor-specific: the connection, the query builder, and the paginator. Postgres takes{' '}
        <code>LIMIT ? OFFSET ?</code>; SQL Server has no <code>LIMIT</code> keyword at all and
        requires <code>OFFSET ? ROWS FETCH NEXT ? ROWS ONLY</code>. All three sit behind neutral
        interfaces, so any of them can be handed to any caller.
      </p>
      <p>
        That last sentence is the trap. Here is what the naive version looks like after two
        people have touched it:
      </p>

      <CodeBlock language="java" title="The Bug This Pattern Exists to Prevent" showLineNumbers={true}>
{`public class ReportRunner {

    public Report run(String vendor, String sql, int page) {
        // The vendor choice leaks into every construction site...
        SqlConnection conn = vendor.equals("postgres")
            ? new PgConnection(url)
            : new MssqlConnection(url);

        QueryBuilder queries = vendor.equals("postgres")
            ? new PgQueryBuilder()
            : new MssqlQueryBuilder();

        // ...and six months later someone adds pagination and hardcodes
        // the dialect they develop against.
        Paginator paginator = new PgPaginator();   // <-- BUG

        return new Report(conn, queries, paginator);
    }
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="Why the Compiler Cannot Save You Here">
        <p>
          <code>PgPaginator</code> is a perfectly valid <code>Paginator</code>. It type-checks. It
          passes any unit test that mocks the connection. It passes every test on the developer&apos;s
          laptop, on CI, and in production — because all three run Postgres. It fails only when a
          real SQL Server rejects <code>LIMIT 10 OFFSET 20</code> as a syntax error, which is to
          say: on the one enterprise customer nobody runs locally, after deploy.
        </p>
        <p>
          Note the direction of the trap. The mismatch is invisible precisely <em>because</em> the
          hardcoded choice is the correct one almost everywhere. A bug that fires on the common
          path gets caught in an hour; this one waits for the rare path.
        </p>
        <p>
          The three objects form a <strong>family</strong>: they are individually substitutable but
          collectively constrained. Nothing in the code above expresses that constraint, so the
          constraint lives in a comment or in someone&apos;s head. Abstract Factory&apos;s entire
          job is to move it into the structure of the code.
        </p>
      </InfoBox>

      <h2>The Pattern</h2>
      <p>
        Abstract Factory provides an interface for creating families of related objects{' '}
        <em>without specifying their concrete classes</em>. You define one creation method per
        member of the family, and one concrete factory per variant. A client that holds a factory
        can only ever obtain products from that one variant — the mismatched pair above becomes
        unconstructible.
      </p>

      <FlowChart
        title="Abstract Factory Structure — One Factory per Variant, N Products per Family"
        chart={"graph TD\n  A[Client] -->|holds ONE factory| B[SqlDialectFactory]\n  B --> C[PostgresFactory]\n  B --> D[SqlServerFactory]\n  C --> C1[PgConnection]\n  C --> C2[PgQueryBuilder]\n  C --> C3[PgPaginator]\n  D --> D1[MssqlConnection]\n  D --> D2[MssqlQueryBuilder]\n  D --> D3[MssqlPaginator]\n  C1 --> P1[SqlConnection]\n  D1 --> P1\n  C2 --> P2[QueryBuilder]\n  D2 --> P2\n  C3 --> P3[Paginator]\n  D3 --> P3"}
      />

      <CodeBlock language="java" title="Abstract Factory - Vendor-Consistent Data Layer (Java)" showLineNumbers={true}>
{`// ---- Abstract products: the vendor-neutral interfaces ----
public interface SqlConnection { ResultSet execute(String sql); }
public interface QueryBuilder  { String select(String table, List<String> columns); }
public interface Paginator     { String paginate(String sql, int limit, int offset); }

// ---- The abstract factory: ONE method per member of the family ----
public interface SqlDialectFactory {
    SqlConnection openConnection(String url);
    QueryBuilder  queryBuilder();
    Paginator     paginator();
}

// ---- One concrete factory per variant ----
public final class PostgresFactory implements SqlDialectFactory {
    @Override public SqlConnection openConnection(String url) { return new PgConnection(url); }
    @Override public QueryBuilder  queryBuilder()             { return new PgQueryBuilder(); }
    @Override public Paginator     paginator()                { return new PgPaginator(); }
}

public final class SqlServerFactory implements SqlDialectFactory {
    @Override public SqlConnection openConnection(String url) { return new MssqlConnection(url); }
    @Override public QueryBuilder  queryBuilder()             { return new MssqlQueryBuilder(); }
    @Override public Paginator     paginator()                { return new MssqlPaginator(); }
}

// ---- Client: names ZERO concrete classes ----
public class ReportRunner {
    private final SqlConnection conn;
    private final QueryBuilder queries;
    private final Paginator paginator;

    public ReportRunner(SqlDialectFactory dialect, String url) {
        this.conn      = dialect.openConnection(url);
        this.queries   = dialect.queryBuilder();
        this.paginator = dialect.paginator();
        // There is no code path here that can produce a mixed set.
        // Not "we remembered not to" -- there is no expression you
        // could write inside this constructor that yields one.
    }

    public Report run(String table, List<String> columns, int page) {
        String sql = queries.select(table, columns);
        return new Report(conn.execute(paginator.paginate(sql, 50, page * 50)));
    }
}

// ---- Composition root: the ONLY place a vendor is named ----
SqlDialectFactory dialect = switch (config.vendor()) {
    case POSTGRES   -> new PostgresFactory();
    case SQL_SERVER -> new SqlServerFactory();
};
var runner = new ReportRunner(dialect, config.url());`}
      </CodeBlock>

      <InfoBox variant="tip" title="Notice Where the Switch Went">
        The vendor <code>switch</code> did not disappear — it moved. It now runs{' '}
        <strong>once, at the composition root</strong>, instead of once per product at every
        construction site. That relocation is the actual deliverable. Everything downstream is
        vendor-agnostic by construction, and adding a third vendor means writing one new class and
        adding one line to that switch.
      </InfoBox>

      <h2>Abstract Factory vs. Factory Method vs. Simple Factory</h2>
      <p>
        This is the most-confused distinction in the GoF set, and it is asked in interviews
        precisely because so many people blur it. The{' '}
        <a href="/patterns/singleton">previous lesson</a> covered Simple Factory and Factory
        Method in depth; what follows is the structural comparison. The key is that they answer
        three different questions.
      </p>

      <FlowChart
        title="Factory Method — ONE product, the subclass decides, via inheritance"
        chart={"graph TD\n  A[Client] --> B[Creator - abstract]\n  B -->|template method needs a product| G[ONE Product interface]\n  B --> C[ConcreteCreatorA]\n  B --> D[ConcreteCreatorB]\n  C -->|returns| E[ProductA]\n  D -->|returns| F[ProductB]\n  E --> G\n  F --> G"}
      />

      <p>
        Compare that to the Abstract Factory diagram above. Factory Method has{' '}
        <strong>one product interface</strong> at the bottom and gets its variation from{' '}
        <em>subclassing the creator</em>. Abstract Factory has <strong>three</strong> product
        interfaces at the bottom and gets its variation from <em>which factory object you were
        handed</em>. Same word in the name, different axis of variation.
      </p>

      <table>
        <thead>
          <tr>
            <th></th>
            <th>Simple Factory</th>
            <th>Factory Method</th>
            <th>Abstract Factory</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>In the GoF book?</td>
            <td>No — an idiom</td>
            <td>Yes</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td>How many products?</td>
            <td>One</td>
            <td>One</td>
            <td>A family of N related products</td>
          </tr>
          <tr>
            <td>Who decides the concrete class?</td>
            <td>A switch on runtime data</td>
            <td>Which subclass you are</td>
            <td>Which factory object you hold</td>
          </tr>
          <tr>
            <td>Mechanism</td>
            <td>Static method</td>
            <td>Inheritance / overriding</td>
            <td>Composition / delegation</td>
          </tr>
          <tr>
            <td>Adding a new variant</td>
            <td>Edit the switch</td>
            <td>Add a subclass — open/closed</td>
            <td>Add a factory class — open/closed</td>
          </tr>
          <tr>
            <td>Adding a new product type</td>
            <td>Edit the switch</td>
            <td>N/A — there is only one</td>
            <td>Edit the interface + <em>every</em> factory</td>
          </tr>
          <tr>
            <td>Typical smell it fixes</td>
            <td>Copy-pasted if/else at 20 call sites</td>
            <td>Shared algorithm, varying product</td>
            <td>Mismatched objects from two variants</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="note" title="The One-Sentence Version">
        <p>
          <strong>Simple Factory:</strong> &quot;give me the right <em>one</em> of these.&quot;{' '}
          <strong>Factory Method:</strong> &quot;my algorithm needs a product; my subclass says
          which.&quot; <strong>Abstract Factory:</strong> &quot;give me a <em>matching set</em>.&quot;
        </p>
        <p>
          They also compose: each method on a concrete Abstract Factory is frequently implemented
          as a Factory Method. GoF say so explicitly. They are not competitors — Abstract Factory
          operates one level up.
        </p>
      </InfoBox>

      <h2>Making the Family Constraint a Compile Error</h2>
      <p>
        In the Java version the constraint is enforced <em>structurally</em>: the client only ever
        receives one factory, so no expression inside it can yield a mixed pair. But the types
        themselves are still permissive — <code>PgPaginator</code> is assignable to any{' '}
        <code>Paginator</code> variable, so a determined caller elsewhere could still assemble a
        franken-set by hand.
      </p>
      <p>
        TypeScript can go one step further with a <strong>phantom type parameter</strong>: a field
        that exists only in the type system and is never read at runtime, which makes a Material
        button and a Cupertino button genuinely different types.
      </p>

      <CodeBlock language="typescript" title="Cross-Platform Widget Kit — Mixing Is Unrepresentable (TypeScript)" showLineNumbers={true}>
{`type Variant = 'material' | 'cupertino';

// The phantom field. Never assigned, never read -- it exists purely so
// that Button<'material'> and Button<'cupertino'> are not interchangeable.
interface Button<V extends Variant>    { readonly _v?: V; render(): string }
interface TextField<V extends Variant> { readonly _v?: V; render(): string }
interface Dialog<V extends Variant>    { readonly _v?: V; render(body: string[]): string }

// ---- The abstract factory, parameterised by variant ----
interface WidgetKit<V extends Variant> {
  button(label: string): Button<V>;
  textField(placeholder: string): TextField<V>;
  dialog(title: string): Dialog<V>;
}

// ---- Concrete factories ----
const materialKit: WidgetKit<'material'> = {
  button: (label) => ({ render: () => \`<button class="mdc-button">\${label}</button>\` }),
  textField: (ph) => ({ render: () => \`<label class="mdc-text-field">\${ph}</label>\` }),
  dialog: (title) => ({
    render: (body) => \`<div class="mdc-dialog"><h2>\${title}</h2>\${body.join('')}</div>\`,
  }),
};

const cupertinoKit: WidgetKit<'cupertino'> = {
  button: (label) => ({ render: () => \`<button class="ios-btn">\${label}</button>\` }),
  textField: (ph) => ({ render: () => \`<input class="ios-field" placeholder="\${ph}">\` }),
  dialog: (title) => ({
    render: (body) => \`<div class="ios-sheet"><h3>\${title}</h3>\${body.join('')}</div>\`,
  }),
};

// ---- Client is generic over V: works with any kit, mixes none ----
function loginForm<V extends Variant>(kit: WidgetKit<V>): string {
  const email = kit.textField('Email');
  const submit = kit.button('Sign in');
  return kit.dialog('Welcome back').render([email.render(), submit.render()]);
}

loginForm(materialKit);   // fine
loginForm(cupertinoKit);  // fine

// ---- The bug from the top of this lesson, now caught at compile time ----
function renderPair<V extends Variant>(b: Button<V>, t: TextField<V>): string {
  return t.render() + b.render();
}

renderPair(materialKit.button('OK'), materialKit.textField('Email'));   // OK

renderPair(materialKit.button('OK'), cupertinoKit.textField('Email'));
// ^ Argument of type TextField<"cupertino"> is not assignable to
//   parameter of type TextField<"material">.
//   Types of property '_v' are incompatible.`}
      </CodeBlock>

      <p>
        The same trick works in plain JavaScript minus the guarantee — you get the composition
        shape, but the mixing check is gone, so keep the kit object as the single unit you pass
        around:
      </p>

      <CodeBlock language="javascript" title="The Same Kit in Plain JavaScript (Node.js)" showLineNumbers={true}>
{`// Concrete factories are just objects of factory functions. No classes
// needed -- a closure over the variant's details is the whole pattern.
const materialKit = {
  button: (label) => ({ render: () => \`<button class="mdc-button">\${label}</button>\` }),
  textField: (ph) => ({ render: () => \`<label class="mdc-text-field">\${ph}</label>\` }),
};

const cupertinoKit = {
  button: (label) => ({ render: () => \`<button class="ios-btn">\${label}</button>\` }),
  textField: (ph) => ({ render: () => \`<input class="ios-field" placeholder="\${ph}">\` }),
};

// Client takes the KIT, never individual widgets. Passing the whole kit
// is what keeps the family together when the type system will not.
function loginForm(kit) {
  return [kit.textField('Email').render(), kit.button('Sign in').render()].join('\\n');
}

const kit = process.env.PLATFORM === 'ios' ? cupertinoKit : materialKit;
console.log(loginForm(kit));`}
      </CodeBlock>

      <InfoBox variant="warning" title="Rule of Thumb for the JS/TS Version">
        Pass the <strong>factory</strong> down, never the individual products. The moment a
        function signature takes <code>(button, textField)</code> instead of <code>(kit)</code>,
        you have handed the caller the ability to mix variants and you are back to relying on
        discipline. This is the single most common way a hand-rolled Abstract Factory quietly
        stops working.
      </InfoBox>

      <h2>Where This Actually Lives in Modern Code</h2>
      <p>
        Here is the honest part that most tutorials skip: in a DI-heavy codebase you will rarely
        hand-write the interface above, because the DI container has absorbed the role. A Spring{' '}
        <code>@Configuration</code> class <em>is</em> a concrete factory — the <code>@Bean</code>{' '}
        methods are the creation methods, and the container is the client doing the wiring.
      </p>

      <CodeBlock language="java" title="Spring @Configuration as the Concrete Factory" showLineNumbers={true}>
{`@Configuration
@ConditionalOnProperty(name = "app.db.vendor", havingValue = "postgres")
public class PostgresDialectConfig {          // <- a concrete factory

    @Bean SqlConnection sqlConnection(DataSource ds) { return new PgConnection(ds); }
    @Bean QueryBuilder  queryBuilder()               { return new PgQueryBuilder(); }
    @Bean Paginator     paginator()                  { return new PgPaginator(); }
}

@Configuration
@ConditionalOnProperty(name = "app.db.vendor", havingValue = "sqlserver")
public class SqlServerDialectConfig {         // <- another concrete factory

    @Bean SqlConnection sqlConnection(DataSource ds) { return new MssqlConnection(ds); }
    @Bean QueryBuilder  queryBuilder()               { return new MssqlQueryBuilder(); }
    @Bean Paginator     paginator()                  { return new MssqlPaginator(); }
}

// The client just declares what it needs. It never sees a factory at all.
@Service
public class ReportRunner {
    private final SqlConnection conn;
    private final QueryBuilder queries;
    private final Paginator paginator;

    public ReportRunner(SqlConnection conn, QueryBuilder queries, Paginator paginator) {
        this.conn = conn;
        this.queries = queries;
        this.paginator = paginator;
    }
}`}
      </CodeBlock>

      <InfoBox variant="note" title="What You Trade Away Going the Spring Route">
        <p>
          Read that carefully: there is no <code>SqlDialectFactory</code> interface anywhere. The
          family is implicit — it is &quot;the set of beans this <code>@Configuration</code>{' '}
          contributes.&quot; That is more flexible and far less code, but the constraint is now
          checked by the container <em>at startup</em> rather than by the compiler. Forget one{' '}
          <code>@Bean</code> and you get a <code>NoSuchBeanDefinitionException</code> when the app
          boots, not a red squiggle in your editor. Fail-fast, but later.
        </p>
        <p>
          You will see this exact shape all over the ecosystem once you know to look:
          Spring Boot&apos;s own <code>*AutoConfiguration</code> classes, JPA&apos;s{' '}
          <code>EntityManagerFactory</code>, MyBatis&apos;s <code>SqlSessionFactory</code>, and the
          per-cloud SDK builders (<code>S3Client.builder()</code> vs.{' '}
          <code>BlobServiceClientBuilder</code>) sitting behind one storage port.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="When to Reach for Abstract Factory">
        <p>
          Reach for it when <strong>three conditions all hold</strong>: (1) you have two or more
          objects that must come from the same variant, (2) mixing them is a genuine defect rather
          than a cosmetic inconsistency, and (3) the variant is chosen once, somewhere far away
          from the code that uses the products. Database dialects, cross-platform UI toolkits,
          cloud-provider client sets, and prod-vs-in-memory test doubles all fit.
        </p>
        <p>
          A useful test: can you name the bug that a mismatched pair would cause? If the answer is
          a concrete production incident — malformed SQL, a signed URL pointing at the wrong
          cloud, a widget that will not render in the host shell — the pattern is earning its
          keep. If the answer is &quot;it would look a bit odd,&quot; it is not.
        </p>
      </InfoBox>

      <h2>When NOT to Use It</h2>

      <InfoBox variant="danger" title="The Combinatorial Wall — Adding a Product Touches Everything">
        <p>
          Abstract Factory is <strong>open/closed along one axis only</strong>. Adding a new{' '}
          <em>variant</em> is cheap: one new class, nothing existing is edited. Adding a new{' '}
          <em>product</em> to the family is the opposite — you edit the interface and then every
          single concrete factory. With six supported vendors, adding a <code>BulkLoader</code>{' '}
          means touching seven files before you have written a line of useful logic.
        </p>
        <p>
          This asymmetry is the pattern&apos;s defining weakness and GoF flag it themselves. Java{' '}
          <code>default</code> methods on the interface soften the compile break, but only by
          silently giving every un-updated factory a wrong-vendor fallback — which reintroduces the
          exact bug the pattern existed to prevent. If your family is still growing, you are on
          the wrong side of this trade.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Three More Reasons to Skip It">
        <p>
          <strong>Your family has one member.</strong> If the &quot;family&quot; is a single
          product type, you want a Simple Factory. An interface with one method and one
          implementation per variant is a Simple Factory wearing three extra files.
        </p>
        <p>
          <strong>You already have DI.</strong> If variants are selected once at startup from
          config, Spring profiles or a <code>@ConditionalOnProperty</code> pair does the whole job.
          Hand-rolling the interface on top buys you a compile-time guarantee you may not need,
          and a layer every new joiner has to read through.
        </p>
        <p>
          <strong>There is exactly one concrete factory.</strong> A lone{' '}
          <code>DefaultWidgetKitFactory</code> added &quot;for future flexibility&quot; is
          speculative generality. The second variant is the event that justifies the abstraction —
          extract it then, when you actually know what varies.
        </p>
      </InfoBox>

      <h2>Relationship to the Other Creational Patterns</h2>
      <p>
        All five creational patterns answer &quot;how do I get an object?&quot;, and they layer
        rather than compete. Placed against the ones already covered:
      </p>
      <ul>
        <li>
          <strong>Factory Method</strong> — the implementation detail one level down. Each method
          on a concrete Abstract Factory is often itself a Factory Method.
        </li>
        <li>
          <strong><a href="/patterns/singleton">Singleton</a></strong> — concrete factories are
          usually stateless, so one instance per variant is all you need. In Spring they already
          are: <code>@Configuration</code> classes and their beans are singleton-scoped by default.
        </li>
        <li>
          <strong><a href="/patterns/builder">Builder</a></strong> — the easiest one to confuse by
          shape. Builder constructs <em>one complex object step by step</em> and hands it over at{' '}
          <code>build()</code>. Abstract Factory returns <em>several simple objects immediately</em>,
          one call each. Different question: Builder is about <em>how</em> one object is assembled,
          Abstract Factory about <em>which set</em> you get.
        </li>
        <li>
          <strong><a href="/patterns/builder">Prototype</a></strong> — an alternative way to
          implement a concrete factory. Instead of <code>new PgQueryBuilder()</code>, the factory
          holds a preconfigured prototype of each product and returns a clone. Worth it when the
          family is data-driven at runtime (loaded from config) rather than a fixed set of classes
          known at compile time.
        </li>
      </ul>

    </LessonLayout>
  );
}
