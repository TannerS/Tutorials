import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function FrontendDesign() {
  return (
    <LessonLayout
      title="Frontend System Design"
      sectionId="interview-prep"
      lessonIndex={2}
      prev={{ path: '/interview-prep/typescript', label: 'TypeScript Interview Questions' }}
      next={{ path: '/interview-prep/coding', label: 'Live Coding Challenges' }}
    >

      {/* ─── Part 1: The Framework ─── */}

      <h2>The RADIO Framework</h2>
      <p>
        Frontend system design interviews test your ability to architect scalable, maintainable UIs
        under real-world constraints. The <strong>RADIO framework</strong> gives you a repeatable
        five-step structure: <strong>R</strong>equirements, <strong>A</strong>rchitecture,{' '}
        <strong>D</strong>ata Model, <strong>I</strong>nterface/API, and{' '}
        <strong>O</strong>ptimizations. Walk through each phase out loud so the interviewer can
        follow your reasoning.
      </p>

      <FlowChart
        title="RADIO Framework Overview"
        chart={"graph LR\nR[Requirements]-->A[Architecture]\nA-->D[Data Model]\nD-->I[Interface & API]\nI-->O[Optimizations]"}
      />

      <ul>
        <li><strong>Requirements</strong> — Clarify functional and non-functional needs before drawing anything.</li>
        <li><strong>Architecture</strong> — Decide on component breakdown, routing, and state strategy.</li>
        <li><strong>Data Model</strong> — Define the shape of data flowing through the UI.</li>
        <li><strong>Interface/API</strong> — Design the contract between the frontend and backend.</li>
        <li><strong>Optimizations</strong> — Address performance, accessibility, and resilience last.</li>
      </ul>

      <h2>Requirements Gathering</h2>
      <p>
        Spend the first 5 minutes asking clarifying questions. Interviewers reward candidates who
        surface constraints up front rather than discovering them mid-design.
      </p>

      <InfoBox variant="tip" title="Requirements Checklist">
        <ul>
          <li><strong>Functional:</strong> What are the core user flows? What is explicitly out of scope?</li>
          <li><strong>Scale:</strong> How many concurrent users? How many items per page?</li>
          <li><strong>Performance:</strong> Target load time? Core Web Vitals targets?</li>
          <li><strong>Accessibility:</strong> WCAG level required? Keyboard-only users?</li>
          <li><strong>Offline support:</strong> Service worker / background sync needed?</li>
          <li><strong>Internationalization:</strong> RTL languages? Multiple locales?</li>
          <li><strong>Auth:</strong> Public or authenticated? Role-based UI differences?</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question={"In a frontend system design interview, when should you raise non-functional requirements like accessibility and performance?"}
        options={[
          "Only if the interviewer explicitly asks",
          "During the Requirements phase, before designing anything",
          "At the end, after the full architecture is finalized",
          "Non-functional requirements are a backend concern"
        ]}
        correctIndex={1}
        explanation="Non-functional requirements constrain your architecture. Knowing the WCAG level, offline needs, and performance budget upfront changes which patterns you choose before you draw a single box."
      />

      <h2>Component Architecture</h2>
      <p>
        Break the UI into a component tree. Start at the page shell and work downward. Classify
        components as <em>containers</em> (own state, fetch data) vs <em>presentational</em> (pure
        render, receive everything via props). This separation makes components easier to test and
        reuse independently.
      </p>

      <FlowChart
        title="Sample App Component Tree"
        chart={"graph TD\nApp[App Shell]\nApp-->Header[Header]\nApp-->Main[Main Layout]\nApp-->Footer[Footer]\nMain-->Sidebar[Sidebar Nav]\nMain-->Feed[Feed Container]\nFeed-->FeedItem[FeedItem Card]\nFeed-->Sentinel[Load Sentinel]"}
      />

      <InfoBox variant="info" title="Container vs Presentational Split">
        Container components own data fetching, subscriptions, and dispatch. Presentational
        components receive everything via props and focus purely on rendering. The container
        handles <em>what</em> to show; the presentational component handles <em>how</em> to show it.
      </InfoBox>

      <h2>State Management Decisions</h2>
      <p>
        Not every problem needs Redux. Walk through a decision tree during your interview to show
        you understand the trade-offs at each level of the state hierarchy.
      </p>

      <FlowChart
        title="State Management Decision Tree"
        chart={"graph TD\nQ[Where does state live?]\nQ-->|Single component|Local[useState or useReducer]\nQ-->|Shared across siblings|Lifted[Lift to common parent]\nQ-->|Avoids deep prop drilling|Ctx[React Context]\nQ-->|Global + async + cache|Store[External Store]\nStore-->|Server state|RQ[TanStack Query]\nStore-->|Client-only state|ZS[Zustand or Redux Toolkit]"}
      />

      <h2>API Design</h2>
      <p>
        Define the REST endpoints or GraphQL queries your UI needs. Think about pagination strategy,
        error shapes, and caching headers. Present a thin API layer that abstracts fetch logic away
        from your components.
      </p>

      <CodeBlock language="typescript" title="API Layer Pattern">
{`// src/api/feed.ts
const BASE = '/api/v1';

export interface FeedItem { id: string; text: string; author: string; createdAt: string; }
export interface FeedPage  { items: FeedItem[]; nextCursor: string | null; }

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function getFeedPage(cursor?: string): Promise<FeedPage> {
  const url = cursor ? \`\${BASE}/feed?cursor=\${cursor}\` : \`\${BASE}/feed\`;
  const res  = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

// GET  /api/v1/feed?cursor=<token>   → FeedPage
// POST /api/v1/feed                  → FeedItem  (201)
// DELETE /api/v1/feed/:id            → 204`}
      </CodeBlock>

      <h2>Performance Considerations</h2>
      <p>
        Mention these proactively — they signal senior-level thinking. Map each technique to the
        specific problem it solves rather than listing them as a blanket wishlist.
      </p>

      <InfoBox variant="note" title="Performance Techniques — When to Reach for Each">
        <ul>
          <li><strong>Code splitting / React.lazy:</strong> Large pages or rarely-visited routes</li>
          <li><strong>Virtualization (react-window):</strong> Lists with 100+ visible items</li>
          <li><strong>Debounce / throttle:</strong> Search inputs, scroll handlers, resize events</li>
          <li><strong>memo / useMemo / useCallback:</strong> Expensive derived data, stable child renders</li>
          <li><strong>Stale-while-revalidate:</strong> Data that changes infrequently (user profile, config)</li>
          <li><strong>Optimistic updates:</strong> Mutations that must feel instant (chat, likes, reorder)</li>
          <li><strong>Image optimization:</strong> Lazy loading, WebP, responsive srcset, CDN delivery</li>
        </ul>
      </InfoBox>

      <h2>Accessibility Plan</h2>
      <p>
        Always address accessibility in your optimizations phase. Interviewers at top companies
        explicitly listen for this — it differentiates senior candidates.
      </p>

      <InfoBox variant="tip" title="Accessibility Checklist">
        <ul>
          <li>Semantic HTML — headings, landmarks, <code>&lt;button&gt;</code> vs <code>&lt;div onClick&gt;</code></li>
          <li>Keyboard navigation — logical focus order, visible focus rings, no keyboard traps</li>
          <li>ARIA — roles, <code>aria-label</code>, <code>aria-live</code> regions for dynamic updates</li>
          <li>Color contrast — WCAG AA minimum 4.5:1 for body text, 3:1 for large text</li>
          <li>Focus management — restore focus after modal close, announce route changes</li>
        </ul>
      </InfoBox>

      {/* ─── Part 2: Common Questions ─── */}

      <h2>Design an Autocomplete / Typeahead</h2>
      <p>
        Autocomplete is one of the most common frontend system design questions. Key challenges:
        debouncing network requests, caching results to avoid redundant calls, keyboard navigation
        through suggestions, and full screen reader accessibility.
      </p>

      <FlowChart
        title="Autocomplete Architecture"
        chart={"graph TD\nInput[Input Field]\nInput-->|keypress|Debounce[Debounce 300ms]\nDebounce-->|check|Cache{Cache hit?}\nCache-->|yes|Render[Render Suggestions]\nCache-->|no|API[Fetch /suggest?q=]\nAPI-->|store result|Cache\nRender-->|ArrowDown / ArrowUp|Nav[Keyboard Navigation]\nNav-->|Enter|Select[Commit Selection]"}
      />

      <CodeBlock language="typescript" title="useAutocomplete Hook">
{`function useAutocomplete(fetchSuggestions: (q: string) => Promise<string[]>) {
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const cache = useRef<Map<string, string[]>>(new Map());

  const debouncedFetch = useMemo(
    () =>
      debounce(async (q: string) => {
        if (!q.trim()) { setSuggestions([]); return; }
        if (cache.current.has(q)) {
          setSuggestions(cache.current.get(q)!);
          return;
        }
        const results = await fetchSuggestions(q);
        cache.current.set(q, results);
        setSuggestions(results);
      }, 300),
    [fetchSuggestions],
  );

  useEffect(() => { debouncedFetch(query); }, [query, debouncedFetch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    if (e.key === 'ArrowUp')   setActiveIndex(i => Math.max(i - 1, -1));
    if (e.key === 'Escape')    setSuggestions([]);
  };

  return { query, setQuery, suggestions, activeIndex, handleKeyDown };
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Why cache autocomplete results on the client instead of relying on the server each time?"}
        options={[
          "To prevent the input field from re-rendering",
          "To eliminate duplicate API calls when the user retypes the same prefix",
          "Because server responses for autocomplete are always stale",
          "Client-side caching is not beneficial for autocomplete"
        ]}
        correctIndex={1}
        explanation="Users frequently retype the same prefix. Storing results in a Map means the second time 'app' is typed, results appear instantly with zero network latency and no extra server load."
      />

      <h2>Design an Infinite Scroll Feed</h2>
      <p>
        Infinite scroll requires cursor-based pagination, an Intersection Observer to detect the
        sentinel element at the bottom of the list, and optionally virtualization to cap DOM node
        count at scale.
      </p>

      <FlowChart
        title="Infinite Scroll Data Flow"
        chart={"graph TD\nFeed[Feed Container]\nFeed-->Items[Render Item List]\nFeed-->Sentinel[Bottom Sentinel div]\nSentinel-->|enters viewport|Observer[Intersection Observer]\nObserver-->|trigger|Fetch[Fetch Next Page]\nFetch-->|cursor token|API[GET /feed?cursor=X]\nAPI-->|append items|Items\nFetch-->|null cursor|End[End of Feed Message]"}
      />

      <CodeBlock language="typescript" title="useInfiniteScroll Hook">
{`function useInfiniteScroll<T>(
  fetchPage: (cursor?: string) => Promise<{ items: T[]; nextCursor: string | null }>,
) {
  const [items,   setItems]   = useState<T[]>([]);
  const [cursor,  setCursor]  = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const page = await fetchPage(cursor);
    setItems(prev => [...prev, ...page.items]);
    setCursor(page.nextCursor ?? undefined);
    setHasMore(page.nextCursor !== null);
    setLoading(false);
  }, [cursor, loading, hasMore, fetchPage]);

  useEffect(() => {
    const el  = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return { items, loading, hasMore, sentinelRef };
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Cursor vs Offset Pagination">
        Use <strong>cursor-based</strong> pagination for feeds — it handles inserts and deletes
        between pages without causing items to skip or duplicate. Use <strong>offset</strong>{' '}
        pagination only for stable, infrequently-changing datasets like admin tables with
        server-side sorting.
      </InfoBox>

      <h2>Design a Real-Time Chat UI</h2>
      <p>
        Real-time chat introduces WebSocket lifecycle management, optimistic message rendering,
        and reconnection strategy with exponential backoff. The UI must handle network drops
        gracefully without losing pending messages.
      </p>

      <FlowChart
        title="WebSocket Chat Architecture"
        chart={"graph TD\nUI[Chat UI]\nUI-->|connect on mount|WS[WebSocket Server]\nWS-->|inbound message|UI\nUI-->|send|Optimistic[Optimistic Render pending]\nOptimistic-->|server ack|Confirmed[Update to confirmed]\nOptimistic-->|error|Rollback[Rollback + show retry]\nWS-->|close event|Backoff[Exponential Backoff]\nBackoff-->|reconnect|WS"}
      />

      <CodeBlock language="typescript" title="useChatSocket Hook">
{`function useChatSocket(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const wsRef      = useRef<WebSocket | null>(null);
  const retryDelay = useRef(1000);

  const connect = useCallback(() => {
    const ws = new WebSocket(\`wss://api.example.com/chat/\${roomId}\`);
    wsRef.current = ws;

    ws.onopen    = () => { retryDelay.current = 1000; };
    ws.onmessage = ({ data }) => {
      const msg: Message = JSON.parse(data);
      setMessages(prev =>
        prev.some(m => m.id === msg.id)
          ? prev.map(m => m.id === msg.id ? { ...m, status: 'confirmed' } : m)
          : [...prev, { ...msg, status: 'confirmed' }],
      );
    };
    ws.onclose = () => {
      setTimeout(connect, retryDelay.current);
      retryDelay.current = Math.min(retryDelay.current * 2, 30_000);
    };
  }, [roomId]);

  const sendMessage = (text: string) => {
    const optimistic: Message = { id: crypto.randomUUID(), text, status: 'pending' };
    setMessages(prev => [...prev, optimistic]);
    wsRef.current?.send(JSON.stringify(optimistic));
  };

  useEffect(() => { connect(); return () => wsRef.current?.close(); }, [connect]);
  return { messages, sendMessage };
}`}
      </CodeBlock>

      <h2>Design a Drag-and-Drop Kanban Board</h2>
      <p>
        A Kanban board tests your ability to model complex ordered state across multiple columns,
        handle optimistic reordering, and keep the UI responsive during drags without waiting for
        server confirmation.
      </p>

      <FlowChart
        title="Kanban Component Hierarchy"
        chart={"graph TD\nBoard[KanbanBoard]\nBoard-->DragCtx[DragContext Provider]\nBoard-->Col1[Column: To Do]\nBoard-->Col2[Column: In Progress]\nBoard-->Col3[Column: Done]\nCol1-->C1[Card]\nCol1-->C2[Card]\nCol2-->C3[Card]\nCol3-->C4[Card]"}
      />

      <CodeBlock language="typescript" title="Kanban State Shape & Reorder Logic">
{`interface Card  { id: string; title: string; description: string; }
interface Column { id: string; title: string; cardIds: string[]; }
interface BoardState {
  cards:       Record<string, Card>;
  columns:     Record<string, Column>;
  columnOrder: string[];
}

// Immutably move a card between (or within) columns
function moveCard(
  state:     BoardState,
  cardId:    string,
  fromColId: string,
  toColId:   string,
  toIndex:   number,
): BoardState {
  const from     = state.columns[fromColId];
  const to       = state.columns[toColId];
  const fromIds  = from.cardIds.filter(id => id !== cardId);
  const toIds    = [...to.cardIds.filter(id => id !== cardId)]; // guard same-col move
  toIds.splice(toIndex, 0, cardId);
  return {
    ...state,
    columns: {
      ...state.columns,
      [fromColId]: { ...from, cardIds: fromIds },
      [toColId]:   { ...to,   cardIds: toIds   },
    },
  };
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Why store cardIds as an ordered array rather than embedding full card objects inside each column?"}
        options={[
          "Arrays are always faster than objects in JavaScript",
          "Normalization keeps cards as a single source of truth; columns only reference ids",
          "Embedded objects cannot be serialized to JSON",
          "React enforces flat state — nested objects cause re-render loops"
        ]}
        correctIndex={1}
        explanation="Normalized state means a card's data lives in exactly one place. Reordering or moving a card only mutates the cardIds array — no data duplication and no risk of the same card having different content in two columns."
      />

      <h2>Design a Schema-Driven Form Builder</h2>
      <p>
        A form builder renders fields dynamically from a JSON schema fetched from the server.
        Key challenges: dynamic validation rules, conditional field visibility, and cleanly
        separating the schema definition from the live form values.
      </p>

      <FlowChart
        title="Schema-Driven Form Architecture"
        chart={"graph TD\nSrc[Server or Config]\nSrc-->Schema[Form Schema JSON]\nSchema-->Renderer[FormRenderer]\nRenderer-->|field.type=text|TI[TextInput]\nRenderer-->|field.type=select|SI[SelectInput]\nRenderer-->|field.type=checkbox|CB[CheckboxInput]\nRenderer-->|onChange|Values[Form Values State]\nValues-->|showIf eval|Renderer\nValues-->|validate|Errors[Validation Errors]\nErrors-->TI\nErrors-->SI"}
      />

      <CodeBlock language="typescript" title="Form Schema & Renderer">
{`interface FieldSchema {
  id:      string;
  type:    'text' | 'select' | 'checkbox' | 'textarea';
  label:   string;
  required?:  boolean;
  options?:   string[];                            // select only
  showIf?:    { field: string; value: string };   // conditional visibility
  validate?:  (value: string) => string | null;   // inline rule
}

interface FormSchema { id: string; title: string; fields: FieldSchema[]; }

// Example schema — could be fetched from /api/forms/:id
const contactForm: FormSchema = {
  id: 'contact', title: 'Contact Us',
  fields: [
    { id: 'name',    type: 'text',     label: 'Full Name', required: true },
    { id: 'reason',  type: 'select',   label: 'Reason',    options: ['Support', 'Sales', 'Other'] },
    { id: 'details', type: 'textarea', label: 'Details',
      showIf: { field: 'reason', value: 'Other' } },
  ],
};

function FormRenderer({ schema }: { schema: FormSchema }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const visible = schema.fields.filter(
    f => !f.showIf || values[f.showIf.field] === f.showIf.value,
  );

  const handleChange = (id: string, val: string) => {
    setValues(prev => ({ ...prev, [id]: val }));
    const field = schema.fields.find(f => f.id === id);
    const err   = field?.validate?.(val);
    setErrors(prev => err ? { ...prev, [id]: err } : (delete prev[id], { ...prev }));
  };

  return (
    <form>
      {visible.map(field => (
        <FieldComponent
          key={field.id}
          schema={field}
          value={values[field.id] ?? ''}
          error={errors[field.id]}
          onChange={val => handleChange(field.id, val)}
        />
      ))}
    </form>
  );
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"What is the primary advantage of fetching a form's schema from the server rather than hard-coding fields in JSX?"}
        options={[
          "Server-rendered schemas always validate faster than client-side JSX",
          "The schema can change without a frontend deploy, giving product teams self-service control",
          "Hard-coded JSX forms cannot support conditional field visibility",
          "React cannot render more than 10 static fields efficiently"
        ]}
        correctIndex={1}
        explanation="When the schema lives on the server, product or ops teams can add, remove, or reorder fields without a frontend release cycle. The FormRenderer stays generic and unchanged — only the config drives the UI."
      />

      <InfoBox variant="success" title="Putting It All Together">
        In every frontend system design interview, follow <strong>RADIO</strong>: clarify
        requirements, sketch the component tree, define your data model, design the API layer, then
        proactively address performance and accessibility. The five archetypes above — autocomplete,
        infinite scroll, real-time chat, Kanban, and form builder — cover the vast majority of
        patterns you will encounter. Master these and you can adapt them to any variation the
        interviewer throws your way.
      </InfoBox>

    </LessonLayout>
  );
}
