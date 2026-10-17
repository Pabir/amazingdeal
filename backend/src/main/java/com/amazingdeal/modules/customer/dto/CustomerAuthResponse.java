package com.amazingdeal.modules.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerAuthResponse {
    private String token;
    private UUID id;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private List<CustomerAddressDto> addresses;
}
