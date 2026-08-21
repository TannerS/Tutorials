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
import JavaOptional from './pages/java/Optional'
import JavaJvmInternals from './pages/java/JvmInternals'
import JavaReflection from './pages/java/Reflection'
import JavaBuildTools from './pages/java/BuildTools'
import JavaCheatsheet from './pages/java/Cheatsheet'

// Spring Boot
import SpringIntro from './pages/springboot/Intro'
import SpringSetup from './pages/springboot/Setup'
import SpringDi from './pages/springboot/Di'
import SpringRest from './pages/springboot/Rest'
import SpringData from './pages/springboot/Data'
import SpringSecurity from './pages/springboot/Security'
import SpringSecurityMigration from './pages/springboot/SecurityMigration'
import SpringTesting from './pages/springboot/Testing'
import SpringConfig from './pages/springboot/Config'
import SpringError from './pages/springboot/Error'
import SpringAdvanced from './pages/springboot/Advanced'
import SpringTransactions from './pages/springboot/Transactions'
import SpringKafka from './pages/springboot/Kafka'
import SpringAop from './pages/springboot/Aop'
import SpringBoot4 from './pages/springboot/Boot4'
import SpringObservability from './pages/springboot/Observability'
import SpringWebflux from './pages/springboot/Webflux'
import SpringResilience from './pages/springboot/Resilience'
import SpringCheatsheet from './pages/springboot/Cheatsheet'

// React 19
import ReactLifecycle from './pages/react19/Lifecycle'
import ReactLifecycleSim from './pages/react19/LifecycleSim'
import ReactHooks from './pages/react19/Hooks'
import ReactState from './pages/react19/State'
import ReactEffects from './pages/react19/Effects'
import ReactContext from './pages/react19/Context'
import ReactPerformance from './pages/react19/Performance'
import ReactProfiling from './pages/react19/Profiling'
import ReactNew from './pages/react19/React19'
import ReactServer from './pages/react19/Server'
import ReactSsrHydration from './pages/react19/SsrHydration'
import ReactPatterns from './pages/react19/Patterns'
import ReactTypescript from './pages/react19/Typescript'
import ReactBuildToolchain from './pages/react19/BuildToolchain'
import ReactCheatSheet from './pages/react19/CheatSheet'
import ReactAdapters from './pages/react19/Adapters'
import ReactImperativeBridge from './pages/react19/ImperativeBridge'
import ReactModuleFederation from './pages/react19/ModuleFederation'
import ReactFeatureFolder from './pages/react19/FeatureFolder'
import ReactErrorBoundaries from './pages/react19/ErrorBoundaries'
import ReactAnimations from './pages/react19/Animations'
import ReactPortals from './pages/react19/Portals'

// SQL Fundamentals
import SqlQuickstart from './pages/sql-fundamentals/Quickstart'
import SqlJoins from './pages/sql-fundamentals/Joins'
import SqlAggregation from './pages/sql-fundamentals/Aggregation'

// SQL Design Patterns
import SqlDesign from './pages/sql-design-patterns/Design'
import SqlIndexing from './pages/sql-design-patterns/Indexing'
import SqlSchemaPatterns from './pages/sql-design-patterns/SchemaPatterns'
import SqlMultiTenancy from './pages/sql-design-patterns/MultiTenancy'

// SQL Advanced
import SqlTransactions from './pages/sql-advanced/Transactions'
import SqlCte from './pages/sql-advanced/Cte'
import SqlStoredProcedures from './pages/sql-advanced/StoredProcedures'
import SqlAdvanced from './pages/sql-advanced/Advanced'

// SQL Field Guide
import SFGBasicQueries from './pages/sql-field-guide/BasicQueries'
import SFGAdvancedQueries from './pages/sql-field-guide/AdvancedQueries'
import SFGSchemaDesign from './pages/sql-field-guide/SchemaDesign'
import SFGPostgresGotchas from './pages/sql-field-guide/PostgresGotchas'
import SFGQuickReference from './pages/sql-field-guide/QuickReference'

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
import PatternsAbstractFactory from './pages/patterns/AbstractFactory'
import PatternsStrategy from './pages/patterns/Strategy'
import PatternsDecorator from './pages/patterns/Decorator'
import PatternsBuilder from './pages/patterns/Builder'
import PatternsComposite from './pages/patterns/Composite'
import PatternsProxy from './pages/patterns/Proxy'
import PatternsCommand from './pages/patterns/Command'
import PatternsState from './pages/patterns/State'
import PatternsBridge from './pages/patterns/Bridge'
import PatternsMemento from './pages/patterns/Memento'
import PatternsFlyweight from './pages/patterns/Flyweight'
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
import MicroOpenshift from './pages/microservices/Openshift'
import MicroMigration from './pages/microservices/Migration'

