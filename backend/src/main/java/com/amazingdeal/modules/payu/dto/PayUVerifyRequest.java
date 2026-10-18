package com.amazingdeal.modules.payu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayUVerifyRequest {
    private String txnid;
    private String status;
    private String amount;
    private String productinfo;
    private String firstname;
    private String email;
    private String hash;
    private String udf1;
    private String udf2;
    private String udf3;
    private String udf4;
    private String udf5;
    private String additionalCharges;
    private Map<String, String> rawParams;
}
