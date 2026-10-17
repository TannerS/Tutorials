import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function HtmlMedia() {
  return (
    <LessonLayout
      title="Images, Media & Responsive Assets"
      sectionId="html"
      lessonIndex={4}
      prev={{ path: '/html/interactive', label: 'Native Interactive Elements' }}
      next={{ path: '/html/parser', label: 'How the Browser Parses & Repairs HTML' }}
    >
      <p>
        Images are almost always the largest thing a page downloads, and{' '}
        <code>&lt;img&gt;</code> has more leverage per attribute than any other element.
        Four attributes do most of the work; this lesson is those four and the mechanism
        behind the one that confuses everyone.
      </p>

      <h2>The Four Attributes That Matter</h2>
      <CodeBlock language="html" title="Every attribute here is doing a job">
{`<img
  src="/hero-800.jpg"
  alt="A warehouse floor seen from above"
  width="800"
  height="400"
  loading="lazy"
  decoding="async"
  fetchpriority="low"
/>`}
      </CodeBlock>

      <ul>
        <li>
          <code>alt</code> — a <em>description</em>, not a filename. If the image is
          purely decorative, use <code>alt=""</code> (empty, present) so screen readers
          skip it. Omitting <code>alt</code> entirely is different and worse: some screen
          readers then read the URL aloud.
        </li>
        <li>
          <code>width</code>/<code>height</code> — the <strong>aspect ratio</strong>, not
          a size lock. CSS still controls the rendered size; these let the browser reserve
          the right space before the bytes arrive, which is what prevents layout shift.
        </li>
        <li>
          <code>loading="lazy"</code> — defer until near the viewport. Correct for
          below-the-fold images, <strong>wrong for your hero image</strong>, where it
          delays the thing the user is waiting for.
        </li>
        <li>
          <code>fetchpriority</code> — <code>"high"</code> on the hero,{' '}
          <code>"low"</code> on anything incidental.
        </li>
      </ul>

      <CodeBlock language="text" title="Real output — Chromium 149, the aspect-ratio effect measured">
{`<img src="…">                    getComputedStyle().aspectRatio -> "auto"
<img width="100" height="50" …>  getComputedStyle().aspectRatio -> "auto 100 / 50"

// The second one reserves a 2:1 box immediately. The first reserves
// nothing until the image decodes, so everything below it jumps.

// The three loading attributes reflect as properties:
<img loading="lazy" decoding="async" fetchpriority="low">
  img.loading -> "lazy"   img.decoding -> "async"   img.fetchPriority -> "low"`}
      </CodeBlock>

      <InfoBox variant="danger" title="The width/height myth">
        <p>
          &quot;Don&apos;t set width and height, that&apos;s what CSS is for&quot; is
          advice from 2015 and it causes layout shift. Set them to the image&apos;s{' '}
          <em>intrinsic</em> dimensions and let CSS override the rendered size (
          <code>width: 100%; height: auto</code>). The attributes are how the browser
          knows the ratio before the file exists locally — it is the cheapest Cumulative
          Layout Shift fix there is.
        </p>
      </InfoBox>

      <h2><code>srcset</code> and <code>sizes</code> — The One Worth Understanding</h2>
      <p>
        This is where people give up, usually because of <code>sizes</code>. The thing to
        internalise: <strong><code>srcset</code> lists what exists;{' '}
        <code>sizes</code> tells the browser how big the image will be on screen</strong>.
        The browser needs the second to pick from the first, because it chooses{' '}
        <em>before</em> CSS has been applied.
      </p>

      <CodeBlock language="html" title="Width descriptors — the flexible form">
{`<img
  srcset="hero-400.jpg 400w,
          hero-800.jpg 800w,
          hero-1600.jpg 1600w"
  sizes="100vw"
  src="hero-800.jpg"
  alt="…"
/>

<!-- 400w is "this file is 400 physical pixels wide" — NOT a media query.
     sizes="100vw" is "it will render at the full viewport width".
     The browser multiplies: needed = layout width x device pixel ratio,
     then picks the smallest candidate that meets it. -->`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — three real files served over HTTP, measured in Chromium 149">
{`candidates: 400.svg 400w, 800.svg 800w, 1600.svg 1600w

viewport  800px  dpr 1   sizes=100vw -> 800.svg     sizes=50vw -> 400.svg
viewport  800px  dpr 2   sizes=100vw -> 1600.svg    sizes=50vw -> 800.svg
viewport  400px  dpr 1   sizes=100vw -> 400.svg     sizes=50vw -> 400.svg`}
      </CodeBlock>

      <p>
        Read the middle row: same 800px viewport, but a 2× screen needs twice the pixels,
        so it jumps to <code>1600.svg</code>. And <code>sizes="50vw"</code> halves the
        requirement, so the same device drops back to <code>800.svg</code>. That is the
        entire algorithm — layout width × DPR, pick the smallest file that covers it.
      </p>

      <InfoBox variant="warning" title="A wrong sizes value is worse than no srcset">
        <p>
          <code>sizes</code> is a promise you make to the browser, and it is evaluated
          before CSS. If you claim <code>100vw</code> for an image your CSS renders in a
          400px sidebar, every device downloads a full-viewport file for a thumbnail. The
          default when you omit <code>sizes</code> is <code>100vw</code> — so forgetting
          it on a small image is exactly this bug.
        </p>
      </InfoBox>

      <CodeBlock language="html" title="Density descriptors — the simple form, for fixed-size images">
{`<!-- When the rendered size is FIXED (an icon, an avatar), you do not
     need sizes at all. Just say which file is for which density. -->
<img srcset="avatar.png 1x, avatar@2x.png 2x" src="avatar.png" width="48" height="48" alt="" />`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — 1x/2x selection, same three viewports">
{`srcset="400.svg 1x, 800.svg 2x"

dpr 1 -> 400.svg
dpr 2 -> 800.svg`}
      </CodeBlock>

      <h2><code>&lt;picture&gt;</code> — For Format and Art Direction</h2>
      <p>
        <code>srcset</code> picks between sizes of the same image.{' '}
        <code>&lt;picture&gt;</code> picks between <em>different</em> images or formats.
        Two legitimate uses:
      </p>

      <CodeBlock language="html" title="Format fallback, and art direction">
{`<!-- 1. Modern format with a fallback. The browser takes the FIRST
        <source> whose type it supports — order matters, best first.
        AVIF is typically ~50% smaller than JPEG, WebP ~30%. -->
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="…" width="800" height="400" />
</picture>

<!-- 2. Art direction: a genuinely DIFFERENT crop on small screens,
        not just a smaller version of the same one. -->
<picture>
  <source media="(max-width: 600px)" srcset="hero-square.jpg" />
  <img src="hero-wide.jpg" alt="…" />
</picture>`}
      </CodeBlock>

      <InfoBox variant="tip" title="The img inside picture is not a fallback — it is the output">
        <p>
          <code>&lt;picture&gt;</code> renders nothing itself. The nested{' '}
          <code>&lt;img&gt;</code> is the element that actually displays, and it is where{' '}
          <code>alt</code>, <code>width</code>, <code>height</code>,{' '}
          <code>loading</code> and your CSS classes belong. A{' '}
          <code>&lt;picture&gt;</code> with no <code>&lt;img&gt;</code> inside shows
          nothing at all.
        </p>
      </InfoBox>

      <h2>Video and Audio, Minimally</h2>
      <CodeBlock language="html" title="The attributes that actually come up">
{`<video
  src="/clip.mp4"
  poster="/clip-poster.jpg"   <!-- shown before playback; prevents a black box -->
  controls                     <!-- without this there are NO controls at all -->
  playsinline                  <!-- iOS: play in place instead of going fullscreen -->
  muted                        <!-- REQUIRED for autoplay to be allowed -->
  preload="metadata"           <!-- "none" | "metadata" | "auto" -->
  width="640" height="360"
>
  <track kind="captions" src="/clip.en.vtt" srclang="en" label="English" default />
  <source src="/clip.webm" type="video/webm" />
  <source src="/clip.mp4"  type="video/mp4" />
</video>`}
      </CodeBlock>

      <InfoBox variant="warning" title="Autoplay only works muted, and that is not a bug">
        <p>
          Every browser blocks autoplay with sound until the user has interacted with the
          page. <code>autoplay muted playsinline</code> is the combination that works; a
          promise from <code>video.play()</code> that rejects with{' '}
          <code>NotAllowedError</code> is the policy, not a failure to handle. If the
          video is decorative, muted autoplay is what you wanted anyway — and{' '}
          <code>loop</code> plus no <code>controls</code> makes it a background element.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="SVG has one trick worth knowing">
        <p>
          An SVG referenced with <code>&lt;img src="icon.svg"&gt;</code> cannot be styled
          by your page&apos;s CSS — it loads in an isolated context, so{' '}
          <code>fill: currentColor</code> will not reach it. Inlining the{' '}
          <code>&lt;svg&gt;</code> markup directly lets CSS style it, at the cost of
          bytes in your HTML and no separate caching. That trade is the whole reason icon
          components exist in React.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
