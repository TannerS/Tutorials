import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TsTsconfig() {
  return (
    <LessonLayout title="tsconfig Reference" sectionId="typescript" lessonIndex={9} prev={{ path: "/typescript/newproject", label: "New TypeScript Project" }} next={{ path: "/react-router/intro", label: "React Router Introduction" }}>
      <p>tsconfig.json controls how TypeScript compiles your code. Understanding the key options helps you configure TypeScript correctly for your project type.</p>
      <CodeBlock language="json" title="tsconfig Options Reference">
{`{
  "compilerOptions": {
    // === TARGET & OUTPUT ===
    "target": "ES2022",          // output JS version (ES5, ES2015, ES2022, ESNext)
    "module": "ESNext",          // module system (CommonJS for Node, ESNext for bundlers)
    "moduleResolution": "bundler", // how imports are resolved (bundler = Vite/webpack)
    "outDir": "./dist",          // output directory
    "rootDir": "./src",          // input root
    "noEmit": true,              // type-check only, no output (used with Vite)

    // === STRICT MODE (enable all) ===
    "strict": true,              // enables all strict checks below:
    "strictNullChecks": true,    // null/undefined are not implicitly assignable
    "noImplicitAny": true,       // must explicitly annotate where type can't be inferred
    "strictFunctionTypes": true, // function parameter types checked contravariantly
    "strictPropertyInitialization": true, // class properties must be initialized

    // === ADDITIONAL CHECKS ===
    "noUnusedLocals": true,      // error on unused variables
    "noUnusedParameters": true,  // error on unused function parameters
    "noImplicitReturns": true,   // all code paths must return a value
    "noFallthroughCasesInSwitch": true, // switch cases must break/return

    // === INTEROP ===
    "esModuleInterop": true,     // allows default imports from CommonJS modules
    "allowSyntheticDefaultImports": true, // allows: import React from 'react'
    "resolveJsonModule": true,   // import data from './data.json'
    "skipLibCheck": true,        // skip type checking .d.ts files (faster)

    // === PATHS ===
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },  // path aliases

    // === REACT ===
    "jsx": "react-jsx",          // React 17+ automatic JSX transform (no import needed)

    // === DECLARATIONS ===
    "declaration": true,         // generate .d.ts files (for libraries)
    "declarationMap": true,      // source maps for .d.ts files
    "sourceMap": true            // generate .js.map for debugging
  }
}`}
      </CodeBlock>
      <InfoBox variant="note" title="Multiple tsconfig Files">
        <p>Large projects use multiple tsconfig files: tsconfig.json (base), tsconfig.app.json (browser/React code), tsconfig.node.json (build scripts/server). Each can extend the base with "extends": "./tsconfig.json" and override specific settings. This is the pattern Vite scaffolding generates.</p>
      </InfoBox>
      <InteractiveChallenge
        question="What does strictNullChecks enable?"
        options={["Prevents null pointer exceptions at runtime", "Makes null and undefined distinct types that cannot be assigned to other types without explicit checking", "Throws an error when null is returned", "Converts null to undefined automatically"]}
        correctIndex={1}
        explanation="Without strictNullChecks, null and undefined are assignable to any type — a User variable can silently hold null. With strictNullChecks, null and undefined are separate types: User | null explicitly allows null, plain User does not. This prevents null reference errors at compile time."
      />

    </LessonLayout>
  );
}
