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
     * Promotes a player to captain: creates a User account (ROLE_CAPTAIN) using the
     * admin-provided username and password and assigns them to the sport's captains list.
     * An existing captain account is reused when the typed username (or the player's
     * email, for previously auto-created accounts) already maps to a ROLE_CAPTAIN user;
     * in that case the provided password is left untouched.
     */
    @Transactional
    public User promoteToCaptain(Long playerId, String username, String rawPassword,
                                 UserService userService, SportService sportService) {
        Player player = findById(playerId);
        Sport sport = player.getSport();
        if (sport == null) {
            throw new ResourceNotFoundException("Sport not found for player " + playerId);
        }

        String resolvedUsername = (username != null && !username.isBlank()) ? username.trim() : null;

        // 1) Reuse an existing captain account with the chosen username
        if (resolvedUsername != null && userService.userExistsByUsername(resolvedUsername)) {
            User existing = userService.findByUsername(resolvedUsername);
            if (existing.getRole() != User.Role.ROLE_CAPTAIN) {
                throw new IllegalStateException(
                        "Username \"" + resolvedUsername + "\" is taken by a non-captain user.");
            }
            sportService.assignCaptain(sport.getId(), existing);
            return existing;
        }

        // 2) Reuse a captain account previously created from this player's email
        if (player.getEmail() != null && !player.getEmail().isBlank()
                && userService.userExistsByEmail(player.getEmail())) {
            User existing = userService.findUserByEmail(player.getEmail());
            if (existing.getRole() != User.Role.ROLE_CAPTAIN) {
                throw new IllegalStateException(
                        "User with email " + player.getEmail() + " exists but is not a captain.");
            }
            sportService.assignCaptain(sport.getId(), existing);
            return existing;
        }

        // 3) Create a brand-new captain account with the admin-provided credentials
        if (resolvedUsername == null) {
            throw new IllegalArgumentException("A username is required to create the new captain account.");
        }
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("A password is required to create the new captain account.");
        }
        User captain = userService.createUser(
                resolvedUsername, rawPassword,
                player.getFullName(), player.getEmail(), player.getPhone(),
                User.Role.ROLE_CAPTAIN
        );
        sportService.assignCaptain(sport.getId(), captain);
        return captain;
    }

    /**
     * Removes the player's associated user from the sport's captains list.
     * The User account itself is NOT deleted.
     */
    @Transactional
    public void demoteFromCaptain(Long playerId, SportService sportService, UserService userService) {
        Player player = findById(playerId);
        Sport sport = player.getSport();
        if (sport == null) {
            throw new ResourceNotFoundException("Sport not found for player " + playerId);
        }

        // The captain User is linked to the Player via email.
        if (player.getEmail() == null || player.getEmail().isBlank()) {
            throw new IllegalStateException("Player " + playerId + " has no email; cannot resolve captain account.");
        }
        User captain = userService.findUserByEmail(player.getEmail());
        sportService.removeCaptain(sport.getId(), captain.getId());
    }
}
