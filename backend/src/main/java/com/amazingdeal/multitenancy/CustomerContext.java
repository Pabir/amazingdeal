package com.amazingdeal.multitenancy;

import java.util.UUID;

/**
 * ThreadLocal storage for the currently authenticated customer.
 * Cleared automatically after every HTTP request.
 */
public final class CustomerContext {

    private static final ThreadLocal<UUID> CURRENT_CUSTOMER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_CUSTOMER_PHONE = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_CUSTOMER_EMAIL = new ThreadLocal<>();

    private CustomerContext() {}

    public static void setCustomerId(UUID customerId) {
        CURRENT_CUSTOMER_ID.set(customerId);
    }

    public static UUID getCustomerId() {
        return CURRENT_CUSTOMER_ID.get();
    }

    public static void setPhone(String phone) {
        CURRENT_CUSTOMER_PHONE.set(phone);
    }

    public static String getPhone() {
        return CURRENT_CUSTOMER_PHONE.get();
    }

    public static void setEmail(String email) {
        CURRENT_CUSTOMER_EMAIL.set(email);
    }

    public static String getEmail() {
        return CURRENT_CUSTOMER_EMAIL.get();
    }

    public static void clear() {
        CURRENT_CUSTOMER_ID.remove();
        CURRENT_CUSTOMER_PHONE.remove();
        CURRENT_CUSTOMER_EMAIL.remove();
    }
}