// Domain-Driven Design
import DddIntro from './pages/ddd/Intro'
import DddStrategic from './pages/ddd/Strategic'
import DddTactical from './pages/ddd/Tactical'
import DddDomainEvents from './pages/ddd/DomainEvents'
import DddEventStorming from './pages/ddd/EventStorming'
import DddSpringBoot from './pages/ddd/SpringBoot'
import DddCheatsheet from './pages/ddd/Cheatsheet'

// Communicating Architecture
import ArchDocsAdrs from './pages/architecture-docs/Adrs'
import ArchDocsC4Model from './pages/architecture-docs/C4Model'
import ArchDocsNfrs from './pages/architecture-docs/Nfrs'
import ArchDocsQualityAttributes from './pages/architecture-docs/QualityAttributes'
import ArchDocsStakeholders from './pages/architecture-docs/Stakeholders'
import ArchDocsCheatsheet from './pages/architecture-docs/Cheatsheet'

// Cloud & Infrastructure
import CloudWellArchitected from './pages/cloud-architecture/WellArchitected'
import CloudIac from './pages/cloud-architecture/Iac'
import CloudMultiRegion from './pages/cloud-architecture/MultiRegion'
import CloudCapacityPlanning from './pages/cloud-architecture/CapacityPlanning'
import CloudCicd from './pages/cloud-architecture/Cicd'
import CloudCheatsheet from './pages/cloud-architecture/Cheatsheet'

// Observability & SRE
import ObsThreePillars from './pages/observability/ThreePillars'
import ObsSlos from './pages/observability/Slos'
import ObsTracing from './pages/observability/Tracing'
import ObsIncidents from './pages/observability/Incidents'
import ObsCheatsheet from './pages/observability/Cheatsheet'

// Data Structures & Algorithms
import DsaComplexity from './pages/dsa/Complexity'
import DsaArraysSorting from './pages/dsa/ArraysSorting'
import DsaLinkedLists from './pages/dsa/LinkedLists'
import DsaStacksQueues from './pages/dsa/StacksQueues'
import DsaRecursion from './pages/dsa/Recursion'
import DsaTrees from './pages/dsa/Trees'
import DsaHeaps from './pages/dsa/Heaps'
import DsaTries from './pages/dsa/Tries'
import DsaGraphs from './pages/dsa/Graphs'
import DsaUnionFind from './pages/dsa/UnionFind'
import DsaHashing from './pages/dsa/Hashing'
import DsaDynamicProgramming from './pages/dsa/DynamicProgramming'
import DsaPatterns from './pages/dsa/Patterns'
import DsaCheatsheet from './pages/dsa/Cheatsheet'

// Git & Version Control
import VcInternals from './pages/version-control/Internals'
import VcBranching from './pages/version-control/Branching'
import VcCollaboration from './pages/version-control/Collaboration'
import VcCheatsheet from './pages/version-control/Cheatsheet'

// API Design
import ApiIntro from './pages/apidesign/Intro'
import ApiMethods from './pages/apidesign/Methods'
import ApiResources from './pages/apidesign/Resources'
import ApiErrors from './pages/apidesign/Errors'
import ApiVersioning from './pages/apidesign/Versioning'
import ApiAdvanced from './pages/apidesign/Advanced'
import ApiGraphql from './pages/apidesign/Graphql'
import ApiWebsockets from './pages/apidesign/Websockets'

// Auth & Security
import CryptoEncodingVsEncryption from './pages/cryptography/EncodingVsEncryption'
import CryptoEncryption from './pages/cryptography/Encryption'
import CryptoHashing from './pages/cryptography/Hashing'
import CryptoAead from './pages/cryptography/Aead'
import CryptoSignatures from './pages/cryptography/Signatures'
import CryptoSigningFiles from './pages/cryptography/SigningFiles'
import CryptoCertificateIssuance from './pages/cryptography/CertificateIssuance'
import CryptoTls from './pages/cryptography/Tls'
import CryptoTrustStores from './pages/cryptography/TrustStores'
import CryptoKeyWrapping from './pages/cryptography/KeyWrapping'
import CryptoSecureRandom from './pages/cryptography/SecureRandom'
import CryptoSecureLoginFlow from './pages/cryptography/SecureLoginFlow'
import CryptoAppliedJava from './pages/cryptography/AppliedJava'
import CryptoAppliedNode from './pages/cryptography/AppliedNode'
import CryptoMistakes from './pages/cryptography/Mistakes'
import CryptoCheatsheet from './pages/cryptography/Cheatsheet'
import AuthCookies from './pages/auth/Cookies'
import AuthJwt from './pages/auth/Jwt'
import AuthOauth from './pages/auth/Oauth'
import AuthAuthz from './pages/auth/Authz'
import AuthGateway from './pages/auth/Gateway'
import AuthSecurity from './pages/auth/Security'
import AuthSso from './pages/auth/Sso'

// Java Cheat Sheet

// React Cheat Sheet

