package com.amazingdeal.modules.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedProductResponse {
    private String title;
    private String description;
    private String category;
    private BigDecimal suggestedPrice;
    private BigDecimal comparePrice;
    private List<String> tags;
    private List<String> keyHighlights;
    private String ingredientsOrSpecs;
    private String estimatedUnit;
    private String imageUrl;
    private Integer inventoryQuantity;
    private String poweredBy; // e.g. "ChatGPT Plus (merchant@example.com)"
}
