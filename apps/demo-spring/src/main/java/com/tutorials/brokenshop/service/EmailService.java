package com.tutorials.brokenshop.service;

import com.tutorials.brokenshop.model.Order;
import org.springframework.stereotype.Service;

/*
 * FIXME: ASYNC-1 — `sendConfirmation` is a synchronous, blocking call invoked from
 * the order-placement code path. The HTTP request hangs until the (simulated) email
 * is sent. Fix options:
 *
 *   • @Async + @EnableAsync on a config class — fires-and-forgets onto a thread pool
 *   • Publish an OrderPlacedEvent via ApplicationEventPublisher; an @EventListener
 *     handles it asynchronously
 *   • Spring 6.1+ `@TransactionalEventListener(phase = AFTER_COMMIT)` so the email
 *     only fires once the DB transaction actually committed
 *
 * FIXME: ASYNC-2 — `Thread.sleep` to simulate latency. With Spring Boot 4 + virtual
 * threads (see SB4-1), `Thread.sleep` no longer pins a platform thread. Good!
 *
 * FIXME: ASYNC-3 — Exceptions inside @Async methods are SILENT by default. Configure
 * an AsyncUncaughtExceptionHandler via AsyncConfigurer when you add @EnableAsync.
 *
 * FIXME: LOG-2 — Uses println for "sending" message. See LOG-1.
 */
@Service
public class EmailService {

  public void sendConfirmation(Order order) {
    try {
      Thread.sleep(2_000); // pretend SMTP is slow
    } catch (InterruptedException e) {
      // FIXME: BUG-2 — swallowing InterruptedException without restoring the
      // interrupt flag. Standard practice: Thread.currentThread().interrupt();
    }
    System.out.println("Email sent to " + order.getCustomerEmail() + " for order " + order.getId());
  }
}
