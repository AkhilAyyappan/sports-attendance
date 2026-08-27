package com.sportscamp.attendance.service;

import com.sportscamp.attendance.entity.Camp;
import com.sportscamp.attendance.entity.Team;
import com.sportscamp.attendance.entity.TrainingSession;
import com.sportscamp.attendance.exception.ResourceNotFoundException;
import com.sportscamp.attendance.repository.TrainingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TrainingSessionService {

    private final TrainingSessionRepository sessionRepository;
    private final CampService campService;
    private final TeamService teamService;

    public List<TrainingSession> findByCamp(Long campId) {
        return sessionRepository.findByCampIdOrderBySessionDateAsc(campId);
    }

    public List<TrainingSession> findForTeam(Long campId, Long teamId) {
        return sessionRepository.findByCampAndTeamOrCampWide(campId, teamId);
    }

    public TrainingSession findById(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TrainingSession", id));
    }

    @Transactional
    public TrainingSession createForCamp(TrainingSession session, Long campId) {
        Camp camp = campService.findById(campId);
        session.setCamp(camp);
        session.setTeam(null);
        return sessionRepository.save(session);
    }

    @Transactional
    public TrainingSession createForTeam(TrainingSession session, Long campId, Long teamId) {
        Camp camp = campService.findById(campId);
        Team team = teamService.findById(teamId);
        session.setCamp(camp);
        session.setTeam(team);
        return sessionRepository.save(session);
    }

    @Transactional
    public TrainingSession update(Long id, TrainingSession updated) {
        TrainingSession existing = findById(id);
        existing.setTitle(updated.getTitle());
        existing.setSessionDate(updated.getSessionDate());
        existing.setStartTime(updated.getStartTime());
        existing.setEndTime(updated.getEndTime());
        existing.setNotes(updated.getNotes());
        existing.setStatus(updated.getStatus());
        return sessionRepository.save(existing);
    }

    @Transactional
    public void updateStatus(Long id, TrainingSession.SessionStatus status) {
        TrainingSession session = findById(id);
        session.setStatus(status);
        sessionRepository.save(session);
    }
}