// Testing Strategies
import TestIntro from './pages/testing/Intro'
import TestWhatToTest from './pages/testing/WhatToTest'
import TestPerformance from './pages/testing/Performance'
import TestUnit from './pages/testing/Unit'
import TestMocking from './pages/testing/Mocking'
import TestIntegration from './pages/testing/Integration'
import TestTestcontainers from './pages/testing/Testcontainers'
import TestContract from './pages/testing/Contract'
import TestE2e from './pages/testing/E2e'
import TestBestPractices from './pages/testing/BestPractices'

// API Testing
import ApiTestIntro from './pages/api-testing/Intro'
import ApiTestControllers from './pages/api-testing/Controllers'
import ApiTestValidation from './pages/api-testing/Validation'
import ApiTestSecurity from './pages/api-testing/Security'
import ApiTestPatterns from './pages/api-testing/Patterns'

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
import TsInteractive from './pages/typescript/Playground'
import TsEnterprise from './pages/typescript/EnterprisePatterns'
import TsCheatsheet from './pages/typescript/Cheatsheet'
import TsNativeCompiler from './pages/typescript/NativeCompiler'
import TsRuntimeValidation from './pages/typescript/RuntimeValidation'
import TsNodeTypescript from './pages/typescript/NodeTypescript'

// JavaScript
import JsFundamentals from './pages/javascript/Fundamentals'
import JsFunctionsClosures from './pages/javascript/FunctionsClosures'
import JsObjectsPrototypes from './pages/javascript/ObjectsPrototypes'
import JsArraysIterables from './pages/javascript/ArraysIterables'
import JsAsync from './pages/javascript/Async'
import JsModules from './pages/javascript/Modules'
import JsErrorHandling from './pages/javascript/ErrorHandling'
import JsModernTour from './pages/javascript/ModernTour'
import JsEs2017 from './pages/javascript/Es2017'
import JsCheatsheet from './pages/javascript/Cheatsheet'

// React Router v7
import RRIntro from './pages/react-router/Intro'
import RRNested from './pages/react-router/Nested'
import RRData from './pages/react-router/Data'
import RRGuards from './pages/react-router/Guards'
import RRAdvanced from './pages/react-router/Advanced'
import RRTesting from './pages/react-router/Testing'
import RRFullapp from './pages/react-router/Fullapp'
import RRMigration from './pages/react-router/Migration'
import RRCheatSheet from './pages/react-router/CheatSheet'

// React + TS Field Guide
import FGFundamentals from './pages/react-field-guide/Fundamentals'
import FGHooks from './pages/react-field-guide/Hooks'
import FGStability from './pages/react-field-guide/Stability'
import FGAdvancedRendering from './pages/react-field-guide/AdvancedRendering'
import FGServerComponents from './pages/react-field-guide/ServerComponents'
import FGComponentPatterns from './pages/react-field-guide/ComponentPatterns'
import FGStyling from './pages/react-field-guide/Styling'
import FGStateManagement from './pages/react-field-guide/StateManagement'
import FGRouter from './pages/react-field-guide/Router'
import FGRecipes from './pages/react-field-guide/Recipes'
import FGGotchas from './pages/react-field-guide/Gotchas'
import FGTesting from './pages/react-field-guide/Testing'

// TypeScript Field Guide
import TFGFundamentals from './pages/typescript-field-guide/Fundamentals'
import TFGTypescriptTypes from './pages/typescript-field-guide/TypescriptTypes'
import TFGTypingReact from './pages/typescript-field-guide/TypingReact'
import TFGProjectSetup from './pages/typescript-field-guide/ProjectSetup'
import TFGMigrationEnterprise from './pages/typescript-field-guide/MigrationEnterprise'
import TFGBestPracticesGotchas from './pages/typescript-field-guide/BestPracticesGotchas'

// Java + Spring Field Guide
import JFGSyntax from './pages/java-field-guide/Syntax'
import JFGOopGenerics from './pages/java-field-guide/OopGenerics'
import JFGCollectionsStreams from './pages/java-field-guide/CollectionsStreams'
import JFGExceptionsIo from './pages/java-field-guide/ExceptionsIo'
import JFGConcurrency from './pages/java-field-guide/Concurrency'
import JFGGotchas from './pages/java-field-guide/Gotchas'

// Spring Boot 4 Field Guide
import SFGSpringDi from './pages/spring-field-guide/SpringDi'
import SFGSpringRest from './pages/spring-field-guide/SpringRest'
import SFGErrorHandling from './pages/spring-field-guide/ErrorHandling'
import SFGSpringData from './pages/spring-field-guide/SpringData'
import SFGConfigTransactions from './pages/spring-field-guide/ConfigTransactions'
import SFGSpringSecurity from './pages/spring-field-guide/SpringSecurity'
import SFGAopEvents from './pages/spring-field-guide/AopEvents'
import SFGSpringTesting from './pages/spring-field-guide/SpringTesting'
import SFGKafkaObservability from './pages/spring-field-guide/KafkaObservability'
import SFGBoot4 from './pages/spring-field-guide/Boot4'
import SFGGotchas from './pages/spring-field-guide/Gotchas'

