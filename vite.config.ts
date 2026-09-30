import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * GitHub Pages serves this repo as a PROJECT page, at
 * https://<user>.github.io/Tutorials/ — so every built asset URL has to carry
 * that `/Tutorials/` prefix or it 404s against the user page's root.
 *
 * Only `build` gets the prefix. `vite dev` stays mounted at `/` so the local
 * workflow (and the URLs in every bookmark) are unchanged.
 */
const BASE = '/Tutorials/';

/**
 * GitHub Pages is a static file server with no rewrite rule, so a deep link
 * like /Tutorials/react-testing/cheatsheet has no file behind it and returns
 * the 404 page. Shipping a byte-identical copy of index.html AS 404.html means
 * that response is the app itself: Pages serves it without redirecting, so
 * location.pathname is still the requested route and React Router renders it
 * normally. The status code stays 404 (which only matters for crawlers), and
 * the address bar never shows a hash.
 */
function emitSpaFallback() {
  return {
    name: 'emit-spa-404',
    apply: 'build' as const,
    closeBundle() {
      const dist = resolve(HERE, 'dist');
      copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'));
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  // `command` is 'serve' for BOTH `vite dev` and `vite preview`, so keying on
  // it alone left preview mounted at '/' while the bundle it was serving
  // referenced '/Tutorials/assets/…'. Every asset 404'd and the PDF export
  // silently captured blank pages — the build looked fine, only the output was
  // wrong. `isPreview` is what separates the two.
  base: command === 'build' || isPreview ? BASE : '/',
  plugins: [react(), emitSpaFallback()],
  server: { port: 5173, strictPort: true },
}));
