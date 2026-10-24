package com.amazingdeal.modules.party.model;

import com.amazingdeal.multitenancy.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "parties", indexes = {
    @Index(name = "idx_parties_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_parties_phone", columnList = "phone"),
    @Index(name = "idx_parties_gstin", columnList = "gstin"),
    @Index(name = "idx_parties_party_type", columnList = "party_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Party extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Builder.Default
    @Column(name = "party_type", nullable = false, length = 20)
    private String partyType = "CUSTOMER"; // CUSTOMER, SUPPLIER, BOTH

    @Column(name = "party_name", nullable = false)
    private String partyName;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "gstin", length = 15)
    private String gstin;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "pan", length = 10)
    private String pan;

    @Column(name = "billing_address", columnDefinition = "TEXT")
    private String billingAddress;

    @Column(name = "billing_state_code", length = 2)
    private String billingStateCode; // 2-digit Indian State code e.g. "07", "27"

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Builder.Default
    @Column(name = "opening_balance", precision = 12, scale = 2)
    private BigDecimal openingBalance = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "opening_balance_type", length = 20)
    private String openingBalanceType = "RECEIVABLE"; // RECEIVABLE ("To Receive" / Lene Hain), PAYABLE ("To Pay" / Dene Hain)

    @Builder.Default
    @Column(name = "current_balance", precision = 12, scale = 2)
    private BigDecimal currentBalance = BigDecimal.ZERO; // Positive = Party owes merchant (Receivable); Negative = Merchant owes party (Payable)

    @Column(name = "credit_limit", precision = 12, scale = 2)
    private BigDecimal creditLimit;

    @Builder.Default
    @Column(name = "credit_period_days")
    private Integer creditPeriodDays = 30;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
