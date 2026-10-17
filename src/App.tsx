import { Routes, Route, Link } from 'react-router'
import { lazy } from 'react'
import Layout from './components/Layout'

// Java
const JavaIntro = lazy(() => import('./pages/java/Intro'))
const JavaSyntax = lazy(() => import('./pages/java/Syntax'))
const JavaOop = lazy(() => import('./pages/java/Oop'))
const JavaCollections = lazy(() => import('./pages/java/Collections'))
const JavaGenerics = lazy(() => import('./pages/java/Generics'))
const JavaExceptions = lazy(() => import('./pages/java/Exceptions'))
const JavaStreams = lazy(() => import('./pages/java/Streams'))
const JavaConcurrency = lazy(() => import('./pages/java/Concurrency'))
const JavaIo = lazy(() => import('./pages/java/Io'))
const JavaAdvanced = lazy(() => import('./pages/java/Advanced'))
const JavaOptional = lazy(() => import('./pages/java/Optional'))
const JavaJvmInternals = lazy(() => import('./pages/java/JvmInternals'))
const JavaReflection = lazy(() => import('./pages/java/Reflection'))
const JavaBuildTools = lazy(() => import('./pages/java/BuildTools'))
const JavaTestingBasics = lazy(() => import('./pages/java/TestingBasics'))
const JavaMockito = lazy(() => import('./pages/java/Mockito'))
const JavaCheatsheet = lazy(() => import('./pages/java/Cheatsheet'))

// Spring Boot
const SpringIntro = lazy(() => import('./pages/springboot/Intro'))
const SpringSetup = lazy(() => import('./pages/springboot/Setup'))
const SpringDi = lazy(() => import('./pages/springboot/Di'))
const SpringRest = lazy(() => import('./pages/springboot/Rest'))
const SpringData = lazy(() => import('./pages/springboot/Data'))
const SpringSecurity = lazy(() => import('./pages/springboot/Security'))
const SpringSecurityMigration = lazy(() => import('./pages/springboot/SecurityMigration'))
const SpringTesting = lazy(() => import('./pages/springboot/Testing'))
const SpringConfig = lazy(() => import('./pages/springboot/Config'))
const SpringError = lazy(() => import('./pages/springboot/Error'))
const SpringAdvanced = lazy(() => import('./pages/springboot/Advanced'))
const SpringTransactions = lazy(() => import('./pages/springboot/Transactions'))
const SpringKafka = lazy(() => import('./pages/springboot/Kafka'))
const SpringAop = lazy(() => import('./pages/springboot/Aop'))
const SpringBoot4 = lazy(() => import('./pages/springboot/Boot4'))
const SpringObservability = lazy(() => import('./pages/springboot/Observability'))
const SpringWebflux = lazy(() => import('./pages/springboot/Webflux'))
const SpringResilience = lazy(() => import('./pages/springboot/Resilience'))
const SpringCheatsheet = lazy(() => import('./pages/springboot/Cheatsheet'))
const SB2Intro = lazy(() => import('./pages/springboot2/Intro'))
const SB2Javax = lazy(() => import('./pages/springboot2/Javax'))
const SB2Di = lazy(() => import('./pages/springboot2/Di'))
const SB2Rest = lazy(() => import('./pages/springboot2/Rest'))
const SB2Security = lazy(() => import('./pages/springboot2/Security'))
const SB2Data = lazy(() => import('./pages/springboot2/Data'))
const SB2Config = lazy(() => import('./pages/springboot2/Config'))
const SB2Error = lazy(() => import('./pages/springboot2/Error'))
const SB2Testing = lazy(() => import('./pages/springboot2/Testing'))
const SB2Transactions = lazy(() => import('./pages/springboot2/Transactions'))
const SB2Kafka = lazy(() => import('./pages/springboot2/Kafka'))
const SB2Aop = lazy(() => import('./pages/springboot2/Aop'))
const SB2Webflux = lazy(() => import('./pages/springboot2/Webflux'))
const SB2Resilience = lazy(() => import('./pages/springboot2/Resilience'))
const SB2Observability = lazy(() => import('./pages/springboot2/Observability'))
const SB2Actuator = lazy(() => import('./pages/springboot2/Actuator'))
const SB2Migration = lazy(() => import('./pages/springboot2/Migration'))
const SB2Cheatsheet = lazy(() => import('./pages/springboot2/Cheatsheet'))
// Go
const GoIntro = lazy(() => import('./pages/go/Intro'))
const GoSetup = lazy(() => import('./pages/go/Setup'))
const GoSyntax = lazy(() => import('./pages/go/Syntax'))
const GoStructs = lazy(() => import('./pages/go/Structs'))
const GoInterfaces = lazy(() => import('./pages/go/Interfaces'))
const GoErrors = lazy(() => import('./pages/go/Errors'))
const GoSlices = lazy(() => import('./pages/go/Slices'))
const GoPointers = lazy(() => import('./pages/go/Pointers'))
const GoGoroutines = lazy(() => import('./pages/go/Goroutines'))
const GoChannels = lazy(() => import('./pages/go/Channels'))
const GoSync = lazy(() => import('./pages/go/Sync'))
const GoContext = lazy(() => import('./pages/go/Context'))
const GoConcurrencyPatterns = lazy(() => import('./pages/go/ConcurrencyPatterns'))
const GoGenerics = lazy(() => import('./pages/go/Generics'))
const GoTesting = lazy(() => import('./pages/go/Testing'))
const GoHttp = lazy(() => import('./pages/go/Http'))
const GoDatabase = lazy(() => import('./pages/go/Database'))
const GoDeploy = lazy(() => import('./pages/go/Deploy'))
const GoCheatsheet = lazy(() => import('./pages/go/Cheatsheet'))

