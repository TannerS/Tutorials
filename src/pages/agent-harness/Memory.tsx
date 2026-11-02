import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Memory() {
  return (
    <LessonLayout
      title="Memory & the Audit Ledger"
      sectionId="agent-harness"
      lessonIndex={3}
      prev={{ path: '/agent-harness/roles-and-tools', label: 'Roles, Tools & Routing' }}
      next={{ path: '/agent-harness/guardrails', label: 'Guardrails & Budgets' }}
    >
      <h2>Two Tiers, Two Audiences</h2>
      <p>
        &quot;Store everything in the database&quot; sounds like a complete memory design.
        It is half of one, and the missing half is the reason agent memory usually
        disappoints.
      </p>

      <p>
        The principle: the database is the source of truth and the context window is
        disposable. Store everything, but load only a small curated slice into any agent
        run. That produces two tiers, and the thing that separates them is not the data —
        it is <strong>who reads it</strong>.
      </p>

      <CodeBlock language="text" title="The split that makes memory work">
{`tier             holds                            read by      rule
---------------  -------------------------------  -----------  ----------------------
Audit ledger     every run, tool call, message     THE HUMAN    append-only;
                                                                NEVER in a prompt
Curated memory   decisions, handoff notes,         AGENTS       deliberately written,
                 failure log, ticket comments                   small, retrievable`}
      </CodeBlock>

      <InfoBox variant="warning" title="Why the split is not optional">
        Writing everything to SQL does not preserve knowledge, because nothing can find it
        again. Keyword search across tens of thousands of rows of agent chatter returns
        noise, and noise injected into a prompt makes agents <em>confidently wrong</em> —
        which is worse than having no memory at all. A durable fact is one an agent
        deliberately wrote to the curated tier, not one that happens to exist somewhere in
        a transcript.
      </InfoBox>

      <p>
        That last sentence is the whole design. If you take one idea from this lesson,
        take the distinction between data that exists and knowledge that can be retrieved.
      </p>

      <FlowChart
        title="Two tiers, two directions"
        chart={"graph TD\n  A[Agent run] -->|harness writes automatically| L[(Audit ledger: runs, tool_calls, messages)]\n  A -->|agent writes deliberately via tools| C[(Curated: decisions, handoff notes, failures)]\n  L -->|psql and saved views| HUMAN[The operator]\n  C -->|search_memory| A2[A later agent run]\n  L -.->|never| A2\n  style L fill:#1a2744\n  style C fill:#1a3329"}
      />

      <p>
        Note the dotted line. The ledger is deliberately <em>not</em> wired back into
        prompts. It is big, it is noisy, and it is for you.
      </p>

      <h2>Externalize Before Compacting</h2>
      <p>
        The foundations section introduced this rule; here is how a harness enforces it.
      </p>

      <p>
        <code>record_decision</code> and <code>finish_run</code> are not bookkeeping —
        they are the save operation. A fact must reach the curated tier <em>before</em>
        the context holding it is compressed. An agent that compacts without recording has
        lost that knowledge in practice, even though the bytes still sit in a messages
        table, because nobody will ever dig it out.
      </p>

      <p>
        The mechanical enforcement is blunt and effective: a run that ends without writing
        its handoff note is recorded as <strong>failed</strong>, however well the work
        went.
      </p>

      <CodeBlock language="typescript" title="src/runner.ts — no handoff note, no success">
{`if (res.toolCalls.length === 0) {
  // No tool calls means the model considers itself done. If it never called
  // finish_run, that is a protocol violation worth recording rather than
  // papering over -- the handoff note is the only durable output of a run.
  const finished = ctx.finished;
  const status = finished ? "completed" : "failed";
  await closeRun(
    runId, status, usage, summary,
    finished ? null : "run ended without calling finish_run", null,
  );
}`}
      </CodeBlock>

      <p>
        This looks harsh and is not. A run whose knowledge was not externalized has
        produced code nobody can pick up, and marking that &quot;completed&quot; is the
        lie that compounds.
      </p>

      <h2>What Gets Loaded Into a Run</h2>
      <p>
        Prompt assembly order, static parts first — which is the caching lesson's
        requirement applied to a real prompt:
      </p>

      <ol>
        <li>Role system prompt.</li>
        <li>Project brief, architecture doc and standards doc, plus team-wide standards.</li>
        <li>The assigned ticket, its acceptance criteria, and short summaries of its dependencies.</li>
        <li>The latest handoff note for this ticket, plus the last few comments in its thread.</li>
        <li>Active decisions tagged with the same areas as the ticket.</li>
        <li>Open questions addressed to this agent.</li>
      </ol>

      <p>
        And explicitly <strong>not</strong> loaded: other tickets' chatter, old tool
        output, superseded decisions, full history. Each of those is a deliberate omission
        rather than an oversight, and each has a reason from the context lesson.
      </p>

      <h2>The Ledger Schema</h2>
      <p>
        Two tables carry the audit tier. They are small and boring, which is appropriate:
      </p>

      <CodeBlock language="sql" title="The audit tier, abridged">
{`CREATE TABLE runs (
  id                 bigserial PRIMARY KEY,
  project_id         bigint,
  role               text NOT NULL,
  ticket_key         text,
  provider           text NOT NULL,
  provider_shape     text NOT NULL,     -- 'token' or 'delegating'
  model              text NOT NULL,
  status             text NOT NULL DEFAULT 'running',
  turns              integer NOT NULL DEFAULT 0,
  input_tokens       bigint NOT NULL DEFAULT 0,
  output_tokens      bigint NOT NULL DEFAULT 0,
  cache_read_tokens  bigint NOT NULL DEFAULT 0,
  cache_write_tokens bigint NOT NULL DEFAULT 0,
  list_cost_usd      numeric(12,6) NOT NULL DEFAULT 0,   -- NOT money
  billed_usd         numeric(12,6) NOT NULL DEFAULT 0,   -- money
  duration_ms        integer,
  session_id         text,
  outcome_summary    text,
  error              text,
  started_at         timestamptz NOT NULL DEFAULT now(),
  ended_at           timestamptz
);

CREATE TABLE tool_calls (
  run_id         bigint NOT NULL REFERENCES runs(id),
  seq            integer NOT NULL,
  tool_name      text NOT NULL,
  input          jsonb,
  output_preview text,                  -- truncated: the full output is not worth keeping
  is_error       boolean,
  duration_ms    integer
);`}
      </CodeBlock>

      <InfoBox variant="info" title="Built versus designed">
        In the example harness, these two tables plus a migrations table are what actually
        exist. The curated tier — <code>decisions</code>, <code>handoff_notes</code>,
        <code>tickets</code>, <code>failure_log</code>, <code>open_questions</code> — is
        designed and specified but <strong>not built</strong>; it arrives with later
        phases, along with the <code>search_memory</code> tool that reads it. The audit
        tier came first deliberately, because observability was treated as the curriculum
        rather than as ops polish.
      </InfoBox>

      <h2>Watching It From a Distance</h2>
      <p>
        Agents compact and lose their own context, so the ledger plus a handful of saved
        views is how you supervise a system you are not reading the transcripts of. Five
        views cover the normal questions.
      </p>

      <CodeBlock language="sql" title="sql/views.sql — what is running right now">
{`CREATE OR REPLACE VIEW v_agent_now AS
SELECT id, role, ticket_key, provider, model, turns,
       date_trunc('second', now() - started_at) AS elapsed,
       started_at
FROM runs
WHERE status = 'running'
ORDER BY started_at;`}
      </CodeBlock>

      <CodeBlock language="sql" title="sql/views.sql — recent runs, readable at a glance">
{`CREATE OR REPLACE VIEW v_run_summary AS
SELECT id, role, ticket_key, provider, model, status, turns,
       input_tokens + cache_read_tokens AS tokens_in,
       output_tokens AS tokens_out,
       list_cost_usd, billed_usd,
       (duration_ms / 1000.0)::numeric(10,1) AS seconds,
       left(coalesce(outcome_summary, error, ''), 80) AS outcome,
       started_at
FROM runs
ORDER BY started_at DESC;`}
      </CodeBlock>

      <p>
        The other three: <code>v_usage_today</code> groups consumption by provider and
        model, <code>v_stuck</code> finds runs still going after twenty minutes, and
        <code>v_tool_usage</code> shows which tools an agent actually reached for, with an
        error count per tool.
      </p>

      <p>
        Presenting these as the primary interface rather than an appendix is a deliberate
        choice. If the operator has strong SQL, saved views beat building a dashboard —
        they are faster to write, trivially extensible, and they compose with every other
        query.
      </p>

      <h2>Answering a Real Question in SQL</h2>
      <p>
        The test of an audit tier is whether it answers a question you did not anticipate.
        Here is the one from the design lesson: <em>did the agent on run 4 actually run the
        tests it claimed to have run?</em>
      </p>

      <CodeBlock language="sql" title="The query that caught an agent's false claim">
{`SELECT run_id, count(*) AS calls, string_agg(DISTINCT tool_name, ',') AS tools
FROM tool_calls
GROUP BY run_id
ORDER BY run_id;

 run_id | calls |                       tools
--------+-------+----------------------------------------------------
      4 |    11 | finish_run,list_dir,read_file,write_file
      6 |    11 | finish_run,list_dir,read_file,run_shell,write_file`}
      </CodeBlock>

      <p>
        Run 4 reported &quot;Verified tests pass.&quot; It never called
        <code>run_shell</code>. The claim was false, and one <code>GROUP BY</code>
        established it months after the fact.
      </p>

      <InfoBox variant="success" title="This is the return on an append-only ledger">
        Nobody wrote that query in advance. The ledger answered a question that did not
        exist when the schema was designed, about a run that had long since been
        discarded. That is what &quot;append-only&quot; buys, and it is why the audit tier
        must never be pruned to save space or edited to fix an embarrassment.
      </InfoBox>

      <h2>A Bug Worth Studying: &quot;Today&quot; Was Wrong by Five Hours</h2>
      <p>
        One measured failure in this area is worth more than a section of advice, because
        it would have silently corrupted budgeting.
      </p>

      <p>
        Postgres stores <code>timestamptz</code> in UTC, and
        <code>date_trunc('day', now())</code> resolves against the <em>session</em>
        timezone. With the container defaulting to UTC, the day boundary fell at 19:00
        local. Four runs made that evening were already counted as yesterday — so
        <code>v_usage_today</code> returned no rows while the table held four, and the
        daily run budget would have reset at 7pm every evening.
      </p>

      <CodeBlock language="text" title="How it was caught, and the fix">
{`SYMPTOM   v_usage_today returned 0 rows.  SELECT count(*) FROM runs returned 4.
CAUSE     date_trunc('day', now()) resolved in UTC, not local time.
EFFECT    The daily budget would silently reset at 19:00 each evening.
FIX       REPORTING_TIMEZONE=America/Chicago in .env, pinned on every
          connection through the "options" connection parameter.`}
      </CodeBlock>

      <p>
        Two lessons. First, a view returning nothing is not evidence that nothing
        happened — cross-check against the base table before believing an empty result.
        Second, any budget keyed on &quot;today&quot; needs an explicit timezone, decided
        once and pinned on the connection, not inherited from whatever the container
        happens to default to.
      </p>

      <h2>Retrieval, and When to Add Vectors</h2>
      <p>
        Start with plain SQL and Postgres full-text search. Add <code>pgvector</code> only
        if keyword search proves too weak in practice.
      </p>

      <p>
        This ordering is not conservatism for its own sake. The curated tier is small and
        deliberately written, which is exactly the shape keyword search handles well.
        Semantic search earns its place over large volumes of material nobody curated —
        and if you find yourself needing it over your curated tier, the more likely
        problem is that too much is being written to it.
      </p>

      <h2>Memory Hygiene</h2>
      <p>
        Bad memory is worse than none, so the curated tier needs maintenance rules:
      </p>

      <ul>
        <li><strong>Date-stamp every note.</strong> A fact without a date cannot be judged stale.</li>
        <li><strong>Mark superseded decisions, do not delete them.</strong> &quot;We chose X, superseded by Y&quot; prevents an agent re-litigating a settled question, which deletion does not.</li>
        <li><strong>Cap handoff notes at a few hundred words.</strong> A note nobody reads is not memory.</li>
        <li><strong>Scope by project, with team-level memory for what applies everywhere.</strong> House standards and past failures generalise; a specific ticket's gotchas do not.</li>
        <li><strong>Prefer fewer, better records.</strong> Every row added to the curated tier dilutes every search over it.</li>
      </ul>

      <h2>Crash Recovery Falls Out of the Design</h2>
      <p>
        Because run state lives in Postgres rather than in process memory, recovery is
        nearly free: on restart, find runs still marked <code>running</code>, mark them
        interrupted, and requeue the ticket with its last handoff note.
      </p>

      <p>
        That is the real argument for putting state in a database from the first commit. It
        is not durability for its own sake — it is that the alternative makes every crash
        a loss of work nobody can reconstruct.
      </p>

      <InfoBox variant="success" title="What to take from this lesson">
        Two tiers with different audiences: an append-only ledger for you, a small curated
        tier for agents. Knowledge is what was deliberately written, not what exists
        somewhere in a transcript. Enforce externalize-before-compacting mechanically.
        Build saved views early and treat them as the interface. And give any
        &quot;today&quot; in a budget an explicit timezone.
      </InfoBox>
    </LessonLayout>
  );
}
