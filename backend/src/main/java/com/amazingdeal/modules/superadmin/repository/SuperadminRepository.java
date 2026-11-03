package com.amazingdeal.modules.superadmin.repository;

import com.amazingdeal.modules.superadmin.model.Superadmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SuperadminRepository extends JpaRepository<Superadmin, UUID> {
    Optional<Superadmin> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}

