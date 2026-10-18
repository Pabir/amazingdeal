package com.amazingdeal.modules.payu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayUInitiateResponse {
    private String actionUrl; // e.g. https://test.payu.in/_payment
    private String key;
    private String txnid;
    private String amount;
    private String productinfo;
    private String firstname;
    private String email;
    private String phone;
    private String surl;
    private String furl;
    private String hash;
    private String udf1; // planId
    private String udf2; // subdomain
    private String udf3; // storeName
    private String udf4;
    private String udf5;
}
