package com.amazingdeal.modules.customer.repository;

import com.amazingdeal.modules.customer.model.CustomerAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, UUID> {
    List<CustomerAddress> findByCustomerIdOrderByIsDefaultDescCreatedAtDesc(UUID customerId);
    Optional<CustomerAddress> findByIdAndCustomerId(UUID id, UUID customerId);
}
