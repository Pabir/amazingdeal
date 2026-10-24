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
    private final com.amazingdeal.modules.tenant.repository.TenantRepository tenantRepository;
    private final com.amazingdeal.modules.shipping.shiprocket.service.ShiprocketService shiprocketService;

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

    @PostMapping("/{id}/ship-shiprocket")
    public ResponseEntity<?> shipViaShiprocket(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No active tenant"));
        }

        com.amazingdeal.modules.order.model.Order order = orderRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + id));

        com.amazingdeal.modules.tenant.model.Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found"));

        if (!Boolean.TRUE.equals(tenant.getShiprocketEnabled())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Shiprocket BYOK is not enabled in Store Settings."));
        }

        try {
            com.amazingdeal.modules.shipping.shiprocket.service.ShiprocketService.ShipmentResult shipment =
                    shiprocketService.createShipment(tenant, order);

            order.setOrderStatus("OUT_FOR_DELIVERY");
            order.setFulfillmentPartner("SHIPROCKET");
            order.setShiprocketOrderId(shipment.getOrderId());
            order.setShiprocketShipmentId(shipment.getShipmentId());
            order.setShiprocketAwbCode(shipment.getAwbCode());
            order.setShiprocketCourierName(shipment.getCourierName());
            order.setShippingLabelUrl(shipment.getLabelUrl());
            order.setCourierTrackingUrl(shipment.getTrackingUrl());

            orderRepository.save(order);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Order successfully dispatched via Shiprocket!",
                    "awbCode", shipment.getAwbCode(),
                    "courierName", shipment.getCourierName(),
                    "shippingLabelUrl", shipment.getLabelUrl(),
                    "order", orderService.getAllForCurrentTenant().stream().filter(o -> o.getId().equals(id)).findFirst().orElse(null)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Shiprocket dispatch error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/assign-rider")
    public ResponseEntity<?> assignStoreRider(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload) {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No active tenant"));
        }

        com.amazingdeal.modules.order.model.Order order = orderRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + id));

        com.amazingdeal.modules.tenant.model.Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found"));

        String riderName = payload.getOrDefault("riderName", "Store Rider").trim();
        String riderPhone = payload.getOrDefault("riderPhone", "").trim();

        order.setDeliveryBoyName(riderName);
        order.setDeliveryBoyPhone(riderPhone);
        order.setFulfillmentPartner("OWN_RIDER");
        order.setOrderStatus("OUT_FOR_DELIVERY");

        orderRepository.save(order);

        String whatsappMsg = shiprocketService.generateRiderWhatsAppMessage(tenant, order, riderName, riderPhone);
        String cleanPhone = riderPhone.replaceAll("[^0-9]", "");
        if (cleanPhone.length() == 10) {
            cleanPhone = "91" + cleanPhone;
        }

        String whatsappUrl = "https://wa.me/" + cleanPhone + "?text=" + java.net.URLEncoder.encode(whatsappMsg, java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Store delivery rider assigned successfully!",
                "riderName", riderName,
                "riderPhone", riderPhone,
                "whatsappDispatchText", whatsappMsg,
                "whatsappDispatchUrl", whatsappUrl,
                "order", orderService.getAllForCurrentTenant().stream().filter(o -> o.getId().equals(id)).findFirst().orElse(null)
        ));
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
