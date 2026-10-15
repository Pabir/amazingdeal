package com.amazingdeal.modules.order.controller;

import com.amazingdeal.modules.order.dto.OrderResponseDto;
import com.amazingdeal.modules.order.repository.OrderRepository;
import com.amazingdeal.modules.order.service.OrderService;
import com.amazingdeal.multitenancy.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;

    @GetMapping
    public ResponseEntity<List<OrderResponseDto>> getOrders() {
        return ResponseEntity.ok(orderService.getAllForCurrentTenant());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponseDto> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        String status = payload.getOrDefault("status", "ACCEPTED");
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @GetMapping(value = "/{id}/receipt", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> getThermalReceipt(@PathVariable UUID id) {
        String receipt = orderService.generateThermalReceipt(id);
        return ResponseEntity.ok(receipt);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getOrderStats() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No active tenant"));
        }

        long totalOrders = orderRepository.countByTenantId(tenantId);
        long placedOrders = orderRepository.countByTenantIdAndOrderStatus(tenantId, "PLACED");
        long acceptedOrders = orderRepository.countByTenantIdAndOrderStatus(tenantId, "ACCEPTED");
        long deliveredOrders = orderRepository.countByTenantIdAndOrderStatus(tenantId, "DELIVERED");
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue(tenantId);

        return ResponseEntity.ok(Map.of(
                "totalOrders", totalOrders,
                "placedOrders", placedOrders,
                "acceptedOrders", acceptedOrders,
                "deliveredOrders", deliveredOrders,
                "totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO
        ));
    }
}
