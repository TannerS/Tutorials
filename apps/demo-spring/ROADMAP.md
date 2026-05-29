# Broken Spring Boot Demo — Fix-It Roadmap

Each phase has clear exit criteria. Don't skip ahead — earlier phases unblock later
ones (e.g. you can't really validate at the boundary until you have DTOs).

---

## Part 1 — Modeling & DTOs 📦

**Goal:** Stop leaking JPA entities through the API. Records as DTOs everywhere.

**Tags to fix:** `MODEL-*`, `REPO-1`, `REST-4`

**Exit criteria:**
- [ ] `ProductDto`, `OrderDto`, `OrderItemDto`, `ReviewDto` exist as records.
- [ ] No `@Entity` class is serialized as a JSON response.
- [ ] `Order.status` is a real enum (`OrderStatus`) with `@Enumerated(EnumType.STRING)`.
- [ ] Entities have correct `equals`/`hashCode`.

---

## Part 2 — Architecture & DI 🏗️

**Goal:** Each layer has a single job.

**Tags to fix:** `ARCH-*`, `DI-*`

**Exit criteria:**
- [ ] No controller injects a repository.
- [ ] All services use constructor injection (`@Autowired` field injection deleted).
- [ ] `InventoryService` is a Spring bean and is injected, not `new`'d.
- [ ] (Optional) Application module boundaries enforced with ArchUnit or
      Spring Modulith.

---

## Part 3 — Transactions & performance 💾

**Goal:** Atomic writes, no N+1, no surprise queries.

**Tags to fix:** `TX-*`, `PERF-*`, `REPO-2`, `REPO-3`

**Exit criteria:**
- [ ] Every write method that touches >1 row is `@Transactional`.
- [ ] Read methods are `@Transactional(readOnly = true)` where useful.
- [ ] All `EAGER` fetches flipped to `LAZY`.
- [ ] One Hibernate query per logical request (verify with
      `spring.jpa.properties.hibernate.generate_statistics=true`).
- [ ] List endpoints are paginated (`Pageable`).

---

## Part 4 — Validation & error handling ⚠️

**Goal:** Garbage in is rejected at the boundary; failures come back as
RFC 7807 ProblemDetail.

**Tags to fix:** `VALID-*`, `ERR-*`

**Exit criteria:**
- [ ] All `@RequestBody` payloads marked `@Valid`; DTOs have bean-validation annotations.
- [ ] Domain exceptions exist (`ProductNotFoundException`, `InsufficientStockException`).
- [ ] `@RestControllerAdvice` returns `ProblemDetail` for known and unknown errors.
- [ ] No more `Optional.orElseThrow()` with the default no-arg.
- [ ] No services returning `null` for "not found".

---

## Part 5 — Spring Boot 4 / Java 21 features 🚀

**Goal:** Adopt what's new and free.

**Tags to fix:** `SB4-*`, `PATTERN-*`, `CACHE-*`, `ASYNC-*`

**Exit criteria:**
- [ ] `spring.threads.virtual.enabled: true`.
- [ ] At least one `switch` uses pattern matching (incl. `case null` if appropriate).
- [ ] DTOs are records.
- [ ] (Optional) GraalVM native image builds via `mvn -Pnative native:compile`.

---

## Part 6 — Security 🔒

**Goal:** Auth, role-based authz, sensible defaults.

**Tags to fix:** `SECURITY-*`, `SEC-*`

**Exit criteria:**
- [ ] `spring-boot-starter-security` added; `SecurityFilterChain` configured.
- [ ] DELETE endpoints require `ROLE_ADMIN`.
- [ ] H2 console disabled outside `dev` profile.
- [ ] CORS / CSRF configured intentionally (not just disabled by default).

---

## Part 7 — Configuration & profiles ⚙️

**Goal:** No secrets in config; profiles separate dev/prod.

**Tags to fix:** `CONFIG-*`, `SEED-*`

**Exit criteria:**
- [ ] `application-dev.yml` / `application-prod.yml` exist.
- [ ] `@ConfigurationProperties` records replace scattered `@Value`.
- [ ] Flyway (or Liquibase) migrations replace `ddl-auto: update`.
- [ ] Seed data only runs in `dev`.

---

## Part 8 — Observability 📈

**Goal:** Know what your app is doing.

**Tags to fix:** `OBS-*`, `LOG-*`

**Exit criteria:**
- [ ] `spring-boot-starter-actuator` added; `/actuator/health` returns useful info.
- [ ] Structured logging (JSON in prod, pretty in dev) with `LoggingSystem` config or
      Logback's JSON encoder.
- [ ] Micrometer metrics exposed; basic Grafana dashboard or at least Prometheus scrape.

---

## Part 9 — Testing 🧪

**Goal:** Confidence to refactor.

**Tags to fix:** `TEST-*`

**Exit criteria:**
- [ ] Unit tests for services (no Spring context).
- [ ] `@SpringBootTest` integration test for at least one happy-path + one failure path.
- [ ] Testcontainers + PostgreSQL replacing H2 in the integration tests.
- [ ] Coverage report wired into CI (JaCoCo).

---

## Part 10 — Stretch 🌟

Pick from "Stretch goals" in `SOLUTIONS.md`:
- Reactive endpoint with WebFlux for comparison vs virtual threads.
- Event-driven flow with `ApplicationEventPublisher` (order placed → email).
- `HttpExchange` interface client to call an external API.
- Spring Modulith to enforce internal package boundaries.

---

## Done?

Probably not — production Spring apps are deep wells. But once you've done
Parts 1–6 you'll have a service that wouldn't be embarrassing in a code review.
Parts 7–9 are the difference between "works on my machine" and "I'd put this
behind a real domain name."
