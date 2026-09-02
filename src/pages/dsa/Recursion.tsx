import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';

export default function Recursion() {
  return (
    <LessonLayout
      title="Recursion & Backtracking"
      sectionId="dsa"
      lessonIndex={4}
      prev={{ path: '/dsa/stacks-queues', label: 'Stacks & Queues' }}
      next={{ path: '/dsa/trees', label: 'Trees & Binary Search Trees' }}
    >
      <p>
        Recursion trips up more people than almost anything else in this section — not because the idea
        is hard, but because it&apos;s usually explained with the code first and the intuition second.
        This lesson does it backwards on purpose: plain language and a picture first, real Java second,
        and every piece of output below is copy-pasted from actually compiling and running it against the
        installed JDK (<code>26.0.1</code>) — including the crash in step 3, which is shown on purpose.
      </p>

      <h2>The Idea, Before Any Code</h2>

      <p>
        Picture a set of Russian nesting dolls. You open the biggest doll and find a slightly smaller
        doll inside. You open <em>that</em> one and find an even smaller doll inside. You keep going —
        open, find a smaller doll, open again — until you reach a doll so small it doesn&apos;t open at
        all. That tiny solid doll is where the process <em>stops</em>. Then, working backwards, you close
        each doll back around the one you just handled, back up to the original.
      </p>

      <p>
        <strong>Recursion is that exact pattern, applied to a function instead of a doll:</strong> a
        function that solves a problem by calling <em>itself</em> on a smaller version of that same
        problem, and keeps doing that until the version it&apos;s looking at is so small it can just
        answer directly, with no further calls. That smallest, directly-answerable version is called the{' '}
        <strong>base case</strong> — it&apos;s the solid doll that doesn&apos;t open any further.
        Everything above it is called the <strong>recursive case</strong> — &quot;I don&apos;t know the
        full answer yet, but I know it&apos;s some simple operation applied to the answer for a slightly
        smaller version of this problem.&quot;
      </p>

      <InfoBox variant="tip" title="Two Questions That Answer Almost Any Recursion Problem">
        <p>
          Every recursive function you&apos;ll meet in this section answers the same two questions.{' '}
          <strong>1. What&apos;s the smallest version of this problem I could answer immediately, with no
          further help?</strong> That&apos;s the base case. <strong>2. If I already had the answer for a
          slightly smaller version of this problem, how would I use it to build the answer for my current,
          slightly bigger version?</strong> That&apos;s the recursive case. Get comfortable asking those
          two questions and recursion stops being mysterious — it becomes a template.
        </p>
      </InfoBox>

      <h2>The Simplest Example: <code>factorial(n)</code></h2>

      <p>
        <code>factorial(n)</code> (written <code>n!</code>) means &quot;multiply every whole number from{' '}
        <code>n</code> down to 1.&quot; So <code>factorial(4) = 4 × 3 × 2 × 1 = 24</code>. Notice something
        about that definition: <code>factorial(4)</code> is just <code>4 × factorial(3)</code>. And{' '}
        <code>factorial(3)</code> is just <code>3 × factorial(2)</code>. The problem keeps shrinking by
        one each time, and it bottoms out at <code>factorial(1)</code>, which is simply <code>1</code> —
        no further multiplying needed. That bottoming-out case is the base case.
      </p>

      <CodeBlock language="java" title="Factorial.java">
{`static int factorial(int n) {
    if (n <= 1) {
        return 1; // base case: nothing smaller to compute, answer directly
    }
    return n * factorial(n - 1); // recursive case: n times the answer to a smaller problem
}`}
      </CodeBlock>

      <p>
        Compiled and run for real, with a print statement added on the way in and on the way out so the
        whole process is visible:
      </p>

      <CodeBlock language="text" title="Real console output — javac Factorial.java && java Factorial">
{`-> factorial(4) called
  -> factorial(3) called
    -> factorial(2) called
      -> factorial(1) called
      <- factorial(1) returns 1 (base case)
    <- factorial(2) returns 2
  <- factorial(3) returns 6
<- factorial(4) returns 24
factorial(4) = 24`}
      </CodeBlock>

      <p>
        Read that shape carefully — it is the single most important picture in this lesson. There are two
        distinct phases: the <strong>calls going down</strong> (each <code>-&gt;</code> line), where{' '}
        <code>factorial(4)</code> can&apos;t finish yet because it&apos;s waiting on{' '}
        <code>factorial(3)</code>, which can&apos;t finish because it&apos;s waiting on{' '}
        <code>factorial(2)</code>, and so on — and then the <strong>answers coming back up</strong> (each{' '}
        <code>&lt;-</code> line), where <code>factorial(1)</code> finally answers with <code>1</code>, and
        every call that was waiting multiplies that answer by its own <code>n</code> and hands the result
        back to whoever called <em>it</em>.
      </p>

      <FlowChart
        title="The call stack: building up, then unwinding"
        chart={`graph TD
    A["factorial(4) called<br/>needs: 4 x factorial(3)"] --> B["factorial(3) called<br/>needs: 3 x factorial(2)"]
    B --> C["factorial(2) called<br/>needs: 2 x factorial(1)"]
    C --> D["factorial(1) called<br/>BASE CASE -- answers 1 directly"]
    D -.->|"returns 1"| C
    C -.->|"2 x 1 = returns 2"| B
    B -.->|"3 x 2 = returns 6"| A
    A -.->|"4 x 6 = returns 24"| E["factorial(4) = 24"]
    style D fill:#1a3329,stroke:#4ade80
    style E fill:#1a2744,stroke:#5b9cf6`}
      />

      <p>
        The solid arrows going down are calls piling up, each one paused and waiting — this is literally a
        stack, the same data structure from the previous lesson, and Java is building it for you
        automatically every time a function calls another function. The dashed arrows coming back up are
        those paused calls finishing, one at a time, from the base case outward. Nothing above{' '}
        <code>factorial(1)</code> can produce a real number until <code>factorial(1)</code> answers first
        — that&apos;s what &quot;waiting&quot; means here.
      </p>

      <h2>The Base Case: What Actually Stops It</h2>

      <p>
        The base case isn&apos;t just a formality — it is the <em>only</em> thing that stops a recursive
        function from calling itself forever. Without one, there is nothing to make the &quot;down&quot;
        arrows in that diagram ever turn into &quot;up&quot; arrows. To make that concrete instead of just
        asserting it, here is a function that recurses with no base case at all — it just keeps calling
        itself with a smaller number, forever:
      </p>

      <CodeBlock language="java" title="NoBaseCase.java — the bug on purpose">
{`static int countDown(int n) {
    System.out.println("counting down: " + n);
    return countDown(n - 1); // never checks for a stopping point -- this never stops
}`}
      </CodeBlock>

      <p>
        Compiled and actually run — not a hypothetical, this is what really happens:
      </p>

      <CodeBlock language="text" title="Real console output — javac NoBaseCase.java && java NoBaseCase">
{`counting down: 5
counting down: 4
counting down: 3
counting down: 2
counting down: 1
counting down: 0
counting down: -1
counting down: -2
... (10,980 lines of "counting down" total) ...
counting down: -10975
Exception in thread "main" java.lang.StackOverflowError
	at NoBaseCase.countDown(NoBaseCase.java:6)
	at NoBaseCase.countDown(NoBaseCase.java:6)
	at NoBaseCase.countDown(NoBaseCase.java:6)
	at NoBaseCase.countDown(NoBaseCase.java:6)
	... (thousands more identical lines) ...`}
      </CodeBlock>

      <p>
        That is a real crash, from real code, on this machine: <code>countDown</code> called itself{' '}
        <strong>10,980 times</strong> before Java ran out of room in the call stack and threw{' '}
        <code>StackOverflowError</code>. Every one of those calls was &quot;paused and waiting,&quot; exactly
        like in the factorial diagram above — except here, nothing was ever small enough to stop and start
        answering, so the stack of waiting calls just grew until it physically ran out of space. This is
        precisely why the base case matters: it is not a style preference, it is the only thing standing
        between &quot;recursion&quot; and &quot;a crash.&quot;
      </p>

      <InfoBox variant="warning" title="A Broken Base Case Is Just as Dangerous as a Missing One">
        <p>
          A base case that exists but is <em>unreachable</em> fails the same way. If{' '}
          <code>factorial</code> recursed with <code>factorial(n + 1)</code> instead of{' '}
          <code>factorial(n - 1)</code>, it would never shrink toward <code>n &lt;= 1</code> — it would
          grow away from it, and crash exactly like <code>countDown</code> did above. Two things have to
          both be true: the recursive case must move <em>toward</em> the base case, and the base case must
          actually be reachable from every input you&apos;ll call it with.
        </p>
      </InfoBox>

      <h2>A Bigger Example: Summing an Array</h2>

      <p>
        Factorial recurses on a number. The same pattern works on a data structure — here it&apos;s applied
        to an <code>int[]</code>, connecting back to the arrays and lists from earlier in this section. The
        two questions from the tip box above, answered: the smallest version of &quot;sum this array&quot;
        is &quot;sum an empty slice of it&quot; (answer: 0 — the base case), and the recursive case is
        &quot;the first element, plus the sum of everything after it.&quot;
      </p>

      <CodeBlock language="java" title="ArraySum.java">
{`static int sum(int[] arr, int index) {
    if (index == arr.length) {
        return 0; // base case: no elements left to add
    }
    return arr[index] + sum(arr, index + 1); // this element + sum of the rest
}`}
      </CodeBlock>

      <p>Compiled and run on <code>{'{3, 7, 2, 5}'}</code>, with the same going-down / coming-up print pattern as before:</p>

      <CodeBlock language="text" title="Real console output — javac ArraySum.java && java ArraySum">
{`index=0 -> 3 + sum(rest)
  index=1 -> 7 + sum(rest)
    index=2 -> 2 + sum(rest)
      index=3 -> 5 + sum(rest)
        index=4 -> base case, return 0
      index=3 <- returns 5 + 0 = 5
    index=2 <- returns 2 + 5 = 7
  index=1 <- returns 7 + 7 = 14
index=0 <- returns 3 + 14 = 17
sum([3, 7, 2, 5]) = 17`}
      </CodeBlock>

      <p>
        Same shape as factorial, just with an array index shrinking toward <code>arr.length</code> instead
        of a number shrinking toward <code>1</code>. Once this pattern — recurse on a smaller slice, base
        case on the empty slice, combine on the way back up — feels familiar, most of what looks
        intimidating about recursive tree traversals in the next lesson is really this same shape wearing a
        different outfit.
      </p>

      <h2>Backtracking: Recursion That Tries Something, Then Undoes It</h2>

      <p>
        <strong>Backtracking is recursion with one extra habit: at each step, try a choice, recurse into
        it, and when that recursive call is done — whether it worked out or not — undo the choice before
        trying the next one.</strong> That &quot;undo&quot; step is the only new idea here; everything else
        is the same going-down/coming-back-up recursion from above. A good way to picture it: you&apos;re
        exploring a maze with a pencil, drawing your path as you go. You try a turn, walk down that
        corridor, and if it leads somewhere, great — if you need to explore other options too, you erase
        your last pencil mark (&quot;backtrack&quot;) and try the next turn instead.
      </p>

      <p>
        The classic beginner-friendly use case: generate every possible subset of a small set, say{' '}
        <code>{'{1, 2, 3}'}</code>. For each element, in order, there are exactly two choices — include it,
        or don&apos;t. Recurse on &quot;include it,&quot; let that whole branch finish, <strong>undo</strong>{' '}
        the include, then recurse on &quot;don&apos;t include it.&quot; A tiny decision tree for just{' '}
        <code>{'{1, 2}'}</code> makes the branching concrete before scaling up to three elements in code:
      </p>

      <FlowChart
        title="Decision tree for subsets of {1, 2} — every leaf is one final subset"
        chart={`graph TD
    S["start: {}"] --> I1["include 1 -> {1}"]
    S --> E1["exclude 1 -> {}"]
    I1 --> I2["include 2 -> {1,2}"]
    I1 --> E2a["exclude 2 -> {1}"]
    E1 --> I2b["include 2 -> {2}"]
    E1 --> E2b["exclude 2 -> {}"]
    style I2 fill:#1a3329,stroke:#4ade80
    style E2a fill:#1a3329,stroke:#4ade80
    style I2b fill:#1a3329,stroke:#4ade80
    style E2b fill:#1a3329,stroke:#4ade80`}
      />

      <p>
        Every path from the top to a green leaf is one complete subset, made purely from a sequence of
        include/exclude decisions. Now the real Java version, scaled up to <code>{'{1, 2, 3}'}</code>, with
        the &quot;try&quot; and &quot;backtrack&quot; (undo) steps labeled explicitly:
      </p>

      <CodeBlock language="java" title="Subsets.java">
{`static void findSubsets(int[] nums, int index, List<Integer> current, List<List<Integer>> result) {
    if (index == nums.length) {
        result.add(new ArrayList<>(current)); // base case: recorded one full subset
        return;
    }

    current.add(nums[index]);                       // TRY: include this element
    findSubsets(nums, index + 1, current, result);   // recurse with it included
    current.remove(current.size() - 1);              // BACKTRACK: undo the include

    findSubsets(nums, index + 1, current, result);    // TRY: recurse without it
}`}
      </CodeBlock>

      <p>Compiled and run for real on <code>{'{1, 2, 3}'}</code>:</p>

      <CodeBlock language="text" title="Real console output — javac Subsets.java && java Subsets">
{`All 8 subsets of {1, 2, 3}:
  [1, 2, 3]
  [1, 2]
  [1, 3]
  [1]
  [2, 3]
  [2]
  [3]
  []
Total recursive calls: 15`}
      </CodeBlock>

      <p>
        Every one of the 2³ = 8 possible include/exclude combinations shows up exactly once — that
        &quot;2 choices per element&quot; structure is exactly why the count of subsets of an n-element set
        is always 2ⁿ, and it&apos;s the same doubling-branches shape as the decision tree diagram above,
        just one level deeper. The <code>current.remove(...)</code> line is the entire &quot;backtracking&quot;
        idea in one line of code: without it, the list from the &quot;include&quot; branch would still have
        that element in it when the &quot;exclude&quot; branch runs, and every subset after the first would
        come out wrong.
      </p>

      <InfoBox variant="note" title="Why This Matters Later">
        <p>
          This exact skeleton — try a choice, recurse, undo the choice, try the next choice — is what
          solves permutation problems, N-Queens, Sudoku solvers, and most &quot;find all ways to
          arrange/choose X&quot; interview questions. The problems get visually more complex, but the
          three moving parts (a choice, a recursive call, an undo) stay the same.
        </p>
      </InfoBox>

    </LessonLayout>
  );
}
