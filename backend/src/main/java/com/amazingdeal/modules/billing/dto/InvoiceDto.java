package com.amazingdeal.modules.billing.dto;

import com.amazingdeal.modules.billing.model.Invoice;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDto {
    private UUID id;
    private UUID partyId;
    private String partyName;
    private String partyPhone;
    private String partyGstin;
    private String partyAddress;
    private String documentType;
    private String invoiceNumber;
    private String referenceNumber;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private String placeOfSupply;
    private Boolean isReverseCharge;
    private BigDecimal subtotal;
    private String discountType;
    private BigDecimal discountAmount;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal cessAmount;
    private BigDecimal roundOff;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal balanceDue;
    private String paymentStatus;
    private String paymentMode;
    private String channel;
    private UUID onlineOrderId;
    private List<InvoiceItemDto> items;
    private String notes;
    private String termsConditions;
    private Instant createdAt;
    private Instant updatedAt;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static InvoiceDto fromEntity(Invoice entity) {
        if (entity == null) return null;

        List<InvoiceItemDto> parsedItems = new ArrayList<>();
        if (entity.getItemsJson() != null && !entity.getItemsJson().trim().isEmpty()) {
            try {
                parsedItems = objectMapper.readValue(entity.getItemsJson(), new TypeReference<List<InvoiceItemDto>>() {});
            } catch (Exception ignored) {}
        }

        return InvoiceDto.builder()
                .id(entity.getId())
                .partyId(entity.getPartyId())
                .partyName(entity.getPartyName())
                .partyPhone(entity.getPartyPhone())
                .partyGstin(entity.getPartyGstin())
                .partyAddress(entity.getPartyAddress())
                .documentType(entity.getDocumentType())
                .invoiceNumber(entity.getInvoiceNumber())
                .referenceNumber(entity.getReferenceNumber())
                .invoiceDate(entity.getInvoiceDate())
                .dueDate(entity.getDueDate())
                .placeOfSupply(entity.getPlaceOfSupply())
                .isReverseCharge(entity.getIsReverseCharge())
                .subtotal(entity.getSubtotal())
                .discountType(entity.getDiscountType())
                .discountAmount(entity.getDiscountAmount())
                .cgstAmount(entity.getCgstAmount())
                .sgstAmount(entity.getSgstAmount())
                .igstAmount(entity.getIgstAmount())
                .cessAmount(entity.getCessAmount())
                .roundOff(entity.getRoundOff())
                .totalAmount(entity.getTotalAmount())
                .paidAmount(entity.getPaidAmount())
                .balanceDue(entity.getBalanceDue())
                .paymentStatus(entity.getPaymentStatus())
                .paymentMode(entity.getPaymentMode())
                .channel(entity.getChannel())
                .onlineOrderId(entity.getOnlineOrderId())
                .items(parsedItems)
                .notes(entity.getNotes())
                .termsConditions(entity.getTermsConditions())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
