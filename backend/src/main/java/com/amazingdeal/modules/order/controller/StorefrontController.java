package com.amazingdeal.modules.order.controller;

import com.amazingdeal.modules.customer.repository.CustomerRepository;
import com.amazingdeal.modules.order.dto.CreateOrderRequest;
import com.amazingdeal.modules.order.dto.OrderResponseDto;
import com.amazingdeal.modules.order.service.OrderService;
import com.amazingdeal.modules.product.model.Product;
import com.amazingdeal.modules.product.service.ProductService;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.service.TenantService;
import com.amazingdeal.multitenancy.CustomerContext;
import com.amazingdeal.multitenancy.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/v1/store")
@RequiredArgsConstructor
public class StorefrontController {

    private final TenantService tenantService;
    private final ProductService productService;
    private final OrderService orderService;
    private final CustomerRepository customerRepository;
    private final com.amazingdeal.modules.payment.razorpay.service.RazorpayService razorpayService;
    private final com.amazingdeal.modules.shipping.shiprocket.service.ShiprocketService shiprocketService;

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
                .paymentModesJson(tenant.getPaymentModesJson())
                .customUpiQrUrl(tenant.getCustomUpiQrUrl())
                .razorpayByokEnabled(Boolean.TRUE.equals(tenant.getRazorpayByokEnabled()))
                .razorpayKeyId(tenant.getRazorpayKeyId())
                .cashfreeByokEnabled(Boolean.TRUE.equals(tenant.getCashfreeByokEnabled()))
                .cashfreeAppId(tenant.getCashfreeAppId())
                .codEnabled(tenant.getCodEnabled() != null ? tenant.getCodEnabled() : true)
                .codExtraCharge(tenant.getCodExtraCharge() != null ? tenant.getCodExtraCharge() : BigDecimal.ZERO)
                .codMinAmount(tenant.getCodMinAmount() != null ? tenant.getCodMinAmount() : BigDecimal.ZERO)
                .codMaxAmount(tenant.getCodMaxAmount() != null ? tenant.getCodMaxAmount() : BigDecimal.valueOf(10000.0))
                .codOtpRequired(Boolean.TRUE.equals(tenant.getCodOtpRequired()))
                .deliveryModesJson(tenant.getDeliveryModesJson())
                .allowedPincodesText(tenant.getAllowedPincodesText())
                .distanceTiersJson(tenant.getDistanceTiersJson())
                .deliveryTimeSlotsJson(tenant.getDeliveryTimeSlotsJson())
                .expressDeliveryEnabled(Boolean.TRUE.equals(tenant.getExpressDeliveryEnabled()))
                .expressDeliveryMinutes(tenant.getExpressDeliveryMinutes() != null ? tenant.getExpressDeliveryMinutes() : 60)
                .expressDeliveryFee(tenant.getExpressDeliveryFee() != null ? tenant.getExpressDeliveryFee() : BigDecimal.valueOf(49.0))
                .shiprocketEnabled(Boolean.TRUE.equals(tenant.getShiprocketEnabled()))
                .shiprocketPricingRule(tenant.getShiprocketPricingRule() != null ? tenant.getShiprocketPricingRule() : "FLAT_FEE")
                .shiprocketFlatFee(tenant.getShiprocketFlatFee() != null ? tenant.getShiprocketFlatFee() : BigDecimal.valueOf(60.0))
                .shiprocketFreeAbove(tenant.getShiprocketFreeAbove() != null ? tenant.getShiprocketFreeAbove() : BigDecimal.valueOf(999.0))
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

        UUID customerId = CustomerContext.getCustomerId();
        if (customerId == null && request.getCustomerId() != null) {
            if (customerRepository.existsById(request.getCustomerId())) {
                customerId = request.getCustomerId();
            }
        }

