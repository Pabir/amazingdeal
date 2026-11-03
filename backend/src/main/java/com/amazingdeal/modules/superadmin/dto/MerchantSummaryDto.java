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
public class MerchantSummaryDto {
    private UUID id;
    private String storeName;
    private String subdomain;
    private String customDomain;
    private String ownerPhone;
    private String ownerEmail;
    private String status;
    private String storeCategory;
    private String storeAddress;
    private String gstin;
    private String stateCode;
    private String subscriptionPlan;
    private Instant subscriptionExpiresAt;
    private String upiVpa;
    private Boolean razorpayByokEnabled;
    private Instant createdAt;

    // Aggregates
    private long productCount;
    private long orderCount;
    private BigDecimal totalRevenue;
}

