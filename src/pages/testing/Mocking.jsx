import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TestingMocking() {
  return (
    <LessonLayout
      title="Mocking"
      sectionId="testing"
      lessonIndex={2}
      prev={{ path: '/testing/unit', label: 'Unit Testing' }}
      next={{ path: '/testing/integration', label: 'Integration Testing' }}
    >
      <h2>Test Doubles — The Full Vocabulary</h2>
      <p>
        A test double is any object that stands in for a real dependency in a test. The term
        "mock" is often used loosely to mean any test double, but there are five distinct types,
        each with a different purpose. Understanding which to use makes tests cleaner, faster,
        and more intentional.
      </p>

      <FlowChart
        title="Test Double Types"
        chart={"graph TD\n  A[Test Doubles] --> B[Dummy - passed but never used]\n  A --> C[Stub - returns hardcoded values]\n  A --> D[Fake - working implementation]\n  A --> E[Spy - records calls to real object]\n  A --> F[Mock - stub plus verification]"}
      />

      <CodeBlock language="java" title="The Five Test Double Types">
{`// ── DUMMY ──────────────────────────────────────────────────────────
// Passed to satisfy a parameter — never actually used
UserProfile dummyProfile = new UserProfile(); // not used in this test
emailService.send("alice@example.com", "Subject", "Body", dummyProfile);

// ── STUB ────────────────────────────────────────────────────────────
// Returns hardcoded/pre-programmed values; no verification
// Use when: you need a dependency to return specific values
public class StubOrderRepository implements OrderRepository {
    @Override
    public Optional<Order> findById(String id) {
        if ("O-1".equals(id)) return Optional.of(new Order("O-1", 100.0));
        return Optional.empty();
    }
    // All other methods throw UnsupportedOperationException
}

// ── FAKE ────────────────────────────────────────────────────────────
// Working implementation, simpler than production
// Fake DB = in-memory map; Fake SMTP = captures emails in a list
public class FakeUserRepository implements UserRepository {
    private final Map<Long, User> store = new HashMap<>();
    private long nextId = 1;

    @Override public User save(User user) {
        user.setId(nextId++);
        store.put(user.getId(), user);
        return user;
    }
    @Override public Optional<User> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }
    @Override public List<User> findAll() { return new ArrayList<>(store.values()); }
}
// Much more powerful than a Mockito mock for complex interactions

// ── SPY ─────────────────────────────────────────────────────────────
// Wraps a real object; records calls and can override specific methods
@Spy EmailService emailService = new EmailService(realMailSender);
// Calls real send() unless explicitly stubbed:
doReturn(true).when(emailService).send(eq("blocked@spam.com"), any(), any());

// ── MOCK ────────────────────────────────────────────────────────────
// Stub + built-in verification of interactions
// Created by Mockito — most common in Java unit tests
@Mock OrderRepository orderRepo;
when(orderRepo.findById("O-1")).thenReturn(Optional.of(order));
orderService.process("O-1");
verify(orderRepo).findById("O-1");  // assert the interaction happened`}
      </CodeBlock>

      <h2>Mockito Complete Reference</h2>

      <CodeBlock language="java" title="Stubbing — Controlling Return Values">
{`@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock PaymentGateway gateway;
    @Mock AuditLogger audit;
    @Captor ArgumentCaptor<PaymentRequest> requestCaptor;
    @InjectMocks PaymentService service;

    // ── BASIC STUBBING ───────────────────────────────────────────────
    @Test void basic_stubbing() {
        // Return a value
        when(gateway.charge(any(), any())).thenReturn(new Receipt("R-1", 100.0));

        // Return different values on successive calls
        when(gateway.isAvailable())
            .thenReturn(false)     // first call
            .thenReturn(true)      // second call
            .thenReturn(true);     // all subsequent calls

        // Throw an exception
        when(gateway.charge(eq("BAD_CARD"), any()))
            .thenThrow(new PaymentDeclinedException("Insufficient funds"));

        // Return based on argument value (custom matcher)
        when(gateway.charge(anyString(), argThat(amount -> amount.compareTo(BigDecimal.ZERO) < 0)))
            .thenThrow(new IllegalArgumentException("Amount must be positive"));
    }

    // ── STUBBING VOID METHODS ─────────────────────────────────────────
    @Test void void_method_stubbing() {
        // Do nothing (default for void mocks, but explicit is clearer)
        doNothing().when(audit).log(any());

        // Throw from void method
        doThrow(new AuditException("Audit system down"))
            .when(audit).log(argThat(e -> e.contains("FAILED")));
    }

    // ── ARGUMENT CAPTORS ──────────────────────────────────────────────
    @Test void capture_what_was_sent_to_gateway() {
        when(gateway.charge(any(), any())).thenReturn(new Receipt("R-1", 99.0));

        service.processOrder("ORDER-42");

        // Capture the actual argument passed to the mock
        verify(gateway).charge(requestCaptor.capture(), any());
        PaymentRequest captured = requestCaptor.getValue();

        assertThat(captured.getOrderId()).isEqualTo("ORDER-42");
        assertThat(captured.getAmount()).isEqualByComparingTo(new BigDecimal("99.00"));
        assertThat(captured.getCurrency()).isEqualTo("USD");
    }
}`}
      </CodeBlock>

      <CodeBlock language="java" title="Verification — Asserting Interactions">
{`// ── VERIFY CALL COUNT ─────────────────────────────────────────────
verify(gateway).charge(any(), any());           // exactly once (default)
verify(gateway, times(1)).charge(any(), any()); // explicitly once
verify(gateway, times(3)).retry(any());         // exactly 3 times
verify(gateway, never()).refund(any());         // never called
verify(gateway, atLeast(1)).charge(any(), any()); // at least once
verify(gateway, atMost(2)).charge(any(), any());  // at most twice

// ── VERIFY ORDER OF CALLS ─────────────────────────────────────────
InOrder inOrder = inOrder(gateway, audit);
inOrder.verify(gateway).charge(any(), any());  // gateway first
inOrder.verify(audit).log(any());              // audit second

// ── VERIFY NO UNEXPECTED INTERACTIONS ────────────────────────────
verifyNoMoreInteractions(gateway, audit);  // fail if extra calls exist
verifyNoInteractions(audit);              // fail if audit was called at all

// ── ARGUMENT MATCHERS ─────────────────────────────────────────────
// If ANY argument uses a matcher, ALL must use matchers
verify(gateway).charge(
    eq("card-token-123"),       // exact value
    any(BigDecimal.class),      // any BigDecimal
    argThat(req ->              // custom predicate
        req.getCurrency().equals("USD") && req.getAmount().compareTo(BigDecimal.ZERO) > 0
    )
);

// ── AVOID OVER-VERIFICATION ───────────────────────────────────────
// ✗ Don't verify every single method call — tests become fragile
verify(repo).save(any());
verify(repo).flush();        // do you really care about flush?
verify(cache).evict(any());  // this makes refactoring painful

// ✓ Verify the outcomes that matter for THIS test
verify(gateway).charge(any(), any());  // the payment was attempted
// Let the assertion on the return value verify the rest`}
      </CodeBlock>

      <h2>Mocking in JavaScript — Vitest / Jest</h2>

      <CodeBlock language="javascript" title="vi.fn() and Module Mocking">
{`import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OrderService } from './OrderService';
import * as emailModule from './emailService';

// ── FUNCTION MOCKS ────────────────────────────────────────────────
describe('OrderService', () => {
  let mockPaymentGateway;
  let service;

  beforeEach(() => {
    // Create a mock object with vi.fn() methods
    mockPaymentGateway = {
      charge: vi.fn().mockResolvedValue({ transactionId: 'TXN-1', status: 'success' }),
      refund: vi.fn().mockResolvedValue({ status: 'refunded' }),
      isAvailable: vi.fn().mockReturnValue(true),
    };
    service = new OrderService({ paymentGateway: mockPaymentGateway });
  });

  it('charges the correct amount', async () => {
    await service.processOrder({ id: 'O-1', total: 99.99 });

    expect(mockPaymentGateway.charge).toHaveBeenCalledOnce();
    expect(mockPaymentGateway.charge).toHaveBeenCalledWith({
      amount: 99.99,
      currency: 'USD',
      orderId: 'O-1',
    });
  });

  it('retries on transient failure', async () => {
    mockPaymentGateway.charge
      .mockRejectedValueOnce(new Error('Network timeout'))  // first call fails
      .mockResolvedValue({ transactionId: 'TXN-1' });       // second succeeds

    await service.processOrder({ id: 'O-1', total: 99.99 });
    expect(mockPaymentGateway.charge).toHaveBeenCalledTimes(2);
  });
});

// ── MODULE MOCKING ────────────────────────────────────────────────
// Mock an entire module — replaces it for the entire test file
vi.mock('./emailService', () => ({
  sendEmail: vi.fn().mockResolvedValue({ messageId: 'msg-123' }),
  sendBatch: vi.fn().mockResolvedValue({ count: 0 }),
}));

it('sends confirmation email after successful order', async () => {
  await service.processOrder({ id: 'O-1', total: 99.99, email: 'alice@example.com' });

  expect(emailModule.sendEmail).toHaveBeenCalledWith({
    to: 'alice@example.com',
    subject: expect.stringContaining('Order'),
    body: expect.stringContaining('O-1'),
  });
});

// ── SPY ON EXISTING MODULE ────────────────────────────────────────
const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
// ... trigger error condition ...
expect(spy).toHaveBeenCalledWith(expect.stringContaining('Payment failed'));
spy.mockRestore(); // restore original console.error`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Over-Mocking Trap">
        <p>
          Mocking everything makes tests pass even when the code is wrong. Classic mistakes:
          (1) mocking the class under test — you are now testing the mock, not your code;
          (2) mocking value objects like strings or simple data classes — just use real ones;
          (3) verifying internal implementation details — tests break on every refactor.
          Mock at the boundary: mock external services, databases, email, HTTP calls. Let
          business logic run with real collaborators or fakes.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between verify() and when() in Mockito?"
        options={[
          "when() sets up return values before the code runs; verify() asserts interactions happened after the code runs",
          "verify() is faster than when() at runtime",
          "when() works only on void methods; verify() works only on methods with return values",
          "They are interchangeable — use whichever is more readable"
        ]}
        correctIndex={0}
        explanation="when().thenReturn() is test setup — it configures what a mock returns when called with specific arguments. It runs before the code under test. verify() is assertion — it checks after the fact that the mock was called with specific arguments a specific number of times. Confusing the two is a common mistake: you cannot use verify() to set up behavior, and when() does not check whether a method was called."
      />

      <InteractiveChallenge
        question="When should you use a Fake instead of a Mockito Mock for a repository dependency?"
        options={[
          "Never — Mockito mocks are always preferable to hand-written fakes",
          "When multiple tests need to interact through the repository — a fake remembers saved data, a mock does not",
          "Fakes are only appropriate in integration tests, not unit tests",
          "When the Mockito version does not support the repository interface"
        ]}
        correctIndex={1}
        explanation="A Mockito mock is stateless — when(repo.save(user)).thenReturn(user) does not remember that the user was saved. A subsequent findById call would return empty. A fake (in-memory Map implementation) provides real save/find behavior. If your tests involve sequences like 'save, then findAll, then delete', a fake makes them natural and readable. Use Mockito mocks when you want to control exactly what is returned and verify interactions; use fakes when real data flow between methods matters."
      />
    </LessonLayout>
  );
}
