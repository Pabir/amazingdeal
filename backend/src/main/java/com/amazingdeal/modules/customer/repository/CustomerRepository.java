package com.amazingdeal.modules.customer.repository;

import com.amazingdeal.modules.customer.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByFirebaseUid(String firebaseUid);
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByPhone(String phone);
}
