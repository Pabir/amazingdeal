package com.amazingdeal.modules.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatGptStatusResponse {
    private boolean connected;
    private String accountEmail;
    private String planTier; // e.g. ChatGPT Plus, ChatGPT Pro, Team
    private Instant expiresAt;
    private boolean hasCustomApiKey;
    private String maskedApiKey;
    private String connectionType; // "CHATGPT_SUBSCRIPTION" or "CUSTOM_API_KEY" or "DISCONNECTED"
}