        if (customerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Customer login required",
                    "message", "Customers must be logged in to place an order. Please sign in or register."
            ));
        }

        request.setCustomerId(customerId);
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

    @GetMapping("/shipping/check-serviceability")
    public ResponseEntity<?> checkShippingServiceability(
            @RequestParam(required = false) String subdomain,
            @RequestParam String pincode) {
        Tenant tenant = resolveStore(subdomain);
        if (tenant == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Storefront not found"));
        }

        String cleanPincode = pincode != null ? pincode.trim() : "";
        if (cleanPincode.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("serviceable", false, "message", "Please enter a valid 6-digit pincode"));
        }

        // 1. Whitelist validation if defined
        if (tenant.getAllowedPincodesText() != null && !tenant.getAllowedPincodesText().isBlank()) {
            Set<String> allowed = new HashSet<>(Arrays.asList(tenant.getAllowedPincodesText().split("[,\\s\n\r]+")));
            if (!allowed.contains(cleanPincode)) {
                return ResponseEntity.ok(Map.of(
                        "serviceable", false,
                        "pincode", cleanPincode,
                        "message", "Delivery is not currently available at pincode " + cleanPincode + ". Store delivers only to selected locations."
                ));
            }
        }

        // 2. If Shiprocket BYOK is enabled for this merchant
        if (Boolean.TRUE.equals(tenant.getShiprocketEnabled())) {
            com.amazingdeal.modules.shipping.shiprocket.service.ShiprocketService.ServiceabilityResult srRes =
                    shiprocketService.checkServiceability(tenant, cleanPincode, 0.5);

            java.math.BigDecimal charge = tenant.getShiprocketFlatFee() != null ? tenant.getShiprocketFlatFee() : java.math.BigDecimal.valueOf(60.0);
            return ResponseEntity.ok(Map.of(
                    "serviceable", srRes.isServiceable(),
                    "pincode", cleanPincode,
                    "estimatedDeliveryDate", srRes.getEstimatedDeliveryDate() != null ? srRes.getEstimatedDeliveryDate() : java.time.LocalDate.now().plusDays(3).toString(),
                    "deliveryCharge", charge,
                    "courierName", srRes.getCourierName() != null ? srRes.getCourierName() : "Courier Partner",
                    "fulfillmentPartner", "SHIPROCKET",
                    "message", srRes.getMessage()
            ));
        }

        // 3. Own Fleet / Store Local Delivery fallback
        java.time.LocalDate edd = java.time.LocalDate.now().plusDays(1);
        java.math.BigDecimal fee = tenant.getDeliveryCharge() != null ? tenant.getDeliveryCharge() : java.math.BigDecimal.valueOf(30.0);

        return ResponseEntity.ok(Map.of(
                "serviceable", true,
                "pincode", cleanPincode,
                "estimatedDeliveryDate", edd.toString(),
                "deliveryCharge", fee,
                "courierName", "Store Rider Fleet",
                "fulfillmentPartner", "OWN_RIDER",
                "message", "Pincode serviceable for standard and express delivery"
        ));
    }

    @PostMapping("/payment/razorpay/create-order")
    public ResponseEntity<?> createRazorpayOrder(
            @RequestParam(required = false) String subdomain,
            @RequestBody Map<String, Object> body) {
        Tenant tenant = resolveStore(subdomain);
        if (tenant == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Storefront not found"));
        }

        if (!Boolean.TRUE.equals(tenant.getRazorpayByokEnabled())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Online payment gateway is not activated for this store. Please use Direct UPI or COD."));
        }

        java.math.BigDecimal amount = new java.math.BigDecimal(body.getOrDefault("amount", 0).toString());
        String customerName = (String) body.getOrDefault("customerName", "Guest");
        String customerPhone = (String) body.getOrDefault("customerPhone", "");
        String receipt = "ord_" + System.currentTimeMillis();

        try {
            com.amazingdeal.modules.payment.razorpay.dto.RazorpayCreateOrderResponse rzpRes =
                    razorpayService.createMerchantOrder(tenant, amount, receipt, customerName, customerPhone);
            return ResponseEntity.ok(rzpRes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to initialize payment: " + e.getMessage()));
        }
    }

    @PostMapping("/payment/razorpay/verify")
    public ResponseEntity<?> verifyRazorpayPayment(
            @RequestParam(required = false) String subdomain,
            @RequestBody Map<String, String> body) {
        Tenant tenant = resolveStore(subdomain);
        if (tenant == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Storefront not found"));
        }

        String orderId = body.get("razorpayOrderId");
        String paymentId = body.get("razorpayPaymentId");
        String signature = body.get("razorpaySignature");

        boolean verified = razorpayService.verifyMerchantPayment(tenant, orderId, paymentId, signature);
        return ResponseEntity.ok(Map.of("verified", verified, "paymentId", paymentId));
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
