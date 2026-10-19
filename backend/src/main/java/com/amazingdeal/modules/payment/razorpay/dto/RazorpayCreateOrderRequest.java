package com.amazingdeal.modules.payment.razorpay.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayCreateOrderRequest {

    @NotBlank(message = "Plan ID is required")
    private String planId; // MONTHLY, QUARTERLY, YEARLY

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Amount must be at least ₹1.00")
    private BigDecimal amount;

    @Builder.Default
    private String currency = "INR";

    @NotBlank(message = "First name is required")
    private String firstname;

    private String email;

    private String phone;

    private String subdomain;

    private String storeName;
}
