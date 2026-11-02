import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Anatomy() {
  return (
    <LessonLayout
      title="Anatomy of a Harness"
      sectionId="agent-harness"
      lessonIndex={0}
      prev={{ path: '/ai-agents/design', label: 'Designing an Agent System' }}
      next={{ path: '/agent-harness/providers', label: 'Provider Shapes' }}
    >
      <h2>A Concrete One to Follow</h2>
      <p>
        The previous section was deliberately provider-neutral. This one traces a real
        harness, because the concepts only become usable once you have seen where each
        one lives in a file.
      </p>

      <p>
        The worked example throughout this section is <code>agent-team</code>: a Node.js
        harness that runs a team of role-based agents against real repositories, with all
        state in Postgres. It is small enough to read in an afternoon and real enough to
        have produced measured surprises, several of which appear in these lessons. Where
        a figure is quoted here, it came from running the thing.
      </p>

      <InfoBox variant="info" title="Phase status matters when reading any harness">
        That harness has one phase complete: the foundation — config, database, three
        providers, a single agent run, and observability. Tickets, git worktrees, pull
        requests, memory search and the release gate are designed but <strong>not
        built</strong>. This lesson is careful to say which is which, and you should
        demand the same of any harness documentation you read. Documentation that
        describes a planned feature in the present tense is the most common way to waste
        a day.
      </InfoBox>

      <h2>What a Harness Is Made Of</h2>
      <p>
        Nine concerns, one file each. Any harness you look at will have most of these,
        whatever the naming:
      </p>

      <CodeBlock language="text" title="The shape of a harness repo">
{`src/
  config.ts       .env + JSON config, validated at boot with a schema
  db.ts           Postgres pool and query helpers
  logger.ts       structured single-line logging
  roles.ts        loads role definition files
  runner.ts       THE RUN LIFECYCLE -- where everything converges
  budget.ts       caps: runs per day, turns, wall clock, failure streak
  migrate.ts      schema migrations
  cli.ts          operator entry points
  providers/
    types.ts      the two provider contracts
    claude-cli.ts    delegating provider
    ollama.ts        token provider, local
    anthropic-api.ts token provider, hosted
    index.ts      routing: role or task -> provider + model
  tools/
    index.ts      the tool registry: schema + implementation per tool
    sandbox.ts    path containment
    shell.ts      command execution and its denylist

roles/            one markdown file per role, with frontmatter
config/           routing.json, budgets.json
migrations/       SQL
sql/              saved views and inspection queries`}
      </CodeBlock>

      <p>
        The file worth reading first in any harness is the runner. It is where the role,
        the provider, the tools, the caps and the database all meet, and reading it tells
        you more about a harness's real design than its README does.
      </p>

      <h2>One Run, End to End</h2>
      <p>
        Here is what actually happens when a caller says &quot;run the engineer role on
        this task&quot;. The order is important, and several steps exist because of a
        specific failure.
      </p>

      <FlowChart
        title="The run lifecycle"
        chart={"graph TD\n  A[Caller: role + task + worktree] --> B[Load role definition file]\n  B --> C[Resolve routing: role to provider + model]\n  C --> D[Compute caps: turns, wall clock]\n  D --> E{Worktree legal?}\n  E -->|no| X1[Refuse before spending anything]\n  E -->|yes| F{Budget and failure streak OK?}\n  F -->|no| X2[Record budget_stopped row, exit]\n  F -->|yes| G[Partition the tool allowlist]\n  G --> H[INSERT run row, status running]\n  H --> I{Provider shape?}\n  I -->|delegating| J[Hand off whole task, read back result]\n  I -->|token| K[Run the loop in-process]\n  J --> L[UPDATE run row with usage and outcome]\n  K --> L\n  style X1 fill:#3b1a1a\n  style X2 fill:#3d2f14\n  style L fill:#1a3329"}
      />

      <h3>Step 1: load the role, then look up where it goes</h3>
      <p>
        The role definition says what the agent is and what it may use. It does
        <strong>not</strong> say which model runs it — that comes from a separate routing
        lookup. Keeping those apart is what lets you move a role between providers by
        editing one config value.
      </p>

      <h3>Step 2: refuse early</h3>
      <p>
        Two checks run before a single token is spent, and the ordering is deliberate:
      </p>

      <CodeBlock language="typescript" title="src/runner.ts — the two pre-flight refusals">
{`// Refuse before spending anything if the worktree is not a legal place to work.
assertWorktreeAllowed(req.worktree);

if (!req.ignoreBudget) {
  for (const check of [await checkDailyBudget(), await checkFailureStreak()]) {
    if (!check.ok) {
      const runId = await insertRun(/* ... */);
      await closeRun(runId, "budget_stopped", emptyUsage(...), null, check.reason, null);
      return { runId, status: "budget_stopped", /* ... */ };
    }
  }
}`}
      </CodeBlock>

      <p>
        Note that a budget refusal still <em>writes a row</em>. A run that was prevented
        is an event you want to see later; silently not running is indistinguishable from
        the scheduler being broken. This is a small thing that makes a large difference
        when you are trying to work out why nothing happened last night.
      </p>

      <h3>Step 3: partition the allowlist</h3>
      <p>
        A role file can legitimately ask for tools that do not exist yet, because the
        role was written against the full design while the harness is partway through it.
        Rather than failing, the harness sorts the request into three buckets:
      </p>

      <ul>
        <li><strong>Available</strong> — built, and passed to the provider.</li>
        <li><strong>Planned</strong> — known, not built, logged with the phase that will build it.</li>
        <li><strong>Unknown</strong> — not in the catalog at all, logged as a warning, because this is almost always a typo in the role file.</li>
      </ul>

      <p>
        That third bucket is the one that earns its place. A mistyped tool name would
        otherwise produce an agent that mysteriously never uses a tool it was told it had.
      </p>

      <h3>Step 4: dispatch on shape, converge on columns</h3>
      <p>
        This is the heart of the design. There are two fundamentally different kinds of
        provider — the next lesson is entirely about why — and the runner branches on
        which one it has. Both branches then write the <em>same columns</em> to the same
        table.
      </p>

      <InfoBox variant="tip" title="Converging on the schema is what makes reporting possible">
        Because both shapes end in an identical <code>runs</code> row, every view and
        every query works regardless of which provider did the work. You can compare a
        local model against a delegated CLI run of the same task in one
        <code>SELECT</code>. Design for that convergence early; retrofitting it means
        rewriting every query you have already written.
      </InfoBox>

      <h3>Step 5: record the outcome</h3>
      <p>
        The run row is updated with turns, four token counts, two cost columns, duration,
        session id, and either a summary or an error. The two cost columns are not a
        duplication — the next lesson explains why one of them is not money.
      </p>

      <h2>The Token Loop, With the Three Additions</h2>
      <p>
        When the provider owns the loop in-process, the runner implements exactly the core
        loop from the foundations lesson, plus the three things production requires:
      </p>

      <CodeBlock language="typescript" title="src/runner.ts — the loop, abridged">
{`const deadline = Date.now() + caps.maxWallClockMs;

for (let turn = 1; turn <= caps.maxTurns; turn++) {      // (1) iteration cap
  if (Date.now() > deadline) { /* fail with a wall-clock reason */ }

  const res = await provider.complete({
    system: role.systemPrompt, messages, tools: schemas,
    model: target.model, numCtx: target.numCtx,
  });
  usage = accumulate(usage, res.usage);                   // (2) usage tracking

  if (res.toolCalls.length === 0) {
    // The model considers itself done. But did it write its handoff note?
    const finished = ctx.finished;
    const status = finished ? "completed" : "failed";
    // ... recorded as "run ended without calling finish_run"
    return;
  }

  for (const call of res.toolCalls) {
    const tool = TOOLS[call.name];
    if (!tool) { /* tell the model, in text, that it cannot have that tool */ }
    try {
      const out = String(await tool.impl(call.input, ctx));
      await logToolCall(runId, seq, call.name, call.input, out, false, ms);  // (3) log
      results.push({ id: call.id, name: call.name, content: out, isError: false });
    } catch (e) {
      const msg = \`Error: \${e.message}\`;
      await logToolCall(runId, seq, call.name, call.input, msg, true, ms);
      // Returned to the model as text so it can see what went wrong and retry.
      results.push({ id: call.id, name: call.name, content: msg, isError: true });
    }
  }
}`}
      </CodeBlock>

      <p>
        Three details in there are worth copying into any harness you write.
      </p>

      <p>
        <strong>A run that ends without writing its handoff note is recorded as
        failed</strong>, even if the work went well. This enforces the
        externalize-before-compacting rule from the foundations section mechanically
        rather than by asking agents nicely.
      </p>

      <p>
        <strong>An unavailable tool produces a message to the model, not a crash</strong>
        — and the message differs depending on whether the tool is unbuilt or merely not
        allowed for this role. The agent can then adapt instead of failing opaquely.
      </p>

      <p>
        <strong>Every tool call is logged before the result reaches the model.</strong>
        That ordering means a crash mid-run still leaves the evidence of what was
        attempted.
      </p>

      <h2>What the Ledger Looks Like Afterwards</h2>
      <p>
        Six runs of the same small task, routed two different ways. This is the entire
        measured output of that harness's first phase, and almost every lesson in this
        section cites one row of it:
      </p>

      <CodeBlock language="text" title="Measured: six runs, two providers">
{`id | provider   | shape      | model       | turns | in_tok | out_tok | c_read  | c_write | list_usd | billed | secs
---+------------+------------+-------------+-------+--------+---------+---------+---------+----------+--------+------
 1 | claude-cli | delegating | sonnet      |    11 |     14 |   1,823 | 168,378 |  16,831 | 0.102420 |   0.00 | 24.4
 2 | claude-cli | delegating | sonnet      |     4 |      8 |     756 |  93,359 |  14,921 | 0.076596 |   0.00 | 12.7
 3 | claude-cli | delegating | sonnet      |     5 |      8 |     722 |  92,305 |  15,218 | 0.077338 |   0.00 | 12.1
 4 | ollama     | token      | gpt-oss:20b |    11 | 23,948 |   2,956 |       0 |       0 | 0.000000 |   0.00 | 65.3
 5 | claude-cli | delegating | sonnet      |     4 |      8 |     713 |  92,509 |  15,197 | 0.077185 |   0.00 | 13.1
 6 | ollama     | token      | gpt-oss:20b |    11 | 30,314 |   1,481 |       0 |       0 | 0.000000 |   0.00 | 39.4

6 runs.  Total list-price equivalent: $0.333539.  Total actually billed: $0.00.`}
      </CodeBlock>

      <p>
        Four things are legible in that table without any further explanation, which is
        the point of designing the schema this way:
      </p>

      <ul>
        <li><strong>The delegated runs are three to five times faster</strong> for the same task, and used a stronger model.</li>
        <li><strong>The local runs show no cache activity at all</strong> — local models have no prompt cache, so their re-sent history is paid in full each turn. That is the 23,948 figure.</li>
        <li><strong>The delegated runs show almost no raw input</strong> and enormous cache reads, which is caching working as intended.</li>
        <li><strong>Nothing cost money.</strong> One column says $0.33, the other says $0.00, and both are correct.</li>
      </ul>

      <h2>A Caution About Reading Any Document, Including This One</h2>
      <p>
        While writing this lesson, two documents in that project disagreed about these
        numbers. The specification said four runs and a 5-turn delegated run at 14
        seconds; a later brief said six runs and a 4-turn run at 13.1 seconds.
      </p>

      <p>
        Neither was wrong. The spec was written after runs 1 to 4 and cites run 3; the
        brief was written after all six and cites run 5. The ledger settled it in one
        query, and the resolution came with a timestamp for each claim.
      </p>

      <InfoBox variant="success" title="This is the argument for an append-only ledger">
        Two humans wrote two accurate documents that appear to contradict each other,
        because prose captures a moment and does not say which moment. An append-only
        table does. When you are deciding how much to invest in the audit tier of a
        harness, this is the return: not debugging, but the ability to resolve any claim
        about the past to a row and a timestamp.
      </InfoBox>
    </LessonLayout>
  );
}
