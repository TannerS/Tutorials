import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Memento() {
  return (
    <LessonLayout
      title="Memento & Visitor Patterns"
      sectionId="patterns"
      lessonIndex={11}
      prev={{ path: '/patterns/bridge', label: 'Bridge & Mediator' }}
      next={{ path: '/patterns/flyweight', label: 'Flyweight & Interpreter' }}
    >
      <h2>Memento Pattern</h2>
      <p>
        Captures and externalizes an object's internal state so it can be restored later, without
        violating encapsulation — the object being snapshotted (the <em>originator</em>) controls
        exactly what goes into the memento and how it's restored, while the object holding onto the
        snapshots (the <em>caretaker</em>) never peeks inside. This is the standard building block
        for undo functionality, checkpoints, and "save game" style features.
      </p>

      <FlowChart
        title="Memento Pattern Structure"
        chart={"graph TD\n  A[Caretaker] -->|stores, never reads| B[Memento]\n  C[Originator] -->|creates| B\n  C -->|restores from| B\n  A -->|requests snapshot from| C\n  A -->|returns memento to| C"}
      />

      <CodeBlock language="java" title="Text Editor Undo via Memento (Java)" showLineNumbers={true}>
{`// Memento — an immutable snapshot. Only Editor can construct or read its state.
public final class EditorMemento {
    private final String content;
    private final int cursorPosition;

    // Package-private constructor: only Editor (same package) can create one
    EditorMemento(String content, int cursorPosition) {
        this.content = content;
        this.cursorPosition = cursorPosition;
    }

    // Package-private accessors: only Editor can read the snapshot back
    String getContent() { return content; }
    int getCursorPosition() { return cursorPosition; }
}

// Originator — knows how to save and restore its own state
public class Editor {
    private String content = "";
    private int cursorPosition = 0;

    public void type(String text) {
        content += text;
        cursorPosition = content.length();
    }

    public EditorMemento save() {
        return new EditorMemento(content, cursorPosition);
    }

    public void restore(EditorMemento memento) {
        this.content = memento.getContent();
        this.cursorPosition = memento.getCursorPosition();
    }

    public String getContent() { return content; }
}

// Caretaker — stores mementos but never inspects or modifies their contents
public class UndoManager {
    private final Deque<EditorMemento> history = new ArrayDeque<>();

    public void save(Editor editor) {
        history.push(editor.save());
    }

    public void undo(Editor editor) {
        if (!history.isEmpty()) {
            editor.restore(history.pop());
        }
    }
}

// Usage
Editor editor = new Editor();
UndoManager undoManager = new UndoManager();

undoManager.save(editor);
editor.type("Hello");
undoManager.save(editor);
editor.type(", World!");
System.out.println(editor.getContent()); // "Hello, World!"

undoManager.undo(editor);
System.out.println(editor.getContent()); // "Hello"`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Text Editor Undo via Memento (Node.js)" showLineNumbers={true}>
{`// Memento — a frozen snapshot, exposed only via a symbol-keyed accessor
const MEMENTO_STATE = Symbol('state');

class EditorMemento {
  constructor(content, cursorPosition) {
    this[MEMENTO_STATE] = Object.freeze({ content, cursorPosition });
  }
}

// Originator — the only class that reaches into a memento's state
class Editor {
  #content = '';
  #cursorPosition = 0;

  type(text) {
    this.#content += text;
    this.#cursorPosition = this.#content.length;
  }

  save() {
    return new EditorMemento(this.#content, this.#cursorPosition);
  }

  restore(memento) {
    const { content, cursorPosition } = memento[MEMENTO_STATE];
    this.#content = content;
    this.#cursorPosition = cursorPosition;
  }

  get content() {
    return this.#content;
  }
}

// Caretaker — stores mementos but never inspects their contents
class UndoManager {
  #history = [];

  save(editor) {
    this.#history.push(editor.save());
  }

  undo(editor) {
    const memento = this.#history.pop();
    if (memento) editor.restore(memento);
  }
}

// Usage
const editor = new Editor();
const undoManager = new UndoManager();

undoManager.save(editor);
editor.type('Hello');
undoManager.save(editor);
editor.type(', World!');
console.log(editor.content); // "Hello, World!"

undoManager.undo(editor);
console.log(editor.content); // "Hello"`}
      </CodeBlock>

      <InfoBox variant="info" title="Memento vs. Just Exposing Getters/Setters">
        You could restore state by exposing public setters for every field, but that breaks
        encapsulation and lets any caller mutate internal state arbitrarily. Memento keeps the
        snapshot opaque to everyone except the originator — the caretaker (undo stack, history log,
        session store) only ever passes the memento back, never reads or writes it directly. In
        Java this is often enforced with package-private access; in JS you can approximate it with
        private class fields, closures, or a <code>WeakMap</code> keyed by instance.
      </InfoBox>

      <h2>Visitor Pattern</h2>
      <p>
        Lets you add new operations to a stable family of object types without modifying those
        classes. Each element in the object structure accepts a visitor and calls back into it
        (<code>accept(visitor)</code> → <code>visitor.visitX(this)</code>), a technique called
        <em> double dispatch</em>. New operations become new Visitor classes; the element classes
        themselves never change. It's the mirror image of Strategy: Strategy varies one algorithm
        across many contexts, Visitor varies many algorithms across one fixed structure.
      </p>

      <FlowChart
        title="Visitor Pattern Structure"
        chart={"graph TD\n  A[Visitor Interface] --> B[ConcreteVisitor1]\n  A --> C[ConcreteVisitor2]\n  D[Element Interface] --> E[ConcreteElementA]\n  D --> F[ConcreteElementB]\n  E -->|accept- visitor| A\n  F -->|accept- visitor| A\n  B -->|visitElementA / visitElementB| E\n  B --> F"}
      />

      <CodeBlock language="java" title="Shopping Cart Visitor - Pricing & Reports (Java)" showLineNumbers={true}>
{`// Element hierarchy — stable, rarely changes
public interface CartItem {
    <R> R accept(CartItemVisitor<R> visitor);
}

public class Book implements CartItem {
    public final String title;
    public final BigDecimal price;
    public final boolean taxExempt = true; // books are tax-exempt in many jurisdictions

    public Book(String title, BigDecimal price) {
        this.title = title;
        this.price = price;
    }

    @Override
    public <R> R accept(CartItemVisitor<R> visitor) {
        return visitor.visitBook(this);
    }
}

public class Electronics implements CartItem {
    public final String name;
    public final BigDecimal price;
    public final BigDecimal warrantyFee;

    public Electronics(String name, BigDecimal price, BigDecimal warrantyFee) {
        this.name = name;
        this.price = price;
        this.warrantyFee = warrantyFee;
    }

    @Override
    public <R> R accept(CartItemVisitor<R> visitor) {
        return visitor.visitElectronics(this);
    }
}

// Visitor interface — one method per concrete element type
public interface CartItemVisitor<R> {
    R visitBook(Book book);
    R visitElectronics(Electronics electronics);
}

// Concrete visitor #1 — computes total price including tax
public class PriceCalculatorVisitor implements CartItemVisitor<BigDecimal> {
    private static final BigDecimal TAX_RATE = new BigDecimal("0.08");

    @Override
    public BigDecimal visitBook(Book book) {
        return book.price; // tax-exempt
    }

    @Override
    public BigDecimal visitElectronics(Electronics electronics) {
        BigDecimal taxed = electronics.price.multiply(BigDecimal.ONE.add(TAX_RATE));
        return taxed.add(electronics.warrantyFee);
    }
}

// Concrete visitor #2 — builds a shipping label description, totally unrelated to pricing
public class ShippingLabelVisitor implements CartItemVisitor<String> {
    @Override
    public String visitBook(Book book) {
        return "Media Mail: " + book.title;
    }

    @Override
    public String visitElectronics(Electronics electronics) {
        return "Signature Required: " + electronics.name;
    }
}

// Usage — adding a new operation (ShippingLabelVisitor) never touched Book/Electronics
List<CartItem> cart = List.of(
    new Book("Head First Design Patterns", new BigDecimal("49.99")),
    new Electronics("Headphones", new BigDecimal("199.99"), new BigDecimal("9.99"))
);

PriceCalculatorVisitor pricing = new PriceCalculatorVisitor();
BigDecimal total = cart.stream()
    .map(item -> item.accept(pricing))
    .reduce(BigDecimal.ZERO, BigDecimal::add);`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Shopping Cart Visitor - Pricing & Reports (Node.js)" showLineNumbers={true}>
{`// Element hierarchy — stable, rarely changes
class Book {
  constructor(title, price) {
    this.title = title;
    this.price = price;
  }

  accept(visitor) {
    return visitor.visitBook(this);
  }
}

class Electronics {
  constructor(name, price, warrantyFee) {
    this.name = name;
    this.price = price;
    this.warrantyFee = warrantyFee;
  }

  accept(visitor) {
    return visitor.visitElectronics(this);
  }
}

// Concrete visitor #1 — computes total price including tax
class PriceCalculatorVisitor {
  static TAX_RATE = 0.08;

  visitBook(book) {
    return book.price; // tax-exempt
  }

  visitElectronics(electronics) {
    const taxed = electronics.price * (1 + PriceCalculatorVisitor.TAX_RATE);
    return taxed + electronics.warrantyFee;
  }
}

// Concrete visitor #2 — builds a shipping label description, unrelated to pricing
class ShippingLabelVisitor {
  visitBook(book) {
    return \`Media Mail: \${book.title}\`;
  }

  visitElectronics(electronics) {
    return \`Signature Required: \${electronics.name}\`;
  }
}

// Usage — adding ShippingLabelVisitor never touched Book/Electronics
const cart = [
  new Book('Head First Design Patterns', 49.99),
  new Electronics('Headphones', 199.99, 9.99),
];

const pricing = new PriceCalculatorVisitor();
const total = cart.reduce((sum, item) => sum + item.accept(pricing), 0);

const labels = new ShippingLabelVisitor();
console.log(cart.map((item) => item.accept(labels)));`}
      </CodeBlock>

      <InfoBox variant="tip" title="Visitor Powers Compilers and Linters">
        Visitor is the backbone of every AST-walking tool: TypeScript's compiler API, Babel plugins,
        and ESLint rules all implement visitor objects with methods like
        <code>visitCallExpression</code> or <code>visitBinaryExpression</code> that get dispatched
        as the walker traverses a fixed tree of node types. Java annotation processors and bytecode
        tools like ASM use the same idea via <code>ElementVisitor</code>/<code>ClassVisitor</code>.
      </InfoBox>

      <InfoBox variant="warning" title="Visitor's Tradeoff">
        Visitor makes adding new <em>operations</em> easy but makes adding new <em>element
        types</em> hard — every new element class requires a new method on every existing visitor
        interface implementation. Only reach for Visitor when the object structure is stable and
        the operations are what's likely to grow.
      </InfoBox>

    </LessonLayout>
  );
}