// C++
const CppIntro = lazy(() => import('./pages/cpp/Intro'))
const CppCompiling = lazy(() => import('./pages/cpp/Compiling'))
const CppTypes = lazy(() => import('./pages/cpp/Types'))
const CppFunctions = lazy(() => import('./pages/cpp/Functions'))
const CppReferences = lazy(() => import('./pages/cpp/References'))
const CppMemoryModel = lazy(() => import('./pages/cpp/MemoryModel'))
const CppRaii = lazy(() => import('./pages/cpp/Raii'))
const CppSmartPointers = lazy(() => import('./pages/cpp/SmartPointers'))
const CppMoveSemantics = lazy(() => import('./pages/cpp/MoveSemantics'))
const CppMemoryBugs = lazy(() => import('./pages/cpp/MemoryBugs'))
const CppClasses = lazy(() => import('./pages/cpp/Classes'))
const CppInheritance = lazy(() => import('./pages/cpp/Inheritance'))
const CppTemplates = lazy(() => import('./pages/cpp/Templates'))
const CppConcepts = lazy(() => import('./pages/cpp/Concepts'))
const CppContainers = lazy(() => import('./pages/cpp/Containers'))
const CppAlgorithms = lazy(() => import('./pages/cpp/Algorithms'))
const CppErrors = lazy(() => import('./pages/cpp/Errors'))
const CppConcurrency = lazy(() => import('./pages/cpp/Concurrency'))
const CppPerformance = lazy(() => import('./pages/cpp/Performance'))
const CppTooling = lazy(() => import('./pages/cpp/Tooling'))
const CppCheatsheet = lazy(() => import('./pages/cpp/Cheatsheet'))

const FSIntro = lazy(() => import('./pages/from-scratch/Intro'))
const FSScheduler = lazy(() => import('./pages/from-scratch/Scheduler'))
const FSStorage = lazy(() => import('./pages/from-scratch/Storage'))
const FSHttpServer = lazy(() => import('./pages/from-scratch/HttpServer'))
const FSConsensus = lazy(() => import('./pages/from-scratch/Consensus'))

// React 19
const ReactLifecycle = lazy(() => import('./pages/react18/Lifecycle'))
const ReactLifecycleSim = lazy(() => import('./pages/react18/LifecycleSim'))
const ReactHooks = lazy(() => import('./pages/react18/Hooks'))
const ReactRefs = lazy(() => import('./pages/react18/Refs'))
const ReactState = lazy(() => import('./pages/react18/State'))
const ReactEffects = lazy(() => import('./pages/react18/Effects'))
const ReactContext = lazy(() => import('./pages/react18/Context'))
const ReactPerformance = lazy(() => import('./pages/react18/Performance'))
const ReactProfiling = lazy(() => import('./pages/react18/Profiling'))
const ReactNew = lazy(() => import('./pages/react19-whats-new/React19'))
const ReactServer = lazy(() => import('./pages/react18/Server'))
const ReactSsrHydration = lazy(() => import('./pages/react18/SsrHydration'))
const ReactPatterns = lazy(() => import('./pages/react18/Patterns'))
const ReactTypescript = lazy(() => import('./pages/react18/Typescript'))
const ReactBuildToolchain = lazy(() => import('./pages/react18/BuildToolchain'))
const ReactCheatSheet = lazy(() => import('./pages/react18/CheatSheet'))
const ReactAdapters = lazy(() => import('./pages/react18/Adapters'))
const ReactImperativeBridge = lazy(() => import('./pages/react18/ImperativeBridge'))
const ReactModuleFederation = lazy(() => import('./pages/react18/ModuleFederation'))
const ReactFeatureFolder = lazy(() => import('./pages/react18/FeatureFolder'))
const ReactBulletproofReact = lazy(() => import('./pages/react18/BulletproofReact'))
const ReactErrorBoundaries = lazy(() => import('./pages/react18/ErrorBoundaries'))
const ReactAnimations = lazy(() => import('./pages/react18/Animations'))
const ReactPortals = lazy(() => import('./pages/react18/Portals'))

// AG Grid
const AgGrid = lazy(() => import('./pages/ag-grid/AgGrid'))

// SQL Fundamentals
const SqlQuickstart = lazy(() => import('./pages/sql-fundamentals/Quickstart'))
const SqlJoins = lazy(() => import('./pages/sql-fundamentals/Joins'))
const SqlAggregation = lazy(() => import('./pages/sql-fundamentals/Aggregation'))

// SQL Design Patterns
const SqlDesign = lazy(() => import('./pages/sql-design-patterns/Design'))
const SqlIndexing = lazy(() => import('./pages/sql-design-patterns/Indexing'))
const SqlSchemaPatterns = lazy(() => import('./pages/sql-design-patterns/SchemaPatterns'))
const SqlMultiTenancy = lazy(() => import('./pages/sql-design-patterns/MultiTenancy'))
const SqlJson = lazy(() => import('./pages/sql-design-patterns/Json'))
const SqlViews = lazy(() => import('./pages/sql-design-patterns/Views'))

// SQL Advanced
const SqlTransactions = lazy(() => import('./pages/sql-advanced/Transactions'))
const SqlCte = lazy(() => import('./pages/sql-advanced/Cte'))
const SqlStoredProcedures = lazy(() => import('./pages/sql-advanced/StoredProcedures'))
const SqlAdvanced = lazy(() => import('./pages/sql-advanced/Advanced'))
const SqlAdvancedFieldGuide = lazy(() => import('./pages/sql-advanced/FieldGuide'))

// SOLID
const SolidIntro = lazy(() => import('./pages/solid/Intro'))
const SolidSrp = lazy(() => import('./pages/solid/Srp'))
const SolidOcp = lazy(() => import('./pages/solid/Ocp'))
const SolidLsp = lazy(() => import('./pages/solid/Lsp'))
const SolidIsp = lazy(() => import('./pages/solid/Isp'))
const SolidDip = lazy(() => import('./pages/solid/Dip'))

// Design Patterns
const PatternsIntro = lazy(() => import('./pages/patterns/Intro'))
const PatternsSingleton = lazy(() => import('./pages/patterns/Singleton'))
const PatternsAbstractFactory = lazy(() => import('./pages/patterns/AbstractFactory'))
const PatternsStrategy = lazy(() => import('./pages/patterns/Strategy'))
const PatternsDecorator = lazy(() => import('./pages/patterns/Decorator'))
const PatternsBuilder = lazy(() => import('./pages/patterns/Builder'))
const PatternsComposite = lazy(() => import('./pages/patterns/Composite'))
const PatternsProxy = lazy(() => import('./pages/patterns/Proxy'))
const PatternsCommand = lazy(() => import('./pages/patterns/Command'))
const PatternsState = lazy(() => import('./pages/patterns/State'))
const PatternsBridge = lazy(() => import('./pages/patterns/Bridge'))
const PatternsMemento = lazy(() => import('./pages/patterns/Memento'))
const PatternsFlyweight = lazy(() => import('./pages/patterns/Flyweight'))
const PatternsRealworld = lazy(() => import('./pages/patterns/Realworld'))

