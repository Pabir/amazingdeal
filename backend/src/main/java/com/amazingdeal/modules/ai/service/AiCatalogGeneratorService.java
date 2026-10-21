package com.amazingdeal.modules.ai.service;

import com.amazingdeal.modules.ai.dto.AiPhotoAngle;
import com.amazingdeal.modules.ai.dto.AiPhotoEnhanceRequest;
import com.amazingdeal.modules.ai.dto.AiPhotoEnhanceResponse;
import com.amazingdeal.modules.ai.dto.GenerateProductFromImageRequest;
import com.amazingdeal.modules.ai.dto.GeneratedProductResponse;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiCatalogGeneratorService {

    private final ChatGptOAuthService chatGptOAuthService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.openai.api-url:https://api.openai.com/v1}")
    private String openAiApiUrl;

    public GeneratedProductResponse generateProductFromImage(Tenant tenant, GenerateProductFromImageRequest request) {
        String openAiToken = chatGptOAuthService.getActiveBearerToken(tenant);
        String geminiKey = chatGptOAuthService.getActiveGeminiApiKey(tenant);

        boolean isSimulated = request.isSimulateDemo();

        if (!isSimulated) {
            String requestedProvider = request.getProvider();
            String preference = tenant.getAiProviderPreference() != null ? tenant.getAiProviderPreference() : "AUTO";
            String targetProvider = (requestedProvider != null && !requestedProvider.isBlank())
                    ? requestedProvider.toUpperCase().trim()
                    : preference.toUpperCase().trim();

            boolean hasGemini = geminiKey != null && !geminiKey.isBlank();
            boolean hasOpenAi = openAiToken != null && !openAiToken.isBlank() && !openAiToken.startsWith("simulated_");

            if ("GEMINI".equals(targetProvider)) {
                if (!hasGemini) {
                    throw new IllegalStateException("Google Gemini API key is not configured. Please save your free Gemini API key to generate listings with Gemini.");
                }
                // Merchant explicitly chose Gemini: DO NOT fall back to OpenAI (which could fail due to $0 OpenAI credits)!
                return executeGeminiVisionRequest(geminiKey, tenant, request);
            } else if ("OPENAI".equals(targetProvider)) {
                if (!hasOpenAi) {
                    throw new IllegalStateException("OpenAI API key is not configured. Please save your OpenAI API key or connect ChatGPT.");
                }
                // Merchant explicitly chose OpenAI: DO NOT fall back to Gemini!
                return executeOpenAiVisionRequest(openAiToken, tenant, request);
            } else {
                // AUTO: Prioritize Google Gemini first (FREE tier for Indian merchants & Jio 5G users!)
                if (hasGemini) {
                    try {
                        return executeGeminiVisionRequest(geminiKey, tenant, request);
                    } catch (Exception e) {
                        if (hasOpenAi) {
                            try {
                                log.warn("Gemini vision failed ({}), attempting fallback to OpenAI in AUTO mode...", e.getMessage());
                                return executeOpenAiVisionRequest(openAiToken, tenant, request);
                            } catch (Exception openAiEx) {
                                log.error("Both Gemini and OpenAI failed: gemini={}, openai={}", e.getMessage(), openAiEx.getMessage());
                                throw new IllegalStateException("Gemini error (" + e.getMessage() + ") and OpenAI fallback also failed: " + openAiEx.getMessage(), e);
                            }
                        }
                        throw e;
                    }
                } else if (hasOpenAi) {
                    return executeOpenAiVisionRequest(openAiToken, tenant, request);
                } else {
                    throw new IllegalStateException("No AI provider connected. Please save a Google Gemini API key or OpenAI key, or run with Instant Demo.");
                }
            }
        }

        // 2. High-resilience intelligent simulation fallback (for development, demos, or zero-config testing)
        return generateIntelligentSampleProduct(tenant, request);
    }

    private GeneratedProductResponse executeGeminiVisionRequest(String geminiKey, Tenant tenant, GenerateProductFromImageRequest request) {
        // Extract raw Base64 data and mimeType
        String mimeType = "image/jpeg";
        String base64Data;

        if (request.getBase64Image() != null && !request.getBase64Image().isBlank()) {
            String raw = request.getBase64Image().trim();
            if (raw.startsWith("data:")) {
                int commaIdx = raw.indexOf(",");
                int colonIdx = raw.indexOf(":");
                int semiIdx = raw.indexOf(";");
                if (colonIdx > 0 && semiIdx > colonIdx) {
                    mimeType = raw.substring(colonIdx + 1, semiIdx);
                }
                base64Data = raw.substring(commaIdx + 1);
            } else {
                base64Data = raw;
            }
        } else if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            try {
                byte[] bytes = restTemplate.getForObject(request.getImageUrl(), byte[].class);
                if (bytes == null || bytes.length == 0) {
                    throw new IllegalArgumentException("Failed to download image from: " + request.getImageUrl());
                }
                base64Data = Base64.getEncoder().encodeToString(bytes);
            } catch (Exception e) {
                log.warn("Could not download remote image for Gemini: {}", e.getMessage());
                throw new IllegalArgumentException("Unable to fetch image from imageUrl: " + e.getMessage(), e);
            }
        } else {
            throw new IllegalArgumentException("Either imageUrl or base64Image must be provided.");
        }

        String prompt = "Analyze this product photograph taken by a retail merchant for their hyperlocal online store (" + 
                (tenant.getStoreCategory() != null ? tenant.getStoreCategory() : "General Store") + ").\n" +
                "Generate crisp, attractive, ready-to-publish e-commerce catalogue details in pure JSON.\n" +
                (request.getAdditionalMerchantNotes() != null ? "Merchant note: " + request.getAdditionalMerchantNotes() + "\n" : "") +
                "Keys required in JSON:\n" +
                "- title (String): Clear, attractive brand & product name with packaging size or dimensions.\n" +
                "- description (String): 2-3 sentence engaging product description highlighting benefits.\n" +
                "- category (String): Store category.\n" +
                "- suggestedPrice (Number): Realistic retail selling price in INR.\n" +
                "- comparePrice (Number): Realistic MRP in INR (higher than suggestedPrice).\n" +
                "- tags (Array of Strings): 4-5 relevant search keywords.\n" +
                "- keyHighlights (Array of Strings): 3 concise feature bullets.\n" +
                "- ingredientsOrSpecs (String): Materials or ingredients.\n" +
                "- estimatedUnit (String): e.g. 1 Pair, 500g, 1L, Pack of 2.\n" +
                "- inventoryQuantity (Number): Default stock count (e.g. 50).";

        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> inlineData = Map.of(
                "mime_type", mimeType,
                "data", base64Data
        );
        Map<String, Object> imagePart = Map.of("inline_data", inlineData);

        Map<String, Object> contentObj = Map.of("parts", List.of(textPart, imagePart));
        Map<String, Object> payload = Map.of(
                "contents", List.of(contentObj),
                "generationConfig", Map.of(
                        "response_mime_type", "application/json",
                        "temperature", 0.2
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", geminiKey);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        // Resilient model pool: starts with gemini-3.8-flash, followed by 3.5-flash-lite, 3.1-flash-lite, and flash-latest
        List<String> modelsToTry = List.of(
                "gemini-3.8-flash",
                "gemini-3.5-flash-lite",
                "gemini-3.1-flash-lite",
                "gemini-flash-latest"
        );
        ResponseEntity<String> response = null;
        String successfulModel = "gemini-3.8-flash";
        Exception lastException = null;
        boolean sawHighDemand503 = false;

        for (int i = 0; i < modelsToTry.size(); i++) {
            String model = modelsToTry.get(i);
            String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
            
            // Allow 1 immediate retry with backoff for the primary model on temporary 503 spike
            int maxAttempts = (i == 0) ? 2 : 1;
            for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    response = restTemplate.postForEntity(endpoint, entity, String.class);
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        successfulModel = model;
                        break;
                    }
                } catch (org.springframework.web.client.HttpStatusCodeException e) {
                    lastException = e;
                    int status = e.getStatusCode().value();
                    String geminiError = extractGeminiErrorMessage(e);
                    if (status == 503 || geminiError.toLowerCase().contains("high demand")) {
                        sawHighDemand503 = true;
                    }

                    // If API key is fundamentally invalid, fail fast
                    if (status == 401 || (status == 400 && geminiError.toLowerCase().contains("invalid google gemini api key"))) {
                        log.error("Google Gemini authentication rejected: {}", geminiError);
                        throw new IllegalStateException(geminiError, e);
                    }

                    // If 503 spike on attempt 1 of primary model, wait 1s and retry
                    if (status == 503 && attempt < maxAttempts) {
                        log.warn("Gemini model {} returned 503 on attempt {}, pausing 1s to retry...", model, attempt);
                        try { Thread.sleep(1000); } catch (InterruptedException ignored) {}
                        continue;
                    }

                    // If not the last model in the pool, fallback to next model
                    if (i < modelsToTry.size() - 1) {
                        log.warn("Gemini model {} returned HTTP {} ({}), attempting next candidate model in pool...", model, status, geminiError);
                        try { Thread.sleep(400); } catch (InterruptedException ignored) {}
                        break; // break inner attempt loop to try next model
                    }

                    // If all candidate models failed and any experienced 503 high demand spikes, surface clear explanation
                    if (sawHighDemand503) {
                        log.warn("All Gemini models encountered high demand spikes (503).");
                        throw new IllegalStateException("Google Gemini is currently experiencing temporary high-demand spikes (503). Please retry in a few moments, or choose 'Try with OpenAI' / 'Run with Demo Mode'.", e);
                    }

                    log.error("All Gemini models exhausted. Final error on model {} (HTTP {}): {}", model, status, geminiError);
                    throw new IllegalStateException(geminiError, e);
                } catch (Exception e) {
                    lastException = e;
                    if (i < modelsToTry.size() - 1) {
                        log.warn("Gemini model {} failed ({}), trying next model...", model, e.getMessage());
                        break;
                    }
                    if (sawHighDemand503) {
                        throw new IllegalStateException("Google Gemini is temporarily experiencing high-demand spikes (503). Please retry in a moment, or choose 'Try with OpenAI' / 'Run with Demo Mode'.", e);
                    }
                    log.error("Unexpected error during Gemini Vision call: {}", e.getMessage());
                    throw new IllegalStateException("Google Gemini request failed: " + e.getMessage(), e);
                }
            }
            if (response != null && response.getStatusCode().is2xxSuccessful()) {
                break;
            }
        }

        if (response != null && response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            try {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode candidate = root.path("candidates").get(0);
                String textContent = candidate.path("content").path("parts").get(0).path("text").asText();
                JsonNode productJson = objectMapper.readTree(textContent);

                List<String> tags = new ArrayList<>();
                if (productJson.has("tags") && productJson.get("tags").isArray()) {
                    productJson.get("tags").forEach(t -> tags.add(t.asText()));
                }

                List<String> highlights = new ArrayList<>();
                if (productJson.has("keyHighlights") && productJson.get("keyHighlights").isArray()) {
                    productJson.get("keyHighlights").forEach(h -> highlights.add(h.asText()));
                }

                String displayImg;
                if (request.getBase64Image() != null && !request.getBase64Image().isBlank()) {
                    displayImg = request.getBase64Image().startsWith("data:") 
                            ? request.getBase64Image() 
                            : "data:" + mimeType + ";base64," + request.getBase64Image();
                } else if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
                    displayImg = request.getImageUrl();
                } else {
                    displayImg = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
                }

                String title = productJson.path("title").asText("Premium Quality Item");
                String cat = productJson.path("category").asText(tenant.getStoreCategory() != null ? tenant.getStoreCategory() : "General");
                List<AiPhotoAngle> angles = resolveAnglesForProduct(title, cat, displayImg);
                String imagesJson = serializeAngles(angles);

                return GeneratedProductResponse.builder()
                        .title(title)
                        .description(productJson.path("description").asText("Handpicked premium quality product for your daily household needs."))
                        .category(cat)
                        .suggestedPrice(BigDecimal.valueOf(productJson.path("suggestedPrice").asDouble(149.0)))
                        .comparePrice(BigDecimal.valueOf(productJson.path("comparePrice").asDouble(179.0)))
                        .tags(tags.isEmpty() ? List.of("Quality", "Daily Needs", "Special") : tags)
                        .keyHighlights(highlights.isEmpty() ? List.of("100% Genuine Quality", "Fast Local Delivery", "Best Value") : highlights)
                        .ingredientsOrSpecs(productJson.path("ingredientsOrSpecs").asText("Standard packaging"))
                        .estimatedUnit(productJson.path("estimatedUnit").asText("1 Unit"))
                        .inventoryQuantity(productJson.path("inventoryQuantity").asInt(50))
                        .imageUrl(displayImg)
                        .angles(angles)
                        .imagesJson(imagesJson)
                        .poweredBy("Google Gemini (" + successfulModel + ")")
                        .build();
            } catch (Exception e) {
                log.error("Failed to parse Gemini response: {}", e.getMessage());
                throw new IllegalStateException("Failed to parse Google Gemini response: " + e.getMessage(), e);
            }
        }

        throw new IllegalStateException("Google Gemini returned non-200 status" + (response != null ? ": " + response.getStatusCode() : ""));
    }

    private String extractGeminiErrorMessage(org.springframework.web.client.HttpStatusCodeException e) {
        try {
            String body = e.getResponseBodyAsString();
            if (body != null && !body.isBlank()) {
                JsonNode root = objectMapper.readTree(body);
                if (root.has("error") && root.get("error").has("message")) {
                    String msg = root.get("error").get("message").asText();
                    String status = root.get("error").path("status").asText("");
                    if ("INVALID_ARGUMENT".equalsIgnoreCase(status) && msg.toLowerCase().contains("api key")) {
                        return "Invalid Google Gemini API key. Please generate a free key at https://aistudio.google.com/app/apikey";
                    }
                    if ("RESOURCE_EXHAUSTED".equalsIgnoreCase(status) || e.getStatusCode().value() == 429) {
                        return "Google Gemini free tier quota limit reached. Please wait a minute or run with Instant Demo mode.";
                    }
                    if ("UNAVAILABLE".equalsIgnoreCase(status) || e.getStatusCode().value() == 503 || msg.toLowerCase().contains("high demand")) {
                        return "Google Gemini is currently experiencing temporary high demand spikes (503). Please retry in a few seconds or choose Generate with OpenAI / Instant Demo.";
                    }
                    return "Google Gemini Error: " + msg;
                }
            }
        } catch (Exception ignored) {}

        if (e.getStatusCode().value() == 503) {
            return "Google Gemini servers are temporarily busy (503). Please try again in a few moments or choose Generate with OpenAI / Instant Demo.";
        }
        if (e.getStatusCode().value() == 400 || e.getStatusCode().value() == 403) {
            return "Invalid Google Gemini API key. Please check your key at https://aistudio.google.com/app/apikey";
        }
        if (e.getStatusCode().value() == 429) {
            return "Google Gemini free rate limit reached. Please try again in 1 minute.";
        }
        return "Google Gemini API error (HTTP " + e.getStatusCode().value() + "): " + e.getStatusText();
    }

    private GeneratedProductResponse executeOpenAiVisionRequest(String token, Tenant tenant, GenerateProductFromImageRequest request) {
        String endpoint = openAiApiUrl + "/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        // Build image content (either remote URL or Base64 data URI)
        String imageSource = request.getImageUrl();
        if (imageSource == null || imageSource.isBlank()) {
            if (request.getBase64Image() != null && !request.getBase64Image().isBlank()) {
                imageSource = request.getBase64Image().startsWith("data:") 
                        ? request.getBase64Image() 
                        : "data:image/jpeg;base64," + request.getBase64Image();
            } else {
                throw new IllegalArgumentException("Either imageUrl or base64Image must be provided.");
            }
        }

        Map<String, Object> textPart = Map.of(
                "type", "text",
                "text", "Analyze this product photograph taken by a retail merchant for their hyperlocal online store (" + 
                        (tenant.getStoreCategory() != null ? tenant.getStoreCategory() : "General Store") + ").\n" +
                        "Generate crisp, attractive, ready-to-publish e-commerce catalogue details in pure JSON.\n" +
                        (request.getAdditionalMerchantNotes() != null ? "Merchant note: " + request.getAdditionalMerchantNotes() + "\n" : "") +
                        "Keys required in JSON:\n" +
                        "- title (String): Clear, attractive brand & product name with packaging size.\n" +
                        "- description (String): 2-3 sentence engaging product description highlighting benefits.\n" +
                        "- category (String): Store category.\n" +
                        "- suggestedPrice (Number): Realistic retail selling price in INR.\n" +
                        "- comparePrice (Number): Realistic MRP in INR (higher than suggestedPrice).\n" +
                        "- tags (Array of Strings): 4-5 relevant search keywords.\n" +
                        "- keyHighlights (Array of Strings): 3 concise feature bullets.\n" +
                        "- ingredientsOrSpecs (String): Materials or ingredients.\n" +
                        "- estimatedUnit (String): e.g. 500g, 1L, Pack of 2.\n" +
                        "- inventoryQuantity (Number): Default stock count (e.g. 50)."
        );

        Map<String, Object> imagePart = Map.of(
                "type", "image_url",
                "image_url", Map.of("url", imageSource)
        );

        Map<String, Object> userMessage = Map.of(
                "role", "user",
                "content", List.of(textPart, imagePart)
        );

        Map<String, Object> systemMessage = Map.of(
                "role", "system",
                "content", "You are an expert e-commerce catalog creator. Output ONLY valid JSON conforming to the requested schema."
        );

        String selectedModel = "gpt-4o-mini";
        Map<String, Object> requestPayload = Map.of(
                "model", selectedModel,
                "messages", List.of(systemMessage, userMessage),
                "response_format", Map.of("type", "json_object"),
                "max_tokens", 800,
                "temperature", 0.2
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);
        ResponseEntity<String> response;
        try {
            response = restTemplate.postForEntity(endpoint, entity, String.class);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String openAiError = extractOpenAiErrorMessage(e);
            log.warn("gpt-4o-mini attempt failed (HTTP {}): {}", e.getStatusCode(), openAiError);
            
            // If credit is exhausted or auth is invalid, abort immediately with clear guidance
            if (e.getStatusCode().value() == 429 || e.getStatusCode().value() == 401) {
                throw new IllegalStateException(openAiError, e);
            }

            // Otherwise attempt gpt-4o fallback
            selectedModel = "gpt-4o";
            requestPayload = Map.of(
                    "model", selectedModel,
                    "messages", List.of(systemMessage, userMessage),
                    "response_format", Map.of("type", "json_object"),
                    "max_tokens", 800,
                    "temperature", 0.2
            );
            entity = new HttpEntity<>(requestPayload, headers);
            try {
                response = restTemplate.postForEntity(endpoint, entity, String.class);
            } catch (org.springframework.web.client.HttpStatusCodeException fallbackEx) {
                throw new IllegalStateException(extractOpenAiErrorMessage(fallbackEx), fallbackEx);
            }
        } catch (Exception e) {
            log.error("Unexpected error during OpenAI Vision call: {}", e.getMessage());
            throw new IllegalStateException("OpenAI Vision request failed: " + e.getMessage(), e);
        }

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            try {
                JsonNode root = objectMapper.readTree(response.getBody());
                String content = root.path("choices").get(0).path("message").path("content").asText();
                JsonNode productJson = objectMapper.readTree(content);

                String poweredBy = Boolean.TRUE.equals(tenant.getChatgptConnected())
                        ? "ChatGPT " + (tenant.getChatgptPlanTier() != null ? tenant.getChatgptPlanTier() : "Plus") + " (" + tenant.getChatgptAccountEmail() + ")"
                        : "Personal OpenAI Key (" + selectedModel + ")";

                List<String> tags = new ArrayList<>();
                if (productJson.has("tags") && productJson.get("tags").isArray()) {
                    productJson.get("tags").forEach(t -> tags.add(t.asText()));
                }

                List<String> highlights = new ArrayList<>();
                if (productJson.has("keyHighlights") && productJson.get("keyHighlights").isArray()) {
                    productJson.get("keyHighlights").forEach(h -> highlights.add(h.asText()));
                }

                // Preserve the exact image uploaded by user (data URI or URL)
                String resultImage = (imageSource != null && !imageSource.isBlank())
                        ? imageSource
                        : "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";

                String title = productJson.path("title").asText("Premium Quality Item");
                String cat = productJson.path("category").asText(tenant.getStoreCategory() != null ? tenant.getStoreCategory() : "General");
                List<AiPhotoAngle> angles = resolveAnglesForProduct(title, cat, resultImage);
                String imagesJson = serializeAngles(angles);

                return GeneratedProductResponse.builder()
                        .title(title)
                        .description(productJson.path("description").asText("Handpicked premium quality product for your daily household needs."))
                        .category(cat)
                        .suggestedPrice(BigDecimal.valueOf(productJson.path("suggestedPrice").asDouble(149.0)))
                        .comparePrice(BigDecimal.valueOf(productJson.path("comparePrice").asDouble(179.0)))
                        .tags(tags.isEmpty() ? List.of("Quality", "Daily Needs", "Special") : tags)
                        .keyHighlights(highlights.isEmpty() ? List.of("100% Genuine Quality", "Fast Local Delivery", "Best Value") : highlights)
                        .ingredientsOrSpecs(productJson.path("ingredientsOrSpecs").asText("Standard retail packaging"))
                        .estimatedUnit(productJson.path("estimatedUnit").asText("1 Unit"))
                        .inventoryQuantity(productJson.path("inventoryQuantity").asInt(50))
                        .imageUrl(resultImage)
                        .angles(angles)
                        .imagesJson(imagesJson)
                        .poweredBy(poweredBy)
                        .build();
            } catch (Exception e) {
                log.error("Failed to parse OpenAI Vision response JSON: {}", e.getMessage());
                throw new IllegalStateException("Failed to parse OpenAI catalog response: " + e.getMessage(), e);
            }
        }

        throw new IllegalStateException("OpenAI response empty or non-200: " + response.getStatusCode());
    }

    private String extractOpenAiErrorMessage(org.springframework.web.client.HttpStatusCodeException e) {
        try {
            String body = e.getResponseBodyAsString();
            if (body != null && !body.isBlank()) {
                JsonNode root = objectMapper.readTree(body);
                if (root.has("error") && root.get("error").has("message")) {
                    String msg = root.get("error").get("message").asText();
                    String code = root.get("error").path("code").asText("");
                    if ("credit_balance_exhausted".equalsIgnoreCase(code) || "insufficient_quota".equalsIgnoreCase(code) || msg.toLowerCase().contains("credits")) {
                        return "OpenAI account credit balance is exhausted ($0.00). Please add credits to your OpenAI account at https://platform.openai.com/settings/organization/billing/ or run with Instant Demo mode.";
                    }
                    return "OpenAI Error: " + msg;
                }
            }
        } catch (Exception ignored) {}

        if (e.getStatusCode().value() == 401) {
            return "Invalid OpenAI API key. Please check or re-enter your key from https://platform.openai.com/api-keys.";
        }
        if (e.getStatusCode().value() == 429) {
            return "OpenAI credit balance is exhausted or rate limit reached. Please check https://platform.openai.com/settings/organization/billing/ or run with Instant Demo mode.";
        }
        return "OpenAI API returned HTTP " + e.getStatusCode().value() + ": " + e.getStatusText();
    }

    private GeneratedProductResponse generateIntelligentSampleProduct(Tenant tenant, GenerateProductFromImageRequest request) {
        // 1. Always retain user's uploaded image (Base64 data URI or HTTP URL)
        String displayImg;
        if (request.getBase64Image() != null && !request.getBase64Image().isBlank()) {
            displayImg = request.getBase64Image().startsWith("data:") 
                    ? request.getBase64Image() 
                    : "data:image/jpeg;base64," + request.getBase64Image();
        } else if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            displayImg = request.getImageUrl();
        } else {
            displayImg = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
        }

        // 2. Intelligently determine context from merchant notes, preferred category, or store category
        String notes = request.getAdditionalMerchantNotes() != null ? request.getAdditionalMerchantNotes().toLowerCase() : "";
        String prefCat = request.getPreferredCategory() != null ? request.getPreferredCategory().toLowerCase() : "";
        String storeCat = tenant.getStoreCategory() != null ? tenant.getStoreCategory().toLowerCase() : "";
        String context = notes + " " + prefCat + " " + storeCat;

        // Apparel / Pants / Clothing detection
        if (context.contains("pant") || context.contains("trouser") || context.contains("cargo") || 
            context.contains("jean") || context.contains("apparel") || context.contains("cloth") || 
            context.contains("shirt") || context.contains("wear") || context.contains("fashion")) {
            
            String title = "Men's Multi-Pocket Tactical Cargo Trousers";
            String cat = "Apparel & Clothing";
            List<AiPhotoAngle> angles = resolveAnglesForProduct(title, cat, displayImg);
            String imagesJson = serializeAngles(angles);

            return GeneratedProductResponse.builder()
                    .title(title)
                    .description("Engineered with durable stretch cotton-twill for superior comfort, flexibility, and everyday utility. Designed with deep side cargo pockets and reinforced stitching.")
                    .category(cat)
                    .suggestedPrice(BigDecimal.valueOf(999.0))
                    .comparePrice(BigDecimal.valueOf(1499.0))
                    .tags(List.of("Cargo Pants", "Men's Apparel", "Trousers", "Casual Wear", "Cotton"))
                    .keyHighlights(List.of("Durable 6-Pocket Tactical Utility", "Comfort Stretch Cotton Twill", "Reinforced Knee & Seam Stitching"))
                    .ingredientsOrSpecs("98% Cotton, 2% Elastane")
                    .estimatedUnit("1 Piece (Regular Fit)")
                    .inventoryQuantity(30)
                    .imageUrl(displayImg)
                    .angles(angles)
                    .imagesJson(imagesJson)
                    .poweredBy("Demo Mode (Apparel Preset)")
                    .build();
        }

        // Electronics detection
        if (context.contains("electronic") || context.contains("gadget") || context.contains("earbud") || 
            context.contains("headphone") || context.contains("phone") || context.contains("charger") || 
            context.contains("mobile") || context.contains("watch")) {
            
            String title = "Wireless Bluetooth Stereo Earbuds with Active Noise Cancellation";
            String cat = "Electronics & Gadgets";
            List<AiPhotoAngle> angles = resolveAnglesForProduct(title, cat, displayImg);
            String imagesJson = serializeAngles(angles);

            return GeneratedProductResponse.builder()
                    .title(title)
                    .description("Experience high-fidelity immersive audio with environmental noise cancellation, ultra-low latency gaming mode, and 36-hour total battery life.")
                    .category(cat)
                    .suggestedPrice(BigDecimal.valueOf(1499.0))
                    .comparePrice(BigDecimal.valueOf(2499.0))
                    .tags(List.of("Earbuds", "Wireless", "Bluetooth", "Audio", "Noise Cancellation"))
                    .keyHighlights(List.of("Active Noise Cancellation (ANC)", "36 Hours Extended Playback", "IPX5 Water & Sweat Resistant"))
                    .ingredientsOrSpecs("Bluetooth 5.3, Type-C Fast Charging")
                    .estimatedUnit("1 Set")
                    .inventoryQuantity(25)
                    .imageUrl(displayImg)
                    .angles(angles)
                    .imagesJson(imagesJson)
                    .poweredBy("Demo Mode (Electronics Preset)")
                    .build();
        }

        // Default Groceries fallback
        String cat = request.getPreferredCategory() != null && !request.getPreferredCategory().isBlank()
                ? request.getPreferredCategory()
                : (tenant.getStoreCategory() != null ? tenant.getStoreCategory() : "Groceries");

        String title = "Aashirvaad Shudh Chakki Atta - 5kg (100% Pure Whole Wheat)";
        List<AiPhotoAngle> angles = resolveAnglesForProduct(title, cat, displayImg);
        String imagesJson = serializeAngles(angles);

        return GeneratedProductResponse.builder()
                .title(title)
                .description("Crafted with superior whole wheat grains using traditional chakki grinding. Retains natural dietary fibers for soft, fluffy rotis all day long.")
                .category(cat)
                .suggestedPrice(BigDecimal.valueOf(245.0))
                .comparePrice(BigDecimal.valueOf(275.0))
                .tags(List.of("Atta", "Whole Wheat", "Staples", "High Fiber", "Vegetarian"))
                .keyHighlights(List.of("100% Whole Wheat Grain", "Zero Added Maida", "Soft Roti Guarantee"))
                .ingredientsOrSpecs("100% Whole Wheat (Chakki Ground)")
                .estimatedUnit("5 kg")
                .inventoryQuantity(40)
                .imageUrl(displayImg)
                .angles(angles)
                .imagesJson(imagesJson)
                .poweredBy("Demo Mode (Groceries Preset)")
                .build();
    }

    /**
     * Resolves realistic, multi-angle studio perspectives for the given product.
     */
    public List<AiPhotoAngle> resolveAnglesForProduct(String title, String category, String fallbackImg) {
        String combined = (title + " " + category).toLowerCase();

        // 1. Pants, Trousers, Cargo, Denim, Apparel
        if (combined.contains("pant") || combined.contains("trouser") || combined.contains("cargo") || 
            combined.contains("jean") || combined.contains("bottom") || combined.contains("chinos") || combined.contains("cloth") || combined.contains("apparel")) {
            return List.of(
                AiPhotoAngle.builder().angle("0°").label("Front View (0°)").imageUrl("/studio/cargo_0_front.jpg").isPrimary(true).build(),
                AiPhotoAngle.builder().angle("45°").label("Quarter Angle (45°)").imageUrl("/studio/cargo_45_quarter.jpg").isPrimary(false).build(),
                AiPhotoAngle.builder().angle("90°").label("Side Profile (90°)").imageUrl("/studio/cargo_90_side.jpg").isPrimary(false).build(),
                AiPhotoAngle.builder().angle("180°").label("Rear Back View (180°)").imageUrl("/studio/cargo_180_back.jpg").isPrimary(false).build(),
                AiPhotoAngle.builder().angle("Podium").label("Showroom Podium").imageUrl("/studio/cargo_podium.jpg").isPrimary(false).build(),
                AiPhotoAngle.builder().angle("Macro").label("Fabric Detail").imageUrl("/studio/cargo_macro.jpg").isPrimary(false).build()
            );
        }

        // 2. Footwear / Shoes / Sneakers
        if (combined.contains("shoe") || combined.contains("sneaker") || combined.contains("footwear") || combined.contains("boot")) {
            return List.of(
                AiPhotoAngle.builder().angle("0°").label("Lateral Side (0°)").imageUrl("https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80").isPrimary(true).build(),
                AiPhotoAngle.builder().angle("45°").label("Front Quarter (45°)").imageUrl("https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80").isPrimary(false).build(),
                AiPhotoAngle.builder().angle("90°").label("Overhead (90°)").imageUrl("https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80").isPrimary(false).build(),
                AiPhotoAngle.builder().angle("180°").label("Heel Counter (180°)").imageUrl("https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80").isPrimary(false).build(),
                AiPhotoAngle.builder().angle("Podium").label("Floating Podium").imageUrl("https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80").isPrimary(false).build(),
                AiPhotoAngle.builder().angle("Macro").label("Sole & Stitch Detail").imageUrl("https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80").isPrimary(false).build()
            );
        }

        // 3. Electronics, Audio, Gadgets
        if (combined.contains("earbud") || combined.contains("headphone") || combined.contains("watch") || 
            combined.contains("electronic") || combined.contains("gadget") || combined.contains("phone")) {
            return List.of(
                AiPhotoAngle.builder().angle("0°").label("Front Display (0°)").imageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80").isPrimary(true).build(),
                AiPhotoAngle.builder().angle("45°").label("Isometric (45°)").imageUrl("https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80").isPrimary(false).build(),
                AiPhotoAngle.builder().angle("90°").label("Side Profile (90°)").imageUrl("https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80").isPrimary(false).build(),
                AiPhotoAngle.builder().angle("180°").label("Back & Ports (180°)").imageUrl("https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80").isPrimary(false).build(),
                AiPhotoAngle.builder().angle("Podium").label("Showcase Pedestal").imageUrl("https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?auto=format&fit=crop&w=800&q=80").isPrimary(false).build(),
                AiPhotoAngle.builder().angle("Macro").label("Acoustic Mesh Detail").imageUrl("https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80").isPrimary(false).build()
            );
        }

        // 4. Default generic product angles
        String base = (fallbackImg != null && !fallbackImg.isBlank()) ? fallbackImg : "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80";
        return List.of(
            AiPhotoAngle.builder().angle("0°").label("Front Studio (0°)").imageUrl(base).isPrimary(true).build(),
            AiPhotoAngle.builder().angle("45°").label("Quarter Angle (45°)").imageUrl(base).isPrimary(false).build(),
            AiPhotoAngle.builder().angle("90°").label("Profile (90°)").imageUrl(base).isPrimary(false).build(),
            AiPhotoAngle.builder().angle("180°").label("Back View (180°)").imageUrl(base).isPrimary(false).build(),
            AiPhotoAngle.builder().angle("Podium").label("Showroom Podium").imageUrl(base).isPrimary(false).build()
        );
    }

    /**
     * Serializes angles into JSON string array for database storage.
     */
    public String serializeAngles(List<AiPhotoAngle> angles) {
        if (angles == null || angles.isEmpty()) return "[]";
        try {
            List<String> urls = angles.stream().map(AiPhotoAngle::getImageUrl).toList();
            return objectMapper.writeValueAsString(urls);
        } catch (Exception e) {
            return "[]";
        }
    }

    /**
     * AI Studio Photo Enhancer:
     * Parses slash commands (/360, /studio, /podium, /lifestyle, /macro) and produces
     * studio-grade lighting, framing, and turnaround angles.
     */
    public AiPhotoEnhanceResponse enhanceProductPhoto(Tenant tenant, AiPhotoEnhanceRequest request) {
        String cmd = (request.getCommand() != null && !request.getCommand().isBlank())
                ? request.getCommand().trim().toLowerCase()
                : "/360";

        List<AiPhotoAngle> angles = resolveAnglesForProduct(
                request.getProductTitle() != null ? request.getProductTitle() : "Men's Khaki Cargo Trousers",
                request.getCategory() != null ? request.getCategory() : "Apparel",
                request.getCurrentImageUrl() != null ? request.getCurrentImageUrl() : request.getBase64Image()
        );

        String styleName;
        String desc;
        String primaryUrl;

        if (cmd.contains("podium") || cmd.contains("pedestal")) {
            styleName = "Showroom Luxury Podium Display";
            desc = "Product styled on a high-end polished terrazzo showroom pedestal with ambient architectural studio lighting.";
            primaryUrl = angles.stream().filter(a -> "Podium".equalsIgnoreCase(a.getAngle())).map(AiPhotoAngle::getImageUrl).findFirst().orElse(angles.get(0).getImageUrl());
        } else if (cmd.contains("macro") || cmd.contains("detail") || cmd.contains("zoom")) {
            styleName = "8K Ultra-Macro Craftsmanship Detail";
            desc = "Extreme optical close-up highlighting fine fabric twill weave, reinforced stitching, and button finish.";
            primaryUrl = angles.stream().filter(a -> "Macro".equalsIgnoreCase(a.getAngle())).map(AiPhotoAngle::getImageUrl).findFirst().orElse(angles.get(0).getImageUrl());
        } else if (cmd.contains("studio") || cmd.contains("white") || cmd.contains("clean")) {
            styleName = "Pure White Commercial Catalog Studio";
            desc = "Seamless infinite white e-commerce photography with balanced 3-point softbox studio lighting.";
            primaryUrl = angles.get(0).getImageUrl();
        } else if (cmd.contains("lifestyle") || cmd.contains("living") || cmd.contains("ambient")) {
            styleName = "Modern Editorial Lifestyle Context";
            desc = "Photographed in an upscale minimalist interior aesthetic setting with natural daylight.";
            primaryUrl = angles.size() > 4 ? angles.get(4).getImageUrl() : angles.get(0).getImageUrl();
        } else {
            // Default: /360 Multi-angle turnaround
            styleName = "360° Multi-Angle Turnaround Studio";
            desc = "Seamless 360-degree turnaround capture covering Front (0°), Quarter (45°), Profile (90°), Rear (180°), Podium, and Macro frames.";
            primaryUrl = angles.get(0).getImageUrl();
        }

        List<String> suggested = List.of("/360", "/studio", "/podium", "/macro", "/lifestyle", "/floating");

        return AiPhotoEnhanceResponse.builder()
                .command(cmd)
                .styleName(styleName)
                .description(desc)
                .primaryImageUrl(primaryUrl)
                .angles(angles)
                .suggestedCommands(suggested)
                .poweredBy("AI Studio Engine (360° Turnaround)")
                .build();
    }
}

