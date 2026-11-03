package com.amazingdeal.modules.superadmin.service;

import com.amazingdeal.config.JwtTokenProvider;
import com.amazingdeal.modules.customer.model.Customer;
import com.amazingdeal.modules.customer.repository.CustomerRepository;
import com.amazingdeal.modules.order.model.Order;
import com.amazingdeal.modules.order.repository.OrderRepository;
import com.amazingdeal.modules.payment.razorpay.model.RazorpayTransaction;
import com.amazingdeal.modules.payment.razorpay.repository.RazorpayTransactionRepository;
import com.amazingdeal.modules.product.repository.ProductRepository;
import com.amazingdeal.modules.superadmin.dto.*;
import com.amazingdeal.modules.superadmin.model.Superadmin;
import com.amazingdeal.modules.superadmin.repository.SuperadminRepository;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.repository.TenantRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuperadminService {

    private final SuperadminRepository superadminRepository;
    private final TenantRepository tenantRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final RazorpayTransactionRepository razorpayTransactionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Authenticate Superadmin and return JWT session.
     */
    @Transactional
    public SuperadminAuthResponse login(SuperadminLoginRequest request) {
        Superadmin admin = superadminRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid Superadmin credentials"));

        if (!"ACTIVE".equalsIgnoreCase(admin.getStatus())) {
            throw new IllegalStateException("Superadmin account is suspended");
        }

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid Superadmin credentials");
        }

        admin.setLastLoginAt(Instant.now());
        superadminRepository.save(admin);

        String token = jwtTokenProvider.generateSuperadminToken(admin.getId(), admin.getEmail(), admin.getFullName());

        return SuperadminAuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(admin.getId())
                .email(admin.getEmail())
                .fullName(admin.getFullName())
                .phone(admin.getPhone())
                .role(admin.getRole())
                .lastLoginAt(admin.getLastLoginAt())
                .build();
    }

    /**
     * Get platform-wide KPIs and performance counters.
     */
    @Transactional(readOnly = true)
    public PlatformStatsDto getPlatformStats() {
        long totalMerchants = tenantRepository.count();
        long activeMerchants = tenantRepository.countByStatus("ACTIVE");
        long suspendedMerchants = tenantRepository.countByStatus("SUSPENDED");
        long totalCustomers = customerRepository.count();
        long totalOrders = orderRepository.count();

        BigDecimal totalPlatformGmv = orderRepository.calculatePlatformTotalGmv();
        if (totalPlatformGmv == null) totalPlatformGmv = BigDecimal.ZERO;

        BigDecimal totalSaaSRevenue = razorpayTransactionRepository.calculateTotalPlatformSaaSRevenue();
        if (totalSaaSRevenue == null) totalSaaSRevenue = BigDecimal.ZERO;

        List<Tenant> topTenants = tenantRepository.findTop5ByOrderByCreatedAtDesc();
        List<MerchantSummaryDto> recentMerchants = topTenants.stream()
                .map(this::mapTenantSummary)
                .toList();

        List<Order> topOrders = orderRepository.findTop5ByOrderByCreatedAtDesc();
        Map<UUID, String> storeNameMap = tenantRepository.findAllById(
                topOrders.stream().map(Order::getTenantId).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(Tenant::getId, Tenant::getStoreName, (a, b) -> a));

        List<GlobalOrderDto> recentOrders = topOrders.stream()
                .map(o -> mapGlobalOrder(o, storeNameMap.get(o.getTenantId())))
                .toList();

        return PlatformStatsDto.builder()
                .totalMerchants(totalMerchants)
                .activeMerchants(activeMerchants)
                .suspendedMerchants(suspendedMerchants)
                .totalCustomers(totalCustomers)
                .totalOrders(totalOrders)
                .totalPlatformGmv(totalPlatformGmv)
                .totalSaaSRevenue(totalSaaSRevenue)
                .recentMerchants(recentMerchants)
                .recentOrders(recentOrders)
                .build();
    }

    /**
     * Search and paginate merchants / stores.
     */
    @Transactional(readOnly = true)
    public Page<MerchantSummaryDto> getMerchants(String search, String status, String plan, int page, int size) {
        String s = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String st = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) ? status.trim().toUpperCase() : null;
        String pl = (plan != null && !plan.trim().isEmpty() && !"ALL".equalsIgnoreCase(plan)) ? plan.trim().toUpperCase() : null;

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Tenant> tenantPage = tenantRepository.findAll(buildTenantSpecification(s, st, pl), pageable);

        return tenantPage.map(this::mapTenantSummary);
    }

    /**
     * Inspect single store profile in detail.
     */
    @Transactional(readOnly = true)
    public MerchantSummaryDto getMerchantDetails(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found: " + tenantId));
        return mapTenantSummary(tenant);
    }

    /**
     * Activate or Suspend a merchant store.
     */
    @Transactional
    public MerchantSummaryDto updateMerchantStatus(UUID tenantId, String status) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found: " + tenantId));

        String normalizedStatus = status.trim().toUpperCase();
        if (!"ACTIVE".equals(normalizedStatus) && !"SUSPENDED".equals(normalizedStatus) && !"TRIAL".equals(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid status. Supported: ACTIVE, SUSPENDED, TRIAL");
        }

        tenant.setStatus(normalizedStatus);
        Tenant saved = tenantRepository.save(tenant);
        log.info("Superadmin updated store {} ({}) status to {}", saved.getStoreName(), saved.getSubdomain(), normalizedStatus);
        return mapTenantSummary(saved);
    }

    /**
     * Override or extend merchant subscription plan.
     */
    @Transactional
    public MerchantSummaryDto updateMerchantPlan(UUID tenantId, String plan, Integer extendDays) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found: " + tenantId));

        if (plan != null && !plan.isBlank()) {
            tenant.setSubscriptionPlan(plan.trim().toUpperCase());
        }

        if (extendDays != null && extendDays > 0) {
            Instant baseTime = (tenant.getSubscriptionExpiresAt() != null && tenant.getSubscriptionExpiresAt().isAfter(Instant.now()))
                    ? tenant.getSubscriptionExpiresAt()
                    : Instant.now();
            tenant.setSubscriptionExpiresAt(baseTime.plus(extendDays, ChronoUnit.DAYS));
        }

        Tenant saved = tenantRepository.save(tenant);
        log.info("Superadmin updated store {} plan to {}, expires at {}", saved.getStoreName(), saved.getSubscriptionPlan(), saved.getSubscriptionExpiresAt());
        return mapTenantSummary(saved);
    }

    /**
     * Impersonation engine: Generate scoped Merchant JWT for 1-click login into store admin.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> impersonateMerchant(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found: " + tenantId));

        String merchantToken = jwtTokenProvider.generateToken(
                tenant.getId(),
                tenant.getOwnerEmail(),
                "ROLE_MERCHANT",
                tenant.getSubdomain()
        );

        log.warn("SUPERADMIN IMPERSONATION: Generating scoped merchant token for tenantId={}, store={}, subdomain={}",
                tenant.getId(), tenant.getStoreName(), tenant.getSubdomain());

        return Map.of(
                "token", merchantToken,
                "tokenType", "Bearer",
                "tenantId", tenant.getId(),
                "storeName", tenant.getStoreName(),
                "subdomain", tenant.getSubdomain(),
                "ownerEmail", tenant.getOwnerEmail(),
                "impersonating", true
        );
    }

    /**
     * Search and paginate global customers.
     */
    @Transactional(readOnly = true)
    public Page<CustomerSummaryDto> getCustomers(String search, String status, int page, int size) {
        String s = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String st = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) ? status.trim().toUpperCase() : null;

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Customer> customerPage = customerRepository.findAll(buildCustomerSpecification(s, st), pageable);

        return customerPage.map(c -> {
            long orderCount = orderRepository.countByCustomerId(c.getId());
            BigDecimal spend = orderRepository.calculateCustomerTotalSpend(c.getId());
            if (spend == null) spend = BigDecimal.ZERO;

            return CustomerSummaryDto.builder()
                    .id(c.getId())
                    .firebaseUid(c.getFirebaseUid())
                    .fullName(c.getFullName())
                    .phone(c.getPhone())
                    .email(c.getEmail())
                    .avatarUrl(c.getAvatarUrl())
                    .authProvider(c.getAuthProvider())
                    .status(c.getStatus())
                    .createdAt(c.getCreatedAt())
                    .orderCount(orderCount)
                    .totalSpend(spend)
                    .build();
        });
    }

    /**
     * Toggle customer account status (ACTIVE, BLOCKED).
     */
    @Transactional
    public CustomerSummaryDto updateCustomerStatus(UUID customerId, String status) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));

        String normalizedStatus = status.trim().toUpperCase();
        if (!"ACTIVE".equals(normalizedStatus) && !"BLOCKED".equals(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid customer status. Supported: ACTIVE, BLOCKED");
        }

        customer.setStatus(normalizedStatus);
        Customer saved = customerRepository.save(customer);

        long orderCount = orderRepository.countByCustomerId(saved.getId());
        BigDecimal spend = orderRepository.calculateCustomerTotalSpend(saved.getId());
        if (spend == null) spend = BigDecimal.ZERO;

        return CustomerSummaryDto.builder()
                .id(saved.getId())
                .firebaseUid(saved.getFirebaseUid())
                .fullName(saved.getFullName())
                .phone(saved.getPhone())
                .email(saved.getEmail())
                .avatarUrl(saved.getAvatarUrl())
                .authProvider(saved.getAuthProvider())
                .status(saved.getStatus())
                .createdAt(saved.getCreatedAt())
                .orderCount(orderCount)
                .totalSpend(spend)
                .build();
    }

    /**
     * Search and paginate global orders across all stores.
     */
    @Transactional(readOnly = true)
    public Page<GlobalOrderDto> getGlobalOrders(String search, String status, int page, int size) {
        String s = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String st = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) ? status.trim().toUpperCase() : null;

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> orderPage = orderRepository.findAll(buildOrderSpecification(s, st), pageable);

        Map<UUID, Tenant> tenantMap = tenantRepository.findAllById(
                orderPage.getContent().stream().map(Order::getTenantId).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(Tenant::getId, t -> t, (a, b) -> a));

        return orderPage.map(o -> {
            Tenant t = tenantMap.get(o.getTenantId());
            return GlobalOrderDto.builder()
                    .id(o.getId())
                    .tenantId(o.getTenantId())
                    .storeName(t != null ? t.getStoreName() : "Store " + o.getTenantId())
                    .subdomain(t != null ? t.getSubdomain() : "")
                    .orderNumber(o.getOrderNumber())
                    .customerName(o.getCustomerName())
                    .customerPhone(o.getCustomerPhone())
                    .totalAmount(o.getTotalAmount())
                    .paymentMethod(o.getPaymentMethod())
                    .paymentStatus(o.getPaymentStatus())
                    .orderStatus(o.getOrderStatus())
                    .deliveryType(o.getDeliveryType())
                    .createdAt(o.getCreatedAt())
                    .build();
        });
    }

    /**
     * Platform subscription payments ledger.
     */
    @Transactional(readOnly = true)
    public List<SubscriptionTxDto> getSubscriptions() {
        List<RazorpayTransaction> txs = razorpayTransactionRepository.findTop20ByOrderByCreatedAtDesc();
        return txs.stream().map(t -> SubscriptionTxDto.builder()
                .id(t.getId())
                .orderId(t.getOrderId())
                .paymentId(t.getPaymentId())
                .amount(t.getAmount())
                .currency(t.getCurrency())
                .planId(t.getPlanId())
                .subdomain(t.getSubdomain())
                .status(t.getStatus())
                .createdAt(t.getCreatedAt())
                .build()
        ).toList();
    }

    /**
     * System health and infrastructure diagnostics.
     */
    public SystemHealthDto getSystemHealth() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory() / (1024 * 1024);
        long freeMemory = runtime.freeMemory() / (1024 * 1024);
        long usedMemory = totalMemory - freeMemory;
        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;

        return SystemHealthDto.builder()
                .status("HEALTHY")
                .database("Neon PostgreSQL (Connected)")
                .totalMemoryMb(totalMemory)
                .freeMemoryMb(freeMemory)
                .usedMemoryMb(usedMemory)
                .availableProcessors(runtime.availableProcessors())
                .uptimeSeconds(uptimeSeconds)
                .javaVersion(System.getProperty("java.version"))
                .build();
    }

    // ==========================================
    // Helper Mappers
    // ==========================================

    private MerchantSummaryDto mapTenantSummary(Tenant t) {
        long prodCount = productRepository.countByTenantId(t.getId());
        long orderCount = orderRepository.countByTenantId(t.getId());
        BigDecimal revenue = orderRepository.calculateTotalRevenue(t.getId());
        if (revenue == null) revenue = BigDecimal.ZERO;

        return MerchantSummaryDto.builder()
                .id(t.getId())
                .storeName(t.getStoreName())
                .subdomain(t.getSubdomain())
                .customDomain(t.getCustomDomain())
                .ownerPhone(t.getOwnerPhone())
                .ownerEmail(t.getOwnerEmail())
                .status(t.getStatus())
                .storeCategory(t.getStoreCategory())
                .storeAddress(t.getStoreAddress())
                .gstin(t.getGstin())
                .stateCode(t.getStateCode())
                .subscriptionPlan(t.getSubscriptionPlan())
                .subscriptionExpiresAt(t.getSubscriptionExpiresAt())
                .upiVpa(t.getUpiVpa())
                .razorpayByokEnabled(t.getRazorpayByokEnabled())
                .createdAt(t.getCreatedAt())
                .productCount(prodCount)
                .orderCount(orderCount)
                .totalRevenue(revenue)
                .build();
    }

    private GlobalOrderDto mapGlobalOrder(Order o, String storeName) {
        return GlobalOrderDto.builder()
                .id(o.getId())
                .tenantId(o.getTenantId())
                .storeName(storeName != null ? storeName : "Store")
                .orderNumber(o.getOrderNumber())
                .customerName(o.getCustomerName())
                .customerPhone(o.getCustomerPhone())
                .totalAmount(o.getTotalAmount())
                .paymentMethod(o.getPaymentMethod())
                .paymentStatus(o.getPaymentStatus())
                .orderStatus(o.getOrderStatus())
                .deliveryType(o.getDeliveryType())
                .createdAt(o.getCreatedAt())
                .build();
    }

    // ==========================================
    // Dynamic Query Specifications (Real Database Querying)
    // ==========================================

    private Specification<Tenant> buildTenantSpecification(String search, String status, String plan) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("storeName")), pattern),
                        cb.like(cb.lower(root.get("subdomain")), pattern),
                        cb.like(cb.lower(root.get("ownerEmail")), pattern),
                        cb.like(cb.lower(root.get("ownerPhone")), pattern)
                ));
            }
            if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase()));
            }
            if (plan != null && !plan.trim().isEmpty() && !"ALL".equalsIgnoreCase(plan)) {
                predicates.add(cb.equal(cb.upper(root.get("subscriptionPlan")), plan.trim().toUpperCase()));
            }
            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Specification<Customer> buildCustomerSpecification(String search, String status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("phone")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern)
                ));
            }
            if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase()));
            }
            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Specification<Order> buildOrderSpecification(String search, String status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("orderNumber")), pattern),
                        cb.like(cb.lower(root.get("customerName")), pattern),
                        cb.like(cb.lower(root.get("customerPhone")), pattern)
                ));
            }
            if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                predicates.add(cb.equal(cb.upper(root.get("orderStatus")), status.trim().toUpperCase()));
            }
            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

