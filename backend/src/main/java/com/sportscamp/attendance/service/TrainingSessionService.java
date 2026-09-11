package com.sportscamp.attendance.service;

import com.sportscamp.attendance.entity.Sport;
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
    private final SportService sportService;

    public List<TrainingSession> findBySport(Long sportId) {
        return sessionRepository.findBySportIdOrderBySessionDateAsc(sportId);
    }

    public List<TrainingSession> findAll() {
        return sessionRepository.findAllWithSport();
    }

    public TrainingSession findById(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TrainingSession", id));
    }

    @Transactional
    public TrainingSession createForSport(TrainingSession session, Long sportId) {
        Sport sport = sportService.findById(sportId);
        session.setSport(sport);
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

    @Transactional
    public void delete(Long id) {
        TrainingSession session = findById(id);
        sessionRepository.delete(session);
    }
}
