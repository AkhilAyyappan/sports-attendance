package com.sportscamp.attendance.service;

import com.sportscamp.attendance.entity.Attendance;
import com.sportscamp.attendance.entity.Attendance.AttendanceStatus;
import com.sportscamp.attendance.entity.Player;
import com.sportscamp.attendance.entity.TrainingSession;
import com.sportscamp.attendance.entity.User;
import com.sportscamp.attendance.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final PlayerService playerService;
    private final TrainingSessionService sessionService;

    public List<Attendance> findBySession(Long sessionId) {
        return attendanceRepository.findBySessionId(sessionId);
    }

    public List<Attendance> findByPlayer(Long playerId) {
        return attendanceRepository.findByPlayerId(playerId);
    }

    public List<Attendance> findByTeamAndSession(Long teamId, Long sessionId) {
        return attendanceRepository.findByTeamIdAndSessionId(teamId, sessionId);
    }

    /**
     * Bulk-save attendance for an entire session.
     * playerStatusMap: playerId → AttendanceStatus
     * Creates new records or updates existing ones (upsert behaviour).
     */
    @Transactional
    public void saveAttendance(Long sessionId, Map<Long, AttendanceStatus> playerStatusMap, User markedBy) {
        TrainingSession session = sessionService.findById(sessionId);

        for (Map.Entry<Long, AttendanceStatus> entry : playerStatusMap.entrySet()) {
            Player player = playerService.findById(entry.getKey());
            Attendance attendance = attendanceRepository
                    .findByPlayerIdAndSessionId(player.getId(), session.getId())
                    .orElseGet(() -> Attendance.builder()
                            .player(player)
                            .session(session)
                            .build());
            attendance.setStatus(entry.getValue());
            attendance.setMarkedBy(markedBy);
            attendance.setMarkedAt(LocalDateTime.now());
            attendanceRepository.save(attendance);
        }
    }

    @Transactional
    public Attendance updateOne(Long attendanceId, AttendanceStatus status, String remarks, User markedBy) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new com.sportscamp.attendance.exception.ResourceNotFoundException(
                        "Attendance", attendanceId));
        attendance.setStatus(status);
        attendance.setRemarks(remarks);
        attendance.setMarkedBy(markedBy);
        attendance.setMarkedAt(LocalDateTime.now());
        return attendanceRepository.save(attendance);
    }

    public long countPresent(Long playerId) {
        return attendanceRepository.countByPlayerIdAndStatus(playerId, AttendanceStatus.PRESENT);
    }
}
