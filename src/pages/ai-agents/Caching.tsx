import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Caching() {
  return (
    <LessonLayout
      title="Prompt Caching"
      sectionId="ai-agents"
      lessonIndex={2}
      prev={{ path: '/ai-agents/context', label: 'Tokens, Context & Compaction' }}
      next={{ path: '/ai-agents/optimization', label: 'Optimizing Agents' }}
    >
      <h2>Caching Is a Prefix Match</h2>
      <p>
        The previous lesson established that every turn re-sends the whole conversation.
        Prompt caching makes the re-sent part cheap. Understanding exactly one thing
        about it prevents nearly every mistake people make: <strong>the cache is keyed on
        an exact byte prefix.</strong>
      </p>

      <p>
        The provider hashes your request from the beginning. As long as the leading bytes
        match something it already has, that portion is served from cache. The moment a
        byte differs, everything from that point on is new — including content that is
        itself unchanged, because it now sits behind a changed prefix.
      </p>

      <FlowChart
        title="One changed byte invalidates everything after it"
        chart={"graph TD\n  subgraph good[Cache hit]\n    A1[tools: identical] --> A2[system: identical] --> A3[history: identical] --> A4[new question]\n  end\n  subgraph bad[Cache miss from here down]\n    B1[tools: identical] --> B2[\"system: has a timestamp\"] --> B3[history: identical but now UNCACHED] --> B4[new question]\n  end\n  style A3 fill:#1a3329\n  style B2 fill:#3b1a1a\n  style B3 fill:#3b1a1a"}
      />

      <p>
        The right-hand case is the single most common caching bug. The history is
        byte-identical, but a clock reading in the system prompt sits in front of it, so
        none of it can be served from cache. Nothing errors. You simply pay full price
        forever and the feature appears not to work.
      </p>

      <h2>Render Order Decides What You Can Cache</h2>
      <p>
        A request is assembled in a fixed order, and that order is the design constraint:
      </p>

      <CodeBlock language="text" title="Request render order">
{`tools  ->  system  ->  messages

Stable content must come FIRST.
Volatile content must come AFTER the last cache breakpoint.`}
      </CodeBlock>

      <p>
        So the layout of a cacheable agent prompt follows directly. Tool definitions go
        first and must be generated deterministically — if you build your tool list by
        iterating a JavaScript <code>Set</code> or an object whose key order varies, the
        serialized JSON changes between runs and you have invalidated the cache before
        the system prompt is even reached.
      </p>

      <p>
        Then the frozen system content: role prompt, team standards, the architecture
        document. Then the breakpoint. Then anything that varies per request.
      </p>

      <CodeBlock language="typescript" title="Placing the breakpoint">
{`const response = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  system: [
    {
      type: "text",
      text: STABLE_PREFIX,              // role + standards + architecture doc
      cache_control: { type: "ephemeral" },   // <- breakpoint: cache up to here
    },
  ],
  // Everything below the breakpoint is free to vary per request.
  messages: [...history, { role: "user", content: task }],
});`}
      </CodeBlock>

      <p>
        A maximum of four breakpoints is allowed per request, and the minimum cacheable
        prefix is model-dependent — in the region of 512 to 4096 tokens. A prefix shorter
        than the minimum silently will not cache, which is worth knowing before you spend
        an afternoon debugging a small system prompt that never gets a hit.
      </p>

      <h2>What It Costs, and What It Saves</h2>
      <p>
        Writing to the cache costs <em>more</em> than ordinary input; reading from it
        costs much less. Published list prices, checked 2026-11-02:
      </p>

      <CodeBlock language="text" title="Cache pricing, per million tokens, as of 2026-11-02">
{`model              base input   5m write   1h write   cache read   output
Claude Opus 5.5    $4.00        $5.00      $8.00      $0.20        $20.00
Claude Sonnet 5.5  $2.00        $2.50      $4.00      $0.10        $10.00
Claude Haiku 5.5   $0.10        $0.125     $0.20      $0.01        $0.50
                   (Haiku rates shown are for prompts up to 100,000 tokens)

5-minute write = 1.25x base input.   1-hour write = 2x base input.
Cache read     = 0.1x base input, and 0.05x on Opus 5.5 and Sonnet 5.5.`}
      </CodeBlock>

      <p>
        A read on Sonnet 5.5 is twenty times cheaper than sending the same tokens
        uncached. That ratio is what makes long agent runs affordable, so it is worth
        working through what it does to a realistic run.
      </p>

      <p>
        Take a 40-turn engineer run with a 20,000-token stable prefix — role prompt,
        coding standards, architecture document — re-sent on every turn. That is 800,000
        prefix tokens across the run.
      </p>

      <CodeBlock language="text" title="Worked example: 40 turns, 20k stable prefix, Sonnet 5.5">
{`Uncached
  800,000 tokens x $2.00/MTok                       = $1.600

Cached
  one write:    20,000 x $2.50/MTok                 = $0.050
  39 reads:    780,000 x $0.10/MTok                 = $0.078
                                                      -------
                                                      $0.128

Same tokens, same model, same work. About 12x less on the prefix.`}
      </CodeBlock>

      <p>
        Note that the saving comes from the <em>repetition</em>, not from the size. A
        prefix sent once is cheaper uncached, because you pay the 1.25x write premium and
        never read it back. Caching pays off from the first read on the 5-minute window,
        and from the second read on the 1-hour window.
      </p>

      <h2>The Multi-Agent Cache Trap</h2>
      <p>
        This one is specific to multi-agent designs and costs real money quietly, so it
        deserves its own treatment.
      </p>

      <p>
        Suppose nine agents share the same project brief, architecture document and team
        standards — tens of thousands of tokens of identical material. Each agent
        assembles its prompt as &quot;my role prompt, then the shared context&quot;.
        Every agent's prefix therefore begins with something different.
      </p>

      <InfoBox variant="warning" title="Nine cache entries, zero shared reads">
        Caches are keyed on the exact byte prefix, so nine agents with nine different
        leading role prompts write nine separate cache entries and read none of each
        other's. You pay the 1.25x write premium nine times over for the same shared
        content, and the read discount never arrives. The bill goes <em>up</em> relative
        to not caching at all.
      </InfoBox>

      <p>
        The fix is in prompt assembly, not in the provider or the model. Put the
        identical shared block <strong>first</strong>, set the breakpoint at the end of
        it, and append the role-specific text after:
      </p>

      <CodeBlock language="text" title="Prompt assembly order for a shared-context team">
{`WRONG                                RIGHT
  role prompt (differs per agent)       shared standards  (identical)
  shared standards  (identical)         architecture doc  (identical)
  architecture doc  (identical)         project brief     (identical)
  project brief     (identical)         ---- breakpoint ----
  ticket                                role prompt       (differs)
                                        ticket            (differs)

9 cache entries, 0 reads of each      1 cache entry, 8 agents read it
other's shared content`}
      </CodeBlock>

      <p>
        This is why the prompt assembly order in a harness is a documented design
        decision rather than an implementation detail. It has a dollar value, it is
        invisible from the outside, and nothing warns you when it is wrong.
      </p>

      <h2>Verifying It Actually Works</h2>
      <p>
        Caching fails silently in both directions — a miss costs money without erroring,
        and a hit is invisible unless you look. So never assume it works. Read the usage
        payload:
      </p>

      <CodeBlock language="typescript" title="The only check that matters">
{`console.log(response.usage.cache_creation_input_tokens); // written to cache
console.log(response.usage.cache_read_input_tokens);     // served from cache
console.log(response.usage.input_tokens);                // paid at full price`}
      </CodeBlock>

      <p>
        If <code>cache_read_input_tokens</code> is zero across repeated requests that
        should share a prefix, something upstream is rewriting it. Here is what working
        caching looks like in a real harness ledger — four delegated runs of the same
        small task:
      </p>

      <CodeBlock language="text" title="Measured: cache behaviour across four runs">
{`run | input_tokens | cache_read | cache_write | output_tokens
----+--------------+------------+-------------+--------------
  1 |           14 |    168,378 |      16,831 |         1,823
  2 |            8 |     93,359 |      14,921 |           756
  3 |            8 |     92,305 |      15,218 |           722
  5 |            8 |     92,509 |      15,197 |           713`}
      </CodeBlock>

      <p>
        Two things to read off that table. First, <code>input_tokens</code> is
        single-digit — essentially everything is being served from cache or written to
        it, which is what you want. Second, runs 2, 3 and 5 are nearly identical, and
        that stability is itself the signal: a prefix that varied would show as a
        wandering cache-read figure.
      </p>

      <InfoBox variant="tip" title="Cache reads are not free, so watch the absolute numbers too">
        Run 1 moved 168,378 cached tokens. At Sonnet 5.5 read rates that is under two
        cents, but the figure is a useful proxy for how much context the run was dragging
        around. A cache-read count that climbs run over run means the prefix is growing,
        and cheap tokens in large enough quantity still add up.
      </InfoBox>

      <h2>The Silent Invalidators</h2>
      <p>
        Everything on this list changes the prefix without looking like it does. When
        cache reads are unexpectedly zero, work down it:
      </p>

      <ul>
        <li><strong>A clock in the system prompt.</strong> <code>Date.now()</code>, <code>new Date().toISOString()</code>, &quot;today is...&quot;. The classic.</li>
        <li><strong>A per-request id.</strong> A UUID, a trace id, a session counter injected into the system prompt.</li>
        <li><strong>Non-deterministic serialization.</strong> Tool schemas built from a map or set with unstable key order.</li>
        <li><strong>A varying tool list.</strong> Adding one role-specific tool changes the <code>tools</code> block, which renders first and invalidates everything.</li>
        <li><strong>Editing earlier turns.</strong> Any rewrite of history changes the prefix from that point on.</li>
        <li><strong>A mid-conversation change to top-level settings.</strong> Changing the top-level effort setting mid-run resets the messages cache.</li>
        <li><strong>A model switch.</strong> Caches are scoped to a model. Routing the same conversation to a cheaper model starts from an empty cache.</li>
      </ul>

      <p>
        That last point has a design consequence worth stating plainly, because it cuts
        against an obvious-looking optimization: a multi-model cost cascade forfeits cache
        reuse across its models. Before building one, measure the simpler alternative —
        the capable model at lower effort — which keeps a single cache namespace.
      </p>

      <h2>Mid-Conversation Instructions Without Breaking the Cache</h2>
      <p>
        A practical problem: you need to inject an operator instruction partway through a
        run — a mode switch, a budget warning, a correction. Editing the top-level system
        prompt would invalidate the entire cached history.
      </p>

      <p>
        On current models you can append a <code>system</code>-role message to the
        <code>messages</code> array instead. It carries operator authority, it lands after
        the cached prefix, and the history stays cached.
      </p>

      <CodeBlock language="typescript" title="An operator instruction that preserves the cache">
{`const response = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  system: [
    { type: "text", text: STABLE_PREFIX, cache_control: { type: "ephemeral" } },
  ],
  messages: [
    ...history,
    { role: "user", content: userMessage },
    // Appended, not edited in. The cached prefix above is untouched.
    { role: "system", content: "Budget at 80 percent. Finish the current step and stop." },
  ],
});`}
      </CodeBlock>

      <p>
        There are placement rules — such a message must follow a user message and cannot
        be the first entry — and it is not supported on every model, so check before
        relying on it. But as a pattern it is the correct answer to &quot;how do I tell a
        running agent something&quot;, and it is also the injection-safe channel: content
        that arrives this way is distinguishable from content an agent read out of a file.
      </p>

      <InfoBox variant="success" title="What to take from this lesson">
        Caching is a prefix match, so the design question is always &quot;what is stable,
        and is it first?&quot;. Put identical content before the breakpoint and varying
        content after it; generate tool schemas deterministically; keep clocks and ids out
        of the system prompt; and confirm with <code>cache_read_input_tokens</code> rather
        than assuming. In a multi-agent system, shared context goes first or the cache
        works against you.
      </InfoBox>
    </LessonLayout>
  );
}
