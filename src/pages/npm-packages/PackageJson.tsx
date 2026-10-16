import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function PackageJson() {
  return (
    <LessonLayout
      title="package.json Deep Dive"
      sectionId="npm-packages"
      lessonIndex={1}
      prev={{ path: '/npm-packages/anatomy', label: 'Anatomy of a Package' }}
      next={{ path: '/npm-packages/modules', label: 'CJS vs ESM & Dual Publishing' }}
    >
      <h2>Every Field Explained</h2>
      <p>
        package.json is the heart of every npm package. Most developers only use a fraction of
        its capabilities. Let's go through every important field, what it does, and when you
        need it.
      </p>

      <h3>Required Fields</h3>
      <p>
        &quot;Only two fields are required&quot; gets repeated a lot, so it is worth
        checking. A <code>package.json</code> containing nothing but{' '}
        <code>name</code> and <code>version</code> packs fine; drop either one and npm
        refuses with a specific error:
      </p>
      <CodeBlock language="text" title="Real output — npm 11.12.1, a package.json with neither field">
{`$ npm pack --dry-run
npm error Invalid package, must have name and version`}
      </CodeBlock>
      <CodeBlock language="json" title="name and version (the only truly required fields)">
{`{
  "name": "@myorg/string-utils",
  "version": "2.1.0"
}

// Name rules, with the exact message each one produces. These come from
// validate-npm-package-name (v8.0.0), which is the library npm and the
// registry both use -- not from the docs:
// - lowercase only          "name can no longer contain capital letters"
// - max 214 characters      "name can no longer contain more than 214 characters"
// - can't start with .      "name cannot start with a period"
// - can't start with _      "name cannot start with an underscore"
// - URL-safe characters     "name can only contain URL-friendly characters"
// - hyphens and dots inside the name are fine: ok-name.v2 passes
// - scoped: @scope/name (scope = org or username) passes
// - must be unique on the registry (or unique within its scope)
//
// WHERE these are enforced matters: "npm pack" does NOT check length.
// A 215-character name packs successfully, exit 0 -- it is rejected on
// publish, by the validator above. Local success is not a green light.

// Version rules:
// - Must be valid semver: MAJOR.MINOR.PATCH
// - Pre-release: 1.0.0-alpha.1, 1.0.0-beta.2
// - Build metadata: 1.0.0+20231215 (ignored by semver comparison)`}
      </CodeBlock>

      <h3>Discovery Fields</h3>
      <CodeBlock language="json" title="Fields for npmjs.com search and display">
{`{
  "description": "Fast, lightweight string manipulation utilities with zero dependencies",
  "keywords": ["string", "utils", "manipulation", "slugify", "truncate", "case"],
  "homepage": "https://github.com/myorg/string-utils#readme",
  "repository": {
    "type": "git",
    "url": "https://github.com/myorg/string-utils.git"
  },
  "bugs": {
    "url": "https://github.com/myorg/string-utils/issues"
  },
  "author": "Your Name <you@example.com> (https://yoursite.com)",
  "license": "MIT"
}`}
      </CodeBlock>

      <h3>Entry Point Fields</h3>
      <p>
        This is the part of <code>package.json</code> that people copy from another project
        without understanding, and it is the part most likely to break consumers. The
        confusion is historical: there are <strong>three generations</strong> of
        entry-point field layered on top of each other, and a published package usually
        carries all three.
      </p>
      <ul>
        <li>
          <code>main</code> — the original, from CommonJS. One file, no conditions. Every
          tool understands it.
        </li>
        <li>
          <code>module</code> — <strong>never a Node.js feature at all.</strong> Bundlers
          (webpack, Rollup) invented it to find an ESM build they could tree-shake. Node
          ignores it completely.
        </li>
        <li>
          <code>exports</code> — the modern one. A map, not a path: it can answer
          differently depending on <em>who is asking</em>.
        </li>
      </ul>

      <p>
        The first thing to establish is which one actually wins, because that determines
        whether the others are fallbacks or dead weight. Pointing{' '}
        <code>main</code> and <code>exports</code> at different files answers it:
      </p>

      <CodeBlock language="json" title="dual/package.json — the two fields deliberately disagree">
{`{
  "name": "dual",
  "version": "1.0.0",
  "main": "./main-field.cjs",
  "exports": {
    ".": {
      "require": "./exports-field.cjs",
      "default": "./exports-field.cjs"
    }
  }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Node 26, each file exporting a string that names itself">
{`$ node -e "console.log(require('dual'))"
EXPORTS field won`}
      </CodeBlock>

      <p>
        <strong>When <code>exports</code> exists, it wins and <code>main</code> is not
        consulted.</strong> So <code>main</code> is not a co-equal setting — it is a
        fallback for tooling too old to understand <code>exports</code>. Keep it pointing
        at your CommonJS build for those consumers; modern Node will never read it.
      </p>

      <InfoBox variant="warning" title="exports also LOCKS DOWN your package — this is the part that surprises people">
        <p>
          <code>exports</code> is not just a lookup table, it is an{' '}
          <strong>encapsulation boundary</strong>. Adding it makes every path you did{' '}
          <em>not</em> list unreachable, even though the file is sitting right there in the
          published tarball. Against the same package above:
        </p>
        <CodeBlock language="text" title="Real output — reaching for a real file that is not listed in exports">
{`$ node -e "require('dual/main-field.cjs')"
ERR_PACKAGE_PATH_NOT_EXPORTED`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          That is a feature — it is how you stop consumers depending on your internals, so
          you can restructure <code>dist/</code> later without a breaking change. But it is
          also the single most common way adding <code>exports</code> breaks people:{' '}
          <code>import &quot;pkg/dist/thing.js&quot;</code> worked yesterday and is a hard
          error today. If you want a subpath reachable, it must be in the map. That is also
          why <code>&quot;./package.json&quot;: &quot;./package.json&quot;</code> is worth
          listing — plenty of tools read it, and <code>exports</code> hides it otherwise.
        </p>
      </InfoBox>

      <p>
        Inside each subpath, the keys are <strong>conditions</strong>, and the rule is{' '}
        <strong>first match wins, reading top to bottom</strong> — not most-specific wins.
        Order is therefore load-bearing, which is easy to prove by listing two conditions
        that both match a plain <code>require()</code> and swapping them:
      </p>

      <CodeBlock language="text" title="Real output — same two conditions, order swapped, different file resolved">
{`exports: { ".": { "default": "./a.cjs", "require": "./b.cjs" } }
$ node -e "console.log(require('ord'))"
default (listed FIRST) won

exports: { ".": { "require": "./b.cjs", "default": "./a.cjs" } }
$ node -e "console.log(require('ord'))"
require (listed LATER) won`}
      </CodeBlock>

      <p>
        Both orderings are valid JSON and neither warns. The only difference is which file
        a consumer ends up running. This is the mechanism behind the rule in the box below,
        and the reason <code>&quot;default&quot;</code> must always be listed{' '}
        <strong>last</strong>: it matches everything, so anything after it is dead.
      </p>

      <InfoBox variant="danger" title="The annotated block below will NOT parse — strip the comments">
        <p style={{ marginBottom: 0 }}>
          <code>package.json</code> is strict JSON, and strict JSON has no comments. The
          next block is annotated for reading only; paste it verbatim and every npm command
          fails on the first line it reaches. Verified:{' '}
          <code>
            JSON.parse → Expected property name or &apos;&#125;&apos; in JSON at position 4
          </code>
          . If you want commentary that survives, put it in your README — or use a{' '}
          <code>&quot;//&quot;</code> key, which is legal JSON and which npm ignores.
        </p>
      </InfoBox>

      <CodeBlock language="json" title="The shape to actually ship — ANNOTATED, not copy-pasteable (see the warning above)">
{`{
  // Fallback for tooling that predates "exports". Node ignores it when
  // "exports" is present, but older bundlers and tools still read it.
  "main": "./dist/index.cjs",

  // Bundler-only hint for a tree-shakeable ESM build. Not a Node field.
  "module": "./dist/index.mjs",

  // Fallback types for TypeScript's old "node" moduleResolution.
  "types": "./dist/index.d.ts",

  "exports": {
    ".": {
      // "types" FIRST: see the ordering proof above. If a runtime
      // condition matched first, TypeScript would resolve to the .js
      // and your consumers would silently get 'any'.
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",   // reached by import / ESM
      "require": "./dist/index.cjs"   // reached by require / CJS
      // no "default" here: every real consumer is import or require,
      // and omitting it means an unexpected condition fails loudly
      // instead of being handed the wrong build.
    },

    // Each extra subpath is opt-in. Consumers can import "pkg/utils"
    // ONLY because this entry exists.
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs"
    },

    // Re-exposed deliberately: "exports" would otherwise hide it from
    // the many tools that read a dependency's package.json.
    "./package.json": "./package.json"
  },

  // Only for consumers still on TypeScript's pre-"exports" resolution
  // ("moduleResolution": "node"), which cannot see the map above. New
  // projects on "bundler"/"node16"/"nodenext" do not need this.
  "typesVersions": {
    "*": {
      "utils": ["./dist/utils.d.ts"]
    }
  }
}`}
      </CodeBlock>


      <h3>CLI Executable Field</h3>
      <CodeBlock language="json" title="bin — making CLI tools">
{`{
  "bin": {
    "my-cli": "./bin/cli.js"
  }
}

// Single binary shorthand:
{
  "name": "my-cli",
  "bin": "./bin/cli.js"
}
// Creates executable named same as package name

// The bin file needs a shebang line:
// #!/usr/bin/env node
// console.log('Hello from my-cli!');

// After npm install, the binary is available at:
// ./node_modules/.bin/my-cli (local install)
// /usr/local/bin/my-cli (global install)`}
      </CodeBlock>

      <h3>Published Files Control</h3>
      <CodeBlock language="json" title="files — whitelist what gets published">
{`{
  "files": [
    "dist/",
    "types/",
    "bin/",
    "!dist/**/*.map"
  ]
}

// Supports glob patterns:
// "dist/"         → entire directory
// "dist/**/*.js"  → only .js files in dist
// "!dist/test*"   → exclude files starting with "test"

// Remember: package.json, README, LICENSE are ALWAYS included`}
      </CodeBlock>

      <h3>Dependency Fields</h3>
      <CodeBlock language="json" title="The dependency categories">
{`{
  "dependencies": {
    "lodash": "^4.17.21"
  },

  "devDependencies": {
    "typescript": "^5.9.0",
    "tsup": "^8.0.0",
    "vitest": "^3.0.0",
    "eslint": "^9.0.0"
  },

  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  },

  "peerDependenciesMeta": {
    "react": {
      "optional": false
    }
  },

  "optionalDependencies": {
    "fsevents": "^2.3.0"
  }
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="When each dependency type is installed">
{`# dependencies:
# - Installed when YOUR package is installed by a consumer
# - Installed during npm install in your project
# - These are your RUNTIME requirements

# devDependencies:
# - Only installed in YOUR project during development
# - NOT installed when someone does: npm install your-package
# - Build tools, test frameworks, linters go here

# peerDependencies:
# - NOT installed by your package
# - Consumer MUST provide them
# - npm 7+ auto-installs peers (npm 6 only warned)
# - Use for: frameworks (React), runtimes your plugin extends

# peerDependenciesMeta:
# - Mark peer deps as optional
# - If optional: true, no warning if consumer doesn't have it

# optionalDependencies:
# - Install is attempted but failure doesn't abort
# - Use for: OS-specific packages (fsevents on macOS)
# - Your code must handle the case where it's missing`}
      </CodeBlock>

      <InfoBox variant="warning" title="The #1 Mistake: Wrong Dependency Category">
        Putting build tools (TypeScript, webpack) in <code>dependencies</code> instead of
        <code>devDependencies</code> means every consumer downloads your entire build toolchain.
        If you don't need it at runtime, it's a devDependency. Conversely, putting runtime deps
        in devDependencies means they won't be installed for consumers — instant breakage.
      </InfoBox>

      <h3>Module System Configuration</h3>
      <CodeBlock language="json" title="type — CJS vs ESM default">
{`{
  "type": "module"
}

// "type": "module"
// - .js files are treated as ES modules (import/export)
// - Use .cjs extension for CommonJS files
// - Default if omitted: "commonjs"

// "type": "commonjs" (or omit the field)
// - .js files are treated as CommonJS (require/module.exports)
// - Use .mjs extension for ES module files`}
      </CodeBlock>

      <h3>Tree-Shaking Hint</h3>
      <CodeBlock language="json" title="sideEffects — help bundlers optimize">
{`{
  "sideEffects": false
}

// sideEffects: false means:
// "Every file in this package is pure — importing it without
//  using the exports has no observable effect"
// This lets bundlers safely remove unused exports (tree-shaking)

// If SOME files have side effects:
{
  "sideEffects": [
    "*.css",
    "./src/polyfills.js"
  ]
}

// Side effect examples:
// - CSS imports (import './styles.css')
// - Polyfills that modify globals
// - Files that run code at import time`}
      </CodeBlock>

      <h3>Engine Requirements</h3>
      <CodeBlock language="json" title="engines — specify Node.js version">
{`{
  "engines": {
    "node": ">=20.19.0",
    "npm": ">=10.0.0"
  }
}

// By default, engines is advisory (just a warning)
// To make it enforced:
// .npmrc: engine-strict=true
// Then npm install FAILS if engine requirements aren't met`}
      </CodeBlock>

      <h3>Publishing Configuration</h3>
      <CodeBlock language="json" title="publishConfig — control how/where to publish">
{`{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/",
    "tag": "latest"
  },

  "private": true
}

// "private": true prevents accidental publishing
// Use for: apps, internal tools, monorepo roots
// npm publish will refuse if private is true

// publishConfig.access: "public" or "restricted"
// Scoped packages (@org/pkg) default to "restricted"
// Set "public" to publish scoped packages publicly

// publishConfig.registry: override where to publish
// Useful for private registries`}
      </CodeBlock>

      <h2>Complete Annotated package.json</h2>
      <p>
        Here's a production-ready package.json for a TypeScript utility library:
      </p>

      <CodeBlock language="json" title="Real-world package.json">
{`{
  "name": "@myorg/string-utils",
  "version": "2.1.0",
  "description": "Fast string manipulation utilities with zero dependencies",
  "keywords": ["string", "utils", "slugify", "truncate"],
  "license": "MIT",
  "author": "Your Name <you@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/myorg/string-utils.git"
  },
  "bugs": "https://github.com/myorg/string-utils/issues",
  "homepage": "https://github.com/myorg/string-utils#readme",

  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },

  "files": ["dist/"],
  "sideEffects": false,

  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm run test",
    "clean": "rimraf dist"
  },

  "engines": {
    "node": ">=20.19.0"
  },

  "devDependencies": {
    "eslint": "^9.0.0",
    "rimraf": "^6.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.9.0",
    "vitest": "^3.0.0"
  },

  "publishConfig": {
    "access": "public"
  }
}`}
      </CodeBlock>

      <FlowChart
        title="Field Categories at a Glance"
        chart={"graph TD\n  A[package.json fields] --> B[Identity]\n  A --> C[Entry Points]\n  A --> D[Dependencies]\n  A --> E[Publishing]\n  A --> F[Tooling]\n  B --> G[name, version, description, license]\n  C --> H[main, module, exports, types, bin]\n  D --> I[dependencies, devDependencies, peerDependencies]\n  E --> J[files, publishConfig, private, sideEffects]\n  F --> K[scripts, engines, type]"}
      />

      <h2>Common Mistakes</h2>

      <CodeBlock language="json" title="Mistakes and their fixes">
{`// MISTAKE 1: Build tools in dependencies
{
  "dependencies": {
    "typescript": "^5.3.0",  // ❌ consumers don't need this
    "tsup": "^8.0.0"         // ❌ move to devDependencies
  }
}

// MISTAKE 2: Missing types field
{
  "main": "./dist/index.js"
  // ❌ TypeScript users won't get type hints
  // Fix: add "types": "./dist/index.d.ts"
}

// MISTAKE 3: Wrong main entry
{
  "main": "./src/index.ts"  // ❌ consumers can't run TypeScript!
  // Fix: "main": "./dist/index.cjs"
}

// MISTAKE 4: No files field (shipping everything)
{
  // Without "files", npm publishes based on .gitignore
  // This might include: src/, tests/, .env, docs/
  // Fix: add "files": ["dist/"]
}

// MISTAKE 5: Missing sideEffects for tree-shaking
{
  // Without sideEffects: false, bundlers can't safely
  // remove unused exports from your package
}

// MISTAKE 6: Forgetting "type" for ESM
{
  "main": "./dist/index.mjs"
  // If "type" is missing, .js files default to CommonJS
  // Use explicit .mjs/.cjs extensions OR set "type": "module"
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Validate Your package.json">
        Use <code>npx publint</code> to check your package.json for common publishing mistakes.
        It verifies entry points exist, exports are correct, and files are properly included.
        Run it before every publish.
      </InfoBox>

      <h2>Key Takeaways</h2>
      <ul>
        <li>Only <code>name</code> and <code>version</code> are truly required; everything else improves discoverability and correctness</li>
        <li>Use <code>exports</code> for modern entry points, keep <code>main</code> as fallback</li>
        <li>Put <code>types</code> first in exports conditions for TypeScript</li>
        <li>Runtime deps → dependencies, build tools → devDependencies, framework → peerDependencies</li>
        <li><code>sideEffects: false</code> enables tree-shaking for your consumers</li>
        <li><code>"files"</code> whitelist controls published content; always set it</li>
        <li>Use <code>npx publint</code> to catch common mistakes before publishing</li>
      </ul>
    </LessonLayout>
  );
}
