package com.sportscamp.attendance.repository;

import com.sportscamp.attendance.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    List<Team> findByCampId(Long campId);

    List<Team> findByCampIdAndActiveTrue(Long campId);

    @Query("SELECT t FROM Team t WHERE t.captain.id = :captainId")
    List<Team> findByCaptainId(@Param("captainId") Long captainId);

    boolean existsByNameAndCampId(String name, Long campId);
}
