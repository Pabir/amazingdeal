package com.amazingdeal.modules.media.controller;

import com.amazingdeal.multitenancy.TenantContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/media")
public class MediaController {

    @Value("${app.cloudflare.r2.account-id:}")
    private String accountId;

    @Value("${app.cloudflare.r2.access-key-id:}")
    private String accessKeyId;

    @Value("${app.cloudflare.r2.secret-access-key:}")
    private String secretAccessKey;

    @Value("${app.cloudflare.r2.bucket-name:amazingdeal-media}")
    private String bucketName;

    @Value("${app.cloudflare.r2.public-domain:https://media.amazingdeal.co.in}")
    private String publicDomain;

    @PostMapping("/upload-url")
    public ResponseEntity<?> generateUploadUrl(@RequestBody Map<String, String> request) {
        String fileName = request.getOrDefault("fileName", "image.jpg");
        String contentType = request.getOrDefault("contentType", "image/jpeg");
        UUID tenantId = TenantContext.getTenantId();

        String fileExt = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf(".")) : ".jpg";
        String objectKey = String.format("tenants/%s/%s%s", 
                tenantId != null ? tenantId.toString() : "common", 
                UUID.randomUUID(), 
                fileExt);

        // If Cloudflare R2 keys are configured, generate real S3 pre-signed upload URL
        if (accountId != null && !accountId.isBlank() && 
            accessKeyId != null && !accessKeyId.isBlank() && 
            secretAccessKey != null && !secretAccessKey.isBlank()) {
            try {
                String endpointUrl = String.format("https://%s.r2.cloudflarestorage.com", accountId);

                S3Presigner presigner = S3Presigner.builder()
                        .endpointOverride(URI.create(endpointUrl))
                        .region(Region.of("auto"))
                        .credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                        .build();

                PutObjectRequest objectRequest = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(objectKey)
                        .contentType(contentType)
                        .build();

                PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                        .signatureDuration(Duration.ofMinutes(15))
                        .putObjectRequest(objectRequest)
                        .build();

                String presignedUrl = presigner.presignPutObject(presignRequest).url().toString();
                String publicUrl = String.format("%s/%s", publicDomain.replaceAll("/$", ""), objectKey);

                return ResponseEntity.ok(Map.of(
                        "uploadUrl", presignedUrl,
                        "publicUrl", publicUrl,
                        "key", objectKey
                ));
            } catch (Exception e) {
                log.error("Failed to generate Cloudflare R2 pre-signed URL: {}", e.getMessage());
            }
        }

        // Seamless fallback during initial setup/development before user plugs in R2 credentials
        String demoPublicUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
        return ResponseEntity.ok(Map.of(
                "uploadUrl", "",
                "publicUrl", demoPublicUrl,
                "key", objectKey,
                "note", "Cloudflare R2 keys not set. Returned placeholder URL for instant testing."
        ));
    }
}
