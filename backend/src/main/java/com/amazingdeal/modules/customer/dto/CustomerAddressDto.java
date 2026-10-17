package com.amazingdeal.modules.customer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerAddressDto {
    private UUID id;
    private String label;
    private String recipientName;
    private String recipientPhone;

    @NotBlank(message = "Address line is required")
    private String addressLine;

    private String landmark;
    private String city;
    private String pincode;
    private Boolean isDefault;
}
