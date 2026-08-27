package com.sportscamp.attendance.service;

import com.sportscamp.attendance.entity.Player;
import com.sportscamp.attendance.entity.Team;
import com.sportscamp.attendance.exception.ResourceNotFoundException;
import com.sportscamp.attendance.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final TeamService teamService;

    public List<Player> findActiveByTeam(Long teamId) {
        return playerRepository.findByTeamIdAndActiveTrue(teamId);
    }

    public List<Player> findAllByTeam(Long teamId) {
        return playerRepository.findByTeamId(teamId);
    }

    public Player findById(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", id));
    }

    @Transactional
    public Player addPlayer(Player player, Long teamId) {
        Team team = teamService.findById(teamId);
        player.setTeam(team);
        return playerRepository.save(player);
    }

    @Transactional
    public Player update(Long id, Player updated) {
        Player existing = findById(id);
        existing.setFullName(updated.getFullName());
        existing.setDateOfBirth(updated.getDateOfBirth());
        existing.setJerseyNumber(updated.getJerseyNumber());
        existing.setPosition(updated.getPosition());
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());
        existing.setNotes(updated.getNotes());
        return playerRepository.save(existing);
    }

    @Transactional
    public void deactivate(Long id) {
        Player player = findById(id);
        player.setActive(false);
        playerRepository.save(player);
    }
}
