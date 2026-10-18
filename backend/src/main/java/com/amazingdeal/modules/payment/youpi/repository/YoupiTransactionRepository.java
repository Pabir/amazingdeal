package com.amazingdeal.modules.payment.youpi.repository;

import com.amazingdeal.modules.payment.youpi.model.YoupiTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface YoupiTransactionRepository extends JpaRepository<YoupiTransaction, UUID> {
    Optional<YoupiTransaction> findByOrderId(String orderId);
    Optional<YoupiTransaction> findByPaymentId(String paymentId);
}
