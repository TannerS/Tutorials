import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function PatternsComposite() {
  return (
    <LessonLayout
      title="Composite Pattern"
      sectionId="patterns"
      lessonIndex={5}
      prev={{ path: "/patterns/builder", label: "Builder Pattern" }}
      next={{ path: "/patterns/proxy", label: "Proxy Pattern" }}
    >
      <p>The Composite pattern lets you compose objects into tree structures to represent part-whole hierarchies. It lets clients treat individual objects (leaves) and compositions of objects (composites) uniformly through a shared interface.</p>

      <h2>File System Example</h2>

      <CodeBlock language="java" title="Composite — File System Tree">
{`// Component interface — both File and Directory implement this
public interface FileSystemEntry {
    String getName();
    long getSize();
    void print(String indent);
}

// Leaf — no children
public class File implements FileSystemEntry {
    private final String name;
    private final long size;

    public File(String name, long size) { this.name = name; this.size = size; }
    public String getName() { return name; }
    public long getSize()   { return size; }
    public void print(String indent) {
        System.out.printf("%s📄 %s (%d bytes)%n", indent, name, size);
    }
}

// Composite — has children (can be Files or other Directories)
public class Directory implements FileSystemEntry {
    private final String name;
    private final List<FileSystemEntry> children = new ArrayList<>();

    public Directory(String name) { this.name = name; }
    public void add(FileSystemEntry entry) { children.add(entry); }

    public String getName() { return name; }
    public long getSize()   { return children.stream().mapToLong(FileSystemEntry::getSize).sum(); }
    public void print(String indent) {
        System.out.printf("%s📁 %s (%d bytes)%n", indent, name, getSize());
        children.forEach(c -> c.print(indent + "  "));
    }
}

// Usage — client treats files and directories identically
Directory root = new Directory("root");
Directory src  = new Directory("src");
src.add(new File("Main.java",   2048));
src.add(new File("Config.java", 1024));
Directory test = new Directory("test");
test.add(new File("MainTest.java", 3072));
root.add(src);
root.add(test);
root.add(new File("README.md", 512));

root.print("");
// 📁 root (6656 bytes)
//   📁 src (3072 bytes)
//     📄 Main.java (2048 bytes)
//     📄 Config.java (1024 bytes)
//   📁 test (3072 bytes)
//     📄 MainTest.java (3072 bytes)
//   📄 README.md (512 bytes)
System.out.println("Total: " + root.getSize()); // 6656`}
      </CodeBlock>

      <FlowChart
        title="Composite Tree Structure"
        chart={"graph TD\n  A[Component Interface] --> B[Leaf]\n  A --> C[Composite]\n  C --> D[Leaf 1]\n  C --> E[Leaf 2]\n  C --> F[Composite 2]\n  F --> G[Leaf 3]\n  F --> H[Leaf 4]"}
      />

      <h2>Menu System with Composite</h2>

      <CodeBlock language="java" title="UI Menu Tree">
{`public interface MenuComponent {
    String getName();
    void render(int depth);
    boolean isEnabled();
}

// Leaf — a clickable menu item
public class MenuItem implements MenuComponent {
    private final String name;
    private final Runnable action;
    private boolean enabled;

    public MenuItem(String name, Runnable action) {
        this.name = name; this.action = action; this.enabled = true;
    }
    public String getName()    { return name; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean e) { this.enabled = e; }
    public void render(int depth) {
        String indent = "  ".repeat(depth);
        System.out.printf("%s%s [item]%s%n", indent, name, enabled ? "" : " (disabled)");
    }
    public void execute() { if (enabled) action.run(); }
}

// Composite — a submenu
public class Menu implements MenuComponent {
    private final String name;
    private final List<MenuComponent> children = new ArrayList<>();

    public Menu(String name) { this.name = name; }
    public void add(MenuComponent c) { children.add(c); }
    public String getName()    { return name; }
    public boolean isEnabled() { return children.stream().anyMatch(MenuComponent::isEnabled); }
    public void render(int depth) {
        System.out.printf("%s%s [menu]%n", "  ".repeat(depth), name);
        children.forEach(c -> c.render(depth + 1));
    }
}

// Build a menu tree
Menu menuBar = new Menu("Menu Bar");
Menu fileMenu = new Menu("File");
fileMenu.add(new MenuItem("New",  () -> System.out.println("New file")));
fileMenu.add(new MenuItem("Open", () -> System.out.println("Open")));
fileMenu.add(new MenuItem("Save", () -> System.out.println("Saved")));
Menu editMenu = new Menu("Edit");
editMenu.add(new MenuItem("Cut",   () -> System.out.println("Cut")));
editMenu.add(new MenuItem("Copy",  () -> System.out.println("Copy")));
editMenu.add(new MenuItem("Paste", () -> System.out.println("Paste")));
menuBar.add(fileMenu);
menuBar.add(editMenu);
menuBar.render(0);`}
      </CodeBlock>

      <InfoBox variant="note" title="When to Use Composite">
        <p>Use Composite when your domain naturally forms a tree: file systems, org charts, UI component hierarchies, bills of materials, parse trees, category trees. The pattern shines when client code must treat single items and groups identically — e.g., calculating total cost whether it's one item or a bundle of bundles.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the key characteristic of the Composite pattern?"
        options={["Ensures a class has only one instance", "Treats individual objects and compositions uniformly via a shared interface", "Adds behavior to objects dynamically at runtime", "Converts an interface to another interface"]}
        correctIndex={1}
        explanation="Composite allows clients to treat leaves (individual objects) and composites (groups of objects) identically through a shared Component interface. This uniformity means you can write code that works on a single file or an entire directory tree without knowing the difference."
      />

    </LessonLayout>
  );
}
