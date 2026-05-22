import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function CSSAnimations() {
  return (
    <LessonLayout
      title="CSS Animations"
      sectionId="css-mastery"
      lessonIndex={3}
      prev={{ path: "/css-mastery/responsive", label: "Responsive" }}
      next={{ path: "/css-mastery/variables", label: "CSS Variables" }}
    >
      <p>
        CSS animations and transitions add motion that guides attention, provides feedback, and
        makes interfaces feel polished and alive. The golden rule: animate only what the GPU
        can composite (transform and opacity), and always respect prefers-reduced-motion.
      </p>

      <FlowChart
        title="Animation Performance — Rendering Pipeline"
        chart={"graph LR\n  A[JS/CSS Change] --> B{Which property?}\n  B -- width/height/margin/top --> C[Layout recalc]\n  C --> D[Paint]\n  D --> E[Composite — slow]\n  B -- background/color/box-shadow --> F[Paint]\n  F --> E\n  B -- transform/opacity --> G[Composite only — fast]\n  G --> H[GPU thread — 60fps]"}
      />

      <CodeBlock language="css" title="CSS Transitions — Smooth Property Changes">
{`/* transition: property duration timing-function delay */
/* Apply to the BASE state, not the :hover state */

.button {
  background: #5b9cf6;
  color: white;
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  /* Transition specific properties (preferred over "all") */
  transition:
    background  0.2s ease,
    transform   0.2s ease,
    box-shadow  0.2s ease;
}
.button:hover {
  background: #4a8ae8;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
.button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Multiple transitions with different timing */
.card {
  transition:
    transform   0.3s cubic-bezier(0.34, 1.56, 0.64, 1),  /* spring */
    box-shadow  0.3s ease,
    border-color 0.15s ease;    /* faster color change */
}
.card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

/* Transition ALL (convenient but avoid — may animate unexpected properties) */
.element { transition: all 0.2s ease; }

/* TIMING FUNCTIONS */
.ease        { transition-timing-function: ease; }           /* slow-fast-slow (default) */
.linear      { transition-timing-function: linear; }         /* constant speed */
.ease-in     { transition-timing-function: ease-in; }        /* slow start */
.ease-out    { transition-timing-function: ease-out; }       /* slow end */
.ease-in-out { transition-timing-function: ease-in-out; }    /* slow both ends */
.spring      { transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); } /* overshoot */
.bounce      { transition-timing-function: cubic-bezier(0.68, -0.55, 0.27, 1.55); }
.steps       { transition-timing-function: steps(4, end); }  /* step animation */`}
      </CodeBlock>

      <CodeBlock language="css" title="@keyframes and animation Shorthand">
{`/* Define the animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }  /* "from" defaults to current value */
}

@keyframes pulse {
  0%, 100% { transform: scale(1);    opacity: 1; }
  50%       { transform: scale(1.08); opacity: 0.8; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-8px); }
  40%       { transform: translateX(8px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}

@keyframes skeleton {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}

/* Apply animation */
/* animation: name duration timing-function delay iteration-count direction fill-mode */
.card    { animation: fadeInUp 0.4s ease forwards; }
.spinner { animation: spin 1s linear infinite; }
.badge   { animation: pulse 2s ease-in-out infinite; }
.error   { animation: shake 0.4s ease; }

/* Full shorthand */
.modal {
  animation:
    fadeInUp             /* name */
    0.3s                 /* duration */
    cubic-bezier(0.34, 1.56, 0.64, 1) /* timing */
    0.1s                 /* delay */
    1                    /* iteration count (or: infinite) */
    normal               /* direction: normal | reverse | alternate | alternate-reverse */
    forwards;            /* fill-mode: none | forwards | backwards | both */
}

/* fill-mode explained:
   none:      element returns to pre-animation state after animation
   forwards:  element stays at the last keyframe after animation ends
   backwards: element starts at first keyframe during the delay period
   both:      combination of forwards and backwards */

/* Staggered animations with animation-delay */
.list-item:nth-child(1) { animation: fadeInUp 0.3s ease 0.0s forwards; }
.list-item:nth-child(2) { animation: fadeInUp 0.3s ease 0.1s forwards; }
.list-item:nth-child(3) { animation: fadeInUp 0.3s ease 0.2s forwards; }
.list-item:nth-child(4) { animation: fadeInUp 0.3s ease 0.3s forwards; }
/* Or dynamically with CSS custom properties and JS */`}
      </CodeBlock>

      <CodeBlock language="css" title="Transform — translate, rotate, scale, skew">
{`/* transform functions — combined in one declaration, applied right to left */

/* TRANSLATE — move element (doesn't affect document flow) */
.el { transform: translateX(50px); }             /* move right 50px */
.el { transform: translateY(-20px); }            /* move up 20px */
.el { transform: translate(50px, -20px); }       /* move right and up */
.el { transform: translate(-50%, -50%); }        /* centering trick with absolute */
.el { transform: translateZ(0); }               /* promote to GPU layer */

/* ROTATE */
.el { transform: rotate(45deg); }
.el { transform: rotateX(45deg); }              /* flip forward */
.el { transform: rotateY(180deg); }             /* card flip */
.el { transform: rotate3d(1, 0.5, 0.2, 45deg); }

/* SCALE */
.el { transform: scale(1.1); }                  /* 10% larger */
.el { transform: scale(0.9); }                  /* 10% smaller */
.el { transform: scaleX(2); }                   /* 2x width only */
.el { transform: scale(1.1) translateY(-4px); } /* combine: order matters! */

/* SKEW */
.el { transform: skewX(15deg); }               /* italic-like diagonal */
.el { transform: skewY(10deg); }

/* transform-origin — pivot point (default: center) */
.el { transform-origin: top left; }
.el { transform-origin: 0 0; }
.el { transform-origin: 100% 50%; }

/* 3D transforms */
.card-container { perspective: 1000px; }        /* depth perspective */
.card { transform-style: preserve-3d; }         /* children in 3D space */
.card-back { transform: rotateY(180deg); }

/* will-change — hint to browser to promote element to GPU layer */
/* Use sparingly — each layer uses GPU memory */
.animated-card { will-change: transform; }      /* before animation starts */
/* Remove it after animation: .animated-card { will-change: auto; } */`}
      </CodeBlock>

      <CodeBlock language="css" title="Accessibility — prefers-reduced-motion">
{`/* ALWAYS respect user's motion preferences */
/* Users with vestibular disorders can get nausea from movement */

/* Option 1: Remove motion entirely for sensitive users */
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

/* Option 2: Provide alternatives instead of removing (better UX) */
.spinner { animation: spin 1s linear infinite; }

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    /* Show a pulsing opacity instead of spinning */
    animation: pulse 1.5s ease-in-out infinite;
  }
  .card {
    animation: none;         /* no slide-in */
    opacity: 1;              /* just appear */
  }
  html { scroll-behavior: auto; }
}

/* Option 3: Mobile-first — only add motion for users who accept it */
/* (reduces-motion: no-preference = user hasn't set a preference) */
@media (prefers-reduced-motion: no-preference) {
  .card { animation: fadeInUp 0.4s ease forwards; }
  .button { transition: transform 0.2s ease; }
  html { scroll-behavior: smooth; }
}

/* Test: on macOS System Preferences > Accessibility > Reduce motion */`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Web Animations API — JavaScript Control">
{`// Web Animations API: programmatic animation with full control

// Basic animation
const el = document.querySelector('.box');
const animation = el.animate(
  [
    { opacity: 0, transform: 'translateY(20px)' },  // from
    { opacity: 1, transform: 'translateY(0)' },      // to
  ],
  {
    duration: 400,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    fill: 'forwards',
    delay: 100,
  }
);

// Control playback
animation.pause();
animation.play();
animation.reverse();
animation.finish();
animation.cancel();

// Wait for completion
animation.finished.then(() => console.log('done'));

// React hook for respectful animations
function useAnimation(ref, keyframes, options) {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;  // skip for sensitive users
    const animation = ref.current?.animate(keyframes, options);
    return () => animation?.cancel();
  }, []);
}

// GSAP-style stagger with WAAPI
const items = document.querySelectorAll('.list-item');
items.forEach((item, i) => {
  item.animate(
    [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
    { duration: 300, delay: i * 80, fill: 'forwards', easing: 'ease-out' }
  );
});`}
      </CodeBlock>

      <InteractiveChallenge
        question="Why should you prefer animating transform and opacity over width, height, or top/left?"
        options={[
          "transform and opacity look more visually appealing",
          "transform and opacity are GPU-composited — they skip layout and paint, running on a separate thread at 60fps without blocking the main thread",
          "width and height do not support CSS animation syntax",
          "transform animations have wider browser support than property animations"
        ]}
        correctIndex={1}
        explanation="The browser rendering pipeline has three stages: Layout (calculate sizes/positions), Paint (draw pixels), and Composite (layer them together). Animating width, height, margin, top, or left triggers Layout recalculation AND Paint on every frame — expensive. Animating background or color triggers Paint but not Layout. Animating transform and opacity ONLY triggers Composite — they run on the GPU's compositor thread, completely bypassing the main thread. This means smooth 60fps animations even when JavaScript is busy."
      />

      <InteractiveChallenge
        question="What does animation-fill-mode: forwards do?"
        options={[
          "Makes the animation play in reverse after completion",
          "The element retains the styles from the last keyframe after the animation ends, instead of snapping back to its original state",
          "The animation starts immediately without any delay",
          "The animation loops forward infinitely"
        ]}
        correctIndex={1}
        explanation="Without fill-mode, an element snaps back to its pre-animation styles when the animation completes. forwards makes the element stay at the final keyframe state — essential for entrance animations like fadeInUp where you don't want the element to disappear after sliding in. backwards applies the first keyframe during the delay period (so elements start invisible even before the animation begins). both combines both behaviors."
      />
    </LessonLayout>
  );
}
