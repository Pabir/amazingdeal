package com.amazingdeal.modules.customer.repository;

import com.amazingdeal.modules.customer.model.Customer;
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
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByFirebaseUid(String firebaseUid);
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByPhone(String phone);

    long countByStatus(String status);

    List<Customer> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT c FROM Customer c WHERE " +
           "(:search IS NULL OR LOWER(c.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(COALESCE(c.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR c.status = :status) " +
           "ORDER BY c.createdAt DESC")
    Page<Customer> searchCustomers(@Param("search") String search,
                                   @Param("status") String status,
                                   Pageable pageable);
}
