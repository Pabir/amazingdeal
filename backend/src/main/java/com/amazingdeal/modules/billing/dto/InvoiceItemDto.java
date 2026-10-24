package com.amazingdeal.modules.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItemDto {
    private UUID productId;
    private String itemName;
    private String hsnSac;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal unitPrice;
    private BigDecimal discountPct;
    private BigDecimal gstRate;
    private BigDecimal cgstRate;
    private BigDecimal cgstAmount;
    private BigDecimal sgstRate;
    private BigDecimal sgstAmount;
    private BigDecimal igstRate;
    private BigDecimal igstAmount;
    private BigDecimal totalAmount;
}
