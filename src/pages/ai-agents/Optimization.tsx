import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Optimization() {
  return (
    <LessonLayout
      title="Optimizing Agents"
      sectionId="ai-agents"
      lessonIndex={3}
      prev={{ path: '/ai-agents/caching', label: 'Prompt Caching' }}
      next={{ path: '/ai-agents/design', label: 'Designing an Agent System' }}
    >
      <h2>Measure First, and Measure the Right Thing</h2>
      <p>
        Agent optimization goes wrong in a predictable way: someone picks a lever that
        sounds expensive — usually the model — and changes it without a baseline. The
        result is a system that is cheaper per request and worse at finishing work, which
        is not cheaper at all.
      </p>

      <InfoBox variant="info" title="The metric is cost per completed task">
        A cheaper request that needs three more turns, or a retry, or a human to clean up
        after it, is more expensive. Judge every change by what it costs to get a working
        result, not by the price of one call. This single reframing invalidates most
        intuitive cost optimizations.
      </InfoBox>

      <p>
        So the first move is always the same: record per-run numbers before changing
        anything. Turns, input tokens split by cached and uncached, output tokens, wall
        clock, and whether the run actually succeeded. Without the last column you cannot
        compute the metric that matters.
      </p>

      <h2>The Lever Order</h2>
      <p>
        Work down this list. Everything in the first group is free — it costs you nothing
        in quality. Everything in the second trades something away, so it only earns its
        place once the free wins are exhausted.
      </p>

      <FlowChart
        title="Optimization lever order"
        chart={"graph TD\n  M[Measure a baseline] --> F[Free wins]\n  F --> F1[Prompt caching]\n  F --> F2[Input hygiene]\n  F --> F3[Loop hygiene]\n  F --> F4[Batch where latency is irrelevant]\n  F1 --> E[Build an eval — the quality baseline]\n  F2 --> E\n  F3 --> E\n  F4 --> E\n  E --> T[Quality tradeoffs]\n  T --> T1[Lower effort]\n  T --> T2[Cheaper model for narrow jobs]\n  T --> T3[Multi-model routing]\n  style F fill:#1a3329\n  style E fill:#1a2744\n  style T fill:#3d2f14"}
      />

      <h3>Free win 1: caching</h3>
      <p>
        Covered in full in the previous lesson, and it belongs first because the effect
        size is the largest available and the cost is zero. A read is twenty times cheaper
        than uncached input on current Opus and Sonnet models.
      </p>

      <h3>Free win 2: input hygiene</h3>
      <p>
        Agents accumulate input nobody chose to send. The usual culprits:
      </p>

      <ul>
        <li><strong>Whole-file reads where a range would do.</strong> A tool that returns an entire 2,000-line file when the agent needed one function has spent 20,000 tokens to deliver 200 useful ones.</li>
        <li><strong>Unbounded tool output.</strong> A directory listing of <code>node_modules</code>, a full test log, an un-truncated stack trace. Cap tool results in the harness and say so in the returned text, so the agent knows it was truncated and can ask for more.</li>
        <li><strong>Documents loaded for every role.</strong> A QA agent probably does not need the full coding standards document. Load per role.</li>
        <li><strong>Dead history.</strong> Old tool results that have been superseded. Clear them rather than compacting them.</li>
        <li><strong>Tool definitions for tools this role cannot call.</strong> Every schema is sent on every request. A harness that ships all twenty tools to an agent allowed to use four is paying for sixteen descriptions per turn, forever.</li>
      </ul>

      <InfoBox variant="tip" title="Measure the input instead of estimating it">
        Input hygiene is guesswork until you count. The API has a token-counting endpoint
        (<code>client.messages.countTokens</code>) that takes the same{' '}
        <code>system</code>, <code>messages</code> and <code>tools</code> you were going to
        send and returns the exact input count &mdash; free, and without running the
        request. Point it at one real turn and the answer is usually uncomfortable: the
        tool schemas and the system prompt frequently outweigh the actual conversation.
        Do not reach for a generic tokenizer such as <code>tiktoken</code>; it is a
        different tokenizer and the number it gives you is not the number you are billed
        for.
      </InfoBox>

      <InfoBox variant="tip" title="Many tools? Let the model search them instead of sending them all">
        Once a harness has dozens of tools, the definitions themselves become a real
        fraction of every request. The tool-search tools (
        <code>tool_search_tool_regex_20251119</code> /{' '}
        <code>tool_search_tool_bm25_20251119</code>) solve this directly: mark the bulk of
        your tools <code>defer_loading: true</code> and the model is sent a searchable
        index instead of the full schemas, pulling in only the ones a task actually needs.
        One rule the API enforces &mdash; the search tool itself must not be deferred, and
        at least one tool must stay non-deferred, or the request is rejected with{' '}
        <code>All tools have defer_loading set</code>.
      </InfoBox>

      <h3>Free win 3: loop hygiene</h3>
      <p>
        Tokens spent on turns that were never going to help. Three specific fixes:
      </p>

      <ul>
        <li><strong>Cap iterations.</strong> An agent that cannot finish in 40 turns will usually not finish in 80; it will re-read the same files. Cap it, and have the cap produce an alert rather than a silent failure.</li>
        <li><strong>Stop on repetition.</strong> The same tool call with the same arguments three times is a stuck agent. Detect it and end the run.</li>
        <li><strong>Return errors as text, not exceptions.</strong> Covered in lesson one, and it pays here: an agent that can read <code>ENOENT</code> fixes its own path in one turn instead of failing the run.</li>
      </ul>

      <h3>Free win 4: batch</h3>
      <p>
        Work with no latency requirement — overnight classification, bulk summarization,
        an eval sweep — runs through the Batches API asynchronously at half price. This is
        a pure win for anything that does not need an answer now, and it is routinely
        left on the table.
      </p>

      <h2>Before You Trade Anything: Build an Eval</h2>
      <p>
        Everything above this line is free. Everything below it buys cost with quality,
        and that trade is unmeasurable without something to measure quality <em>with</em>.
        This is the step most people skip, and skipping it is why so much tuning gets
        reverted months later by someone who notices the agent has quietly got worse.
      </p>
      <p>
        An eval does not have to be sophisticated. At minimum it is two things: a fixed set
        of representative inputs, and a way to score the output. Thirty real tasks pulled
        from your own logs beat five hundred synthetic ones, because the synthetic set
        measures a distribution you do not actually serve.
      </p>

      <CodeBlock language="text" title="Three ways to grade, cheapest first">
{`PROGRAMMATIC    Did the tests pass? Does the JSON parse? Did the file change?
                Free, instant, perfectly repeatable. Use it wherever the task
                has an objective finish line -- which, for coding agents, is
                most of the time. This is the one to reach for first.

LLM JUDGE       A second model scores the output against a written rubric.
                Necessary for "is this summary any good", where no checker
                exists. Costs money per eval run, and the judge needs its own
                spot-check -- grade 20 of its grades by hand before trusting it.

HUMAN           You read the outputs. Slow and unscalable, and still the right
                answer for the first 20 cases, because that is how you find out
                what your rubric should have said.`}
      </CodeBlock>

      <p>
        For agents specifically, grade the <strong>outcome</strong>, not the transcript. A
        run that took nine turns and a wrong path but produced a correct, tested change is
        a pass; a confident, elegantly-worded run that verified nothing is a failure. This
        is the same point as <em>cost per completed task</em>, applied to quality: the
        thing you are scoring is whether the work got done.
      </p>

      <InfoBox variant="warning" title="Split the set, or you will tune yourself into a corner">
        If you tune against every case you have, you will eventually be fitting the eval
        rather than the job &mdash; scores climb while real performance does not. Hold a
        portion back and never look at it while iterating; score it at the end. If the held-back
        set disagrees with the one you tuned on, believe the held-back set. The same
        discipline applies to the judge rubric: a rubric edited until the scores look good
        is no longer measuring anything.
      </InfoBox>

      <p>
        Then the loop is mechanical, and it is the only part of optimization that is:
        establish the baseline score and cost, change <em>one</em> lever, re-run, keep it
        if quality held and cost fell, revert otherwise. Changing two levers at once tells
        you nothing about either.
      </p>

      <h2>Then the Tradeoffs</h2>
      <h3>Effort, the first quality lever</h3>
      <p>
        Current models take an <code>effort</code> setting that controls thinking depth
        and overall token spend within one model. It is the right lever to reach for
        before changing models, because it keeps one cache namespace and one set of
        behaviours.
      </p>

      <CodeBlock language="typescript" title="Effort is inside output_config, not top-level">
{`const response = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  thinking: { type: "adaptive" },
  output_config: { effort: "high" },   // low | medium | high | xhigh | max
  messages: [...],
});`}
      </CodeBlock>

      <p>
        Two details that bite people. The default is not the same on every model — it is
        <code>medium</code> on Claude Opus 5.5 and Claude Haiku 5.5, and <code>high</code>
        on most others — so set it explicitly rather than inheriting a default that
        changes when you switch models. And the levels are recalibrated between model
        generations, which means an effort sweep is something you re-run on migration,
        not a setting you port across.
      </p>

      <p>
        Which workloads repay higher effort is a property of the workload, not a
        preference. Coding and long-horizon agentic work respond strongly to it. Chat,
        classification and high-volume routes often do not, and run well at
        <code>low</code>. Measure on real requests before raising a default, and tune per
        route rather than globally.
      </p>

      <InfoBox variant="tip" title="Adaptive thinking, not a token budget">
        The older pattern of setting a fixed <code>budget_tokens</code> for thinking is
        gone on current models — it returns an error. Use
        <code>thinking: {'{'} type: &quot;adaptive&quot; {'}'}</code> and control depth
        with <code>effort</code>. If you are porting agent code written against an older
        model, this is the change most likely to break it.
      </InfoBox>

      <h3>Model choice for narrow jobs</h3>
      <p>
        Not every job in an agent system needs a frontier model. Classification,
        summarizing a log, drafting a commit message, a first-pass triage verdict — these
        are narrow jobs with short inputs and short outputs, and they are where a cheap
        model earns its place.
      </p>

      <p>
        Three routes exist, and they differ by more than price:
      </p>

      <ul>
        <li><strong>A cheap hosted model.</strong> Claude Haiku 5.5 at $0.10 per million input tokens makes triage nearly free, with no infrastructure and no capability surprises.</li>
        <li><strong>A local model.</strong> Free per token, runs on your own hardware, and genuinely worse at reliable tool calling and multi-step work. Worth running to learn how local models differ, not because it saves meaningful money at small scale.</li>
        <li><strong>The capable model at low effort.</strong> Often matches a weaker model's best output, and keeps one cache namespace.</li>
      </ul>

      <p>
        Before building a multi-model cascade, measure that last option. A cascade
        forfeits cache reuse across its models, adds a routing decision that can be wrong,
        and has to be re-tuned whenever either model changes.
      </p>

      <InfoBox variant="warning" title="Verify a local model's capabilities before routing to it">
        Local models declare what they support, and routing a job to a model that lacks
        the capability fails <em>silently</em> — you get prose where JSON was expected,
        not an error. Check before wiring it up. One measured example: a 14B
        reasoning-distill model declares tool support but spends its output on visible
        reasoning before answering, which makes it slow and inconsistent for a one-word
        classification. Declared support is not fitness for the job.
      </InfoBox>

      <h2>The Per-Invocation Floor</h2>
      <p>
        One optimization trap is specific to delegating to an agent CLI rather than
        calling a model API, and it inverts the advice above.
      </p>

      <p>
        A coding CLI reloads its own system prompt and tool definitions on every
        invocation. That is a fixed cost paid before your prompt is even considered. A
        measured example from a real harness: a preflight call whose entire prompt was a
        few tokens still moved 9,646 cache-write and 11,334 cache-read tokens — roughly a
        21,000-token floor for a one-word job.
      </p>

      <InfoBox variant="warning" title="The cheap job is not cheap on every provider">
        This is the quantitative reason to route triage and summarization away from a
        delegating provider. Sending a one-word classification to something with a 20k
        floor costs more than sending it to a hosted cheap model, even though the
        delegating path bills no dollars. Per-invocation overhead is part of the cost of a
        provider and belongs in the routing decision.
      </InfoBox>

      <h2>Task Budgets: Telling the Model Its Own Limit</h2>
      <p>
        There is a difference between a ceiling the model knows about and one it does not.
        <code>max_tokens</code> is enforced but invisible: hit it and the response is cut
        off mid-sentence. A <strong>task budget</strong> is advisory and visible — the
        server injects a countdown the model can see, so it paces itself and finishes
        gracefully instead of being truncated.
      </p>

      <CodeBlock language="typescript" title="A task budget for an agentic loop">
{`const stream = client.beta.messages.stream({
  model: "claude-opus-5-5",
  max_tokens: 128000,
  output_config: {
    effort: "high",
    task_budget: { type: "tokens", total: 64000 },   // minimum 20,000
  },
  betas: ["task-budgets-2026-03-13"],
  messages: [...],
  tools: [...],
});
const response = await stream.finalMessage();`}
      </CodeBlock>

      <p>
        Use streaming for large <code>max_tokens</code> values — a non-streaming request
        that large risks an HTTP timeout. The budget counts what the model generates plus
        the tool results it reads this turn, not the full history you resend, and the
        server tracks the countdown itself.
      </p>

      <h2>What Not to Optimize</h2>
      <p>
        Three things that look like savings and are not:
      </p>

      <ul>
        <li>
          <strong>Truncating inputs to fit.</strong> Silently cutting a document so it
          fits produces confidently wrong answers from an agent that has no idea it read
          a fragment. If content genuinely does not fit, chunk it or summarize it
          deliberately — and tell the agent which you did.
        </li>
        <li>
          <strong>Making the model terser.</strong> Output is the small column in agent
          workloads. Shaving output tokens optimizes the wrong order of magnitude.
        </li>
        <li>
          <strong>Removing the verification step.</strong> The tests the agent runs are
          tokens spent, and they are the tokens that make the difference between work and
          the appearance of work. This is the cut that looks cheapest and costs the most.
        </li>
      </ul>

      <h2>A Tuning Checklist</h2>
      <p>
        In order, on a real workload, one change at a time:
      </p>

      <ol>
        <li>Record a baseline: turns, cached and uncached input, output, duration, success.</li>
        <li>Confirm caching works at all — <code>cache_read_input_tokens</code> above zero on repeat requests.</li>
        <li>Fix the prefix order so shared content is cached once, not per agent.</li>
        <li>Count one real request with <code>countTokens</code> and see what the input is actually made of.</li>
        <li>Cap tool output and narrow the read tools.</li>
        <li>Cap iterations and add repetition detection.</li>
        <li>Move latency-insensitive work to batch.</li>
        <li>Build the eval and score the baseline — before any lever below this line.</li>
        <li>Sweep effort per route; step down only where quality holds.</li>
        <li>Only now consider a cheaper model for the narrowest jobs, and verify its capabilities first.</li>
        <li>Re-measure cost per <em>completed</em> task and compare with the baseline.</li>
      </ol>

      <InfoBox variant="success" title="What to take from this lesson">
        Free wins before tradeoffs, and a baseline before either. Caching is the largest
        effect, input and loop hygiene the most neglected, effort the first lever that
        costs you something, and model switching the last — not the first — thing to
        reach for. Measure cost per completed task, because every other metric can improve
        while the system gets worse.
      </InfoBox>
    </LessonLayout>
  );
}
