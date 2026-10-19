package com.amazingdeal.modules.payment.razorpay.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayCreateOrderResponse {

    private String orderId; // Razorpay Order ID (e.g., "order_EKwxwAgItmmXdp")
    private String keyId; // Razorpay Key ID for client checkout initialization
    private Long amountInPaise; // e.g., 49900 for ₹499.00
    private BigDecimal amountInRupees; // 499.00
    private String currency; // "INR"
    private String planId;
    private String subdomain;
    private String storeName;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String companyName;
}
