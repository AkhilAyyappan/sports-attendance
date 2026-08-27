package com.sportscamp.attendance.repository;

import com.sportscamp.attendance.entity.Camp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampRepository extends JpaRepository<Camp, Long> {
    List<Camp> findAllByOrderByStartDateDesc();
    List<Camp> findByStatus(Camp.CampStatus status);
}
