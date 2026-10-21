package com.amazingdeal.modules.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiPhotoEnhanceRequest {
    /**
     * Studio command e.g. "/360", "/studio", "/podium", "/lifestyle", "/macro", "/floating"
     */
    private String command;

    /**
     * Product details for AI contextual enhancement
     */
    private String productTitle;
    private String category;
    private String base64Image;
    private String currentImageUrl;
    private String customPrompt;

    /**
     * Explicit provider preference if merchant wants to use GEMINI, OPENAI, or AUTO
     */
    private String provider;
}
