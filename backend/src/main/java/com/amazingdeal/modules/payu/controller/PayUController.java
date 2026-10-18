package com.amazingdeal.modules.payu.controller;

import com.amazingdeal.modules.payu.dto.PayUInitiateRequest;
import com.amazingdeal.modules.payu.dto.PayUInitiateResponse;
import com.amazingdeal.modules.payu.dto.PayUVerifyRequest;
import com.amazingdeal.modules.payu.dto.PayUVerifyResponse;
import com.amazingdeal.modules.payu.service.PayUService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/payu")
@RequiredArgsConstructor
public class PayUController {

    private final PayUService payUService;

    @Value("${app.payu.surl:https://amazingdeal-storefront.drskpabirulislam1995.workers.dev}")
    private String storefrontReturnUrl;

    @PostMapping("/initiate")
    public ResponseEntity<PayUInitiateResponse> initiate(@Valid @RequestBody PayUInitiateRequest request) {
        PayUInitiateResponse response = payUService.initiatePayment(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<PayUVerifyResponse> verify(@RequestBody PayUVerifyRequest request) {
        PayUVerifyResponse response = payUService.verifyPayment(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Handles PayU form POST redirect callback (surl / furl)
     */
    @PostMapping("/callback")
    public void handlePayUCallback(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Map<String, String> params = new HashMap<>();
        Enumeration<String> parameterNames = request.getParameterNames();
        while (parameterNames.hasMoreElements()) {
            String paramName = parameterNames.nextElement();
            params.put(paramName, request.getParameter(paramName));
        }

        String status = params.getOrDefault("status", "failure");
        String txnid = params.getOrDefault("txnid", "");
        String amount = params.getOrDefault("amount", "");
        String planId = params.getOrDefault("udf1", "MONTHLY");
        String subdomain = params.getOrDefault("udf2", "");
        String hash = params.getOrDefault("hash", "");

        log.info("Received PayU callback: status={}, txnid={}, plan={}, subdomain={}", status, txnid, planId, subdomain);

        // Redirect back to storefront onboarding with parameters
        StringBuilder redirectUrl = new StringBuilder();
        if (storefrontReturnUrl.contains("/payu-callback")) {
            redirectUrl.append(storefrontReturnUrl.replace("/payu-callback", ""));
        } else {
            redirectUrl.append(storefrontReturnUrl);
        }

        redirectUrl.append("?payu_status=").append(URLEncoder.encode(status, StandardCharsets.UTF_8))
                .append("&txnid=").append(URLEncoder.encode(txnid, StandardCharsets.UTF_8))
                .append("&amount=").append(URLEncoder.encode(amount, StandardCharsets.UTF_8))
                .append("&plan=").append(URLEncoder.encode(planId, StandardCharsets.UTF_8))
                .append("&subdomain=").append(URLEncoder.encode(subdomain, StandardCharsets.UTF_8))
                .append("&hash=").append(URLEncoder.encode(hash, StandardCharsets.UTF_8));

        response.sendRedirect(redirectUrl.toString());
    }
}
