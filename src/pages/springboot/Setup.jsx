import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SpringSetup() {
  return (
    <LessonLayout
      title="Project Setup"
      sectionId="springboot"
      lessonIndex={1}
      prev={{ path: "/springboot/intro", label: "Spring Boot Overview" }}
      next={{ path: "/springboot/di", label: "Dependency Injection" }}
    >
      <p>A well-structured Spring Boot project follows conventions that make it easy to navigate and maintain at scale.</p>

      <h2>Directory Structure</h2>
      <CodeBlock language="bash" title="Recommended Project Layout">
{`src/
├── main/
│   ├── java/com/example/myapp/
│   │   ├── MyApplication.java        # Entry point
│   │   ├── config/                   # @Configuration classes
│   │   │   └── SecurityConfig.java
│   │   ├── controller/               # @RestController (HTTP layer)
│   │   │   └── UserController.java
│   │   ├── service/                  # @Service (business logic)
│   │   │   └── UserService.java
│   │   ├── repository/               # @Repository (data access)
│   │   │   └── UserRepository.java
│   │   ├── model/                    # @Entity / domain objects
│   │   │   └── User.java
│   │   └── dto/                      # Data Transfer Objects
│   │       └── UserDTO.java
│   └── resources/
│       ├── application.yml           # Main config
│       ├── application-dev.yml       # Dev profile config
│       └── static/                   # Static assets (CSS, JS)
└── test/
    └── java/com/example/myapp/
        └── UserControllerTest.java`}
      </CodeBlock>

      <h2>application.yml Configuration</h2>
      <CodeBlock language="yaml" title="application.yml">
{`server:
  port: 8080
  servlet:
    context-path: /api

spring:
  application:
    name: my-app
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: dbuser
    password: dbpass
    hikari:
      maximum-pool-size: 10
  jpa:
    hibernate:
      ddl-auto: validate          # validate schema against entities
    show-sql: false               # set true for debugging
    open-in-view: false           # avoid OSIV anti-pattern

logging:
  level:
    root: INFO
    com.example.myapp: DEBUG`}
      </CodeBlock>

      <h2>Key Maven Dependencies</h2>
      <CodeBlock language="xml" title="pom.xml essentials">
{`<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
</parent>

<dependencies>
    <!-- Web + REST -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- JPA + Database -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Lombok (optional but popular) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- Test -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>`}
      </CodeBlock>

      <InfoBox variant="tip" title="Spring DevTools">
        <p>Add spring-boot-devtools to your dependencies for automatic restart on code changes, live reload of static resources, and development-friendly defaults. It's automatically disabled in production builds.</p>
      </InfoBox>

      <InteractiveChallenge
        question="Where should business logic live in a Spring Boot application?"
        options={["@Controller class", "@Service class", "@Repository class", "@Entity class"]}
        correctIndex={1}
        explanation="Business logic belongs in @Service classes. @Controller/@RestController handles HTTP concerns, @Repository handles data access, and @Entity represents your domain model. This separation follows the Single Responsibility Principle and makes each layer independently testable."
      />
    </LessonLayout>
  );
}
