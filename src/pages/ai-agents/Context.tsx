import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Context() {
  return (
    <LessonLayout
      title="Tokens, Context & Compaction"
      sectionId="ai-agents"
      lessonIndex={1}
      prev={{ path: '/ai-agents/concepts', label: 'Model, Agent, Harness' }}
      next={{ path: '/ai-agents/caching', label: 'Prompt Caching' }}
    >
      <h2>The Model Remembers Nothing</h2>
      <p>
        A model call is stateless. The model appears to remember the conversation only
        because the harness pastes the entire history back in on every single call. When
        you send a chat message, everything before it goes along with it, again.
      </p>

      <p>
        This one fact drives most of the cost, latency and quality behaviour of agent
        systems, and almost every optimization in this section is a consequence of it.
      </p>

      <FlowChart
        title="What gets sent on each turn"
        chart={"graph TD\n  T1[Turn 1 sends: system + task] --> T2[Turn 2 sends: system + task + turn 1]\n  T2 --> T3[Turn 3 sends: system + task + turns 1 and 2]\n  T3 --> T4[Turn 4 sends: all of the above again]\n  style T4 fill:#3b1a1a"}
      />

      <h2>Growth Is Quadratic, Not Linear</h2>
      <p>
        Because turn <em>N</em> re-sends everything from turns 1 through <em>N</em>−1,
        the <strong>total</strong> input processed across a run grows with the square of
        the turn count, not in proportion to it. A run twice as long costs roughly four
        times as much input, not twice.
      </p>

      <p>
        This is visible in real measurements rather than being a theoretical worry. Two
        runs of the same task on a local model, recorded in a harness ledger, each took
        11 turns and accumulated this much input:
      </p>

      <CodeBlock language="text" title="Measured: cumulative input tokens for an 11-turn run">
{`run | provider | model       | turns | input_tokens | output_tokens
----+----------+-------------+-------+--------------+--------------
  4 | ollama   | gpt-oss:20b |    11 |       23,948 |         2,956
  6 | ollama   | gpt-oss:20b |    11 |       30,314 |         1,481`}
      </CodeBlock>

      <p>
        The task was a small bug fix in a handful of files. Nobody sent 24,000 tokens of
        anything — the agent read a couple of short files and ran a command. The input
        figure is almost entirely the same few thousand tokens being re-sent eleven
        times, each time with a little more appended.
      </p>

      <InfoBox variant="warning" title="The number that surprises people">
        Output tokens are the small column. Run 6 generated 1,481 tokens of output while
        consuming 30,314 tokens of input — a 20:1 ratio. Agent workloads are
        overwhelmingly <em>input</em> workloads, which is why caching input matters more
        than anything you can do about output, and why &quot;make the model terser&quot;
        is a weak lever.
      </InfoBox>

      <h2>Big Prompts Hurt Even When They Fit</h2>
      <p>
        Modern context windows are large — a million tokens on current frontier models —
        so it is tempting to stop thinking about this entirely. Fitting is not the same
        as working well. Four separate costs apply long before you hit the limit:
      </p>

      <ul>
        <li><strong>Money and time.</strong> Input is billed per token and processed per token. Both scale with what you send.</li>
        <li><strong>Attention dilution.</strong> Accuracy drops on details buried in the middle of a very long input. The relevant line is present but not attended to.</li>
        <li><strong>Stale contradictions.</strong> Turn 3 said the function is called <code>getUser</code>; turn 30 renamed it. Both are in the prompt, and nothing marks which is current.</li>
        <li><strong>Distraction.</strong> Old tool output — a 400-line directory listing from twenty turns ago — competes for attention with the actual task.</li>
      </ul>

      <p>
        The useful mental model is that the context window is RAM and your database and
        files are disk. Loading everything into RAM because it technically fits is not a
        design; it is the absence of one. Load what this task needs.
      </p>

      <h2>Six Ways Harnesses Stay Inside the Budget</h2>
      <p>
        These are the standard moves, roughly in order of how much they buy you.
      </p>

      <ul>
        <li>
          <strong>Small, scoped tasks.</strong> One ticket per run. When the run ends,
          its context is thrown away deliberately. This is the big one — it bounds the
          quadratic growth by keeping <em>N</em> small, rather than trying to make each
          turn cheaper.
        </li>
        <li>
          <strong>Memory outside the context.</strong> Notes, decisions and history live
          in a database. The harness loads the relevant slice, the way you would run a
          query instead of a table scan.
        </li>
        <li>
          <strong>Narrow reads.</strong> Give agents <code>grep</code>, &quot;read lines
          40 to 80&quot;, and directory listings rather than tools that return whole
          files. A tool that can only return 200 lines cannot blow the budget.
        </li>
        <li>
          <strong>Compaction.</strong> When a long run fills up, summarize older turns
          and drop stale tool output first.
        </li>
        <li>
          <strong>Prompt caching.</strong> Stable content is cached by the provider so
          re-sending it costs a fraction. This is the whole of the next lesson.
        </li>
        <li>
          <strong>Cheap models for cheap jobs.</strong> Classification, summarizing and
          triage do not need a frontier model.
        </li>
      </ul>

      <h2>Compaction, and the Trap Inside It</h2>
      <p>
        Compaction replaces old turns with a summary. The order matters: drop stale tool
        results first, because they are bulky and rarely needed twice, and keep the task
        definition and the most recent turns.
      </p>

      <p>
        Here is the trap, and it is the most important idea in this lesson. Compaction is
        lossy by design, and the agent does not know in advance which detail it is about
        to lose. If a decision exists only inside the conversation when compaction
        happens, it is gone. Not corrupted — gone, while everyone involved continues to
        believe the system has memory.
      </p>

      <InfoBox variant="warning" title="Externalize before compacting">
        The rule that fixes this: anything that must survive gets <em>written out</em>
        before the context holding it is compressed. A tool like
        <code>record_decision</code> or <code>finish_run</code> is not bookkeeping — it
        is the save operation. Treat an agent's context like an unsaved buffer, because
        that is exactly what it is.
      </InfoBox>

      <p>
        This reframes a design question that otherwise looks like paperwork. &quot;Why
        must every run end by writing a handoff note?&quot; Because the run is about to
        be discarded, and the note is the only part that persists. A harness can enforce
        this: a run that ends without writing its note is recorded as failed, however
        well the work went.
      </p>

      <h2>Who Compacts Depends on Who Owns the Loop</h2>
      <p>
        If your harness owns the loop, compaction is your job and your choice. If you are
        delegating to something that runs its own loop — a coding CLI, for instance — it
        compacts on its own schedule and does not ask you. There is also a server-side
        option on the Claude API, where the API summarizes earlier context as it
        approaches a threshold.
      </p>

      <p>
        Prefer the provider's own context management over a hand-rolled summarizer where
        you have the choice. It clears stale tool results first, which is the order you
        wanted anyway, and hand-editing earlier turns has a second cost: on current
        models a thinking block is only valid in the conversation that produced it, so
        rewriting history can invalidate the model's own reasoning.
      </p>

      <CodeBlock language="typescript" title="Server-side compaction: let the API do it">
{`// Beta on current models. The API summarizes earlier context as the
// conversation approaches the trigger threshold.
const response = await client.beta.messages.create({
  betas: ["compact-2026-01-12"],
  model: "claude-opus-5-5",
  max_tokens: 16000,
  messages,
  context_management: { edits: [{ type: "compact_20260112" }] },
});

// CRITICAL: append the whole content array, not just the text you want.
// Compaction blocks live in response.content, and the API needs them back to
// know what it already replaced. Extracting only the string silently loses
// the compaction state and the conversation starts growing again.
messages.push({ role: "assistant", content: response.content });`}
      </CodeBlock>

      <p>
        That last comment is the kind of mistake that produces no error. Everything
        appears to work; the context simply stops being managed, and you find out from
        your token bill rather than from a stack trace.
      </p>

      <InfoBox variant="tip" title="Context editing is not compaction — and it takes a different beta header">
        <p>
          Two features that sound alike. <strong>Compaction</strong> summarizes old content.
          <strong>Context editing</strong> (<code>clear_tool_uses_20250919</code>,
          <code>clear_thinking_20251015</code>) deletes it outright. Clearing is cheaper and
          lossier; use it for stale tool results you are certain nobody needs again, and
          compaction for conversation you want condensed rather than dropped.
        </p>
        <p>
          They also travel under <em>different</em> beta headers, which is the trap when you
          move from one to the other. The example above sends{' '}
          <code>compact-2026-01-12</code>; context editing needs{' '}
          <code>context-management-2025-06-27</code>. Swapping the strategy type while
          leaving the header alone is the obvious edit and it returns a 400.
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="Context editing: clearing, not summarizing">
{`// Different beta header from compaction, same context_management field.
const response = await client.beta.messages.create({
  betas: ["context-management-2025-06-27"],
  model: "claude-opus-5-5",
  max_tokens: 16000,
  tools,
  messages,
  context_management: {
    edits: [{ type: "clear_tool_uses_20250919" }],
  },
});

// clear_tool_inputs: true also drops the tool_use PARAMS, not just the
// results. Worth it when an agent passes large payloads into its tools.`}
      </CodeBlock>

      <h2>What to Measure</h2>
      <p>
        You cannot manage any of this without per-run numbers, so record them from the
        first run rather than adding instrumentation later. The minimum useful set, all
        of which providers report in their usage payload:
      </p>

      <ul>
        <li><strong>Turns</strong> — the growth driver, and your early-warning signal for a confused agent.</li>
        <li><strong>Input tokens</strong> — split out cached and uncached; the next lesson explains why.</li>
        <li><strong>Output tokens</strong> — usually small, worth watching for runaway generation.</li>
        <li><strong>Wall-clock duration</strong> — what you will actually notice, and what catches a wedged run.</li>
      </ul>

      <p>
        The next lesson is about making the re-sent prefix nearly free, which is the
        single highest-leverage optimization available once you have accepted that the
        re-sending itself is unavoidable.
      </p>
    </LessonLayout>
  );
}
