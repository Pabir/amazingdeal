package com.amazingdeal.modules.payment.youpi.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class YoupiWebhookPayload {

    private String orderId;
    private String paymentId;
    private String status; // SUCCESS, FAILED, EXPIRED, CANCELLED
    private BigDecimal amount;
    private String currency;
    private String utr;
    private String timestamp;
    private Map<String, Object> metadata;
}
