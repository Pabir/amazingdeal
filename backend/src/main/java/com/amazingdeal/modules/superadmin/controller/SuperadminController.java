package com.amazingdeal.modules.superadmin.controller;

import com.amazingdeal.modules.superadmin.dto.*;
import com.amazingdeal.modules.superadmin.service.SuperadminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/superadmin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPERADMIN')")
public class SuperadminController {

    private final SuperadminService superadminService;

    @GetMapping("/stats")
    public ResponseEntity<PlatformStatsDto> getStats() {
        return ResponseEntity.ok(superadminService.getPlatformStats());
    }

    @GetMapping("/merchants")
    public ResponseEntity<Page<MerchantSummaryDto>> getMerchants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String plan,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(superadminService.getMerchants(search, status, plan, page, size));
    }

    @GetMapping("/merchants/{id}")
    public ResponseEntity<MerchantSummaryDto> getMerchantDetails(@PathVariable UUID id) {
        return ResponseEntity.ok(superadminService.getMerchantDetails(id));
    }

    @PatchMapping("/merchants/{id}/status")
    public ResponseEntity<MerchantSummaryDto> updateMerchantStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMerchantStatusRequest request
    ) {
        return ResponseEntity.ok(superadminService.updateMerchantStatus(id, request.getStatus()));
    }

    @PatchMapping("/merchants/{id}/plan")
    public ResponseEntity<MerchantSummaryDto> updateMerchantPlan(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMerchantPlanRequest request
    ) {
        return ResponseEntity.ok(superadminService.updateMerchantPlan(id, request.getSubscriptionPlan(), request.getExtendDays()));
    }

    @PostMapping("/merchants/{id}/impersonate")
    public ResponseEntity<Map<String, Object>> impersonateMerchant(@PathVariable UUID id) {
        return ResponseEntity.ok(superadminService.impersonateMerchant(id));
    }

    @GetMapping("/customers")
    public ResponseEntity<Page<CustomerSummaryDto>> getCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(superadminService.getCustomers(search, status, page, size));
    }

    @PatchMapping("/customers/{id}/status")
    public ResponseEntity<CustomerSummaryDto> updateCustomerStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCustomerStatusRequest request
    ) {
        return ResponseEntity.ok(superadminService.updateCustomerStatus(id, request.getStatus()));
    }

    @GetMapping("/orders")
    public ResponseEntity<Page<GlobalOrderDto>> getGlobalOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(superadminService.getGlobalOrders(search, status, page, size));
    }

    @GetMapping("/subscriptions")
    public ResponseEntity<List<SubscriptionTxDto>> getSubscriptions() {
        return ResponseEntity.ok(superadminService.getSubscriptions());
    }

    @GetMapping("/system/health")
    public ResponseEntity<SystemHealthDto> getSystemHealth() {
        return ResponseEntity.ok(superadminService.getSystemHealth());
    }
}

