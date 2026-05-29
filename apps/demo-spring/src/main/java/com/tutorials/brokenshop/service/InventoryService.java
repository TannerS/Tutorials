package com.tutorials.brokenshop.service;

import com.tutorials.brokenshop.model.Product;

/*
 * FIXME: DI-3 — Not annotated with @Service. Combined with `new InventoryService()`
 * in OrderService (DI-2), Spring has no visibility into this class. Annotate, then
 * inject via constructor.
 *
 * FIXME: PATTERN-2 — Logic should validate stock BEFORE mutating. Currently it
 * happily takes stock negative.
 */
public class InventoryService {

  public void decrementStock(Product product, int qty) {
    product.setStock(product.getStock() - qty);
  }
}
