package com.tutorials.brokenshop.service;

import com.tutorials.brokenshop.model.Product;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

/*
 * FIXME: CACHE-1 — Naive hand-rolled cache. No eviction, no TTL, leaks memory.
 * Spring Boot ships with @Cacheable + a caching provider abstraction:
 *
 *   @Cacheable("pricing")
 *   public BigDecimal calculate(Product p) { ... }
 *
 * Then configure Caffeine in application.yml:
 *   spring.cache.type: caffeine
 *   spring.cache.caffeine.spec: maximumSize=10000,expireAfterWrite=10m
 *
 * FIXME: CACHE-2 — Key is the Product reference, not the product id. Two JPA proxies
 * for the same product won't share a cache entry.
 *
 * FIXME: CONCURRENCY-1 — HashMap is not thread-safe. Under load the JVM can spin
 * forever resizing it. Use ConcurrentHashMap, or better, drop this in favor of
 * @Cacheable (CACHE-1).
 *
 * FIXME: LOG-1 — System.out.println instead of a logger. Replace with:
 *   private static final Logger log = LoggerFactory.getLogger(PricingService.class);
 *   log.debug("Cache miss for product {}", product.getId());
 */
@Service
public class PricingService {

  private final Map<Product, BigDecimal> cache = new HashMap<>();
  private static final BigDecimal TAX = new BigDecimal("0.07");

  public BigDecimal calculate(Product product) {
    BigDecimal hit = cache.get(product);
    if (hit != null) {
      System.out.println("Cache hit for product " + product.getId());
      return hit;
    }

    // FIXME: BUG-1 — Tax compounded twice. Test will fail.
    BigDecimal withTax = product.getPrice()
      .multiply(BigDecimal.ONE.add(TAX))
      .multiply(BigDecimal.ONE.add(TAX))
      .setScale(2, RoundingMode.HALF_UP);

    cache.put(product, withTax);
    System.out.println("Cache miss for product " + product.getId());
    return withTax;
  }
}
