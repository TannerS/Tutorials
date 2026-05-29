package com.tutorials.brokenshop.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.NoSuchElementException;

/*
 * FIXME: ERR-3 — This handler returns a String body. Spring Boot 4 / Spring 6 ships
 * with **ProblemDetail** (RFC 7807) as the standard error response format. Rewrite as:
 *
 *   @ExceptionHandler(ProductNotFoundException.class)
 *   ProblemDetail handle(ProductNotFoundException ex) {
 *     ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
 *     pd.setType(URI.create("https://brokenshop/errors/product-not-found"));
 *     pd.setProperty("productId", ex.getProductId());
 *     return pd;
 *   }
 *
 * FIXME: ERR-4 — Catching a JDK exception (NoSuchElementException) for a domain
 * concept ("product not found"). Define ProductNotFoundException and throw it from
 * the service. NoSuchElementException is "an iterator ran out", which is the wrong
 * abstraction.
 *
 * FIXME: ERR-5 — No handler for MethodArgumentNotValidException (validation errors)
 * or HttpMessageNotReadableException (bad JSON). Without them, validation errors
 * return generic 400s.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(NoSuchElementException.class)
  public ResponseEntity<String> handleNotFound(NoSuchElementException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found: " + ex.getMessage());
  }

  // FIXME: ERR-6 — catching Exception swallows everything. Production gets opaque 500s
  // with no logging. At minimum log; ideally, only catch specific exceptions and let
  // Spring's default handler deal with the rest.
  @ExceptionHandler(Exception.class)
  public ResponseEntity<String> handleAll(Exception ex) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Something went wrong");
  }
}
