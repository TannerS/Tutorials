#!/usr/bin/env node
/**
 * Per-section PDF export for the tutorials site.
 *
 * Runs a static preview server (vite preview) over the built site, then
 * uses Playwright to visit every lesson in every section, capture each
 * page as PDF, and concatenate the pages into one PDF per section under
 * apps/tutorials/dist-pdf/.
 *
 * Usage:
 *   npm run build:pdf                       # build + generate every section
 *   node scripts/build-pdf.mjs java         # only the 'java' section
 *   node scripts/build-pdf.mjs java react19 # multiple sections
 *
 * Prerequisites (one-time):
 *   npm install
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const OUT_DIR = join(APP_ROOT, 'dist-pdf');
const HOST = '127.0.0.1';
const PORT = 5273;
const BASE_URL = `http://${HOST}:${PORT}`;

const wantedSections = process.argv.slice(2);

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
  const mod = await import(`file://${outfile}`);
  return mod.sections;
}

async function startPreviewServer(port) {
  return new Promise((resolvePreview, reject) => {
    const child = spawn(
      'npx',
      ['vite', 'preview', '--host', HOST, '--port', String(port), '--strictPort'],
      { cwd: APP_ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
    );

    let ready = false;
    const onData = (buf) => {
      const s = buf.toString();
      if (!ready && /Local:\s+http/.test(s)) {
        ready = true;
        resolvePreview(child);
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => {
      if (!ready) reject(new Error(`vite preview exited with code ${code}`));
    });

    // safety timeout
    setTimeout(() => {
      if (!ready) reject(new Error('vite preview did not start in time'));
    }, 15_000);
  });
}

async function main() {
  const port = await findFreePort(PORT);
  const url = `http://${HOST}:${port}`;

  console.log(`[pdf] Loading sections...`);
  const sections = await loadSections();
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
  try {
    for (const section of targets) {
      const filename = join(OUT_DIR, `${section.id}.pdf`);
      console.log(`[pdf] ${section.label} (${section.id}) → ${filename}`);

      const buffers = [];
      for (const lesson of section.lessons) {
        console.log(`       - ${lesson.title}`);
        // Letter width in CSS pixels at 96 DPI = 8.5in * 96 = 816px.
        // Set the viewport wide enough to match the target paper width so text
        // renders at the same size the print media styles expect.
        const page = await browser.newPage({ viewport: { width: 816, height: 1200 } });
        try {
          const target = url.replace(HOST, '127.0.0.1') + lesson.path;
          await page.goto(target, { waitUntil: 'networkidle' });

          // Remove site chrome that shouldn't appear in the print, and force
          // <main> out of its scroll-container state so the whole content
          // participates in the print layout.
          //
          // (Chromium's PDF pipeline treats overflow:auto containers by only
          //  printing the visible portion — CSS @media print with
          //  overflow:visible does NOT reliably override an inline style set
          //  on <main> during the print pass.)
          await page.evaluate(() => {
            document.documentElement.classList.add('print-mode');
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
          });
          await page.emulateMedia({ media: 'print' });
          await page.waitForTimeout(500);   // let mermaid + syntax highlighter finish

          // Measure the content column itself — it's the most reliable dimension.
          const scrollHeightPx = await page.evaluate(() => {
            const main = document.querySelector('main');
            if (!main) return 1200;
            return Math.max(
              main.scrollHeight,
              main.offsetHeight,
              document.body.scrollHeight,
              document.documentElement.scrollHeight,
            );
          });
          // Capture as ONE tall PDF page per lesson. Printing this from a PDF
          // viewer with "fit to page" produces properly paginated output; PDF
          // viewers also handle native pagination when scaled to Letter.
          const heightIn = Math.max(4, scrollHeightPx / 96);   // px -> inches @ 96 DPI

          const buf = await page.pdf({
            width: '8.5in',
            height: heightIn + 'in',
            printBackground: true,
            margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
          });

          // Log per-lesson size so the user can see the pipeline progress.
          console.log(`           ${scrollHeightPx}px tall, ${(buf.length/1024).toFixed(0)}KB`);

          buffers.push(buf);
        } finally {
          await page.close();
        }
      }

      // Concatenate PDFs — we use a tiny inline PDF merger to avoid another dep.
      const merged = await mergePdfBuffers(buffers);
      await writeFile(filename, merged);
    }
  } finally {
    await browser.close();
    preview.kill();
  }

  console.log(`[pdf] Done. PDFs in ${OUT_DIR}`);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
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
