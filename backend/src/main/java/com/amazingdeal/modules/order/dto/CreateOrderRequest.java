package com.amazingdeal.modules.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String customerPhone;

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    private String deliveryType = "DELIVERY"; // DELIVERY, PICKUP
    private String paymentMethod = "COD"; // COD, UPI_ONLINE
    private String notes;

    @NotEmpty(message = "Order must have at least one product")
    private List<OrderItemDto> items;
}
