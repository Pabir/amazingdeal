package com.amazingdeal.multitenancy;

import java.util.UUID;

/**
 * ThreadLocal storage for the current tenant's ID and subdomain.
 * Cleared automatically after every HTTP request.
 */
public final class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_TENANT_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_SUBDOMAIN = new ThreadLocal<>();

    private TenantContext() {}

    public static void setTenantId(UUID tenantId) {
        CURRENT_TENANT_ID.set(tenantId);
    }

    public static UUID getTenantId() {
        return CURRENT_TENANT_ID.get();
    }

    public static void setSubdomain(String subdomain) {
        CURRENT_SUBDOMAIN.set(subdomain);
    }

    public static String getSubdomain() {
        return CURRENT_SUBDOMAIN.get();
    }

    public static void clear() {
        CURRENT_TENANT_ID.remove();
        CURRENT_SUBDOMAIN.remove();
    }
}
