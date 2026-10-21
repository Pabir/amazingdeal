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

            ResultSet colRs = statement.executeQuery(
                "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'custom_openai_api_key'"
            );
            if (colRs.next()) {
                System.out.println("tenants.custom_openai_api_key data_type = " + colRs.getString("data_type"));
            }
        }
    }

    @Autowired
    private com.amazingdeal.modules.ai.service.ChatGptOAuthService chatGptOAuthService;

    @Autowired
    private com.amazingdeal.modules.tenant.repository.TenantRepository tenantRepository;

    @Test
    void testSaveCustomApiKeyWithLongProjectKey() {
        var existingTenants = tenantRepository.findAll();
        assertFalse(existingTenants.isEmpty(), "Expected at least one tenant in database");
        var tenant = existingTenants.get(0);
        String oldKey = tenant.getCustomOpenaiApiKey();

        // A standard 164-character OpenAI Project API key (sk-proj-...)
        String fakeLongApiKey = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstu";
        assertTrue(fakeLongApiKey.length() >= 160);

        var response = chatGptOAuthService.saveCustomApiKey(tenant.getId(), fakeLongApiKey);
        assertNotNull(response);
        assertTrue(response.isHasCustomApiKey());
        System.out.println(">>> Successfully saved long custom API key! Masked: " + response.getMaskedApiKey());

        // Restore
        tenant.setCustomOpenaiApiKey(oldKey);
        tenantRepository.save(tenant);
    }
}
