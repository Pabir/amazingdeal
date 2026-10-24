package com.amazingdeal.modules.billing.repository;

import com.amazingdeal.modules.billing.model.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    List<Invoice> findAllByOrderByCreatedAtDesc();

    Page<Invoice> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Invoice> findByDocumentTypeOrderByCreatedAtDesc(String documentType);

    List<Invoice> findByPartyIdOrderByCreatedAtDesc(UUID partyId);

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    long countByDocumentType(String documentType);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.documentType = :documentType")
    long countForTenantAndDocumentType(@Param("documentType") String documentType);

    @Query("SELECT i FROM Invoice i WHERE " +
           "(:documentType IS NULL OR i.documentType = :documentType) AND " +
           "(:paymentStatus IS NULL OR i.paymentStatus = :paymentStatus) AND " +
           "(:startDate IS NULL OR i.invoiceDate >= :startDate) AND " +
           "(:endDate IS NULL OR i.invoiceDate <= :endDate) AND " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.partyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "i.partyPhone LIKE CONCAT('%', :query, '%')) " +
           "ORDER BY i.invoiceDate DESC, i.createdAt DESC")
    List<Invoice> searchInvoices(
            @Param("documentType") String documentType,
            @Param("paymentStatus") String paymentStatus,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("query") String query);
}
