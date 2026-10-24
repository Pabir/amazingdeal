package com.amazingdeal.modules.party.service;

import com.amazingdeal.modules.party.dto.CreatePartyRequest;
import com.amazingdeal.modules.party.dto.PartyDto;
import com.amazingdeal.modules.party.model.Party;
import com.amazingdeal.modules.party.repository.PartyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartyService {

    private final PartyRepository partyRepository;

    @Transactional(readOnly = true)
    public List<PartyDto> getAllParties(String partyType, String search) {
        List<Party> parties;
        if (search != null && !search.trim().isEmpty()) {
            parties = partyRepository.searchParties(search.trim());
        } else if (partyType != null && !partyType.trim().isEmpty() && !partyType.equalsIgnoreCase("ALL")) {
            parties = partyRepository.findByPartyTypeOrderByPartyNameAsc(partyType.toUpperCase());
        } else {
            parties = partyRepository.findAllByOrderByPartyNameAsc();
        }
        return parties.stream().map(PartyDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PartyDto getPartyById(UUID id) {
        Party party = partyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Party not found with ID: " + id));
        return PartyDto.fromEntity(party);
    }

    @Transactional
    public PartyDto createParty(CreatePartyRequest request) {
        BigDecimal openingBal = request.getOpeningBalance() != null ? request.getOpeningBalance() : BigDecimal.ZERO;
        String openBalType = request.getOpeningBalanceType() != null ? request.getOpeningBalanceType().toUpperCase() : "RECEIVABLE";

        // Current balance calculation based on opening balance
        BigDecimal currentBal = BigDecimal.ZERO;
        if (openingBal.compareTo(BigDecimal.ZERO) > 0) {
            if ("RECEIVABLE".equalsIgnoreCase(openBalType)) {
                currentBal = openingBal;
            } else if ("PAYABLE".equalsIgnoreCase(openBalType)) {
                currentBal = openingBal.negate();
            }
        }

        // Auto extract state code from GSTIN if provided and billingStateCode is blank
        String stateCode = request.getBillingStateCode();
        if ((stateCode == null || stateCode.trim().isEmpty()) && request.getGstin() != null && request.getGstin().length() >= 2) {
            stateCode = request.getGstin().substring(0, 2);
        }

        Party party = Party.builder()
                .partyName(request.getPartyName().trim())
                .companyName(request.getCompanyName() != null ? request.getCompanyName().trim() : null)
                .partyType(request.getPartyType() != null ? request.getPartyType().toUpperCase() : "CUSTOMER")
                .phone(request.getPhone().trim())
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .gstin(request.getGstin() != null ? request.getGstin().trim().toUpperCase() : null)
                .pan(request.getPan() != null ? request.getPan().trim().toUpperCase() : null)
                .billingAddress(request.getBillingAddress())
                .billingStateCode(stateCode)
                .shippingAddress(request.getShippingAddress())
                .openingBalance(openingBal)
                .openingBalanceType(openBalType)
                .currentBalance(currentBal)
                .creditLimit(request.getCreditLimit())
                .creditPeriodDays(request.getCreditPeriodDays() != null ? request.getCreditPeriodDays() : 30)
                .build();

        Party saved = partyRepository.save(party);
        log.info("Created party: id={}, name={}, type={}", saved.getId(), saved.getPartyName(), saved.getPartyType());
        return PartyDto.fromEntity(saved);
    }

    @Transactional
    public PartyDto updateParty(UUID id, CreatePartyRequest request) {
        Party party = partyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Party not found with ID: " + id));

        party.setPartyName(request.getPartyName().trim());
        party.setCompanyName(request.getCompanyName() != null ? request.getCompanyName().trim() : null);
        if (request.getPartyType() != null) {
            party.setPartyType(request.getPartyType().toUpperCase());
        }
        party.setPhone(request.getPhone().trim());
        party.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        party.setGstin(request.getGstin() != null ? request.getGstin().trim().toUpperCase() : null);
        party.setPan(request.getPan() != null ? request.getPan().trim().toUpperCase() : null);
        party.setBillingAddress(request.getBillingAddress());

        String stateCode = request.getBillingStateCode();
        if ((stateCode == null || stateCode.trim().isEmpty()) && request.getGstin() != null && request.getGstin().length() >= 2) {
            stateCode = request.getGstin().substring(0, 2);
        }
        party.setBillingStateCode(stateCode);
        party.setShippingAddress(request.getShippingAddress());
        party.setCreditLimit(request.getCreditLimit());
        if (request.getCreditPeriodDays() != null) {
            party.setCreditPeriodDays(request.getCreditPeriodDays());
        }

        Party updated = partyRepository.save(party);
        return PartyDto.fromEntity(updated);
    }

    @Transactional
    public void adjustBalance(UUID partyId, BigDecimal delta) {
        Party party = partyRepository.findById(partyId)
                .orElseThrow(() -> new IllegalArgumentException("Party not found: " + partyId));
        BigDecimal newBalance = (party.getCurrentBalance() != null ? party.getCurrentBalance() : BigDecimal.ZERO).add(delta);
        party.setCurrentBalance(newBalance);
        partyRepository.save(party);
    }

    @Transactional
    public void deleteParty(UUID id) {
        if (!partyRepository.existsById(id)) {
            throw new IllegalArgumentException("Party not found with ID: " + id);
        }
        partyRepository.deleteById(id);
    }
}
