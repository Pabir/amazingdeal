package com.amazingdeal.modules.product.controller;

import com.amazingdeal.modules.product.dto.CreateProductRequest;
import com.amazingdeal.modules.product.model.Product;
import com.amazingdeal.modules.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<Product>> getProducts() {
        return ResponseEntity.ok(productService.getAllForCurrentTenant());
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<Product>> getPagedProducts(Pageable pageable) {
        return ResponseEntity.ok(productService.getPagedForCurrentTenant(pageable));
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody CreateProductRequest request) {
        Product created = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody CreateProductRequest request) {
        Product updated = productService.updateProduct(id, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/inventory")
    public ResponseEntity<Product> toggleInventory(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        String status = payload.getOrDefault("status", "ACTIVE");
        Product updated = productService.toggleInventoryStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
