package com.amazingdeal.modules.tenant.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterStoreRequest {

    @NotBlank(message = "Store name is required")
    @Size(min = 2, max = 100, message = "Store name must be between 2 and 100 characters")
    private String storeName;

    @NotBlank(message = "Subdomain is required")
    @Pattern(regexp = "^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$", 
             message = "Subdomain must contain only lowercase letters, numbers, and hyphens (e.g., 'sharmagrocery')")
    private String subdomain;

    @NotBlank(message = "Owner phone is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be a valid 10-digit number")
    private String ownerPhone;

    @NotBlank(message = "Owner email is required")
    @Email(message = "Valid email is required")
    private String ownerEmail;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String storeCategory; // Groceries, Apparel, Sweets, Hardware, etc.
    private String storeAddress;
    private String upiVpa; // e.g. "sharma@okaxis"
}
