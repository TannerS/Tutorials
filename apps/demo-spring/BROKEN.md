# Broken Spring Boot Demo — Bug Hunt

Spring Boot **4.0.6** · Java **21** · H2 in-memory · deliberately broken.

```bash
# from repo root
npm run dev:spring
# or, from this folder:
mvn spring-boot:run
# then open http://localhost:8081/product   (yes the URL is wrong on purpose)
# H2 console (also broken on purpose): http://localhost:8081/h2-console
```

Every problem is tagged with a `FIXME: <CATEGORY>-<N>` comment. Grep them:

```bash
grep -rn "FIXME:" apps/demo-spring/src
```

Read `SOLUTIONS.md` only after you've taken a real swing at each one.
**For the recommended order to fix things, see `ROADMAP.md`** — work through the
parts one at a time.

---

## Categories

| Tag       | Theme                              | Where to look                                     |
| --------- | ---------------------------------- | ------------------------------------------------- |
| SB4-N     | Spring Boot 4 features to adopt    | `BrokenShopApplication`, `application.yml`        |
| ARCH-N    | Layering violations                | `ProductController`, `OrderService`               |
| DI-N      | Dependency injection mistakes      | `OrderService`, `InventoryService`                |
| TX-N      | Transactions                       | `OrderService`, `ProductService`                  |
| PERF-N    | N+1 / fetch strategies             | `Product`, `Review`, `OrderItem`, `OrderService`  |
| MODEL-N   | Entity / DTO modeling              | `Product`, `Order`, `Review`                      |
| REPO-N    | Repository design                  | `ProductRepository`                               |
| REST-N    | REST design                        | `ProductController`, `OrderController`            |
| VALID-N   | Validation                         | controllers + models                              |
| ERR-N     | Error handling                     | `GlobalExceptionHandler`, services                |
| SECURITY-N| Security                           | `ProductController`, `application.yml`            |
| CONFIG-N  | Configuration                      | `application.yml`, `ProductService`               |
| PATTERN-N | Java 21 patterns / records        | `OrderService`, models                            |
| SEED-N    | Bootstrap / data loading           | `SeedDataConfig`                                  |
| TS-N      | Type safety in Java                | `OrderController`                                 |
| CACHE-N   | Caching anti-patterns              | `PricingService`                                  |
| CONCURRENCY-N | Concurrency mistakes           | `PricingService`                                  |
| ASYNC-N   | Async / blocking calls             | `EmailService`, `OrderService`                    |
| LOG-N     | Logging                            | `PricingService`, `EmailService`                  |
| BUG-N     | Outright bugs (not stylistic)      | `PricingService`, `EmailService`                  |
| TEST-N    | Test issues                        | `PricingServiceTest`                              |

---

## Try these to see things break

```bash
# 1. GET all products — note how reviews come along (EAGER), and JSON is bloated.
curl -s http://localhost:8081/product | jq

# 2. GET a missing product — get 200 + "null", not 404.
curl -i http://localhost:8081/product/9999

# 3. POST a product with no name — should be 400; instead it saves blank rows.
curl -X POST http://localhost:8081/product \
  -H 'Content-Type: application/json' \
  -d '{ "name":"", "price":-5, "stock":-1 }'

# 4. POST an order requesting more stock than exists — no validation error.
curl -X POST http://localhost:8081/orders \
  -H 'Content-Type: application/json' \
  -d '{ "customerEmail":"x@y", "items": { "1": 99999 } }'

# 5. DELETE any product — no auth required.
curl -X DELETE http://localhost:8081/product/2

# 6. Logs show every SQL query (show-sql = true) — leaks data, slows tests.
```

## Suggested order to fix

1. **MODEL-N + REST-N** — introduce DTO records, fix URL paths, return ResponseEntity.
2. **DI-N + ARCH-N** — constructor injection, move repo work into services.
3. **TX-N + PERF-N** — wrap writes in @Transactional, flip relations to LAZY, add EntityGraphs.
4. **VALID-N + ERR-N** — @Valid + ProblemDetail.
5. **SECURITY-N + CONFIG-N** — add Spring Security, type-safe @ConfigurationProperties.
6. **SB4-N + PATTERN-N** — enable virtual threads, adopt records + pattern matching.

No single right answer for many of these — see `SOLUTIONS.md`.
