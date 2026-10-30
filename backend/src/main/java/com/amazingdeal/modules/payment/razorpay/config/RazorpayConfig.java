package com.amazingdeal.modules.payment.razorpay.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class RazorpayConfig {

    @Value("${app.razorpay.key-id:}")
    private String keyId;

    @Value("${app.razorpay.key-secret:}")
    private String keySecret;

    @Bean
    public RazorpayClient razorpayClient() {
        try {
            if (keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank()) {
                log.info("Initializing RazorpayClient with Key ID: {}", keyId);
                return new RazorpayClient(keyId, keySecret);
            }
        } catch (RazorpayException e) {
            log.warn("Failed to initialize RazorpayClient: {}. Fallback simulation mode enabled.", e.getMessage());
        }
        return null;
    }
}
