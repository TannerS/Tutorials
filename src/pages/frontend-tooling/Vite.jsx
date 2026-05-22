import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function FTVite() {
  return (
    <LessonLayout
      title="Vite"
      sectionId="frontend-tooling"
      lessonIndex={0}
      prev={null}
      next={{ path: '/frontend-tooling/linting', label: 'ESLint & Prettier' }}
    >
      <h2>What is Vite?</h2>
      <p>
        Vite is a next-generation frontend build tool that dramatically improves the developer experience.
        It uses native ES modules in development (no bundling) and Rollup for production builds.
      </p>

      <FlowChart
        title="Vite Architecture"
        chart={"graph LR\n  A[Dev Server Start] --> B[Pre-bundle Dependencies]\n  B --> C[esbuild - 100x faster than JS]\n  C --> D[Native ESM Dev Server]\n  D --> E[Browser requests file]\n  E --> F[Vite transforms on demand]\n  F --> G[HMR on file change]"}
      />

      <h2>Vite vs Webpack</h2>

      <CodeBlock language="bash" title="Key differences">
{`# Webpack approach (traditional)
# ─ Bundles ALL code upfront before serving
# ─ Cold start: 30-60 seconds for large apps
# ─ HMR: re-bundles affected modules (slow)
# ─ Always fast in production (mature optimization)

# Vite approach
# ─ Dev: serves files as-is (native ESM, no bundle)
# ─ Cold start: < 1 second (only transforms requested files)
# ─ HMR: only invalidates changed module (instant)
# ─ Prod: uses Rollup (excellent tree-shaking)`}
      </CodeBlock>

      <h2>Project Setup</h2>

      <CodeBlock language="bash" title="Creating projects">
{`# React + JS
npm create vite@latest my-app -- --template react

# React + TypeScript
npm create vite@latest my-app -- --template react-ts

# React + SWC (faster transforms)
npm create vite@latest my-app -- --template react-swc-ts

# Vue, Svelte, vanilla also available
npm create vite@latest my-app -- --template vue-ts

cd my-app && npm install && npm run dev`}
      </CodeBlock>

      <h2>vite.config.ts Reference</h2>

      <CodeBlock language="typescript" title="Complete vite.config.ts">
{`import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // Path aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // Dev server config
    server: {
      port: 3000,
      strictPort: true,        // fail if port is in use
      host: true,              // expose to network (0.0.0.0)
      open: '/dashboard',      // auto-open this path
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
      cors: true,
    },

    // Build config
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: mode !== 'production',
      minify: 'esbuild',
      target: 'es2020',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            router: ['react-router-dom'],
          },
        },
      },
    },

    // Preview server (vite preview)
    preview: {
      port: 4173,
    },

    // CSS config
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
      preprocessorOptions: {
        scss: {
          additionalData: '@import "./src/styles/variables.scss";',
        },
      },
    },

    // Dependency optimization
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
      exclude: ['some-local-package'],
    },

    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version),
    },
  }
})`}
      </CodeBlock>

      <h2>Plugins Ecosystem</h2>

      <CodeBlock language="typescript" title="Common Vite plugins">
{`// @vitejs/plugin-react (Babel) — default
// @vitejs/plugin-react-swc (SWC) — faster HMR

// vite-plugin-svgr — import SVGs as React components
import svgr from 'vite-plugin-svgr'
// Usage: import Logo from './logo.svg?react'

// vite-tsconfig-paths — resolve TypeScript path aliases
import tsconfigPaths from 'vite-tsconfig-paths'

// rollup-plugin-visualizer — bundle analysis
import { visualizer } from 'rollup-plugin-visualizer'

// vite-plugin-pwa — Progressive Web App
import { VitePWA } from 'vite-plugin-pwa'

// vite-plugin-checker — TypeScript + ESLint in dev
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    svgr(),
    checker({ typescript: true }),
    visualizer({ open: true }),  // runs on build
  ],
})`}
      </CodeBlock>

      <h2>Library Mode</h2>

      <CodeBlock language="typescript" title="Building a library with Vite">
{`// vite.config.ts for library builds
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [react(), dts()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyLib',
      formats: ['es', 'cjs'],
      fileName: (format) => \`my-lib.\${format}.js\`,
    },
    rollupOptions: {
      // Externalize React — don't bundle it in library
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})`}
      </CodeBlock>

      <InfoBox variant="tip" title="Pre-bundling Dependencies">
        <p>
          On first startup, Vite pre-bundles <code>node_modules</code> with esbuild and caches them in
          <code>.vite/deps/</code>. This converts CJS packages to ESM and bundles small packages
          to reduce browser request counts. If a dependency changes, Vite re-bundles automatically.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Why is Vite's development server faster than Webpack's for large projects?"
        options={[
          "Vite uses a faster programming language (Go) for all processing",
          "Vite does not bundle files in development — it serves native ES modules and transforms only requested files",
          "Vite only processes files in the current visible viewport",
          "Vite skips TypeScript type checking entirely"
        ]}
        correctIndex={1}
        explanation="Vite's key insight is that modern browsers support ES modules natively. In development, Vite serves source files directly as ESM without bundling. The browser requests each module it needs, and Vite transforms them on demand. This means startup time is constant regardless of project size — only the files requested for the current page are processed."
      />

      <InteractiveChallenge
        question="What does vite build use for bundling in production (as opposed to development)?"
        options={["esbuild", "Webpack", "Rollup (or Rolldown in newer versions)", "Parcel"]}
        correctIndex={2}
        explanation="Vite uses Rollup for production builds. Rollup has excellent tree-shaking and code-splitting capabilities. esbuild is used in development for fast transforms and dependency pre-bundling. Vite 6+ is transitioning to Rolldown (a Rust-based Rollup replacement) for even faster production builds."
      />
    </LessonLayout>
  );
}
