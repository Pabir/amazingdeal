package com.amazingdeal.modules.product.model;

import com.amazingdeal.multitenancy.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_products_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_products_category", columnList = "category"),
    @Index(name = "idx_products_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "compare_price", precision = 10, scale = 2)
    private BigDecimal comparePrice;

    @Builder.Default
    @Column(name = "inventory_quantity")
    private Integer inventoryQuantity = 100;

    @Builder.Default
    @Column(name = "tracks_inventory")
    private Boolean tracksInventory = false;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "images_json", columnDefinition = "TEXT")
    private String imagesJson;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "hsn_sac", length = 10)
    private String hsnSac;

    @Builder.Default
    @Column(name = "gst_rate", precision = 5, scale = 2)
    private BigDecimal gstRate = BigDecimal.ZERO;

    @Column(name = "barcode", length = 100)
    private String barcode;

    @Builder.Default
    @Column(name = "unit", length = 20)
    private String unit = "pcs";

    @Column(name = "purchase_price", precision = 10, scale = 2)
    private BigDecimal purchasePrice;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, OUT_OF_STOCK, DRAFT

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
