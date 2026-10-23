package com.amazingdeal.modules.ai.service;

import com.amazingdeal.modules.ai.dto.ChatGptAuthUrlResponse;
import com.amazingdeal.modules.ai.dto.ChatGptCallbackRequest;
import com.amazingdeal.modules.ai.dto.ChatGptStatusResponse;
import com.amazingdeal.modules.ai.util.AesCryptoUtil;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.repository.TenantRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatGptOAuthService {

    private final TenantRepository tenantRepository;
    private final AesCryptoUtil aesCryptoUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.openai.chatgpt.client-id:oaiapp_amazingdeal_dev}")
    private String clientId;

    @Value("${app.openai.chatgpt.client-secret:}")
    private String clientSecret;

    @Value("${app.openai.chatgpt.redirect-uri:https://admin.amazingdeal.co.in/oauth/callback/chatgpt}")
    private String redirectUri;

    @Value("${app.openai.chatgpt.authorization-endpoint:https://auth.openai.com/api/accounts/authorize}")
    private String authorizationEndpoint;

    @Value("${app.openai.chatgpt.token-endpoint:https://auth.openai.com/api/accounts/oauth/token}")
    private String tokenEndpoint;

    @Value("${app.gemini.api-key:${GEMINI_API_KEY:}}")
    private String systemGeminiApiKey;

    @Value("${app.openai.api-key:${OPENAI_API_KEY:}}")
    private String systemOpenaiApiKey;

    /**
     * Generates standard OAuth 2.0 PKCE Authorization URL for "Sign in with ChatGPT".
     */
    public ChatGptAuthUrlResponse generateAuthorizationUrl(UUID tenantId) {
        try {
            // 1. Generate cryptographically random code_verifier (32 random bytes = 43 base64url chars)
            byte[] randomBytes = new byte[32];
            new SecureRandom().nextBytes(randomBytes);
            String codeVerifier = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

            // 2. Generate code_challenge = S256(code_verifier)
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
            String codeChallenge = Base64.getUrlEncoder().withoutPadding().encodeToString(hash);

            // 3. State token tied to tenant for CSRF protection
            String state = tenantId.toString() + "_" + UUID.randomUUID().toString().substring(0, 8);

            // 4. Construct Authorization URL requesting both user identity and ChatGPT plan token usage
            // Required scopes: openid profile email offline_access resource.invoke
            String url = authorizationEndpoint + "?" +
                    "client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                    "&response_type=code" +
                    "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                    "&scope=" + URLEncoder.encode("openid profile email offline_access resource.invoke", StandardCharsets.UTF_8) +
                    "&code_challenge=" + URLEncoder.encode(codeChallenge, StandardCharsets.UTF_8) +
                    "&code_challenge_method=S256" +
                    "&state=" + URLEncoder.encode(state, StandardCharsets.UTF_8);

            return ChatGptAuthUrlResponse.builder()
                    .authorizationUrl(url)
                    .state(state)
                    .codeVerifier(codeVerifier)
                    .build();
        } catch (Exception e) {
            log.error("Failed to generate ChatGPT OAuth URL: {}", e.getMessage());
            throw new RuntimeException("Could not initiate ChatGPT sign-in", e);
        }
    }

    /**
     * Exchanges OAuth authorization code with OpenAI token endpoint and binds ChatGPT subscription to merchant.
     */
    @Transactional
    public ChatGptStatusResponse handleCallback(UUID tenantId, ChatGptCallbackRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseGet(() -> createDemoTenantIfMissing(tenantId));

        String code = request.getCode().trim();

        // 1. Dev / Test / Demo simulation bypass
        if (code.startsWith("simulated_") || code.startsWith("mock_") || code.equalsIgnoreCase("TEST_SIMULATED_AUTH_CODE")) {
            log.info("Applying simulated ChatGPT Plus subscription for merchant {}", tenant.getSubdomain());
            tenant.setChatgptConnected(true);
            tenant.setChatgptAccountEmail(tenant.getOwnerEmail() != null ? tenant.getOwnerEmail() : "merchant@chatgpt.plus");
            tenant.setChatgptPlanTier("ChatGPT Plus");
            tenant.setChatgptAccessToken(aesCryptoUtil.encrypt("simulated_bearer_token_" + UUID.randomUUID()));
            tenant.setChatgptRefreshToken(aesCryptoUtil.encrypt("simulated_refresh_token_" + UUID.randomUUID()));
            tenant.setChatgptTokenExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS));
            tenantRepository.save(tenant);

            return getStatus(tenantId);
        }

        // 2. Production Token Exchange with OpenAI
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "authorization_code");
            body.add("client_id", clientId);
            if (clientSecret != null && !clientSecret.isBlank()) {
                body.add("client_secret", clientSecret);
            }
            body.add("code", code);
            body.add("redirect_uri", redirectUri);
            if (request.getCodeVerifier() != null && !request.getCodeVerifier().isBlank()) {
                body.add("code_verifier", request.getCodeVerifier().trim());
            }

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(tokenEndpoint, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode tokenJson = objectMapper.readTree(response.getBody());
                String accessToken = tokenJson.path("access_token").asText();
                String refreshToken = tokenJson.path("refresh_token").asText();
                long expiresIn = tokenJson.path("expires_in").asLong(3600);
                String idToken = tokenJson.path("id_token").asText();

                // Decode user claims from ID token
                String email = extractEmailFromIdToken(idToken, tenant.getOwnerEmail());
                String planTier = determinePlanTier(tokenJson);

                tenant.setChatgptConnected(true);
                tenant.setChatgptAccountEmail(email);
                tenant.setChatgptPlanTier(planTier);
                tenant.setChatgptAccessToken(aesCryptoUtil.encrypt(accessToken));
                if (refreshToken != null && !refreshToken.isBlank()) {
                    tenant.setChatgptRefreshToken(aesCryptoUtil.encrypt(refreshToken));
                }
                tenant.setChatgptTokenExpiresAt(Instant.now().plus(expiresIn, ChronoUnit.SECONDS));

                tenantRepository.save(tenant);
                log.info("Successfully connected ChatGPT plan ({}) for tenant {}", planTier, tenant.getSubdomain());
                return getStatus(tenantId);
            } else {
                throw new IllegalStateException("OpenAI token exchange returned status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Failed to exchange ChatGPT authorization code: {}", e.getMessage());
            throw new RuntimeException("ChatGPT account linking failed: " + e.getMessage(), e);
        }
    }

    /**
     * Binds a merchant's personal OpenAI API key (BYOK fallback for users without ChatGPT Plus).
     */
    /**
     * Sanitizes AI API keys by trimming, stripping quotes, and eliminating accidental duplicate pastes.
     */
    public static String sanitizeApiKey(String key) {
        if (key == null) return null;
        String sanitized = key.trim().replace("\"", "").replace("'", "").replaceAll("\\s+", "");
        if (sanitized.isEmpty()) return null;

        // Auto-fix accidental double-paste (e.g. key + key)
        if (sanitized.length() % 2 == 0) {
            int half = sanitized.length() / 2;
            if (sanitized.substring(0, half).equals(sanitized.substring(half))) {
                sanitized = sanitized.substring(0, half);
            }
        }
        // Auto-fix if second prefix is embedded inside the string
        int secondAq = sanitized.indexOf("AQ.", 3);
        if (secondAq > 0) {
            sanitized = sanitized.substring(0, secondAq);
        }
        int secondAiza = sanitized.indexOf("AIza", 4);
        if (secondAiza > 0) {
            sanitized = sanitized.substring(0, secondAiza);
        }
        int secondSk = sanitized.indexOf("sk-", 3);
        if (secondSk > 0) {
            sanitized = sanitized.substring(0, secondSk);
        }
        return sanitized;
    }

    @Transactional
    public ChatGptStatusResponse saveCustomApiKey(UUID tenantId, String apiKey) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseGet(() -> createDemoTenantIfMissing(tenantId));

        String sanitized = sanitizeApiKey(apiKey);
        tenant.setCustomOpenaiApiKey(sanitized != null ? aesCryptoUtil.encrypt(sanitized) : null);
        tenantRepository.saveAndFlush(tenant);
        return getStatus(tenant.getId());
    }

    /**
     * Binds a merchant's Google Gemini API key (supports Jio/Google Free Tier).
     */
    @Transactional
    public ChatGptStatusResponse saveCustomGeminiApiKey(UUID tenantId, String apiKey) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseGet(() -> createDemoTenantIfMissing(tenantId));

        String sanitized = sanitizeApiKey(apiKey);
        tenant.setCustomGeminiApiKey(sanitized != null ? aesCryptoUtil.encrypt(sanitized) : null);
        tenantRepository.saveAndFlush(tenant);

        return getStatus(tenant.getId());
    }

    /**
     * Disconnects Google Gemini API key.
     */
    @Transactional
    public ChatGptStatusResponse disconnectGemini(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseGet(() -> createDemoTenantIfMissing(tenantId));

        tenant.setCustomGeminiApiKey(null);
        tenantRepository.saveAndFlush(tenant);

        return getStatus(tenant.getId());
    }

    /**
     * Updates AI provider preference (AUTO, GEMINI, OPENAI).
     */
    @Transactional
    public ChatGptStatusResponse setAiProviderPreference(UUID tenantId, String preference) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseGet(() -> createDemoTenantIfMissing(tenantId));

        String sanitized = (preference != null && (preference.equalsIgnoreCase("GEMINI") || preference.equalsIgnoreCase("OPENAI")))
                ? preference.toUpperCase()
                : "AUTO";
        tenant.setAiProviderPreference(sanitized);
        tenantRepository.saveAndFlush(tenant);

        return getStatus(tenant.getId());
    }

    /**
     * Disconnects ChatGPT account and clears all stored OpenAI tokens.
     */
    @Transactional
    public ChatGptStatusResponse disconnect(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseGet(() -> createDemoTenantIfMissing(tenantId));

        tenant.setChatgptConnected(false);
        tenant.setChatgptAccountEmail(null);
        tenant.setChatgptPlanTier(null);
        tenant.setChatgptAccessToken(null);
        tenant.setChatgptRefreshToken(null);
        tenant.setChatgptTokenExpiresAt(null);
        tenant.setCustomOpenaiApiKey(null);

        tenantRepository.saveAndFlush(tenant);
        return getStatus(tenant.getId());
    }

    /**
     * Retrieves current AI status (OpenAI + Google Gemini) for the merchant.
     */
    @Transactional(readOnly = true)
    public ChatGptStatusResponse getStatus(UUID tenantId) {
        Optional<Tenant> tenantOpt = tenantRepository.findById(tenantId);
        if (tenantOpt.isEmpty() && (UUID.fromString("d3b07384-d113-40f4-8a1a-4d23253b2d1d").equals(tenantId) || "sharma".equalsIgnoreCase(com.amazingdeal.multitenancy.TenantContext.getSubdomain()))) {
            tenantOpt = Optional.of(createDemoTenantIfMissing(tenantId));
        }

        boolean hasSysGemini = systemGeminiApiKey != null && !systemGeminiApiKey.isBlank();
        boolean hasSysOpenAi = systemOpenaiApiKey != null && !systemOpenaiApiKey.isBlank();

        if (tenantOpt.isEmpty()) {
            return ChatGptStatusResponse.builder()
                    .connected(false)
                    .hasCustomApiKey(hasSysOpenAi)
                    .maskedApiKey(hasSysOpenAi ? "sk-platform-active" : null)
                    .hasCustomGeminiKey(hasSysGemini)
                    .maskedGeminiKey(hasSysGemini ? "AIza-platform-free" : null)
                    .aiProviderPreference("AUTO")
                    .activeProvider(hasSysGemini ? "GEMINI" : (hasSysOpenAi ? "OPENAI" : "DEMO"))
                    .connectionType(hasSysGemini ? "GEMINI_API_KEY" : (hasSysOpenAi ? "CUSTOM_API_KEY" : "DISCONNECTED"))
                    .build();
        }

        Tenant tenant = tenantOpt.get();
        boolean connected = Boolean.TRUE.equals(tenant.getChatgptConnected());
        boolean hasTenantKey = tenant.getCustomOpenaiApiKey() != null && !tenant.getCustomOpenaiApiKey().isBlank();
        boolean hasCustomKey = hasTenantKey || hasSysOpenAi;
        boolean hasTenantGeminiKey = tenant.getCustomGeminiApiKey() != null && !tenant.getCustomGeminiApiKey().isBlank();
        boolean hasCustomGeminiKey = hasTenantGeminiKey || hasSysGemini;

        String maskedKey = null;
        if (hasTenantKey) {
            try {
                String plain = sanitizeApiKey(aesCryptoUtil.decrypt(tenant.getCustomOpenaiApiKey()));
                if (plain != null && plain.length() > 8) {
                    maskedKey = plain.substring(0, 7) + "..." + plain.substring(plain.length() - 4);
                } else {
                    maskedKey = "sk-...active";
                }
            } catch (Exception ignored) {}
        } else if (hasSysOpenAi) {
            maskedKey = "sk-platform-active";
        }

        String maskedGeminiKey = null;
        if (hasTenantGeminiKey) {
            try {
                String plain = sanitizeApiKey(aesCryptoUtil.decrypt(tenant.getCustomGeminiApiKey()));
                if (plain != null && plain.length() > 8) {
                    maskedGeminiKey = plain.substring(0, 6) + "..." + plain.substring(plain.length() - 4);
                } else {
                    maskedGeminiKey = "AIza...active";
                }
            } catch (Exception ignored) {}
        } else if (hasSysGemini) {
            maskedGeminiKey = "AIza-platform-free";
        }

        String pref = tenant.getAiProviderPreference() != null ? tenant.getAiProviderPreference() : "AUTO";

        String activeProvider;
        if ("GEMINI".equalsIgnoreCase(pref) && hasCustomGeminiKey) {
            activeProvider = "GEMINI";
        } else if ("OPENAI".equalsIgnoreCase(pref) && (hasCustomKey || connected)) {
            activeProvider = "OPENAI";
        } else {
            // AUTO: Prefer Gemini if present (free tier!), else OpenAI
            if (hasCustomGeminiKey) {
                activeProvider = "GEMINI";
            } else if (hasCustomKey || connected) {
                activeProvider = "OPENAI";
            } else {
                activeProvider = "DEMO";
            }
        }

        String connectionType;
        if (hasCustomGeminiKey && (hasCustomKey || connected)) {
            connectionType = "GEMINI_AND_OPENAI";
        } else if (hasCustomGeminiKey) {
            connectionType = "GEMINI_API_KEY";
        } else if (connected) {
            connectionType = "CHATGPT_SUBSCRIPTION";
        } else if (hasCustomKey) {
            connectionType = "CUSTOM_API_KEY";
        } else {
            connectionType = "DISCONNECTED";
        }

        return ChatGptStatusResponse.builder()
                .connected(connected)
                .accountEmail(tenant.getChatgptAccountEmail())
                .planTier(tenant.getChatgptPlanTier() != null ? tenant.getChatgptPlanTier() : "ChatGPT Plus")
                .expiresAt(tenant.getChatgptTokenExpiresAt())
                .hasCustomApiKey(hasCustomKey)
                .maskedApiKey(maskedKey)
                .hasCustomGeminiKey(hasCustomGeminiKey)
                .maskedGeminiKey(maskedGeminiKey)
                .aiProviderPreference(pref)
                .activeProvider(activeProvider)
                .connectionType(connectionType)
                .build();
    }

    /**
     * Retrieves decrypted active Bearer token for OpenAI, automatically refreshing if needed.
     */
    public String getActiveBearerToken(Tenant tenant) {
        // 1. Check ChatGPT Subscription Access Token
        if (tenant != null && Boolean.TRUE.equals(tenant.getChatgptConnected()) && tenant.getChatgptAccessToken() != null) {
            return aesCryptoUtil.decrypt(tenant.getChatgptAccessToken());
        }

        // 2. Fallback to Tenant Custom API Key
        if (tenant != null && tenant.getCustomOpenaiApiKey() != null && !tenant.getCustomOpenaiApiKey().isBlank()) {
            return sanitizeApiKey(aesCryptoUtil.decrypt(tenant.getCustomOpenaiApiKey()));
        }

        // 3. Fallback to Platform System Key
        if (systemOpenaiApiKey != null && !systemOpenaiApiKey.isBlank()) {
            return sanitizeApiKey(systemOpenaiApiKey);
        }

        return null;
    }

    /**
     * Retrieves decrypted Google Gemini API key.
     */
    public String getActiveGeminiApiKey(Tenant tenant) {
        if (tenant != null && tenant.getCustomGeminiApiKey() != null && !tenant.getCustomGeminiApiKey().isBlank()) {
            return sanitizeApiKey(aesCryptoUtil.decrypt(tenant.getCustomGeminiApiKey()));
        }
        if (systemGeminiApiKey != null && !systemGeminiApiKey.isBlank()) {
            return sanitizeApiKey(systemGeminiApiKey);
        }
        return null;
    }

    private String extractEmailFromIdToken(String idToken, String fallback) {
        if (idToken == null || !idToken.contains(".")) return fallback;
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length >= 2) {
                String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                JsonNode node = objectMapper.readTree(payloadJson);
                if (node.has("email")) return node.get("email").asText();
                if (node.has("preferred_username")) return node.get("preferred_username").asText();
            }
        } catch (Exception ignored) {}
        return fallback;
    }

    private String determinePlanTier(JsonNode tokenJson) {
        if (tokenJson.has("plan")) {
            return tokenJson.get("plan").asText();
        }
        if (tokenJson.has("subscription_tier")) {
            return tokenJson.get("subscription_tier").asText();
        }
        return "ChatGPT Plus";
    }

    private Tenant createDemoTenantIfMissing(UUID tenantId) {
        return tenantRepository.findById(tenantId).orElseGet(() -> {
            Optional<Tenant> existingSub = tenantRepository.findBySubdomainIgnoreCase("sharma");
            if (existingSub.isPresent()) {
                return existingSub.get();
            }
            Tenant demo = Tenant.builder()
                    .id(tenantId)
                    .storeName("Sharma General Store")
                    .subdomain("sharma")
                    .ownerEmail("sharma@amazingdeal.co.in")
                    .ownerPhone("9876543210")
                    .passwordHash("$2a$10$demoHashPlaceholder")
                    .status("ACTIVE")
                    .storeCategory("Groceries")
                    .build();
            return tenantRepository.saveAndFlush(demo);
        });
    }
}
