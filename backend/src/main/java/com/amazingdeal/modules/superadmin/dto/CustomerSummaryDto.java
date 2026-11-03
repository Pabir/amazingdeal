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
public class CustomerSummaryDto {
    private UUID id;
    private String firebaseUid;
    private String fullName;
    private String phone;
    private String email;
    private String avatarUrl;
    private String authProvider;
    private String status;
    private Instant createdAt;

    // Aggregates
    private long orderCount;
    private BigDecimal totalSpend;
}

