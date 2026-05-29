package com.tutorials.brokenshop.repository;

import com.tutorials.brokenshop.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}
