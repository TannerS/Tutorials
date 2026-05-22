import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TestingBest() {
  return (
    <LessonLayout
      title="Testing Best Practices"
      sectionId="testing"
      lessonIndex={5}
      prev={{ path: "/testing/e2e", label: "End-to-End Testing" }}
      next={{ path: "/devops/git", label: "Git Workflow" }}
    >
      <p>Testing best practices that distinguish test suites developers trust and maintain from ones they dread and ignore.</p>
      <CodeBlock language="java" title="Test Quality Checklist">
{`// ✓ One assertion concept per test (can have multiple assertThat lines)
@Test void new_order_has_pending_status_and_zero_total() {
    Order order = Order.create("customer-1");
    assertThat(order.getStatus()).isEqualTo(PENDING);
    assertThat(order.getTotal()).isZero();
    // These two are ONE concept: "new order state"
}

// ✓ Descriptive test names — reads like a specification
// BAD:  @Test void test1() / @Test void testOrder()
// GOOD: @Test void should_throw_when_order_has_no_items()
//       @Test void should_calculate_total_including_tax()
//       @Test void given_vip_customer_when_pricing_then_applies_15_percent_discount()

// ✓ Test behavior, not implementation
// BAD: verifies private method was called
// GOOD: verifies the observable outcome (return value, state, side effect)

// ✓ Builder pattern for test data
Order order = OrderBuilder.anOrder()
    .withCustomer("vip-customer")
    .withItem("BOOK", 1, 29.99)
    .withItem("PEN", 3, 4.99)
    .shipped()
    .build();

// ✓ @BeforeEach for repeated setup, not global state
@BeforeEach void setUp() {
    orderService = new OrderService(mockRepo, mockPricing);
    // DON'T: share mutable state between tests (causes flakiness)
}

// ✓ Test the unhappy path too
@Test void should_handle_payment_service_timeout() {
    when(paymentService.charge(any())).thenThrow(new TimeoutException("timeout"));
    assertThatThrownBy(() -> orderService.placeOrder(req))
        .isInstanceOf(ServiceUnavailableException.class);
    verify(orderRepo, never()).save(any()); // order not saved on payment failure
}`}
      </CodeBlock>
      <FlowChart title="Test Quality Pyramid" chart={"graph TD\n  A[What makes tests valuable?] --> B[Fast]\n  A --> C[Reliable]\n  A --> D[Readable]\n  A --> E[Isolated]\n  B --> F[Milliseconds per unit test]\n  C --> G[No flakiness - deterministic]\n  D --> H[Test name documents intent]\n  E --> I[No shared state between tests]"} />
      <InfoBox variant="warning" title="Test Debt">
        <p>Slow, flaky, or incomprehensible tests are technical debt. Teams start ignoring the test suite, then disabling failures, then deleting tests. Invest in test quality: delete tests that test nothing, fix flaky tests immediately (don't mark as ignored), and refactor tests when they're hard to read.</p>
      </InfoBox>
      <InteractiveChallenge
        question="What does 'testing behavior, not implementation' mean?"
        options={["Only test public methods, not private ones", "Assert on observable outcomes (return values, state changes, side effects) rather than which internal methods were called", "Only test with black-box techniques", "Avoid using mocks entirely"]}
        correctIndex={1}
        explanation="Testing implementation means verifying that specific private methods were called in a specific order — these tests break when you refactor, even if behavior is correct. Testing behavior means verifying what the component does: given input X, output Y, or state changes from A to B. These tests survive refactoring."
      />

    </LessonLayout>
  );
}