// State Management
import SMIntro from './pages/state-mgmt/Intro'
import SMComparison from './pages/state-mgmt/Comparison'
import SMZustandFundamentals from './pages/state-mgmt/ZustandFundamentals'
import SMZustandAdvanced from './pages/state-mgmt/ZustandAdvanced'
import SMZustandCheatsheet from './pages/state-mgmt/ZustandCheatsheet'
import SMPatterns from './pages/state-mgmt/Patterns'

// React Query
import RQFundamentals from './pages/react-query/Fundamentals'
import RQAdvanced from './pages/react-query/Advanced'
import RQCheatsheet from './pages/react-query/Cheatsheet'

// What's New in React 19
import WNFeatures from './pages/react19-whats-new/Features'
import WNMigration from './pages/react19-whats-new/Migration'
import WNCheatsheet from './pages/react19-whats-new/Cheatsheet'

// Accessibility
import A11yIntro from './pages/accessibility/Intro'
import A11ySemantic from './pages/accessibility/Semantic'
import A11yAria from './pages/accessibility/Aria'
import A11yKeyboard from './pages/accessibility/Keyboard'
import A11yTesting from './pages/accessibility/Testing'

// CSS Mastery
import CSSFundamentals from './pages/css-mastery/Fundamentals'
import CSSFlexbox from './pages/css-mastery/Flexbox'
import CSSGrid from './pages/css-mastery/Grid'
import CSSResponsive from './pages/css-mastery/Responsive'
import CSSAnimations from './pages/css-mastery/Animations'
import CSSVariables from './pages/css-mastery/Variables'
import CSSSass from './pages/css-mastery/Sass'
import CSSTokens from './pages/css-mastery/Tokens'
import CSSStyleInclusion from './pages/css-mastery/StyleInclusion'
import CSSPatterns from './pages/css-mastery/Patterns'

// Playground
import PlaygroundCompiler from './pages/playground/Compiler'
import PlaygroundTypeChecker from './pages/playground/TypeChecker'
import PlaygroundJsxCompiler from './pages/playground/JsxCompiler'
import PlaygroundCssPlayground from './pages/playground/CssPlayground'
import PlaygroundSassPlayground from './pages/playground/SassPlayground'
import PlaygroundSqlPlayground from './pages/playground/SqlPlayground'

// CSS Field Guide
import CFGBasics from './pages/css-field-guide/Basics'
import CFGAdvanced from './pages/css-field-guide/Advanced'
import CFGGotchas from './pages/css-field-guide/Gotchas'
import CFGPatterns from './pages/css-field-guide/Patterns'
import CFGSass from './pages/css-field-guide/Sass'
import CFGTokens from './pages/css-field-guide/Tokens'

// React Testing
import RTIntro from './pages/react-testing/Intro'
import RTComponents from './pages/react-testing/Components'
import RTHooks from './pages/react-testing/Hooks'
import RTAsync from './pages/react-testing/Async'
import RTForms from './pages/react-testing/Forms'
import RTPatterns from './pages/react-testing/Patterns'

