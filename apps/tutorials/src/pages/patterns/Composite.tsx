import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Composite() {
  return (
    <LessonLayout
      title="Composite & Facade Patterns"
      sectionId="patterns"
      lessonIndex={5}
      prev={{ path: '/patterns/builder', label: 'Builder & Prototype' }}
      next={{ path: '/patterns/proxy', label: 'Proxy & Chain of Responsibility' }}
    >
      <h2>Composite Pattern</h2>
      <p>
        Composes objects into tree structures to represent part-whole hierarchies.
        Composite lets clients treat individual objects and compositions uniformly.
        Think: file systems, UI component trees, org charts, menu structures.
      </p>

      <FlowChart
        title="Composite Pattern - File System Example"
        chart={"graph TD\n  A[Component] --> B[Leaf: File]\n  A --> C[Composite: Directory]\n  C --> D[File A]\n  C --> E[File B]\n  C --> F[Subdirectory]\n  F --> G[File C]\n  F --> H[File D]"}
      />

      <CodeBlock language="java" title="Composite - File System with Size Calculation" showLineNumbers={true}>
{`// Component interface - uniform treatment of files and directories
public interface FileSystemNode {
    String getName();
    long getSize();
    void print(String indent);
}

// Leaf - a single file
public class File implements FileSystemNode {
    private final String name;
    private final long size;

    public File(String name, long size) {
        this.name = name;
        this.size = size;
    }

    @Override
    public String getName() { return name; }

    @Override
    public long getSize() { return size; }

    @Override
    public void print(String indent) {
        System.out.printf("%s📄 %s (%d bytes)%n", indent, name, size);
    }
}

// Composite - a directory containing other nodes
public class Directory implements FileSystemNode {
    private final String name;
    private final List<FileSystemNode> children = new ArrayList<>();

    public Directory(String name) {
        this.name = name;
    }

    public void add(FileSystemNode node) {
        children.add(node);
    }

    public void remove(FileSystemNode node) {
        children.remove(node);
    }

    @Override
    public String getName() { return name; }

    @Override
    public long getSize() {
        // Recursively sum all children's sizes
        return children.stream()
            .mapToLong(FileSystemNode::getSize)
            .sum();
    }

    @Override
    public void print(String indent) {
        System.out.printf("%s📁 %s/ (%d bytes total)%n", indent, name, getSize());
        children.forEach(child -> child.print(indent + "  "));
    }
}

// Usage - client doesn't care if it's a file or directory
Directory root = new Directory("project");
root.add(new File("README.md", 2048));
root.add(new File("pom.xml", 4096));

Directory src = new Directory("src");
src.add(new File("Main.java", 1024));
src.add(new File("Service.java", 3072));
root.add(src);

// Works uniformly on any node
System.out.println("Total size: " + root.getSize()); // Recursively calculates
root.print("");  // Recursively prints tree`}
      </CodeBlock>

      <InfoBox variant="info" title="Composite in Enterprise Java">
        You'll see Composite everywhere: Spring Security's filter chains, menu/navigation systems,
        permission hierarchies (a Role contains Permissions AND other Roles), bill-of-materials
        structures, and organizational hierarchies.
      </InfoBox>

      <h2>Facade Pattern</h2>
      <p>
        Provides a unified, simplified interface to a set of interfaces in a subsystem.
        Facade defines a higher-level interface that makes the subsystem easier to use.
        It doesn't hide the subsystem — clients can still use it directly if needed.
      </p>

      <FlowChart
        title="Facade Pattern Structure"
        chart={"graph TD\n  A[Client] --> B[Facade]\n  B --> C[Subsystem A]\n  B --> D[Subsystem B]\n  B --> E[Subsystem C]\n  B --> F[Subsystem D]"}
      />

      <CodeBlock language="java" title="Facade - Order Processing System" showLineNumbers={true}>
{`// Complex subsystems
public class InventoryService {
    public boolean checkStock(String sku, int qty) { /* ... */ }
    public void reserveStock(String sku, int qty) { /* ... */ }
    public void releaseStock(String sku, int qty) { /* ... */ }
}

public class PaymentService {
    public PaymentAuth authorize(String cardToken, BigDecimal amount) { /* ... */ }
    public void capture(String authId) { /* ... */ }
    public void voidAuth(String authId) { /* ... */ }
}

public class ShippingService {
    public ShippingRate calculateRate(Address from, Address to, double weight) { /* ... */ }
    public String createLabel(Order order, ShippingRate rate) { /* ... */ }
}

public class NotificationService {
    public void sendOrderConfirmation(String email, Order order) { /* ... */ }
    public void sendShippingUpdate(String email, String tracking) { /* ... */ }
}

// Facade - simplifies the complex multi-step process
@Service
public class OrderFacade {
    private final InventoryService inventory;
    private final PaymentService payment;
    private final ShippingService shipping;
    private final NotificationService notifications;
    private final OrderRepository orderRepo;

    public OrderFacade(InventoryService inventory, PaymentService payment,
                      ShippingService shipping, NotificationService notifications,
                      OrderRepository orderRepo) {
        this.inventory = inventory;
        this.payment = payment;
        this.shipping = shipping;
        this.notifications = notifications;
        this.orderRepo = orderRepo;
    }

    // One method hides 6+ subsystem interactions
    @Transactional
    public OrderResult placeOrder(OrderRequest request) {
        // 1. Check inventory
        for (LineItem item : request.getItems()) {
            if (!inventory.checkStock(item.getSku(), item.getQty())) {
                return OrderResult.outOfStock(item.getSku());
            }
        }

        // 2. Reserve inventory
        request.getItems().forEach(item ->
            inventory.reserveStock(item.getSku(), item.getQty()));

        // 3. Authorize payment
        PaymentAuth auth = payment.authorize(
            request.getCardToken(), request.getTotal());
        if (!auth.isApproved()) {
            request.getItems().forEach(item ->
                inventory.releaseStock(item.getSku(), item.getQty()));
            return OrderResult.paymentDeclined(auth.getReason());
        }

        // 4. Create order
        Order order = orderRepo.save(Order.from(request, auth));

        // 5. Capture payment
        payment.capture(auth.getId());

        // 6. Send confirmation
        notifications.sendOrderConfirmation(request.getEmail(), order);

        return OrderResult.success(order);
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Facade vs Service Layer">
        In Spring Boot applications, your @Service classes often act as facades. The Controller
        calls one service method, which orchestrates multiple repositories and other services.
        This is the Facade pattern applied at the architectural level.
      </InfoBox>

      <InteractiveChallenge
        question="In the Composite pattern, what makes it possible to call getSize() on both a File and a Directory?"
        options={[
          "Directory inherits from File",
          "Both implement the same FileSystemNode interface",
          "Java's dynamic dispatch automatically handles both cases",
          "The Visitor pattern is used internally"
        ]}
        correctIndex={1}
        explanation="The key to Composite is the shared Component interface (FileSystemNode). Both leaves (File) and composites (Directory) implement it, so clients can call getSize() without knowing whether they're dealing with a single file or an entire directory tree."
      />
    </LessonLayout>
  );
}
