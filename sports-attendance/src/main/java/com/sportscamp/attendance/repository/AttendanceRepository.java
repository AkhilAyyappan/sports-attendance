package com.sportscamp.attendance.repository;

import com.sportscamp.attendance.entity.Attendance;
import com.sportscamp.attendance.entity.Attendance.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findBySessionId(Long sessionId);

    List<Attendance> findByPlayerId(Long playerId);

    Optional<Attendance> findByPlayerIdAndSessionId(Long playerId, Long sessionId);

    @Query("""
            SELECT a FROM Attendance a
            WHERE a.player.sport.id = :sportId
              AND a.session.id = :sessionId
            """)
    List<Attendance> findBySportIdAndSessionId(
            @Param("sportId") Long sportId,
            @Param("sessionId") Long sessionId);

    @Query("""
            SELECT COUNT(a) FROM Attendance a
            WHERE a.player.id = :playerId
              AND a.status = :status
            """)
    long countByPlayerIdAndStatus(
            @Param("playerId") Long playerId,
            @Param("status") AttendanceStatus status);

    @Query("""
            SELECT COUNT(a) FROM Attendance a
            WHERE a.player.sport.id = :sportId
              AND a.status = 'PRESENT'
            """)
    long countPresentBySport(
            @Param("sportId") Long sportId);
}
