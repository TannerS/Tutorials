import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Animations() {
  return (
    <LessonLayout
      title="Animations & Transitions"
      sectionId="css-mastery"
      lessonIndex={3}
      prev={{ path: '/css-mastery/responsive', label: 'Responsive Design' }}
      next={{ path: '/css-mastery/variables', label: 'Custom Properties & Modern CSS' }}
    >
      <h2>CSS Transitions</h2>
      <p>
        Transitions interpolate between two states when a property changes. They require a trigger
        (like <code>:hover</code> or a class toggle) and only animate between a start and end value —
        no intermediate keyframes.
      </p>

      <h3>Transition Longhand Properties</h3>
      <p>
        Four properties control transitions independently: <code>transition-property</code> specifies
        which CSS properties to animate, <code>transition-duration</code> sets how long the animation
        takes, <code>transition-timing-function</code> defines the acceleration curve, and
        <code>transition-delay</code> adds a wait before the transition begins.
      </p>
      <CodeBlock language="css" title="Transition Longhand">{`.card {
  background: #1a1a2e;
  transform: scale(1);

  transition-property: background, transform;
  transition-duration: 300ms, 200ms;
  transition-timing-function: ease-out, ease-in-out;
  transition-delay: 0ms, 50ms;
}

.card:hover {
  background: #16213e;
  transform: scale(1.02);
}`}</CodeBlock>

      <p>
        Each longhand accepts a comma-separated list, mapping 1:1 to each property being transitioned.
        If you supply fewer values than properties, the browser cycles through the list.
      </p>

      <h3>Transition Shorthand</h3>
      <p>
        The shorthand combines all four in one declaration. Order matters: duration must come before
        delay (both are time values, so the parser uses position to distinguish them).
      </p>
      <CodeBlock language="css" title="Shorthand Syntax">{`/* property | duration | timing-function | delay */
.btn {
  transition: background 250ms ease-out,
              transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1) 50ms,
              box-shadow 300ms ease;
}

/* transition: all is tempting but hurts performance —
   it transitions every property that changes, including
   layout-triggering ones like width/height */
.avoid-this {
  transition: all 300ms ease; /* animates everything — bad */
}`}</CodeBlock>

      <InfoBox variant="warning" title="Avoid transition: all">
        Using <code>transition: all</code> will animate every property change, including ones that
        trigger layout recalculations (width, height, padding, margin). Always explicitly list the
        properties you intend to animate. This is not just a best practice — it directly impacts
        render performance.
      </InfoBox>

      <h3>Timing Functions &amp; cubic-bezier()</h3>
      <p>
        Named easing keywords are aliases for specific cubic-bezier curves. The function takes four
        control points <code>cubic-bezier(x1, y1, x2, y2)</code> that define a Bézier curve from
        (0,0) to (1,1). The x-axis is time progression, y-axis is output progression.
      </p>
      <CodeBlock language="css" title="Named Easings as cubic-bezier">{`/* linear:       cubic-bezier(0, 0, 1, 1)     — constant speed */
/* ease:         cubic-bezier(0.25, 0.1, 0.25, 1)   — fast start, slow end (default) */
/* ease-in:      cubic-bezier(0.42, 0, 1, 1)   — slow start, fast end */
/* ease-out:     cubic-bezier(0, 0, 0.58, 1)   — fast start, slow end */
/* ease-in-out:  cubic-bezier(0.42, 0, 0.58, 1) — slow start and end */

/* Custom spring-like overshoot: y values > 1 overshoot the target */
.bouncy {
  transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Snappy UI feel */
.snappy {
  transition: transform 200ms cubic-bezier(0.2, 0, 0, 1);
}

/* steps() for frame-by-frame sprite animations */
.sprite {
  transition: background-position 600ms steps(6);
}`}</CodeBlock>

      <h2>CSS Keyframe Animations</h2>
      <p>
        Unlike transitions (two states, requires trigger), <code>@keyframes</code> animations define
        multi-step sequences that can run independently, loop, reverse, and pause. They decouple the
        animation definition from the element that uses it.
      </p>

      <h3>@keyframes Syntax</h3>
      <CodeBlock language="css" title="Keyframe Definitions">{`@keyframes fadeSlideIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* from/to shorthand for simple two-state animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}`}</CodeBlock>

      <h3>Animation Longhand Properties</h3>
      <CodeBlock language="css" title="Animation Properties">{`.element {
  animation-name: fadeSlideIn;
  animation-duration: 600ms;
  animation-timing-function: ease-out;
  animation-delay: 100ms;
  animation-iteration-count: 1;       /* infinite | <number> */
  animation-direction: normal;         /* normal | reverse | alternate | alternate-reverse */
  animation-fill-mode: both;           /* none | forwards | backwards | both */
  animation-play-state: running;       /* running | paused */
}`}</CodeBlock>

      <h3>Animation Shorthand</h3>
      <CodeBlock language="css" title="Shorthand">{`/* name | duration | timing | delay | count | direction | fill | play-state */
.element {
  animation: fadeSlideIn 600ms ease-out 100ms 1 normal both running;
}

/* Multiple animations separated by commas */
.complex {
  animation:
    fadeIn 300ms ease-out both,
    slideUp 500ms cubic-bezier(0.2, 0, 0, 1) 150ms both;
}`}</CodeBlock>

      <h3>animation-fill-mode Deep Dive</h3>
      <p>
        This is the most misunderstood animation property. It controls what styles apply before
        the animation starts (during delay) and after it ends.
      </p>
      <CodeBlock language="css" title="fill-mode Comparison">{`/* none (default): element snaps back to its original styles
   after animation ends. During delay, original styles apply. */

/* forwards: after animation ends, element retains the styles
   from the LAST keyframe (100% or "to"). */

/* backwards: during the delay period, element applies styles
   from the FIRST keyframe (0% or "from") instead of its
   original styles. After animation, reverts to original. */

/* both: combines forwards AND backwards.
   During delay → first keyframe styles.
   After end → last keyframe styles.
   This is almost always what you want. */

.fade-in {
  opacity: 0; /* initial state */
  animation: fadeIn 500ms ease-out 200ms both;
  /* "both" means:
     - During 200ms delay: opacity is 0 (from 0% keyframe) ✓
     - After animation: opacity stays 1 (from 100% keyframe) ✓
     Without "both": element flashes to full opacity during
     delay, then animates, which looks broken. */
}`}</CodeBlock>

      <InfoBox variant="tip" title="Always Use fill-mode: both">
        Unless you have a specific reason not to, use <code>animation-fill-mode: both</code> (or
        <code>both</code> in the shorthand). It prevents the jarring flash that occurs when an
        element&apos;s pre-animation styles differ from the first keyframe, and keeps the end state
        stable. The only exception is looping animations where you want the element to reset.
      </InfoBox>

      <h3>animation-play-state</h3>
      <p>
        Toggle between <code>running</code> and <code>paused</code> to freeze/resume animations.
        Useful for hover-to-pause patterns or respecting user preferences.
      </p>
      <CodeBlock language="css" title="Pause on Hover">{`.spinner {
  animation: rotate 1s linear infinite;
}
.spinner:hover {
  animation-play-state: paused;
}

/* Or toggle via a class from JavaScript */
.animation-paused {
  animation-play-state: paused !important;
}`}</CodeBlock>

      <h2>Transforms</h2>
      <p>
        The <code>transform</code> property applies geometric transformations without triggering
        layout. Transforms are composited on the GPU, making them ideal for animations.
      </p>
      <CodeBlock language="css" title="Transform Functions">{`/* Translation — moves element without affecting layout */
.slide   { transform: translate(100px, 50px); }
.slideX  { transform: translateX(-50%); }  /* percentage = own width */
.slideY  { transform: translateY(20px); }

/* Rotation */
.rotate  { transform: rotate(45deg); }
.rotate3d { transform: rotateX(30deg) rotateY(45deg); }

/* Scale — 1 is original size */
.grow    { transform: scale(1.1); }
.squish  { transform: scaleX(0.8) scaleY(1.2); }

/* Skew — slants the element */
.slant   { transform: skew(10deg, 5deg); }

/* Combining transforms — order matters!
   Transforms apply RIGHT to LEFT (like matrix multiplication) */
.combined {
  /* First scales, then rotates, then translates */
  transform: translateX(100px) rotate(45deg) scale(1.2);
}

/* Centering trick: move 50% of parent, then -50% of self */
.centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}`}</CodeBlock>

      <h3>transform-origin</h3>
      <p>
        Sets the point around which transforms are applied. Default is <code>center center</code> (50% 50%).
        Changing it dramatically alters rotation and scale behavior.
      </p>
      <CodeBlock language="css" title="transform-origin">{`/* Rotate from top-left corner instead of center */
.door {
  transform-origin: left center;
  transition: transform 400ms ease;
}
.door:hover { transform: rotateY(-30deg); }

/* Scale from bottom — useful for growing tooltips/dropdowns */
.tooltip {
  transform-origin: top center;
  transform: scaleY(0);
  transition: transform 200ms ease-out;
}
.trigger:hover .tooltip {
  transform: scaleY(1);
}

/* Named values: top, right, bottom, left, center
   Or precise: transform-origin: 20px 80%; */`}</CodeBlock>

      <h3>Individual Transform Properties</h3>
      <p>
        <code>translate</code>, <code>rotate</code>, and <code>scale</code> are now standalone
        properties, not just functions inside <code>transform</code>. This solves the single most
        annoying limitation of the shorthand: you could never change one part of a transform
        without restating all of it, so a hover that scales would wipe out a base translate.
      </p>
      <CodeBlock language="css" title="Standalone vs Shorthand">{`/* ❌ THE OLD PROBLEM — :hover must repeat translate or it's lost */
.badge        { transform: translateY(-50%); }
.badge:hover  { transform: translateY(-50%) scale(1.1); } /* must restate */

/* ✅ Independent properties — each composes, none clobbers the others */
.badge        { translate: 0 -50%; scale: 1; }
.badge:hover  { scale: 1.1; }   /* translate is untouched */

/* They can be transitioned independently, too */
.badge {
  transition: scale 200ms ease-out, rotate 400ms ease;
}

/* Note the value syntax differs from the transform functions:
   translate: 10px 20px;    (space-separated, not translate(10px, 20px))
   rotate:    45deg;         (or an axis: rotate: y 45deg)
   scale:     1.2;           (or per-axis: scale: 0.8 1.2) */`}</CodeBlock>

      <InfoBox variant="info" title="Application Order Is Fixed">
        When you use the individual properties, the browser always applies them in the order
        <strong> translate → rotate → scale</strong>, then any <code>transform</code> shorthand on
        top of that. You give up the arbitrary ordering the shorthand allowed, and in exchange you
        get composability. If you genuinely need a different order (rotate before translate, say),
        keep using the <code>transform</code> shorthand for that element.
      </InfoBox>

      <h3>linear() — Springs and Bounces Without JavaScript</h3>
      <p>
        <code>cubic-bezier()</code> can only describe a curve with one hump, so a true bounce or
        multi-oscillation spring was impossible in pure CSS. <code>linear()</code> approximates any
        arbitrary easing curve as a series of points, which is how spring physics finally arrived
        in CSS.
      </p>
      <CodeBlock language="css" title="linear() Easing">{`/* Bounce — output overshoots and settles across several stops */
.drop {
  transition: translate 600ms linear(
    0, 0.063, 0.25, 0.563, 1, 0.813, 0.75, 0.813, 1, 0.938, 1
  );
}

/* Spring-like settle */
.spring {
  transition: scale 500ms linear(
    0, 0.4 12%, 0.9 24%, 1.08 36%, 1.02 55%, 0.99 75%, 1
  );
}
/* Percentages pin a stop to a point in the timeline; omit them
   and the stops are distributed evenly. Generate these curves with
   a spring-to-linear() tool rather than hand-tuning them. */`}</CodeBlock>

      <InteractiveChallenge
        question={"What does animation-fill-mode: backwards do during the animation-delay period?"}
        options={[
          "Keeps the element invisible",
          "Applies styles from the last keyframe (100%)",
          "Applies styles from the first keyframe (0%)",
          "Has no effect during the delay period"
        ]}
        correctIndex={2}
        explanation={"backwards applies the first keyframe's styles during the delay period. This prevents the element from showing its original (pre-animation) styles before the animation starts. forwards handles post-animation, backwards handles pre-animation (delay), and both does both."}
        language="css"
      />

      <h2>Performance: GPU Compositing &amp; will-change</h2>

      <FlowChart
        title="CSS Animation Performance Tiers"
        chart={"graph TD\nA[Composite Only] -->|Best| B[transform, opacity]\nC[Paint] -->|Medium| D[color, background, box-shadow]\nE[Layout] -->|Worst| F[width, height, margin, padding, top/left]\nB --> G[GPU handles - no main thread work]\nD --> H[Repaint pixels but no layout shift]\nF --> I[Recalculates geometry of entire subtree]"}
      />

      <p>
        The browser renders in three phases: <strong>Layout</strong> (geometry) →
        <strong> Paint</strong> (pixels) → <strong>Composite</strong> (layer assembly). Properties
        that only affect compositing (<code>transform</code> and <code>opacity</code>) skip layout
        and paint entirely, running on the GPU compositor thread. This means they don&apos;t block
        the main thread and achieve consistent 60fps.
      </p>

      <h3>will-change</h3>
      <CodeBlock language="css" title="will-change Usage">{`/* Hints the browser to promote element to its own GPU layer */
.animated-card {
  will-change: transform, opacity;
}

/* WRONG: Don't apply to everything — wastes GPU memory */
* { will-change: transform; } /* Never do this */

/* Better: apply on hover intent, remove after animation */
.card-container:hover .card {
  will-change: transform;
}

/* Or apply via JS just before animation starts,
   remove in the animationend/transitionend handler */`}</CodeBlock>

      <InfoBox variant="danger" title="will-change Is Not Free">
        Every <code>will-change</code> declaration creates a new GPU compositing layer, consuming
        video memory. Overuse causes <em>layer explosion</em> — dozens or hundreds of layers that
        actually degrade performance. Apply it only to elements that will animate imminently, and
        remove it when the animation completes. Never use <code>will-change</code> as a blanket
        optimization.
      </InfoBox>

      <h2>Accessibility: prefers-reduced-motion</h2>
      <p>
        Users with vestibular disorders, motion sensitivity, or simply a preference for less motion
        can enable reduced motion in their OS settings. CSS provides a media query to respect this.
      </p>
      <CodeBlock language="css" title="prefers-reduced-motion">{`/* Strategy 1: Remove motion for those who prefer it */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Strategy 2 (preferred): Opt-in motion — only add
   animations for users who haven't requested reduced motion */
.card {
  opacity: 1; /* no animation by default */
}

@media (prefers-reduced-motion: no-preference) {
  .card {
    animation: fadeIn 500ms ease-out both;
  }
}`}</CodeBlock>

      <InfoBox variant="warning" title="Reduced Motion Is Not Optional">
        Supporting <code>prefers-reduced-motion</code> is a WCAG 2.1 AA requirement
        (Success Criterion 2.3.3). Auto-playing animations that cannot be paused or disabled are
        an accessibility failure. The opt-in strategy (Strategy 2 above) is the most robust
        approach — animations are a progressive enhancement, not a baseline.
      </InfoBox>

      <h2>Entry Animations: @starting-style &amp; allow-discrete</h2>
      <p>
        Animating an element <em>in</em> used to be genuinely impossible in pure CSS. Transitions
        need a previous value to interpolate from, and an element going from
        <code> display: none</code> to <code>display: block</code> has no previous rendered state —
        so it just appeared, instantly. Every fade-in on a dropdown, toast, modal, or tooltip was
        a JavaScript double-<code>requestAnimationFrame</code> dance or a &quot;visibility +
        opacity + a wrapper&quot; workaround. Two features fixed this.
      </p>

      <h3>transition-behavior: allow-discrete</h3>
      <p>
        Discrete properties (<code>display</code>, <code>overlay</code>,
        <code>content-visibility</code>) normally flip instantly and can&apos;t be transitioned.
        <code> allow-discrete</code> makes the browser defer the flip so your other transitions
        finish first — <code>display</code> waits until the fade-out completes instead of yanking
        the element out from under it.
      </p>

      <h3>@starting-style</h3>
      <p>
        <code>@starting-style</code> supplies the &quot;before it existed&quot; values a transition
        needs, giving the browser a state to interpolate <em>from</em> on that very first frame.
      </p>

      <CodeBlock language="css" title="A Popover That Actually Fades Both Ways">{`.popover {
  opacity: 1;
  scale: 1;
  transition:
    opacity 250ms ease,
    scale 250ms ease,
    display 250ms allow-discrete;   /* ← hold display until the rest finish */
}

/* The state it animates FROM on first paint */
@starting-style {
  .popover { opacity: 0; scale: 0.95; }
}

/* The state it animates TO when closing */
.popover[hidden] {
  opacity: 0;
  scale: 0.95;
  display: none;
}`}</CodeBlock>

      <CodeBlock language="css" title="Native <dialog> and popover: the ::backdrop too">{`dialog {
  opacity: 1;
  translate: 0 0;
  transition:
    opacity 200ms ease,
    translate 200ms ease,
    display 200ms allow-discrete,
    overlay 200ms allow-discrete;  /* overlay = the top-layer promotion */
}
dialog:not([open]) { opacity: 0; translate: 0 -1rem; }
@starting-style {
  dialog[open] { opacity: 0; translate: 0 -1rem; }
}

/* ::backdrop needs its own rules — it is NOT a descendant of dialog */
dialog::backdrop {
  background: rgb(0 0 0 / 0.5);
  transition: background 200ms ease, display 200ms allow-discrete;
}
dialog:not([open])::backdrop { background: rgb(0 0 0 / 0); }
@starting-style {
  dialog[open]::backdrop { background: rgb(0 0 0 / 0); }
}`}</CodeBlock>

      <InfoBox variant="warning" title="Order Matters Inside @starting-style">
        <code>@starting-style</code> rules lose to normal rules of the same specificity, so a
        <code> @starting-style</code> block placed <em>before</em> the rule it targets can be
        silently overridden. Declare it after — or nest it inside — the rule whose starting state
        it describes. Also remember <code>overlay</code>: without transitioning it with
        <code> allow-discrete</code>, a <code>dialog</code> or popover drops out of the browser&apos;s
        top layer immediately and appears to vanish behind other content mid-exit.
      </InfoBox>

      <h2>Scroll-Driven Animations</h2>
      <p>
        <code>animation-timeline</code> re-drives an existing <code>@keyframes</code> animation off
        scroll position instead of elapsed time. The keyframes are unchanged — only what advances
        them differs. This runs off the main thread, so it replaces the scroll-listener +
        <code> getBoundingClientRect()</code> pattern (and the jank that comes with it) entirely.
      </p>
      <CodeBlock language="css" title="scroll() and view() Timelines">{`/* 1. Reading-progress bar — driven by the ROOT scroller's progress */
@keyframes grow-progress { from { scale: 0 1; } to { scale: 1 1; } }

.progress-bar {
  position: fixed; inset-block-start: 0; inset-inline: 0;
  block-size: 4px; background: var(--color-primary);
  transform-origin: left center;
  animation: grow-progress linear both;
  animation-timeline: scroll(root block);   /* ← time replaced by scroll */
}

/* 2. Reveal-on-scroll — driven by the ELEMENT's own trip through
      the viewport, via a view() timeline. No IntersectionObserver. */
@keyframes reveal {
  from { opacity: 0; translate: 0 2rem; }
  to   { opacity: 1; translate: 0 0; }
}

.card {
  animation: reveal linear both;
  animation-timeline: view();
  /* Run the animation only across the first 40% of its pass through
     the viewport, so it finishes as the card settles into view */
  animation-range: entry 0% cover 40%;
}

/* Named timelines let a child animate off an ancestor's scroller */
.gallery { scroll-timeline: --gallery inline; overflow-x: auto; }
.indicator { animation-timeline: --gallery; }`}</CodeBlock>

      <InfoBox variant="tip" title="Always Pair With prefers-reduced-motion">
        Scroll-driven effects are exactly the category that triggers vestibular discomfort —
        parallax, content flying in on every scroll tick. Wrap them in
        <code> @media (prefers-reduced-motion: no-preference)</code> so the page renders as calm
        static content for users who asked for that, rather than relying on the blanket
        duration-override reset (which does nothing to a scroll timeline — there is no duration
        to shorten).
      </InfoBox>

      <h2>View Transitions</h2>
      <p>
        The View Transitions API animates between two <em>DOM states</em> — the browser snapshots
        the old page, applies your change, snapshots the new one, and cross-fades between them. It
        gets you app-like page and state transitions with no shared animation library and no
        keeping both UI states alive in the DOM simultaneously.
      </p>
      <CodeBlock language="css" title="Same-Document Transitions">{`/* JS side — wrap the DOM mutation, the browser handles the rest:
     document.startViewTransition(() => { setState(next); });          */

/* CSS side. Default is a cross-fade; customize the generated
   pseudo-elements the browser creates for the snapshots: */
::view-transition-old(root) { animation: 200ms ease-out both fade-out; }
::view-transition-new(root) { animation: 300ms ease-in  both slide-up; }

/* Name an element to make it MORPH between states rather than
   cross-fade — the browser tweens position, size, and content
   between the old and new element sharing this name. */
.hero-image { view-transition-name: hero; }
/* Each name must be unique per snapshot — two visible elements
   sharing a name aborts the whole transition. */`}</CodeBlock>

      <CodeBlock language="css" title="Cross-Document Transitions (MPA)">{`/* Opt in from BOTH pages — same-origin navigations only */
@view-transition { navigation: auto; }

/* Then name matching elements on each page and the browser morphs
   them across the navigation — a thumbnail in a list growing into
   the hero image of the detail page, with zero JavaScript. */`}</CodeBlock>

      <InfoBox variant="warning" title="Treat It as Progressive Enhancement">
        <code>document.startViewTransition</code> is not universally available yet — feature-detect
        it (<code>if (!document.startViewTransition) return update();</code>) and fall back to
        applying the change directly. The un-transitioned result is a perfectly usable instant
        update, which is exactly what you want a fallback to be. And as with scroll-driven
        animations, gate the flashier morphs behind <code>prefers-reduced-motion</code>.
      </InfoBox>

      <h2>Practical Animation Recipes</h2>

      <h3>Fade In</h3>
      <CodeBlock language="css" title="Fade In">{`@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.fade-in {
  animation: fadeIn 500ms ease-out both;
}`}</CodeBlock>

      <h3>Slide In Variants</h3>
      <CodeBlock language="css" title="Directional Slides">{`@keyframes slideInLeft {
  from { transform: translateX(-100%); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes slideInBottom {
  from { transform: translateY(30px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.slide-left   { animation: slideInLeft 500ms ease-out both; }
.slide-right  { animation: slideInRight 500ms ease-out both; }
.slide-bottom { animation: slideInBottom 400ms cubic-bezier(0.2, 0, 0, 1) both; }`}</CodeBlock>

      <h3>Skeleton Loading Shimmer</h3>
      <CodeBlock language="css" title="Shimmer Effect">{`@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #e0e0e0 25%,
    #f0f0f0 50%,
    #e0e0e0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}`}</CodeBlock>

      <h3>Spinner</h3>
      <CodeBlock language="css" title="CSS Spinner">{`@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}`}</CodeBlock>

      <h3>Pulse &amp; Shake</h3>
      <CodeBlock language="css" title="Pulse and Shake">{`@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}
.pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
.shake {
  animation: shake 0.6s ease-in-out;
}
/* Trigger on invalid input */
.input:invalid { animation: shake 0.4s ease-in-out; }`}</CodeBlock>

      <h3>Hover Lift with Shadow</h3>
      <CodeBlock language="css" title="Hover Lift">{`.card {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition:
    transform 250ms cubic-bezier(0.2, 0, 0, 1),
    box-shadow 250ms ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}`}</CodeBlock>

      <h3>Staggered Animations with animation-delay</h3>
      <CodeBlock language="css" title="Staggered Children">{`@keyframes staggerFade {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.list-item {
  animation: staggerFade 400ms ease-out both;
}

/* Manual stagger — each child delays incrementally */
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 75ms; }
.list-item:nth-child(3) { animation-delay: 150ms; }
.list-item:nth-child(4) { animation-delay: 225ms; }
.list-item:nth-child(5) { animation-delay: 300ms; }

/* Dynamic stagger with custom properties (modern approach) */
.list-item {
  animation-delay: calc(var(--i, 0) * 75ms);
}
/* Set --i in HTML: style="--i: 0", style="--i: 1", etc. */`}</CodeBlock>

      <InteractiveChallenge
        question="Which CSS properties can be animated on the GPU compositor thread without triggering layout or paint?"
        options={[
          "background-color and border-radius",
          "transform and opacity",
          "width and height",
          "box-shadow and filter"
        ]}
        correctIndex={1}
        explanation={"Only transform and opacity are composited on the GPU without triggering layout or paint. They run on the compositor thread, completely off the main thread. Properties like width/height trigger full layout, background-color triggers paint, and box-shadow/filter also trigger paint. This is why performant animations should only animate transform and opacity whenever possible."}
        language="css"
      />

      <InteractiveChallenge
        question={"In the shorthand animation: fadeIn 500ms ease-out 200ms both, what does \"both\" control?"}
        options={[
          "Runs the animation in both directions (alternate)",
          "Applies to both ::before and ::after pseudo-elements",
          "Applies first keyframe during delay AND retains last keyframe after completion",
          "Enables both GPU acceleration and will-change"
        ]}
        correctIndex={2}
        explanation={"In the animation shorthand, 'both' is the fill-mode value. It combines 'backwards' (apply first keyframe styles during the delay period) and 'forwards' (retain last keyframe styles after animation ends). This prevents visual glitches where the element flashes its original styles before/after the animation."}
        language="css"
      />
    </LessonLayout>
  );
}
