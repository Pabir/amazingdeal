package com.amazingdeal.modules.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiPhotoAngle {
    private String angle;       // "0°", "45°", "90°", "180°", "Podium", "Macro", etc.
    private String label;       // "Front View", "Quarter Angle", "Side Profile", "Rear View", etc.
    private String imageUrl;    // Static URL or data URI
    private boolean isPrimary;  // If recommended as the main product thumbnail
}
