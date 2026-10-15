package com.amazingdeal.multitenancy;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
@RequiredArgsConstructor
public class TenantFilter extends OncePerRequestFilter {

    private final TenantResolver tenantResolver;

    private static final Set<String> SYSTEM_SUBDOMAINS = Set.of(
        "api", "admin", "www", "app", "dashboard", "status", "mail"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            resolveTenant(request);
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private void resolveTenant(HttpServletRequest request) {
        // 1. Direct X-Tenant-ID header
        String tenantHeader = request.getHeader("X-Tenant-ID");
        if (tenantHeader != null && !tenantHeader.isBlank()) {
            try {
                UUID tenantId = UUID.fromString(tenantHeader.trim());
                TenantContext.setTenantId(tenantId);
                return;
            } catch (IllegalArgumentException e) {
                // Not a UUID, try resolving as subdomain
                Optional<UUID> resolved = tenantResolver.resolveTenantIdFromSubdomain(tenantHeader.trim());
                if (resolved.isPresent()) {
                    TenantContext.setTenantId(resolved.get());
                    TenantContext.setSubdomain(tenantHeader.trim().toLowerCase());
                    return;
                }
            }
        }

        // 2. Query param ?tenant=... or ?subdomain=...
        String tenantParam = request.getParameter("tenant");
        if (tenantParam == null || tenantParam.isBlank()) {
            tenantParam = request.getParameter("subdomain");
        }
        if (tenantParam != null && !tenantParam.isBlank()) {
            try {
                UUID tenantId = UUID.fromString(tenantParam.trim());
                TenantContext.setTenantId(tenantId);
                return;
            } catch (IllegalArgumentException e) {
                Optional<UUID> resolved = tenantResolver.resolveTenantIdFromSubdomain(tenantParam.trim());
                if (resolved.isPresent()) {
                    TenantContext.setTenantId(resolved.get());
                    TenantContext.setSubdomain(tenantParam.trim().toLowerCase());
                    return;
                }
            }
        }

        // 3. Extract from Host Header
        String host = request.getHeader("Host");
        if (host != null && !host.isBlank()) {
            String domain = host.split(":")[0].toLowerCase();
            
            // Extract subdomain: e.g. "kirana.amazingdeal.co.in" or "kirana.localhost"
            String[] parts = domain.split("\\.");
            if (parts.length >= 3 || (parts.length == 2 && parts[1].equals("localhost"))) {
                String sub = parts[0];
                if (!SYSTEM_SUBDOMAINS.contains(sub)) {
                    Optional<UUID> resolved = tenantResolver.resolveTenantIdFromSubdomain(sub);
                    if (resolved.isPresent()) {
                        TenantContext.setTenantId(resolved.get());
                        TenantContext.setSubdomain(sub);
                        return;
                    }
                }
            }

            // Fallback: check custom domain (e.g. sharmagrocery.in)
            Optional<UUID> customResolved = tenantResolver.resolveTenantIdFromCustomDomain(domain);
            if (customResolved.isPresent()) {
                TenantContext.setTenantId(customResolved.get());
            }
        }
    }
}
