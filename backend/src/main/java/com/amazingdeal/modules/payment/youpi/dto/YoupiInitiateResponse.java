package com.amazingdeal.modules.payment.youpi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class YoupiInitiateResponse {

    private String orderId;
    private String paymentId;
    private BigDecimal amount;
    private String currency;
    private String planId;
    private String subdomain;
    private String storeName;

    // Direct UPI parameters
    private String upiUri;
    private String upiQrBase64;
    private String merchantVpa;
    private String merchantName;

    // YouPI Gateway URLs
    private String checkoutUrl;
    private String statusUrl;

    @Builder.Default
    private String status = "PENDING"; // PENDING, SUCCESS, FAILED, EXPIRED

    private boolean gatewayOnline;
    private String message;
}
