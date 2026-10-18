package com.amazingdeal.modules.payment.youpi.service;

import com.amazingdeal.modules.payment.UpiPaymentService;
import com.amazingdeal.modules.payment.youpi.dto.YoupiInitiateRequest;
import com.amazingdeal.modules.payment.youpi.dto.YoupiInitiateResponse;
import com.amazingdeal.modules.payment.youpi.dto.YoupiStatusResponse;
import com.amazingdeal.modules.payment.youpi.dto.YoupiWebhookPayload;
import com.amazingdeal.modules.payment.youpi.model.YoupiTransaction;
import com.amazingdeal.modules.payment.youpi.repository.YoupiTransactionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class YoupiPaymentService {

    private final YoupiTransactionRepository youpiTransactionRepository;
    private final UpiPaymentService upiPaymentService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.youpi.api-url:http://localhost:6100}")
    private String apiUrl;

    @Value("${app.youpi.merchant-id:amazingdeal-master}")
    private String merchantId;

    @Value("${app.youpi.webhook-secret:youpi-secret-key-amazingdeal-2026}")
    private String webhookSecret;

    @Value("${app.youpi.merchant-vpa:amazingdeal@okaxis}")
    private String merchantVpa;

    @Value("${app.youpi.merchant-name:AmazingDeal Platform}")
    private String merchantName;

    @Value("${app.youpi.checkout-url:http://localhost:7000}")
    private String checkoutBaseUrl;

    /**
     * Initiates a payment session with YouPI-PG.
     * Generates standard NPCI UPI URI, QR code, and attempts to register the session on YouPI gateway.
     */
    @Transactional
    public YoupiInitiateResponse initiatePayment(YoupiInitiateRequest request) {
        String orderId = "AD_YOUPI_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6);
        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.HALF_UP);

        // 1. Generate standard NPCI UPI Intent URI and QR code
        String upiUri = upiPaymentService.generateUpiUri(
                merchantVpa,
                merchantName,
                amount,
                orderId,
                orderId
        );
        String qrBase64 = upiPaymentService.generateQrCodeBase64(upiUri, 320, 320);

        String paymentId = orderId;
        String checkoutUrl = checkoutBaseUrl + "/pay/" + orderId;
        boolean gatewayOnline = false;

        // 2. Call YouPI-PG Gateway Server (if reachable)
        try {
            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(2000);
            requestFactory.setReadTimeout(3000);

            RestClient restClient = RestClient.builder()
                    .baseUrl(apiUrl)
                    .requestFactory(requestFactory)
                    .build();

            Map<String, Object> payload = new HashMap<>();
            payload.put("orderId", orderId);
            payload.put("amount", amount.toString());
            payload.put("currency", "INR");
            payload.put("customerPhone", request.getPhone());
            payload.put("returnUrl", request.getReturnUrl() != null ? request.getReturnUrl() : "");
            payload.put("metadata", Map.of(
                    "planId", request.getPlanId() != null ? request.getPlanId() : "MONTHLY",
                    "subdomain", request.getSubdomain() != null ? request.getSubdomain() : "",
                    "storeName", request.getStoreName() != null ? request.getStoreName() : ""
            ));

            String responseBody = restClient.post()
                    .uri("/api/v1/payments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("x-merchant-id", merchantId)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            if (responseBody != null) {
                JsonNode json = objectMapper.readTree(responseBody);
                if (json.has("paymentId")) {
                    paymentId = json.get("paymentId").asText();
                }
                if (json.has("checkoutUrl")) {
                    checkoutUrl = json.get("checkoutUrl").asText();
                }
                gatewayOnline = true;
                log.info("Registered payment session on YouPI gateway: orderId={}, paymentId={}", orderId, paymentId);
            }
        } catch (Exception e) {
            log.warn("YouPI Gateway server at {} not reachable: {}. Falling back to direct sovereign UPI mode.",
                    apiUrl, e.getMessage());
        }

        // 3. Persist transaction record
        YoupiTransaction transaction = YoupiTransaction.builder()
                .orderId(orderId)
                .paymentId(paymentId)
                .amount(amount)
                .currency("INR")
                .planId(request.getPlanId())
                .subdomain(request.getSubdomain())
                .storeName(request.getStoreName())
                .customerName(request.getFirstname())
                .customerEmail(request.getEmail())
                .customerPhone(request.getPhone())
                .status("PENDING")
                .upiUri(upiUri)
                .checkoutUrl(checkoutUrl)
                .build();

        youpiTransactionRepository.save(transaction);

        return YoupiInitiateResponse.builder()
                .orderId(orderId)
                .paymentId(paymentId)
                .amount(amount)
                .currency("INR")
                .planId(request.getPlanId())
                .subdomain(request.getSubdomain())
                .storeName(request.getStoreName())
                .upiUri(upiUri)
                .upiQrBase64(qrBase64)
                .merchantVpa(merchantVpa)
                .merchantName(merchantName)
                .checkoutUrl(checkoutUrl)
                .statusUrl("/api/v1/youpi/status/" + orderId)
                .status("PENDING")
                .gatewayOnline(gatewayOnline)
                .message("Scan UPI QR code or pay using any UPI app")
                .build();
    }

    /**
     * Handles incoming signed webhooks from YouPI-PG Gateway.
     */
    @Transactional
    public boolean handleWebhook(String rawBody, String signatureHeader) {
        log.info("Received YouPI webhook: signature={}", signatureHeader);

        // Verify cryptographic HMAC-SHA256 signature
        if (signatureHeader != null && !signatureHeader.isBlank()) {
            boolean valid = verifyHmacSha256(rawBody, signatureHeader, webhookSecret);
            if (!valid) {
                log.warn("YouPI webhook signature validation failed for signature: {}", signatureHeader);
                return false;
            }
        }

        try {
            YoupiWebhookPayload event = objectMapper.readValue(rawBody, YoupiWebhookPayload.class);
            String orderId = event.getOrderId();
            String paymentId = event.getPaymentId();
            String status = event.getStatus();

            Optional<YoupiTransaction> txOpt = Optional.empty();
            if (orderId != null && !orderId.isBlank()) {
                txOpt = youpiTransactionRepository.findByOrderId(orderId);
            }
            if (txOpt.isEmpty() && paymentId != null && !paymentId.isBlank()) {
                txOpt = youpiTransactionRepository.findByPaymentId(paymentId);
            }

            if (txOpt.isPresent()) {
                YoupiTransaction tx = txOpt.get();
                tx.setStatus(status != null ? status.toUpperCase() : "SUCCESS");
                if (event.getUtr() != null) {
                    tx.setUtr(event.getUtr());
                }
                tx.setRawWebhookPayload(rawBody);
                youpiTransactionRepository.save(tx);

                log.info("Updated YouPI transaction {} to status {} (UTR: {})",
                        tx.getOrderId(), tx.getStatus(), tx.getUtr());
                return true;
            } else {
                log.warn("No transaction found matching orderId: {} or paymentId: {}", orderId, paymentId);
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to parse YouPI webhook payload: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Queries payment transaction status for client polling.
     */
    @Transactional(readOnly = true)
    public YoupiStatusResponse getStatus(String orderId) {
        Optional<YoupiTransaction> txOpt = youpiTransactionRepository.findByOrderId(orderId);
        if (txOpt.isEmpty()) {
            return YoupiStatusResponse.builder()
                    .orderId(orderId)
                    .status("NOT_FOUND")
                    .verified(false)
                    .message("Order not found")
                    .build();
        }

        YoupiTransaction tx = txOpt.get();
        boolean isSuccess = "SUCCESS".equalsIgnoreCase(tx.getStatus()) || "PAID".equalsIgnoreCase(tx.getStatus());

        return YoupiStatusResponse.builder()
                .orderId(tx.getOrderId())
                .status(tx.getStatus())
                .verified(isSuccess)
                .amount(tx.getAmount())
                .utr(tx.getUtr())
                .planId(tx.getPlanId())
                .subdomain(tx.getSubdomain())
                .message(isSuccess ? "Payment verified successfully" : "Awaiting payment verification")
                .build();
    }

    /**
     * Manual verification endpoint for testing or admin manual confirmation.
     */
    @Transactional
    public YoupiStatusResponse manualVerify(String orderId, String utr) {
        YoupiTransaction tx = youpiTransactionRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found for orderId: " + orderId));

        tx.setStatus("SUCCESS");
        tx.setUtr(utr != null && !utr.isBlank() ? utr : "MANUAL_UTR_" + System.currentTimeMillis());
        youpiTransactionRepository.save(tx);

        log.info("Manually verified YouPI transaction {} with UTR {}", tx.getOrderId(), tx.getUtr());

        return YoupiStatusResponse.builder()
                .orderId(tx.getOrderId())
                .status("SUCCESS")
                .verified(true)
                .amount(tx.getAmount())
                .utr(tx.getUtr())
                .planId(tx.getPlanId())
                .subdomain(tx.getSubdomain())
                .message("Payment verified manually")
                .build();
    }

    /**
     * Cryptographic verification using HMAC-SHA256
     */
    private boolean verifyHmacSha256(String data, String signatureHeader, String secret) {
        try {
            String cleanSig = signatureHeader.replace("sha256=", "").trim();
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(secretKey);
            byte[] hashBytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String calculatedHex = hexString.toString();

            return MessageDigest.isEqual(
                    calculatedHex.getBytes(StandardCharsets.UTF_8),
                    cleanSig.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Error during HMAC-SHA256 signature verification: {}", e.getMessage());
            return false;
        }
    }
}
