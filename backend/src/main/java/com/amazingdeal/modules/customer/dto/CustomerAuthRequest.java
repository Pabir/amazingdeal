package com.amazingdeal.modules.customer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerAuthRequest {

    @NotBlank(message = "Firebase UID is required")
    private String firebaseUid;

    private String idToken;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String authProvider; // FIREBASE_GOOGLE, FIREBASE_PHONE, FIREBASE_EMAIL
}
