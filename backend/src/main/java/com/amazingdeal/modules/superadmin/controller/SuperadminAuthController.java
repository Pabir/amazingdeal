package com.amazingdeal.modules.superadmin.controller;

import com.amazingdeal.modules.superadmin.dto.SuperadminAuthResponse;
import com.amazingdeal.modules.superadmin.dto.SuperadminLoginRequest;
import com.amazingdeal.modules.superadmin.service.SuperadminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/superadmin/auth")
@RequiredArgsConstructor
public class SuperadminAuthController {

    private final SuperadminService superadminService;

    @PostMapping("/login")
    public ResponseEntity<SuperadminAuthResponse> login(@Valid @RequestBody SuperadminLoginRequest request) {
        SuperadminAuthResponse response = superadminService.login(request);
        return ResponseEntity.ok(response);
    }
}

