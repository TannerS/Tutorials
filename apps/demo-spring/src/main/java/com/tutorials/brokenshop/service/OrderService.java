package com.tutorials.brokenshop.service;

import com.tutorials.brokenshop.model.Order;
import com.tutorials.brokenshop.model.OrderItem;
import com.tutorials.brokenshop.model.Product;
import com.tutorials.brokenshop.repository.OrderRepository;
import com.tutorials.brokenshop.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

  // FIXME: DI-1 — field injection. Constructor injection is the recommended pattern.
  // It makes dependencies explicit, allows immutability (final), and is testable
  // without Spring. Reflection-based field injection breaks all three.
  //
  //   private final OrderRepository orderRepository;
  //   private final ProductRepository productRepository;
  //   public OrderService(OrderRepository or, ProductRepository pr) { ... }
  @org.springframework.beans.factory.annotation.Autowired
  private OrderRepository orderRepository;

  @org.springframework.beans.factory.annotation.Autowired
  private ProductRepository productRepository;

  // FIXME: DI-2 — instantiating a service with `new`. This bypasses Spring entirely,
  // so any DI/AOP/transactions on InventoryService never fire.
  private final InventoryService inventoryService = new InventoryService();

  // FIXME: DI-4 — Email is field-injected and called SYNCHRONOUSLY from the order
  // path. See ASYNC-1 + DI-1. Combined effect: order POST hangs ~2s waiting for the
  // "email" to finish.
  @org.springframework.beans.factory.annotation.Autowired
  private EmailService emailService;

  /*
   * FIXME: TX-1 — No @Transactional. This method writes to two tables across multiple
   * statements. If decrementStock succeeds and orderRepository.save throws, you end up
   * with inventory deducted but no order. Wrap in:
   *
   *   @Transactional
   *   public Order placeOrder(...) { ... }
   *
   * FIXME: TX-2 — Even with @Transactional, the default propagation REQUIRED + read-write
   * is right here, but for read-only methods (getOrder, listOrders) use
   * @Transactional(readOnly = true) for Hibernate FlushMode.MANUAL + DB hints.
   */
  public Order placeOrder(String customerEmail, Map<Long, Integer> productIdToQty) {

    // FIXME: PERF-5 — N+1 again. Calls productRepository.findById in a loop.
    // Use productRepository.findAllById(productIdToQty.keySet()) to fetch in one query.
    Order order = new Order();
    order.setCustomerEmail(customerEmail);
    order.setStatus("PENDING");

    BigDecimal total = BigDecimal.ZERO;

    for (Map.Entry<Long, Integer> entry : productIdToQty.entrySet()) {
      Long productId = entry.getKey();
      int qty = entry.getValue();

      // FIXME: ERR-1 — .orElseThrow with no exception → throws NoSuchElementException
      // which surfaces to clients as a generic 500. Use a domain exception:
      //   .orElseThrow(() -> new ProductNotFoundException(productId))
      // and map it to a 404 via @ControllerAdvice / ProblemDetail.
      Product product = productRepository.findById(productId).orElseThrow();

      // FIXME: VALID-1 — no check for stock availability before deducting.
      // A user can order quantity 9999 of a product with stock 1.
      inventoryService.decrementStock(product, qty);
      productRepository.save(product);

      OrderItem item = new OrderItem();
      item.setOrder(order);
      item.setProduct(product);
      item.setQuantity(qty);
      item.setPriceAtPurchase(product.getPrice());

      total = total.add(product.getPrice().multiply(BigDecimal.valueOf(qty)));

      order.getItems().add(item);
    }

    order.setTotal(total);
    Order saved = orderRepository.save(order);

    // FIXME: TX-4 — Side effect (email) inside @Transactional method (once you add it).
    // If the email throws AFTER the DB commits, you'll have inconsistent state.
    // Fix with @TransactionalEventListener(AFTER_COMMIT) so the email fires ONLY
    // when the transaction successfully committed. See ASYNC-1.
    emailService.sendConfirmation(saved);

    return saved;
  }

  // FIXME: PATTERN-1 — Java 21 pattern matching for switch is unused here.
  // Refactor to:
  //   return switch (status) {
  //     case "PENDING"   -> "Awaiting payment";
  //     case "PAID"      -> "Ready to ship";
  //     case "SHIPPED"   -> "On its way";
  //     case "CANCELLED" -> "Cancelled";
  //     case null        -> "Unknown";    // <- new in Java 21
  //     default          -> "Unknown";
  //   };
  // — but the BIGGER fix is MODEL-7: make status a real enum and exhaustiveness checks itself.
  public String describeStatus(Order order) {
    String status = order.getStatus();
    if (status == null) return "Unknown";
    if (status.equals("PENDING")) return "Awaiting payment";
    if (status.equals("PAID")) return "Ready to ship";
    if (status.equals("SHIPPED")) return "On its way";
    if (status.equals("CANCELLED")) return "Cancelled";
    return "Unknown";
  }

  public List<Order> listOrders() {
    return orderRepository.findAll();
  }
}
