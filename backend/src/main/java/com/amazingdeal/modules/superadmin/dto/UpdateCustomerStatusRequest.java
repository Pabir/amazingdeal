package com.amazingdeal.modules.superadmin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCustomerStatusRequest {
    @NotBlank(message = "Status is required (ACTIVE, BLOCKED)")
    private String status;
}

