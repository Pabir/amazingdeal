package com.amazingdeal.modules.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomApiKeyRequest {
    @NotBlank(message = "API key cannot be empty")
    private String apiKey;

    private String provider; // Optional: "GEMINI", "OPENAI", or auto-detected
}
