import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Concepts() {
  return (
    <LessonLayout
      title="Model, Agent, Harness"
      sectionId="ai-agents"
      lessonIndex={0}
      prev={null}
      next={{ path: '/ai-agents/context', label: 'Tokens, Context & Compaction' }}
    >
      <h2>Three Words That Get Used Interchangeably</h2>
      <p>
        Almost every confusing conversation about AI agents comes from collapsing three
        separate things into one word. They sit at different layers, they are built by
        different people, and they fail in different ways. Getting them apart is the
        whole foundation, so this lesson does nothing else.
      </p>

      <ul>
        <li>
          <strong>Model</strong> — a stateless function. Text in, text out, where the
          output may include a request to call a tool. Its weights are frozen. It
          remembers nothing between calls, it runs nothing, and it cannot talk to
          another model.
        </li>
        <li>
          <strong>Agent</strong> — a loop around model calls, with a role-specific
          system prompt and a set of tools. &quot;Several agents&quot; usually means one
          program calling the same model several times with different prompts and
          different tool lists.
        </li>
        <li>
          <strong>Harness</strong> — the program that runs the loops. It executes the
          tools, stores the memory, enforces the permissions, and decides who runs
          when.
        </li>
      </ul>

      <p>
        If you write backend code, the mapping is close to exact: the model is a pure
        function or a database engine, and the harness is the application server around
        it. Agents are job types — all calling the same function with different inputs.
      </p>

      <FlowChart
        title="Where each layer sits"
        chart={"graph TD\n  H[Harness: your program] --> L1[Agent loop: engineer role]\n  H --> L2[Agent loop: QA role]\n  H --> T[Tool implementations]\n  H --> DB[(State: Postgres)]\n  L1 --> M[Model: stateless text in, text out]\n  L2 --> M\n  T --> FS[Files, shell, git]\n  style M fill:#1a2744\n  style H fill:#1a3329"}
      />

      <InfoBox variant="info" title="The model is the replaceable part">
        Notice what the diagram implies about effort. The model is one box that you call;
        everything else in the picture is code someone has to write and operate. When
        people report that agents did a surprising amount of work, almost none of the
        interesting engineering was in the model choice. It was in the harness.
      </InfoBox>

      <h2>What a Tool Actually Is</h2>
      <p>
        This is the single most common misconception about agents, and it is worth
        labouring. A tool has two halves that live in different places:
      </p>

      <ol>
        <li>
          A <strong>description</strong> sent to the model — a name, a sentence about
          what it does, and an input schema. The model decides when to call it based on
          nothing but this text, so you write it the way you would write docs for a
          coworker who cannot ask follow-up questions.
        </li>
        <li>
          An <strong>implementation</strong> in your own code. This is ordinary
          software: a function that reads a file, runs a command, inserts a row.
        </li>
      </ol>

      <p>
        The model never executes anything. It emits a structured request — &quot;call
        <code>read_file</code> with <code>path: src/index.ts</code>&quot; — and your
        harness decides whether to honour it, runs it, and hands back the result as
        text. A model with a <code>run_shell</code> tool has not been given shell
        access. Your harness has shell access, and has agreed to act on requests.
      </p>

      <CodeBlock language="javascript" title="Both halves of a tool, side by side">
{`// HALF ONE: what the model sees. It never sees the code below.
const tools = [
  {
    name: "read_file",
    description: "Read a file from the project and return its contents.",
    input_schema: {
      type: "object",
      properties: { path: { type: "string", description: "Relative file path" } },
      required: ["path"],
    },
  },
];

// HALF TWO: what actually runs, in your process, under your rules.
const impl = {
  read_file: ({ path }) => fs.readFileSync(resolveInsideWorktree(path), "utf8"),
};

async function runTool(call) {
  try {
    const out = await impl[call.name](call.input);
    return { type: "tool_result", tool_use_id: call.id, content: String(out) };
  } catch (e) {
    // Hand errors BACK to the model as text. It can read them and retry.
    return {
      type: "tool_result",
      tool_use_id: call.id,
      content: \`Error: \${e.message}\`,
      is_error: true,
    };
  }
}`}
      </CodeBlock>

      <p>
        Note the error path. A tool failure is not an exception to propagate — it is
        information the model needs. Returning <code>Error: ENOENT: no such file</code>
        lets the agent correct its own typo on the next turn. Throwing instead kills the
        run over a recoverable mistake.
      </p>

      <InfoBox variant="tip" title="Tool descriptions are prompt engineering">
        Because the description is the only thing steering the choice, vague descriptions
        produce wrong tool calls that look like model stupidity. &quot;Runs a
        command&quot; invites the agent to try <code>git push</code>. &quot;Runs a shell
        command inside your assigned worktree. Network access and commands outside the
        worktree are refused.&quot; sets expectations the harness will actually enforce.
      </InfoBox>

      <h3>Making the Arguments Trustworthy</h3>
      <p>
        A schema in <code>input_schema</code> documents what you want; it does not by
        itself guarantee you get it. The model can return arguments that miss a required
        field or invent an extra one, and your tool then crashes on input it never
        expected. Two settings close that gap, and both are worth switching on by default
        in a harness.
      </p>

      <CodeBlock language="typescript" title="strict: true — schema-valid arguments, guaranteed">
{`{
  name: "read_file",
  description: "Reads a UTF-8 text file inside the agent's worktree.",
  strict: true,                    // top-level on the TOOL, not on tool_choice
  input_schema: {
    type: "object",
    properties: { path: { type: "string" } },
    required: ["path"],
    additionalProperties: false,   // strict requires this and 'required'
  },
}`}
      </CodeBlock>

      <p>
        With <code>strict: true</code> the API guarantees <code>tool_use.input</code>{' '}
        validates against the schema, so the defensive argument-checking most harnesses
        accumulate stops being necessary. The two schema requirements are easy to forget:
        it needs both <code>required</code> and{' '}
        <code>additionalProperties: false</code>.
      </p>

      <InfoBox variant="danger" title="Forcing a tool call is gone on current models">
        The old way to guarantee a tool call was{' '}
        <code>tool_choice: {'{'} type: &quot;any&quot; {'}'}</code> or{' '}
        <code>{'{'} type: &quot;tool&quot;, name {'}'}</code>. On Claude Opus 5.5, Sonnet 5.5
        and Fable 5.1 both now return a <strong>400</strong>, on{' '}
        <code>count_tokens</code> and the Batches API too. This breaks a lot of ported
        agent code, and the replacement depends on why you were forcing it:
        <ul>
          <li>
            <strong>To make the model use a tool</strong> &mdash; keep{' '}
            <code>tool_choice: {'{'} type: &quot;auto&quot; {'}'}</code> and name the tool
            in the prompt. Add <code>strict: true</code> so the arguments stay valid.
          </li>
          <li>
            <strong>To get structured JSON back</strong> &mdash; that is not really a tool
            call at all. Use structured outputs (<code>output_config.format</code>), which
            constrains the response itself and skips the round trip.
          </li>
        </ul>
        <code>tool_choice: {'{'} type: &quot;none&quot; {'}'}</code> still works, and so
        does <code>disable_parallel_tool_use</code> alongside <code>auto</code>.
      </InfoBox>

      <h2>The Core Loop</h2>
      <p>
        An agent is this, and the interesting versions are this plus bookkeeping. Read
        it once and the rest of the field gets much less mysterious.
      </p>

      <CodeBlock language="javascript" title="The agent loop in full">
{`while (true) {
  const res = await complete({ model, system, messages, tools });
  messages.push({ role: "assistant", content: res.content });

  const calls = res.content.filter(b => b.type === "tool_use");
  if (!calls.length) break;                   // no tool request: the model is done

  const results = await Promise.all(calls.map(runTool));
  messages.push({ role: "user", content: results });
}`}
      </CodeBlock>

      <p>
        Three things about this loop decide whether a harness is usable. First, the exit
        condition is &quot;the model stopped asking for tools&quot; — which means a
        confused model can loop indefinitely, so a real harness adds an iteration cap.
        Second, <code>messages</code> only grows; the next lesson is about what that
        costs. Third, every tool call passes through <code>runTool</code>, which is
        exactly where logging, permission checks and cost accounting belong.
      </p>

      <p>
        A production loop is the same shape with four additions: an iteration cap, a log
        line per tool call, usage accounting, and a wall-clock timeout. None of them
        changes the control flow.
      </p>

      <InfoBox variant="warning" title="One assistant turn, one user message of results">
        <p>
          The single line <code>messages.push({'{'} role: &quot;user&quot;, content: results {'}'})</code>{' '}
          is carrying more weight than it looks. A model can return{' '}
          <em>several</em> <code>tool_use</code> blocks in one assistant turn, and every
          matching <code>tool_result</code> must come back in <strong>one</strong> user
          message. The natural refactor &mdash; loop over the calls and push each result as
          it finishes &mdash; is the bug, and it is a quiet one: you get no error, the run
          completes, and the model gradually stops issuing parallel calls at all because
          the transcript keeps showing it that one call per turn is the house style. The
          symptom is a slow agent, weeks later, with nothing in the logs.
        </p>
        <p>
          The same applies to failures. A tool that throws still owes the model a{' '}
          <code>tool_result</code> carrying <code>is_error: true</code> &mdash; dropping the
          block leaves a <code>tool_use</code> with no answer, which the API rejects
          outright. Returning the error text is also strictly better for the agent: it can
          read &ldquo;file not found&rdquo; and try a different path, where a dropped block
          just ends the run.
        </p>
      </InfoBox>

      <h2>Turns, and Why They Are the Unit That Matters</h2>
      <p>
        One pass through that loop is a <strong>turn</strong>: one model call plus the
        tool results it asked for. Turns are the natural unit for budgeting agent work
        because they are what actually grows — a hard task is not one expensive call, it
        is forty cheap ones, each re-reading everything that came before.
      </p>

      <p>
        This is why agent caps are usually expressed in turns rather than tokens or
        dollars. &quot;Stop after 40 turns&quot; is a limit you can reason about, set per
        role, and explain to yourself afterwards when you read the log.
      </p>

      <h2>Agents Do Not Talk to Each Other</h2>
      <p>
        In a multi-agent system the agents are not connected. There is no channel between
        them and no shared memory. When a Product Manager agent &quot;assigns work to an
        Engineer&quot;, what physically happens is:
      </p>

      <FlowChart
        title="What assignment really is"
        chart={"graph LR\n  PM[PM agent] -->|emits tool call| H1[Harness]\n  H1 -->|INSERT| DB[(tickets table)]\n  DB -->|later, separately| H2[Harness scheduler]\n  H2 -->|starts a new loop| ENG[Engineer agent]\n  style DB fill:#1a2744"}
      />

      <p>
        The PM emits a <code>create_ticket</code> tool call. The harness writes a row.
        Some time later — possibly minutes later, possibly after a restart — the
        scheduler reads that row and starts an Engineer loop with the ticket as its
        input. The two agents never meet, and the database is the only thing that
        connects them.
      </p>

      <InfoBox variant="warning" title="This is why &quot;just add more agents&quot; disappoints">
        Because coordination happens through rows in a table, multi-agent systems inherit
        every hard problem of distributed systems: stale reads, duplicated work, lost
        updates, work that silently never gets picked up. Adding a sixth role does not
        add a sixth collaborator — it adds another producer and consumer of the same
        queue, and another way for work to get stuck.
      </InfoBox>

      <h2>Vocabulary</h2>
      <p>
        Terms used consistently throughout this section, defined once here so later
        lessons can move faster.
      </p>

      <ul>
        <li><strong>Turn</strong> — one model call plus the tool results it requested.</li>
        <li><strong>Run</strong> — one complete agent loop, from a task being handed in to the agent finishing or being cut off. A run contains many turns.</li>
        <li><strong>Context window</strong> — the maximum input a model accepts in one call, counted in tokens. Everything the model &quot;knows&quot; on this call is inside it.</li>
        <li><strong>Context</strong> — loosely, the messages currently assembled for a call. &quot;Running out of context&quot; means the conversation no longer fits.</li>
        <li><strong>Compaction</strong> — replacing older turns with a summary so a long run keeps fitting.</li>
        <li><strong>System prompt</strong> — standing instructions sent on every call in a run. For an agent, this is where the role lives.</li>
        <li><strong>Role</strong> — a named bundle of system prompt, tool allowlist and turn cap. &quot;Engineer&quot; is a role, not a program.</li>
        <li><strong>Tool allowlist</strong> — the set of tools a given role may use, enforced by the harness rather than requested of the model.</li>
        <li><strong>Provider</strong> — whatever you call to get a model response: a hosted API, a local server, or a CLI you shell out to.</li>
        <li><strong>Orchestrator</strong> — an agent whose job is deciding what other agents do. Optional, and often better replaced by plain code.</li>
        <li><strong>Harness</strong> — all of the above, wired together and running.</li>
      </ul>

      <InfoBox variant="success" title="What to take from this lesson">
        A harness does four things a model cannot: it remembers, it executes, it refuses,
        and it schedules. Every later lesson in this section is a detailed treatment of
        one of those four. If you can explain what a harness does without using
        &quot;agent&quot; as a primitive, the rest of this material is downhill.
      </InfoBox>
    </LessonLayout>
  );
}
