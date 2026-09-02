import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Flyweight() {
  return (
    <LessonLayout
      title="Flyweight & Interpreter Patterns"
      sectionId="patterns"
      lessonIndex={12}
      prev={{ path: '/patterns/memento', label: 'Memento & Visitor' }}
      next={{ path: '/patterns/realworld', label: 'Real-World Applications' }}
    >
      <h2>Flyweight Pattern</h2>
      <p>
        Reduces memory usage by sharing common, immutable state (<em>intrinsic</em> state) across
        many fine-grained objects, instead of storing a full copy of that state in every instance.
        Each object only keeps the data that's unique to it (<em>extrinsic</em> state), and looks up
        the shared portion from a factory/pool. It matters whenever you need to create huge numbers
        of similar objects — glyphs in a text editor, tiles or particles in a game, or nodes in a
        large graph.
      </p>

      <FlowChart
        title="Flyweight Pattern Structure"
        chart={"graph TD\n  A[Client] -->|extrinsic state| B[FlyweightFactory]\n  B -->|returns shared instance| C[Flyweight - intrinsic state]\n  A -->|holds reference + extrinsic state| C\n  B -->|caches| C\n  D[Client 2] --> B\n  D --> C"}
      />

      <CodeBlock language="java" title="Character Glyphs in a Text Editor (Java)" showLineNumbers={true}>
{`// Flyweight — intrinsic state only: shared, immutable, expensive to duplicate
public final class Glyph {
    private final char character;
    private final String fontFamily;
    private final int fontSize;
    // Imagine this also held rendered bitmap data, kerning tables, etc. —
    // exactly the kind of heavy, shareable payload Flyweight is meant for.

    Glyph(char character, String fontFamily, int fontSize) {
        this.character = character;
        this.fontFamily = fontFamily;
        this.fontSize = fontSize;
    }

    // Rendering needs extrinsic state (position) passed in, not stored
    public void render(int x, int y) {
        System.out.printf("Draw '%c' [%s %dpt] at (%d,%d)%n",
            character, fontFamily, fontSize, x, y);
    }
}

// Flyweight factory — the only place Glyph instances are created, and cached
public class GlyphFactory {
    private final Map<String, Glyph> cache = new ConcurrentHashMap<>();

    public Glyph get(char character, String fontFamily, int fontSize) {
        String key = character + "|" + fontFamily + "|" + fontSize;
        return cache.computeIfAbsent(key, k -> new Glyph(character, fontFamily, fontSize));
    }

    public int cachedCount() {
        return cache.size();
    }
}

// Extrinsic state (position) lives in the document, not the Glyph
public record PositionedGlyph(Glyph glyph, int x, int y) {
    void render() {
        glyph.render(x, y);
    }
}

// Usage — a document with 50,000 characters shares a tiny number of Glyph objects
GlyphFactory factory = new GlyphFactory();
List<PositionedGlyph> document = new ArrayList<>();

String text = "Head First Design Patterns";
int x = 0;
for (char c : text.toCharArray()) {
    Glyph glyph = factory.get(c, "Menlo", 14); // shared across every occurrence of 'c'
    document.add(new PositionedGlyph(glyph, x, 0));
    x += 8;
}

document.forEach(PositionedGlyph::render);
System.out.println("Unique glyph objects: " + factory.cachedCount()); // far fewer than text.length()`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Character Glyphs in a Text Editor (Node.js)" showLineNumbers={true}>
{`// Flyweight — intrinsic state only: shared, immutable
class Glyph {
  #character;
  #fontFamily;
  #fontSize;

  constructor(character, fontFamily, fontSize) {
    this.#character = character;
    this.#fontFamily = fontFamily;
    this.#fontSize = fontSize;
  }

  // Rendering needs extrinsic state (position) passed in, not stored
  render(x, y) {
    console.log(\`Draw '\${this.#character}' [\${this.#fontFamily} \${this.#fontSize}pt] at (\${x},\${y})\`);
  }
}

// Flyweight factory — the only place Glyph instances are created, and cached
class GlyphFactory {
  #cache = new Map();

  get(character, fontFamily, fontSize) {
    const key = \`\${character}|\${fontFamily}|\${fontSize}\`;
    if (!this.#cache.has(key)) {
      this.#cache.set(key, new Glyph(character, fontFamily, fontSize));
    }
    return this.#cache.get(key);
  }

  get cachedCount() {
    return this.#cache.size;
  }
}

// Extrinsic state (position) lives alongside the glyph reference, not inside it
class PositionedGlyph {
  constructor(glyph, x, y) {
    this.glyph = glyph;
    this.x = x;
    this.y = y;
  }

  render() {
    this.glyph.render(this.x, this.y);
  }
}

// Usage — a document with thousands of characters shares very few Glyph objects
const factory = new GlyphFactory();
const document = [];

const text = 'Head First Design Patterns';
let x = 0;
for (const char of text) {
  const glyph = factory.get(char, 'Menlo', 14); // shared across every occurrence of char
  document.push(new PositionedGlyph(glyph, x, 0));
  x += 8;
}

document.forEach((g) => g.render());
console.log('Unique glyph objects:', factory.cachedCount); // far fewer than text.length`}
      </CodeBlock>

      <InfoBox variant="info" title="Flyweight in the Standard Library">
        <code>Integer.valueOf(int)</code> in Java caches and shares boxed integers from -128 to 127
        (via the internal <code>Integer.IntegerCache</code>) rather than allocating a new object every
        time — a Flyweight
        applied to a hot path. Node's V8 engine does something similar for small integers
        internally, and string interning (Java's <code>String.intern()</code>) shares identical
        string literals across the whole JVM for the same reason: don't pay to store the same
        immutable data twice.
      </InfoBox>

      <h2>Interpreter Pattern</h2>
      <p>
        Defines a grammar for a simple language and represents each grammar rule as a class, so
        that "sentences" in the language can be parsed into an expression tree and then evaluated by
        walking that tree. It's overkill for anything beyond a small, well-bounded language — but
        for things like arithmetic expressions, search-query syntax, or rule engines, it turns a
        parsing/evaluation problem into a plain object hierarchy.
      </p>

      <FlowChart
        title="Interpreter Pattern Structure"
        chart={"graph TD\n  A[Client] -->|builds| B[AbstractExpression]\n  B --> C[TerminalExpression - Number]\n  B --> D[NonterminalExpression - Add]\n  B --> E[NonterminalExpression - Multiply]\n  D -->|left, right| B\n  E -->|left, right| B\n  A -->|calls| F[interpret- context]"}
      />

      <CodeBlock language="java" title="Arithmetic Expression Evaluator (Java)" showLineNumbers={true}>
{`// AbstractExpression — every node in the tree can interpret itself
public interface Expression {
    int interpret();
}

// Terminal expression — a leaf node (a literal number)
public class NumberExpression implements Expression {
    private final int value;

    public NumberExpression(int value) {
        this.value = value;
    }

    @Override
    public int interpret() {
        return value;
    }
}

// Nonterminal expressions — compose other expressions
public class AddExpression implements Expression {
    private final Expression left;
    private final Expression right;

    public AddExpression(Expression left, Expression right) {
        this.left = left;
        this.right = right;
    }

    @Override
    public int interpret() {
        return left.interpret() + right.interpret();
    }
}

public class MultiplyExpression implements Expression {
    private final Expression left;
    private final Expression right;

    public MultiplyExpression(Expression left, Expression right) {
        this.left = left;
        this.right = right;
    }

    @Override
    public int interpret() {
        return left.interpret() * right.interpret();
    }
}

// A tiny parser turns tokens like "3 4 + 2 *" (postfix) into an expression tree
public class ExpressionParser {
    public Expression parse(String postfixExpression) {
        Deque<Expression> stack = new ArrayDeque<>();
        for (String token : postfixExpression.split("\\\\s+")) {
            switch (token) {
                case "+" -> {
                    Expression right = stack.pop();
                    Expression left = stack.pop();
                    stack.push(new AddExpression(left, right));
                }
                case "*" -> {
                    Expression right = stack.pop();
                    Expression left = stack.pop();
                    stack.push(new MultiplyExpression(left, right));
                }
                default -> stack.push(new NumberExpression(Integer.parseInt(token)));
            }
        }
        return stack.pop();
    }
}

// Usage: "3 4 + 2 *" means (3 + 4) * 2
Expression expr = new ExpressionParser().parse("3 4 + 2 *");
System.out.println(expr.interpret()); // 14`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Arithmetic Expression Evaluator (Node.js)" showLineNumbers={true}>
{`// Terminal expression — a leaf node (a literal number)
class NumberExpression {
  constructor(value) {
    this.value = value;
  }

  interpret() {
    return this.value;
  }
}

// Nonterminal expressions — compose other expressions
class AddExpression {
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }

  interpret() {
    return this.left.interpret() + this.right.interpret();
  }
}

class MultiplyExpression {
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }

  interpret() {
    return this.left.interpret() * this.right.interpret();
  }
}

// A tiny parser turns tokens like "3 4 + 2 *" (postfix) into an expression tree
class ExpressionParser {
  parse(postfixExpression) {
    const stack = [];
    for (const token of postfixExpression.split(/\\s+/)) {
      switch (token) {
        case '+': {
          const right = stack.pop();
          const left = stack.pop();
          stack.push(new AddExpression(left, right));
          break;
        }
        case '*': {
          const right = stack.pop();
          const left = stack.pop();
          stack.push(new MultiplyExpression(left, right));
          break;
        }
        default:
          stack.push(new NumberExpression(Number(token)));
      }
    }
    return stack.pop();
  }
}

// Usage: "3 4 + 2 *" means (3 + 4) * 2
const expr = new ExpressionParser().parse('3 4 + 2 *');
console.log(expr.interpret()); // 14`}
      </CodeBlock>

      <InfoBox variant="warning" title="Interpreter's Scope — Keep It Small">
        Interpreter works well for tiny, purpose-built grammars (feature flags rule engines, search
        filter DSLs, spreadsheet-style formulas). For anything resembling a real programming
        language, reach for an existing parser generator (ANTLR, PEG.js) or just embed an existing
        scripting language — hand-rolling Interpreter for a large grammar produces an unwieldy class
        explosion, one class per grammar rule.
      </InfoBox>

      <InfoBox variant="tip" title="Interpreter Nearby">
        Regular expression engines are a real-world Interpreter: each regex compiles into a tree
        (or state machine) of terminal and nonterminal expressions that get "interpreted" against
        input text. Spring Expression Language (SpEL, evaluated inside <code>@Value</code>
        annotations) and validation rule engines built on top of libraries like <code>jexl</code> or Node's
        <code>expr-eval</code> follow the same structure — parse a small language once, then
        interpret it repeatedly.
      </InfoBox>

    </LessonLayout>
  );
}
