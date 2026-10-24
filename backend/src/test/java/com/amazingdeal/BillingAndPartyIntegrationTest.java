package com.amazingdeal;

import com.amazingdeal.modules.billing.dto.CreateInvoiceRequest;
import com.amazingdeal.modules.billing.dto.InvoiceDto;
import com.amazingdeal.modules.billing.dto.InvoiceItemDto;
import com.amazingdeal.modules.billing.service.BillingService;
import com.amazingdeal.modules.party.dto.CreatePartyRequest;
import com.amazingdeal.modules.party.dto.PartyDto;
import com.amazingdeal.modules.party.service.PartyService;
import com.amazingdeal.modules.product.dto.CreateProductRequest;
import com.amazingdeal.modules.product.model.Product;
import com.amazingdeal.modules.product.service.ProductService;
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
public class BillingAndPartyIntegrationTest {

    @Autowired
    private TenantService tenantService;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private PartyService partyService;

    @Autowired
    private ProductService productService;

    @Autowired
    private BillingService billingService;

    private static UUID testTenantId;
    private static UUID testPartyId;
    private static UUID testProductId;
    private static UUID testInvoiceId;

    @BeforeEach
    void setupTenantContext() {
        if (testTenantId != null) {
            TenantContext.setTenantId(testTenantId);
            TenantContext.setSubdomain("vyapartest" + testTenantId.toString().substring(0, 8));
        }
    }

    @AfterEach
    void clearTenantContext() {
        TenantContext.clear();
    }

    @Test
    @Order(1)
    void testCreateTenantWithGstProfile() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        RegisterStoreRequest reg = new RegisterStoreRequest();
        reg.setStoreName("Gupta Enterprises " + uniqueSuffix);
        reg.setSubdomain("gupta" + uniqueSuffix);
        reg.setOwnerPhone("9812345678");
        reg.setOwnerEmail("gupta" + uniqueSuffix + "@example.com");
        reg.setPassword("Password@123");
        reg.setStoreCategory("Daily Essentials & Groceries");
        reg.setSubscriptionPaymentRef("pay_test_" + uniqueSuffix);

        var auth = tenantService.registerStore(reg);
        assertNotNull(auth);
        testTenantId = auth.getTenantId();

        Tenant tenant = tenantRepository.findById(testTenantId).orElseThrow();
        tenant.setGstin("07AAAAA1234A1Z5");
        tenant.setStateCode("07"); // Delhi
        tenant.setInvoicePrefix("INV");
        tenant.setStoreAddress("Shop 10, Chandni Chowk, Delhi");
        tenantRepository.save(tenant);

        TenantContext.setTenantId(testTenantId);
        TenantContext.setSubdomain(tenant.getSubdomain());

