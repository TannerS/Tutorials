import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TsNewProject() {
  return (
    <LessonLayout title="New TypeScript Project" sectionId="typescript" lessonIndex={8} prev={{ path: "/typescript/bestpractices", label: "TypeScript Best Practices" }} next={{ path: "/typescript/tsconfig", label: "tsconfig Reference" }}>
      <p>Setting up a new TypeScript project correctly from the start saves hours of configuration pain later. This lesson covers the recommended setup for React + TypeScript with Vite.</p>
      <CodeBlock language="bash" title="Project Setup Commands">
{`# Create React + TypeScript project with Vite
npm create vite@latest my-app -- --template react-ts
cd my-app && npm install

# Project structure:
# my-app/
# ├── src/
# │   ├── components/
# │   ├── hooks/
# │   ├── types/         ← shared type definitions
# │   ├── utils/
# │   ├── App.tsx
# │   └── main.tsx
# ├── tsconfig.json
# ├── tsconfig.app.json
# └── vite.config.ts

# Essential dev dependencies
npm install -D @types/node
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier

# Popular runtime libraries with types included
npm install react-router-dom   # @types included
npm install @tanstack/react-query
npm install zod                # runtime validation + type inference`}
      </CodeBlock>
      <CodeBlock language="typescript" title="Recommended tsconfig.json">
{`{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,           // Vite handles transpilation
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]      // import { Button } from '@/components/Button'
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`}
      </CodeBlock>
      <InfoBox variant="tip" title="Zod for Runtime Validation">
        <p>TypeScript types vanish at runtime — they can't validate API responses. Zod bridges this gap: define a schema once, get both runtime validation and TypeScript types. z.infer&lt;typeof UserSchema&gt; extracts the TypeScript type, and schema.parse(data) validates at runtime with helpful error messages.</p>
      </InfoBox>
      <InteractiveChallenge
        question="Why is noEmit: true recommended when using Vite with TypeScript?"
        options={["It makes TypeScript faster", "Vite handles transpilation; tsc only type-checks (noEmit) without duplicating the build process", "It prevents generating declaration files", "It disables source maps"]}
        correctIndex={1}
        explanation="Vite uses esbuild for fast TypeScript transpilation (ignoring types for speed). TypeScript compiler with noEmit runs type checking only — it reports type errors without outputting files. This gives you fast builds (Vite) and type safety (tsc --noEmit in CI) without the two fighting over output."
      />

    </LessonLayout>
  );
}