// React Anti-Patterns
const AntiIntro = lazy(() => import('./pages/react-antipatterns/Intro'))
const AntiState = lazy(() => import('./pages/react-antipatterns/State'))
const AntiEffects = lazy(() => import('./pages/react-antipatterns/Effects'))
const AntiPerformance = lazy(() => import('./pages/react-antipatterns/Performance'))
const AntiComponents = lazy(() => import('./pages/react-antipatterns/Components'))
const AntiExtractComponents = lazy(() => import('./pages/react-antipatterns/ExtractComponents'))
const AntiBestPractices = lazy(() => import('./pages/react-antipatterns/BestPractices'))

// Microservices
const MicroIntro = lazy(() => import('./pages/microservices/Intro'))
const MicroPatterns = lazy(() => import('./pages/microservices/Patterns'))
const MicroCommunication = lazy(() => import('./pages/microservices/Communication'))
const MicroData = lazy(() => import('./pages/microservices/Data'))
const MicroScaling = lazy(() => import('./pages/microservices/Scaling'))
const MicroEvents = lazy(() => import('./pages/microservices/Events'))
const MicroContainers = lazy(() => import('./pages/microservices/Containers'))
const MicroOpenshift = lazy(() => import('./pages/microservices/Openshift'))
const MicroMigration = lazy(() => import('./pages/microservices/Migration'))

// Domain-Driven Design
const DddIntro = lazy(() => import('./pages/ddd/Intro'))
const DddStrategic = lazy(() => import('./pages/ddd/Strategic'))
const DddTactical = lazy(() => import('./pages/ddd/Tactical'))
const DddDomainEvents = lazy(() => import('./pages/ddd/DomainEvents'))
const DddEventStorming = lazy(() => import('./pages/ddd/EventStorming'))
const DddSpringBoot = lazy(() => import('./pages/ddd/SpringBoot'))
const DddCheatsheet = lazy(() => import('./pages/ddd/Cheatsheet'))

// Cloud & Infrastructure
const CloudWellArchitected = lazy(() => import('./pages/cloud-architecture/WellArchitected'))
const CloudIac = lazy(() => import('./pages/cloud-architecture/Iac'))
const CloudMultiRegion = lazy(() => import('./pages/cloud-architecture/MultiRegion'))
const CloudCapacityPlanning = lazy(() => import('./pages/cloud-architecture/CapacityPlanning'))
const CloudCicd = lazy(() => import('./pages/cloud-architecture/Cicd'))
const CloudCheatsheet = lazy(() => import('./pages/cloud-architecture/Cheatsheet'))

// Observability & SRE
const ObsThreePillars = lazy(() => import('./pages/observability/ThreePillars'))
const ObsSlos = lazy(() => import('./pages/observability/Slos'))
const ObsTracing = lazy(() => import('./pages/observability/Tracing'))
const ObsIncidents = lazy(() => import('./pages/observability/Incidents'))
const ObsCheatsheet = lazy(() => import('./pages/observability/Cheatsheet'))

// Data Structures & Algorithms
const DsaComplexity = lazy(() => import('./pages/dsa/Complexity'))
const DsaArraysSorting = lazy(() => import('./pages/dsa/ArraysSorting'))
const DsaLinkedLists = lazy(() => import('./pages/dsa/LinkedLists'))
const DsaStacksQueues = lazy(() => import('./pages/dsa/StacksQueues'))
const DsaRecursion = lazy(() => import('./pages/dsa/Recursion'))
const DsaTrees = lazy(() => import('./pages/dsa/Trees'))
const DsaHeaps = lazy(() => import('./pages/dsa/Heaps'))
const DsaTries = lazy(() => import('./pages/dsa/Tries'))
const DsaGraphs = lazy(() => import('./pages/dsa/Graphs'))
const DsaUnionFind = lazy(() => import('./pages/dsa/UnionFind'))
const DsaHashing = lazy(() => import('./pages/dsa/Hashing'))
const DsaDynamicProgramming = lazy(() => import('./pages/dsa/DynamicProgramming'))
const DsaPatterns = lazy(() => import('./pages/dsa/Patterns'))
const DsaCheatsheet = lazy(() => import('./pages/dsa/Cheatsheet'))

// Git & Version Control
const VcInternals = lazy(() => import('./pages/version-control/Internals'))
const VcBranching = lazy(() => import('./pages/version-control/Branching'))
const VcCollaboration = lazy(() => import('./pages/version-control/Collaboration'))
const VcCheatsheet = lazy(() => import('./pages/version-control/Cheatsheet'))

// API Design
const ApiIntro = lazy(() => import('./pages/apidesign/Intro'))
const ApiMethods = lazy(() => import('./pages/apidesign/Methods'))
const ApiResources = lazy(() => import('./pages/apidesign/Resources'))
const ApiErrors = lazy(() => import('./pages/apidesign/Errors'))
const ApiVersioning = lazy(() => import('./pages/apidesign/Versioning'))
const ApiAdvanced = lazy(() => import('./pages/apidesign/Advanced'))
const ApiGraphql = lazy(() => import('./pages/apidesign/Graphql'))
const ApiWebsockets = lazy(() => import('./pages/apidesign/Websockets'))

// Auth & Security
const CryptoEncodingVsEncryption = lazy(() => import('./pages/cryptography/EncodingVsEncryption'))
const CryptoEncryption = lazy(() => import('./pages/cryptography/Encryption'))
const CryptoHashing = lazy(() => import('./pages/cryptography/Hashing'))
const CryptoAead = lazy(() => import('./pages/cryptography/Aead'))
const CryptoSignatures = lazy(() => import('./pages/cryptography/Signatures'))
const CryptoSigningFiles = lazy(() => import('./pages/cryptography/SigningFiles'))
const CryptoCertificateIssuance = lazy(() => import('./pages/cryptography/CertificateIssuance'))
const CryptoTls = lazy(() => import('./pages/cryptography/Tls'))
const CryptoTrustStores = lazy(() => import('./pages/cryptography/TrustStores'))
const CryptoKeyWrapping = lazy(() => import('./pages/cryptography/KeyWrapping'))
const CryptoSecureRandom = lazy(() => import('./pages/cryptography/SecureRandom'))
const CryptoSecureLoginFlow = lazy(() => import('./pages/cryptography/SecureLoginFlow'))
const CryptoAppliedJava = lazy(() => import('./pages/cryptography/AppliedJava'))
const CryptoAppliedNode = lazy(() => import('./pages/cryptography/AppliedNode'))
const CryptoMistakes = lazy(() => import('./pages/cryptography/Mistakes'))
const CryptoCheatsheet = lazy(() => import('./pages/cryptography/Cheatsheet'))
const AuthCookies = lazy(() => import('./pages/auth/Cookies'))
const AuthJwt = lazy(() => import('./pages/auth/Jwt'))
const AuthOauth = lazy(() => import('./pages/auth/Oauth'))
const AuthAuthz = lazy(() => import('./pages/auth/Authz'))
const AuthGateway = lazy(() => import('./pages/auth/Gateway'))
const AuthSecurity = lazy(() => import('./pages/auth/Security'))
const AuthSso = lazy(() => import('./pages/auth/Sso'))

