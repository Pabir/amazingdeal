package com.amazingdeal.modules.order.service;

import com.amazingdeal.modules.order.dto.CreateOrderRequest;
import com.amazingdeal.modules.order.dto.OrderItemDto;
import com.amazingdeal.modules.order.dto.OrderResponseDto;
import com.amazingdeal.modules.order.model.Order;
import com.amazingdeal.modules.order.repository.OrderRepository;
import com.amazingdeal.modules.payment.UpiPaymentService;
import com.amazingdeal.modules.product.model.Product;
import com.amazingdeal.modules.product.repository.ProductRepository;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.repository.TenantRepository;
import com.amazingdeal.multitenancy.TenantContext;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final TenantRepository tenantRepository;
    private final ProductRepository productRepository;
    private final UpiPaymentService upiPaymentService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public OrderResponseDto createOrder(CreateOrderRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalStateException("Store not identified. Please browse via store subdomain or provide store identifier.");
        }

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found with id: " + tenantId));

        // Validate products and recalculate prices securely from database
        BigDecimal itemsTotal = BigDecimal.ZERO;
        List<OrderItemDto> validatedItems = new ArrayList<>();

        for (OrderItemDto item : request.getItems()) {
            if (item.getProductId() != null) {
                Optional<Product> prodOpt = productRepository.findByIdAndTenantId(item.getProductId(), tenantId);
                if (prodOpt.isPresent()) {
                    Product prod = prodOpt.get();
                    BigDecimal price = prod.getPrice();
                    int qty = Math.max(1, item.getQuantity());
                    BigDecimal itemSum = price.multiply(BigDecimal.valueOf(qty));
                    itemsTotal = itemsTotal.add(itemSum);

                    validatedItems.add(OrderItemDto.builder()
                            .productId(prod.getId())
                            .title(prod.getTitle())
                            .price(price)
                            .quantity(qty)
                            .itemTotal(itemSum)
                            .build());
                    continue;
                }
            }
            // Fallback for custom or direct items
            int qty = Math.max(1, item.getQuantity());
            BigDecimal price = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
            BigDecimal itemSum = price.multiply(BigDecimal.valueOf(qty));
            itemsTotal = itemsTotal.add(itemSum);

            validatedItems.add(OrderItemDto.builder()
                    .productId(item.getProductId())
                    .title(item.getTitle() != null ? item.getTitle() : "Item")
                    .price(price)
                    .quantity(qty)
                    .itemTotal(itemSum)
                    .build());
        }

        // Calculate delivery fee based on store rules
        BigDecimal deliveryCharge = BigDecimal.ZERO;
        if ("DELIVERY".equalsIgnoreCase(request.getDeliveryType())) {
            if (tenant.getFreeDeliveryAbove() != null && itemsTotal.compareTo(tenant.getFreeDeliveryAbove()) >= 0) {
                deliveryCharge = BigDecimal.ZERO;
            } else if (tenant.getDeliveryCharge() != null) {
                deliveryCharge = tenant.getDeliveryCharge();
            } else {
                deliveryCharge = BigDecimal.valueOf(30.0);
            }
        }

        BigDecimal grandTotal = itemsTotal.add(deliveryCharge);

        // Generate friendly sequential/timestamped order number: e.g. #ORD-8492
        long count = orderRepository.countByTenantId(tenantId) + 1;
        String orderNumber = String.format("#ORD-%04d", count);

        String itemsJson;
        try {
            itemsJson = objectMapper.writeValueAsString(validatedItems);
        } catch (Exception e) {
            itemsJson = "[]";
        }

        String paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "COD";
        String initialPaymentStatus = "COD".equalsIgnoreCase(paymentMethod) ? "PENDING" : "PENDING";

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customerName(request.getCustomerName().trim())
                .customerPhone(request.getCustomerPhone().trim())
                .deliveryAddress(request.getDeliveryAddress().trim())
                .deliveryType(request.getDeliveryType() != null ? request.getDeliveryType().toUpperCase() : "DELIVERY")
                .paymentMethod(paymentMethod)
                .paymentStatus(initialPaymentStatus)
                .orderStatus("PLACED")
                .totalAmount(grandTotal)
                .deliveryCharge(deliveryCharge)
                .itemsJson(itemsJson)
                .notes(request.getNotes())
                .build();
        order.setTenantId(tenantId);

        Order saved = orderRepository.save(order);

        // Build response
        OrderResponseDto response = mapToDto(saved, tenant.getStoreName(), validatedItems);

        // If UPI payment, generate UPI string and QR code
        if ("UPI_ONLINE".equalsIgnoreCase(paymentMethod)) {
            String upiUri = upiPaymentService.generateUpiUri(
                    tenant.getUpiVpa(),
                    tenant.getStoreName(),
                    grandTotal,
                    saved.getOrderNumber(),
                    saved.getId().toString()
            );
            String qrBase64 = upiPaymentService.generateQrCodeBase64(upiUri, 300, 300);

            response.setUpiUri(upiUri);
            response.setUpiQrBase64(qrBase64);
            response.setUpiVpa(tenant.getUpiVpa());
        }

        log.info("New Order created: {} for store: {} (Amount: INR {})", 
                orderNumber, tenant.getStoreName(), grandTotal);

        return response;
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> getAllForCurrentTenant() {
        UUID tenantId = getRequiredTenantId();
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        String storeName = tenant != null ? tenant.getStoreName() : "Store";

        List<Order> orders = orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        return orders.stream()
                .map(o -> mapToDto(o, storeName, parseItems(o.getItemsJson())))
                .toList();
    }

    @Transactional
    public OrderResponseDto updateOrderStatus(UUID orderId, String newStatus) {
        UUID tenantId = getRequiredTenantId();
        Order order = orderRepository.findByIdAndTenantId(orderId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        order.setOrderStatus(newStatus.toUpperCase());
        if ("DELIVERED".equalsIgnoreCase(newStatus) && "COD".equalsIgnoreCase(order.getPaymentMethod())) {
            order.setPaymentStatus("PAID");
        }
        Order saved = orderRepository.save(order);

        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        String storeName = tenant != null ? tenant.getStoreName() : "Store";

        return mapToDto(saved, storeName, parseItems(saved.getItemsJson()));
    }

    @Transactional(readOnly = true)
    public OrderResponseDto getOrderByNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderNumber));
        Tenant tenant = tenantRepository.findById(order.getTenantId()).orElse(null);
        String storeName = tenant != null ? tenant.getStoreName() : "Store";
        return mapToDto(order, storeName, parseItems(order.getItemsJson()));
    }

    @Transactional(readOnly = true)
    public String generateThermalReceipt(UUID orderId) {
        UUID tenantId = getRequiredTenantId();
        Order order = orderRepository.findByIdAndTenantId(orderId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        List<OrderItemDto> items = parseItems(order.getItemsJson());
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm").withZone(ZoneId.of("Asia/Kolkata"));
        String dateStr = order.getCreatedAt() != null ? dtf.format(order.getCreatedAt()) : "";

        StringBuilder sb = new StringBuilder();
        sb.append("================================\n");
        sb.append(centerText(tenant.getStoreName().toUpperCase(), 32)).append("\n");
        if (tenant.getStoreAddress() != null && !tenant.getStoreAddress().isBlank()) {
            sb.append(centerText(tenant.getStoreAddress(), 32)).append("\n");
        }
        sb.append(centerText("Phone: " + tenant.getOwnerPhone(), 32)).append("\n");
        sb.append("================================\n");
        sb.append(String.format("Order: %-13s Type: %s\n", order.getOrderNumber(), order.getDeliveryType()));
        sb.append("Date:  ").append(dateStr).append("\n");
        sb.append("Customer: ").append(order.getCustomerName()).append("\n");
        sb.append("Phone:    ").append(order.getCustomerPhone()).append("\n");
        sb.append("--------------------------------\n");
        sb.append(String.format("%-18s %3s %9s\n", "Item", "Qty", "Amount"));
        sb.append("--------------------------------\n");

        for (OrderItemDto item : items) {
            String title = item.getTitle();
            if (title.length() > 18) {
                title = title.substring(0, 15) + "...";
            }
            sb.append(String.format("%-18s %3d %9.2f\n", title, item.getQuantity(), item.getItemTotal()));
        }

        sb.append("--------------------------------\n");
        sb.append(String.format("%-20s INR %7.2f\n", "Delivery Fee:", order.getDeliveryCharge()));
        sb.append(String.format("%-20s INR %7.2f\n", "TOTAL AMOUNT:", order.getTotalAmount()));
        sb.append("--------------------------------\n");
        sb.append(String.format("Payment: %s (%s)\n", order.getPaymentMethod(), order.getPaymentStatus()));
        if (order.getDeliveryAddress() != null && !order.getDeliveryAddress().isBlank()) {
            sb.append("Deliver To: ").append(order.getDeliveryAddress()).append("\n");
        }
        sb.append("================================\n");
        sb.append(centerText("Thank you for shopping local!", 32)).append("\n");
        sb.append(centerText("Powered by amazingdeal.co.in", 32)).append("\n");
        sb.append("================================\n\n\n");

        return sb.toString();
    }

    private OrderResponseDto mapToDto(Order o, String storeName, List<OrderItemDto> items) {
        return OrderResponseDto.builder()
                .id(o.getId())
                .tenantId(o.getTenantId())
                .orderNumber(o.getOrderNumber())
                .storeName(storeName)
                .customerName(o.getCustomerName())
                .customerPhone(o.getCustomerPhone())
                .deliveryAddress(o.getDeliveryAddress())
                .deliveryType(o.getDeliveryType())
                .paymentMethod(o.getPaymentMethod())
                .paymentStatus(o.getPaymentStatus())
                .orderStatus(o.getOrderStatus())
                .totalAmount(o.getTotalAmount())
                .deliveryCharge(o.getDeliveryCharge())
                .items(items)
                .notes(o.getNotes())
                .createdAt(o.getCreatedAt())
                .build();
    }

    private List<OrderItemDto> parseItems(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<OrderItemDto>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String centerText(String text, int width) {
        if (text == null) return "";
        if (text.length() >= width) return text.substring(0, width);
        int padding = (width - text.length()) / 2;
        return " ".repeat(padding) + text;
    }

    private UUID getRequiredTenantId() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalStateException("Operation requires an active tenant context.");
        }
        return tenantId;
    }
}
