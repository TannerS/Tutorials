import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function Tries() {
  return (
    <LessonLayout
      title="Tries (Prefix Trees)"
      sectionId="dsa"
      lessonIndex={7}
      prev={{ path: '/dsa/heaps', label: 'Heaps & Priority Queues, From Scratch' }}
      next={{ path: '/dsa/graphs', label: 'Graphs & Graph Traversal' }}
    >
      <p>
        Think about how a search bar suggests completions while you are still typing. Type{' '}
        <code>&quot;cat&quot;</code> and it offers <strong>catalog</strong>, <strong>category</strong>,{' '}
        <strong>caterpillar</strong> — every word that <em>starts with</em> what you have typed so far. A{' '}
        <strong>Trie</strong> (pronounced &quot;try,&quot; from re<strong>trie</strong>val) is a tree built
        specifically to make that operation fast. It is not a general-purpose tree like the ones from the
        last lesson — it has one job: store a set of strings so that &quot;does anything start with this
        prefix&quot; is cheap to answer.
      </p>

      <h2>The Core Idea, Before Any Code</h2>

      <p>
        In a Trie, <strong>each node represents one character</strong>, not a whole word. A path starting
        at the root and walking down through several nodes spells out a word, letter by letter, one letter
        per edge you follow. The word does not live in a single node — it lives in the <em>path</em>.
      </p>

      <p>
        The useful consequence: if two words share a beginning — <code>&quot;cat&quot;</code> and{' '}
        <code>&quot;car&quot;</code> both start with <code>&quot;ca&quot;</code> — they{' '}
        <strong>literally share the same nodes</strong> for that common part, and only branch apart at the
        first letter where they differ. You are not storing <code>&quot;cat&quot;</code> and{' '}
        <code>&quot;car&quot;</code> as two separate strings sitting side by side; you are storing one
        shared <code>c &rarr; a</code> path that then splits into a <code>t</code> branch and an{' '}
        <code>r</code> branch. That shared-prefix structure is the entire idea. Everything else in this
        lesson is just making it precise enough to code.
      </p>

      <InfoBox variant="info" title="You already have the vocabulary for this">
        <p>
          A Trie is a tree — root, children, leaves, all the same words from the last lesson. The only new
          idea is what a node <em>means</em>: instead of holding a value like <code>50</code> or{' '}
          <code>&quot;apple&quot;</code>, a Trie node holds a single character, and meaning only accumulates
          as you walk a path of them.
        </p>
      </InfoBox>

      <h2>Building One By Hand: The Diagram</h2>

      <p>
        Insert four words, one at a time, and watch the shared structure emerge: <code>&quot;cat&quot;</code>,{' '}
        <code>&quot;car&quot;</code>, <code>&quot;cats&quot;</code>, <code>&quot;dog&quot;</code>.
      </p>

      <p>
        <code>&quot;cat&quot;</code> creates a fresh path <code>c &rarr; a &rarr; t</code>. Then{' '}
        <code>&quot;car&quot;</code> walks in from the root: a <code>c</code> node already exists, reuse it;
        an <code>a</code> node already exists under it, reuse that too; but there is no <code>r</code> under{' '}
        <code>a</code> yet, so a new node gets created there. <code>&quot;cat&quot;</code> and{' '}
        <code>&quot;car&quot;</code> now share the exact same <code>c</code> and <code>a</code> nodes and
        only diverge at the third letter. Then <code>&quot;cats&quot;</code> walks in: <code>c</code>,{' '}
        <code>a</code>, and <code>t</code> all already exist (reused, all three), and only the trailing{' '}
        <code>s</code> is new — it hangs one level <em>below</em> the existing <code>t</code> node. Finally{' '}
        <code>&quot;dog&quot;</code> shares nothing with the others, so it builds its own separate{' '}
        <code>d &rarr; o &rarr; g</code> branch straight off the root.
      </p>

      <p>
        One detail matters as much as the branching: a node sitting on the path is not automatically a
        complete word. <code>&quot;cat&quot;</code> is a real inserted word, but so is{' '}
        <code>&quot;cats&quot;</code> — which means the <code>t</code> node has to somehow remember{' '}
        <em>&quot;a real word ends right here&quot;</em> while <em>also</em> having a child (
        <code>s</code>) hanging below it for the longer word. A node needs an explicit{' '}
        <strong>&quot;is this the end of a word&quot;</strong> flag — child pointers alone cannot tell you
        that, because &quot;has children&quot; and &quot;is a complete word&quot; are independent facts. In
        the diagram below, double-circled nodes have that flag set (a real word ends there); single-circled
        nodes are pass-through — they exist only to connect letters toward something longer.
      </p>

      <FlowChart
        title="Trie after inserting: cat, car, cats, dog (double circle = end of a real word)"
        chart={
          'graph TD\n' +
          '  R((root)) --> C((c))\n' +
          '  C --> CA((a))\n' +
          '  CA --> CAT(((t)))\n' +
          '  CA --> CAR(((r)))\n' +
          '  CAT --> CATS(((s)))\n' +
          '  R --> D((d))\n' +
          '  D --> DO((o))\n' +
          '  DO --> DOG(((g)))\n' +
          '  style CAT fill:#1a3329,stroke:#4ade80\n' +
          '  style CAR fill:#1a3329,stroke:#4ade80\n' +
          '  style CATS fill:#1a3329,stroke:#4ade80\n' +
          '  style DOG fill:#1a3329,stroke:#4ade80'
        }
      />

      <p>
        Read the highlighted (green, double-circled) nodes as the four words you actually get back:
        following <code>root &rarr; c &rarr; a &rarr; t</code> spells <code>&quot;cat&quot;</code> and that
        node is flagged as an end-of-word; continuing one more step to{' '}
        <code>root &rarr; c &rarr; a &rarr; t &rarr; s</code> spells <code>&quot;cats&quot;</code>, a
        <em> different</em> end-of-word node one level deeper on the <em>same</em> path;{' '}
        <code>root &rarr; c &rarr; a &rarr; r</code> spells <code>&quot;car&quot;</code>, sharing the first
        two letters with both cat words and then splitting off; and{' '}
        <code>root &rarr; d &rarr; o &rarr; g</code> spells <code>&quot;dog&quot;</code> on a completely
        separate branch. The plain <code>c</code> and <code>a</code> nodes are never flagged — nobody
        inserted <code>&quot;c&quot;</code> or <code>&quot;ca&quot;</code> as a word on its own, so walking
        to them successfully only proves &quot;something starts with this,&quot; not &quot;this is a
        complete word.&quot; Hold onto that distinction — it is the whole rest of the lesson.
      </p>

      <h2>Implementing It — Matching The Diagram Exactly</h2>

      <p>
        A <code>TrieNode</code> needs exactly two things: a map from character to child node, and the{' '}
        <code>isEndOfWord</code> flag from the diagram. A <code>Trie</code> is just a reference to a root
        node plus three operations built on one shared helper — <code>walk</code>, which follows a string
        character by character for as long as matching nodes exist and returns <code>null</code> the moment
        one is missing:
      </p>

      <CodeBlock language="java" title="TrieDemo.java — TrieNode + Trie, matching the diagram above">
{`import java.util.HashMap;
import java.util.Map;

public class TrieDemo {

    static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        boolean isEndOfWord = false;
    }

    static class Trie {
        private final TrieNode root = new TrieNode();

        void insert(String word) {
            TrieNode current = root;
            for (char c : word.toCharArray()) {
                // reuse the existing child if there is one (this is the sharing
                // from the diagram); create a fresh node only when needed
                current = current.children.computeIfAbsent(c, k -> new TrieNode());
            }
            current.isEndOfWord = true; // mark the LAST node on the path as a real word
        }

        // exact match: the path must exist AND end exactly on a flagged word
        boolean search(String word) {
            TrieNode node = walk(word);
            return node != null && node.isEndOfWord;
        }

        // prefix match: the path just has to exist -- isEndOfWord is irrelevant
        boolean startsWith(String prefix) {
            return walk(prefix) != null;
        }

        // shared traversal: follow the string one character at a time,
        // bail out to null the instant a character has no matching child
        private TrieNode walk(String s) {
            TrieNode current = root;
            for (char c : s.toCharArray()) {
                current = current.children.get(c);
                if (current == null) return null;
            }
            return current;
        }
    }
}`}
      </CodeBlock>

      <p>
        Notice <code>search</code> and <code>startsWith</code> share the exact same <code>walk</code>{' '}
        helper — the only difference between them is the one extra <code>.isEndOfWord</code> check that{' '}
        <code>search</code> makes after the walk succeeds. That one line is the entire distinction between
        the two operations, and it is worth proving concretely rather than trusting the comment. Inserting
        the same four words from the diagram and then running both operations against real words, real
        prefixes, and strings that were never inserted at all, compiled and run against JDK{' '}
        <code>26.0.1</code>:
      </p>

      <CodeBlock language="text" title="Real console output — javac TrieDemo.java && java TrieDemo">
{`=== Inserted: cat, car, cats, dog ===

=== search() -- exact word match, isEndOfWord must be true ===
search("cat") = true
search("car") = true
search("cats") = true
search("dog") = true
search("ca") = false
search("do") = false
search("ca ts") = false
search("bird") = false
search("caterpillar") = false

=== startsWith() -- prefix match, isEndOfWord irrelevant ===
startsWith("c") = true
startsWith("ca") = true
startsWith("cat") = true
startsWith("cats") = true
startsWith("car") = true
startsWith("d") = true
startsWith("do") = true
startsWith("dog") = true
startsWith("catss") = false
startsWith("bird") = false

=== THE key divergence: same input string, different answers ===
search("ca")       = false
startsWith("ca")   = true

search("cat")      = true
startsWith("cat")  = true`}
      </CodeBlock>

      <p>
        Every result matches the diagram exactly. <code>search(&quot;do&quot;)</code> is{' '}
        <code>false</code> even though <code>&quot;dog&quot;</code> is in the trie, because{' '}
        <code>&quot;do&quot;</code> was never inserted as its own word — the walk reaches the{' '}
        <code>o</code> node fine, but that node&apos;s <code>isEndOfWord</code> flag is unset, exactly like
        the plain (non-double-circled) nodes in the picture. <code>startsWith(&quot;catss&quot;)</code> and{' '}
        <code>startsWith(&quot;bird&quot;)</code> are <code>false</code> for the opposite reason — the walk
        itself fails partway through because no such child node exists at all.
      </p>

      <InfoBox variant="tip" title="The single most important line in this lesson">
        <p>
          <code>search(&quot;ca&quot;)</code> is <code>false</code>.{' '}
          <code>startsWith(&quot;ca&quot;)</code> is <code>true</code>. Same trie, same four inserted words,
          same input string <code>&quot;ca&quot;</code> — opposite answers. <code>startsWith</code> only
          asks &quot;does a path spelling this exist&quot;, which it does (it is the shared prefix of both{' '}
          <code>&quot;cat&quot;</code> and <code>&quot;car&quot;</code>).{' '}
          <code>search</code> additionally demands that the path <em>end</em> on a node flagged as a
          complete word, and nobody ever inserted <code>&quot;ca&quot;</code> by itself. This is exactly the
          operation a search-bar autocomplete needs — it calls something like{' '}
          <code>startsWith</code>, not <code>search</code>, because a user typing <code>&quot;ca&quot;</code>{' '}
          should still see suggestions even though <code>&quot;ca&quot;</code> is not itself a complete
          word.
        </p>
      </InfoBox>

      <h2>Why Not Just Use a HashSet&lt;String&gt;? (Stated Honestly)</h2>

      <p>
        It would be easy to walk away from this lesson thinking &quot;Tries are the fast version of string
        lookup.&quot; That is not true, and claiming it would violate the whole point of this site. For{' '}
        <strong>exact-match lookup alone</strong> — &quot;is this exact string in my set&quot; — a plain{' '}
        <code>HashSet&lt;String&gt;</code> is already O(1) average case. A Trie&apos;s <code>search</code>{' '}
        is O(L) where L is the length of the word being searched (one hop per character) — not faster than
        a hash set, and for short words the hash set&apos;s single hash-and-lookup is likely faster in
        practice once you account for the constant overhead of walking a map at every character.
      </p>

      <p>
        The Trie&apos;s real advantage is a query a <code>HashSet</code> cannot answer efficiently at all:{' '}
        <strong>&quot;give me everything that starts with this prefix.&quot;</strong> A Trie walks straight
        to the node representing the prefix — <code>O(L)</code> where L is the prefix length — and then
        explores everything reachable below that single node to collect matches. A{' '}
        <code>HashSet&lt;String&gt;</code> has no notion of &quot;near&quot; strings; the only way to
        answer the same question is to scan <em>every single stored string</em> and check whether each one
        starts with the prefix — O(n &times; L) across n stored words, no matter how large the set is.
        That gap is the entire reason Tries exist: not raw exact-match speed, but making prefix-shaped
        queries — autocomplete, spell-check candidate generation, IP routing tables — cheap instead of a
        full scan.
      </p>

      <InfoBox variant="warning" title="Be honest about the trade-off">
        <p>
          A Trie is not a strictly-better data structure than a hash set — it is a <em>different</em> shape
          of lookup, specialized for prefixes, usually at the cost of more memory (one node object per
          distinct character-path, versus one compact string per entry in a hash set). Reach for a Trie
          when the real question involves prefixes; reach for a <code>HashSet</code>/<code>HashMap</code>{' '}
          when it does not. Picking the fancier structure for a plain exact-match problem is a common
          over-engineering mistake, not a sign of expertise.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={
          "A Trie has \"cat\", \"car\", and \"cats\" inserted (matching the diagram in this lesson). What do search(\"ca\") and startsWith(\"ca\") each return?"
        }
        options={[
          'Both return true, because "ca" is a valid path in the trie',
          'Both return false, because "ca" was never inserted as its own word',
          'search("ca") returns false and startsWith("ca") returns true -- the path to the "a" node exists, but that node is not flagged as isEndOfWord',
          'search("ca") returns true and startsWith("ca") returns false -- search only needs the path to exist, and startsWith is stricter',
        ]}
        correctIndex={2}
        explanation={
          'startsWith just needs the walk to succeed -- and it does, since "c" then "a" are real nodes shared by "cat", "car", and "cats". search needs that same successful walk to ALSO land on a node with isEndOfWord = true, and nobody ever inserted "ca" by itself, so that flag is unset on the "a" node. This is exactly what the real Java run in this lesson showed: search("ca") = false, startsWith("ca") = true, on the identical trie.'
        }
      />
    </LessonLayout>
  );
}
