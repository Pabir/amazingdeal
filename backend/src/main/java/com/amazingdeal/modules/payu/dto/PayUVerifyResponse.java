package com.amazingdeal.modules.payu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayUVerifyResponse {
    private boolean verified;
    private String status;
    private String txnid;
    private String planId;
    private String subdomain;
    private String message;
}
