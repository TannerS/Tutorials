// Verifies every <FlowChart> diagram in src/pages actually renders.
//
// WHY THIS EXISTS: FlowChart.tsx catches mermaid errors and leaves the box
// empty. A diagram with a syntax error therefore fails SILENTLY -- the page
// looks fine apart from a blank gap, nothing logs during a build, and tsc and
// eslint cannot see inside a chart string. Three charts were broken this way
// before this check existed.
//
// So this does the only honest thing: extract every chart from the source and
// render it with the repo's own mermaid build in a real headless browser,
// using the same initialize() config as the component.
//
//   node scripts/verify-mermaid.mjs          # check all
//   node scripts/verify-mermaid.mjs --quiet  # only report failures
//
// Exits 1 if any chart fails, so it works as a pre-commit / CI gate.

import { chromium } from 'playwright';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = path.join(ROOT, 'src/pages');
const quiet = process.argv.includes('--quiet');

// ---------------------------------------------------------------------------
// Extract chart={...} values. Two spellings are used across the repo:
//   chart={`graph TD ...`}      template literal
//   chart={"graph TD\n..."}     quoted string with escapes
// We need the RUNTIME string, so escapes are resolved the way JS would.
// ---------------------------------------------------------------------------
function extractCharts(file, src) {
  const out = [];
  let i = 0;
  while ((i = src.indexOf('chart={', i)) !== -1) {
    const open = i + 7;
    const q = src[open];
    let chart = null;
    let k = open + 1;
    if (q === '`' || q === '"' || q === "'") {
      let buf = '';
      while (k < src.length) {
        if (src[k] === '\\') {
          const c = src[k + 1];
          buf += c === 'n' ? '\n' : c === 't' ? '\t' : c;
          k += 2;
          continue;
        }
        if (src[k] === q) break;
        buf += src[k++];
      }
      chart = buf;
    }
    if (chart !== null) {
      out.push({
        name: `${file}:${src.slice(0, i).split('\n').length}`,
        chart,
      });
    }
    i = k + 1;
  }
  return out;
}

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.tsx')) {
      acc.push(...extractCharts(path.relative(PAGES, p), readFileSync(p, 'utf8')));
    }
  }
  return acc;
}

const charts = walk(PAGES);
console.log(`found ${charts.length} <FlowChart> diagrams`);

// ---------------------------------------------------------------------------
// Render each one. mermaid.render() is what the component calls, so a chart
// that survives this is a chart that survives the app.
// ---------------------------------------------------------------------------
const mermaidSrc = readFileSync(path.join(ROOT, 'node_modules/mermaid/dist/mermaid.js'), 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><html><body><div id="host"></div></body></html>');
await page.addScriptTag({ content: mermaidSrc });

const ready = await page.evaluate(() => {
  // The UMD build exposes mermaid through an esbuild wrapper global; fall back
  // to window.mermaid if that internal name ever changes.
  const ns = globalThis.__esbuild_esm_mermaid_nm?.mermaid ?? globalThis.mermaid;
  if (!ns) return false;
  globalThis.M = ns.default ?? ns;
  return typeof globalThis.M.render === 'function';
});
if (!ready) {
  console.error('could not load mermaid from node_modules — aborting');
  await browser.close();
  process.exit(2);
}

let failed = 0;
for (const { name, chart } of charts) {
  const res = await page.evaluate(async ({ name, chart }) => {
    const M = globalThis.M;
    M.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: { primaryColor: '#252a3f', primaryTextColor: '#e4e6f0' },
      flowchart: { htmlLabels: true, curve: 'basis', padding: 15 },
      fontFamily: "'Inter', sans-serif",
    });
    try {
      const { svg } = await M.render('m-' + name.replace(/[^a-zA-Z0-9_-]/g, ''), chart.trim());
      return {
        ok: !/aria-roledescription="error"|Syntax error/.test(svg),
        nodes: (svg.match(/class="node /g) || []).length,
        reason: 'mermaid rendered its error diagram',
      };
    } catch (e) {
      return { ok: false, reason: String(e?.message ?? e).split('\n').slice(0, 3).join(' ') };
    }
  }, { name, chart });

  if (!res.ok) {
    failed++;
    console.log(`FAIL  ${name}\n      ${res.reason}`);
  } else if (!quiet) {
    console.log(`ok    ${name}  (${res.nodes} nodes)`);
  }
}

await browser.close();
console.log(failed ? `\n${failed} diagram(s) FAILED` : `\nall ${charts.length} diagrams render`);
process.exit(failed ? 1 : 0);
