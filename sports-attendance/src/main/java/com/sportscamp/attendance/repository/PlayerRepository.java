package com.sportscamp.attendance.repository;

import com.sportscamp.attendance.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {

    List<Player> findByTeamIdAndActiveTrue(Long teamId);

    List<Player> findByTeamId(Long teamId);

    long countByTeamIdAndActiveTrue(Long teamId);
}
