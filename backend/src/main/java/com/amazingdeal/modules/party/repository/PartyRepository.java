package com.amazingdeal.modules.party.repository;

import com.amazingdeal.modules.party.model.Party;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PartyRepository extends JpaRepository<Party, UUID> {

    List<Party> findAllByOrderByPartyNameAsc();

    List<Party> findByPartyTypeOrderByPartyNameAsc(String partyType);

    Optional<Party> findByPhone(String phone);

    Optional<Party> findByGstin(String gstin);

    @Query("SELECT p FROM Party p WHERE " +
           "LOWER(p.partyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(p.companyName, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "p.phone LIKE CONCAT('%', :query, '%') OR " +
           "LOWER(COALESCE(p.gstin, '')) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY p.partyName ASC")
    List<Party> searchParties(@Param("query") String query);
}
