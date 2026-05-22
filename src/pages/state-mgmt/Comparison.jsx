import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SMComparison() {
  return (
    <LessonLayout title="State Library Comparison" sectionId="state-mgmt" lessonIndex={3} prev={{ path: "/state-mgmt/zustand", label: "Zustand" }} next={{ path: "/state-mgmt/patterns", label: "State Patterns" }}>
      <p>Choosing a state management library depends on team size, app complexity, and requirements. Here is a direct comparison of the main options.</p>
      <CodeBlock language="jsx" title="Library Comparison">
{`// CONTEXT + REDUCER — built-in, no dependencies
// Best for: small apps, simple state, prototypes
// Drawback: all consumers re-render on any state change

// ZUSTAND — 1KB, no boilerplate, selective subscriptions
// Best for: medium apps, team prefers simplicity
// const { user } = useUserStore(); // just works

// REDUX TOOLKIT — full-featured, excellent DevTools
// Best for: large teams, complex state, time-travel debugging needed
// const user = useSelector(selectCurrentUser);

// JOTAI — atomic state, fine-grained reactivity
// Best for: when you need atom-level granularity
// const [count, setCount] = useAtom(countAtom);

// REACT QUERY — server state only
// Best for: ALL apps — replaces data-fetching useEffects
// const { data } = useQuery({ queryKey: ['user'], queryFn: fetchUser });

// RECOMMENDED COMBINATION (works for 90% of apps):
// React Query (server state) + Zustand (client global state) + useState (local)

// Feature comparison:
// | Feature           | Context | Zustand | Redux  | Jotai |
// |-------------------|---------|---------|--------|-------|
// | Bundle size       | 0 KB    | 1 KB    | 11 KB  | 3 KB  |
// | Boilerplate       | Low     | Very low | High  | Low   |
// | DevTools          | No      | Yes     | Excellent | Yes |
// | Selective renders | No      | Yes     | Yes    | Yes   |
// | Async actions     | Manual  | Manual  | RTK    | Manual|
// | Persistence       | Manual  | Built-in| Manual | Manual|`}
      </CodeBlock>
      <InteractiveChallenge
        question="For a new medium-sized React app, what is the recommended state management combination?"
        options={["Redux Toolkit for everything", "React Query for server state + Zustand for client global state + useState for local state", "Context API for everything to avoid dependencies", "MobX for reactive state"]}
        correctIndex={1}
        explanation="The recommended modern combination: React Query handles all server state (API data, caching, background sync), Zustand handles global client state (cart, user preferences, UI that spans many components), and useState handles local component state. This covers all state types with minimal complexity."
      />

    </LessonLayout>
  );
}
