package com.tutorials.brokenshop.model;

import jakarta.persistence.*;

@Entity
@Table(name = "reviews")
public class Review {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // FIXME: MODEL-6 — bidirectional relationship causes circular JSON serialization.
  // Either:
  //   - Use @JsonManagedReference / @JsonBackReference (annotation-based)
  //   - Better: don't serialize the entity at all — map to a DTO (see MODEL-1).
  @ManyToOne(fetch = FetchType.EAGER)   // FIXME: PERF-2 — EAGER. Should be LAZY.
  @JoinColumn(name = "product_id")
  private Product product;

  private int rating;
  private String comment;

  public Review() {}

  public Long getId() { return id; }
  public Product getProduct() { return product; }
  public void setProduct(Product product) { this.product = product; }
  public int getRating() { return rating; }
  public void setRating(int rating) { this.rating = rating; }
  public String getComment() { return comment; }
  public void setComment(String comment) { this.comment = comment; }
}
