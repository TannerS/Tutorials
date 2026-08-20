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
 *   npm run pdf:section java                # re-use the existing dist/ build
 *   node scripts/build-pdf.mjs java react19 # multiple sections
 *   node scripts/build-pdf.mjs --combined   # re-use dist/, all sections, + combine
 *   node scripts/build-pdf.mjs --combined --dark   # ...styled dark instead
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
const COMBINED = rawArgs.includes('--combined');
const DARK = rawArgs.includes('--dark');
const wantedSections = rawArgs.filter((a) => a !== '--combined' && a !== '--dark');

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
  const targets = wantedSections.length
    ? sections.filter((s) => wantedSections.includes(s.id))
    : sections;

  if (targets.length === 0) {
    console.error(
      `[pdf] No sections matched. Available: ${sections.map((s) => s.id).join(', ')}`,
    );
    process.exit(1);
  }

  console.log(`[pdf] Starting preview server on ${url}`);
  const preview = await startPreviewServer(port);

  await mkdir(OUT_DIR, { recursive: true });

  console.log(`[pdf] Launching Chromium (headless)...`);
  const browser = await chromium.launch();
  const writtenFiles = new Map(); // sectionId -> filepath, only sections that actually rendered
  try {
    for (const section of targets) {
      const filename = join(OUT_DIR, `${section.id}${DARK ? '-dark' : ''}.pdf`);
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
          await page.goto(target, { waitUntil: 'load', timeout: 30_000 });

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
          await page.waitForTimeout(500);   // let mermaid + syntax highlighter finish

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
      await writeFile(filename, merged);
      writtenFiles.set(section.id, filename);
    }
  } finally {
    await browser.close();
    stopPreviewServer(preview);
  }

  console.log(`[pdf] Done. PDFs in ${OUT_DIR}`);

  if (COMBINED) {
    await buildCombinedPdf({ sections: targets, groups, writtenFiles, dark: DARK });
  }
}

/**
 * Stitches every already-written per-section PDF into one whole-site PDF, in
 * sidebar order (not sections.ts declaration order — see sidebarSectionOrder),
 * with a generated cover page listing the table of contents by group.
 */
async function buildCombinedPdf({ sections, groups, writtenFiles, dark }) {
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
  const firstPageOf = new Map(); // sectionId -> PDFPage (its first page)
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
  cover.drawText('Tutorials — Complete Reference', { x: 54, y, size: 22, font, color: titleColor });
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

  const outFile = join(OUT_DIR, `tutorials-complete${dark ? '-dark' : ''}.pdf`);
  await writeFile(outFile, await combined.save());
  console.log(`[pdf] Combined PDF → ${outFile}`);
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
