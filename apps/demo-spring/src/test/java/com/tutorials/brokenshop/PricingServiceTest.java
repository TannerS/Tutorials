package com.tutorials.brokenshop;

import com.tutorials.brokenshop.model.Product;
import com.tutorials.brokenshop.service.PricingService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/*
 * FIXME: TEST-1 — This test EXPECTS the buggy behavior from BUG-1 (tax compounded
 * twice). A correct test would expect a single 7% application:
 *
 *   $12.99 * 1.07 = $13.90 (not $14.88)
 *
 * Fix BUG-1 in PricingService.calculate AND update this test to assert the
 * correct number. Lesson: tests that pass aren't always tests that are correct.
 *
 * FIXME: TEST-2 — Test is in the wrong package (no `service.` subpackage).
 * Mirror src/main/java structure: src/test/java/.../brokenshop/service/PricingServiceTest.java
 *
 * FIXME: TEST-3 — No use of @SpringBootTest or any context. A unit test is fine
 * here, but you have no integration coverage for the controllers + repository.
 * Add at least one @WebMvcTest or @SpringBootTest(webEnvironment=RANDOM_PORT).
 *
 * FIXME: TEST-4 — Uses H2 implicitly. Switch to Testcontainers + Postgres for
 * realistic schema fidelity (and to catch H2-only SQL quirks before prod).
 */
class PricingServiceTest {

  @Test
  void calculatesPriceWithTax() {
    PricingService svc = new PricingService();
    Product p = new Product();
    p.setPrice(new BigDecimal("12.99"));

    BigDecimal result = svc.calculate(p);

    // Asserts the buggy double-tax outcome.
    assertThat(result).isEqualByComparingTo(new BigDecimal("14.88"));
  }
}
