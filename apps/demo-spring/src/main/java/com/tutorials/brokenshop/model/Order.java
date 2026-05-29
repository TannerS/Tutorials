package com.tutorials.brokenshop.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String customerEmail;

  // FIXME: MODEL-7 — Status as a String is stringly-typed. Use:
  //   @Enumerated(EnumType.STRING) private OrderStatus status;
  // (Never @Enumerated(EnumType.ORDINAL) — reorder the enum and your DB is wrong.)
  private String status;

  private BigDecimal total;

  // FIXME: MODEL-8 — using java.util.Date or java.sql.Timestamp would be worse, but
  // even Instant is sometimes the wrong fit. For "this happened at this clock time
  // in the customer's timezone" use OffsetDateTime/ZonedDateTime. For "monotonic
  // event timestamp" Instant is right. Document the choice.
  private Instant createdAt = Instant.now();

  @OneToMany(mappedBy = "order", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
  private List<OrderItem> items = new ArrayList<>();

  public Order() {}

  public Long getId() { return id; }
  public String getCustomerEmail() { return customerEmail; }
  public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public BigDecimal getTotal() { return total; }
  public void setTotal(BigDecimal total) { this.total = total; }
  public Instant getCreatedAt() { return createdAt; }
  public List<OrderItem> getItems() { return items; }
  public void setItems(List<OrderItem> items) { this.items = items; }
}
