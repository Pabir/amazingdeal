package com.amazingdeal.modules.billing.model;

import com.amazingdeal.multitenancy.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "invoices", indexes = {
    @Index(name = "idx_invoices_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_invoices_party_id", columnList = "party_id"),
    @Index(name = "idx_invoices_invoice_number", columnList = "invoice_number"),
    @Index(name = "idx_invoices_document_type", columnList = "document_type"),
    @Index(name = "idx_invoices_invoice_date", columnList = "invoice_date"),
    @Index(name = "idx_invoices_payment_status", columnList = "payment_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "party_id")
    private UUID partyId; // Nullable for walk-in cash customer

    @Column(name = "party_name", nullable = false)
    private String partyName;

    @Column(name = "party_phone", length = 20)
    private String partyPhone;

    @Column(name = "party_gstin", length = 15)
    private String partyGstin;

    @Column(name = "party_address", columnDefinition = "TEXT")
    private String partyAddress;

    @Builder.Default
    @Column(name = "document_type", nullable = false, length = 30)
    private String documentType = "TAX_INVOICE"; // TAX_INVOICE, BILL_OF_SUPPLY, ESTIMATE, PROFORMA, DELIVERY_CHALLAN, PURCHASE_BILL, CREDIT_NOTE, DEBIT_NOTE

    @Column(name = "invoice_number", nullable = false, length = 50)
    private String invoiceNumber;

    @Column(name = "reference_number", length = 50)
    private String referenceNumber; // Original invoice ref for credit/debit notes or PO

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Builder.Default
    @Column(name = "place_of_supply", nullable = false, length = 2)
    private String placeOfSupply = "07"; // 2-digit Indian State code

    @Builder.Default
    @Column(name = "is_reverse_charge")
    private Boolean isReverseCharge = false;

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Builder.Default
    @Column(name = "discount_type", length = 10)
    private String discountType = "FIXED"; // FIXED, PERCENTAGE

    @Builder.Default
    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "cgst_amount", precision = 12, scale = 2)
    private BigDecimal cgstAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "sgst_amount", precision = 12, scale = 2)
    private BigDecimal sgstAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "igst_amount", precision = 12, scale = 2)
    private BigDecimal igstAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "cess_amount", precision = 12, scale = 2)
    private BigDecimal cessAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "round_off", precision = 6, scale = 2)
    private BigDecimal roundOff = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Builder.Default
    @Column(name = "paid_amount", precision = 12, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "balance_due", precision = 12, scale = 2)
    private BigDecimal balanceDue = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = "PAID"; // PAID, PARTIAL, UNPAID

    @Builder.Default
    @Column(name = "payment_mode", length = 30)
    private String paymentMode = "CASH"; // CASH, UPI, CARD, BANK_TRANSFER, CHEQUE, CREDIT

    @Builder.Default
    @Column(name = "channel", length = 30)
    private String channel = "POS_COUNTER"; // POS_COUNTER, ONLINE_STOREFRONT, B2B_SALES

    @Column(name = "online_order_id")
    private UUID onlineOrderId;

    @Column(name = "items_json", nullable = false, columnDefinition = "TEXT")
    private String itemsJson;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "terms_conditions", columnDefinition = "TEXT")
    private String termsConditions;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