// Testing Strategies
const TestIntro = lazy(() => import('./pages/testing/Intro'))
const TestWhatToTest = lazy(() => import('./pages/testing/WhatToTest'))
const TestPerformance = lazy(() => import('./pages/testing/Performance'))
const TestUnit = lazy(() => import('./pages/testing/Unit'))
const TestMocking = lazy(() => import('./pages/testing/Mocking'))
const TestIntegration = lazy(() => import('./pages/testing/Integration'))
const TestTestcontainers = lazy(() => import('./pages/testing/Testcontainers'))
const TestContract = lazy(() => import('./pages/testing/Contract'))
const TestE2e = lazy(() => import('./pages/testing/E2e'))
const TestBestPractices = lazy(() => import('./pages/testing/BestPractices'))

// API Testing
const ApiTestIntro = lazy(() => import('./pages/api-testing/Intro'))
const ApiTestControllers = lazy(() => import('./pages/api-testing/Controllers'))
const ApiTestValidation = lazy(() => import('./pages/api-testing/Validation'))
const ApiTestSecurity = lazy(() => import('./pages/api-testing/Security'))
const ApiTestPatterns = lazy(() => import('./pages/api-testing/Patterns'))

// System Design
const SysIntro = lazy(() => import('./pages/systemdesign/Intro'))
const SysScaling = lazy(() => import('./pages/systemdesign/Scaling'))
const SysCaching = lazy(() => import('./pages/systemdesign/Caching'))
const SysDatabases = lazy(() => import('./pages/systemdesign/Databases'))
const SysDistributed = lazy(() => import('./pages/systemdesign/Distributed'))
const SysMessaging = lazy(() => import('./pages/systemdesign/Messaging'))
const SysInterview = lazy(() => import('./pages/systemdesign/Interview'))

// TypeScript
const TsIntro = lazy(() => import('./pages/typescript/Intro'))
const TsTypes = lazy(() => import('./pages/typescript/Types'))
const TsInterfaces = lazy(() => import('./pages/typescript/Interfaces'))
const TsGenerics = lazy(() => import('./pages/typescript/Generics'))
const TsAdvanced = lazy(() => import('./pages/typescript/Advanced'))
const TsReact = lazy(() => import('./pages/typescript/React'))
const TsMigration = lazy(() => import('./pages/typescript/Migration'))
const TsBestPractices = lazy(() => import('./pages/typescript/BestPractices'))
const TsNewProject = lazy(() => import('./pages/typescript/NewProject'))
const TsTsconfig = lazy(() => import('./pages/typescript/Tsconfig'))
const TsInteractive = lazy(() => import('./pages/typescript/Playground'))
const TsEnterprise = lazy(() => import('./pages/typescript/EnterprisePatterns'))
const TsCheatsheet = lazy(() => import('./pages/typescript/Cheatsheet'))
const TsNativeCompiler = lazy(() => import('./pages/typescript/NativeCompiler'))
const TsRuntimeValidation = lazy(() => import('./pages/typescript/RuntimeValidation'))
const TsNodeTypescript = lazy(() => import('./pages/typescript/NodeTypescript'))

// JavaScript
const JsFundamentals = lazy(() => import('./pages/javascript/Fundamentals'))
const JsFunctionsClosures = lazy(() => import('./pages/javascript/FunctionsClosures'))
const JsObjectsPrototypes = lazy(() => import('./pages/javascript/ObjectsPrototypes'))
const JsArraysIterables = lazy(() => import('./pages/javascript/ArraysIterables'))
const JsAsync = lazy(() => import('./pages/javascript/Async'))
const JsModules = lazy(() => import('./pages/javascript/Modules'))
const JsErrorHandling = lazy(() => import('./pages/javascript/ErrorHandling'))
const JsModernTour = lazy(() => import('./pages/javascript/ModernTour'))
const JsEs2017 = lazy(() => import('./pages/javascript/Es2017'))
const JsCheatsheet = lazy(() => import('./pages/javascript/Cheatsheet'))

// React Router v7
const RRv5Intro = lazy(() => import('./pages/react-router-v5/Intro'))
const RRv5Nested = lazy(() => import('./pages/react-router-v5/Nested'))
const RRv5Data = lazy(() => import('./pages/react-router-v5/Data'))
const RRv5Guards = lazy(() => import('./pages/react-router-v5/Guards'))
const RRv5Advanced = lazy(() => import('./pages/react-router-v5/Advanced'))
const RRv5Testing = lazy(() => import('./pages/react-router-v5/Testing'))
const RRv5Fullapp = lazy(() => import('./pages/react-router-v5/Fullapp'))
const RRv5Legacy = lazy(() => import('./pages/react-router-v5/Legacy'))
const RRv5Cheatsheet = lazy(() => import('./pages/react-router-v5/Cheatsheet'))
const RRIntro = lazy(() => import('./pages/react-router/Intro'))
const RRNested = lazy(() => import('./pages/react-router/Nested'))
const RRData = lazy(() => import('./pages/react-router/Data'))
const RRGuards = lazy(() => import('./pages/react-router/Guards'))
const RRAdvanced = lazy(() => import('./pages/react-router/Advanced'))
const RRTesting = lazy(() => import('./pages/react-router/Testing'))
const RRFullapp = lazy(() => import('./pages/react-router/Fullapp'))
const RRMigration = lazy(() => import('./pages/react-router/Migration'))
const RRCheatSheet = lazy(() => import('./pages/react-router/CheatSheet'))
const RRv8Intro = lazy(() => import('./pages/react-router-v8/Intro'))
const RRv8Nested = lazy(() => import('./pages/react-router-v8/Nested'))
const RRv8Data = lazy(() => import('./pages/react-router-v8/Data'))
const RRv8Guards = lazy(() => import('./pages/react-router-v8/Guards'))
const RRv8Advanced = lazy(() => import('./pages/react-router-v8/Advanced'))
const RRv8Testing = lazy(() => import('./pages/react-router-v8/Testing'))
const RRv8Fullapp = lazy(() => import('./pages/react-router-v8/Fullapp'))
const RRv8Migration = lazy(() => import('./pages/react-router-v8/Migration'))
const RRv8Cheatsheet = lazy(() => import('./pages/react-router-v8/Cheatsheet'))

