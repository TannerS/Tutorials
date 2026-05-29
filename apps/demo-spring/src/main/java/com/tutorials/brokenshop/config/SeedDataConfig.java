package com.tutorials.brokenshop.config;

import com.tutorials.brokenshop.model.Product;
import com.tutorials.brokenshop.model.Review;
import com.tutorials.brokenshop.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

/*
 * FIXME: SEED-1 — Seeding via CommandLineRunner runs every boot, including production.
 * Either guard with @Profile("dev") or use src/main/resources/data.sql, or — best —
 * proper migrations via Flyway/Liquibase.
 */
@Configuration
public class SeedDataConfig {

  @Bean
  CommandLineRunner seed(ProductRepository products) {
    return args -> {
      if (products.count() > 0) return;

      Product mug = new Product("Coffee Mug", new BigDecimal("12.99"), 100);
      mug.setDescription("Ceramic, 12oz");
      Review r1 = new Review();
      r1.setProduct(mug);
      r1.setRating(5);
      r1.setComment("Holds coffee well");
      mug.setReviews(List.of(r1));

      Product hoodie = new Product("Dev Hoodie", new BigDecimal("49.00"), 25);
      hoodie.setDescription("Definitely the comfy kind");

      Product stickers = new Product("Sticker Pack", new BigDecimal("4.50"), 500);
      stickers.setDescription("10 random stickers");

      products.saveAll(List.of(mug, hoodie, stickers));
    };
  }
}
