#!/usr/bin/env node
/**
 * Per-section PDF export for the tutorials site.
 *
 * Runs a static preview server (vite preview) over the built site, then
 * uses Playwright to visit every lesson in every section, capture each
 * page as PDF, and concatenate the pages into one PDF per section under
 * ./dist-pdf/ (repo root — this used to say apps/tutorials/dist-pdf/, left
 * over from the pre-flatten monorepo layout).
 *
 * Usage:
 *   npm run build:pdf                       # build + generate every section
 *   npm run build:pdf:combined              # build + every section + ONE combined
 *                                            #   whole-site PDF (dist-pdf/tutorials-complete.pdf)
 *   npm run build:pdf:dark                  # same as combined, but styled in the site's
 *                                            #   real dark theme instead of ink-on-paper
 *                                            #   (dist-pdf/tutorials-complete-dark.pdf)
 *   npm run build:pdf:cheatsheets           # build + ONLY the cheat-sheet lesson from every
 *                                            #   section, combined into one PDF, light theme
 *                                            #   (dist-pdf/tutorials-cheatsheets-only.pdf)
 *   npm run build:pdf:cheatsheets:dark      # same, dark theme
 *                                            #   (dist-pdf/tutorials-cheatsheets-only-dark.pdf)
 *   npm run pdf:section java                # re-use the existing dist/ build
 *   node scripts/build-pdf.mjs java react19 # multiple sections
 *   node scripts/build-pdf.mjs --combined   # re-use dist/, all sections, + combine
 *   node scripts/build-pdf.mjs --combined --dark   # ...styled dark instead
 *   node scripts/build-pdf.mjs --cheatsheets --dark   # ...cheat sheets only, dark
 *
 * `pdf:section` does NOT rebuild — it serves whatever is already in dist/,
 * so run `npm run build` first if the site has changed.
 *
 * `--combined` always runs ALONGSIDE the normal per-section output (it never
 * replaces it) — it just additionally stitches whichever section PDFs were
 * generated in this run into one cover-to-cover PDF, ordered the way the
 * sidebar actually displays them (not sections.ts's declaration order).
 *
 * `--dark` renders every page in the site's real dark theme instead of the
 * default light "ink-on-paper" flatten (see the `data-pdf-mode="dark"` block
 * in global.css's @media print section). Output filenames get a `-dark`
 * suffix so a dark run never overwrites a light one — both can coexist in
 * dist-pdf/. Pagination and break-inside safety are identical either way;
 * only the color layer changes.
 *
 * `--cheatsheets` filters every section down to just its cheat-sheet lesson
 * (matched by lesson id, not title — a title merely CONTAINING "cheat sheet"
 * on an otherwise-unrelated lesson doesn't count) before capturing anything,
 * and always combines the result into one file — this is a genuinely
 * separate command from `--combined`/`build:pdf:dark`, not a variant of them,
 * per an explicit ask to keep every PDF flavor its own dedicated command
 * rather than one command trying to produce all of them. It does not write
 * the normal per-section files (a pile of 1-lesson stub PDFs isn't useful on
 * its own), only the one combined cheatsheets-only output.
 *
 * Prerequisites (one-time):
 *   npm install
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

/**
 * Chromium embeds a fresh font subset into every page.pdf() capture, and
 * pdf-lib's copyPages copies those resources verbatim — so a 337-lesson merge
 * carries ~10,800 font embeds for ~26 actual fonts and lands at 123 MB with
 * zero images in it.
 *
 * `mutool clean -gggg` merges duplicate objects and dedupes identical streams,
 * which is exactly that problem, and it does NOT re-encode fonts — so the text
 * layer survives byte-for-byte. Measured on the full book: 123.4 MB -> 49.5 MB
 * (2.5x), 3417 pages preserved, extracted text identical.
 *
 * Ghostscript gets further (3.3x) but rewrites the font programs and drops the
 * `*` from `*\/` in code comments — it renders correctly but breaks copy-paste
 * and search. Not worth it for a study reference, so we use mutool.
 *
 * Optional: if mutool isn't installed we log once and leave the PDF alone.
 */
let mutoolChecked = false;
let mutoolPresent = false;

