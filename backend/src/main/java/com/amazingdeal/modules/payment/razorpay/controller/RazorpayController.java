package com.amazingdeal.modules.payment.razorpay.controller;

import com.amazingdeal.modules.payment.razorpay.dto.RazorpayCreateOrderRequest;
import com.amazingdeal.modules.payment.razorpay.dto.RazorpayCreateOrderResponse;
import com.amazingdeal.modules.payment.razorpay.dto.RazorpayVerifyRequest;
import com.amazingdeal.modules.payment.razorpay.dto.RazorpayVerifyResponse;
import com.amazingdeal.modules.payment.razorpay.service.RazorpayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/razorpay")
@RequiredArgsConstructor
public class RazorpayController {

    private final RazorpayService razorpayService;

    @Value("${app.razorpay.key-id:rzp_test_amazingdeal2026}")
    private String keyId;

    @Value("${app.razorpay.company-name:AmazingDeal}")
    private String companyName;

    /**
     * Returns Razorpay public client configuration (Key ID, company name).
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        return ResponseEntity.ok(Map.of(
                "keyId", keyId,
                "companyName", companyName,
                "currency", "INR"
        ));
    }

    /**
     * Creates a new Razorpay checkout order.
     */
    @PostMapping("/create-order")
    public ResponseEntity<RazorpayCreateOrderResponse> createOrder(@Valid @RequestBody RazorpayCreateOrderRequest request) {
        log.info("Received Razorpay create-order request: plan={}, amount=₹{}, email={}",
                request.getPlanId(), request.getAmount(), request.getEmail());
        RazorpayCreateOrderResponse response = razorpayService.createOrder(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Authoritatively verifies Razorpay payment signature after frontend checkout success.
     */
    @PostMapping("/verify-payment")
    public ResponseEntity<RazorpayVerifyResponse> verifyPayment(@Valid @RequestBody RazorpayVerifyRequest request) {
        log.info("Received Razorpay payment verification: orderId={}, paymentId={}",
                request.getRazorpayOrderId(), request.getRazorpayPaymentId());
        RazorpayVerifyResponse response = razorpayService.verifyPayment(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Receives authoritative webhook callbacks from Razorpay.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        log.info("Received Razorpay webhook alert");
        boolean processed = razorpayService.handleWebhook(rawBody, signature);

        if (processed) {
            return ResponseEntity.ok(Map.of("status", "ok", "message", "Webhook processed successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", "error", "message", "Invalid webhook signature or payload"));
        }
    }
}
