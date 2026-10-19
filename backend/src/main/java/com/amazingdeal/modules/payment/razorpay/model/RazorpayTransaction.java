package com.amazingdeal.modules.payment.razorpay.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "razorpay_transactions", indexes = {
    @Index(name = "idx_razorpay_order_id", columnList = "order_id", unique = true),
    @Index(name = "idx_razorpay_payment_id", columnList = "payment_id"),
    @Index(name = "idx_razorpay_status", columnList = "status"),
    @Index(name = "idx_razorpay_subdomain", columnList = "subdomain")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_id", nullable = false, unique = true, length = 100)
    private String orderId;

    @Column(name = "payment_id", length = 100)
    private String paymentId;

    @Column(name = "signature", length = 255)
    private String signature;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "plan_id", length = 50)
    private String planId;

    @Column(name = "subdomain", length = 100)
    private String subdomain;

    @Column(name = "store_name", length = 255)
    private String storeName;

    @Column(name = "customer_name", length = 255)
    private String customerName;

    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    @Column(name = "customer_phone", length = 30)
    private String customerPhone;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private String status = "CREATED"; // CREATED, PAID, FAILED, REFUNDED

    @Column(name = "raw_webhook_payload", columnDefinition = "TEXT")
    private String rawWebhookPayload;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
