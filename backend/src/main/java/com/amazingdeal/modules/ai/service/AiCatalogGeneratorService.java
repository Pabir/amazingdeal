package com.amazingdeal.modules.ai.service;

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
            String preference = tenant.getAiProviderPreference() != null ? tenant.getAiProviderPreference() : "AUTO";
            boolean hasGemini = geminiKey != null && !geminiKey.isBlank();
            boolean hasOpenAi = openAiToken != null && !openAiToken.isBlank() && !openAiToken.startsWith("simulated_");

            if (!hasGemini && !hasOpenAi) {
                throw new IllegalStateException("No AI provider connected. Please provide a free Google Gemini API key or OpenAI key, or use Instant Demo mode.");
            }

            // Route based on merchant preference or smart fallback
            if ("GEMINI".equalsIgnoreCase(preference)) {
                if (hasGemini) {
                    try {
                        return executeGeminiVisionRequest(geminiKey, tenant, request);
                    } catch (Exception e) {
                        if (hasOpenAi) {
                            log.warn("Gemini vision failed ({}), attempting fallback to OpenAI...", e.getMessage());
                            return executeOpenAiVisionRequest(openAiToken, tenant, request);
                        }
                        throw e;
                    }
                } else if (hasOpenAi) {
                    return executeOpenAiVisionRequest(openAiToken, tenant, request);
                }
            } else if ("OPENAI".equalsIgnoreCase(preference)) {
                if (hasOpenAi) {
                    try {
                        return executeOpenAiVisionRequest(openAiToken, tenant, request);
                    } catch (Exception e) {
                        if (hasGemini) {
                            log.warn("OpenAI vision failed ({}), attempting fallback to Gemini...", e.getMessage());
                            return executeGeminiVisionRequest(geminiKey, tenant, request);
                        }
                        throw e;
                    }
                } else if (hasGemini) {
                    return executeGeminiVisionRequest(geminiKey, tenant, request);
                }
            } else {
                // AUTO: Prioritize Google Gemini first (FREE tier for Indian merchants & Jio 5G users!)
                if (hasGemini) {
                    try {
                        return executeGeminiVisionRequest(geminiKey, tenant, request);
                    } catch (Exception e) {
                        if (hasOpenAi) {
                            log.warn("Gemini vision failed ({}), falling back to OpenAI...", e.getMessage());
                            return executeOpenAiVisionRequest(openAiToken, tenant, request);
                        }
                        throw e;
                    }
                } else {
                    return executeOpenAiVisionRequest(openAiToken, tenant, request);
                }
            }
        }

        // 2. High-resilience intelligent simulation fallback (for development, demos, or zero-config testing)
        return generateIntelligentSampleProduct(tenant, request);
    }

    private GeneratedProductResponse executeGeminiVisionRequest(String geminiKey, Tenant tenant, GenerateProductFromImageRequest request) {
        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiKey;

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
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        ResponseEntity<String> response;
        try {
            response = restTemplate.postForEntity(endpoint, entity, String.class);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String geminiError = extractGeminiErrorMessage(e);
            log.error("Google Gemini API error (HTTP {}): {}", e.getStatusCode(), geminiError);
            throw new IllegalStateException(geminiError, e);
        } catch (Exception e) {
            log.error("Unexpected error during Gemini Vision call: {}", e.getMessage());
            throw new IllegalStateException("Google Gemini request failed: " + e.getMessage(), e);
        }

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
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

                return GeneratedProductResponse.builder()
                        .title(productJson.path("title").asText("Premium Quality Item"))
                        .description(productJson.path("description").asText("Handpicked premium quality product for your daily household needs."))
                        .category(productJson.path("category").asText(tenant.getStoreCategory() != null ? tenant.getStoreCategory() : "General"))
                        .suggestedPrice(BigDecimal.valueOf(productJson.path("suggestedPrice").asDouble(149.0)))
                        .comparePrice(BigDecimal.valueOf(productJson.path("comparePrice").asDouble(179.0)))
                        .tags(tags.isEmpty() ? List.of("Quality", "Daily Needs", "Special") : tags)
                        .keyHighlights(highlights.isEmpty() ? List.of("100% Genuine Quality", "Fast Local Delivery", "Best Value") : highlights)
                        .ingredientsOrSpecs(productJson.path("ingredientsOrSpecs").asText("Standard packaging"))
                        .estimatedUnit(productJson.path("estimatedUnit").asText("1 Unit"))
                        .inventoryQuantity(productJson.path("inventoryQuantity").asInt(50))
                        .imageUrl(displayImg)
                        .poweredBy("Google Gemini 1.5 Flash (Free Tier / Jio 5G)")
                        .build();
            } catch (Exception e) {
                log.error("Failed to parse Gemini response: {}", e.getMessage());
                throw new IllegalStateException("Failed to parse Google Gemini response: " + e.getMessage(), e);
            }
        }

        throw new IllegalStateException("Google Gemini returned non-200 status: " + response.getStatusCode());
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
                    return "Google Gemini Error: " + msg;
                }
            }
        } catch (Exception ignored) {}

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

                return GeneratedProductResponse.builder()
                        .title(productJson.path("title").asText("Premium Quality Item"))
                        .description(productJson.path("description").asText("Handpicked premium quality product for your daily household needs."))
                        .category(productJson.path("category").asText(tenant.getStoreCategory() != null ? tenant.getStoreCategory() : "General"))
                        .suggestedPrice(BigDecimal.valueOf(productJson.path("suggestedPrice").asDouble(149.0)))
                        .comparePrice(BigDecimal.valueOf(productJson.path("comparePrice").asDouble(179.0)))
                        .tags(tags.isEmpty() ? List.of("Quality", "Daily Needs", "Special") : tags)
                        .keyHighlights(highlights.isEmpty() ? List.of("100% Genuine Quality", "Fast Local Delivery", "Best Value") : highlights)
                        .ingredientsOrSpecs(productJson.path("ingredientsOrSpecs").asText("Standard retail packaging"))
                        .estimatedUnit(productJson.path("estimatedUnit").asText("1 Unit"))
                        .inventoryQuantity(productJson.path("inventoryQuantity").asInt(50))
                        .imageUrl(resultImage)
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
            
            return GeneratedProductResponse.builder()
                    .title("Men's Multi-Pocket Tactical Cargo Trousers")
                    .description("Engineered with durable stretch cotton-twill for superior comfort, flexibility, and everyday utility. Designed with deep side cargo pockets and reinforced stitching.")
                    .category("Apparel & Clothing")
                    .suggestedPrice(BigDecimal.valueOf(999.0))
                    .comparePrice(BigDecimal.valueOf(1499.0))
                    .tags(List.of("Cargo Pants", "Men's Apparel", "Trousers", "Casual Wear", "Cotton"))
                    .keyHighlights(List.of("Durable 6-Pocket Tactical Utility", "Comfort Stretch Cotton Twill", "Reinforced Knee & Seam Stitching"))
                    .ingredientsOrSpecs("98% Cotton, 2% Elastane")
                    .estimatedUnit("1 Piece (Regular Fit)")
                    .inventoryQuantity(30)
                    .imageUrl(displayImg)
                    .poweredBy("Demo Mode (Apparel Preset)")
                    .build();
        }

        // Electronics detection
        if (context.contains("electronic") || context.contains("gadget") || context.contains("earbud") || 
            context.contains("headphone") || context.contains("phone") || context.contains("charger") || 
            context.contains("mobile") || context.contains("watch")) {
            
            return GeneratedProductResponse.builder()
                    .title("Wireless Bluetooth Stereo Earbuds with Active Noise Cancellation")
                    .description("Experience high-fidelity immersive audio with environmental noise cancellation, ultra-low latency gaming mode, and 36-hour total battery life.")
                    .category("Electronics & Gadgets")
                    .suggestedPrice(BigDecimal.valueOf(1499.0))
                    .comparePrice(BigDecimal.valueOf(2499.0))
                    .tags(List.of("Earbuds", "Wireless", "Bluetooth", "Audio", "Noise Cancellation"))
                    .keyHighlights(List.of("Active Noise Cancellation (ANC)", "36 Hours Extended Playback", "IPX5 Water & Sweat Resistant"))
                    .ingredientsOrSpecs("Bluetooth 5.3, Type-C Fast Charging")
                    .estimatedUnit("1 Set")
                    .inventoryQuantity(25)
                    .imageUrl(displayImg)
                    .poweredBy("Demo Mode (Electronics Preset)")
                    .build();
        }

        // Default Groceries fallback
        String cat = request.getPreferredCategory() != null && !request.getPreferredCategory().isBlank()
                ? request.getPreferredCategory()
                : (tenant.getStoreCategory() != null ? tenant.getStoreCategory() : "Groceries");

        return GeneratedProductResponse.builder()
                .title("Aashirvaad Shudh Chakki Atta - 5kg (100% Pure Whole Wheat)")
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
                .poweredBy("Demo Mode (Groceries Preset)")
                .build();
    }
}