// Frontend Tooling
import FTVite from './pages/frontend-tooling/Vite'
import FTWebpack from './pages/frontend-tooling/Webpack'
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
        <Route path="java/optional" element={<JavaOptional />} />
        <Route path="java/jvm-internals" element={<JavaJvmInternals />} />
        <Route path="java/reflection" element={<JavaReflection />} />
        <Route path="java/build-tools" element={<JavaBuildTools />} />
        <Route path="java/cheatsheet" element={<JavaCheatsheet />} />
        {/* Spring Boot */}
        <Route path="springboot/intro" element={<SpringIntro />} />
        <Route path="springboot/setup" element={<SpringSetup />} />
        <Route path="springboot/di" element={<SpringDi />} />
        <Route path="springboot/rest" element={<SpringRest />} />
        <Route path="springboot/data" element={<SpringData />} />
        <Route path="springboot/security" element={<SpringSecurity />} />
        <Route path="springboot/security-migration" element={<SpringSecurityMigration />} />
        <Route path="springboot/testing" element={<SpringTesting />} />
        <Route path="springboot/config" element={<SpringConfig />} />
        <Route path="springboot/error" element={<SpringError />} />
        <Route path="springboot/advanced" element={<SpringAdvanced />} />
        <Route path="springboot/transactions" element={<SpringTransactions />} />
        <Route path="springboot/kafka" element={<SpringKafka />} />
        <Route path="springboot/aop" element={<SpringAop />} />
        <Route path="springboot/boot4" element={<SpringBoot4 />} />
        <Route path="springboot/observability" element={<SpringObservability />} />
        <Route path="springboot/webflux" element={<SpringWebflux />} />
        <Route path="springboot/resilience" element={<SpringResilience />} />
        <Route path="springboot/cheatsheet" element={<SpringCheatsheet />} />
        {/* React 19 */}
        <Route path="react19/lifecycle" element={<ReactLifecycle />} />
        <Route path="react19/lifecycle-sim" element={<ReactLifecycleSim />} />
        <Route path="react19/hooks" element={<ReactHooks />} />
        <Route path="react19/state" element={<ReactState />} />
        <Route path="react19/effects" element={<ReactEffects />} />
        <Route path="react19/context" element={<ReactContext />} />
        <Route path="react19/performance" element={<ReactPerformance />} />
        <Route path="react19/profiling" element={<ReactProfiling />} />
        <Route path="react19/react19" element={<ReactNew />} />
        <Route path="react19/server" element={<ReactServer />} />
        <Route path="react19/ssr-hydration" element={<ReactSsrHydration />} />
        <Route path="react19/patterns" element={<ReactPatterns />} />
        <Route path="react19/typescript" element={<ReactTypescript />} />
        <Route path="react19/build-toolchain" element={<ReactBuildToolchain />} />
        <Route path="react19/cheat-sheet" element={<ReactCheatSheet />} />
        <Route path="react19/adapters" element={<ReactAdapters />} />
        <Route path="react19/imperative-bridge" element={<ReactImperativeBridge />} />
        <Route path="react19/module-federation" element={<ReactModuleFederation />} />
        <Route path="react19/feature-folder" element={<ReactFeatureFolder />} />
        <Route path="react19/error-boundaries" element={<ReactErrorBoundaries />} />
        <Route path="react19/animations" element={<ReactAnimations />} />
        <Route path="react19/portals" element={<ReactPortals />} />
        {/* SQL */}
        <Route path="sql-fundamentals/quickstart" element={<SqlQuickstart />} />
        <Route path="sql-fundamentals/joins" element={<SqlJoins />} />
        <Route path="sql-fundamentals/aggregation" element={<SqlAggregation />} />
        <Route path="sql-design-patterns/design" element={<SqlDesign />} />
        <Route path="sql-design-patterns/indexing" element={<SqlIndexing />} />
        <Route path="sql-design-patterns/schema-patterns" element={<SqlSchemaPatterns />} />
        <Route path="sql-design-patterns/multi-tenancy" element={<SqlMultiTenancy />} />
        <Route path="sql-advanced/transactions" element={<SqlTransactions />} />
        <Route path="sql-advanced/cte" element={<SqlCte />} />
        <Route path="sql-advanced/stored-procedures" element={<SqlStoredProcedures />} />
        <Route path="sql-advanced/advanced" element={<SqlAdvanced />} />
        <Route path="sql-field-guide/basic-queries" element={<SFGBasicQueries />} />
        <Route path="sql-field-guide/advanced-queries" element={<SFGAdvancedQueries />} />
        <Route path="sql-field-guide/schema-design" element={<SFGSchemaDesign />} />
        <Route path="sql-field-guide/postgres-gotchas" element={<SFGPostgresGotchas />} />
        <Route path="sql-field-guide/quick-reference" element={<SFGQuickReference />} />
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
        <Route path="patterns/abstract-factory" element={<PatternsAbstractFactory />} />
        <Route path="patterns/strategy" element={<PatternsStrategy />} />
        <Route path="patterns/decorator" element={<PatternsDecorator />} />
        <Route path="patterns/builder" element={<PatternsBuilder />} />
        <Route path="patterns/composite" element={<PatternsComposite />} />
        <Route path="patterns/proxy" element={<PatternsProxy />} />
        <Route path="patterns/command" element={<PatternsCommand />} />
        <Route path="patterns/state" element={<PatternsState />} />
        <Route path="patterns/bridge" element={<PatternsBridge />} />
        <Route path="patterns/memento" element={<PatternsMemento />} />
        <Route path="patterns/flyweight" element={<PatternsFlyweight />} />
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
        <Route path="microservices/openshift" element={<MicroOpenshift />} />
        <Route path="microservices/migration" element={<MicroMigration />} />
        <Route path="ddd/intro" element={<DddIntro />} />
        <Route path="ddd/strategic" element={<DddStrategic />} />
        <Route path="ddd/tactical" element={<DddTactical />} />
        <Route path="ddd/domain-events" element={<DddDomainEvents />} />
        <Route path="ddd/event-storming" element={<DddEventStorming />} />
        <Route path="ddd/spring-boot" element={<DddSpringBoot />} />
        <Route path="ddd/cheatsheet" element={<DddCheatsheet />} />
        <Route path="architecture-docs/adrs" element={<ArchDocsAdrs />} />
        <Route path="architecture-docs/c4-model" element={<ArchDocsC4Model />} />
        <Route path="architecture-docs/nfrs" element={<ArchDocsNfrs />} />
        <Route path="architecture-docs/quality-attributes" element={<ArchDocsQualityAttributes />} />
        <Route path="architecture-docs/stakeholders" element={<ArchDocsStakeholders />} />
        <Route path="architecture-docs/cheatsheet" element={<ArchDocsCheatsheet />} />
        <Route path="cloud-architecture/well-architected" element={<CloudWellArchitected />} />
        <Route path="cloud-architecture/iac" element={<CloudIac />} />
        <Route path="cloud-architecture/multi-region" element={<CloudMultiRegion />} />
        <Route path="cloud-architecture/capacity-planning" element={<CloudCapacityPlanning />} />
        <Route path="cloud-architecture/cicd" element={<CloudCicd />} />
        <Route path="cloud-architecture/cheatsheet" element={<CloudCheatsheet />} />
        <Route path="observability/three-pillars" element={<ObsThreePillars />} />
        <Route path="observability/slos" element={<ObsSlos />} />
        <Route path="observability/tracing" element={<ObsTracing />} />
        <Route path="observability/incidents" element={<ObsIncidents />} />
        <Route path="dsa/complexity" element={<DsaComplexity />} />
        <Route path="dsa/arrays-sorting" element={<DsaArraysSorting />} />
        <Route path="dsa/linked-lists" element={<DsaLinkedLists />} />
        <Route path="dsa/stacks-queues" element={<DsaStacksQueues />} />
        <Route path="dsa/recursion-backtracking" element={<DsaRecursion />} />
        <Route path="dsa/trees" element={<DsaTrees />} />
        <Route path="dsa/heaps" element={<DsaHeaps />} />
        <Route path="dsa/tries" element={<DsaTries />} />
        <Route path="dsa/graphs" element={<DsaGraphs />} />
        <Route path="dsa/union-find" element={<DsaUnionFind />} />
        <Route path="dsa/hashing" element={<DsaHashing />} />
        <Route path="dsa/dynamic-programming" element={<DsaDynamicProgramming />} />
        <Route path="dsa/patterns" element={<DsaPatterns />} />
        <Route path="dsa/cheatsheet" element={<DsaCheatsheet />} />
        <Route path="version-control/internals" element={<VcInternals />} />
        <Route path="version-control/branching" element={<VcBranching />} />
        <Route path="version-control/collaboration" element={<VcCollaboration />} />
        <Route path="version-control/cheatsheet" element={<VcCheatsheet />} />
        <Route path="observability/cheatsheet" element={<ObsCheatsheet />} />
        {/* API Design */}
        <Route path="apidesign/intro" element={<ApiIntro />} />
        <Route path="apidesign/methods" element={<ApiMethods />} />
        <Route path="apidesign/resources" element={<ApiResources />} />
        <Route path="apidesign/errors" element={<ApiErrors />} />
        <Route path="apidesign/versioning" element={<ApiVersioning />} />
        <Route path="apidesign/advanced" element={<ApiAdvanced />} />
        <Route path="apidesign/graphql" element={<ApiGraphql />} />
        <Route path="apidesign/websockets" element={<ApiWebsockets />} />
        {/* Auth & Security */}
        <Route path="auth/cookies" element={<AuthCookies />} />
        <Route path="auth/jwt" element={<AuthJwt />} />
        <Route path="auth/oauth" element={<AuthOauth />} />
        <Route path="auth/authz" element={<AuthAuthz />} />
        <Route path="auth/gateway" element={<AuthGateway />} />
        <Route path="auth/security" element={<AuthSecurity />} />
        <Route path="auth/sso" element={<AuthSso />} />
        <Route path="cryptography/encoding-vs-encryption" element={<CryptoEncodingVsEncryption />} />
        <Route path="cryptography/encryption" element={<CryptoEncryption />} />
        <Route path="cryptography/hashing" element={<CryptoHashing />} />
        <Route path="cryptography/aead" element={<CryptoAead />} />
        <Route path="cryptography/signatures" element={<CryptoSignatures />} />
        <Route path="cryptography/signing-files" element={<CryptoSigningFiles />} />
        <Route path="cryptography/certificate-issuance" element={<CryptoCertificateIssuance />} />
        <Route path="cryptography/tls" element={<CryptoTls />} />
        <Route path="cryptography/trust-stores" element={<CryptoTrustStores />} />
        <Route path="cryptography/key-wrapping" element={<CryptoKeyWrapping />} />
        <Route path="cryptography/secure-random" element={<CryptoSecureRandom />} />
        <Route path="cryptography/secure-login-flow" element={<CryptoSecureLoginFlow />} />
        <Route path="cryptography/applied-java" element={<CryptoAppliedJava />} />
        <Route path="cryptography/applied-node" element={<CryptoAppliedNode />} />
        <Route path="cryptography/mistakes" element={<CryptoMistakes />} />
        <Route path="cryptography/cheatsheet" element={<CryptoCheatsheet />} />
        {/* Testing Strategies */}
        <Route path="testing/intro" element={<TestIntro />} />
        <Route path="testing/what-to-test" element={<TestWhatToTest />} />
        <Route path="testing/performance" element={<TestPerformance />} />
        <Route path="testing/unit" element={<TestUnit />} />
        <Route path="testing/mocking" element={<TestMocking />} />
        <Route path="testing/integration" element={<TestIntegration />} />
        <Route path="testing/testcontainers" element={<TestTestcontainers />} />
        <Route path="testing/contract" element={<TestContract />} />
        <Route path="testing/e2e" element={<TestE2e />} />
        <Route path="testing/bestpractices" element={<TestBestPractices />} />
        <Route path="api-testing/intro" element={<ApiTestIntro />} />
        <Route path="api-testing/controllers" element={<ApiTestControllers />} />
        <Route path="api-testing/validation" element={<ApiTestValidation />} />
        <Route path="api-testing/security" element={<ApiTestSecurity />} />
        <Route path="api-testing/patterns" element={<ApiTestPatterns />} />
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
        <Route path="typescript/enterprise" element={<TsEnterprise />} />
        <Route path="typescript/cheatsheet" element={<TsCheatsheet />} />
        <Route path="typescript/native-compiler" element={<TsNativeCompiler />} />
        <Route path="typescript/runtime-validation" element={<TsRuntimeValidation />} />
        <Route path="typescript/node" element={<TsNodeTypescript />} />
        {/* JavaScript */}
        <Route path="javascript/fundamentals" element={<JsFundamentals />} />
        <Route path="javascript/functions-closures" element={<JsFunctionsClosures />} />
        <Route path="javascript/objects-prototypes" element={<JsObjectsPrototypes />} />
        <Route path="javascript/arrays-iterables" element={<JsArraysIterables />} />
        <Route path="javascript/async" element={<JsAsync />} />
        <Route path="javascript/modules" element={<JsModules />} />
        <Route path="javascript/error-handling" element={<JsErrorHandling />} />
        <Route path="javascript/modern-tour" element={<JsModernTour />} />
        <Route path="javascript/es2017" element={<JsEs2017 />} />
        <Route path="javascript/cheatsheet" element={<JsCheatsheet />} />
        {/* React Router v7 */}
        <Route path="react-router/intro" element={<RRIntro />} />
        <Route path="react-router/nested" element={<RRNested />} />
        <Route path="react-router/data" element={<RRData />} />
        <Route path="react-router/guards" element={<RRGuards />} />
        <Route path="react-router/advanced" element={<RRAdvanced />} />
        <Route path="react-router/testing" element={<RRTesting />} />
        <Route path="react-router/fullapp" element={<RRFullapp />} />
        <Route path="react-router/migration" element={<RRMigration />} />
        <Route path="react-router/cheatsheet" element={<RRCheatSheet />} />

        {/* React + TS Field Guide */}
        <Route path="react-field-guide/fundamentals" element={<FGFundamentals />} />
        <Route path="react-field-guide/hooks" element={<FGHooks />} />
        <Route path="react-field-guide/stability" element={<FGStability />} />
        <Route path="react-field-guide/advanced-rendering" element={<FGAdvancedRendering />} />
        <Route path="react-field-guide/server-components" element={<FGServerComponents />} />
        <Route path="react-field-guide/component-patterns" element={<FGComponentPatterns />} />
        <Route path="react-field-guide/styling" element={<FGStyling />} />
        <Route path="react-field-guide/state-management" element={<FGStateManagement />} />
        <Route path="react-field-guide/router" element={<FGRouter />} />
        <Route path="react-field-guide/recipes" element={<FGRecipes />} />
        <Route path="react-field-guide/gotchas" element={<FGGotchas />} />
        <Route path="react-field-guide/testing" element={<FGTesting />} />

        {/* TypeScript Field Guide */}
        <Route path="typescript-field-guide/fundamentals" element={<TFGFundamentals />} />
        <Route path="typescript-field-guide/typescript-types" element={<TFGTypescriptTypes />} />
        <Route path="typescript-field-guide/typing-react" element={<TFGTypingReact />} />
        <Route path="typescript-field-guide/project-setup" element={<TFGProjectSetup />} />
        <Route path="typescript-field-guide/migration-enterprise" element={<TFGMigrationEnterprise />} />
        <Route path="typescript-field-guide/best-practices-gotchas" element={<TFGBestPracticesGotchas />} />

        {/* Java + Spring Field Guide */}
        <Route path="java-field-guide/syntax" element={<JFGSyntax />} />
        <Route path="java-field-guide/oop-generics" element={<JFGOopGenerics />} />
        <Route path="java-field-guide/collections-streams" element={<JFGCollectionsStreams />} />
        <Route path="java-field-guide/exceptions-io" element={<JFGExceptionsIo />} />
        <Route path="java-field-guide/concurrency" element={<JFGConcurrency />} />
        <Route path="java-field-guide/gotchas" element={<JFGGotchas />} />

        {/* Spring Boot 4 Field Guide */}
        <Route path="spring-field-guide/spring-di" element={<SFGSpringDi />} />
        <Route path="spring-field-guide/spring-rest" element={<SFGSpringRest />} />
        <Route path="spring-field-guide/error-handling" element={<SFGErrorHandling />} />
        <Route path="spring-field-guide/spring-data" element={<SFGSpringData />} />
        <Route path="spring-field-guide/config-transactions" element={<SFGConfigTransactions />} />
        <Route path="spring-field-guide/spring-security" element={<SFGSpringSecurity />} />
        <Route path="spring-field-guide/aop-events" element={<SFGAopEvents />} />
        <Route path="spring-field-guide/spring-testing" element={<SFGSpringTesting />} />
        <Route path="spring-field-guide/kafka-observability" element={<SFGKafkaObservability />} />
        <Route path="spring-field-guide/boot4" element={<SFGBoot4 />} />
        <Route path="spring-field-guide/gotchas" element={<SFGGotchas />} />
        {/* State Management */}
        <Route path="state-mgmt/intro" element={<SMIntro />} />
        <Route path="state-mgmt/comparison" element={<SMComparison />} />
        <Route path="state-mgmt/zustand-fundamentals" element={<SMZustandFundamentals />} />
        <Route path="state-mgmt/zustand-advanced" element={<SMZustandAdvanced />} />
        <Route path="state-mgmt/zustand-cheatsheet" element={<SMZustandCheatsheet />} />
        <Route path="state-mgmt/patterns" element={<SMPatterns />} />
        {/* React Query */}
        <Route path="react-query/fundamentals" element={<RQFundamentals />} />
        <Route path="react-query/advanced" element={<RQAdvanced />} />
        <Route path="react-query/cheatsheet" element={<RQCheatsheet />} />
        {/* What's New in React 19 */}
        <Route path="react19-whats-new/features" element={<WNFeatures />} />
        <Route path="react19-whats-new/migration" element={<WNMigration />} />
        <Route path="react19-whats-new/cheatsheet" element={<WNCheatsheet />} />
        {/* Accessibility */}
        <Route path="accessibility/intro" element={<A11yIntro />} />
        <Route path="accessibility/semantic" element={<A11ySemantic />} />
        <Route path="accessibility/aria" element={<A11yAria />} />
        <Route path="accessibility/keyboard" element={<A11yKeyboard />} />
        <Route path="accessibility/testing" element={<A11yTesting />} />
        {/* CSS Mastery */}
        <Route path="css-mastery/fundamentals" element={<CSSFundamentals />} />
        <Route path="css-mastery/flexbox" element={<CSSFlexbox />} />
        <Route path="css-mastery/grid" element={<CSSGrid />} />
        <Route path="css-mastery/responsive" element={<CSSResponsive />} />
        <Route path="css-mastery/animations" element={<CSSAnimations />} />
        <Route path="css-mastery/variables" element={<CSSVariables />} />
        <Route path="css-mastery/sass" element={<CSSSass />} />
        <Route path="css-mastery/tokens" element={<CSSTokens />} />
        <Route path="css-mastery/style-inclusion" element={<CSSStyleInclusion />} />
        <Route path="css-mastery/patterns" element={<CSSPatterns />} />
        <Route path="playground/compiler" element={<PlaygroundCompiler />} />
        <Route path="playground/type-checker" element={<PlaygroundTypeChecker />} />
        <Route path="playground/jsx-compiler" element={<PlaygroundJsxCompiler />} />
        <Route path="playground/css-playground" element={<PlaygroundCssPlayground />} />
        <Route path="playground/sass-playground" element={<PlaygroundSassPlayground />} />
        <Route path="playground/sql-playground" element={<PlaygroundSqlPlayground />} />
        <Route path="css-field-guide/basics" element={<CFGBasics />} />
        <Route path="css-field-guide/advanced" element={<CFGAdvanced />} />
        <Route path="css-field-guide/gotchas" element={<CFGGotchas />} />
        <Route path="css-field-guide/patterns" element={<CFGPatterns />} />
        <Route path="css-field-guide/sass" element={<CFGSass />} />
        <Route path="css-field-guide/tokens" element={<CFGTokens />} />
        {/* React Testing */}
        <Route path="react-testing/intro" element={<RTIntro />} />
        <Route path="react-testing/components" element={<RTComponents />} />
        <Route path="react-testing/hooks" element={<RTHooks />} />
        <Route path="react-testing/async" element={<RTAsync />} />
        <Route path="react-testing/forms" element={<RTForms />} />
        <Route path="react-testing/patterns" element={<RTPatterns />} />
        {/* Frontend Tooling */}
        <Route path="frontend-tooling/vite" element={<FTVite />} />
        <Route path="frontend-tooling/webpack" element={<FTWebpack />} />
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
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
