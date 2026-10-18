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
public class YoupiStatusResponse {

    private String orderId;
    private String status; // PENDING, SUCCESS, FAILED, EXPIRED
    private boolean verified;
    private BigDecimal amount;
    private String utr;
    private String planId;
    private String subdomain;
    private String message;
}
