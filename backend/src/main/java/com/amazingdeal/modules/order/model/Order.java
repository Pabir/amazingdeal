package com.amazingdeal.modules.order.model;

import com.amazingdeal.multitenancy.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_orders_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_orders_order_number", columnList = "order_number"),
    @Index(name = "idx_orders_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_phone", nullable = false, length = 20)
    private String customerPhone;

    @Column(name = "delivery_address", columnDefinition = "TEXT")
    private String deliveryAddress;

    @Builder.Default
    @Column(name = "delivery_type", nullable = false, length = 20)
    private String deliveryType = "DELIVERY"; // DELIVERY, PICKUP

    @Builder.Default
    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod = "COD"; // COD, UPI_ONLINE

    @Builder.Default
    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = "PENDING"; // PENDING, PAID, FAILED

    @Builder.Default
    @Column(name = "order_status", nullable = false, length = 30)
    private String orderStatus = "PLACED"; // PLACED, ACCEPTED, PACKED, OUT_FOR_DELIVERY, READY_FOR_PICKUP, DELIVERED, CANCELLED

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Builder.Default
    @Column(name = "delivery_charge", precision = 10, scale = 2)
    private BigDecimal deliveryCharge = BigDecimal.ZERO;

    @Column(name = "items_json", nullable = false, columnDefinition = "TEXT")
    private String itemsJson;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "upi_transaction_ref", length = 100)
    private String upiTransactionRef;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
