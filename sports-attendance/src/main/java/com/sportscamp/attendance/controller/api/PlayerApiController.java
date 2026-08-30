package com.sportscamp.attendance.controller.api;

import com.sportscamp.attendance.entity.Player;
import com.sportscamp.attendance.entity.Sport;
import com.sportscamp.attendance.entity.User;
import com.sportscamp.attendance.service.PlayerService;
import com.sportscamp.attendance.service.SportService;
import com.sportscamp.attendance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PlayerApiController {

    private final PlayerService playerService;
    private final UserService userService;
    private final SportService sportService;

    private boolean isCaptainOfSport(User user, Long sportId) {
        if (user.getRole() == User.Role.ROLE_ADMIN) return true;
        Sport sport = sportService.findById(sportId);
        return sport.hasCaptain(user);
    }

    private boolean isCaptainOfPlayer(User user, Player player) {
        if (user.getRole() == User.Role.ROLE_ADMIN) return true;
        if (player.getSport() == null) return false;
        return player.getSport().hasCaptain(user);
    }

    /** GET /api/sports/{sportId}/players */
    @GetMapping("/sports/{sportId}/players")
    public ResponseEntity<List<Player>> listBySport(@PathVariable Long sportId, Authentication auth) {
        if (auth != null && auth.isAuthenticated()) {
            User me = userService.findByUsername(auth.getName());
            if (!isCaptainOfSport(me, sportId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }
        return ResponseEntity.ok(playerService.findAllBySport(sportId));
    }

    /** GET /api/players — all players across all sports (admin + captains) */
    @GetMapping("/players")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CAPTAIN')")
    public ResponseEntity<List<Player>> listAll(Authentication auth) {
        if (auth != null && auth.isAuthenticated()) {
            User me = userService.findByUsername(auth.getName());
            if (me.getRole() == User.Role.ROLE_CAPTAIN) {
                // captains can only see players from their own sports
                List<Sport> mySports = sportService.findByCaptainUsername(me.getUsername());
                List<Long> sportIds = mySports.stream().map(Sport::getId).toList();
                if (sportIds.isEmpty()) return ResponseEntity.ok(List.of());
                return ResponseEntity.ok(playerService.findAllBySports(sportIds));
            }
        }
        return ResponseEntity.ok(playerService.findAllPlayers());
    }

    /** GET /api/players/{id} */
    @GetMapping("/players/{id}")
    public ResponseEntity<Player> getById(@PathVariable Long id, Authentication auth) {
        Player player = playerService.findById(id);
        if (auth != null && auth.isAuthenticated()) {
            User me = userService.findByUsername(auth.getName());
            if (!isCaptainOfPlayer(me, player)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }
        return ResponseEntity.ok(player);
    }

    /** POST /api/sports/{sportId}/players */
    @PostMapping("/sports/{sportId}/players")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CAPTAIN')")
    public ResponseEntity<Player> addPlayer(@PathVariable Long sportId,
                                            @RequestBody Player player,
                                            Authentication auth) {
        User me = userService.findByUsername(auth.getName());
        if (!isCaptainOfSport(me, sportId)) {
            throw new AccessDeniedException("You are not authorized to add players to this sport.");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playerService.addPlayer(player, sportId));
    }

    /** PUT /api/players/{id} */
    @PutMapping("/players/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CAPTAIN')")
    public Player update(@PathVariable Long id,
                         @RequestBody Player player,
                         Authentication auth) {
        User me = userService.findByUsername(auth.getName());
        Player existing = playerService.findById(id);
        if (!isCaptainOfPlayer(me, existing)) {
            throw new AccessDeniedException("You are not authorized to modify this player.");
        }
        return playerService.update(id, player);
    }

    /** DELETE /api/players/{id} */
    @DeleteMapping("/players/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_CAPTAIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePlayer(@PathVariable Long id, Authentication auth) {
        User me = userService.findByUsername(auth.getName());
        Player existing = playerService.findById(id);
        if (!isCaptainOfPlayer(me, existing)) {
            throw new AccessDeniedException("You are not authorized to delete this player.");
        }
        playerService.delete(id);
    }

    /**
     * POST /api/sports/{sportId}/players/{playerId}/promote-captain
     * Promotes the given player to captain: creates a User account (ROLE_CAPTAIN) if needed
     * and adds them to the sport's captains list.
     */
    @PostMapping("/sports/{sportId}/players/{playerId}/promote-captain")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> promoteToCaptain(
            @PathVariable Long sportId,
            @PathVariable Long playerId,
            Authentication auth) {
        User me = userService.findByUsername(auth.getName());
        Player player = playerService.findById(playerId);
        if (!isCaptainOfPlayer(me, player)) {
            throw new AccessDeniedException("You are not authorized to manage this player.");
        }
        User captain = playerService.promoteToCaptain(playerId, userService, sportService);
        String tempPassword = playerService.getLastCreatedPassword();
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("captain", captain);
        if (tempPassword != null) {
            result.put("temporaryPassword", tempPassword);
            result.put("passwordNote", "A new captain account was created. Share this temporary password with the captain.");
        } else {
            result.put("passwordNote", "This player already had a captain account — no new password generated.");
        }
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/sports/{sportId}/players/{playerId}/demote
     * Removes the player's associated user from the sport's captains list.
     */
    @PostMapping("/sports/{sportId}/players/{playerId}/demote")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> demote(
            @PathVariable Long sportId,
            @PathVariable Long playerId,
            Authentication auth) {
        User me = userService.findByUsername(auth.getName());
        Player player = playerService.findById(playerId);
        if (!isCaptainOfPlayer(me, player)) {
            throw new AccessDeniedException("You are not authorized to manage this player.");
        }
        playerService.demoteFromCaptain(playerId, sportService);
        return ResponseEntity.noContent().build();
    }
}

