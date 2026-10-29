package com.amazingdeal.modules.tenant.controller;

import com.amazingdeal.modules.ai.util.AesCryptoUtil;
import com.amazingdeal.modules.payment.razorpay.service.RazorpayService;
import com.amazingdeal.modules.shipping.shiprocket.service.ShiprocketService;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.repository.TenantRepository;
import com.amazingdeal.multitenancy.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
public class AdminSettingsController {

    private final TenantRepository tenantRepository;
    private final AesCryptoUtil aesCryptoUtil;
    private final RazorpayService razorpayService;
    private final ShiprocketService shiprocketService;

    private static final String MASKED = "●●●●●●●●";

    @GetMapping
    public ResponseEntity<?> getSettings() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No active tenant"));
        }

        Tenant t = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found"));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", t.getId());
        res.put("storeName", t.getStoreName());
        res.put("subdomain", t.getSubdomain());
        res.put("storeCategory", t.getStoreCategory());
        res.put("storeAddress", t.getStoreAddress());
        res.put("ownerPhone", t.getOwnerPhone());
        res.put("ownerEmail", t.getOwnerEmail());
        res.put("upiVpa", t.getUpiVpa());
        res.put("deliveryRadiusKm", t.getDeliveryRadiusKm());
        res.put("deliveryCharge", t.getDeliveryCharge());
        res.put("freeDeliveryAbove", t.getFreeDeliveryAbove());
        res.put("minOrderAmount", t.getMinOrderAmount());
        res.put("storeTimings", t.getStoreTimings());
        res.put("bannerUrl", t.getBannerUrl());
        res.put("logoUrl", t.getLogoUrl());

        // GST & Bank details
        res.put("gstin", t.getGstin());
        res.put("pan", t.getPan());
        res.put("stateCode", t.getStateCode());
        res.put("invoicePrefix", t.getInvoicePrefix());
        res.put("invoiceTerms", t.getInvoiceTerms());
        res.put("bankName", t.getBankName());
        res.put("bankAccountNumber", t.getBankAccountNumber());
        res.put("bankIfsc", t.getBankIfsc());
        res.put("bankBranch", t.getBankBranch());

        // Payment Gateways & BYOK
        res.put("paymentModesJson", t.getPaymentModesJson());
        res.put("customUpiQrUrl", t.getCustomUpiQrUrl());
        res.put("razorpayByokEnabled", Boolean.TRUE.equals(t.getRazorpayByokEnabled()));
        res.put("razorpayKeyId", t.getRazorpayKeyId());
        res.put("hasRazorpaySecret", t.getRazorpayKeySecretEnc() != null && !t.getRazorpayKeySecretEnc().isBlank());
        res.put("razorpayKeySecret", t.getRazorpayKeySecretEnc() != null ? MASKED : "");
        res.put("cashfreeByokEnabled", Boolean.TRUE.equals(t.getCashfreeByokEnabled()));
        res.put("cashfreeAppId", t.getCashfreeAppId());
        res.put("codEnabled", t.getCodEnabled() != null ? t.getCodEnabled() : true);
        res.put("codExtraCharge", t.getCodExtraCharge() != null ? t.getCodExtraCharge() : BigDecimal.ZERO);
        res.put("codMinAmount", t.getCodMinAmount() != null ? t.getCodMinAmount() : BigDecimal.ZERO);
        res.put("codMaxAmount", t.getCodMaxAmount() != null ? t.getCodMaxAmount() : BigDecimal.valueOf(10000.0));
        res.put("codOtpRequired", Boolean.TRUE.equals(t.getCodOtpRequired()));

        // Delivery & Logistics
        res.put("deliveryModesJson", t.getDeliveryModesJson());
        res.put("allowedPincodesText", t.getAllowedPincodesText());
        res.put("distanceTiersJson", t.getDistanceTiersJson());
        res.put("deliveryTimeSlotsJson", t.getDeliveryTimeSlotsJson());
        res.put("expressDeliveryEnabled", Boolean.TRUE.equals(t.getExpressDeliveryEnabled()));
        res.put("expressDeliveryMinutes", t.getExpressDeliveryMinutes() != null ? t.getExpressDeliveryMinutes() : 60);
        res.put("expressDeliveryFee", t.getExpressDeliveryFee() != null ? t.getExpressDeliveryFee() : BigDecimal.valueOf(49.0));

        // Shiprocket BYOK
        res.put("shiprocketEnabled", Boolean.TRUE.equals(t.getShiprocketEnabled()));
        res.put("shiprocketEmail", t.getShiprocketEmail());
        res.put("hasShiprocketPassword", t.getShiprocketPasswordEnc() != null && !t.getShiprocketPasswordEnc().isBlank());
        res.put("shiprocketPassword", t.getShiprocketPasswordEnc() != null ? MASKED : "");
        res.put("shiprocketPickupLocation", t.getShiprocketPickupLocation());
        res.put("shiprocketPricingRule", t.getShiprocketPricingRule() != null ? t.getShiprocketPricingRule() : "FLAT_FEE");
        res.put("shiprocketFlatFee", t.getShiprocketFlatFee() != null ? t.getShiprocketFlatFee() : BigDecimal.valueOf(60.0));
        res.put("shiprocketFreeAbove", t.getShiprocketFreeAbove() != null ? t.getShiprocketFreeAbove() : BigDecimal.valueOf(999.0));

        // AI Vision & Catalog BYOK
        res.put("aiProviderPreference", t.getAiProviderPreference() != null ? t.getAiProviderPreference() : "AUTO");
        res.put("hasCustomGeminiKey", t.getCustomGeminiApiKey() != null && !t.getCustomGeminiApiKey().isBlank());
        res.put("hasCustomOpenaiKey", t.getCustomOpenaiApiKey() != null && !t.getCustomOpenaiApiKey().isBlank());

        return ResponseEntity.ok(res);
    }

    @PutMapping
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, Object> req) {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No active tenant"));
        }

        Tenant t = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found"));

        if (req.containsKey("storeName") && req.get("storeName") != null) t.setStoreName(req.get("storeName").toString().trim());
        if (req.containsKey("storeCategory") && req.get("storeCategory") != null) t.setStoreCategory(req.get("storeCategory").toString().trim());
        if (req.containsKey("storeAddress") && req.get("storeAddress") != null) t.setStoreAddress(req.get("storeAddress").toString().trim());
        if (req.containsKey("ownerPhone") && req.get("ownerPhone") != null) t.setOwnerPhone(req.get("ownerPhone").toString().trim());
        if (req.containsKey("upiVpa") && req.get("upiVpa") != null) t.setUpiVpa(req.get("upiVpa").toString().trim());
        if (req.containsKey("storeTimings") && req.get("storeTimings") != null) t.setStoreTimings(req.get("storeTimings").toString().trim());
        if (req.containsKey("bannerUrl") && req.get("bannerUrl") != null) t.setBannerUrl(req.get("bannerUrl").toString().trim());
        if (req.containsKey("logoUrl") && req.get("logoUrl") != null) t.setLogoUrl(req.get("logoUrl").toString().trim());

        // Basic delivery
        if (req.containsKey("deliveryRadiusKm") && req.get("deliveryRadiusKm") != null) {
            t.setDeliveryRadiusKm(Double.valueOf(req.get("deliveryRadiusKm").toString()));
        }
        if (req.containsKey("deliveryCharge") && req.get("deliveryCharge") != null) {
            t.setDeliveryCharge(new BigDecimal(req.get("deliveryCharge").toString()));
        }
        if (req.containsKey("freeDeliveryAbove") && req.get("freeDeliveryAbove") != null) {
            t.setFreeDeliveryAbove(new BigDecimal(req.get("freeDeliveryAbove").toString()));
        }
        if (req.containsKey("minOrderAmount") && req.get("minOrderAmount") != null) {
            t.setMinOrderAmount(new BigDecimal(req.get("minOrderAmount").toString()));
        }

        // GST & Bank details
        if (req.containsKey("gstin")) t.setGstin(req.get("gstin") != null ? req.get("gstin").toString().trim() : null);
        if (req.containsKey("pan")) t.setPan(req.get("pan") != null ? req.get("pan").toString().trim() : null);
        if (req.containsKey("stateCode")) t.setStateCode(req.get("stateCode") != null ? req.get("stateCode").toString().trim() : null);
        if (req.containsKey("invoicePrefix")) t.setInvoicePrefix(req.get("invoicePrefix") != null ? req.get("invoicePrefix").toString().trim() : "INV-");
        if (req.containsKey("invoiceTerms")) t.setInvoiceTerms(req.get("invoiceTerms") != null ? req.get("invoiceTerms").toString().trim() : null);
        if (req.containsKey("bankName")) t.setBankName(req.get("bankName") != null ? req.get("bankName").toString().trim() : null);
        if (req.containsKey("bankAccountNumber")) t.setBankAccountNumber(req.get("bankAccountNumber") != null ? req.get("bankAccountNumber").toString().trim() : null);
        if (req.containsKey("bankIfsc")) t.setBankIfsc(req.get("bankIfsc") != null ? req.get("bankIfsc").toString().trim() : null);
        if (req.containsKey("bankBranch")) t.setBankBranch(req.get("bankBranch") != null ? req.get("bankBranch").toString().trim() : null);

        // Payment Modes & BYOK
        if (req.containsKey("paymentModesJson")) t.setPaymentModesJson(req.get("paymentModesJson") != null ? req.get("paymentModesJson").toString() : null);
        if (req.containsKey("customUpiQrUrl")) t.setCustomUpiQrUrl(req.get("customUpiQrUrl") != null ? req.get("customUpiQrUrl").toString().trim() : null);

        if (req.containsKey("razorpayByokEnabled")) {
            t.setRazorpayByokEnabled(Boolean.parseBoolean(req.get("razorpayByokEnabled").toString()));
        }
        if (req.containsKey("razorpayKeyId")) {
            t.setRazorpayKeyId(req.get("razorpayKeyId") != null ? req.get("razorpayKeyId").toString().trim() : null);
        }
        if (req.containsKey("razorpayKeySecret")) {
            String sec = req.get("razorpayKeySecret") != null ? req.get("razorpayKeySecret").toString().trim() : "";
            if (!sec.isBlank() && !MASKED.equals(sec)) {
                t.setRazorpayKeySecretEnc(aesCryptoUtil.encrypt(sec));
            }
        }

        if (req.containsKey("cashfreeByokEnabled")) {
            t.setCashfreeByokEnabled(Boolean.parseBoolean(req.get("cashfreeByokEnabled").toString()));
        }
        if (req.containsKey("cashfreeAppId")) {
            t.setCashfreeAppId(req.get("cashfreeAppId") != null ? req.get("cashfreeAppId").toString().trim() : null);
        }
        if (req.containsKey("cashfreeSecretKey")) {
            String sec = req.get("cashfreeSecretKey") != null ? req.get("cashfreeSecretKey").toString().trim() : "";
            if (!sec.isBlank() && !MASKED.equals(sec)) {
                t.setCashfreeSecretKeyEnc(aesCryptoUtil.encrypt(sec));
            }
        }

        // COD rules
        if (req.containsKey("codEnabled")) t.setCodEnabled(Boolean.parseBoolean(req.get("codEnabled").toString()));
        if (req.containsKey("codExtraCharge") && req.get("codExtraCharge") != null) {
            t.setCodExtraCharge(new BigDecimal(req.get("codExtraCharge").toString()));
        }
        if (req.containsKey("codMinAmount") && req.get("codMinAmount") != null) {
            t.setCodMinAmount(new BigDecimal(req.get("codMinAmount").toString()));
        }
        if (req.containsKey("codMaxAmount") && req.get("codMaxAmount") != null) {
            t.setCodMaxAmount(new BigDecimal(req.get("codMaxAmount").toString()));
        }
        if (req.containsKey("codOtpRequired")) t.setCodOtpRequired(Boolean.parseBoolean(req.get("codOtpRequired").toString()));

        // Delivery Engine & Logistics
        if (req.containsKey("deliveryModesJson")) t.setDeliveryModesJson(req.get("deliveryModesJson") != null ? req.get("deliveryModesJson").toString() : null);
        if (req.containsKey("allowedPincodesText")) t.setAllowedPincodesText(req.get("allowedPincodesText") != null ? req.get("allowedPincodesText").toString().trim() : null);
        if (req.containsKey("distanceTiersJson")) t.setDistanceTiersJson(req.get("distanceTiersJson") != null ? req.get("distanceTiersJson").toString() : null);
        if (req.containsKey("deliveryTimeSlotsJson")) t.setDeliveryTimeSlotsJson(req.get("deliveryTimeSlotsJson") != null ? req.get("deliveryTimeSlotsJson").toString() : null);
        if (req.containsKey("expressDeliveryEnabled")) t.setExpressDeliveryEnabled(Boolean.parseBoolean(req.get("expressDeliveryEnabled").toString()));
        if (req.containsKey("expressDeliveryMinutes") && req.get("expressDeliveryMinutes") != null) {
            t.setExpressDeliveryMinutes(Integer.valueOf(req.get("expressDeliveryMinutes").toString()));
        }
        if (req.containsKey("expressDeliveryFee") && req.get("expressDeliveryFee") != null) {
            t.setExpressDeliveryFee(new BigDecimal(req.get("expressDeliveryFee").toString()));
        }

        // Shiprocket BYOK
        if (req.containsKey("shiprocketEnabled")) t.setShiprocketEnabled(Boolean.parseBoolean(req.get("shiprocketEnabled").toString()));
        if (req.containsKey("shiprocketEmail")) t.setShiprocketEmail(req.get("shiprocketEmail") != null ? req.get("shiprocketEmail").toString().trim() : null);
        if (req.containsKey("shiprocketPassword")) {
            String pwd = req.get("shiprocketPassword") != null ? req.get("shiprocketPassword").toString().trim() : "";
            if (!pwd.isBlank() && !MASKED.equals(pwd)) {
                t.setShiprocketPasswordEnc(aesCryptoUtil.encrypt(pwd));
                t.setShiprocketTokenCache(null); // Clear cached token on password change
            }
        }
        if (req.containsKey("shiprocketPickupLocation")) t.setShiprocketPickupLocation(req.get("shiprocketPickupLocation") != null ? req.get("shiprocketPickupLocation").toString().trim() : "Primary");
        if (req.containsKey("shiprocketPricingRule")) t.setShiprocketPricingRule(req.get("shiprocketPricingRule") != null ? req.get("shiprocketPricingRule").toString().trim() : "FLAT_FEE");
        if (req.containsKey("shiprocketFlatFee") && req.get("shiprocketFlatFee") != null) {
            t.setShiprocketFlatFee(new BigDecimal(req.get("shiprocketFlatFee").toString()));
        }
        if (req.containsKey("shiprocketFreeAbove") && req.get("shiprocketFreeAbove") != null) {
            t.setShiprocketFreeAbove(new BigDecimal(req.get("shiprocketFreeAbove").toString()));
        }

        // AI Vision & Catalog BYOK
        if (req.containsKey("aiProviderPreference") && req.get("aiProviderPreference") != null) {
            t.setAiProviderPreference(req.get("aiProviderPreference").toString().trim().toUpperCase());
        }
        if (req.containsKey("geminiApiKey")) {
            String gKey = req.get("geminiApiKey") != null ? req.get("geminiApiKey").toString().trim() : "";
            if (!gKey.isBlank() && !MASKED.equals(gKey)) {
                t.setCustomGeminiApiKey(aesCryptoUtil.encrypt(gKey));
            }
        }
        if (req.containsKey("openaiApiKey")) {
            String oKey = req.get("openaiApiKey") != null ? req.get("openaiApiKey").toString().trim() : "";
            if (!oKey.isBlank() && !MASKED.equals(oKey)) {
                t.setCustomOpenaiApiKey(aesCryptoUtil.encrypt(oKey));
            }
        }

        Tenant saved = tenantRepository.save(t);
        log.info("Updated store settings for tenant {}: {}", saved.getId(), saved.getStoreName());

        return getSettings();
    }

    @PostMapping("/test-razorpay")
    public ResponseEntity<?> testRazorpay(@RequestBody Map<String, String> body) {
        String keyId = body.get("keyId");
        String keySecret = body.get("keySecret");

        UUID tenantId = TenantContext.getTenantId();
        if (tenantId != null) {
            Tenant t = tenantRepository.findById(tenantId).orElse(null);
            if (t != null) {
                if ((keyId == null || keyId.isBlank()) && t.getRazorpayKeyId() != null) {
                    keyId = t.getRazorpayKeyId();
                }
                if ((keySecret == null || keySecret.isBlank() || MASKED.equals(keySecret)) && t.getRazorpayKeySecretEnc() != null) {
                    keySecret = aesCryptoUtil.decrypt(t.getRazorpayKeySecretEnc());
                }
            }
        }

        RazorpayService.RazorpayTestResult result = razorpayService.testConnectionDetailed(keyId, keySecret);
        if (result.isSuccess()) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", result.getMessage(),
                    "mode", result.getMode() != null ? result.getMode() : "LIVE"
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", result.getMessage()
            ));
        }
    }

    @PostMapping("/test-shiprocket")
    public ResponseEntity<?> testShiprocket(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        UUID tenantId = TenantContext.getTenantId();
        if (tenantId != null && (password == null || password.isBlank() || MASKED.equals(password))) {
            Tenant t = tenantRepository.findById(tenantId).orElse(null);
            if (t != null && t.getShiprocketPasswordEnc() != null) {
                password = aesCryptoUtil.decrypt(t.getShiprocketPasswordEnc());
            }
        }

        try {
            String token = shiprocketService.authenticate(email, password);
            if (token != null && !token.isBlank()) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Shiprocket credentials verified successfully! API token granted."));
            } else {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Could not obtain token from Shiprocket."));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
