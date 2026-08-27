package com.sportscamp.attendance.service;

import com.sportscamp.attendance.entity.Sport;
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
        return sportRepository.findAll();
    }

    public List<Sport> findAllActive() {
        return sportRepository.findByActiveTrue();
    }

    public Sport findById(Long id) {
        return sportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sport", id));
    }

    @Transactional
    public Sport save(Sport sport) {
        sportRepository.findByNameIgnoreCase(sport.getName()).ifPresent(s -> {
            throw new DuplicateResourceException("Sport already exists: " + sport.getName());
        });
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
}