// State Management
const SMIntro = lazy(() => import('./pages/state-mgmt/Intro'))
const SMComparison = lazy(() => import('./pages/state-mgmt/Comparison'))
const SMZustandFundamentals = lazy(() => import('./pages/state-mgmt/ZustandFundamentals'))
const SMZustandAdvanced = lazy(() => import('./pages/state-mgmt/ZustandAdvanced'))
const SMZustandCheatsheet = lazy(() => import('./pages/state-mgmt/ZustandCheatsheet'))
const SMPatterns = lazy(() => import('./pages/state-mgmt/Patterns'))

// React Query
const RQFundamentals = lazy(() => import('./pages/react-query/Fundamentals'))
const RQAdvanced = lazy(() => import('./pages/react-query/Advanced'))
const RQCheatsheet = lazy(() => import('./pages/react-query/Cheatsheet'))

// What's New in React 19
const WNFeatures = lazy(() => import('./pages/react19-whats-new/Features'))
const WNMigration = lazy(() => import('./pages/react19-whats-new/Migration'))
const WNCheatsheet = lazy(() => import('./pages/react19-whats-new/Cheatsheet'))

// Accessibility
const A11yIntro = lazy(() => import('./pages/accessibility/Intro'))
const A11ySemantic = lazy(() => import('./pages/accessibility/Semantic'))
const A11yAria = lazy(() => import('./pages/accessibility/Aria'))
const A11yKeyboard = lazy(() => import('./pages/accessibility/Keyboard'))
const A11yTesting = lazy(() => import('./pages/accessibility/Testing'))

const CSSSizing = lazy(() => import('./pages/css-mastery/Sizing'))
const CSSGotchas = lazy(() => import('./pages/css-mastery/Gotchas'))
const ReactJsx = lazy(() => import('./pages/react18/Jsx'))
const StateChoosing = lazy(() => import('./pages/state-mgmt/Choosing'))

// Browser DevTools
const DtElements = lazy(() => import('./pages/devtools/Elements'))
const DtCss = lazy(() => import('./pages/devtools/Css'))
const DtConsole = lazy(() => import('./pages/devtools/Console'))
const DtBreakpoints = lazy(() => import('./pages/devtools/Breakpoints'))
const DtNetwork = lazy(() => import('./pages/devtools/Network'))
const DtPerformance = lazy(() => import('./pages/devtools/Performance'))
const DtReact = lazy(() => import('./pages/devtools/React'))
const DtFieldGuide = lazy(() => import('./pages/devtools/FieldGuide'))

// Browser Runtime & the DOM
const BrDom = lazy(() => import('./pages/browser-runtime/Dom'))
const BrEvents = lazy(() => import('./pages/browser-runtime/Events'))
const BrEventLoop = lazy(() => import('./pages/browser-runtime/EventLoop'))
const BrObservers = lazy(() => import('./pages/browser-runtime/Observers'))
const BrStorage = lazy(() => import('./pages/browser-runtime/Storage'))
const BrFetch = lazy(() => import('./pages/browser-runtime/Fetch'))
const BrFieldGuide = lazy(() => import('./pages/browser-runtime/FieldGuide'))

// HTML
const HtmlDocument = lazy(() => import('./pages/html/Document'))
const HtmlSemantics = lazy(() => import('./pages/html/Semantics'))
const HtmlForms = lazy(() => import('./pages/html/Forms'))
const HtmlInteractive = lazy(() => import('./pages/html/Interactive'))
const HtmlMedia = lazy(() => import('./pages/html/Media'))
const HtmlParser = lazy(() => import('./pages/html/Parser'))
const HtmlFieldGuide = lazy(() => import('./pages/html/FieldGuide'))

// CSS Mastery
const CSSFundamentals = lazy(() => import('./pages/css-mastery/Fundamentals'))
const CSSFlexbox = lazy(() => import('./pages/css-mastery/Flexbox'))
const CSSGrid = lazy(() => import('./pages/css-mastery/Grid'))
const CSSResponsive = lazy(() => import('./pages/css-mastery/Responsive'))
const CSSAnimations = lazy(() => import('./pages/css-mastery/Animations'))
const CSSVariables = lazy(() => import('./pages/css-mastery/Variables'))
const CSSSass = lazy(() => import('./pages/css-mastery/Sass'))
const CSSTokens = lazy(() => import('./pages/css-mastery/Tokens'))
const CSSDesignSystemTokens = lazy(() => import('./pages/css-mastery/DesignSystemTokens'))
const CSSStyleInclusion = lazy(() => import('./pages/css-mastery/StyleInclusion'))
const CSSPatterns = lazy(() => import('./pages/css-mastery/Patterns'))

