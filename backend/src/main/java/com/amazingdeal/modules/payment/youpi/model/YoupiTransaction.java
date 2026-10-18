package com.amazingdeal.modules.payment.youpi.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "youpi_transactions", indexes = {
    @Index(name = "idx_youpi_order_id", columnList = "order_id", unique = true),
    @Index(name = "idx_youpi_status", columnList = "status"),
    @Index(name = "idx_youpi_utr", columnList = "utr")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YoupiTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_id", nullable = false, unique = true, length = 100)
    private String orderId;

    @Column(name = "payment_id", length = 100)
    private String paymentId;

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
    private String status = "PENDING"; // PENDING, SUCCESS, FAILED, EXPIRED, CANCELLED

    @Column(name = "utr", length = 100)
    private String utr;

    @Column(name = "upi_uri", columnDefinition = "TEXT")
    private String upiUri;

    @Column(name = "checkout_url", length = 500)
    private String checkoutUrl;

    @Column(name = "raw_webhook_payload", columnDefinition = "TEXT")
    private String rawWebhookPayload;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
