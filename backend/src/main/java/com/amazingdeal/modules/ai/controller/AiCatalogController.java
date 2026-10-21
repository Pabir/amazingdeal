package com.amazingdeal.modules.ai.controller;

import com.amazingdeal.modules.ai.dto.*;
import com.amazingdeal.modules.ai.service.AiCatalogGeneratorService;
import com.amazingdeal.modules.ai.service.ChatGptOAuthService;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.repository.TenantRepository;
import com.amazingdeal.multitenancy.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/ai")
@RequiredArgsConstructor
public class AiCatalogController {

    private final ChatGptOAuthService chatGptOAuthService;
    private final AiCatalogGeneratorService aiCatalogGeneratorService;
    private final TenantRepository tenantRepository;

    /**
     * Step 1: Generates OpenAI OAuth 2.0 PKCE Authorization URL for "Sign in with ChatGPT".
     */
    @GetMapping("/chatgpt/auth-url")
    public ResponseEntity<ChatGptAuthUrlResponse> getChatGptAuthUrl() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ChatGptAuthUrlResponse response = chatGptOAuthService.generateAuthorizationUrl(tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Step 2: Callback exchange when merchant authorizes their ChatGPT account.
     */
    @PostMapping("/chatgpt/callback")
    public ResponseEntity<ChatGptStatusResponse> handleChatGptCallback(@Valid @RequestBody ChatGptCallbackRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ChatGptStatusResponse response = chatGptOAuthService.handleCallback(tenantId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves current ChatGPT plan connection & AI integration status.
     */
    @GetMapping("/chatgpt/status")
    public ResponseEntity<ChatGptStatusResponse> getChatGptStatus() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ChatGptStatusResponse status = chatGptOAuthService.getStatus(tenantId);
        return ResponseEntity.ok(status);
    }

    /**
     * Disconnects linked ChatGPT plan or removes stored API key.
     */
    @PostMapping("/chatgpt/disconnect")
    public ResponseEntity<ChatGptStatusResponse> disconnectChatGpt() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ChatGptStatusResponse status = chatGptOAuthService.disconnect(tenantId);
        return ResponseEntity.ok(status);
    }

    /**
     * Saves merchant's personal OpenAI API Key (BYOK alternative for users without ChatGPT Plus).
     */
    @PostMapping("/chatgpt/custom-api-key")
    public ResponseEntity<ChatGptStatusResponse> saveCustomApiKey(@Valid @RequestBody CustomApiKeyRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ChatGptStatusResponse status = chatGptOAuthService.saveCustomApiKey(tenantId, request.getApiKey());
        return ResponseEntity.ok(status);
    }

    /**
     * Generates an attractive, structured e-commerce product catalog draft from an uploaded photo
     * powered directly by the merchant's connected ChatGPT subscription (zero platform token cost).
     */
    @PostMapping("/generate-product")
    public ResponseEntity<?> generateProductFromPhoto(@RequestBody GenerateProductFromImageRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized tenant context"));
        }

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        try {
            GeneratedProductResponse response = aiCatalogGeneratorService.generateProductFromImage(tenant, request);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", e.getMessage(),
                    "needsConnection", true
            ));
        } catch (Exception e) {
            log.error("Failed to generate AI product from image: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to analyze image: " + e.getMessage()
            ));
        }
    }
}