// Playground
const PlaygroundCompiler = lazy(() => import('./pages/playground/Compiler'))
const PlaygroundTypeChecker = lazy(() => import('./pages/playground/TypeChecker'))
const PlaygroundJsxCompiler = lazy(() => import('./pages/playground/JsxCompiler'))
const PlaygroundCssPlayground = lazy(() => import('./pages/playground/CssPlayground'))
const PlaygroundSassPlayground = lazy(() => import('./pages/playground/SassPlayground'))
const PlaygroundSqlPlayground = lazy(() => import('./pages/playground/SqlPlayground'))
const CssMasteryFieldGuide = lazy(() => import('./pages/css-mastery/FieldGuide'))
const MuiIntro = lazy(() => import('./pages/mui/Intro'))
const MuiStylingV4 = lazy(() => import('./pages/mui/StylingV4'))
const MuiTheming = lazy(() => import('./pages/mui/Theming'))
const MuiOverrides = lazy(() => import('./pages/mui/Overrides'))
const MuiStyledV5 = lazy(() => import('./pages/mui/StyledV5'))
const MuiCheatsheet = lazy(() => import('./pages/mui/Cheatsheet'))
const Mui9Intro = lazy(() => import('./pages/mui9/Intro'))
const Mui9SilentBreaks = lazy(() => import('./pages/mui9/SilentBreaks'))
const Mui9Styling = lazy(() => import('./pages/mui9/Styling'))
const Mui9Theming = lazy(() => import('./pages/mui9/Theming'))
const Mui9Cheatsheet = lazy(() => import('./pages/mui9/Cheatsheet'))
const TsqlIntro = lazy(() => import('./pages/tsql/Intro'))
const TsqlCoreQueries = lazy(() => import('./pages/tsql/CoreQueries'))
const TsqlJoins = lazy(() => import('./pages/tsql/Joins'))
const TsqlAggregation = lazy(() => import('./pages/tsql/Aggregation'))
const TsqlModifyingData = lazy(() => import('./pages/tsql/ModifyingData'))
const TsqlViews = lazy(() => import('./pages/tsql/Views'))
const TsqlProgrammability = lazy(() => import('./pages/tsql/Programmability'))
const TsqlTransactions = lazy(() => import('./pages/tsql/Transactions'))
const TsqlIndexing = lazy(() => import('./pages/tsql/Indexing'))
const TsqlCheatsheet = lazy(() => import('./pages/tsql/Cheatsheet'))

// React Testing
const RTIntro = lazy(() => import('./pages/react-testing/Intro'))
const RTComponents = lazy(() => import('./pages/react-testing/Components'))
const RTHooks = lazy(() => import('./pages/react-testing/Hooks'))
const RTAsync = lazy(() => import('./pages/react-testing/Async'))
const RTAsyncDeepDive = lazy(() => import('./pages/react-testing/AsyncDeepDive'))
const RTForms = lazy(() => import('./pages/react-testing/Forms'))
const RTThirdPartyLayered = lazy(() => import('./pages/react-testing/ThirdPartyLayered'))
const RTPatterns = lazy(() => import('./pages/react-testing/Patterns'))
const RTBestPractices = lazy(() => import('./pages/react-testing/BestPractices'))
const RTCheatsheet = lazy(() => import('./pages/react-testing/Cheatsheet'))

// Frontend Tooling
const FTVite = lazy(() => import('./pages/frontend-tooling/Vite'))
const FTWebpack = lazy(() => import('./pages/frontend-tooling/Webpack'))
const FTLinting = lazy(() => import('./pages/frontend-tooling/Linting'))
const FTPackages = lazy(() => import('./pages/frontend-tooling/Packages'))
const FTMonorepos = lazy(() => import('./pages/frontend-tooling/Monorepos'))
const FTPerformance = lazy(() => import('./pages/frontend-tooling/Performance'))


// npm Deep Dive
const NpmIntro = lazy(() => import('./pages/npm-deep-dive/Intro'))
const NpmResolution = lazy(() => import('./pages/npm-deep-dive/Resolution'))
const NpmNodeModules = lazy(() => import('./pages/npm-deep-dive/NodeModules'))
const NpmLockfile = lazy(() => import('./pages/npm-deep-dive/Lockfile'))
const NpmScripts = lazy(() => import('./pages/npm-deep-dive/Scripts'))
const NpmSecurity = lazy(() => import('./pages/npm-deep-dive/Security'))

