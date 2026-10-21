package com.amazingdeal.modules.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateProductRequest {

    @NotBlank(message = "Product title is required")
    private String title;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    private BigDecimal comparePrice;

    private Integer inventoryQuantity;

    private Boolean tracksInventory;

    private String imageUrl;

    private String imagesJson;

    private String category;

    private String status; // ACTIVE, OUT_OF_STOCK, DRAFT
}
