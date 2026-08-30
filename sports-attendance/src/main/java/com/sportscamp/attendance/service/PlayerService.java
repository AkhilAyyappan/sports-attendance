package com.sportscamp.attendance.service;

import com.sportscamp.attendance.entity.Player;
import com.sportscamp.attendance.entity.Sport;
import com.sportscamp.attendance.entity.User;
import com.sportscamp.attendance.exception.ResourceNotFoundException;
import com.sportscamp.attendance.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final SportService sportService;

    public List<Player> findActiveBySport(Long sportId) {
        return playerRepository.findBySportIdAndActiveTrue(sportId);
    }

    public List<Player> findAllBySport(Long sportId) {
        return playerRepository.findBySportId(sportId);
    }

    public List<Player> findAllBySports(List<Long> sportIds) {
        return playerRepository.findBySportIdIn(sportIds);
    }

    public List<Player> findAllPlayers() {
        return playerRepository.findAll();
    }

    public Player findById(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", id));
    }

    @Transactional
    public Player addPlayer(Player player, Long sportId) {
        Sport sport = sportService.findById(sportId);
        player.setSport(sport);
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

    @Transactional
    public void delete(Long id) {
        Player player = findById(id);
        playerRepository.delete(player);
    }

    /**
     * Promotes a player to captain: creates a User account (ROLE_CAPTAIN) and assigns them
     * to the sport's captains list.
     * Returns the created/found captain user.  Call {@link #getLastCreatedPassword()}
     * immediately after to retrieve the temporary password (only valid for newly created accounts).
     */
    @Transactional
    public User promoteToCaptain(Long playerId, UserService userService, SportService sportService) {
        Player player = findById(playerId);
        Sport sport = player.getSport();
        if (sport == null) {
            throw new ResourceNotFoundException("Sport not found for player " + playerId);
        }

        String username;
        if (player.getEmail() != null && !player.getEmail().isBlank()) {
            username = player.getEmail();
        } else {
            username = "player_" + playerId;
        }

        User captain;
        if (userService.userExistsByEmail(username)) {
            captain = userService.findUserByEmail(username);
            if (captain.getRole() != User.Role.ROLE_CAPTAIN) {
                throw new IllegalStateException(
                        "User with email " + username + " exists but is not a captain.");
            }
            lastCreatedPassword = null; // reusing existing account
        } else {
            String tempPassword = UUID.randomUUID().toString().substring(0, 8);
            captain = userService.createUser(
                    username, tempPassword,
                    player.getFullName(), player.getEmail(), player.getPhone(),
                    User.Role.ROLE_CAPTAIN
            );
            lastCreatedPassword = tempPassword;
        }

        sportService.assignCaptain(sport.getId(), captain);
        return captain;
    }

    /** Returns the temporary password set by the last {@link #promoteToCaptain} call. */
    public String getLastCreatedPassword() {
        return lastCreatedPassword;
    }

    /**
     * Removes the player's associated user from the sport's captains list.
     * The User account itself is NOT deleted.
     */
    @Transactional
    public void demoteFromCaptain(Long playerId, SportService sportService) {
        Player player = findById(playerId);
        Sport sport = player.getSport();
        if (sport == null) {
            throw new ResourceNotFoundException("Sport not found for player " + playerId);
        }
        sportService.removeCaptain(sport.getId(), player.getSportId());
    }

    private String lastCreatedPassword;
}
