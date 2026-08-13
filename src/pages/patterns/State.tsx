import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function State() {
  return (
    <LessonLayout
      title="State & Template Method Patterns"
      sectionId="patterns"
      lessonIndex={9}
      prev={{ path: '/patterns/command', label: 'Command & Iterator' }}
      next={{ path: '/patterns/bridge', label: 'Bridge & Mediator' }}
    >
      <h2>State Pattern</h2>
      <p>
        Lets an object alter its behavior when its internal state changes, so it appears to change
        its class. Instead of one big method riddled with <code>if</code>/<code>switch</code>
        statements checking a status field, each state becomes its own class implementing a shared
        interface, and the object delegates behavior to whichever state it currently holds. Classic
        use cases: order lifecycles, vending machines, traffic lights, and connection/session
        state machines.
      </p>

      <FlowChart
        title="State Pattern Structure"
        chart={"graph TD\n  A[Context] -->|delegates to| B[State Interface]\n  B --> C[ConcreteStateA]\n  B --> D[ConcreteStateB]\n  B --> E[ConcreteStateC]\n  C -->|transitions to| D\n  D -->|transitions to| E\n  A -->|holds current| B"}
      />

      <CodeBlock language="java" title="Order Status State Machine (Java)" showLineNumbers={true}>
{`// State interface — every state knows how to react to events and what comes next
public interface OrderState {
    OrderState pay(Order order);
    OrderState ship(Order order);
    OrderState cancel(Order order);
    String name();
}

public class PendingState implements OrderState {
    @Override
    public OrderState pay(Order order) {
        System.out.println("Payment received, order confirmed.");
        return new PaidState();
    }

    @Override
    public OrderState ship(Order order) {
        throw new IllegalStateException("Cannot ship an unpaid order.");
    }

    @Override
    public OrderState cancel(Order order) {
        System.out.println("Order cancelled before payment.");
        return new CancelledState();
    }

    @Override
    public String name() { return "PENDING"; }
}

public class PaidState implements OrderState {
    @Override
    public OrderState pay(Order order) {
        throw new IllegalStateException("Order is already paid.");
    }

    @Override
    public OrderState ship(Order order) {
        System.out.println("Order shipped.");
        return new ShippedState();
    }

    @Override
    public OrderState cancel(Order order) {
        System.out.println("Order cancelled, refund issued.");
        return new CancelledState();
    }

    @Override
    public String name() { return "PAID"; }
}

public class ShippedState implements OrderState {
    @Override
    public OrderState pay(Order order) {
        throw new IllegalStateException("Order is already paid and shipped.");
    }

    @Override
    public OrderState ship(Order order) {
        throw new IllegalStateException("Order is already shipped.");
    }

    @Override
    public OrderState cancel(Order order) {
        throw new IllegalStateException("Cannot cancel a shipped order.");
    }

    @Override
    public String name() { return "SHIPPED"; }
}

public class CancelledState implements OrderState {
    @Override
    public OrderState pay(Order order) { throw new IllegalStateException("Order is cancelled."); }
    @Override
    public OrderState ship(Order order) { throw new IllegalStateException("Order is cancelled."); }
    @Override
    public OrderState cancel(Order order) { throw new IllegalStateException("Already cancelled."); }
    @Override
    public String name() { return "CANCELLED"; }
}

// Context — delegates entirely to the current state, no if/else chains
public class Order {
    private OrderState state = new PendingState();

    public void pay() { state = state.pay(this); }
    public void ship() { state = state.ship(this); }
    public void cancel() { state = state.cancel(this); }
    public String getStatus() { return state.name(); }
}

// Usage
Order order = new Order();
order.pay();               // PENDING -> PAID
order.ship();               // PAID -> SHIPPED
System.out.println(order.getStatus()); // "SHIPPED"
order.cancel();              // throws IllegalStateException`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Order Status State Machine (Node.js)" showLineNumbers={true}>
{`// Each state is a plain object implementing the same shape
const PendingState = {
  name: 'PENDING',
  pay(order) {
    console.log('Payment received, order confirmed.');
    return PaidState;
  },
  ship() {
    throw new Error('Cannot ship an unpaid order.');
  },
  cancel(order) {
    console.log('Order cancelled before payment.');
    return CancelledState;
  },
};

const PaidState = {
  name: 'PAID',
  pay() {
    throw new Error('Order is already paid.');
  },
  ship(order) {
    console.log('Order shipped.');
    return ShippedState;
  },
  cancel(order) {
    console.log('Order cancelled, refund issued.');
    return CancelledState;
  },
};

const ShippedState = {
  name: 'SHIPPED',
  pay() { throw new Error('Order is already paid and shipped.'); },
  ship() { throw new Error('Order is already shipped.'); },
  cancel() { throw new Error('Cannot cancel a shipped order.'); },
};

const CancelledState = {
  name: 'CANCELLED',
  pay() { throw new Error('Order is cancelled.'); },
  ship() { throw new Error('Order is cancelled.'); },
  cancel() { throw new Error('Already cancelled.'); },
};

// Context — delegates entirely to the current state
class Order {
  #state = PendingState;

  pay() { this.#state = this.#state.pay(this); }
  ship() { this.#state = this.#state.ship(this); }
  cancel() { this.#state = this.#state.cancel(this); }
  get status() { return this.#state.name; }
}

// Usage
const order = new Order();
order.pay();                  // PENDING -> PAID
order.ship();                  // PAID -> SHIPPED
console.log(order.status);      // "SHIPPED"
order.cancel();                 // throws Error`}
      </CodeBlock>

      <InfoBox variant="warning" title="State vs. a Status Enum with Switch Statements">
        A single <code>enum OrderStatus</code> field with a giant <code>switch</code> in every
        method works fine for two or three states. It breaks down as states and transitions grow —
        every new state means editing every switch statement in the codebase. The State pattern
        moves each state's rules into its own class, so adding a new state means adding a new
        class, not touching existing ones (Open/Closed Principle).
      </InfoBox>

      <InfoBox variant="tip" title="When to Reach for State">
        Reach for State when the <em>legal transitions</em> matter as much as the behaviour — when
        &quot;can this operation happen right now?&quot; has a different answer per status, and the
        answer is scattered across several methods. The tell is the same
        <code>switch (status)</code> appearing in three or four different methods, each with a
        slightly different set of cases; State collapses all of that into one class per status that
        can be read top to bottom. Skip it when you have two or three states with a single
        transition each, or when status is purely a label the code branches on once — an enum field
        is smaller and clearer, and a class per state is pure ceremony. Also note that State does
        not remove persistence mapping: if the status lives in a database column you still translate
        the stored value back into a state object on load, so the pattern localises that mapping
        rather than eliminating it.
      </InfoBox>

      <InfoBox variant="info" title="State Objects Should Be Stateless">
        The Java example above allocates a fresh <code>new PaidState()</code> on every transition,
        which reads clearly but is wasteful: these state classes hold no per-order data, so one
        shared instance can serve every order. The JavaScript version already does this — its states
        are plain module-level singletons. In Java the idiomatic version is an
        <code>enum OrderState</code> whose constants implement the interface and override the
        transition methods, giving you singletons and exhaustive <code>switch</code> support for
        free. Keep the one-class-per-state form only if a state genuinely needs its own fields.
      </InfoBox>

      <h2>Template Method Pattern</h2>
      <p>
        Defines the skeleton of an algorithm in a base class (or function), deferring specific steps
        to subclasses (or callbacks) without letting them change the algorithm's overall structure.
        The base class controls the sequence; subclasses fill in the blanks. This is one of the most
        common patterns in frameworks — it's how libraries let you customize behavior without
        rewriting the surrounding orchestration logic.
      </p>

      <FlowChart
        title="Template Method Pattern Structure"
        chart={"graph TD\n  A[AbstractClass] -->|defines| B[templateMethod- fixed order]\n  B --> C[step1- abstract]\n  B --> D[step2- concrete, shared]\n  B --> E[step3- abstract, hook]\n  F[ConcreteClassA] -->|implements| C\n  F -->|implements| E\n  G[ConcreteClassB] -->|implements| C\n  G -->|implements| E"}
      />

      <CodeBlock language="java" title="Data Import Pipeline (Java)" showLineNumbers={true}>
{`// Abstract class defines the fixed skeleton of the algorithm
public abstract class DataImportJob {

    // Template method — final so subclasses can't change the sequence
    public final ImportResult run(Path sourceFile) {
        List<RawRecord> records = readSource(sourceFile);
        List<RawRecord> validRecords = validate(records);
        List<Entity> transformed = transform(validRecords);
        int written = persist(transformed);
        afterImport(written); // optional hook, default no-op
        return new ImportResult(records.size(), written);
    }

    protected abstract List<RawRecord> readSource(Path sourceFile);
    protected abstract List<Entity> transform(List<RawRecord> records);

    // Shared step every subclass gets for free
    private List<RawRecord> validate(List<RawRecord> records) {
        return records.stream().filter(RawRecord::isValid).toList();
    }

    protected abstract int persist(List<Entity> entities);

    // Hook — subclasses may override, but don't have to
    protected void afterImport(int written) {
        // default: do nothing
    }
}

public class CsvCustomerImportJob extends DataImportJob {
    @Override
    protected List<RawRecord> readSource(Path sourceFile) {
        // parse CSV rows into RawRecord
        return CsvParser.parse(sourceFile);
    }

    @Override
    protected List<Entity> transform(List<RawRecord> records) {
        return records.stream().map(CustomerMapper::fromRaw).toList();
    }

    @Override
    protected int persist(List<Entity> entities) {
        return customerRepository.saveAll(entities).size();
    }

    @Override
    protected void afterImport(int written) {
        auditLog.record("Imported " + written + " customers");
    }
}

// Usage — caller doesn't know or care about the steps
DataImportJob job = new CsvCustomerImportJob();
ImportResult result = job.run(Path.of("customers.csv"));`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Data Import Pipeline (Node.js)" showLineNumbers={true}>
{`// Base class defines the fixed skeleton of the algorithm
class DataImportJob {
  // Template method — orchestrates the fixed sequence of steps
  async run(sourceFile) {
    const records = await this.readSource(sourceFile);
    const validRecords = this.#validate(records);
    const transformed = await this.transform(validRecords);
    const written = await this.persist(transformed);
    await this.afterImport(written); // optional hook
    return { total: records.length, written };
  }

  async readSource(_sourceFile) {
    throw new Error('readSource() must be implemented by subclass');
  }

  async transform(_records) {
    throw new Error('transform() must be implemented by subclass');
  }

  // Shared step every subclass gets for free
  #validate(records) {
    return records.filter((r) => r.isValid);
  }

  async persist(_entities) {
    throw new Error('persist() must be implemented by subclass');
  }

  // Hook — subclasses may override, default is a no-op
  async afterImport(_written) {}
}

class CsvCustomerImportJob extends DataImportJob {
  async readSource(sourceFile) {
    return parseCsv(sourceFile); // returns array of raw records
  }

  async transform(records) {
    return records.map(mapCustomerFromRaw);
  }

  async persist(entities) {
    await customerRepository.saveAll(entities);
    return entities.length;
  }

  async afterImport(written) {
    await auditLog.record(\`Imported \${written} customers\`);
  }
}

// Usage
const job = new CsvCustomerImportJob();
const result = await job.run('customers.csv');`}
      </CodeBlock>

      <InfoBox variant="tip" title="Template Method Is How Testing Frameworks Work">
        JUnit's lifecycle (<code>@BeforeEach</code> → test method → <code>@AfterEach</code>) and
        Jest/Vitest's <code>beforeEach</code>/<code>test</code>/<code>afterEach</code> are Template
        Method in disguise: the framework owns the fixed sequence, and you only supply the steps
        that vary. Spring's <code>JdbcTemplate</code> follows the same idea — it owns connection
        acquisition, statement creation, and cleanup, while you supply just the SQL and a
        <code>RowMapper</code> callback for the part that's actually different each time.
      </InfoBox>

      <InfoBox variant="tip" title="When to Reach for Template Method">
        Reach for it when several variants of a process share the exact same sequence of steps but
        differ in how one or two of those steps are done — every import job reads, validates,
        transforms, and persists in that order, but CSV vs. JSON parsing differs, above. It keeps
        the sequence itself (and its "shared step every subclass gets for free" behavior) defined
        in exactly one place. Avoid it if different variants genuinely need to run steps in a
        different order, skip steps, or run them conditionally — a fixed template can't express
        that, and you'll end up fighting the base class instead of extending it. Strategy, which
        swaps the whole algorithm rather than individual steps, usually fits better there.
      </InfoBox>

      <InteractiveChallenge
        question="A base class's run() method calls step1(), step2(), then step3() in that exact order every time, but lets subclasses override step1() and step3() individually. Which pattern is this?"
        options={[
          "State — the object's behavior changes based on which subclass is active",
          "Template Method — the algorithm's skeleton and step order are fixed in the base class; subclasses only fill in specific steps",
          "Command — each step is encapsulated as a separate object",
          "Strategy — the entire algorithm is swapped out at runtime"
        ]}
        correctIndex={1}
        explanation="Template Method fixes the overall algorithm structure (the order of steps) in the base class/method, while letting subclasses customize individual steps. This differs from Strategy, which swaps out an entire algorithm as one interchangeable unit rather than customizing pieces of a shared skeleton."
      />
    </LessonLayout>
  );
}
