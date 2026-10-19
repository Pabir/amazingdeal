package com.amazingdeal.modules.payment.razorpay.repository;

import com.amazingdeal.modules.payment.razorpay.model.RazorpayTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RazorpayTransactionRepository extends JpaRepository<RazorpayTransaction, UUID> {

    Optional<RazorpayTransaction> findByOrderId(String orderId);

    Optional<RazorpayTransaction> findByPaymentId(String paymentId);
}
