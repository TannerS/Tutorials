import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Providers() {
  return (
    <LessonLayout
      title="Provider Shapes"
      sectionId="agent-harness"
      lessonIndex={1}
      prev={{ path: '/agent-harness/anatomy', label: 'Anatomy of a Harness' }}
      next={{ path: '/agent-harness/roles-and-tools', label: 'Roles, Tools & Routing' }}
    >
      <h2>One Interface Cannot Cover Both</h2>
      <p>
        The obvious design for provider support is a single adapter: one function
        signature, several implementations, swap freely. It is the first thing most
        people write, and it is wrong — not inefficient, wrong — because the candidates
        do not own the same amount of work.
      </p>

      <p>
        Calling a model API gives you one response. Shelling out to a coding agent CLI
        gives you the result of a whole agentic session that managed its own context and
        called its own tools. Forcing those behind one signature means pretending the CLI
        is something it is not, and the pretence collapses at the first tool call.
      </p>

      <p>
        So there are two shapes, and a harness that supports both implements both
        honestly.
      </p>

      <h2>Shape A: The Token Provider</h2>
      <p>
        The harness owns the loop. It sends messages and tool definitions, gets back text
        or tool calls, executes the tools itself, and sends the results back. Every turn
        and every tool call passes through harness code.
      </p>

      <CodeBlock language="typescript" title="Shape A: the harness drives">
{`complete({ system, messages, tools, model, numCtx })
  -> { text, toolCalls, usage }`}
      </CodeBlock>

      <p>
        Implemented by hosted model APIs and by local model servers. This is the shape
        the foundations lesson's core loop assumes.
      </p>

      <h2>Shape B: The Delegating Provider</h2>
      <p>
        The agent CLI owns its own loop, its own tools, and its own context management.
        The harness hands it a task and a sandbox, and reads back a structured result.
      </p>

      <CodeBlock language="typescript" title="Shape B: the harness hands off">
{`delegate({ rolePrompt, task, model, worktree, allowedTools, maxTurns })
  -> { result, sessionId, usage, isError, terminalReason, permissionDenials }`}
      </CodeBlock>

      <FlowChart
        title="Who owns the loop"
        chart={"graph TD\n  subgraph A[Shape A: token provider]\n    H1[Harness loop] --> M1[Model call]\n    M1 --> H1\n    H1 --> T1[Harness executes tools]\n    T1 --> H1\n  end\n  subgraph B[Shape B: delegating provider]\n    H2[Harness] -->|one handoff| C[CLI runs its OWN loop]\n    C --> C2[CLI calls its OWN tools]\n    C2 --> C\n    C -->|one structured result| H2\n  end\n  style T1 fill:#1a3329\n  style C2 fill:#3d2f14"}
      />

      <h2>The Trade, in One Breath</h2>
      <p>
        <strong>The token shape is where you can watch an agent work. The delegating
        shape is where the work is cheap and the model is strongest.</strong> That is the
        whole trade-off, and it is worth being able to state it that compactly.
      </p>

      <p>
        The evidence is in the ledger. Delegated runs record <em>zero</em> tool calls,
        because the CLI ran its own and never reported them:
      </p>

      <CodeBlock language="text" title="Measured: tool calls recorded per run">
{`run | provider   | shape      | tool_calls recorded
----+------------+------------+--------------------------------------------
  1 | claude-cli | delegating | 0
  2 | claude-cli | delegating | 0
  3 | claude-cli | delegating | 0
  4 | ollama     | token      | 11  (finish_run, list_dir, read_file, write_file)
  5 | claude-cli | delegating | 0
  6 | ollama     | token      | 11  (+ run_shell)`}
      </CodeBlock>

      <p>
        That difference is not a logging bug to fix. It is the shape. And it has a direct
        consequence for the verification lesson in the previous section: the only reason
        we know run 4's agent never ran the tests is that run 4 went through a token
        provider. The same deception on a delegated run would be invisible.
      </p>

      <InfoBox variant="warning" title="Observability is a routing decision">
        If you need to audit <em>how</em> an agent reached its answer, route it to a token
        provider. If you need the work done cheaply by a strong model and only need to
        audit the outcome, delegate. Deciding this per role, with the reason written down,
        is better than discovering later that your most important runs are the ones you
        cannot inspect.
      </InfoBox>

      <h2>What Delegation Does Not Cost You</h2>
      <p>
        A common assumption is that delegating to a CLI means giving up telemetry
        entirely. Measured, that turns out to be false. With JSON output the CLI reports
        full token counts, cache reads and writes, turn count, duration, a session id,
        and a cost figure:
      </p>

      <CodeBlock language="json" title="What `claude -p --output-format json` actually returns">
{`{
  "result": "PREFLIGHT_OK",
  "session_id": "47108cd7-...",
  "total_cost_usd": 0.0398514,
  "usage": {
    "input_tokens": 2,
    "output_tokens": 13,
    "cache_read_input_tokens": 11334,
    "cache_creation_input_tokens": 9646
  },
  "modelUsage": { "claude-sonnet-5-5": { "costBasis": "list" } },
  "num_turns": 1,
  "duration_ms": 1800,
  "is_error": false,
  "terminal_reason": "completed",
  "permission_denials": [],
  "subtype": "success"
}`}
      </CodeBlock>

      <p>
        So the per-run numbers are all there. Only the intermediate tool calls are hidden.
        That is a much narrower loss than &quot;delegation costs you observability&quot;,
        and it is worth measuring rather than assuming for any provider you are
        considering.
      </p>

      <h2>The Two Cost Columns</h2>
      <p>
        Look at <code>costBasis: &quot;list&quot;</code> in that payload. It is the most
        important word in it.
      </p>

      <p>
        When the CLI runs on a subscription, <code>total_cost_usd</code> is a
        <strong>list-price equivalent</strong> — what the run would have cost on the
        per-token API — not money anybody was charged. Recording it in a column called
        <code>cost_usd</code> would produce a dashboard that confidently reports spending
        that never happened.
      </p>

      <CodeBlock language="typescript" title="Two columns, because they mean different things">
{`return {
  ...emptyUsage(NAME, model),
  inputTokens:     u.input_tokens ?? 0,
  outputTokens:    u.output_tokens ?? 0,
  cacheReadTokens: u.cache_read_input_tokens ?? 0,
  cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
  // List-price equivalent, NOT money charged.
  listCostUsd: json.total_cost_usd ?? 0,
  billedUsd: 0,
  turns: json.num_turns ?? 0,
  durationMs: json.duration_ms ?? 0,
};`}
      </CodeBlock>

      <InfoBox variant="tip" title="list_cost_usd is a free telemetry signal">
        Keeping both columns turns a quirk into a useful measurement. On a subscription
        you pay nothing, and you still learn what each run <em>would</em> have cost —
        which is exactly the number you need to decide whether moving a role to the paid
        API is affordable. One column is money; the other is a price tag on free work.
      </InfoBox>

      <h2>Funding Shape Drives Architecture</h2>
      <p>
        This deserves stating plainly because it is unintuitive: how you pay changes what
        you build.
      </p>

      <p>
        On <strong>per-token billing</strong>, the meaningful budget unit is dollars. You
        set spend caps, you track cost per ticket, you can meaningfully ask &quot;what did
        last night cost?&quot;
      </p>

      <p>
        On a <strong>subscription consumed through a CLI</strong>, there is no dollar
        meter to read, so dollar caps are meaningless. The harness has to budget
        <em>work</em> instead: runs per day, turns per run, wall-clock per run. And if
        extra usage is disabled on the account, the plan limit becomes the hard spending
        cap, enforced by the provider rather than by your code.
      </p>

      <CodeBlock language="text" title="The same guardrail, two different enforcement points">
{`guardrail        delegating (subscription)        token provider (API)
---------------  -------------------------------  ---------------------------
Role prompt      --append-system-prompt           system field
Tool allowlist   --allowedTools (CLI enforces)    harness refuses unlisted
Path sandbox     --add-dir <worktree>             path check in every tool
No-shell roles   --restricted                     omit shell from allowlist
Unattended       --permission-prompts none        not applicable
Structured out   --output-format json             a required finish_run call
Spend cap        the plan's own limit             dollar caps in harness code
Turn cap         NOT a CLI flag -- see below      loop counter`}
      </CodeBlock>

      <p>
        Several guardrails become command-line arguments rather than harness code, and
        that is an improvement: an argument cannot be talked out of by a model.
      </p>

      <h2>A Spec That Was Wrong About the Turn Cap</h2>
      <p>
        The specification for this harness claims the turn cap maps to a &quot;CLI turn
        limit&quot; for delegated runs. Checked against the installed CLI, version
        2.1.310, <strong>no such flag exists</strong>.
      </p>

      <p>
        So what actually enforces it? A wall-clock timeout derived from the turn cap:
      </p>

      <CodeBlock language="typescript" title="The turn cap becomes a timeout, not a turn limit">
{`const { code, stdout, stderr, timedOut } = await runCli(
  args, req.task,
  Math.max(60_000, req.maxTurns * 60_000),   // a minute per allowed turn
  req.worktree,
);`}
      </CodeBlock>

      <InfoBox variant="warning" title="Verify the flags, not the document">
        This is a real divergence between a specification and the code that runs, and it
        matters: a turn cap and a time cap fail differently. A 40-turn agent that is
        looping fast gets cut off by turns; one that is stuck on a slow command gets cut
        off by time. Believing you have the first when you have the second will mislead
        you when you debug a cut-off run. Run <code>--help</code> against the version you
        actually have.
      </InfoBox>

      <h2>Four Things That Fail Silently When Delegating</h2>
      <p>
        Each of these was found by running the harness, and each reads like a model
        problem until you know better. They are the strongest argument for writing a
        delegating provider carefully.
      </p>

      <h3>1. Tool names need translating</h3>
      <p>
        Role files declare abstract tool names — <code>read_file</code>,
        <code>run_shell</code>. The CLI only recognises its own: <code>Read</code>,
        <code>Bash</code>. Passing the role's names straight through matched nothing, so
        every command the agent tried was auto-denied, while the agent reported that it
        &quot;couldn't run the tests&quot;.
      </p>

      <CodeBlock language="typescript" title="The translation table">
{`const CLI_TOOL_MAP: Record<string, string[]> = {
  read_file:  ["Read"],
  write_file: ["Write", "Edit"],
  list_dir:   ["Glob"],
  grep:       ["Grep"],
  run_shell:  ["Bash"],
  // finish_run has no CLI equivalent: for a delegating provider the structured
  // result IS the handoff, so the runner synthesises it from the returned text.
  finish_run: [],
};`}
      </CodeBlock>

      <h3>2. Granting directory access is not the same as starting there</h3>
      <p>
        <code>--add-dir</code> grants access to a directory. It does not change the
        working directory. Without an explicit <code>cwd</code> on the child process, the
        agent inherits the harness repo's directory and orients itself in the wrong
        project — on the first run, it reported that the harness's own
        <code>package.json</code> had no test script. Which was true, and a perfect
        symptom of being in the wrong place.
      </p>

      <h3>3. Harness tools are unreachable from a delegated run</h3>
      <p>
        The most consequential of the four. Tools like <code>create_ticket</code>,
        <code>record_decision</code> and <code>search_memory</code> are functions in
        harness code. A token provider can call them, because the harness executes the
        tool loop. A delegating provider cannot — it runs its own loop and can only call
        tools it knows about.
      </p>

      <InfoBox variant="warning" title="An engineer that cannot close its own ticket">
        This is an open blocker in that harness, not a solved problem. A role routed to
        the CLI is currently limited to file and shell work. The likely answer is a small
        MCP server inside the harness exposing the ticket and memory tools, passed to the
        CLI with <code>--mcp-config</code> — but it is unbuilt and undecided. If you are
        designing a harness around a delegating provider, settle this <em>before</em>
        building the ticket board, because it determines how an agent reports its own
        progress.
      </InfoBox>

      <h3>4. The run-ending tool does not exist</h3>
      <p>
        Standing rules tell every agent to end with <code>finish_run</code>. That is right
        for a token provider and impossible for the CLI, whose final message is its only
        output. Agents correctly reported being unable to find the tool, which cluttered
        every handoff.
      </p>

      <p>
        The fix is a provider-specific addendum to the role prompt — the role stays
        provider-agnostic, and the runner appends the difference:
      </p>

      <CodeBlock language="text" title="Appended to the role prompt for delegating providers only">
{`## How this run ends

You have no \`finish_run\` tool in this session. Your final message IS the handoff
note, and it is the only thing that survives your context being discarded. End by
stating, in this order:

1. **Status** -- completed, blocked, or failed.
2. **What you did**, and how you verified it. Name the command you ran and what it
   returned; do not say a check passed unless you read its output.
3. **What remains**, and anything that would trip up the next agent.`}
      </CodeBlock>

      <h2>Two Dangers Worth a Comment in the Code</h2>
      <p>
        When a provider's cost model depends on how it authenticates, authentication
        becomes a safety concern.
      </p>

      <CodeBlock language="typescript" title="Deliberately not forwarding a credential">
{`env: { ...process.env, ANTHROPIC_API_KEY: undefined } as NodeJS.ProcessEnv,
// ANTHROPIC_API_KEY is deliberately NOT forwarded -- if a key were present it
// would switch the CLI to per-token billing without anyone deciding to.`}
      </CodeBlock>

      <p>
        And a flag to avoid: the CLI's <code>--bare</code> mode states that authentication
        becomes strictly the API key or a key helper, with OAuth and keychain never read.
        On a subscription-funded harness that would break auth and silently start charging
        money. A comment in the provider saying &quot;do not add this flag, and why&quot;
        is worth more than the three words it costs.
      </p>

      <h2>Adding a Provider</h2>
      <p>
        Pick the shape first; everything else follows. Then:
      </p>

      <ol>
        <li>Implement the contract for that shape, returning the same <code>usage</code> object every other provider returns.</li>
        <li>Implement an <code>available()</code> check so a misconfigured provider reports itself at startup rather than mid-run.</li>
        <li>Map the abstract tool names to whatever this provider calls them, and log anything unmappable rather than dropping it.</li>
        <li>Decide which of <code>listCostUsd</code> and <code>billedUsd</code> it populates. A local model populates neither; a paid API populates both identically; a subscription CLI populates only the first.</li>
        <li>Add it to the routing config. No model or provider name should appear in agent code.</li>
        <li>Run the same task through it and the existing providers, and compare the rows.</li>
      </ol>

      <p>
        That last step is the one people skip, and it is the only one that tells you
        whether the new provider behaves. The ledger table in the previous lesson exists
        because someone did it.
      </p>

      <InfoBox variant="success" title="What to take from this lesson">
        Two shapes, because one signature cannot honestly cover a model call and a whole
        delegated session. The token shape buys you auditability; the delegating shape
        buys you a strong model on a subscription. Both must converge on identical
        columns. Keep list price and billed money in separate columns, verify the flags
        against the version you have, and expect four specific silent failures when
        delegating.
      </InfoBox>
    </LessonLayout>
  );
}
