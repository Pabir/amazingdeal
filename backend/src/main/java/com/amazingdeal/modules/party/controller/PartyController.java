package com.amazingdeal.modules.party.controller;

import com.amazingdeal.modules.party.dto.CreatePartyRequest;
import com.amazingdeal.modules.party.dto.PartyDto;
import com.amazingdeal.modules.party.service.PartyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/parties")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MERCHANT')")
public class PartyController {

    private final PartyService partyService;

    @GetMapping
    public ResponseEntity<List<PartyDto>> getAllParties(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(partyService.getAllParties(type, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PartyDto> getPartyById(@PathVariable UUID id) {
        return ResponseEntity.ok(partyService.getPartyById(id));
    }

    @PostMapping
    public ResponseEntity<PartyDto> createParty(@Valid @RequestBody CreatePartyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(partyService.createParty(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PartyDto> updateParty(
            @PathVariable UUID id,
            @Valid @RequestBody CreatePartyRequest request) {
        return ResponseEntity.ok(partyService.updateParty(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteParty(@PathVariable UUID id) {
        partyService.deleteParty(id);
        return ResponseEntity.noContent().build();
    }
}
