package com.amazingdeal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://ep-rough-fire-b4tti27m-pooler.c-6.us-east-2.aws.neon.tech:5432/amazingdeal?sslmode=require",
    "spring.datasource.username=amazingdeal_owner",
    "spring.datasource.password=npg_HoOfLN3E4FDG",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.jpa.hibernate.ddl-auto=update"
})
class NeonDatabaseConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Test
    void testLiveNeonDatabaseConnection() throws Exception {
        assertNotNull(dataSource);
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet rs = statement.executeQuery("SELECT version();")) {
            assertTrue(rs.next());
            String version = rs.getString(1);
            System.out.println(">>> SUCCESSFULLY CONNECTED TO CLOUD NEON POSTGRESQL! <<<");
            System.out.println(">>> PostgreSQL Version: " + version);

            statement.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_gemini_api_key TEXT");
            statement.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ai_provider_preference VARCHAR(20) DEFAULT 'AUTO'");
            System.out.println(">>> Verified/Created Gemini columns in tenants table! <<<");

            ResultSet tenantRs = statement.executeQuery(
                "SELECT id, store_name, subdomain, owner_email, (custom_openai_api_key IS NOT NULL) as has_key FROM tenants"
            );
            while (tenantRs.next()) {
                System.out.println("TENANT: " + tenantRs.getString("store_name") + " | " + tenantRs.getString("subdomain") + " | has_key=" + tenantRs.getBoolean("has_key"));
            }
        }
    }

    @Autowired
    private com.amazingdeal.modules.ai.service.ChatGptOAuthService chatGptOAuthService;

    @Autowired
    private com.amazingdeal.modules.tenant.repository.TenantRepository tenantRepository;

    @Autowired
    private com.amazingdeal.modules.ai.service.AiCatalogGeneratorService aiCatalogGeneratorService;

    @Test
    void testVermaKiranaKeyThrowsClearCreditExhaustedError() {
        java.util.Optional<com.amazingdeal.modules.tenant.model.Tenant> tenantOpt = tenantRepository.findBySubdomainIgnoreCase("vermakiranastores");
        assertTrue(tenantOpt.isPresent());
        com.amazingdeal.modules.tenant.model.Tenant tenant = tenantOpt.get();

        var req = com.amazingdeal.modules.ai.dto.GenerateProductFromImageRequest.builder()
                .imageUrl("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80")
                .simulateDemo(false)
                .build();

        // Must throw IllegalStateException informing user of exhausted credits rather than silently faking Atta!
        Exception ex = org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> {
            aiCatalogGeneratorService.generateProductFromImage(tenant, req);
        });

        System.out.println(">>> Caught Expected Exception: " + ex.getMessage());
        assertTrue(ex.getMessage().toLowerCase().contains("credit") || ex.getMessage().toLowerCase().contains("exhausted"));
    }

    @Test
    void testDemoModePreservesUploadedImageAndApparelContext() {
        java.util.Optional<com.amazingdeal.modules.tenant.model.Tenant> tenantOpt = tenantRepository.findBySubdomainIgnoreCase("vermakiranastores");
        assertTrue(tenantOpt.isPresent());
        com.amazingdeal.modules.tenant.model.Tenant tenant = tenantOpt.get();

        String fakePantBase64 = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

        var req = com.amazingdeal.modules.ai.dto.GenerateProductFromImageRequest.builder()
                .base64Image(fakePantBase64)
                .additionalMerchantNotes("Men's dark gray cargo pant with utility pockets")
                .simulateDemo(true)
                .build();

        var res = aiCatalogGeneratorService.generateProductFromImage(tenant, req);
        assertNotNull(res);
        System.out.println(">>> Generated Demo Title: " + res.getTitle());
        System.out.println(">>> Generated Demo Category: " + res.getCategory());
        System.out.println(">>> Generated Demo Image: " + res.getImageUrl().substring(0, 30) + "...");

        assertTrue(res.getTitle().toLowerCase().contains("cargo") || res.getTitle().toLowerCase().contains("trouser"));
        assertEquals("Apparel & Clothing", res.getCategory());
        assertEquals(fakePantBase64, res.getImageUrl());
    }

    @Test
    void testSaveGeminiApiKeyAndStatus() {
        java.util.Optional<com.amazingdeal.modules.tenant.model.Tenant> tenantOpt = tenantRepository.findBySubdomainIgnoreCase("vermakiranastores");
        assertTrue(tenantOpt.isPresent());
        com.amazingdeal.modules.tenant.model.Tenant tenant = tenantOpt.get();

        String fakeGeminiKey = "AIzaSyD1234567890abcdefghijklmnopqrstuv9999";
        var status = chatGptOAuthService.saveCustomGeminiApiKey(tenant.getId(), fakeGeminiKey);
        assertNotNull(status);
        assertTrue(status.isHasCustomGeminiKey());
        assertEquals("AIzaSy...9999", status.getMaskedGeminiKey());
        assertEquals("GEMINI", status.getActiveProvider());
        System.out.println(">>> Successfully verified Gemini API key saving & masking: " + status.getMaskedGeminiKey());

        // Test new Google AI Studio authorization key format starting with "AQ."
        String aqKey = "AQ.TestDummyKey1234567890abcdefghijklmnopqrstuv9999";
        var aqStatus = chatGptOAuthService.saveCustomGeminiApiKey(tenant.getId(), aqKey);
        assertNotNull(aqStatus);
        assertTrue(aqStatus.isHasCustomGeminiKey());
        assertEquals("AQ.Tes...9999", aqStatus.getMaskedGeminiKey());
        System.out.println(">>> Successfully verified AQ. Gemini key saving & masking: " + aqStatus.getMaskedGeminiKey());

        // Test disconnect
        var disconnected = chatGptOAuthService.disconnectGemini(tenant.getId());
        assertFalse(disconnected.isHasCustomGeminiKey());
    }
}
