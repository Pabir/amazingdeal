package com.amazingdeal.modules.customer.service;

import com.amazingdeal.config.JwtTokenProvider;
import com.amazingdeal.modules.customer.dto.*;
import com.amazingdeal.modules.customer.model.Customer;
import com.amazingdeal.modules.customer.model.CustomerAddress;
import com.amazingdeal.modules.customer.repository.CustomerAddressRepository;
import com.amazingdeal.modules.customer.repository.CustomerRepository;
import com.amazingdeal.modules.order.dto.OrderResponseDto;
import com.amazingdeal.modules.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository customerAddressRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final OrderService orderService;

    @Transactional
    public CustomerAuthResponse verifyOrRegister(CustomerAuthRequest request) {
        String uid = request.getFirebaseUid().trim();
        Optional<Customer> customerOpt = customerRepository.findByFirebaseUid(uid);

        Customer customer;
        if (customerOpt.isPresent()) {
            customer = customerOpt.get();
            // Update fields if provided
            if (request.getFullName() != null && !request.getFullName().isBlank()) {
                customer.setFullName(request.getFullName().trim());
            }
            if (request.getEmail() != null && !request.getEmail().isBlank()) {
                customer.setEmail(request.getEmail().trim().toLowerCase());
            }
            if (request.getPhone() != null && !request.getPhone().isBlank()) {
                customer.setPhone(request.getPhone().trim());
            }
            if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
                customer.setAvatarUrl(request.getAvatarUrl().trim());
            }
            if (request.getAuthProvider() != null) {
                customer.setAuthProvider(request.getAuthProvider());
            }
            customer = customerRepository.save(customer);
        } else {
            // Check if phone or email matches existing account to merge
            Customer matched = null;
            if (request.getEmail() != null && !request.getEmail().isBlank()) {
                matched = customerRepository.findByEmail(request.getEmail().trim().toLowerCase()).orElse(null);
            }
            if (matched == null && request.getPhone() != null && !request.getPhone().isBlank()) {
                matched = customerRepository.findByPhone(request.getPhone().trim()).orElse(null);
            }

            if (matched != null) {
                matched.setFirebaseUid(uid);
                if (request.getFullName() != null && !request.getFullName().isBlank()) {
                    matched.setFullName(request.getFullName().trim());
                }
                if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
                    matched.setAvatarUrl(request.getAvatarUrl().trim());
                }
                customer = customerRepository.save(matched);
            } else {
                customer = Customer.builder()
                        .firebaseUid(uid)
                        .fullName(request.getFullName() != null && !request.getFullName().isBlank() ? request.getFullName().trim() : "Valued Customer")
                        .email(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null)
                        .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                        .avatarUrl(request.getAvatarUrl())
                        .authProvider(request.getAuthProvider() != null ? request.getAuthProvider() : "FIREBASE")
                        .status("ACTIVE")
                        .build();
                customer = customerRepository.save(customer);
            }
        }

        String token = jwtTokenProvider.generateCustomerToken(
                customer.getId(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getFullName()
        );

        List<CustomerAddressDto> addresses = getAddresses(customer.getId());

        log.info("Customer authenticated successfully: {} (ID: {})", customer.getFullName(), customer.getId());

        return CustomerAuthResponse.builder()
                .token(token)
                .id(customer.getId())
                .fullName(customer.getFullName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .avatarUrl(customer.getAvatarUrl())
                .addresses(addresses)
                .build();
    }

    @Transactional(readOnly = true)
    public CustomerProfileDto getProfile(UUID customerId) {
        Customer c = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer profile not found"));
        return CustomerProfileDto.builder()
                .id(c.getId())
                .fullName(c.getFullName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .avatarUrl(c.getAvatarUrl())
                .build();
    }

    @Transactional
    public CustomerProfileDto updateProfile(UUID customerId, CustomerProfileDto dto) {
        Customer c = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer profile not found"));
        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            c.setFullName(dto.getFullName().trim());
        }
        if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
            c.setPhone(dto.getPhone().trim());
        }
        Customer saved = customerRepository.save(c);
        return CustomerProfileDto.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .avatarUrl(saved.getAvatarUrl())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CustomerAddressDto> getAddresses(UUID customerId) {
        return customerAddressRepository.findByCustomerIdOrderByIsDefaultDescCreatedAtDesc(customerId)
                .stream()
                .map(this::mapAddressToDto)
                .toList();
    }

    @Transactional
    public CustomerAddressDto saveAddress(UUID customerId, CustomerAddressDto dto) {
        if (Boolean.TRUE.equals(dto.getIsDefault())) {
            // Unset other defaults for this customer
            List<CustomerAddress> existing = customerAddressRepository.findByCustomerIdOrderByIsDefaultDescCreatedAtDesc(customerId);
            for (CustomerAddress addr : existing) {
                if (Boolean.TRUE.equals(addr.getIsDefault())) {
                    addr.setIsDefault(false);
                    customerAddressRepository.save(addr);
                }
            }
        }

        CustomerAddress address;
        if (dto.getId() != null) {
            address = customerAddressRepository.findByIdAndCustomerId(dto.getId(), customerId)
                    .orElseThrow(() -> new IllegalArgumentException("Address not found"));
            address.setLabel(dto.getLabel() != null ? dto.getLabel() : "Home");
            address.setRecipientName(dto.getRecipientName());
            address.setRecipientPhone(dto.getRecipientPhone());
            address.setAddressLine(dto.getAddressLine());
            address.setLandmark(dto.getLandmark());
            address.setCity(dto.getCity());
            address.setPincode(dto.getPincode());
            address.setIsDefault(dto.getIsDefault() != null ? dto.getIsDefault() : false);
        } else {
            // If it's the customer's first address, mark as default automatically
            List<CustomerAddress> existing = customerAddressRepository.findByCustomerIdOrderByIsDefaultDescCreatedAtDesc(customerId);
            boolean makeDefault = existing.isEmpty() || Boolean.TRUE.equals(dto.getIsDefault());

            address = CustomerAddress.builder()
                    .customerId(customerId)
                    .label(dto.getLabel() != null ? dto.getLabel() : "Home")
                    .recipientName(dto.getRecipientName())
                    .recipientPhone(dto.getRecipientPhone())
                    .addressLine(dto.getAddressLine())
                    .landmark(dto.getLandmark())
                    .city(dto.getCity())
                    .pincode(dto.getPincode())
                    .isDefault(makeDefault)
                    .build();
        }

        CustomerAddress saved = customerAddressRepository.save(address);
        return mapAddressToDto(saved);
    }

    @Transactional
    public void deleteAddress(UUID customerId, UUID addressId) {
        CustomerAddress address = customerAddressRepository.findByIdAndCustomerId(addressId, customerId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        customerAddressRepository.delete(address);
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> getCustomerOrders(UUID customerId, UUID optionalTenantId) {
        return orderService.getOrdersForCustomer(customerId, optionalTenantId);
    }

    private CustomerAddressDto mapAddressToDto(CustomerAddress a) {
        return CustomerAddressDto.builder()
                .id(a.getId())
                .label(a.getLabel())
                .recipientName(a.getRecipientName())
                .recipientPhone(a.getRecipientPhone())
                .addressLine(a.getAddressLine())
                .landmark(a.getLandmark())
                .city(a.getCity())
                .pincode(a.getPincode())
                .isDefault(a.getIsDefault())
                .build();
    }
}