async function haveMutool() {
  if (mutoolChecked) return mutoolPresent;
  mutoolChecked = true;
  mutoolPresent = await new Promise((res) => {
    const p = spawn('mutool', ['-v'], { stdio: 'ignore' });
    p.on('error', () => res(false));
    p.on('close', (code) => res(code === 0 || code === 1));
  });
  if (!mutoolPresent) {
    console.warn('[pdf] mutool not found — skipping compression (files stay ~2.5x larger).');
    console.warn('[pdf] Install with: brew install mupdf-tools');
  }
  return mutoolPresent;
}

/**
 * Compresses in place, but only swaps the file in if the result is genuinely
 * smaller AND has the same page count — a compressor that silently truncates
 * is worse than one that does nothing.
 */
async function compressPdf(file) {
  if (!(await haveMutool())) return null;
  const tmp = file.replace(/\.pdf$/, '.compressing.pdf');
  const before = (await readFile(file)).length;

  const ok = await new Promise((res) => {
    const p = spawn('mutool', ['clean', '-gggg', '-z', file, tmp], { stdio: 'ignore' });
    p.on('error', () => res(false));
    p.on('close', (code) => res(code === 0));
  });
  if (!ok) { await rm(tmp, { force: true }); return null; }

  const out = await readFile(tmp).catch(() => null);
  if (!out || out.length === 0 || out.length >= before) {
    await rm(tmp, { force: true });
    return null;
  }
  // Page-count guard: a compressor that silently truncates is worse than one
  // that does nothing. Parse both properly rather than grepping the bytes —
  // mutool packs objects into compressed streams, so /Type /Page is no longer
  // visible as plain text and a regex undercounts every time.
  try {
    const { PDFDocument } = await import('pdf-lib');
    const [origDoc, newDoc] = await Promise.all([
      PDFDocument.load(await readFile(file), { updateMetadata: false }),
      PDFDocument.load(out, { updateMetadata: false }),
    ]);
    if (origDoc.getPageCount() !== newDoc.getPageCount()) {
      console.warn(
        `[pdf] compression changed page count for ${file} ` +
        `(${origDoc.getPageCount()} → ${newDoc.getPageCount()}) — keeping the original.`,
      );
      await rm(tmp, { force: true });
      return null;
    }
  } catch {
    // Unreadable output = don't trust it.
    console.warn(`[pdf] compressed ${file} would not parse — keeping the original.`);
    await rm(tmp, { force: true });
    return null;
  }
  await writeFile(file, out);
  await rm(tmp, { force: true });
  return { before, after: out.length };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Repo root. The repo is flat now (no apps/tutorials/), so '..' from scripts/
// lands on the root that holds dist/, src/ and vite.config.ts.
const APP_ROOT = resolve(__dirname, '..');
const OUT_DIR = join(APP_ROOT, 'dist-pdf');
const HOST = '127.0.0.1';
const PORT = 5273;
// Letter width in CSS pixels at 96 DPI = 8.5in * 96 = 816px. Used both for
// the capture viewport and as an explicit width forced onto <main> below —
// see the comment there for why "explicit" matters, not just "matching".
const PAGE_WIDTH_PX = 816;

const rawArgs = process.argv.slice(2);
const CHEATSHEETS_ONLY = rawArgs.includes('--cheatsheets');
// --cheatsheets implies combining — a pile of 1-lesson stub PDFs isn't a
// useful deliverable on its own, the combined file is the whole point.
const COMBINED = rawArgs.includes('--combined') || CHEATSHEETS_ONLY;
const DARK = rawArgs.includes('--dark');
const wantedSections = rawArgs.filter((a) => a !== '--combined' && a !== '--dark' && a !== '--cheatsheets');

// Matches a cheat-sheet lesson by id, e.g. 'cheatsheet', 'cheat-sheet',
// 'zustand-cheatsheet' — NOT by title. A lesson can have "Cheat Sheet"
// somewhere in its title without actually being a section's dedicated
// cheat-sheet page (e.g. css-field-guide's 'basics' lesson is titled "CSS
// Basics Cheat Sheet" but is a normal lesson, not the section's cheat
// sheet) — id is the reliable signal, title text is not.
const isCheatsheetLesson = (lesson) => /cheat-?sheet$/i.test(lesson.id);

async function findFreePort(preferred) {
  // Try the preferred port first; if it's busy, ask the OS for any free port.
  const attempt = (port) =>
    new Promise((resolvePort, reject) => {
      const srv = net.createServer();
      srv.unref();
      srv.once('error', reject);
      srv.listen(port, HOST, () => {
        const bound = srv.address().port;
        srv.close(() => resolvePort(bound));
      });
    });
  try {
    return await attempt(preferred);
  } catch {
    return attempt(0);        // 0 = OS assigns
  }
}

async function loadSections() {
  // sections.ts only uses two TypeScript features that Node cannot execute
  // as-is: a type-only import and two explicit type annotations. Both are
  // trivial to strip. Rewrite to a temp .mjs file and dynamic-import it.
  const { tmpdir } = await import('node:os');
  const src = await readFile(join(APP_ROOT, 'src/data/sections.ts'), 'utf8');

  const stripped = src
    .replace(/^\s*import\s+type\s+.*?;\s*\r?\n/m, '')       // drop `import type { ... };`
    .replace(/:\s*Section\[\]/g, '')                          // drop `: Section[]`
    .replace(/:\s*Group\[\]/g, '');                           // drop `: Group[]`

  const outfile = join(tmpdir(), `sections-${process.pid}.mjs`);
  await writeFile(outfile, stripped);
  try {
    const mod = await import(`file://${outfile}`);
    return { sections: mod.sections, groups: mod.groups };
  } finally {
    await rm(outfile, { force: true });
  }
}

// Flattens `groups` into an ordered list of section ids matching exactly how
// Sidebar.tsx renders them: for each group, its child GROUPS render first (in
// array order), then its own direct sectionIds — recursively, depth-first.
// This is what makes the combined PDF read in the same order a reader
// browsing the sidebar would encounter, not sections.ts's declaration order
// (which is unrelated — e.g. 'auth' is declared early but displays late,
// under the Security group).
function sidebarSectionOrder(groups) {
  const order = [];
  const walk = (groupList) => {
    for (const g of groupList) {
      if (g.children) walk(g.children);
      for (const id of g.sectionIds ?? []) order.push(id);
    }
  };
  walk(groups);
  return order;
}

async function startPreviewServer(port) {
  return new Promise((resolvePreview, reject) => {
    // detached so the whole process group can be signalled on exit: `npx`
    // execs vite as a CHILD, so killing the npx wrapper alone left a vite
    // server holding the port until it was hunted down by hand.
    const child = spawn(
      'npx',
      ['vite', 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
      { cwd: APP_ROOT, stdio: ['ignore', 'pipe', 'pipe'], detached: true },
    );

    let ready = false;
    const onData = (buf) => {
      const s = buf.toString();
      if (!ready && /Local:\s+http/.test(s)) {
        ready = true;
        clearTimeout(timer);
        resolvePreview(child);
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => {
      if (!ready) reject(new Error(`vite preview exited with code ${code}`));
    });

    // safety timeout — unref'd so a successful run isn't held open for 15s
    const timer = setTimeout(() => {
      if (!ready) reject(new Error('vite preview did not start in time'));
    }, 15_000);
    timer.unref();
  });
}

function stopPreviewServer(child) {
  if (!child || child.exitCode !== null) return;
  try {
    // negative pid = the whole detached process group (npx + vite)
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    try { child.kill('SIGTERM'); } catch { /* already gone */ }
  }
}

async function main() {
  // `vite preview` serves dist/. Without a build it starts and then 404s every
  // route, which used to surface as a pile of blank PDFs instead of an error.
  try {
    await access(join(APP_ROOT, 'dist', 'index.html'));
  } catch {
    console.error('[pdf] No dist/index.html — run `npm run build` first (or use `npm run build:pdf`).');
    process.exit(1);
  }

  const port = await findFreePort(PORT);
  const url = `http://${HOST}:${port}`;

  console.log(`[pdf] Loading sections...`);
  const { sections, groups } = await loadSections();
  let targets = wantedSections.length
    ? sections.filter((s) => wantedSections.includes(s.id))
    : sections;

  if (CHEATSHEETS_ONLY) {
    // Filter each section down to just its cheat-sheet lesson(s) — most
    // sections have exactly one, state-mgmt technically has zero at the
    // section level (Zustand's lives at 'zustand-cheatsheet', matched the
    // same way). Drop any section left with nothing to capture entirely,
    // rather than rendering it and getting an empty/skipped result.
    targets = targets
      .map((s) => ({ ...s, lessons: s.lessons.filter(isCheatsheetLesson) }))
      .filter((s) => s.lessons.length > 0);
    console.log(`[pdf] --cheatsheets: ${targets.length} sections have a cheat sheet.`);
  }

  if (targets.length === 0) {
    console.error(
      `[pdf] No sections matched. Available: ${sections.map((s) => s.id).join(', ')}`,
    );
    process.exit(1);
  }

  console.log(`[pdf] Starting preview server on ${url}`);
  const preview = await startPreviewServer(port);

  await mkdir(OUT_DIR, { recursive: true });

  // Section numbering for the divider pages, derived from the FULL sidebar
  // order so a partial build (`pdf:section java`) still labels Java with its
  // real position in the site rather than "Section 1 of 1".
  const fullOrder = sidebarSectionOrder(groups);
  const positionOf = new Map(fullOrder.map((id, i) => [id, i + 1]));

  console.log(`[pdf] Launching Chromium (headless)...`);
  const browser = await chromium.launch();
  const writtenFiles = new Map(); // sectionId -> filepath, only sections that actually rendered
  const skipped = [];             // { section, lesson, reason } — surfaced as a summary at the end
  try {
    for (const section of targets) {
      // Cheatsheets-only mode writes each section's (single-lesson) capture to
      // a clearly-temp filename — buildCombinedPdf still needs a real file per
      // section to read back and stitch together, but a pile of 1-lesson
      // "section.pdf" files left behind afterward isn't a useful deliverable,
      // so these get deleted once the real combined output is built (below).
      const filename = CHEATSHEETS_ONLY
        ? join(OUT_DIR, `.tmp-cheatsheet-${section.id}${DARK ? '-dark' : ''}.pdf`)
        : join(OUT_DIR, `${section.id}${DARK ? '-dark' : ''}.pdf`);
      console.log(`[pdf] ${section.label} (${section.id}) → ${filename}`);

      const buffers = [];
      for (const lesson of section.lessons) {
        console.log(`       - ${lesson.title}`);
        // Set the viewport wide enough to match the target paper width so text
        // renders at the same size the print media styles expect. In dark
        // mode, force colorScheme: 'dark' at page-creation time — BEFORE any
        // navigation — so the site's own ThemeProvider (which falls back to
        // `prefers-color-scheme`) resolves to dark from the very first paint.
        // That matters beyond just CSS: FlowChart.tsx picks mermaid's node/
        // edge colors from React theme state at mount, not from print media,
        // so diagrams need theme='dark' resolved early to render dark-colored
        // in the first place — poking the DOM attribute after the fact
        // wouldn't reach back into already-rendered SVGs.
        const page = await browser.newPage({
          viewport: { width: PAGE_WIDTH_PX, height: 1200 },
          ...(DARK ? { colorScheme: 'dark' } : {}),
        });
        try {
          const target = url + lesson.path;
          // 'load' rather than 'networkidle': pages embedding a live widget
          // (e.g. Sandpack's bundler iframe) hold connections open for
          // hot-reload and never go network-idle, which would hang this
          // indefinitely. 'load' plus the explicit settle-wait below is
          // enough for mermaid/syntax-highlighting/static widgets.
          // 60s, not 30s: pages that boot a real toolchain in-browser
          // (typescript/interactive instantiates the TS compiler, the SQL
          // playground loads sql.js) intermittently exceed 30s on a cold
          // start, and the catch below turns that into a SILENTLY SKIPPED
          // lesson — content missing from the PDF with only one line in the
          // log to say so. Observed on /typescript/interactive: skipped on
          // one run, captured in 2 pages on the retry.
          await page.goto(target, { waitUntil: 'load', timeout: 60_000 });

          // Remove site chrome that shouldn't appear in the print, and force
          // <main> out of its scroll-container state so the whole content
          // participates in the print layout.
          //
          // (Chromium's PDF pipeline treats overflow:auto containers by only
          //  printing the visible portion — CSS @media print with
          //  overflow:visible does NOT reliably override an inline style set
          //  on <main> during the print pass.)
          await page.evaluate(({ pageWidthPx, dark }) => {
            // Belt-and-suspenders: also set the attribute the CSS in
            // global.css's @media print block keys off (data-pdf-mode="dark")
            // directly, in case the page's own theme resolved to light for
            // any reason (e.g. a stray localStorage entry surviving between
            // runs in the same browser instance).
            if (dark) {
              document.documentElement.dataset.pdfMode = 'dark';
              document.documentElement.dataset.theme = 'dark';
            }
            document.querySelectorAll('.sidebar-container, aside, .mobile-backdrop, button[aria-label="Open menu"]').forEach(el => el.remove());

            // Turn off flex/scroll at every ancestor of the lesson content so
            // the layout paginates as a plain block. Reach through:
            //   <body> flex column
            //     <div class="layout"> flex row (or whatever wrapper)
            //       <main overflow=auto>
            //         <div display=flex>  <-- LessonLayout
            //           <div maxWidth=900px> <-- content
            const html = document.documentElement;
            const body = document.body;
            html.style.height = 'auto';
            html.style.overflow = 'visible';
            body.style.height = 'auto';
            body.style.overflow = 'visible';
            body.style.display = 'block';

            const main = document.querySelector('main');
            if (main) {
              main.style.overflow = 'visible';
              main.style.height = 'auto';
              main.style.padding = '20px 32px';
              main.style.flex = 'none';
              main.style.display = 'block';
              // CRITICAL: an explicit width, not left to resolve from the flex
              // ancestor. Once `main` is pulled out of flex sizing (flex:none)
              // and freed from its scroll-container role (overflow:visible,
              // height:auto), Chromium has no definite containing-block width
              // for it anymore and falls into an unconstrained intrinsic-sizing
              // layout pass. Ordinary text reflows fine in that pass, but a
              // `width="100%"` mermaid SVG resolves against Chromium's internal
              // "unbounded" sentinel (~1,000,000px) instead of a real number —
              // proportionally scaling its height with it. One diagram then
              // measures hundreds of thousands of pixels tall, blows out that
              // lesson's computed PDF page height by orders of magnitude, and
              // produces a wall of near-blank pages in the merged section PDF.
              // Reproduced and isolated by bisecting this function line by
              // line; giving `main` a real pixel width removes the ambiguity.
              main.style.width = pageWidthPx + 'px';
              // Its flex-row wrapper (LessonLayout root) — turn off the flex.
              const lessonRoot = main.querySelector(':scope > div');
              if (lessonRoot) {
                lessonRoot.style.display = 'block';
                lessonRoot.style.overflow = 'visible';
                lessonRoot.style.height = 'auto';
              }
              // Any inline maxWidth constraint on the content column.
              const contentCol = main.querySelector(':scope > div > div');
              if (contentCol) {
                contentCol.style.maxWidth = 'none';
                contentCol.style.width = '100%';
                contentCol.style.flex = 'none';
              }
            }
          }, { pageWidthPx: PAGE_WIDTH_PX, dark: DARK });
          await page.emulateMedia({ media: 'print', ...(DARK ? { colorScheme: 'dark' } : {}) });
          // Wait for mermaid to actually finish, not a fixed guess. mermaid.render()
          // is async (FlowChart.tsx sets the SVG into state once its promise
          // resolves) — a blind timeout is a race: most diagrams render well under
          // 500ms, but a bigger/more complex one occasionally doesn't, and gets
          // captured mid-render — the .flow-chart wrapper and its title bar are
          // already in the DOM, but the inner content div is still empty, so the
          // page shows a title with a big blank box under it and no error anywhere
          // to flag it. Found by rendering a captured PDF page to PNG and actually
          // looking at it (a title bar with nothing below), not by reading the code.
          await page.waitForFunction(() => {
            const charts = document.querySelectorAll('.flow-chart');
            return Array.from(charts).every((el) => el.querySelector('svg') !== null);
          }, { timeout: 10_000 }).catch(() => {
            // Don't hard-fail the whole lesson if a chart is genuinely broken
            // (bad mermaid syntax) — that's a content bug, not a timing one, and
            // should still produce a page instead of skipping it entirely.
          });
          await page.waitForTimeout(150);   // settle the syntax highlighter too

          // Real, standard Letter-format pagination — the SAME thing a
          // browser's own Cmd+P does. A previous version of this script
          // captured one giant custom-height page per lesson instead (sized
          // to the lesson's full scrollHeight) on the theory that a PDF
          // viewer's "fit to page" would paginate it afterward. That doesn't
          // hold up: Adobe Reader (and the PDF spec itself) caps a single
          // page at 200x200 inches, and several of this site's longer
          // lessons render past 300in tall — Adobe truncates those silently
          // ("dimensions are out-of-range... content might be truncated"),
          // with no visible glitch to tip you off. Verified directly: the
          // same page captured this way instead produces clean, correctly-
          // broken standard pages, because it's exercising the exact CSS
          // (@page, break-inside: avoid on pre/table/.flow-chart/.info-box)
          // that already makes Cmd+P work well — no custom sizing needed.
          const buf = await page.pdf({
            format: 'Letter',
            printBackground: true,
            margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
          });

          // Log per-lesson page count so the user can see the pipeline progress.
          const { PDFDocument: PDFDocumentForCount } = await import('pdf-lib');
          const pageCount = (await PDFDocumentForCount.load(buf)).getPageCount();
          console.log(`           ${pageCount} page${pageCount === 1 ? '' : 's'}, ${(buf.length/1024).toFixed(0)}KB`);

          buffers.push(buf);
        } catch (err) {
          // Don't let one broken/hung lesson (e.g. a page embedding a live
          // widget that fails to load in headless Chromium) abort the whole
          // section's PDF. Skip it and keep going.
          console.error(`           SKIPPED (${err.message.split('\n')[0]})`);
          skipped.push({ section: section.id, lesson: lesson.title, reason: err.message.split('\n')[0] });
        } finally {
          await page.close();
        }
      }

      if (buffers.length === 0) {
        // Every lesson threw. Writing a 0-page PDF here produced a file that
        // most viewers refuse to open, which looked like a corrupt export
        // rather than "nothing rendered".
        console.error(`[pdf] ${section.id}: no lessons rendered — skipping ${filename}`);
        continue;
      }

      // Concatenate PDFs — we use a tiny inline PDF merger to avoid another dep.
      const merged = await mergePdfBuffers(buffers);
      const withDivider = await prependSectionDivider(
        merged, section, positionOf.get(section.id), fullOrder.length, DARK,
      );
      await writeFile(filename, withDivider);
      await compressPdf(filename);
      writtenFiles.set(section.id, filename);
    }
  } finally {
    await browser.close();
    stopPreviewServer(preview);
  }

  if (skipped.length) {
    console.error('');
    console.error(`[pdf] !!! ${skipped.length} LESSON(S) MISSING FROM THIS PDF !!!`);
    for (const s of skipped) {
      console.error(`[pdf]   - ${s.section} / ${s.lesson}`);
      console.error(`[pdf]     ${s.reason}`);
    }
    console.error('[pdf] Re-run — these are usually transient timeouts on pages that');
    console.error('[pdf] boot a real toolchain in-browser, and they capture on retry.');
    console.error('');
  } else {
    console.log('[pdf] No lessons skipped — every registered lesson is in this PDF.');
  }
  console.log(`[pdf] Done. PDFs in ${OUT_DIR}`);

  if (COMBINED) {
    await buildCombinedPdf({ sections: targets, groups, writtenFiles, dark: DARK, cheatsheetsOnly: CHEATSHEETS_ONLY });
  }

  if (CHEATSHEETS_ONLY) {
    // Clean up the temp per-section captures now that they're stitched into
    // the one real deliverable — dist-pdf/ should only show the combined file.
    for (const tmpFile of writtenFiles.values()) {
      await rm(tmpFile, { force: true });
    }
    console.log(`[pdf] Cleaned up ${writtenFiles.size} temp per-section capture(s).`);
  }
}

/**
 * Stitches every already-written per-section PDF into one whole-site PDF, in
 * sidebar order (not sections.ts declaration order — see sidebarSectionOrder),
 * with a generated cover page listing the table of contents by group.
 */
async function buildCombinedPdf({ sections, groups, writtenFiles, dark, cheatsheetsOnly }) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const order = sidebarSectionOrder(groups).filter((id) => writtenFiles.has(id));
  if (order.length === 0) {
    console.error('[pdf] --combined: no rendered sections to combine — skipping.');
    return;
  }

  console.log(`[pdf] Combining ${order.length} section PDFs into one file...`);

  const combined = await PDFDocument.create();
  const font = await combined.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await combined.embedFont(StandardFonts.Helvetica);
  const idToSection = new Map(sections.map((s) => [s.id, s]));

  // Content pages FIRST, before the cover — pdf-lib's insertPage lets the
  // cover be prepended afterward, but we need each section's first-page
  // PDFRef in hand before drawing the table of contents, since that's what
  // the "click a section, jump to it" links below point at.
  // pages[0] is that section's divider page (added in main()), so the
  // contents links below land on a page that names the section.
  const firstPageOf = new Map(); // sectionId -> PDFPage (its divider page)
  for (const id of order) {
    const buf = await readFile(writtenFiles.get(id));
    const src = await PDFDocument.load(buf);
    const pages = await combined.copyPages(src, src.getPageIndices());
    for (const p of pages) combined.addPage(p);
    if (pages.length > 0) firstPageOf.set(id, pages[0]);
  }

  // Cover page: title + a clickable table of contents (section labels in the
  // same order they'll appear), paginating onto more cover pages if long.
  // The cover is generated with pdf-lib (not captured from the browser), so
  // it needs its own dark styling to match the captured pages that follow —
  // a light-mode cover in front of an otherwise-dark PDF would be jarring.
  // Built AFTER the content above, then inserted at the front (index 0, 1,
  // 2... in order) so it still ends up first in reading order.
  const PAGE_W = 8.5 * 72, PAGE_H = 11 * 72; // Letter, in PDF points (72/in)
  const titleColor = dark ? rgb(0.894, 0.902, 0.941) : rgb(0.1, 0.1, 0.15);   // #e4e6f0 dark / near-black light
  const dateColor = dark ? rgb(0.576, 0.6, 0.698) : rgb(0.4, 0.4, 0.4);       // #9399b2 dark / mid-grey light
  const linkColor = dark ? rgb(0.357, 0.612, 0.965) : rgb(0.145, 0.388, 0.922); // --accent-blue, both themes
  const coverBg = rgb(0.059, 0.067, 0.09); // #0f1117 — the site's real --bg-primary dark value

  let insertAt = 0;
  const newCoverPage = () => {
    const p = combined.insertPage(insertAt++, [PAGE_W, PAGE_H]);
    if (dark) p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: coverBg });
    return p;
  };

  // A Link annotation with a /Dest pointing at another page's PDFRef — the
  // actual "clickable" part. pdf-lib has no high-level helper for this, so
  // it's built from the low-level context.obj()/register()/addAnnot() API;
  // context.obj() converts bare JS strings to PDFName (not PDFString), which
  // is exactly what /Type, /Subtype, and the /Fit destination type need.
  const addSectionLink = (page, targetPage, rect) => {
    if (!targetPage) return;
    const annotDict = combined.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: rect,
      Border: [0, 0, 0],
      Dest: [targetPage.ref, 'Fit'],
    });
    page.node.addAnnot(combined.context.register(annotDict));
  };

  let cover = newCoverPage();
  let y = PAGE_H - 90;
  cover.drawText(
    cheatsheetsOnly ? 'Tutorials — Cheat Sheets Only' : 'Tutorials — Complete Reference',
    { x: 54, y, size: 22, font, color: titleColor },
  );
  y -= 28;
  cover.drawText(new Date().toISOString().slice(0, 10), { x: 54, y, size: 10, font: bodyFont, color: dateColor });
  y -= 36;
  cover.drawText('Contents', { x: 54, y, size: 14, font, color: titleColor });
  y -= 22;

  for (const id of order) {
    const label = idToSection.get(id)?.label ?? id;
    if (y < 60) {
      cover = newCoverPage();
      y = PAGE_H - 60;
    }
    const text = `•  ${label}`;
    cover.drawText(text, { x: 66, y, size: 11, font: bodyFont, color: linkColor });
    // Clickable area: the drawn text's own width, generous vertical padding
    // (a few points above/below the glyphs, not just a tight box) so the
    // link is easy to hit, not just the exact glyph outlines.
    const textWidth = bodyFont.widthOfTextAtSize(text, 11);
    addSectionLink(cover, firstPageOf.get(id), [66, y - 3, 66 + textWidth, y + 13]);
    y -= 18;
  }

  // A FILTERED run (e.g. `build-pdf.mjs react-query --combined --dark`) must not
  // write to the full-site filename — doing so silently replaced a 3300-page
  // deliverable with a 24-page one-section test, and nothing in the log said so.
  // Partial runs get their own name.
  const partial = !cheatsheetsOnly && wantedSections.length > 0;
  const baseName = cheatsheetsOnly
    ? 'tutorials-cheatsheets-only'
    : partial
      ? `tutorials-partial-${sections.map((s) => s.id).join('+').slice(0, 60)}`
      : 'tutorials-complete';
  if (partial) {
    console.warn(`[pdf] Partial run (${sections.length} section(s)) — writing ${baseName}.pdf`);
    console.warn('[pdf] The full-site tutorials-complete PDF was NOT touched.');
  }
  const outFile = join(OUT_DIR, `${baseName}${dark ? '-dark' : ''}.pdf`);
  await writeFile(outFile, await combined.save());
  const squeezed = await compressPdf(outFile);
  if (squeezed) {
    const mb = (n) => (n / 1048576).toFixed(1);
    console.log(
      `[pdf] Compressed ${mb(squeezed.before)} MB → ${mb(squeezed.after)} MB ` +
      `(${(squeezed.before / squeezed.after).toFixed(1)}x, lossless — text layer unchanged).`,
    );
  }
  console.log(`[pdf] Combined PDF → ${outFile}`);
}

