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

    @Query("SELECT s FROM Sport s LEFT JOIN FETCH s.captain ORDER BY s.name ASC")
    List<Sport> findAllWithCaptain();

    @Query("SELECT s FROM Sport s LEFT JOIN FETCH s.captain WHERE s.active = true ORDER BY s.name ASC")
    List<Sport> findByActiveTrue();

    @Query("SELECT s FROM Sport s LEFT JOIN FETCH s.captain WHERE s.captain.id = :captainId ORDER BY s.name ASC")
    List<Sport> findByCaptainId(@Param("captainId") Long captainId);

    @Query("SELECT s FROM Sport s LEFT JOIN FETCH s.captain WHERE s.captain.username = :username ORDER BY s.name ASC")
    List<Sport> findByCaptainUsername(@Param("username") String username);

    @Query("SELECT s FROM Sport s LEFT JOIN FETCH s.captain WHERE s.id = :id")
    Optional<Sport> findByIdWithCaptain(@Param("id") Long id);

    Optional<Sport> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
