package com.amazingdeal.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}") String secret,
            @Value("${app.jwt.expiration-ms:2592000000}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(UUID tenantId, String email, String role, String subdomain) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)
                .claim("tenantId", tenantId.toString())
                .claim("subdomain", subdomain)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String generateCustomerToken(UUID customerId, String email, String phone, String fullName) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + (expirationMs * 30)); // 30 days customer session

        String subject = (email != null && !email.isBlank()) ? email : (phone != null ? phone : customerId.toString());

        return Jwts.builder()
                .subject(subject)
                .claim("customerId", customerId.toString())
                .claim("fullName", fullName != null ? fullName : "Customer")
                .claim("email", email)
                .claim("phone", phone)
                .claim("role", "ROLE_CUSTOMER")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID getTenantId(String token) {
        Claims claims = getClaims(token);
        String tenantIdStr = claims.get("tenantId", String.class);
        return UUID.fromString(tenantIdStr);
    }

    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }
}
