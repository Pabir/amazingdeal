package com.amazingdeal.modules.payment.razorpay.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayVerifyResponse {

    private boolean verified;
    private String status; // "PAID", "FAILED"
    private String orderId;
    private String paymentId;
    private String planId;
    private String subdomain;
    private String message;
}
