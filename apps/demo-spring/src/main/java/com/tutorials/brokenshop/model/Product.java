package com.tutorials.brokenshop.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/*
 * FIXME: MODEL-1 — Entity exposed directly to the controller / serialized as JSON.
 * Tight coupling between persistence model and API contract. Add a ProductDto record
 * (Java 16+ records are perfect for this) and a mapper:
 *
 *   public record ProductDto(Long id, String name, BigDecimal price, int stock) {}
 *
 * FIXME: MODEL-2 — No validation annotations (@NotBlank, @Positive, @Size).
 * Bad data goes straight into the DB.
 *
 * FIXME: MODEL-3 — `price` as BigDecimal but `quantity` (in OrderItem) as primitive int.
 * Inconsistent money/quantity modeling. Consider a Money value object.
 *
 * FIXME: MODEL-4 — `equals`/`hashCode` not overridden. JPA proxies + Sets of entities
 * misbehave. Override them based on natural key OR business identity, never `id`.
 */
@Entity
@Table(name = "products")
public class Product {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String name;

  // FIXME: MODEL-5 — `description` is nullable + unlimited length. Add @Column(length = 1000).
  private String description;

  private BigDecimal price;

  private int stock;

  // FIXME: PERF-1 (N+1) — EAGER fetch on a -ToMany. Loading 50 products triggers
  // 50 extra SELECTs to load all reviews. Switch to FetchType.LAZY and use a
  // JOIN FETCH or @EntityGraph when reviews are actually needed.
  @OneToMany(mappedBy = "product", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
  private List<Review> reviews = new ArrayList<>();

  public Product() {}
  public Product(String name, BigDecimal price, int stock) {
    this.name = name; this.price = price; this.stock = stock;
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public BigDecimal getPrice() { return price; }
  public void setPrice(BigDecimal price) { this.price = price; }
  public int getStock() { return stock; }
  public void setStock(int stock) { this.stock = stock; }
  public List<Review> getReviews() { return reviews; }
  public void setReviews(List<Review> reviews) { this.reviews = reviews; }
}
