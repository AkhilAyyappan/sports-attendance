package com.sportscamp.attendance.controller.api;

import com.sportscamp.attendance.entity.Player;
import com.sportscamp.attendance.entity.Sport;
import com.sportscamp.attendance.entity.User;
import com.sportscamp.attendance.service.AttendanceService;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PlayerApiController {

    private final PlayerService playerService;
    private final UserService userService;
    private final SportService sportService;
    private final AttendanceService attendanceService;

    private boolean isCaptainOfSport(User user, Long sportId) {
        if (user.getRole() == User.Role.ROLE_ADMIN) return true;
        Sport sport = sportService.findById(sportId);
        return sport.getCaptain() != null && sport.getCaptain().getId().equals(user.getId());
    }

    private boolean isCaptainOfPlayer(User user, Player player) {
        if (user.getRole() == User.Role.ROLE_ADMIN) return true;
        if (player.getSport() == null || player.getSport().getCaptain() == null) return false;
        return player.getSport().getCaptain().getId().equals(user.getId());
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

        List<Player> players = playerService.findAllBySport(sportId);
        players.forEach(player -> {
            player.setAttendanceStatus(attendanceService.getLatestStatusForPlayer(player.getId()));
            Map<String, Long> counts = attendanceService.getCountsByPlayer(player.getId());
            player.setPresentCount(counts.getOrDefault("present", 0L));
            player.setAbsentCount(counts.getOrDefault("absent", 0L));
            player.setLateCount(counts.getOrDefault("late", 0L));
            player.setExcusedCount(counts.getOrDefault("excused", 0L));
        });

        return ResponseEntity.ok(players);
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
}

