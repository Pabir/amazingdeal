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

    @Value("${app.payu.frontend-url:${app.payu.surl:https://amazingdeal-storefront.drskpabirulislam1995.workers.dev}}")
    private String defaultStorefrontUrl;

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
     * Handles PayU form POST or GET redirect callback (surl / furl)
     */
    @RequestMapping(value = "/callback", method = {RequestMethod.POST, RequestMethod.GET})
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
        String storeName = params.getOrDefault("udf3", "");
        String clientOrigin = params.getOrDefault("udf4", "");
        String hash = params.getOrDefault("hash", "");

        log.info("Received PayU callback: status={}, txnid={}, plan={}, subdomain={}, origin={}",
                status, txnid, planId, subdomain, clientOrigin);

        // Determine destination storefront URL (prefer client origin passed during initiate)
        String targetBase = (clientOrigin != null && !clientOrigin.isBlank())
                ? clientOrigin.trim()
                : defaultStorefrontUrl;

        // Clean up redundant /payu-callback or trailing slash if present
        if (targetBase.contains("/payu-callback")) {
            targetBase = targetBase.replace("/payu-callback", "");
        }
        if (targetBase.endsWith("/")) {
            targetBase = targetBase.substring(0, targetBase.length() - 1);
        }

        StringBuilder redirectUrl = new StringBuilder(targetBase);
        redirectUrl.append("/?payu_status=").append(URLEncoder.encode(status, StandardCharsets.UTF_8))
                .append("&txnid=").append(URLEncoder.encode(txnid, StandardCharsets.UTF_8))
                .append("&amount=").append(URLEncoder.encode(amount, StandardCharsets.UTF_8))
                .append("&plan=").append(URLEncoder.encode(planId, StandardCharsets.UTF_8))
                .append("&subdomain=").append(URLEncoder.encode(subdomain, StandardCharsets.UTF_8))
                .append("&storeName=").append(URLEncoder.encode(storeName, StandardCharsets.UTF_8))
                .append("&hash=").append(URLEncoder.encode(hash, StandardCharsets.UTF_8));

        log.info("Redirecting browser to storefront: {}", redirectUrl);
        response.sendRedirect(redirectUrl.toString());
    }
}
