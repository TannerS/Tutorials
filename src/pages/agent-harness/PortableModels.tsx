import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function PortableModels() {
  return (
    <LessonLayout
      title="Any Model, Any Provider"
      sectionId="agent-harness"
      lessonIndex={6}
      prev={{ path: '/agent-harness/operating', label: 'Operating & Extending' }}
      next={null}
    >
      <p>
        Everything in this section so far has been about harness structure, and structure is
        provider-independent on purpose. This lesson is about the part that is not: the seam
        where your loop meets a model. Getting that seam right is what lets one harness drive a
        frontier API, an open-weight model on your own hardware, and whatever replaces both next
        year.
      </p>
      <p>
        That is worth doing for four reasons that have nothing to do with brand loyalty:{' '}
        <strong>cost</strong> (mechanical work does not need a frontier model),{' '}
        <strong>privacy</strong> (some code cannot leave the building),{' '}
        <strong>availability</strong> (a provider outage should degrade your harness, not stop
        it), and <strong>leverage</strong> (if swapping models is a one-line change, you can
        measure the swap instead of arguing about it).
      </p>

      <InfoBox variant="note" title="Everything measured here ran locally">
        The transcripts in this lesson come from Ollama 0.33.2 serving open-weight models on one
        machine &mdash; <code>gpt-oss:20b</code> and <code>gemma3</code> &mdash; through its
        OpenAI-compatible endpoint. No API keys, no network. The point of using local models for
        the measurements is that you can reproduce every one of them for free.
      </InfoBox>

      <h2>There Are Really Only Two Dialects</h2>
      <p>
        The landscape looks fragmented and mostly is not. Almost every provider and local
        runtime speaks one of two wire formats, and the first has become the de-facto lingua
        franca largely by accident:
      </p>

      <ul>
        <li>
          <strong>OpenAI-compatible</strong> &mdash; <code>POST /v1/chat/completions</code>.
          Spoken by OpenAI, and deliberately emulated by Ollama, vLLM, llama.cpp&apos;s server,
          LM Studio, and most hosted open-weight providers. One client reaches all of them;
          usually only <code>base_url</code> and <code>model</code> change.
        </li>
        <li>
          <strong>Anthropic Messages</strong> &mdash; <code>POST /v1/messages</code>. Different
          enough in the places that matter that it needs its own adapter, which the{' '}
          <a href="/ai-agents/concepts">Claude-specific lessons</a> cover in detail.
        </li>
      </ul>

      <p>
        Gemini has its own native shape but also publishes an OpenAI-compatible surface, which
        is the pattern to expect: whatever a provider prefers natively, it tends to ship the
        common dialect too. So the practical architecture is one internal format plus thin
        adapters, not a client per vendor.
      </p>

      <FlowChart
        title="One loop, one internal format, thin adapters"
        chart={"graph TD\nL[Your agent loop - speaks ONE internal format] --> A[Adapter: OpenAI-compatible]\nL --> B[Adapter: Anthropic Messages]\nA --> O1[OpenAI]\nA --> O2[Ollama / vLLM / llama.cpp - local]\nA --> O3[Hosted open-weight providers]\nA --> O4[Gemini compatibility surface]\nB --> C1[Claude]\nL --> LED[Ledger: records WHICH model served each step]"}
      />

      <h2>What Actually Differs</h2>
      <p>
        The differences are small in number and entirely mechanical &mdash; which is good news,
        because it means an adapter is a day of work rather than a project. Here is the same
        request against both dialects, with the fields that move:
      </p>

      <CodeBlock language="text" title="Measured: the response shape, side by side">
{`                     OpenAI-compatible          Anthropic Messages
                     (measured, Ollama 0.33.2)

the text             choices[0].message         content[0].text
                       .content

why it stopped       finish_reason: "stop"      stop_reason: "end_turn"
                     finish_reason: "tool_calls" stop_reason: "tool_use"

tokens in            usage.prompt_tokens        usage.input_tokens
tokens out           usage.completion_tokens    usage.output_tokens
total                usage.total_tokens         (absent -- you add them)
cache                (no standard field)        usage.cache_read_input_tokens
                                                usage.cache_creation_input_tokens

system prompt        a message with             a TOP-LEVEL "system" field,
                     role: "system"             not a message

tool call            message.tool_calls[0]      a content block of
                       .function.arguments        type "tool_use", .input
                     -> a JSON *STRING*         -> an already-parsed OBJECT

tool result          role: "tool" message       a "tool_result" block inside
                     with tool_call_id          a USER message`}
      </CodeBlock>

      <InfoBox variant="warning" title="The two that cause real bugs">
        <p>
          <strong>Arguments are a string in one dialect and an object in the other.</strong> In
          the OpenAI shape, <code>function.arguments</code> is JSON <em>text</em> you must{' '}
          <code>JSON.parse</code> &mdash; and since it is generated text, it can be malformed or
          truncated, so that parse belongs in a <code>try</code>. Anthropic hands you a parsed
          object. Code written against one will silently mishandle the other: a `.city` lookup
          on a string returns <code>undefined</code> rather than throwing.
        </p>
        <p>
          <strong>The system prompt is a message in one and a top-level field in the
          other.</strong> Flatten an Anthropic-style <code>system</code> into the message array
          for a provider that wants it top-level and you have quietly demoted your operator
          instructions to ordinary conversation text &mdash; which, per the{' '}
          <a href="/agent-harness/guardrails">guardrails lesson</a>, is exactly the trust
          boundary you did not want to blur.
        </p>
      </InfoBox>

      <h2>Local Models: Two Findings That Change the Design</h2>
      <p>
        &ldquo;Run it locally&rdquo; is usually discussed as a cost and privacy decision. It is
        also a <em>capability</em> decision, and two measured results matter more than any
        benchmark score.
      </p>

      <h3>1. Tool support is per-model, not per-runtime</h3>
      <p>
        The same endpoint, the same request, two local models:
      </p>

      <CodeBlock language="text" title="Measured: identical tool-calling request, two models">
{`=== gpt-oss:20b ===
  finish_reason : tool_calls
  tool_calls    : YES
  name          : get_weather
  arguments     : {"city":"Tokyo","unit":"celsius"}

=== gemma3:latest ===
  ERROR: registry.ollama.ai/library/gemma3:latest does not support tools
         type: invalid_request_error`}
      </CodeBlock>

      <p>
        So a model can be perfectly good at prose and simply unable to participate in an agent
        loop at all. A harness that routes work to models must treat &ldquo;can this model call
        tools&rdquo; as a recorded capability per model, not an assumption per provider &mdash;
        and must fail a route cleanly when the answer is no, because this arrives as a 400, not
        as a degraded answer.
      </p>

      <h3>2. The endpoint does not enforce your schema</h3>
      <p>
        This is the finding that should change how you write tool handlers. The tool above
        declared <code>unit</code> with <code>enum: ["c", "f"]</code>. Three identical runs:
      </p>

      <CodeBlock language="text" title="Measured: gpt-oss:20b, three runs, enum was [&quot;c&quot;,&quot;f&quot;]">
{`run 1: {"city":"Tokyo","unit":"celsius"}   schema-valid: NO
run 2: {"city":"Tokyo","unit":"C"}         schema-valid: NO
run 3: {"city":"Tokyo","unit":"C"}         schema-valid: NO`}
      </CodeBlock>

      <p>
        Three for three. The model called the right tool with the right city every time &mdash;
        it is not broken &mdash; and every single call violated the enum. Note runs 2 and 3
        especially: <code>&quot;C&quot;</code> differs from the declared{' '}
        <code>&quot;c&quot;</code> only in case, so a handler written as{' '}
        <code>if (unit === &apos;c&apos;)</code> silently takes the wrong branch. That is worse
        than a crash, because nothing surfaces.
      </p>

      <InfoBox variant="danger" title="A JSON Schema sent to a plain endpoint is a hint, not a contract">
        <p>
          Nothing in the OpenAI-compatible request guaranteed conformance, and nothing in the
          response reported the violation. The schema was advice to the model, and the model
          took it loosely.
        </p>
        <p>
          This is precisely the gap that grammar-constrained sampling closes. Anthropic&apos;s{' '}
          <code>strict: true</code> constrains token selection so the output{' '}
          <em>cannot</em> leave the schema; OpenAI&apos;s structured outputs and vLLM&apos;s
          guided decoding do the same job by the same means. Where you have that, use it. Where
          you do not &mdash; which includes most local setups &mdash; the validation has to live
          in your harness:
        </p>
        <CodeBlock language="typescript" title="The non-negotiable shape of a portable tool handler">
{`// 1. parse, because arguments may be a string AND may be malformed
let args: unknown;
try {
  args = JSON.parse(call.function.arguments);
} catch {
  return toolError(call.id, "Arguments were not valid JSON. Re-emit the call.");
}

// 2. validate against the SAME schema you advertised -- zod, ajv, whatever
const parsed = GetWeather.safeParse(args);
if (!parsed.success) {
  // 3. hand the model a corrective message rather than throwing.
  //    Per the tool-use lessons, informative error text is what makes
  //    the next attempt succeed instead of repeating the mistake.
  return toolError(call.id, \`Invalid arguments: \${parsed.error.message}\`);
}

runTool(parsed.data);   // only now is it safe`}
        </CodeBlock>
        <p>
          Write this once in the adapter and every tool inherits it. Skip it and you have built
          a harness whose correctness depends on a model&apos;s goodwill.
        </p>
      </InfoBox>

      <h2>Routing: Spend Capability Where It Changes the Outcome</h2>
      <p>
        Once models are interchangeable, model choice becomes a per-step decision rather than a
        project-wide one. The useful split is not by task name but by whether the step requires{' '}
        <em>judgment</em>:
      </p>

      <CodeBlock language="text" title="A routing table worth starting from">
{`mechanical, verifiable, high volume        -> small or local model
  reformatting, extraction, classification,
  commit-message drafting, test-name
  generation, summarising a diff
  (a checker or a human can spot a bad one instantly)

judgment, hard to verify, low volume       -> frontier model
  design decisions, security review,
  debugging an unclear failure, anything
  touching a trust boundary
  (a plausible wrong answer is expensive)

needs a guaranteed schema                  -> a model/endpoint with
                                              constrained decoding,
                                              or validate-and-retry`}
      </CodeBlock>

      <InfoBox variant="warning" title="Two costs of routing that do not appear in the price list">
        <p>
          <strong>Caching is per model.</strong> As the{' '}
          <a href="/ai-agents/caching">caching lesson</a> measures, a cache is scoped to a
          model, so routing the same conversation to a second model starts from an empty cache
          and re-pays the full prefix. A cascade that looks cheaper per token can be more
          expensive per task for exactly this reason. Measure the task, not the token.
        </p>
        <p>
          <strong>Local inference is not free, it is differently paid.</strong> You stop paying
          per token and start paying in latency, memory and contention: a quantised 20B model
          holds a few GB of weights resident, and a long context costs more memory on top.
          Running two agents in parallel against one local runtime usually serialises them. The
          honest comparison is tasks completed per hour, not dollars per million tokens.
        </p>
      </InfoBox>

      <h2>Token Saving That Survives a Provider Swap</h2>
      <p>
        Most of what the <a href="/ai-agents/optimization">optimization lesson</a> covers is
        provider-specific tuning. These levers are not &mdash; they work on any model, including
        ones with no caching or budget features at all, because they reduce the number of tokens
        that exist rather than their price:
      </p>

      <ul>
        <li>
          <strong>Stop re-sending what the model does not need.</strong> The largest wins are
          almost always a tool result that returned a whole file where ten lines would do, or
          full history on a step that needed only the last turn.
        </li>
        <li>
          <strong>Summarise and externalise.</strong> Write the durable conclusion to the ledger
          and keep a pointer, not the transcript. This is the{' '}
          <a href="/agent-harness/memory">memory lesson&apos;s</a> whole premise and it is
          provider-independent.
        </li>
        <li>
          <strong>Keep the prefix byte-stable anyway.</strong> Even with no cache, a stable
          prefix is what makes a run reproducible &mdash; and it means you gain caching for free
          the moment you move to a provider that offers it.
        </li>
        <li>
          <strong>Shrink the tool surface per role.</strong> Every schema is re-sent every turn.
          A role with six relevant tools should not carry forty.
        </li>
        <li>
          <strong>Cap output, not just input.</strong> Output tokens are the expensive ones
          almost everywhere, and &ldquo;explain your reasoning at length&rdquo; in a system
          prompt is a standing order to spend them.
        </li>
      </ul>

      <InfoBox variant="tip" title="Count tokens without trusting a single number">
        <p>
          Tokenizers differ per model family, so a prompt is not a fixed number of tokens &mdash;
          the same text can differ by 10&ndash;20% across families, and more for code or
          non-English text. Do not port a budget between models on the assumption that a token
          is a token.
        </p>
        <p>
          The portable habit is to read the <code>usage</code> block off every response and log
          it, rather than estimating up front. Every dialect returns one; only the field names
          differ, which your adapter already normalises.
        </p>
      </InfoBox>

      <h2>The Ledger Has to Record the Model</h2>
      <p>
        One schema consequence, because it is cheap to add now and impossible to reconstruct
        later. The moment a harness can route to several models, every row in the audit ledger
        needs to say which one served it:
      </p>

      <CodeBlock language="sql" title="The columns that make a multi-model harness answerable">
{`ALTER TABLE run_step ADD COLUMN provider     TEXT NOT NULL;  -- 'anthropic' | 'openai' | 'ollama'
ALTER TABLE run_step ADD COLUMN model        TEXT NOT NULL;  -- the exact id, pinned
ALTER TABLE run_step ADD COLUMN prompt_tokens   INTEGER;     -- normalised by the adapter
ALTER TABLE run_step ADD COLUMN output_tokens   INTEGER;
ALTER TABLE run_step ADD COLUMN cached_tokens   INTEGER;     -- 0 where unsupported
ALTER TABLE run_step ADD COLUMN schema_retries  INTEGER;     -- how often validation failed`}
      </CodeBlock>

      <p>
        Those columns answer the questions that otherwise become arguments. Did quality drop
        last week because of a prompt change or because a route started landing on a smaller
        model? Is the local model actually cheaper per <em>completed task</em>, or is it
        burning three validation retries per call and losing? Which model is responsible for the
        failures in this run? Without <code>model</code> on the row, none of that is
        recoverable &mdash; and <code>schema_retries</code> is the column that would have caught
        the enum violations above in production rather than in a lab.
      </p>

      <InfoBox variant="success" title="What to take from this lesson">
        <ul>
          <li>Two dialects cover nearly everything; normalise to one internal format and write thin adapters.</li>
          <li>The differences that bite are arguments-as-string and the system prompt&apos;s position.</li>
          <li>Tool support is a per-model capability. Some capable models cannot call tools at all.</li>
          <li>A JSON Schema is a hint unless the endpoint constrains decoding. Validate in the harness; 3 of 3 local calls broke a trivial enum.</li>
          <li>Route by whether the step needs judgment, and remember a model switch costs you the cache.</li>
          <li>Record provider, model and normalised token counts per step, or you cannot attribute cost or regressions.</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
