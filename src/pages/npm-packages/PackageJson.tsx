import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
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
      <CodeBlock language="json" title="name and version (the only truly required fields)">
{`{
  "name": "@myorg/string-utils",
  "version": "2.1.0"
}

// Name rules:
// - Must be lowercase
// - Can contain hyphens and dots
// - Max 214 characters
// - Can't start with . or _
// - Scoped: @scope/name (scope = org or username)
// - Must be unique on the registry (or unique within scope)

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
      <CodeBlock language="json" title="How consumers find your code">
{`{
  "main": "./dist/index.cjs",

  "module": "./dist/index.mjs",

  "types": "./dist/index.d.ts",

  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs"
    },
    "./package.json": "./package.json"
  },

  "typesVersions": {
    "*": {
      "utils": ["./dist/utils.d.ts"]
    }
  }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="exports Order Matters">
        Within each exports condition, put <code>types</code> FIRST. TypeScript resolution
        reads conditions top-to-bottom and uses the first match. If <code>import</code>
        comes before <code>types</code>, TypeScript may not find your declarations.
      </InfoBox>

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
    "typescript": "^5.3.0",
    "tsup": "^8.0.0",
    "jest": "^29.7.0",
    "eslint": "^8.50.0"
  },

  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0"
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
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
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
    "node": ">=18.0.0"
  },

  "devDependencies": {
    "eslint": "^8.50.0",
    "rimraf": "^5.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
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

      <InteractiveChallenge
        question="You're building a React component library. Where should 'react' be listed?"
        options={[
          "dependencies — it's needed at runtime",
          "devDependencies — you only need it for development",
          "peerDependencies — consumers must provide their own React",
          "optionalDependencies — React might not be available"
        ]}
        correctIndex={2}
        explanation="React should be a peerDependency for a component library. If it were in dependencies, consumers would end up with two copies of React (yours and theirs), breaking hooks and context. As a peerDependency, you declare that you need React but expect the consuming application to provide it, ensuring everyone shares one instance."
      />

      <InteractiveChallenge
        question={"What does 'sideEffects: false' tell bundlers?"}
        options={[
          "The package has no bugs",
          "The package doesn't use any dependencies",
          "Every file can be safely removed if its exports aren't used (tree-shaking)",
          "The package doesn't modify global state at install time"
        ]}
        correctIndex={2}
        explanation="sideEffects: false is a hint to bundlers like Webpack and Rollup that importing a module from your package has no observable effect beyond providing exports. This means if a consumer imports { slugify } from your package but never uses it, the bundler can safely remove it from the final bundle (tree-shaking)."
      />

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
