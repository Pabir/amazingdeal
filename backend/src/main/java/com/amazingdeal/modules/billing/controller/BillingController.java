package com.amazingdeal.modules.billing.controller;

import com.amazingdeal.modules.billing.dto.CreateInvoiceRequest;
import com.amazingdeal.modules.billing.dto.InvoiceDto;
import com.amazingdeal.modules.billing.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/invoices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MERCHANT')")
public class BillingController {

    private final BillingService billingService;

    @GetMapping
    public ResponseEntity<List<InvoiceDto>> searchInvoices(
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(billingService.searchInvoices(documentType, paymentStatus, startDate, endDate, query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDto> getInvoiceById(@PathVariable UUID id) {
        return ResponseEntity.ok(billingService.getInvoiceById(id));
    }

    @PostMapping
    public ResponseEntity<InvoiceDto> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(billingService.createInvoice(request));
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<InvoiceDto> convertDocument(
            @PathVariable UUID id,
            @RequestParam String targetDocType) {
        return ResponseEntity.ok(billingService.convertDocument(id, targetDocType));
    }

    @GetMapping(value = "/{id}/thermal-receipt", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> getThermalReceipt(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "80") int width) {
        return ResponseEntity.ok(billingService.generateThermalReceipt(id, width));
    }

    @GetMapping(value = "/export-gst-csv", produces = "text/csv; charset=UTF-8")
    public ResponseEntity<String> exportGstCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        String csv = billingService.generateGstSalesRegisterCsv(startDate, endDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"gst_sales_register.csv\"")
                .body(csv);
    }
}
