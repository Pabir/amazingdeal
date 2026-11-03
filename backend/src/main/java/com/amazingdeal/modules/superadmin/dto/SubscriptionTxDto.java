package com.amazingdeal.modules.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionTxDto {
    private UUID id;
    private String orderId;
    private String paymentId;
    private BigDecimal amount;
    private String currency;
    private String planId;
    private String subdomain;
    private String status;
    private Instant createdAt;
}

