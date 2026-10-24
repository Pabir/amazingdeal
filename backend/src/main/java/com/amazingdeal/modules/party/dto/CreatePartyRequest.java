package com.amazingdeal.modules.party.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePartyRequest {

    @NotBlank(message = "Party name is required")
    private String partyName;

    private String companyName;

    @Builder.Default
    private String partyType = "CUSTOMER"; // CUSTOMER, SUPPLIER, BOTH

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String email;
    private String gstin;
    private String pan;
    private String billingAddress;
    private String billingStateCode;
    private String shippingAddress;
    private BigDecimal openingBalance;
    private String openingBalanceType;
    private BigDecimal creditLimit;
    private Integer creditPeriodDays;
}
