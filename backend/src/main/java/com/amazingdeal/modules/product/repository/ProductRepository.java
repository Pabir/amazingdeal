package com.amazingdeal.modules.product.repository;

import com.amazingdeal.modules.product.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByTenantId(UUID tenantId);
    Page<Product> findByTenantId(UUID tenantId, Pageable pageable);
    
    List<Product> findByTenantIdAndStatus(UUID tenantId, String status);
    Page<Product> findByTenantIdAndStatus(UUID tenantId, String status, Pageable pageable);

    List<Product> findByTenantIdAndCategoryIgnoreCaseAndStatus(UUID tenantId, String category, String status);

    Optional<Product> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByTenantId(UUID tenantId);
    long countByTenantIdAndStatus(UUID tenantId, String status);
}
