package com.amazingdeal.modules.order.repository;

import com.amazingdeal.modules.order.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    Page<Order> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    List<Order> findByTenantIdAndOrderStatusOrderByCreatedAtDesc(UUID tenantId, String orderStatus);

    Optional<Order> findByIdAndTenantId(UUID id, UUID tenantId);
    Optional<Order> findByTenantIdAndOrderNumber(UUID tenantId, String orderNumber);
    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    List<Order> findByTenantIdAndCustomerIdOrderByCreatedAtDesc(UUID tenantId, UUID customerId);

    long countByTenantId(UUID tenantId);
    long countByTenantIdAndOrderStatus(UUID tenantId, String orderStatus);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.tenantId = :tenantId AND o.orderStatus <> 'CANCELLED'")
    BigDecimal calculateTotalRevenue(UUID tenantId);
}
