package com.sportscamp.attendance.service;

import com.sportscamp.attendance.entity.Camp;
import com.sportscamp.attendance.entity.Sport;
import com.sportscamp.attendance.entity.Team;
import com.sportscamp.attendance.entity.User;
import com.sportscamp.attendance.exception.DuplicateResourceException;
import com.sportscamp.attendance.exception.ResourceNotFoundException;
import com.sportscamp.attendance.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamService {

    private final TeamRepository teamRepository;
    private final CampService campService;
    private final SportService sportService;

    public List<Team> findByCamp(Long campId) {
        return teamRepository.findByCampId(campId);
    }

    public List<Team> findActiveByCamp(Long campId) {
        return teamRepository.findByCampIdAndActiveTrue(campId);
    }

    public Team findById(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team", id));
    }

    public List<Team> findByCaptainId(Long captainId) {
        return teamRepository.findByCaptainId(captainId);
    }

    @Transactional
    public Team createTeam(String name, Long campId, Long sportId) {
        if (teamRepository.existsByNameAndCampId(name, campId)) {
            throw new DuplicateResourceException(
                    "Team '" + name + "' already exists in this camp");
        }
        Camp camp = campService.findById(campId);
        Sport sport = sportService.findById(sportId);
        Team team = Team.builder()
                .name(name)
                .camp(camp)
                .sport(sport)
                .build();
        return teamRepository.save(team);
    }

    @Transactional
    public Team assignCaptain(Long teamId, User captain) {
        Team team = findById(teamId);
        team.setCaptain(captain);
        return teamRepository.save(team);
    }

    @Transactional
    public Team update(Long id, String name, boolean active) {
        Team team = findById(id);
        team.setName(name);
        team.setActive(active);
        return teamRepository.save(team);
    }
}
