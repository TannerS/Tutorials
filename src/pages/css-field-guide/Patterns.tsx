import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideCssPatterns() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="CSS · Field Reference"
      title="Layout & Design Patterns"
      tagline="Battle-tested layout recipes, condensed to their one load-bearing declaration each — drop-in CSS for the shapes every UI needs."
      meta={['CSS Grid + Flexbox', '12 patterns']}
      footerLabel="Personal study reference — Layout Patterns"
      pageLabel="CSS Field Guide · Layout Patterns"
      prev={{ path: '/css-field-guide/gotchas', label: 'Gotchas & Specificity Pitfalls' }}
      next={{ path: '/css-field-guide/sass', label: 'Sass Essentials' }}
    >
      <PosterCard
        glyph="HG"
        title={<>Holy Grail<span className="dim"> Layout</span></>}
        language="css"
        code={`.holy-grail {
  display: grid;
  grid-template-areas: "hd hd hd" "lt ct rt" "ft ft ft";
  grid-template-columns: 200px 1fr 200px;
  min-height: 100dvh;   /* dvh, not vh — mobile toolbar safe */
}
.holy-grail > header { grid-area: hd; }`}
        caption="Named grid-template-areas map directly to the visual layout — no column-counting, and the sidebars stay fixed-width while 1fr absorbs all remaining space for the content column."
      />

      <PosterCard
        glyph="Cg"
        title={<>Card Grid<span className="dim"> — no media queries</span></>}
        language="css"
        code={`.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}
.card { display: flex; flex-direction: column; }
.card .footer { margin-top: auto; }  /* pins footer to bottom */`}
        caption="auto-fit + minmax handles every viewport width in one declaration. flex-direction: column + margin-top: auto on the footer keeps action buttons aligned across cards with different content lengths."
      />

      <PosterCard
        glyph="Sh"
        title={<>Sticky Header</>}
        language="css"
        code={`.sticky-header {
  position: sticky; top: 0; z-index: 100;
  background: var(--bg-primary);
}
/* no JS, no scroll listener — stays in flow until the threshold */`}
        caption="position: sticky needs a top offset to know WHEN to stick. It then sticks inside its NEAREST SCROLLING ANCESTOR — overflow: auto/scroll on an ancestor is fine (that's how sticky table headers in a scroll panel work); overflow: hidden/clip is what breaks it, because that ancestor becomes the scroll container yet can never scroll. It never reverts to static."
      />

      <PosterCard
        glyph="Md"
        title={<>Centered Modal<span className="dim"> Overlay</span></>}
        language="css"
        code={`.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  display: grid; place-items: center;
  background: rgb(0 0 0 / 0.5);
}
.modal { width: min(90vw, 500px); max-height: 85vh; overflow-y: auto; }`}
        caption="place-items: center on a grid backdrop centers the modal on both axes in one line. min(90vw, 500px) keeps it responsive without a media query — it's simply whichever value is smaller."
      />

      <PosterCard
        glyph="Fb"
        title={<>Full-Bleed<span className="dim"> Breakout</span></>}
        language="css"
        code={`.wrapper { max-width: 65ch; margin-inline: auto; }
.full-bleed {
  width: 100vw;
  margin-left: calc(50% - 50vw);
}`}
        caption="calc(50% - 50vw) is the exact horizontal distance from the constrained container's edge to the viewport's edge. Caveat: 100vw INCLUDES a classic scrollbar gutter while 50% doesn't, so on desktop this overshoots by the scrollbar width and adds a horizontal scrollbar — prefer the scrollbar-safe grid breakout (grid-template-columns: 1fr min(65ch, 100%) 1fr, with .full-bleed { grid-column: 1 / -1 })."
      />

      <PosterCard
        glyph="Tr"
        title={<>Text Truncation<span className="dim"> — 1 line vs multi-line</span></>}
        language="css"
        code={`.truncate {
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.line-clamp-2 {
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}`}
        caption="Single-line ellipsis needs all three properties together — any one missing and it silently doesn't truncate. Multi-line clamping uses the -webkit-box spec, which despite the prefix is supported everywhere now."
      />

      <PosterCard
        glyph="Pt"
        title={<>Pricing Table<span className="dim"> — featured card</span></>}
        language="css"
        code={`.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem; align-items: start;
}
.pricing-card.featured { transform: scale(1.05); position: relative; }`}
        caption="align-items: start on the grid keeps shorter cards from stretching to match a taller featured card. scale(1.05) draws the eye without changing the card's contribution to the grid's track sizing."
      />

      <PosterCard
        glyph="Cs"
        title={<>Collapsible Sidebar<span className="dim"> — desktop → mobile strip</span></>}
        language="css"
        code={`.app-layout { display: grid; grid-template-columns: 240px 1fr; }

@media (max-width: 768px) {
  .app-layout { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .app-sidebar { display: flex; overflow-x: auto; }
}`}
        caption="The same markup becomes a horizontally-scrolling nav strip below the breakpoint — one grid-template-columns swap plus flipping the sidebar's own display, no separate mobile component."
      />

      <PosterCard
        glyph="Ar"
        title={<>Aspect-Ratio<span className="dim"> Media Containers</span></>}
        language="css"
        code={`.video { aspect-ratio: 16 / 9; width: 100%; }
.video > iframe { width: 100%; height: 100%; object-fit: cover; }
.avatar { aspect-ratio: 1; object-fit: cover; border-radius: 50%; }`}
        caption="aspect-ratio reserves the correct box BEFORE the media loads, preventing layout shift — object-fit: cover then crops the actual media to fill that reserved box without distorting it."
      />

      <PosterCard
        glyph="Ts"
        title={<>Toast Stack<span className="dim"> — newest at bottom</span></>}
        language="css"
        code={`.toast-container {
  position: fixed; bottom: 1.5rem; right: 1.5rem;
  display: flex; flex-direction: column-reverse; gap: 0.75rem;
  pointer-events: none;
}
.toast { pointer-events: auto; }`}
        caption="column-reverse stacks each newly appended toast at the bottom, growing upward. pointer-events: none on the container lets clicks pass through the gaps; re-enabling it per-toast keeps each one individually interactive."
      />

      <PosterCard
        glyph="Sc"
        title={<>Custom Scrollbar</>}
        language="css"
        code={`.custom-scroll::-webkit-scrollbar { width: 8px; }
.custom-scroll::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
.custom-scroll { scrollbar-width: thin; scrollbar-color: var(--border-color) transparent; }`}
        caption="scrollbar-width/scrollbar-color are the STANDARD properties and now work in Firefox, Chromium (121+) and Safari (18.2+) — reach for them first; the widespread 'those are the Firefox-only ones' advice is out of date. The ::-webkit-scrollbar pseudo-elements were never standardised and are only worth adding when you need more than thin + two colours (hover states, thumb radius)."
      />

      <PosterCard
        glyph="Dg"
        title={<>Dashboard Grid<span className="dim"> — fixed sidebar + fluid content</span></>}
        language="css"
        code={`.dashboard { display: grid; grid-template-columns: 240px 1fr; min-height: 100dvh; }
.dash-sidebar { position: sticky; top: 0; height: 100dvh; overflow-y: auto; }
.dash-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem; align-content: start;
}`}
        caption="align-content: start on the content grid stops widget cards from stretching to fill leftover vertical space when there are only a few of them — without it, two cards in a tall viewport stretch to fill it."
      />

      <PosterQuickRef
        title="Which pattern do I need?"
        rows={[
          { need: 'Header/sidebar/content/footer shell', answer: 'grid-template-areas — Holy Grail' },
          { need: 'Responsive cards, no breakpoints', answer: 'repeat(auto-fit, minmax(N, 1fr))' },
          { need: 'Nav bar pinned while scrolling', answer: 'position: sticky; top: 0' },
          { need: 'Centered dialog over a dimmed backdrop', answer: 'display: grid; place-items: center' },
          { need: 'Break an element out of a max-width column', answer: 'width: 100vw; margin-left: calc(50% - 50vw)' },
          { need: 'Cut off long text with an ellipsis', answer: '-webkit-line-clamp (multi-line) or text-overflow (1 line)' },
          { need: 'Reserve space for media before it loads', answer: 'aspect-ratio + object-fit: cover' },
          { need: 'Notifications stacking bottom-right', answer: 'flex-direction: column-reverse' },
        ]}
      />
    </PosterLayout>
  );
}
