import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function IPFrontend() {
  return (
    <LessonLayout
      title="Frontend System Design"
      sectionId="interview-prep"
      lessonIndex={2}
      prev={{ path: '/interview-prep/typescript', label: 'TypeScript Interview Q&A' }}
      next={{ path: '/interview-prep/coding', label: 'Live Coding Challenges' }}
    >
      <h2>Frontend System Design Interviews</h2>
      <p>
        Frontend system design questions ask you to design the architecture of a complete web application.
        These are common at senior+ interviews. Cover: component architecture, state management,
        performance, accessibility, and API design.
      </p>

      <h2>Framework for Any Frontend Design Question</h2>

      <FlowChart
        title="Frontend Design Framework"
        chart={"graph TD\n  A[Clarify Requirements] --> B[Define Scope]\n  B --> C[Component Architecture]\n  C --> D[State Management]\n  D --> E[Data Fetching Strategy]\n  E --> F[Performance Plan]\n  F --> G[Accessibility]\n  G --> H[Testing Strategy]"}
      />

      <InfoBox variant="tip" title="Step 1: Clarify Before Designing">
        <p>Always ask clarifying questions first:</p>
        <ul>
          <li>What scale? (100 users vs 10M users)</li>
          <li>Authenticated or public?</li>
          <li>Mobile support required?</li>
          <li>Real-time updates or polling?</li>
          <li>Offline support needed?</li>
          <li>What is the team size? (affects tech choice)</li>
          <li>Any existing tech constraints?</li>
        </ul>
      </InfoBox>

      <h2>Case Study: Design a News Feed (Facebook/Twitter style)</h2>

      <CodeBlock language="javascript" title="Requirements gathering">
{`// Functional requirements:
// - Show posts from followed users
// - Infinite scroll (not pagination)
// - Like, comment, share posts
// - Real-time updates for new posts
// - Images and videos in posts

// Non-functional:
// - < 2s initial load (LCP)
// - < 100ms interaction (FID/INP)
// - Works on mobile (3G networks)
// - Accessible (screen reader friendly)`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Component architecture">
{`// Component hierarchy
// App
// ├── FeedPage
// │   ├── StoryBar        (stories at top)
// │   ├── CreatePost      (text/media input)
// │   └── FeedList        (virtualized list)
// │       └── PostCard
// │           ├── PostHeader (avatar, name, time)
// │           ├── PostContent (text, media)
// │           └── PostActions (like, comment, share)
// │               └── CommentThread (lazy loaded)
// └── RightSidebar        (trending, suggestions)

// Key decisions:
// 1. Virtualize FeedList — don't render 1000 posts in DOM
//    Use react-virtual or react-window
// 2. Lazy load CommentThread — only when expanded
// 3. PostCard should be memoized — memo() with stable props
// 4. Image lazy loading with IntersectionObserver`}
      </CodeBlock>

      <CodeBlock language="jsx" title="State management strategy">
{`// Server state: TanStack Query (React Query)
// - Handles caching, deduplication, background refetch
// - Optimistic updates for likes

const { data: feed, fetchNextPage } = useInfiniteQuery({
  queryKey: ['feed', userId],
  queryFn: ({ pageParam }) => fetchFeed(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})

// Optimistic like mutation
const likeMutation = useMutation({
  mutationFn: likePost,
  onMutate: async (postId) => {
    await queryClient.cancelQueries({ queryKey: ['feed'] })
    const prev = queryClient.getQueryData(['feed'])
    queryClient.setQueryData(['feed'], old => toggleLike(old, postId))
    return { prev }
  },
  onError: (err, postId, ctx) => {
    queryClient.setQueryData(['feed'], ctx.prev)   // rollback
  },
})

// Global UI state: Zustand (modal open state, auth)
// Local state: useState (form inputs, expanded comments)`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Real-time updates strategy">
{`// WebSocket for real-time new posts
// Server-Sent Events for one-way updates (simpler)

function useFeedUpdates() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const es = new EventSource('/api/feed/stream')

    es.onmessage = (event) => {
      const newPost = JSON.parse(event.data)
      // Prepend to cached feed
      queryClient.setQueryData(['feed'], old => ({
        ...old,
        pages: [{
          posts: [newPost, ...old.pages[0].posts],
          nextCursor: old.pages[0].nextCursor,
        }, ...old.pages.slice(1)],
      }))
    }

    return () => es.close()
  }, [])
}

// "Show 5 new posts" button (Twitter/X pattern)
// Instead of auto-inserting (jarring), show a banner
// User clicks to see new posts → smooth UX`}
      </CodeBlock>

      <h2>Case Study: Design a Form Builder (Google Forms style)</h2>

      <CodeBlock language="jsx" title="Complex form builder architecture">
{`// State: deeply nested, high-frequency updates
// Use useReducer for form state (not useState)

const formReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_QUESTION':
      return { ...state, questions: [...state.questions, action.question] }
    case 'REORDER_QUESTIONS': {
      const questions = reorder(state.questions, action.from, action.to)
      return { ...state, questions }
    }
    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.id ? { ...q, ...action.updates } : q
        )
      }
  }
}

// DnD for question reordering: @dnd-kit/core (accessible)
// Virtualize question list if > 50 questions

// Auto-save with debounce
const debouncedSave = useMemo(
  () => debounce((state) => saveFormDraft(state), 2000),
  []
)
useEffect(() => { debouncedSave(formState) }, [formState])`}
      </CodeBlock>

      <h2>Performance Design Patterns</h2>

      <CodeBlock language="jsx" title="Virtualization and skeleton screens">
{`// Virtual list — only render visible items
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualFeed({ posts }) {
  const parentRef = useRef()
  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300,   // estimated post height
    overscan: 5,               // render 5 extra items above/below
  })

  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(vItem => (
          <div
            key={vItem.index}
            style={{ transform: \`translateY(\${vItem.start}px)\` }}
          >
            <PostCard post={posts[vItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Skeleton screens > spinners
// Show content placeholders (same shape as real content)
// Reduces perceived load time dramatically`}
      </CodeBlock>

      <h2>Accessibility in System Design</h2>

      <CodeBlock language="jsx" title="Accessible real-time announcements">
{`// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {newPostCount > 0 && \`\${newPostCount} new posts available\`}
</div>

// Focus management for modals
function Modal({ isOpen, onClose, children }) {
  const firstFocusRef = useRef()
  const previousFocusRef = useRef()

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement
      firstFocusRef.current?.focus()
    } else {
      previousFocusRef.current?.focus()  // restore focus
    }
  }, [isOpen])

  // Trap focus inside modal with keyboard handler
  return isOpen ? (
    <div role="dialog" aria-modal="true" onKeyDown={handleTabTrap}>
      <button ref={firstFocusRef} onClick={onClose} aria-label="Close modal">
        ×
      </button>
      {children}
    </div>
  ) : null
}`}
      </CodeBlock>

      <InteractiveChallenge
        question="In a frontend system design interview for a large social feed, what is the most important performance optimization to mention first?"
        options={[
          "Minifying JavaScript and CSS",
          "Virtualizing the feed list to render only visible items",
          "Using WebSockets instead of REST",
          "Memoizing all components with React.memo"
        ]}
        correctIndex={1}
        explanation="Virtualizing the feed list is the most impactful optimization for a social feed. Without virtualization, rendering 500+ posts adds 500+ DOM nodes, causing sluggish scrolling and massive memory usage. react-virtual or react-window only render the visible rows + a small overscan, keeping DOM nodes constant regardless of feed length. This should be your first mention when discussing feed performance."
      />

      <InteractiveChallenge
        question="For a news feed with real-time updates, why is showing a 'Show N new posts' banner better than automatically inserting posts at the top?"
        options={[
          "It reduces server load by batching updates",
          "Automatic insertion causes layout shift and disrupts reading position",
          "Browsers block automatic DOM insertions for security",
          "It is required by WCAG accessibility guidelines"
        ]}
        correctIndex={1}
        explanation="Automatically inserting new posts at the top shifts all existing content down, which: (1) disrupts the user's reading position — they lose their place, (2) causes Cumulative Layout Shift (CLS), hurting Core Web Vitals, and (3) triggers re-renders that can cause jank. Showing a 'Show 5 new posts' button lets users choose when to see new content, maintaining their scroll position and providing a smoother experience."
      />
    </LessonLayout>
  );
}
