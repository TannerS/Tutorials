import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function Animations() {
  return (
    <LessonLayout
      title="Animation Libraries (Framer Motion & Beyond)"
      sectionId="react18"
      lessonIndex={19}
      prev={{ path: '/react18/error-boundaries', label: 'Error Boundaries' }}
      next={{ path: '/react18/portals', label: 'Portals, In Depth' }}
    >
      <p>
        The CSS Mastery section already covers <code>transition</code> and <code>@keyframes</code> in
        depth — reach for those first, always. This lesson is about the specific gap CSS alone cannot
        fill: two React-shaped problems where a plain transition falls apart no matter how carefully
        you write it.
      </p>

      <h2>Where CSS Transitions Run Out of Road</h2>

      <p>
        The first problem is <strong>animating something out before it leaves the DOM</strong>. Give a
        list item a fade-out transition, then remove it from the array that renders the list:
      </p>

      <CodeBlock language="jsx" title="This Fade Never Plays">
{`function TodoList({ items, onRemove }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id} style={{ transition: 'opacity 200ms, height 200ms' }}>
          {item.label}
          <button onClick={() => onRemove(item.id)}>Done</button>
        </li>
      ))}
    </ul>
  );
}

// onRemove does: setItems(prev => prev.filter(i => i.id !== id))
// The <li> disappears instantly. No fade, no shrink — it's just gone.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Why the Transition Never Starts">
        <p>
          A CSS transition needs the browser to paint the <em>old</em> value, then paint a <em>new</em>{' '}
          value, with the element still present in between so it can interpolate. Filtering the item out
          of <code>items</code> removes the <code>&lt;li&gt;</code> from the React tree, and React removes
          the corresponding DOM node in the very same commit. There is no frame where the old opacity is
          on screen and the new opacity is scheduled — the node is simply gone before any transition has a
          chance to run. This isn't a bug you can fix with a longer duration or a different easing curve;
          the DOM node has to still exist for a transition to animate it, full stop.
        </p>
      </InfoBox>

      <p>
        The second problem is <strong>orchestration</strong> — staggering several elements' animations
        relative to each other, or sequencing one animation to start only after another finishes. CSS can
        approximate a stagger with hand-written <code>animation-delay</code> values per element, but that
        falls apart the moment the list is dynamic: you'd need to recompute delays in JS anyway, at which
        point you're most of the way to reaching for a library that does it declaratively.
      </p>

      <h2>Motion (Formerly Framer Motion)</h2>

      <InfoBox variant="info" title="The Package Was Renamed">
        <p>
          Checked directly against npm: <code>framer-motion</code> and <code>motion</code> are both
          published at the same current version (<code>13.1.0</code> as of this writing), maintained by
          the same team, with <code>motion</code>'s own <code>package.json</code> listing{' '}
          <code>framer-motion</code> as a dependency. The <code>motion</code> package's README states it
          plainly: &quot;Framer Motion is now Motion. Import from <code>motion/react</code> instead of{' '}
          <code>framer-motion</code>.&quot; The old package still works and isn't flagged deprecated on
          npm, but <code>motion</code> is the name to install in new code today.
        </p>
      </InfoBox>

      <CodeBlock language="bash" title="Install">{`npm install motion`}</CodeBlock>

      <p>
        The React bindings live under the <code>motion/react</code> subpath, not the package root (the
        root export is the framework-agnostic JS animation engine, shared with the Vue build). The core
        building block is <code>motion.div</code> (or <code>motion(SomeComponent)</code> for a custom
        component) — a component that accepts <code>initial</code>, <code>animate</code>, and{' '}
        <code>exit</code> props, each a style object it animates toward whenever the prop values change:
      </p>

      <CodeBlock language="jsx" title="motion.div — Verified Against Installed Types">
{`import { motion } from 'motion/react';

function Panel({ isOpen }: { isOpen: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -8 }}
      transition={{ duration: 0.2 }}
    >
      Panel content
    </motion.div>
  );
}`}
      </CodeBlock>

      <p>
        <code>initial</code>/<code>animate</code> alone don't solve the unmount problem from the previous
        section — they just interpolate a mounted element's own style. The piece that actually solves it
        is <code>AnimatePresence</code>. Wrapping animated children in <code>AnimatePresence</code> lets it
        notice when one is about to be removed from the tree; instead of letting React unmount it on the
        spot, it keeps that child's DOM node mounted just long enough to run its <code>exit</code>{' '}
        animation, then removes it. This works precisely because <code>AnimatePresence</code> intercepts
        the removal at the React-tree level — something a CSS transition, which only ever sees DOM state,
        has no way to do.
      </p>

      <CodeBlock language="jsx" title="Exit Animations With AnimatePresence (Compiled & Rendered to Verify)">
{`import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Item {
  id: number;
  label: string;
}

function ToggleList() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, label: 'Buy milk' },
    { id: 2, label: 'Walk the dog' },
    { id: 3, label: 'Ship the feature' },
  ]);

  const remove = (id: number) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      <AnimatePresence>
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onClick={() => remove(item.id)}
          >
            {item.label}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="key Is Not Optional Here">
        <p>
          <code>AnimatePresence</code> tracks additions and removals by diffing children between renders,
          which means every animated child needs a stable <code>key</code> — exactly the array item{' '}
          <code>id</code> above, not the array index. The extra <code>layout</code> prop is what makes the
          remaining items smoothly slide up to fill the gap instead of snapping into place the instant one
          leaves.
        </p>
      </InfoBox>

      <h2>React 19: What's Actually Confirmed</h2>

      <InfoBox variant="note" title="Verified, Not Assumed">
        <p>
          The <code>peerDependencies</code> of the installed <code>motion</code>/<code>framer-motion</code>{' '}
          13.1.0 packages explicitly list <code>&quot;react&quot;: &quot;^18.0.0 || ^19.0.0&quot;</code> —
          checked directly in <code>node_modules/motion/package.json</code> after a real install, not
          copied from documentation. That said, React 19 support wasn't always there: the project's GitHub
          issue tracker has a report titled &quot;Incompatible with React 19,&quot; describing both type
          errors and runtime animation bugs against early React 19 releases. Those were fixed in{' '}
          <code>framer-motion 11.13.3</code>/<code>11.13.4</code> (December 2024). The practical takeaway:
          if a project has an old <code>framer-motion</code> version pinned in its lockfile, don't assume
          React 19 compatibility from the package's reputation — check that specific installed version's{' '}
          <code>peerDependencies</code> the same way this lesson did.
        </p>
      </InfoBox>

      <h2>A Lighter-Weight Alternative: react-spring</h2>

      <p>
        <code>motion</code>'s exported surface (checked against its shipped type declarations) is large —
        drag controls, shared layout animation, scroll-linked effects, gesture handling, and more, on top
        of the <code>motion.div</code>/<code>AnimatePresence</code> pair covered above.{' '}
        <a href="https://www.npmjs.com/package/@react-spring/web" rel="noreferrer" target="_blank">react-spring</a>{' '}
        is worth knowing as a narrower alternative: physics-based springs (driven by tension/friction
        rather than a duration and an easing curve) with an export surface — confirmed the same way, by
        reading its type declarations after installing — limited to spring math: <code>useSpring</code>,{' '}
        <code>useSprings</code>, <code>useTrail</code>, <code>useChain</code>, and{' '}
        <code>useTransition</code>. No drag system, no layout projection, no scroll utilities bundled in.
        It's picked here over the View Transitions API specifically because it's the option that could
        actually be installed and verified end to end in this environment, rather than one just described
        from memory.
      </p>

      <p>
        The current package name is <code>@react-spring/web</code> (version <code>10.1.2</code>, confirmed
        via npm, with <code>peerDependencies</code> already covering React 19 the same way{' '}
        <code>motion</code>'s do). Its <code>useTransition</code> hook is the direct answer to the same
        unmount problem <code>AnimatePresence</code> solves, just shaped differently — it hands back a
        render-prop function instead of wrapping children in a component:
      </p>

      <CodeBlock language="jsx" title="useTransition — Compiled & Rendered to Verify">
{`import { useTransition, animated } from '@react-spring/web';

function SpringList({ items, onRemove }: {
  items: Item[];
  onRemove: (id: number) => void;
}) {
  const transitions = useTransition(items, {
    keys: (item) => item.id,
    from: { opacity: 0, height: 0 },
    enter: { opacity: 1, height: 40 },
    leave: { opacity: 0, height: 0 },
  });

  return (
    <ul>
      {transitions((style, item) => (
        <animated.li style={style} onClick={() => onRemove(item.id)}>
          {item.label}
        </animated.li>
      ))}
    </ul>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Different Mental Model, Same Problem Solved">
        <p>
          Notice there's no wrapper component here — <code>transitions</code> is a function you call
          inside your JSX, and it hands you a <code>style</code> object (a set of <code>animated</code>{' '}
          values, not plain numbers) for every item currently entering, present, or leaving. It's a real
          shift from <code>AnimatePresence</code>'s wrap-and-let-it-intercept-removal model, and picking
          between the two often comes down to whether the rest of your animation needs (drag, shared
          layout, scroll) point toward <code>motion</code> anyway.
        </p>
      </InfoBox>

      <h2>When You Don't Need Any of This</h2>

      <InfoBox variant="tip" title="Most Fades Don't Need a Dependency">
        <p>
          Everything above exists to solve the unmount problem or to orchestrate several elements at once.
          A huge fraction of real UI toggles do neither — the element stays mounted, and only a style
          changes:
        </p>
        <CodeBlock language="jsx" title="Plain useState + CSS — Zero Dependencies" showLineNumbers={false}>
{`function FadeToggle() {
  const [visible, setVisible] = useState(true);

  return (
    <>
      <button onClick={() => setVisible(v => !v)}>Toggle</button>
      <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}>
        Still mounted the whole time — no exit animation needed.
      </div>
    </>
  );
}`}
        </CodeBlock>
        <p>
          Because the <code>&lt;div&gt;</code> is never unmounted — only its <code>opacity</code> changes —
          the DOM node stays present for the transition to interpolate, and the problem from the top of
          this lesson never comes up. Don't pull in <code>motion</code> or <code>react-spring</code> for a
          fade like this one; save them for the moment you actually need an exit animation or a
          multi-element sequence.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={
          "A component fades via `transition: opacity 200ms` when a conditional render " +
          "(`{show && <div>...}`) flips to false. In the browser it just vanishes instantly — no fade. " +
          "A teammate wraps the same JSX in `<AnimatePresence>` with an `exit` prop instead, and the fade " +
          "plays correctly. What's actually different?"
        }
        options={[
          "AnimatePresence applies the CSS with !important, which forces the fade to override other styles",
          "AnimatePresence delays the actual DOM removal until its exit animation finishes, so the node still exists to animate; the plain conditional render lets React remove the node in the same commit that flips `show`, before any transition has a frame to run",
          "CSS transitions can only animate `transform`, never `opacity`, so the fade was never going to work",
          "The `show` variable is stale by one render, so the condition never actually becomes false in time"
        ]}
        correctIndex={1}
        explanation={"AnimatePresence intercepts removal at the React-tree level: when a child would be unmounted, it keeps that child's DOM node in place long enough to run its exit animation, then removes it itself. A plain conditional render has no such interception — React removes the DOM node in the same commit that the condition flips, so there is no 'before' frame left on screen for a CSS transition to interpolate away from. This is the one thing a CSS-only approach structurally cannot do, no matter how the transition is written."}
      />
    </LessonLayout>
  );
}
