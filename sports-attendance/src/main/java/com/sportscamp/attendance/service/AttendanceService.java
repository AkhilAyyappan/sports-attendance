package com.sportscamp.attendance.service;

import com.sportscamp.attendance.entity.Attendance;
import com.sportscamp.attendance.entity.Attendance.AttendanceStatus;
import com.sportscamp.attendance.entity.Player;
import com.sportscamp.attendance.entity.TrainingSession;
import com.sportscamp.attendance.entity.User;
import com.sportscamp.attendance.exception.ResourceNotFoundException;
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
        return attendanceRepository.findBySession_Id(sessionId);
    }

    public List<Attendance> findByPlayer(Long playerId) {
        return attendanceRepository.findByPlayer_Id(playerId);
    }

    public AttendanceStatus getLatestStatusForPlayer(Long playerId) {
        return attendanceRepository.findTopByPlayer_IdOrderBySession_SessionDateDescMarkedAtDesc(playerId)
                .map(Attendance::getStatus)
                .orElse(AttendanceStatus.ABSENT);
    }

    public Map<String, Long> getCountsByPlayer(Long playerId) {
        Map<String, Long> result = new java.util.HashMap<>();
        result.put("present", countPresent(playerId));
        result.put("absent", countAbsent(playerId));
        result.put("late", countLate(playerId));
        result.put("excused", countExcused(playerId));
        return result;
    }

    public List<Attendance> findBySportAndSession(Long sportId, Long sessionId) {
        return attendanceRepository.findBySportIdAndSessionId(sportId, sessionId);
    }

    @Transactional
    public void saveAttendance(Long sessionId, Map<Long, AttendanceStatus> playerStatusMap, User markedBy) {
        TrainingSession session = sessionService.findById(sessionId);

        for (Map.Entry<Long, AttendanceStatus> entry : playerStatusMap.entrySet()) {
            Player player = playerService.findById(entry.getKey());
            Attendance attendance = attendanceRepository
                    .findByPlayer_IdAndSession_Id(player.getId(), session.getId())
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
                .orElseThrow(() -> new ResourceNotFoundException("Attendance", attendanceId));
        attendance.setStatus(status);
        attendance.setRemarks(remarks);
        attendance.setMarkedBy(markedBy);
        attendance.setMarkedAt(LocalDateTime.now());
        return attendanceRepository.save(attendance);
    }

    public long countByPlayerIdAndStatus(Long playerId, AttendanceStatus status) {
        return attendanceRepository.countByPlayerIdAndStatus(playerId, status);
    }

    public long countPresent(Long playerId) {
        return countByPlayerIdAndStatus(playerId, AttendanceStatus.PRESENT);
    }

    public long countAbsent(Long playerId) {
        return countByPlayerIdAndStatus(playerId, AttendanceStatus.ABSENT);
    }

    public long countLate(Long playerId) {
        return countByPlayerIdAndStatus(playerId, AttendanceStatus.LATE);
    }

    public long countExcused(Long playerId) {
        return countByPlayerIdAndStatus(playerId, AttendanceStatus.EXCUSED);
    }

    public long countTotalSessionsByPlayer(Long playerId) {
        return attendanceRepository.countByPlayerId(playerId);
    }
}
