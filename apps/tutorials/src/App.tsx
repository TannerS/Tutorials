import { Routes, Route, Link } from 'react-router-dom'
import Layout from './components/Layout'

// Java
import JavaIntro from './pages/java/Intro'
import JavaSyntax from './pages/java/Syntax'
import JavaOop from './pages/java/Oop'
import JavaCollections from './pages/java/Collections'
import JavaGenerics from './pages/java/Generics'
import JavaExceptions from './pages/java/Exceptions'
import JavaStreams from './pages/java/Streams'
import JavaConcurrency from './pages/java/Concurrency'
import JavaIo from './pages/java/Io'
import JavaAdvanced from './pages/java/Advanced'

// Spring Boot
import SpringIntro from './pages/springboot/Intro'
import SpringSetup from './pages/springboot/Setup'
import SpringDi from './pages/springboot/Di'
import SpringRest from './pages/springboot/Rest'
import SpringData from './pages/springboot/Data'
import SpringSecurity from './pages/springboot/Security'
import SpringTesting from './pages/springboot/Testing'
import SpringConfig from './pages/springboot/Config'
import SpringError from './pages/springboot/Error'
import SpringAdvanced from './pages/springboot/Advanced'

// React 19
import ReactLifecycle from './pages/react19/Lifecycle'
import ReactLifecycleSim from './pages/react19/LifecycleSim'
import ReactHooks from './pages/react19/Hooks'
import ReactState from './pages/react19/State'
import ReactEffects from './pages/react19/Effects'
import ReactContext from './pages/react19/Context'
import ReactPerformance from './pages/react19/Performance'
import ReactNew from './pages/react19/React19'
import ReactServer from './pages/react19/Server'
import ReactPatterns from './pages/react19/Patterns'
import ReactTypescript from './pages/react19/Typescript'
import ReactBuildToolchain from './pages/react19/BuildToolchain'
import ReactCheatSheet from './pages/react19/CheatSheet'

// SQL
import SqlQuickstart from './pages/sql/Quickstart'
import SqlJoins from './pages/sql/Joins'
import SqlWindow from './pages/sql/Window'
import SqlIndexing from './pages/sql/Indexing'
import SqlDesign from './pages/sql/Design'
import SqlTransactions from './pages/sql/Transactions'
import SqlCte from './pages/sql/Cte'
import SqlAdvanced from './pages/sql/Advanced'

// SOLID
import SolidIntro from './pages/solid/Intro'
import SolidSrp from './pages/solid/Srp'
import SolidOcp from './pages/solid/Ocp'
import SolidLsp from './pages/solid/Lsp'
import SolidIsp from './pages/solid/Isp'
import SolidDip from './pages/solid/Dip'

// Design Patterns
import PatternsIntro from './pages/patterns/Intro'
import PatternsSingleton from './pages/patterns/Singleton'
import PatternsStrategy from './pages/patterns/Strategy'
import PatternsDecorator from './pages/patterns/Decorator'
import PatternsBuilder from './pages/patterns/Builder'
import PatternsComposite from './pages/patterns/Composite'
import PatternsProxy from './pages/patterns/Proxy'
import PatternsRealworld from './pages/patterns/Realworld'

// React Anti-Patterns
import AntiIntro from './pages/react-antipatterns/Intro'
import AntiState from './pages/react-antipatterns/State'
import AntiEffects from './pages/react-antipatterns/Effects'
import AntiPerformance from './pages/react-antipatterns/Performance'
import AntiComponents from './pages/react-antipatterns/Components'
import AntiBestPractices from './pages/react-antipatterns/BestPractices'

// Microservices
import MicroIntro from './pages/microservices/Intro'
import MicroPatterns from './pages/microservices/Patterns'
import MicroCommunication from './pages/microservices/Communication'
import MicroData from './pages/microservices/Data'
import MicroScaling from './pages/microservices/Scaling'
import MicroEvents from './pages/microservices/Events'
import MicroContainers from './pages/microservices/Containers'
import MicroMigration from './pages/microservices/Migration'

