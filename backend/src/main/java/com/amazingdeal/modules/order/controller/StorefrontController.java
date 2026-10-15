package com.amazingdeal.modules.order.controller;

import com.amazingdeal.modules.order.dto.CreateOrderRequest;
import com.amazingdeal.modules.order.dto.OrderResponseDto;
import com.amazingdeal.modules.order.service.OrderService;
import com.amazingdeal.modules.product.model.Product;
import com.amazingdeal.modules.product.service.ProductService;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.service.TenantService;
import com.amazingdeal.multitenancy.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/store")
@RequiredArgsConstructor
public class StorefrontController {

    private final TenantService tenantService;
    private final ProductService productService;
    private final OrderService orderService;

    @GetMapping("/info")
    public ResponseEntity<?> getStoreInfo(@RequestParam(required = false) String subdomain) {
        Tenant tenant = resolveStore(subdomain);
        if (tenant == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", "Storefront not found",
                    "message", "Could not resolve store by domain or subdomain. Please check the URL."
            ));
        }

        return ResponseEntity.ok(com.amazingdeal.modules.tenant.dto.StoreInfoDto.builder()
                .id(tenant.getId())
                .storeName(tenant.getStoreName())
                .subdomain(tenant.getSubdomain())
                .storeCategory(tenant.getStoreCategory() != null ? tenant.getStoreCategory() : "General")
                .storeAddress(tenant.getStoreAddress() != null ? tenant.getStoreAddress() : "")
                .ownerPhone(tenant.getOwnerPhone())
                .upiVpa(tenant.getUpiVpa() != null ? tenant.getUpiVpa() : "")
                .deliveryRadiusKm(tenant.getDeliveryRadiusKm())
                .deliveryCharge(tenant.getDeliveryCharge())
                .freeDeliveryAbove(tenant.getFreeDeliveryAbove())
                .minOrderAmount(tenant.getMinOrderAmount())
                .storeTimings(tenant.getStoreTimings() != null ? tenant.getStoreTimings() : "8:00 AM - 10:00 PM")
                .bannerUrl(tenant.getBannerUrl() != null ? tenant.getBannerUrl() : "")
                .logoUrl(tenant.getLogoUrl() != null ? tenant.getLogoUrl() : "")
                .build());
    }

    @GetMapping("/products")
    public ResponseEntity<?> getStoreProducts(
            @RequestParam(required = false) String subdomain,
            @RequestParam(required = false) String category) {
        Tenant tenant = resolveStore(subdomain);
        if (tenant == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Storefront not found"));
        }

        List<Product> products = productService.getPublicCatalog(tenant.getId(), category);
        return ResponseEntity.ok(products);
    }

    @PostMapping("/orders")
    public ResponseEntity<?> placeOrder(
            @RequestParam(required = false) String subdomain,
            @Valid @RequestBody CreateOrderRequest request) {
        Tenant tenant = resolveStore(subdomain);
        if (tenant == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Storefront not found"));
        }

        TenantContext.setTenantId(tenant.getId());
        OrderResponseDto order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping("/orders/{orderNumber}")
    public ResponseEntity<?> trackOrder(@PathVariable String orderNumber) {
        try {
            OrderResponseDto order = orderService.getOrderByNumber(orderNumber);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    private Tenant resolveStore(String subdomainParam) {
        if (subdomainParam != null && !subdomainParam.isBlank()) {
            try {
                return tenantService.getTenantBySubdomain(subdomainParam.trim());
            } catch (Exception ignored) {}
        }
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId != null) {
            try {
                return tenantService.getTenantById(tenantId);
            } catch (Exception ignored) {}
        }
        String sub = TenantContext.getSubdomain();
        if (sub != null && !sub.isBlank()) {
            try {
                return tenantService.getTenantBySubdomain(sub);
            } catch (Exception ignored) {}
        }
        return null;
    }
}
