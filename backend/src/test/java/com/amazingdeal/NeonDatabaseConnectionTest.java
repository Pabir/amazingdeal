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
        }
    }
}
