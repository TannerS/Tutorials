import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Operating() {
  return (
    <LessonLayout
      title="Operating & Extending"
      sectionId="agent-harness"
      lessonIndex={5}
      prev={{ path: '/agent-harness/guardrails', label: 'Guardrails & Budgets' }}
      next={null}
    >
      <h2>Running One Is a Different Skill From Building One</h2>
      <p>
        A harness is a small distributed system with a nondeterministic worker. Most of
        what goes wrong is not a bug in the harness — it is a misconfiguration, a stale
        assumption, or an agent behaving reasonably given a prompt that said something
        other than what you meant.
      </p>

      <p>
        So the operating skill is mostly knowing where to look, in what order.
      </p>

      <h2>The Daily Commands</h2>
      <p>
        A harness should expose a handful of read-only commands that answer &quot;is this
        thing healthy&quot; without requiring you to remember any SQL:
      </p>

      <CodeBlock language="bash" title="Orientation, in the order you would run them">
{`pnpm providers:check     # which providers are reachable, and their versions
pnpm roles               # every role, its usable tools, and its unbuilt ones by phase
pnpm runs                # recent runs from the ledger
docker compose ps        # is Postgres healthy
pnpm psql                # then: \\d runs    \\dv    SELECT * FROM v_run_summary;`}
      </CodeBlock>

      <p>
        The first two are worth building early even though they look like conveniences.
        <code>providers:check</code> catches an unreachable local model server or an
        unauthenticated CLI <em>before</em> a run fails halfway through, and
        <code>roles</code> prints the allowlist partition from the roles lesson — so a
        typo in a role file shows up as a listed unknown tool rather than as an agent that
        mysteriously never greps.
      </p>

      <InfoBox variant="warning" title="One command to be careful with">
        A smoke-test command that actually exercises an agent consumes real quota — the
        same subscription allowance you use for your own work. Treat &quot;run the smoke
        test&quot; as a decision, not a reflex, and never put it in a loop while
        debugging something unrelated.
      </InfoBox>

      <h2>Reading a Run</h2>
      <p>
        When a run produces a surprising result, work outward from the row:
      </p>

      <ol>
        <li>
          <strong>The <code>runs</code> row.</strong> Status, turns, duration, and
          <code>error</code> or <code>outcome_summary</code>. Most questions end here.
        </li>
        <li>
          <strong>Turn count against the cap.</strong> A run at exactly the cap was cut
          off, not finished. A run at one or two turns that reported success did very
          little.
        </li>
        <li>
          <strong>The <code>tool_calls</code> rows.</strong> What did it actually do? This
          is where claimed work and performed work get compared — and where an agent that
          never ran the tests it said it ran becomes visible. Only available for token
          providers.
        </li>
        <li>
          <strong>Token shape.</strong> High uncached input means caching is not working.
          Cache reads climbing run over run mean the prefix is growing.
        </li>
        <li>
          <strong>Permission denials.</strong> A delegated run reports them. Denials mean
          either the allowlist is too tight or the agent is reaching out of scope. Both
          deserve attention.
        </li>
      </ol>

      <h2>A Debugging Playbook</h2>
      <p>
        Symptoms map to causes fairly reliably in this domain, and the mapping is worth
        having written down because several of these have counterintuitive causes
        established earlier in this section.
      </p>

      <CodeBlock language="text" title="Symptom to first thing to check">
{`SYMPTOM                              CHECK FIRST
-----------------------------------  ------------------------------------------------
Agent says it cannot run a tool      Tool-name translation for the provider shape.
                                     Then the allowlist partition: built? allowed?

Agent works in the wrong directory   The child process cwd. Granting directory
                                     access does not change where it starts.

Agent reports a check passed, but     tool_calls for that run. Did it ever call the
nothing was verified                 shell? Compare against a stronger model's run.

A view returns no rows but the        Timezone. date_trunc('day', now()) resolves in
table has data                       the session timezone, not yours.

Cache reads are zero                 A clock or an id in the system prompt; a varying
                                     tool list; non-deterministic schema serialization.

A trivial job is expensive           Per-invocation floor. Delegating providers reload
                                     their own prompt and tools every call.

Runs stop happening overnight        Daily run cap, or the consecutive-failure circuit
                                     breaker tripped. Look for budget_stopped rows.

Local model returns prose, not JSON   The model's declared capabilities, and numCtx.
                                     A small default context truncates silently.

Everything fails identically          A config change. Boot validation catches schema
                                     errors; it does not catch a wrong-but-valid value.`}
      </CodeBlock>

      <p>
        The pattern across most of those rows: the failure is silent and the symptom
        points somewhere other than the cause. That is the characteristic difficulty of
        operating agent systems, and it is why the ledger is worth its cost.
      </p>

      <h2>Dependency Minimalism Is a Design Choice</h2>
      <p>
        The example harness has four runtime dependencies: a model SDK, a Postgres client,
        a schema validator, and a dotenv loader. Three dev dependencies. No framework.
      </p>

      <p>
        That is deliberate, and it is worth a paragraph because it runs against the
        instinct to reach for an agent framework. The harness <em>is</em> the interesting
        part of the system — the thing you are trying to understand. A framework that
        supplies the loop, the memory and the tool protocol removes exactly the code worth
        reading. For a system whose purpose includes being understood by the person
        operating it, that trade is backwards.
      </p>

      <InfoBox variant="info" title="Two dependencies that got removed">
        A TypeScript runner and a bundler were both dropped during the first phase once it
        turned out Node strips TypeScript types natively — verified on 24.20.0 LTS and
        25.2.1 — so the harness has no build step and no transpiler. This is why every
        relative import in it ends in <code>.ts</code>: native stripping requires explicit
        extensions. Dependencies that exist because of an assumption worth re-testing are
        worth re-testing.
      </InfoBox>

      <p>
        A related measured gotcha from the same area: <code>node --test test/</code> fails
        with <code>MODULE_NOT_FOUND</code> on Node 25, while bare <code>node --test</code>
        — which discovers test files itself — works. Exactly the class of problem that
        costs an hour and looks like a broken test suite.
      </p>

      <h2>Phase Discipline</h2>
      <p>
        The rule in that project: <strong>finish a phase, make it run end to end, stop for
        review. Never start the next phase unprompted.</strong>
      </p>

      <p>
        This is not project-management ceremony — it is the only way to keep a system
        legible when an AI is writing the code. Each phase produces something you can run
        and inspect before more is built on top of it. Without the stop, you get six
        phases of plausible code and no idea which layer is wrong.
      </p>

      <FlowChart
        title="Phase roadmap, with honest status"
        chart={"graph TD\n  P1[\"Phase 1: foundation, providers, one run, observability\"] --> P2A[\"Phase 2a: ticket board, scheduler, 2 roles\"]\n  P2A --> P2B[\"Phase 2b: worktrees, PRs, review, merge gate\"]\n  P2B --> P3[\"Phase 3: memory, handoff notes, PM and architect\"]\n  P3 --> P4[\"Phase 4: testing, QA scenarios, release gate\"]\n  P4 --> P5[\"Phase 5: Slack, remaining guardrails\"]\n  P5 --> P6[\"Phase 6: first real project end to end\"]\n  style P1 fill:#1a3329\n  style P2A fill:#3d2f14"}
      />

      <p>
        Only the green box is built. Everything else is specified and unbuilt, which is
        the single most important thing to know when reading any harness's documentation.
      </p>

      <h2>The Open Blocker</h2>
      <p>
        One unresolved design question, stated plainly because it has to be decided before
        the next phase and it generalises to anyone building on a delegating provider.
      </p>

      <p>
        Harness tools — creating a ticket, updating its status, recording a decision,
        searching memory — are functions in harness code. A token provider can call them,
        because the harness executes the tool loop. A delegating provider cannot: it runs
        its own loop and can only call tools it knows about.
      </p>

      <InfoBox variant="warning" title="The consequence, concretely">
        A role routed to the CLI is limited to file and shell work, which means
        <strong>an engineer agent cannot close its own ticket</strong>. Every role in that
        harness is routed to the CLI by default. So the ticket board cannot be built until
        this is solved.
      </InfoBox>

      <p>
        The options, with their trade-offs:
      </p>

      <ul>
        <li>
          <strong>An MCP server inside the harness</strong>, exposing the ticket and memory
          tools, passed to the CLI with <code>--mcp-config</code>. The likely answer: the
          CLI supports it, and the tools stay in one implementation. Cost is a second
          process and a protocol to debug.
        </li>
        <li>
          <strong>Route roles that need harness tools to a token provider.</strong> Works
          today with no new code, and gives up the subscription funding and the stronger
          model for those roles.
        </li>
        <li>
          <strong>Have the harness infer state from the delegated result.</strong> No new
          infrastructure, and it reintroduces exactly the trust problem the verification
          lesson is about — the harness would believe an agent's report of its own
          progress.
        </li>
        <li>
          <strong>A wrapper script the CLI can shell out to</strong>, which writes to the
          database. Cheap, and it hands an agent a path to the database that the guardrails
          lesson deliberately closed.
        </li>
      </ul>

      <p>
        Written out like that, the first option is clearly right and the fourth is clearly
        wrong, which is the value of listing them. Note that the fourth looks like the
        easiest until you notice it undoes the environment scrub.
      </p>

      <h2>Where the Design Is Known to Be Weak</h2>
      <p>
        A harness's own documentation admitting its weak points is worth more than its
        feature list. Four, from the design review of this one:
      </p>

      <ul>
        <li>
          <strong>The file-overlap rule will not hold.</strong> &quot;Never run two tickets
          that touch the same files&quot; requires predicting which files a task will
          touch. Plan for rebase-and-resolve instead.
        </li>
        <li>
          <strong>The command denylist is a speed bump.</strong> Stated in the spec and
          repeated in the code above the list itself.
        </li>
        <li>
          <strong>Approval gates on everything become rubber-stamping.</strong> Gate by risk
          class.
        </li>
        <li>
          <strong>The daily run budget is a guess.</strong> There is no way to know the
          right number in advance; it has to be tuned by watching real runs.
        </li>
      </ul>

      <h2>What to Read Before Touching Each Area</h2>
      <p>
        If you extend a harness like this, the reading order that saves the most time:
      </p>

      <CodeBlock language="text" title="Area to prerequisite">
{`AREA                      READ FIRST
------------------------  --------------------------------------------------
Adding a provider         providers/types.ts, then the closest existing
                          provider. Decide the shape before writing anything.

Adding a tool             tools/index.ts for the registry shape, sandbox.ts
                          for path handling, and the CLI tool map if a
                          delegating provider is in use.

Adding a role             an existing role file and _common.md. Then routing.

Changing budgets          budget.ts and the timezone note. Any "today" needs
                          an explicit zone.

Changing the loop         runner.ts in full. It is where both shapes converge,
                          and the convergence is what keeps reporting working.

Anything about cost       the two cost columns. list_cost_usd is not money.`}
      </CodeBlock>

      <h2>Setup That Is Easy to Forget</h2>
      <p>
        Two tools in that project's inventory were recorded as not yet installed: a
        Postgres client, and the GitHub CLI needed for the pull-request phase. Both are
        the kind of prerequisite that blocks you at exactly the wrong moment.
      </p>

      <p>
        Worth noting that the database is still fully usable without a local client, by
        execing into the container. The inventory table in a spec is more useful than it
        looks — it is the difference between discovering a missing tool now and discovering
        it mid-phase.
      </p>

      <h2>What You Should Be Able to Do Now</h2>
      <p>
        If this section worked, you can answer all of these without looking anything up:
      </p>

      <ul>
        <li>Explain what a harness does that a model does not, without using &quot;agent&quot; as a primitive.</li>
        <li>Describe both provider shapes and state what each one trades away.</li>
        <li>Trace one run from a caller's request to a row in the ledger, naming the steps.</li>
        <li>Say why the audit ledger exists, and write a query answering a question about a past run.</li>
        <li>Name which guardrail is load-bearing and which is a speed bump, and why.</li>
        <li>Explain why a list-price cost column is not money.</li>
        <li>State what blocks a delegated agent from closing its own ticket.</li>
        <li>Add a role and a tool, and route a role to a different model.</li>
      </ul>

      <InfoBox variant="success" title="The one habit worth keeping">
        Every hard-won fact in this section was found by running the thing and reading what
        came back — the false verification claim, the silent tool-name mismatch, the
        five-hour timezone error, the missing turn-limit flag. None was found by reading
        documentation, including documentation that was accurate when it was written.
        Measure, then write down what you measured and when.
      </InfoBox>
    </LessonLayout>
  );
}
