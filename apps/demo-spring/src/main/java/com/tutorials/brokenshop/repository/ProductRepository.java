package com.tutorials.brokenshop.repository;

import com.tutorials.brokenshop.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/*
 * FIXME: REPO-1 — Repository returns entities directly into a controller (see ProductController).
 * For READ-heavy endpoints, project to a DTO via:
 *
 *   public interface ProductRepository extends JpaRepository<Product, Long> {
 *     <T> List<T> findBy(Class<T> projectionType);    // Spring Data interface projection
 *   }
 *
 * FIXME: REPO-2 — No @EntityGraph anywhere. Add one for the "show product with reviews"
 * use case to bypass the LAZY default with a single JOIN FETCH.
 *
 *   @EntityGraph(attributePaths = "reviews")
 *   List<Product> findAll();
 *
 * FIXME: REPO-3 — No pagination. findAll() on a real DB returns the whole table.
 * Use Page<Product> findAll(Pageable pageable) and accept a Pageable param in the controller.
 */
public interface ProductRepository extends JpaRepository<Product, Long> {

  // FIXME: REPO-4 — derived query that does case-sensitive contains. Most apps want
  // case-insensitive search. Switch to findByNameContainingIgnoreCase, or use
  // @Query with LOWER(name) LIKE LOWER(:q).
  List<Product> findByNameContaining(String name);
}
