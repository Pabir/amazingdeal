package com.amazingdeal;

import com.amazingdeal.modules.order.dto.CreateOrderRequest;
import com.amazingdeal.modules.order.dto.OrderItemDto;
import com.amazingdeal.modules.order.dto.OrderResponseDto;
import com.amazingdeal.modules.order.service.OrderService;
import com.amazingdeal.modules.product.model.Product;
import com.amazingdeal.modules.product.service.ProductService;
import com.amazingdeal.modules.tenant.dto.AuthResponse;
import com.amazingdeal.modules.tenant.dto.RegisterStoreRequest;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.service.TenantService;
import com.amazingdeal.multitenancy.TenantContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://ep-rough-fire-b4tti27m-pooler.c-6.us-east-2.aws.neon.tech:5432/amazingdeal?sslmode=require",
    "spring.datasource.username=amazingdeal_owner",
    "spring.datasource.password=npg_HoOfLN3E4FDG",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.jpa.hibernate.ddl-auto=update"
})
class LiveNeonEndToEndTest {

    @Autowired
    private TenantService tenantService;

    @Autowired
    private ProductService productService;

    @Autowired
    private OrderService orderService;

    @Test
    void testLiveStoreRegistrationAndOrderFlowInNeon() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        String subdomain = "store" + uniqueSuffix;

        // 1. Register a new tenant merchant
        RegisterStoreRequest registerReq = new RegisterStoreRequest();
        registerReq.setStoreName("Sharma Kirana & Sweets " + uniqueSuffix);
        registerReq.setSubdomain(subdomain);
        registerReq.setOwnerPhone("9876543210");
        registerReq.setOwnerEmail("merchant" + uniqueSuffix + "@amazingdeal.co.in");
        registerReq.setPassword("SecureMerchantPass123!");
        registerReq.setStoreCategory("Groceries & Sweets");
        registerReq.setStoreAddress("Shop 10, Main Market, Delhi");
        registerReq.setUpiVpa(subdomain + "@okaxis");
        registerReq.setSubscriptionPlan("MONTHLY");
        registerReq.setSubscriptionPaymentRef("pay_test_" + uniqueSuffix);

        AuthResponse auth = tenantService.registerStore(registerReq);
        assertNotNull(auth);
        assertNotNull(auth.getToken());
        assertEquals(subdomain, auth.getSubdomain());
        System.out.println(">>> REGISTERED STORE IN CLOUD NEON POSTGRES: " + auth.getStoreName() + " (Subdomain: " + auth.getSubdomain() + ") <<<");

        // 2. Query products seeded automatically for this store
        TenantContext.setTenantId(auth.getTenantId());
        try {
            List<Product> products = productService.getAllForCurrentTenant();
            assertFalse(products.isEmpty(), "Sample products should be auto-seeded for the store");
            System.out.println(">>> SEEDED " + products.size() + " PRODUCTS FOR STORE IN NEON POSTGRES! <<<");

            // 3. Place a customer order with UPI payment
            Product firstProd = products.get(0);
            CreateOrderRequest orderReq = new CreateOrderRequest();
            orderReq.setCustomerName("Vikram Singh");
            orderReq.setCustomerPhone("9811223344");
            orderReq.setDeliveryAddress("Flat 102, Green Park Residency, New Delhi");
            orderReq.setDeliveryType("DELIVERY");
            orderReq.setPaymentMethod("UPI_ONLINE");
            orderReq.setItems(List.of(
                OrderItemDto.builder()
                    .productId(firstProd.getId())
                    .title(firstProd.getTitle())
                    .price(firstProd.getPrice())
                    .quantity(2)
                    .build()
            ));

            OrderResponseDto order = orderService.createOrder(orderReq);
            assertNotNull(order);
            assertNotNull(order.getOrderNumber());
            assertNotNull(order.getUpiUri(), "UPI URI should be dynamically generated");
            assertNotNull(order.getUpiQrBase64(), "UPI QR code should be generated");
            System.out.println(">>> ORDER CREATED IN NEON: " + order.getOrderNumber() + " Total: INR " + order.getTotalAmount() + " <<<");
            System.out.println(">>> UPI DYNAMIC URI: " + order.getUpiUri() + " <<<");

            // 4. Generate Thermal Receipt
            String receipt = orderService.generateThermalReceipt(order.getId());
            assertNotNull(receipt);
            assertTrue(receipt.toLowerCase().contains("amazingdeal"));
            System.out.println(">>> THERMAL RECEIPT GENERATED: <<<\n" + receipt);
        } finally {
            TenantContext.clear();
        }
    }
}
