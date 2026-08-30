package com.sportscamp.attendance.repository;

import com.sportscamp.attendance.entity.PlayerEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerEvaluationRepository extends JpaRepository<PlayerEvaluation, Long> {

    List<PlayerEvaluation> findByPlayer_Id(Long playerId);

    Optional<PlayerEvaluation> findByPlayer_IdAndSession_Id(Long playerId, Long sessionId);
}
