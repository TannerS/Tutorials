// Renders each chart with the repo's own mermaid build, in a real headless
// browser, using the same mermaid.initialize config as src/components/FlowChart.tsx.
// A parse error renders a silent blank box in the app, so this is the only
// honest way to check.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const mermaidSrc = readFileSync('./node_modules/mermaid/dist/mermaid.js', 'utf8');
const charts = JSON.parse(readFileSync(process.argv[2], 'utf8'));

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('  [browser console.error]', m.text()); });
await page.setContent('<!doctype html><html><body><div id="host"></div></body></html>');
await page.addScriptTag({ content: mermaidSrc });
const shape = await page.evaluate(() => {
  const ns = globalThis.__esbuild_esm_mermaid_nm?.mermaid;
  if (!ns) return 'no namespace';
  globalThis.M = ns.default ?? ns;
  return Object.keys(globalThis.M).slice(0, 12).join(',');
});
console.log('mermaid namespace keys:', shape);

let fail = 0;
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
        ok: true,
        bytes: svg.length,
        nodes: (svg.match(/class="node /g) || []).length,
        edges: (svg.match(/flowchart-link/g) || []).length,
        clusters: (svg.match(/class="cluster/g) || []).length,
        err: /aria-roledescription="error"|Syntax error/.test(svg),
      };
    } catch (e) {
      return { ok: false, msg: String(e && e.message ? e.message : e) };
    }
  }, { name, chart });

  if (!res.ok || res.err) {
    fail++;
    console.log(`FAIL  ${name}\n      ${res.msg ?? 'rendered an error diagram'}`);
  } else {
    console.log(`ok    ${name}  —  ${res.nodes} nodes, ${res.edges} edge paths, ${res.clusters} cluster els, ${res.bytes} bytes of SVG`);
  }
}
await browser.close();
console.log(fail ? `\n${fail} chart(s) FAILED` : '\nall charts parsed and rendered');
process.exit(fail ? 1 : 0);
