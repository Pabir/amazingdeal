package com.amazingdeal.modules.payu.dto;

import jakarta.validation.constraints.Email;
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
public class PayUInitiateRequest {

    @NotBlank(message = "Plan ID is required (MONTHLY, QUARTERLY, YEARLY)")
    private String planId;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @NotBlank(message = "First name is required")
    private String firstname;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String subdomain; // target store subdomain / slug
    private String storeName;
}
