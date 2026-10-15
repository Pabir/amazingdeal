package com.amazingdeal.modules.tenant.controller;

import com.amazingdeal.modules.tenant.dto.AuthResponse;
import com.amazingdeal.modules.tenant.dto.LoginRequest;
import com.amazingdeal.modules.tenant.dto.RegisterStoreRequest;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.service.TenantService;
import com.amazingdeal.multitenancy.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final TenantService tenantService;

    @PostMapping("/register-store")
    public ResponseEntity<AuthResponse> registerStore(@Valid @RequestBody RegisterStoreRequest request) {
        AuthResponse response = tenantService.registerStore(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = tenantService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentMerchant() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No tenant context found"));
        }
        Tenant tenant = tenantService.getTenantById(tenantId);
        return ResponseEntity.ok(tenant);
    }
}
