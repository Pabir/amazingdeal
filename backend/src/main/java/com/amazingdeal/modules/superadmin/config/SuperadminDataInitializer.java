package com.amazingdeal.modules.superadmin.config;

import com.amazingdeal.modules.superadmin.model.Superadmin;
import com.amazingdeal.modules.superadmin.repository.SuperadminRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class SuperadminDataInitializer implements CommandLineRunner {

    private final SuperadminRepository superadminRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.superadmin.default-email:superadmin@amazingdeal.co.in}")
    private String defaultEmail;

    @Value("${app.superadmin.default-password:SuperAdmin@2026!}")
    private String defaultPassword;

    @Value("${app.superadmin.default-name:AmazingDeal Master Superadmin}")
    private String defaultName;

    @Override
    public void run(String... args) {
        try {
            if (superadminRepository.count() == 0) {
                log.info("No superadmin found in database. Seeding initial platform superadmin: {}", defaultEmail);

                Superadmin superadmin = Superadmin.builder()
                        .email(defaultEmail.toLowerCase().trim())
                        .passwordHash(passwordEncoder.encode(defaultPassword))
                        .fullName(defaultName)
                        .phone("9876543210")
                        .role("ROLE_SUPERADMIN")
                        .status("ACTIVE")
                        .build();

                superadminRepository.save(superadmin);
                log.info("Initial platform superadmin created successfully with email: {}", defaultEmail);
            } else {
                log.info("Platform superadmin already initialized (count: {})", superadminRepository.count());
            }
        } catch (Exception e) {
            log.error("Failed to seed default superadmin: {}", e.getMessage(), e);
        }
    }
}

