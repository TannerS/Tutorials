import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function Hashing() {
  return (
    <LessonLayout
      title="Hash Tables, Deep Dive"
      sectionId="dsa"
      lessonIndex={6}
      prev={{ path: '/dsa/graphs', label: 'Graphs & Graph Traversal' }}
      next={{ path: '/dsa/dynamic-programming', label: 'Dynamic Programming' }}
    >
      <p>
        A hash table is a contiguous array plus a function that turns a key into an array index.
        That is the entire trick — &quot;search this list for a match&quot; becomes &quot;compute
        an index and look there,&quot; which is what makes insert/lookup average O(1) instead of
        O(n). The Java Collections lesson already covers the <em>usage</em> pitfalls of
        <code>HashMap</code> — a broken <code>equals()</code>/<code>hashCode()</code> contract
        silently making lookups fail. This lesson opens the box: how the array-and-index
        arithmetic actually works underneath, and the two or three ways it breaks mechanically if
        you build one yourself.
      </p>

      <InfoBox variant="info" title="The Mechanism, In One Sentence">
        <p>
          <code>index = spread(key.hashCode()) mod capacity</code> — everything in this lesson is
          about what goes wrong in that one line and how real hash tables avoid it.
        </p>
      </InfoBox>

      <h2>Build the Minimal Version: An Array of Buckets</h2>

      <p>
        Strip a hash table down to its essence and it is an <code>Object[]</code> plus a
        <code>put</code>/<code>get</code> pair that both compute the same index from a key. The
        first, most natural way to turn a (possibly huge, possibly negative) <code>int</code>{' '}
        hash code into a valid array index is Java&apos;s <code>%</code> operator:
      </p>

      <CodeBlock language="java" title="BrokenTable — looks reasonable, has a live bug">
{`class BrokenTable {
    Object[] buckets = new Object[4];

    void put(String key, String value) {
        int index = key.hashCode() % buckets.length; // looks fine...
        buckets[index] = value;
    }
}`}
      </CodeBlock>

      <h2>The Negative-hashCode Bug</h2>

      <p>
        <code>hashCode()</code> returns a Java <code>int</code> — a signed, 32-bit, two&apos;s
        complement number. Nothing in the <code>hashCode()</code> contract promises a positive
        result, and plenty of ordinary <code>String</code>s hash to negative numbers. Java&apos;s{' '}
        <code>%</code> is a <em>remainder</em> operator, not a mathematical modulo: the result
        takes the sign of the <strong>dividend</strong>, so a negative <code>hashCode()</code>{' '}
        produces a negative remainder. Feed that straight into an array index and you get{' '}
        <code>buckets[-3]</code> — a compiling, silently-wrong line that throws at runtime, and
        only for the unlucky keys.
      </p>

      <p>
        Ran this for real on JDK 26 — <code>"alpha"</code> hashes positive and works;{' '}
        <code>"banana"</code> hashes negative and blows up the same table, same code path:
      </p>

      <CodeBlock language="java" title="Driver — same BrokenTable, two ordinary String keys">
{`BrokenTable broken = new BrokenTable();
broken.put("alpha", "1");
broken.put("banana", "2");`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — javac MiniHashTable.java && java MiniHashTable">
{`=== BrokenTable (raw %) ===
  key="alpha" hashCode=92909918 index=2
  key="banana" hashCode=-1396355227 index=-3
  THREW: java.lang.ArrayIndexOutOfBoundsException: Index -3 out of bounds for length 4`}
      </CodeBlock>

      <p>
        <code>"banana".hashCode()</code> is <code>-1396355227</code>. <code>-1396355227 % 4</code>{' '}
        is <code>-3</code> in Java (Python&apos;s <code>%</code> would give <code>1</code> — this
        is a real language-to-language gotcha, not just a Java quirk). <code>buckets[-3]</code> is
        not a valid array index, so the JVM throws <code>ArrayIndexOutOfBoundsException</code>{' '}
        instead of silently misbehaving — which is the best-case failure mode. Worse would be a
        table that uses the sign bit some other way and corrupts a different bucket instead of
        crashing.
      </p>

      <p>Two standard fixes, both mechanical, not usage advice:</p>

      <CodeBlock language="java" title="Fix 1 — Math.floorMod (works for any capacity)">
{`int index = Math.floorMod(key.hashCode(), buckets.length);
// floorMod's result always takes the sign of the DIVISOR — for a positive
// capacity, that means the result is always >= 0. No branch, no abs().`}
      </CodeBlock>

      <CodeBlock language="java" title="Fix 2 — bitmask (what real HashMap does; needs capacity = power of 2)">
{`int index = key.hashCode() & (buckets.length - 1);
// AND with (capacity - 1) keeps only the low bits and discards the sign
// bit entirely, so the result is always in [0, capacity). Only valid
// when capacity is a power of two — that's why HashMap's backing array
// is always sized 16, 32, 64, ... and never anything else.`}
      </CodeBlock>

      <p>Same driver, same negative-hashing key, run against the fixed table — no exception:</p>

      <CodeBlock language="text" title="Real output — FixedTable using Math.floorMod">
{`=== FixedTable (Math.floorMod) ===
  key="alpha" hashCode=92909918 index=2
  key="banana" hashCode=-1396355227 index=1
No exception — both keys landed in valid buckets.`}
      </CodeBlock>

      <p>
        This is also why the Collections lesson&apos;s <code>h ^ (h &gt;&gt;&gt; 16)</code>{' '}
        bit-spreading step exists before the mask — masking with <code>(capacity - 1)</code> only
        looks at the low bits of the hash, so if a hash code&apos;s entropy lives mostly in its
        high bits, masking alone would send lots of distinct keys to the same low bits. Spreading
        the high bits down first, then masking, is the two-step version of the same
        &quot;turn a hash into a safe index&quot; problem this section is about.
      </p>

      <h2>Collision Handling: Separate Chaining</h2>

      <p>
        A good hash function still cannot avoid collisions once the number of possible keys
        exceeds the number of buckets (pigeonhole principle) — the practical question is only
        <em>when</em> two keys land on the same index, not <em>if</em>. The two standard answers
        are separate chaining (each bucket holds a small collection of everything that hashed
        there) and open addressing (each bucket holds one slot; a collision makes you probe for
        the next free one). Java&apos;s <code>HashMap</code> uses chaining — a linked list per
        bucket, promoted to a red-black tree per bucket once that list gets long enough on a
        large-enough table. A minimal chaining implementation:
      </p>

      <CodeBlock language="java" title="Separate chaining — each bucket is a small linked list">
{`class ChainingTable {
    static class Node {
        String key;
        String value;
        Node next;
        Node(String key, String value, Node next) {
            this.key = key; this.value = value; this.next = next;
        }
    }

    Node[] buckets = new Node[16];

    void put(String key, String value) {
        int index = Math.floorMod(key.hashCode(), buckets.length);
        for (Node n = buckets[index]; n != null; n = n.next) {
            if (n.key.equals(key)) { n.value = value; return; } // overwrite
        }
        buckets[index] = new Node(key, value, buckets[index]); // prepend
    }

    String get(String key) {
        int index = Math.floorMod(key.hashCode(), buckets.length);
        for (Node n = buckets[index]; n != null; n = n.next) {
            if (n.key.equals(key)) return n.value;
        }
        return null;
    }
}`}
      </CodeBlock>

      <p>
        Notice <code>get</code> and <code>put</code> compute the same index and then walk a
        chain that, on average, holds only a handful of entries — that chain walk (comparing
        <code>equals()</code> one node at a time) is exactly the step the Collections lesson
        covers from the usage side. This lesson&apos;s point is narrower: the chain exists at all
        because collisions are mathematically unavoidable, not a bug to be &quot;fixed away.&quot;
      </p>

      <h2>Load Factor: Why HashMap Resizes</h2>

      <p>
        A table with a fixed 16 buckets and 10,000 entries has chains averaging 625 entries each —
        every lookup degrades toward O(n). Real hash tables track a{' '}
        <strong>load factor</strong> (<code>size / capacity</code>) and grow the backing array
        before chains get that long. Java&apos;s documented default for <code>HashMap</code> is a
        load factor of <strong>0.75</strong> with an initial capacity of 16 — once{' '}
        <code>size</code> exceeds <code>capacity &times; 0.75</code>, the table allocates a new,
        double-size bucket array and <strong>rehashes every existing entry</strong> into it (every
        key&apos;s index has to be recomputed because <code>capacity</code>, and therefore the
        mask/modulus, changed). That single resize is an O(n) pause, but it happens rarely enough
        (capacity doubles each time) that the <em>amortized</em> cost per insert stays O(1) — the
        same trick <code>ArrayList</code> growth relies on. If you know you are about to insert
        several thousand entries, constructing the map with a large-enough initial capacity avoids
        those resize pauses entirely.
      </p>

      <h2>Why Hash Function Quality Matters</h2>

      <p>
        Every O(1)-on-average claim about hash tables is conditional on the hash function spreading
        keys roughly uniformly across buckets. Nothing in the <code>hashCode()</code> contract
        requires that — a hash function that always returns <code>1</code> is 100% contract-legal
        (equal objects still produce equal hash codes; it just never bothers to distinguish
        unequal ones). Plug that into any of the tables above and every key collides into the same
        bucket, every chain degenerates into a plain linked list, and every operation silently
        becomes O(n) — no exception, no warning, just a hash table that quietly performs like a
        list someone forgot to index. This is also a real attack surface, not just a theoretical
        one: &quot;hash flooding&quot; attacks deliberately submit keys engineered to collide, to
        turn a server&apos;s O(1) map operations into O(n) ones under load. It is exactly why
        production <code>HashMap</code> has that chain-to-tree promotion mentioned above — a
        pathological bucket degrades to O(log n) instead of O(n) as a defense-in-depth measure, not
        because trees are the normal case.
      </p>

      <InfoBox variant="tip" title="The One-Sentence Version of This Whole Lesson">
        <p>
          A hash table&apos;s speed comes from turning &quot;search&quot; into &quot;compute an
          index&quot; — every topic above is either how that index gets computed safely (masking,
          not raw <code>%</code>), what happens when two keys compute the same index (chaining),
          or what happens when the index math stops being cheap or stops being uniform (resizing,
          bad hash functions).
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={
          "A minimal hash table has 4 buckets and computes the index as " +
          "`int index = key.hashCode() % buckets.length;`. For a key whose " +
          "hashCode() is -1396355227, what happens when that line runs?"
        }
        options={[
          "index becomes 1, and the key is stored normally — % always returns a non-negative result in Java",
          "index becomes -3, and buckets[-3] throws ArrayIndexOutOfBoundsException — Java's % takes the sign of the dividend, so a negative hashCode() can produce a negative remainder",
          "The code fails to compile, because hashCode() is not allowed to return a negative int",
          "index silently wraps around to a valid positive bucket automatically, since arrays in Java support negative indexing from the end"
        ]}
        correctIndex={1}
        explanation={
          "Java's % is a remainder operator: the sign of the result matches the sign of the dividend, not the divisor. -1396355227 % 4 is -3, and buckets[-3] is not a legal array index, so this throws at runtime — it compiles fine and only fails for keys whose hash happens to be negative. The fix is Math.floorMod(key.hashCode(), buckets.length), which always takes the sign of the divisor (non-negative for a positive capacity), or key.hashCode() & (buckets.length - 1) when the capacity is a power of two, which is what java.util.HashMap actually does."
        }
      />
    </LessonLayout>
  );
}
