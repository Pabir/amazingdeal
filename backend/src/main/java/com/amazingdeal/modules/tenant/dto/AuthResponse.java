package com.amazingdeal.modules.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String tokenType;
    private UUID tenantId;
    private String storeName;
    private String subdomain;
    private String storefrontUrl;
    private String ownerEmail;
    private String ownerPhone;
    private String upiVpa;
}
