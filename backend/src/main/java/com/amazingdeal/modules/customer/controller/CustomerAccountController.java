package com.amazingdeal.modules.customer.controller;

import com.amazingdeal.modules.customer.dto.CustomerAddressDto;
import com.amazingdeal.modules.customer.dto.CustomerProfileDto;
import com.amazingdeal.modules.customer.service.CustomerService;
import com.amazingdeal.modules.order.dto.OrderResponseDto;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.service.TenantService;
import com.amazingdeal.multitenancy.CustomerContext;
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
@RequestMapping("/api/v1/store/customer")
@RequiredArgsConstructor
public class CustomerAccountController {

    private final CustomerService customerService;
    private final TenantService tenantService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        UUID customerId = getRequiredCustomerId();
        if (customerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Customer authentication required"));
        }
        return ResponseEntity.ok(customerService.getProfile(customerId));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody CustomerProfileDto dto) {
        UUID customerId = getRequiredCustomerId();
        if (customerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Customer authentication required"));
        }
        return ResponseEntity.ok(customerService.updateProfile(customerId, dto));
    }

    @GetMapping("/addresses")
    public ResponseEntity<?> getAddresses() {
        UUID customerId = getRequiredCustomerId();
        if (customerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Customer authentication required"));
        }
        return ResponseEntity.ok(customerService.getAddresses(customerId));
    }

    @PostMapping("/addresses")
    public ResponseEntity<?> saveAddress(@Valid @RequestBody CustomerAddressDto dto) {
        UUID customerId = getRequiredCustomerId();
        if (customerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Customer authentication required"));
        }
        return ResponseEntity.ok(customerService.saveAddress(customerId, dto));
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<?> deleteAddress(@PathVariable UUID id) {
        UUID customerId = getRequiredCustomerId();
        if (customerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Customer authentication required"));
        }
        customerService.deleteAddress(customerId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getCustomerOrders(@RequestParam(required = false) String subdomain) {
        UUID customerId = getRequiredCustomerId();
        if (customerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Customer authentication required"));
        }

        UUID filterTenantId = null;
        if (subdomain != null && !subdomain.isBlank()) {
            try {
                Tenant tenant = tenantService.getTenantBySubdomain(subdomain.trim());
                if (tenant != null) {
                    filterTenantId = tenant.getId();
                }
            } catch (Exception ignored) {}
        }
        if (filterTenantId == null) {
            filterTenantId = TenantContext.getTenantId();
        }

        List<OrderResponseDto> orders = customerService.getCustomerOrders(customerId, filterTenantId);
        return ResponseEntity.ok(orders);
    }

    private UUID getRequiredCustomerId() {
        return CustomerContext.getCustomerId();
    }
}
