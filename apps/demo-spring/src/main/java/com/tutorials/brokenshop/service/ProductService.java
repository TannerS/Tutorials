package com.tutorials.brokenshop.service;

import com.tutorials.brokenshop.model.Product;
import com.tutorials.brokenshop.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductService {

  private final ProductRepository productRepository;

  // FIXME: CONFIG-5 — @Value scattered through services. Consolidate into a typed
  // @ConfigurationProperties("shop") record:
  //
  //   @ConfigurationProperties(prefix = "shop")
  //   public record ShopProperties(BigDecimal taxRate, int defaultPageSize) {}
  //
  // Then inject ShopProperties via constructor. Validation works
  // (@ConfigurationPropertiesScan, @Validated) and IDE auto-completion shows you
  // every config key from one place.
  @Value("${shop.tax-rate:0.07}")
  private BigDecimal taxRate;

  public ProductService(ProductRepository productRepository) {
    this.productRepository = productRepository;
  }

  public List<Product> listAll() {
    return productRepository.findAll();
  }

  // FIXME: ERR-2 — returning null for "not found" forces every caller to null-check.
  // Use Optional<Product>, or throw a domain exception that the controller advice
  // translates to a 404 ProblemDetail.
  public Product getById(Long id) {
    return productRepository.findById(id).orElse(null);
  }

  public BigDecimal priceWithTax(Product p) {
    return p.getPrice().multiply(BigDecimal.ONE.add(taxRate));
  }

  // FIXME: TX-3 — write method with no @Transactional. Save is technically fine because
  // JpaRepository.save flushes in its own auto-tx, but if you later add audit logging
  // or events here you'll wish you'd wrapped the whole operation.
  public Product create(Product p) {
    return productRepository.save(p);
  }
}
