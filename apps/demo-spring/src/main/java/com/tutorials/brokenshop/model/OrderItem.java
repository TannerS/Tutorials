package com.tutorials.brokenshop.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.EAGER)   // FIXME: PERF-3 — EAGER
  @JoinColumn(name = "order_id")
  private Order order;

  @ManyToOne(fetch = FetchType.EAGER)   // FIXME: PERF-4 — EAGER
  @JoinColumn(name = "product_id")
  private Product product;

  private int quantity;
  private BigDecimal priceAtPurchase;

  public OrderItem() {}

  public Long getId() { return id; }
  public Order getOrder() { return order; }
  public void setOrder(Order order) { this.order = order; }
  public Product getProduct() { return product; }
  public void setProduct(Product product) { this.product = product; }
  public int getQuantity() { return quantity; }
  public void setQuantity(int quantity) { this.quantity = quantity; }
  public BigDecimal getPriceAtPurchase() { return priceAtPurchase; }
  public void setPriceAtPurchase(BigDecimal priceAtPurchase) { this.priceAtPurchase = priceAtPurchase; }
}
