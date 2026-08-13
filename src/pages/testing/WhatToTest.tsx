import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function WhatToTest() {
  return (
    <LessonLayout
      title="What to Test (and What Not To)"
      sectionId="testing"
      lessonIndex={1}
      prev={{ path: '/testing/intro', label: 'Testing Pyramid & Philosophy' }}
      next={{ path: '/testing/unit', label: 'Unit Testing (JUnit & Jest)' }}
    >
      <h2>The Blank-File Problem</h2>
      <p>
        You know what a test <em>is</em> now — arrange, act, assert, throw on mismatch.
        That knowledge does not help you at the moment that actually stalls people: a
        file open on the left, an empty <code>OrderService.test.ts</code> on the right,
        and no idea which of its fourteen methods deserve your next twenty minutes.
      </p>
      <p>
        This lesson is the decision procedure. Not &quot;write good tests&quot; — an
        ordered set of questions you can run against real code to decide what gets a
        test, what gets skipped, and when you are done.
      </p>

      <FlowChart
        title="The Decision Procedure"
        chart={"graph TD\n  START[\"A piece of code\"] --> OWN{\"Is this logic\\nyours to own?\"}\n  OWN -->|\"No: framework or library\"| SKIP[\"Skip it\\n(test your adapter instead)\"]\n  OWN -->|Yes| BEHAV{\"Can you state the\\nbehaviour without\\nnaming internals?\"}\n  BEHAV -->|No| REFRAME[\"You are looking at an\\nimplementation detail.\\nStep up a level.\"]\n  BEHAV -->|Yes| RISK{\"What breaks if\\nthis is wrong?\"}\n  RISK -->|\"Money, data, access, silence\"| MUST[\"Test it well:\\nhappy path + edges + errors\"]\n  RISK -->|\"A visible, obvious glitch\"| SOME[\"One test on the\\nmain behaviour\"]\n  RISK -->|Nothing much| LATER[\"Leave it.\\nCome back when it breaks.\"]"}
      />

      <h2>Behaviour vs Implementation Detail</h2>
      <p>
        Every testing guide tells you to test behaviour, not implementation. Almost none
        of them tell you how to <em>tell which one you are doing</em>, which is the part
        that matters, because nobody sets out to write an implementation-coupled test.
        They write a test of the thing that was easy to reach.
      </p>

      <InfoBox variant="tip" title="The Refactor Check">
        <p>
          Ask one question of the test you are about to write:{' '}
          <strong>
            if I rewrote the internals without changing what a caller observes, would
            this test fail?
          </strong>
        </p>
        <p>
          If the answer is yes, you are testing implementation. That test will cost you
          later — it fails on every refactor, and after the third false alarm the team
          stops believing failures mean anything.
        </p>
      </InfoBox>

      <p>
        The two versions below test the same feature. Only one survives a rename of the
        private helper, a switch from a loop to <code>reduce</code>, or a change in how
        the discount is looked up:
      </p>

      <CodeBlock language="javascript" title="Implementation-Coupled vs Behavioural">
{`// COUPLED — knows the internal call graph
test('applies member discount', () => {
  const service = new PricingService();
  const spy = jest.spyOn(service, '_lookupDiscountRate');

  service.priceFor(order, member);

  expect(spy).toHaveBeenCalledWith('GOLD');   // <-- an internal step
  expect(service._cache.size).toBe(1);        // <-- an internal field
});
// Rename _lookupDiscountRate, or drop the cache, and this fails.
// The user-visible behaviour never changed. The test is lying to you.

// BEHAVIOURAL — states only what a caller can observe
test('gold members pay 15% less than list price', () => {
  const service = new PricingService();

  const price = service.priceFor({ subtotal: 200 }, { tier: 'GOLD' });

  expect(price).toBe(170);
});
// Rewrite the internals however you like. This test still means something.`}
      </CodeBlock>

      <p>
        The Java version of the same mistake usually wears Mockito clothes — a{' '}
        <code>verify()</code> on a collaborator that exists purely as an internal step:
      </p>

      <CodeBlock language="java" title="verify() Is Where Java Tests Leak Implementation">
{`// COUPLED — asserts the sequence of internal calls
@Test
void appliesMemberDiscount() {
    pricingService.priceFor(order, member);

    verify(discountRepository).findByTier("GOLD");   // an internal step
    verify(auditLog).record(any());                  // incidental
    verifyNoMoreInteractions(discountRepository);    // now it is welded shut
}

// BEHAVIOURAL — asserts the outcome the caller was promised
@Test
@DisplayName("gold members pay 15% less than list price")
void goldMembersPayFifteenPercentLess() {
    BigDecimal price = pricingService.priceFor(order(200), member(Tier.GOLD));

    assertThat(price).isEqualByComparingTo("170.00");
}`}
      </CodeBlock>

      <InfoBox variant="note" title="When verify() Is Right">
        <p>
          <code>verify()</code> is not banned — it is correct when the interaction{' '}
          <em>is</em> the behaviour. &quot;Cancelling an order emails the customer&quot;
          has no return value to assert on; the outbound call is the whole observable
          effect, so verifying it is testing behaviour. The rule is: verify the calls
          that cross the boundary out of your unit, never the ones that stay inside it.
        </p>
      </InfoBox>

      <h3>Signals You Are Testing the Wrong Layer</h3>
      <table>
        <thead>
          <tr>
            <th>Signal</th>
            <th>What It Usually Means</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>You made a method or field non-private &quot;for testing&quot;</td>
            <td>The behaviour you want is reachable from the public API — find that route instead</td>
          </tr>
          <tr>
            <td>The test name contains a method name</td>
            <td>You named the mechanism, not the promise. Rename to the rule and see if the test still fits.</td>
          </tr>
          <tr>
            <td>Mock setup is longer than the assertion</td>
            <td>The unit boundary is drawn too tightly — you are re-specifying the whole call graph</td>
          </tr>
          <tr>
            <td>A green refactor turned the suite red</td>
            <td>Proof, after the fact. Delete or rewrite the tests that failed for no behavioural reason.</td>
          </tr>
          <tr>
            <td>You had to change tests to make a bug fix compile</td>
            <td>The tests encode structure, not contract</td>
          </tr>
        </tbody>
      </table>

      <h2>Finding the Boundary of the Unit</h2>
      <p>
        &quot;Unit&quot; does not mean &quot;one class&quot;. It means{' '}
        <strong>one piece of behaviour, plus whatever collaborators are fast and
        deterministic enough to come along for free</strong>. Drawing it too small is
        the single most common cause of brittle suites: a test per class forces a mock
        per dependency, and the mocks encode the exact structure you wanted freedom to
        change.
      </p>

      <FlowChart
        title="Where to Draw the Line"
        chart={"graph LR\n  subgraph Inside the unit - use the real thing\n    S[\"OrderService\"] --> V[\"PriceCalculator\\n(pure, fast)\"]\n    S --> R[\"DiscountRules\\n(pure, fast)\"]\n  end\n  S --> DB[\"OrderRepository\\n(I/O - stub at the seam)\"]\n  S --> MAIL[\"EmailGateway\\n(side effect - verify at the seam)\"]"}
      />

      <p>
        Practical rule: <strong>the boundary is where I/O, randomness, the clock, or a
        side effect begins.</strong> Everything on your side of that line is
        implementation you should be free to reshuffle; everything crossing it is a
        contract worth pinning down. A value object or a pure calculator does not need
        its own mock — instantiate it and let it run.
      </p>

      <InfoBox variant="warning" title="Private Methods Are Not a Separate Unit">
        If a private method contains logic complex enough that you want to test it
        directly, that is a design signal, not a testing problem. Either it is reachable
        through the public API (test it there, via the inputs that drive it) or it is
        genuinely its own concept (extract it into a class or module with its own public
        contract). Making it <code>public</code> or package-private &quot;just for
        tests&quot; permanently widens your API to satisfy a test — the tail wagging the
        dog.
      </InfoBox>

      <h2>Test the Contract, Not the Constructor</h2>
      <p>
        A class&apos;s contract is the set of promises it makes to callers: given this
        input and this state, you get that result, that error, or that effect. Its
        construction, field layout, and internal wiring are not promises — they are how
        it currently happens to keep those promises.
      </p>

      <CodeBlock language="java" title="Two Tests of the Same Class">
{`// TESTS THE CONSTRUCTOR — verifies assignment, promises nothing
@Test
void constructorStoresFields() {
    Account account = new Account("ACC-1", BigDecimal.valueOf(100));

    assertEquals("ACC-1", account.getId());
    assertEquals(BigDecimal.valueOf(100), account.getBalance());
}
// This passes as long as the compiler works. It would catch a typo in an
// assignment and literally nothing else. It also breaks the day the class
// starts storing cents as a long internally.

// TESTS THE CONTRACT — states a rule the class exists to enforce
@Test
@DisplayName("withdrawal is rejected when it would overdraw the account")
void rejectsOverdraft() {
    Account account = anAccount().withBalance("100.00").build();

    assertThrows(InsufficientFundsException.class,
            () -> account.withdraw(new BigDecimal("150.00")));
    assertThat(account.getBalance()).isEqualByComparingTo("100.00");
}
// This is the reason the class exists. It survives any refactor that keeps
// the promise, and fails loudly the day someone breaks it.`}
      </CodeBlock>

      <p>
        The same test written against a React component: the contract is what the user
        can see and do, not which hooks fired in which order.
      </p>

      <CodeBlock language="jsx" title="Contract Thinking in a Component Test">
{`// CONSTRUCTOR-SHAPED — asserts on internals
test('sets loading state', () => {
  const { result } = renderHook(() => useCheckout());
  expect(result.current.isLoading).toBe(true);   // an internal flag
});

// CONTRACT-SHAPED — asserts on what the user gets
test('shows a spinner until the order total arrives, then the total', async () => {
  render(<Checkout cartId="c-1" />);

  expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();

  expect(await screen.findByText('$170.00')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});`}
      </CodeBlock>

      <h2>Risk-Based Prioritisation</h2>
      <p>
        You will never test everything, so the real question is ordering. Two factors
        decide it: <strong>how likely is this to be wrong</strong> and{' '}
        <strong>what does it cost when it is</strong>. Multiply, sort, start at the top.
      </p>

      <table>
        <thead>
          <tr>
            <th>Raises Likelihood of Being Wrong</th>
            <th>Raises Cost of Being Wrong</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Branching logic, many conditions, arithmetic</td>
            <td>Money: pricing, tax, refunds, invoicing, payouts</td>
          </tr>
          <tr>
            <td>Code that has broken before (check the git log)</td>
            <td>Access control: permissions, tenancy, visibility</td>
          </tr>
          <tr>
            <td>Recently changed or actively being changed</td>
            <td>Data integrity: migrations, deletes, dedupe, merges</td>
          </tr>
          <tr>
            <td>Concurrency, ordering, retries, partial failure</td>
            <td>Anything that fails <em>silently</em> rather than loudly</td>
          </tr>
          <tr>
            <td>Written by someone who has left, or nobody understands</td>
            <td>Anything irreversible: emails sent, charges made, rows dropped</td>
          </tr>
          <tr>
            <td>Many callers, or a shared utility everyone depends on</td>
            <td>Anything blocking every user at once (login, checkout)</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="danger" title="Weight Silent Failures Heaviest">
        <p>
          A crash gets a stack trace, a page, and a fix within the hour. A pricing rule
          that quietly computes 9% VAT instead of 19% produces perfectly plausible
          numbers and is discovered by an accountant three months and forty thousand
          invoices later.
        </p>
        <p>
          When you are choosing between two things to test, prefer the one whose failure
          mode is <em>wrong but believable</em> over the one that would obviously
          explode. Loud failures are found by users; quiet ones are only ever found by
          tests.
        </p>
      </InfoBox>

      <h3>A Fifteen-Minute Triage on Real Code</h3>
      <p>
        Run this against a file you have been asked to add tests to. It reliably beats
        starting at the top of the file and working down:
      </p>
      <ol>
        <li>
          <strong>Read the git log for the file.</strong>{' '}
          <code>git log --oneline -- path/to/file</code>. Anything with{' '}
          <code>fix:</code>, <code>hotfix</code>, or a ticket number in the message is a
          behaviour someone already got wrong once. Those are your first tests, and each
          one comes with a specification written for free in the commit message.
        </li>
        <li>
          <strong>List the decisions, not the methods.</strong> Every <code>if</code>,{' '}
          <code>switch</code>, ternary, and early return is a rule someone wrote down.
          Each is a candidate test case; a method with no branches usually is not.
        </li>
        <li>
          <strong>Ask what a support ticket about this would say.</strong> &quot;I was
          charged twice.&quot; &quot;My export was empty.&quot; &quot;I can see another
          team&apos;s data.&quot; Those sentences are test names, and they are already
          written in the language of behaviour.
        </li>
        <li>
          <strong>Test the seam you are about to change.</strong> If you are here to
          modify code, the highest-value test is the one that locks in the behaviour you
          intend to <em>keep</em> — that is what makes the change safe.
        </li>
      </ol>

      <h2>Why 100% Coverage Is the Wrong Target</h2>
      <p>
        Coverage measures which lines ran, not which behaviours are guaranteed. Aimed at
        as a target it inverts: people write the cheapest tests that touch the most
        lines, which are exactly the tests with the least value. Two ways to see the
        problem:
      </p>
      <ul>
        <li>
          <strong>100% coverage proves nothing.</strong> A test with no assertions
          covers every line it touches. So does a snapshot that nobody reads.
        </li>
        <li>
          <strong>Full coverage misses whole behaviours.</strong> Coverage can only
          measure code that exists. The missing null check, the unhandled currency, the
          branch nobody wrote — none of them appear as a gap, because there is no line
          to be uncovered.
        </li>
      </ul>

      <InfoBox variant="tip" title="What to Aim at Instead">
        <ul>
          <li>
            <strong>Behaviour coverage:</strong> every rule you can state in a sentence
            has at least one test that fails when the rule is broken. This is the real
            target; the rest is proxy.
          </li>
          <li>
            <strong>Bug coverage:</strong> every bug fixed gets a test that fails
            against the old code. Zero exceptions — this is the one rule that
            compounds.
          </li>
          <li>
            <strong>Risk coverage:</strong> the modules from the table above are tested
            deeply — edges, errors, boundaries — while the CRUD wrappers get one
            happy-path test each.
          </li>
          <li>
            <strong>Coverage as a report, not a gate:</strong> read the uncovered lines
            and ask &quot;does this matter?&quot; A number that only ever goes up is a
            worse signal than a human glancing at the diff each week.
          </li>
        </ul>
      </InfoBox>

      <p>
        The Testing Best Practices lesson goes further into what the different coverage
        metrics actually measure and how mutation testing grades the tests themselves.
        For now the takeaway is directional: <em>coverage is a tool for finding gaps,
        never a definition of done.</em>
      </p>

      <h2>What NOT to Test</h2>
      <p>
        Every test is a permanent liability as well as an asset — it must be read,
        maintained, and updated. These categories reliably cost more than they return:
      </p>

      <table>
        <thead>
          <tr>
            <th>Do Not Test</th>
            <th>Why</th>
            <th>Test This Instead</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Framework internals (Spring wiring, React rendering, the ORM)</td>
            <td>It has its own test suite, run by people who know it better than you</td>
            <td>Your configuration of it, and only where you have made a choice</td>
          </tr>
          <tr>
            <td>Third-party library behaviour</td>
            <td>You are testing someone else&apos;s code, and re-testing it on every CI run</td>
            <td>Your adapter around it — that the inputs you send and outputs you map are right</td>
          </tr>
          <tr>
            <td>Trivial getters, setters, and plain data holders</td>
            <td>No logic, no branches, nothing to be wrong except a typo the compiler catches</td>
            <td>The logic that <em>uses</em> those values</td>
          </tr>
          <tr>
            <td>Generated code (Lombok, MapStruct, OpenAPI clients, protobuf)</td>
            <td>The generator is the thing under test, and it is not yours</td>
            <td>The mapping <em>configuration</em>, if a wrong mapping would be silent</td>
          </tr>
          <tr>
            <td>Snapshot-everything on components or API payloads</td>
            <td>Asserts &quot;nothing changed&quot;, not &quot;this is correct&quot;; updated reflexively when red</td>
            <td>The two or three fields the feature actually promises</td>
          </tr>
          <tr>
            <td>Constants, enums, and config files</td>
            <td>The test restates the value — it fails only when you deliberately change it</td>
            <td>The behaviour that depends on the value being what it is</td>
          </tr>
          <tr>
            <td>Mocks you configured yourself</td>
            <td>A test that stubs a value and asserts the same value proves only that the mock works</td>
            <td>Real objects wherever they are fast and deterministic</td>
          </tr>
        </tbody>
      </table>

      <p>
        The most useful of these in practice is the adapter rule. You are not testing
        that Stripe charges cards or that your HTTP client can parse JSON — you are
        testing that <em>your</em> translation into and out of that library is right:
      </p>

      <CodeBlock language="javascript" title="Test Your Adapter, Not the Library">
{`// LOW VALUE — this tests axios, and fails when axios changes its internals
test('calls the payments API', async () => {
  const spy = jest.spyOn(axios, 'post').mockResolvedValue({ data: {} });
  await chargeCustomer({ amount: 1999, currency: 'usd' });
  expect(spy).toHaveBeenCalledWith('/v1/charges', expect.anything(), expect.anything());
});

// HIGH VALUE — pins the two translations that are genuinely yours:
// dollars-to-cents on the way out, and their error shape to yours on the way in.
test('sends the amount in minor units and maps a declined card to a domain error', async () => {
  server.use(
    http.post('https://api.payments.test/v1/charges', async ({ request }) => {
      const body = await request.json();
      expect(body.amount).toBe(1999);        // 19.99 USD, not 19.99
      expect(body.currency).toBe('usd');
      return HttpResponse.json({ error: { code: 'card_declined' } }, { status: 402 });
    })
  );

  await expect(chargeCustomer({ amount: 19.99, currency: 'USD' }))
    .rejects.toThrow(PaymentDeclinedError);
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="The Snapshot Trap">
        A snapshot test asserts that today&apos;s output equals yesterday&apos;s. That is
        useful for output nobody can read by eye and everybody would notice breaking — a
        serialised AST, a generated SQL string. It is close to worthless as a default,
        because when it goes red the reflex is <code>-u</code>, and a reflexively
        updated snapshot is an assertion that has been deleted. If you cannot say what
        the snapshot is protecting, write two explicit expectations instead.
      </InfoBox>

      <h2>The Happy Path Is One Case Out of Many</h2>
      <p>
        Most first drafts test the case the author had in mind while writing the code,
        which is also the case the code definitely handles. Bugs live in the other
        cases. Walk this checklist against each input and each dependency — it takes a
        minute and it is where the real test cases come from:
      </p>

      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Ask</th>
            <th>Typical Bug It Catches</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Zero, one, many</td>
            <td>Empty list? Exactly one item? Thousands?</td>
            <td>Off-by-one, a sum over an empty set, an unpaginated query</td>
          </tr>
          <tr>
            <td>Boundaries</td>
            <td>Exactly at the threshold, one below, one above</td>
            <td><code>&gt;</code> where <code>&gt;=</code> was meant — the classic</td>
          </tr>
          <tr>
            <td>Absence</td>
            <td>Null, undefined, missing key, empty string, whitespace</td>
            <td>NPEs, <code>&quot;undefined&quot;</code> rendered to users</td>
          </tr>
          <tr>
            <td>Wrong shape</td>
            <td>Negative amount, huge number, wrong type, unexpected enum value</td>
            <td>Missing validation, a <code>switch</code> with no default</td>
          </tr>
          <tr>
            <td>Duplication and ordering</td>
            <td>Same request twice? Events arriving out of order?</td>
            <td>Double charges, non-idempotent handlers</td>
          </tr>
          <tr>
            <td>Dependency failure</td>
            <td>What if the DB, the queue, or the API is down, slow, or returns a 500?</td>
            <td>Unhandled rejections, retries that hammer a dying service</td>
          </tr>
          <tr>
            <td>Partial failure</td>
            <td>Step 2 of 3 fails — what state is left behind?</td>
            <td>Orphaned rows, money taken with no order created</td>
          </tr>
          <tr>
            <td>Authorisation</td>
            <td>What does the <em>wrong</em> user see?</td>
            <td>The bug where every tenant can read every other tenant</td>
          </tr>
        </tbody>
      </table>

      <p>
        Once you have the list, parameterised tests keep it from becoming eight
        copy-pasted blocks. The boundary row alone usually justifies the technique:
      </p>

      <CodeBlock language="java" title="Boundaries as a Table (JUnit 5)">
{`@ParameterizedTest(name = "an order of {0} is free-shipping: {1}")
@CsvSource({
    "49.99, false",   // just below
    "50.00, false",   // exactly at the threshold — the case nobody writes
    "50.01, true",    // just above
    "0.00,  false"    // the empty-cart edge
})
void freeShippingThreshold(BigDecimal total, boolean expected) {
    assertEquals(expected, shippingService.isFree(anOrder().withTotal(total).build()));
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="The Same Table in Vitest / Jest">
{`test.each([
  [49.99, false],
  [50.00, false],   // exactly at the threshold
  [50.01, true],
  [0,     false],
])('order of $%s is free-shipping: %s', (total, expected) => {
  expect(isFreeShipping({ total })).toBe(expected);
});`}
      </CodeBlock>

      <InfoBox variant="note" title="Error Paths Deserve Assertions Too">
        &quot;It throws&quot; is half a test. The other half is <em>which</em> error, with
        what message or code, and what state is left behind — because callers branch on
        the error type and users read the message. A test that asserts only{' '}
        <code>assertThrows(Exception.class, ...)</code> passes just as happily when your
        validation error becomes a NullPointerException.
      </InfoBox>

      <h2>Knowing When You Are Done</h2>
      <p>
        There is no coverage number that answers this. The honest test is whether you
        could break the code and feel it:
      </p>
      <ul>
        <li>
          Could you delete a line of the logic, or flip a comparison, and would something
          go red? If not, the behaviour is unverified regardless of what coverage says.
        </li>
        <li>
          Could a new teammate read your test names alone and describe what this module
          promises? If yes, the tests are documenting the contract.
        </li>
        <li>
          If this module caused an incident tomorrow, which case would it be? Go write
          that one now.
        </li>
        <li>
          Are you writing tests because the next one adds confidence, or because a
          number is at 78%? If it is the number, stop.
        </li>
      </ul>

      <InteractiveChallenge
        question={"You add a test that asserts your service calls a private helper method with the right argument. You then refactor that helper away entirely — the service's output is unchanged, but the test fails. What does that tell you?"}
        options={[
          "The refactor was unsafe and should be reverted",
          "The test was coupled to implementation, not behaviour, and should be rewritten against the observable output",
          "The service needs more mocks so the test keeps passing",
          "The helper should be made public so the test can keep calling it"
        ]}
        correctIndex={1}
        explanation="A test that fails when behaviour did not change is testing implementation. That is exactly what the refactor check catches: 'would this fail if I changed the internals without changing what a caller observes?' Rewrite it against the service's observable output so it survives future refactors — and so a real failure means something."
        language="javascript"
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>Run the refactor check on every test: if changing internals without changing behaviour would break it, rewrite it</li>
        <li>The unit boundary sits where I/O, randomness, the clock, or a side effect begins — use real objects inside it</li>
        <li>Test the contract (the promise the code makes), never the constructor or the call graph</li>
        <li>Prioritise by likelihood of being wrong &times; cost of being wrong, and weight silent failures heaviest</li>
        <li>Start from the git log, the branches, and the support tickets — not the top of the file</li>
        <li>Aim at behaviour coverage, bug coverage, and risk coverage; treat the coverage percentage as a report, not a goal</li>
        <li>Skip framework internals, library behaviour, trivial accessors, generated code, and reflexive snapshots — test your adapter instead</li>
        <li>Walk the edge-case checklist: zero/one/many, boundaries, absence, duplication, dependency and partial failure, wrong user</li>
        <li>You are done when breaking the logic would make something go red — not when a percentage hits a target</li>
      </ul>
    </LessonLayout>
  );
}
