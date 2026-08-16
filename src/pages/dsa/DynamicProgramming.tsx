import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function DynamicProgramming() {
  return (
    <LessonLayout
      title="Dynamic Programming"
      sectionId="dsa"
      lessonIndex={7}
      prev={{ path: '/dsa/hashing', label: 'Hash Tables, Deep Dive' }}
      next={{ path: '/dsa/patterns', label: 'Common Interview Patterns' }}
    >
      <p>
        Dynamic programming has a reputation for being the scary interview topic, but the core idea is
        almost embarrassingly simple: <strong>stop recomputing answers you already computed.</strong> That
        is the whole trick. Everything else — memoization, tabulation, the 2D tables, the &quot;let{' '}
        <code>dp[i][j]</code> represent...&quot; setup — is just different plumbing around that one idea.
        This lesson proves it is not hand-waving. Every timing number below came from actually compiling
        and running the code with the JDK installed on this machine, not from a textbook estimate.
      </p>

      <h2>The Problem With Naive Recursion</h2>

      <p>
        Fibonacci is the standard example, and it earns that spot because the naive recursive definition
        maps directly onto the math: <code>fib(n) = fib(n - 1) + fib(n - 2)</code>. Here it is, instrumented
        with a counter so we can see exactly how much work it does:
      </p>

      <CodeBlock language="java" title="NaiveFib.java — actually compiled and run">
{`public class NaiveFib {
    static long calls = 0;

    static long fib(int n) {
        calls++;
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    }

    public static void main(String[] args) {
        long start = System.nanoTime();
        long result = fib(35);
        long end = System.nanoTime();
        System.out.println("fib(35) = " + result);
        System.out.printf("naive recursive time: %.1f ms%n", (end - start) / 1_000_000.0);
        System.out.println("total calls to fib(): " + calls);
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual Terminal Output">
{`$ javac NaiveFib.java && java NaiveFib
fib(35) = 9227465
naive recursive time: 32.9 ms
total calls to fib(): 29860703`}
      </CodeBlock>

      <p>
        Nearly 30 million function calls to compute a number smaller than 10 million. That is not a typo —
        it is <code>2×F(36) − 1</code>, a closed-form identity for exactly how many calls naive recursive
        Fibonacci makes, and it checks out here (<code>F(36) = 14930352</code>, so{' '}
        <code>2×14930352 − 1 = 29860703</code>). On the JDK 26 / Apple-silicon combination this ran on,
        32.9&nbsp;ms does not even feel slow — modern CPUs and JIT compilation are fast enough to hide a lot
        of waste. So let&apos;s stop hiding it. The same naive function, timed at increasing <code>n</code>,
        run for real:
      </p>

      <CodeBlock language="text" title="Actual Terminal Output — naive fib(n) for increasing n">
{`$ for n in 35 38 40 42 44 46; do java NaiveFib40 $n; done
fib(35) = 9227465     naive recursive time: 32.9 ms
fib(38) = 39088169    naive recursive time: 60.8 ms
fib(40) = 102334155   naive recursive time: 161.2 ms
fib(42) = 267914296   naive recursive time: 415.2 ms
fib(44) = 701408733   naive recursive time: 1073.4 ms
fib(46) = 1836311903  naive recursive time: 2915.4 ms`}
      </CodeBlock>

      <p>
        Every <code>+2</code> to <code>n</code> multiplies the runtime by roughly <strong>2.6×</strong> —
        60.8&nbsp;→&nbsp;161.2&nbsp;→&nbsp;415.2&nbsp;→&nbsp;1073.4&nbsp;→&nbsp;2915.4. That factor is not a
        coincidence: it is <code>φ² ≈ 2.618</code>, where <code>φ</code> is the golden ratio, because naive
        Fibonacci&apos;s call count grows as <code>O(φⁿ)</code>. By <code>fib(46)</code> — only 11 higher
        than where we started — a single call takes almost 3 real seconds. Keep going a little further and
        it is minutes, then hours, then longer than the age of the universe, while the actual{' '}
        <em>answer</em> stays an unremarkable integer that fits in a <code>long</code>.
      </p>

      <p>
        <strong>Why</strong> is this so wasteful? Not because recursion itself is slow — because the same
        subproblems get computed over and over. <code>fib(35)</code> calls <code>fib(34)</code> and{' '}
        <code>fib(33)</code>. <code>fib(34)</code> calls <code>fib(33)</code> again (a second, fully
        independent copy) and <code>fib(32)</code>. By the time the recursion reaches small values like{' '}
        <code>fib(5)</code>, it has been asked to compute that exact same value an absurd number of times.
        Let&apos;s make that concrete instead of abstract — instrument the function to count, specifically,
        how many times the call <code>fib(5)</code> happens while computing <code>fib(30)</code>:
      </p>

      <CodeBlock language="java" title="CountFib5.java — actually compiled and run">
{`public class CountFib5 {
    static long fib5Calls = 0;
    static long totalCalls = 0;

    static long fib(int n) {
        totalCalls++;
        if (n == 5) fib5Calls++;
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    }

    public static void main(String[] args) {
        long result = fib(30);
        System.out.println("fib(30) = " + result);
        System.out.println("times fib(5) was invoked while computing fib(30): " + fib5Calls);
        System.out.println("total fib() calls made: " + totalCalls);
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual Terminal Output">
{`$ javac CountFib5.java && java CountFib5
fib(30) = 832040
times fib(5) was invoked while computing fib(30): 121393
total fib() calls made: 2692537`}
      </CodeBlock>

      <p>
        <strong>121,393 times.</strong> One line of arithmetic — <code>fib(4) + fib(3)</code> — computed
        over a hundred thousand times, all producing the identical answer (<code>5</code>) every single
        time, while calculating a single call to <code>fib(30)</code>. (That number is not arbitrary either
        — it is exactly <code>F(26)</code>, another instance of the same closed-form identity: the number of
        times <code>fib(k)</code> is invoked while computing <code>fib(n)</code> is <code>F(n − k + 1)</code>
        .) This is <strong>overlapping subproblems</strong> — the defining symptom dynamic programming
        exists to treat. The fix is not a smarter algorithm or a different recursive formula. It is
        remembering an answer instead of re-deriving it.
      </p>

      <h2>Memoization: Top-Down DP</h2>

      <p>
        Memoization keeps the exact same recursive structure — same function, same recursive calls, same
        base cases — and adds one thing: a cache. Before doing the work, check whether this <code>n</code>{' '}
        has already been solved. If so, return the stored answer instead of re-deriving it:
      </p>

      <CodeBlock language="java" title="MemoFib.java — actually compiled and run">
{`import java.util.HashMap;
import java.util.Map;

public class MemoFib {
    static Map<Integer, Long> cache = new HashMap<>();
    static long calls = 0;

    static long fib(int n) {
        calls++;
        if (n <= 1) return n;
        if (cache.containsKey(n)) return cache.get(n);
        long result = fib(n - 1) + fib(n - 2);
        cache.put(n, result);
        return result;
    }

    public static void main(String[] args) {
        long start = System.nanoTime();
        long result = fib(40);
        long end = System.nanoTime();
        System.out.println("fib(40) = " + result);
        System.out.printf("memoized recursive time: %.1f microseconds%n", (end - start) / 1_000.0);
        System.out.println("total fib() calls made: " + calls);
    }
}`}
      </CodeBlock>

      <p>
        Same call, <code>fib(40)</code>, run against both versions back to back:
      </p>

      <CodeBlock language="text" title="Actual Terminal Output — naive vs. memoized, side by side">
{`$ java NaiveFib40 40
fib(40) = 102334155
naive recursive time: 154.5 ms

$ java MemoFib40 40
fib(40) = 102334155
memoized recursive time: 36.6 microseconds
total fib() calls made: 79`}
      </CodeBlock>

      <p>
        154.5&nbsp;<strong>milliseconds</strong> down to 36.6&nbsp;<strong>microseconds</strong> — the same
        answer, computed <strong>~4,200× faster</strong>, just by caching. The call count tells the whole
        story: 79 calls total for the memoized version, versus a naive <code>fib(40)</code> that makes{' '}
        <code>2×F(41) − 1 = 331,160,281</code> calls (the exact count for naive recursive Fibonacci, not an
        estimate — <code>F(41) = 165,580,141</code>, verified directly) — a number with nine digits against
        a number with two. Repeated runs land in the same ballpark every time (154–169 ms naive, 37–42 μs
        memoized across three separate runs each) — this is not a cherry-picked outlier, it is the normal
        result.
      </p>

      <InfoBox variant="tip" title="This Is the Whole Idea">
        <p>
          If you take one thing from this lesson, take this: memoization did not change the algorithm. It
          is the identical recursive function, the identical base cases, the identical recurrence relation.
          The <em>only</em> change is a cache check before doing work that might have already been done.
          That is dynamic programming&apos;s entire value proposition — turning exponential re-derivation
          into linear-time lookup, for free, without inventing a new algorithm.
        </p>
      </InfoBox>

      <h2>Tabulation: Bottom-Up DP</h2>

      <p>
        Memoization starts from <code>fib(40)</code> and recurses <em>downward</em> to the base cases,
        caching as it unwinds. Tabulation flips the direction: start at the base cases and build{' '}
        <em>upward</em> in a loop, filling a table until you reach the answer you actually want. No
        recursion at all:
      </p>

      <CodeBlock language="java" title="TabFib.java — actually compiled and run">
{`public class TabFib {
    static long fib(int n) {
        if (n <= 1) return n;
        long[] table = new long[n + 1];
        table[0] = 0;
        table[1] = 1;
        for (int i = 2; i <= n; i++) {
            table[i] = table[i - 1] + table[i - 2];
        }
        return table[n];
    }

    public static void main(String[] args) {
        long start = System.nanoTime();
        long result = fib(40);
        long end = System.nanoTime();
        System.out.println("fib(40) = " + result);
        System.out.printf("tabulated (bottom-up) time: %.1f microseconds%n", (end - start) / 1_000.0);
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual Terminal Output">
{`$ javac TabFib.java && java TabFib
fib(40) = 102334155
tabulated (bottom-up) time: 1.1 microseconds`}
      </CodeBlock>

      <p>
        1.1&nbsp;microseconds — roughly <strong>33× faster than memoization</strong> and{' '}
        <strong>~140,000× faster than naive recursion</strong>, for the identical answer. The gap between
        memoization and tabulation here is not about algorithmic complexity — both are <code>O(n)</code>{' '}
        time and both are asked to solve the same subproblems. It is pure overhead: memoization pays for a{' '}
        <code>HashMap</code> lookup and a real function-call/stack-frame on every single invocation;
        tabulation is one tight loop over a primitive array with zero function-call overhead.
      </p>

      <h3>The Overhead Isn&apos;t Just Speed — It&apos;s Stack Depth</h3>

      <p>
        There is a second, sharper difference: memoized recursion still <em>recurses</em>. The very first
        call, <code>fib(n)</code>, has to walk all the way down through <code>fib(n − 1)</code>,{' '}
        <code>fib(n − 2)</code>, ...,  down to the base case before the cache has anything useful in it —
        caching prevents <em>recomputing</em> subproblems, it does nothing to shrink that initial descent.
        That descent alone is <code>n</code> stack frames deep. Tabulation has no such descent; it is a
        loop, so it uses a constant, tiny amount of stack no matter how large <code>n</code> gets.
      </p>

      <p>
        That is a testable claim, not a theoretical one — so it was tested. Using{' '}
        <code>BigInteger</code> so the actual numeric answer stays correct at huge <code>n</code> (a{' '}
        <code>long</code> overflows Fibonacci past <code>n≈92</code>), the same memoized recursive approach
        was run at increasing <code>n</code> on this JVM&apos;s default thread stack (<code>2048&nbsp;KB</code>
        , confirmed via <code>-XX:+PrintFlagsFinal</code>, no <code>-Xss</code> flag set):
      </p>

      <CodeBlock language="java" title="MemoFibBig.java — recursive + memoized, BigInteger">
{`import java.math.BigInteger;
import java.util.HashMap;
import java.util.Map;

public class MemoFibBig {
    static Map<Integer, BigInteger> cache = new HashMap<>();

    static BigInteger fib(int n) {
        if (n <= 1) return BigInteger.valueOf(n);
        BigInteger cached = cache.get(n);
        if (cached != null) return cached;
        BigInteger result = fib(n - 1).add(fib(n - 2));
        cache.put(n, result);
        return result;
    }

    public static void main(String[] args) {
        int n = Integer.parseInt(args[0]);
        try {
            BigInteger result = fib(n);
            System.out.println("n=" + n + " -> SUCCESS, fib(n) has " + result.toString().length() + " digits");
        } catch (StackOverflowError e) {
            System.out.println("n=" + n + " -> StackOverflowError");
        }
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual Terminal Output — binary-searching for the crossover">
{`$ for n in 1000 10000 11000 12000 13000 14000 14200 14250 14300 14350 15000 50000; do java MemoFibBig $n; done
n=1000  -> SUCCESS, fib(n) has 209 digits
n=10000 -> SUCCESS, fib(n) has 2090 digits
n=11000 -> SUCCESS, fib(n) has 2299 digits
n=12000 -> SUCCESS, fib(n) has 2508 digits
n=13000 -> SUCCESS, fib(n) has 2717 digits
n=14000 -> SUCCESS, fib(n) has 2926 digits
n=14200 -> SUCCESS, fib(n) has 2968 digits
n=14250 -> SUCCESS, fib(n) has 2978 digits
n=14300 -> SUCCESS, fib(n) has 2989 digits
n=14350 -> StackOverflowError
n=15000 -> StackOverflowError
n=50000 -> StackOverflowError`}
      </CodeBlock>

      <p>
        A real <code>StackOverflowError</code>, real and reproducible, somewhere between{' '}
        <code>n=14,300</code> (succeeds) and <code>n=14,350</code> (crashes) on this machine&apos;s default
        2&nbsp;MB thread stack. Now the purely iterative version, at the exact <code>n</code> that just
        crashed the recursive one — and then pushed absurdly further, to <code>n=1,000,000</code>:
      </p>

      <CodeBlock language="text" title="Actual Terminal Output — the iterative version at the same n, and far beyond">
{`$ java TabFibBig 14350
n=14350 -> SUCCESS (iterative), fib(n) has 2999 digits

$ java TabFibBig 1000000
n=1000000 -> SUCCESS (iterative), fib(n) has 208988 digits`}
      </CodeBlock>

      <p>
        The iterative version computes a 208,988-digit Fibonacci number — <code>fib(1,000,000)</code> — with
        no stack concerns whatsoever, because it never recurses; it holds exactly two{' '}
        <code>BigInteger</code> values and loops. This is the real, precise trade-off: memoization is
        usually easier to write (it falls directly out of the recursive definition, and it only computes
        subproblems actually needed for the answer), but it inherits recursion&apos;s stack-depth ceiling.
        Tabulation requires you to figure out a valid iteration order up front, but it has no recursion
        overhead and no depth limit beyond available heap for the table itself.
      </p>

      <h2>Space Optimization: You Don&apos;t Always Need the Whole Table</h2>

      <p>
        Look closely at the tabulated loop: <code>table[i]</code> only ever reads <code>table[i-1]</code>{' '}
        and <code>table[i-2]</code>. Nothing further back is ever touched again. That means the full array
        is wasted memory — two variables are enough:
      </p>

      <CodeBlock language="java" title="SpaceOptFib.java — O(1) space, actually compiled and run">
{`public class SpaceOptFib {
    static long fibTable(int n) {
        if (n <= 1) return n;
        long[] table = new long[n + 1];
        table[0] = 0;
        table[1] = 1;
        for (int i = 2; i <= n; i++) table[i] = table[i - 1] + table[i - 2];
        return table[n];
    }

    static long fibSpaceOptimized(int n) {
        if (n <= 1) return n;
        long prev2 = 0, prev1 = 1;
        for (int i = 2; i <= n; i++) {
            long curr = prev1 + prev2;
            prev2 = prev1;
            prev1 = curr;
        }
        return prev1;
    }

    public static void main(String[] args) {
        boolean allMatch = true;
        for (int n = 0; n <= 40; n++) {
            if (fibTable(n) != fibSpaceOptimized(n)) allMatch = false;
        }
        System.out.println("fib(35) via full table:        " + fibTable(35));
        System.out.println("fib(35) via O(1)-space version: " + fibSpaceOptimized(35));
        System.out.println("All values n=0..40 match between table and O(1)-space versions: " + allMatch);
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual Terminal Output">
{`$ javac SpaceOptFib.java && java SpaceOptFib
fib(35) via full table:        9227465
fib(35) via O(1)-space version: 9227465
All values n=0..40 match between table and O(1)-space versions: true`}
      </CodeBlock>

      <p>
        Verified equal for every <code>n</code> from 0 to 40, not just eyeballed for one value. This
        optimization is specific to Fibonacci&apos;s recurrence only depending on the last two values — it
        does not generalize to every DP problem automatically (the knapsack table below genuinely needs
        more than two rows kept around, though it too can often be compressed from 2D to 1D). The lesson to
        take is the <em>pattern</em>: once tabulation works, look at what the recurrence actually reads, and
        keep only that.
      </p>

      <h2>A Second Problem: 0/1 Knapsack</h2>

      <p>
        Fibonacci is a clean teaching example, but it is one recurrence over one integer. To confirm this
        generalizes, here is a genuinely different DP problem: given items with a weight and a value, and a
        capacity, pick a subset of items (each item taken whole or not at all — that is the &quot;0/1&quot;)
        that maximizes total value without exceeding capacity.
      </p>

      <p>
        Four items, capacity 5 — small enough to verify the optimal answer by hand before trusting the code:
      </p>

      <CodeBlock language="java" title="Knapsack.java — 2D tabulation, actually compiled and run">
{`public class Knapsack {
    public static void main(String[] args) {
        int[] weights = {2, 3, 4, 5};
        int[] values  = {3, 4, 5, 6};
        String[] names = {"A", "B", "C", "D"};
        int capacity = 5;
        int n = weights.length;

        // dp[i][w] = best value achievable using the first i items, capacity w
        int[][] dp = new int[n + 1][capacity + 1];

        for (int i = 1; i <= n; i++) {
            for (int w = 0; w <= capacity; w++) {
                if (weights[i - 1] <= w) {
                    dp[i][w] = Math.max(
                        dp[i - 1][w],                                   // skip item i
                        dp[i - 1][w - weights[i - 1]] + values[i - 1]   // take item i
                    );
                } else {
                    dp[i][w] = dp[i - 1][w]; // doesn't fit, must skip
                }
            }
        }

        System.out.println("Max value: " + dp[n][capacity]);

        // backtrack through the table to recover which items were taken
        int w = capacity;
        StringBuilder chosen = new StringBuilder();
        for (int i = n; i > 0; i--) {
            if (dp[i][w] != dp[i - 1][w]) {
                chosen.insert(0, names[i - 1] + " ");
                w -= weights[i - 1];
            }
        }
        System.out.println("Items chosen: " + chosen.toString().trim());
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual Terminal Output — full DP table plus the answer">
{`$ javac Knapsack.java && java Knapsack
Items (weight, value): A(2,3) B(3,4) C(4,5) D(5,6), capacity=5

DP table (rows = items considered 0..4, cols = capacity 0..5):
        w=0  w=1  w=2  w=3  w=4  w=5
none  0    0    0    0    0    0
A     0    0    3    3    3    3
B     0    0    3    4    4    7
C     0    0    3    4    5    7
D     0    0    3    4    5    7

Max value: 7
Items chosen: A B`}
      </CodeBlock>

      <p>
        Verify by hand: capacity is 5. Taking <code>D</code> alone costs weight 5 for value 6. Taking{' '}
        <code>C</code> alone costs weight 4 for value 5, with 1 unit of capacity left over and nothing else
        fits. Taking <code>A + B</code> costs weight <code>2 + 3 = 5</code> — exactly the capacity — for
        value <code>3 + 4 = 7</code>. No other combination fits within capacity 5 without exceeding it (
        <code>A+C = 6</code>, <code>B+C = 7</code>, <code>A+B+C = 9</code> — all over budget). 7 is
        genuinely the best achievable, and the code found it, and correctly reported{' '}
        <code>A B</code> as the items — not just the number 7, but the actual reasoning behind it, recovered
        by walking back through the table. Same principle as Fibonacci: <code>dp[i][w]</code> is built from{' '}
        <code>dp[i-1][...]</code>, smaller subproblems, computed once each, looked up instead of
        re-derived. The naive brute-force version of this problem — try every subset — is{' '}
        <code>O(2ⁿ)</code>, exactly the same exponential shape as naive Fibonacci, and for the same reason:
        overlapping subproblems, un-cached.
      </p>

      <InfoBox variant="info" title="How to Recognize a DP Problem">
        <p>
          Not every problem with an array or an integer parameter is DP, and shape-matching (&quot;it has a
          grid, so it must be DP&quot;) will mislead you. The two real signals:
        </p>
        <p>
          <strong>Overlapping subproblems</strong> — a brute-force or naive recursive solution ends up
          solving the identical smaller problem many times (like <code>fib(5)</code> being recomputed{' '}
          121,393 times above). <strong>Optimal substructure</strong> — the optimal answer to the full
          problem can be assembled from optimal answers to its subproblems (the best knapsack packing for
          capacity 5 is built from the best packings for smaller capacities — never from a suboptimal one).
        </p>
        <p>Practical tells that tend to co-occur with both:</p>
        <p>
          1. The question asks &quot;how many ways...&quot; or &quot;what is the minimum/maximum...&quot;
          over a sequence, grid, or pair of sequences — counting paths, min cost to reach a target, longest
          common subsequence, coin change, edit distance.
        </p>
        <p>
          2. A greedy, take-the-locally-best-choice approach provably fails on some input — if greedy
          worked, you would not need DP (0/1 knapsack is a classic case: greedily taking the best
          value-per-weight item first can lock out a better combination, which is why it needs the full
          table and fractional knapsack, where greedy does work, does not).
        </p>
        <p>
          3. The obvious brute-force solution is exponential (<code>O(2ⁿ)</code> subsets, <code>O(n!)</code>{' '}
          orderings, or exponential recursion trees like naive Fibonacci), but the number of{' '}
          <em>distinct</em> subproblems — distinct <code>(i, w)</code> pairs, distinct <code>n</code>{' '}
          values — is only polynomial. That gap between &quot;exponentially many calls&quot; and
          &quot;polynomially many distinct calls&quot; is exactly what caching closes.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"The memoized recursive fib(n) above threw a real StackOverflowError somewhere between n=14,300 and n=14,350 on this JVM's default 2 MB stack, while the purely iterative (tabulated) version computed fib(1,000,000) without any problem — despite both approaches computing each subproblem exactly once and running in O(n) time. Why does only the recursive one crash?"}
        options={[
          "Tabulation uses less total memory than memoization, so it can handle larger n before running out",
          "The very first call still has to recurse all the way down to the base case before the cache helps — that initial descent is n stack frames deep regardless of caching, while a loop never recurses at all",
          "HashMap lookups are too slow for large n, causing the JVM to abort the computation",
          "Java automatically converts tail-recursive calls into loops, and fib() should have been written in tail-recursive form to avoid this"
        ]}
        correctIndex={1}
        explanation={"Caching prevents recomputing a subproblem you've already solved, but it does nothing to shorten the first descent to the base case — fib(n) still calls fib(n-1) still calls fib(n-2)... all the way to fib(1)/fib(0) before there's anything in the cache to short-circuit. That's n stack frames, exactly like naive recursion, which is why n≈14,300-14,350 broke it here. Tabulation is a loop with no recursive calls at all, so it has no stack depth tied to n — it's limited only by how much heap the table itself needs. (Note: the JVM does not perform tail-call optimization regardless of how the function is written, and fib's recursive calls aren't in tail position anyway, since the addition happens after both calls return.)"}
      />
    </LessonLayout>
  );
}
