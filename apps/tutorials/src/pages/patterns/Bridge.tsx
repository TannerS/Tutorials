import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Bridge() {
  return (
    <LessonLayout
      title="Bridge & Mediator Patterns"
      sectionId="patterns"
      lessonIndex={9}
      prev={{ path: '/patterns/state', label: 'State & Template Method' }}
      next={{ path: '/patterns/memento', label: 'Memento & Visitor' }}
    >
      <h2>Bridge Pattern</h2>
      <p>
        Decouples an abstraction from its implementation so the two can vary independently. Instead
        of a single inheritance hierarchy that multiplies out every combination of "what" and "how"
        (think <code>EmailSmsNotification</code>, <code>EmailPushNotification</code>,
        <code>SmsPushNotification</code>...), you split it into two hierarchies connected by
        composition: a high-level abstraction that holds a reference to a low-level implementation
        interface. Change either side without touching the other.
      </p>

      <FlowChart
        title="Bridge Pattern Structure"
        chart={"graph TD\n  A[Abstraction] -->|holds a reference to| B[Implementor Interface]\n  A --> C[RefinedAbstraction]\n  B --> D[ConcreteImplementorA]\n  B --> E[ConcreteImplementorB]\n  C -->|delegates to| B"}
      />

      <CodeBlock language="java" title="Notification Abstraction over Delivery Channels (Java)" showLineNumbers={true}>
{`// Implementor interface — the "how": low-level delivery mechanics
public interface MessageSender {
    void send(String recipient, String subject, String body);
}

// Concrete implementors — each knows how to talk to one channel
public class SmtpMessageSender implements MessageSender {
    @Override
    public void send(String recipient, String subject, String body) {
        System.out.println("SMTP -> " + recipient + " [" + subject + "]: " + body);
    }
}

public class SmsGatewaySender implements MessageSender {
    @Override
    public void send(String recipient, String subject, String body) {
        // SMS ignores subject, truncates body
        System.out.println("SMS -> " + recipient + ": " + body.substring(0, Math.min(body.length(), 160)));
    }
}

// Abstraction — the "what": a business-level notification, unaware of transport details
public abstract class Notification {
    protected final MessageSender sender; // the bridge

    protected Notification(MessageSender sender) {
        this.sender = sender;
    }

    public abstract void notify(String recipient);
}

// Refined abstractions add business meaning; the sender stays swappable
public class OrderShippedNotification extends Notification {
    private final String trackingNumber;

    public OrderShippedNotification(MessageSender sender, String trackingNumber) {
        super(sender);
        this.trackingNumber = trackingNumber;
    }

    @Override
    public void notify(String recipient) {
        sender.send(recipient, "Your order has shipped",
            "Track it here: " + trackingNumber);
    }
}

// Usage — mix and match abstraction + implementation freely
Notification emailShipped = new OrderShippedNotification(new SmtpMessageSender(), "TRK-9921");
Notification smsShipped = new OrderShippedNotification(new SmsGatewaySender(), "TRK-9921");

emailShipped.notify("alice@example.com");
smsShipped.notify("+15551234567");`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Notification Abstraction over Delivery Channels (Node.js)" showLineNumbers={true}>
{`// Concrete implementors — each knows how to talk to one channel
class SmtpMessageSender {
  send(recipient, subject, body) {
    console.log(\`SMTP -> \${recipient} [\${subject}]: \${body}\`);
  }
}

class SmsGatewaySender {
  send(recipient, _subject, body) {
    // SMS ignores subject, truncates body
    console.log(\`SMS -> \${recipient}: \${body.slice(0, 160)}\`);
  }
}

// Abstraction — holds a reference to the sender (the bridge)
class Notification {
  constructor(sender) {
    if (new.target === Notification) {
      throw new Error('Notification is abstract');
    }
    this.sender = sender;
  }

  notify(_recipient) {
    throw new Error('notify() must be implemented by subclass');
  }
}

// Refined abstraction adds business meaning; sender stays swappable
class OrderShippedNotification extends Notification {
  constructor(sender, trackingNumber) {
    super(sender);
    this.trackingNumber = trackingNumber;
  }

  notify(recipient) {
    this.sender.send(recipient, 'Your order has shipped', \`Track it here: \${this.trackingNumber}\`);
  }
}

// Usage — mix and match abstraction + implementation freely
const emailShipped = new OrderShippedNotification(new SmtpMessageSender(), 'TRK-9921');
const smsShipped = new OrderShippedNotification(new SmsGatewaySender(), 'TRK-9921');

emailShipped.notify('alice@example.com');
smsShipped.notify('+15551234567');`}
      </CodeBlock>

      <InfoBox variant="info" title="Bridge vs. Adapter — Don't Confuse Them">
        Both wrap another interface, but the intent differs. Adapter is applied <em>after the
        fact</em> to make an existing incompatible interface fit — it's a patch. Bridge is designed
        <em> up front</em> to keep two hierarchies independently extensible from day one. JDBC is a
        textbook Bridge: <code>java.sql.Connection</code>/<code>Driver</code> is the abstraction,
        and each database vendor ships its own driver implementation — Postgres and MySQL drivers
        can evolve independently of the JDBC API itself.
      </InfoBox>

      <h2>Mediator Pattern</h2>
      <p>
        Centralizes complex communication between a set of objects behind a single coordinator, so
        the objects don't need direct references to each other. Instead of an N-to-N web of
        tightly-coupled peer connections, every object talks only to the mediator, and the mediator
        decides who else needs to know. This turns a tangle of dependencies into a hub-and-spoke.
      </p>

      <FlowChart
        title="Mediator Pattern Structure"
        chart={"graph TD\n  M[Mediator] --> A[Colleague A]\n  M --> B[Colleague B]\n  M --> C[Colleague C]\n  A -->|notifies| M\n  B -->|notifies| M\n  C -->|notifies| M\n  M -->|coordinates| A\n  M -->|coordinates| B\n  M -->|coordinates| C"}
      />

      <CodeBlock language="java" title="Chat Room Mediator (Java)" showLineNumbers={true}>
{`// Mediator interface
public interface ChatRoom {
    void register(User user);
    void broadcast(User sender, String message);
    void directMessage(User sender, String recipientName, String message);
}

// Concrete mediator — the only object that knows about every user
public class MainChatRoom implements ChatRoom {
    private final Map<String, User> users = new HashMap<>();

    @Override
    public void register(User user) {
        users.put(user.getName(), user);
        user.setChatRoom(this);
    }

    @Override
    public void broadcast(User sender, String message) {
        users.values().stream()
            .filter(u -> u != sender)
            .forEach(u -> u.receive(sender.getName(), message));
    }

    @Override
    public void directMessage(User sender, String recipientName, String message) {
        User recipient = users.get(recipientName);
        if (recipient == null) {
            sender.receive("System", "No such user: " + recipientName);
            return;
        }
        recipient.receive(sender.getName(), message);
    }
}

// Colleague — never holds references to other Users directly
public class User {
    private final String name;
    private ChatRoom chatRoom;

    public User(String name) { this.name = name; }
    public String getName() { return name; }
    public void setChatRoom(ChatRoom chatRoom) { this.chatRoom = chatRoom; }

    public void send(String message) {
        chatRoom.broadcast(this, message);
    }

    public void sendTo(String recipientName, String message) {
        chatRoom.directMessage(this, recipientName, message);
    }

    public void receive(String from, String message) {
        System.out.println("[" + name + "] " + from + ": " + message);
    }
}

// Usage
ChatRoom room = new MainChatRoom();
User alice = new User("alice");
User bob = new User("bob");
room.register(alice);
room.register(bob);

alice.send("Hey everyone!");        // bob receives it, alice does not
bob.sendTo("alice", "Hey Alice!");   // only alice receives it`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Chat Room Mediator (Node.js)" showLineNumbers={true}>
{`// Concrete mediator — the only object that knows about every user
class MainChatRoom {
  #users = new Map();

  register(user) {
    this.#users.set(user.name, user);
    user.chatRoom = this;
  }

  broadcast(sender, message) {
    for (const user of this.#users.values()) {
      if (user !== sender) user.receive(sender.name, message);
    }
  }

  directMessage(sender, recipientName, message) {
    const recipient = this.#users.get(recipientName);
    if (!recipient) {
      sender.receive('System', \`No such user: \${recipientName}\`);
      return;
    }
    recipient.receive(sender.name, message);
  }
}

// Colleague — never holds references to other Users directly
class User {
  constructor(name) {
    this.name = name;
    this.chatRoom = null;
  }

  send(message) {
    this.chatRoom.broadcast(this, message);
  }

  sendTo(recipientName, message) {
    this.chatRoom.directMessage(this, recipientName, message);
  }

  receive(from, message) {
    console.log(\`[\${this.name}] \${from}: \${message}\`);
  }
}

// Usage
const room = new MainChatRoom();
const alice = new User('alice');
const bob = new User('bob');
room.register(alice);
room.register(bob);

alice.send('Hey everyone!');           // bob receives it, alice does not
bob.sendTo('alice', 'Hey Alice!');      // only alice receives it`}
      </CodeBlock>

      <InfoBox variant="tip" title="Mediator in the Wild">
        Node's <code>EventEmitter</code> (and the browser's <code>DOM</code> event system) act as a
        lightweight Mediator — publishers and subscribers never reference each other directly, only
        the emitter. In Spring, <code>ApplicationEventPublisher</code> plays the same role at the
        framework level. Air-traffic control is the pattern's namesake real-world example: planes
        never coordinate directly with each other — they all talk to the tower, which decides
        who does what.
      </InfoBox>

      <InfoBox variant="warning" title="Watch for a God-Object Mediator">
        A Mediator that grows to know every business rule about every colleague becomes a God
        Object — the same problem it was meant to solve, just relocated. Keep mediators focused on
        <em> coordination</em> (routing, sequencing, notifying), and push actual business logic back
        into the colleague objects themselves.
      </InfoBox>

      <InteractiveChallenge
        question="You need a Shape abstraction (Circle, Square) that can render using either a raster renderer or a vector renderer, and you want to add new shapes and new renderers independently without an explosion of subclasses like RasterCircle, VectorCircle, RasterSquare... Which pattern fits?"
        options={[
          "Mediator — a central coordinator manages the shapes and renderers",
          "Bridge — split Shape (abstraction) and Renderer (implementation) into two independent hierarchies connected by composition",
          "State — the shape changes its rendering behavior based on internal state",
          "Template Method — a base Shape class defines the rendering algorithm skeleton"
        ]}
        correctIndex={1}
        explanation="This is the textbook Bridge scenario: two dimensions of variation (shape type and rendering technology) that would otherwise multiply into a combinatorial explosion of subclasses. Bridge decouples them into two hierarchies connected by a held reference, so either can be extended independently."
      />
    </LessonLayout>
  );
}