// API Design
import ApiIntro from './pages/apidesign/Intro'
import ApiMethods from './pages/apidesign/Methods'
import ApiResources from './pages/apidesign/Resources'
import ApiErrors from './pages/apidesign/Errors'
import ApiVersioning from './pages/apidesign/Versioning'
import ApiAdvanced from './pages/apidesign/Advanced'

// Auth & Security
import AuthEncryption from './pages/auth/Encryption'
import AuthTls from './pages/auth/Tls'
import AuthCookies from './pages/auth/Cookies'
import AuthJwt from './pages/auth/Jwt'
import AuthOauth from './pages/auth/Oauth'
import AuthAuthz from './pages/auth/Authz'
import AuthSecurity from './pages/auth/Security'

// Java Cheat Sheet
import JCSyntax from './pages/java-cheatsheet/Syntax'
import JCCollections from './pages/java-cheatsheet/Collections'
import JCStreams from './pages/java-cheatsheet/Streams'
import JCConcurrency from './pages/java-cheatsheet/Concurrency'
import JCAnnotations from './pages/java-cheatsheet/Annotations'

// React Cheat Sheet
import RCHooks from './pages/react-cheatsheet/Hooks'
import RCPatterns from './pages/react-cheatsheet/Patterns'
import RCState from './pages/react-cheatsheet/State'
import RCStyling from './pages/react-cheatsheet/Styling'
import RCRecipes from './pages/react-cheatsheet/Recipes'

// Testing Strategies
import TestIntro from './pages/testing/Intro'
import TestUnit from './pages/testing/Unit'
import TestMocking from './pages/testing/Mocking'
import TestIntegration from './pages/testing/Integration'
import TestE2e from './pages/testing/E2e'
import TestBestPractices from './pages/testing/BestPractices'

// Git & DevOps
import DevGit from './pages/devops/Git'
import DevBranching from './pages/devops/Branching'
import DevCicd from './pages/devops/Cicd'
import DevDocker from './pages/devops/Docker'
import DevCloud from './pages/devops/Cloud'
import DevMonitoring from './pages/devops/Monitoring'

// System Design
import SysIntro from './pages/systemdesign/Intro'
import SysScaling from './pages/systemdesign/Scaling'
import SysCaching from './pages/systemdesign/Caching'
import SysDatabases from './pages/systemdesign/Databases'
import SysDistributed from './pages/systemdesign/Distributed'
import SysMessaging from './pages/systemdesign/Messaging'
import SysInterview from './pages/systemdesign/Interview'

// TypeScript
import TsIntro from './pages/typescript/Intro'
import TsTypes from './pages/typescript/Types'
import TsInterfaces from './pages/typescript/Interfaces'
import TsGenerics from './pages/typescript/Generics'
import TsAdvanced from './pages/typescript/Advanced'
import TsReact from './pages/typescript/React'
import TsMigration from './pages/typescript/Migration'
import TsBestPractices from './pages/typescript/BestPractices'
import TsNewProject from './pages/typescript/NewProject'
import TsTsconfig from './pages/typescript/Tsconfig'
import TsInteractive from './pages/typescript/Interactive'

// React Router v7
import RRIntro from './pages/react-router/Intro'
import RRNested from './pages/react-router/Nested'
import RRData from './pages/react-router/Data'
import RRGuards from './pages/react-router/Guards'
import RRAdvanced from './pages/react-router/Advanced'
import RRTesting from './pages/react-router/Testing'
import RRFullapp from './pages/react-router/Fullapp'
import RRMigration from './pages/react-router/Migration'

// State Management
import SMIntro from './pages/state-mgmt/Intro'
import SMRedux from './pages/state-mgmt/Redux'
import SMZustand from './pages/state-mgmt/Zustand'
import SMComparison from './pages/state-mgmt/Comparison'
import SMPatterns from './pages/state-mgmt/Patterns'
import SMReactQuery from './pages/state-mgmt/ReactQuery'

