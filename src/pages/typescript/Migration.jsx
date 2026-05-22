import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TsMigration() {
  return (
    <LessonLayout title="TypeScript Migration" sectionId="typescript" lessonIndex={6} prev={{ path: "/typescript/react", label: "TypeScript with React" }} next={{ path: "/typescript/bestpractices", label: "TypeScript Best Practices" }}>
      <p>Migrating an existing JavaScript codebase to TypeScript is a gradual process. TypeScript is designed to be adopted incrementally — you can convert one file at a time while keeping everything working.</p>
      <CodeBlock language="json" title="Migration tsconfig.json">
{`{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",

    // Migration settings — start permissive
    "allowJs": true,          // allow .js files alongside .ts
    "checkJs": false,         // don't type-check .js files yet
    "strict": false,          // disable strict mode initially
    "noImplicitAny": false,   // allow implicit any

    // Enable one at a time as you migrate:
    // "noImplicitAny": true,
    // "strictNullChecks": true,
    // "strict": true,

    "skipLibCheck": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`}
      </CodeBlock>
      <CodeBlock language="bash" title="Migration Steps">
{`# Step 1: Install TypeScript
npm install -D typescript @types/react @types/react-dom @types/node

# Step 2: Create tsconfig.json (permissive first)
npx tsc --init

# Step 3: Rename files gradually
# .js → .tsx (React components) or .ts (utilities)
mv src/utils/formatDate.js src/utils/formatDate.ts
mv src/components/Button.jsx src/components/Button.tsx

# Step 4: Add types to the converted files
# Start with explicit : any if needed, replace with real types

# Step 5: Run tsc to see errors
npx tsc --noEmit  # type check only, no output

# Step 6: Tighten tsconfig over time
# Add "strictNullChecks": true → fix null/undefined errors
# Add "noImplicitAny": true   → explicit types everywhere
# Add "strict": true          → all strict checks

# Step 7: Add @types packages for dependencies
npm install -D @types/lodash @types/uuid @types/jest`}
      </CodeBlock>
      <InfoBox variant="tip" title="Quick Wins During Migration">
        <p>Start with utility functions — they're small, standalone, and benefit most from types. Use @ts-ignore sparingly for hard-to-type legacy code. Add type declarations for your API responses first — these benefit every file that uses them. Use any as a stepping stone, not a destination.</p>
      </InfoBox>
      <InteractiveChallenge
        question="What does the allowJs tsconfig option enable during TypeScript migration?"
        options={["Allows TypeScript to compile JavaScript files to ES5", "Allows .js files to coexist with .ts files in the same project", "Allows using JavaScript libraries without types", "Allows skipping type checking for all files"]}
        correctIndex={1}
        explanation="allowJs lets your TypeScript project include both .ts and .js files simultaneously. This enables gradual migration: you can rename and type files one at a time while the rest of the project continues working as JavaScript. No big-bang rewrite required."
      />

    </LessonLayout>
  );
}
