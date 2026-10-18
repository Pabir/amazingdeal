package com.amazingdeal.modules.payment.youpi.dto;

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
public class YoupiInitiateRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Amount must be at least ₹1.00")
    private BigDecimal amount;

    private String planId; // e.g. "MONTHLY", "GROWTH", "ENTERPRISE"
    private String subdomain;
    private String storeName;

    @NotBlank(message = "Merchant firstname is required")
    private String firstname;

    @NotBlank(message = "Merchant email is required")
    private String email;

    @NotBlank(message = "Merchant phone is required")
    private String phone;

    private String returnUrl;
}
