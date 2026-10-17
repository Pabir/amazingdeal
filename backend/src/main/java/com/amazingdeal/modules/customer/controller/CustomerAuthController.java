package com.amazingdeal.modules.customer.controller;

import com.amazingdeal.modules.customer.dto.CustomerAuthRequest;
import com.amazingdeal.modules.customer.dto.CustomerAuthResponse;
import com.amazingdeal.modules.customer.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/store/customer/auth")
@RequiredArgsConstructor
public class CustomerAuthController {

    private final CustomerService customerService;

    @PostMapping("/verify")
    public ResponseEntity<CustomerAuthResponse> verifyAndLogin(@Valid @RequestBody CustomerAuthRequest request) {
        CustomerAuthResponse response = customerService.verifyOrRegister(request);
        return ResponseEntity.ok(response);
    }
}
