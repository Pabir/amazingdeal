package com.amazingdeal.modules.payment.youpi.controller;

import com.amazingdeal.modules.payment.youpi.dto.YoupiInitiateRequest;
import com.amazingdeal.modules.payment.youpi.dto.YoupiInitiateResponse;
import com.amazingdeal.modules.payment.youpi.dto.YoupiStatusResponse;
import com.amazingdeal.modules.payment.youpi.service.YoupiPaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/youpi")
@RequiredArgsConstructor
public class YoupiController {

    private final YoupiPaymentService youpiPaymentService;

    /**
     * Initiates a YouPI dynamic UPI checkout session.
     */
    @PostMapping("/initiate")
    public ResponseEntity<YoupiInitiateResponse> initiate(@Valid @RequestBody YoupiInitiateRequest request) {
        log.info("Initiating YouPI payment for plan: {}, amount: ₹{}, merchant: {}",
                request.getPlanId(), request.getAmount(), request.getEmail());
        YoupiInitiateResponse response = youpiPaymentService.initiatePayment(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Receives authoritative webhook alerts from YouPI-PG Gateway.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "x-gateway-signature", required = false) String signature
    ) {
        log.info("Received YouPI webhook callback");
        boolean processed = youpiPaymentService.handleWebhook(rawBody, signature);

        if (processed) {
            return ResponseEntity.ok(Map.of("received", true, "status", "processed"));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("received", false, "error", "Invalid signature or transaction not found"));
        }
    }

    /**
     * Polling endpoint for frontend to check live payment completion.
     */
    @GetMapping("/status/{orderId}")
    public ResponseEntity<YoupiStatusResponse> getStatus(@PathVariable("orderId") String orderId) {
        YoupiStatusResponse response = youpiPaymentService.getStatus(orderId);
        return ResponseEntity.ok(response);
    }

    /**
     * Test & manual verification bypass endpoint.
     */
    @PostMapping("/manual-verify")
    public ResponseEntity<YoupiStatusResponse> manualVerify(@RequestBody Map<String, String> body) {
        String orderId = body.get("orderId");
        String utr = body.getOrDefault("utr", "MANUAL_UTR_" + System.currentTimeMillis());
        if (orderId == null || orderId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        YoupiStatusResponse response = youpiPaymentService.manualVerify(orderId, utr);
        return ResponseEntity.ok(response);
    }
}
