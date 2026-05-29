package com.tutorials.brokenshop.controller;

import com.tutorials.brokenshop.model.Product;
import com.tutorials.brokenshop.repository.ProductRepository;
import com.tutorials.brokenshop.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/*
 * FIXME: REST-1 — URL is "/product" (singular). REST convention is plural ("/products").
 * FIXME: REST-2 — No API version prefix. Add "/api/v1/products" so future-you can break
 * cleanly: "/api/v2/products". Or use header-based versioning.
 * FIXME: REST-3 — Mixed response shapes (sometimes Product, sometimes List<Product>,
 * sometimes raw String). Adopt a consistent envelope OR rely on hypermedia/HATEOAS.
 */
@RestController
@RequestMapping("/product")
public class ProductController {

  // FIXME: ARCH-1 — Controller injects BOTH a service AND a repository. The controller
  // should only depend on the service layer. Repository belongs behind ProductService.
  @Autowired
  private ProductService productService;

  @Autowired
  private ProductRepository productRepository;

  /*
   * FIXME: ARCH-2 — Controller doing repository work directly. Move to service.
   * FIXME: REST-4 — Returns the JPA entity (with EAGER-loaded reviews → MASSIVE JSON).
   *   Map to a DTO record. See MODEL-1.
   */
  @GetMapping
  public List<Product> all() {
    return productRepository.findAll();
  }

  /*
   * FIXME: REST-5 — Returns null on not-found, which Jackson serializes as "null" with
   *   200 OK. Should return 404. Best path forward in SB4:
   *
   *     @GetMapping("/{id}")
   *     public Product byId(@PathVariable Long id) {
   *       return service.getById(id).orElseThrow(() -> new ProductNotFoundException(id));
   *     }
   *
   *   + ProductNotFoundException mapped to ProblemDetail in ControllerAdvice (see ERR-3).
   */
  @GetMapping("/{id}")
  public Product byId(@PathVariable Long id) {
    return productService.getById(id);
  }

  /*
   * FIXME: VALID-2 — No @Valid on the body. Spring Boot 4 with starter-validation makes
   *   field-level validation trivial:
   *     @PostMapping
   *     public Product create(@Valid @RequestBody ProductDto dto) { ... }
   *   plus @NotBlank, @Positive on the DTO. Validation errors auto-respond with a 400
   *   ProblemDetail in SB4.
   *
   * FIXME: REST-6 — POST returns the created entity but no Location header pointing to
   *   the new resource. Return ResponseEntity.created(location).body(...).
   */
  @PostMapping
  public Product create(@RequestBody Product p) {
    return productService.create(p);
  }

  /*
   * FIXME: SECURITY-1 — DELETE on any product with no auth, no CSRF. Add Spring Security.
   *   SB4 ships with the new Security 7 DSL. The starter is:
   *     spring-boot-starter-security
   *   plus @PreAuthorize("hasRole('ADMIN')") on this method.
   *
   * FIXME: REST-7 — DELETE that returns void leaks success/failure into HTTP only.
   *   That's actually FINE — return 204 No Content. But many teams prefer
   *   ResponseEntity<Void> to be explicit.
   */
  @DeleteMapping("/{id}")
  public void delete(@PathVariable Long id) {
    productRepository.deleteById(id);
  }
}
