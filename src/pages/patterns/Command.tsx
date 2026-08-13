import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Command() {
  return (
    <LessonLayout
      title="Command & Iterator Patterns"
      sectionId="patterns"
      lessonIndex={8}
      prev={{ path: '/patterns/proxy', label: 'Proxy & Chain of Responsibility' }}
      next={{ path: '/patterns/state', label: 'State & Template Method' }}
    >
      <h2>Command Pattern</h2>
      <p>
        Encapsulates a request as a standalone object, bundling everything needed to perform an
        action (or undo it) — the receiver, the method to call, and its arguments. Because the
        request is now an object instead of a direct method call, you can queue it, log it, pass
        it around, and reverse it. Classic use cases: undo/redo stacks in editors, task queues and
        job schedulers, and "remote control" style APIs where the invoker has no idea what a
        button actually does.
      </p>

      <FlowChart
        title="Command Pattern Structure"
        chart={"graph TD\n  A[Invoker] --> B[Command Interface]\n  B --> C[ConcreteCommand]\n  C -->|calls| D[Receiver]\n  E[Client] -->|creates & configures| C\n  E -->|sets| A"}
      />

      <CodeBlock language="java" title="Undo/Redo Text Editor Commands (Java)" showLineNumbers={true}>
{`// Command interface — every action knows how to execute and undo itself
public interface Command {
    void execute();
    void undo();
}

// Receiver — the object that actually does the work
public class TextDocument {
    private final StringBuilder content = new StringBuilder();

    public void insert(int position, String text) {
        content.insert(position, text);
    }

    public void delete(int position, int length) {
        content.delete(position, position + length);
    }

    public String getContent() {
        return content.toString();
    }
}

// Concrete command — captures everything needed to redo/undo an insert
public class InsertTextCommand implements Command {
    private final TextDocument document;
    private final int position;
    private final String text;

    public InsertTextCommand(TextDocument document, int position, String text) {
        this.document = document;
        this.position = position;
        this.text = text;
    }

    @Override
    public void execute() {
        document.insert(position, text);
    }

    @Override
    public void undo() {
        document.delete(position, text.length());
    }
}

// Invoker — maintains history, knows nothing about TextDocument internals
public class CommandHistory {
    private final Deque<Command> undoStack = new ArrayDeque<>();
    private final Deque<Command> redoStack = new ArrayDeque<>();

    public void execute(Command command) {
        command.execute();
        undoStack.push(command);
        redoStack.clear(); // new action invalidates the redo history
    }

    public void undo() {
        if (undoStack.isEmpty()) return;
        Command command = undoStack.pop();
        command.undo();
        redoStack.push(command);
    }

    public void redo() {
        if (redoStack.isEmpty()) return;
        Command command = redoStack.pop();
        command.execute();
        undoStack.push(command);
    }
}

// Usage
TextDocument doc = new TextDocument();
CommandHistory history = new CommandHistory();

history.execute(new InsertTextCommand(doc, 0, "Hello, "));
history.execute(new InsertTextCommand(doc, 7, "World!"));
System.out.println(doc.getContent()); // "Hello, World!"

history.undo();
System.out.println(doc.getContent()); // "Hello, "
history.redo();
System.out.println(doc.getContent()); // "Hello, World!"`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Undo/Redo Text Editor Commands (Node.js)" showLineNumbers={true}>
{`// Receiver
class TextDocument {
  #content = '';

  insert(position, text) {
    this.#content = this.#content.slice(0, position) + text + this.#content.slice(position);
  }

  delete(position, length) {
    this.#content = this.#content.slice(0, position) + this.#content.slice(position + length);
  }

  get content() {
    return this.#content;
  }
}

// Concrete command
class InsertTextCommand {
  #document;
  #position;
  #text;

  constructor(document, position, text) {
    this.#document = document;
    this.#position = position;
    this.#text = text;
  }

  execute() {
    this.#document.insert(this.#position, this.#text);
  }

  undo() {
    this.#document.delete(this.#position, this.#text.length);
  }
}

// Invoker
class CommandHistory {
  #undoStack = [];
  #redoStack = [];

  execute(command) {
    command.execute();
    this.#undoStack.push(command);
    this.#redoStack = []; // new action invalidates redo history
  }

  undo() {
    const command = this.#undoStack.pop();
    if (!command) return;
    command.undo();
    this.#redoStack.push(command);
  }

  redo() {
    const command = this.#redoStack.pop();
    if (!command) return;
    command.execute();
    this.#undoStack.push(command);
  }
}

// Usage
const doc = new TextDocument();
const history = new CommandHistory();

history.execute(new InsertTextCommand(doc, 0, 'Hello, '));
history.execute(new InsertTextCommand(doc, 7, 'World!'));
console.log(doc.content); // "Hello, World!"

history.undo();
console.log(doc.content); // "Hello, "
history.redo();
console.log(doc.content); // "Hello, World!"`}
      </CodeBlock>

      <InfoBox variant="tip" title="Command Everywhere">
        <p>
          <strong>Java/Spring:</strong> <code>Runnable</code> and <code>Callable</code> are minimal
          commands. Spring Batch's <code>Tasklet</code>/Step processing and job schedulers like
          Quartz treat each job as a serializable command object that can be queued, retried, or
          persisted.
        </p>
        <p>
          <strong>Node.js:</strong> Job queue libraries like BullMQ serialize a job's name and
          payload to Redis — exactly a Command object — so a worker process can pick it up and
          "execute" it later, potentially on a different machine than the one that created it.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="When to Reach for Command">
        Reach for Command when an action needs to outlive the moment it was triggered — it must be
        queued for later, retried, logged for audit, or reversed, like the undo/redo stack above.
        The tell is needing to treat "do this thing" as data you can store in a list, pass to
        another thread, or serialize to Redis/a database, not just a function you call once and
        forget. If a button click just needs to call one method right now with no history, no
        queueing, and no undo requirement, wrapping it in a Command object only adds a class and
        an interface for something a direct method call already does fine.
      </InfoBox>

      <h2>Iterator Pattern</h2>
      <p>
        Provides a way to access the elements of a collection sequentially without exposing its
        underlying representation — an array, linked list, tree, or database cursor all expose the
        same simple traversal contract. This decouples algorithms that walk over data from how that
        data is actually stored, and lets you have multiple independent traversals over the same
        collection at once.
      </p>

      <FlowChart
        title="Iterator Pattern Structure"
        chart={"graph TD\n  A[Client] --> B[Iterable Interface]\n  B --> C[ConcreteAggregate]\n  A --> D[Iterator Interface]\n  D --> E[ConcreteIterator]\n  C -->|creates| E\n  E -->|traverses| C"}
      />

      <CodeBlock language="java" title="Custom Collection with Iterator (Java)" showLineNumbers={true}>
{`// A fixed-capacity ring buffer that hides its internal array/index bookkeeping
public class RingBuffer<T> implements Iterable<T> {
    private final Object[] items;
    private int start = 0;
    private int size = 0;

    public RingBuffer(int capacity) {
        this.items = new Object[capacity];
    }

    public void add(T item) {
        int writeIndex = (start + size) % items.length;
        items[writeIndex] = item;
        if (size < items.length) {
            size++;
        } else {
            start = (start + 1) % items.length; // overwrite oldest
        }
    }

    @Override
    public Iterator<T> iterator() {
        return new RingBufferIterator();
    }

    private class RingBufferIterator implements Iterator<T> {
        private int count = 0;

        @Override
        public boolean hasNext() {
            return count < size;
        }

        @Override
        @SuppressWarnings("unchecked")
        public T next() {
            if (!hasNext()) throw new NoSuchElementException();
            T item = (T) items[(start + count) % items.length];
            count++;
            return item;
        }
    }
}

// Usage — client code just sees a standard Iterable, no idea it's a ring buffer
RingBuffer<String> recentEvents = new RingBuffer<>(3);
recentEvents.add("login");
recentEvents.add("click");
recentEvents.add("purchase");
recentEvents.add("logout"); // overwrites "login"

for (String event : recentEvents) {
    System.out.println(event); // click, purchase, logout
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Custom Collection with Iterator (Node.js)" showLineNumbers={true}>
{`// A fixed-capacity ring buffer implementing the iterable protocol
class RingBuffer {
  #items;
  #start = 0;
  #size = 0;

  constructor(capacity) {
    this.#items = new Array(capacity);
  }

  add(item) {
    const writeIndex = (this.#start + this.#size) % this.#items.length;
    this.#items[writeIndex] = item;
    if (this.#size < this.#items.length) {
      this.#size++;
    } else {
      this.#start = (this.#start + 1) % this.#items.length; // overwrite oldest
    }
  }

  // Symbol.iterator makes this class work with for...of, spread, etc.
  [Symbol.iterator]() {
    let count = 0;
    const { start, size, items } = { start: this.#start, size: this.#size, items: this.#items };

    return {
      next() {
        if (count >= size) {
          return { value: undefined, done: true };
        }
        const value = items[(start + count) % items.length];
        count++;
        return { value, done: false };
      },
    };
  }

  // Or, more idiomatically, use a generator function instead:
  *values() {
    for (let i = 0; i < this.#size; i++) {
      yield this.#items[(this.#start + i) % this.#items.length];
    }
  }
}

// Usage — client code just sees a standard iterable
const recentEvents = new RingBuffer(3);
recentEvents.add('login');
recentEvents.add('click');
recentEvents.add('purchase');
recentEvents.add('logout'); // overwrites "login"

for (const event of recentEvents) {
  console.log(event); // click, purchase, logout
}

console.log([...recentEvents]); // ['click', 'purchase', 'logout']`}
      </CodeBlock>

      <InfoBox variant="info" title="Java Iterable vs. JavaScript's Symbol.iterator">
        Java's <code>Iterable&lt;T&gt;</code>/<code>Iterator&lt;T&gt;</code> pair maps almost
        exactly onto JavaScript's <code>Symbol.iterator</code> protocol — both let a for-each-style
        loop pull elements one at a time via <code>hasNext()</code>/<code>next()</code> or a
        <code>{'{ value, done }'}</code> result object. JavaScript generator functions
        (<code>function*</code>) are effectively syntactic sugar for hand-writing the ConcreteIterator
        class: <code>yield</code> pauses execution and returns the next value, exactly like a manual
        <code>next()</code> call would.
      </InfoBox>

      <InfoBox variant="tip" title="When to Write a Custom Iterator">
        You need this when you're building a custom data structure — a ring buffer, a tree, a
        paginated API client wrapping repeated network calls — and you want callers to walk it
        with a plain <code>for...of</code>/for-each loop instead of learning your structure's
        internal layout. It also lets you swap that internal layout later (array to linked list,
        eager to lazy) without breaking every caller. If you're just working with a built-in array
        or <code>List</code>, don't write one — Java's collections and JavaScript's arrays already
        implement this pattern for you.
      </InfoBox>

      <InteractiveChallenge
        question="A GUI 'Undo' button needs to reverse the last action, whatever that action happened to be — insert text, delete a shape, resize an image. Which pattern is purpose-built for this?"
        options={[
          "Iterator — it walks backward through a history of actions",
          "Command — each action is encapsulated as an object that knows how to undo itself",
          "Template Method — the undo steps are defined once in a base class",
          "Chain of Responsibility — each handler decides whether to undo the action"
        ]}
        correctIndex={1}
        explanation="Command is exactly this: each user action becomes an object with execute() and undo() methods. The invoker (the Undo button/history stack) never needs to know what kind of action it's reversing — it just calls undo() on whatever Command object is on top of the stack."
      />
    </LessonLayout>
  );
}
