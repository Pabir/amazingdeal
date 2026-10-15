package com.amazingdeal.modules.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponseDto {
    private UUID id;
    private UUID tenantId;
    private String orderNumber;
    private String storeName;
    private String customerName;
    private String customerPhone;
    private String deliveryAddress;
    private String deliveryType;
    private String paymentMethod;
    private String paymentStatus;
    private String orderStatus;
    private BigDecimal totalAmount;
    private BigDecimal deliveryCharge;
    private List<OrderItemDto> items;
    private String notes;
    private Instant createdAt;

    // UPI Payment details (populated when paymentMethod is UPI_ONLINE)
    private String upiUri;
    private String upiQrBase64;
    private String upiVpa;
}
