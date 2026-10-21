package com.amazingdeal.modules.tenant.repository;

import com.amazingdeal.modules.tenant.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    Optional<Tenant> findBySubdomainIgnoreCase(String subdomain);
    Optional<Tenant> findByCustomDomainIgnoreCase(String customDomain);
    Optional<Tenant> findByOwnerEmailIgnoreCase(String ownerEmail);
    boolean existsBySubdomainIgnoreCase(String subdomain);
    boolean existsByOwnerEmailIgnoreCase(String ownerEmail);
    boolean existsBySubscriptionPaymentRef(String subscriptionPaymentRef);
}
