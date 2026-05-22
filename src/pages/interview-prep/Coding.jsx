import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function IPCoding() {
  return (
    <LessonLayout
      title="Live Coding Challenges"
      sectionId="interview-prep"
      lessonIndex={3}
      prev={{ path: '/interview-prep/frontend', label: 'Frontend System Design' }}
      next={null}
    >
      <h2>Live Coding Interview Strategies</h2>
      <p>
        Frontend live coding interviews typically ask you to implement React components, utility functions,
        or solve algorithm problems. Talk through your thinking, write clean code, and handle edge cases.
      </p>

      <InfoBox variant="tip" title="Live Coding Tips">
        <ul>
          <li>Clarify requirements before coding (input/output examples)</li>
          <li>Talk out loud — interviewers want to hear your thought process</li>
          <li>Write a simple solution first, optimize after</li>
          <li>Handle edge cases: empty arrays, null values, boundary conditions</li>
          <li>Test your solution with examples before finishing</li>
        </ul>
      </InfoBox>

      <h2>Challenge 1: Implement a Debounce Function</h2>

      <CodeBlock language="javascript" title="debounce implementation">
{`// Signature: debounce(fn, delay) => debouncedFn
// The debounced function delays calling fn until after 'delay'
// milliseconds have elapsed since the last call.

function debounce(fn, delay) {
  let timerId = null

  return function debounced(...args) {
    // Clear any existing timer
    if (timerId !== null) clearTimeout(timerId)

    // Set new timer
    timerId = setTimeout(() => {
      fn.apply(this, args)
      timerId = null
    }, delay)
  }
}

// Test:
const log = debounce((msg) => console.log(msg), 300)
log('a')  // cancelled
log('b')  // cancelled
log('c')  // logged after 300ms

// Follow-up: cancel() method
function debounceWithCancel(fn, delay) {
  let timerId = null
  function debounced(...args) {
    if (timerId) clearTimeout(timerId)
    timerId = setTimeout(() => { fn.apply(this, args); timerId = null }, delay)
  }
  debounced.cancel = () => { if (timerId) clearTimeout(timerId); timerId = null }
  return debounced
}`}
      </CodeBlock>

      <h2>Challenge 2: Implement useLocalStorage Hook</h2>

      <CodeBlock language="jsx" title="useLocalStorage hook">
{`function useLocalStorage(key, initialValue) {
  // Initialize from localStorage, fall back to initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      // Allow function as value (like useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error('useLocalStorage error:', error)
    }
  }

  // Sync across browser tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === key && e.newValue !== null) {
        setStoredValue(JSON.parse(e.newValue))
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [key])

  return [storedValue, setValue]
}

// Usage:
const [theme, setTheme] = useLocalStorage('theme', 'light')`}
      </CodeBlock>

      <h2>Challenge 3: Build a Typeahead Component</h2>

      <CodeBlock language="jsx" title="Typeahead / autocomplete">
{`function Typeahead({ suggestions, onSelect, placeholder }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef()

  const filtered = useMemo(
    () => suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())),
    [suggestions, query]
  )

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        if (activeIndex >= 0) {
          onSelect(filtered[activeIndex])
          setQuery(filtered[activeIndex])
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current.focus()
        break
    }
  }

  return (
    <div role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
      <input
        ref={inputRef}
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); setIsOpen(true); setActiveIndex(-1) }}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        aria-autocomplete="list"
        aria-controls="typeahead-list"
      />
      {isOpen && filtered.length > 0 && (
        <ul id="typeahead-list" role="listbox">
          {filtered.map((item, i) => (
            <li
              key={item}
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => { onSelect(item); setQuery(item); setIsOpen(false) }}
              onMouseEnter={() => setActiveIndex(i)}
              style={{ background: i === activeIndex ? '#252a3f' : 'transparent' }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}`}
      </CodeBlock>

      <h2>Challenge 4: Flatten a Nested Array</h2>

      <CodeBlock language="javascript" title="Array flattening (multiple approaches)">
{`// Recursive
function flatten(arr) {
  return arr.reduce((flat, item) =>
    Array.isArray(item) ? flat.concat(flatten(item)) : flat.concat(item)
  , [])
}

// Iterative (safer for very deep nesting)
function flattenIterative(arr) {
  const stack = [...arr]
  const result = []
  while (stack.length > 0) {
    const item = stack.pop()
    if (Array.isArray(item)) {
      stack.push(...item)
    } else {
      result.unshift(item)
    }
  }
  return result
}

// With depth limit
function flattenDepth(arr, depth = 1) {
  return depth > 0
    ? arr.reduce((flat, item) =>
        flat.concat(Array.isArray(item) ? flattenDepth(item, depth - 1) : item)
      , [])
    : arr.slice()
}

// Native (modern JS)
[1, [2, [3, [4]]]].flat()          // [1, 2, [3, [4]]]  (depth 1)
[1, [2, [3, [4]]]].flat(Infinity)  // [1, 2, 3, 4]`}
      </CodeBlock>

      <h2>Challenge 5: Promise.all from Scratch</h2>

      <CodeBlock language="javascript" title="Custom Promise.all implementation">
{`function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (promises.length === 0) {
      resolve([])
      return
    }

    const results = new Array(promises.length)
    let resolved = 0

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then(value => {
        results[index] = value
        resolved++
        if (resolved === promises.length) {
          resolve(results)
        }
      }).catch(reject)  // any rejection rejects all
    })
  })
}

// Test:
promiseAll([
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3),
]).then(console.log)  // [1, 2, 3]

// Bonus: promiseAllSettled
function promiseAllSettled(promises) {
  return promiseAll(promises.map(p =>
    Promise.resolve(p)
      .then(value => ({ status: 'fulfilled', value }))
      .catch(reason => ({ status: 'rejected', reason }))
  ))
}`}
      </CodeBlock>

      <h2>Challenge 6: Deep Clone an Object</h2>

      <CodeBlock language="javascript" title="Deep clone implementation">
{`function deepClone(value) {
  // Primitives and null
  if (value === null || typeof value !== 'object') return value

  // Date
  if (value instanceof Date) return new Date(value.getTime())

  // Array
  if (Array.isArray(value)) return value.map(deepClone)

  // Handle circular references with a WeakMap
  // (advanced version)
  const seen = new WeakMap()
  function clone(val) {
    if (val === null || typeof val !== 'object') return val
    if (seen.has(val)) return seen.get(val)
    if (val instanceof Date) return new Date(val.getTime())
    const result = Array.isArray(val) ? [] : {}
    seen.set(val, result)
    Object.keys(val).forEach(key => { result[key] = clone(val[key]) })
    return result
  }
  return clone(value)
}

// Modern alternative (no Date/circular support):
const clone = structuredClone(obj)  // native, handles most cases`}
      </CodeBlock>

      <InteractiveChallenge
        question="In the debounce implementation, why do we use 'fn.apply(this, args)' instead of 'fn(...args)'?"
        options={[
          "apply is faster than the spread operator",
          "It preserves the 'this' context of the debounced function's caller",
          "Spread operators do not work inside setTimeout",
          "apply handles more argument types than spread"
        ]}
        correctIndex={1}
        explanation="Using fn.apply(this, args) passes the calling context (this) along with the arguments to the original function. If the debounced function is a method on an object (e.g., obj.save = debounce(function() { this.data }, 300)), fn.apply(this, args) ensures 'this' inside fn refers to obj. Using fn(...args) would lose the context and 'this' would be undefined in strict mode."
      />

      <InteractiveChallenge
        question="In the Typeahead component, why is setTimeout used in the onBlur handler?"
        options={[
          "To animate the dropdown closing",
          "To allow click events on dropdown items to fire before the list is hidden",
          "To prevent multiple blur events from firing",
          "To debounce the close action for performance"
        ]}
        correctIndex={1}
        explanation="When a user clicks a dropdown item, the input's blur event fires first (before the click event). Without the setTimeout, the list would be hidden before the click's onClick handler runs, making items unclickable. The 150ms delay allows the click event to complete first. This is a classic pattern for accessible dropdowns. Alternatively, use onMouseDown (which fires before blur) with e.preventDefault() on the list items."
      />
    </LessonLayout>
  );
}
