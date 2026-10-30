package com.amazingdeal.modules.billing.service;

import com.amazingdeal.modules.billing.dto.CreateInvoiceRequest;
import com.amazingdeal.modules.billing.dto.InvoiceDto;
import com.amazingdeal.modules.billing.dto.InvoiceItemDto;
import com.amazingdeal.modules.billing.model.Invoice;
import com.amazingdeal.modules.billing.repository.InvoiceRepository;
import com.amazingdeal.modules.party.model.Party;
import com.amazingdeal.modules.party.repository.PartyRepository;
import com.amazingdeal.modules.product.model.Product;
import com.amazingdeal.modules.product.repository.ProductRepository;
import com.amazingdeal.modules.tenant.model.Tenant;
import com.amazingdeal.modules.tenant.repository.TenantRepository;
import com.amazingdeal.multitenancy.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final PartyRepository partyRepository;
    private final ProductRepository productRepository;
    private final TenantRepository tenantRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<InvoiceDto> searchInvoices(String documentType, String paymentStatus, LocalDate startDate, LocalDate endDate, String query) {
        List<Invoice> list = invoiceRepository.searchInvoices(documentType, paymentStatus, startDate, endDate, query);
        return list.stream().map(InvoiceDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceDto getInvoiceById(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with ID: " + id));
        return InvoiceDto.fromEntity(invoice);
    }

    @Transactional
    public InvoiceDto createInvoice(CreateInvoiceRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        Tenant tenant = tenantId != null ? tenantRepository.findById(tenantId).orElse(null) : null;

        String merchantState = (tenant != null && tenant.getStateCode() != null && !tenant.getStateCode().isBlank())
                ? tenant.getStateCode().trim() : "07";

        String placeOfSupply = (request.getPlaceOfSupply() != null && !request.getPlaceOfSupply().isBlank())
                ? request.getPlaceOfSupply().trim() : merchantState;

        boolean isIntrastate = merchantState.equalsIgnoreCase(placeOfSupply);

        // Calculate line items with tax breakdown
        BigDecimal runningSubtotal = BigDecimal.ZERO;
        BigDecimal runningCgst = BigDecimal.ZERO;
        BigDecimal runningSgst = BigDecimal.ZERO;
        BigDecimal runningIgst = BigDecimal.ZERO;

        List<InvoiceItemDto> calculatedItems = new ArrayList<>();

        for (InvoiceItemDto item : request.getItems()) {
            BigDecimal qty = item.getQuantity() != null && item.getQuantity().compareTo(BigDecimal.ZERO) > 0 ? item.getQuantity() : BigDecimal.ONE;
            BigDecimal price = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal discountPct = item.getDiscountPct() != null ? item.getDiscountPct() : BigDecimal.ZERO;
            BigDecimal gstRate = item.getGstRate() != null ? item.getGstRate() : BigDecimal.ZERO;

            BigDecimal rawBase = qty.multiply(price).setScale(2, RoundingMode.HALF_UP);
            BigDecimal discountAmt = rawBase.multiply(discountPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal taxableAmount = rawBase.subtract(discountAmt);

            runningSubtotal = runningSubtotal.add(taxableAmount);

            BigDecimal cgstRate = BigDecimal.ZERO;
            BigDecimal cgstAmt = BigDecimal.ZERO;
            BigDecimal sgstRate = BigDecimal.ZERO;
            BigDecimal sgstAmt = BigDecimal.ZERO;
            BigDecimal igstRate = BigDecimal.ZERO;
            BigDecimal igstAmt = BigDecimal.ZERO;

            if (gstRate.compareTo(BigDecimal.ZERO) > 0) {
                if (isIntrastate) {
                    cgstRate = gstRate.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                    sgstRate = cgstRate;
                    cgstAmt = taxableAmount.multiply(cgstRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    sgstAmt = taxableAmount.multiply(sgstRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                } else {
                    igstRate = gstRate;
                    igstAmt = taxableAmount.multiply(igstRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                }
            }

            runningCgst = runningCgst.add(cgstAmt);
            runningSgst = runningSgst.add(sgstAmt);
            runningIgst = runningIgst.add(igstAmt);

            BigDecimal itemTotal = taxableAmount.add(cgstAmt).add(sgstAmt).add(igstAmt);

            calculatedItems.add(InvoiceItemDto.builder()
                    .productId(item.getProductId())
                    .itemName(item.getItemName() != null ? item.getItemName().trim() : "Item")
                    .hsnSac(item.getHsnSac() != null ? item.getHsnSac().trim() : "")
                    .quantity(qty)
                    .unit(item.getUnit() != null ? item.getUnit() : "pcs")
                    .unitPrice(price)
                    .discountPct(discountPct)
                    .gstRate(gstRate)
                    .cgstRate(cgstRate)
                    .cgstAmount(cgstAmt)
                    .sgstRate(sgstRate)
                    .sgstAmount(sgstAmt)
                    .igstRate(igstRate)
                    .igstAmount(igstAmt)
                    .totalAmount(itemTotal)
                    .build());

            // Real-time stock decrement if product is linked and tracks inventory
            if (item.getProductId() != null) {
                try {
                    Optional<Product> prodOpt = productRepository.findById(item.getProductId());
                    if (prodOpt.isPresent()) {
                        Product p = prodOpt.get();
                        if (Boolean.TRUE.equals(p.getTracksInventory()) && p.getInventoryQuantity() != null) {
                            int currentStock = p.getInventoryQuantity();
                            int deduction = qty.intValue();
                            p.setInventoryQuantity(Math.max(0, currentStock - deduction));
                            if (p.getInventoryQuantity() <= 0) {
                                p.setStatus("OUT_OF_STOCK");
                            }
                            productRepository.save(p);
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Could not deduct inventory for productId={}: {}", item.getProductId(), ex.getMessage());
                }
            }
        }

        // Apply overall bill discount if any
        BigDecimal overallDiscount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal preRoundTotal = runningSubtotal.add(runningCgst).add(runningSgst).add(runningIgst).subtract(overallDiscount);

        // Auto round-off calculation (nearest rupee)
        BigDecimal roundedTotal = preRoundTotal.setScale(0, RoundingMode.HALF_UP).setScale(2, RoundingMode.HALF_UP);
        BigDecimal roundOff = roundedTotal.subtract(preRoundTotal);

        BigDecimal paidAmount = request.getPaidAmount() != null ? request.getPaidAmount() : roundedTotal;
        BigDecimal balanceDue = roundedTotal.subtract(paidAmount);
        if (balanceDue.compareTo(BigDecimal.ZERO) < 0) balanceDue = BigDecimal.ZERO;

        String paymentStatus = "PAID";
        if (paidAmount.compareTo(BigDecimal.ZERO) <= 0) {
            paymentStatus = "UNPAID";
        } else if (balanceDue.compareTo(BigDecimal.ZERO) > 0) {
            paymentStatus = "PARTIAL";
        }

        // Auto generate sequential invoice number if not explicitly given
        String invoiceNum = request.getInvoiceNumber();
        if (invoiceNum == null || invoiceNum.isBlank()) {
            String prefix = (tenant != null && tenant.getInvoicePrefix() != null && !tenant.getInvoicePrefix().isBlank())
                    ? tenant.getInvoicePrefix() : "INV";
            String docType = request.getDocumentType() != null ? request.getDocumentType() : "TAX_INVOICE";
            if ("ESTIMATE".equalsIgnoreCase(docType)) prefix = "EST";
            else if ("DELIVERY_CHALLAN".equalsIgnoreCase(docType)) prefix = "DC";
            else if ("PURCHASE_BILL".equalsIgnoreCase(docType)) prefix = "PB";
            else if ("CREDIT_NOTE".equalsIgnoreCase(docType)) prefix = "CN";
            else if ("DEBIT_NOTE".equalsIgnoreCase(docType)) prefix = "DN";

            long count = invoiceRepository.countForTenantAndDocumentType(docType);
            invoiceNum = String.format("%s-%04d", prefix, count + 1);
        }

        String itemsJsonString = "[]";
        try {
            itemsJsonString = objectMapper.writeValueAsString(calculatedItems);
        } catch (Exception ex) {
            log.error("Failed to serialize invoice items to JSON: {}", ex.getMessage());
        }

        Invoice invoice = Invoice.builder()
                .partyId(request.getPartyId())
                .partyName(request.getPartyName() != null ? request.getPartyName().trim() : "Walk-in Customer")
                .partyPhone(request.getPartyPhone() != null ? request.getPartyPhone().trim() : null)
                .partyGstin(request.getPartyGstin() != null ? request.getPartyGstin().trim().toUpperCase() : null)
                .partyAddress(request.getPartyAddress())
                .documentType(request.getDocumentType() != null ? request.getDocumentType().toUpperCase() : "TAX_INVOICE")
                .invoiceNumber(invoiceNum)
                .referenceNumber(request.getReferenceNumber())
                .invoiceDate(request.getInvoiceDate() != null ? request.getInvoiceDate() : LocalDate.now())
                .dueDate(request.getDueDate())
                .placeOfSupply(placeOfSupply)
                .isReverseCharge(Boolean.TRUE.equals(request.getIsReverseCharge()))
                .subtotal(runningSubtotal)
                .discountType(request.getDiscountType() != null ? request.getDiscountType() : "FIXED")
                .discountAmount(overallDiscount)
                .cgstAmount(runningCgst)
                .sgstAmount(runningSgst)
                .igstAmount(runningIgst)
                .cessAmount(BigDecimal.ZERO)
                .roundOff(roundOff)
                .totalAmount(roundedTotal)
                .paidAmount(paidAmount)
                .balanceDue(balanceDue)
                .paymentStatus(paymentStatus)
                .paymentMode(request.getPaymentMode() != null ? request.getPaymentMode().toUpperCase() : "CASH")
                .channel(request.getChannel() != null ? request.getChannel().toUpperCase() : "POS_COUNTER")
                .onlineOrderId(request.getOnlineOrderId())
                .itemsJson(itemsJsonString)
                .notes(request.getNotes())
                .termsConditions(request.getTermsConditions() != null ? request.getTermsConditions() :
                        (tenant != null ? tenant.getInvoiceTerms() : "Goods once sold cannot be returned without bill."))
                .build();

        Invoice saved = invoiceRepository.save(invoice);

        // Adjust Party Khata if there is outstanding balance due
        if (request.getPartyId() != null && balanceDue.compareTo(BigDecimal.ZERO) > 0) {
            try {
                Optional<Party> partyOpt = partyRepository.findById(request.getPartyId());
                if (partyOpt.isPresent()) {
                    Party party = partyOpt.get();
                    BigDecimal current = party.getCurrentBalance() != null ? party.getCurrentBalance() : BigDecimal.ZERO;
                    party.setCurrentBalance(current.add(balanceDue));
                    partyRepository.save(party);
                }
            } catch (Exception ex) {
                log.warn("Could not update party balance: {}", ex.getMessage());
            }
        }

        log.info("Created invoice: id={}, number={}, total={}, status={}", saved.getId(), saved.getInvoiceNumber(), saved.getTotalAmount(), saved.getPaymentStatus());
        return InvoiceDto.fromEntity(saved);
    }

    @Transactional
    public InvoiceDto convertDocument(UUID id, String targetDocType) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with ID: " + id));

        String oldDocType = invoice.getDocumentType();
        invoice.setDocumentType(targetDocType.toUpperCase());
        invoice.setReferenceNumber(invoice.getInvoiceNumber());

        // Generate new sequential number for target document type
        UUID tenantId = TenantContext.getTenantId();
        Tenant tenant = tenantId != null ? tenantRepository.findById(tenantId).orElse(null) : null;
        String prefix = "INV";
        if ("TAX_INVOICE".equalsIgnoreCase(targetDocType)) {
            prefix = (tenant != null && tenant.getInvoicePrefix() != null) ? tenant.getInvoicePrefix() : "INV";
        } else if ("DELIVERY_CHALLAN".equalsIgnoreCase(targetDocType)) {
            prefix = "DC";
        }
        long count = invoiceRepository.countForTenantAndDocumentType(targetDocType.toUpperCase());
        invoice.setInvoiceNumber(String.format("%s-%04d", prefix, count + 1));

        Invoice updated = invoiceRepository.save(invoice);
        log.info("Converted invoice {} from {} to {}", id, oldDocType, targetDocType);
        return InvoiceDto.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public String generateThermalReceipt(UUID id, int widthMm) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with ID: " + id));

        UUID tenantId = TenantContext.getTenantId();
        Tenant tenant = tenantId != null ? tenantRepository.findById(tenantId).orElse(null) : null;

        int cols = widthMm == 58 ? 32 : 48;
        String line = "=".repeat(cols);
        String dash = "-".repeat(cols);

        InvoiceDto dto = InvoiceDto.fromEntity(invoice);

        StringBuilder sb = new StringBuilder();
        sb.append(centerText(tenant != null ? tenant.getStoreName() : "AmazingDeal Store", cols)).append("\n");
        if (tenant != null && tenant.getStoreAddress() != null && !tenant.getStoreAddress().isBlank()) {
            sb.append(centerText(tenant.getStoreAddress(), cols)).append("\n");
        }
        if (tenant != null && tenant.getGstin() != null && !tenant.getGstin().isBlank()) {
            sb.append(centerText("GSTIN: " + tenant.getGstin(), cols)).append("\n");
        }
        if (tenant != null && tenant.getOwnerPhone() != null) {
            sb.append(centerText("Phone: " + tenant.getOwnerPhone(), cols)).append("\n");
        }
        sb.append(line).append("\n");
        sb.append(centerText(invoice.getDocumentType().replace("_", " "), cols)).append("\n");
        sb.append(line).append("\n");

        sb.append(padTwo("Bill No: " + invoice.getInvoiceNumber(), "Date: " + invoice.getInvoiceDate(), cols)).append("\n");
        sb.append("Customer: ").append(invoice.getPartyName()).append("\n");
        if (invoice.getPartyPhone() != null && !invoice.getPartyPhone().isBlank()) {
            sb.append("Phone: ").append(invoice.getPartyPhone()).append("\n");
        }
        if (invoice.getPartyGstin() != null && !invoice.getPartyGstin().isBlank()) {
            sb.append("GSTIN: ").append(invoice.getPartyGstin()).append("\n");
        }
        sb.append(dash).append("\n");

        // Items header
        sb.append(padTwo("Item (Qty x Price)", "Total (INR)", cols)).append("\n");
        sb.append(dash).append("\n");

        for (InvoiceItemDto itm : dto.getItems()) {
            String left = itm.getItemName();
            if (left.length() > cols - 12) left = left.substring(0, cols - 15) + "...";
            sb.append(left).append("\n");
            String qtyPrice = String.format("  %.1f %s x ₹%.2f", itm.getQuantity(), itm.getUnit(), itm.getUnitPrice());
            String itmTotal = String.format("₹%.2f", itm.getTotalAmount());
            sb.append(padTwo(qtyPrice, itmTotal, cols)).append("\n");
        }

        sb.append(dash).append("\n");
        sb.append(padTwo("Subtotal:", String.format("₹%.2f", invoice.getSubtotal()), cols)).append("\n");

        if (invoice.getCgstAmount().compareTo(BigDecimal.ZERO) > 0) {
            sb.append(padTwo("CGST:", String.format("₹%.2f", invoice.getCgstAmount()), cols)).append("\n");
            sb.append(padTwo("SGST:", String.format("₹%.2f", invoice.getSgstAmount()), cols)).append("\n");
        }
        if (invoice.getIgstAmount().compareTo(BigDecimal.ZERO) > 0) {
            sb.append(padTwo("IGST:", String.format("₹%.2f", invoice.getIgstAmount()), cols)).append("\n");
        }
        if (invoice.getRoundOff().compareTo(BigDecimal.ZERO) != 0) {
            sb.append(padTwo("Round Off:", String.format("₹%.2f", invoice.getRoundOff()), cols)).append("\n");
        }
        sb.append(line).append("\n");
        sb.append(padTwo("GRAND TOTAL:", String.format("₹%.2f", invoice.getTotalAmount()), cols)).append("\n");
        sb.append(padTwo("Paid (" + invoice.getPaymentMode() + "):", String.format("₹%.2f", invoice.getPaidAmount()), cols)).append("\n");
        if (invoice.getBalanceDue().compareTo(BigDecimal.ZERO) > 0) {
            sb.append(padTwo("Balance Due:", String.format("₹%.2f", invoice.getBalanceDue()), cols)).append("\n");
        }
        sb.append(line).append("\n");

        if (tenant != null && tenant.getUpiVpa() != null && !tenant.getUpiVpa().isBlank()) {
            sb.append(centerText("Scan & Pay via UPI:", cols)).append("\n");
            sb.append(centerText(tenant.getUpiVpa(), cols)).append("\n");
            sb.append(dash).append("\n");
        }

        sb.append(centerText("Thank You! Visit Again", cols)).append("\n");
        sb.append(centerText("Powered by AmazingDeal", cols)).append("\n\n\n\n");

        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String generateGstSalesRegisterCsv(LocalDate startDate, LocalDate endDate) {
        UUID tenantId = TenantContext.getTenantId();
        Tenant tenant = tenantId != null ? tenantRepository.findById(tenantId).orElse(null) : null;
        String storeName = tenant != null && tenant.getStoreName() != null ? tenant.getStoreName() : "Store";
        String merchantGstin = tenant != null && tenant.getGstin() != null ? tenant.getGstin() : "Unregistered";

        List<Invoice> invoices = invoiceRepository.searchInvoices(null, null, startDate, endDate, null);

        StringBuilder sb = new StringBuilder();
        // UTF-8 BOM
        sb.append("\uFEFF");
        sb.append("\"GST Sales Register - ").append(escapeCsv(storeName)).append("\"\n");
        sb.append("\"Merchant GSTIN: ").append(escapeCsv(merchantGstin))
          .append("\",\"Period: ").append(startDate != null ? startDate.toString() : "All")
          .append(" to ").append(endDate != null ? endDate.toString() : "Current")
          .append("\"\n\n");

        sb.append("Sl No,Invoice Number,Invoice Date,Document Type,Customer Name,Customer GSTIN,Customer Phone,Place of Supply,Taxable Value (INR),CGST (INR),SGST (INR),IGST (INR),Total Tax (INR),Round Off,Total Amount (INR),Payment Mode,Payment Status\n");

        int sl = 1;
        BigDecimal sumTaxable = BigDecimal.ZERO;
        BigDecimal sumCgst = BigDecimal.ZERO;
        BigDecimal sumSgst = BigDecimal.ZERO;
        BigDecimal sumIgst = BigDecimal.ZERO;
        BigDecimal sumTotal = BigDecimal.ZERO;

        for (Invoice inv : invoices) {
            BigDecimal taxable = inv.getSubtotal() != null ? inv.getSubtotal() : BigDecimal.ZERO;
            BigDecimal cgst = inv.getCgstAmount() != null ? inv.getCgstAmount() : BigDecimal.ZERO;
            BigDecimal sgst = inv.getSgstAmount() != null ? inv.getSgstAmount() : BigDecimal.ZERO;
            BigDecimal igst = inv.getIgstAmount() != null ? inv.getIgstAmount() : BigDecimal.ZERO;
            BigDecimal totalTax = cgst.add(sgst).add(igst);
            BigDecimal total = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;

            sumTaxable = sumTaxable.add(taxable);
            sumCgst = sumCgst.add(cgst);
            sumSgst = sumSgst.add(sgst);
            sumIgst = sumIgst.add(igst);
            sumTotal = sumTotal.add(total);

            sb.append(sl++).append(",")
              .append("\"").append(escapeCsv(inv.getInvoiceNumber())).append("\",")
              .append(inv.getInvoiceDate() != null ? inv.getInvoiceDate().toString() : "").append(",")
              .append("\"").append(escapeCsv(inv.getDocumentType())).append("\",")
              .append("\"").append(escapeCsv(inv.getPartyName())).append("\",")
              .append("\"").append(escapeCsv(inv.getPartyGstin() != null ? inv.getPartyGstin() : "-")).append("\",")
              .append("\"").append(escapeCsv(inv.getPartyPhone() != null ? inv.getPartyPhone() : "-")).append("\",")
              .append("\"").append(escapeCsv(inv.getPlaceOfSupply() != null ? inv.getPlaceOfSupply() : "07")).append("\",")
              .append(taxable.setScale(2, RoundingMode.HALF_UP)).append(",")
              .append(cgst.setScale(2, RoundingMode.HALF_UP)).append(",")
              .append(sgst.setScale(2, RoundingMode.HALF_UP)).append(",")
              .append(igst.setScale(2, RoundingMode.HALF_UP)).append(",")
              .append(totalTax.setScale(2, RoundingMode.HALF_UP)).append(",")
              .append(inv.getRoundOff() != null ? inv.getRoundOff().setScale(2, RoundingMode.HALF_UP) : "0.00").append(",")
              .append(total.setScale(2, RoundingMode.HALF_UP)).append(",")
              .append("\"").append(escapeCsv(inv.getPaymentMode())).append("\",")
              .append("\"").append(escapeCsv(inv.getPaymentStatus())).append("\"\n");
        }

        sb.append("TOTALS,,,,,,,,")
          .append(sumTaxable.setScale(2, RoundingMode.HALF_UP)).append(",")
          .append(sumCgst.setScale(2, RoundingMode.HALF_UP)).append(",")
          .append(sumSgst.setScale(2, RoundingMode.HALF_UP)).append(",")
          .append(sumIgst.setScale(2, RoundingMode.HALF_UP)).append(",")
          .append(sumCgst.add(sumSgst).add(sumIgst).setScale(2, RoundingMode.HALF_UP)).append(",,")
          .append(sumTotal.setScale(2, RoundingMode.HALF_UP)).append(",,\n");

        return sb.toString();
    }

    private String escapeCsv(String str) {
        if (str == null) return "";
        return str.replace("\"", "\"\"");
    }

    private String centerText(String text, int width) {
        if (text == null) return "";
        if (text.length() >= width) return text.substring(0, width);
        int pad = (width - text.length()) / 2;
        return " ".repeat(pad) + text;
    }

    private String padTwo(String left, String right, int width) {
        int space = width - (left.length() + right.length());
        if (space < 1) space = 1;
        return left + " ".repeat(space) + right;
    }
}
