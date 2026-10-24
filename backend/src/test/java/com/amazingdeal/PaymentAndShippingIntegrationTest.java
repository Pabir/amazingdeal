package com.amazingdeal;

import com.amazingdeal.modules.ai.util.AesCryptoUtil;
import com.amazingdeal.modules.order.dto.CreateOrderRequest;
import com.amazingdeal.modules.order.dto.OrderItemDto;
import com.amazingdeal.modules.order.dto.OrderResponseDto;
import com.amazingdeal.modules.order.model.Order;
import com.amazingdeal.modules.order.repository.OrderRepository;
import com.amazingdeal.modules.order.service.OrderService;
import com.amazingdeal.modules.payment.razorpay.dto.RazorpayCreateOrderResponse;
import com.amazingdeal.modules.payment.razorpay.service.RazorpayService;
import com.amazingdeal.modules.shipping.shiprocket.service.ShiprocketService;
import com.amazingdeal.modules.tenant.dto.RegisterStoreRequest;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.repository.TenantRepository;
import com.amazingdeal.modules.tenant.service.TenantService;
import com.amazingdeal.multitenancy.TenantContext;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class PaymentAndShippingIntegrationTest {

    @Autowired
    private TenantService tenantService;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RazorpayService razorpayService;

    @Autowired
    private ShiprocketService shiprocketService;

    @Autowired
    private AesCryptoUtil aesCryptoUtil;

    private static UUID testTenantId;
    private static UUID testOrderId;

    @BeforeEach
    void setupTenantContext() {
        if (testTenantId != null) {
            TenantContext.setTenantId(testTenantId);
            TenantContext.setSubdomain("paytest" + testTenantId.toString().substring(0, 8));
        }
    }

    @AfterEach
    void clearTenantContext() {
        TenantContext.clear();
    }

    @Test
    @org.junit.jupiter.api.Order(1)
    @DisplayName("1. Setup Merchant Store with Razorpay BYOK & Shiprocket BYOK")
    void testSetupStoreWithByok() {
        String rand = UUID.randomUUID().toString().substring(0, 6);
        RegisterStoreRequest req = new RegisterStoreRequest();
        req.setStoreName("Sharma Kirana & Delivery " + rand);
        req.setSubdomain("sharma" + rand);
        req.setStoreCategory("Groceries & Daily Essentials");
        req.setStoreAddress("Shop 14, Main Market, Indiranagar, Bengaluru, Karnataka 560038");
        req.setOwnerEmail("rohan" + rand + "@gmail.com");
        req.setOwnerPhone("9845012345");
        req.setPassword("SecurePass@2026");
        req.setUpiVpa("sharmakirana@icici");
        req.setSubscriptionPlan("YEARLY");
        req.setSubscriptionPaymentRef("pay_test_byok_" + rand);

        var authRes = tenantService.registerStore(req);
        assertNotNull(authRes);
        testTenantId = authRes.getTenantId();
        TenantContext.setTenantId(testTenantId);

        Tenant tenant = tenantRepository.findById(testTenantId).orElseThrow();
        // Configure Razorpay BYOK
        tenant.setRazorpayByokEnabled(true);
        tenant.setRazorpayKeyId("rzp_test_merchant123");
        tenant.setRazorpayKeySecretEnc(aesCryptoUtil.encrypt("merchantSecretKeyTest456"));

        // Configure COD
        tenant.setCodEnabled(true);
        tenant.setCodExtraCharge(BigDecimal.valueOf(25.0)); // ₹25 COD surcharge
        tenant.setCodMinAmount(BigDecimal.valueOf(100.0));
        tenant.setCodMaxAmount(BigDecimal.valueOf(5000.0));

        // Configure Shiprocket BYOK
        tenant.setShiprocketEnabled(true);
        tenant.setShiprocketEmail("sharma.kirana.test@gmail.com");
        tenant.setShiprocketPasswordEnc(aesCryptoUtil.encrypt("ShiprocketPassTest@123"));
        tenant.setShiprocketPickupLocation("Indiranagar Store");
        tenant.setShiprocketFlatFee(BigDecimal.valueOf(50.0));
        tenant.setAllowedPincodesText("560038, 560001, 560008, 560075");

        tenantRepository.save(tenant);
        log("Merchant store created with Razorpay & Shiprocket BYOK: " + tenant.getStoreName());
    }

    @Test
    @org.junit.jupiter.api.Order(2)
    @DisplayName("2. Test Razorpay BYOK Order Creation & Verification")
    void testRazorpayByokFlow() {
        Tenant tenant = tenantRepository.findById(testTenantId).orElseThrow();

        // 1. Merchant order creation
        RazorpayCreateOrderResponse rzpRes = razorpayService.createMerchantOrder(
                tenant,
                BigDecimal.valueOf(799.00),
                "rcpt_test_101",
                "Customer Rajesh",
                "9876543210"
        );

        assertNotNull(rzpRes);
        assertNotNull(rzpRes.getOrderId());
        assertEquals("rzp_test_merchant123", rzpRes.getKeyId());
        assertEquals(79900L, rzpRes.getAmountInPaise());
        log("Razorpay BYOK Order created: " + rzpRes.getOrderId() + " with merchant Key: " + rzpRes.getKeyId());

        // 2. Merchant signature verification test
        boolean verified = razorpayService.verifyMerchantPayment(
                tenant,
                rzpRes.getOrderId(),
                "pay_simulated_998877",
                "SIMULATED_TEST_SIGNATURE"
        );
        assertTrue(verified, "Payment verification should pass simulation check");
        log("Razorpay BYOK Payment Signature Verified: TRUE");
    }

    @Test
    @org.junit.jupiter.api.Order(3)
    @DisplayName("3. Test Shiprocket Courier Serviceability & EDD")
    void testShiprocketServiceability() {
        Tenant tenant = tenantRepository.findById(testTenantId).orElseThrow();

        var sRes = shiprocketService.checkServiceability(tenant, "560038", 1.2);
        assertNotNull(sRes);
        assertTrue(sRes.isServiceable(), "Indiranagar pincode should be serviceable");
        assertNotNull(sRes.getEstimatedDeliveryDate(), "Expected Delivery Date should be generated");
        assertNotNull(sRes.getCourierName(), "Courier name should be provided");
        log("Shiprocket Serviceability: Serviceable=" + sRes.isServiceable() + ", EDD=" + sRes.getEstimatedDeliveryDate() + ", Courier=" + sRes.getCourierName());
    }

    @Test
    @org.junit.jupiter.api.Order(4)
    @DisplayName("4. Test COD Surcharge, Min/Max Limits, and Order Placement")
    void testCodSurchargeAndOrderCreation() {
        TenantContext.setTenantId(testTenantId);

        // 1. Order below min amount should fail COD
        CreateOrderRequest lowReq = new CreateOrderRequest();
        lowReq.setCustomerName("Low Amount Customer");
        lowReq.setCustomerPhone("9811223344");
        lowReq.setDeliveryAddress("100 Feet Rd, Indiranagar");
        lowReq.setDeliveryType("DELIVERY");
        lowReq.setPaymentMethod("COD");
        lowReq.setPincode("560038");
        lowReq.setItems(List.of(
                OrderItemDto.builder().title("Matchbox").price(BigDecimal.valueOf(10.0)).quantity(1).itemTotal(BigDecimal.valueOf(10.0)).build()
        ));

        assertThrows(IllegalArgumentException.class, () -> orderService.createOrder(lowReq),
                "COD order below minimum ₹100 should throw validation error");

        // 2. Valid COD order should automatically apply ₹25 surcharge
        CreateOrderRequest validReq = new CreateOrderRequest();
        validReq.setCustomerName("Sunita Rao");
        validReq.setCustomerPhone("9822334455");
        validReq.setDeliveryAddress("Flat 302, Palm Grove, Indiranagar");
        validReq.setDeliveryType("DELIVERY");
        validReq.setPaymentMethod("COD");
        validReq.setPincode("560038");
        validReq.setExpectedDeliveryDate("2026-10-26");
        validReq.setDeliveryTimeSlot("Evening (5 PM - 8 PM)");
        validReq.setFulfillmentPartner("OWN_RIDER");
        validReq.setItems(List.of(
                OrderItemDto.builder().title("Aashirvaad Atta 5kg").price(BigDecimal.valueOf(260.0)).quantity(1).itemTotal(BigDecimal.valueOf(260.0)).build(),
                OrderItemDto.builder().title("Tata Tea Gold 500g").price(BigDecimal.valueOf(290.0)).quantity(1).itemTotal(BigDecimal.valueOf(290.0)).build()
        ));

        OrderResponseDto placed = orderService.createOrder(validReq);
        assertNotNull(placed);
        testOrderId = placed.getId();

        // Items total = 550.0. Free delivery above is 499 (default) -> delivery charge = 0.
        // COD surcharge = 25.0 -> grand total = 550 + 25 = 575.00
        assertEquals(new BigDecimal("25.00"), placed.getCodExtraCharge());
        assertEquals(new BigDecimal("575.00"), placed.getTotalAmount());
        assertEquals("COD", placed.getPaymentMethod());
        assertEquals("Evening (5 PM - 8 PM)", placed.getDeliveryTimeSlot());
        log("COD Order placed: " + placed.getOrderNumber() + " with total ₹" + placed.getTotalAmount() + " (including ₹25 COD fee)");
    }

    @Test
    @org.junit.jupiter.api.Order(5)
    @DisplayName("5. Test 1-Click Ship via Shiprocket (AWB & Label)")
    void testShipViaShiprocket() {
        TenantContext.setTenantId(testTenantId);
        Tenant tenant = tenantRepository.findById(testTenantId).orElseThrow();
        Order order = orderRepository.findById(testOrderId).orElseThrow();

        var shipment = shiprocketService.createShipment(tenant, order);
        assertNotNull(shipment);
        assertNotNull(shipment.getAwbCode());
        assertNotNull(shipment.getCourierName());
        assertNotNull(shipment.getLabelUrl());

        order.setOrderStatus("OUT_FOR_DELIVERY");
        order.setFulfillmentPartner("SHIPROCKET");
        order.setShiprocketAwbCode(shipment.getAwbCode());
        order.setShiprocketCourierName(shipment.getCourierName());
        order.setShippingLabelUrl(shipment.getLabelUrl());
        orderRepository.save(order);

        log("Dispatched via Shiprocket: AWB=" + shipment.getAwbCode() + ", Courier=" + shipment.getCourierName());
    }

    @Test
    @org.junit.jupiter.api.Order(6)
    @DisplayName("6. Test Store Fleet Rider Assignment & WhatsApp Dispatch Generator")
    void testStoreRiderDispatch() {
        TenantContext.setTenantId(testTenantId);
        Tenant tenant = tenantRepository.findById(testTenantId).orElseThrow();
        Order order = orderRepository.findById(testOrderId).orElseThrow();

        String riderName = "Manoj Kumar";
        String riderPhone = "9845112233";

        String waMsg = shiprocketService.generateRiderWhatsAppMessage(tenant, order, riderName, riderPhone);
        assertNotNull(waMsg);
        assertTrue(waMsg.contains("STORE DELIVERY DISPATCH"), "WhatsApp text must have dispatch header");
        assertTrue(waMsg.contains(order.getOrderNumber()), "Must contain order number");
        assertTrue(waMsg.contains("COLLECT CASH") && waMsg.contains("575"), "Must alert rider to collect COD cash");
        assertTrue(waMsg.contains("google.com/maps"), "Must include Google Maps location link");
        log("Rider WhatsApp Dispatch Text Generated:\n" + waMsg);
    }

    private void log(String msg) {
        System.out.println("\n[PAYMENT & SHIPPING TEST] " + msg + "\n");
    }
}