/**
 * The 14 standard PDF fonts are WinAnsi-encoded and pdf-lib THROWS on any
 * codepoint they can't represent. Section labels and lesson titles routinely
 * contain emoji ("🧪 Lifecycle Simulator", "📋 Cheat Sheet", "🔧 Build
 * Toolchain"), so every string drawn into a generated page is folded to
 * Latin-1 first.
 */
function pdfSafe(s) {
  return String(s ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prepends a full-page section divider to an already-merged section PDF.
 *
 * Without it a section PDF opens cold on lesson one with nothing naming the
 * section, and in the combined file each section runs straight into the next —
 * clicking a section in the contents lands on a lesson page that never says
 * which section it belongs to, so there is no way to tell where one section
 * ends and the next begins. The divider doubles as that section's contents.
 *
 * Done here rather than in buildCombinedPdf so standalone section PDFs get it
 * too; the combined build then inherits it as each section's first page, which
 * is already what its `pages[0]` link target picks up.
 */
async function prependSectionDivider(mergedBuffer, section, position, total, dark) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.load(mergedBuffer);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await doc.embedFont(StandardFonts.Helvetica);

  const PAGE_W = 8.5 * 72, PAGE_H = 11 * 72; // Letter, in PDF points (72/in)
  const titleColor = dark ? rgb(0.894, 0.902, 0.941) : rgb(0.1, 0.1, 0.15);
  const mutedColor = dark ? rgb(0.576, 0.6, 0.698) : rgb(0.4, 0.4, 0.4);
  const ruleColor = dark ? rgb(0.357, 0.612, 0.965) : rgb(0.145, 0.388, 0.922);
  const bg = rgb(0.059, 0.067, 0.09); // #0f1117 — the site's real --bg-primary dark value

  const page = doc.insertPage(0, [PAGE_W, PAGE_H]);
  if (dark) page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: bg });

  let y = PAGE_H - 132;
  if (position && total) {
    page.drawText(pdfSafe(`Section ${position} of ${total}`), {
      x: 54, y, size: 10, font: bodyFont, color: mutedColor,
    });
  }

  y -= 40;
  // Long labels would run off the page at 30pt, so step down until they fit.
  const label = pdfSafe(section?.label ?? section?.id ?? '');
  let titleSize = 30;
  while (titleSize > 14 && font.widthOfTextAtSize(label, titleSize) > PAGE_W - 108) titleSize -= 1;
  page.drawText(label, { x: 54, y, size: titleSize, font, color: titleColor });

  y -= 20;
  page.drawRectangle({ x: 54, y, width: PAGE_W - 108, height: 2, color: ruleColor });

  const lessons = section?.lessons ?? [];
  y -= 34;
  page.drawText(pdfSafe(`${lessons.length} ${lessons.length === 1 ? 'lesson' : 'lessons'} in this section`), {
    x: 54, y, size: 11, font: bodyFont, color: mutedColor,
  });

  y -= 30;
  for (let i = 0; i < lessons.length; i++) {
    if (y < 54) break; // the largest section (22 lessons) still fits; guard anyway
    page.drawText(pdfSafe(`${String(i + 1).padStart(2, ' ')}.  ${lessons[i].title ?? ''}`), {
      x: 66, y, size: 11, font: bodyFont, color: titleColor,
    });
    y -= 17;
  }

  return Buffer.from(await doc.save());
}

/**
 * PDF concatenation via pdf-lib — pure JS, no external binaries needed.
 */
async function mergePdfBuffers(buffers) {
  if (buffers.length === 1) return buffers[0];

  const { PDFDocument } = await import('pdf-lib');
  const merged = await PDFDocument.create();
  for (const buf of buffers) {
    const src = await PDFDocument.load(buf);
    const pages = await merged.copyPages(src, src.getPageIndices());
    for (const p of pages) merged.addPage(p);
  }
  const out = await merged.save();
  return Buffer.from(out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
