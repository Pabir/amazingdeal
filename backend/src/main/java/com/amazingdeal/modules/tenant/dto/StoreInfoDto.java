package com.amazingdeal.modules.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreInfoDto {
    private UUID id;
    private String storeName;
    private String subdomain;
    private String storeCategory;
    private String storeAddress;
    private String ownerPhone;
    private String upiVpa;
    private Double deliveryRadiusKm;
    private BigDecimal deliveryCharge;
    private BigDecimal freeDeliveryAbove;
    private BigDecimal minOrderAmount;
    private String storeTimings;
    private String bannerUrl;
    private String logoUrl;
}
