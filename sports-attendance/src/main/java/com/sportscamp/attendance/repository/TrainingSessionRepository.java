package com.sportscamp.attendance.repository;

import com.sportscamp.attendance.entity.TrainingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TrainingSessionRepository extends JpaRepository<TrainingSession, Long> {

    List<TrainingSession> findByCampIdOrderBySessionDateAsc(Long campId);

    List<TrainingSession> findByTeamIdOrderBySessionDateAsc(Long teamId);

    @Query("""
            SELECT ts FROM TrainingSession ts
            WHERE ts.camp.id = :campId
              AND (ts.team IS NULL OR ts.team.id = :teamId)
            ORDER BY ts.sessionDate ASC
            """)
    List<TrainingSession> findByCampAndTeamOrCampWide(
            @Param("campId") Long campId,
            @Param("teamId") Long teamId);

    List<TrainingSession> findByCampIdAndSessionDateBetween(
            Long campId, LocalDate from, LocalDate to);
}
