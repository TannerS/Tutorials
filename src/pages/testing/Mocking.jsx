import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Mocking() {
  return (
    <LessonLayout
      title="Mocking & Test Doubles"
      sectionId="testing"
      lessonIndex={2}
      prev={{ path: '/testing/unit', label: 'Unit Testing (JUnit & Jest)' }}
      next={{ path: '/testing/integration', label: 'Integration Testing' }}
    >
      <h2>Why Mock?</h2>
      <p>
        Unit tests should run in isolation. When your code depends on a database,
        an API, or another service, you replace those dependencies with test doubles
        so your test stays fast, deterministic, and focused on the unit under test.
      </p>

      <h2>Test Doubles Taxonomy</h2>
      <p>
        The term &quot;mock&quot; is often used loosely, but there are actually five distinct
        types of test doubles, each serving a different purpose.
      </p>

      <FlowChart
        title="Types of Test Doubles"
        chart={"graph TD\n  TD[\"Test Doubles\"] --> DUMMY[\"Dummy\\nPassed but never used\"]\n  TD --> STUB[\"Stub\\nReturns canned answers\"]\n  TD --> SPY[\"Spy\\nRecords calls for verification\"]\n  TD --> MOCK[\"Mock\\nPre-programmed expectations\"]\n  TD --> FAKE[\"Fake\\nWorking implementation\\n(e.g., in-memory DB)\"]"}
      />

      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Purpose</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dummy</td>
            <td>Fill a parameter list — never actually used</td>
            <td>Passing <code>null</code> for an unused logger</td>
          </tr>
          <tr>
            <td>Stub</td>
            <td>Return predetermined data</td>
            <td>A repository that always returns the same user</td>
          </tr>
          <tr>
            <td>Spy</td>
            <td>Record interactions for later verification</td>
            <td>Checking that an email service was called</td>
          </tr>
          <tr>
            <td>Mock</td>
            <td>Verify expected interactions happened</td>
            <td>Assert that <code>save()</code> was called exactly once</td>
          </tr>
          <tr>
            <td>Fake</td>
            <td>Simplified but working implementation</td>
            <td>In-memory database instead of real PostgreSQL</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="Stubs vs Mocks">
        The key distinction: <strong>stubs</strong> provide data to the system under test
        (state verification), while <strong>mocks</strong> verify that the system under test
        called the right methods (behavior verification). Both have their place.
      </InfoBox>

      <h2>Mockito — Java Mocking</h2>

      <h3>Setup</h3>
      <CodeBlock language="java" title="Maven Dependency">
{`<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.11.0</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>5.11.0</version>
    <scope>test</scope>
</dependency>`}
      </CodeBlock>

      <h3>Basic Mocking with Mockito</h3>
      <CodeBlock language="java" title="mock(), when(), verify()">
{`import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepo;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private OrderService orderService;

    @Test
    @DisplayName("should save order and send confirmation email")
    void placeOrder() {
        // Arrange — stub the repository
        Order order = new Order("ORD-001", List.of("item1"));
        when(orderRepo.save(any(Order.class))).thenReturn(order);

        // Act
        Order result = orderService.placeOrder(List.of("item1"));

        // Assert — verify behavior
        assertNotNull(result);
        assertEquals("ORD-001", result.getId());
        verify(orderRepo).save(any(Order.class));
        verify(emailService).sendConfirmation(eq("ORD-001"), anyString());
        verify(emailService, never()).sendCancellation(anyString());
    }
}`}
      </CodeBlock>

      <h3>Stubbing Patterns</h3>
      <CodeBlock language="java" title="Advanced Stubbing">
{`// Return different values on successive calls
when(mockRepo.findById("1"))
    .thenReturn(Optional.empty())    // first call
    .thenReturn(Optional.of(user));  // second call

// Throw an exception
when(mockService.process(null))
    .thenThrow(new IllegalArgumentException("Input cannot be null"));

// Use thenAnswer for dynamic responses
when(mockRepo.save(any(User.class))).thenAnswer(invocation -> {
    User user = invocation.getArgument(0);
    user.setId(UUID.randomUUID().toString());
    return user;
});`}
      </CodeBlock>

      <h3>ArgumentCaptor</h3>
      <CodeBlock language="java" title="Capturing Arguments for Verification">
{`@Test
void shouldSendFormattedEmail() {
    orderService.placeOrder(List.of("Widget", "Gadget"));

    ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
    verify(emailService).sendConfirmation(anyString(), bodyCaptor.capture());

    String emailBody = bodyCaptor.getValue();
    assertTrue(emailBody.contains("Widget"));
    assertTrue(emailBody.contains("Gadget"));
}`}
      </CodeBlock>

      <h3>Mockito BDD Style</h3>
      <CodeBlock language="java" title="BDDMockito — Given/When/Then">
{`import static org.mockito.BDDMockito.*;

@Test
@DisplayName("should return user by ID")
void findUserById() {
    // Given
    User alice = new User("1", "Alice");
    given(userRepo.findById("1")).willReturn(Optional.of(alice));

    // When
    User result = userService.getUser("1");

    // Then
    then(userRepo).should().findById("1");
    assertThat(result.getName()).isEqualTo("Alice");
}`}
      </CodeBlock>

      <h2>Jest Mocking — JavaScript</h2>

      <h3>jest.fn() — Manual Mocks</h3>
      <CodeBlock language="javascript" title="Creating Mock Functions">
{`// Simple mock function
const mockCallback = jest.fn();
mockCallback('hello');
mockCallback('world');

expect(mockCallback).toHaveBeenCalledTimes(2);
expect(mockCallback).toHaveBeenCalledWith('hello');

// Mock with return values
const mockFetch = jest.fn()
  .mockReturnValueOnce('first call')
  .mockReturnValueOnce('second call')
  .mockReturnValue('default');

// Mock with implementation
const mockCalculate = jest.fn((a, b) => a + b);
expect(mockCalculate(2, 3)).toBe(5);`}
      </CodeBlock>

      <h3>jest.mock() — Module Mocking</h3>
      <CodeBlock language="javascript" title="Mocking Entire Modules">
{`// Automatically mock all exports
jest.mock('./userService');

// Mock with custom implementation
jest.mock('./api', () => ({
  fetchUser: jest.fn().mockResolvedValue({ id: 1, name: 'Alice' }),
  fetchOrders: jest.fn().mockResolvedValue([]),
}));

// Usage in tests
import { fetchUser } from './api';

test('should display user name', async () => {
  fetchUser.mockResolvedValue({ id: 1, name: 'Bob' });

  render(<UserProfile userId={1} />);

  await waitFor(() => {
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  expect(fetchUser).toHaveBeenCalledWith(1);
});`}
      </CodeBlock>

      <h3>jest.spyOn() — Spying on Real Methods</h3>
      <CodeBlock language="javascript" title="Spying Without Replacing">
{`import * as mathUtils from './mathUtils';

test('should call multiply internally', () => {
  const spy = jest.spyOn(mathUtils, 'multiply');
  const result = mathUtils.square(5);

  expect(result).toBe(25);
  expect(spy).toHaveBeenCalledWith(5, 5);
  spy.mockRestore();
});`}
      </CodeBlock>

      <h3>Mocking Timers</h3>
      <CodeBlock language="javascript" title="Controlling Time in Tests">
{`beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('should debounce search input', () => {
  const mockSearch = jest.fn();
  const debouncedSearch = debounce(mockSearch, 300);

  debouncedSearch('h');
  debouncedSearch('he');
  debouncedSearch('hel');
  debouncedSearch('hello');

  // Nothing called yet
  expect(mockSearch).not.toHaveBeenCalled();

  // Fast-forward 300ms
  jest.advanceTimersByTime(300);

  // Only the last call goes through
  expect(mockSearch).toHaveBeenCalledTimes(1);
  expect(mockSearch).toHaveBeenCalledWith('hello');
});`}
      </CodeBlock>

      <h2>MSW — Mock Service Worker</h2>
      <p>
        MSW intercepts HTTP requests at the network level, providing a more realistic
        mocking approach than replacing fetch or axios.
      </p>

      <CodeBlock language="javascript" title="MSW Setup for Tests">
{`import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Alice',
      email: 'alice@test.com',
    });
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: '99', ...body },
      { status: 201 }
    );
  }),

  http.delete('/api/users/:id', () => {
    return new HttpResponse(null, { status: 204 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('should fetch and display user', async () => {
  render(<UserProfile userId="1" />);

  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});

test('should handle server errors', async () => {
  // Override for a single test
  server.use(
    http.get('/api/users/:id', () => {
      return HttpResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      );
    })
  );

  render(<UserProfile userId="1" />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="MSW vs jest.mock for API Calls">
        MSW is generally preferred over mocking fetch/axios directly because it
        tests the full request/response cycle. Your component&apos;s HTTP client code
        runs for real — only the network is intercepted. This catches serialization
        bugs and header issues that module mocking would miss.
      </InfoBox>

      <h2>When NOT to Mock</h2>

      <FlowChart
        title="Should You Mock It?"
        chart={"graph TD\n  Q[\"Should I mock this?\"] --> FAST{\"Is it fast?\"}\n  FAST -->|Yes| DET{\"Is it deterministic?\"}\n  FAST -->|No| MOCK[\"Mock it\"]\n  DET -->|Yes| SIDE{\"Any side effects?\"}\n  DET -->|No| MOCK\n  SIDE -->|No| REAL[\"Use the real thing\"]\n  SIDE -->|Yes| MOCK"}
      />

      <InfoBox variant="warning" title="Over-Mocking Is Dangerous">
        If you mock everything, you&apos;re only testing that your mocks work, not your
        code. Common signs of over-mocking:
        <ul>
          <li>Tests pass but the feature is broken in production</li>
          <li>Tests break every time you refactor internals</li>
          <li>Mock setup is longer than the actual test</li>
          <li>You&apos;re mocking the thing you&apos;re supposed to be testing</li>
        </ul>
      </InfoBox>

      <h2>Mockito vs Jest Comparison</h2>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Mockito (Java)</th>
            <th>Jest (JavaScript)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Create a mock</td>
            <td><code>mock(UserRepo.class)</code></td>
            <td><code>jest.fn()</code></td>
          </tr>
          <tr>
            <td>Stub a return value</td>
            <td><code>when(m.get()).thenReturn(v)</code></td>
            <td><code>m.mockReturnValue(v)</code></td>
          </tr>
          <tr>
            <td>Verify a call</td>
            <td><code>verify(m).save(any())</code></td>
            <td><code>expect(m).toHaveBeenCalled()</code></td>
          </tr>
          <tr>
            <td>Spy on real code</td>
            <td><code>spy(realObject)</code></td>
            <td><code>jest.spyOn(obj, &apos;method&apos;)</code></td>
          </tr>
          <tr>
            <td>Mock a module</td>
            <td>N/A (use DI)</td>
            <td><code>jest.mock(&apos;./module&apos;)</code></td>
          </tr>
          <tr>
            <td>Argument capture</td>
            <td><code>ArgumentCaptor</code></td>
            <td><code>mock.calls[0][0]</code></td>
          </tr>
          <tr>
            <td>Async mocking</td>
            <td><code>thenReturn(CompletableFuture)</code></td>
            <td><code>mockResolvedValue()</code></td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"What is the key difference between a stub and a mock?"}
        options={[
          "Stubs are for Java, mocks are for JavaScript",
          "Stubs provide canned data; mocks verify interactions",
          "Mocks are simpler than stubs",
          "There is no difference — they are the same thing"
        ]}
        correctIndex={1}
        explanation="Stubs supply predetermined responses (state verification), while mocks set expectations about how the system under test should interact with dependencies (behavior verification). Both are useful in different scenarios."
        language="java"
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>Understand the five test double types: dummy, stub, spy, mock, fake</li>
        <li>Mockito handles Java mocking with @Mock, @InjectMocks, when/verify</li>
        <li>Jest provides jest.fn(), jest.mock(), and jest.spyOn() for JavaScript</li>
        <li>MSW is the preferred approach for mocking API calls in frontend tests</li>
        <li>Only mock what you must — fast, deterministic, side-effect-free code should use real implementations</li>
        <li>Over-mocking leads to tests that pass but features that break</li>
      </ul>
    </LessonLayout>
  );
}
