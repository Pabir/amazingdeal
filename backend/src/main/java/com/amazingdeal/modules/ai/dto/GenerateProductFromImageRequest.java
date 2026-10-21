package com.amazingdeal.modules.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateProductFromImageRequest {
    private String imageUrl;
    private String base64Image;
    private String preferredCategory;
    private String additionalMerchantNotes;
    private boolean simulateDemo; // Allows test mode without real OpenAI keys
    private String provider; // "GEMINI", "OPENAI", "AUTO"
}
