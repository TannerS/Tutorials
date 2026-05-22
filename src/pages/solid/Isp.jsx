import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SolidIsp() {
  return (
    <LessonLayout
      title="Interface Segregation Principle"
      sectionId="solid"
      lessonIndex={4}
      prev={{ path: '/solid/lsp', label: 'Liskov Substitution' }}
      next={{ path: '/solid/dip', label: 'Dependency Inversion' }}
    >
      <h2>What Is ISP?</h2>
      <p>
        The Interface Segregation Principle: <em>clients should not be forced to depend on methods
        they do not use.</em> A "fat" interface with 20 methods forces every implementor to
        implement all 20 — even the 15 that are irrelevant to them. ISP says to split large
        interfaces into small, cohesive ones so each client depends only on the methods it
        actually uses.
      </p>

      <FlowChart
        title="ISP — Focused Interfaces"
        chart={"graph TD\n  A[Fat Worker interface - 6 methods] --> B[Robot forced to throw on eat/sleep]\n  A --> C[Human implements all]\n  D[Workable interface] --> E[Robot implements]\n  D --> F[Human implements]\n  G[Feedable interface] --> F\n  H[Payable interface] --> F"}
      />

      <h2>Fat Interface — The Classic ISP Violation</h2>

      <CodeBlock language="java" title="One Big Interface Forces Useless Implementations">
{`// FAT interface — every implementor must deal with ALL methods
public interface Worker {
    void work();
    void eat();
    void sleep();
    void takeBreak();
    void receivePaycheck();
    void attendMeeting();
}

// HumanWorker — all methods are relevant
public class HumanWorker implements Worker {
    @Override public void work()      { /* genuine implementation */ }
    @Override public void eat()       { /* genuine implementation */ }
    @Override public void sleep()     { /* genuine implementation */ }
    @Override public void takeBreak() { /* genuine implementation */ }
    @Override public void receivePaycheck() { /* genuine implementation */ }
    @Override public void attendMeeting()   { /* genuine implementation */ }
}

// ✗ RobotWorker — forced to implement irrelevant methods
public class RobotWorker implements Worker {
    @Override public void work()      { System.out.println("Processing..."); }

    // Robots don't eat, sleep, or get paychecks — forced stubs:
    @Override public void eat()             { throw new UnsupportedOperationException(); }
    @Override public void sleep()           { throw new UnsupportedOperationException(); }
    @Override public void receivePaycheck() { /* do nothing — robots don't earn */ }
    @Override public void attendMeeting()   { /* questionable meaning */ }
    @Override public void takeBreak()       { /* maintenance window? */ }
}
// Problems:
// 1. RobotWorker violates LSP — throws where parent says it should work
// 2. Code that calls worker.eat() must handle runtime exceptions for robots
// 3. Any change to any Worker method (even receivePaycheck) forces
//    all implementors to recompile — even those who don't use it
// 4. Test setup must mock/stub irrelevant methods`}
      </CodeBlock>

      <h2>ISP Applied — Segregated Interfaces</h2>

      <CodeBlock language="java" title="Small Focused Interfaces — Each Client Gets What It Needs">
{`// Split into focused, single-purpose interfaces
public interface Workable {
    void work();
}

public interface Restable {
    void takeBreak();
}

public interface Feedable {
    void eat();
    void sleep();
}

public interface Payable {
    void receivePaycheck();
    Money calculateGrossPay(int hoursWorked);
}

public interface MeetingAttendee {
    void attendMeeting(MeetingType type);
    boolean isAvailable(TimeSlot slot);
}

// HumanWorker — implements all interfaces that apply
public class HumanWorker implements Workable, Restable, Feedable, Payable, MeetingAttendee {
    // All implementations are meaningful and correct
}

// RobotWorker — only implements what it actually does
public class RobotWorker implements Workable, Restable {
    @Override public void work()      { processingEngine.run(); }
    @Override public void takeBreak() { maintenanceMode.activate(); }
    // No Feedable, no Payable — no need to stub anything!
}

// ContractorWorker — different combination of interfaces
public class ContractorWorker implements Workable, Payable {
    // Contractors work and get paid, but on different terms
    // No Feedable (they provide their own breaks), no MeetingAttendee (async only)
}

// Client code depends only on what it actually uses
public class WorkScheduler {
    private final List<Workable> workers;  // accepts humans AND robots — just needs work()

    public void runShift() {
        workers.forEach(Workable::work);
    }
}

public class PayrollService {
    private final List<Payable> employees;  // only those who can receive pay

    public void processPayroll() {
        employees.forEach(e -> e.receivePaycheck());
    }
}
// WorkScheduler doesn't know or care about pay
// PayrollService doesn't know or care about work scheduling`}
      </CodeBlock>

      <h2>ISP in Spring Data Repositories</h2>

      <CodeBlock language="java" title="Spring Data — ISP in the Standard Library">
{`// Spring Data demonstrates ISP by layering interfaces
// Each layer adds methods — extend only what you need

// Layer 1: Read-only — just exists check and count
public interface Repository<T, ID> { /* marker interface */ }

// Layer 2: Basic CRUD
public interface CrudRepository<T, ID> extends Repository<T, ID> {
    <S extends T> S save(S entity);
    Optional<T> findById(ID id);
    boolean existsById(ID id);
    Iterable<T> findAll();
    long count();
    void deleteById(ID id);
}

// Layer 3: Sorting and paging
public interface PagingAndSortingRepository<T, ID> extends CrudRepository<T, ID> {
    Iterable<T> findAll(Sort sort);
    Page<T> findAll(Pageable pageable);
}

// Layer 4: JPA-specific (flush, batch save, etc.)
public interface JpaRepository<T, ID> extends PagingAndSortingRepository<T, ID> {
    void flush();
    <S extends T> List<S> saveAllAndFlush(Iterable<S> entities);
    void deleteAllInBatch();
    List<T> findAll(Example<S> example);
}

// You extend only the level you need:
// Read-only cache access:
public interface ProductCacheRepository extends CrudRepository<Product, Long> {
    // Add custom query methods — no write methods forced by caller
}

// Full JPA repository for complex queries:
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerIdAndStatusOrderByCreatedAtDesc(
        Long customerId, OrderStatus status
    );
    @Query("SELECT o FROM Order o WHERE o.total > :threshold")
    List<Order> findHighValueOrders(@Param("threshold") BigDecimal threshold);
}

// ISP benefit: code that just reads products depends on CrudRepository,
// not JpaRepository — insulated from JPA-specific changes`}
      </CodeBlock>

      <h2>ISP in TypeScript — React Prop Interfaces</h2>

      <CodeBlock language="typescript" title="ISP Applied to React Component Props">
{`// ✗ FAT props interface — every component sees everything
interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  stock: number;
  rating: number;
  reviewCount: number;
  onAddToCart: (id: string) => void;
  onAddToWishlist: (id: string) => void;
  onQuickView: (id: string) => void;
  onShare: (id: string) => void;
  isInWishlist: boolean;
  isInCart: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  onDelete: (id: string) => void;    // admin-only!
  onEdit: (id: string) => void;      // admin-only!
}
// Every usage needs to handle 16 props; admin logic leaks into public component

// ✓ SEGREGATED interfaces — compose what you need
interface ProductDisplayProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

interface ProductActionsProps {
  onAddToCart: (id: string) => void;
  isInCart: boolean;
}

interface WishlistActionsProps {
  onAddToWishlist: (id: string) => void;
  isInWishlist: boolean;
}

interface AdminActionsProps {
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

// Regular product card — depends only on what it uses
type PublicProductCardProps = ProductDisplayProps & ProductActionsProps & WishlistActionsProps;
function ProductCard(props: PublicProductCardProps) { /* ... */ }

// Admin product card — extends with admin actions
type AdminProductCardProps = PublicProductCardProps & AdminActionsProps;
function AdminProductCard(props: AdminProductCardProps) { /* ... */ }

// Usage — TypeScript enforces correct shape, no extraneous props
<ProductCard
  id="P-1" name="Widget" price={29.99} imageUrl="/widget.jpg"
  onAddToCart={handleAdd} isInCart={false}
  onAddToWishlist={handleWishlist} isInWishlist={true}
/>`}
      </CodeBlock>

      <InfoBox variant="tip" title="ISP and Spring Repositories">
        <p>
          Spring Data is a textbook ISP example in the standard library.
          <code>Repository</code> is a marker. <code>CrudRepository</code> adds basic operations.
          <code>PagingAndSortingRepository</code> adds paging. <code>JpaRepository</code> adds
          JPA specifics. Your repository extends the level that matches your needs — a read-only
          cache extends <code>CrudRepository</code>, a full data store extends
          <code>JpaRepository</code>. Clients depend only on the interface level they use, not
          on the full JPA surface area.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the main problem with a fat interface that forces implementors to stub unused methods?"
        options={[
          "Fat interfaces are harder to name with a good class name",
          "Implementors are forced to write misleading empty or throwing implementations for methods they don't support — and any change to any method forces all implementors to recompile",
          "Fat interfaces use significantly more memory at runtime",
          "Fat interfaces automatically violate the Single Responsibility Principle in all cases"
        ]}
        correctIndex={1}
        explanation="A fat interface forces every implementor to deal with every method, even irrelevant ones. This leads to throw-not-implemented stubs (which violate LSP) or empty no-op implementations (which mislead callers). It also creates unnecessary coupling: a client that only uses two methods still depends on the full interface, meaning changes to any of the other methods force recompilation and re-testing of that client."
      />

      <InteractiveChallenge
        question="How does the Spring Data repository hierarchy demonstrate the Interface Segregation Principle?"
        options={[
          "It does not — Spring Data uses a single large repository interface",
          "Each layer adds methods to a smaller base, so code extends only the layer with the methods it actually needs",
          "Spring Data generates separate interfaces for each entity automatically",
          "ISP only applies to application code, not framework code like Spring"
        ]}
        correctIndex={1}
        explanation="Spring Data layers interfaces: Repository (marker), CrudRepository (basic save/find/delete), PagingAndSortingRepository (adds pagination), JpaRepository (JPA-specific like flush and batch). You extend the level that matches your needs. A read-only service repository can extend CrudRepository without gaining JPA-specific methods it doesn't need. Clients depend only on the interface level that matches their usage — exactly what ISP prescribes."
      />
    </LessonLayout>
  );
}
