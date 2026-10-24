package com.amazingdeal.modules.billing.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceRequest {

    private UUID partyId;
    private String partyName;
    private String partyPhone;
    private String partyGstin;
    private String partyAddress;

    @Builder.Default
    private String documentType = "TAX_INVOICE"; // TAX_INVOICE, BILL_OF_SUPPLY, ESTIMATE, PROFORMA, DELIVERY_CHALLAN, PURCHASE_BILL, CREDIT_NOTE, DEBIT_NOTE

    private String invoiceNumber;
    private String referenceNumber;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private String placeOfSupply; // 2-digit Indian state code
    private Boolean isReverseCharge;

    private String discountType;
    private BigDecimal discountAmount;

    @NotEmpty(message = "Invoice must contain at least one item")
    private List<InvoiceItemDto> items;

    private BigDecimal paidAmount;
    private String paymentMode; // CASH, UPI, CARD, BANK_TRANSFER, CHEQUE, CREDIT
    private String channel; // POS_COUNTER, ONLINE_STOREFRONT, B2B_SALES
    private UUID onlineOrderId;

    private String notes;
    private String termsConditions;
}
