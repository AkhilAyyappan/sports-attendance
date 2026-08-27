package com.sportscamp.attendance.service;

import com.sportscamp.attendance.entity.Camp;
import com.sportscamp.attendance.exception.ResourceNotFoundException;
import com.sportscamp.attendance.repository.CampRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CampService {

    private final CampRepository campRepository;

    public List<Camp> findAll() {
        return campRepository.findAllByOrderByStartDateDesc();
    }

    public Camp findById(Long id) {
        return campRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Camp", id));
    }

    public List<Camp> findByStatus(Camp.CampStatus status) {
        return campRepository.findByStatus(status);
    }

    @Transactional
    public Camp save(Camp camp) {
        return campRepository.save(camp);
    }

    @Transactional
    public Camp update(Long id, Camp updated) {
        Camp existing = findById(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setStartDate(updated.getStartDate());
        existing.setEndDate(updated.getEndDate());
        existing.setLocation(updated.getLocation());
        existing.setStatus(updated.getStatus());
        return campRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Camp camp = findById(id);
        campRepository.delete(camp);
    }
}