// Accessibility
import A11yIntro from './pages/accessibility/Intro'
import A11ySemantic from './pages/accessibility/Semantic'
import A11yAria from './pages/accessibility/Aria'
import A11yKeyboard from './pages/accessibility/Keyboard'
import A11yTesting from './pages/accessibility/Testing'

// CSS Mastery
import CSSFlexbox from './pages/css-mastery/Flexbox'
import CSSGrid from './pages/css-mastery/Grid'
import CSSResponsive from './pages/css-mastery/Responsive'
import CSSAnimations from './pages/css-mastery/Animations'
import CSSVariables from './pages/css-mastery/Variables'
import CSSPatterns from './pages/css-mastery/Patterns'

// React Testing
import RTIntro from './pages/react-testing/Intro'
import RTComponents from './pages/react-testing/Components'
import RTHooks from './pages/react-testing/Hooks'
import RTAsync from './pages/react-testing/Async'
import RTForms from './pages/react-testing/Forms'
import RTPatterns from './pages/react-testing/Patterns'

// Frontend Tooling
import FTVite from './pages/frontend-tooling/Vite'
import FTLinting from './pages/frontend-tooling/Linting'
import FTPackages from './pages/frontend-tooling/Packages'
import FTMonorepos from './pages/frontend-tooling/Monorepos'
import FTPerformance from './pages/frontend-tooling/Performance'


// npm Deep Dive
import NpmIntro from './pages/npm-deep-dive/Intro'
import NpmResolution from './pages/npm-deep-dive/Resolution'
import NpmNodeModules from './pages/npm-deep-dive/NodeModules'
import NpmLockfile from './pages/npm-deep-dive/Lockfile'
import NpmScripts from './pages/npm-deep-dive/Scripts'
import NpmSecurity from './pages/npm-deep-dive/Security'

// Building npm Packages
import NpkgAnatomy from './pages/npm-packages/Anatomy'
import NpkgPackageJson from './pages/npm-packages/PackageJson'
import NpkgModules from './pages/npm-packages/Modules'
import NpkgPublishing from './pages/npm-packages/Publishing'
import NpkgAdvanced from './pages/npm-packages/Advanced'

// Webpack
import WpIntro from './pages/webpack/Intro'
import WpCore from './pages/webpack/Core'
import WpLoaders from './pages/webpack/Loaders'
import WpPlugins from './pages/webpack/Plugins'
import WpDevserver from './pages/webpack/Devserver'
import WpAdvanced from './pages/webpack/Advanced'

