package com.amazingdeal.modules.payment.razorpay.repository;

import com.amazingdeal.modules.payment.razorpay.model.RazorpayTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RazorpayTransactionRepository extends JpaRepository<RazorpayTransaction, UUID> {

    Optional<RazorpayTransaction> findByOrderId(String orderId);

    Optional<RazorpayTransaction> findByPaymentId(String paymentId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM RazorpayTransaction t WHERE t.status = 'CAPTURED' OR t.status = 'PAID'")
    BigDecimal calculateTotalPlatformSaaSRevenue();

    List<RazorpayTransaction> findTop20ByOrderByCreatedAtDesc();
}
