package com.amazingdeal.modules.payu.service;

import com.amazingdeal.modules.payu.dto.PayUInitiateRequest;
import com.amazingdeal.modules.payu.dto.PayUInitiateResponse;
import com.amazingdeal.modules.payu.dto.PayUVerifyRequest;
import com.amazingdeal.modules.payu.dto.PayUVerifyResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

@Slf4j
@Service
public class PayUService {

    @Value("${app.payu.key:uiw0jf}")
    private String key;

    @Value("${app.payu.salt:saPx7EYtKYEEgOuBSjyoVvrncKIjZ2LJ}")
    private String salt;

    @Value("${app.payu.mode:test}")
    private String mode;

    @Value("${app.payu.surl:https://amazingdeal-storefront.drskpabirulislam1995.workers.dev/payu-callback}")
    private String surl;

    @Value("${app.payu.furl:https://amazingdeal-storefront.drskpabirulislam1995.workers.dev/payu-callback}")
    private String furl;

    private static final String TEST_PAYMENT_URL = "https://test.payu.in/_payment";
    private static final String SECURE_PAYMENT_URL = "https://secure.payu.in/_payment";

    public PayUInitiateResponse initiatePayment(PayUInitiateRequest request) {
        String txnid = "AD_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
        String formattedAmount = request.getAmount().setScale(2, RoundingMode.HALF_UP).toString();
        String productInfo = "AmazingDeal Store Creation - " + request.getPlanId() + " Plan";

        String firstname = request.getFirstname().trim();
        String email = request.getEmail().trim().toLowerCase();
        String phone = request.getPhone().trim();
        String udf1 = request.getPlanId() != null ? request.getPlanId().trim().toUpperCase() : "MONTHLY";
        String udf2 = request.getSubdomain() != null ? request.getSubdomain().trim().toLowerCase() : "";
        String udf3 = request.getStoreName() != null ? request.getStoreName().trim() : "";
        String udf4 = "";
        String udf5 = "";

        // Sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
        String hashString = String.format("%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s||||||%s",
                key, txnid, formattedAmount, productInfo, firstname, email, udf1, udf2, udf3, udf4, udf5, salt);

        String hash = sha512(hashString);
        String actionUrl = ("secure".equalsIgnoreCase(mode) || "production".equalsIgnoreCase(mode))
                ? SECURE_PAYMENT_URL
                : TEST_PAYMENT_URL;

        log.info("Initiated PayU payment for txnid: {}, plan: {}, amount: {}, mode: {}", txnid, udf1, formattedAmount, mode);

        return PayUInitiateResponse.builder()
                .actionUrl(actionUrl)
                .key(key)
                .txnid(txnid)
                .amount(formattedAmount)
                .productinfo(productInfo)
                .firstname(firstname)
                .email(email)
                .phone(phone)
                .surl(surl)
                .furl(furl)
                .hash(hash)
                .udf1(udf1)
                .udf2(udf2)
                .udf3(udf3)
                .udf4(udf4)
                .udf5(udf5)
                .build();
    }

    public PayUVerifyResponse verifyPayment(PayUVerifyRequest request) {
        String status = request.getStatus();
        String txnid = request.getTxnid();
        String amount = request.getAmount();
        String productinfo = request.getProductinfo();
        String firstname = request.getFirstname();
        String email = request.getEmail();
        String udf1 = request.getUdf1() != null ? request.getUdf1() : "";
        String udf2 = request.getUdf2() != null ? request.getUdf2() : "";
        String udf3 = request.getUdf3() != null ? request.getUdf3() : "";
        String udf4 = request.getUdf4() != null ? request.getUdf4() : "";
        String udf5 = request.getUdf5() != null ? request.getUdf5() : "";
        String receivedHash = request.getHash();
        String additionalCharges = request.getAdditionalCharges();

        // Reverse hash sequence:
        // [additionalCharges|]salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
        String hashString;
        if (additionalCharges != null && !additionalCharges.isBlank()) {
            hashString = String.format("%s|%s|%s||||||%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s",
                    additionalCharges, salt, status, udf5, udf4, udf3, udf2, udf1, email, firstname, productinfo, amount, txnid, key);
        } else {
            hashString = String.format("%s|%s||||||%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s",
                    salt, status, udf5, udf4, udf3, udf2, udf1, email, firstname, productinfo, amount, txnid, key);
        }

        String calculatedHash = sha512(hashString);
        boolean hashMatches = calculatedHash.equalsIgnoreCase(receivedHash);
        boolean isSuccess = "success".equalsIgnoreCase(status);

        log.info("PayU verification: txnid={}, status={}, hashMatches={}", txnid, status, hashMatches);

        if (!hashMatches) {
            log.warn("PayU hash mismatch! received={}, calculated={}", receivedHash, calculatedHash);
            return PayUVerifyResponse.builder()
                    .verified(false)
                    .status(status)
                    .txnid(txnid)
                    .planId(udf1)
                    .subdomain(udf2)
                    .message("Security hash validation failed")
                    .build();
        }

        return PayUVerifyResponse.builder()
                .verified(isSuccess)
                .status(status)
                .txnid(txnid)
                .planId(udf1)
                .subdomain(udf2)
                .message(isSuccess ? "Payment verified successfully" : "Payment failed or cancelled")
                .build();
    }

    private String sha512(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-512");
            byte[] hashBytes = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString().toLowerCase();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-512 algorithm not found", e);
        }
    }
}