// Building npm Packages
const NpkgAnatomy = lazy(() => import('./pages/npm-packages/Anatomy'))
const NpkgPackageJson = lazy(() => import('./pages/npm-packages/PackageJson'))
const NpkgModules = lazy(() => import('./pages/npm-packages/Modules'))
const NpkgPublishing = lazy(() => import('./pages/npm-packages/Publishing'))
const NpkgAdvanced = lazy(() => import('./pages/npm-packages/Advanced'))

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
        <Route path="java/testing-basics" element={<JavaTestingBasics />} />
        <Route path="java/mockito" element={<JavaMockito />} />
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
        <Route path="springboot2/intro" element={<SB2Intro />} />
        <Route path="springboot2/javax" element={<SB2Javax />} />
        <Route path="springboot2/di" element={<SB2Di />} />
        <Route path="springboot2/rest" element={<SB2Rest />} />
        <Route path="springboot2/security" element={<SB2Security />} />
        <Route path="springboot2/data" element={<SB2Data />} />
        <Route path="springboot2/config" element={<SB2Config />} />
        <Route path="springboot2/error" element={<SB2Error />} />
        <Route path="springboot2/testing" element={<SB2Testing />} />
        <Route path="springboot2/transactions" element={<SB2Transactions />} />
        <Route path="springboot2/kafka" element={<SB2Kafka />} />
        <Route path="springboot2/aop" element={<SB2Aop />} />
        <Route path="springboot2/webflux" element={<SB2Webflux />} />
        <Route path="springboot2/resilience" element={<SB2Resilience />} />
        <Route path="springboot2/observability" element={<SB2Observability />} />
        <Route path="springboot2/actuator" element={<SB2Actuator />} />
        <Route path="springboot2/migration" element={<SB2Migration />} />
        <Route path="springboot2/cheatsheet" element={<SB2Cheatsheet />} />
        <Route path="go/intro" element={<GoIntro />} />
        <Route path="go/setup" element={<GoSetup />} />
        <Route path="go/syntax" element={<GoSyntax />} />
        <Route path="go/structs" element={<GoStructs />} />
        <Route path="go/interfaces" element={<GoInterfaces />} />
        <Route path="go/errors" element={<GoErrors />} />
        <Route path="go/slices" element={<GoSlices />} />
        <Route path="go/pointers" element={<GoPointers />} />
        <Route path="go/goroutines" element={<GoGoroutines />} />
        <Route path="go/channels" element={<GoChannels />} />
        <Route path="go/sync" element={<GoSync />} />
        <Route path="go/context" element={<GoContext />} />
        <Route path="go/concurrency-patterns" element={<GoConcurrencyPatterns />} />
        <Route path="go/generics" element={<GoGenerics />} />
        <Route path="go/testing" element={<GoTesting />} />
        <Route path="go/http" element={<GoHttp />} />
        <Route path="go/database" element={<GoDatabase />} />
        <Route path="go/deploy" element={<GoDeploy />} />
        <Route path="go/cheatsheet" element={<GoCheatsheet />} />

        <Route path="cpp/intro" element={<CppIntro />} />
        <Route path="cpp/compiling" element={<CppCompiling />} />
        <Route path="cpp/types" element={<CppTypes />} />
        <Route path="cpp/functions" element={<CppFunctions />} />
        <Route path="cpp/references" element={<CppReferences />} />
        <Route path="cpp/memory-model" element={<CppMemoryModel />} />
        <Route path="cpp/raii" element={<CppRaii />} />
        <Route path="cpp/smart-pointers" element={<CppSmartPointers />} />
        <Route path="cpp/move-semantics" element={<CppMoveSemantics />} />
        <Route path="cpp/memory-bugs" element={<CppMemoryBugs />} />
        <Route path="cpp/classes" element={<CppClasses />} />
        <Route path="cpp/inheritance" element={<CppInheritance />} />
        <Route path="cpp/templates" element={<CppTemplates />} />
        <Route path="cpp/concepts" element={<CppConcepts />} />
        <Route path="cpp/containers" element={<CppContainers />} />
        <Route path="cpp/algorithms" element={<CppAlgorithms />} />
        <Route path="cpp/errors" element={<CppErrors />} />
        <Route path="cpp/concurrency" element={<CppConcurrency />} />
        <Route path="cpp/performance" element={<CppPerformance />} />
        <Route path="cpp/tooling" element={<CppTooling />} />
        <Route path="cpp/cheatsheet" element={<CppCheatsheet />} />

        <Route path="from-scratch/intro" element={<FSIntro />} />
        <Route path="from-scratch/scheduler" element={<FSScheduler />} />
        <Route path="from-scratch/storage" element={<FSStorage />} />
        <Route path="from-scratch/httpserver" element={<FSHttpServer />} />
        <Route path="from-scratch/consensus" element={<FSConsensus />} />
        {/* React 19 */}
        <Route path="react18/jsx" element={<ReactJsx />} />
        <Route path="react18/lifecycle" element={<ReactLifecycle />} />
        <Route path="react18/lifecycle-sim" element={<ReactLifecycleSim />} />
        <Route path="react18/hooks" element={<ReactHooks />} />
        <Route path="react18/refs" element={<ReactRefs />} />
        <Route path="react18/state" element={<ReactState />} />
        <Route path="react18/effects" element={<ReactEffects />} />
        <Route path="react18/context" element={<ReactContext />} />
        <Route path="react18/performance" element={<ReactPerformance />} />
        <Route path="react18/profiling" element={<ReactProfiling />} />
        <Route path="react19-whats-new/react19" element={<ReactNew />} />
        <Route path="react18/server" element={<ReactServer />} />
        <Route path="react18/ssr-hydration" element={<ReactSsrHydration />} />
        <Route path="react18/patterns" element={<ReactPatterns />} />
        <Route path="react18/typescript" element={<ReactTypescript />} />
        <Route path="react18/build-toolchain" element={<ReactBuildToolchain />} />
        <Route path="react18/cheat-sheet" element={<ReactCheatSheet />} />
        <Route path="react18/adapters" element={<ReactAdapters />} />
        <Route path="react18/imperative-bridge" element={<ReactImperativeBridge />} />
        <Route path="react18/module-federation" element={<ReactModuleFederation />} />
        <Route path="react18/feature-folder" element={<ReactFeatureFolder />} />
        <Route path="react18/bulletproof-react" element={<ReactBulletproofReact />} />
        <Route path="react18/error-boundaries" element={<ReactErrorBoundaries />} />
        <Route path="react18/animations" element={<ReactAnimations />} />
        <Route path="react18/portals" element={<ReactPortals />} />
        <Route path="ag-grid/data-tables" element={<AgGrid />} />
        {/* SQL */}
        <Route path="sql-fundamentals/quickstart" element={<SqlQuickstart />} />
        <Route path="sql-fundamentals/joins" element={<SqlJoins />} />
        <Route path="sql-fundamentals/aggregation" element={<SqlAggregation />} />
        <Route path="sql-design-patterns/design" element={<SqlDesign />} />
        <Route path="sql-design-patterns/indexing" element={<SqlIndexing />} />
        <Route path="sql-design-patterns/schema-patterns" element={<SqlSchemaPatterns />} />
        <Route path="sql-design-patterns/multi-tenancy" element={<SqlMultiTenancy />} />
        <Route path="sql-design-patterns/json" element={<SqlJson />} />
        <Route path="sql-design-patterns/views" element={<SqlViews />} />
        <Route path="sql-advanced/transactions" element={<SqlTransactions />} />
        <Route path="sql-advanced/cte" element={<SqlCte />} />
        <Route path="sql-advanced/stored-procedures" element={<SqlStoredProcedures />} />
        <Route path="sql-advanced/advanced" element={<SqlAdvanced />} />
        <Route path="sql-advanced/field-guide" element={<SqlAdvancedFieldGuide />} />
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
        <Route path="react-antipatterns/extract-components" element={<AntiExtractComponents />} />
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
        <Route path="react-router-v5/intro" element={<RRv5Intro />} />
        <Route path="react-router-v5/nested" element={<RRv5Nested />} />
        <Route path="react-router-v5/data" element={<RRv5Data />} />
        <Route path="react-router-v5/guards" element={<RRv5Guards />} />
        <Route path="react-router-v5/advanced" element={<RRv5Advanced />} />
        <Route path="react-router-v5/testing" element={<RRv5Testing />} />
        <Route path="react-router-v5/fullapp" element={<RRv5Fullapp />} />
        <Route path="react-router-v5/legacy" element={<RRv5Legacy />} />
        <Route path="react-router-v5/cheatsheet" element={<RRv5Cheatsheet />} />
        <Route path="react-router/intro" element={<RRIntro />} />
        <Route path="react-router/nested" element={<RRNested />} />
        <Route path="react-router/data" element={<RRData />} />
        <Route path="react-router/guards" element={<RRGuards />} />
        <Route path="react-router/advanced" element={<RRAdvanced />} />
        <Route path="react-router/testing" element={<RRTesting />} />
        <Route path="react-router/fullapp" element={<RRFullapp />} />
        <Route path="react-router/migration" element={<RRMigration />} />
        <Route path="react-router/cheatsheet" element={<RRCheatSheet />} />
        <Route path="react-router-v8/intro" element={<RRv8Intro />} />
        <Route path="react-router-v8/nested" element={<RRv8Nested />} />
        <Route path="react-router-v8/data" element={<RRv8Data />} />
        <Route path="react-router-v8/guards" element={<RRv8Guards />} />
        <Route path="react-router-v8/advanced" element={<RRv8Advanced />} />
        <Route path="react-router-v8/testing" element={<RRv8Testing />} />
        <Route path="react-router-v8/fullapp" element={<RRv8Fullapp />} />
        <Route path="react-router-v8/migration" element={<RRv8Migration />} />
        <Route path="react-router-v8/cheatsheet" element={<RRv8Cheatsheet />} />
        {/* State Management */}
        <Route path="state-mgmt/choosing" element={<StateChoosing />} />
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
        {/* Browser DevTools */}
        <Route path="devtools/elements" element={<DtElements />} />
        <Route path="devtools/css" element={<DtCss />} />
        <Route path="devtools/console" element={<DtConsole />} />
        <Route path="devtools/breakpoints" element={<DtBreakpoints />} />
        <Route path="devtools/network" element={<DtNetwork />} />
        <Route path="devtools/performance" element={<DtPerformance />} />
        <Route path="devtools/react" element={<DtReact />} />
        <Route path="devtools/field-guide" element={<DtFieldGuide />} />
        {/* Browser Runtime & the DOM */}
        <Route path="browser-runtime/dom" element={<BrDom />} />
        <Route path="browser-runtime/events" element={<BrEvents />} />
        <Route path="browser-runtime/event-loop" element={<BrEventLoop />} />
        <Route path="browser-runtime/observers" element={<BrObservers />} />
        <Route path="browser-runtime/storage" element={<BrStorage />} />
        <Route path="browser-runtime/fetch" element={<BrFetch />} />
        <Route path="browser-runtime/field-guide" element={<BrFieldGuide />} />
        {/* HTML */}
        <Route path="html/document" element={<HtmlDocument />} />
        <Route path="html/semantics" element={<HtmlSemantics />} />
        <Route path="html/forms" element={<HtmlForms />} />
        <Route path="html/interactive" element={<HtmlInteractive />} />
        <Route path="html/media" element={<HtmlMedia />} />
        <Route path="html/parser" element={<HtmlParser />} />
        <Route path="html/field-guide" element={<HtmlFieldGuide />} />
        {/* CSS Mastery */}
        <Route path="css-mastery/fundamentals" element={<CSSFundamentals />} />
        <Route path="css-mastery/flexbox" element={<CSSFlexbox />} />
        <Route path="css-mastery/grid" element={<CSSGrid />} />
        <Route path="css-mastery/sizing" element={<CSSSizing />} />
        <Route path="css-mastery/gotchas" element={<CSSGotchas />} />
        <Route path="css-mastery/responsive" element={<CSSResponsive />} />
        <Route path="css-mastery/animations" element={<CSSAnimations />} />
        <Route path="css-mastery/variables" element={<CSSVariables />} />
        <Route path="css-mastery/sass" element={<CSSSass />} />
        <Route path="css-mastery/tokens" element={<CSSTokens />} />
        <Route path="css-mastery/design-system-tokens" element={<CSSDesignSystemTokens />} />
        <Route path="css-mastery/style-inclusion" element={<CSSStyleInclusion />} />
        <Route path="css-mastery/patterns" element={<CSSPatterns />} />
        <Route path="mui/intro" element={<MuiIntro />} />
        <Route path="mui/styling-v4" element={<MuiStylingV4 />} />
        <Route path="mui/theming" element={<MuiTheming />} />
        <Route path="mui/overrides" element={<MuiOverrides />} />
        <Route path="mui/styled-v5" element={<MuiStyledV5 />} />
        <Route path="mui/cheatsheet" element={<MuiCheatsheet />} />
        <Route path="mui9/intro" element={<Mui9Intro />} />
        <Route path="mui9/silent-breaks" element={<Mui9SilentBreaks />} />
        <Route path="mui9/styling" element={<Mui9Styling />} />
        <Route path="mui9/theming" element={<Mui9Theming />} />
        <Route path="mui9/cheatsheet" element={<Mui9Cheatsheet />} />
        <Route path="tsql/intro" element={<TsqlIntro />} />
        <Route path="tsql/core-queries" element={<TsqlCoreQueries />} />
        <Route path="tsql/joins" element={<TsqlJoins />} />
        <Route path="tsql/aggregation" element={<TsqlAggregation />} />
        <Route path="tsql/modifying-data" element={<TsqlModifyingData />} />
        <Route path="tsql/views" element={<TsqlViews />} />
        <Route path="tsql/programmability" element={<TsqlProgrammability />} />
        <Route path="tsql/transactions" element={<TsqlTransactions />} />
        <Route path="tsql/indexing" element={<TsqlIndexing />} />
        <Route path="tsql/cheatsheet" element={<TsqlCheatsheet />} />
        <Route path="playground/compiler" element={<PlaygroundCompiler />} />
        <Route path="playground/type-checker" element={<PlaygroundTypeChecker />} />
        <Route path="playground/jsx-compiler" element={<PlaygroundJsxCompiler />} />
        <Route path="playground/css-playground" element={<PlaygroundCssPlayground />} />
        <Route path="playground/sass-playground" element={<PlaygroundSassPlayground />} />
        <Route path="playground/sql-playground" element={<PlaygroundSqlPlayground />} />
        <Route path="css-mastery/field-guide" element={<CssMasteryFieldGuide />} />
        {/* React Testing */}
        <Route path="react-testing/intro" element={<RTIntro />} />
        <Route path="react-testing/components" element={<RTComponents />} />
        <Route path="react-testing/hooks" element={<RTHooks />} />
        <Route path="react-testing/async" element={<RTAsync />} />
        <Route path="react-testing/async-deep-dive" element={<RTAsyncDeepDive />} />
        <Route path="react-testing/forms" element={<RTForms />} />
        <Route path="react-testing/third-party-layered" element={<RTThirdPartyLayered />} />
        <Route path="react-testing/patterns" element={<RTPatterns />} />
        <Route path="react-testing/best-practices" element={<RTBestPractices />} />
        <Route path="react-testing/cheatsheet" element={<RTCheatsheet />} />
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
