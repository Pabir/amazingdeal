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
    private String paymentMethod = "COD"; // COD, UPI_ONLINE, RAZORPAY_BYOK
    private String notes;
    private java.util.UUID customerId;

    // Delivery & Shipping options
    private String pincode;
    private String expectedDeliveryDate;
    private String deliveryTimeSlot;
    private String fulfillmentPartner; // OWN_RIDER, SHIPROCKET, STORE_PICKUP

    // Gateway / Online payment details
    private String gatewayProvider; // COD, DIRECT_UPI, RAZORPAY_BYOK, STORE_PICKUP
    private String gatewayPaymentId;
    private String gatewayOrderId;
    private String gatewaySignature;
    private String upiTransactionRef;
    private String codOtp;

    @NotEmpty(message = "Order must have at least one product")
    private List<OrderItemDto> items;
}
