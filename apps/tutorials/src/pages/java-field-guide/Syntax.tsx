import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideJavaSyntax() {
  return (
    <PosterLayout
      accent="amber"
      eyebrow="Java + Spring Boot 4 · Field Reference"
      title="Modern Java Syntax"
      tagline="Records, sealed types, and pattern matching condensed for offline study — Java 21+ idioms, not the Java 8 you remember."
      meta={['Java 21+', '13 features']}
      footerLabel="Personal study reference — Java"
      pageLabel="Java + Spring Field Guide · Syntax"
      prev={null}
      next={{ path: '/java-field-guide/collections-streams', label: 'Collections & Streams' }}
    >
      <PosterCard
        glyph="var"
        title={<>var<span className="dim"> — Java 10+</span></>}
        language="java"
        code={`var list = new ArrayList<String>();   // ArrayList<String>
var map = Map.of("a", 1, "b", 2);     // Map<String, Integer>

// cannot use var for:
// fields, parameters, return types, or with no initializer`}
        caption="Infers the exact type from the initializer — never Object, never a supertype. Restricted to local variables that have an initializer."
      />

      <PosterCard
        glyph="TB"
        title={<>Text Blocks<span className="dim"> — Java 13+</span></>}
        language="java"
        code={`String json = """
        {
            "name": "Java",
            "version": 21
        }
        """;

// incidental left-margin whitespace is stripped automatically`}
        caption={<>Multi-line strings without escaping every quote. The closing <code>&quot;&quot;&quot;</code> position sets the left-margin indent that gets stripped.</>}
      />

      <PosterCard
        glyph="Rec"
        title={<>record<span className="dim"> — Java 16+</span></>}
        language="java"
        code={`record Point(int x, int y) {}

var p = new Point(3, 4);
p.x();   // 3 — accessor, not getX()
p.y();   // 4

record NamedPoint(String name, int x, int y) implements Serializable {}`}
        caption="Auto-generates a canonical constructor, accessors, equals/hashCode, and toString from the components. Records implicitly extend java.lang.Record, so they can't extend anything else."
      />

      <PosterCard
        glyph="Val"
        title={<>Compact Constructor<span className="dim"> (validation)</span></>}
        language="java"
        code={`record Range(int lo, int hi) {
    Range {  // no parameter list = compact constructor
        if (lo > hi) throw new IllegalArgumentException("lo > hi");
    }
}`}
        caption="Runs before field assignment, so it's the place to validate or normalize inputs without repeating the full parameter list."
      />

      <PosterCard
        glyph="Se"
        title={<>sealed<span className="dim"> interface / class — Java 17+</span></>}
        language="java"
        code={`sealed interface Shape permits Circle, Rectangle, Triangle {}

record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}
final class Triangle implements Shape { double base, height; }`}
        caption="Restricts which classes may implement the type — that's what lets a switch over Shape be exhaustive without a default branch."
      />

      <PosterCard
        glyph="Sw"
        title={<>switch<span className="dim"> expression — Java 14+</span></>}
        language="java"
        code={`String tier = switch (score) {
    case 90, 91, 92 -> "A";
    case 80, 81, 82 -> "B";
    default -> {
        if (score >= 70) yield "C";
        else yield "F";
    }
};`}
        caption="The arrow form doesn't fall through and returns a value directly. Use yield only inside a brace block when a branch needs more than one expression."
      />

      <PosterCard
        glyph="PM"
        title={<>Pattern Matching<span className="dim"> switch — Java 21</span></>}
        language="java"
        code={`String describe(Object o) {
    return switch (o) {
        case null                  -> "null";
        case Integer i when i < 0  -> "negative int: " + i;
        case Integer i              -> "int: " + i;
        case String s                -> "string: " + s;
        default                       -> o.getClass().getSimpleName();
    };
}`}
        caption={<>Type patterns bind a typed variable per branch, and <code>when</code> adds a guard clause. <code>case null</code> must be explicit — switching on a null Object still NPEs without it.</>}
      />

      <PosterCard
        glyph="RP"
        title={<>Record Patterns<span className="dim"> (deconstruction) — Java 21</span></>}
        language="java"
        code={`record Point(double x, double y) {}
record Line(Point start, Point end) {}

double lengthOf(Line line) {
    return switch (line) {
        case Line(Point(var x1, var y1), Point(var x2, var y2)) ->
            Math.hypot(x2 - x1, y2 - y1);
    };
}`}
        caption="Deconstructs nested records directly in the case label — no manual .start().x() chains. Exhaustive over a sealed hierarchy with no default needed."
      />

      <PosterCard
        glyph="Io"
        title={<>instanceof<span className="dim"> pattern — Java 16+</span></>}
        language="java"
        code={`if (obj instanceof String s) {
    System.out.println(s.length());  // s already cast
}

if (obj instanceof String s && s.length() > 3) {
    // pattern variable usable in the && chain too
}`}
        caption="Eliminates the explicit cast after a successful instanceof check. The pattern variable is only in scope where the compiler can prove the match succeeded."
      />

      <PosterCard
        glyph="TWR"
        title={<>try-with-resources<span className="dim">()</span></>}
        language="java"
        code={`try (BufferedReader reader = new BufferedReader(new FileReader("data.txt"))) {
    String line;
    while ((line = reader.readLine()) != null) System.out.println(line);
} catch (IOException e) {
    System.out.println("Error reading file: " + e.getMessage());
}
// reader.close() called automatically, even on exception`}
        caption="Any AutoCloseable declared in the parens gets closed in reverse order automatically. Prefer this over manual finally blocks — shorter and can't leak."
      />

      <PosterCard
        glyph="@O"
        title={<>@Override<span className="dim"> &amp; </span>@FunctionalInterface</>}
        language="java"
        code={`@Override
public String toString() { return "MyClass"; }

@FunctionalInterface
interface Transformer<T, R> {
    R transform(T input);   // only ONE abstract method allowed
}`}
        caption="@Override catches typos in method signatures at compile time instead of silently creating an overload. @FunctionalInterface locks an interface to one abstract method so it stays lambda-compatible."
      />

      <PosterCard
        glyph="@C"
        title={<>Custom Annotation<span className="dim"> definition</span></>}
        language="java"
        code={`@Retention(RetentionPolicy.RUNTIME)   // available via reflection
@Target(ElementType.METHOD)
public @interface Cacheable {
    String key() default "";
    int ttlSeconds() default 300;
}

@Cacheable(key = "users", ttlSeconds = 600)
public List<User> getUsers() { /* ... */ }`}
        caption={<>RUNTIME retention is required if anything reads the annotation via reflection — <code>CLASS</code> (the default) is invisible at runtime.</>}
      />

      <PosterCard
        glyph="Lo"
        title={<>Lombok<span className="dim"> @Data / @Builder</span></>}
        language="java"
        code={`@Data @Builder
@NoArgsConstructor @AllArgsConstructor
public class UserDto {
    private Long id;
    private String name;
}

UserDto u = UserDto.builder().id(1L).name("Alice").build();`}
        caption="Generates getters/setters/equals/hashCode/toString/builder at compile time. Avoid @Data on JPA @Entity classes — equals/hashCode over lazy-loaded fields can trigger unwanted fetches."
      />

      <PosterQuickRef
        title="Which modern syntax do I need?"
        rows={[
          { need: 'Immutable data carrier', answer: 'record' },
          { need: 'Closed type hierarchy', answer: 'sealed interface/class + permits' },
          { need: 'Type-safe branch on a value', answer: 'switch pattern matching' },
          { need: 'Deconstruct nested records', answer: 'record patterns' },
          { need: 'Cast after a type check', answer: 'instanceof pattern (Java 16+)' },
          { need: 'Multi-line string literal', answer: 'text block """ """' },
          { need: 'Infer a local variable type', answer: 'var' },
          { need: 'Auto-close a resource', answer: 'try-with-resources' },
          { need: 'Catch bad @Override signatures', answer: '@Override' },
          { need: 'Boilerplate getters/setters/builder', answer: 'Lombok @Data / @Builder' },
        ]}
      />
    </PosterLayout>
  );
}
