package com.tutorials.brokenshop.controller;

import com.tutorials.brokenshop.model.Order;
import com.tutorials.brokenshop.service.OrderService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
public class OrderController {

  private final OrderService orderService;

  public OrderController(OrderService orderService) {
    this.orderService = orderService;
  }

  /*
   * FIXME: REST-8 — Request body uses a raw Map. Define an OrderRequest record:
   *
   *   public record OrderRequest(
   *     @NotBlank @Email String customerEmail,
   *     @NotEmpty Map<@Positive Long, @Positive Integer> items
   *   ) {}
   *
   *   Now the API is self-documenting and validation is automatic.
   */
  @PostMapping
  public Order placeOrder(@RequestBody Map<String, Object> body) {
    String customerEmail = (String) body.get("customerEmail");
    // FIXME: TS-1 (java edition) — unchecked cast. Compile-time hides at runtime here.
    @SuppressWarnings("unchecked")
    Map<Long, Integer> items = (Map<Long, Integer>) body.get("items");
    return orderService.placeOrder(customerEmail, items);
  }

  // FIXME: REST-9 — Returns all orders without any filter, pagination, or auth.
  // In a real shop this leaks every customer's order to anyone with the URL.
  @GetMapping
  public List<Order> listAll() {
    return orderService.listOrders();
  }
}
