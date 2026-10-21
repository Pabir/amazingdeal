package com.amazingdeal.modules.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiPhotoEnhanceResponse {
    private String command;
    private String styleName;
    private String description;
    private String primaryImageUrl;
    private List<AiPhotoAngle> angles;
    private List<String> suggestedCommands;
    private String poweredBy;
}
