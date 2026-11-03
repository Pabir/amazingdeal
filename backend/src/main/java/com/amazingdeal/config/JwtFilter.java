package com.amazingdeal.config;

import com.amazingdeal.multitenancy.TenantContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            if (jwtTokenProvider.validateToken(token)) {
                Claims claims = jwtTokenProvider.getClaims(token);
                String subject = claims.getSubject();
                String role = claims.get("role", String.class);
                String tenantIdStr = claims.get("tenantId", String.class);
                String subdomain = claims.get("subdomain", String.class);
                String customerIdStr = claims.get("customerId", String.class);

                if (tenantIdStr != null) {
                    try {
                        UUID tenantId = UUID.fromString(tenantIdStr);
                        TenantContext.setTenantId(tenantId);
                    } catch (Exception ignored) {}
                }
                if (subdomain != null) {
                    TenantContext.setSubdomain(subdomain);
                }
                if (customerIdStr != null) {
                    try {
                        UUID customerId = UUID.fromString(customerIdStr);
                        com.amazingdeal.multitenancy.CustomerContext.setCustomerId(customerId);
                        com.amazingdeal.multitenancy.CustomerContext.setEmail(claims.get("email", String.class));
                        com.amazingdeal.multitenancy.CustomerContext.setPhone(claims.get("phone", String.class));
                    } catch (Exception ignored) {}
                }

                List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority(role != null ? role : "ROLE_MERCHANT")
                );

                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(subject, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            com.amazingdeal.multitenancy.CustomerContext.clear();
        }
    }
}
