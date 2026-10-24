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

    // Payment Gateway & Receive options
    private String paymentModesJson;
    private String customUpiQrUrl;
    private Boolean razorpayByokEnabled;
    private String razorpayKeyId;
    private Boolean cashfreeByokEnabled;
    private String cashfreeAppId;
    private Boolean codEnabled;
    private BigDecimal codExtraCharge;
    private BigDecimal codMinAmount;
    private BigDecimal codMaxAmount;
    private Boolean codOtpRequired;

    // Delivery & Logistics options
    private String deliveryModesJson;
    private String allowedPincodesText;
    private String distanceTiersJson;
    private String deliveryTimeSlotsJson;
    private Boolean expressDeliveryEnabled;
    private Integer expressDeliveryMinutes;
    private BigDecimal expressDeliveryFee;
    private Boolean shiprocketEnabled;
    private String shiprocketPricingRule;
    private BigDecimal shiprocketFlatFee;
    private BigDecimal shiprocketFreeAbove;
}
