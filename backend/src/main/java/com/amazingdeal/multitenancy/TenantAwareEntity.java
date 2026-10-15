package com.amazingdeal.multitenancy;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.io.Serializable;
import java.util.UUID;

/**
 * Base mapped superclass for all multi-tenant entities.
 * Automatically injects the active tenant ID and applies the Hibernate filter.
 */
@Getter
@Setter
@MappedSuperclass
@FilterDef(
    name = "tenantFilter",
    parameters = @ParamDef(name = "tenantId", type = UUID.class)
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public abstract class TenantAwareEntity implements Serializable {

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @PrePersist
    public void prePersist() {
        if (this.tenantId == null) {
            UUID current = TenantContext.getTenantId();
            if (current != null) {
                this.tenantId = current;
            } else {
                throw new IllegalStateException("Attempted to persist TenantAwareEntity without an active TenantContext!");
            }
        }
    }
}
