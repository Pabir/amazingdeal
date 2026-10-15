package com.amazingdeal.multitenancy;

import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class TenantResolver {

    private final TenantRepository tenantRepository;
    
    // In-memory cache for fast domain resolution (keyed by subdomain or domain)
    private final Map<String, UUID> domainToTenantCache = new ConcurrentHashMap<>();

    public Optional<UUID> resolveTenantIdFromSubdomain(String subdomain) {
        if (subdomain == null || subdomain.isBlank()) {
            return Optional.empty();
        }
        String cleanSubdomain = subdomain.trim().toLowerCase();
        
        UUID cached = domainToTenantCache.get(cleanSubdomain);
        if (cached != null) {
            return Optional.of(cached);
        }

        Optional<Tenant> tenantOpt = tenantRepository.findBySubdomainIgnoreCase(cleanSubdomain);
        if (tenantOpt.isPresent()) {
            UUID id = tenantOpt.get().getId();
            domainToTenantCache.put(cleanSubdomain, id);
            return Optional.of(id);
        }
        return Optional.empty();
    }

    public Optional<UUID> resolveTenantIdFromCustomDomain(String domain) {
        if (domain == null || domain.isBlank()) {
            return Optional.empty();
        }
        String cleanDomain = domain.trim().toLowerCase();

        UUID cached = domainToTenantCache.get(cleanDomain);
        if (cached != null) {
            return Optional.of(cached);
        }

        Optional<Tenant> tenantOpt = tenantRepository.findByCustomDomainIgnoreCase(cleanDomain);
        if (tenantOpt.isPresent()) {
            UUID id = tenantOpt.get().getId();
            domainToTenantCache.put(cleanDomain, id);
            return Optional.of(id);
        }
        return Optional.empty();
    }

    public void evictCache(String key) {
        if (key != null) {
            domainToTenantCache.remove(key.toLowerCase());
        }
    }
}
