import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SMPatterns() {
  return (
    <LessonLayout title="State Patterns" sectionId="state-mgmt" lessonIndex={4} prev={{ path: "/state-mgmt/comparison", label: "State Library Comparison" }} next={{ path: "/accessibility/intro", label: "Accessibility Introduction" }}>
      <p>Common state patterns that solve recurring problems: optimistic updates, undo/redo, derived state, and state machines.</p>
      <CodeBlock language="jsx" title="Advanced State Patterns">
{`// === OPTIMISTIC UPDATES ===
const { mutate } = useMutation({
  mutationFn: (newTodo) => api.post('/todos', newTodo),
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const prev = queryClient.getQueryData(['todos']);
    // Optimistically add to list before server confirms
    queryClient.setQueryData(['todos'], old => [...old, { ...newTodo, id: 'temp' }]);
    return { prev };  // rollback context
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(['todos'], context.prev);  // rollback
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
});

// === UNDO/REDO with useReducer ===
function useUndoable(initialState) {
  const [history, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'SET': return {
        past: [...state.past, state.present],
        present: action.payload,
        future: [],
      };
      case 'UNDO': return state.past.length === 0 ? state : {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      };
      case 'REDO': return state.future.length === 0 ? state : {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
      };
      default: return state;
    }
  }, { past: [], present: initialState, future: [] });
  return [history.present,
          (val) => dispatch({ type: 'SET', payload: val }),
          () => dispatch({ type: 'UNDO' }),
          () => dispatch({ type: 'REDO' }),
          history.past.length > 0,
          history.future.length > 0];
}`}
      </CodeBlock>
      <InteractiveChallenge
        question="What is an optimistic update in UI state management?"
        options={["A performance optimization that skips re-renders", "Immediately updating the UI as if the server request succeeded, then rolling back if it fails", "Pre-loading the next page's data", "Caching server responses locally"]}
        correctIndex={1}
        explanation="Optimistic updates immediately apply the change to the UI without waiting for the server to confirm. If the server request fails, the UI rolls back to the previous state. This makes UIs feel instant for operations that almost always succeed (likes, todo completion, cart updates) while still handling errors correctly."
      />

    </LessonLayout>
  );
}
