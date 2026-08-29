package com.sportscamp.attendance.repository;

import com.sportscamp.attendance.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {

    @Query("SELECT p FROM Player p WHERE p.sport.id = :sportId AND p.active = true")
    List<Player> findBySportIdAndActiveTrue(@Param("sportId") Long sportId);

    @Query("SELECT p FROM Player p WHERE p.sport.id = :sportId")
    List<Player> findBySportId(@Param("sportId") Long sportId);

    @Query("SELECT COUNT(p) FROM Player p WHERE p.sport.id = :sportId AND p.active = true")
    long countBySportIdAndActiveTrue(@Param("sportId") Long sportId);
}