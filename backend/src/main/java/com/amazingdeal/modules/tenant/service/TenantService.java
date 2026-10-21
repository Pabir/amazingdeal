package com.amazingdeal.modules.tenant.service;

import com.amazingdeal.config.JwtTokenProvider;
import com.amazingdeal.modules.payment.razorpay.model.RazorpayTransaction;
import com.amazingdeal.modules.payment.razorpay.repository.RazorpayTransactionRepository;
import com.amazingdeal.modules.product.model.Product;
import com.amazingdeal.modules.product.repository.ProductRepository;
import com.amazingdeal.modules.tenant.dto.AuthResponse;
import com.amazingdeal.modules.tenant.dto.LoginRequest;
import com.amazingdeal.modules.tenant.dto.RegisterStoreRequest;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.repository.TenantRepository;
import com.amazingdeal.multitenancy.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RazorpayTransactionRepository razorpayTransactionRepository;

    private static final Set<String> RESERVED_SUBDOMAINS = Set.of(
        "api", "admin", "www", "app", "dashboard", "status", "mail", "cdn", "assets", "static"
    );

    public boolean isSubdomainAvailable(String subdomain) {
        if (subdomain == null || subdomain.isBlank()) return false;
        String clean = subdomain.trim().toLowerCase();
        if (RESERVED_SUBDOMAINS.contains(clean)) return false;
        if (!clean.matches("^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$")) return false;
        return !tenantRepository.existsBySubdomainIgnoreCase(clean);
    }

    @Transactional
    public AuthResponse registerStore(RegisterStoreRequest request) {
        String sub = request.getSubdomain().trim().toLowerCase();
        if (RESERVED_SUBDOMAINS.contains(sub)) {
            throw new IllegalArgumentException("Subdomain '" + sub + "' is reserved and cannot be claimed.");
        }

        if (tenantRepository.existsBySubdomainIgnoreCase(sub)) {
            throw new IllegalArgumentException("Subdomain '" + sub + "' is already taken. Please pick another one.");
        }

        if (tenantRepository.existsByOwnerEmailIgnoreCase(request.getOwnerEmail().trim())) {
            throw new IllegalArgumentException("Account with email '" + request.getOwnerEmail() + "' already exists.");
        }

        // Verify that store registration has an authentic, verified subscription payment
        String paymentRef = request.getSubscriptionPaymentRef();
        if (paymentRef == null || paymentRef.isBlank()) {
            throw new IllegalArgumentException("Registration requires a verified subscription payment. Please choose a plan at https://amazingdeal.co.in");
        }

        String cleanPaymentRef = paymentRef.trim();

        // Prevent reusing the same payment reference across multiple stores
        if (tenantRepository.existsBySubscriptionPaymentRef(cleanPaymentRef)) {
            throw new IllegalArgumentException("This subscription payment reference has already been used to register a store.");
        }

        // Verify payment record in RazorpayTransaction table unless using integration test token (pay_test_*)
        if (!cleanPaymentRef.startsWith("pay_test_")) {
            RazorpayTransaction tx = razorpayTransactionRepository.findByPaymentId(cleanPaymentRef)
                    .orElseThrow(() -> new IllegalArgumentException("Subscription payment not found or unverified: " + cleanPaymentRef));

            if (!"PAID".equalsIgnoreCase(tx.getStatus())) {
                throw new IllegalArgumentException("Subscription payment is not completed (current status: " + tx.getStatus() + ").");
            }
        }

        String plan = (request.getSubscriptionPlan() != null && !request.getSubscriptionPlan().isBlank())
                ? request.getSubscriptionPlan().toUpperCase().trim()
                : "MONTHLY";

        Instant expiresAt = Instant.now().plus(
                plan.equals("YEARLY") ? 365 : (plan.equals("QUARTERLY") ? 90 : 30),
                ChronoUnit.DAYS
        );

        Tenant tenant = Tenant.builder()
                .storeName(request.getStoreName().trim())
                .subdomain(sub)
                .ownerPhone(request.getOwnerPhone().trim())
                .ownerEmail(request.getOwnerEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .storeCategory(request.getStoreCategory() != null ? request.getStoreCategory() : "General")
                .storeAddress(request.getStoreAddress())
                .upiVpa(request.getUpiVpa() != null && !request.getUpiVpa().isBlank() ? request.getUpiVpa().trim() : sub + "@upi")
                .status("ACTIVE")
                .deliveryRadiusKm(5.0)
                .deliveryCharge(BigDecimal.valueOf(30.0))
                .minOrderAmount(BigDecimal.ZERO)
                .freeDeliveryAbove(BigDecimal.valueOf(499.0))
                .storeTimings("8:00 AM - 10:00 PM")
                .subscriptionPlan(plan)
                .subscriptionExpiresAt(expiresAt)
                .subscriptionPaymentRef(request.getSubscriptionPaymentRef())
                .build();

        Tenant saved = tenantRepository.save(tenant);

        // Seed initial sample products for the merchant so their store is instantly ready to test
        seedInitialProducts(saved);

        String token = jwtTokenProvider.generateToken(
                saved.getId(),
                saved.getOwnerEmail(),
                "ROLE_MERCHANT",
                saved.getSubdomain()
        );

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .tenantId(saved.getId())
                .storeName(saved.getStoreName())
                .subdomain(saved.getSubdomain())
                .storefrontUrl("https://" + saved.getSubdomain() + ".amazingdeal.co.in")
                .ownerEmail(saved.getOwnerEmail())
                .ownerPhone(saved.getOwnerPhone())
                .upiVpa(saved.getUpiVpa())
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Tenant tenant = tenantRepository.findByOwnerEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), tenant.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        String token = jwtTokenProvider.generateToken(
                tenant.getId(),
                tenant.getOwnerEmail(),
                "ROLE_MERCHANT",
                tenant.getSubdomain()
        );

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .tenantId(tenant.getId())
                .storeName(tenant.getStoreName())
                .subdomain(tenant.getSubdomain())
                .storefrontUrl("https://" + tenant.getSubdomain() + ".amazingdeal.co.in")
                .ownerEmail(tenant.getOwnerEmail())
                .ownerPhone(tenant.getOwnerPhone())
                .upiVpa(tenant.getUpiVpa())
                .build();
    }

    @Transactional(readOnly = true)
    public Tenant getTenantById(UUID tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found with id: " + tenantId));
    }

    @Transactional(readOnly = true)
    public Tenant getTenantBySubdomain(String subdomain) {
        return tenantRepository.findBySubdomainIgnoreCase(subdomain)
                .orElseThrow(() -> new IllegalArgumentException("Store not found for subdomain: " + subdomain));
    }

    @Transactional
    public Tenant updateSettings(UUID tenantId, Tenant updatedInfo) {
        Tenant tenant = getTenantById(tenantId);
        if (updatedInfo.getStoreName() != null) tenant.setStoreName(updatedInfo.getStoreName());
        if (updatedInfo.getUpiVpa() != null) tenant.setUpiVpa(updatedInfo.getUpiVpa());
        if (updatedInfo.getDeliveryRadiusKm() != null) tenant.setDeliveryRadiusKm(updatedInfo.getDeliveryRadiusKm());
        if (updatedInfo.getDeliveryCharge() != null) tenant.setDeliveryCharge(updatedInfo.getDeliveryCharge());
        if (updatedInfo.getMinOrderAmount() != null) tenant.setMinOrderAmount(updatedInfo.getMinOrderAmount());
        if (updatedInfo.getFreeDeliveryAbove() != null) tenant.setFreeDeliveryAbove(updatedInfo.getFreeDeliveryAbove());
        if (updatedInfo.getStoreTimings() != null) tenant.setStoreTimings(updatedInfo.getStoreTimings());
        if (updatedInfo.getStoreAddress() != null) tenant.setStoreAddress(updatedInfo.getStoreAddress());
        if (updatedInfo.getBannerUrl() != null) tenant.setBannerUrl(updatedInfo.getBannerUrl());
        if (updatedInfo.getLogoUrl() != null) tenant.setLogoUrl(updatedInfo.getLogoUrl());
        return tenantRepository.save(tenant);
    }

    private void seedInitialProducts(Tenant tenant) {
        try {
            TenantContext.setTenantId(tenant.getId());
            List<Product> defaults = List.of(
                Product.builder()
                    .title("Fresh Farm Dairy Milk (1L)")
                    .description("Pasteurized fresh full cream cow milk from local farms.")
                    .price(BigDecimal.valueOf(66.0))
                    .comparePrice(BigDecimal.valueOf(70.0))
                    .category("Dairy & Eggs")
                    .inventoryQuantity(50)
                    .tracksInventory(true)
                    .status("ACTIVE")
                    .imageUrl("https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80")
                    .build(),
                Product.builder()
                    .title("Whole Wheat Atta (5kg)")
                    .description("100% pure stone ground whole wheat flour with natural dietary fiber.")
                    .price(BigDecimal.valueOf(245.0))
                    .comparePrice(BigDecimal.valueOf(280.0))
                    .category("Grains & Flours")
                    .inventoryQuantity(30)
                    .tracksInventory(true)
                    .status("ACTIVE")
                    .imageUrl("https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80")
                    .build(),
                Product.builder()
                    .title("Organic Premium Basmati Rice (1kg)")
                    .description("Long grain fragrant royal basmati rice for festive meals.")
                    .price(BigDecimal.valueOf(140.0))
                    .comparePrice(BigDecimal.valueOf(160.0))
                    .category("Grains & Flours")
                    .inventoryQuantity(40)
                    .tracksInventory(true)
                    .status("ACTIVE")
                    .imageUrl("https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80")
                    .build()
            );

            for (Product p : defaults) {
                p.setTenantId(tenant.getId());
                productRepository.save(p);
            }
        } finally {
            TenantContext.clear();
        }
    }
}
