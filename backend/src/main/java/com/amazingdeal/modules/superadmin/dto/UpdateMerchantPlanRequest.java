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
public class UpdateMerchantPlanRequest {
    @NotBlank(message = "Subscription plan is required (STARTER, MONTHLY, GROWTH, ENTERPRISE)")
    private String subscriptionPlan;

    private Integer extendDays;
}

