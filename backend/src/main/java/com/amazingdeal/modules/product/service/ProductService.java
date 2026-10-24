package com.amazingdeal.modules.product.service;

import com.amazingdeal.modules.product.dto.CreateProductRequest;
import com.amazingdeal.modules.product.model.Product;
import com.amazingdeal.modules.product.repository.ProductRepository;
import com.amazingdeal.multitenancy.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<Product> getAllForCurrentTenant() {
        UUID tenantId = getRequiredTenantId();
        return productRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public Page<Product> getPagedForCurrentTenant(Pageable pageable) {
        UUID tenantId = getRequiredTenantId();
        return productRepository.findByTenantId(tenantId, pageable);
    }

    @Transactional
    public Product createProduct(CreateProductRequest request) {
        UUID tenantId = getRequiredTenantId();

        Product product = Product.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .price(request.getPrice())
                .comparePrice(request.getComparePrice())
                .inventoryQuantity(request.getInventoryQuantity() != null ? request.getInventoryQuantity() : 100)
                .tracksInventory(request.getTracksInventory() != null ? request.getTracksInventory() : false)
                .imageUrl(request.getImageUrl())
                .imagesJson(request.getImagesJson())
                .category(request.getCategory() != null ? request.getCategory() : "General")
                .hsnSac(request.getHsnSac())
                .gstRate(request.getGstRate() != null ? request.getGstRate() : BigDecimal.ZERO)
                .barcode(request.getBarcode())
                .unit(request.getUnit() != null ? request.getUnit() : "pcs")
                .purchasePrice(request.getPurchasePrice())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();
        product.setTenantId(tenantId);

        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(UUID id, CreateProductRequest request) {
        UUID tenantId = getRequiredTenantId();
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));

        product.setTitle(request.getTitle().trim());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setComparePrice(request.getComparePrice());
        if (request.getInventoryQuantity() != null) product.setInventoryQuantity(request.getInventoryQuantity());
        if (request.getTracksInventory() != null) product.setTracksInventory(request.getTracksInventory());
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
        if (request.getImagesJson() != null) product.setImagesJson(request.getImagesJson());
        if (request.getCategory() != null) product.setCategory(request.getCategory());
        if (request.getHsnSac() != null) product.setHsnSac(request.getHsnSac());
        if (request.getGstRate() != null) product.setGstRate(request.getGstRate());
        if (request.getBarcode() != null) product.setBarcode(request.getBarcode());
        if (request.getUnit() != null) product.setUnit(request.getUnit());
        if (request.getPurchasePrice() != null) product.setPurchasePrice(request.getPurchasePrice());
        if (request.getStatus() != null) product.setStatus(request.getStatus());

        return productRepository.save(product);
    }

    @Transactional
    public Product toggleInventoryStatus(UUID id, String status) {
        UUID tenantId = getRequiredTenantId();
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));

        product.setStatus(status.toUpperCase());
        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(UUID id) {
        UUID tenantId = getRequiredTenantId();
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        productRepository.delete(product);
    }

    @Transactional(readOnly = true)
    public List<Product> getPublicCatalog(UUID tenantId, String category) {
        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("All")) {
            return productRepository.findByTenantIdAndCategoryIgnoreCaseAndStatus(tenantId, category, "ACTIVE");
        }
        return productRepository.findByTenantIdAndStatus(tenantId, "ACTIVE");
    }

    private UUID getRequiredTenantId() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalStateException("Operation requires an active tenant context.");
        }
        return tenantId;
    }
}
