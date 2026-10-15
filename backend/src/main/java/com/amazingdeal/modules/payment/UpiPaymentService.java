package com.amazingdeal.modules.payment;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Slf4j
@Service
public class UpiPaymentService {

    /**
     * Generates standard NPCI UPI Intent String
     * Format: upi://pay?pa={vpa}&pn={name}&am={amount}&cu=INR&tn={note}&tr={refId}
     */
    public String generateUpiUri(String upiVpa, String merchantName, BigDecimal amount, String orderNumber, String refId) {
        String cleanVpa = (upiVpa != null && !upiVpa.isBlank()) ? upiVpa.trim() : "merchant@upi";
        String cleanName = (merchantName != null && !merchantName.isBlank()) ? merchantName.trim() : "Merchant Store";
        String formattedAmount = amount.setScale(2, RoundingMode.HALF_UP).toString();

        return String.format(
            "upi://pay?pa=%s&pn=%s&am=%s&cu=INR&tn=%s&tr=%s",
            urlEncode(cleanVpa),
            urlEncode(cleanName),
            formattedAmount,
            urlEncode("Order " + orderNumber),
            urlEncode(refId)
        );
    }

    /**
     * Generates a Base64 data URL for a PNG QR Code image
     */
    public String generateQrCodeBase64(String content, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, width, height);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            byte[] pngData = outputStream.toByteArray();

            return "data:image/png;base64," + Base64.getEncoder().encodeToString(pngData);
        } catch (Exception e) {
            log.error("Failed to generate QR Code image: {}", e.getMessage());
            return "";
        }
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
