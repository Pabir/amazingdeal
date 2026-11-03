package com.amazingdeal.modules.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuperadminAuthResponse {
    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private Instant lastLoginAt;
}

