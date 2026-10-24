package com.amazingdeal.modules.party.dto;

import com.amazingdeal.modules.party.model.Party;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartyDto {
    private UUID id;
    private String partyType;
    private String partyName;
    private String companyName;
    private String gstin;
    private String phone;
    private String email;
    private String pan;
    private String billingAddress;
    private String billingStateCode;
    private String shippingAddress;
    private BigDecimal openingBalance;
    private String openingBalanceType;
    private BigDecimal currentBalance;
    private BigDecimal creditLimit;
    private Integer creditPeriodDays;
    private Instant createdAt;
    private Instant updatedAt;

    public static PartyDto fromEntity(Party entity) {
        if (entity == null) return null;
        return PartyDto.builder()
                .id(entity.getId())
                .partyType(entity.getPartyType())
                .partyName(entity.getPartyName())
                .companyName(entity.getCompanyName())
                .gstin(entity.getGstin())
                .phone(entity.getPhone())
                .email(entity.getEmail())
                .pan(entity.getPan())
                .billingAddress(entity.getBillingAddress())
                .billingStateCode(entity.getBillingStateCode())
                .shippingAddress(entity.getShippingAddress())
                .openingBalance(entity.getOpeningBalance())
                .openingBalanceType(entity.getOpeningBalanceType())
                .currentBalance(entity.getCurrentBalance())
                .creditLimit(entity.getCreditLimit())
                .creditPeriodDays(entity.getCreditPeriodDays())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
