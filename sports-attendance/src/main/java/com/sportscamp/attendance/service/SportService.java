package com.sportscamp.attendance.service;

import com.sportscamp.attendance.entity.Sport;
import com.sportscamp.attendance.entity.User;
import com.sportscamp.attendance.exception.DuplicateResourceException;
import com.sportscamp.attendance.exception.ResourceNotFoundException;
import com.sportscamp.attendance.repository.SportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SportService {

    private final SportRepository sportRepository;

    public List<Sport> findAll() {
        return sportRepository.findAllWithCaptain();
    }

    public List<Sport> findAllActive() {
        return sportRepository.findByActiveTrue();
    }

    public Sport findById(Long id) {
        return sportRepository.findByIdWithCaptain(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sport", id));
    }

    public List<Sport> findByCaptainId(Long captainId) {
        return sportRepository.findByCaptainId(captainId);
    }

    public List<Sport> findByCaptainUsername(String username) {
        return sportRepository.findByCaptainUsername(username);
    }

    @Transactional
    public Sport save(Sport sport) {
        if (sportRepository.existsByNameIgnoreCase(sport.getName())) {
            throw new DuplicateResourceException("Sport already exists: " + sport.getName());
        }
        return sportRepository.save(sport);
    }

    @Transactional
    public Sport update(Long id, Sport updated) {
        Sport existing = findById(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setActive(updated.isActive());
        return sportRepository.save(existing);
    }

    @Transactional
    public Sport assignCaptain(Long sportId, User captain) {
        Sport sport = findById(sportId);
        sport.setCaptain(captain);
        return sportRepository.save(sport);
    }

    @Transactional
    public void delete(Long id) {
        Sport sport = findById(id);
        sportRepository.delete(sport);
    }
}