function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>404 — Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" style={{
        color: '#5b9cf6',
        padding: '0.6rem 1.5rem',
        border: '1px solid #5b9cf6',
        borderRadius: '8px',
        textDecoration: 'none',
        fontSize: '0.9rem',
      }}>
        ← Back to Home
      </Link>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={null} />
        {/* Java */}
        <Route path="java/intro" element={<JavaIntro />} />
        <Route path="java/syntax" element={<JavaSyntax />} />
        <Route path="java/oop" element={<JavaOop />} />
        <Route path="java/collections" element={<JavaCollections />} />
        <Route path="java/generics" element={<JavaGenerics />} />
        <Route path="java/exceptions" element={<JavaExceptions />} />
        <Route path="java/streams" element={<JavaStreams />} />
        <Route path="java/concurrency" element={<JavaConcurrency />} />
        <Route path="java/io" element={<JavaIo />} />
        <Route path="java/advanced" element={<JavaAdvanced />} />
        {/* Spring Boot */}
        <Route path="springboot/intro" element={<SpringIntro />} />
        <Route path="springboot/setup" element={<SpringSetup />} />
        <Route path="springboot/di" element={<SpringDi />} />
        <Route path="springboot/rest" element={<SpringRest />} />
        <Route path="springboot/data" element={<SpringData />} />
        <Route path="springboot/security" element={<SpringSecurity />} />
        <Route path="springboot/testing" element={<SpringTesting />} />
        <Route path="springboot/config" element={<SpringConfig />} />
        <Route path="springboot/error" element={<SpringError />} />
        <Route path="springboot/advanced" element={<SpringAdvanced />} />
        {/* React 19 */}
        <Route path="react19/lifecycle" element={<ReactLifecycle />} />
        <Route path="react19/lifecycle-sim" element={<ReactLifecycleSim />} />
        <Route path="react19/hooks" element={<ReactHooks />} />
        <Route path="react19/state" element={<ReactState />} />
        <Route path="react19/effects" element={<ReactEffects />} />
        <Route path="react19/context" element={<ReactContext />} />
        <Route path="react19/performance" element={<ReactPerformance />} />
        <Route path="react19/react19" element={<ReactNew />} />
        <Route path="react19/server" element={<ReactServer />} />
        <Route path="react19/patterns" element={<ReactPatterns />} />
        <Route path="react19/typescript" element={<ReactTypescript />} />
        <Route path="react19/build-toolchain" element={<ReactBuildToolchain />} />
        <Route path="react19/cheat-sheet" element={<ReactCheatSheet />} />
        {/* SQL */}
        <Route path="sql/quickstart" element={<SqlQuickstart />} />
        <Route path="sql/joins" element={<SqlJoins />} />
        <Route path="sql/window" element={<SqlWindow />} />
        <Route path="sql/indexing" element={<SqlIndexing />} />
        <Route path="sql/design" element={<SqlDesign />} />
        <Route path="sql/transactions" element={<SqlTransactions />} />
        <Route path="sql/cte" element={<SqlCte />} />
        <Route path="sql/advanced" element={<SqlAdvanced />} />
        {/* SOLID */}
        <Route path="solid/intro" element={<SolidIntro />} />
        <Route path="solid/srp" element={<SolidSrp />} />
        <Route path="solid/ocp" element={<SolidOcp />} />
        <Route path="solid/lsp" element={<SolidLsp />} />
        <Route path="solid/isp" element={<SolidIsp />} />
        <Route path="solid/dip" element={<SolidDip />} />
        {/* Design Patterns */}
        <Route path="patterns/intro" element={<PatternsIntro />} />
        <Route path="patterns/singleton" element={<PatternsSingleton />} />
        <Route path="patterns/strategy" element={<PatternsStrategy />} />
        <Route path="patterns/decorator" element={<PatternsDecorator />} />
        <Route path="patterns/builder" element={<PatternsBuilder />} />
        <Route path="patterns/composite" element={<PatternsComposite />} />
        <Route path="patterns/proxy" element={<PatternsProxy />} />
        <Route path="patterns/realworld" element={<PatternsRealworld />} />
        {/* React Anti-Patterns */}
        <Route path="react-antipatterns/intro" element={<AntiIntro />} />
        <Route path="react-antipatterns/state" element={<AntiState />} />
        <Route path="react-antipatterns/effects" element={<AntiEffects />} />
        <Route path="react-antipatterns/performance" element={<AntiPerformance />} />
        <Route path="react-antipatterns/components" element={<AntiComponents />} />
        <Route path="react-antipatterns/bestpractices" element={<AntiBestPractices />} />
        {/* Microservices */}
        <Route path="microservices/intro" element={<MicroIntro />} />
        <Route path="microservices/patterns" element={<MicroPatterns />} />
        <Route path="microservices/communication" element={<MicroCommunication />} />
        <Route path="microservices/data" element={<MicroData />} />
        <Route path="microservices/scaling" element={<MicroScaling />} />
        <Route path="microservices/events" element={<MicroEvents />} />
        <Route path="microservices/containers" element={<MicroContainers />} />
        <Route path="microservices/migration" element={<MicroMigration />} />
        {/* API Design */}
        <Route path="apidesign/intro" element={<ApiIntro />} />
        <Route path="apidesign/methods" element={<ApiMethods />} />
        <Route path="apidesign/resources" element={<ApiResources />} />
        <Route path="apidesign/errors" element={<ApiErrors />} />
        <Route path="apidesign/versioning" element={<ApiVersioning />} />
        <Route path="apidesign/advanced" element={<ApiAdvanced />} />
        {/* Auth & Security */}
        <Route path="auth/encryption" element={<AuthEncryption />} />
        <Route path="auth/tls" element={<AuthTls />} />
        <Route path="auth/cookies" element={<AuthCookies />} />
        <Route path="auth/jwt" element={<AuthJwt />} />
        <Route path="auth/oauth" element={<AuthOauth />} />
        <Route path="auth/authz" element={<AuthAuthz />} />
        <Route path="auth/security" element={<AuthSecurity />} />
        {/* Java Cheat Sheet */}
        <Route path="java-cheatsheet/syntax" element={<JCSyntax />} />
        <Route path="java-cheatsheet/collections" element={<JCCollections />} />
        <Route path="java-cheatsheet/streams" element={<JCStreams />} />
        <Route path="java-cheatsheet/concurrency" element={<JCConcurrency />} />
        <Route path="java-cheatsheet/annotations" element={<JCAnnotations />} />
        {/* React Cheat Sheet */}
        <Route path="react-cheatsheet/hooks" element={<RCHooks />} />
        <Route path="react-cheatsheet/patterns" element={<RCPatterns />} />
        <Route path="react-cheatsheet/state" element={<RCState />} />
        <Route path="react-cheatsheet/styling" element={<RCStyling />} />
        <Route path="react-cheatsheet/recipes" element={<RCRecipes />} />
        {/* Testing Strategies */}
        <Route path="testing/intro" element={<TestIntro />} />
        <Route path="testing/unit" element={<TestUnit />} />
        <Route path="testing/mocking" element={<TestMocking />} />
        <Route path="testing/integration" element={<TestIntegration />} />
        <Route path="testing/e2e" element={<TestE2e />} />
        <Route path="testing/bestpractices" element={<TestBestPractices />} />
        {/* Git & DevOps */}
        <Route path="devops/git" element={<DevGit />} />
        <Route path="devops/branching" element={<DevBranching />} />
        <Route path="devops/cicd" element={<DevCicd />} />
        <Route path="devops/docker" element={<DevDocker />} />
        <Route path="devops/cloud" element={<DevCloud />} />
        <Route path="devops/monitoring" element={<DevMonitoring />} />
        {/* System Design */}
        <Route path="systemdesign/intro" element={<SysIntro />} />
        <Route path="systemdesign/scaling" element={<SysScaling />} />
        <Route path="systemdesign/caching" element={<SysCaching />} />
        <Route path="systemdesign/databases" element={<SysDatabases />} />
        <Route path="systemdesign/distributed" element={<SysDistributed />} />
        <Route path="systemdesign/messaging" element={<SysMessaging />} />
        <Route path="systemdesign/interview" element={<SysInterview />} />
        {/* TypeScript */}
        <Route path="typescript/intro" element={<TsIntro />} />
        <Route path="typescript/types" element={<TsTypes />} />
        <Route path="typescript/interfaces" element={<TsInterfaces />} />
        <Route path="typescript/generics" element={<TsGenerics />} />
        <Route path="typescript/advanced" element={<TsAdvanced />} />
        <Route path="typescript/react" element={<TsReact />} />
        <Route path="typescript/migration" element={<TsMigration />} />
        <Route path="typescript/bestpractices" element={<TsBestPractices />} />
        <Route path="typescript/newproject" element={<TsNewProject />} />
        <Route path="typescript/tsconfig" element={<TsTsconfig />} />
        <Route path="typescript/interactive" element={<TsInteractive />} />
        {/* React Router v7 */}
        <Route path="react-router/intro" element={<RRIntro />} />
        <Route path="react-router/nested" element={<RRNested />} />
        <Route path="react-router/data" element={<RRData />} />
        <Route path="react-router/guards" element={<RRGuards />} />
        <Route path="react-router/advanced" element={<RRAdvanced />} />
        <Route path="react-router/testing" element={<RRTesting />} />
        <Route path="react-router/fullapp" element={<RRFullapp />} />
        <Route path="react-router/migration" element={<RRMigration />} />
        {/* State Management */}
        <Route path="state-mgmt/intro" element={<SMIntro />} />
        <Route path="state-mgmt/redux" element={<SMRedux />} />
        <Route path="state-mgmt/zustand" element={<SMZustand />} />
        <Route path="state-mgmt/comparison" element={<SMComparison />} />
        <Route path="state-mgmt/patterns" element={<SMPatterns />} />
        <Route path="state-mgmt/react-query" element={<SMReactQuery />} />
        {/* Accessibility */}
        <Route path="accessibility/intro" element={<A11yIntro />} />
        <Route path="accessibility/semantic" element={<A11ySemantic />} />
        <Route path="accessibility/aria" element={<A11yAria />} />
        <Route path="accessibility/keyboard" element={<A11yKeyboard />} />
        <Route path="accessibility/testing" element={<A11yTesting />} />
        {/* CSS Mastery */}
        <Route path="css-mastery/flexbox" element={<CSSFlexbox />} />
        <Route path="css-mastery/grid" element={<CSSGrid />} />
        <Route path="css-mastery/responsive" element={<CSSResponsive />} />
        <Route path="css-mastery/animations" element={<CSSAnimations />} />
        <Route path="css-mastery/variables" element={<CSSVariables />} />
        <Route path="css-mastery/patterns" element={<CSSPatterns />} />
        {/* React Testing */}
        <Route path="react-testing/intro" element={<RTIntro />} />
        <Route path="react-testing/components" element={<RTComponents />} />
        <Route path="react-testing/hooks" element={<RTHooks />} />
        <Route path="react-testing/async" element={<RTAsync />} />
        <Route path="react-testing/forms" element={<RTForms />} />
        <Route path="react-testing/patterns" element={<RTPatterns />} />
        {/* Frontend Tooling */}
        <Route path="frontend-tooling/vite" element={<FTVite />} />
        <Route path="frontend-tooling/linting" element={<FTLinting />} />
        <Route path="frontend-tooling/packages" element={<FTPackages />} />
        <Route path="frontend-tooling/monorepos" element={<FTMonorepos />} />
        <Route path="frontend-tooling/performance" element={<FTPerformance />} />

        {/* npm Deep Dive */}
        <Route path="npm-deep-dive/intro" element={<NpmIntro />} />
        <Route path="npm-deep-dive/resolution" element={<NpmResolution />} />
        <Route path="npm-deep-dive/node-modules" element={<NpmNodeModules />} />
        <Route path="npm-deep-dive/lockfile" element={<NpmLockfile />} />
        <Route path="npm-deep-dive/scripts" element={<NpmScripts />} />
        <Route path="npm-deep-dive/security" element={<NpmSecurity />} />
        {/* Building npm Packages */}
        <Route path="npm-packages/anatomy" element={<NpkgAnatomy />} />
        <Route path="npm-packages/package-json" element={<NpkgPackageJson />} />
        <Route path="npm-packages/modules" element={<NpkgModules />} />
        <Route path="npm-packages/publishing" element={<NpkgPublishing />} />
        <Route path="npm-packages/advanced" element={<NpkgAdvanced />} />
        {/* Webpack */}
        <Route path="webpack/intro" element={<WpIntro />} />
        <Route path="webpack/core" element={<WpCore />} />
        <Route path="webpack/loaders" element={<WpLoaders />} />
        <Route path="webpack/plugins" element={<WpPlugins />} />
        <Route path="webpack/devserver" element={<WpDevserver />} />
        <Route path="webpack/advanced" element={<WpAdvanced />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
