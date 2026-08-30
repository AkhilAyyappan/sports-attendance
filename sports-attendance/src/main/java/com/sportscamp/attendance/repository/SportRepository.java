package com.sportscamp.attendance.repository;

import com.sportscamp.attendance.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SportRepository extends JpaRepository<Sport, Long> {

    @Query("SELECT DISTINCT s FROM Sport s LEFT JOIN FETCH s.captains ORDER BY s.name ASC")
    List<Sport> findAllWithCaptains();

    @Query("SELECT DISTINCT s FROM Sport s LEFT JOIN FETCH s.captains WHERE s.active = true ORDER BY s.name ASC")
    List<Sport> findByActiveTrue();

    @Query("SELECT DISTINCT s FROM Sport s JOIN FETCH s.captains c WHERE c.id = :captainId ORDER BY s.name ASC")
    List<Sport> findByCaptainId(@Param("captainId") Long captainId);

    @Query("SELECT DISTINCT s FROM Sport s JOIN FETCH s.captains c WHERE c.username = :username ORDER BY s.name ASC")
    List<Sport> findByCaptainUsername(@Param("username") String username);

    @Query("SELECT DISTINCT s FROM Sport s LEFT JOIN FETCH s.captains WHERE s.id = :id")
    Optional<Sport> findByIdWithCaptains(@Param("id") Long id);

    Optional<Sport> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
