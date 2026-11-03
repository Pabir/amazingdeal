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
public class GlobalOrderDto {
    private UUID id;
    private UUID tenantId;
    private String storeName;
    private String subdomain;
    private String orderNumber;
    private String customerName;
    private String customerPhone;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String paymentStatus;
    private String orderStatus;
    private String deliveryType;
    private Instant createdAt;
}

