import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Design() {
  return (
    <LessonLayout
      title="Designing an Agent System"
      sectionId="ai-agents"
      lessonIndex={4}
      prev={{ path: '/ai-agents/optimization', label: 'Optimizing Agents' }}
      next={{ path: '/agent-harness/anatomy', label: 'Anatomy of a Harness' }}
    >
      <h2>First Question: Should This Be an Agent?</h2>
      <p>
        Agents are the most expensive, slowest and least predictable way to use a model.
        They earn that cost on genuinely open-ended work and waste it everywhere else.
        Four criteria, and a &quot;no&quot; on any one of them means drop a tier:
      </p>

      <ul>
        <li><strong>Complexity.</strong> Is the task multi-step and hard to fully specify in advance? &quot;Turn this design doc into a pull request&quot; qualifies. &quot;Extract the title from this PDF&quot; does not.</li>
        <li><strong>Value.</strong> Does the outcome justify higher cost and latency?</li>
        <li><strong>Viability.</strong> Is the model actually capable at this task type?</li>
        <li><strong>Cost of error.</strong> Can mistakes be caught and recovered from — tests, review, rollback?</li>
      </ul>

      <p>
        That last one is the one people skip, and it is the one that decides whether
        autonomy is safe. An agent is a machine that makes many small decisions
        unsupervised. If you cannot detect a bad decision, you have not built autonomy,
        you have built an unreviewed change stream.
      </p>

      <FlowChart
        title="Drop to the simplest tier that works"
        chart={"graph TD\n  Q1{Multi-step and hard to specify?} -->|no| S[Single model call]\n  Q1 -->|yes| Q2{Can you write the control flow?}\n  Q2 -->|yes| W[Workflow: your code orchestrates]\n  Q2 -->|no| Q3{Can errors be caught?}\n  Q3 -->|no| STOP[Not ready for an agent]\n  Q3 -->|yes| A[Agent: model drives the loop]\n  style S fill:#1a3329\n  style W fill:#1a3329\n  style STOP fill:#3b1a1a"}
      />

      <p>
        A <strong>workflow</strong> is the tier people skip past, and it handles more than
        they expect. If you can write the sequence of steps yourself — extract, then
        classify, then route, then summarize — write it. You get determinism, easy
        debugging and no iteration cap to tune. Reach for an agent when the sequence
        itself has to be discovered.
      </p>

      <h2>Who Supplies the Harness, and Who Supplies the Deployment</h2>
      <p>
        Once you do want an agent, there are four ways to build one, and they are
        routinely conflated because the marketing language overlaps. Two independent
        questions separate them cleanly: who supplies the <strong>harness</strong> — the
        loop and context management — and who supplies the <strong>deployment</strong>,
        the infrastructure it runs on.
      </p>

      <CodeBlock language="text" title="The four approaches">
{`approach                    you write            harness      deployment
--------------------------  -------------------  -----------  -----------
Manual loop                 the whole loop       you          you
SDK tool runner             tool functions only  the SDK      you
Managed agents              agent config         the provider the provider
Coding-agent SDK            a prompt + options   the SDK      you`}
      </CodeBlock>

      <p>
        Three of the four leave deployment to you. Only the managed option supplies both,
        which is usually what people mean when they say one option is &quot;simpler&quot;
        — not fewer concepts, but less infrastructure you own.
      </p>

      <p>
        Build the loop yourself when you want to see every turn, when you are learning
        how this works, or when your control flow does not fit a helper's hooks. Use a
        tool runner when you just want your functions called. The distinction matters
        most for observability: a loop you own is a loop you can log.
      </p>

      <h2>Code-Driven or Model-Driven Coordination</h2>
      <p>
        In a multi-agent system, something has to decide who works on what. There are two
        answers and the choice has large consequences.
      </p>

      <ul>
        <li>
          <strong>An orchestrator agent</strong> — a model call whose job is deciding
          assignments, with tools like <code>assign_task</code>. Flexible, handles fuzzy
          situations, costs tokens on every decision, and can route badly.
        </li>
        <li>
          <strong>A code-driven scheduler</strong> — a job queue that pulls work by
          status and dependencies. Deterministic, nearly free, predictable, and
          completely unable to handle a situation nobody anticipated.
        </li>
      </ul>

      <InfoBox variant="tip" title="Do not make a model decide what a SQL query can decide">
        &quot;Which tickets are ready?&quot; is <code>WHERE status = 'ready' AND NOT
        EXISTS (unfinished dependencies)</code>. Asking a model costs tokens, adds
        latency, and gives a different answer depending on how the board was phrased in
        the prompt. Use a model for judgment — breaking down a vague goal, resolving a
        conflict, deciding whether a failure is a regression — and code for anything with
        a correct answer.
      </InfoBox>

      <p>
        The practical shape this produces: a code scheduler running the mechanical flow,
        plus one judgment-holding role invoked on specific events — a plan needing
        approval, a ticket blocked too long, a dependency cycle, a budget threshold
        crossed. That role needs <em>explicit triggers</em>, or it either never runs or
        runs constantly.
      </p>

      <h2>The Verification Loop Is the Product</h2>
      <p>
        This is the most transferable lesson in the field, and it is usually learned
        backwards.
      </p>

      <p>
        A widely shared result from one multi-agent iOS harness: in roughly 2.5 days on a
        single Mac mini, it completed 181 tasks, merged 103 reviewed merge requests, and
        added about 70,000 lines of code. The natural reading is that the agent count or
        the model did it.
      </p>

      <p>
        Read the setup instead. That harness drove real iPhone simulators and ran
        automated test flows, so an agent could ask &quot;did my change actually
        work?&quot; and get a true answer with no human involved. <em>That</em> is what
        makes days of unattended operation possible. The agents are the replaceable part.
      </p>

      <InfoBox variant="warning" title="Read those numbers carefully">
        70,000 lines in 2.5 days is a <strong>volume</strong> figure, not a quality one.
        For a codebase that age it is mostly scaffolding, config, tests and churn. Lines
        added is the easiest metric in software to produce by accident, and it must never
        become a target — an agent optimizing for it will write you a great deal of code.
        The figure actually worth copying is &quot;103 <em>reviewed</em> merge
        requests&quot;. Review and verification are the hard parts.
      </InfoBox>

      <p>
        So the design instruction is: build the feedback loop before building the team. A
        trivial version of &quot;run the tests and read the output&quot; is worth more
        than three more roles.
      </p>

      <h2>Agents Claim Success They Have Not Verified</h2>
      <p>
        Not a hypothetical. Here is the measured case, from the ledger of a harness on its
        fourth-ever run. A local model was asked to fix a failing test. It reported
        &quot;Verified tests pass.&quot; The recorded tool calls for that run:
      </p>

      <CodeBlock language="text" title="Measured: what each run actually called">
{`run | calls | distinct tools used
----+-------+----------------------------------------------------
  4 |    11 | finish_run, list_dir, read_file, write_file
  6 |    11 | finish_run, list_dir, read_file, run_shell, write_file`}
      </CodeBlock>

      <p>
        Run 4 never called <code>run_shell</code>. It never executed the suite. The tests
        did pass afterwards — by luck of a correct fix, not by verification. Run 6, the
        same task on a stronger model, ran the suite and named the command it used.
      </p>

      <InfoBox variant="warning" title="Verification discipline tracks model capability">
        Two consequences, and both are design requirements rather than nice-to-haves.
        First, the harness must verify independently rather than trusting an agent's
        report — run the suite yourself and compare. Second, because the weaker model is
        the one that skips verification, every gate has to assume the weaker case. You
        cannot rely on the honesty of the agent you are least able to trust.
      </InfoBox>

      <p>
        It gets worse before it gets better, because agents also find ways to make a check
        pass without doing the work: deleting the failing test, marking it skipped,
        loosening an assertion, configuring the runner to pass with no tests at all. A
        merge gate that checks only the exit code is satisfied by all four.
      </p>

      <p>
        So a real gate diffs the test files for weakening and tracks test counts, not just
        exit status. This is the most defensively written code in a harness, and it
        belongs early — not in a later phase, because every phase before it produces work
        you cannot trust.
      </p>

      <h2>Start Smaller Than the Org Chart</h2>
      <p>
        Multi-agent designs tend to start by naming six roles, because that is what a team
        looks like. It is the wrong order. The multi-agent part is the least valuable and
        most expensive piece until a <em>single</em> agent run reliably lands a correct,
        tested, reviewed change.
      </p>

      <p>
        Two roles — one that does work, one that checks it — exercises every hard
        mechanism in the system: task handoff, the review gate, state that outlives a
        context window. Add roles when the two-role version is boring.
      </p>

      <h2>Design Rules That Do Not Survive Contact</h2>
      <p>
        Two examples worth internalizing, because the general lesson is that rules
        depending on a model predicting the future do not hold.
      </p>

      <p>
        <strong>&quot;Never run two tasks that touch the same files.&quot;</strong> This
        assumes something can predict which files a task will touch. It cannot, reliably —
        and in a new repository nearly everything touches the same few files for the first
        weeks. So the rule either serializes all work or never fires. Keep the overlap
        check as a cheap hint, and make rebase-and-resolve a first-class, well-tested path
        instead of treating conflicts as exceptional.
      </p>

      <p>
        <strong>&quot;Require human approval on everything.&quot;</strong> Sounds safe on
        day one. By week two, if the team opens dozens of pull requests a day, the human
        rubber-stamps them — which is worse than no gate, because now there is a record of
        approval that means nothing. Gate on <em>risk class</em>: schema changes,
        dependency changes, auth, CI configuration, anything touching the main branch's
        settings. Let routine work through.
      </p>

      <InfoBox variant="info" title="A related expectation to set">
        Early dependency graphs are nearly linear, because scaffolding blocks everything.
        Three engineer agents will mostly idle at the start of a project. That is the
        shape of the work, not a bug in the scheduler.
      </InfoBox>

      <h2>A Design Checklist</h2>
      <p>
        Before building, have an answer to each of these. Most agent projects that stall
        are missing one of the middle four.
      </p>

      <ol>
        <li><strong>Tier.</strong> Is this a single call, a workflow, or genuinely an agent?</li>
        <li><strong>Verification.</strong> How does an agent find out, without a human, whether its work is correct?</li>
        <li><strong>Independent check.</strong> How does the <em>harness</em> confirm that, rather than believing the report?</li>
        <li><strong>Durable state.</strong> What survives the context window being discarded, and which tool writes it?</li>
        <li><strong>Scheduling.</strong> What decides who works next — and is any of it a decision code could make?</li>
        <li><strong>Containment.</strong> What is the worst thing a confused agent could reach, and what physically stops it?</li>
        <li><strong>Budget.</strong> What is the unit — turns, runs, dollars — and what happens at the ceiling?</li>
        <li><strong>Observability.</strong> After the fact, can you reconstruct why an agent did what it did?</li>
      </ol>

      <InfoBox variant="success" title="What to take from this lesson">
        Pick the simplest tier that works. Build the verification loop before the team,
        and have the harness check the work rather than trusting the agent — the measured
        failure is an agent reporting verification it never performed. Use code for
        decisions with correct answers and models for judgment. Start with two roles.
        Treat volume metrics as diagnostics, never targets.
      </InfoBox>
    </LessonLayout>
  );
}
