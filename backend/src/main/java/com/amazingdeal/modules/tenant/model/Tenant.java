package com.amazingdeal.modules.tenant.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tenants", indexes = {
    @Index(name = "idx_tenants_subdomain", columnList = "subdomain", unique = true),
    @Index(name = "idx_tenants_custom_domain", columnList = "custom_domain", unique = true),
    @Index(name = "idx_tenants_owner_email", columnList = "owner_email", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "store_name", nullable = false)
    private String storeName;

    @Column(name = "subdomain", nullable = false, unique = true, length = 100)
    private String subdomain;

    @Column(name = "custom_domain", unique = true, length = 255)
    private String customDomain;

    @Column(name = "owner_phone", nullable = false, length = 20)
    private String ownerPhone;

    @Column(name = "owner_email", nullable = false, unique = true, length = 255)
    private String ownerEmail;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, SUSPENDED, TRIAL

    @Column(name = "store_category", length = 1000)
    private String storeCategory; // Supports multi-category comma-separated: e.g. "Groceries, Apparel, Dairy & Bakery"

    @Column(name = "store_address", columnDefinition = "TEXT")
    private String storeAddress;

    @Column(name = "gstin", length = 15)
    private String gstin; // Merchant 15-digit GSTIN

    @Column(name = "pan", length = 10)
    private String pan;

    @Builder.Default
    @Column(name = "state_code", length = 2)
    private String stateCode = "07"; // 2-digit Indian State code e.g. "07" (Delhi), "27" (Maharashtra)

    @Builder.Default
    @Column(name = "invoice_prefix", length = 10)
    private String invoicePrefix = "INV";

    @Column(name = "invoice_terms", columnDefinition = "TEXT")
    private String invoiceTerms;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_ifsc", length = 20)
    private String bankIfsc;

    @Column(name = "bank_branch", length = 100)
    private String bankBranch;

    @Column(name = "upi_vpa", length = 100)
    private String upiVpa; // e.g. storename@okaxis / store@icici

    @Builder.Default
    @Column(name = "delivery_radius_km")
    private Double deliveryRadiusKm = 5.0;

    @Builder.Default
    @Column(name = "min_order_amount", precision = 10, scale = 2)
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "delivery_charge", precision = 10, scale = 2)
    private BigDecimal deliveryCharge = BigDecimal.valueOf(30.0);

    @Builder.Default
    @Column(name = "free_delivery_above", precision = 10, scale = 2)
    private BigDecimal freeDeliveryAbove = BigDecimal.valueOf(499.0);

    @Column(name = "store_timings", length = 100)
    private String storeTimings; // e.g. "8:00 AM - 10:00 PM"

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Builder.Default
    @Column(name = "subscription_plan", length = 50)
    private String subscriptionPlan = "MONTHLY";

    @Column(name = "subscription_expires_at")
    private Instant subscriptionExpiresAt;

    @Column(name = "subscription_payment_ref", length = 100)
    private String subscriptionPaymentRef;

    @Builder.Default
    @Column(name = "chatgpt_connected")
    private Boolean chatgptConnected = false;

    @Column(name = "chatgpt_account_email", length = 150)
    private String chatgptAccountEmail;

    @Column(name = "chatgpt_plan_tier", length = 50)
    private String chatgptPlanTier; // e.g. PLUS, PRO, TEAM, ENTERPRISE

    @Column(name = "chatgpt_access_token", columnDefinition = "TEXT")
    private String chatgptAccessToken;

    @Column(name = "chatgpt_refresh_token", columnDefinition = "TEXT")
    private String chatgptRefreshToken;

    @Column(name = "chatgpt_token_expires_at")
    private Instant chatgptTokenExpiresAt;

    @Column(name = "custom_openai_api_key", columnDefinition = "TEXT")
    private String customOpenaiApiKey;

    @Column(name = "custom_gemini_api_key", columnDefinition = "TEXT")
    private String customGeminiApiKey;

    @Builder.Default
    @Column(name = "ai_provider_preference", length = 20)
    private String aiProviderPreference = "AUTO"; // AUTO, GEMINI, OPENAI

    // ==========================================
    // Payment Gateways & Merchant BYOK Settings
    // ==========================================
    @Column(name = "payment_modes_json", columnDefinition = "TEXT")
    private String paymentModesJson; // e.g. ["UPI_DIRECT","RAZORPAY_BYOK","COD","STORE_PICKUP"]

    @Column(name = "custom_upi_qr_url", length = 500)
    private String customUpiQrUrl; // Hosted URL for merchant's printed QR sticker

    @Builder.Default
    @Column(name = "razorpay_byok_enabled")
    private Boolean razorpayByokEnabled = false;

    @Column(name = "razorpay_key_id", length = 100)
    private String razorpayKeyId;

    @Column(name = "razorpay_key_secret_enc", columnDefinition = "TEXT")
    private String razorpayKeySecretEnc;

    @Column(name = "razorpay_webhook_secret_enc", columnDefinition = "TEXT")
    private String razorpayWebhookSecretEnc;

    @Builder.Default
    @Column(name = "cashfree_byok_enabled")
    private Boolean cashfreeByokEnabled = false;

    @Column(name = "cashfree_app_id", length = 100)
    private String cashfreeAppId;

    @Column(name = "cashfree_secret_key_enc", columnDefinition = "TEXT")
    private String cashfreeSecretKeyEnc;

    @Builder.Default
    @Column(name = "cod_enabled")
    private Boolean codEnabled = true;

    @Builder.Default
    @Column(name = "cod_extra_charge", precision = 10, scale = 2)
    private BigDecimal codExtraCharge = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "cod_min_amount", precision = 10, scale = 2)
    private BigDecimal codMinAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "cod_max_amount", precision = 10, scale = 2)
    private BigDecimal codMaxAmount = BigDecimal.valueOf(10000.0);

    @Builder.Default
    @Column(name = "cod_otp_required")
    private Boolean codOtpRequired = false;

    // ==========================================
    // Delivery Engine & Logistics Settings
    // ==========================================
    @Column(name = "delivery_modes_json", columnDefinition = "TEXT")
    private String deliveryModesJson; // e.g. ["OWN_FLEET","SHIPROCKET","STORE_PICKUP"]

    @Column(name = "allowed_pincodes_text", columnDefinition = "TEXT")
    private String allowedPincodesText; // Whitelisted comma/newline separated pincodes

    @Column(name = "distance_tiers_json", columnDefinition = "TEXT")
    private String distanceTiersJson; // JSON array: [{"minKm":0,"maxKm":3,"fee":20},{"minKm":3,"maxKm":7,"fee":40}]

    @Column(name = "delivery_time_slots_json", columnDefinition = "TEXT")
    private String deliveryTimeSlotsJson; // JSON array: ["Today (5 PM - 8 PM)","Tomorrow Morning (9 AM - 12 PM)"]

    @Builder.Default
    @Column(name = "express_delivery_enabled")
    private Boolean expressDeliveryEnabled = false;

    @Builder.Default
    @Column(name = "express_delivery_minutes")
    private Integer expressDeliveryMinutes = 60;

    @Builder.Default
    @Column(name = "express_delivery_fee", precision = 10, scale = 2)
    private BigDecimal expressDeliveryFee = BigDecimal.valueOf(49.0);

    // Shiprocket BYOK
    @Builder.Default
    @Column(name = "shiprocket_enabled")
    private Boolean shiprocketEnabled = false;

    @Column(name = "shiprocket_email", length = 150)
    private String shiprocketEmail;

    @Column(name = "shiprocket_password_enc", columnDefinition = "TEXT")
    private String shiprocketPasswordEnc;

    @Column(name = "shiprocket_token_cache", columnDefinition = "TEXT")
    private String shiprocketTokenCache;

    @Column(name = "shiprocket_token_expires_at")
    private Instant shiprocketTokenExpiresAt;

    @Column(name = "shiprocket_pickup_location", length = 100)
    private String shiprocketPickupLocation;

    @Builder.Default
    @Column(name = "shiprocket_pricing_rule", length = 50)
    private String shiprocketPricingRule = "FLAT_FEE"; // FLAT_FEE, PASS_THROUGH, FREE_ABOVE

    @Builder.Default
    @Column(name = "shiprocket_flat_fee", precision = 10, scale = 2)
    private BigDecimal shiprocketFlatFee = BigDecimal.valueOf(60.0);

    @Builder.Default
    @Column(name = "shiprocket_free_above", precision = 10, scale = 2)
    private BigDecimal shiprocketFreeAbove = BigDecimal.valueOf(999.0);

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
