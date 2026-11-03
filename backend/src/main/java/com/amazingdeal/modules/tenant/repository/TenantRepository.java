package com.amazingdeal.modules.tenant.repository;

import com.amazingdeal.modules.tenant.model.Tenant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
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

    long countByStatus(String status);

    List<Tenant> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT t FROM Tenant t WHERE " +
           "(:search IS NULL OR LOWER(t.storeName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(t.subdomain) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(t.ownerEmail) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(t.ownerPhone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:plan IS NULL OR t.subscriptionPlan = :plan) " +
           "ORDER BY t.createdAt DESC")
    Page<Tenant> searchTenants(@Param("search") String search,
                               @Param("status") String status,
                               @Param("plan") String plan,
                               Pageable pageable);
}