        System.out.println(">>> Registered Test Tenant with GSTIN: " + tenant.getGstin());
    }

    @Test
    @Order(2)
    void testCreatePartyAndKhataBalance() {
        TenantContext.setTenantId(testTenantId);

        CreatePartyRequest partyReq = CreatePartyRequest.builder()
                .partyName("Rohit Sharma")
                .companyName("Sharma Provisions")
                .partyType("CUSTOMER")
                .phone("9876500001")
                .gstin("07BBBBB5678B1Z6")
                .billingAddress("Flat 101, Model Town, Delhi")
                .openingBalance(new BigDecimal("500.00"))
                .openingBalanceType("RECEIVABLE")
                .creditLimit(new BigDecimal("20000.00"))
                .build();

        PartyDto party = partyService.createParty(partyReq);
        assertNotNull(party);
        assertNotNull(party.getId());
        assertEquals("Rohit Sharma", party.getPartyName());
        assertEquals("07", party.getBillingStateCode());
        assertEquals(0, new BigDecimal("500.00").compareTo(party.getCurrentBalance()));

        testPartyId = party.getId();
        System.out.println(">>> Created Party: " + party.getPartyName() + " with Balance: " + party.getCurrentBalance());
    }

    @Test
    @Order(3)
    void testCreateProductWithGstAndTracksInventory() {
        TenantContext.setTenantId(testTenantId);

        CreateProductRequest prodReq = new CreateProductRequest();
        prodReq.setTitle("Fortune Sunflower Oil (1L)");
        prodReq.setPrice(new BigDecimal("150.00"));
        prodReq.setComparePrice(new BigDecimal("170.00"));
        prodReq.setCategory("Cooking Oils & Ghee");
        prodReq.setHsnSac("1512");
        prodReq.setGstRate(new BigDecimal("5.00"));
        prodReq.setBarcode("890103000999");
        prodReq.setUnit("litre");
        prodReq.setInventoryQuantity(50);
        prodReq.setTracksInventory(true);

        Product product = productService.createProduct(prodReq);
        assertNotNull(product);
        assertNotNull(product.getId());
        assertEquals(50, product.getInventoryQuantity());
        assertEquals(new BigDecimal("5.00"), product.getGstRate());

        testProductId = product.getId();
        System.out.println(">>> Created Product with 5% GST: " + product.getTitle() + " | Stock: " + product.getInventoryQuantity());
    }

    @Test
    @Order(4)
    void testIntrastateGstInvoiceAndStockDecrement() {
        TenantContext.setTenantId(testTenantId);

        InvoiceItemDto item = InvoiceItemDto.builder()
                .productId(testProductId)
                .itemName("Fortune Sunflower Oil (1L)")
                .hsnSac("1512")
                .quantity(new BigDecimal("2.00"))
                .unit("litre")
                .unitPrice(new BigDecimal("150.00"))
                .discountPct(BigDecimal.ZERO)
                .gstRate(new BigDecimal("5.00"))
                .build();

        CreateInvoiceRequest invReq = CreateInvoiceRequest.builder()
                .partyId(testPartyId)
                .partyName("Rohit Sharma")
                .partyPhone("9876500001")
                .partyGstin("07BBBBB5678B1Z6")
                .documentType("TAX_INVOICE")
                .placeOfSupply("07") // Same state as Merchant (07) -> Intrastate
                .items(List.of(item))
                .paidAmount(new BigDecimal("315.00"))
                .paymentMode("CASH")
                .build();

        InvoiceDto invoice = billingService.createInvoice(invReq);
        assertNotNull(invoice);
        assertNotNull(invoice.getId());
        testInvoiceId = invoice.getId();

        // 2 * 150 = 300 base taxable
        assertEquals(0, new BigDecimal("300.00").compareTo(invoice.getSubtotal()));
        // 5% GST on 300 = 15.00 total tax -> CGST 2.5% (7.50) + SGST 2.5% (7.50), IGST 0
        assertEquals(0, new BigDecimal("7.50").compareTo(invoice.getCgstAmount()));
        assertEquals(0, new BigDecimal("7.50").compareTo(invoice.getSgstAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(invoice.getIgstAmount()));
        assertEquals(0, new BigDecimal("315.00").compareTo(invoice.getTotalAmount()));
        assertEquals("PAID", invoice.getPaymentStatus());

        // Check product stock was decremented from 50 to 48
        Product updatedProduct = productService.getAllForCurrentTenant().stream()
                .filter(p -> p.getId().equals(testProductId))
                .findFirst()
                .orElseThrow();
        assertEquals(48, updatedProduct.getInventoryQuantity());

        System.out.println(">>> Verified Intrastate Tax Invoice: " + invoice.getInvoiceNumber() + " | CGST: " + invoice.getCgstAmount() + " | SGST: " + invoice.getSgstAmount() + " | New Stock: " + updatedProduct.getInventoryQuantity());
    }

    @Test
    @Order(5)
    void testInterstateGstInvoice() {
        TenantContext.setTenantId(testTenantId);

        InvoiceItemDto item = InvoiceItemDto.builder()
                .itemName("Interstate Wholesale Cargo")
                .hsnSac("9983")
                .quantity(new BigDecimal("1.00"))
                .unit("pcs")
                .unitPrice(new BigDecimal("1000.00"))
                .discountPct(BigDecimal.ZERO)
                .gstRate(new BigDecimal("18.00"))
                .build();

        CreateInvoiceRequest invReq = CreateInvoiceRequest.builder()
                .partyName("Mumbai Distributor Corp")
                .placeOfSupply("27") // Maharashtra (27) vs Merchant Delhi (07) -> Interstate
                .documentType("TAX_INVOICE")
                .items(List.of(item))
                .paidAmount(new BigDecimal("1180.00"))
                .paymentMode("BANK_TRANSFER")
                .build();

        InvoiceDto invoice = billingService.createInvoice(invReq);
        assertNotNull(invoice);

        // Subtotal = 1000, 18% IGST = 180, CGST = 0, SGST = 0
        assertEquals(0, new BigDecimal("1000.00").compareTo(invoice.getSubtotal()));
        assertEquals(0, BigDecimal.ZERO.compareTo(invoice.getCgstAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(invoice.getSgstAmount()));
        assertEquals(0, new BigDecimal("180.00").compareTo(invoice.getIgstAmount()));
        assertEquals(0, new BigDecimal("1180.00").compareTo(invoice.getTotalAmount()));

        System.out.println(">>> Verified Interstate Tax Invoice: " + invoice.getInvoiceNumber() + " | IGST: " + invoice.getIgstAmount());
    }

    @Test
    @Order(6)
    void testConvertEstimateToInvoiceAndThermalReceipt() {
        TenantContext.setTenantId(testTenantId);

        InvoiceItemDto item = InvoiceItemDto.builder()
                .itemName("Consultation & Estimate Pack")
                .quantity(BigDecimal.ONE)
                .unitPrice(new BigDecimal("500.00"))
                .gstRate(BigDecimal.ZERO)
                .build();

        CreateInvoiceRequest estReq = CreateInvoiceRequest.builder()
                .partyName("Prospective Client")
                .documentType("ESTIMATE")
                .items(List.of(item))
                .paidAmount(BigDecimal.ZERO)
                .build();

        InvoiceDto estimate = billingService.createInvoice(estReq);
        assertEquals("ESTIMATE", estimate.getDocumentType());
        assertTrue(estimate.getInvoiceNumber().startsWith("EST-"));

        // Convert to TAX_INVOICE
        InvoiceDto converted = billingService.convertDocument(estimate.getId(), "TAX_INVOICE");
        assertEquals("TAX_INVOICE", converted.getDocumentType());
        assertTrue(converted.getInvoiceNumber().startsWith("INV-"));
        assertEquals(estimate.getInvoiceNumber(), converted.getReferenceNumber());

        // Test ESC/POS Thermal Receipt Generation
        String thermalReceipt = billingService.generateThermalReceipt(converted.getId(), 80);
        assertNotNull(thermalReceipt);
        assertTrue(thermalReceipt.contains("TAX INVOICE"));
        assertTrue(thermalReceipt.contains("Consultation & Estimate Pack"));
        assertTrue(thermalReceipt.contains("GRAND TOTAL:"));

        System.out.println(">>> Verified Thermal Receipt formatting output:\n" + thermalReceipt);
    }
}
