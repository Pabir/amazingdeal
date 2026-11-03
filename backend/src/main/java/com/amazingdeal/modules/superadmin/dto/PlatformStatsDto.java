package com.amazingdeal.modules.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformStatsDto {
    private long totalMerchants;
    private long activeMerchants;
    private long suspendedMerchants;
    private long totalCustomers;
    private long totalOrders;
    private BigDecimal totalPlatformGmv;
    private BigDecimal totalSaaSRevenue;

    private List<MerchantSummaryDto> recentMerchants;
    private List<GlobalOrderDto> recentOrders;
}

